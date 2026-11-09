const mongoose = require('mongoose');
const { Case, Hearing, Task, Client, User } = require('../models');
const { sendSuccess, sendError } = require('../utils/response');
const { generateCSV, sendCSVResponse } = require('../utils/csvExport');

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

/**
 * Helper to resolve case IDs accessible to the current user based on RBAC
 */
const getAccessibleCaseIds = async (user) => {
  if (user.role === 'ADMIN' || user.role === 'CLERK') {
    return null; // Null means unrestricted access to all cases
  }
  if (user.role === 'LAWYER') {
    const cases = await Case.find({ assignedLawyer: user.id }).select('_id');
    return cases.map((c) => c._id);
  }
  if (user.role === 'CLIENT') {
    const clientProfile = await Client.findOne({ userAccount: user.id });
    if (!clientProfile) return [];
    const cases = await Case.find({ client: clientProfile._id }).select('_id');
    return cases.map((c) => c._id);
  }
  return [];
};

/**
 * @desc    Report 1: Case Status Report
 * @route   GET /api/reports/case-status
 * @access  Protected
 */
const getCaseStatusReport = async (req, res) => {
  try {
    const {
      status,
      priority,
      caseType,
      assignedLawyer,
      court,
      startDate,
      endDate,
      search,
    } = req.query;

    const query = {};

    // 1. Role-Based Scoping
    const accessibleCaseIds = await getAccessibleCaseIds(req.user);
    if (accessibleCaseIds !== null) {
      query._id = { $in: accessibleCaseIds };
    }

    // 2. Query Filters
    if (status && status !== 'ALL') {
      query.status = status.toUpperCase();
    }

    if (priority && priority !== 'ALL') {
      query.priority = priority.toUpperCase();
    }

    if (caseType && caseType !== 'ALL') {
      query.caseType = new RegExp(caseType.trim(), 'i');
    }

    if (assignedLawyer && isValidId(assignedLawyer)) {
      query.assignedLawyer = assignedLawyer;
    }

    if (court && court !== 'ALL') {
      query.courtName = new RegExp(court.trim(), 'i');
    }

    if (startDate || endDate) {
      query.filingDate = {};
      if (startDate) query.filingDate.$gte = new Date(startDate);
      if (endDate) query.filingDate.$lte = new Date(endDate);
    }

    if (search) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [{ caseReference: searchRegex }, { title: searchRegex }];
    }

    // 3. Fetch Cases with populated relations
    const cases = await Case.find(query)
      .populate('client', 'name email phone organization')
      .populate('assignedLawyer', 'name email designation phone')
      .sort({ filingDate: -1 });

    const caseIds = cases.map((c) => c._id);

    // 4. Batch query hearings for last and next hearing lookup
    const allHearings = await Hearing.find({
      case: { $in: caseIds },
      status: { $ne: 'CANCELLED' },
    }).sort({ startDateTime: 1, hearingDate: 1 });

    const now = new Date();

    // Map hearings to cases
    const hearingsByCase = {};
    for (const h of allHearings) {
      const cid = h.case.toString();
      if (!hearingsByCase[cid]) hearingsByCase[cid] = [];
      hearingsByCase[cid].push(h);
    }

    // 5. Build Case Rows & Calculate Summary Statistics
    let activeCases = 0;
    let pendingCases = 0;
    let closedCases = 0;
    let highPriorityCases = 0;
    const statusBreakdown = {
      FILED: 0,
      UNDER_REVIEW: 0,
      HEARING_IN_PROGRESS: 0,
      JUDGMENT_RESERVED: 0,
      CLOSED: 0,
      APPEALED: 0,
    };

    const reportRows = cases.map((c) => {
      const caseHearings = hearingsByCase[c._id.toString()] || [];

      // Find past hearings (last hearing)
      const pastHearings = caseHearings
        .filter((h) => new Date(h.hearingDate) < now || h.status === 'COMPLETED' || h.status === 'ADJOURNED')
        .sort((a, b) => new Date(b.hearingDate) - new Date(a.hearingDate));
      const lastHearing = pastHearings[0] || null;

      // Find future scheduled hearings (next hearing)
      const futureHearings = caseHearings
        .filter((h) => new Date(h.hearingDate) >= now && h.status === 'SCHEDULED')
        .sort((a, b) => new Date(a.hearingDate) - new Date(b.hearingDate));
      const nextHearing = futureHearings[0] || null;

      // Stats accumulation: strictly mutually exclusive partitioning so active + pending + closed = total
      if (['HEARING_IN_PROGRESS', 'APPEALED'].includes(c.status)) {
        activeCases++;
      } else if (['FILED', 'UNDER_REVIEW'].includes(c.status)) {
        pendingCases++;
      } else if (['CLOSED', 'JUDGMENT_RESERVED'].includes(c.status)) {
        closedCases++;
      }

      if (['HIGH', 'URGENT'].includes(c.priority)) {
        highPriorityCases++;
      }
      if (statusBreakdown[c.status] !== undefined) {
        statusBreakdown[c.status]++;
      }

      return {
        _id: c._id,
        caseReference: c.caseReference,
        title: c.title,
        clientName: c.client?.name || 'Unassigned Litigant',
        clientOrganization: c.client?.organization || '',
        assignedLawyerName: c.assignedLawyer?.name || 'Unassigned Counsel',
        assignedLawyerEmail: c.assignedLawyer?.email || '',
        courtName: c.courtName,
        courtroom: c.courtroom || 'N/A',
        caseType: c.caseType,
        filingDate: c.filingDate ? c.filingDate.toISOString().split('T')[0] : 'N/A',
        status: c.status,
        stage: c.stage,
        priority: c.priority,
        progress: c.progress,
        lastHearingDate: lastHearing ? lastHearing.hearingDate.toISOString().split('T')[0] : 'None recorded',
        lastHearingStatus: lastHearing ? lastHearing.status : null,
        nextHearingDate: nextHearing ? nextHearing.hearingDate.toISOString().split('T')[0] : 'Not Scheduled',
        nextHearingTime: nextHearing ? nextHearing.hearingTime : null,
        nextHearingCourtroom: nextHearing ? nextHearing.courtroom : null,
        nextHearingJudge: nextHearing ? nextHearing.judgeName : null,
      };
    });

    const summary = {
      totalCases: cases.length,
      activeCases,
      pendingCases,
      closedCases,
      highPriorityCases,
      statusBreakdown,
    };

    // Check for CSV export request
    if (req.query.export === 'csv' || req.query.format === 'csv') {
      const headers = [
        'Case Reference',
        'Case Title',
        'Client Name',
        'Assigned Lawyer',
        'Court Name',
        'Courtroom',
        'Case Type',
        'Filing Date',
        'Status',
        'Stage',
        'Priority',
        'Progress %',
        'Last Hearing Date',
        'Next Hearing Date',
      ];
      const rows = reportRows.map((c) => [
        c.caseReference,
        c.title,
        c.clientName,
        c.assignedLawyerName,
        c.courtName,
        c.courtroom,
        c.caseType,
        c.filingDate,
        c.status,
        c.stage,
        c.priority,
        `${c.progress}%`,
        c.lastHearingDate,
        c.nextHearingDate,
      ]);
      const today = new Date().toISOString().split('T')[0];
      const filename = `JurisFlow_Case_Status_Report_${today}.csv`;
      const csvString = generateCSV(headers, rows);
      return sendCSVResponse(res, filename, csvString);
    }

    return sendSuccess(
      res,
      { reportName: 'Case Status Report', summary, cases: reportRows },
      'Case status report generated successfully',
      200
    );
  } catch (error) {
    console.error('Error generating case status report:', error);
    return sendError(res, error.message || 'Error generating case status report', 500);
  }
};

/**
 * @desc    Report 2: Hearing Calendar Report
 * @route   GET /api/reports/hearing-calendar
 * @access  Protected
 */
const getHearingCalendarReport = async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      court,
      lawyer,
      status,
      caseReference,
    } = req.query;

    const query = {};

    // 1. Role-Based Scoping
    const accessibleCaseIds = await getAccessibleCaseIds(req.user);
    if (accessibleCaseIds !== null) {
      query.case = { $in: accessibleCaseIds };
    }

    // 2. Query Filters
    if (status && status !== 'ALL') {
      query.status = status.toUpperCase();
    }

    if (court && court !== 'ALL') {
      query.courtName = new RegExp(court.trim(), 'i');
    }

    if (caseReference) {
      query.caseReference = new RegExp(caseReference.trim(), 'i');
    }

    if (startDate || endDate) {
      query.hearingDate = {};
      if (startDate) query.hearingDate.$gte = new Date(startDate);
      if (endDate) query.hearingDate.$lte = new Date(endDate);
    }

    // 3. Fetch Hearings
    let hearings = await Hearing.find(query)
      .populate({
        path: 'case',
        select: 'caseReference title client assignedLawyer',
        populate: [
          { path: 'client', select: 'name organization' },
          { path: 'assignedLawyer', select: 'name email' },
        ],
      })
      .sort({ hearingDate: 1, startDateTime: 1 });

    // Filter by assigned lawyer if specified
    if (lawyer && isValidId(lawyer)) {
      hearings = hearings.filter((h) => h.case?.assignedLawyer?._id?.toString() === lawyer);
    }

    // 4. Calculate Summary Statistics
    let scheduledCount = 0;
    let completedCount = 0;
    let adjournedCount = 0;
    let cancelledCount = 0;
    const courtSet = new Set();

    const reportRows = hearings.map((h) => {
      if (h.status === 'SCHEDULED') scheduledCount++;
      else if (h.status === 'COMPLETED') completedCount++;
      else if (h.status === 'ADJOURNED') adjournedCount++;
      else if (h.status === 'CANCELLED') cancelledCount++;

      if (h.courtName) courtSet.add(h.courtName);

      return {
        _id: h._id,
        hearingDate: h.hearingDate ? h.hearingDate.toISOString().split('T')[0] : 'N/A',
        hearingTime: h.hearingTime,
        durationMinutes: h.durationMinutes || 60,
        caseReference: h.caseReference || h.case?.caseReference || 'N/A',
        caseTitle: h.case?.title || 'Unknown Case',
        clientName: h.case?.client?.name || 'Litigant',
        clientOrganization: h.case?.client?.organization || '',
        assignedLawyerName: h.case?.assignedLawyer?.name || 'Unassigned',
        courtName: h.courtName,
        courtroom: h.courtroom,
        judgeName: h.judgeName,
        purpose: h.purpose,
        status: h.status,
        notes: h.notes || '',
        nextHearingDate: h.nextHearingDate ? h.nextHearingDate.toISOString().split('T')[0] : 'TBD',
      };
    });

    const summary = {
      totalHearings: reportRows.length,
      scheduledHearings: scheduledCount,
      completedHearings: completedCount,
      adjournedHearings: adjournedCount,
      cancelledHearings: cancelledCount,
      courtComplexCount: courtSet.size,
    };

    // Check for CSV export request
    if (req.query.export === 'csv' || req.query.format === 'csv') {
      const headers = [
        'Hearing Date',
        'Time',
        'Duration (Mins)',
        'Case Reference',
        'Case Title',
        'Client Name',
        'Assigned Lawyer',
        'Court Name',
        'Courtroom',
        'Judge Name',
        'Purpose',
        'Status',
        'Next Hearing Date',
      ];
      const rows = reportRows.map((h) => [
        h.hearingDate,
        h.hearingTime,
        h.durationMinutes,
        h.caseReference,
        h.caseTitle,
        h.clientName,
        h.assignedLawyerName,
        h.courtName,
        h.courtroom,
        h.judgeName,
        h.purpose,
        h.status,
        h.nextHearingDate,
      ]);
      const today = new Date().toISOString().split('T')[0];
      const filename = `JurisFlow_Hearing_Calendar_Report_${today}.csv`;
      const csvString = generateCSV(headers, rows);
      return sendCSVResponse(res, filename, csvString);
    }

    return sendSuccess(
      res,
      { reportName: 'Hearing Calendar Report', summary, hearings: reportRows },
      'Hearing calendar report generated successfully',
      200
    );
  } catch (error) {
    console.error('Error generating hearing calendar report:', error);
    return sendError(res, error.message || 'Error generating hearing calendar report', 500);
  }
};

/**
 * @desc    Report 3: Pending Tasks Report
 * @route   GET /api/reports/pending-tasks
 * @access  Protected
 */
const getPendingTasksReport = async (req, res) => {
  try {
    const {
      assignee,
      caseId,
      priority,
      startDate,
      endDate,
      status,
      overdueOnly,
    } = req.query;

    const query = { isDeleted: false };
    const now = new Date();

    // 1. Role-Based Scoping
    if (req.user.role === 'CLIENT') {
      const clientProfile = await Client.findOne({ userAccount: req.user.id });
      if (!clientProfile) {
        return sendSuccess(res, { reportName: 'Pending Tasks Report', summary: { totalOutstanding: 0 }, tasks: [] });
      }
      const clientCases = await Case.find({ client: clientProfile._id }).select('_id');
      query.case = { $in: clientCases.map((c) => c._id) };
      query.isClientVisible = true; // Litigant clients only see designated client-facing tasks
    } else if (req.user.role === 'LAWYER') {
      const lawyerCases = await Case.find({ assignedLawyer: req.user.id }).select('_id');
      query.$or = [{ assignedUser: req.user.id }, { case: { $in: lawyerCases.map((c) => c._id) } }];
    }
    // ADMIN and CLERK see all tasks

    // 2. Query Filters
    if (status && status !== 'ALL') {
      if (status === 'OVERDUE') {
        query.status = { $ne: 'COMPLETED' };
        query.deadline = { $lt: now };
      } else {
        query.status = status.toUpperCase();
      }
    } else if (overdueOnly === 'true') {
      query.status = { $ne: 'COMPLETED' };
      query.deadline = { $lt: now };
    } else {
      // By default, exclude completed tasks unless explicitly requested
      query.status = { $ne: 'COMPLETED' };
    }

    if (priority && priority !== 'ALL') {
      query.priority = priority.toUpperCase();
    }

    if (caseId && isValidId(caseId)) {
      query.case = caseId;
    }

    if (assignee && isValidId(assignee)) {
      query.assignedUser = assignee;
    }

    if (startDate || endDate) {
      query.deadline = {};
      if (startDate) query.deadline.$gte = new Date(startDate);
      if (endDate) query.deadline.$lte = new Date(endDate);
    }

    // 3. Fetch Tasks
    const tasks = await Task.find(query)
      .populate('case', 'caseReference title courtName')
      .populate('assignedUser', 'name email role')
      .populate('createdBy', 'name email role')
      .sort({ deadline: 1, priority: -1 });

    // 4. Calculate Days Remaining & Overdue State
    let pendingCount = 0;
    let inProgressCount = 0;
    let overdueCount = 0;
    let urgentCount = 0;

    const reportRows = tasks.map((t) => {
      const deadlineDate = new Date(t.deadline);
      const diffMs = deadlineDate.getTime() - now.getTime();
      const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      const isPastDeadline = diffMs < 0;

      let effectiveStatus = t.status;
      if (t.status !== 'COMPLETED' && isPastDeadline) {
        effectiveStatus = 'OVERDUE';
      }

      if (effectiveStatus === 'PENDING') pendingCount++;
      else if (effectiveStatus === 'IN_PROGRESS') inProgressCount++;
      else if (effectiveStatus === 'OVERDUE') overdueCount++;

      if (t.priority === 'URGENT') urgentCount++;

      const isStaff = ['ADMIN', 'LAWYER', 'CLERK'].includes(req.user.role);

      return {
        _id: t._id,
        title: t.title,
        description: t.description || '',
        caseReference: t.case?.caseReference || 'General Office Task',
        caseTitle: t.case?.title || 'Administrative',
        assignedUserName: t.assignedUser?.name || 'Unassigned',
        assignedUserRole: t.assignedUser?.role || 'STAFF',
        createdByName: t.createdBy?.name || 'System',
        priority: t.priority,
        deadline: t.deadline ? t.deadline.toISOString().split('T')[0] : 'N/A',
        status: effectiveStatus,
        daysRemaining,
        isOverdue: isPastDeadline && effectiveStatus !== 'COMPLETED',
        // Client visibility strictly exposed only to staff
        isClientVisible: isStaff ? Boolean(t.isClientVisible) : undefined,
      };
    });

    const summary = {
      totalOutstanding: reportRows.length,
      pending: pendingCount,
      inProgress: inProgressCount,
      overdue: overdueCount,
      urgent: urgentCount,
    };

    // Check for CSV export request
    if (req.query.export === 'csv' || req.query.format === 'csv') {
      const headers = [
        'Task Title',
        'Case Reference',
        'Case Title',
        'Assigned User',
        'Created By',
        'Priority',
        'Deadline',
        'Status',
        'Days Remaining',
        'Is Overdue',
      ];
      const rows = reportRows.map((t) => [
        t.title,
        t.caseReference,
        t.caseTitle,
        t.assignedUserName,
        t.createdByName,
        t.priority,
        t.deadline,
        t.status,
        t.daysRemaining,
        t.isOverdue ? 'YES' : 'NO',
      ]);
      const today = new Date().toISOString().split('T')[0];
      const filename = `JurisFlow_Pending_Tasks_Report_${today}.csv`;
      const csvString = generateCSV(headers, rows);
      return sendCSVResponse(res, filename, csvString);
    }

    return sendSuccess(
      res,
      { reportName: 'Pending Tasks Report', summary, tasks: reportRows },
      'Pending tasks report generated successfully',
      200
    );
  } catch (error) {
    console.error('Error generating pending tasks report:', error);
    return sendError(res, error.message || 'Error generating pending tasks report', 500);
  }
};

/**
 * @desc    Report 4: Client Case Summary Report
 * @route   GET /api/reports/client-summary
 * @access  Protected
 */
const getClientSummaryReport = async (req, res) => {
  try {
    const { search, assignedLawyer, status } = req.query;

    const clientQuery = {};

    // 1. Role-Based Scoping
    if (req.user.role === 'CLIENT') {
      clientQuery.userAccount = req.user.id;
    } else if (req.user.role === 'LAWYER') {
      // Find all cases assigned to this lawyer to identify their clients
      const lawyerCases = await Case.find({ assignedLawyer: req.user.id }).select('client');
      const clientIds = lawyerCases.map((c) => c.client);
      clientQuery.$or = [{ assignedLawyer: req.user.id }, { _id: { $in: clientIds } }];
    }
    // ADMIN and CLERK see all clients

    // 2. Query Filters
    if (status && status !== 'ALL') {
      clientQuery.status = status.toUpperCase();
    }

    if (assignedLawyer && isValidId(assignedLawyer)) {
      clientQuery.assignedLawyer = assignedLawyer;
    }

    if (search) {
      const searchRegex = new RegExp(search.trim(), 'i');
      clientQuery.$or = [
        { name: searchRegex },
        { email: searchRegex },
        { organization: searchRegex },
        { phone: searchRegex },
      ];
    }

    // 3. Fetch Clients
    const clients = await Client.find(clientQuery)
      .populate('assignedLawyer', 'name email designation phone')
      .sort({ name: 1 });

    const clientIds = clients.map((c) => c._id);

    // 4. Batch query cases for these clients
    const cases = await Case.find({ client: { $in: clientIds } })
      .populate('assignedLawyer', 'name email')
      .sort({ filingDate: -1 });

    const casesByClient = {};
    for (const c of cases) {
      const cid = c.client.toString();
      if (!casesByClient[cid]) casesByClient[cid] = [];
      casesByClient[cid].push(c);
    }

    // 5. Build Client Report Rows & Aggregate Metrics
    let totalClientCases = 0;
    let activeClientsCount = 0;
    let corporateCount = 0;

    const reportRows = clients.map((cl) => {
      const clientCases = casesByClient[cl._id.toString()] || [];
      const totalCases = clientCases.length;
      const activeCases = clientCases.filter((c) =>
        ['FILED', 'UNDER_REVIEW', 'HEARING_IN_PROGRESS'].includes(c.status)
      ).length;
      const closedCases = clientCases.filter((c) => c.status === 'CLOSED').length;

      totalClientCases += totalCases;
      if (cl.status === 'ACTIVE') activeClientsCount++;
      if (cl.organization) corporateCount++;

      return {
        _id: cl._id,
        name: cl.name,
        email: cl.email,
        phone: cl.phone,
        organization: cl.organization || 'Individual Litigant',
        city: cl.address?.city || 'Not Specified',
        state: cl.address?.state || 'India',
        status: cl.status,
        assignedLawyerName: cl.assignedLawyer?.name || 'Unassigned',
        assignedLawyerEmail: cl.assignedLawyer?.email || '',
        totalCases,
        activeCases,
        closedCases,
        casesList: clientCases.map((c) => ({
          caseReference: c.caseReference,
          title: c.title,
          courtName: c.courtName,
          status: c.status,
          filingDate: c.filingDate ? c.filingDate.toISOString().split('T')[0] : 'N/A',
          assignedLawyerName: c.assignedLawyer?.name || 'Unassigned',
        })),
      };
    });

    const summary = {
      totalClients: clients.length,
      activeClients: activeClientsCount,
      totalClientCases,
      corporateClients: corporateCount,
    };

    // Check for CSV export request
    if (req.query.export === 'csv' || req.query.format === 'csv') {
      const headers = [
        'Client Name',
        'Organization',
        'Email',
        'Phone',
        'City',
        'Assigned Advocate',
        'Total Cases',
        'Active Cases',
        'Closed Cases',
        'Status',
      ];
      const rows = reportRows.map((cl) => [
        cl.name,
        cl.organization,
        cl.email,
        cl.phone,
        cl.city,
        cl.assignedLawyerName,
        cl.totalCases,
        cl.activeCases,
        cl.closedCases,
        cl.status,
      ]);
      const today = new Date().toISOString().split('T')[0];
      const filename = `JurisFlow_Client_Summary_Report_${today}.csv`;
      const csvString = generateCSV(headers, rows);
      return sendCSVResponse(res, filename, csvString);
    }

    return sendSuccess(
      res,
      { reportName: 'Client Case Summary Report', summary, clients: reportRows },
      'Client summary report generated successfully',
      200
    );
  } catch (error) {
    console.error('Error generating client summary report:', error);
    return sendError(res, error.message || 'Error generating client summary report', 500);
  }
};

module.exports = {
  getCaseStatusReport,
  getHearingCalendarReport,
  getPendingTasksReport,
  getClientSummaryReport,
};

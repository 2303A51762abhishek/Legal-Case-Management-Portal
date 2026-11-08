const mongoose = require('mongoose');
const { Case, Hearing, Task, Client, User, Document, Notification } = require('../models');
const { sendSuccess, sendError } = require('../utils/response');

/**
 * Helper to get start and end of current day (UTC)
 */
const getTodayRange = () => {
  const start = new Date();
  start.setUTCHours(0, 0, 0, 0);
  const end = new Date();
  end.setUTCHours(23, 59, 59, 999);
  return { start, end };
};

/**
 * @desc    Get Admin Governance Dashboard Metrics
 * @route   GET /api/dashboard/admin
 * @access  Protected (ADMIN only)
 */
const getAdminDashboard = async (req, res) => {
  try {
    const now = new Date();

    // 1. Parallel metric aggregation
    const [
      totalUsers,
      totalLawyers,
      totalClients,
      totalClerks,
      totalCases,
      activeCases,
      pendingCases,
      closedCases,
      upcomingHearings,
      overdueTasks,
      urgentTasks,
      recentCases,
      upcomingHearingsList,
      recentNotifications,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'LAWYER' }),
      Client.countDocuments(),
      User.countDocuments({ role: 'CLERK' }),
      Case.countDocuments(),
      Case.countDocuments({ status: { $in: ['HEARING_IN_PROGRESS', 'APPEALED'] } }),
      Case.countDocuments({ status: { $in: ['FILED', 'UNDER_REVIEW'] } }),
      Case.countDocuments({ status: { $in: ['CLOSED', 'JUDGMENT_RESERVED'] } }),
      Hearing.countDocuments({ status: 'SCHEDULED', hearingDate: { $gte: now } }),
      Task.countDocuments({ isDeleted: false, status: { $ne: 'COMPLETED' }, deadline: { $lt: now } }),
      Task.countDocuments({ isDeleted: false, status: { $ne: 'COMPLETED' }, priority: 'URGENT' }),
      Case.find()
        .populate('client', 'name organization')
        .populate('assignedLawyer', 'name email designation')
        .sort({ filingDate: -1, createdAt: -1 })
        .limit(5),
      Hearing.find({ status: 'SCHEDULED', hearingDate: { $gte: now } })
        .populate('case', 'caseReference title client assignedLawyer')
        .sort({ hearingDate: 1, startDateTime: 1 })
        .limit(5),
      Notification.find({ recipient: req.user.id })
        .sort({ createdAt: -1 })
        .limit(5),
    ]);

    // 2. Case status breakdown for chart visualizations
    const statusCounts = await Case.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);
    const caseStatusDistribution = statusCounts.map((s) => ({
      status: s._id,
      count: s.count,
    }));

    // 3. Task priority breakdown
    const priorityCounts = await Task.aggregate([
      { $match: { isDeleted: false, status: { $ne: 'COMPLETED' } } },
      { $group: { _id: '$priority', count: { $sum: 1 } } },
    ]);
    const taskPriorityDistribution = priorityCounts.map((p) => ({
      priority: p._id,
      count: p.count,
    }));

    const responseData = {
      role: 'ADMIN',
      stats: {
        totalUsers,
        totalLawyers,
        totalClients,
        totalClerks,
        totalCases,
        activeCases,
        pendingCases,
        closedCases,
        upcomingHearings,
        overdueTasks,
        urgentTasks,
      },
      visualizations: {
        caseStatusDistribution,
        taskPriorityDistribution,
      },
      recentCases: recentCases.map((c) => ({
        _id: c._id,
        caseReference: c.caseReference,
        title: c.title,
        courtName: c.courtName,
        caseType: c.caseType,
        clientName: c.client?.name || 'Unassigned',
        assignedLawyerName: c.assignedLawyer?.name || 'Unassigned',
        status: c.status,
        filingDate: c.filingDate ? c.filingDate.toISOString().split('T')[0] : 'N/A',
      })),
      upcomingHearings: upcomingHearingsList.map((h) => ({
        _id: h._id,
        caseReference: h.caseReference || h.case?.caseReference,
        courtName: h.courtName,
        courtroom: h.courtroom,
        judgeName: h.judgeName,
        hearingDate: h.hearingDate ? h.hearingDate.toISOString().split('T')[0] : 'N/A',
        hearingTime: h.hearingTime,
        purpose: h.purpose,
      })),
      recentNotifications: recentNotifications.map((n) => ({
        _id: n._id,
        title: n.title,
        message: n.message,
        type: n.type,
        isRead: n.isRead,
        createdAt: n.createdAt,
      })),
    };

    return sendSuccess(res, responseData, 'Admin dashboard metrics retrieved successfully', 200);
  } catch (error) {
    console.error('Error fetching admin dashboard:', error);
    return sendError(res, error.message || 'Internal server error fetching admin dashboard', 500);
  }
};

/**
 * @desc    Get Lawyer Practice Dashboard Metrics
 * @route   GET /api/dashboard/lawyer
 * @access  Protected (LAWYER only)
 */
const getLawyerDashboard = async (req, res) => {
  try {
    const now = new Date();
    const lawyerId = req.user.id;

    // Cases assigned to this lawyer
    const lawyerCases = await Case.find({ assignedLawyer: lawyerId }).select('_id');
    const caseIds = lawyerCases.map((c) => c._id);

    const [
      assignedCases,
      activeCases,
      pendingCases,
      closedCases,
      upcomingHearings,
      pendingTasks,
      overdueTasks,
      completedTasks,
      urgentTasks,
      recentCases,
      upcomingHearingsList,
      pendingTasksList,
      recentNotifications,
    ] = await Promise.all([
      Case.countDocuments({ assignedLawyer: lawyerId }),
      Case.countDocuments({ assignedLawyer: lawyerId, status: { $in: ['HEARING_IN_PROGRESS', 'APPEALED'] } }),
      Case.countDocuments({ assignedLawyer: lawyerId, status: { $in: ['FILED', 'UNDER_REVIEW'] } }),
      Case.countDocuments({ assignedLawyer: lawyerId, status: { $in: ['CLOSED', 'JUDGMENT_RESERVED'] } }),
      Hearing.countDocuments({ case: { $in: caseIds }, status: 'SCHEDULED', hearingDate: { $gte: now } }),
      Task.countDocuments({ assignedUser: lawyerId, isDeleted: false, status: { $ne: 'COMPLETED' } }),
      Task.countDocuments({ assignedUser: lawyerId, isDeleted: false, status: { $ne: 'COMPLETED' }, deadline: { $lt: now } }),
      Task.countDocuments({ assignedUser: lawyerId, isDeleted: false, status: 'COMPLETED' }),
      Task.countDocuments({ assignedUser: lawyerId, isDeleted: false, status: { $ne: 'COMPLETED' }, priority: 'URGENT' }),
      Case.find({ assignedLawyer: lawyerId })
        .populate('client', 'name organization phone')
        .sort({ updatedAt: -1 })
        .limit(5),
      Hearing.find({ case: { $in: caseIds }, status: 'SCHEDULED', hearingDate: { $gte: now } })
        .populate('case', 'caseReference title client')
        .sort({ hearingDate: 1, startDateTime: 1 })
        .limit(5),
      Task.find({ assignedUser: lawyerId, isDeleted: false, status: { $ne: 'COMPLETED' } })
        .populate('case', 'caseReference title')
        .sort({ deadline: 1, priority: -1 })
        .limit(5),
      Notification.find({ recipient: lawyerId })
        .sort({ createdAt: -1 })
        .limit(5),
    ]);

    const responseData = {
      role: 'LAWYER',
      stats: {
        assignedCases,
        activeCases,
        pendingCases,
        closedCases,
        upcomingHearings,
        pendingTasks,
        overdueTasks,
        completedTasks,
        urgentTasks,
      },
      recentCases: recentCases.map((c) => ({
        _id: c._id,
        caseReference: c.caseReference,
        title: c.title,
        courtName: c.courtName,
        clientName: c.client?.name || 'Litigant',
        stage: c.stage,
        progress: c.progress,
        status: c.status,
      })),
      upcomingHearings: upcomingHearingsList.map((h) => ({
        _id: h._id,
        caseReference: h.caseReference || h.case?.caseReference,
        courtName: h.courtName,
        courtroom: h.courtroom,
        judgeName: h.judgeName,
        hearingDate: h.hearingDate ? h.hearingDate.toISOString().split('T')[0] : 'N/A',
        hearingTime: h.hearingTime,
        purpose: h.purpose,
      })),
      pendingTasks: pendingTasksList.map((t) => ({
        _id: t._id,
        title: t.title,
        caseReference: t.case?.caseReference || 'General Task',
        priority: t.priority,
        deadline: t.deadline ? t.deadline.toISOString().split('T')[0] : 'N/A',
        isOverdue: new Date(t.deadline) < now,
      })),
      recentNotifications: recentNotifications.map((n) => ({
        _id: n._id,
        title: n.title,
        message: n.message,
        type: n.type,
        isRead: n.isRead,
        createdAt: n.createdAt,
      })),
    };

    return sendSuccess(res, responseData, 'Lawyer dashboard metrics retrieved successfully', 200);
  } catch (error) {
    console.error('Error fetching lawyer dashboard:', error);
    return sendError(res, error.message || 'Internal server error fetching lawyer dashboard', 500);
  }
};

/**
 * @desc    Get Client Case Portal Dashboard Metrics
 * @route   GET /api/dashboard/client
 * @access  Protected (CLIENT only)
 */
const getClientDashboard = async (req, res) => {
  try {
    const now = new Date();
    const userId = req.user.id;

    // 1. Locate Client Record linked to this User Account
    const clientProfile = await Client.findOne({ userAccount: userId }).populate(
      'assignedLawyer',
      'name email phone designation'
    );

    if (!clientProfile) {
      return sendSuccess(
        res,
        {
          role: 'CLIENT',
          stats: { totalCases: 0, activeCases: 0, closedCases: 0, upcomingHearings: 0, clientTasks: 0, completedClientTasks: 0 },
          myCases: [],
          upcomingHearings: [],
          actionItems: [],
          sharedDocuments: [],
          recentNotifications: [],
        },
        'Client profile not initialized yet',
        200
      );
    }

    const clientId = clientProfile._id;
    const clientCases = await Case.find({ client: clientId }).select('_id');
    const caseIds = clientCases.map((c) => c._id);

    // 2. Parallel Metrics Query strictly scoped to client's cases
    const [
      totalCases,
      activeCases,
      closedCases,
      upcomingHearings,
      clientTasks,
      completedClientTasks,
      myCasesList,
      upcomingHearingsList,
      actionItemsList,
      sharedDocumentsList,
      recentNotifications,
    ] = await Promise.all([
      Case.countDocuments({ client: clientId }),
      Case.countDocuments({ client: clientId, status: { $in: ['FILED', 'UNDER_REVIEW', 'HEARING_IN_PROGRESS', 'APPEALED'] } }),
      Case.countDocuments({ client: clientId, status: 'CLOSED' }),
      Hearing.countDocuments({ case: { $in: caseIds }, status: 'SCHEDULED', hearingDate: { $gte: now } }),
      Task.countDocuments({ case: { $in: caseIds }, isClientVisible: true, isDeleted: false, status: { $ne: 'COMPLETED' } }),
      Task.countDocuments({ case: { $in: caseIds }, isClientVisible: true, isDeleted: false, status: 'COMPLETED' }),
      Case.find({ client: clientId })
        .populate('assignedLawyer', 'name email phone designation')
        .sort({ updatedAt: -1 }),
      Hearing.find({ case: { $in: caseIds }, status: 'SCHEDULED', hearingDate: { $gte: now } })
        .sort({ hearingDate: 1, startDateTime: 1 })
        .limit(5),
      Task.find({ case: { $in: caseIds }, isClientVisible: true, isDeleted: false, status: { $ne: 'COMPLETED' } })
        .sort({ deadline: 1 })
        .limit(5),
      Document.find({ case: { $in: caseIds }, isConfidential: false, isDeleted: false })
        .sort({ createdAt: -1 })
        .limit(5),
      Notification.find({ recipient: userId })
        .sort({ createdAt: -1 })
        .limit(5),
    ]);

    const responseData = {
      role: 'CLIENT',
      clientProfile: {
        name: clientProfile.name,
        organization: clientProfile.organization,
        email: clientProfile.email,
        assignedLawyer: clientProfile.assignedLawyer
          ? {
              name: clientProfile.assignedLawyer.name,
              email: clientProfile.assignedLawyer.email,
              phone: clientProfile.assignedLawyer.phone,
            }
          : null,
      },
      stats: {
        totalCases,
        activeCases,
        closedCases,
        upcomingHearings,
        clientTasks,
        completedClientTasks,
      },
      myCases: myCasesList.map((c) => ({
        _id: c._id,
        caseReference: c.caseReference,
        title: c.title,
        courtName: c.courtName,
        status: c.status,
        stage: c.stage,
        progress: c.progress,
        lawyerName: c.assignedLawyer?.name || 'Advocate Assigned',
        lawyerPhone: c.assignedLawyer?.phone || '',
      })),
      upcomingHearings: upcomingHearingsList.map((h) => ({
        _id: h._id,
        caseReference: h.caseReference,
        courtName: h.courtName,
        courtroom: h.courtroom,
        hearingDate: h.hearingDate ? h.hearingDate.toISOString().split('T')[0] : 'N/A',
        hearingTime: h.hearingTime,
        purpose: h.purpose,
      })),
      actionItems: actionItemsList.map((t) => ({
        _id: t._id,
        title: t.title,
        description: t.description,
        deadline: t.deadline ? t.deadline.toISOString().split('T')[0] : 'N/A',
        priority: t.priority,
        status: t.status,
      })),
      sharedDocuments: sharedDocumentsList.map((d) => ({
        _id: d._id,
        title: d.title,
        fileName: d.fileName,
        fileSize: d.fileSize,
        uploadDate: d.uploadDate ? d.uploadDate.toISOString().split('T')[0] : 'Recent',
        downloadUrl: `/api/documents/${d._id}/download`,
      })),
      recentNotifications: recentNotifications.map((n) => ({
        _id: n._id,
        title: n.title,
        message: n.message,
        type: n.type,
        isRead: n.isRead,
        createdAt: n.createdAt,
      })),
    };

    return sendSuccess(res, responseData, 'Client dashboard metrics retrieved successfully', 200);
  } catch (error) {
    console.error('Error fetching client dashboard:', error);
    return sendError(res, error.message || 'Internal server error fetching client dashboard', 500);
  }
};

/**
 * @desc    Get Court Registry & Bench Clerk Dashboard Metrics
 * @route   GET /api/dashboard/clerk
 * @access  Protected (CLERK only)
 */
const getClerkDashboard = async (req, res) => {
  try {
    const now = new Date();
    const { start: startOfToday, end: endOfToday } = getTodayRange();
    const clerkId = req.user.id;

    const [
      totalCases,
      casesRegisteredToday,
      upcomingHearings,
      hearingsToday,
      pendingRegistryTasks,
      overdueTasks,
      totalDocumentsUploaded,
      dailyCauseList,
      recentRegistrations,
      assignedTasks,
      recentNotifications,
    ] = await Promise.all([
      Case.countDocuments(),
      Case.countDocuments({ filingDate: { $gte: startOfToday, $lte: endOfToday } }),
      Hearing.countDocuments({ status: 'SCHEDULED', hearingDate: { $gte: now } }),
      Hearing.countDocuments({
        hearingDate: { $gte: startOfToday, $lte: endOfToday },
        status: { $ne: 'CANCELLED' },
      }),
      Task.countDocuments({ assignedUser: clerkId, isDeleted: false, status: { $ne: 'COMPLETED' } }),
      Task.countDocuments({ isDeleted: false, status: { $ne: 'COMPLETED' }, deadline: { $lt: now } }),
      Document.countDocuments({ isDeleted: false }),
      Hearing.find({
        hearingDate: { $gte: startOfToday },
        status: { $ne: 'CANCELLED' },
      })
        .populate('case', 'caseReference title assignedLawyer')
        .sort({ hearingDate: 1, startDateTime: 1 })
        .limit(6),
      Case.find()
        .populate('client', 'name organization')
        .populate('assignedLawyer', 'name')
        .sort({ filingDate: -1, createdAt: -1 })
        .limit(5),
      Task.find({ assignedUser: clerkId, isDeleted: false, status: { $ne: 'COMPLETED' } })
        .populate('case', 'caseReference title')
        .sort({ deadline: 1 })
        .limit(5),
      Notification.find({ recipient: clerkId })
        .sort({ createdAt: -1 })
        .limit(5),
    ]);

    const responseData = {
      role: 'CLERK',
      stats: {
        totalCases,
        casesRegisteredToday,
        upcomingHearings,
        hearingsToday,
        pendingRegistryTasks,
        overdueTasks,
        totalDocumentsUploaded,
      },
      dailyCauseList: dailyCauseList.map((h, idx) => ({
        itemNumber: idx + 1,
        _id: h._id,
        caseReference: h.caseReference || h.case?.caseReference,
        courtName: h.courtName,
        courtroom: h.courtroom,
        hearingTime: h.hearingTime,
        hearingDate: h.hearingDate ? h.hearingDate.toISOString().split('T')[0] : 'Today',
        judgeName: h.judgeName,
        purpose: h.purpose,
        status: h.status,
      })),
      recentRegistrations: recentRegistrations.map((c) => ({
        _id: c._id,
        caseReference: c.caseReference,
        title: c.title,
        clientName: c.client?.name || 'Litigant',
        courtName: c.courtName,
        status: c.status,
        filingDate: c.filingDate ? c.filingDate.toISOString().split('T')[0] : 'N/A',
      })),
      assignedTasks: assignedTasks.map((t) => ({
        _id: t._id,
        title: t.title,
        caseReference: t.case?.caseReference || 'Registry Task',
        priority: t.priority,
        deadline: t.deadline ? t.deadline.toISOString().split('T')[0] : 'N/A',
        isOverdue: new Date(t.deadline) < now,
      })),
      recentNotifications: recentNotifications.map((n) => ({
        _id: n._id,
        title: n.title,
        message: n.message,
        type: n.type,
        isRead: n.isRead,
        createdAt: n.createdAt,
      })),
    };

    return sendSuccess(res, responseData, 'Clerk dashboard metrics retrieved successfully', 200);
  } catch (error) {
    console.error('Error fetching clerk dashboard:', error);
    return sendError(res, error.message || 'Internal server error fetching clerk dashboard', 500);
  }
};

module.exports = {
  getAdminDashboard,
  getLawyerDashboard,
  getClientDashboard,
  getClerkDashboard,
};

const mongoose = require('mongoose');
const { Hearing, Case, Client, Notification } = require('../models');
const { checkHearingConflicts, parseDateTime } = require('../services/conflict.service');
const { notifyHearingScheduled } = require('../services/notification.service');
const { sendSuccess, sendError } = require('../utils/response');

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

/**
 * @desc    Schedule a new court hearing with conflict prevention
 * @route   POST /api/hearings
 * @access  Protected (ADMIN, CLERK, LAWYER)
 */
const createHearing = async (req, res, next) => {
  try {
    const {
      case: caseId,
      courtName,
      courtroom,
      judgeName,
      hearingDate,
      hearingTime,
      durationMinutes = 60,
      purpose,
      status = 'SCHEDULED',
      notes = '',
    } = req.body;

    // 1. Mandatory Input Validation
    if (!caseId || !courtName || !courtroom || !judgeName || !hearingDate || !hearingTime || !purpose) {
      return sendError(
        res,
        'Please provide case ID, court name, courtroom, judge name, hearing date, time, and purpose.',
        400
      );
    }

    if (!isValidId(caseId)) {
      return sendError(res, 'Invalid case ID format.', 400);
    }

    // 2. Validate Target Case & Permissions
    const legalCase = await Case.findById(caseId).populate('client');
    if (!legalCase) {
      return sendError(res, 'Specified legal case does not exist.', 404);
    }

    // Litigant clients are forbidden from scheduling hearings
    if (req.user.role === 'CLIENT') {
      return sendError(res, 'Forbidden. Litigant clients cannot schedule court hearings.', 403);
    }

    // Lawyers can only schedule hearings for their assigned cases
    if (req.user.role === 'LAWYER') {
      if (legalCase.assignedLawyer.toString() !== req.user.id) {
        return sendError(res, 'Access denied. You can only schedule hearings for cases assigned to you.', 403);
      }
    }

    // 3. Conflict Detection Engine (Courtroom & Judge Overlap Checks)
    const conflictResult = await checkHearingConflicts({
      courtName,
      courtroom,
      judgeName,
      hearingDate,
      hearingTime,
      durationMinutes: parseInt(durationMinutes, 10) || 60,
    });

    if (conflictResult.hasConflict) {
      return sendError(
        res,
        conflictResult.message,
        409,
        {
          conflictType: conflictResult.conflictType,
          conflictingHearing: conflictResult.conflictingHearing,
        }
      );
    }

    // 4. Create Hearing in MongoDB
    const hearing = await Hearing.create({
      case: legalCase._id,
      caseReference: legalCase.caseReference,
      courtName: courtName.trim(),
      courtroom: courtroom.trim(),
      judgeName: judgeName.trim(),
      hearingDate: new Date(hearingDate),
      hearingTime: hearingTime.trim(),
      durationMinutes: parseInt(durationMinutes, 10) || 60,
      startDateTime: conflictResult.startDateTime,
      endDateTime: conflictResult.endDateTime,
      purpose: purpose.trim(),
      status: status.toUpperCase(),
      notes: notes.trim(),
      scheduledBy: req.user.id,
    });

    // 5. Update Case Status to HEARING_IN_PROGRESS if currently FILED
    if (legalCase.status === 'FILED') {
      legalCase.status = 'HEARING_IN_PROGRESS';
      await legalCase.save();
    }

    // 6. Trigger In-App Notifications
    await notifyHearingScheduled({ hearing, legalCase });

    const populatedHearing = await Hearing.findById(hearing._id).populate({
      path: 'case',
      select: 'caseReference title client assignedLawyer',
      populate: [
        { path: 'client', select: 'name organization phone' },
        { path: 'assignedLawyer', select: 'name barCouncilId designation' },
      ],
    });

    return sendSuccess(
      res,
      populatedHearing,
      `Hearing scheduled successfully for ${legalCase.caseReference} without scheduling conflicts.`,
      201
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get hearings with search, filters, and role-scoping
 * @route   GET /api/hearings
 * @access  Protected (All Roles with Scoping)
 */
const getHearings = async (req, res, next) => {
  try {
    const {
      caseReference,
      status,
      courtName,
      judgeName,
      date,
      startDate,
      endDate,
      upcoming,
      search,
    } = req.query;

    const query = {};

    // 1. Role-based scoping
    if (req.user.role === 'LAWYER') {
      const lawyerCases = await Case.find({ assignedLawyer: req.user.id }).select('_id').lean();
      const caseIds = lawyerCases.map((c) => c._id);
      query.case = { $in: caseIds };
    } else if (req.user.role === 'CLIENT') {
      const clientProfile = await Client.findOne({
        $or: [
          { userAccount: req.user.id },
          { email: req.user.email.toLowerCase() },
        ],
      }).select('_id');

      if (!clientProfile) {
        return sendSuccess(res, [], 'No hearings found for client account.', 200);
      }

      const clientCases = await Case.find({ client: clientProfile._id }).select('_id').lean();
      const caseIds = clientCases.map((c) => c._id);
      query.case = { $in: caseIds };
    }

    // 2. Filters
    if (status && status !== 'ALL') {
      query.status = status.toUpperCase();
    }

    if (caseReference) {
      query.caseReference = { $regex: caseReference.trim(), $options: 'i' };
    }

    if (courtName) {
      query.courtName = { $regex: courtName.trim(), $options: 'i' };
    }

    if (judgeName) {
      query.judgeName = { $regex: judgeName.trim(), $options: 'i' };
    }

    // Specific Date filter
    if (date) {
      const dayStart = new Date(date);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(date);
      dayEnd.setHours(23, 59, 59, 999);
      query.hearingDate = { $gte: dayStart, $lte: dayEnd };
    } else if (startDate || endDate) {
      query.hearingDate = {};
      if (startDate) query.hearingDate.$gte = new Date(startDate);
      if (endDate) query.hearingDate.$lte = new Date(endDate);
    }

    // Upcoming / Past filter
    if (upcoming === 'true') {
      query.startDateTime = { $gte: new Date() };
      query.status = { $ne: 'CANCELLED' };
    } else if (upcoming === 'false') {
      query.startDateTime = { $lt: new Date() };
    }

    // Keyword search
    if (search) {
      const regex = { $regex: search.trim(), $options: 'i' };
      query.$or = [
        { caseReference: regex },
        { courtName: regex },
        { courtroom: regex },
        { judgeName: regex },
        { purpose: regex },
      ];
    }

    const hearings = await Hearing.find(query)
      .populate({
        path: 'case',
        select: 'caseReference title client assignedLawyer priority',
        populate: [
          { path: 'client', select: 'name organization phone' },
          { path: 'assignedLawyer', select: 'name barCouncilId designation' },
        ],
      })
      .sort({ startDateTime: 1, hearingDate: 1 });

    return sendSuccess(res, hearings, `Retrieved ${hearings.length} court hearing(s)`, 200);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single hearing details by ID
 * @route   GET /api/hearings/:id
 * @access  Protected (All Roles with Scoping)
 */
const getHearingById = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) {
      return sendError(res, 'Invalid hearing ID format.', 400);
    }

    const hearing = await Hearing.findById(id).populate({
      path: 'case',
      select: 'caseReference title client assignedLawyer description',
      populate: [
        { path: 'client', select: 'name organization phone email userAccount' },
        { path: 'assignedLawyer', select: 'name barCouncilId designation phone email' },
      ],
    });

    if (!hearing) {
      return sendError(res, 'Court hearing record not found.', 404);
    }

    // Security Scoping Checks
    if (req.user.role === 'LAWYER') {
      if (hearing.case.assignedLawyer._id.toString() !== req.user.id) {
        return sendError(res, 'Access denied. You are not assigned to this case hearing.', 403);
      }
    }

    if (req.user.role === 'CLIENT') {
      const isOwner =
        (hearing.case.client.userAccount &&
          hearing.case.client.userAccount.toString() === req.user.id) ||
        hearing.case.client.email.toLowerCase() === req.user.email.toLowerCase();

      if (!isOwner) {
        return sendError(res, 'Access denied. You cannot view hearings for other litigants.', 403);
      }
    }

    return sendSuccess(res, hearing, 'Hearing details retrieved successfully.', 200);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update and reschedule a court hearing (with conflict detection)
 * @route   PUT /api/hearings/:id
 * @access  Protected (ADMIN, CLERK, LAWYER)
 */
const updateHearing = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) {
      return sendError(res, 'Invalid hearing ID format.', 400);
    }

    if (req.user.role === 'CLIENT') {
      return sendError(res, 'Forbidden. Litigants cannot modify hearing schedules.', 403);
    }

    const hearing = await Hearing.findById(id).populate('case');
    if (!hearing) {
      return sendError(res, 'Hearing record not found.', 404);
    }

    if (req.user.role === 'LAWYER') {
      if (hearing.case.assignedLawyer.toString() !== req.user.id) {
        return sendError(res, 'Access denied. You can only reschedule hearings for your assigned cases.', 403);
      }
    }

    const {
      courtName = hearing.courtName,
      courtroom = hearing.courtroom,
      judgeName = hearing.judgeName,
      hearingDate = hearing.hearingDate,
      hearingTime = hearing.hearingTime,
      durationMinutes = hearing.durationMinutes,
      purpose,
      status,
      summary,
      notes,
    } = req.body;

    // Run conflict detection excluding current hearing
    const conflictResult = await checkHearingConflicts({
      courtName,
      courtroom,
      judgeName,
      hearingDate,
      hearingTime,
      durationMinutes: parseInt(durationMinutes, 10) || 60,
      excludeHearingId: hearing._id,
    });

    if (conflictResult.hasConflict) {
      return sendError(res, conflictResult.message, 409, {
        conflictType: conflictResult.conflictType,
        conflictingHearing: conflictResult.conflictingHearing,
      });
    }

    hearing.courtName = courtName.trim();
    hearing.courtroom = courtroom.trim();
    hearing.judgeName = judgeName.trim();
    hearing.hearingDate = new Date(hearingDate);
    hearing.hearingTime = hearingTime.trim();
    hearing.durationMinutes = parseInt(durationMinutes, 10) || 60;
    hearing.startDateTime = conflictResult.startDateTime;
    hearing.endDateTime = conflictResult.endDateTime;

    if (purpose) hearing.purpose = purpose.trim();
    if (status) hearing.status = status.toUpperCase();
    if (summary !== undefined) hearing.summary = summary.trim();
    if (notes !== undefined) hearing.notes = notes.trim();

    await hearing.save();

    const updated = await Hearing.findById(hearing._id).populate({
      path: 'case',
      select: 'caseReference title client assignedLawyer',
      populate: [
        { path: 'client', select: 'name organization' },
        { path: 'assignedLawyer', select: 'name barCouncilId' },
      ],
    });

    return sendSuccess(res, updated, 'Hearing schedule updated successfully.', 200);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Soft Delete / Cancel a court hearing
 * @route   DELETE /api/hearings/:id
 * @access  Protected (ADMIN, CLERK, LAWYER)
 */
const cancelHearing = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) {
      return sendError(res, 'Invalid hearing ID format.', 400);
    }

    if (req.user.role === 'CLIENT') {
      return sendError(res, 'Forbidden. Litigants cannot cancel court hearings.', 403);
    }

    const hearing = await Hearing.findById(id).populate('case');
    if (!hearing) {
      return sendError(res, 'Hearing record not found.', 404);
    }

    if (req.user.role === 'LAWYER') {
      if (hearing.case.assignedLawyer.toString() !== req.user.id) {
        return sendError(res, 'Access denied. You can only cancel hearings for your assigned cases.', 403);
      }
    }

    hearing.status = 'CANCELLED';
    await hearing.save();

    return sendSuccess(res, hearing, 'Court hearing cancelled successfully.', 200);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update hearing status specifically (SCHEDULED, ADJOURNED, COMPLETED, CANCELLED)
 * @route   PATCH /api/hearings/:id/status
 * @access  Protected (ADMIN, CLERK, LAWYER)
 */
const updateHearingStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!isValidId(id)) {
      return sendError(res, 'Invalid hearing ID format.', 400);
    }

    const validStatuses = ['SCHEDULED', 'ADJOURNED', 'COMPLETED', 'CANCELLED'];
    if (!status || !validStatuses.includes(status.toUpperCase())) {
      return sendError(res, `Invalid status. Must be one of: [${validStatuses.join(', ')}]`, 400);
    }

    const hearing = await Hearing.findById(id).populate('case');
    if (!hearing) {
      return sendError(res, 'Hearing record not found.', 404);
    }

    if (req.user.role === 'CLIENT') {
      return sendError(res, 'Forbidden. Litigants cannot modify hearing status.', 403);
    }

    if (req.user.role === 'LAWYER') {
      if (hearing.case.assignedLawyer.toString() !== req.user.id) {
        return sendError(res, 'Access denied. You can only update hearings for your assigned cases.', 403);
      }
    }

    hearing.status = status.toUpperCase();
    await hearing.save();

    return sendSuccess(res, hearing, `Hearing status updated to ${hearing.status}`, 200);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createHearing,
  getHearings,
  getHearingById,
  updateHearing,
  cancelHearing,
  updateHearingStatus,
};

const mongoose = require('mongoose');
const { Case, Client, User } = require('../models');
const { generateCaseReference } = require('../services/reference.service');
const { sendSuccess, sendError } = require('../utils/response');

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

/**
 * @desc    Register a new legal case (generates LCMS-YYYY-XXXX reference)
 * @route   POST /api/cases
 * @access  Protected (ADMIN, CLERK)
 */
const createCase = async (req, res, next) => {
  try {
    const {
      title,
      caseType,
      courtName,
      courtroom,
      client,
      assignedLawyer,
      filingDate,
      description,
      status,
      stage,
      priority,
    } = req.body;

    // 1. Validate mandatory fields
    if (!title || !caseType || !courtName || !client || !assignedLawyer || !description) {
      return sendError(
        res,
        'Please provide title, case type, court name, client ID, assigned lawyer ID, and case description.',
        400
      );
    }

    // 2. Validate Client
    if (!isValidId(client)) {
      return sendError(res, 'Invalid client ID format.', 400);
    }
    const clientRecord = await Client.findById(client);
    if (!clientRecord) {
      return sendError(res, 'Specified client record does not exist.', 404);
    }

    // 3. Validate Assigned Lawyer
    if (!isValidId(assignedLawyer)) {
      return sendError(res, 'Invalid assigned lawyer ID format.', 400);
    }
    const lawyerRecord = await User.findById(assignedLawyer);
    if (!lawyerRecord || lawyerRecord.role !== 'LAWYER') {
      return sendError(res, 'Assigned user is not a registered advocate / lawyer.', 400);
    }

    // 4. Generate Unique Case Reference Number: LCMS-YYYY-XXXX
    const caseReference = await generateCaseReference();

    // 5. Create Case in MongoDB
    const newCase = await Case.create({
      caseReference,
      title: title.trim(),
      caseType: caseType.trim(),
      courtName: courtName.trim(),
      courtroom: courtroom ? courtroom.trim() : '',
      client: clientRecord._id,
      assignedLawyer: lawyerRecord._id,
      filingDate: filingDate ? new Date(filingDate) : new Date(),
      description: description.trim(),
      status: status ? status.toUpperCase() : 'FILED',
      stage: stage ? stage.trim() : 'Initial Filing & Scrutiny',
      progress: status === 'FILED' ? 10 : 25,
      priority: priority ? priority.toUpperCase() : 'MEDIUM',
    });

    const populatedCase = await Case.findById(newCase._id)
      .populate('client', 'name email phone organization')
      .populate('assignedLawyer', 'name email phone barCouncilId designation');

    return sendSuccess(res, populatedCase, `Case registered with Reference: ${caseReference}`, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get cases with search, status filters, role-scoping and pagination
 * @route   GET /api/cases
 * @access  Protected (All Roles with Scoping)
 */
const getCases = async (req, res, next) => {
  try {
    const {
      search,
      status,
      courtName,
      priority,
      page = 1,
      limit = 20,
    } = req.query;

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 20;
    const skip = (pageNum - 1) * limitNum;

    const query = {};

    // 1. Role-Based Data Isolation
    if (req.user.role === 'LAWYER') {
      // Lawyer only sees cases assigned to their counsel ID
      query.assignedLawyer = req.user.id;
    } else if (req.user.role === 'CLIENT') {
      // Client only sees their own registered cases
      const clientProfile = await Client.findOne({
        $or: [
          { userAccount: req.user.id },
          { email: req.user.email.toLowerCase() },
        ],
      });

      if (!clientProfile) {
        // No client profile linked yet
        return sendSuccess(
          res,
          { cases: [], pagination: { total: 0, page: pageNum, limit: limitNum, totalPages: 1 } },
          'No registered cases found for your account.',
          200
        );
      }
      query.client = clientProfile._id;
    }

    // 2. Status & Filter Parameters
    if (status && status !== 'ALL') {
      query.status = status.toUpperCase();
    }

    if (courtName) {
      query.courtName = { $regex: courtName.trim(), $options: 'i' };
    }

    if (priority) {
      query.priority = priority.toUpperCase();
    }

    // 3. Search text
    if (search) {
      const searchRegex = { $regex: search.trim(), $options: 'i' };
      const searchConditions = [
        { caseReference: searchRegex },
        { title: searchRegex },
        { courtName: searchRegex },
        { caseType: searchRegex },
      ];

      if (query.$or) {
        query.$and = [{ $or: query.$or }, { $or: searchConditions }];
        delete query.$or;
      } else {
        query.$or = searchConditions;
      }
    }

    const [cases, total] = await Promise.all([
      Case.find(query)
        .populate('client', 'name email phone organization')
        .populate('assignedLawyer', 'name email phone barCouncilId designation')
        .sort({ filingDate: -1, createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Case.countDocuments(query),
    ]);

    return sendSuccess(
      res,
      {
        cases,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum) || 1,
        },
      },
      `Retrieved ${cases.length} case docket(s)`,
      200
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get detailed case record by ID
 * @route   GET /api/cases/:id
 * @access  Protected (All Roles with Scoping)
 */
const getCaseById = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) {
      return sendError(res, 'Invalid case ID format.', 400);
    }

    const legalCase = await Case.findById(id)
      .populate('client', 'name email phone organization address')
      .populate('assignedLawyer', 'name email phone barCouncilId designation');

    if (!legalCase) {
      return sendError(res, 'Case record not found.', 404);
    }

    // Security Isolation Checks
    if (req.user.role === 'LAWYER') {
      if (legalCase.assignedLawyer._id.toString() !== req.user.id) {
        return sendError(res, 'Access denied. You are not the assigned advocate for this case docket.', 403);
      }
    }

    if (req.user.role === 'CLIENT') {
      const isOwner =
        (legalCase.client.userAccount &&
          legalCase.client.userAccount.toString() === req.user.id) ||
        legalCase.client.email.toLowerCase() === req.user.email.toLowerCase();

      if (!isOwner) {
        return sendError(res, 'Access denied. You are not authorized to view this legal docket.', 403);
      }
    }

    return sendSuccess(res, legalCase, 'Case details retrieved successfully.', 200);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update case details and progress stages
 * @route   PUT /api/cases/:id
 * @access  Protected (ADMIN, LAWYER, CLERK)
 */
const updateCase = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) {
      return sendError(res, 'Invalid case ID format.', 400);
    }

    // CLIENT role is forbidden from modifying cases
    if (req.user.role === 'CLIENT') {
      return sendError(res, 'Forbidden. Litigant clients cannot modify court docket records.', 403);
    }

    const legalCase = await Case.findById(id);
    if (!legalCase) {
      return sendError(res, 'Case record not found.', 404);
    }

    // LAWYER role can ONLY update their own assigned cases
    if (req.user.role === 'LAWYER') {
      if (legalCase.assignedLawyer.toString() !== req.user.id) {
        return sendError(res, 'Access denied. You can only update case progress for your assigned dockets.', 403);
      }
    }

    const {
      title,
      caseType,
      courtName,
      courtroom,
      assignedLawyer,
      status,
      stage,
      progress,
      priority,
      description,
    } = req.body;

    // Updates allowed for Lawyers: status, stage, progress, priority, description
    if (status) legalCase.status = status.toUpperCase();
    if (stage) legalCase.stage = stage.trim();
    if (progress !== undefined) legalCase.progress = Math.min(100, Math.max(0, parseInt(progress, 10)));
    if (priority) legalCase.priority = priority.toUpperCase();
    if (description) legalCase.description = description.trim();

    // Administrative / Clerical updates
    if (req.user.role === 'ADMIN' || req.user.role === 'CLERK') {
      if (title) legalCase.title = title.trim();
      if (caseType) legalCase.caseType = caseType.trim();
      if (courtName) legalCase.courtName = courtName.trim();
      if (courtroom !== undefined) legalCase.courtroom = courtroom.trim();

      // Only ADMIN can reassign the lead counsel
      if (req.user.role === 'ADMIN' && assignedLawyer) {
        if (!isValidId(assignedLawyer)) {
          return sendError(res, 'Invalid assigned lawyer ID format.', 400);
        }
        const lawyer = await User.findById(assignedLawyer);
        if (!lawyer || lawyer.role !== 'LAWYER') {
          return sendError(res, 'Selected user is not a registered lawyer.', 400);
        }
        legalCase.assignedLawyer = lawyer._id;
      }
    }

    await legalCase.save();

    const updated = await Case.findById(legalCase._id)
      .populate('client', 'name email phone organization')
      .populate('assignedLawyer', 'name email phone barCouncilId designation');

    return sendSuccess(res, updated, `Case ${legalCase.caseReference} updated successfully.`, 200);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createCase,
  getCases,
  getCaseById,
  updateCase,
};

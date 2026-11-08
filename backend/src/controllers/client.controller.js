const mongoose = require('mongoose');
const { Client, Case, User } = require('../models');
const { sendSuccess, sendError } = require('../utils/response');

/**
 * Validate MongoDB ObjectId
 */
const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

/**
 * @desc    Create a new client
 * @route   POST /api/clients
 * @access  Protected (ADMIN, CLERK)
 */
const createClient = async (req, res, next) => {
  try {
    const { name, email, phone, organization, address, assignedLawyer } = req.body;

    if (!name || !email || !phone) {
      return sendError(res, 'Please provide client name, email address, and contact phone number.', 400);
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check for existing client with same email
    const existingClient = await Client.findOne({ email: normalizedEmail });
    if (existingClient) {
      return sendError(res, 'A client record with this email address already exists.', 409);
    }

    // Validate assigned lawyer if provided
    let lawyerId = null;
    if (assignedLawyer) {
      if (!isValidId(assignedLawyer)) {
        return sendError(res, 'Invalid assigned lawyer ID format.', 400);
      }
      const lawyer = await User.findById(assignedLawyer);
      if (!lawyer || lawyer.role !== 'LAWYER') {
        return sendError(res, 'Selected user is not a valid registered advocate / lawyer.', 400);
      }
      lawyerId = lawyer._id;
    }

    // Check if there is an existing portal user account matching this client's email
    const linkedUser = await User.findOne({ email: normalizedEmail, role: 'CLIENT' });

    const client = await Client.create({
      name: name.trim(),
      email: normalizedEmail,
      phone: phone.trim(),
      organization: organization ? organization.trim() : '',
      address: address || {},
      assignedLawyer: lawyerId,
      userAccount: linkedUser ? linkedUser._id : null,
      status: 'ACTIVE',
    });

    return sendSuccess(res, client, 'Client registered successfully.', 201);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all clients with search and pagination
 * @route   GET /api/clients
 * @access  Protected (ADMIN, CLERK, LAWYER)
 */
const getClients = async (req, res, next) => {
  try {
    const { search, status, page = 1, limit = 20 } = req.query;
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 20;
    const skip = (pageNum - 1) * limitNum;

    const query = {};

    // Role-based filtering
    if (req.user.role === 'LAWYER') {
      // Lawyer only sees clients assigned to them or for whom they hold cases
      const lawyerCases = await Case.find({ assignedLawyer: req.user.id }).select('client').lean();
      const clientIdsFromCases = lawyerCases.map((c) => c.client);
      query.$or = [
        { assignedLawyer: req.user.id },
        { _id: { $in: clientIdsFromCases } },
      ];
    }

    if (status) {
      query.status = status.toUpperCase();
    }

    if (search) {
      const searchRegex = { $regex: search.trim(), $options: 'i' };
      const searchConditions = [
        { name: searchRegex },
        { email: searchRegex },
        { phone: searchRegex },
        { organization: searchRegex },
      ];

      if (query.$or) {
        query.$and = [{ $or: query.$or }, { $or: searchConditions }];
        delete query.$or;
      } else {
        query.$or = searchConditions;
      }
    }

    const [clients, total] = await Promise.all([
      Client.find(query)
        .populate('assignedLawyer', 'name email phone designation barCouncilId')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Client.countDocuments(query),
    ]);

    // Attach case counts to each client
    const clientIds = clients.map((c) => c._id);
    const caseCounts = await Case.aggregate([
      { $match: { client: { $in: clientIds } } },
      { $group: { _id: '$client', count: { $sum: 1 } } },
    ]);
    const caseCountMap = {};
    caseCounts.forEach((item) => {
      caseCountMap[item._id.toString()] = item.count;
    });

    const clientsWithCounts = clients.map((c) => ({
      ...c,
      totalCases: caseCountMap[c._id.toString()] || 0,
    }));

    return sendSuccess(
      res,
      {
        clients: clientsWithCounts,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum) || 1,
        },
      },
      `Retrieved ${clients.length} client records`,
      200
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get client details by ID
 * @route   GET /api/clients/:id
 * @access  Protected (ADMIN, CLERK, LAWYER, CLIENT)
 */
const getClientById = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) {
      return sendError(res, 'Invalid client ID format.', 400);
    }

    const client = await Client.findById(id).populate(
      'assignedLawyer',
      'name email phone designation barCouncilId'
    );

    if (!client) {
      return sendError(res, 'Client record not found.', 404);
    }

    // Role-based data isolation
    if (req.user.role === 'CLIENT') {
      const isOwner =
        (client.userAccount && client.userAccount.toString() === req.user.id) ||
        client.email.toLowerCase() === req.user.email.toLowerCase();

      if (!isOwner) {
        return sendError(res, 'Access denied. You may only view your own client profile.', 403);
      }
    }

    if (req.user.role === 'LAWYER') {
      const isAssigned =
        client.assignedLawyer && client.assignedLawyer._id.toString() === req.user.id;
      const hasCase = await Case.exists({ client: client._id, assignedLawyer: req.user.id });

      if (!isAssigned && !hasCase) {
        return sendError(res, 'Access denied. You are not assigned to this client.', 403);
      }
    }

    return sendSuccess(res, client, 'Client details retrieved successfully.', 200);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update client information
 * @route   PUT /api/clients/:id
 * @access  Protected (ADMIN, CLERK)
 */
const updateClient = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) {
      return sendError(res, 'Invalid client ID format.', 400);
    }

    const { name, phone, organization, address, assignedLawyer, status } = req.body;

    const client = await Client.findById(id);
    if (!client) {
      return sendError(res, 'Client record not found.', 404);
    }

    if (name) client.name = name.trim();
    if (phone) client.phone = phone.trim();
    if (organization !== undefined) client.organization = organization.trim();
    if (address) client.address = { ...client.address, ...address };
    if (status) client.status = status.toUpperCase();

    if (assignedLawyer !== undefined) {
      if (assignedLawyer === null || assignedLawyer === '') {
        client.assignedLawyer = null;
      } else {
        if (!isValidId(assignedLawyer)) {
          return sendError(res, 'Invalid lawyer ID format.', 400);
        }
        const lawyer = await User.findById(assignedLawyer);
        if (!lawyer || lawyer.role !== 'LAWYER') {
          return sendError(res, 'Selected user is not a registered lawyer.', 400);
        }
        client.assignedLawyer = lawyer._id;
      }
    }

    await client.save();
    return sendSuccess(res, client, 'Client details updated successfully.', 200);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    View client's registered case history
 * @route   GET /api/clients/:id/cases
 * @access  Protected (All Roles with permission check)
 */
const getClientCases = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) {
      return sendError(res, 'Invalid client ID format.', 400);
    }

    const client = await Client.findById(id);
    if (!client) {
      return sendError(res, 'Client record not found.', 404);
    }

    // Role-based security check
    if (req.user.role === 'CLIENT') {
      const isOwner =
        (client.userAccount && client.userAccount.toString() === req.user.id) ||
        client.email.toLowerCase() === req.user.email.toLowerCase();

      if (!isOwner) {
        return sendError(res, 'Access denied. You cannot view other clients\' case history.', 403);
      }
    }

    const caseQuery = { client: id };
    if (req.user.role === 'LAWYER') {
      caseQuery.assignedLawyer = req.user.id;
    }

    const cases = await Case.find(caseQuery)
      .populate('assignedLawyer', 'name email designation barCouncilId')
      .sort({ filingDate: -1 });

    return sendSuccess(
      res,
      { client: { _id: client._id, name: client.name, email: client.email }, cases },
      `Retrieved ${cases.length} case(s) for client`,
      200
    );
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createClient,
  getClients,
  getClientById,
  updateClient,
  getClientCases,
};

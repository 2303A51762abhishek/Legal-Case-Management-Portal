const { User } = require('../models');
const { hashPassword } = require('../utils/password');
const { sendSuccess, sendError } = require('../utils/response');

/**
 * @desc    Get All Users (Admin Only)
 * @route   GET /api/users
 * @access  Protected (ADMIN)
 */
const getUsers = async (req, res, next) => {
  try {
    const { role, status, search } = req.query;
    const query = {};

    if (role) {
      query.role = role.toUpperCase();
    }

    if (status) {
      query.accountStatus = status.toUpperCase();
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { barCouncilId: { $regex: search, $options: 'i' } },
      ];
    }

    const users = await User.find(query).sort({ createdAt: -1 });
    return sendSuccess(res, users, `Retrieved ${users.length} user records`, 200);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Admin Creates Privileged User (LAWYER, CLERK, ADMIN, or CLIENT)
 * @route   POST /api/users
 * @access  Protected (ADMIN)
 */
const createUser = async (req, res, next) => {
  try {
    const { name, email, password, role, phone, barCouncilId, designation } = req.body;

    if (!name || !email || !password || !role) {
      return sendError(res, 'Please provide name, email, temporary password, and assigned role.', 400);
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return sendError(res, 'A user account with this email already exists.', 409);
    }

    const hashedPassword = await hashPassword(password);

    const newUser = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role: role.toUpperCase(),
      phone: phone ? phone.trim() : '',
      barCouncilId: barCouncilId ? barCouncilId.trim() : null,
      designation: designation ? designation.trim() : '',
      accountStatus: 'ACTIVE',
    });

    return sendSuccess(res, newUser, `User account created successfully for ${newUser.name} as ${newUser.role}`, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update User Account Status (Admin Only)
 * @route   PATCH /api/users/:id/status
 * @access  Protected (ADMIN)
 */
const updateUserStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { accountStatus } = req.body;

    if (!['ACTIVE', 'INACTIVE', 'SUSPENDED'].includes(accountStatus)) {
      return sendError(res, 'Invalid account status value.', 400);
    }

    const user = await User.findByIdAndUpdate(
      id,
      { accountStatus },
      { new: true, runValidators: true }
    );

    if (!user) {
      return sendError(res, 'User record not found.', 404);
    }

    return sendSuccess(res, user, `Account status updated to ${accountStatus}`, 200);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUsers,
  createUser,
  updateUserStatus,
};

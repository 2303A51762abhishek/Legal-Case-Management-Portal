const { User, Client } = require('../models');
const { hashPassword, comparePassword } = require('../utils/password');
const { generateToken } = require('../services/jwt.service');
const { sendSuccess, sendError } = require('../utils/response');
const config = require('../config/env');

/**
 * Configure standard HttpOnly Cookie Options
 */
const getCookieOptions = () => ({
  httpOnly: true,
  secure: config.env === 'production',
  sameSite: 'lax',
  maxAge: 24 * 60 * 60 * 1000, // 24 Hours
});

/**
 * @desc    Public User Registration (Defaults strictly to CLIENT role)
 * @route   POST /api/auth/register
 * @access  Public
 */
const register = async (req, res, next) => {
  try {
    const { name, email, password, phone, organization, address } = req.body;

    // 1. Basic Field Validation
    if (!name || !email || !password) {
      return sendError(res, 'Please provide full name, email address, and a secure password.', 400);
    }

    if (password.length < 6) {
      return sendError(res, 'Password must be at least 6 characters long.', 400);
    }

    const normalizedEmail = email.toLowerCase().trim();

    // 2. Prevent Duplicate Email Registrations
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return sendError(res, 'An account with this email address already exists in the portal.', 409);
    }

    // 3. Prevent Privilege Escalation
    // Public registrations are NEVER allowed to assign privileged roles (ADMIN, LAWYER, CLERK)
    const assignedRole = 'CLIENT';

    // 4. Hash Password with bcryptjs (10 salt rounds)
    const hashedPassword = await hashPassword(password);

    // 5. Create User Record in MongoDB
    const newUser = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role: assignedRole,
      phone: phone ? phone.trim() : '',
      accountStatus: 'ACTIVE',
      designation: organization ? `Representative, ${organization}` : 'Litigant Client',
    });

    // 6. Create Linked Client Record
    await Client.create({
      name: newUser.name,
      email: newUser.email,
      phone: newUser.phone || 'Not Specified',
      organization: organization || '',
      address: address || {},
      userAccount: newUser._id,
      status: 'ACTIVE',
    });

    // 7. Generate Signed JWT
    const tokenPayload = {
      id: newUser._id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
    };
    const token = generateToken(tokenPayload);

    // 8. Set HttpOnly Cookie
    res.cookie('juris_token', token, getCookieOptions());

    // 9. Format Safe Response (excluding password)
    const userResponse = {
      _id: newUser._id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      phone: newUser.phone,
      accountStatus: newUser.accountStatus,
      designation: newUser.designation,
      createdAt: newUser.createdAt,
    };

    return sendSuccess(
      res,
      { user: userResponse, token },
      'Registration successful. Welcome to JurisFlow Legal Portal.',
      201
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Authenticate User & Issue JWT Session
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return sendError(res, 'Please provide both email address and password to sign in.', 400);
    }

    const normalizedEmail = email.toLowerCase().trim();

    // 1. Fetch User from MongoDB with password field explicitly selected
    const user = await User.findOne({ email: normalizedEmail }).select('+password');
    if (!user) {
      return sendError(res, 'Invalid credentials. Please verify your email and password.', 401);
    }

    // 2. Verify Account Status
    if (user.accountStatus !== 'ACTIVE') {
      return sendError(
        res,
        `Your portal access has been restricted (Status: ${user.accountStatus}). Contact administrator.`,
        403
      );
    }

    // 3. Cryptographically Verify Password Hash
    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      return sendError(res, 'Invalid credentials. Please verify your email and password.', 401);
    }

    // 4. Generate Signed JWT
    const tokenPayload = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    };
    const token = generateToken(tokenPayload);

    // 5. Set HttpOnly Cookie
    res.cookie('juris_token', token, getCookieOptions());

    // 6. Return Safe User Data (without password hash)
    const userResponse = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      accountStatus: user.accountStatus,
      barCouncilId: user.barCouncilId,
      designation: user.designation,
      createdAt: user.createdAt,
    };

    return sendSuccess(
      res,
      { user: userResponse, token },
      `Welcome back, ${user.name}. Authenticated as ${user.role}.`,
      200
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Retrieve Current Authenticated Session Profile
 * @route   GET /api/auth/me
 * @access  Protected (All Roles)
 */
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return sendError(res, 'User record not found.', 404);
    }

    return sendSuccess(res, { user }, 'Session authenticated successfully.', 200);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Logout User & Invalidate HttpOnly Session Cookie
 * @route   POST /api/auth/logout
 * @access  Public / Protected
 */
const logout = async (req, res) => {
  res.clearCookie('juris_token', {
    httpOnly: true,
    secure: config.env === 'production',
    sameSite: 'lax',
  });

  return sendSuccess(res, null, 'Session ended. Logged out successfully.', 200);
};

module.exports = {
  register,
  login,
  getMe,
  logout,
};

const jwt = require('jsonwebtoken');
const config = require('../config/env');

/**
 * Generate a signed JWT for an authenticated user
 * @param {object} payload - User identification and role data
 * @returns {string} Signed JWT token
 */
const generateToken = (payload) => {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
    issuer: 'JurisFlow-Legal-Portal',
  });
};

/**
 * Verify a JWT token string
 * @param {string} token 
 * @returns {object} Decoded token payload
 */
const verifyToken = (token) => {
  return jwt.verify(token, config.jwt.secret, {
    issuer: 'JurisFlow-Legal-Portal',
  });
};

module.exports = {
  generateToken,
  verifyToken,
};

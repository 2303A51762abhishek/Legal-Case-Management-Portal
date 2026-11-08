const bcrypt = require('bcryptjs');

/**
 * Hash a plain text password using bcrypt with 10 salt rounds
 * @param {string} plainPassword 
 * @returns {Promise<string>} hashed password
 */
const hashPassword = async (plainPassword) => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(plainPassword, salt);
};

/**
 * Compare a plain text password against a stored bcrypt hash
 * @param {string} plainPassword 
 * @param {string} hashedPassword 
 * @returns {Promise<boolean>}
 */
const comparePassword = async (plainPassword, hashedPassword) => {
  return bcrypt.compare(plainPassword, hashedPassword);
};

module.exports = {
  hashPassword,
  comparePassword,
};

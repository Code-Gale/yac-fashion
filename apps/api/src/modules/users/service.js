const User = require('./model');
const bcrypt = require('bcryptjs');

const SALT_ROUNDS = 12;

const createUser = async (data) => {
  const passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS);
  const user = await User.create({
    name: data.name,
    email: data.email,
    passwordHash,
  });
  return user;
};

const findByEmail = async (email) => {
  return User.findOne({ email: email.toLowerCase().trim() });
};

const findById = async (id) => {
  return User.findById(id).select('-passwordHash');
};

const updatePasswordReset = async (userId, hashedToken, expiresAt) => {
  return User.findByIdAndUpdate(userId, {
    passwordResetToken: hashedToken,
    passwordResetExpires: expiresAt,
  });
};

const clearPasswordReset = async (userId) => {
  return User.findByIdAndUpdate(userId, {
    passwordResetToken: undefined,
    passwordResetExpires: undefined,
  });
};

const updatePassword = async (userId, passwordHash) => {
  return User.findByIdAndUpdate(userId, { passwordHash });
};

const updateName = async (userId, name) => {
  const user = await User.findByIdAndUpdate(userId, { name: name.trim() }, { new: true }).select('-passwordHash');
  return user;
};

const findByResetToken = async (hashedToken) => {
  return User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: new Date() },
  });
};

module.exports = {
  createUser,
  findByEmail,
  findById,
  updatePasswordReset,
  clearPasswordReset,
  updatePassword,
  updateName,
  findByResetToken,
};

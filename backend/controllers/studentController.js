const User = require('../models/User');

async function getProfile(request, response, next) {
  try { return response.status(200).json({ user: request.user }); } catch (error) { return next(error); }
}

async function updateProfile(request, response, next) {
  try {
    const { name, studentId } = request.body;
    const user = await User.findByIdAndUpdate(request.user._id, { name, studentId }, { new: true, runValidators: true }).select('-password');
    return response.status(200).json({ user });
  } catch (error) { return next(error); }
}

module.exports = { getProfile, updateProfile };

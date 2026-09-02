const { getPool } = require('../config/db');
const publicUser = (user) => ({ id: user.id, name: user.name, studentId: user.student_id || null, email: user.email, role: user.role, isApproved: Boolean(user.is_approved), profileImage: user.profile_image || null });

async function getProfile(request, response, next) {
  try { return response.status(200).json({ user: publicUser(request.user) }); } catch (error) { return next(error); }
}

async function updateProfile(request, response, next) {
  try {
    const { name, studentId, profileImage = null } = request.body;
    if (!name?.trim()) return response.status(400).json({ message: 'Name is required.' });
    if (profileImage && (typeof profileImage !== 'string' || !/^data:image\/(jpeg|png|webp);base64,/.test(profileImage) || profileImage.length > 1500000)) return response.status(400).json({ message: 'Choose a JPG, PNG, or WebP image smaller than 1 MB.' });
    await getPool().execute('UPDATE users SET name = ?, student_id = ?, profile_image = ? WHERE id = ?', [name.trim(), studentId?.trim() || null, profileImage || null, request.user.id]);
    const [users] = await getPool().execute('SELECT id, name, student_id, email, role, is_approved, profile_image FROM users WHERE id = ?', [request.user.id]);
    return response.status(200).json({ user: publicUser(users[0]) });
  } catch (error) { return next(error); }
}

module.exports = { getProfile, updateProfile };

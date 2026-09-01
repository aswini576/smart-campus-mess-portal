const { getPool } = require('../config/db');
const publicUser = (user) => ({ id: user.id, name: user.name, studentId: user.student_id || null, email: user.email, role: user.role, isApproved: Boolean(user.is_approved) });

async function getProfile(request, response, next) {
  try { return response.status(200).json({ user: publicUser(request.user) }); } catch (error) { return next(error); }
}

async function updateProfile(request, response, next) {
  try {
    const { name, studentId } = request.body;
    if (!name?.trim()) return response.status(400).json({ message: 'Name is required.' });
    await getPool().execute('UPDATE users SET name = ?, student_id = ? WHERE id = ?', [name.trim(), studentId?.trim() || null, request.user.id]);
    const [users] = await getPool().execute('SELECT id, name, student_id, email, role, is_approved FROM users WHERE id = ?', [request.user.id]);
    return response.status(200).json({ user: publicUser(users[0]) });
  } catch (error) { return next(error); }
}

module.exports = { getProfile, updateProfile };

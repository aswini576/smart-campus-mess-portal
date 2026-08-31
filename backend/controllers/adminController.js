const bcrypt = require('bcrypt');
const { getPool } = require('../config/db');

const roles = ['student', 'admin'];
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function listUsers(request, response, next) {
  try {
    if (request.query.role && !roles.includes(request.query.role)) return response.status(400).json({ message: 'Invalid user role.' });
    const sql = request.query.role ? 'SELECT id AS _id, id, name, student_id AS studentId, email, role, is_approved AS isApproved, created_at AS createdAt FROM users WHERE role = ? ORDER BY created_at DESC' : 'SELECT id AS _id, id, name, student_id AS studentId, email, role, is_approved AS isApproved, created_at AS createdAt FROM users ORDER BY created_at DESC';
    const [users] = await getPool().execute(sql, request.query.role ? [request.query.role] : []);
    return response.status(200).json({ users });
  } catch (error) { return next(error); }
}

async function createUser(request, response, next) {
  try {
    const { name, studentId, email, password, role } = request.body;
    if (!name?.trim() || !email || !password || !role) return response.status(400).json({ message: 'Name, email, password, and role are required.' });
    if (!roles.includes(role) || password.length < 8 || !emailPattern.test(email.trim())) return response.status(400).json({ message: 'Provide a valid email, role, and password of at least 8 characters.' });
    const [result] = await getPool().execute('INSERT INTO users (name, student_id, email, password, role, is_approved) VALUES (?, ?, ?, ?, ?, ?)', [name.trim(), studentId?.trim() || null, email.trim().toLowerCase(), await bcrypt.hash(password, 12), role, true]);
    return response.status(201).json({ user: { _id: result.insertId, id: result.insertId, name: name.trim(), studentId: studentId?.trim() || null, email: email.trim().toLowerCase(), role, isApproved: true } });
  } catch (error) { return next(error); }
}

async function setStudentApproval(request, response, next) {
  try {
    if (typeof request.body.isApproved !== 'boolean') return response.status(400).json({ message: 'Approval status must be true or false.' });
    const [result] = await getPool().execute("UPDATE users SET is_approved = ? WHERE id = ? AND role = 'student'", [request.body.isApproved, request.params.userId]);
    if (!result.affectedRows) return response.status(404).json({ message: 'Student account not found.' });
    return response.status(200).json({ message: request.body.isApproved ? 'Student account approved.' : 'Student account access blocked.' });
  } catch (error) { return next(error); }
}

async function updateUser(request, response, next) {
  try {
    const { name, studentId, email, role } = request.body;
    if (!name?.trim() || !email || !roles.includes(role) || !emailPattern.test(email.trim())) return response.status(400).json({ message: 'Provide a valid name, email, and role.' });
    const [result] = await getPool().execute('UPDATE users SET name = ?, student_id = ?, email = ?, role = ? WHERE id = ?', [name.trim(), studentId?.trim() || null, email.trim().toLowerCase(), role, request.params.userId]);
    if (!result.affectedRows) return response.status(404).json({ message: 'User not found.' });
    return response.status(200).json({ user: { _id: Number(request.params.userId), id: Number(request.params.userId), name: name.trim(), studentId: studentId?.trim() || null, email: email.trim().toLowerCase(), role } });
  } catch (error) { return next(error); }
}

async function deleteUser(request, response, next) {
  try {
    if (Number(request.params.userId) === Number(request.user.id)) return response.status(400).json({ message: 'You cannot delete your own account.' });
    const [result] = await getPool().execute('DELETE FROM users WHERE id = ?', [request.params.userId]);
    if (!result.affectedRows) return response.status(404).json({ message: 'User not found.' });
    return response.status(204).send();
  } catch (error) { return next(error); }
}

async function getAttendanceStats(_request, response, next) {
  try {
    const pool = getPool();
    const [[userCounts], [totals], [byMeal]] = await Promise.all([
      pool.query("SELECT COUNT(*) AS totalUsers, SUM(role = 'student') AS students FROM users"),
      pool.query('SELECT status AS _id, COUNT(*) AS count FROM orders GROUP BY status'),
      pool.query("SELECT m.meal_type AS _id, COUNT(*) AS count FROM orders o JOIN meals m ON m.id = o.meal_id WHERE o.status IN ('booked', 'attended') GROUP BY m.meal_type"),
    ]);
    return response.status(200).json({ totalUsers: userCounts[0].totalUsers, students: Number(userCounts[0].students || 0), totals, byMeal });
  } catch (error) { return next(error); }
}

module.exports = { listUsers, createUser, updateUser, deleteUser, setStudentApproval, getAttendanceStats };

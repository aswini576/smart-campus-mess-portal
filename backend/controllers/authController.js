const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { getPool } = require('../config/db');
const { jwtSecret } = require('../config/env');
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function createToken(user) { if (!jwtSecret) throw new Error('JWT_SECRET is not configured.'); return jwt.sign({ userId: user.id, role: user.role }, jwtSecret, { expiresIn: '7d', algorithm: 'HS256' }); }
function publicUser(user) { return { id: user.id, name: user.name, studentId: user.student_id || null, email: user.email, role: user.role, isApproved: Boolean(user.is_approved), profileImage: user.profile_image || null }; }
function authResponse(user) { return { token: createToken(user), user: publicUser(user) }; }

async function register(request, response, next) {
  try {
    return response.status(403).json({ message: 'Accounts can only be created by an administrator.' });
    const { name, studentId, email, password } = request.body;
    if (!name?.trim() || !email || !password) return response.status(400).json({ message: 'Name, email, and password are required.' });
    if (password.length < 8) return response.status(400).json({ message: 'Password must be at least 8 characters.' });
    const normalizedEmail = email.trim().toLowerCase();
    if (!emailPattern.test(normalizedEmail)) return response.status(400).json({ message: 'Enter a valid email address.' });
    const pool = getPool(); const [existing] = await pool.execute('SELECT id FROM users WHERE email = ? LIMIT 1', [normalizedEmail]);
    if (existing.length) return response.status(409).json({ message: 'An account with this email already exists.' });
    const passwordHash = await bcrypt.hash(password, 12);
    await pool.execute('INSERT INTO users (name, student_id, email, password, role, is_approved) VALUES (?, ?, ?, ?, ?, ?)', [name.trim(), studentId?.trim() || null, normalizedEmail, passwordHash, 'student', false]);
    return response.status(201).json({ message: 'Registration submitted. An administrator must approve your account before you can sign in.' });
  } catch (error) { return next(error); }
}

async function login(request, response, next) {
  try {
    const { email, password } = request.body;
    if (!email || !password || typeof email !== 'string' || typeof password !== 'string') return response.status(400).json({ message: 'Email or username and password are required.' });
    const identifier = email.trim();
    const [users] = await getPool().execute('SELECT id, name, student_id, email, password, role, is_approved, profile_image FROM users WHERE email = ? OR student_id = ? LIMIT 1', [identifier.toLowerCase(), identifier]);
    const user = users[0];
    if (!user || !(await bcrypt.compare(password, user.password))) return response.status(401).json({ message: 'Invalid email or password.' });
    if (user.role === 'student' && !user.is_approved) return response.status(403).json({ message: 'Your account is waiting for administrator approval.' });
    return response.status(200).json(authResponse(user));
  } catch (error) { return next(error); }
}

async function resetPassword(request, response, next) {
  try {
    const { email, password } = request.body;
    if (!email || !password || typeof email !== 'string' || typeof password !== 'string') return response.status(400).json({ message: 'Email and new password are required.' });
    if (password.length < 8) return response.status(400).json({ message: 'Password must be at least 8 characters.' });
    const normalizedEmail = email.trim().toLowerCase();
    if (!emailPattern.test(normalizedEmail)) return response.status(400).json({ message: 'Enter a valid email address.' });
    const passwordHash = await bcrypt.hash(password, 12);
    const [result] = await getPool().execute('UPDATE users SET password = ? WHERE email = ?', [passwordHash, normalizedEmail]);
    if (!result.affectedRows) return response.status(404).json({ message: 'No account found with this email address.' });
    return response.status(200).json({ message: 'Password reset successfully. You can sign in now.' });
  } catch (error) { return next(error); }
}

async function getCurrentUser(request, response) { return response.status(200).json({ user: publicUser(request.user) }); }
module.exports = { register, login, resetPassword, getCurrentUser };

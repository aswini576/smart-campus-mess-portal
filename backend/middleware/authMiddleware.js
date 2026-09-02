const jwt = require('jsonwebtoken');
const { getPool } = require('../config/db');
const { jwtSecret } = require('../config/env');

async function protect(request, response, next) {
  try {
    const authorization = request.headers.authorization || ''; const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : null;
    if (!token) return response.status(401).json({ message: 'Authentication token is required.' });
    if (!jwtSecret) return response.status(500).json({ message: 'JWT_SECRET is not configured.' });
    const payload = jwt.verify(token, jwtSecret, { algorithms: ['HS256'] });
    const [users] = await getPool().execute('SELECT id, name, student_id, email, role, is_approved, profile_image FROM users WHERE id = ? LIMIT 1', [payload.userId]);
    if (!users[0]) return response.status(401).json({ message: 'The account for this token no longer exists.' });
    if (users[0].role === 'student' && !users[0].is_approved) return response.status(403).json({ message: 'Your account is not approved by an administrator.' });
    request.user = users[0]; return next();
  } catch (_error) { return response.status(401).json({ message: 'Invalid or expired authentication token.' }); }
}
function authorize(...roles) { return (request, response, next) => !request.user || !roles.includes(request.user.role) ? response.status(403).json({ message: 'You do not have permission to access this resource.' }) : next(); }
module.exports = { protect, authorize };

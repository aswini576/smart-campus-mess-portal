const attempts = new Map();
const windowMs = 15 * 60 * 1000;
const maxAttempts = 10;

function authRateLimit(request, response, next) {
  const key = request.ip || request.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const entry = attempts.get(key);
  if (!entry || now - entry.startedAt >= windowMs) {
    attempts.set(key, { startedAt: now, count: 1 });
    return next();
  }
  if (entry.count >= maxAttempts) return response.status(429).json({ message: 'Too many authentication attempts. Try again in 15 minutes.' });
  entry.count += 1;
  return next();
}

module.exports = authRateLimit;

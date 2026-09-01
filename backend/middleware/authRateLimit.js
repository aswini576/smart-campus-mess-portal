const attempts = new Map();
const windowMs = 15 * 60 * 1000;
const maxAttempts = 10;
const { nodeEnv } = require('../config/env');

function authRateLimit(request, response, next) {
  // Local development frequently retries requests while the UI/server reloads.
  // Keep brute-force protection enabled in deployed environments only.
  if (nodeEnv === 'development') return next();

  const address = request.ip || request.socket.remoteAddress || 'unknown';
  const key = `${address}:${request.path}`;
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

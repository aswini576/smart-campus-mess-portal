function errorHandler(error, _request, response, _next) {
  if (error instanceof SyntaxError && error.status === 400 && 'body' in error) return response.status(400).json({ message: 'Request body must be valid JSON.' });
  if (error.name === 'ValidationError') return response.status(400).json({ message: Object.values(error.errors).map((item) => item.message).join(' ') });
  if (error.name === 'CastError') return response.status(400).json({ message: `Invalid ${error.path}.` });
  if (error.code === 11000) return response.status(409).json({ message: 'A record with that value already exists.' });
  if (error.code === 'ER_DUP_ENTRY') return response.status(409).json({ message: 'A record with that value already exists.' });
  const status = error.statusCode || 500;
  const message = status >= 500 && process.env.NODE_ENV === 'production' ? 'Internal server error.' : (error.message || 'Internal server error.');
  return response.status(status).json({ message });
}
module.exports = errorHandler;

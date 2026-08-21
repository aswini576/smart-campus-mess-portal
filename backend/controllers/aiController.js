const { generateDailySuggestions, getLatestSuggestion } = require('../services/aiSuggestionService');
async function runDailyLock(request, response, next) { try { const suggestion = await generateDailySuggestions(request.body.date || new Date()); return response.status(200).json(suggestion.response); } catch (error) { return next(error); } }
async function getLatest(_request, response, next) { try { const suggestion = await getLatestSuggestion(); return response.status(200).json({ suggestion }); } catch (error) { return next(error); } }
module.exports = { runDailyLock, getLatest };

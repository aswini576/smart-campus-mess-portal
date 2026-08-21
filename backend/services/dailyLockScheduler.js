const { dailyLockTime } = require('../config/env');
const { generateDailySuggestions } = require('./aiSuggestionService');

function startDailyLockScheduler() {
  const [hours, minutes] = String(dailyLockTime || '20:00').split(':').map(Number);
  if (!Number.isInteger(hours) || !Number.isInteger(minutes) || hours > 23 || minutes > 59) throw new Error('DAILY_LOCK_TIME must use HH:MM format.');

  const scheduleNextLock = () => {
    const now = new Date();
    const nextLock = new Date(now);
    nextLock.setHours(hours, minutes, 0, 0);
    if (nextLock <= now) nextLock.setDate(nextLock.getDate() + 1);

    setTimeout(async () => {
      try {
        const result = await generateDailySuggestions(new Date());
        console.log(`Daily local AI suggestion generated: ${JSON.stringify(result.response)}`);
      } catch (error) {
        console.error(`Daily lock suggestion failed: ${error.message}`);
      } finally {
        scheduleNextLock();
      }
    }, nextLock - now);
  };

  scheduleNextLock();
}
module.exports = startDailyLockScheduler;

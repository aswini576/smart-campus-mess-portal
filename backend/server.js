const app = require('./app');
const { port } = require('./config/env');
const { connectDB } = require('./config/db');
const startDailyLockScheduler = require('./services/dailyLockScheduler');

async function startServer() {
  await connectDB();
  startDailyLockScheduler();
  app.listen(port, () => console.log(`Server listening on port ${port}`));
}

startServer().catch((error) => {
  console.error(`Unable to start server: ${error.message}`);
  process.exit(1);
});

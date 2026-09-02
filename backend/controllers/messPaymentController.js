const { getPool } = require('../config/db');

const weekPattern = /^\d{4}-\d{2}-\d{2}$/;

async function calculatedWeeks(pool) {
  const [rows] = await pool.query(`SELECT DATE_FORMAT(DATE_SUB(DATE(m.meal_date), INTERVAL WEEKDAY(m.meal_date) DAY), '%Y-%m-%d') AS weekStart,
    SUM(CASE WHEN o.id IS NOT NULL THEN m.original_cost ELSE 0 END) AS payableAmount
    FROM meals m LEFT JOIN orders o ON o.meal_id = m.id AND o.status <> 'cancelled'
    GROUP BY DATE_FORMAT(DATE_SUB(DATE(m.meal_date), INTERVAL WEEKDAY(m.meal_date) DAY), '%Y-%m-%d')
    ORDER BY weekStart DESC`);
  return rows;
}

async function getMessPayments(_request, response, next) {
  try {
    const pool = getPool(); const [weeks, [saved], [hidden]] = await Promise.all([calculatedWeeks(pool), pool.query('SELECT id AS _id, DATE_FORMAT(week_start, \'%Y-%m-%d\') AS weekStart, payable_amount AS payableAmount, status, payment_date AS paymentDate FROM mess_payments WHERE is_hidden = FALSE ORDER BY week_start DESC'), pool.query("SELECT DATE_FORMAT(week_start, '%Y-%m-%d') AS weekStart FROM mess_payments WHERE is_hidden = TRUE")]);
    const hiddenWeeks = new Set(hidden.map((item) => item.weekStart));
    const records = new Map(saved.map((item) => [item.weekStart, item]));
    weeks.forEach((week) => { if (hiddenWeeks.has(week.weekStart)) return; if (!records.has(week.weekStart)) records.set(week.weekStart, { _id: `week-${week.weekStart}`, weekStart: week.weekStart, payableAmount: week.payableAmount, status: 'pending', paymentDate: null }); else if (records.get(week.weekStart).status === 'pending') records.get(week.weekStart).payableAmount = week.payableAmount; });
    return response.json({ payments: [...records.values()].sort((a, b) => b.weekStart.localeCompare(a.weekStart)) });
  } catch (error) { return next(error); }
}

async function markMessPaymentPaid(request, response, next) {
  try {
    const { weekStart } = request.body;
    if (!weekPattern.test(weekStart || '')) return response.status(400).json({ message: 'A valid week is required.' });
    const start = new Date(`${weekStart}T00:00:00`); const end = new Date(start); end.setDate(end.getDate() + 7);
    if (Number.isNaN(start.getTime()) || start.getDay() !== 1) return response.status(400).json({ message: 'Week must start on a Monday.' });
    const [rows] = await getPool().execute(`SELECT SUM(m.original_cost) AS payableAmount FROM orders o
      JOIN meals m ON m.id = o.meal_id WHERE o.status <> 'cancelled' AND m.meal_date >= ? AND m.meal_date < ?`, [start, end]);
    const payableAmount = Number(rows[0].payableAmount || 0);
    await getPool().execute(`INSERT INTO mess_payments (week_start, payable_amount, status, payment_date)
      VALUES (?, ?, 'paid', CURRENT_TIMESTAMP) ON DUPLICATE KEY UPDATE payable_amount = VALUES(payable_amount), status = 'paid', payment_date = CURRENT_TIMESTAMP, is_hidden = FALSE`, [weekStart, payableAmount]);
    const [payments] = await getPool().execute("SELECT id AS _id, DATE_FORMAT(week_start, '%Y-%m-%d') AS weekStart, payable_amount AS payableAmount, status, payment_date AS paymentDate FROM mess_payments WHERE week_start = ?", [weekStart]);
    return response.json({ payment: payments[0], message: 'Mess payment marked as paid.' });
  } catch (error) { return next(error); }
}

async function deleteMessPayment(request, response, next) {
  try {
    const { weekStart } = request.params;
    if (!weekPattern.test(weekStart || '')) return response.status(400).json({ message: 'A valid week is required.' });
    await getPool().execute(`INSERT INTO mess_payments (week_start, payable_amount, status, is_hidden)
      VALUES (?, 0, 'pending', TRUE) ON DUPLICATE KEY UPDATE is_hidden = TRUE`, [weekStart]);
    return response.status(204).send();
  } catch (error) { return next(error); }
}

module.exports = { getMessPayments, markMessPaymentPaid, deleteMessPayment };

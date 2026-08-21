const { getPool } = require('../config/db');

const periodDays = { daily: 1, weekly: 7, monthly: 30 };
const dayKey = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

async function getChiefOverview(request, response, next) {
  try {
    const date = request.query.date ? new Date(request.query.date) : new Date();
    if (Number.isNaN(date.getTime())) return response.status(400).json({ message: 'date must be valid.' });
    date.setHours(0, 0, 0, 0); const end = new Date(date); end.setDate(end.getDate() + 1);
    const [requirements] = await getPool().execute(`SELECT m.id AS mealId, m.meal_type AS mealType,
      m.food_name AS foodName, COUNT(o.id) AS requiredPortions,
      COUNT(o.id) AS expectedStudents FROM meals m
      LEFT JOIN orders o ON o.meal_id = m.id AND o.status IN ('booked', 'attended')
      WHERE m.meal_date >= ? AND m.meal_date < ? GROUP BY m.id ORDER BY m.meal_type`, [date, end]);
    const [students] = await getPool().execute(`SELECT COUNT(DISTINCT o.student_id) AS count FROM orders o
      JOIN meals m ON m.id = o.meal_id WHERE m.meal_date >= ? AND m.meal_date < ?
      AND o.status IN ('booked', 'attended')`, [date, end]);
    return response.status(200).json({ date, expectedStudentCount: students[0].count, totalMealBookings: requirements.reduce((sum, item) => sum + item.expectedStudents, 0), dailyMealRequirements: requirements });
  } catch (error) { return next(error); }
}

async function getAnalytics(request, response, next) {
  try {
    if (request.query.period && !periodDays[request.query.period]) return response.status(400).json({ message: 'period must be daily, weekly, or monthly.' });
    const period = request.query.period || 'weekly'; const days = periodDays[period];
    const end = new Date(); end.setHours(0, 0, 0, 0); end.setDate(end.getDate() + 1);
    const start = new Date(end); start.setDate(start.getDate() - days);
    const [attendance] = await getPool().execute(`SELECT DATE_FORMAT(m.meal_date, '%Y-%m-%d') AS date,
      m.meal_type AS mealType, COUNT(o.id) AS count FROM meals m
      LEFT JOIN orders o ON o.meal_id = m.id AND o.status IN ('booked', 'attended')
      WHERE m.meal_date >= ? AND m.meal_date < ? GROUP BY DATE_FORMAT(m.meal_date, '%Y-%m-%d'), m.meal_type`, [start, end]);
    const [mealDemand] = await getPool().execute(`SELECT m.meal_type AS meal_type, COUNT(o.id) AS count
      FROM orders o JOIN meals m ON m.id = o.meal_id WHERE m.meal_date >= ? AND m.meal_date < ?
      AND o.status IN ('booked', 'attended') GROUP BY m.meal_type ORDER BY count DESC`, [start, end]);
    const series = Array.from({ length: days }, (_, index) => { const date = new Date(start); date.setDate(date.getDate() + index); return { date: dayKey(date), attendance: 0, demand: 0, waste_kg: 0, inventory_used: 0 }; });
    const byDate = new Map(series.map((entry) => [entry.date, entry]));
    attendance.forEach((entry) => { const item = byDate.get(entry.date); if (item) { item.attendance += entry.count; item.demand += entry.count; } });
    const totalAttendance = series.reduce((sum, item) => sum + item.attendance, 0);
    return response.status(200).json({ period, summary: { attendance: totalAttendance, demand: totalAttendance, waste_kg: 0, waste_reduction_percent: 0, inventory_used: 0 }, series, meal_demand: mealDemand, inventory_usage: [] });
  } catch (error) { return next(error); }
}

module.exports = { getChiefOverview, getAnalytics };

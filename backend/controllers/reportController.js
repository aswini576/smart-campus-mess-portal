const { getPool } = require('../config/db');

const periodDays = { daily: 1, weekly: 7, monthly: 30 };
const round = (value) => Math.round(Number(value) * 100) / 100;
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
    const [dailyOrders] = await getPool().execute(`SELECT DATE_FORMAT(m.meal_date, '%Y-%m-%d') AS date,
      COUNT(o.id) AS totalFoodOrders,
      SUM(CASE WHEN o.received_at IS NOT NULL THEN 1 ELSE 0 END) AS foodReceived,
      SUM(CASE WHEN o.id IS NOT NULL AND o.received_at IS NULL THEN 1 ELSE 0 END) AS foodNotReceived,
      SUM(CASE WHEN o.id IS NOT NULL AND o.received_at IS NULL AND TIMESTAMP(DATE(m.meal_date), CASE m.meal_type
        WHEN 'breakfast' THEN '09:00:00' WHEN 'lunch' THEN '14:00:00' WHEN 'snack' THEN '17:00:00'
        WHEN 'dinner' THEN '20:00:00' ELSE '14:00:00' END) <= NOW() THEN 1 ELSE 0 END) AS uncollectedMeals,
      SUM(CASE WHEN o.id IS NOT NULL AND o.received_at IS NULL AND TIMESTAMP(DATE(m.meal_date), CASE m.meal_type
        WHEN 'breakfast' THEN '09:00:00' WHEN 'lunch' THEN '14:00:00' WHEN 'snack' THEN '17:00:00'
        WHEN 'dinner' THEN '20:00:00' ELSE '14:00:00' END) <= NOW() THEN m.price ELSE 0 END) AS wastedFoodCost
      FROM meals m LEFT JOIN orders o ON o.meal_id = m.id AND o.status <> 'cancelled'
      WHERE m.meal_date >= ? AND m.meal_date < ? GROUP BY DATE_FORMAT(m.meal_date, '%Y-%m-%d')`, [start, end]);
    const [mealDemand] = await getPool().execute(`SELECT m.meal_type AS meal_type, COUNT(o.id) AS count
      FROM orders o JOIN meals m ON m.id = o.meal_id WHERE m.meal_date >= ? AND m.meal_date < ?
      AND o.status IN ('booked', 'attended') GROUP BY m.meal_type ORDER BY count DESC`, [start, end]);
    const [inventoryByDay] = await getPool().execute(`SELECT DATE_FORMAT(used_at, '%Y-%m-%d') AS date,
      SUM(quantity) AS quantity FROM inventory_usage WHERE used_at >= ? AND used_at < ?
      GROUP BY DATE_FORMAT(used_at, '%Y-%m-%d')`, [start, end]);
    const [inventoryUsage] = await getPool().execute(`SELECT item_name AS item, SUM(quantity) AS quantity,
      MAX(unit) AS unit FROM inventory_usage WHERE used_at >= ? AND used_at < ?
      GROUP BY item_name ORDER BY quantity DESC LIMIT 10`, [start, end]);
    const series = Array.from({ length: days }, (_, index) => { const date = new Date(start); date.setDate(date.getDate() + index); return { date: dayKey(date), total_food_orders: 0, food_received: 0, food_not_received: 0, uncollected_meals: 0, wasted_food_cost: 0, attendance: 0, demand: 0, inventory_used: 0 }; });
    const byDate = new Map(series.map((entry) => [entry.date, entry]));
    dailyOrders.forEach((entry) => { const item = byDate.get(entry.date); if (item) { item.total_food_orders = Number(entry.totalFoodOrders); item.food_received = Number(entry.foodReceived); item.food_not_received = Number(entry.foodNotReceived); item.uncollected_meals = Number(entry.uncollectedMeals); item.wasted_food_cost = round(entry.wastedFoodCost); item.attendance = item.food_received; item.demand = item.total_food_orders; } });
    inventoryByDay.forEach((entry) => { const item = byDate.get(entry.date); if (item) item.inventory_used = Number(entry.quantity); });
    const totalOrders = series.reduce((sum, item) => sum + item.total_food_orders, 0);
    const totalReceived = series.reduce((sum, item) => sum + item.food_received, 0);
    const totalNotReceived = series.reduce((sum, item) => sum + item.food_not_received, 0);
    const uncollectedMeals = series.reduce((sum, item) => sum + item.uncollected_meals, 0);
    const wastedFoodCost = round(series.reduce((sum, item) => sum + item.wasted_food_cost, 0));
    const totalInventory = round(series.reduce((sum, item) => sum + item.inventory_used, 0));
    return response.status(200).json({ period, summary: { total_food_orders: totalOrders, food_received: totalReceived, food_not_received: totalNotReceived, uncollected_meals: uncollectedMeals, wasted_food_cost: wastedFoodCost, attendance: totalReceived, demand: totalOrders, inventory_used: totalInventory }, series, meal_demand: mealDemand, inventory_usage: inventoryUsage });
  } catch (error) { return next(error); }
}

async function getOriginalFoodCostReport(_request, response, next) {
  try {
    const [foods] = await getPool().query(`SELECT m.id AS _id, m.food_name AS foodName,
      m.food_category AS foodCategory, m.meal_type AS mealType, m.meal_date AS mealDate,
      m.original_cost AS originalCost, m.mess_payment_amount AS messPaymentAmount,
      COUNT(o.id) AS orderCount, m.original_cost * COUNT(o.id) AS totalOriginalFoodCost
      FROM meals m LEFT JOIN orders o ON o.meal_id = m.id AND o.status <> 'cancelled'
      GROUP BY m.id ORDER BY m.meal_date DESC, m.meal_type, m.food_category`);
    const summary = foods.reduce((totals, food) => ({
      totalOriginalFoodCost: totals.totalOriginalFoodCost + Number(food.totalOriginalFoodCost || 0),
      totalMessPaymentAmount: totals.totalMessPaymentAmount + Number(food.messPaymentAmount || 0),
    }), { totalOriginalFoodCost: 0, totalMessPaymentAmount: 0 });
    return response.json({ foods, summary });
  } catch (error) { return next(error); }
}

async function getStudentPaymentReport(_request, response, next) {
  try {
    const [students] = await getPool().query(`SELECT u.id AS _id, u.name AS studentName,
      u.student_id AS studentId, u.email AS studentEmail, SUM(m.price) AS totalAmount,
      SUM(LEAST(o.paid_amount, m.price)) AS amountPaid,
      SUM(GREATEST(m.price - o.paid_amount, 0)) AS balance,
      MAX(o.payment_date) AS paymentDate
      FROM users u JOIN orders o ON o.student_id = u.id AND o.status <> 'cancelled'
      JOIN meals m ON m.id = o.meal_id WHERE u.role = 'student' GROUP BY u.id ORDER BY u.name`);
    return response.json({ students: students.map((student) => ({ ...student, status: Number(student.balance) === 0 ? 'paid' : 'pending' })) });
  } catch (error) { return next(error); }
}

module.exports = { getChiefOverview, getAnalytics, getOriginalFoodCostReport, getStudentPaymentReport };

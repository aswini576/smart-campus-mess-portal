const { getPool } = require('../config/db');

const paymentSelect = `SELECT o.id AS _id, o.payment_status AS paymentStatus,
  o.status AS bookingStatus, o.booking_time AS bookingTime,
  m.food_name AS foodName, m.meal_type AS mealType, m.meal_date AS mealDate,
  m.price, u.name AS studentName, u.email AS studentEmail
  FROM orders o JOIN meals m ON m.id = o.meal_id JOIN users u ON u.id = o.student_id`;

async function getMyPayments(request, response, next) {
  try { const [payments] = await getPool().execute(`${paymentSelect} WHERE o.student_id = ? ORDER BY m.meal_date DESC`, [request.user.id]); return response.json({ payments }); } catch (error) { return next(error); }
}

async function getPayments(_request, response, next) {
  try { const [payments] = await getPool().query(`${paymentSelect} ORDER BY m.meal_date DESC, u.name`); return response.json({ payments }); } catch (error) { return next(error); }
}

async function updatePaymentStatus(request, response, next) {
  try {
    const { status } = request.body;
    if (!['paid', 'unpaid'].includes(status)) return response.status(400).json({ message: 'Payment status must be paid or unpaid.' });
    const [result] = await getPool().execute('UPDATE orders SET payment_status = ? WHERE id = ?', [status, request.params.orderId]);
    if (!result.affectedRows) return response.status(404).json({ message: 'Meal booking not found.' });
    return response.json({ message: `Payment marked as ${status}.`, paymentStatus: status });
  } catch (error) { return next(error); }
}

module.exports = { getMyPayments, getPayments, updatePaymentStatus };

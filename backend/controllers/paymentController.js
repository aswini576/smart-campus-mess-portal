const { getPool } = require('../config/db');

const paymentSelect = `SELECT o.id AS _id,
  CASE WHEN GREATEST(m.price - o.paid_amount, 0) = 0 THEN 'paid' ELSE 'pending' END AS paymentStatus,
  m.price AS totalAmount, LEAST(o.paid_amount, m.price) AS paidAmount,
  GREATEST(m.price - o.paid_amount, 0) AS balance, o.payment_date AS paymentDate,
  o.status AS bookingStatus, o.booking_time AS bookingTime,
  m.food_name AS foodName, m.meal_type AS mealType, m.meal_date AS mealDate,
  o.received_at AS receivedAt, o.wasted_at AS wastedAt,
  m.price, u.name AS studentName, u.email AS studentEmail
  FROM orders o JOIN meals m ON m.id = o.meal_id JOIN users u ON u.id = o.student_id`;

async function getMyPayments(request, response, next) {
  try { const [payments] = await getPool().execute(`${paymentSelect} WHERE o.student_id = ? AND o.status <> 'cancelled' ORDER BY m.meal_date DESC`, [request.user.id]); return response.json({ payments }); } catch (error) { return next(error); }
}

async function getPayments(_request, response, next) {
  try { const [payments] = await getPool().query(`${paymentSelect} WHERE o.status <> 'cancelled' ORDER BY m.meal_date DESC, u.name`); return response.json({ payments }); } catch (error) { return next(error); }
}

async function updatePaymentStatus(request, response, next) {
  try {
    const [orders] = await getPool().execute('SELECT m.price, o.status FROM orders o JOIN meals m ON m.id = o.meal_id WHERE o.id = ?', [request.params.orderId]);
    if (!orders[0]) return response.status(404).json({ message: 'Meal booking not found.' });
    if (orders[0].status === 'cancelled') return response.status(400).json({ message: 'A cancelled meal has no payment amount.' });
    const totalAmount = Number(orders[0].price);
    const paidAmount = request.body.paidAmount === undefined
      ? (request.body.status === 'paid' ? totalAmount : 0)
      : Number(request.body.paidAmount);
    if (!Number.isFinite(paidAmount) || paidAmount < 0 || paidAmount > totalAmount) {
      return response.status(400).json({ message: `Paid amount must be between 0 and ${totalAmount.toFixed(2)}.` });
    }
    const balance = Math.max(0, totalAmount - paidAmount);
    const status = balance === 0 ? 'paid' : 'unpaid';
    const [result] = await getPool().execute(
      'UPDATE orders SET paid_amount = ?, payment_status = ?, payment_date = CASE WHEN ? > 0 THEN CURRENT_TIMESTAMP ELSE NULL END WHERE id = ?',
      [paidAmount, status, paidAmount, request.params.orderId],
    );
    if (!result.affectedRows) return response.status(404).json({ message: 'Meal booking not found.' });
    return response.json({ message: 'Payment updated successfully.', totalAmount, paidAmount, balance, paymentStatus: balance === 0 ? 'paid' : 'pending' });
  } catch (error) { return next(error); }
}

async function deleteOrder(request, response, next) {
  try {
    const [result] = await getPool().execute('DELETE FROM orders WHERE id = ?', [request.params.orderId]);
    if (!result.affectedRows) return response.status(404).json({ message: 'Order record not found.' });
    return response.status(204).send();
  } catch (error) { return next(error); }
}

module.exports = { getMyPayments, getPayments, updatePaymentStatus, deleteOrder };

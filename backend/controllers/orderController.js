const { getPool } = require('../config/db');

const orderSelect = `SELECT o.id AS _id, o.status, o.booking_time AS bookingTime,
  m.id AS mealIdValue, m.meal_type AS mealType, m.food_name AS foodName,
  m.meal_date AS mealDate, m.booking_deadline AS bookingDeadline
  FROM orders o LEFT JOIN meals m ON m.id = o.meal_id`;

function presentOrder(row) {
  return { _id: row._id, status: row.status, bookingTime: row.bookingTime, mealId: row.mealIdValue ? { _id: row.mealIdValue, mealType: row.mealType, foodName: row.foodName, date: row.mealDate, bookingDeadline: row.bookingDeadline } : null };
}

async function bookMeal(request, response, next) {
  try {
    const mealId = Number(request.body.mealId);
    if (!Number.isInteger(mealId) || mealId < 1) return response.status(400).json({ message: 'A valid meal is required.' });
    const pool = getPool();
    const [meals] = await pool.execute('SELECT id, is_available AS isAvailable, booking_deadline AS bookingDeadline FROM meals WHERE id = ? LIMIT 1', [mealId]);
    const meal = meals[0];
    if (!meal) return response.status(404).json({ message: 'Meal not found.' });
    if (!meal.isAvailable) return response.status(400).json({ message: 'This meal is not currently available for booking.' });
    if (new Date() > new Date(meal.bookingDeadline)) return response.status(400).json({ message: 'The booking deadline has passed.' });
    const [existing] = await pool.execute('SELECT id, status FROM orders WHERE student_id = ? AND meal_id = ? LIMIT 1', [request.user.id, mealId]);
    if (existing[0] && existing[0].status !== 'cancelled') return response.status(409).json({ message: 'You have already confirmed this meal.' });
    let orderId;
    if (existing[0]) { orderId = existing[0].id; await pool.execute("UPDATE orders SET status = 'booked', booking_time = CURRENT_TIMESTAMP WHERE id = ?", [orderId]); }
    else { const [result] = await pool.execute('INSERT INTO orders (student_id, meal_id) VALUES (?, ?)', [request.user.id, mealId]); orderId = result.insertId; }
    const [rows] = await pool.execute(`${orderSelect} WHERE o.id = ?`, [orderId]);
    return response.status(201).json({ order: presentOrder(rows[0]) });
  } catch (error) { return next(error); }
}

async function cancelBooking(request, response, next) {
  try {
    const [rows] = await getPool().execute(`${orderSelect} WHERE o.id = ? AND o.student_id = ?`, [request.params.orderId, request.user.id]);
    const order = rows[0];
    if (!order) return response.status(404).json({ message: 'Booking not found.' });
    if (new Date() > new Date(order.bookingDeadline)) return response.status(400).json({ message: 'The opt-out deadline has passed.' });
    await getPool().execute("UPDATE orders SET status = 'cancelled' WHERE id = ?", [request.params.orderId]);
    order.status = 'cancelled';
    return response.status(200).json({ order: presentOrder(order) });
  } catch (error) { return next(error); }
}

async function getOrderHistory(request, response, next) {
  try { const [rows] = await getPool().execute(`${orderSelect} WHERE o.student_id = ? ORDER BY o.booking_time DESC`, [request.user.id]); return response.status(200).json({ orders: rows.map(presentOrder) }); } catch (error) { return next(error); }
}

const offerSelect = `SELECT om.id AS _id, om.status, om.offered_time AS offeredTime,
  om.claimed_time AS claimedTime, om.expiry_time AS expiryTime,
  m.meal_date AS mealDate, m.meal_type AS mealType, o.id AS orderIdValue,
  m.id AS mealIdValue, m.food_name AS foodName
  FROM offered_meals om JOIN orders o ON o.id = om.order_id JOIN meals m ON m.id = o.meal_id`;

function presentOffer(row) {
  return { _id: row._id, status: row.status, offeredTime: row.offeredTime, claimedTime: row.claimedTime, expiryTime: row.expiryTime, mealDate: row.mealDate, mealType: row.mealType, orderId: { _id: row.orderIdValue, mealId: { _id: row.mealIdValue, foodName: row.foodName, mealType: row.mealType, date: row.mealDate } } };
}

async function offerMeal(request, response, next) {
  try {
    const orderId = Number(request.body.orderId);
    if (!Number.isInteger(orderId) || orderId < 1) return response.status(400).json({ message: 'A valid confirmed booking is required.' });
    const pool = getPool();
    const [orders] = await pool.execute(`SELECT o.id, o.status, m.booking_deadline AS bookingDeadline
      FROM orders o JOIN meals m ON m.id = o.meal_id WHERE o.id = ? AND o.student_id = ?`, [orderId, request.user.id]);
    const order = orders[0];
    if (!order || order.status !== 'booked') return response.status(404).json({ message: 'Confirmed booking not found.' });
    const now = new Date(); const deadline = new Date(order.bookingDeadline);
    if (now >= deadline) return response.status(400).json({ message: 'The recovery deadline has passed.' });
    let expiry = request.body.expiryTime ? new Date(request.body.expiryTime) : deadline;
    if (Number.isNaN(expiry.getTime()) || expiry <= now) return response.status(400).json({ message: 'Expiry time must be in the future.' });
    if (expiry > deadline) expiry = deadline;
    await pool.execute(`INSERT INTO offered_meals (order_id, original_student_id, status, offered_time, expiry_time)
      VALUES (?, ?, 'offered', NOW(), ?) ON DUPLICATE KEY UPDATE original_student_id = VALUES(original_student_id),
      claimed_student_id = NULL, status = 'offered', offered_time = NOW(), claimed_time = NULL, expiry_time = VALUES(expiry_time)`, [orderId, request.user.id, expiry]);
    const [rows] = await pool.execute(`${offerSelect} WHERE om.order_id = ?`, [orderId]);
    return response.status(201).json({ offeredMeal: presentOffer(rows[0]) });
  } catch (error) { return next(error); }
}

async function expireOffers(pool) {
  await pool.query("UPDATE offered_meals SET status = 'expired' WHERE status = 'offered' AND expiry_time <= NOW()");
}

async function getAvailableMeals(request, response, next) {
  try { const pool = getPool(); await expireOffers(pool); const [rows] = await pool.execute(`${offerSelect} WHERE om.status = 'offered' AND om.expiry_time > NOW() AND om.original_student_id <> ? ORDER BY om.expiry_time`, [request.user.id]); return response.json({ offeredMeals: rows.map(presentOffer) }); } catch (error) { return next(error); }
}

async function claimMeal(request, response, next) {
  const connection = await getPool().getConnection();
  try {
    const offeredMealId = Number(request.body.offeredMealId);
    if (!Number.isInteger(offeredMealId) || offeredMealId < 1) return response.status(400).json({ message: 'A valid offered meal is required.' });
    await connection.beginTransaction();
    const [offers] = await connection.execute(`SELECT om.id, om.order_id AS orderId, om.original_student_id AS originalStudentId,
      om.status, om.expiry_time AS expiryTime, o.meal_id AS mealId FROM offered_meals om
      JOIN orders o ON o.id = om.order_id WHERE om.id = ? FOR UPDATE`, [offeredMealId]);
    const offer = offers[0];
    if (!offer || offer.status !== 'offered') { await connection.rollback(); return response.status(409).json({ message: 'This offered meal is no longer available.' }); }
    if (new Date() >= new Date(offer.expiryTime)) { await connection.execute("UPDATE offered_meals SET status = 'expired' WHERE id = ?", [offeredMealId]); await connection.commit(); return response.status(400).json({ message: 'This offered meal has expired.' }); }
    if (Number(offer.originalStudentId) === Number(request.user.id)) { await connection.rollback(); return response.status(400).json({ message: 'You cannot claim your own offered meal.' }); }
    const [duplicates] = await connection.execute('SELECT id, status FROM orders WHERE student_id = ? AND meal_id = ? LIMIT 1', [request.user.id, offer.mealId]);
    if (duplicates[0] && duplicates[0].status !== 'cancelled') { await connection.rollback(); return response.status(409).json({ message: 'You already have a booking for this meal.' }); }
    if (duplicates[0]) await connection.execute('DELETE FROM orders WHERE id = ?', [duplicates[0].id]);
    await connection.execute("UPDATE orders SET student_id = ?, payment_status = 'unpaid' WHERE id = ?", [request.user.id, offer.orderId]);
    await connection.execute("UPDATE offered_meals SET claimed_student_id = ?, claimed_time = NOW(), status = 'claimed' WHERE id = ?", [request.user.id, offeredMealId]);
    await connection.commit();
    const [rows] = await getPool().execute(`${offerSelect} WHERE om.id = ?`, [offeredMealId]);
    return response.json({ offeredMeal: presentOffer(rows[0]), message: 'Meal ownership transferred successfully.' });
  } catch (error) { await connection.rollback(); return next(error); } finally { connection.release(); }
}

async function getOfferedMeals(request, response, next) {
  try { const pool = getPool(); await expireOffers(pool); const [rows] = await pool.execute(`${offerSelect} WHERE om.original_student_id = ? ORDER BY om.offered_time DESC`, [request.user.id]); return response.json({ offeredMeals: rows.map(presentOffer) }); } catch (error) { return next(error); }
}

async function getClaimedMeals(request, response, next) {
  try { const [rows] = await getPool().execute(`${offerSelect} WHERE om.claimed_student_id = ? AND om.status = 'claimed' ORDER BY om.claimed_time DESC`, [request.user.id]); return response.json({ claimedMeals: rows.map(presentOffer) }); } catch (error) { return next(error); }
}

module.exports = {
  bookMeal,
  cancelBooking,
  getOrderHistory,
  offerMeal,
  getAvailableMeals,
  claimMeal,
  getOfferedMeals,
  getClaimedMeals,
};

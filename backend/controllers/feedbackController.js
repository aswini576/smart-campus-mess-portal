const { getPool } = require('../config/db');

const feedbackSelect = `SELECT f.id AS _id, f.rating, f.comment, f.created_at AS createdAt,
  f.updated_at AS updatedAt, m.id AS mealIdValue, m.food_name AS foodName,
  m.meal_type AS mealType, m.meal_date AS mealDate,
  u.id AS studentIdValue, u.name AS studentName, u.student_id AS campusStudentId
  FROM feedback f JOIN meals m ON m.id = f.meal_id JOIN users u ON u.id = f.student_id`;

function presentFeedback(row) {
  return {
    _id: row._id,
    rating: Number(row.rating),
    comment: row.comment,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    mealId: { _id: row.mealIdValue, foodName: row.foodName, mealType: row.mealType, date: row.mealDate },
    studentId: { _id: row.studentIdValue, name: row.studentName, studentId: row.campusStudentId },
  };
}

async function createFeedback(request, response, next) {
  try {
    const mealId = Number(request.body.mealId);
    const rating = Number(request.body.rating);
    const comment = typeof request.body.comment === 'string' ? request.body.comment.trim() : '';
    if (!Number.isInteger(mealId) || mealId < 1) return response.status(400).json({ message: 'Select a valid confirmed meal.' });
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) return response.status(400).json({ message: 'Rating must be between 1 and 5.' });
    if (comment.length > 1000) return response.status(400).json({ message: 'Comment must be 1000 characters or fewer.' });
    const pool = getPool();
    const [orders] = await pool.execute("SELECT id FROM orders WHERE student_id = ? AND meal_id = ? AND status IN ('booked', 'attended') LIMIT 1", [request.user.id, mealId]);
    if (!orders[0]) return response.status(400).json({ message: 'Feedback can only be submitted for a confirmed meal.' });
    await pool.execute(`INSERT INTO feedback (student_id, meal_id, rating, comment) VALUES (?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE rating = VALUES(rating), comment = VALUES(comment), updated_at = CURRENT_TIMESTAMP`, [request.user.id, mealId, rating, comment]);
    const [rows] = await pool.execute(`${feedbackSelect} WHERE f.student_id = ? AND f.meal_id = ?`, [request.user.id, mealId]);
    return response.status(201).json({ feedback: presentFeedback(rows[0]) });
  } catch (error) { return next(error); }
}

async function getMyFeedback(request, response, next) {
  try {
    const [rows] = await getPool().execute(`${feedbackSelect} WHERE f.student_id = ? ORDER BY f.created_at DESC`, [request.user.id]);
    return response.status(200).json({ feedback: rows.map(presentFeedback) });
  } catch (error) { return next(error); }
}

async function getFeedbackForChief(_request, response, next) {
  try {
    const [rows] = await getPool().query(`${feedbackSelect} ORDER BY f.created_at DESC`);
    return response.status(200).json({ feedback: rows.map(presentFeedback) });
  } catch (error) { return next(error); }
}

async function getFeedbackAnalytics(_request, response, next) {
  try {
    const pool = getPool();
    const [[ratings], [summaryRows]] = await Promise.all([
      pool.query(`SELECT m.id AS _id, m.food_name AS foodName, m.meal_type AS mealType,
        m.meal_date AS mealDate, AVG(f.rating) AS averageRating, COUNT(f.id) AS ratingCount
        FROM feedback f JOIN meals m ON m.id = f.meal_id GROUP BY m.id ORDER BY m.meal_date DESC`),
      pool.query('SELECT COALESCE(AVG(rating), 0) AS averageRating, COUNT(*) AS totalRatings FROM feedback'),
    ]);
    return response.status(200).json({
      summary: { averageRating: Number(summaryRows[0].averageRating), totalRatings: summaryRows[0].totalRatings },
      ratings: ratings.map((item) => ({ ...item, averageRating: Number(item.averageRating), ratingCount: Number(item.ratingCount) })),
    });
  } catch (error) { return next(error); }
}

module.exports = { createFeedback, getMyFeedback, getFeedbackForChief, getFeedbackAnalytics };

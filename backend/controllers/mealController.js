const { getPool } = require('../config/db');

const mealTypes = ['breakfast', 'lunch', 'dinner', 'snack'];
const selectMeals = `SELECT id AS _id, meal_type AS mealType, food_name AS foodName,
  meal_date AS date, booking_deadline AS bookingDeadline, is_available AS isAvailable,
  (SELECT COUNT(*) FROM orders counted_orders WHERE counted_orders.meal_id = meals.id AND counted_orders.status IN ('booked', 'attended')) AS quantity,
  price, ingredients, created_at AS createdAt, updated_at AS updatedAt FROM meals`;

const pad = (value) => String(value).padStart(2, '0');
const dateKeyFromDate = (date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

function dateKey(value) {
  if (typeof value === 'string') {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    if (match) {
      const [year, month, day] = match.slice(1).map(Number);
      const localDate = new Date(year, month - 1, day);
      if (localDate.getFullYear() === year && localDate.getMonth() === month - 1 && localDate.getDate() === day) return value;
      return null;
    }
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : dateKeyFromDate(date);
}

function addDays(key, days) {
  const [year, month, day] = key.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + days);
  return dateKeyFromDate(date);
}

const dateTime = (key, time = '00:00:00') => `${key} ${time}`;

function validateMeal(body) {
  const price = Number(body.price || 0);
  const mealDate = dateKey(body.date);
  const deadline = new Date(body.bookingDeadline);
  if (!mealTypes.includes(body.mealType) || !body.foodName?.trim()) return 'Provide a valid meal type and food name.';
  if (!mealDate || Number.isNaN(deadline.getTime())) return 'Provide a valid meal date and booking deadline.';
  if (!Number.isFinite(price) || price < 0) return 'Meal price must be 0 or more.';
  if (body.isAvailable !== false && mealDate < dateKeyFromDate(new Date())) return 'A meal available for booking cannot be scheduled in the past.';
  if (body.isAvailable !== false && deadline <= new Date()) return 'Set a future attendance deadline before making a meal available for booking.';
  return null;
}

function values(body) {
  return [body.mealType, body.foodName.trim(), dateTime(dateKey(body.date), '12:00:00'), new Date(body.bookingDeadline), body.isAvailable !== false, Number(body.price || 0), JSON.stringify(body.ingredients || [])];
}

async function getWeeklyMenu(request, response, next) {
  try {
    const start = request.query.weekStart ? dateKey(request.query.weekStart) : dateKeyFromDate(new Date());
    if (!start) return response.status(400).json({ message: 'weekStart must be a valid date.' });
    const end = addDays(start, 7);
    const [meals] = await getPool().execute(`${selectMeals} WHERE meal_date >= ? AND meal_date < ? ORDER BY meal_date, meal_type`, [dateTime(start), dateTime(end)]);
    return response.status(200).json({ meals });
  } catch (error) { return next(error); }
}

async function getMeals(request, response, next) {
  try {
    const conditions = []; const parameters = [];
    if (request.query.from) { const from = dateKey(request.query.from); if (!from) return response.status(400).json({ message: 'from must be a valid date.' }); conditions.push('meal_date >= ?'); parameters.push(dateTime(from)); }
    if (request.query.to) { const to = dateKey(request.query.to); if (!to) return response.status(400).json({ message: 'to must be a valid date.' }); conditions.push('meal_date < ?'); parameters.push(dateTime(addDays(to, 1))); }
    const [meals] = await getPool().execute(`${selectMeals}${conditions.length ? ` WHERE ${conditions.join(' AND ')}` : ''} ORDER BY meal_date, meal_type`, parameters);
    return response.status(200).json({ meals });
  } catch (error) { return next(error); }
}

async function createMeal(request, response, next) {
  try {
    const validationError = validateMeal(request.body);
    if (validationError) return response.status(400).json({ message: validationError });
    const [result] = await getPool().execute('INSERT INTO meals (meal_type, food_name, meal_date, booking_deadline, is_available, price, ingredients) VALUES (?, ?, ?, ?, ?, ?, ?)', values(request.body));
    const [meals] = await getPool().execute(`${selectMeals} WHERE id = ?`, [result.insertId]);
    return response.status(201).json({ meal: meals[0] });
  } catch (error) { return next(error); }
}

async function updateMeal(request, response, next) {
  try {
    const validationError = validateMeal(request.body);
    if (validationError) return response.status(400).json({ message: validationError });
    const [result] = await getPool().execute('UPDATE meals SET meal_type = ?, food_name = ?, meal_date = ?, booking_deadline = ?, is_available = ?, price = ?, ingredients = ? WHERE id = ?', [...values(request.body), request.params.mealId]);
    if (!result.affectedRows) return response.status(404).json({ message: 'Meal not found.' });
    const [meals] = await getPool().execute(`${selectMeals} WHERE id = ?`, [request.params.mealId]);
    return response.status(200).json({ meal: meals[0] });
  } catch (error) { return next(error); }
}

async function deleteMeal(request, response, next) {
  try { const [result] = await getPool().execute('DELETE FROM meals WHERE id = ?', [request.params.mealId]); return result.affectedRows ? response.status(204).send() : response.status(404).json({ message: 'Meal not found.' }); } catch (error) { return next(error); }
}

async function getFoodDemand(request, response, next) {
  try {
    const date = request.query.date ? dateKey(request.query.date) : dateKeyFromDate(new Date());
    if (!date) return response.status(400).json({ message: 'date must be valid.' });
    const end = addDays(date, 1);
    const [rows] = await getPool().execute(`SELECT m.id AS _id, m.meal_type AS mealType,
      m.food_name AS foodName, m.meal_date AS date, m.booking_deadline AS bookingDeadline,
      m.is_available AS isAvailable, m.ingredients,
      COUNT(o.id) AS expectedStudents
      FROM meals m LEFT JOIN orders o ON o.meal_id = m.id AND o.status IN ('booked', 'attended')
      WHERE m.meal_date >= ? AND m.meal_date < ? GROUP BY m.id ORDER BY m.meal_type`, [dateTime(date), dateTime(end)]);
    return response.status(200).json({ date: new Date(`${date}T00:00:00`), demand: rows.map(({ expectedStudents, ...meal }) => ({ meal: { ...meal, quantity: expectedStudents }, expectedStudents, requiredPortions: expectedStudents })) });
  } catch (error) { return next(error); }
}

module.exports = { getWeeklyMenu, getMeals, createMeal, updateMeal, deleteMeal, getFoodDemand };

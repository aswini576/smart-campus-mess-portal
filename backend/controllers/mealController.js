const { getPool } = require('../config/db');

const mealTypes = ['breakfast', 'lunch', 'dinner', 'snack'];
const foodCategories = ['veg', 'non_veg'];
const selectMeals = `SELECT id AS _id, meal_type AS mealType, food_name AS foodName, food_category AS foodCategory,
  meal_date AS date, booking_deadline AS bookingDeadline, booking_open_time AS openingTime,
  booking_close_time AS closingTime, receive_open_time AS receiveOpeningTime,
  receive_close_time AS receiveClosingTime, is_available AS isAvailable,
  (SELECT COUNT(*) FROM orders counted_orders WHERE counted_orders.meal_id = meals.id AND counted_orders.status IN ('booked', 'attended')) AS quantity,
  price, original_cost AS originalCost, mess_payment_amount AS messPaymentAmount,
  ingredients, created_at AS createdAt, updated_at AS updatedAt FROM meals`;

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

function mealsForRole(meals, role) {
  if (role === 'admin') return meals;
  return meals.map(({ originalCost, messPaymentAmount, ...meal }) => meal);
}

function validateMeal(body) {
  const price = Number(body.price || 0);
  const originalCost = Number(body.originalCost || 0); const messPaymentAmount = Number(body.messPaymentAmount || 0);
  const mealDate = dateKey(body.date);
  const timePattern = /^(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/;
  const openingTime = body.openingTime || ''; const closingTime = body.closingTime || '';
  const receiveOpeningTime = body.receiveOpeningTime || ''; const receiveClosingTime = body.receiveClosingTime || '';
  if (!mealTypes.includes(body.mealType) || !body.foodName?.trim()) return 'Provide a valid meal type and food name.';
  if (!foodCategories.includes(body.foodCategory)) return 'Food category must be veg or non-veg.';
  if (!mealDate || !timePattern.test(openingTime) || !timePattern.test(closingTime)) return 'Provide a valid meal date, opening time, and closing time.';
  if (openingTime >= closingTime) return 'Closing time must be after opening time.';
  if (!timePattern.test(receiveOpeningTime) || !timePattern.test(receiveClosingTime)) return 'Provide valid food receiving opening and closing times.';
  if (receiveOpeningTime >= receiveClosingTime) return 'Food receiving closing time must be after its opening time.';
  if (!Number.isFinite(price) || price < 0) return 'Meal price must be 0 or more.';
  if (!Number.isFinite(originalCost) || originalCost < 0 || !Number.isFinite(messPaymentAmount) || messPaymentAmount < 0) return 'Original cost and mess payment must be 0 or more.';
  if (body.isAvailable !== false && mealDate < dateKeyFromDate(new Date())) return 'A meal available for booking cannot be scheduled in the past.';
  if (body.isAvailable !== false && new Date(`${mealDate}T${closingTime}`) <= new Date()) return 'Set a future closing time before making a meal available for booking.';
  return null;
}

function values(body) {
  const mealDate = dateKey(body.date); const openingTime = body.openingTime.length === 5 ? `${body.openingTime}:00` : body.openingTime; const closingTime = body.closingTime.length === 5 ? `${body.closingTime}:00` : body.closingTime;
  const receiveOpeningTime = body.receiveOpeningTime.length === 5 ? `${body.receiveOpeningTime}:00` : body.receiveOpeningTime; const receiveClosingTime = body.receiveClosingTime.length === 5 ? `${body.receiveClosingTime}:00` : body.receiveClosingTime;
  return [body.mealType, body.foodName.trim(), body.foodCategory, dateTime(mealDate, '12:00:00'), dateTime(mealDate, closingTime), openingTime, closingTime, receiveOpeningTime, receiveClosingTime, body.isAvailable !== false, Number(body.price || 0), Number(body.originalCost || 0), Number(body.messPaymentAmount || 0), JSON.stringify(body.ingredients || [])];
}

async function categoryAlreadyExists(pool, body, excludedId = 0) {
  const [rows] = await pool.execute(`SELECT id FROM meals WHERE DATE(meal_date) = ? AND meal_type = ?
    AND food_category = ? AND id <> ? LIMIT 1`, [dateKey(body.date), body.mealType, body.foodCategory, excludedId]);
  return Boolean(rows[0]);
}

async function getWeeklyMenu(request, response, next) {
  try {
    const start = request.query.weekStart ? dateKey(request.query.weekStart) : dateKeyFromDate(new Date());
    if (!start) return response.status(400).json({ message: 'weekStart must be a valid date.' });
    const end = addDays(start, 7);
    const [meals] = await getPool().execute(`${selectMeals} WHERE meal_date >= ? AND meal_date < ? ORDER BY meal_date, meal_type`, [dateTime(start), dateTime(end)]);
    return response.status(200).json({ meals: mealsForRole(meals, request.user.role) });
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
    const pool = getPool();
    if (await categoryAlreadyExists(pool, request.body)) return response.status(409).json({ message: `A ${request.body.foodCategory === 'veg' ? 'Veg' : 'Non-Veg'} option already exists for this meal slot.` });
    const [result] = await pool.execute('INSERT INTO meals (meal_type, food_name, food_category, meal_date, booking_deadline, booking_open_time, booking_close_time, receive_open_time, receive_close_time, is_available, price, original_cost, mess_payment_amount, ingredients) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', values(request.body));
    const [meals] = await pool.execute(`${selectMeals} WHERE id = ?`, [result.insertId]);
    return response.status(201).json({ meal: meals[0] });
  } catch (error) { return next(error); }
}

async function createMealOptions(request, response, next) {
  const connection = await getPool().getConnection();
  try {
    const veg = { ...request.body, foodName: request.body.vegFoodName?.trim(), foodCategory: 'veg', originalCost: request.body.vegOriginalCost, messPaymentAmount: 0 };
    const nonVeg = { ...request.body, foodName: request.body.nonVegFoodName?.trim(), foodCategory: 'non_veg', originalCost: request.body.nonVegOriginalCost, messPaymentAmount: 0 };
    if (!veg.foodName || !nonVeg.foodName) return response.status(400).json({ message: 'Both Veg and Non-Veg food names are required.' });
    const validationError = validateMeal(veg) || validateMeal(nonVeg);
    if (validationError) return response.status(400).json({ message: validationError });
    await connection.beginTransaction();
    const [existing] = await connection.execute(`SELECT id FROM meals WHERE DATE(meal_date) = ? AND meal_type = ?
      AND food_category IN ('veg', 'non_veg') FOR UPDATE`, [dateKey(request.body.date), request.body.mealType]);
    if (existing.length) { await connection.rollback(); return response.status(409).json({ message: 'Veg or Non-Veg options already exist for this meal slot.' }); }
    const sql = 'INSERT INTO meals (meal_type, food_name, food_category, meal_date, booking_deadline, booking_open_time, booking_close_time, receive_open_time, receive_close_time, is_available, price, original_cost, mess_payment_amount, ingredients) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
    const [vegResult] = await connection.execute(sql, values(veg));
    const [nonVegResult] = await connection.execute(sql, values(nonVeg));
    await connection.commit();
    const [meals] = await getPool().query(`${selectMeals} WHERE id IN (?, ?)`, [vegResult.insertId, nonVegResult.insertId]);
    return response.status(201).json({ meals });
  } catch (error) { await connection.rollback(); return next(error); } finally { connection.release(); }
}

async function updateMeal(request, response, next) {
  try {
    const mealId = Number(request.params.mealId);
    if (!Number.isInteger(mealId) || mealId < 1) return response.status(400).json({ message: 'A valid meal ID is required.' });
    const validationError = validateMeal(request.body);
    if (validationError) return response.status(400).json({ message: validationError });
    const pool = getPool();
    const [existing] = await pool.execute('SELECT id FROM meals WHERE id = ? LIMIT 1', [mealId]);
    if (!existing[0]) return response.status(404).json({ message: 'Meal not found.' });
    if (await categoryAlreadyExists(pool, request.body, mealId)) return response.status(409).json({ message: `A ${request.body.foodCategory === 'veg' ? 'Veg' : 'Non-Veg'} option already exists for this meal slot.` });
    await pool.execute('UPDATE meals SET meal_type = ?, food_name = ?, food_category = ?, meal_date = ?, booking_deadline = ?, booking_open_time = ?, booking_close_time = ?, receive_open_time = ?, receive_close_time = ?, is_available = ?, price = ?, original_cost = ?, mess_payment_amount = ?, ingredients = ? WHERE id = ?', [...values(request.body), mealId]);
    const [meals] = await pool.execute(`${selectMeals} WHERE id = ?`, [mealId]);
    return response.status(200).json({ meal: meals[0] });
  } catch (error) { return next(error); }
}

async function deleteMeal(request, response, next) {
  try {
    const mealId = Number(request.params.mealId);
    if (!Number.isInteger(mealId) || mealId < 1) return response.status(400).json({ message: 'A valid meal ID is required.' });
    const pool = getPool(); const [existing] = await pool.execute('SELECT id FROM meals WHERE id = ? LIMIT 1', [mealId]);
    if (!existing[0]) return response.status(404).json({ message: 'Meal not found.' });
    await pool.execute('DELETE FROM meals WHERE id = ?', [mealId]);
    return response.status(204).send();
  } catch (error) { return next(error); }
}

async function getFoodDemand(request, response, next) {
  try {
    const date = request.query.date ? dateKey(request.query.date) : dateKeyFromDate(new Date());
    if (!date) return response.status(400).json({ message: 'date must be valid.' });
    const end = addDays(date, 1);
    const [rows] = await getPool().execute(`SELECT m.id AS _id, m.meal_type AS mealType,
      m.food_name AS foodName, m.food_category AS foodCategory, m.meal_date AS date, m.booking_deadline AS bookingDeadline,
      m.is_available AS isAvailable, m.ingredients,
      COUNT(o.id) AS expectedStudents
      FROM meals m LEFT JOIN orders o ON o.meal_id = m.id AND o.status IN ('booked', 'attended')
      WHERE m.meal_date >= ? AND m.meal_date < ? GROUP BY m.id ORDER BY m.meal_type`, [dateTime(date), dateTime(end)]);
    return response.status(200).json({ date: new Date(`${date}T00:00:00`), demand: rows.map(({ expectedStudents, ...meal }) => ({ meal: { ...meal, quantity: expectedStudents }, expectedStudents, requiredPortions: expectedStudents })) });
  } catch (error) { return next(error); }
}

module.exports = { getWeeklyMenu, getMeals, createMeal, createMealOptions, updateMeal, deleteMeal, getFoodDemand };

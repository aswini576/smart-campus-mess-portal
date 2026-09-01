const { getPool } = require('../config/db');

const round = (number) => Math.round(number * 100) / 100;
const pad = (value) => String(value).padStart(2, '0');
const dateKey = (value) => { const date = new Date(value); if (Number.isNaN(date.getTime())) return null; return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`; };
const parseJson = (value, fallback) => { if (value == null) return fallback; if (typeof value !== 'string') return value; try { return JSON.parse(value); } catch (_error) { return fallback; } };

function compactResponse(adjustments) {
  const scaling_adjustments = adjustments.slice(0, 2).map((item) => ({ item: item.item.slice(0, 18), delta_kg: item.delta_kg }));
  return { scaling_adjustments, efficiency_summary: 'Adjust to attendance; reduce waste.' };
}
function presentSuggestion(row) {
  if (!row) return null;
  return { _id: row.id, date: row.date, response: parseJson(row.response, {}), sourceStats: { expectedUsers: row.expectedUsers, mealCount: row.mealCount, historicalWasteKg: Number(row.historicalWasteKg) }, createdAt: row.createdAt, updatedAt: row.updatedAt };
}

async function generateDailySuggestions(value = new Date()) {
  const date = dateKey(value); if (!date) throw Object.assign(new Error('date must be valid.'), { statusCode: 400 });
  const pool = getPool();
  const [meals] = await pool.execute(`SELECT m.id, m.quantity, m.ingredients,
    COUNT(o.id) AS confirmed FROM meals m LEFT JOIN orders o ON o.meal_id = m.id
    AND o.status IN ('booked', 'attended') WHERE DATE(m.meal_date) = ? GROUP BY m.id`, [date]);
  const [historicalWaste] = await pool.execute('SELECT waste_amount FROM waste_predictions WHERE prediction_date < ? ORDER BY prediction_date DESC LIMIT 30', [date]);
  const historicalWasteKg = historicalWaste.length ? historicalWaste.reduce((sum, item) => sum + Number(item.waste_amount), 0) / historicalWaste.length : 0;
  const plannedTotalKg = meals.reduce((total, meal) => total + parseJson(meal.ingredients, []).reduce((sum, ingredient) => sum + (String(ingredient.unit).toLowerCase() === 'g' ? Number(ingredient.quantity) / 1000 : Number(ingredient.quantity)), 0), 0);
  const wasteRatio = plannedTotalKg > 0 ? Math.min(0.15, historicalWasteKg / plannedTotalKg) : 0;
  const adjustments = new Map(); let expectedUsers = 0; let plannedKg = 0; let requiredKg = 0;
  for (const meal of meals) {
    const confirmed = Number(meal.confirmed); expectedUsers += confirmed;
    const plannedPortions = Number(meal.quantity); const ratio = plannedPortions > 0 ? confirmed / plannedPortions : (confirmed > 0 ? 1 : 0);
    for (const ingredient of parseJson(meal.ingredients, [])) {
      const current = String(ingredient.unit).toLowerCase() === 'g' ? Number(ingredient.quantity) / 1000 : Number(ingredient.quantity);
      if (!Number.isFinite(current)) continue;
      const required = current * ratio * (1 - wasteRatio); plannedKg += current; requiredKg += required;
      adjustments.set(ingredient.name, (adjustments.get(ingredient.name) || 0) + required - current);
    }
  }
  const response = compactResponse([...adjustments.entries()].map(([item, delta]) => ({ item, delta_kg: round(delta) })).filter((item) => item.delta_kg !== 0).sort((a, b) => Math.abs(b.delta_kg) - Math.abs(a.delta_kg)));
  await pool.execute(`INSERT INTO ai_suggestions (suggestion_date, response, expected_users, meal_count, historical_waste_kg)
    VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE response = VALUES(response), expected_users = VALUES(expected_users),
    meal_count = VALUES(meal_count), historical_waste_kg = VALUES(historical_waste_kg)`, [date, JSON.stringify(response), expectedUsers, meals.length, round(historicalWasteKg)]);
  await pool.execute(`INSERT INTO waste_predictions (prediction_date, expected_users, food_required, waste_amount)
    VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE expected_users = VALUES(expected_users),
    food_required = VALUES(food_required), waste_amount = VALUES(waste_amount)`, [date, expectedUsers, round(requiredKg), round(Math.max(0, plannedKg - requiredKg))]);
  const [rows] = await pool.execute(`SELECT id, suggestion_date AS date, response, expected_users AS expectedUsers,
    meal_count AS mealCount, historical_waste_kg AS historicalWasteKg, created_at AS createdAt, updated_at AS updatedAt
    FROM ai_suggestions WHERE suggestion_date = ?`, [date]);
  return presentSuggestion(rows[0]);
}
async function getLatestSuggestion() {
  const [rows] = await getPool().query(`SELECT id, suggestion_date AS date, response, expected_users AS expectedUsers,
    meal_count AS mealCount, historical_waste_kg AS historicalWasteKg, created_at AS createdAt, updated_at AS updatedAt
    FROM ai_suggestions ORDER BY suggestion_date DESC LIMIT 1`);
  return presentSuggestion(rows[0]);
}
module.exports = { generateDailySuggestions, getLatestSuggestion };

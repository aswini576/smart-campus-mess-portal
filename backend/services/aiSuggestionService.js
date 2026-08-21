const Meal = require('../models/Meal');
const Order = require('../models/Order');
const WastePrediction = require('../models/WastePrediction');
const AiSuggestion = require('../models/AiSuggestion');

const startOfDay = (value) => { const day = new Date(value); day.setHours(0, 0, 0, 0); return day; };
const round = (number) => Math.round(number * 100) / 100;

function compactResponse(adjustments) {
  // Two short entries and a fixed summary keep the serialized JSON well below 100 tokens.
  const scaling_adjustments = adjustments.slice(0, 2).map((item) => ({ item: item.item.slice(0, 18), delta_kg: item.delta_kg }));
  return { scaling_adjustments, efficiency_summary: 'Adjust to attendance; reduce waste.' };
}

async function generateDailySuggestions(value = new Date()) {
  const date = startOfDay(value); const nextDay = new Date(date); nextDay.setDate(nextDay.getDate() + 1);
  const [meals, historicalWaste] = await Promise.all([
    Meal.find({ date: { $gte: date, $lt: nextDay } }),
    WastePrediction.find({ date: { $lt: date } }).sort({ date: -1 }).limit(30),
  ]);
  const mealIds = meals.map((meal) => meal._id);
  const attendance = mealIds.length ? await Order.aggregate([{ $match: { mealId: { $in: mealIds }, status: { $in: ['booked', 'attended'] } } }, { $group: { _id: '$mealId', users: { $sum: 1 } } }]) : [];
  const attendanceByMeal = new Map(attendance.map((entry) => [String(entry._id), entry.users]));
  const historicalWasteKg = historicalWaste.length ? historicalWaste.reduce((sum, item) => sum + item.wasteAmount, 0) / historicalWaste.length : 0;
  const plannedTotalKg = meals.reduce((total, meal) => total + meal.ingredients.reduce((mealTotal, ingredient) => {
    return mealTotal + (ingredient.unit.toLowerCase() === 'g' ? ingredient.quantity / 1000 : ingredient.quantity);
  }, 0), 0);
  // Cap the historical-waste correction so an unusual past day cannot under-serve students.
  const wasteRatio = plannedTotalKg > 0 ? Math.min(0.15, historicalWasteKg / plannedTotalKg) : 0;
  const adjustments = new Map(); let expectedUsers = 0; let plannedKg = 0; let requiredKg = 0;
  for (const meal of meals) {
    const confirmed = attendanceByMeal.get(String(meal._id)) || 0; expectedUsers += confirmed;
    const ratio = meal.quantity > 0 ? confirmed / meal.quantity : 0;
    for (const ingredient of meal.ingredients) {
      // Ingredient quantities are treated as kilograms for this compact adjustment contract.
      const current = ingredient.unit.toLowerCase() === 'g' ? ingredient.quantity / 1000 : ingredient.quantity;
      const required = current * ratio * (1 - wasteRatio);
      plannedKg += current; requiredKg += required;
      adjustments.set(ingredient.name, (adjustments.get(ingredient.name) || 0) + (required - current));
    }
  }
  const response = compactResponse([...adjustments.entries()].map(([item, delta]) => ({ item, delta_kg: round(delta) })).filter((item) => item.delta_kg !== 0).sort((a, b) => Math.abs(b.delta_kg) - Math.abs(a.delta_kg)));
  // JSON output is deliberately capped under 100 tokens.
  const suggestion = await AiSuggestion.findOneAndUpdate({ date }, { response, sourceStats: { expectedUsers, mealCount: meals.length, historicalWasteKg: round(historicalWasteKg) } }, { new: true, upsert: true, setDefaultsOnInsert: true });
  await WastePrediction.findOneAndUpdate({ date }, { expectedUsers, foodRequired: round(requiredKg), wasteAmount: round(Math.max(0, plannedKg - requiredKg)) }, { new: true, upsert: true, setDefaultsOnInsert: true });
  return suggestion;
}

async function getLatestSuggestion() { return AiSuggestion.findOne().sort({ date: -1 }); }
module.exports = { generateDailySuggestions, getLatestSuggestion };

import { useEffect, useState } from 'react';
import { Alert, Box, Chip, Grid, InputAdornment, MenuItem, Stack, TextField, Typography } from '@mui/material';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import AppButton from '../components/AppButton';
import AppCard from '../components/AppCard';
import AppTable from '../components/AppTable';
import ErrorState from '../components/ErrorState';
import LoadingState from '../components/LoadingState';
import { PageHeading } from './DashboardComponents';
import { getChiefMenu, getFoodReceipts, updateMeal } from '../services/chiefService';
import { deleteOrderRecord } from '../services/paymentService';
import sriLankanMealImage from '../components/images/sri-lankan-meal-restaurant.jpg';
import sriLankanRiceCurryImage from '../components/images/sri-lankan-rice-curry.jpg';

const receivingImages = [sriLankanMealImage, sriLankanRiceCurryImage];
const pad = (value) => String(value).padStart(2, '0');
const dateKey = (value) => { const date = new Date(value); return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`; };
const timeValue = (value, fallback) => typeof value === 'string' && /^\d{2}:\d{2}/.test(value) ? value.slice(0, 5) : fallback;

function AdminFoodReceivedPage() {
  const [receipts, setReceipts] = useState(null);
  const [meals, setMeals] = useState([]);
  const [selectedMealId, setSelectedMealId] = useState('');
  const [receiveOpeningTime, setReceiveOpeningTime] = useState('12:00');
  const [receiveClosingTime, setReceiveClosingTime] = useState('14:00');
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [saving, setSaving] = useState(false);
  const [imageIndex, setImageIndex] = useState(0);

  const load = async () => {
    try {
      const [{ receipts: receiptData }, { meals: mealData }] = await Promise.all([getFoodReceipts(), getChiefMenu()]);
      setReceipts(receiptData);
      setMeals(mealData);
    } catch (e) {
      setError(e.response?.data?.message || 'Unable to load food receipts.');
    }
  };

  useEffect(() => { load(); }, []);
  useEffect(() => { const timer = window.setInterval(() => setImageIndex((index) => (index + 1) % receivingImages.length), 3500); return () => window.clearInterval(timer); }, []);

  const chooseMeal = (event) => {
    const id = event.target.value;
    const meal = meals.find((item) => String(item._id) === String(id));
    setSelectedMealId(id);
    if (meal) {
      setReceiveOpeningTime(timeValue(meal.receiveOpeningTime, '12:00'));
      setReceiveClosingTime(timeValue(meal.receiveClosingTime, '14:00'));
    }
    setNotice('');
  };

  const saveReceivingTime = async () => {
    const meal = meals.find((item) => String(item._id) === String(selectedMealId));
    if (!meal) return setError('Select a meal before saving the receiving time.');
    if (!receiveOpeningTime || !receiveClosingTime || receiveOpeningTime >= receiveClosingTime) return setError('Food receive closing time must be after opening time.');
    setSaving(true); setError(''); setNotice('');
    try {
      const { meal: updated } = await updateMeal(meal._id, { ...meal, date: dateKey(meal.date), openingTime: timeValue(meal.openingTime, '00:00'), closingTime: timeValue(meal.closingTime, '23:59'), receiveOpeningTime, receiveClosingTime });
      setMeals((current) => current.map((item) => item._id === updated._id ? updated : item));
      setNotice('Food receiving time updated successfully.');
    } catch (e) {
      setError(e.response?.data?.message || 'Unable to update food receiving time.');
    } finally {
      setSaving(false);
    }
  };

  if (!receipts && !error) return <LoadingState message="Loading food receipts…" />;
  const query = search.trim().toLowerCase();
  const filtered = (receipts || []).filter((item) => !query || [item.studentName, item.studentId, item.studentEmail, item.foodName, item.mealType].some((value) => value?.toLowerCase().includes(query)));
  const rows = filtered.map((item) => ({ id: item._id, bulkDelete: () => deleteOrderRecord(item._id), student: <Box><Typography fontWeight={700}>{item.studentName}</Typography><Typography variant="caption" color="text.secondary">{item.studentId || item.studentEmail}</Typography></Box>, food: <Box><Typography fontWeight={700}>{item.foodName}</Typography><Chip size="small" variant="outlined" label={item.mealType} sx={{ mt: 0.5, textTransform: 'capitalize' }} /></Box>, mealDate: new Date(item.mealDate).toLocaleDateString(), portion: item.portionSize, receivedAt: new Date(item.receivedAt).toLocaleString() }));

  return <><PageHeading title="Food Received" subtitle="Manage receiving times and monitor collected meals." />{error && <Box mb={2}><ErrorState message={error} /></Box>}{notice && <Alert severity="success" sx={{ mb: 2 }}>{notice}</Alert>}<AppCard sx={{ mb: 2.5 }}><Grid container spacing={3} alignItems="stretch"><Grid size={{ xs: 12, md: 7 }}><Stack height="100%" justifyContent="center" spacing={2}><Box><Typography variant="h5" fontWeight={850}>Food Receiving Time</Typography><Typography color="text.secondary" mt={.5}>Select a meal and set when users can click Mark Food Received.</Typography></Box><TextField select label="Select meal" value={selectedMealId} onChange={chooseMeal}>{meals.map((meal) => <MenuItem key={meal._id} value={meal._id}>{new Date(meal.date).toLocaleDateString()} · {meal.mealType} · {meal.foodName}</MenuItem>)}</TextField><Grid container spacing={2}><Grid size={{ xs: 12, sm: 6 }}><TextField label="Food Receive Opening Time" type="time" value={receiveOpeningTime} onChange={(event) => setReceiveOpeningTime(event.target.value)} slotProps={{ inputLabel: { shrink: true } }} /></Grid><Grid size={{ xs: 12, sm: 6 }}><TextField label="Food Receive Closing Time" type="time" value={receiveClosingTime} onChange={(event) => setReceiveClosingTime(event.target.value)} slotProps={{ inputLabel: { shrink: true } }} /></Grid></Grid><AppButton onClick={saveReceivingTime} disabled={!selectedMealId || saving} sx={{ alignSelf: 'flex-start' }}>{saving ? 'Saving…' : 'Save Receiving Time'}</AppButton></Stack></Grid><Grid size={{ xs: 12, md: 5 }}><Box sx={{ position: 'relative', height: { xs: 220, md: '100%' }, minHeight: 280, overflow: 'hidden', borderRadius: 2.5 }}>{receivingImages.map((image, index) => <Box key={image} component="img" src={image} alt={`Sri Lankan food ${index + 1}`} sx={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: imageIndex === index ? 1 : 0, transform: imageIndex === index ? 'scale(1)' : 'scale(1.03)', transition: 'opacity 800ms ease, transform 800ms ease' }} />)}</Box></Grid></Grid></AppCard><AppCard><TextField value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search student or food" sx={{ maxWidth: 520, mb: 2.5 }} slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchRoundedIcon /></InputAdornment> } }} /><AppTable columns={[{ key: 'student', label: 'Student' }, { key: 'food', label: 'Food' }, { key: 'mealDate', label: 'Meal Date' }, { key: 'portion', label: 'Size' }, { key: 'receivedAt', label: 'Received Date & Time' }]} rows={rows} />{!rows.length && <Typography color="text.secondary" textAlign="center" py={3}>No food receipts found.</Typography>}</AppCard></>;
}

export default AdminFoodReceivedPage;

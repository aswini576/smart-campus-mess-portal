import { useEffect, useState } from 'react';
import { Alert, Box, Chip, Grid, Menu, MenuItem, Stack, Typography } from '@mui/material';
import AppButton from '../components/AppButton';
import AppCard from '../components/AppCard';
import AppTable from '../components/AppTable';
import ErrorState from '../components/ErrorState';
import LoadingState from '../components/LoadingState';
import { PageHeading } from './DashboardComponents';
import { bookMeal, cancelBooking, getOrderHistory, getWeeklyMenu, markFoodReceived, offerMeal } from '../services/studentService';

const FOOD_SIZES = ['Small', 'Medium', 'Large'];
const formatDate = (value) => new Date(value).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
const displaySize = (value = 'medium') => value.charAt(0).toUpperCase() + value.slice(1);
const receiveWindow = (meal) => {
  const [startHour, startMinute, startSecond] = String(meal.receiveOpeningTime || '12:00:00').split(':').map(Number);
  const [endHour, endMinute, endSecond] = String(meal.receiveClosingTime || '14:00:00').split(':').map(Number);
  const start = new Date(meal.date); start.setHours(startHour, startMinute, startSecond || 0, 0);
  const end = new Date(meal.date); end.setHours(endHour, endMinute, endSecond || 0, 0);
  return { start, end };
};
const bookingDateTime = (meal, time, fallback) => { const date = new Date(meal.date); const [hour, minute, second] = String(time || fallback).split(':').map(Number); date.setHours(hour, minute, second || 0, 0); return date; };

function MealBookingPage() {
  const [meals, setMeals] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [sizes, setSizes] = useState({});
  const [sizeMenu, setSizeMenu] = useState(null);
  const [now, setNow] = useState(() => Date.now());

  const load = async () => {
    setLoading(true);
    try {
      const [menu, history] = await Promise.all([getWeeklyMenu(), getOrderHistory()]);
      setMeals(menu.meals);
      setOrders(history.orders);
    } catch (e) {
      setError(e.response?.data?.message || 'Unable to load meal bookings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 30000);
    return () => window.clearInterval(timer);
  }, []);

  const act = async (action, message = 'Your meal attendance was updated.') => {
    setError('');
    setNotice('');
    try {
      await action();
      setNotice(message);
      await load();
    } catch (e) {
      setError(e.response?.data?.message || 'Unable to update booking.');
    }
  };

  if (loading) return <LoadingState message="Loading weekly menu…" />;
  const orderFor = (mealId) => orders.find((order) => order.mealId?._id === mealId && order.status !== 'cancelled');
  const slotOrderFor = (meal) => orders.find((order) => order.status !== 'cancelled' && order.mealId?.mealType === meal.mealType && new Date(order.mealId?.date).toDateString() === new Date(meal.date).toDateString());

  return <>
    <PageHeading title="Weekly menu & bookings" subtitle="Choose your food size and confirm attendance before each meal's deadline." />
    {error && <Box mb={2}><ErrorState message={error} /></Box>}
    {notice && <Alert severity="success" sx={{ mb: 2 }}>{notice}</Alert>}
    <Grid container spacing={2.5}>
      {meals.map((meal) => {
        const order = orderFor(meal._id);
        const alternativeOrder = slotOrderFor(meal);
        const bookingOpen = bookingDateTime(meal, meal.openingTime, '00:00:00');
        const bookingClose = bookingDateTime(meal, meal.closingTime, '23:59:59');
        const remainingMs = bookingClose.getTime() - now;
        const expired = remainingMs <= 0;
        const notOpened = now < bookingOpen.getTime();
        const remainingMinutes = Math.max(1, Math.ceil(remainingMs / 60000));
        const showLastMinuteWarning = !order && meal.isAvailable && remainingMs > 0 && remainingMs <= 30 * 60000;
        const bookingStatus = notOpened ? `Booking opens at ${bookingOpen.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.` : expired ? 'Booking closing time has passed.' : !meal.isAvailable ? 'This meal is not available for booking.' : alternativeOrder && !order ? `You already selected the ${alternativeOrder.mealId?.foodCategory === 'non_veg' ? 'Non-Veg' : 'Veg'} option for this meal.` : '';
        const selectedSize = sizes[meal._id];
        const { start: receiveStart, end: receiveEnd } = receiveWindow(meal);
        const canReceive = Boolean(order) && order.status === 'booked' && now >= receiveStart.getTime() && now < receiveEnd.getTime();
        const received = Boolean(order?.receivedAt) || order?.status === 'attended';
        const receiveWarning = now < receiveStart.getTime() ? `You can click Mark Food Received only from ${receiveStart.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} to ${receiveEnd.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.` : now >= receiveEnd.getTime() ? `Food receiving closed at ${receiveEnd.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.` : `Food receiving is open until ${receiveEnd.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`;
        return <Grid key={meal._id} size={{ xs: 12, md: 6, xl: 4 }}>
          <AppCard sx={{ height: '100%' }}>
            <Stack direction="row" justifyContent="space-between" spacing={1}><Stack direction="row" spacing={0.75}><Chip label={meal.mealType} color="primary" size="small" /><Chip label={meal.foodCategory === 'non_veg' ? 'Non-Veg' : 'Veg'} color={meal.foodCategory === 'non_veg' ? 'error' : 'success'} size="small" /></Stack><Typography variant="caption" color="text.secondary">{formatDate(meal.date)}</Typography></Stack>
            <Typography variant="h6" fontWeight={800} mt={2}>{meal.foodName}</Typography>
            <Typography variant="body2" color="text.secondary" mt={0.5}>Prepared quantity: {meal.quantity}</Typography>
            <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1} mt={1.5}>
              <Typography variant="caption" color="text.secondary">Booking: {bookingOpen.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} – {bookingClose.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Typography>
              {order && <Chip label={`Size: ${displaySize(order.portionSize)}`} size="small" variant="outlined" sx={{ flexShrink: 0 }} />}
            </Stack>
            {showLastMinuteWarning && <Alert severity="warning" sx={{ mt: 1.5, py: 0.25 }}>Only {remainingMinutes} minute{remainingMinutes === 1 ? '' : 's'} remaining to place your food order.</Alert>}
            {!order && bookingStatus && <Typography variant="caption" color="error.main" display="block" mt={1}>{bookingStatus}</Typography>}
            <Stack direction="row" spacing={1} mt={2} useFlexGap flexWrap="wrap">
              {order ? <><AppButton color="secondary" disabled={expired || received} onClick={() => act(() => cancelBooking(order._id))}>{expired ? 'Deadline passed' : 'Opt out'}</AppButton><AppButton disabled={expired || received} onClick={() => act(() => offerMeal(order._id), 'Your meal is now available for another student to claim.')}>Offer meal</AppButton><AppButton color="success" disabled={!canReceive} onClick={() => act(() => markFoodReceived(order._id), 'Food received successfully.')}>{received ? 'Food Received' : 'Mark Food Received'}</AppButton></> : <><AppButton variant="outlined" disabled={Boolean(bookingStatus)} onClick={(event) => setSizeMenu({ anchorEl: event.currentTarget, mealId: meal._id })}>{selectedSize ? `Size: ${selectedSize}` : 'Select size'}</AppButton><AppButton disabled={Boolean(bookingStatus) || !selectedSize} onClick={() => act(() => bookMeal(meal._id, selectedSize), `${selectedSize} meal booked successfully.`)}>Confirm attendance</AppButton></>}
            </Stack>
            {order && !received && <Alert severity={canReceive ? 'success' : 'warning'} sx={{ mt: 1.5, py: .25 }}>{receiveWarning}</Alert>}
            {order && !received && <Typography variant="caption" color={canReceive ? 'success.main' : 'text.secondary'} display="block" mt={1}>Food receiving time: {receiveStart.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} – {receiveEnd.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Typography>}
          </AppCard>
        </Grid>;
      })}
      {!meals.length && <Grid size={{ xs: 12 }}><AppCard><Typography>No meals are scheduled for this week.</Typography></AppCard></Grid>}
      <Grid size={{ xs: 12 }}><AppCard><Typography variant="h6" fontWeight={800} mb={2}>Order history</Typography><AppTable columns={[{ key: 'meal', label: 'Meal' }, { key: 'size', label: 'Size' }, { key: 'date', label: 'Date' }, { key: 'status', label: 'Status' }, { key: 'receivedAt', label: 'Food Received At' }, { key: 'bookingTime', label: 'Booked at' }]} rows={orders.map((order) => ({ id: order._id, meal: order.mealId?.foodName || 'Meal removed', size: displaySize(order.portionSize), date: order.mealId?.date ? formatDate(order.mealId.date) : '—', status: order.status, receivedAt: order.receivedAt ? new Date(order.receivedAt).toLocaleString() : '—', bookingTime: new Date(order.bookingTime).toLocaleString() }))} /></AppCard></Grid>
    </Grid>
    <Menu anchorEl={sizeMenu?.anchorEl} open={Boolean(sizeMenu)} onClose={() => setSizeMenu(null)}>{FOOD_SIZES.map((size) => <MenuItem key={size} selected={sizes[sizeMenu?.mealId] === size} onClick={() => { setSizes((current) => ({ ...current, [sizeMenu.mealId]: size })); setSizeMenu(null); }}>{size}</MenuItem>)}</Menu>
  </>;
}

export default MealBookingPage;

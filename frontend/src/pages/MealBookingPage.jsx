import { useEffect, useState } from 'react';
import { Alert, Box, Chip, Grid, Menu, MenuItem, Stack, Typography } from '@mui/material';
import AppButton from '../components/AppButton';
import AppCard from '../components/AppCard';
import AppTable from '../components/AppTable';
import ErrorState from '../components/ErrorState';
import LoadingState from '../components/LoadingState';
import { PageHeading } from './DashboardComponents';
import { bookMeal, cancelBooking, getOrderHistory, getWeeklyMenu, offerMeal } from '../services/studentService';

const FOOD_SIZES = ['Small', 'Medium', 'Large'];
const formatDate = (value) => new Date(value).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
const displaySize = (value = 'medium') => value.charAt(0).toUpperCase() + value.slice(1);

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

  return <>
    <PageHeading title="Weekly menu & bookings" subtitle="Choose your food size and confirm attendance before each meal's deadline." />
    {error && <Box mb={2}><ErrorState message={error} /></Box>}
    {notice && <Alert severity="success" sx={{ mb: 2 }}>{notice}</Alert>}
    <Grid container spacing={2.5}>
      {meals.map((meal) => {
        const order = orderFor(meal._id);
        const remainingMs = new Date(meal.bookingDeadline).getTime() - now;
        const expired = remainingMs <= 0;
        const remainingMinutes = Math.max(1, Math.ceil(remainingMs / 60000));
        const showLastMinuteWarning = !order && meal.isAvailable && remainingMs > 0 && remainingMs <= 30 * 60000;
        const bookingStatus = expired ? 'Booking deadline has passed.' : !meal.isAvailable ? 'This meal is not available for booking.' : '';
        const selectedSize = sizes[meal._id];
        return <Grid key={meal._id} size={{ xs: 12, md: 6, xl: 4 }}>
          <AppCard sx={{ height: '100%' }}>
            <Stack direction="row" justifyContent="space-between" spacing={1}><Chip label={meal.mealType} color="primary" size="small" /><Typography variant="caption" color="text.secondary">{formatDate(meal.date)}</Typography></Stack>
            <Typography variant="h6" fontWeight={800} mt={2}>{meal.foodName}</Typography>
            <Typography variant="body2" color="text.secondary" mt={0.5}>Prepared quantity: {meal.quantity}</Typography>
            <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1} mt={1.5}>
              <Typography variant="caption" color="text.secondary">Booking deadline: {new Date(meal.bookingDeadline).toLocaleString()}</Typography>
              {order && <Chip label={`Size: ${displaySize(order.portionSize)}`} size="small" variant="outlined" sx={{ flexShrink: 0 }} />}
            </Stack>
            {showLastMinuteWarning && <Alert severity="warning" sx={{ mt: 1.5, py: 0.25 }}>Only {remainingMinutes} minute{remainingMinutes === 1 ? '' : 's'} remaining to place your food order.</Alert>}
            {!order && bookingStatus && <Typography variant="caption" color="error.main" display="block" mt={1}>{bookingStatus}</Typography>}
            <Stack direction="row" spacing={1} mt={2} useFlexGap flexWrap="wrap">
              {order ? <><AppButton color="secondary" disabled={expired} onClick={() => act(() => cancelBooking(order._id))}>{expired ? 'Deadline passed' : 'Opt out'}</AppButton><AppButton disabled={expired} onClick={() => act(() => offerMeal(order._id), 'Your meal is now available for another student to claim.')}>Offer meal</AppButton></> : <><AppButton variant="outlined" disabled={Boolean(bookingStatus)} onClick={(event) => setSizeMenu({ anchorEl: event.currentTarget, mealId: meal._id })}>{selectedSize ? `Size: ${selectedSize}` : 'Select size'}</AppButton><AppButton disabled={Boolean(bookingStatus) || !selectedSize} onClick={() => act(() => bookMeal(meal._id, selectedSize), `${selectedSize} meal booked successfully.`)}>Confirm attendance</AppButton></>}
            </Stack>
          </AppCard>
        </Grid>;
      })}
      {!meals.length && <Grid size={{ xs: 12 }}><AppCard><Typography>No meals are scheduled for this week.</Typography></AppCard></Grid>}
      <Grid size={{ xs: 12 }}><AppCard><Typography variant="h6" fontWeight={800} mb={2}>Order history</Typography><AppTable columns={[{ key: 'meal', label: 'Meal' }, { key: 'size', label: 'Size' }, { key: 'date', label: 'Date' }, { key: 'status', label: 'Status' }, { key: 'bookingTime', label: 'Booked at' }]} rows={orders.map((order) => ({ id: order._id, meal: order.mealId?.foodName || 'Meal removed', size: displaySize(order.portionSize), date: order.mealId?.date ? formatDate(order.mealId.date) : '—', status: order.status, bookingTime: new Date(order.bookingTime).toLocaleString() }))} /></AppCard></Grid>
    </Grid>
    <Menu anchorEl={sizeMenu?.anchorEl} open={Boolean(sizeMenu)} onClose={() => setSizeMenu(null)}>{FOOD_SIZES.map((size) => <MenuItem key={size} selected={sizes[sizeMenu?.mealId] === size} onClick={() => { setSizes((current) => ({ ...current, [sizeMenu.mealId]: size })); setSizeMenu(null); }}>{size}</MenuItem>)}</Menu>
  </>;
}

export default MealBookingPage;

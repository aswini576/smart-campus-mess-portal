import { useEffect, useState } from 'react';
import { Box, Chip, InputAdornment, MenuItem, Stack, TextField, Typography } from '@mui/material';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import AppCard from '../components/AppCard';
import AppTable from '../components/AppTable';
import ErrorState from '../components/ErrorState';
import LoadingState from '../components/LoadingState';
import { PageHeading } from './DashboardComponents';
import { getPayments } from '../services/paymentService';

function AdminFoodOrdersPage() {
  const [orders, setOrders] = useState(null);
  const [search, setSearch] = useState('');
  const [mealType, setMealType] = useState('all');
  const [error, setError] = useState('');

  useEffect(() => {
    getPayments().then(({ payments }) => setOrders(payments)).catch((e) => setError(e.response?.data?.message || 'Unable to load food orders.'));
  }, []);

  if (!orders && !error) return <LoadingState message="Loading student and staff food orders…" />;
  if (error) return <ErrorState message={error} />;

  const query = search.trim().toLowerCase();
  const filtered = orders.filter((order) => (mealType === 'all' || order.mealType === mealType)
    && (!query || order.studentName?.toLowerCase().includes(query) || order.studentEmail?.toLowerCase().includes(query) || order.foodName?.toLowerCase().includes(query)));

  const rows = filtered.map((order) => ({
    id: order._id,
    student: <Box><Typography fontWeight={700}>{order.studentName}</Typography><Typography variant="caption" color="text.secondary">{order.studentEmail}</Typography></Box>,
    food: <Box><Typography fontWeight={700}>{order.foodName}</Typography><Typography variant="caption" color="text.secondary" textTransform="capitalize">{order.mealType}</Typography></Box>,
    date: new Date(order.mealDate).toLocaleDateString(),
    orderStatus: <Chip size="small" label={order.bookingStatus} color={order.bookingStatus === 'cancelled' ? 'default' : 'primary'} sx={{ textTransform: 'capitalize' }} />,
    collection: <Chip size="small" label={order.receivedAt ? 'Received' : order.wastedAt ? 'Food waste' : 'Not received'} color={order.receivedAt ? 'success' : order.wastedAt ? 'error' : 'warning'} />,
    payment: <Chip size="small" label={order.paymentStatus === 'paid' ? 'Paid' : 'Unpaid'} color={order.paymentStatus === 'paid' ? 'success' : 'warning'} />,
  }));

  return <><PageHeading title="Student and staff food orders" subtitle="See each meal selected by students and staff." /><AppCard><Stack direction={{ xs: 'column', md: 'row' }} spacing={2} mb={2.5}><TextField value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search student, staff, email, or food" sx={{ maxWidth: 520 }} slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchRoundedIcon /></InputAdornment> } }} /><TextField select label="Meal type" value={mealType} onChange={(event) => setMealType(event.target.value)} sx={{ maxWidth: { md: 210 } }}><MenuItem value="all">All meals</MenuItem><MenuItem value="breakfast">Breakfast</MenuItem><MenuItem value="lunch">Lunch</MenuItem><MenuItem value="dinner">Dinner</MenuItem><MenuItem value="snack">Snack</MenuItem></TextField></Stack><AppTable columns={[{ key: 'student', label: 'Student / staff' }, { key: 'food', label: 'Ordered food' }, { key: 'date', label: 'Meal date' }, { key: 'orderStatus', label: 'Order status' }, { key: 'collection', label: 'Collection' }, { key: 'payment', label: 'Payment' }]} rows={rows} />{!rows.length && <Typography color="text.secondary" textAlign="center" py={3}>No matching food orders found.</Typography>}</AppCard></>;
}

export default AdminFoodOrdersPage;

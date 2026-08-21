import { useEffect, useState } from 'react';
import { Chip } from '@mui/material';
import AppCard from '../components/AppCard';
import AppTable from '../components/AppTable';
import ErrorState from '../components/ErrorState';
import LoadingState from '../components/LoadingState';
import { PageHeading } from './DashboardComponents';
import { getMyPayments } from '../services/paymentService';

function StudentPaymentsPage() {
  const [payments, setPayments] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => { getMyPayments().then(({ payments: data }) => setPayments(data)).catch((e) => setError(e.response?.data?.message || 'Unable to load payments.')); }, []);
  if (!payments && !error) return <LoadingState message="Loading payments…" />;
  if (error) return <ErrorState message={error} />;
  const rows = payments.map((item) => ({ id: item._id, meal: item.foodName, date: new Date(item.mealDate).toLocaleDateString(), amount: `Rs. ${Number(item.price).toFixed(2)}`, booking: item.bookingStatus, payment: <Chip size="small" label={item.paymentStatus === 'paid' ? 'Paid' : 'Unpaid'} color={item.paymentStatus === 'paid' ? 'success' : 'warning'} /> }));
  return <><PageHeading title="My payments" subtitle="View payment status for your confirmed meals." /><AppCard><AppTable columns={[{ key: 'meal', label: 'Meal' }, { key: 'date', label: 'Date' }, { key: 'amount', label: 'Amount' }, { key: 'booking', label: 'Booking' }, { key: 'payment', label: 'Payment status' }]} rows={rows} /></AppCard></>;
}

export default StudentPaymentsPage;

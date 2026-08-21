import { useEffect, useState } from 'react';
import { Alert, Box, Chip, InputAdornment, Stack, TextField, Typography } from '@mui/material';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import AppButton from '../components/AppButton';
import AppCard from '../components/AppCard';
import AppTable from '../components/AppTable';
import ErrorState from '../components/ErrorState';
import LoadingState from '../components/LoadingState';
import { PageHeading } from './DashboardComponents';
import { getPayments, updatePaymentStatus } from '../services/paymentService';

function AdminPaymentsPage() {
  const [payments, setPayments] = useState(null);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const load = () => getPayments()
    .then(({ payments: data }) => setPayments(data))
    .catch((e) => setError(e.response?.data?.message || 'Unable to load payments.'));

  useEffect(() => { load(); }, []);

  const changeStatus = async (id, status) => {
    setError(''); setNotice('');
    try {
      await updatePaymentStatus(id, status);
      setNotice(`Payment marked as ${status}.`);
      await load();
    } catch (e) {
      setError(e.response?.data?.message || 'Unable to update payment.');
    }
  };

  if (!payments && !error) return <LoadingState message="Loading payments…" />;

  const query = search.trim().toLowerCase();
  const filteredPayments = (payments || []).filter((item) => !query
    || item.studentName?.toLowerCase().includes(query)
    || item.studentEmail?.toLowerCase().includes(query)
    || item.foodName?.toLowerCase().includes(query));

  const rows = filteredPayments.map((item) => ({
    id: item._id,
    student: <Box><Typography fontWeight={700}>{item.studentName}</Typography><Typography variant="caption" color="text.secondary">{item.studentEmail}</Typography></Box>,
    meal: item.foodName,
    date: new Date(item.mealDate).toLocaleDateString(),
    amount: `Rs. ${Number(item.price).toFixed(2)}`,
    status: <Chip size="small" label={item.paymentStatus === 'paid' ? 'Paid' : 'Unpaid'} color={item.paymentStatus === 'paid' ? 'success' : 'warning'} />,
    actions: <Stack direction="row" spacing={1}><AppButton size="small" disabled={item.paymentStatus === 'paid'} onClick={() => changeStatus(item._id, 'paid')}>Paid</AppButton><AppButton size="small" color="inherit" disabled={item.paymentStatus === 'unpaid'} onClick={() => changeStatus(item._id, 'unpaid')}>Unpaid</AppButton></Stack>,
  }));

  return <><PageHeading title="Meal payments" subtitle="Track student and staff meal payments and update paid or unpaid status." />{error && <Box mb={2}><ErrorState message={error} /></Box>}{notice && <Alert severity="success" sx={{ mb: 2 }}>{notice}</Alert>}<AppCard><TextField value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by student, staff, email, or meal" aria-label="Search payments" sx={{ maxWidth: 520, mb: 2.5 }} slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchRoundedIcon /></InputAdornment> } }} /><AppTable columns={[{ key: 'student', label: 'Student / staff' }, { key: 'meal', label: 'Meal' }, { key: 'date', label: 'Date' }, { key: 'amount', label: 'Amount' }, { key: 'status', label: 'Status' }, { key: 'actions', label: 'Actions' }]} rows={rows} />{!rows.length && <Typography color="text.secondary" textAlign="center" py={3}>{query ? 'No matching payment records found.' : 'No payment records available.'}</Typography>}</AppCard></>;
}

export default AdminPaymentsPage;

import { useEffect, useState } from 'react';
import { Alert, Box, Chip, InputAdornment, Stack, TextField, Typography } from '@mui/material';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import AppButton from '../components/AppButton';
import AppCard from '../components/AppCard';
import AppTable from '../components/AppTable';
import ErrorState from '../components/ErrorState';
import LoadingState from '../components/LoadingState';
import { PageHeading } from './DashboardComponents';
import { deleteOrderRecord, getPayments, updatePaymentStatus } from '../services/paymentService';

function AdminPaymentsPage() {
  const [payments, setPayments] = useState(null);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [paidAmounts, setPaidAmounts] = useState({});

  const load = () => getPayments()
    .then(({ payments: data }) => setPayments(data))
    .catch((e) => setError(e.response?.data?.message || 'Unable to load payments.'));

  useEffect(() => { load(); }, []);

  const updatePayment = async (item) => {
    setError(''); setNotice('');
    try {
      const paidAmount = paidAmounts[item._id] ?? item.paidAmount;
      await updatePaymentStatus(item._id, Number(paidAmount));
      setNotice('Payment updated successfully.');
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

  const money = (amount) => `Rs. ${Number(amount || 0).toFixed(2)}`;
  const rows = filteredPayments.map((item) => ({
    id: item._id,
    bulkDelete: () => deleteOrderRecord(item._id),
    student: <Box><Typography fontWeight={700}>{item.studentName}</Typography><Typography variant="caption" color="text.secondary">{item.studentEmail}</Typography></Box>,
    totalAmount: money(item.totalAmount),
    paidAmount: <TextField size="small" type="number" value={paidAmounts[item._id] ?? item.paidAmount ?? 0} onChange={(event) => setPaidAmounts((current) => ({ ...current, [item._id]: event.target.value }))} slotProps={{ htmlInput: { min: 0, max: Number(item.totalAmount), step: '0.01', 'aria-label': `Paid amount for ${item.studentName}` } }} sx={{ width: 130 }} />,
    paymentDate: item.paymentDate ? new Date(item.paymentDate).toLocaleString() : '—',
    balance: money(item.balance),
    status: <Chip size="small" label={Number(item.balance) === 0 ? 'Paid' : 'Pending'} color={Number(item.balance) === 0 ? 'success' : 'warning'} />,
    actions: <AppButton size="small" onClick={() => updatePayment(item)}>Update</AppButton>,
  }));

  return <><PageHeading title="Meal payments" subtitle="Update paid amounts; balance and payment status are calculated automatically." />{error && <Box mb={2}><ErrorState message={error} /></Box>}{notice && <Alert severity="success" sx={{ mb: 2 }}>{notice}</Alert>}<AppCard><TextField value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by student, staff, email, or meal" aria-label="Search payments" sx={{ maxWidth: 520, mb: 2.5 }} slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchRoundedIcon /></InputAdornment> } }} /><AppTable columns={[{ key: 'student', label: 'Student / staff' }, { key: 'totalAmount', label: 'Total Amount' }, { key: 'paidAmount', label: 'Paid Amount' }, { key: 'paymentDate', label: 'Payment Date' }, { key: 'balance', label: 'Balance' }, { key: 'status', label: 'Status' }, { key: 'actions', label: 'Actions' }]} rows={rows} />{!rows.length && <Typography color="text.secondary" textAlign="center" py={3}>{query ? 'No matching payment records found.' : 'No payment records available.'}</Typography>}</AppCard></>;
}

export default AdminPaymentsPage;

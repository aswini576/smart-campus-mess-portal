import { useEffect, useState } from 'react';
import { Alert, Box, Chip, Typography } from '@mui/material';
import AppButton from '../components/AppButton';
import AppCard from '../components/AppCard';
import AppTable from '../components/AppTable';
import ErrorState from '../components/ErrorState';
import LoadingState from '../components/LoadingState';
import { PageHeading } from './DashboardComponents';
import { getMessPayments, markMessPaymentPaid } from '../services/chiefService';

const money = (value) => `Rs. ${Number(value || 0).toFixed(2)}`;
const weekLabel = (weekStart) => { const start = new Date(`${weekStart}T00:00:00`); const end = new Date(start); end.setDate(end.getDate() + 6); return `${start.toLocaleDateString()} – ${end.toLocaleDateString()}`; };

function MessPaymentsPage() {
  const [payments, setPayments] = useState(null); const [error, setError] = useState(''); const [notice, setNotice] = useState(''); const [updating, setUpdating] = useState('');
  const load = () => getMessPayments().then(({ payments: data }) => setPayments(data)).catch((e) => setError(e.response?.data?.message || 'Unable to load mess payments.'));
  useEffect(() => { load(); }, []);
  const markPaid = async (weekStart) => { setError(''); setNotice(''); setUpdating(weekStart); try { await markMessPaymentPaid(weekStart); setNotice('Mess payment marked as paid.'); await load(); } catch (e) { setError(e.response?.data?.message || 'Unable to update mess payment.'); } finally { setUpdating(''); } };
  if (!payments && !error) return <LoadingState message="Loading mess payments…" />;
  const rows = (payments || []).map((payment) => ({ id: payment._id, week: weekLabel(payment.weekStart), amount: money(payment.payableAmount), paymentDate: payment.paymentDate ? new Date(payment.paymentDate).toLocaleString() : '—', status: <Chip size="small" label={payment.status === 'paid' ? 'Paid' : 'Pending'} color={payment.status === 'paid' ? 'success' : 'warning'} />, action: payment.status === 'paid' ? '—' : <AppButton size="small" disabled={updating === payment.weekStart} onClick={() => markPaid(payment.weekStart)}>{updating === payment.weekStart ? 'Saving…' : 'Mark as Paid'}</AppButton> }));
  return <><PageHeading title="Mess Payments" subtitle="Weekly payable amounts and payment history for the mess." />{error && <Box mb={2}><ErrorState message={error} /></Box>}{notice && <Alert severity="success" sx={{ mb: 2 }}>{notice}</Alert>}<AppCard><Typography variant="h6" fontWeight={800} mb={.5}>Weekly Mess Payment History</Typography><Typography variant="body2" color="text.secondary" mb={2}>Payable amount is calculated only from original food costs for confirmed orders.</Typography><AppTable columns={[{ key: 'week', label: 'Week' }, { key: 'amount', label: 'Mess Payable Amount' }, { key: 'paymentDate', label: 'Payment Date' }, { key: 'status', label: 'Status' }, { key: 'action', label: 'Action' }]} rows={rows} />{!rows.length && <Typography color="text.secondary" textAlign="center" py={3}>No weekly mess payments available.</Typography>}</AppCard></>;
}
export default MessPaymentsPage;

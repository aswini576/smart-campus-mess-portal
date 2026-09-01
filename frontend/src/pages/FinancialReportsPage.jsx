import { useEffect, useState } from 'react';
import { Box, Chip, Grid, Typography } from '@mui/material';
import AppCard from '../components/AppCard';
import AppTable from '../components/AppTable';
import ErrorState from '../components/ErrorState';
import LoadingState from '../components/LoadingState';
import { MetricCard, PageHeading } from './DashboardComponents';
import { getOriginalFoodCostReport, getStudentPaymentReport } from '../services/chiefService';

const money = (value) => `Rs. ${Number(value || 0).toFixed(2)}`;

function FinancialReportsPage() {
  const [costReport, setCostReport] = useState(null); const [paymentReport, setPaymentReport] = useState(null); const [error, setError] = useState('');
  useEffect(() => { Promise.all([getOriginalFoodCostReport(), getStudentPaymentReport()]).then(([costs, payments]) => { setCostReport(costs); setPaymentReport(payments); }).catch((e) => setError(e.response?.data?.message || 'Unable to load financial reports.')); }, []);
  if (!costReport && !paymentReport && !error) return <LoadingState message="Loading financial reports…" />;
  if (error) return <ErrorState message={error} />;
  const costRows = costReport.foods.map((food) => ({ id: food._id, food: <Box><Typography fontWeight={700}>{food.foodName}</Typography><Typography variant="caption" color="text.secondary">{food.foodCategory === 'non_veg' ? 'Non-Veg' : 'Veg'} · {food.mealType}</Typography></Box>, date: new Date(food.mealDate).toLocaleDateString(), orders: food.orderCount, originalCost: money(food.originalCost), totalCost: money(food.totalOriginalFoodCost), messPayment: money(food.messPaymentAmount) }));
  const paymentRows = paymentReport.students.map((student) => ({ id: student._id, student: <Box><Typography fontWeight={700}>{student.studentName}</Typography><Typography variant="caption" color="text.secondary">{student.studentId || student.studentEmail}</Typography></Box>, total: money(student.totalAmount), paid: money(student.amountPaid), balance: money(student.balance), paymentDate: student.paymentDate ? new Date(student.paymentDate).toLocaleString() : '—', status: <Chip size="small" label={student.status === 'paid' ? 'Paid' : 'Pending'} color={student.status === 'paid' ? 'success' : 'warning'} /> }));
  return <><PageHeading title="Financial reports" subtitle="Original food costs and student collections are calculated separately." /><Grid container spacing={2.5}>
    <Grid size={{ xs: 12, sm: 6 }}><MetricCard title="Total Original Food Cost" value={money(costReport.summary.totalOriginalFoodCost)} note="Cost × confirmed orders" color="#7b1fa2" /></Grid><Grid size={{ xs: 12, sm: 6 }}><MetricCard title="Admin / Mess Payments" value={money(costReport.summary.totalMessPaymentAmount)} note="Payments recorded for food" color="#1565c0" /></Grid>
    <Grid size={{ xs: 12 }}><AppCard><Typography variant="h6" fontWeight={800} mb={.5}>1. Original Food Cost Report</Typography><Typography variant="body2" color="text.secondary" mb={2}>This report does not include student payment collections.</Typography><AppTable columns={[{ key: 'food', label: 'Food' }, { key: 'date', label: 'Date' }, { key: 'orders', label: 'Orders' }, { key: 'originalCost', label: 'Original Cost / Food' }, { key: 'totalCost', label: 'Total Original Cost' }, { key: 'messPayment', label: 'Admin / Mess Payment' }]} rows={costRows} /></AppCard></Grid>
    <Grid size={{ xs: 12 }}><AppCard><Typography variant="h6" fontWeight={800} mb={.5}>2. Student Payment Report</Typography><Typography variant="body2" color="text.secondary" mb={2}>This report contains student charges and collections only.</Typography><AppTable columns={[{ key: 'student', label: 'Student' }, { key: 'total', label: 'Total Amount' }, { key: 'paid', label: 'Amount Paid' }, { key: 'balance', label: 'Balance' }, { key: 'paymentDate', label: 'Payment Date' }, { key: 'status', label: 'Status' }]} rows={paymentRows} /></AppCard></Grid>
  </Grid></>;
}
export default FinancialReportsPage;

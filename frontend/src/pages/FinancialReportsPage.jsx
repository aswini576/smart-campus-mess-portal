import { useEffect, useState } from 'react';
import { Box, Button, Chip, Grid, Typography } from '@mui/material';
import FileDownloadRoundedIcon from '@mui/icons-material/FileDownloadRounded';
import AppCard from '../components/AppCard';
import AppTable from '../components/AppTable';
import ErrorState from '../components/ErrorState';
import LoadingState from '../components/LoadingState';
import { MetricCard, PageHeading } from './DashboardComponents';
import { getOriginalFoodCostReport, getStudentPaymentReport } from '../services/chiefService';

const money = (value) => `Rs. ${Number(value || 0).toFixed(2)}`;
const pdfText = (value) => String(value ?? '').replace(/[^\x20-\x7E]/g, ' ').replace(/([\\()])/g, '\\$1');

function exportFinancialPdf(costReport, paymentReport) {
  const lines = [
    'CampusBite - Financial Report',
    `Generated: ${new Date().toLocaleString()}`,
    '',
    'Summary',
    `Total original food cost: ${money(costReport.summary.totalOriginalFoodCost)}`,
    `Admin / mess payments: ${money(costReport.summary.totalMessPaymentAmount)}`,
    `Total student amount: ${money(paymentReport.summary?.totalAmount)}`,
    `Total amount paid: ${money(paymentReport.summary?.totalPaid)}`,
    `Total outstanding balance: ${money(paymentReport.summary?.totalBalance)}`,
    '',
    'Original Food Cost Report',
    ...(costReport.foods.length ? costReport.foods.map((food) => `${food.foodName} | ${new Date(food.mealDate).toLocaleDateString()} | Orders: ${food.orderCount} | Total: ${money(food.totalOriginalFoodCost)} | Mess payment: ${money(food.messPaymentAmount)}`) : ['No food cost records available.']),
    '',
    'Student Payment Report',
    ...(paymentReport.students.length ? paymentReport.students.map((student) => `${student.studentName} | Total: ${money(student.totalAmount)} | Paid: ${money(student.amountPaid)} | Balance: ${money(student.balance)} | Status: ${student.status}`) : ['No student payment records available.']),
  ];
  const pageLines = 42;
  const pages = Array.from({ length: Math.ceil(lines.length / pageLines) }, (_, index) => lines.slice(index * pageLines, (index + 1) * pageLines));
  const objects = ['<< /Type /Catalog /Pages 2 0 R >>', `<< /Type /Pages /Kids [${pages.map((_, index) => `${3 + index * 2} 0 R`).join(' ')}] /Count ${pages.length} >>`];
  pages.forEach((page, index) => {
    const pageId = 3 + index * 2;
    const contentId = pageId + 1;
    const stream = ['BT', '/F1 10 Tf', '40 790 Td', ...page.map((line, lineIndex) => `${lineIndex ? '0 -17 Td ' : ''}(${pdfText(line)}) Tj`), 'ET'].join('\n');
    objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 842] /Resources << /Font << /F1 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> >> >> /Contents ${contentId} 0 R >>`);
    objects.push(`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`);
  });
  let pdf = '%PDF-1.4\n';
  const offsets = [0];
  objects.forEach((object, index) => { offsets.push(pdf.length); pdf += `${index + 1} 0 obj\n${object}\nendobj\n`; });
  const xref = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${offsets.slice(1).map((offset) => `${String(offset).padStart(10, '0')} 00000 n `).join('\n')}\ntrailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  const url = URL.createObjectURL(new Blob([pdf], { type: 'application/pdf' }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = 'campusbite-financial-report.pdf';
  anchor.click();
  URL.revokeObjectURL(url);
}

function FinancialReportsPage() {
  const [costReport, setCostReport] = useState(null); const [paymentReport, setPaymentReport] = useState(null); const [error, setError] = useState('');
  useEffect(() => { Promise.all([getOriginalFoodCostReport(), getStudentPaymentReport()]).then(([costs, payments]) => { setCostReport(costs); setPaymentReport(payments); }).catch((e) => setError(e.response?.data?.message || 'Unable to load financial reports.')); }, []);
  if (!costReport && !paymentReport && !error) return <LoadingState message="Loading financial reports…" />;
  if (error) return <ErrorState message={error} />;
  const costRows = costReport.foods.map((food) => ({ id: food._id, food: <Box><Typography fontWeight={700}>{food.foodName}</Typography><Typography variant="caption" color="text.secondary">{food.foodCategory === 'non_veg' ? 'Non-Veg' : 'Veg'} · {food.mealType}</Typography></Box>, date: new Date(food.mealDate).toLocaleDateString(), orders: food.orderCount, originalCost: money(food.originalCost), totalCost: money(food.totalOriginalFoodCost), messPayment: money(food.messPaymentAmount) }));
  const paymentRows = paymentReport.students.map((student) => ({ id: student._id, student: <Box><Typography fontWeight={700}>{student.studentName}</Typography><Typography variant="caption" color="text.secondary">{student.studentId || student.studentEmail}</Typography></Box>, total: money(student.totalAmount), paid: money(student.amountPaid), balance: money(student.balance), paymentDate: student.paymentDate ? new Date(student.paymentDate).toLocaleString() : '—', status: <Chip size="small" label={student.status === 'paid' ? 'Paid' : 'Pending'} color={student.status === 'paid' ? 'success' : 'warning'} /> }));
  return <><PageHeading title="Financial reports" subtitle="Original food costs and student collections are calculated separately." action={<Button variant="outlined" size="small" startIcon={<FileDownloadRoundedIcon />} onClick={() => exportFinancialPdf(costReport, paymentReport)}>Download PDF</Button>} /><Grid container spacing={2.5}>
    <Grid size={{ xs: 12, sm: 6, lg: 4 }}><MetricCard title="Total Original Food Cost" value={money(costReport.summary.totalOriginalFoodCost)} note="Cost × confirmed orders" color="#7b1fa2" /></Grid><Grid size={{ xs: 12, sm: 6, lg: 4 }}><MetricCard title="Admin / Mess Payments" value={money(costReport.summary.totalMessPaymentAmount)} note="Payments recorded for food" color="#1565c0" /></Grid><Grid size={{ xs: 12, sm: 6, lg: 4 }}><MetricCard title="Total Student Amount" value={money(paymentReport.summary?.totalAmount)} note="Combined amount for active student orders" color="#6a1b9a" /></Grid>
    <Grid size={{ xs: 12, sm: 6 }}><MetricCard title="Total Amount Paid" value={money(paymentReport.summary?.totalPaid)} note="Combined student payments received" color="#2e7d32" /></Grid><Grid size={{ xs: 12, sm: 6 }}><MetricCard title="Total Balance" value={money(paymentReport.summary?.totalBalance)} note="Amount students still need to pay" color="#d32f2f" /></Grid>
    <Grid size={{ xs: 12 }}><AppCard><Typography variant="h6" fontWeight={800} mb={.5}>1. Original Food Cost Report</Typography><Typography variant="body2" color="text.secondary" mb={2}>This report does not include student payment collections.</Typography><AppTable columns={[{ key: 'food', label: 'Food' }, { key: 'date', label: 'Date' }, { key: 'orders', label: 'Orders' }, { key: 'originalCost', label: 'Original Cost / Food' }, { key: 'totalCost', label: 'Total Original Cost' }, { key: 'messPayment', label: 'Admin / Mess Payment' }]} rows={costRows} /></AppCard></Grid>
    <Grid size={{ xs: 12 }}><AppCard><Typography variant="h6" fontWeight={800} mb={.5}>2. Student Payment Report</Typography><Typography variant="body2" color="text.secondary" mb={2}>This report contains student charges and collections only.</Typography><AppTable columns={[{ key: 'student', label: 'Student' }, { key: 'total', label: 'Total Amount' }, { key: 'paid', label: 'Amount Paid' }, { key: 'balance', label: 'Balance' }, { key: 'paymentDate', label: 'Payment Date' }, { key: 'status', label: 'Status' }]} rows={paymentRows} /></AppCard></Grid>
  </Grid></>;
}
export default FinancialReportsPage;

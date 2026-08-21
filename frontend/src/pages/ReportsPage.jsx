import { useEffect, useMemo, useState } from 'react';
import { Box, Button, Grid, Stack, Typography } from '@mui/material';
import FileDownloadRoundedIcon from '@mui/icons-material/FileDownloadRounded';
import AppCard from '../components/AppCard';
import ErrorState from '../components/ErrorState';
import LoadingState from '../components/LoadingState';
import { MetricCard, PageHeading } from './DashboardComponents';
import { getAnalytics } from '../services/chiefService';

const periods = ['daily', 'weekly', 'monthly'];
const label = (date) => new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(new Date(`${date}T00:00:00`));

const pdfText = (value) => String(value ?? '').replace(/[^\x20-\x7E]/g, ' ').replace(/([\\()])/g, '\\$1');

function downloadPdfReport(period, report) {
  const { summary, series, meal_demand: mealDemand, inventory_usage: inventoryUsage } = report;
  const lines = [
    'CampusBite - Analytics Report',
    `Period: ${period.charAt(0).toUpperCase()}${period.slice(1)}`,
    `Generated: ${new Date().toLocaleString()}`,
    '',
    'Summary',
    `Food waste reduction: ${summary.waste_reduction_percent}%`,
    `Predicted food waste: ${summary.waste_kg} kg`,
    `Confirmed attendance: ${summary.attendance}`,
    `Confirmed meal bookings: ${summary.demand}`,
    `Inventory issued: ${summary.inventory_used} units`,
    '',
    'Attendance and Waste Trend',
    ...(series.length ? series.map((item) => `${label(item.date)} - Attendance: ${item.attendance}, Predicted waste: ${item.waste_kg} kg`) : ['No data recorded for this period.']),
    '',
    'Meal Demand',
    ...(mealDemand.length ? mealDemand.map((item) => `${item.meal_type}: ${item.count}`) : ['No data recorded for this period.']),
    '',
    'Inventory Usage',
    ...(inventoryUsage.length ? inventoryUsage.map((item) => `${item.item}: ${item.quantity}${item.unit ? ` ${item.unit}` : ''}`) : ['No data recorded for this period.']),
  ];
  const pageLines = 42;
  const pages = Array.from({ length: Math.ceil(lines.length / pageLines) }, (_, index) => lines.slice(index * pageLines, (index + 1) * pageLines));
  const objects = ['<< /Type /Catalog /Pages 2 0 R >>', `<< /Type /Pages /Kids [${pages.map((_, index) => `${3 + index * 2} 0 R`).join(' ')}] /Count ${pages.length} >>`];
  pages.forEach((page, index) => {
    const pageId = 3 + index * 2; const contentId = pageId + 1;
    const stream = ['BT', '/F1 12 Tf', '50 790 Td', ...page.map((line, lineIndex) => `${lineIndex ? '0 -17 Td ' : ''}(${pdfText(line)}) Tj`), 'ET'].join('\n');
    objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 842] /Resources << /Font << /F1 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> >> >> /Contents ${contentId} 0 R >>`);
    objects.push(`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`);
  });
  let pdf = '%PDF-1.4\n'; const offsets = [0];
  objects.forEach((object, index) => { offsets.push(pdf.length); pdf += `${index + 1} 0 obj\n${object}\nendobj\n`; });
  const xref = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${offsets.slice(1).map((offset) => `${String(offset).padStart(10, '0')} 00000 n `).join('\n')}\ntrailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  const url = URL.createObjectURL(new Blob([pdf], { type: 'application/pdf' }));
  const anchor = document.createElement('a'); anchor.href = url; anchor.download = `campusbite-${period}-analytics-report.pdf`; anchor.click(); URL.revokeObjectURL(url);
}

function AttendanceChart({ data }) {
  const points = useMemo(() => {
    const max = Math.max(...data.map((item) => item.attendance), 1);
    return data.map((item, index) => `${data.length === 1 ? 50 : (index / (data.length - 1)) * 100},${92 - (item.attendance / max) * 78}`).join(' ');
  }, [data]);
  return <Box><Box component="svg" viewBox="0 0 100 100" preserveAspectRatio="none" sx={{ width: '100%', height: 220, overflow: 'visible' }} aria-label="Attendance trend chart"><line x1="0" y1="92" x2="100" y2="92" stroke="#f2dfd8" strokeWidth="1" /><polyline points={points} fill="none" stroke="#f4511e" strokeWidth="3" vectorEffect="non-scaling-stroke" strokeLinejoin="round" /><polyline points={`0,92 ${points} 100,92`} fill="#f4511e18" stroke="none" /></Box><Stack direction="row" justifyContent="space-between" mt={1}>{data.slice(0, 1).map((item) => <Typography key={item.date} variant="caption" color="text.secondary">{label(item.date)}</Typography>)}<Typography variant="caption" color="text.secondary">{data.length ? label(data[data.length - 1].date) : ''}</Typography></Stack></Box>;
}

function HorizontalBars({ entries, valueKey = 'count', suffix = '' }) {
  const max = Math.max(...entries.map((item) => item[valueKey]), 1);
  if (!entries.length) return <Typography color="text.secondary">No data recorded for this period.</Typography>;
  return <Stack spacing={1.6}>{entries.map((item) => <Box key={`${item.item || item.meal_type}-${item.unit || ''}`}><Stack direction="row" justifyContent="space-between" mb={.5}><Typography textTransform="capitalize" fontWeight={700}>{item.item || item.meal_type}</Typography><Typography variant="body2" color="text.secondary">{item[valueKey]}{suffix || (item.unit ? ` ${item.unit}` : '')}</Typography></Stack><Box sx={{ height: 9, borderRadius: 99, bgcolor: '#fff0e9', overflow: 'hidden' }}><Box sx={{ width: `${(item[valueKey] / max) * 100}%`, height: '100%', borderRadius: 99, bgcolor: 'primary.main' }} /></Box></Box>)}</Stack>;
}

function ReportsPage() {
  const [period, setPeriod] = useState('weekly'); const [report, setReport] = useState(null); const [error, setError] = useState('');
  useEffect(() => { setReport(null); setError(''); getAnalytics(period).then(setReport).catch((e) => setError(e.response?.data?.message || 'Unable to load analytics.')); }, [period]);
  if (!report && !error) return <LoadingState message="Loading analytics…" />;
  if (error) return <ErrorState message={error} />;
  const { summary, series, meal_demand: mealDemand, inventory_usage: inventoryUsage } = report;
  return <><PageHeading title="Analytics dashboard" subtitle="Food operations and demand insights." action={<Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" justifyContent="flex-end"><Button variant="outlined" size="small" startIcon={<FileDownloadRoundedIcon />} onClick={() => downloadPdfReport(period, report)}>Download PDF</Button>{periods.map((item) => <Button key={item} variant={period === item ? 'contained' : 'outlined'} size="small" onClick={() => setPeriod(item)} sx={{ textTransform: 'capitalize' }}>{item}</Button>)}</Stack>} />
    <Grid container spacing={2.5}><Grid size={{ xs: 12, sm: 6, lg: 3 }}><MetricCard title="Food waste reduction" value={`${summary.waste_reduction_percent}%`} note={`${summary.waste_kg} kg predicted waste`} color="#2e7d32" /></Grid><Grid size={{ xs: 12, sm: 6, lg: 3 }}><MetricCard title="Attendance" value={summary.attendance} note="Confirmed meal attendance" /></Grid><Grid size={{ xs: 12, sm: 6, lg: 3 }}><MetricCard title="Meal demand" value={summary.demand} note="Confirmed meal bookings" color="#1565c0" /></Grid><Grid size={{ xs: 12, sm: 6, lg: 3 }}><MetricCard title="Inventory usage" value={summary.inventory_used} note="Units issued from inventory" color="#7b1fa2" /></Grid>
      <Grid size={{ xs: 12, md: 7 }}><AppCard sx={{ height: '100%' }}><Typography variant="h6" fontWeight={800} mb={.5}>Attendance trend</Typography><Typography variant="body2" color="text.secondary" mb={2}>Confirmed bookings across the selected period.</Typography><AttendanceChart data={series} /></AppCard></Grid>
      <Grid size={{ xs: 12, md: 5 }}><AppCard sx={{ height: '100%' }}><Typography variant="h6" fontWeight={800} mb={.5}>Meal demand</Typography><Typography variant="body2" color="text.secondary" mb={2.5}>Demand by meal type.</Typography><HorizontalBars entries={mealDemand} /></AppCard></Grid>
      <Grid size={{ xs: 12, md: 6 }}><AppCard><Typography variant="h6" fontWeight={800} mb={.5}>Food waste</Typography><Typography variant="body2" color="text.secondary" mb={2.5}>Daily waste prediction in kilograms.</Typography><HorizontalBars entries={series.map((item) => ({ item: label(item.date), quantity: item.waste_kg }))} valueKey="quantity" suffix=" kg" /></AppCard></Grid>
      <Grid size={{ xs: 12, md: 6 }}><AppCard><Typography variant="h6" fontWeight={800} mb={.5}>Inventory usage</Typography><Typography variant="body2" color="text.secondary" mb={2.5}>Most-used ingredients in this period.</Typography><HorizontalBars entries={inventoryUsage} valueKey="quantity" /></AppCard></Grid>
    </Grid></>;
}
export default ReportsPage;

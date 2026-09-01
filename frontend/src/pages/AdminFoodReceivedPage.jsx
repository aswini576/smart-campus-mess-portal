import { useEffect, useState } from 'react';
import { Box, Chip, InputAdornment, TextField, Typography } from '@mui/material';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import AppCard from '../components/AppCard';
import AppTable from '../components/AppTable';
import ErrorState from '../components/ErrorState';
import LoadingState from '../components/LoadingState';
import { PageHeading } from './DashboardComponents';
import { getFoodReceipts } from '../services/chiefService';

function AdminFoodReceivedPage() {
  const [receipts, setReceipts] = useState(null); const [search, setSearch] = useState(''); const [error, setError] = useState('');
  useEffect(() => { getFoodReceipts().then(({ receipts: data }) => setReceipts(data)).catch((e) => setError(e.response?.data?.message || 'Unable to load food receipts.')); }, []);
  if (!receipts && !error) return <LoadingState message="Loading food receipts…" />;
  const query = search.trim().toLowerCase();
  const filtered = (receipts || []).filter((item) => !query || [item.studentName, item.studentId, item.studentEmail, item.foodName, item.mealType].some((value) => value?.toLowerCase().includes(query)));
  const rows = filtered.map((item) => ({ id: item._id, student: <Box><Typography fontWeight={700}>{item.studentName}</Typography><Typography variant="caption" color="text.secondary">{item.studentId || item.studentEmail}</Typography></Box>, food: <Box><Typography fontWeight={700}>{item.foodName}</Typography><Chip size="small" variant="outlined" label={item.mealType} sx={{ mt: 0.5, textTransform: 'capitalize' }} /></Box>, mealDate: new Date(item.mealDate).toLocaleDateString(), portion: item.portionSize, receivedAt: new Date(item.receivedAt).toLocaleString() }));
  return <><PageHeading title="Food Received" subtitle="Students who confirmed that they collected their meals." />{error && <Box mb={2}><ErrorState message={error} /></Box>}<AppCard><TextField value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search student or food" sx={{ maxWidth: 520, mb: 2.5 }} slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchRoundedIcon /></InputAdornment> } }} /><AppTable columns={[{ key: 'student', label: 'Student' }, { key: 'food', label: 'Food' }, { key: 'mealDate', label: 'Meal Date' }, { key: 'portion', label: 'Size' }, { key: 'receivedAt', label: 'Received Date & Time' }]} rows={rows} />{!rows.length && <Typography color="text.secondary" textAlign="center" py={3}>No food receipts found.</Typography>}</AppCard></>;
}
export default AdminFoodReceivedPage;

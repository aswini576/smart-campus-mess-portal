import { useEffect, useState } from 'react';
import { Box, Chip, Grid, Stack, TextField, Typography } from '@mui/material';
import BlockRoundedIcon from '@mui/icons-material/BlockRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import AppButton from '../components/AppButton';
import AppCard from '../components/AppCard';
import AppTable from '../components/AppTable';
import ErrorState from '../components/ErrorState';
import LoadingState from '../components/LoadingState';
import { PageHeading } from './DashboardComponents';
import { createUser, deleteUser, getUsers, setStudentApproval } from '../services/adminService';

function UserManagementPage({ role, title }) {
  const [users, setUsers] = useState([]); const [error, setError] = useState(''); const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: '', studentId: '', email: '', password: '' });
  const isStudentPage = role === 'student';
  const load = async () => { setLoading(true); try { setUsers((await getUsers(role)).users); } catch (e) { setError(e.response?.data?.message || 'Unable to load users.'); } finally { setLoading(false); } };
  useEffect(() => { load(); }, [role]);
  const add = async (event) => { event.preventDefault(); setError(''); try { await createUser({ ...form, role }); setForm({ name: '', studentId: '', email: '', password: '' }); load(); } catch (e) { setError(e.response?.data?.message || 'Unable to create account.'); } };
  const changeApproval = async (user) => { try { setError(''); await setStudentApproval(user._id, !Boolean(user.isApproved)); load(); } catch (e) { setError(e.response?.data?.message || 'Unable to update account approval.'); } };
  if (loading) return <LoadingState message={`Loading ${role} accounts…`} />;
  const columns = [{ key: 'name', label: 'Name' }, { key: 'studentId', label: isStudentPage ? 'Student / Staff ID' : 'ID' }, { key: 'email', label: 'Email' }, ...(isStudentPage ? [{ key: 'approval', label: 'Access' }] : []), { key: 'actions', label: 'Actions' }];
  const rows = users.map((user) => ({
    ...user,
    id: user._id,
    studentId: user.studentId || '—',
    approval: isStudentPage && <Chip size="small" label={user.isApproved ? 'Approved' : 'Waiting approval'} color={user.isApproved ? 'success' : 'warning'} />,
    actions: <Stack direction="row" spacing={1} flexWrap="wrap">{isStudentPage && <AppButton size="small" variant="outlined" startIcon={user.isApproved ? <BlockRoundedIcon /> : <CheckCircleRoundedIcon />} onClick={() => changeApproval(user)}>{user.isApproved ? 'Block' : 'Approve'}</AppButton>}<AppButton color="secondary" size="small" startIcon={<DeleteOutlineRoundedIcon />} onClick={async () => { try { await deleteUser(user._id); load(); } catch (e) { setError(e.response?.data?.message || 'Unable to delete account.'); } }}>Remove</AppButton></Stack>,
  }));
  return <><PageHeading title={title} subtitle={isStudentPage ? 'Approve student and staff registrations before they can access the portal.' : 'Create and manage mess chief portal accounts.'} />{error && <Box mb={2}><ErrorState message={error} /></Box>}<Grid container spacing={2.5}><Grid size={{ xs: 12, lg: 4 }}><AppCard><Typography variant="h6" fontWeight={800} mb={2}>Add account</Typography><Stack component="form" onSubmit={add} spacing={2}><TextField label="Full name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />{isStudentPage && <TextField label="Student / Staff ID" value={form.studentId} onChange={(e) => setForm({ ...form, studentId: e.target.value })} />}<TextField label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required /><TextField label="Temporary password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required inputProps={{ minLength: 8 }} /><AppButton type="submit">Create account</AppButton></Stack></AppCard></Grid><Grid size={{ xs: 12, lg: 8 }}><AppCard><Typography variant="h6" fontWeight={800} mb={2}>{users.length} accounts</Typography><AppTable columns={columns} rows={rows} /></AppCard></Grid></Grid></>;
}

export default UserManagementPage;

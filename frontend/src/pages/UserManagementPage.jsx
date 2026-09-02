import { useEffect, useState } from 'react';
import { Avatar, Box, Chip, Grid, IconButton, InputAdornment, Stack, TextField, Typography } from '@mui/material';
import BlockRoundedIcon from '@mui/icons-material/BlockRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded';
import VisibilityOffRoundedIcon from '@mui/icons-material/VisibilityOffRounded';
import AppButton from '../components/AppButton';
import AppCard from '../components/AppCard';
import AppTable from '../components/AppTable';
import ErrorState from '../components/ErrorState';
import LoadingState from '../components/LoadingState';
import { PageHeading } from './DashboardComponents';
import { createUser, deleteUser, getUsers, setStudentApproval } from '../services/adminService';

function UserManagementPage({ role, title }) {
  const [users, setUsers] = useState([]); const [selectedUser, setSelectedUser] = useState(null); const [error, setError] = useState(''); const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: '', studentId: '', email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const isStudentPage = role === 'student';
  const load = async () => { setLoading(true); try { const data = (await getUsers(role)).users; setUsers(data); setSelectedUser((current) => data.find((user) => user._id === current?._id) || data[0] || null); } catch (e) { setError(e.response?.data?.message || 'Unable to load users.'); } finally { setLoading(false); } };
  useEffect(() => { load(); }, [role]);
  const add = async (event) => { event.preventDefault(); setError(''); try { await createUser({ ...form, role }); setForm({ name: '', studentId: '', email: '', password: '' }); load(); } catch (e) { setError(e.response?.data?.message || 'Unable to create account.'); } };
  const changeApproval = async (user) => { try { setError(''); await setStudentApproval(user._id, !Boolean(user.isApproved)); load(); } catch (e) { setError(e.response?.data?.message || 'Unable to update account approval.'); } };
  if (loading) return <LoadingState message={`Loading ${role} accounts…`} />;
  const columns = [{ key: 'name', label: 'Name' }, { key: 'studentId', label: isStudentPage ? 'Student / Staff ID' : 'ID' }, { key: 'email', label: 'Email' }, ...(isStudentPage ? [{ key: 'approval', label: 'Access' }] : []), { key: 'actions', label: 'Actions' }];
  const rows = users.map((user) => ({
    ...user,
    id: user._id,
    bulkDelete: () => deleteUser(user._id),
    name: <Stack direction="row" spacing={1.25} alignItems="center"><Avatar src={user.profileImage || undefined} alt={user.name} sx={{ width: 42, height: 42, bgcolor: 'primary.main' }}>{user.name?.charAt(0).toUpperCase()}</Avatar><Typography fontWeight={750}>{user.name}</Typography></Stack>,
    studentId: user.studentId || '—',
    approval: isStudentPage && <Chip size="small" label={user.isApproved ? 'Approved' : 'Waiting approval'} color={user.isApproved ? 'success' : 'warning'} />,
    actions: <Stack direction="row" spacing={1} flexWrap="wrap"><AppButton size="small" variant="outlined" onClick={() => setSelectedUser(user)}>View Profile</AppButton>{isStudentPage && <AppButton size="small" variant="outlined" startIcon={user.isApproved ? <BlockRoundedIcon /> : <CheckCircleRoundedIcon />} onClick={() => changeApproval(user)}>{user.isApproved ? 'Block' : 'Approve'}</AppButton>}<AppButton color="secondary" size="small" startIcon={<DeleteOutlineRoundedIcon />} onClick={async () => { try { await deleteUser(user._id); load(); } catch (e) { setError(e.response?.data?.message || 'Unable to delete account.'); } }}>Remove</AppButton></Stack>,
  }));
  return <><PageHeading title={title} subtitle={isStudentPage ? 'Approve student and staff registrations before they can access the portal.' : 'Create and manage mess chief portal accounts.'} />{error && <Box mb={2}><ErrorState message={error} /></Box>}<Grid container spacing={2.5}><Grid size={{ xs: 12, lg: 4 }}><AppCard><Typography variant="h6" fontWeight={800} mb={2}>Add account</Typography><Stack component="form" onSubmit={add} spacing={2}><TextField label="Full name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />{isStudentPage && <TextField label="Student / Staff ID" value={form.studentId} onChange={(e) => setForm({ ...form, studentId: e.target.value })} />}<TextField label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required /><TextField label="Temporary password" type={showPassword ? 'text' : 'password'} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required inputProps={{ minLength: 8 }} slotProps={{ input: { endAdornment: <InputAdornment position="end"><IconButton edge="end" onClick={() => setShowPassword((current) => !current)} aria-label={showPassword ? 'Hide temporary password' : 'Show temporary password'}>{showPassword ? <VisibilityOffRoundedIcon /> : <VisibilityRoundedIcon />}</IconButton></InputAdornment> } }} /><AppButton type="submit">Create account</AppButton></Stack></AppCard></Grid><Grid size={{ xs: 12, lg: 8 }}><Stack spacing={2.5}>{selectedUser && <AppCard><Stack direction={{ xs: 'column', sm: 'row' }} spacing={2.5} alignItems={{ xs: 'center', sm: 'flex-start' }}><Avatar src={selectedUser.profileImage || undefined} alt={selectedUser.name} sx={{ width: 112, height: 112, bgcolor: 'primary.main', fontSize: 42 }}>{selectedUser.name?.charAt(0).toUpperCase()}</Avatar><Box textAlign={{ xs: 'center', sm: 'left' }}><Typography variant="h5" fontWeight={850}>{selectedUser.name}</Typography><Typography color="text.secondary" mt={.5}>{selectedUser.studentId || 'No Student / Staff ID'}</Typography><Typography color="text.secondary">{selectedUser.email}</Typography><Chip size="small" sx={{ mt: 1.5 }} label={selectedUser.isApproved ? 'Approved' : 'Waiting approval'} color={selectedUser.isApproved ? 'success' : 'warning'} /></Box></Stack></AppCard>}<AppCard><Typography variant="h6" fontWeight={800} mb={2}>{users.length} accounts</Typography><AppTable columns={columns} rows={rows} /></AppCard></Stack></Grid></Grid></>;
}

export default UserManagementPage;

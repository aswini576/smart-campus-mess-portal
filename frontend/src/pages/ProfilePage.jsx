import { useEffect, useState } from 'react';
import { Alert, Box, Stack, TextField, Typography } from '@mui/material';
import AppButton from '../components/AppButton'; import AppCard from '../components/AppCard'; import ErrorState from '../components/ErrorState'; import LoadingState from '../components/LoadingState'; import { PageHeading } from './DashboardComponents';
import { getProfile, updateProfile } from '../services/studentService';
function ProfilePage() {
  const [profile, setProfile] = useState(null); const [name, setName] = useState(''); const [studentId, setStudentId] = useState(''); const [error, setError] = useState(''); const [saved, setSaved] = useState(false);
  useEffect(() => { getProfile().then(({ user }) => { setProfile(user); setName(user.name || ''); setStudentId(user.studentId || ''); }).catch((e) => setError(e.response?.data?.message || 'Unable to load profile.')); }, []);
  const save = async (event) => { event.preventDefault(); setError(''); setSaved(false); try { const { user } = await updateProfile({ name, studentId }); setProfile(user); setSaved(true); } catch (e) { setError(e.response?.data?.message || 'Unable to update profile.'); } };
  if (!profile && !error) return <LoadingState message="Loading profile…" />;
  return <><PageHeading title="My profile" subtitle="Keep your student and staff account information up to date." />{error && <Box mb={2}><ErrorState message={error} /></Box>}{profile && <AppCard sx={{ maxWidth: 640 }}><Stack component="form" onSubmit={save} spacing={2.25}><Typography variant="h6" fontWeight={800}>Account details</Typography>{saved && <Alert severity="success">Profile updated.</Alert>}<TextField label="Full name" value={name} onChange={(event) => setName(event.target.value)} required /><TextField label="Student / Staff ID" value={studentId} onChange={(event) => setStudentId(event.target.value)} /><TextField label="Campus email" value={profile.email} disabled helperText="Email changes are not available yet." /><TextField label="Role" value="Student / Staff" disabled /><AppButton type="submit" sx={{ alignSelf: 'flex-start' }}>Save changes</AppButton></Stack></AppCard>}</>;
}
export default ProfilePage;

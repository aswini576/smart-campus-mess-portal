import { useEffect, useState } from 'react';
import { Alert, Avatar, Box, Button, Stack, TextField, Typography } from '@mui/material';
import PhotoCameraRoundedIcon from '@mui/icons-material/PhotoCameraRounded';
import AppButton from '../components/AppButton';
import AppCard from '../components/AppCard';
import ErrorState from '../components/ErrorState';
import LoadingState from '../components/LoadingState';
import { PageHeading } from './DashboardComponents';
import { getProfile, updateProfile } from '../services/studentService';
import { useAuth } from '../context/AuthContext';

function ProfilePage() {
  const [profile, setProfile] = useState(null);
  const [name, setName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [profileImage, setProfileImage] = useState(null);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [savingImage, setSavingImage] = useState(false);
  const { token, setAuthSession } = useAuth();

  useEffect(() => {
    getProfile().then(({ user }) => {
      setProfile(user);
      setName(user.name || '');
      setStudentId(user.studentId || '');
      setProfileImage(user.profileImage || null);
    }).catch((e) => setError(e.response?.data?.message || 'Unable to load profile.'));
  }, []);

  const persistImage = async (nextImage) => {
    const previousImage = profileImage;
    setProfileImage(nextImage);
    setSavingImage(true);
    setError('');
    setSaved(false);
    try {
      const { user } = await updateProfile({ name, studentId, profileImage: nextImage });
      setProfile(user);
      setProfileImage(user.profileImage || null);
      setAuthSession({ token, user });
      setSaved(true);
    } catch (e) {
      setProfileImage(previousImage);
      setError(e.response?.data?.message || 'Unable to save profile image.');
    } finally {
      setSavingImage(false);
    }
  };

  const selectImage = (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) return setError('Please choose a JPG, PNG, or WebP image.');
    if (file.size > 1024 * 1024) return setError('Profile image must be smaller than 1 MB.');
    const reader = new FileReader();
    reader.onload = () => persistImage(reader.result);
    reader.onerror = () => setError('Unable to read the selected image.');
    reader.readAsDataURL(file);
  };

  const save = async (event) => {
    event.preventDefault();
    setError(''); setSaved(false);
    try {
      const { user } = await updateProfile({ name, studentId, profileImage });
      setProfile(user);
      setProfileImage(user.profileImage || null);
      setAuthSession({ token, user });
      setSaved(true);
    } catch (e) {
      setError(e.response?.data?.message || 'Unable to update profile.');
    }
  };

  if (!profile && !error) return <LoadingState message="Loading profile…" />;

  return <><PageHeading title="My profile" subtitle="Keep your student and staff account information up to date." />{error && <Box mb={2}><ErrorState message={error} /></Box>}{profile && <AppCard sx={{ maxWidth: 640 }}><Stack component="form" onSubmit={save} spacing={2.25}><Typography variant="h6" fontWeight={800}>Account details</Typography>{saved && <Alert severity="success">Profile updated and saved.</Alert>}<Stack direction={{ xs: 'column', sm: 'row' }} alignItems="center" spacing={2}><Avatar src={profileImage || undefined} alt={name} sx={{ width: 112, height: 112, bgcolor: 'primary.main', fontSize: 42 }}>{name?.charAt(0).toUpperCase()}</Avatar><Stack spacing={1} alignItems={{ xs: 'center', sm: 'flex-start' }}><Button component="label" variant="outlined" disabled={savingImage} startIcon={<PhotoCameraRoundedIcon />} sx={{ textTransform: 'none' }}>{savingImage ? 'Saving image…' : 'Choose profile image'}<input hidden type="file" accept="image/jpeg,image/png,image/webp" onChange={selectImage} /></Button>{profileImage && <Button type="button" color="error" size="small" disabled={savingImage} onClick={() => persistImage(null)}>Remove image</Button>}<Typography variant="caption" color="text.secondary">JPG, PNG or WebP · Maximum 1 MB · Saves automatically</Typography></Stack></Stack><TextField label="Full name" value={name} onChange={(event) => setName(event.target.value)} required /><TextField label="Student / Staff ID" value={studentId} onChange={(event) => setStudentId(event.target.value)} /><TextField label="Campus email" value={profile.email} disabled helperText="Email changes are not available yet." /><TextField label="Role" value="Student / Staff" disabled /><AppButton type="submit" disabled={savingImage} sx={{ alignSelf: 'flex-start' }}>Save changes</AppButton></Stack></AppCard>}</>;
}

export default ProfilePage;

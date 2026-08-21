import { useState } from 'react';
import { Alert, Box, Button, Container, Paper, Stack, TextField, Typography } from '@mui/material';
import RestaurantMenuRoundedIcon from '@mui/icons-material/RestaurantMenuRounded';
import { useNavigate } from 'react-router-dom';
import AppButton from '../components/AppButton';
import { resetPassword } from '../services/authService';

function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const result = await resetPassword({ email, password });
      setSuccess(result.message || 'Password reset successfully. You can sign in now.');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to reset password. Check that the API is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center', p: 2, background: 'radial-gradient(circle at top left, #ffd1be, #fff8f5 44%)' }}>
      <Container maxWidth="sm">
        <Paper elevation={0} sx={{ overflow: 'hidden', border: '1px solid #f2dfd8', borderRadius: 4 }}>
          <Box sx={{ bgcolor: 'primary.main', color: 'white', p: { xs: 3, sm: 4 } }}>
            <RestaurantMenuRoundedIcon sx={{ fontSize: 40 }} />
            <Typography variant="h4" fontWeight={800} mt={1}>CampusBite</Typography>
            <Typography>Better meal planning. Less food waste.</Typography>
          </Box>

          <Stack component="form" onSubmit={handleSubmit} noValidate spacing={2.25} sx={{ p: { xs: 3, sm: 4 } }}>
            <Box>
              <Typography variant="h5" fontWeight={800}>Forgot Password</Typography>
              <Typography color="text.secondary" variant="body2">Enter your account email and set a new password.</Typography>
            </Box>

            {error && <Alert severity="error">{error}</Alert>}
            {success && <Alert severity="success">{success}</Alert>}

            <TextField label="Email address" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="email" />
            <TextField label="New password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required autoComplete="new-password" slotProps={{ htmlInput: { minLength: 8 } }} />
            <TextField label="Confirm new password" type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} required autoComplete="new-password" slotProps={{ htmlInput: { minLength: 8 } }} />

            <AppButton type="submit" size="large" disabled={loading}>{loading ? 'Please wait...' : 'Reset Password'}</AppButton>
            <Button type="button" onClick={() => navigate('/login')} size="small" sx={{ alignSelf: 'center', fontWeight: 800, textTransform: 'none' }}>Back to Login</Button>
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
}

export default ForgotPasswordPage;

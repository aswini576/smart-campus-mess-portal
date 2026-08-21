import { useState } from 'react';
import { Alert, Box, Button, Container, Paper, Stack, TextField, Typography } from '@mui/material';
import RestaurantMenuRoundedIcon from '@mui/icons-material/RestaurantMenuRounded';
import { useNavigate } from 'react-router-dom';
import AppButton from '../components/AppButton';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function AdminForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      setError('Admin email is required.');
      return;
    }
    if (!emailPattern.test(normalizedEmail)) {
      setError('Enter a valid admin email address.');
      return;
    }

    setSuccess('If an admin account exists for this email, a reset link will be sent.');
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
              <Typography variant="h5" fontWeight={800}>Admin Forgot Password</Typography>
              <Typography color="text.secondary" variant="body2">Enter your admin email to request a password reset link.</Typography>
            </Box>

            {error && <Alert severity="error">{error}</Alert>}
            {success && <Alert severity="success">{success}</Alert>}

            <TextField
              label="Admin email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              fullWidth
              autoComplete="email"
              error={Boolean(error)}
            />

            <AppButton type="submit" size="large">Send Reset Link</AppButton>
            <Button type="button" onClick={() => navigate('/admin/login')} size="small" sx={{ alignSelf: 'center', fontWeight: 800, textTransform: 'none' }}>Back to Admin Login</Button>
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
}

export default AdminForgotPasswordPage;

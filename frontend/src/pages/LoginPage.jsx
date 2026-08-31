import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Alert, Box, Button, Checkbox, Chip, FormControlLabel, Paper, Stack, TextField, Typography } from '@mui/material';
import RestaurantMenuRoundedIcon from '@mui/icons-material/RestaurantMenuRounded';
import AppButton from '../components/AppButton';
import { login } from '../services/authService';
import { useAuth } from '../context/AuthContext';
import './LoginPage.css';

const rolePaths = { student: '/student', admin: '/admin' };

function LoginPage() {
  const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(''); const [loading, setLoading] = useState(false);
  const { user, setAuthSession } = useAuth(); const navigate = useNavigate();
  if (user) return <Navigate to={rolePaths[user.role] || '/login'} replace />;
  const handleSubmit = async (event) => { event.preventDefault(); setError(''); setLoading(true); try { const session = await login({ email, password }); setAuthSession(session); navigate(rolePaths[session.user.role] || '/login', { replace: true }); } catch (requestError) { setError(requestError.response?.data?.message || 'Unable to sign in. Check that the API is running.'); } finally { setLoading(false); } };
  return <Box className="portal-login"><Box className="portal-login__brand" component="section"><Box className="portal-login__glow" aria-hidden="true" /><Stack className="portal-login__brand-content" alignItems="center" spacing={3}><Box className="portal-login__logo"><RestaurantMenuRoundedIcon /></Box><Typography className="portal-login__name" component="h1">Campus<span>Bite</span></Typography><Typography className="portal-login__tagline">Smart Campus Mess and Food Waste Minimization Portal</Typography><Typography className="portal-login__description">Plan meals, confirm attendance, manage payments, and reduce food waste—effortlessly.</Typography><Stack direction="row" useFlexGap flexWrap="wrap" justifyContent="center" gap={1.25}>{['Smart Meal Planning', 'Live Reports', 'Waste Reduction', 'Role Management'].map((feature) => <Chip key={feature} label={feature} className="portal-login__chip" />)}</Stack><Typography className="portal-login__copyright">CAMPUSBITE © 2026</Typography></Stack></Box><Box className="portal-login__form-side" component="main"><Paper className="portal-login__card" elevation={0}><Box className="portal-login__accent" /><Stack component="form" onSubmit={handleSubmit} spacing={2.1}><Box><Typography className="portal-login__eyebrow">WELCOME BACK</Typography><Typography className="portal-login__heading" component="h2">Sign In</Typography><Typography className="portal-login__helper">Use the username and password provided by your administrator.</Typography></Box>{error && <Alert severity="error">{error}</Alert>}<TextField label="Email or Username" type="text" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="username" /><TextField label="Password" type={showPassword ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} required autoComplete="current-password" /><Box className="portal-login__options"><FormControlLabel control={<Checkbox checked={showPassword} onChange={(event) => setShowPassword(event.target.checked)} />} label="Show Password" /><Button type="button" onClick={() => navigate('/forgot-password')} size="small">Forgot Password?</Button></Box><AppButton className="portal-login__submit" type="submit" size="large" disabled={loading}>{loading ? 'Please wait…' : 'Access Dashboard'}</AppButton><Typography className="portal-login__switch">Need an account? Please contact your administrator.</Typography></Stack><Typography className="portal-login__card-footer">SMART CAMPUS MESS SYSTEM © 2026</Typography></Paper></Box></Box>;
}

export default LoginPage;

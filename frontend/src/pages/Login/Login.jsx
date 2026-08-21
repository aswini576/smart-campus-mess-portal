import { useState } from 'react';
import {
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  IconButton,
  InputAdornment,
  Link,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined';
import RestaurantMenuRoundedIcon from '@mui/icons-material/RestaurantMenuRounded';
import './Login.css';

function Login() {
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (event) => {
    event.preventDefault();
  };

  return (
    <Box className="login-page">
      <Box className="login-intro" component="section">
        <Box className="login-intro__background" aria-hidden="true" />
        <Box className="login-intro__overlay" aria-hidden="true" />

        <Stack className="login-intro__content" alignItems="center" spacing={2.5}>
          <Box className="login-logo" aria-label="Smart Campus Mess logo">
            <RestaurantMenuRoundedIcon className="login-logo__icon" />
          </Box>

          <Typography component="h1" className="login-title">
            Smart Campus Mess and Food Waste Minimization Portal
          </Typography>
          <Typography component="p" className="login-subtitle">
            Welcome Back! Please Sign In
          </Typography>
        </Stack>
      </Box>

      <Box className="login-form-panel" component="main">
        <Paper className="login-card" elevation={0}>
          <Stack spacing={1} className="login-card__heading">
            <Typography component="h2" className="login-card__title">
              Sign In
            </Typography>
            <Typography className="login-card__description">
              Enter your details to access the campus mess portal.
            </Typography>
          </Stack>

          <Stack component="form" onSubmit={handleSubmit} spacing={2.5}>
            <TextField
              id="login-username"
              label="Username"
              name="username"
              fullWidth
              required
              autoComplete="username"
              variant="outlined"
            />

            <TextField
              id="login-password"
              label="Password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              fullWidth
              required
              autoComplete="current-password"
              variant="outlined"
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        onClick={() => setShowPassword((visible) => !visible)}
                        onMouseDown={(event) => event.preventDefault()}
                        edge="end"
                      >
                        {showPassword ? (
                          <VisibilityOffOutlinedIcon />
                        ) : (
                          <VisibilityOutlinedIcon />
                        )}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
            />

            <FormControlLabel
              control={
                <Checkbox
                  checked={showPassword}
                  onChange={(event) => setShowPassword(event.target.checked)}
                />
              }
              label="Show Password"
            />

            <Box className="login-options">
              <FormControlLabel
                className="remember-me"
                control={<Checkbox name="rememberMe" color="primary" />}
                label="Remember Me"
              />
              <Link className="forgot-password" href="#" underline="hover">
                Forgot Password?
              </Link>
            </Box>

            <Button className="sign-in-button" type="submit" variant="contained" size="large">
              Sign In
            </Button>
          </Stack>
        </Paper>
      </Box>
    </Box>
  );
}

export default Login;

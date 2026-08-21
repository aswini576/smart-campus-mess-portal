import { useMemo, useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import MainLayout from './layouts/MainLayout';
import LoginPage from './pages/LoginPage';
import StudentDashboard from './pages/StudentDashboard';
import MessChiefDashboard from './pages/MessChiefDashboard';
import AdminDashboard from './pages/AdminDashboard';
import ProtectedRoute from './components/ProtectedRoute';
import MealBookingPage from './pages/MealBookingPage';
import FeedbackPage from './pages/FeedbackPage';
import ProfilePage from './pages/ProfilePage';
import MenuManagementPage from './pages/MenuManagementPage';
import IngredientManagementPage from './pages/IngredientManagementPage';
import UserManagementPage from './pages/UserManagementPage';
import ReportsPage from './pages/ReportsPage';
import SettingsPage from './pages/SettingsPage';
import MealRecoveryPage from './pages/MealRecoveryPage';
import ChiefFeedbackPage from './pages/ChiefFeedbackPage';
import InventoryDashboardPage from './pages/InventoryDashboardPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import { ThemeModeProvider } from './context/ThemeModeContext';
import StudentPaymentsPage from './pages/StudentPaymentsPage';
import AdminPaymentsPage from './pages/AdminPaymentsPage';
import AdminFoodOrdersPage from './pages/AdminFoodOrdersPage';
import AdminStudentMenuPage from './pages/AdminStudentMenuPage';

function App() {
  const [mode] = useState('light');
  const toggleMode = () => {};
  const theme = useMemo(() => createTheme({
    palette: {
      mode,
      primary: { main: '#ff5722', dark: '#e64a19', light: '#ff8a65', contrastText: '#ffffff' },
      secondary: { main: '#f97316' },
      background: { default: '#fff7ed', paper: '#ffffff' },
      text: { primary: '#1e293b', secondary: '#64748b' },
      divider: '#e7e5e4',
    },
    typography: { fontFamily: 'Inter, "Segoe UI", Roboto, Arial, sans-serif', h4: { fontWeight: 800, letterSpacing: '-0.035em' }, h6: { fontWeight: 750, letterSpacing: '-0.015em' }, button: { fontWeight: 700, letterSpacing: '.01em' } },
    shape: { borderRadius: 16 },
    components: {
      MuiTextField: {
        defaultProps: { fullWidth: true },
      },
      MuiPaper: { styleOverrides: { root: { backgroundImage: 'none' } } },
      MuiCard: { styleOverrides: { root: { backgroundColor: '#ffffff', border: '1px solid #e7e5e4', boxShadow: '0 8px 24px rgba(30, 41, 59, .07)' } } },
      MuiTableCell: { styleOverrides: { root: { borderColor: '#e7e5e4' }, head: { color: '#475569', backgroundColor: '#fffaf5' } } },
      MuiButton: { styleOverrides: { root: { borderRadius: 10, fontWeight: 750 }, containedPrimary: { boxShadow: '0 6px 14px rgba(255, 87, 34, .22)' } } },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            minHeight: 56,
            '& .MuiOutlinedInput-notchedOutline': { borderWidth: 1 },
            '&:hover .MuiOutlinedInput-notchedOutline': { borderWidth: 1 },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderWidth: 2 },
          },
          input: {
            minHeight: '1.4375em',
            paddingTop: 16.5,
            paddingBottom: 16.5,
          },
        },
      },
    },
  }), [mode]);
  return (
    <ThemeModeProvider value={{ mode, toggleMode }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/admin/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/admin/forgot-password" element={<ForgotPasswordPage />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<MainLayout />}>
            <Route element={<ProtectedRoute roles={['student']} />}><Route path="/student" element={<StudentDashboard />} /><Route path="/student/meals" element={<MealBookingPage />} /><Route path="/student/payments" element={<StudentPaymentsPage />} /><Route path="/student/recovery" element={<MealRecoveryPage />} /><Route path="/student/feedback" element={<FeedbackPage />} /><Route path="/student/profile" element={<ProfilePage />} /></Route>
            <Route element={<ProtectedRoute roles={['messChief']} />}><Route path="/mess-chief" element={<MessChiefDashboard />} /><Route path="/mess-chief/menu" element={<MenuManagementPage />} /><Route path="/mess-chief/inventory" element={<InventoryDashboardPage />} /><Route path="/mess-chief/ingredients" element={<IngredientManagementPage />} /><Route path="/mess-chief/analytics" element={<ReportsPage />} /><Route path="/mess-chief/feedback" element={<ChiefFeedbackPage />} /></Route>
            <Route element={<ProtectedRoute roles={['admin']} />}><Route path="/admin" element={<AdminDashboard />} /><Route path="/admin/menu" element={<MenuManagementPage />} /><Route path="/admin/student-menu" element={<AdminStudentMenuPage />} /><Route path="/admin/orders" element={<AdminFoodOrdersPage />} /><Route path="/admin/students" element={<UserManagementPage role="student" title="Student and staff" />} /><Route path="/admin/mess-chiefs" element={<UserManagementPage role="messChief" title="Mess chief management" />} /><Route path="/admin/payments" element={<AdminPaymentsPage />} /><Route path="/admin/feedback" element={<ChiefFeedbackPage />} /><Route path="/admin/reports" element={<ReportsPage />} /><Route path="/admin/settings" element={<SettingsPage />} /></Route>
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </ThemeProvider>
    </ThemeModeProvider>
  );
}

export default App;

import { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { AppBar, Avatar, Box, Divider, Drawer, IconButton, List, ListItemButton, ListItemIcon, ListItemText, Toolbar, Typography, useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import MenuRoundedIcon from '@mui/icons-material/MenuRounded';
import RestaurantMenuRoundedIcon from '@mui/icons-material/RestaurantMenuRounded';
import SpaceDashboardRoundedIcon from '@mui/icons-material/SpaceDashboardRounded';
import AdminPanelSettingsRoundedIcon from '@mui/icons-material/AdminPanelSettingsRounded';
import CalendarMonthRoundedIcon from '@mui/icons-material/CalendarMonthRounded';
import StarRoundedIcon from '@mui/icons-material/StarRounded';
import PersonRoundedIcon from '@mui/icons-material/PersonRounded';
import AssessmentRoundedIcon from '@mui/icons-material/AssessmentRounded';
import GroupsRoundedIcon from '@mui/icons-material/GroupsRounded';
import SwapHorizRoundedIcon from '@mui/icons-material/SwapHorizRounded';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import PaymentsRoundedIcon from '@mui/icons-material/PaymentsRounded';
import ReceiptLongRoundedIcon from '@mui/icons-material/ReceiptLongRounded';
import { useAuth } from '../context/AuthContext';
import sharedPagesBackground from '../components/images/shared-pages-background.jpg';

const drawerWidth = 260;
const links = [
  { label: 'Dashboard', to: '/student', icon: <SpaceDashboardRoundedIcon />, role: 'student' }, { label: 'Weekly menu', to: '/student/meals', icon: <CalendarMonthRoundedIcon />, role: 'student' }, { label: 'My payments', to: '/student/payments', icon: <PaymentsRoundedIcon />, role: 'student' }, { label: 'Meal recovery', to: '/student/recovery', icon: <SwapHorizRoundedIcon />, role: 'student' }, { label: 'Meal feedback', to: '/student/feedback', icon: <StarRoundedIcon />, role: 'student' }, { label: 'My profile', to: '/student/profile', icon: <PersonRoundedIcon />, role: 'student' },
  { label: 'Admin dashboard', to: '/admin', icon: <AdminPanelSettingsRoundedIcon />, role: 'admin' }, { label: 'Menu management', to: '/admin/menu', icon: <RestaurantMenuRoundedIcon />, role: 'admin' }, { label: 'Student menu preview', to: '/admin/student-menu', icon: <CalendarMonthRoundedIcon />, role: 'admin' }, { label: 'Food orders', to: '/admin/orders', icon: <ReceiptLongRoundedIcon />, role: 'admin' }, { label: 'Food received', to: '/admin/food-received', icon: <ReceiptLongRoundedIcon />, role: 'admin' }, { label: 'Student and staff', to: '/admin/students', icon: <GroupsRoundedIcon />, role: 'admin' }, { label: 'Payments', to: '/admin/payments', icon: <PaymentsRoundedIcon />, role: 'admin' }, { label: 'Mess payments', to: '/admin/mess-payments', icon: <PaymentsRoundedIcon />, role: 'admin' }, { label: 'Feedback & ratings', to: '/admin/feedback', icon: <StarRoundedIcon />, role: 'admin' }, { label: 'Reports', to: '/admin/reports', icon: <AssessmentRoundedIcon />, role: 'admin' }, { label: 'Financial reports', to: '/admin/financial-reports', icon: <AssessmentRoundedIcon />, role: 'admin' },
];

function MainLayout() {
  const [open, setOpen] = useState(false);
  const theme = useTheme(); const mobile = useMediaQuery(theme.breakpoints.down('md'));
  const location = useLocation(); const navigate = useNavigate();
  const showSharedBackground = location.pathname !== '/admin';
  const { user, logout } = useAuth(); const visibleLinks = links.filter((link) => link.role === user?.role);
  const handleLogout = () => { logout(); navigate('/login', { replace: true }); };
  const drawer = <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: 'background.paper' }}><Box sx={{ height: 64, flexShrink: 0, display: 'flex', alignItems: 'center', gap: 1.2, px: 2.5 }}><Avatar sx={{ bgcolor: 'primary.main' }}><RestaurantMenuRoundedIcon /></Avatar><Box><Typography sx={{ fontSize: '1.18rem', fontWeight: 900, letterSpacing: '.01em' }}>CampusBite</Typography><Typography variant="caption" color="text.secondary" sx={{ fontSize: '.82rem', fontWeight: 600, letterSpacing: '.01em' }}>Smart mess portal</Typography></Box></Box><Divider />
    <List sx={{ px: 1.25, py: 1.5, flexGrow: 1 }}>{visibleLinks.map((link) => <ListItemButton key={link.to} selected={location.pathname === link.to} onClick={() => { navigate(link.to); if (mobile) setOpen(false); }} sx={{ mb: .5, borderRadius: 2.5, '&.Mui-selected': { bgcolor: 'rgba(255, 107, 61, .16)', color: 'primary.light' }, '&.Mui-selected:hover': { bgcolor: 'rgba(255, 107, 61, .22)' } }}><ListItemIcon sx={{ minWidth: 40, color: location.pathname === link.to ? 'primary.main' : 'text.secondary' }}>{link.icon}</ListItemIcon><ListItemText primary={link.label} primaryTypographyProps={{ fontWeight: 650, fontSize: 14 }} /></ListItemButton>)}</List><Divider /><Box sx={{ p: 1.25 }}><ListItemButton onClick={handleLogout} sx={{ borderRadius: 2.5, color: 'error.main' }}><ListItemIcon sx={{ minWidth: 40, color: 'error.main' }}><LogoutRoundedIcon /></ListItemIcon><ListItemText primary="Logout" primaryTypographyProps={{ fontWeight: 700, fontSize: 14 }} /></ListItemButton></Box></Box>;
  return <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}><AppBar position="fixed" elevation={0} sx={{ bgcolor: 'background.paper', color: 'text.primary', borderBottom: 1, borderColor: 'divider', boxShadow: '0 2px 10px rgba(30, 41, 59, .05)', width: { md: `calc(100% - ${drawerWidth}px)` }, ml: { md: `${drawerWidth}px` } }}><Toolbar><IconButton onClick={() => setOpen(true)} sx={{ display: { md: 'none' }, mr: 1 }}><MenuRoundedIcon /></IconButton><Typography sx={{ flexGrow: 1, fontSize: '1.18rem', fontWeight: 900, letterSpacing: '.01em' }}>Food that matters.</Typography><Typography variant="body2" color="text.secondary" sx={{ mr: 1.5, display: { xs: 'none', sm: 'block' }, fontSize: '1.05rem', fontWeight: 900, letterSpacing: '.01em' }}>{user?.name || 'Campus Community'}</Typography><Avatar src={user?.profileImage || undefined} alt={user?.name || 'Campus Community'} sx={{ bgcolor: 'primary.main', width: 34, height: 34 }}>{user?.name?.charAt(0).toUpperCase() || 'C'}</Avatar></Toolbar></AppBar><Box component="nav" sx={{ width: { md: drawerWidth }, flexShrink: 0 }}><Drawer variant="temporary" open={open} onClose={() => setOpen(false)} ModalProps={{ keepMounted: true }} sx={{ display: { md: 'none' }, '& .MuiDrawer-paper': { width: drawerWidth, borderRight: '1px solid #e7e5e4' } }}>{drawer}</Drawer><Drawer variant="permanent" sx={{ display: { xs: 'none', md: 'block' }, width: drawerWidth, '& .MuiDrawer-paper': { width: drawerWidth, boxSizing: 'border-box', borderRight: '1px solid #e7e5e4' } }} open>{drawer}</Drawer></Box><Box component="main" sx={{ position: 'relative', isolation: 'isolate', overflow: 'hidden', flexGrow: 1, minWidth: 0, pt: 9, px: { xs: 2, sm: 3, lg: 4 }, pb: 4, bgcolor: showSharedBackground ? 'transparent' : 'background.default', '&::before': showSharedBackground ? { content: '\"\"', position: 'absolute', zIndex: -2, inset: -20, backgroundImage: `url(${sharedPagesBackground})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed', filter: 'blur(9px)', transform: 'scale(1.04)' } : {}, '&::after': showSharedBackground ? { content: '\"\"', position: 'absolute', zIndex: -1, inset: 0, background: 'rgba(255, 247, 237, .76)' } : {} }}><Box sx={{ position: 'relative', zIndex: 1 }}><Outlet /></Box></Box></Box>;
}
export default MainLayout;

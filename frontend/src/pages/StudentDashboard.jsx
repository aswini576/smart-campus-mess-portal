import { Grid, Typography } from '@mui/material';
import { Link } from 'react-router-dom';
import EventAvailableRoundedIcon from '@mui/icons-material/EventAvailableRounded';
import AppButton from '../components/AppButton';
import AppCard from '../components/AppCard';
import { MetricCard, PageHeading } from './DashboardComponents';
import { useAuth } from '../context/AuthContext';

function StudentDashboard() {
  const { user } = useAuth();

  return (
    <>
      <PageHeading
        title={`Welcome, ${user?.name || 'Student / Staff'}`}
        subtitle="Confirm meals before the deadline and help reduce food waste."
        action={<AppButton component={Link} to="/student/meals" startIcon={<EventAvailableRoundedIcon />} sx={{ position: 'fixed', right: { xs: 20, sm: 32 }, bottom: { xs: 20, sm: 32 }, zIndex: 1200, boxShadow: 6 }}>View weekly menu</AppButton>}
      />
      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, sm: 6, lg: 4 }}><MetricCard title="Meals this week" value="—" note="See your live booking history" /></Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 4 }}><MetricCard title="Attendance" value="—" note="Your attendance data will appear here" color="#e53935" /></Grid>
        <Grid size={{ xs: 12, lg: 4 }}><MetricCard title="Waste avoided" value="—" note="Updated from your confirmations" color="#ff8f00" /></Grid>
        <Grid size={{ xs: 12, lg: 7 }}>
          <AppCard>
            <Typography variant="h6" fontWeight={800}>Plan your meals</Typography>
            <Typography variant="body2" color="text.secondary" mb={2.5}>Confirm attendance, opt out before a deadline, and revisit your booking history.</Typography>
            <AppButton component={Link} to="/student/meals">Open meal bookings</AppButton>
          </AppCard>
        </Grid>
        <Grid size={{ xs: 12, lg: 5 }}>
          <AppCard sx={{ bgcolor: '#5d2114', color: 'white', height: '100%' }}>
            <Typography variant="overline" sx={{ color: '#ffccbc' }}>Daily impact</Typography>
            <Typography variant="h5" fontWeight={800}>Every attendance update helps the kitchen cook smarter.</Typography>
            <Typography variant="body2" sx={{ color: '#ffe5dc', mt: 2 }}>Accurate meal declarations reduce overproduction.</Typography>
          </AppCard>
        </Grid>
      </Grid>
    </>
  );
}

export default StudentDashboard;

import { useEffect, useState } from 'react';
import { Box, Chip, Grid, Stack, Typography } from '@mui/material';
import AppCard from '../components/AppCard';
import ErrorState from '../components/ErrorState';
import LoadingState from '../components/LoadingState';
import { PageHeading } from './DashboardComponents';
import { getWeeklyMenu } from '../services/studentService';

const formatDate = (value) => new Date(value).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });

function AdminStudentMenuPage() {
  const [meals, setMeals] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getWeeklyMenu()
      .then(({ meals: weeklyMeals }) => setMeals(weeklyMeals))
      .catch((requestError) => setError(requestError.response?.data?.message || 'Unable to load the student menu.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingState message="Loading student menu preview..." />;
  if (error) return <ErrorState message={error} />;

  return <>
    <PageHeading title="Student menu preview" subtitle="Review the menu students can see. Bookings stay available only in a student account." />
    <Grid container spacing={2.5}>
      {meals.map((meal) => {
        const deadlinePassed = new Date() > new Date(meal.bookingDeadline);
        const status = deadlinePassed ? 'Deadline passed' : meal.isAvailable ? 'Open for booking' : 'Unavailable';
        return <Grid key={meal._id} size={{ xs: 12, md: 6, xl: 4 }}><AppCard sx={{ height: '100%' }}><Stack direction="row" justifyContent="space-between" spacing={1}><Chip label={meal.mealType} color="primary" size="small" /><Typography variant="caption" color="text.secondary">{formatDate(meal.date)}</Typography></Stack><Typography variant="h6" fontWeight={800} mt={2}>{meal.foodName}</Typography><Typography variant="body2" color="text.secondary" mt={.5}>Confirmed students and staff: {meal.quantity}</Typography><Typography variant="caption" color="text.secondary" display="block" mt={1.5}>Booking deadline: {new Date(meal.bookingDeadline).toLocaleString()}</Typography><Box mt={2}><Chip size="small" label={status} color={deadlinePassed || !meal.isAvailable ? 'default' : 'success'} /></Box></AppCard></Grid>;
      })}
      {!meals.length && <Grid size={{ xs: 12 }}><AppCard><Typography>No meals are scheduled for this week.</Typography></AppCard></Grid>}
    </Grid>
  </>;
}

export default AdminStudentMenuPage;

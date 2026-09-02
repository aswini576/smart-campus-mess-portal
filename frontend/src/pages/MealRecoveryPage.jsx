import { useEffect, useState } from 'react';
import { Alert, Box, Grid, Stack, Typography } from '@mui/material';
import AppButton from '../components/AppButton';
import AppCard from '../components/AppCard';
import ErrorState from '../components/ErrorState';
import LoadingState from '../components/LoadingState';
import { PageHeading } from './DashboardComponents';
import { claimMeal, getAvailableMeals, getClaimedMeals, getOfferedMeals } from '../services/studentService';
import sriLankanMealImage from '../components/images/sri-lankan-meal-restaurant.jpg';
import sriLankanRiceCurryImage from '../components/images/sri-lankan-rice-curry.jpg';

const recoveryImages = [sriLankanMealImage, sriLankanRiceCurryImage];
const mealLabel = (offer) => {
  const meal = offer.orderId?.mealId;
  return meal ? `${meal.mealType} — ${meal.foodName}` : offer.mealType;
};

function MealRecoveryPage() {
  const [available, setAvailable] = useState([]);
  const [offered, setOffered] = useState([]);
  const [claimed, setClaimed] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [imageIndex, setImageIndex] = useState(0);

  const load = async () => {
    setLoading(true);
    try {
      const [availableData, offeredData, claimedData] = await Promise.all([getAvailableMeals(), getOfferedMeals(), getClaimedMeals()]);
      setAvailable(availableData.offeredMeals);
      setOffered(offeredData.offeredMeals);
      setClaimed(claimedData.claimedMeals);
    } catch (e) {
      setError(e.response?.data?.message || 'Unable to load meal recovery options.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);
  useEffect(() => { const timer = window.setInterval(() => setImageIndex((index) => (index + 1) % recoveryImages.length), 3500); return () => window.clearInterval(timer); }, []);

  const claim = async (id) => {
    setError(''); setNotice('');
    try {
      await claimMeal(id);
      setNotice('Meal claimed. Your booking and payment responsibility have been transferred to you.');
      load();
    } catch (e) {
      setError(e.response?.data?.message || 'Unable to claim meal.');
    }
  };

  if (loading) return <LoadingState message="Loading meal recovery…" />;

  return <><PageHeading title="Meal recovery" subtitle="Offer a confirmed meal or claim an available meal before its expiry time." />{error && <Box mb={2}><ErrorState message={error} /></Box>}{notice && <Alert severity="success" sx={{ mb: 2 }}>{notice}</Alert>}<AppCard sx={{ mb: 2.5 }}><Grid container spacing={3} alignItems="stretch"><Grid size={{ xs: 12, md: 7 }}><Stack height="100%" justifyContent="center"><Typography variant="h5" fontWeight={850}>Recover a Meal</Typography><Typography color="text.secondary" mt={1}>Claim an available meal before it expires, or track the meals you have offered to others.</Typography><Typography variant="body2" color="warning.dark" fontWeight={700} mt={2}>When a meal is claimed, its payment responsibility moves to the student who claims it.</Typography></Stack></Grid><Grid size={{ xs: 12, md: 5 }}><Box sx={{ position: 'relative', height: 220, overflow: 'hidden', borderRadius: 2.5 }}>{recoveryImages.map((image, index) => <Box key={image} component="img" src={image} alt={`Sri Lankan meal ${index + 1}`} sx={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: imageIndex === index ? 1 : 0, transform: imageIndex === index ? 'scale(1)' : 'scale(1.03)', transition: 'opacity 800ms ease, transform 800ms ease' }} />)}</Box></Grid></Grid></AppCard><Grid container spacing={2.5}><Grid size={{ xs: 12, lg: 6 }}><AppCard><Typography variant="h6" fontWeight={800} mb={2}>Available meals</Typography><Stack spacing={1.5}>{available.length ? available.map((offer) => <Box key={offer._id} sx={{ p: 1.5, border: '1px solid #fff0ea', borderRadius: 2 }}><Typography fontWeight={750}>{mealLabel(offer)}</Typography><Typography variant="body2" color="text.secondary">{new Date(offer.mealDate).toLocaleString()}</Typography><Typography variant="caption" color="text.secondary">Claim before {new Date(offer.expiryTime).toLocaleString()}</Typography><AppButton size="small" sx={{ mt: 1 }} onClick={() => claim(offer._id)}>Claim meal</AppButton></Box>) : <Typography color="text.secondary">There are no meals available to claim right now.</Typography>}</Stack></AppCard></Grid><Grid size={{ xs: 12, lg: 6 }}><AppCard><Typography variant="h6" fontWeight={800} mb={2}>Your recovery activity</Typography><Typography variant="subtitle2" fontWeight={750}>Offered meals</Typography><Stack spacing={1} mt={1} mb={2}>{offered.length ? offered.map((offer) => <Typography key={offer._id} variant="body2">{mealLabel(offer)} · {offer.status}</Typography>) : <Typography variant="body2" color="text.secondary">No meals offered yet.</Typography>}</Stack><Typography variant="subtitle2" fontWeight={750}>Claimed meals</Typography><Stack spacing={1} mt={1}>{claimed.length ? claimed.map((offer) => <Typography key={offer._id} variant="body2">{mealLabel(offer)} · claimed {new Date(offer.claimedTime).toLocaleString()}</Typography>) : <Typography variant="body2" color="text.secondary">No meals claimed yet.</Typography>}</Stack></AppCard></Grid></Grid></>;
}

export default MealRecoveryPage;

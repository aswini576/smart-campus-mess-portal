import { Box, CircularProgress, Typography } from '@mui/material';
function LoadingState({ message = 'Loading…' }) { return <Box sx={{ minHeight: 180, display: 'grid', placeItems: 'center', gap: 1 }}><CircularProgress color="primary" /><Typography color="text.secondary">{message}</Typography></Box>; }
export default LoadingState;

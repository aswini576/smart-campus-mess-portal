import { Alert } from '@mui/material';
function ErrorState({ message = 'Something went wrong. Please try again.' }) { return <Alert severity="error" sx={{ borderRadius: 2 }}>{message}</Alert>; }
export default ErrorState;

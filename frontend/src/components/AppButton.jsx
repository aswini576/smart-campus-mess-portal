import { Button } from '@mui/material';

function AppButton({ children, sx, ...props }) {
  return (
    <Button variant="contained" disableElevation sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700, px: 2.2, ...sx }} {...props}>
      {children}
    </Button>
  );
}

export default AppButton;

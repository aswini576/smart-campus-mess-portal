import { Card, CardContent } from '@mui/material';

function AppCard({ children, sx, contentSx, ...props }) {
  return <Card elevation={0} sx={{ position: 'relative', overflow: 'hidden', border: 1, borderColor: 'divider', transition: 'transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease', '&::after': { content: '""', position: 'absolute', left: 0, right: 0, bottom: 0, height: 3, background: 'linear-gradient(90deg, #ff8a65, #ff5722)', transform: 'scaleX(0)', transformOrigin: 'left', transition: 'transform 220ms ease' }, '&:hover::after, &:active::after, &:focus-within::after': { transform: 'scaleX(1)' }, '&:hover': { transform: 'translateY(-2px)', borderColor: 'primary.light', boxShadow: '0 14px 30px rgba(30, 41, 59, .12)' }, ...sx }} {...props}><CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 }, ...contentSx }}>{children}</CardContent></Card>;
}

export default AppCard;

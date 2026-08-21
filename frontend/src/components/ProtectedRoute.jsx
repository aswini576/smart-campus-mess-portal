import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const rolePaths = { student: '/student', messChief: '/mess-chief', admin: '/admin' };

function ProtectedRoute({ roles }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to={rolePaths[user.role] || '/login'} replace />;
  return <Outlet />;
}

export default ProtectedRoute;

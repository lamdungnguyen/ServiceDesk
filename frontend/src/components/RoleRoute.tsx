import { Navigate, Outlet } from 'react-router-dom';
import { useAuth, type UserRole } from '../context/auth';

interface RoleRouteProps {
  allowedRoles?: UserRole[];
}

const RoleRoute = ({ allowedRoles }: RoleRouteProps) => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    if (user.role === 'ADMIN') return <Navigate to="/admin/dashboard" replace />;
    if (user.role === 'AGENT') return <Navigate to="/staff/dashboard" replace />;
    if (user.role === 'CUSTOMER') return <Navigate to="/my-tickets" replace />;
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export default RoleRoute;

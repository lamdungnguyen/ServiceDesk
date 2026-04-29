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
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};

export default RoleRoute;

import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import type { UserRole } from '../types';

interface Props {
  children: React.ReactNode;
  allowedRole: UserRole;
}

export default function ProtectedRoute({ children, allowedRole }: Props) {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user?.role !== allowedRole) {
    let redirect = '/dashboard';
    if (user?.role === 'omc') redirect = '/omc';
    if (user?.role === 'driver') redirect = '/driver';
    return <Navigate to={redirect} replace />;
  }

  return <>{children}</>;
}

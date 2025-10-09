import { Navigate } from 'react-router-dom';
import { useAuth } from '@/auth';
import { Spinner } from '@/components/Spinner';
import { UserType } from '@/types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredUserType?: UserType;
}

export const ProtectedRoute = ({
  children,
  requiredUserType,
}: ProtectedRouteProps) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <Spinner fullScreen />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requiredUserType && user.userType !== requiredUserType) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};
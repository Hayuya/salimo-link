import { Navigate } from 'react-router-dom';
import { useAuth } from '@/auth';
import { Spinner } from '@/components/Spinner';

const adminEmailList = (import.meta.env.VITE_ADMIN_EMAILS || '')
  .split(',')
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

interface AdminRouteProps {
  children: React.ReactNode;
}

const isAdminEmail = (email: string | null | undefined) => {
  if (!email) return false;
  if (adminEmailList.length === 0) {
    console.warn(
      'VITE_ADMIN_EMAILS is not set; the admin route is inaccessible. Configure it in your environment.'
    );
    return false;
  }
  return adminEmailList.includes(email.toLowerCase());
};

export const AdminRoute = ({ children }: AdminRouteProps) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <Spinner fullScreen />;
  }

  if (!user || !isAdminEmail(user.email)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

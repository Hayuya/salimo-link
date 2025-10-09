import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/auth';
import { UserType } from '@/types';

/**
 * ログイン必須ページで使用するフック
 * ログインしていない場合はログインページにリダイレクト
 * オプションでユーザータイプも指定可能
 */
export const useRequireAuth = (requiredUserType?: UserType) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        // ログインしていない場合はログインページへ
        navigate('/login', { replace: true });
      } else if (requiredUserType && user.userType !== requiredUserType) {
        // ユーザータイプが一致しない場合はトップページへ
        navigate('/', { replace: true });
      }
    }
  }, [user, loading, requiredUserType, navigate]);

  return { user, loading };
};
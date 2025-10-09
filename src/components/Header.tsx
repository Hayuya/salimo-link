import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/auth';
import { Button } from './Button';
import styles from './Header.module.css';

export const Header = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('ログアウトエラー:', error);
    }
  };

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <Link to="/" className={styles.logo}>
          <h1>cutmo</h1>
        </Link>

        <nav className={styles.nav}>
          {user ? (
            <>
              <Link to="/dashboard" className={styles.navLink}>
                マイページ
              </Link>
              <Button variant="outline" size="sm" onClick={handleSignOut}>
                ログアウト
              </Button>
            </>
          ) : (
            <>
              <Link to="/login" className={styles.navLink}>
                ログイン
              </Link>
              <Link to="/signup">
                <Button variant="primary" size="sm">
                  新規登録
                </Button>
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
};
import { Link } from 'react-router-dom';
import { AppLogo } from '@/components/AppLogo';
import { LoginForm } from '@/components/LoginForm';
import { Card } from '@/components/Card';
import styles from './LoginPage.module.css';

export const LoginPage = () => {
  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.logoContainer}>
          <AppLogo size="lg" />
          <p className={styles.subtitle}>ログイン</p>
        </div>

        <Card padding="lg">
          <LoginForm />
        </Card>

        <div className={styles.footer}>
          <p className={styles.footerText}>
            アカウントをお持ちでない方は
            <Link to="/signup" className={styles.link}>
              新規登録
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
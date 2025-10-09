import { Link } from 'react-router-dom';
import { AppLogo } from '@/components/AppLogo';
import { SignupForm } from '@/components/SignupForm';
import { Card } from '@/components/Card';
import styles from './SignupPage.module.css';

export const SignupPage = () => {
  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.logoContainer}>
          <AppLogo size="lg" />
          <p className={styles.subtitle}>新規登録</p>
        </div>

        <Card padding="lg">
          <SignupForm />
        </Card>

        <div className={styles.footer}>
          <p className={styles.footerText}>
            すでにアカウントをお持ちの方は
            <Link to="/login" className={styles.link}>
              ログイン
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
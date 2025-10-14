import styles from './AppLogo.module.css';

interface AppLogoProps {
  size?: 'sm' | 'md' | 'lg';
}

export const AppLogo = ({ size = 'md' }: AppLogoProps) => {
  return (
    <div className={`${styles.logo} ${styles[size]}`}>
      <span className={styles.logoText}>SaloMo Link</span>
    </div>
  );
};

import styles from './Spinner.module.css';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  fullScreen?: boolean;
}

export const Spinner = ({ size = 'md', fullScreen = false }: SpinnerProps) => {
  if (fullScreen) {
    return (
      <div className={styles.fullScreen}>
        <div className={`${styles.spinner} ${styles[size]}`}></div>
      </div>
    );
  }

  return <div className={`${styles.spinner} ${styles[size]}`}></div>;
};
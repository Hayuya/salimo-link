import { Link } from 'react-router-dom';
import { Button } from '@/components/Button';
import styles from './NotFoundPage.module.css';

export const NotFoundPage = () => {
  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <h1 className={styles.title}>404</h1>
        <p className={styles.message}>
          お探しのページが見つかりませんでした
        </p>
        <Link to="/">
          <Button variant="primary" size="lg">
            トップページへ戻る
          </Button>
        </Link>
      </div>
    </div>
  );
};
// src/components/Footer.tsx
import { Link } from 'react-router-dom';
import styles from './Footer.module.css';
import { AppLogo } from './AppLogo';

export const Footer = () => {
  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.mainContent}>
          <div className={styles.brand}>
            <AppLogo size="md" />
            <p className={styles.tagline}>
              学生と美容室アシスタントを繋ぐマッチングプラットフォーム
            </p>
          </div>
          <div className={styles.links}>
            <div className={styles.linkGroup}>
              <h4 className={styles.linkTitle}>サービス</h4>
              <Link to="/about" className={styles.link}>SaloMo Linkとは？</Link>
              <Link to="/about#usage" className={styles.link}>使い方ガイド</Link>
              <Link to="/faq" className={styles.link}>よくある質問</Link>
            </div>
            <div className={styles.linkGroup}>
              <h4 className={styles.linkTitle}>サポート</h4>
              <Link to="/terms" className={styles.link}>利用規約</Link>
              <Link to="/privacy" className={styles.link}>プライバシーポリシー</Link>
              <Link to="/contact" className={styles.link}>お問い合わせ</Link>
            </div>
          </div>
        </div>
        <div className={styles.copyright}>
          <p>© {new Date().getFullYear()} SaloMo Link. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

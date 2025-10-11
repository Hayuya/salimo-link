// src/components/Header.tsx
import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/auth';
import { Button } from './Button';
import styles from './Header.module.css';
import { UserIcon } from './UserIcon';

export const Header = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('ログアウトエラー:', error);
    }
  };

  const getProfileName = () => {
    if (!user) return '';
    if (user.userType === 'student' && 'name' in user.profile) {
      return user.profile.name;
    }
    if (user.userType === 'salon' && 'salon_name' in user.profile) {
      return user.profile.salon_name;
    }
    return 'ゲスト';
  };

  // ドロップダウンの外側をクリックしたときに閉じる処理
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

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
              <Link to="/how-to-use" className={styles.navLink}>
                つかいかた
              </Link>
              <div className={styles.dropdown} ref={dropdownRef}>
                 <button 
                    className={styles.profileLink} 
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                 >
                    <UserIcon />
                    <span>{getProfileName()}</span>
                 </button>
                 {isDropdownOpen && (
                    <div className={styles.dropdownContent}>
                        <button onClick={handleSignOut} className={styles.dropdownItem}>
                        ログアウト
                        </button>
                    </div>
                 )}
              </div>
            </>
          ) : (
            <>
              <Link to="/about" className={styles.navLink}>
                cutmoとは？
              </Link>
              <Link to="/how-to-use" className={styles.navLink}>
                使い方
              </Link>
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

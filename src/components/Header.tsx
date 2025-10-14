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
  const [isNavOpen, setIsNavOpen] = useState(false);
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
      if (!dropdownRef.current) return;
      if (!dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(min-width: 768px)');
    const handleChange = () => {
      if (mediaQuery.matches) {
        setIsNavOpen(false);
      }
    };
    handleChange();
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const toggleNav = () => {
    setIsNavOpen(prev => !prev);
    setIsDropdownOpen(false);
  };

  const closeNav = () => {
    setIsNavOpen(false);
    setIsDropdownOpen(false);
  };

  const handleNavClick = () => {
    if (isNavOpen) {
      closeNav();
    }
  };

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <Link to="/" className={styles.logo} onClick={closeNav}>
          <h1 className={styles.logoTitle}>
            SaloMo Link
            <span className={styles.betaBadge}>ベータ版</span>
          </h1>
        </Link>

        <button
          type="button"
          className={styles.menuToggle}
          onClick={toggleNav}
          aria-expanded={isNavOpen}
          aria-label="メニューを開閉"
        >
          <span />
          <span />
          <span />
        </button>

        <nav className={`${styles.nav} ${isNavOpen ? styles.navOpen : ''}`}>
          {user ? (
            <>
              <Link to="/about" className={styles.navLink} onClick={handleNavClick}>
                SaloMo Linkとは？
              </Link>
              <Link to="/" className={styles.navLink} onClick={handleNavClick}>
                募集一覧
              </Link>
              <Link to="/dashboard" className={styles.navLink} onClick={handleNavClick}>
                マイページ
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
                        <button onClick={() => { handleSignOut(); closeNav(); }} className={styles.dropdownItem}>
                        ログアウト
                        </button>
                    </div>
                 )}
              </div>
            </>
          ) : (
            <>
              <Link to="/about" className={styles.navLink} onClick={handleNavClick}>
                SaloMo Linkとは？
              </Link>
              <Link
                to="/"
                className={styles.navLink}
                state={{ scrollTo: 'recruitments' }}
                onClick={handleNavClick}
              >
                募集一覧
              </Link>
              <Link to="/login" className={styles.navLink} onClick={handleNavClick}>
                ログイン
              </Link>
              <Link to="/signup" onClick={handleNavClick}>
                <Button variant="primary" size="sm">
                  新規登録
                </Button>
              </Link>
            </>
          )}
        </nav>
        {isNavOpen && <div className={styles.navOverlay} onClick={closeNav} />}
      </div>
    </header>
  );
};

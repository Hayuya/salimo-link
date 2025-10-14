import { useState, useMemo, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useRecruitments } from '@/recruitment';
import { useAuth } from '@/auth';
import { RecruitmentCard } from '@/components/RecruitmentCard';
import { Spinner } from '@/components/Spinner';
import { Button } from '@/components/Button';
import styles from './TopPage.module.css';
import type { MenuType } from '@/types'; // 正しいMenuTypeをインポート
import { isBeforeHoursBefore, isFutureDate } from '@/utils/date';

export const TopPage = () => {
  const { recruitments, loading, error } = useRecruitments();
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
  // フィルター状態
  const [selectedMenu, setSelectedMenu] = useState<string>('all');
  const [selectedGender, setSelectedGender] = useState<string>('all');
  const [showAvailableOnly, setShowAvailableOnly] = useState(false);
  const RESERVATION_CUTOFF_HOURS = 48;

  useEffect(() => {
    if (user) return;
    const scrollTo = (location.state as { scrollTo?: string } | null)?.scrollTo;
    if (scrollTo === 'recruitments') {
      const section = document.getElementById('recruitments');
      if (section) {
        requestAnimationFrame(() => {
          section.scrollIntoView({ behavior: 'smooth' });
        });
      }
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [user, location, navigate]);

  // フィルター適用
  const filteredRecruitments = useMemo(() => {
    return recruitments.filter(recruitment => {
      // メニューフィルター
      if (selectedMenu !== 'all' && !recruitment.menus.includes(selectedMenu as MenuType)) {
        return false;
      }
      
      // 性別フィルター
      if (selectedGender !== 'all' && recruitment.gender_requirement !== selectedGender) {
        return false;
      }
      
      // 予約可能のみ表示
      if (showAvailableOnly) {
        const hasBookable = recruitment.available_dates.some(
          date =>
            !date.is_booked &&
            isFutureDate(date.datetime) &&
            isBeforeHoursBefore(date.datetime, RESERVATION_CUTOFF_HOURS)
        );
        const hasFlexible = !!recruitment.flexible_schedule_text?.trim();
        if (!hasBookable && !hasFlexible) return false;
      }
      
      return true;
    });
  }, [recruitments, selectedMenu, selectedGender, showAvailableOnly]);

  if (loading) {
    return <Spinner fullScreen />;
  }

  return (
    <div className={styles.container}>
      {!user && (
        <div className={styles.hero}>
          {/* 背景装飾図形 */}
          <div className={styles.heroDecorations}>
            <div className={styles.decorCircle1}></div>
            <div className={styles.decorCircle2}></div>
            <div className={styles.decorCircle3}></div>
            <div className={styles.decorSquare1}></div>
            <div className={styles.decorSquare2}></div>
          </div>

          <div className={styles.heroInner}>
            <div className={styles.heroContent}>
              <h1 className={styles.heroTitle}>
                学生とサロンを<br />
                カットモデルで繋ぐ
              </h1>
              <p className={styles.heroSubtitle}>
                学生は無料、サロンもベータ期間中は無料で募集を掲載可能。<br />
                施術メニューや料金が一目でわかり、仮予約の承認・キャンセルもスムーズです。
              </p>
              <p className={styles.heroSubtitle}>
                チャットで柔軟に日時を相談し、直感的な操作でカットモデル募集を管理しましょう。
              </p>

              <div className={styles.heroCtas}>
                <Link to="/signup?role=student" className={styles.heroCtaLink}>
                  <Button variant="primary" size="lg" fullWidth>
                    学生として登録する
                  </Button>
                </Link>
                <Link to="/signup?role=salon" className={styles.heroCtaLink}>
                  <Button variant="outline" size="lg" fullWidth>
                    サロンとして登録する
                  </Button>
                </Link>
              </div>

              {/* 特徴セクション */}
              <div className={styles.heroFeatures}>
                <div className={styles.featureItem}>
                  <div className={styles.featureIcon}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <div className={styles.featureText}>
                    <h3>無料ではじめられる</h3>
                    <p>学生はずっと無料、サロンもベータ期間中は利用料ゼロで導入できます。</p>
                  </div>
                </div>

                <div className={styles.featureItem}>
                  <div className={styles.featureIcon}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 5h18M3 10h18M3 15h10M3 20h6" />
                    </svg>
                  </div>
                  <div className={styles.featureText}>
                    <h3>直感的な募集管理</h3>
                    <p>施術メニューや料金、募集条件をわかりやすく掲載して学生にアピールできます。</p>
                  </div>
                </div>

                <div className={styles.featureItem}>
                  <div className={styles.featureIcon}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M4 7h16M4 12h10m-6 5h-4" />
                    </svg>
                  </div>
                  <div className={styles.featureText}>
                    <h3>柔軟なスケジュール登録</h3>
                    <p>複数の日時指定も、文章で施術可能なタイミングを記載することも自由自在です。</p>
                  </div>
                </div>

                <div className={styles.featureItem}>
                  <div className={styles.featureIcon}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div className={styles.featureText}>
                    <h3>仮予約の承認・キャンセル</h3>
                    <p>学生からの仮予約は状況に応じて承認、やむを得ない場合のキャンセルも簡単に行えます。</p>
                  </div>
                </div>

                <div className={styles.featureItem}>
                  <div className={styles.featureIcon}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15a2 2 0 01-2 2H8l-4 4V5a2 2 0 012-2h13a2 2 0 012 2v10z" />
                    </svg>
                  </div>
                  <div className={styles.featureText}>
                    <h3>チャットで相談</h3>
                    <p>学生とサロンがチャットでコミュニケーションし、施術内容や持ち物を事前に確認できます。</p>
                  </div>
                </div>
              </div>
            </div>

            {/* ヒーロー画像エリア */}
            <div className={styles.heroVisual}>
              <div className={styles.visualCard}>
                <div className={styles.visualIcon}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18a3.75 3.75 0 00.495-7.467 5.99 5.99 0 00-1.925 3.546 5.974 5.974 0 01-2.133-1A3.75 3.75 0 0012 18z" />
                  </svg>
                </div>
                <h3>美容の世界へ</h3>
                <p>プロの技術を体験</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <section id="recruitments" className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>募集一覧</h2>
          <p className={styles.sectionSubtitle}>
            現在{filteredRecruitments.length}件の募集があります！
          </p>
        </div>

        {/* フィルターセクション */}
        <div className={styles.filterSection}>
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>メニュー</label>
            <select 
              className={styles.filterSelect}
              value={selectedMenu}
              onChange={(e) => setSelectedMenu(e.target.value)}
            >
              <option value="all">すべて</option>
              <option value="cut">カット</option>
              <option value="color">カラー</option>
              <option value="perm">パーマ</option>
              <option value="treatment">トリートメント</option>
              <option value="styling">スタイリング</option>
            </select>
          </div>

          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>性別</label>
            <select 
              className={styles.filterSelect}
              value={selectedGender}
              onChange={(e) => setSelectedGender(e.target.value)}
            >
              <option value="all">すべて</option>
              <option value="any">指定なし</option>
              <option value="male">男性</option>
              <option value="female">女性</option>
            </select>
          </div>

          <div className={styles.filterGroup}>
            <label className={styles.filterCheckbox}>
              <input
                type="checkbox"
                checked={showAvailableOnly}
                onChange={(e) => setShowAvailableOnly(e.target.checked)}
              />
              <span>予約可能のみ表示</span>
            </label>
          </div>

          {(selectedMenu !== 'all' || selectedGender !== 'all' || showAvailableOnly) && (
            <button 
              className={styles.filterReset}
              onClick={() => {
                setSelectedMenu('all');
                setSelectedGender('all');
                setShowAvailableOnly(false);
              }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 18L18 6M6 6l12 12" />
              </svg>
              絞り込みをリセット
            </button>
          )}
        </div>

        {error && (
          <div className={styles.error}>
            募集情報の取得に失敗しました。ページを再読み込みしてください。
          </div>
        )}

        {filteredRecruitments.length === 0 ? (
          <div className={styles.empty}>
            <p>条件に一致する募集がありません</p>
          </div>
        ) : (
          <div className={styles.grid}>
            {filteredRecruitments.map((recruitment) => (
              <RecruitmentCard key={recruitment.id} recruitment={recruitment} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

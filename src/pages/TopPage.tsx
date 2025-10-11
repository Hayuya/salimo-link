import { useState, useMemo } from 'react';
import { useRecruitments } from '@/recruitment';
import { useAuth } from '@/auth';
import { RecruitmentCard } from '@/components/RecruitmentCard';
import { Spinner } from '@/components/Spinner';
import styles from './TopPage.module.css';
import type { MenuType } from '@/types'; // 正しいMenuTypeをインポート

export const TopPage = () => {
  const { recruitments, loading, error } = useRecruitments();
  const { user } = useAuth();
  
  // フィルター状態
  const [selectedMenu, setSelectedMenu] = useState<string>('all');
  const [selectedGender, setSelectedGender] = useState<string>('all');
  const [showAvailableOnly, setShowAvailableOnly] = useState(false);

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
        const hasAvailable = recruitment.available_dates.some(date => !date.is_booked);
        const hasFlexible = !!recruitment.flexible_schedule_text?.trim();
        if (!hasAvailable && !hasFlexible) return false;
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
                カットモデルを探す学生と<br />
                美容室アシスタントを繋ぐ
              </h1>
              <p className={styles.heroSubtitle}>
                安全で洗練された出会いをサポート。美容とファッションの世界観に寄り添ったマッチングプラットフォームです。
              </p>

              {/* 特徴セクション */}
              <div className={styles.heroFeatures}>
                <div className={styles.featureItem}>
                  <div className={styles.featureIcon}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className={styles.featureText}>
                    <h3>学校メール認証</h3>
                    <p>安全な本人確認</p>
                  </div>
                </div>

                <div className={styles.featureItem}>
                  <div className={styles.featureIcon}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className={styles.featureText}>
                    <h3>簡単予約</h3>
                    <p>日時を選んで即座に予約</p>
                  </div>
                </div>

                <div className={styles.featureItem}>
                  <div className={styles.featureIcon}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                  <div className={styles.featureText}>
                    <h3>信頼の出会い</h3>
                    <p>学生とサロンを繋ぐ</p>
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

      <section className={styles.section}>
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

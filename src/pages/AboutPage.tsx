import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/Button';
import styles from './AboutPage.module.css';

export const AboutPage = () => {
  const navigate = useNavigate();

  return (
    <div className={styles.container}>
      {/* ヒーローセクション */}
      <section className={styles.hero}>
        <div className={styles.heroDecorations}>
          <div className={styles.decorCircle1}></div>
          <div className={styles.decorCircle2}></div>
          <div className={styles.decorSquare}></div>
        </div>
        
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>
            cutmo<span className={styles.titleAccent}>とは？</span>
          </h1>
          <p className={styles.heroSubtitle}>
            学生とカットモデルを探す美容室アシスタントを<br />
            安全かつ効率的に繋ぐマッチングプラットフォーム
          </p>
        </div>
      </section>

      {/* サービス概要 */}
      <section className={styles.section}>
        <div className={styles.sectionContent}>
          <div className={styles.featureGrid}>
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3>安全な認証システム</h3>
              <p>学校発行メールアドレス（.ac.jp）による本人確認で、安心してご利用いただけます。</p>
            </div>

            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3>簡単予約システム</h3>
              <p>希望の日時を選んで予約するだけ。複雑な手続きは一切不要です。</p>
            </div>

            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3>無料で利用可能</h3>
              <p>学生は完全無料。プロの技術を体験しながらお小遣いも稼げます。</p>
            </div>
          </div>
        </div>
      </section>

      {/* 使い方セクション */}
      <section className={styles.section}>
        <div className={styles.sectionContent}>
          <h2 className={styles.sectionTitle}>使い方</h2>
          
          <div className={styles.usageSteps}>
            <div className={styles.stepCard}>
              <div className={styles.stepNumber}>1</div>
              <div className={styles.stepContent}>
                <h3>学校メールで登録</h3>
                <p>学校発行のメールアドレス（.ac.jp）で新規登録。簡単な本人確認で安全にスタート。</p>
              </div>
            </div>

            <div className={styles.stepCard}>
              <div className={styles.stepNumber}>2</div>
              <div className={styles.stepContent}>
                <h3>募集を探す</h3>
                <p>トップページから気になる募集を探しましょう。メニューや条件で絞り込みも可能です。</p>
              </div>
            </div>

            <div className={styles.stepCard}>
              <div className={styles.stepNumber}>3</div>
              <div className={styles.stepContent}>
                <h3>日時を選んで予約</h3>
                <p>予約可能な日時から希望の時間を選択。条件を確認して仮予約を完了します。</p>
              </div>
            </div>

            <div className={styles.stepCard}>
              <div className={styles.stepNumber}>4</div>
              <div className={styles.stepContent}>
                <h3>サロンで施術</h3>
                <p>サロンから承認されたら、当日サロンへ。プロの技術を体験しましょう！</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 対象ユーザー */}
      <section className={styles.section}>
        <div className={styles.sectionContent}>
          <h2 className={styles.sectionTitle}>こんな方におすすめ</h2>
          
          <div className={styles.targetUsers}>
            <div className={styles.targetCard}>
              <div className={styles.targetIcon}>🎓</div>
              <h3>学生の方</h3>
              <ul>
                <li>無料でヘアカットやカラーを体験したい</li>
                <li>プロの技術を試してみたい</li>
                <li>新しいヘアスタイルに挑戦したい</li>
                <li>美容に興味がある</li>
              </ul>
            </div>

            <div className={styles.targetCard}>
              <div className={styles.targetIcon}>✂️</div>
              <h3>美容室アシスタント</h3>
              <ul>
                <li>カットモデルを効率的に探したい</li>
                <li>練習の機会を増やしたい</li>
                <li>技術向上のために施術したい</li>
                <li>ポートフォリオを充実させたい</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 安全性について */}
      <section className={styles.section}>
        <div className={styles.sectionContent}>
          <div className={styles.safetySection}>
            <div className={styles.safetyIcon}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h2 className={styles.sectionTitle}>安全性への取り組み</h2>
            <div className={styles.safetyList}>
              <div className={styles.safetyItem}>
                <span className={styles.safetyCheck}>✓</span>
                <div>
                  <h4>学校メール認証</h4>
                  <p>学生は学校発行のメールアドレスでのみ登録可能。なりすましを防止します。</p>
                </div>
              </div>
              <div className={styles.safetyItem}>
                <span className={styles.safetyCheck}>✓</span>
                <div>
                  <h4>予約管理システム</h4>
                  <p>すべての予約履歴が記録され、トラブル時も安心して対応できます。</p>
                </div>
              </div>
              <div className={styles.safetyItem}>
                <span className={styles.safetyCheck}>✓</span>
                <div>
                  <h4>サロン情報の開示</h4>
                  <p>予約前にサロンの所在地や連絡先を確認できます。</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTAセクション */}
      <section className={styles.ctaSection}>
        <div className={styles.ctaContent}>
          <h2>今すぐ始めよう</h2>
          <p>学校メールアドレスがあれば、すぐに無料で始められます</p>
          <div className={styles.ctaButtons}>
            <Button 
              variant="primary" 
              size="lg"
              onClick={() => navigate('/signup')}
            >
              新規登録
            </Button>
            <Button 
              variant="outline" 
              size="lg"
              onClick={() => navigate('/')}
            >
              募集を見る
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};
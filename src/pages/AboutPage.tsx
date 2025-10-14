import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/Button';
import styles from './AboutPage.module.css';

type UsageTabKey = 'student' | 'salon';

type UsageContent = {
  label: string;
  description: string;
  highlight: string;
  steps: Array<{ title: string; description: string }>;
  tipsTitle: string;
  tips: string[];
  primaryCtaLabel: string;
  primaryCtaTo: string;
  secondaryCtaLabel: string;
  secondaryCtaTo: string;
};

const USAGE_CONTENT: Record<UsageTabKey, UsageContent> = {
  student: {
    label: '学生の方',
    description:
      '学校メールアドレスで登録して、気になるサロンの募集に応募。予約から当日の流れまで、無料でシンプルに完結します。',
    highlight: '学生は全機能を無料でご利用いただけます',
    steps: [
      {
        title: '学校メールで新規登録',
        description: '.ac.jp で終わる学校メールアドレスがあればOK。プロフィールを整えて準備しましょう。',
      },
      {
        title: '募集をチェック',
        description: 'メニューや料金、募集条件が一目でわかる募集一覧から、気になるサロンを見つけましょう。',
      },
      {
        title: '希望日時で予約申請',
        description: '募集に表示されている日程から希望日時を選択。メッセージを添えて仮予約を送り、承認を待ちます。',
      },
      {
        title: 'チャットで最終調整',
        description: 'サロンから承認されたらチャットで詳細を確認。事前に当日の流れを押さえて安心。',
      },
      {
        title: '当日はサロンへ',
        description: '予約日時にサロンへ向かいましょう。来店時に学生証の提示を求められる場合があるのでご準備ください。',
      },
    ],
    tipsTitle: '活用のコツ',
    tips: [
      'プロフィールに希望スタイルやSNSリンクを載せるとマッチング率が上がります。',
      '予約状況はダッシュボードの「予約一覧」からいつでも確認できます。',
      '初めてのサロンには、事前にアクセスや所要時間をチェックしておきましょう。',
      '学生証はいつでも提示できるように携帯しておくと安心です。',
    ],
    primaryCtaLabel: '無料で登録する',
    primaryCtaTo: '/signup',
    secondaryCtaLabel: '募集を探す',
    secondaryCtaTo: '/',
  },
  salon: {
    label: 'サロンの方',
    description:
      'アシスタントやスタイリストの練習機会を確保するために、募集作成から応募管理までをオンラインで完結。ベータ期間中は無料でご利用いただけます。',
    highlight: 'ベータ期間はサロンも無料で利用可能',
    steps: [
      {
        title: 'サロン向けアカウントを作成',
        description: 'サロン情報と担当者の連絡先を登録。スタッフごとに募集を作成できます。',
      },
      {
        title: '募集内容を投稿',
        description: '施術メニューや料金、募集条件を直感的に入力。日時は複数枠の指定はもちろん、文章で柔軟に記載できます。',
      },
      {
        title: '応募内容をチェック',
        description: '学生からの仮予約が届いたらプロフィールと希望内容を確認。状況に合わせて承認ややむを得ない場合のキャンセルを選択できます。',
      },
      {
        title: 'チャットでヒアリング',
        description: '予約確定後はチャットでカウンセリング。コンディションや希望スタイルを事前に確認しましょう。',
      },
      {
        title: '施術履歴を管理',
        description: '当日の施術が完了したらダッシュボードで履歴を管理。次回募集に活かせます。',
      },
    ],
    tipsTitle: 'スムーズに進めるために',
    tips: [
      '募集テンプレートを活用すると毎回の登録がスムーズです。',
      '学生からの仮予約は承認・キャンセルのステータス更新を早めに行うと信頼につながります。',
      '施術後のフィードバックを記録するとリピートが促しやすくなります。',
    ],
    primaryCtaLabel: 'サロン登録をする',
    primaryCtaTo: '/signup',
    secondaryCtaLabel: '機能紹介を見る',
    secondaryCtaTo: '/about',
  },
};

export const AboutPage = () => {
  const navigate = useNavigate();
  const [activeUsageTab, setActiveUsageTab] = useState<UsageTabKey>('student');
  const activeUsageContent = USAGE_CONTENT[activeUsageTab];

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
            SaloMo Link<span className={styles.titleAccent}>とは？</span>
          </h1>
          <p className={styles.heroSubtitle}>
            学生とカットモデルを探す美容室アシスタントを<br />
            安全かつ効率的に繋ぐマッチングプラットフォーム
          </p>
        </div>
      </section>

      {/* サービス概要 */}
      <section id="usage" className={styles.section}>
        <div className={styles.sectionContent}>
          <div className={styles.featureGrid}>
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3>無料でスタート</h3>
              <p>学生は完全無料、サロンもベータ期間中は利用料なし。気軽に導入していただけます。</p>
            </div>

            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3>施術情報が一目でわかる</h3>
              <p>メニューや料金、持ち物までまとめて掲載。学生は比較しながら最適な募集を選べます。</p>
            </div>

            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3>チャットと予約管理</h3>
              <p>仮予約の承認・キャンセル管理やチャットでの事前相談まで、ワンストップで対応できます。</p>
            </div>
          </div>
        </div>
      </section>

      {/* 使い方セクション */}
      <section className={styles.section}>
        <div className={styles.sectionContent}>
          <h2 className={styles.sectionTitle}>使い方ガイド</h2>
          <p className={styles.usageIntroduction}>
            学生とサロン、それぞれの立場から見たSaloMo Linkの活用方法をご紹介します。タブを切り替えて、該当するガイドをご覧ください。
          </p>

          <div className={styles.usageTabs} role="tablist" aria-label="使い方ガイド対象">
            {Object.keys(USAGE_CONTENT).map((key) => {
              const tabKey = key as UsageTabKey;
              const isActive = tabKey === activeUsageTab;
              return (
                <button
                  key={tabKey}
                  type="button"
                  role="tab"
                  id={`usage-tab-${tabKey}`}
                  aria-selected={isActive}
                  aria-controls={`usage-panel-${tabKey}`}
                  className={[
                    styles.usageTabButton,
                    isActive ? styles.usageTabButtonActive : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  onClick={() => setActiveUsageTab(tabKey)}
                >
                  {USAGE_CONTENT[tabKey].label}
                </button>
              );
            })}
          </div>

          <div
            id={`usage-panel-${activeUsageTab}`}
            role="tabpanel"
            aria-labelledby={`usage-tab-${activeUsageTab}`}
            className={styles.usagePanel}
          >
            <div className={styles.usagePanelHeader}>
              <p className={styles.usageHighlight}>{activeUsageContent.highlight}</p>
              <h3>{`${activeUsageContent.label}の基本ステップ`}</h3>
              <p>{activeUsageContent.description}</p>
            </div>

            <ol className={styles.usageStepList}>
              {activeUsageContent.steps.map((step, index) => (
                <li key={step.title} className={styles.usageStepItem}>
                  <span className={styles.usageStepNumber}>{index + 1}</span>
                  <div>
                    <h4>{step.title}</h4>
                    <p>{step.description}</p>
                  </div>
                </li>
              ))}
            </ol>

            <div className={styles.usageFooter}>
              <div className={styles.usageTips}>
                <h4>{activeUsageContent.tipsTitle}</h4>
                <ul>
                  {activeUsageContent.tips.map((tip) => (
                    <li key={tip}>{tip}</li>
                  ))}
                </ul>
              </div>
              <div className={styles.usageActions}>
                <Button
                  variant="primary"
                  size="lg"
                  className={styles.usagePrimaryAction}
                  onClick={() => navigate(activeUsageContent.primaryCtaTo)}
                >
                  {activeUsageContent.primaryCtaLabel}
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className={styles.usageSecondaryAction}
                  onClick={() => navigate(activeUsageContent.secondaryCtaTo)}
                >
                  {activeUsageContent.secondaryCtaLabel}
                </Button>
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
              className={styles.ctaPrimaryButton}
              onClick={() => navigate('/signup')}
            >
              新規登録
            </Button>
            <Button 
              variant="outline" 
              size="lg"
              className={styles.ctaOutlineButton}
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

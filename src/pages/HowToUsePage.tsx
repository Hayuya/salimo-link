import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/Button';
import styles from './HowToUsePage.module.css';

type TabKey = 'student' | 'salon';

type TabContent = {
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

const TAB_CONTENT: Record<TabKey, TabContent> = {
  student: {
    label: '学生の方',
    description:
      '学校メールアドレスで登録して、気になるサロンの募集に応募。予約から当日の流れまで、シンプルなステップで完結します。',
    highlight: '学生は全機能を無料でご利用いただけます',
    steps: [
      {
        title: '学校メールで新規登録',
        description:
          '.ac.jp で終わる学校メールアドレスがあればOK。プロフィールを整えて準備しましょう。',
      },
      {
        title: '募集をチェック',
        description:
          'メニューや希望条件で募集を検索。気になるサロンの詳細を確認して応募先を決めます。',
      },
      {
        title: '希望日時で予約申請',
        description:
          '募集に表示されている日程から希望日時を選択。メッセージを添えて仮予約を送ります。',
      },
      {
        title: 'チャットで最終調整',
        description:
          'サロンから承認されたらチャットで詳細を確認。事前に当日の流れを押さえて安心。',
      },
      {
        title: '当日はサロンへ',
        description:
          '予約日時にサロンへ向かいましょう。施術後は感想や写真をシェアすると喜ばれます。',
      },
    ],
    tipsTitle: '活用のコツ',
    tips: [
      'プロフィールに希望スタイルやSNSリンクを載せるとマッチング率が上がります。',
      '予約状況はダッシュボードの「予約一覧」からいつでも確認できます。',
      '初めてのサロンには、事前にアクセスや所要時間をチェックしておきましょう。',
    ],
    primaryCtaLabel: '無料で登録する',
    primaryCtaTo: '/signup',
    secondaryCtaLabel: '募集を探す',
    secondaryCtaTo: '/',
  },
  salon: {
    label: 'サロンの方',
    description:
      'アシスタントやスタイリストの練習機会を確保するために、募集作成から応募管理までをオンラインで完結できます。',
    highlight: '募集の作成から応募管理まで、管理画面で一元管理',
    steps: [
      {
        title: 'サロン向けアカウントを作成',
        description:
          'サロン情報と担当者の連絡先を登録。スタッフごとに募集を作成できます。',
      },
      {
        title: '募集内容を投稿',
        description:
          '希望メニュー、募集人数、対応可能な日時を入力。柔軟なスケジュールも登録可能です。',
      },
      {
        title: '応募内容をチェック',
        description:
          '学生からの応募が届いたらプロフィールを確認。条件が合えばワンクリックで承認できます。',
      },
      {
        title: 'チャットでヒアリング',
        description:
          '予約確定後はチャットでカウンセリング。コンディションや希望スタイルを事前に確認しましょう。',
      },
      {
        title: '施術履歴を管理',
        description:
          '当日の施術が完了したらダッシュボードで履歴を管理。次回募集に活かせます。',
      },
    ],
    tipsTitle: 'スムーズに進めるために',
    tips: [
      '募集テンプレートを活用すると毎回の登録がスムーズです。',
      '学生からの質問には早めに返信するとキャンセルを防げます。',
      '施術後のフィードバックを記録するとリピートが促しやすくなります。',
    ],
    primaryCtaLabel: 'サロン登録をする',
    primaryCtaTo: '/signup',
    secondaryCtaLabel: '機能紹介を見る',
    secondaryCtaTo: '/about',
  },
};

export const HowToUsePage = () => {
  const [activeTab, setActiveTab] = useState<TabKey>('student');
  const navigate = useNavigate();
  const tabKeys = useMemo<TabKey[]>(() => ['student', 'salon'], []);

  const activeContent = TAB_CONTENT[activeTab];

  const handleTabClick = (key: TabKey) => {
    setActiveTab(key);
  };

  const handlePrimaryClick = () => {
    navigate(activeContent.primaryCtaTo);
  };

  const handleSecondaryClick = () => {
    navigate(activeContent.secondaryCtaTo);
  };

  return (
    <div className={styles.container}>
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <p className={styles.heroBadge}>ご利用ガイド</p>
          <h1 className={styles.heroTitle}>
            cutmoの使い方
            <span className={styles.heroAccent}>学生とサロン、それぞれのステップを紹介</span>
          </h1>
          <p className={styles.heroSubtitle}>
            予約の流れや活用のコツをまとめました。タブを切り替えて、あなたに合わせた使い方をご確認ください。
          </p>
        </div>
        <div className={styles.heroDecorations}>
          <div className={styles.heroCircle} />
          <div className={styles.heroBlur} />
          <div className={styles.heroDots} />
        </div>
      </section>

      <section className={styles.tabSection}>
        <header className={styles.sectionHeader}>
          <h2>対象を選択</h2>
          <p>利用シーンに合わせて、学生向けとサロン向けのガイドを切り替えられます。</p>
        </header>

        <div role="tablist" aria-label="ご利用ガイド対象" className={styles.tabs}>
          {tabKeys.map((key) => {
            const isActive = key === activeTab;
            return (
              <button
                key={key}
                id={`how-to-use-tab-${key}`}
                role="tab"
                type="button"
                aria-selected={isActive}
                aria-controls={`how-to-use-panel-${key}`}
                className={[
                  styles.tabButton,
                  isActive ? styles.tabButtonActive : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                onClick={() => handleTabClick(key)}
              >
                {TAB_CONTENT[key].label}
              </button>
            );
          })}
        </div>

        <div
          role="tabpanel"
          id={`how-to-use-panel-${activeTab}`}
          aria-labelledby={`how-to-use-tab-${activeTab}`}
          className={styles.tabPanel}
        >
          <div className={styles.panelHeader}>
            <p className={styles.panelHighlight}>{activeContent.highlight}</p>
            <h3>{`${activeContent.label}向けの流れ`}</h3>
            <p>{activeContent.description}</p>
          </div>

          <ol className={styles.stepList}>
            {activeContent.steps.map((step, index) => (
              <li key={step.title} className={styles.stepItem}>
                <span className={styles.stepNumber}>{index + 1}</span>
                <div>
                  <h4>{step.title}</h4>
                  <p>{step.description}</p>
                </div>
              </li>
            ))}
          </ol>

          <div className={styles.panelFooter}>
            <div className={styles.tipsCard}>
              <h4>{activeContent.tipsTitle}</h4>
              <ul>
                {activeContent.tips.map((tip) => (
                  <li key={tip}>{tip}</li>
                ))}
              </ul>
            </div>

            <div className={styles.actions}>
              <Button
                variant="primary"
                size="lg"
                className={styles.primaryAction}
                onClick={handlePrimaryClick}
              >
                {activeContent.primaryCtaLabel}
              </Button>
              <Button
                variant="outline"
                size="lg"
                className={styles.secondaryAction}
                onClick={handleSecondaryClick}
              >
                {activeContent.secondaryCtaLabel}
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

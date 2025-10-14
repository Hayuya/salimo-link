import { useState } from 'react';
import styles from './FAQPage.module.css';

type FaqItem = {
  question: string;
  answer: string;
};

type FaqCategory = {
  id: string;
  title: string;
  description: string;
  faqs: FaqItem[];
};

const FAQ_CATEGORIES: FaqCategory[] = [
  {
    id: 'student',
    title: '学生の方向け',
    description: '登録方法や予約の流れに関するよくある質問をまとめました。',
    faqs: [
      {
        question: '学生は無料で利用できますか？',
        answer:
          'はい、学生の方はすべての機能を無料でご利用いただけます。学校メールアドレス（.ac.jp）での認証を完了することで、応募・予約・チャットなどが利用可能になります。',
      },
      {
        question: '学校メールアドレスが使えない場合はどうすれば良いですか？',
        answer:
          '学校メールアドレスでの本人確認が必須となります。メールが使えない場合は、学校のIT窓口にご相談いただくか、別端末等でメール受信が可能かご確認ください。',
      },
      {
        question: '予約が承認されたかどうかはどこで確認できますか？',
        answer:
          'マイページ内の「予約一覧」から現在のステータスを確認できます。承認されるとステータスが「確定」に変わり、チャットから詳細の確認・調整が行えます。',
      },
      {
        question: '急な予定変更でキャンセルしたい場合は？',
        answer:
          'やむを得ない事情でキャンセルが必要な場合は、チャット機能で担当サロンへ早めに連絡をお願いします。無断キャンセルが続くと利用制限がかかることがあります。',
      },
    ],
  },
  {
    id: 'salon',
    title: 'サロンの方向け',
    description: '募集の掲載や予約管理に関する質問はこちらをご覧ください。',
    faqs: [
      {
        question: '募集を掲載するにはどうすれば良いですか？',
        answer:
          'サロン向けアカウントでログイン後、ダッシュボードの「募集を作成」からメニュー、募集人数、対応可能日時などを入力して公開できます。下書き保存も可能です。',
      },
      {
        question: '応募が来たときはどのように通知されますか？',
        answer:
          '応募が届くと、メール通知とダッシュボードの「予約リクエスト」セクションに表示されます。内容を確認し、承認・辞退のステータス更新を行ってください。',
      },
      {
        question: 'チャットで追加の写真を送ることはできますか？',
        answer:
          '現在はテキストメッセージの送受信に対応しています。画像送信機能は今後のアップデートで提供予定です。必要な場合は事前に共有方法をご案内ください。',
      },
      {
        question: '料金プランはありますか？',
        answer:
          'サロン向けの基本機能は無料でご利用いただけます。今後、有料オプション（優先表示や分析機能など）の導入を予定していますが、導入時には事前にご案内いたします。',
      },
    ],
  },
  {
    id: 'common',
    title: '共通のご質問',
    description: 'アカウント全般やセキュリティに関する質問です。',
    faqs: [
      {
        question: 'パスワードを忘れてしまいました。',
        answer:
          'ログイン画面の「パスワードをお忘れですか？」から再設定メールを送信してください。登録メールアドレスに再設定用のリンクが届きます。',
      },
      {
        question: '不審なユーザーを見つけた場合はどうすればよいですか？',
        answer:
          'マイページのお問い合わせフォーム、または support@salomolink.jp までご連絡ください。運営が状況を確認し、適切な対応を行います。',
      },
      {
        question: '退会したい場合の手続きを教えてください。',
        answer:
          'マイページの「アカウント設定」から退会手続きが行えます。退会後も法令に基づき一定期間は履歴を保持する場合があります。',
      },
      {
        question: '法人利用や提携に関する相談は可能ですか？',
        answer:
          'はい、お問い合わせフォームよりご連絡ください。法人向けの活用方法やメニューのご提案を担当者よりご案内いたします。',
      },
    ],
  },
];

export const FAQPage = () => {
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});

  const toggleItem = (categoryId: string, index: number) => {
    const key = `${categoryId}-${index}`;
    setExpandedItems((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  return (
    <div className={styles.container}>
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <p className={styles.heroBadge}>FAQ</p>
          <h1 className={styles.heroTitle}>よくある質問</h1>
          <p className={styles.heroSubtitle}>
            SaloMo Linkをご利用いただく際に寄せられるお問い合わせをまとめました。カテゴリ別に回答をご覧いただけます。
          </p>
          <p className={styles.heroHelp}>
            お探しの回答が見つからない場合は、ページ下部のお問い合わせ窓口からお気軽にご連絡ください。
          </p>
        </div>
        <div className={styles.heroDecorations}>
          <div className={styles.heroCircle} />
          <div className={styles.heroBlur} />
        </div>
      </section>

      <section className={styles.categories}>
        {FAQ_CATEGORIES.map((category) => (
          <article key={category.id} className={styles.category}>
            <header className={styles.categoryHeader}>
              <h2>{category.title}</h2>
              <p>{category.description}</p>
            </header>
            <ul className={styles.faqList}>
              {category.faqs.map((faq, index) => {
                const itemKey = `${category.id}-${index}`;
                const isExpanded = !!expandedItems[itemKey];
                return (
                  <li key={itemKey} className={styles.faqItem}>
                    <button
                      type="button"
                      className={[
                        styles.faqQuestion,
                        isExpanded ? styles.faqQuestionExpanded : '',
                      ]
                        .filter(Boolean)
                        .join(' ')}
                      aria-expanded={isExpanded}
                      aria-controls={`${itemKey}-answer`}
                      onClick={() => toggleItem(category.id, index)}
                    >
                      <span>{faq.question}</span>
                      <span
                        className={[
                          styles.expandIcon,
                          isExpanded ? styles.expandIconOpen : '',
                        ]
                          .filter(Boolean)
                          .join(' ')}
                        aria-hidden="true"
                      />
                    </button>
                    <div
                      id={`${itemKey}-answer`}
                      className={[
                        styles.faqAnswer,
                        isExpanded ? styles.faqAnswerVisible : '',
                      ]
                        .filter(Boolean)
                        .join(' ')}
                      role="region"
                      aria-labelledby={itemKey}
                    >
                      <p>{faq.answer}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </article>
        ))}
      </section>

      <section className={styles.contact}>
        <div className={styles.contactInner}>
          <h2>解決しない場合はお問い合わせください</h2>
          <p>
            SaloMo Linkカスタマーサポートが24時間以内（平日）に折り返しご連絡します。
            トラブル報告や機能のご要望もこちらから受け付けています。
          </p>
          <a className={styles.contactButton} href="mailto:support@salomolink.jp">
            support@salomolink.jp にメールする
          </a>
        </div>
      </section>
    </div>
  );
};

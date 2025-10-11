import styles from './PrivacyPolicyPage.module.css';

type Section = {
  title: string;
  contents: string[];
};

const SECTIONS: Section[] = [
  {
    title: '1. 基本方針',
    contents: [
      'cutmo（以下「当サービス」といいます）は、個人情報の重要性を認識し、関係法令およびガイドラインを遵守するとともに、適切な保護と管理を行います。',
      '本プライバシーポリシーは、当サービスが取得する個人情報の取り扱いについて定めるものです。',
    ],
  },
  {
    title: '2. 取得する情報',
    contents: [
      '学生会員：氏名、学校名、学校発行メールアドレス、電話番号、SNSアカウント、希望スタイル等。',
      'サロン会員：サロン名、所在地、担当者氏名、連絡先、施術メニュー、スタッフ情報等。',
      '利用状況に関する情報：予約履歴、チャット履歴、アクセスログ、端末情報、クッキー情報等。',
    ],
  },
  {
    title: '3. 利用目的',
    contents: [
      'サービス提供および本人確認のため。',
      '予約管理、チャット機能、通知機能等の運営に必要な範囲で利用するため。',
      'お問い合わせへの対応、各種案内や重要なお知らせを配信するため。',
      'サービス改善、新機能開発、利用状況の分析のため。',
      '法律や利用規約に基づく不正利用の防止、対応のため。',
    ],
  },
  {
    title: '4. 第三者提供',
    contents: [
      '当サービスは、法令で認められる場合を除き、ご本人の同意なく個人情報を第三者に提供いたしません。',
      'サービス運営上必要な範囲で業務委託を行う場合、適切な委託先管理と監督を実施します。',
    ],
  },
  {
    title: '5. クッキー等の利用',
    contents: [
      '当サービスは、ユーザーの利便性向上や利用状況の把握のため、クッキーや類似技術を利用することがあります。',
      'ブラウザの設定によりクッキーの受け入れを拒否することができますが、一部機能が利用できなくなる場合があります。',
    ],
  },
  {
    title: '6. 個人情報の管理',
    contents: [
      '個人情報への不正アクセス、紛失、破壊、改ざんおよび漏えいを防止するための適切な安全対策を講じます。',
      '個人情報を取り扱う従業員に対して、継続的な教育と監督を実施します。',
    ],
  },
  {
    title: '7. 情報の開示・訂正・削除',
    contents: [
      'ユーザーから提供された個人情報の開示・訂正・削除等のご請求があった場合は、本人確認の上、適切に対応します。',
      '具体的な手続きについては、お問い合わせ窓口までご連絡ください。',
    ],
  },
  {
    title: '8. 退会時の取り扱い',
    contents: [
      '退会後であっても、法令で定められた保存期間が満了するまで、一定期間情報を保管する場合があります。',
      '保管期間終了後は、速やかに安全な方法で削除または匿名化します。',
    ],
  },
  {
    title: '9. プライバシーポリシーの変更',
    contents: [
      '本ポリシーの内容は、必要に応じて変更することがあります。',
      '変更後の内容は当サービス上で告知し、告知後に利用を継続した場合は変更に同意したものとみなします。',
    ],
  },
  {
    title: '10. お問い合わせ窓口',
    contents: [
      '本ポリシーに関するお問い合わせは、以下の窓口までお願いいたします。',
      'メールアドレス：privacy@cutmo.jp',
      '受付時間：平日10:00〜18:00（年末年始を除く）',
    ],
  },
];

export const PrivacyPolicyPage = () => {
  return (
    <div className={styles.container}>
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <p className={styles.heroBadge}>PRIVACY POLICY</p>
          <h1 className={styles.heroTitle}>プライバシーポリシー</h1>
          <p className={styles.heroSubtitle}>
            cutmoでは、ユーザーの皆さまの個人情報を適切に保護するため、以下の方針に基づいて運用しています。
          </p>
          <p className={styles.heroUpdated}>最終更新日：2024年4月1日</p>
        </div>
        <div className={styles.heroDecorations}>
          <div className={styles.heroCircle} />
          <div className={styles.heroBlur} />
        </div>
      </section>

      <section className={styles.content}>
        {SECTIONS.map((section) => (
          <article key={section.title} className={styles.section}>
            <h2 className={styles.sectionTitle}>{section.title}</h2>
            <ul className={styles.sectionList}>
              {section.contents.map((content) => (
                <li key={content}>{content}</li>
              ))}
            </ul>
          </article>
        ))}

        <aside className={styles.notice}>
          <h3>個人情報保護管理責任者</h3>
          <p>cutmo運営事務局　個人情報保護管理責任者</p>
          <p>メール：privacy@cutmo.jp / 電話：03-0000-0000</p>
        </aside>
      </section>
    </div>
  );
};

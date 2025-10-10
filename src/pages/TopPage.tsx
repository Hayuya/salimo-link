import { useRecruitments } from '@/recruitment';
import { useAuth } from '@/auth';
import { RecruitmentCard } from '@/components/RecruitmentCard';
import { Spinner } from '@/components/Spinner';
import styles from './TopPage.module.css';

export const TopPage = () => {
  const { recruitments, loading, error } = useRecruitments();
  const { user } = useAuth();

  if (loading) {
    return <Spinner fullScreen />;
  }

  return (
    <div className={styles.container}>
      {!user && (
        <div className={styles.hero}>
          <div className={styles.heroInner}>
            <div>
              <h1 className={styles.heroTitle}>
                カットモデルを探す学生と<br />
                美容室アシスタントを繋ぐ
              </h1>
              <p className={styles.heroSubtitle}>
                安全で洗練された出会いをサポート。美容とファッションの世界観に寄り添ったマッチングプラットフォームです。
              </p>
            </div>
          </div>
        </div>
      )}

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>募集中のサロン</h2>
          <p className={styles.sectionSubtitle}>
            {recruitments.length}件の募集があります
          </p>
        </div>

        {error && (
          <div className={styles.error}>
            募集情報の取得に失敗しました。ページを再読み込みしてください。
          </div>
        )}

        {recruitments.length === 0 ? (
          <div className={styles.empty}>
            <p>現在募集中のサロンはありません</p>
          </div>
        ) : (
          <div className={styles.grid}>
            {recruitments.map((recruitment) => (
              <RecruitmentCard key={recruitment.id} recruitment={recruitment} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

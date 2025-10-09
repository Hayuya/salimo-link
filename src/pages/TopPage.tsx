import { useRecruitments } from '@/recruitment';
import { RecruitmentCard } from '@/components/RecruitmentCard';
import { Spinner } from '@/components/Spinner';
import styles from './TopPage.module.css';

export const TopPage = () => {
  const { recruitments, loading, error } = useRecruitments();

  if (loading) {
    return <Spinner fullScreen />;
  }

  return (
    <div className={styles.container}>
      <div className={styles.hero}>
        <h1 className={styles.heroTitle}>
          カットモデルを探す学生と<br />
          美容室アシスタントを繋ぐ
        </h1>
        <p className={styles.heroSubtitle}>
          安全・簡単・無料で、あなたにぴったりの出会いを
        </p>
      </div>

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
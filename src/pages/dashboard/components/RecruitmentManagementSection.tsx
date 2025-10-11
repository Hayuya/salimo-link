import { Link } from 'react-router-dom';
import { Button } from '@/components/Button';
import { formatDateTime } from '@/utils/date';
import { Recruitment } from '@/types';
import styles from './RecruitmentManagementSection.module.css';

interface RecruitmentManagementSectionProps {
  recruitments: Recruitment[];
  onCreateClick: () => void;
  onEditClick: (recruitment: Recruitment) => void;
  onToggleStatus: (id: string, status: 'active' | 'closed') => void | Promise<void>;
  onDelete: (id: string) => void | Promise<void>;
}

export const RecruitmentManagementSection = ({
  recruitments,
  onCreateClick,
  onEditClick,
  onToggleStatus,
  onDelete,
}: RecruitmentManagementSectionProps) => {
  const getAvailableSlotCount = (recruitment: Recruitment) =>
    recruitment.available_dates.filter(date => !date.is_booked).length;

  return (
    <section className={styles.wrapper}>
      <div className={styles.header}>
        <h2 className={styles.title}>募集管理</h2>
        <Button variant="primary" onClick={onCreateClick}>
          新規募集作成
        </Button>
      </div>

      {recruitments.length === 0 ? (
        <p className={styles.emptyText}>まだ募集を作成していません</p>
      ) : (
        <div className={styles.list}>
          {recruitments.map(recruitment => {
            const availableSlots = getAvailableSlotCount(recruitment);
            const isActive = recruitment.status === 'active';
            const flexibleText = recruitment.flexible_schedule_text?.trim();
            const hasFlexible = !!flexibleText;
            return (
              <div key={recruitment.id} className={styles.card}>
                <div className={styles.cardHeader}>
                  <Link to={`/recruitment/${recruitment.id}`} className={styles.titleLink}>
                    {recruitment.title}
                  </Link>
                  <span className={isActive ? styles.statusActive : styles.statusClosed}>
                    {isActive ? '公開中' : '非公開'}
                  </span>
                </div>
                <p className={styles.meta}>
                  最終更新: {formatDateTime(recruitment.updated_at)}
                </p>
                <p className={styles.meta}>
                  空き枠: <strong>{availableSlots}</strong>件
                  {hasFlexible && <span> / 調整メモあり</span>}
                </p>
                {hasFlexible && (
                  <p className={styles.meta}>
                    調整メモ: {flexibleText}
                  </p>
                )}
                <div className={styles.actions}>
                  <Button variant="outline" size="sm" onClick={() => onEditClick(recruitment)}>
                    編集
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      onToggleStatus(recruitment.id, isActive ? 'closed' : 'active')
                    }
                  >
                    {isActive ? '非公開にする' : '公開する'}
                  </Button>
                  <Button variant="danger" size="sm" onClick={() => onDelete(recruitment.id)}>
                    削除
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};

import { Link } from 'react-router-dom';
import { Button } from '@/components/Button';
import { formatDateTime, isFutureDate } from '@/utils/date';
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
        <button type="button" className={styles.createButton} onClick={onCreateClick}>
          <span className={styles.createIcon} aria-hidden="true">
            +
          </span>
          <span className={styles.createLabel}>新規募集作成</span>
        </button>
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
            const upcomingDates = (recruitment.available_dates || []).filter(
              date => !date.is_booked && isFutureDate(date.datetime)
            );
            const visibleUpcomingDates = upcomingDates.slice(0, 3);
            const hasMoreUpcomingDates = upcomingDates.length > visibleUpcomingDates.length;
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
                <div className={styles.scheduleBlock}>
                  <p className={styles.scheduleTitle}>募集中の日時</p>
                  {visibleUpcomingDates.length > 0 ? (
                    <ul className={styles.scheduleList}>
                      {visibleUpcomingDates.map(date => (
                        <li key={date.datetime}>{formatDateTime(date.datetime)}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className={styles.noSchedule}>
                      現在公開中の日時はありません。必要に応じて募集内容を更新してください。
                    </p>
                  )}
                  {hasMoreUpcomingDates && (
                    <p className={styles.scheduleNote}>
                      ほか {upcomingDates.length - visibleUpcomingDates.length} 件の日時があります
                    </p>
                  )}
                </div>
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

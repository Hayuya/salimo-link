import { Link } from 'react-router-dom';
import { RecruitmentWithDetails } from '@/types';
import { MENU_LABELS } from '@/utils/recruitment';
import { isBeforeHoursBefore, isPastCutoffButBeforeEvent, isFutureDate } from '@/utils/date';
import { Card } from './Card';
import styles from './RecruitmentCard.module.css';

interface RecruitmentCardProps {
  recruitment: RecruitmentWithDetails;
}

export const RecruitmentCard = ({ recruitment }: RecruitmentCardProps) => {
  const RESERVATION_CUTOFF_HOURS = 48;

  const upcomingDates = (recruitment.available_dates || []).filter(
    date => !date.is_booked && isFutureDate(date.datetime)
  );
  const bookableDates = upcomingDates.filter(date =>
    isBeforeHoursBefore(date.datetime, RESERVATION_CUTOFF_HOURS)
  );
  const consultableDates = upcomingDates.filter(date =>
    isPastCutoffButBeforeEvent(date.datetime, RESERVATION_CUTOFF_HOURS)
  );

  const bookableSlotsCount = bookableDates.length;
  const hasBookableSlots = bookableSlotsCount > 0;
  const hasConsultableSlots = consultableDates.length > 0;

  const hasFlexibleSchedule = !!recruitment.flexible_schedule_text?.trim();

  const slotDisplay = hasBookableSlots
    ? `受付 ${bookableSlotsCount} 件`
    : hasConsultableSlots
      ? '相談可'
      : hasFlexibleSchedule
        ? '調整可能'
        : 'なし';

  return (
    <Link to={`/recruitment/${recruitment.id}`} className={styles.link}>
      <Card hoverable padding="md">
        <div className={styles.header}>
          {recruitment.salon.photo_url && (
            <img
              src={recruitment.salon.photo_url}
              alt={recruitment.salon.salon_name}
              className={styles.salonImage}
            />
          )}
          <div className={styles.headerInfo}>
            <h3 className={styles.salonName}>{recruitment.salon.salon_name}</h3>
            {recruitment.salon.address && (
              <p className={styles.address}>{recruitment.salon.address}</p>
            )}
          </div>
        </div>

        <h4 className={styles.title}>{recruitment.title}</h4>

        {recruitment.menus && recruitment.menus.length > 0 && (
          <div className={styles.menuTags}>
            {recruitment.menus.slice(0, 3).map(menu => (
              <span key={menu} className={styles.menuTag}>
                {MENU_LABELS[menu]}
              </span>
            ))}
            {recruitment.menus.length > 3 && (
              <span className={styles.menuTag}>+{recruitment.menus.length - 3}</span>
            )}
          </div>
        )}

        {recruitment.description && (
          <p className={styles.description}>
            {recruitment.description.length > 100
              ? `${recruitment.description.substring(0, 100)}...`
              : recruitment.description}
          </p>
        )}

        <div className={styles.footer}>
          <div className={styles.slotInfo}>
            <span className={styles.slotLabel}>空き枠:</span>
            <span className={styles.slotCount}>{slotDisplay}</span>
          </div>

          {hasBookableSlots ? (
            <span className={styles.statusActive}>予約可</span>
          ) : hasConsultableSlots ? (
            <span className={styles.statusUrgent}>相談可</span>
          ) : hasFlexibleSchedule ? (
            <span className={styles.statusActive}>予約可</span>
          ) : (
            <span className={styles.statusClosed}>予約不可</span>
          )}
        </div>
      </Card>
    </Link>
  );
};

import { Link } from 'react-router-dom';
import { RecruitmentWithDetails } from '@/types';
import { MENU_LABELS } from '@/utils/recruitment';
import { Card } from './Card';
import styles from './RecruitmentCard.module.css';

interface RecruitmentCardProps {
  recruitment: RecruitmentWithDetails;
}

export const RecruitmentCard = ({ recruitment }: RecruitmentCardProps) => {
  // ★ 変更: available_dates配列から予約可能な日時をカウント
  const availableSlotsCount = recruitment.available_dates.filter(
    date => !date.is_booked
  ).length;
  const supportsChatConsultation = recruitment.allow_chat_consultation;
  const hasAvailableSlots = availableSlotsCount > 0;

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
            <span className={styles.slotCount}>
              {hasAvailableSlots
                ? `${availableSlotsCount}件`
                : supportsChatConsultation
                  ? 'チャット相談可'
                  : 'なし'}
            </span>
          </div>

          {hasAvailableSlots || supportsChatConsultation ? (
            <span className={styles.statusActive}>
              {supportsChatConsultation && !hasAvailableSlots ? 'チャット相談可' : '予約可能'}
            </span>
          ) : (
            <span className={styles.statusClosed}>予約不可</span>
          )}
        </div>
      </Card>
    </Link>
  );
};

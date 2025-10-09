import { Link } from 'react-router-dom';
import { RecruitmentSlotWithDetails } from '@/types';
import { MENU_LABELS } from '@/utils/recruitment';
import { Card } from './Card';
import styles from './RecruitmentCard.module.css';

interface RecruitmentCardProps {
  recruitment: RecruitmentSlotWithDetails;
}

export const RecruitmentCard = ({ recruitment }: RecruitmentCardProps) => {
  const availableSlotsCount = recruitment.available_slots?.filter(slot => !slot.is_booked).length || 0;

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
            <span className={styles.slotCount}>{availableSlotsCount}件</span>
          </div>

          {availableSlotsCount > 0 ? (
            <span className={styles.statusActive}>予約可能</span>
          ) : (
            <span className={styles.statusClosed}>予約不可</span>
          )}
        </div>
      </Card>
    </Link>
  );
};
import { Link } from 'react-router-dom';
import { RecruitmentSlotWithSalon } from '@/types';
import { formatDate, daysUntilDeadline } from '@/utils/date';
import { MENU_LABELS } from '@/utils/recruitment';
import { Card } from './Card';
import styles from './RecruitmentCard.module.css';

interface RecruitmentCardProps {
  recruitment: RecruitmentSlotWithSalon;
}

export const RecruitmentCard = ({ recruitment }: RecruitmentCardProps) => {
  const daysLeft = daysUntilDeadline(recruitment.deadline_date);
  const isUrgent = daysLeft <= 3 && daysLeft > 0;
  const isClosed = recruitment.status === 'closed' || recruitment.status === 'confirmed';

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
          <div className={styles.deadline}>
            <span className={styles.deadlineLabel}>募集締切:</span>
            <span className={styles.deadlineDate}>
              {formatDate(recruitment.deadline_date)}
            </span>
          </div>

          {isClosed ? (
            <span className={styles.statusClosed}>募集終了</span>
          ) : isUrgent ? (
            <span className={styles.statusUrgent}>
              あと{daysLeft}日
            </span>
          ) : (
            <span className={styles.statusActive}>募集中</span>
          )}
        </div>
      </Card>
    </Link>
  );
};
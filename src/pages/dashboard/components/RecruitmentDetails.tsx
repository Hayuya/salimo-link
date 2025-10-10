import { MENU_LABELS } from '@/utils/recruitment';
import { ReservationWithDetails } from '@/types';
import styles from './RecruitmentDetails.module.css';

type RecruitmentDetailsProps = {
  recruitment: ReservationWithDetails['recruitment'];
};

export const RecruitmentDetails = ({ recruitment }: RecruitmentDetailsProps) => {
  return (
    <div className={styles.wrapper}>
      {recruitment.description && (
        <p className={styles.description}>{recruitment.description}</p>
      )}

      {recruitment.menus?.length > 0 && (
        <div className={styles.tagRow}>
          <span className={styles.label}>メニュー</span>
          <div className={styles.tagList}>
            {recruitment.menus.map(menu => {
              const label = MENU_LABELS[menu] ?? menu;
              return (
                <span key={menu} className={styles.tag}>
                  {label}
                </span>
              );
            })}
          </div>
        </div>
      )}

      <div className={styles.grid}>
        <div className={styles.detailRow}>
          <span className={styles.detailLabel}>性別</span>
          <span className={styles.detailValue}>{recruitment.gender_requirement}</span>
        </div>
        <div className={styles.detailRow}>
          <span className={styles.detailLabel}>髪の長さ</span>
          <span className={styles.detailValue}>{recruitment.hair_length_requirement}</span>
        </div>
        <div className={styles.detailRow}>
          <span className={styles.detailLabel}>モデル経験</span>
          <span className={styles.detailValue}>{recruitment.model_experience_requirement}</span>
        </div>
        <div className={styles.detailRow}>
          <span className={styles.detailLabel}>撮影</span>
          <span className={styles.detailValue}>{recruitment.photo_shoot_requirement}</span>
        </div>
        {recruitment.treatment_duration && (
          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>施術時間</span>
            <span className={styles.detailValue}>{recruitment.treatment_duration}</span>
          </div>
        )}
        {recruitment.has_reward && (
          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>謝礼</span>
            <span className={styles.detailValue}>
              {recruitment.reward_details || 'あり'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

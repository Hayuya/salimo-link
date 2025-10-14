import {
  MENU_LABELS,
  GENDER_LABELS,
  HAIR_LENGTH_LABELS,
  EXPERIENCE_LABELS,
  PHOTO_SHOOT_LABELS,
  MENU_SELECTION_LABELS,
} from '@/utils/recruitment';
import { ReservationWithDetails, MenuSelectionType } from '@/types';
import styles from './RecruitmentDetails.module.css';

type RecruitmentDetailsProps = {
  recruitment: ReservationWithDetails['recruitment'];
};

export const RecruitmentDetails = ({ recruitment }: RecruitmentDetailsProps) => {
  const formatPayment = () => {
    if (recruitment.payment_type === 'free') {
      return '無料';
    }
    if (!recruitment.payment_amount) {
      return '料金未設定';
    }
    return `¥${new Intl.NumberFormat('ja-JP').format(recruitment.payment_amount)}`;
  };

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
          <span className={styles.detailValue}>
            {GENDER_LABELS[recruitment.gender_requirement]}
          </span>
        </div>
        <div className={styles.detailRow}>
          <span className={styles.detailLabel}>髪の長さ</span>
          <span className={styles.detailValue}>
            {HAIR_LENGTH_LABELS[recruitment.hair_length_requirement]}
          </span>
        </div>
        <div className={styles.detailRow}>
          <span className={styles.detailLabel}>モデル経験</span>
          <span className={styles.detailValue}>
            {EXPERIENCE_LABELS[recruitment.model_experience_requirement]}
          </span>
        </div>
        <div className={styles.detailRow}>
          <span className={styles.detailLabel}>撮影</span>
          <span className={styles.detailValue}>
            {PHOTO_SHOOT_LABELS[recruitment.photo_shoot_requirement]}
          </span>
        </div>
        <div className={styles.detailRow}>
          <span className={styles.detailLabel}>料金</span>
          <span className={styles.detailValue}>{formatPayment()}</span>
        </div>
        {recruitment.treatment_duration && (
          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>施術時間</span>
            <span className={styles.detailValue}>{recruitment.treatment_duration}</span>
          </div>
        )}
        <div className={styles.detailRow}>
          <span className={styles.detailLabel}>謝礼</span>
          <span className={styles.detailValue}>
            {recruitment.has_reward
              ? recruitment.reward_details || 'あり'
              : 'なし'}
          </span>
        </div>
        <div className={styles.detailRow}>
          <span className={styles.detailLabel}>メニュー提供</span>
          <span className={styles.detailValue}>
            {MENU_SELECTION_LABELS[(recruitment.menu_selection_type ?? 'fixed') as MenuSelectionType]}
          </span>
        </div>
      </div>
    </div>
  );
};

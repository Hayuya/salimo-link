import { Link } from 'react-router-dom';
import { Button } from '@/components/Button';
import { formatDateTime } from '@/utils/date';
import { ReservationStatus, ReservationWithDetails } from '@/types';
import { RecruitmentDetails } from './RecruitmentDetails';
import styles from './SalonReservationsSection.module.css';

type StatusLabel = { text: string; className: string };

interface SalonReservationsSectionProps {
  pendingReservations: ReservationWithDetails[];
  confirmedReservations: ReservationWithDetails[];
  otherReservations: ReservationWithDetails[];
  expandedReservations: Record<string, boolean>;
  onToggleDetails: (id: string) => void;
  onUpdateStatus: (id: string, status: ReservationStatus) => void;
  onOpenChat: (reservation: ReservationWithDetails) => void;
  hasUnreadMessage: (reservationId: string) => boolean;
  getReservationStatusLabel: (status: ReservationStatus) => StatusLabel;
}

export const SalonReservationsSection = ({
  pendingReservations,
  confirmedReservations,
  otherReservations,
  expandedReservations,
  onToggleDetails,
  onUpdateStatus,
  onOpenChat,
  hasUnreadMessage,
  getReservationStatusLabel,
}: SalonReservationsSectionProps) => {
  // 予約者のイニシャルを取得
  const getInitials = (name: string) => {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return parts[0][0] + parts[parts.length - 1][0];
    }
    return name.slice(0, 2);
  };

  const renderReservationCard = (reservation: ReservationWithDetails) => {
    const isExpanded = !!expandedReservations[reservation.id];
    const statusLabel = getReservationStatusLabel(reservation.status);

    return (
      <div
        key={reservation.id}
        className={[
          styles.card,
          reservation.status === 'pending' ? styles.pending : '',
          reservation.status === 'confirmed' ? styles.confirmed : '',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        <div className={styles.cardHeader}>
          {/* 予約者アバター */}
          <div className={styles.avatarSection}>
            <div className={styles.avatar}>{getInitials(reservation.student.name)}</div>
          </div>

          {/* メイン情報 */}
          <div className={styles.mainInfo}>
            <div className={styles.studentInfo}>
              <h4 className={styles.studentName}>
                {reservation.student.name}
                {reservation.student.school_name && (
                  <span className={styles.schoolBadge}>{reservation.student.school_name}</span>
                )}
              </h4>
              <Link to={`/recruitment/${reservation.recruitment_id}`} className={styles.titleLink}>
                {reservation.recruitment.title}
              </Link>
            </div>

            {/* 予約日時を強調 */}
            <div className={styles.datetimeHighlight}>
              <p className={styles.datetimeText}>{formatDateTime(reservation.reservation_datetime)}</p>
            </div>
          </div>

          {/* アクションエリア */}
          <div className={styles.headerActions}>
            <span className={statusLabel.className}>{statusLabel.text}</span>
            {reservation.status === 'confirmed' && (
              <Button
                size="sm"
                variant="primary"
                className={[
                  styles.chatButton,
                  hasUnreadMessage(reservation.id) ? styles.chatButtonUnread : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                onClick={() => onOpenChat(reservation)}
              >
                <span>チャット</span>
                {hasUnreadMessage(reservation.id) && <span className={styles.chatBadge}>!</span>}
              </Button>
            )}
            <button
              type="button"
              className={styles.toggleButton}
              onClick={() => onToggleDetails(reservation.id)}
              aria-expanded={isExpanded}
            >
              {isExpanded ? '詳細を閉じる' : '詳細を見る'}
              <span
                className={[
                  styles.toggleIcon,
                  isExpanded ? styles.toggleIconOpen : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                aria-hidden="true"
              />
            </button>
          </div>
        </div>

        {isExpanded && (
          <div className={styles.cardBody}>
            <div className={styles.contactList}>
              <p className={styles.contact}>
                <strong>メール:</strong>{' '}
                <a className={styles.link} href={`mailto:${reservation.student.email}`}>
                  {reservation.student.email}
                </a>
              </p>
              {reservation.student.instagram_url && (
                <p className={styles.contact}>
                  <strong>Instagram:</strong>{' '}
                  <a
                    className={styles.link}
                    href={reservation.student.instagram_url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {reservation.student.instagram_url}
                  </a>
                </p>
              )}
            </div>

            <p className={styles.metaLight}>
              <strong>仮予約日:</strong> {formatDateTime(reservation.created_at)}
            </p>

            {reservation.message && (
              <p className={styles.meta}>
                <strong>メッセージ:</strong> {reservation.message}
              </p>
            )}

            <RecruitmentDetails recruitment={reservation.recruitment} />

            {reservation.status === 'pending' && (
              <div className={styles.actionRow}>
                <Button size="sm" variant="primary" onClick={() => onUpdateStatus(reservation.id, 'confirmed')}>
                  承認する
                </Button>
                <Button size="sm" variant="danger" onClick={() => onUpdateStatus(reservation.id, 'cancelled_by_salon')}>
                  キャンセルする
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <section className={styles.wrapper}>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>予約管理</h2>
      </div>
      {(pendingReservations.length + confirmedReservations.length + otherReservations.length) === 0 ? (
        <p className={styles.emptyText}>現在、予約はありません</p>
      ) : (
        <div className={styles.sectionContent}>
          {pendingReservations.length > 0 && (
            <div className={styles.subSection}>
              <h3 className={styles.subSectionTitle}>承認待ち</h3>
              <div className={styles.list}>{pendingReservations.map(renderReservationCard)}</div>
            </div>
          )}

          {confirmedReservations.length > 0 && (
            <div className={styles.subSection}>
              <h3 className={styles.subSectionTitle}>確定済み</h3>
              <div className={styles.list}>{confirmedReservations.map(renderReservationCard)}</div>
            </div>
          )}

          {otherReservations.length > 0 && (
            <div className={styles.subSection}>
              <h3 className={styles.subSectionTitle}>キャンセル・その他</h3>
              <div className={styles.list}>{otherReservations.map(renderReservationCard)}</div>
            </div>
          )}
        </div>
      )}
    </section>
  );
};
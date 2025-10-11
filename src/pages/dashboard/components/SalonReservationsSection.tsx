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
          <div className={styles.summary}>
            <div className={styles.identity}>
              <div className={styles.identityContent}>
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
            </div>

            <div className={styles.metaGrid}>
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>希望日時</span>
                <span className={styles.metaValue}>{formatDateTime(reservation.reservation_datetime)}</span>
              </div>
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>申込日時</span>
                <span className={styles.metaValue}>{formatDateTime(reservation.created_at)}</span>
              </div>
            </div>
          </div>

          <div className={styles.headerActions}>
            <span className={`${styles.statusBadge} ${statusLabel.className}`}>{statusLabel.text}</span>
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
            <div className={styles.infoLayout}>
              <div className={styles.infoCard}>
                <p className={styles.infoTitle}>応募者連絡先</p>
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
              </div>

              <div className={styles.infoCard}>
                <p className={styles.infoTitle}>ステータス</p>
                <div className={styles.timeline}>
                  <div className={styles.timelineItem}>
                    <span className={styles.timelineDot} />
                    <div>
                      <p className={styles.timelineLabel}>希望日時</p>
                      <p className={styles.timelineValue}>
                        {formatDateTime(reservation.reservation_datetime)}
                      </p>
                    </div>
                  </div>
                  <div className={styles.timelineItem}>
                    <span className={styles.timelineDot} />
                    <div>
                      <p className={styles.timelineLabel}>最新ステータス</p>
                      <p className={styles.timelineValue}>{statusLabel.text}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {reservation.status === 'pending' && (
              <div className={styles.infoBanner}>
                <p className={styles.infoBannerTitle}>対応が必要です</p>
                <p className={styles.infoBannerText}>
                  24時間以内の回答をおすすめします。承認またはキャンセルの理由を添えて返信しましょう。
                </p>
              </div>
            )}

            {reservation.message && (
              <div className={styles.messageBox}>
                <p className={styles.messageLabel}>応募者メッセージ</p>
                <p className={styles.messageText}>{reservation.message}</p>
              </div>
            )}

            <div className={styles.recruitmentDetails}>
              <RecruitmentDetails recruitment={reservation.recruitment} />
            </div>

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

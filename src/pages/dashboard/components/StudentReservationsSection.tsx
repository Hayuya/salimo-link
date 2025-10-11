import { Link } from 'react-router-dom';
import { Button } from '@/components/Button';
import { formatDateTime } from '@/utils/date';
import { ReservationStatus, ReservationWithDetails } from '@/types';
import { RecruitmentDetails } from './RecruitmentDetails';
import styles from './StudentReservationsSection.module.css';

type StatusLabel = { text: string; className: string };

interface StudentReservationsSectionProps {
  pendingReservations: ReservationWithDetails[];
  confirmedReservations: ReservationWithDetails[];
  otherReservations: ReservationWithDetails[];
  expandedReservations: Record<string, boolean>;
  onToggleDetails: (id: string) => void;
  onOpenChat: (reservation: ReservationWithDetails) => void;
  hasUnreadMessage: (reservationId: string) => boolean;
  getReservationStatusLabel: (status: ReservationStatus) => StatusLabel;
}

export const StudentReservationsSection = ({
  pendingReservations,
  confirmedReservations,
  otherReservations,
  expandedReservations,
  onToggleDetails,
  onOpenChat,
  hasUnreadMessage,
  getReservationStatusLabel,
}: StudentReservationsSectionProps) => {
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
            <div className={styles.titleGroup}>
              <Link to={`/recruitment/${reservation.recruitment_id}`} className={styles.titleLink}>
                {reservation.recruitment.title}
              </Link>
            </div>
            <div className={styles.metaGrid}>
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>サロン</span>
                <span className={styles.metaValue}>{reservation.recruitment.salon.salon_name}</span>
              </div>
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>予約日時</span>
                <span className={styles.metaValue}>
                  {formatDateTime(reservation.reservation_datetime)}
                </span>
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
                <p className={styles.infoTitle}>サロン連絡先</p>
                <div className={styles.contactList}>
                  {reservation.recruitment.salon.address && (
                    <p className={styles.contact}>
                      <strong>住所:</strong> {reservation.recruitment.salon.address}
                    </p>
                  )}
                  {reservation.recruitment.salon.phone_number && (
                    <p className={styles.contact}>
                      <strong>電話:</strong> {reservation.recruitment.salon.phone_number}
                    </p>
                  )}
                  <p className={styles.contact}>
                    <strong>メール:</strong>{' '}
                    <a
                      className={styles.link}
                      href={`mailto:${reservation.recruitment.salon.email}`}
                    >
                      {reservation.recruitment.salon.email}
                    </a>
                  </p>
                  {reservation.recruitment.salon.website_url && (
                    <p className={styles.contact}>
                      <strong>WEBサイト:</strong>{' '}
                      <a
                        className={styles.link}
                        href={reservation.recruitment.salon.website_url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {reservation.recruitment.salon.website_url}
                      </a>
                    </p>
                  )}
                </div>
              </div>

              <div className={styles.infoCard}>
                <p className={styles.infoTitle}>予約タイムライン</p>
                <div className={styles.timeline}>
                  <div className={styles.timelineItem}>
                    <span className={styles.timelineDot} />
                    <div>
                      <p className={styles.timelineLabel}>仮予約登録</p>
                      <p className={styles.timelineValue}>{formatDateTime(reservation.created_at)}</p>
                    </div>
                  </div>
                  <div className={styles.timelineItem}>
                    <span className={styles.timelineDot} />
                    <div>
                      <p className={styles.timelineLabel}>ステータス</p>
                      <p className={styles.timelineValue}>{statusLabel.text}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {reservation.status === 'confirmed' && (
              <div className={styles.infoBanner}>
                <p className={styles.infoBannerTitle}>予約が確定しました</p>
                <p className={styles.infoBannerText}>サロンからの追加連絡を確認してください。</p>
              </div>
            )}

            {reservation.message && (
              <div className={styles.messageBox}>
                <p className={styles.messageLabel}>送信メッセージ</p>
                <p className={styles.messageText}>{reservation.message}</p>
              </div>
            )}

            <div className={styles.recruitmentDetails}>
              <RecruitmentDetails recruitment={reservation.recruitment} />
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {pendingReservations.length > 0 && (
        <section>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>承認待ちの予約</h2>
            <p className={styles.sectionSubtitle}>
              サロンからの承認をお待ちください。
            </p>
          </div>
          <div className={styles.list}>{pendingReservations.map(renderReservationCard)}</div>
        </section>
      )}

      <section>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>確定済みの予約</h2>
        </div>
        {confirmedReservations.length === 0 ? (
          <p className={styles.emptyText}>まだ確定した予約はありません。</p>
        ) : (
          <div className={styles.list}>{confirmedReservations.map(renderReservationCard)}</div>
        )}
      </section>

      <section>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>キャンセル・終了した予約</h2>
        </div>
        {otherReservations.length === 0 ? (
          <p className={styles.emptyText}>キャンセル・終了した予約はありません。</p>
        ) : (
          <div className={styles.list}>{otherReservations.map(renderReservationCard)}</div>
        )}
      </section>
    </>
  );
};

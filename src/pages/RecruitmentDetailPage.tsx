// src/pages/RecruitmentDetailPage.tsx
import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/auth';
import { useRecruitments } from '@/recruitment';
import { useReservations } from '@/hooks/useReservations';
import { AvailableDate, RecruitmentWithDetails } from '@/types';
import { formatDateTime, isBeforeHoursBefore, isFutureDate, isPastCutoffButBeforeEvent } from '@/utils/date';
import { MENU_LABELS, GENDER_LABELS, HAIR_LENGTH_LABELS, PHOTO_SHOOT_LABELS, EXPERIENCE_LABELS } from '@/utils/recruitment';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { Modal } from '@/components/Modal';
import { Spinner } from '@/components/Spinner';
import styles from './RecruitmentDetailPage.module.css';

export const RecruitmentDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { fetchRecruitmentById } = useRecruitments();
  const {
    createReservation,
    loading: reservationLoading,
    checkStudentHasActiveReservation,
  } = useReservations();

  const [recruitment, setRecruitment] = useState<RecruitmentWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDatetime, setSelectedDatetime] = useState<string | null>(null);
  const [isChatReservation, setIsChatReservation] = useState(false);
  const [chatDate, setChatDate] = useState('');
  const [chatTime, setChatTime] = useState('');
  const [message, setMessage] = useState('');
  const [conditionChecks, setConditionChecks] = useState<Record<string, boolean>>({});
  const [isReservationModalOpen, setIsReservationModalOpen] = useState(false);
  const [hasBlockingReservation, setHasBlockingReservation] = useState(false);
  const [checkingBlockingReservation, setCheckingBlockingReservation] = useState(false);
  const isStudentUser = user?.userType === 'student';
  const flexibleScheduleText = useMemo(
    () => (recruitment?.flexible_schedule_text || '').trim(),
    [recruitment]
  );
  const supportsFlexibleSchedule = flexibleScheduleText.length > 0;
  const RESERVATION_CUTOFF_HOURS = 48;
  const paymentLabel = useMemo(() => {
    if (!recruitment) return '無料';
    if (recruitment.payment_type === 'free') {
      return '無料';
    }
    if (!recruitment.payment_amount) {
      return '料金未設定';
    }
    return `¥${new Intl.NumberFormat('ja-JP').format(recruitment.payment_amount)}`;
  }, [recruitment]);

  const rewardLabel = useMemo(() => {
    if (!recruitment) return 'なし';
    return recruitment.has_reward
      ? recruitment.reward_details?.trim() || 'あり'
      : 'なし';
  }, [recruitment]);
  const reservationDisabledReason = useMemo(() => {
    if (checkingBlockingReservation) {
      return '予約状況を確認しています。少し待ってから再度お試しください。';
    }
    if (hasBlockingReservation) {
      return '承認待ちまたは確定済みの予約があるため、新しい募集には応募できません。既存の予約の処理をお待ちください。';
    }
    if (user && !isStudentUser) {
      return '仮予約は学生ユーザーのみ利用できます';
    }
    return undefined;
  }, [checkingBlockingReservation, hasBlockingReservation, user, isStudentUser]);
  const isReservationActionDisabled = !!reservationDisabledReason;

  const ensureStudentUser = () => {
    if (!user) {
      navigate('/login');
      return false;
    }
    if (user.userType !== 'student') {
      alert('仮予約は学生ユーザーのみが利用できます');
      return false;
    }
    if (checkingBlockingReservation) {
      alert('予約状況を確認しています。少し待ってから再度お試しください。');
      return false;
    }
    if (hasBlockingReservation) {
      alert('承認待ちまたは確定済みの予約があるため、新しい募集には応募できません。既存の予約が処理されるまでお待ちください。');
      return false;
    }
    return true;
  };

  useEffect(() => {
    if (id) {
      setLoading(true);
      fetchRecruitmentById(id)
        .then(data => setRecruitment(data))
        .catch(error => console.error('募集情報の取得に失敗:', error))
        .finally(() => setLoading(false));
    }
  }, [id, fetchRecruitmentById]);

  useEffect(() => {
    let isMounted = true;

    if (user?.userType === 'student') {
      setCheckingBlockingReservation(true);
      checkStudentHasActiveReservation(user.id)
        .then(hasActive => {
          if (isMounted) {
            setHasBlockingReservation(hasActive);
          }
        })
        .catch(err => {
          console.error('既存予約の確認に失敗しました:', err);
          if (isMounted) {
            setHasBlockingReservation(false);
          }
        })
        .finally(() => {
          if (isMounted) {
            setCheckingBlockingReservation(false);
          }
        });
    } else {
      setHasBlockingReservation(false);
      setCheckingBlockingReservation(false);
    }

    return () => {
      isMounted = false;
    };
  }, [user, checkStudentHasActiveReservation]);

  const handleChatConsultation = () => {
    if (!recruitment || !supportsFlexibleSchedule) return;
    if (!ensureStudentUser()) return;
    if (!chatDate || !chatTime) {
      alert('希望する日付と時間を入力してください');
      return;
    }

    const jstDatetime = `${chatDate}T${chatTime}:00+09:00`;
    const isoDatetime = new Date(jstDatetime).toISOString();
    setIsChatReservation(true);
    setSelectedDatetime(isoDatetime);
    setIsReservationModalOpen(true);
  };

  const handleReservation = async () => {
    if (!user || user.userType !== 'student' || !selectedDatetime || !recruitment) return;
    if (!allConditionsChecked) return;
    if (!isBeforeHoursBefore(selectedDatetime, RESERVATION_CUTOFF_HOURS)) {
      alert('予約期限（予約当日の48時間前）を過ぎているため、仮予約できません。');
      return;
    }

    try {
      await createReservation(
        recruitment.id,
        user.id,
        recruitment.salon_id,
        selectedDatetime,
        message,
        isChatReservation
      );
      alert(
        isChatReservation
          ? 'チャット相談のリクエストを送信しました。サロンからの連絡をお待ちください。'
          : '仮予約が完了しました。サロンからの承認をお待ちください。'
      );
      setHasBlockingReservation(true);
      handleModalClose({ resetChatInputs: true });
      // 予約後は募集情報を再取得
      const updated = await fetchRecruitmentById(recruitment.id);
      setRecruitment(updated);
    } catch (error: any) {
      alert(error.message || '予約に失敗しました');
    }
  };

  const { bookableDates, expiredDates } = useMemo(() => {
    if (!recruitment) {
      return { bookableDates: [] as AvailableDate[], expiredDates: [] as AvailableDate[] };
    }

    const bookable: AvailableDate[] = [];
    const expired: AvailableDate[] = [];

    for (const date of recruitment.available_dates || []) {
      if (date.is_booked) continue;
      if (!isFutureDate(date.datetime)) continue;

      if (isBeforeHoursBefore(date.datetime, RESERVATION_CUTOFF_HOURS)) {
        bookable.push(date);
      } else if (isPastCutoffButBeforeEvent(date.datetime, RESERVATION_CUTOFF_HOURS)) {
        expired.push(date);
      }
    }

    return { bookableDates: bookable, expiredDates: expired };
  }, [recruitment]);

  const openReservationModal = (initialDatetime?: string) => {
    if (!ensureStudentUser() || !recruitment) return;
    if (!bookableDates.length) {
      alert('現在予約可能な日時がありません');
      return;
    }

    setIsChatReservation(false);
    setChatDate('');
    setChatTime('');
    const defaultDatetime =
      initialDatetime ?? (bookableDates.length === 1 ? bookableDates[0].datetime : null);
    setSelectedDatetime(defaultDatetime);
    setIsReservationModalOpen(true);
  };

  const handleSelectDatetime = (datetime: string) => {
    openReservationModal(datetime);
  };

  const handleModalClose = (options?: { resetChatInputs?: boolean }) => {
    const { resetChatInputs = false } = options || {};
    setIsReservationModalOpen(false);
    setSelectedDatetime(null);
    setIsChatReservation(false);
    setMessage('');
    if (resetChatInputs) {
      setChatDate('');
      setChatTime('');
    }
  };

  const conditionsToConfirm = useMemo(() => {
    if (!recruitment) return [];
    const list: { id: string; label: string }[] = [
      {
        id: 'gender',
        label: `性別条件を満たしています（${GENDER_LABELS[recruitment.gender_requirement]}）`
      },
      {
        id: 'hair',
        label: `髪の長さ条件を満たしています（${HAIR_LENGTH_LABELS[recruitment.hair_length_requirement]}）`
      },
      {
        id: 'experience',
        label: `モデル経験について理解しています（${EXPERIENCE_LABELS[recruitment.model_experience_requirement]}）`
      },
      {
        id: 'photo',
        label: `撮影可否条件を理解しています（${PHOTO_SHOOT_LABELS[recruitment.photo_shoot_requirement]}）`
      }
    ];

    if (recruitment.treatment_duration) {
      list.push({
        id: 'duration',
        label: `施術時間（約${recruitment.treatment_duration}）に参加できます`
      });
    }

    if (recruitment.has_reward) {
      list.push({
        id: 'reward',
        label: '謝礼内容を確認しました'
      });
    }

    return list;
  }, [recruitment]);

  useEffect(() => {
    if (selectedDatetime) {
      const initialChecks = Object.fromEntries(
        conditionsToConfirm.map(condition => [condition.id, false])
      );
      setConditionChecks(initialChecks);
    } else {
      setConditionChecks({});
    }
  }, [selectedDatetime, conditionsToConfirm]);

  const allConditionsChecked =
    conditionsToConfirm.length === 0 ||
    conditionsToConfirm.every(condition => conditionChecks[condition.id]);

  if (loading) return <Spinner fullScreen />;
  if (!recruitment) return <div className={styles.error}>募集情報が見つかりませんでした</div>;

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <Card>
          {/* 募集情報ヘッダー */}
          <div className={styles.recruitmentHeader}>
            <h2 className={styles.recruitmentTitle}>{recruitment.title}</h2>
            <span className={recruitment.status === 'active' ? styles.statusActive : styles.statusClosed}>
              {recruitment.status === 'active' ? '募集中' : '募集終了'}
            </span>
          </div>

          {recruitment.description && (
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>募集内容</h3>
              <p className={styles.description}>{recruitment.description}</p>
            </div>
          )}

          {/* メニュー（コンパクト表示） */}
          {recruitment.menus.length > 0 && (
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>施術メニュー</h3>
              <div className={styles.menusContainer}>
                {recruitment.menus.map(menu => (
                  <span key={menu} className={styles.menuTag}>
                    {MENU_LABELS[menu]}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* 募集条件 */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>募集条件</h3>
            <div className={styles.conditionsList}>
              <div className={styles.conditionItem}>
                <span className={styles.conditionLabel}>性別</span>
                <span className={styles.conditionValue}>{GENDER_LABELS[recruitment.gender_requirement]}</span>
              </div>
              <div className={styles.conditionItem}>
                <span className={styles.conditionLabel}>髪の長さ</span>
                <span className={styles.conditionValue}>{HAIR_LENGTH_LABELS[recruitment.hair_length_requirement]}</span>
              </div>
              <div className={styles.conditionItem}>
                <span className={styles.conditionLabel}>モデル経験</span>
                <span className={styles.conditionValue}>{EXPERIENCE_LABELS[recruitment.model_experience_requirement]}</span>
              </div>
              <div className={styles.conditionItem}>
                <span className={styles.conditionLabel}>撮影</span>
                <span className={styles.conditionValue}>{PHOTO_SHOOT_LABELS[recruitment.photo_shoot_requirement]}</span>
              </div>
              <div className={styles.conditionItem}>
                <span className={styles.conditionLabel}>料金</span>
                <span className={styles.conditionValue}>{paymentLabel}</span>
              </div>
              {recruitment.treatment_duration && (
                <div className={styles.conditionItem}>
                  <span className={styles.conditionLabel}>施術時間</span>
                  <span className={styles.conditionValue}>{recruitment.treatment_duration}</span>
                </div>
              )}
              <div className={styles.conditionItem}>
                <span className={styles.conditionLabel}>謝礼</span>
                <span className={styles.conditionValue}>{rewardLabel}</span>
              </div>
            </div>
          </div>

          {/* サロン情報 */}
          <div className={[styles.section, styles.sectionNoCard].join(' ')}>
            <div className={styles.salonInfoCard}>
              <div className={styles.salonInfoHeader}>
                <div className={styles.salonInfoTitle}>
                  <span className={styles.salonInfoIcon} aria-hidden="true" />
                  <p>サロン情報</p>
                </div>
                {recruitment.salon.photo_url && (
                  <img
                    src={recruitment.salon.photo_url}
                    alt={recruitment.salon.salon_name}
                    className={styles.salonThumbnail}
                  />
                )}
              </div>
              <dl className={styles.salonInfoList}>
                <div className={styles.salonInfoItem}>
                  <dt className={styles.infoLabel}>サロン名</dt>
                  <dd className={styles.infoValue}>{recruitment.salon.salon_name}</dd>
                </div>
                {recruitment.salon.address && (
                  <div className={styles.salonInfoItem}>
                    <dt className={styles.infoLabel}>住所</dt>
                    <dd className={[styles.infoValue, styles.addressValue].join(' ')}>
                      <span>{recruitment.salon.address}</span>
                    </dd>
                  </div>
                )}
                {recruitment.salon.phone_number && (
                  <div className={styles.salonInfoItem}>
                    <dt className={styles.infoLabel}>電話</dt>
                    <dd className={styles.infoValue}>{recruitment.salon.phone_number}</dd>
                  </div>
                )}
                {recruitment.salon.website_url && (
                  <div className={styles.salonInfoItem}>
                    <dt className={styles.infoLabel}>WEBサイト</dt>
                    <dd className={styles.infoValue}>
                      <a
                        href={recruitment.salon.website_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.contactLink}
                      >
                        {recruitment.salon.website_url}
                      </a>
                    </dd>
                  </div>
                )}
              </dl>
              {recruitment.salon.description && (
                <p className={styles.salonDescription}>{recruitment.salon.description}</p>
              )}
            </div>
          </div>

          {/* 予約可能な日時 */}
          {user && (
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>予約可能な日時</h3>
            {bookableDates.length > 0 ? (
              <div className={styles.availableDatesBlock}>
                <div className={styles.availableDatesList}>
                  {bookableDates.map(date => (
                    <Button
                      key={date.datetime}
                      variant="outline"
                      onClick={() => handleSelectDatetime(date.datetime)}
                      className={styles.availableDateButton}
                      disabled={isReservationActionDisabled}
                      title={reservationDisabledReason}
                    >
                      {formatDateTime(date.datetime)}
                    </Button>
                  ))}
                </div>
                <div className={styles.reservationAction}>
                  <Button
                    variant="primary"
                    fullWidth
                    onClick={() => openReservationModal()}
                    disabled={isReservationActionDisabled}
                    title={reservationDisabledReason}
                  >
                    仮予約する
                  </Button>
                  {reservationDisabledReason && (
                    <p className={styles.reservationRestriction}>{reservationDisabledReason}</p>
                  )}
                </div>
              </div>
            ) : expiredDates.length > 0 ? (
              <div className={styles.expiredNotice}>
                <p className={styles.expiredNoticeTitle}>予約期限を過ぎています</p>
                <p className={styles.expiredNoticeText}>
                  各予約枠は予約日時の48時間前で締切となります。掲載日時は「相談可」となりますので、サロンへ直接ご連絡の上、空き状況をご相談ください。
                </p>
                {(recruitment.salon.phone_number || recruitment.salon.email) && (
                  <div className={styles.expiredNoticeContacts}>
                    {recruitment.salon.phone_number && (
                      <p className={styles.expiredNoticeContact}>
                        電話: {recruitment.salon.phone_number}
                      </p>
                    )}
                    {recruitment.salon.email && (
                      <p className={styles.expiredNoticeContact}>
                        メール: {recruitment.salon.email}
                      </p>
                    )}
                  </div>
                )}
                {!recruitment.salon.phone_number && !recruitment.salon.email && (
                  <p className={styles.expiredNoticeContact}>
                    サロン情報欄から提示の連絡手段でご相談ください。
                  </p>
                )}
                <div className={styles.expiredDatesList}>
                  {expiredDates.map(date => (
                    <div key={date.datetime} className={styles.expiredDateItem}>
                      <span>{formatDateTime(date.datetime)}</span>
                      <span className={styles.expiredDateLabel}>相談可</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : supportsFlexibleSchedule ? (
              <div className={styles.closedMessage}>
                <p style={{ margin: 0 }}>
                  現在、具体的な空き枠は公開されていません。
                </p>
                <p style={{ margin: 'var(--spacing-xs) 0 0 0', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
                  {flexibleScheduleText}
                </p>
              </div>
            ) : (
              <p className={styles.closedMessage}>
                現在予約可能な日時がありません
              </p>
            )}

            {supportsFlexibleSchedule && (
              <div className={styles.chatConsultationBlock}>
                <h4 className={styles.chatTitle}>柔軟に日時を相談する</h4>
                <p className={styles.chatDescription}>
                  希望日時が決まっていない場合でも募集に申し込めます。下記の希望日時を入力すると、サロンに仮予約リクエストを送信できます。
                </p>
                <div className={styles.flexibleNote}>
                  <strong>サロンからの案内:</strong>
                  <span>{flexibleScheduleText}</span>
                </div>
                <div className={styles.chatInputs}>
                  <label className={styles.chatInputField}>
                    <span>希望日</span>
                    <input
                      type="date"
                      value={chatDate}
                      onChange={e => setChatDate(e.target.value)}
                    />
                  </label>
                  <label className={styles.chatInputField}>
                    <span>希望時間</span>
                    <input
                      type="time"
                      value={chatTime}
                      onChange={e => setChatTime(e.target.value)}
                    />
                  </label>
                </div>
                <Button
                  variant="secondary"
                  onClick={handleChatConsultation}
                  disabled={!chatDate || !chatTime || isReservationActionDisabled}
                  title={!chatDate || !chatTime ? undefined : reservationDisabledReason}
                >
                  相談リクエストを送信する
                </Button>
              </div>
            )}
          </div>
          )}
        </Card>
      </div>

      {/* 予約確認モーダル */}
      {isReservationModalOpen && (
        <Modal 
          isOpen={isReservationModalOpen} 
          onClose={handleModalClose} 
          title={isChatReservation ? 'チャット相談を開始' : '予約確認'} 
          size="md"
        >
          <div className={styles.modalContent}>
            <p className={styles.modalDescription}>
              {isChatReservation
                ? 'チャットで日時を相談するリクエストを送信します。よろしいですか?'
                : '希望する日時を選択して仮予約を確定してください。'}
            </p>
            {!isChatReservation && (
              <div className={styles.datetimeSelector}>
                <p className={styles.datetimeSelectorLabel}>予約希望日時</p>
                {bookableDates.length > 0 ? (
                  <div className={styles.datetimeOptions}>
                    {bookableDates.map(date => {
                      const checked = selectedDatetime === date.datetime;
                      return (
                        <label
                          key={date.datetime}
                          className={[
                            styles.datetimeOption,
                            checked ? styles.datetimeOptionSelected : ''
                          ]
                            .filter(Boolean)
                            .join(' ')}
                        >
                          <input
                            type="radio"
                            name="reservationDatetime"
                            value={date.datetime}
                            checked={checked}
                            onChange={() => setSelectedDatetime(date.datetime)}
                          />
                          <span>{formatDateTime(date.datetime)}</span>
                        </label>
                      );
                    })}
                  </div>
                ) : (
                  <div className={styles.errorBox}>
                    現在選択できる日時がありません。予約期限を過ぎているか、別の申し込みが先に確定した可能性があります。
                  </div>
                )}
                {!selectedDatetime && (
                  <p className={styles.datetimeSelectorNotice}>
                    日時を選択すると仮予約に進めます。
                  </p>
                )}
              </div>
            )}

            {selectedDatetime && (
              <div className={styles.selectedDatetimeBox}>
                {formatDateTime(selectedDatetime)}
              </div>
            )}

            {conditionsToConfirm.length > 0 && (
              <div className={styles.checklistSection}>
                <p className={styles.checklistTitle}>募集条件を確認してください</p>
                <div className={styles.checklistItems}>
                  {conditionsToConfirm.map(condition => (
                    <label key={condition.id} className={styles.checklistItem}>
                      <input
                        type="checkbox"
                        checked={!!conditionChecks[condition.id]}
                        onChange={e =>
                          setConditionChecks(prev => ({
                            ...prev,
                            [condition.id]: e.target.checked
                          }))
                        }
                      />
                      <span>{condition.label}</span>
                    </label>
                  ))}
                </div>
                {!allConditionsChecked && (
                  <p className={styles.checklistNotice}>
                    すべての条件に同意すると仮予約が可能になります。
                  </p>
                )}
              </div>
            )}
          
            <div className={styles.inputWrapper}>
              <label className={styles.label}>サロンへのメッセージ（任意）</label>
              <textarea
                className={styles.textarea}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="希望する施術内容や質問があれば入力してください"
                rows={4}
              />
            </div>

            <div className={styles.modalActions}>
              <Button 
                variant="outline" 
                onClick={() => handleModalClose()}
              >
                キャンセル
              </Button>
              <Button 
                variant="primary" 
                onClick={handleReservation} 
                loading={reservationLoading}
                disabled={
                  !allConditionsChecked ||
                  (!selectedDatetime && !isChatReservation) ||
                  hasBlockingReservation
                }
              >
                {isChatReservation ? 'チャットを開始する' : '仮予約を確定する'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

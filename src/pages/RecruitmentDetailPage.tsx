// src/pages/RecruitmentDetailPage.tsx
import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/auth';
import { useRecruitments } from '@/recruitment';
import { useReservations } from '@/hooks/useReservations';
import { RecruitmentWithDetails } from '@/types';
import { formatDateTime } from '@/utils/date';
import { MENU_LABELS, GENDER_LABELS, HAIR_LENGTH_LABELS, PHOTO_SHOOT_LABELS, EXPERIENCE_LABELS } from '@/utils/recruitment';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { Modal } from '@/components/Modal';
import { Spinner } from '@/components/Spinner';
import styles from './RecruitmentDetailPage.module.css';

// メニューアイコンマッピング
const MENU_ICONS: Record<string, string> = {
  cut: '✂️',
  color: '🎨',
  perm: '💇',
  treatment: '✨',
  styling: '💅'
};

export const RecruitmentDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { fetchRecruitmentById } = useRecruitments();
  const { createReservation, loading: reservationLoading } = useReservations();

  const [recruitment, setRecruitment] = useState<RecruitmentWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDatetime, setSelectedDatetime] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [isSalonInfoOpen, setIsSalonInfoOpen] = useState(false);
  const [conditionChecks, setConditionChecks] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (id) {
      setLoading(true);
      fetchRecruitmentById(id)
        .then(data => setRecruitment(data))
        .catch(error => console.error('募集情報の取得に失敗:', error))
        .finally(() => setLoading(false));
    }
  }, [id, fetchRecruitmentById]);

  const handleReservation = async () => {
    if (!user || user.userType !== 'student' || !selectedDatetime || !recruitment) return;
    if (!allConditionsChecked) return;

    try {
      await createReservation(
        recruitment.id,
        user.id,
        recruitment.salon_id,
        selectedDatetime,
        message
      );
      alert('仮予約が完了しました。サロンからの承認をお待ちください。');
      setSelectedDatetime(null);
      setMessage('');
      // 予約後は募集情報を再取得
      const updated = await fetchRecruitmentById(recruitment.id);
      setRecruitment(updated);
    } catch (error: any) {
      alert(error.message || '予約に失敗しました');
    }
  };

  const availableDates = useMemo(
    () => (recruitment ? recruitment.available_dates.filter(date => !date.is_booked) : []),
    [recruitment]
  );

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
        {/* サロン情報 */}
        <div className={styles.dropdownSection}>
          <button
            type="button"
            className={styles.dropdownTrigger}
            onClick={() => setIsSalonInfoOpen(prev => !prev)}
            aria-expanded={isSalonInfoOpen}
          >
            <span className={styles.dropdownTitle}>サロン情報</span>
            <span
              className={[
                styles.dropdownIcon,
                isSalonInfoOpen ? styles.dropdownIconOpen : ''
              ].filter(Boolean).join(' ')}
              aria-hidden="true"
            />
          </button>
          {isSalonInfoOpen && (
            <div className={styles.dropdownContent}>
              <div className={styles.salonHeader}>
                {recruitment.salon.photo_url && (
                  <img
                    src={recruitment.salon.photo_url}
                    alt={recruitment.salon.salon_name}
                    className={styles.salonImage}
                  />
                )}
                <div className={styles.salonInfo}>
                  <h1 className={styles.salonName}>{recruitment.salon.salon_name}</h1>
                  {recruitment.salon.address && (
                    <p className={styles.address}>{recruitment.salon.address}</p>
                  )}
                  {recruitment.salon.phone_number && (
                    <p className={styles.contactItem}>
                      <span className={styles.contactLabel}>📞 電話番号:</span>
                      <span>{recruitment.salon.phone_number}</span>
                    </p>
                  )}
                  {recruitment.salon.website_url && (
                    <p className={styles.contactItem}>
                      <span className={styles.contactLabel}>🌐 WEBサイト:</span>
                      <a
                        href={recruitment.salon.website_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.contactLink}
                      >
                        {recruitment.salon.website_url}
                      </a>
                    </p>
                  )}
                  {recruitment.salon.description && (
                    <p className={styles.salonDescription}>{recruitment.salon.description}</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

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

          {/* メニュー */}
          {recruitment.menus.length > 0 && (
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>施術メニュー</h3>
              <div className={styles.conditionsList}>
                {recruitment.menus.map(menu => (
                  <div key={menu} className={styles.conditionItem}>
                    <span style={{ fontSize: '1.5rem' }}>{MENU_ICONS[menu] || '💈'}</span>
                    <span className={styles.conditionValue}>{MENU_LABELS[menu]}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 募集条件 */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>募集条件</h3>
            <div className={styles.conditionsList}>
              <div className={styles.conditionItem}>
                <span className={styles.conditionLabel}>性別:</span>
                <span className={styles.conditionValue}>{GENDER_LABELS[recruitment.gender_requirement]}</span>
              </div>
              <div className={styles.conditionItem}>
                <span className={styles.conditionLabel}>髪の長さ:</span>
                <span className={styles.conditionValue}>{HAIR_LENGTH_LABELS[recruitment.hair_length_requirement]}</span>
              </div>
              <div className={styles.conditionItem}>
                <span className={styles.conditionLabel}>モデル経験:</span>
                <span className={styles.conditionValue}>{EXPERIENCE_LABELS[recruitment.model_experience_requirement]}</span>
              </div>
              <div className={styles.conditionItem}>
                <span className={styles.conditionLabel}>撮影:</span>
                <span className={styles.conditionValue}>{PHOTO_SHOOT_LABELS[recruitment.photo_shoot_requirement]}</span>
              </div>
              {recruitment.treatment_duration && (
                <div className={styles.conditionItem}>
                  <span className={styles.conditionLabel}>施術時間:</span>
                  <span className={styles.conditionValue}>{recruitment.treatment_duration}</span>
                </div>
              )}
              {recruitment.has_reward && (
                <div className={styles.conditionItem}>
                  <span className={styles.conditionLabel}>謝礼:</span>
                  <span className={styles.conditionValue}>
                    {recruitment.reward_details || 'あり'}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* 予約可能な日時 */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>📅 予約可能な日時</h3>
            {availableDates.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
                {availableDates.map((date, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    onClick={() => {
                      if (user) {
                        setSelectedDatetime(date.datetime);
                      } else {
                        navigate('/login');
                      }
                    }}
                    style={{ textAlign: 'left', justifyContent: 'flex-start' }}
                  >
                    🕐 {formatDateTime(date.datetime)}
                  </Button>
                ))}
              </div>
            ) : (
              <p className={styles.closedMessage}>現在予約可能な日時がありません</p>
            )}
          </div>
        </Card>
      </div>

      {/* 予約確認モーダル */}
      {selectedDatetime && (
        <Modal 
          isOpen={!!selectedDatetime} 
          onClose={() => setSelectedDatetime(null)} 
          title="予約確認" 
          size="md"
        >
          <div className={styles.modalContent}>
            <p className={styles.modalDescription}>
              以下の日時で仮予約します。よろしいですか？
            </p>
            <div style={{ 
              padding: 'var(--spacing-md)', 
              backgroundColor: 'var(--color-bg-secondary)', 
              borderRadius: 'var(--radius-md)',
              fontWeight: 'var(--font-weight-semibold)'
            }}>
              🕐 {formatDateTime(selectedDatetime)}
            </div>

            {conditionsToConfirm.length > 0 && (
              <div className={styles.checklistSection}>
                <p className={styles.checklistTitle}>📋 募集条件を確認してください</p>
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
                    ⚠️ すべての条件に同意すると仮予約が可能になります。
                  </p>
                )}
              </div>
            )}
          
            <div className={styles.inputWrapper}>
              <label className={styles.label}>💬 サロンへのメッセージ（任意）</label>
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
                onClick={() => {
                  setSelectedDatetime(null);
                  setMessage('');
                }}
              >
                キャンセル
              </Button>
              <Button 
                variant="primary" 
                onClick={handleReservation} 
                loading={reservationLoading}
                disabled={!allConditionsChecked}
              >
                仮予約を確定する
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
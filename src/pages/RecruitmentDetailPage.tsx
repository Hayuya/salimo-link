// src/pages/RecruitmentDetailPage.tsx
import { useState, useEffect } from 'react';
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

  if (loading) return <Spinner fullScreen />;
  if (!recruitment) return <div>募集情報が見つかりませんでした</div>;

  // ★ 変更: available_dates配列から予約可能な日時を抽出
  const availableDates = recruitment.available_dates.filter(date => !date.is_booked);

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        {/* サロン情報 */}
        <Card padding="lg">
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
            </div>
          </div>

          {/* 募集情報 */}
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
            <h3 className={styles.sectionTitle}>予約可能な日時</h3>
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
                    style={{ textAlign: 'left' }}
                  >
                    {formatDateTime(date.datetime)}
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
              {formatDateTime(selectedDatetime)}
            </div>
            
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
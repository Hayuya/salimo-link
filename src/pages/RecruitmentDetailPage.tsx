// src/pages/RecruitmentDetailPage.tsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/auth';
import { useRecruitments } from '@/recruitment';
import { useReservations } from '@/hooks/useReservations';
import { RecruitmentSlotWithDetails, AvailableSlot } from '@/types';
import { formatDateTime } from '@/utils/date';
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

  const [recruitment, setRecruitment] = useState<RecruitmentSlotWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState<AvailableSlot | null>(null);
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
    if (!user || user.userType !== 'student' || !selectedSlot || !recruitment) return;

    try {
      await createReservation({
        slot_id: selectedSlot.id,
        student_id: user.id,
        salon_id: recruitment.salon_id,
        recruitment_slot_id: recruitment.id,
        message,
        status: 'pending',
      });
      alert('仮予約が完了しました。サロンからの承認をお待ちください。');
      setSelectedSlot(null);
      // 予約後はスロット一覧を更新
      fetchRecruitmentById(recruitment.id).then(setRecruitment);
    } catch (error: any) {
      alert(error.message || '予約に失敗しました');
    }
  };

  if (loading) return <Spinner fullScreen />;
  if (!recruitment) return <div>募集情報が見つかりませんでした</div>;

  const availableSlots = recruitment.available_slots.filter(slot => !slot.is_booked);

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        {/* サロン情報 (変更なし) */}
        
        <Card padding="lg">
          {/* 募集情報 (締切日を削除) */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>予約可能な日時</h3>
            {availableSlots.length > 0 ? (
              <div className={styles.slotsGrid}>
                {availableSlots.map(slot => (
                  <Button 
                    key={slot.id} 
                    variant="outline"
                    onClick={() => user ? setSelectedSlot(slot) : navigate('/login')}
                  >
                    {formatDateTime(slot.slot_time)}
                  </Button>
                ))}
              </div>
            ) : (
              <p>現在予約可能な日時がありません。</p>
            )}
          </div>
        </Card>
      </div>

      {selectedSlot && (
        <Modal isOpen={!!selectedSlot} onClose={() => setSelectedSlot(null)} title="予約確認" size="md">
          <div className={styles.modalContent}>
            <p>以下の日時で仮予約します。よろしいですか？</p>
            <strong>{formatDateTime(selectedSlot.slot_time)}</strong>
            <textarea
              className={styles.textarea}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="サロンへのメッセージがあれば入力してください（任意）"
              rows={4}
            />
            <div className={styles.modalActions}>
              <Button variant="outline" onClick={() => setSelectedSlot(null)}>キャンセル</Button>
              <Button variant="primary" onClick={handleReservation} loading={reservationLoading}>仮予約を確定する</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/auth';
import { useRecruitments } from '@/recruitment';
import { useApplications } from '@/hooks/useApplications';
import { RecruitmentSlotWithSalon } from '@/types';
import { formatDate, formatDateTime, isDeadlinePassed } from '@/utils/date';
import { MENU_LABELS, GENDER_LABELS, HAIR_LENGTH_LABELS } from '@/utils/recruitment';
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
  const { checkIfApplied, createApplication } = useApplications();

  const [recruitment, setRecruitment] = useState<RecruitmentSlotWithSalon | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasApplied, setHasApplied] = useState(false);

  // 応募モーダル
  const [showModal, setShowModal] = useState(false);
  const [message, setMessage] = useState('');
  const [conditionsAccepted, setConditionsAccepted] = useState<boolean[]>([]);
  const [errors, setErrors] = useState<{ conditions?: string; general?: string }>({});
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    loadRecruitment();
  }, [id]);

  const loadRecruitment = async () => {
    if (!id) return;

    try {
      setLoading(true);
      const data = await fetchRecruitmentById(id);
      setRecruitment(data);

      // 学生の場合、応募済みかチェック
      if (user && user.userType === 'student') {
        const applied = await checkIfApplied(user.id, id);
        setHasApplied(applied);
      }
    } catch (error) {
      console.error('募集情報の取得に失敗:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyClick = () => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (user.userType !== 'student') {
      alert('学生のみ応募できます');
      return;
    }

    if (!recruitment) return;

    // 条件の数だけfalseの配列を初期化
    const conditionCount = getConditionCount(recruitment);
    setConditionsAccepted(new Array(conditionCount).fill(false));
    setShowModal(true);
  };

  const getConditionCount = (rec: RecruitmentSlotWithSalon) => {
    let count = 0;
    if (rec.menus && rec.menus.length > 0) count++;
    if (rec.gender_requirement && rec.gender_requirement !== 'any') count++;
    if (rec.hair_length_requirement && rec.hair_length_requirement !== 'any') count++;
    if (rec.has_date_requirement) count++;
    if (rec.treatment_duration) count++;
    return count;
  };

  const validateForm = () => {
    const newErrors: { conditions?: string } = {};

    // 全ての条件にチェックが入っているか確認
    if (!conditionsAccepted.every(accepted => accepted)) {
      newErrors.conditions = '全ての条件を確認してチェックを入れてください';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmitApplication = async () => {
    if (!validateForm() || !user || !recruitment) return;

    setApplying(true);
    setErrors({});

    try {
      await createApplication({
        recruitment_slot_id: recruitment.id,
        student_id: user.id,
        message: message || undefined,
        status: 'pending',
      });

      alert('応募が完了しました！');
      setShowModal(false);
      setHasApplied(true);
      setMessage('');
      setConditionsAccepted([]);
    } catch (error: any) {
      setErrors({ general: error.message || '応募に失敗しました' });
    } finally {
      setApplying(false);
    }
  };

  if (loading) {
    return <Spinner fullScreen />;
  }

  if (!recruitment) {
    return (
      <div className={styles.container}>
        <Card padding="lg">
          <p className={styles.error}>募集情報が見つかりませんでした</p>
          <Button onClick={() => navigate('/')}>トップページへ戻る</Button>
        </Card>
      </div>
    );
  }

  const deadlinePassed = isDeadlinePassed(recruitment.deadline_date);
  const canApply = user?.userType === 'student' && !hasApplied && !deadlinePassed && recruitment.status === 'active';

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
                <p className={styles.address}>📍 {recruitment.salon.address}</p>
              )}
            </div>
          </div>

          {recruitment.salon.description && (
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>サロンについて</h3>
              <p className={styles.description}>{recruitment.salon.description}</p>
            </div>
          )}
        </Card>

        {/* 募集情報 */}
        <Card padding="lg">
          <div className={styles.recruitmentHeader}>
            <h2 className={styles.recruitmentTitle}>{recruitment.title}</h2>
            {recruitment.status === 'closed' || recruitment.status === 'confirmed' ? (
              <span className={styles.statusClosed}>募集終了</span>
            ) : deadlinePassed ? (
              <span className={styles.statusClosed}>締切済み</span>
            ) : (
              <span className={styles.statusActive}>募集中</span>
            )}
          </div>

          <div className={styles.deadlineInfo}>
            <span className={styles.label}>募集締切:</span>
            <span className={styles.value}>{formatDate(recruitment.deadline_date)}</span>
          </div>

          {recruitment.description && (
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>募集内容</h3>
              <p className={styles.description}>{recruitment.description}</p>
            </div>
          )}

          {/* 募集条件 */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>募集条件</h3>
            <div className={styles.conditionsList}>
              {recruitment.menus && recruitment.menus.length > 0 && (
                <div className={styles.conditionItem}>
                  <span className={styles.conditionLabel}>メニュー:</span>
                  <span className={styles.conditionValue}>
                    {recruitment.menus.map(menu => MENU_LABELS[menu]).join('、')}
                  </span>
                </div>
              )}
              {recruitment.gender_requirement && recruitment.gender_requirement !== 'any' && (
                <div className={styles.conditionItem}>
                  <span className={styles.conditionLabel}>性別:</span>
                  <span className={styles.conditionValue}>
                    {GENDER_LABELS[recruitment.gender_requirement]}
                  </span>
                </div>
              )}
              {recruitment.hair_length_requirement && recruitment.hair_length_requirement !== 'any' && (
                <div className={styles.conditionItem}>
                  <span className={styles.conditionLabel}>髪の長さ:</span>
                  <span className={styles.conditionValue}>
                    {HAIR_LENGTH_LABELS[recruitment.hair_length_requirement]}
                  </span>
                </div>
              )}
              {recruitment.has_date_requirement && recruitment.appointment_date && (
                <div className={styles.conditionItem}>
                  <span className={styles.conditionLabel}>施術日時:</span>
                  <span className={styles.conditionValue}>
                    {formatDateTime(recruitment.appointment_date)}
                  </span>
                </div>
              )}
              {recruitment.treatment_duration && (
                <div className={styles.conditionItem}>
                  <span className={styles.conditionLabel}>施術時間:</span>
                  <span className={styles.conditionValue}>
                    {recruitment.treatment_duration}
                  </span>
                </div>
              )}
            </div>
          </div>

          {recruitment.requirements && (
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>その他の条件</h3>
              <p className={styles.description}>{recruitment.requirements}</p>
            </div>
          )}

          {/* 応募ボタン */}
          {user?.userType === 'student' && (
            <div className={styles.applySection}>
              {hasApplied ? (
                <div className={styles.appliedMessage}>
                  ✓ 応募済みです
                </div>
              ) : canApply ? (
                <Button
                  variant="primary"
                  size="lg"
                  fullWidth
                  onClick={handleApplyClick}
                >
                  この募集に応募する
                </Button>
              ) : deadlinePassed ? (
                <p className={styles.closedMessage}>募集締切を過ぎています</p>
              ) : (
                <p className={styles.closedMessage}>募集は終了しました</p>
              )}
            </div>
          )}

          {!user && (
            <div className={styles.applySection}>
              <Button
                variant="primary"
                size="lg"
                fullWidth
                onClick={() => navigate('/login')}
              >
                ログインして応募する
              </Button>
            </div>
          )}
        </Card>
      </div>

      {/* 応募モーダル */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="応募確認"
        size="md"
      >
        <div className={styles.modalContent}>
          <p className={styles.modalDescription}>
            以下の条件を確認し、全ての項目にチェックを入れてください
          </p>

          {/* 条件確認チェックリスト */}
          <div className={styles.conditionsChecklist}>
            {recruitment && (() => {
              let index = 0;
              const conditions = [];

              if (recruitment.menus && recruitment.menus.length > 0) {
                const currentIndex = index;
                conditions.push(
                  <label key="menu" className={styles.conditionCheckLabel}>
                    <input
                      type="checkbox"
                      checked={conditionsAccepted[currentIndex] || false}
                      onChange={(e) => {
                        const newAccepted = [...conditionsAccepted];
                        newAccepted[currentIndex] = e.target.checked;
                        setConditionsAccepted(newAccepted);
                      }}
                    />
                    <span>
                      <strong>メニュー:</strong> {recruitment.menus.map(m => MENU_LABELS[m]).join('、')}に該当します
                    </span>
                  </label>
                );
                index++;
              }

              if (recruitment.gender_requirement && recruitment.gender_requirement !== 'any') {
                const currentIndex = index;
                conditions.push(
                  <label key="gender" className={styles.conditionCheckLabel}>
                    <input
                      type="checkbox"
                      checked={conditionsAccepted[currentIndex] || false}
                      onChange={(e) => {
                        const newAccepted = [...conditionsAccepted];
                        newAccepted[currentIndex] = e.target.checked;
                        setConditionsAccepted(newAccepted);
                      }}
                    />
                    <span>
                      <strong>性別:</strong> {GENDER_LABELS[recruitment.gender_requirement]}に該当します
                    </span>
                  </label>
                );
                index++;
              }

              if (recruitment.hair_length_requirement && recruitment.hair_length_requirement !== 'any') {
                const currentIndex = index;
                conditions.push(
                  <label key="hair" className={styles.conditionCheckLabel}>
                    <input
                      type="checkbox"
                      checked={conditionsAccepted[currentIndex] || false}
                      onChange={(e) => {
                        const newAccepted = [...conditionsAccepted];
                        newAccepted[currentIndex] = e.target.checked;
                        setConditionsAccepted(newAccepted);
                      }}
                    />
                    <span>
                      <strong>髪の長さ:</strong> {HAIR_LENGTH_LABELS[recruitment.hair_length_requirement]}に該当します
                    </span>
                  </label>
                );
                index++;
              }

              if (recruitment.has_date_requirement && recruitment.appointment_date) {
                const currentIndex = index;
                conditions.push(
                  <label key="date" className={styles.conditionCheckLabel}>
                    <input
                      type="checkbox"
                      checked={conditionsAccepted[currentIndex] || false}
                      onChange={(e) => {
                        const newAccepted = [...conditionsAccepted];
                        newAccepted[currentIndex] = e.target.checked;
                        setConditionsAccepted(newAccepted);
                      }}
                    />
                    <span>
                      <strong>施術日時:</strong> {formatDateTime(recruitment.appointment_date)}に参加可能です
                    </span>
                  </label>
                );
                index++;
              }

              if (recruitment.treatment_duration) {
                const currentIndex = index;
                conditions.push(
                  <label key="duration" className={styles.conditionCheckLabel}>
                    <input
                      type="checkbox"
                      checked={conditionsAccepted[currentIndex] || false}
                      onChange={(e) => {
                        const newAccepted = [...conditionsAccepted];
                        newAccepted[currentIndex] = e.target.checked;
                        setConditionsAccepted(newAccepted);
                      }}
                    />
                    <span>
                      <strong>施術時間:</strong> {recruitment.treatment_duration}の時間を確保できます
                    </span>
                  </label>
                );
                index++;
              }

              return conditions;
            })()}
          </div>

          {errors.conditions && (
            <div className={styles.errorBox}>
              {errors.conditions}
            </div>
          )}

          {/* メッセージ入力 */}
          <div className={styles.inputWrapper}>
            <label className={styles.label}>メッセージ（任意）</label>
            <textarea
              className={styles.textarea}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="サロンへのメッセージや希望があれば入力してください"
              rows={4}
            />
          </div>

          {errors.general && (
            <div className={styles.errorBox}>
              {errors.general}
            </div>
          )}

          <div className={styles.modalActions}>
            <Button
              variant="outline"
              onClick={() => setShowModal(false)}
              disabled={applying}
            >
              キャンセル
            </Button>
            <Button
              variant="primary"
              onClick={handleSubmitApplication}
              loading={applying}
            >
              応募する
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
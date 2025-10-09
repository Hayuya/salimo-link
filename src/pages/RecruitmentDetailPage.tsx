import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/auth';
import { useRecruitments } from '@/recruitment';
import { useApplications } from '@/hooks/useApplications';
import { RecruitmentSlotWithSalon } from '@/types';
import { formatDate, isDeadlinePassed } from '@/utils/date';
import { isValidInstagramUrl } from '@/utils/validators';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
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
  const [instagramUrl, setInstagramUrl] = useState('');
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState<{ instagramUrl?: string; general?: string }>({});
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

    // プロフィールからInstagram URLを初期値として設定
    if (user.profile.instagram_url) {
      setInstagramUrl(user.profile.instagram_url);
    }

    setShowModal(true);
  };

  const validateForm = () => {
    const newErrors: { instagramUrl?: string } = {};

    if (!instagramUrl) {
      newErrors.instagramUrl = 'Instagram URLを入力してください';
    } else if (!isValidInstagramUrl(instagramUrl)) {
      newErrors.instagramUrl = '有効なInstagram URLを入力してください（例: https://instagram.com/username）';
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
        instagram_url: instagramUrl,
        message: message || undefined,
        status: 'pending',
      });

      alert('応募が完了しました！');
      setShowModal(false);
      setHasApplied(true);
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

          {recruitment.requirements && (
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>応募条件</h3>
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
        title="応募情報を入力"
        size="md"
      >
        <div className={styles.modalContent}>
          <Input
            label="Instagram プロフィールURL"
            type="url"
            value={instagramUrl}
            onChange={(e) => setInstagramUrl(e.target.value)}
            error={errors.instagramUrl}
            placeholder="https://instagram.com/username"
            required
            fullWidth
          />

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
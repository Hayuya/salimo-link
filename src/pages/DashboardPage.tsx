import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/auth';
import { useApplications } from '@/hooks/useApplications';
import { useRecruitments } from '@/recruitment';
import { ApplicationWithDetails, RecruitmentSlot, Student, Salon } from '@/types';
import { formatDate, formatDateTime } from '@/utils/date';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { Modal } from '@/components/Modal';
import { Input } from '@/components/Input';
import { Spinner } from '@/components/Spinner';
import styles from './DashboardPage.module.css';

export const DashboardPage = () => {
  const { user, updateProfile } = useAuth();
  const { fetchApplicationsByStudent } = useApplications();
  const { fetchRecruitmentsBySalonId, createRecruitment } = useRecruitments();

  const [applications, setApplications] = useState<ApplicationWithDetails[]>([]);
  const [recruitments, setRecruitments] = useState<RecruitmentSlot[]>([]);
  const [loading, setLoading] = useState(true);

  // プロフィール編集モーダル
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileData, setProfileData] = useState<any>({});
  const [profileLoading, setProfileLoading] = useState(false);

  // 募集作成モーダル（サロン用）
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [recruitmentData, setRecruitmentData] = useState({
    title: '',
    description: '',
    requirements: '',
    deadline_date: '',
  });
  const [createLoading, setCreateLoading] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  const loadDashboardData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      if (user.userType === 'student') {
        const apps = await fetchApplicationsByStudent(user.id);
        setApplications(apps);
      } else {
        const recs = await fetchRecruitmentsBySalonId(user.id);
        setRecruitments(recs);
      }
    } catch (error) {
      console.error('データ読み込みエラー:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenProfileModal = () => {
    setProfileData(user?.profile || {});
    setShowProfileModal(true);
  };

  const handleUpdateProfile = async () => {
    try {
      setProfileLoading(true);
      await updateProfile(profileData);
      alert('プロフィールを更新しました');
      setShowProfileModal(false);
    } catch (error: any) {
      alert(error.message || 'プロフィール更新に失敗しました');
    } finally {
      setProfileLoading(false);
    }
  };

  const handleCreateRecruitment = async () => {
    if (!user) return;

    try {
      setCreateLoading(true);
      await createRecruitment({
        salon_id: user.id,
        ...recruitmentData,
        status: 'active',
      });
      alert('募集を作成しました');
      setShowCreateModal(false);
      setRecruitmentData({
        title: '',
        description: '',
        requirements: '',
        deadline_date: '',
      });
      await loadDashboardData();
    } catch (error: any) {
      alert(error.message || '募集作成に失敗しました');
    } finally {
      setCreateLoading(false);
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending':
        return { text: '選考中', className: styles.statusPending };
      case 'accepted':
        return { text: '採用', className: styles.statusAccepted };
      case 'rejected':
        return { text: '不採用', className: styles.statusRejected };
      case 'withdrawn':
        return { text: '辞退', className: styles.statusWithdrawn };
      default:
        return { text: status, className: '' };
    }
  };

  if (loading) {
    return <Spinner fullScreen />;
  }

  if (!user) {
    return null;
  }

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        {/* ヘッダー */}
        <div className={styles.header}>
          <h1 className={styles.title}>マイページ</h1>
          <Button variant="outline" onClick={handleOpenProfileModal}>
            プロフィール編集
          </Button>
        </div>

        {/* プロフィール情報 */}
        <Card padding="lg">
          <h2 className={styles.sectionTitle}>プロフィール</h2>
          {user.userType === 'student' ? (
            <div className={styles.profileInfo}>
              <p><strong>名前:</strong> {(user.profile as Student).name}</p>
              <p><strong>学校名:</strong> {(user.profile as Student).school_name || '未設定'}</p>
              <p><strong>メールアドレス:</strong> {user.email}</p>
              <p><strong>Instagram:</strong> {(user.profile as Student).instagram_url || '未設定'}</p>
            </div>
          ) : (
            <div className={styles.profileInfo}>
              <p><strong>サロン名:</strong> {(user.profile as Salon).salon_name}</p>
              <p><strong>住所:</strong> {(user.profile as Salon).address || '未設定'}</p>
              <p><strong>メールアドレス:</strong> {user.email}</p>
              <p><strong>電話番号:</strong> {(user.profile as Salon).phone_number || '未設定'}</p>
            </div>
          )}
        </Card>

        {/* 学生用: 応募一覧 */}
        {user.userType === 'student' && (
          <Card padding="lg">
            <h2 className={styles.sectionTitle}>応募履歴</h2>
            {applications.length === 0 ? (
              <p className={styles.emptyMessage}>まだ応募していません</p>
            ) : (
              <div className={styles.applicationList}>
                {applications.map((app) => (
                  <div key={app.id} className={styles.applicationItem}>
                    <div className={styles.applicationHeader}>
                      <Link
                        to={`/recruitment/${app.recruitment_slot_id}`}
                        className={styles.applicationTitle}
                      >
                        {app.recruitment_slot.title}
                      </Link>
                      <span className={getStatusLabel(app.status).className}>
                        {getStatusLabel(app.status).text}
                      </span>
                    </div>
                    <p className={styles.applicationSalon}>
                      {app.recruitment_slot.salon.salon_name}
                    </p>
                    <p className={styles.applicationDate}>
                      応募日: {formatDateTime(app.created_at)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}

        {/* サロン用: 募集一覧 */}
        {user.userType === 'salon' && (
          <Card padding="lg">
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>募集一覧</h2>
              <Button variant="primary" onClick={() => setShowCreateModal(true)}>
                新規募集作成
              </Button>
            </div>
            {recruitments.length === 0 ? (
              <p className={styles.emptyMessage}>まだ募集を作成していません</p>
            ) : (
              <div className={styles.recruitmentList}>
                {recruitments.map((rec) => (
                  <div key={rec.id} className={styles.recruitmentItem}>
                    <div className={styles.recruitmentHeader}>
                      <Link
                        to={`/recruitment/${rec.id}`}
                        className={styles.recruitmentTitle}
                      >
                        {rec.title}
                      </Link>
                      <span className={rec.status === 'active' ? styles.statusActive : styles.statusClosed}>
                        {rec.status === 'active' ? '募集中' : '募集終了'}
                      </span>
                    </div>
                    <p className={styles.recruitmentDate}>
                      締切: {formatDate(rec.deadline_date)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}
      </div>

      {/* プロフィール編集モーダル */}
      <Modal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        title="プロフィール編集"
        size="md"
      >
        <div className={styles.modalContent}>
          {user.userType === 'student' ? (
            <>
              <Input
                label="名前"
                value={profileData.name || ''}
                onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                fullWidth
              />
              <Input
                label="学校名"
                value={profileData.school_name || ''}
                onChange={(e) => setProfileData({ ...profileData, school_name: e.target.value })}
                fullWidth
              />
              <Input
                label="Instagram URL"
                type="url"
                value={profileData.instagram_url || ''}
                onChange={(e) => setProfileData({ ...profileData, instagram_url: e.target.value })}
                placeholder="https://instagram.com/username"
                fullWidth
              />
            </>
          ) : (
            <>
              <Input
                label="サロン名"
                value={profileData.salon_name || ''}
                onChange={(e) => setProfileData({ ...profileData, salon_name: e.target.value })}
                fullWidth
              />
              <Input
                label="住所"
                value={profileData.address || ''}
                onChange={(e) => setProfileData({ ...profileData, address: e.target.value })}
                fullWidth
              />
              <Input
                label="電話番号"
                value={profileData.phone_number || ''}
                onChange={(e) => setProfileData({ ...profileData, phone_number: e.target.value })}
                fullWidth
              />
              <div className={styles.inputWrapper}>
                <label className={styles.label}>サロン紹介</label>
                <textarea
                  className={styles.textarea}
                  value={profileData.description || ''}
                  onChange={(e) => setProfileData({ ...profileData, description: e.target.value })}
                  rows={4}
                />
              </div>
            </>
          )}
          <div className={styles.modalActions}>
            <Button variant="outline" onClick={() => setShowProfileModal(false)}>
              キャンセル
            </Button>
            <Button variant="primary" onClick={handleUpdateProfile} loading={profileLoading}>
              保存
            </Button>
          </div>
        </div>
      </Modal>

      {/* 募集作成モーダル（サロン用） */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="新規募集作成"
        size="md"
      >
        <div className={styles.modalContent}>
          <Input
            label="募集タイトル"
            value={recruitmentData.title}
            onChange={(e) => setRecruitmentData({ ...recruitmentData, title: e.target.value })}
            required
            fullWidth
          />
          <div className={styles.inputWrapper}>
            <label className={styles.label}>募集内容</label>
            <textarea
              className={styles.textarea}
              value={recruitmentData.description}
              onChange={(e) => setRecruitmentData({ ...recruitmentData, description: e.target.value })}
              rows={4}
            />
          </div>
          <div className={styles.inputWrapper}>
            <label className={styles.label}>応募条件</label>
            <textarea
              className={styles.textarea}
              value={recruitmentData.requirements}
              onChange={(e) => setRecruitmentData({ ...recruitmentData, requirements: e.target.value })}
              rows={3}
            />
          </div>
          <Input
            label="募集締切日"
            type="date"
            value={recruitmentData.deadline_date}
            onChange={(e) => setRecruitmentData({ ...recruitmentData, deadline_date: e.target.value })}
            required
            fullWidth
          />
          <div className={styles.modalActions}>
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>
              キャンセル
            </Button>
            <Button variant="primary" onClick={handleCreateRecruitment} loading={createLoading}>
              作成
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
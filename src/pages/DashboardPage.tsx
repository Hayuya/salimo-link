// src/pages/DashboardPage.tsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/auth';
import { useApplications } from '@/hooks/useApplications';
import { useRecruitments } from '@/recruitment';
import { 
  ApplicationWithDetails, 
  RecruitmentSlot, 
  Student, 
  Salon, 
  MenuType, 
  GenderRequirement, 
  HairLengthRequirement, 
  PhotoShootRequirement, 
  ModelExperienceRequirement 
} from '@/types';
import { formatDate, formatDateTime } from '@/utils/date';
import { 
  MENU_OPTIONS, 
  MENU_LABELS, 
  GENDER_OPTIONS, 
  GENDER_LABELS, 
  HAIR_LENGTH_OPTIONS, 
  HAIR_LENGTH_LABELS,
  PHOTO_SHOOT_OPTIONS,
  PHOTO_SHOOT_LABELS,
  EXPERIENCE_OPTIONS,
  EXPERIENCE_LABELS
} from '@/utils/recruitment';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { Modal } from '@/components/Modal';
import { Input } from '@/components/Input';
import { Spinner } from '@/components/Spinner';
import styles from './DashboardPage.module.css';

const initialRecruitmentState = {
  title: '',
  description: '',
  menus: [] as MenuType[],
  gender_requirement: 'any' as GenderRequirement,
  hair_length_requirement: 'any' as HairLengthRequirement,
  has_date_requirement: false,
  appointment_date: '',
  treatment_duration: '',
  deadline_date: '',
  photo_shoot_requirement: 'none' as PhotoShootRequirement,
  model_experience_requirement: 'any' as ModelExperienceRequirement,
  has_reward: false,
  reward_details: '',
};

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
  const [recruitmentData, setRecruitmentData] = useState(initialRecruitmentState);
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
        ...recruitmentData,
        salon_id: user.id,
        appointment_date: recruitmentData.has_date_requirement ? recruitmentData.appointment_date : undefined,
        treatment_duration: recruitmentData.treatment_duration || undefined,
        reward_details: recruitmentData.has_reward ? recruitmentData.reward_details : undefined,
        status: 'active',
      });
      alert('募集を作成しました');
      setShowCreateModal(false);
      setRecruitmentData(initialRecruitmentState);
      await loadDashboardData();
    } catch (error: any) {
      alert(error.message || '募集作成に失敗しました');
    } finally {
      setCreateLoading(false);
    }
  };

  const toggleMenu = (menu: MenuType) => {
    setRecruitmentData(prev => ({
      ...prev,
      menus: prev.menus.includes(menu)
        ? prev.menus.filter(m => m !== menu)
        : [...prev.menus, menu]
    }));
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
          <div className={styles.headerActions}>
            <Link to="/">
              <Button variant="secondary">募集一覧へ</Button>
            </Link>
            <Button variant="outline" onClick={handleOpenProfileModal}>
              プロフィール編集
            </Button>
          </div>
        </div>

        {/* プロフィール情報 */}
        <Card padding="lg">
          <h2 className={styles.sectionTitle}>プロフィール</h2>
          {user.userType === 'student' ? (
            <div className={styles.profileInfo}>
              <p><strong>名前:</strong> {(user.profile as Student).name}</p>
              <p><strong>学校名:</strong> {(user.profile as Student).school_name || '未設定'}</p>
              <p><strong>メールアドレス:</strong> {user.email}</p>
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
        size="lg"
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
              placeholder="詳しい募集内容を入力してください"
              rows={4}
            />
          </div>

          <div className={styles.inputWrapper}>
            <label className={styles.label}>メニュー（複数選択可）<span className={styles.required}>*</span></label>
            <div className={styles.checkboxGrid}>
              {MENU_OPTIONS.map(menu => (
                <label key={menu} className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={recruitmentData.menus.includes(menu)}
                    onChange={() => toggleMenu(menu)}
                  />
                  <span>{MENU_LABELS[menu]}</span>
                </label>
              ))}
            </div>
          </div>

          <div className={styles.inputWrapper}>
            <label className={styles.label}>性別</label>
            <div className={styles.radioGroup}>
              {GENDER_OPTIONS.map(gender => (
                <label key={gender} className={styles.radioLabel}>
                  <input
                    type="radio"
                    name="gender"
                    value={gender}
                    checked={recruitmentData.gender_requirement === gender}
                    onChange={(e) => setRecruitmentData({ ...recruitmentData, gender_requirement: e.target.value as GenderRequirement })}
                  />
                  <span>{GENDER_LABELS[gender]}</span>
                </label>
              ))}
            </div>
          </div>

          <div className={styles.inputWrapper}>
            <label className={styles.label}>髪の長さ</label>
            <div className={styles.radioGroup}>
              {HAIR_LENGTH_OPTIONS.map(length => (
                <label key={length} className={styles.radioLabel}>
                  <input
                    type="radio"
                    name="hairLength"
                    value={length}
                    checked={recruitmentData.hair_length_requirement === length}
                    onChange={(e) => setRecruitmentData({ ...recruitmentData, hair_length_requirement: e.target.value as HairLengthRequirement })}
                  />
                  <span>{HAIR_LENGTH_LABELS[length]}</span>
                </label>
              ))}
            </div>
          </div>
          
          <div className={styles.inputWrapper}>
            <label className={styles.label}>モデル経験</label>
            <div className={styles.radioGroup}>
              {EXPERIENCE_OPTIONS.map(exp => (
                <label key={exp} className={styles.radioLabel}>
                  <input
                    type="radio"
                    name="experience"
                    value={exp}
                    checked={recruitmentData.model_experience_requirement === exp}
                    onChange={(e) => setRecruitmentData({ ...recruitmentData, model_experience_requirement: e.target.value as ModelExperienceRequirement })}
                  />
                  <span>{EXPERIENCE_LABELS[exp]}</span>
                </label>
              ))}
            </div>
          </div>

          <div className={styles.inputWrapper}>
            <label className={styles.label}>撮影</label>
            <div className={styles.radioGroup}>
              {PHOTO_SHOOT_OPTIONS.map(photo => (
                <label key={photo} className={styles.radioLabel}>
                  <input
                    type="radio"
                    name="photoShoot"
                    value={photo}
                    checked={recruitmentData.photo_shoot_requirement === photo}
                    onChange={(e) => setRecruitmentData({ ...recruitmentData, photo_shoot_requirement: e.target.value as PhotoShootRequirement })}
                  />
                  <span>{PHOTO_SHOOT_LABELS[photo]}</span>
                </label>
              ))}
            </div>
          </div>
          
          <div className={styles.inputWrapper}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={recruitmentData.has_reward}
                onChange={(e) => setRecruitmentData({ ...recruitmentData, has_reward: e.target.checked })}
              />
              <span>謝礼あり</span>
            </label>
          </div>

          {recruitmentData.has_reward && (
            <Input
              label="謝礼詳細（任意）"
              value={recruitmentData.reward_details}
              onChange={(e) => setRecruitmentData({ ...recruitmentData, reward_details: e.target.value })}
              placeholder="例: 交通費支給、トリートメントサービスなど"
              fullWidth
            />
          )}

          <div className={styles.inputWrapper}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={recruitmentData.has_date_requirement}
                onChange={(e) => setRecruitmentData({ ...recruitmentData, has_date_requirement: e.target.checked })}
              />
              <span>日時の指定あり</span>
            </label>
          </div>

          {recruitmentData.has_date_requirement && (
            <Input
              label="施術日時"
              type="datetime-local"
              value={recruitmentData.appointment_date}
              onChange={(e) => setRecruitmentData({ ...recruitmentData, appointment_date: e.target.value })}
              required
              fullWidth
            />
          )}

          <Input
            label="施術時間（任意）"
            type="text"
            value={recruitmentData.treatment_duration}
            onChange={(e) => setRecruitmentData({ ...recruitmentData, treatment_duration: e.target.value })}
            placeholder="例: 2〜3時間"
            fullWidth
          />

          <Input
            label="募集締切日"
            type="date"
            value={recruitmentData.deadline_date}
            onChange={(e) => setRecruitmentData({ ...recruitmentData, deadline_date: e.target.value })}
            required
            fullWidth
          />
          <p className={styles.note}>※予告なく締め切る場合もございますので予めご了承ください</p>

          <div className={styles.modalActions}>
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>
              キャンセル
            </Button>
            <Button 
              variant="primary" 
              onClick={handleCreateRecruitment} 
              loading={createLoading}
              disabled={recruitmentData.menus.length === 0 || !recruitmentData.title || !recruitmentData.deadline_date}
            >
              作成
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
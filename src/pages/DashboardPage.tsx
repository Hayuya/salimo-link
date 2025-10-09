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
  ModelExperienceRequirement,
  RecruitmentSlotUpdate
} from '@/types';
import { formatDate, formatDateTime, formatDateForInput, formatDateTimeForInput } from '@/utils/date';
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
  const { 
    fetchRecruitmentsBySalonId, 
    createRecruitment,
    updateRecruitment,
    deleteRecruitment
  } = useRecruitments();

  const [applications, setApplications] = useState<ApplicationWithDetails[]>([]);
  const [recruitments, setRecruitments] = useState<RecruitmentSlot[]>([]);
  const [loading, setLoading] = useState(true);

  // モーダル関連
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  
  // データ関連
  const [profileData, setProfileData] = useState<any>({});
  const [newRecruitmentData, setNewRecruitmentData] = useState(initialRecruitmentState);
  const [editingRecruitment, setEditingRecruitment] = useState<RecruitmentSlot & { id: string } | null>(null);

  // ローディング状態
  const [profileLoading, setProfileLoading] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [editLoading, setEditLoading] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  const loadDashboardData = async () => {
    if (!user) return;
    setLoading(true);
    try {
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

  const handleUpdateProfile = async () => {
    setProfileLoading(true);
    try {
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
    setCreateLoading(true);
    try {
      await createRecruitment({
        salon_id: user.id,
        title: newRecruitmentData.title,
        description: newRecruitmentData.description,
        menus: newRecruitmentData.menus,
        gender_requirement: newRecruitmentData.gender_requirement,
        hair_length_requirement: newRecruitmentData.hair_length_requirement,
        has_date_requirement: newRecruitmentData.has_date_requirement,
        appointment_date: newRecruitmentData.has_date_requirement ? newRecruitmentData.appointment_date : undefined,
        treatment_duration: newRecruitmentData.treatment_duration || undefined,
        deadline_date: newRecruitmentData.deadline_date,
        status: 'active',
        photo_shoot_requirement: newRecruitmentData.photo_shoot_requirement,
        model_experience_requirement: newRecruitmentData.model_experience_requirement,
        has_reward: newRecruitmentData.has_reward,
        reward_details: newRecruitmentData.has_reward ? newRecruitmentData.reward_details : undefined,
      });
      alert('募集を作成しました');
      setShowCreateModal(false);
      setNewRecruitmentData(initialRecruitmentState);
      await loadDashboardData();
    } catch (error: any) {
      alert(error.message || '募集作成に失敗しました');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleUpdateRecruitment = async () => {
    if (!editingRecruitment) return;
    setEditLoading(true);
    try {
      const { id, created_at, updated_at, ...updateData } = editingRecruitment;
      await updateRecruitment(id, updateData as RecruitmentSlotUpdate);
      alert('募集を更新しました');
      setShowEditModal(false);
      setEditingRecruitment(null);
      await loadDashboardData();
    } catch (error: any) {
      alert(error.message || '募集更新に失敗しました');
    } finally {
      setEditLoading(false);
    }
  };

  const handleCloseRecruitment = async (id: string) => {
    if (window.confirm('この募集を締め切りますか？')) {
      try {
        await updateRecruitment(id, { status: 'closed' });
        alert('募集を締め切りました');
        await loadDashboardData();
      } catch (error: any) {
        alert(error.message || '募集の締め切りに失敗しました');
      }
    }
  };

  const handleDeleteRecruitment = async (id: string) => {
    if (window.confirm('この募集を完全に削除しますか？この操作は元に戻せません。')) {
      try {
        await deleteRecruitment(id);
        alert('募集を削除しました');
        await loadDashboardData();
      } catch (error: any) {
        alert(error.message || '募集の削除に失敗しました');
      }
    }
  };

  const handleOpenEditModal = (recruitment: RecruitmentSlot) => {
    setEditingRecruitment({
        ...recruitment,
        deadline_date: formatDateForInput(recruitment.deadline_date),
        appointment_date: formatDateTimeForInput(recruitment.appointment_date),
    });
    setShowEditModal(true);
  };
  
  const toggleMenu = (menu: MenuType, isEdit = false) => {
    if (isEdit) {
      setEditingRecruitment(prev => {
        if (!prev) return null;
        const menus = prev.menus?.includes(menu)
          ? prev.menus.filter(m => m !== menu)
          : [...(prev.menus || []), menu];
        return { ...prev, menus };
      });
    } else {
      setNewRecruitmentData(prev => ({
        ...prev,
        menus: prev.menus.includes(menu)
          ? prev.menus.filter(m => m !== menu)
          : [...prev.menus, menu]
      }));
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return { text: '選考中', className: styles.statusPending };
      case 'accepted': return { text: '採用', className: styles.statusAccepted };
      case 'rejected': return { text: '不採用', className: styles.statusRejected };
      case 'withdrawn': return { text: '辞退', className: styles.statusWithdrawn };
      default: return { text: status, className: '' };
    }
  };

  if (loading) return <Spinner fullScreen />;
  if (!user) return null;

  const renderRecruitmentForm = (
    data: typeof newRecruitmentData | typeof editingRecruitment, 
    setter: typeof setNewRecruitmentData | typeof setEditingRecruitment,
    isEdit: boolean
  ) => (
    <div className={styles.modalContent}>
      <Input label="募集タイトル" value={data?.title || ''} onChange={(e) => setter({ ...data, title: e.target.value } as any)} required fullWidth/>
      <div className={styles.inputWrapper}>
        <label className={styles.label}>募集内容</label>
        <textarea className={styles.textarea} value={data?.description || ''} onChange={(e) => setter({ ...data, description: e.target.value } as any)} placeholder="詳しい募集内容を入力してください" rows={4}/>
      </div>
      <div className={styles.inputWrapper}>
        <label className={styles.label}>メニュー（複数選択可）<span className={styles.required}>*</span></label>
        <div className={styles.checkboxGrid}>
          {MENU_OPTIONS.map(menu => ( <label key={menu} className={styles.checkboxLabel}> <input type="checkbox" checked={data?.menus.includes(menu)} onChange={() => toggleMenu(menu, isEdit)}/> <span>{MENU_LABELS[menu]}</span> </label> ))}
        </div>
      </div>
      <div className={styles.inputWrapper}>
        <label className={styles.label}>性別</label>
        <div className={styles.radioGroup}>
          {GENDER_OPTIONS.map(gender => ( <label key={gender} className={styles.radioLabel}> <input type="radio" name={`gender_${isEdit}`} value={gender} checked={data?.gender_requirement === gender} onChange={(e) => setter({...data, gender_requirement: e.target.value as GenderRequirement} as any)}/> <span>{GENDER_LABELS[gender]}</span> </label> ))}
        </div>
      </div>
      <div className={styles.inputWrapper}>
        <label className={styles.label}>髪の長さ</label>
        <div className={styles.radioGroup}>
          {HAIR_LENGTH_OPTIONS.map(length => ( <label key={length} className={styles.radioLabel}> <input type="radio" name={`hairLength_${isEdit}`} value={length} checked={data?.hair_length_requirement === length} onChange={(e) => setter({...data, hair_length_requirement: e.target.value as HairLengthRequirement} as any)}/> <span>{HAIR_LENGTH_LABELS[length]}</span> </label> ))}
        </div>
      </div>
      <div className={styles.inputWrapper}>
        <label className={styles.label}>モデル経験</label>
        <div className={styles.radioGroup}>
          {EXPERIENCE_OPTIONS.map(exp => ( <label key={exp} className={styles.radioLabel}> <input type="radio" name={`experience_${isEdit}`} value={exp} checked={data?.model_experience_requirement === exp} onChange={(e) => setter({...data, model_experience_requirement: e.target.value as ModelExperienceRequirement} as any)}/> <span>{EXPERIENCE_LABELS[exp]}</span> </label> ))}
        </div>
      </div>
      <div className={styles.inputWrapper}>
        <label className={styles.label}>撮影</label>
        <div className={styles.radioGroup}>
          {PHOTO_SHOOT_OPTIONS.map(photo => ( <label key={photo} className={styles.radioLabel}> <input type="radio" name={`photoShoot_${isEdit}`} value={photo} checked={data?.photo_shoot_requirement === photo} onChange={(e) => setter({...data, photo_shoot_requirement: e.target.value as PhotoShootRequirement} as any)}/> <span>{PHOTO_SHOOT_LABELS[photo]}</span> </label> ))}
        </div>
      </div>
      <div className={styles.inputWrapper}>
        <label className={styles.checkboxLabel}>
          <input type="checkbox" checked={data?.has_reward} onChange={(e) => setter({ ...data, has_reward: e.target.checked } as any)}/>
          <span>謝礼あり</span>
        </label>
      </div>
      {data?.has_reward && ( <Input label="謝礼詳細（任意）" value={data.reward_details || ''} onChange={(e) => setter({ ...data, reward_details: e.target.value } as any)} placeholder="例: 交通費支給、トリートメントサービスなど" fullWidth/> )}
      <div className={styles.inputWrapper}>
        <label className={styles.checkboxLabel}>
          <input type="checkbox" checked={data?.has_date_requirement} onChange={(e) => setter({ ...data, has_date_requirement: e.target.checked } as any)}/>
          <span>日時の指定あり</span>
        </label>
      </div>
      {data?.has_date_requirement && ( <Input label="施術日時" type="datetime-local" value={data.appointment_date || ''} onChange={(e) => setter({ ...data, appointment_date: e.target.value } as any)} required fullWidth/> )}
      <Input label="施術時間（任意）" type="text" value={data?.treatment_duration || ''} onChange={(e) => setter({ ...data, treatment_duration: e.target.value } as any)} placeholder="例: 2〜3時間" fullWidth/>
      <Input label="募集締切日" type="date" value={data?.deadline_date || ''} onChange={(e) => setter({ ...data, deadline_date: e.target.value } as any)} required fullWidth/>
      <p className={styles.note}>※予告なく締め切る場合もございますので予めご了承ください</p>
    </div>
  );

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.header}>
          <h1 className={styles.title}>マイページ</h1>
          <div className={styles.headerActions}>
            <Link to="/"><Button variant="secondary">募集一覧へ</Button></Link>
            <Button variant="outline" onClick={() => { setProfileData(user.profile); setShowProfileModal(true); }}>
              プロフィール編集
            </Button>
          </div>
        </div>
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
                      <Link to={`/recruitment/${app.recruitment_slot_id}`} className={styles.applicationTitle}>{app.recruitment_slot.title}</Link>
                      <span className={getStatusLabel(app.status).className}>{getStatusLabel(app.status).text}</span>
                    </div>
                    <p className={styles.applicationSalon}>{app.recruitment_slot.salon.salon_name}</p>
                    <p className={styles.applicationDate}>応募日: {formatDateTime(app.created_at)}</p>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}
        {user.userType === 'salon' && (
          <Card padding="lg">
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>募集一覧</h2>
              <Button variant="primary" onClick={() => setShowCreateModal(true)}>新規募集作成</Button>
            </div>
            {recruitments.length === 0 ? (
              <p className={styles.emptyMessage}>まだ募集を作成していません</p>
            ) : (
              <div className={styles.recruitmentList}>
                {recruitments.map((rec) => (
                  <div key={rec.id} className={styles.recruitmentItem}>
                    <div className={styles.recruitmentHeader}>
                      <Link to={`/recruitment/${rec.id}`} className={styles.recruitmentTitle}>{rec.title}</Link>
                      <span className={rec.status === 'active' ? styles.statusActive : styles.statusClosed}>
                        {rec.status === 'active' ? '募集中' : '募集終了'}
                      </span>
                    </div>
                    <p className={styles.recruitmentDate}>締切: {formatDate(rec.deadline_date)}</p>
                    <div className={styles.recruitmentActions}>
                        <Button variant="outline" size="sm" onClick={() => handleOpenEditModal(rec)}>編集</Button>
                        {rec.status === 'active' && (
                          <Button variant="outline" size="sm" onClick={() => handleCloseRecruitment(rec.id)}>締め切る</Button>
                        )}
                        <Button variant="danger" size="sm" onClick={() => handleDeleteRecruitment(rec.id)}>削除</Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}
      </div>
      <Modal isOpen={showProfileModal} onClose={() => setShowProfileModal(false)} title="プロフィール編集" size="md">
        <div className={styles.modalContent}>
          {user.userType === 'student' ? (
            <>
              <Input label="名前" value={profileData.name || ''} onChange={(e) => setProfileData({ ...profileData, name: e.target.value })} fullWidth/>
              <Input label="学校名" value={profileData.school_name || ''} onChange={(e) => setProfileData({ ...profileData, school_name: e.target.value })} fullWidth/>
            </>
          ) : (
            <>
              <Input label="サロン名" value={profileData.salon_name || ''} onChange={(e) => setProfileData({ ...profileData, salon_name: e.target.value })} fullWidth/>
              <Input label="住所" value={profileData.address || ''} onChange={(e) => setProfileData({ ...profileData, address: e.target.value })} fullWidth/>
              <Input label="電話番号" value={profileData.phone_number || ''} onChange={(e) => setProfileData({ ...profileData, phone_number: e.target.value })} fullWidth/>
              <div className={styles.inputWrapper}>
                <label className={styles.label}>サロン紹介</label>
                <textarea className={styles.textarea} value={profileData.description || ''} onChange={(e) => setProfileData({ ...profileData, description: e.target.value })} rows={4}/>
              </div>
            </>
          )}
          <div className={styles.modalActions}>
            <Button variant="outline" onClick={() => setShowProfileModal(false)}>キャンセル</Button>
            <Button variant="primary" onClick={handleUpdateProfile} loading={profileLoading}>保存</Button>
          </div>
        </div>
      </Modal>
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="新規募集作成" size="lg">
        {renderRecruitmentForm(newRecruitmentData, setNewRecruitmentData, false)}
        <div className={styles.modalActions}>
          <Button variant="outline" onClick={() => setShowCreateModal(false)}>キャンセル</Button>
          <Button variant="primary" onClick={handleCreateRecruitment} loading={createLoading} disabled={newRecruitmentData.menus.length === 0 || !newRecruitmentData.title || !newRecruitmentData.deadline_date}>作成</Button>
        </div>
      </Modal>
      {editingRecruitment && (
        <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="募集内容を編集" size="lg">
          {renderRecruitmentForm(editingRecruitment, setEditingRecruitment as any, true)}
          <div className={styles.modalActions}>
            <Button variant="outline" onClick={() => setShowEditModal(false)}>キャンセル</Button>
            <Button variant="primary" onClick={handleUpdateRecruitment} loading={editLoading}>更新</Button>
          </div>
        </Modal>
      )}
    </div>
  );
};
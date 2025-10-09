import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/auth';
import { useReservations } from '@/hooks/useReservations';
import { useRecruitments } from '@/recruitment';
import {
  Recruitment,
  Student,
  Salon,
  MenuType,
  GenderRequirement,
  HairLengthRequirement,
  PhotoShootRequirement,
  ModelExperienceRequirement,
  RecruitmentUpdate,
  ReservationWithDetails,
  ReservationStatus,
  AvailableDate,
} from '@/types';
import { formatDateTime } from '@/utils/date';
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
  treatment_duration: '',
  status: 'active' as const,
  photo_shoot_requirement: 'none' as PhotoShootRequirement,
  model_experience_requirement: 'any' as ModelExperienceRequirement,
  has_reward: false,
  reward_details: '',
  available_dates: [] as AvailableDate[],
};

export const DashboardPage = () => {
  const { user, updateProfile } = useAuth();
  const { fetchReservationsByStudent, fetchReservationsBySalon, updateReservationStatus } = useReservations();
  const {
    fetchRecruitmentsBySalonId,
    createRecruitment,
    updateRecruitment,
    deleteRecruitment
  } = useRecruitments();

  const [reservations, setReservations] = useState<ReservationWithDetails[]>([]);
  const [recruitments, setRecruitments] = useState<Recruitment[]>([]);
  const [loading, setLoading] = useState(true);

  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  const [profileData, setProfileData] = useState<Partial<Student & Salon>>({});
  const [newRecruitmentData, setNewRecruitmentData] = useState(initialRecruitmentState);
  const [editingRecruitment, setEditingRecruitment] = useState<(RecruitmentUpdate & { id: string }) | null>(null);

  const [profileLoading, setProfileLoading] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [editLoading, setEditLoading] = useState(false);

  // 新規作成用の日時入力
  const [newSlotDate, setNewSlotDate] = useState('');
  const [newSlotTime, setNewSlotTime] = useState('');

  // 編集用の日時入力
  const [editSlotDate, setEditSlotDate] = useState('');
  const [editSlotTime, setEditSlotTime] = useState('');

  const loadDashboardData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      if (user.userType === 'student') {
        const res = await fetchReservationsByStudent(user.id);
        setReservations(res);
      } else {
        const [recs, res] = await Promise.all([
          fetchRecruitmentsBySalonId(user.id),
          fetchReservationsBySalon(user.id)
        ]);
        setRecruitments(recs);
        setReservations(res);
      }
    } catch (error) {
      console.error('データ読み込みエラー:', error);
      alert('データの読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  }, [user, fetchReservationsByStudent, fetchReservationsBySalon, fetchRecruitmentsBySalonId]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

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

  // JSTとして扱う日時作成関数
  const createJSTDateTime = (date: string, time: string): string => {
    // ISO 8601形式でJST（+09:00）を明示
    return `${date}T${time}:00+09:00`;
  };

  // 新規作成時の日時追加
  const addSlot = () => {
    if (!newSlotDate || !newSlotTime) {
      alert('日付と時刻を選択してください');
      return;
    }
    
    const jstDatetime = createJSTDateTime(newSlotDate, newSlotTime);
    const datetime = new Date(jstDatetime).toISOString();
    
    // 重複チェック
    if (newRecruitmentData.available_dates.some(d => d.datetime === datetime)) {
      alert('同じ日時がすでに追加されています');
      return;
    }
    
    const newDate: AvailableDate = {
      datetime,
      is_booked: false
    };
    
    setNewRecruitmentData({
      ...newRecruitmentData,
      available_dates: [...newRecruitmentData.available_dates, newDate].sort(
        (a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime()
      )
    });
    
    // 入力フィールドをクリア
    setNewSlotDate('');
    setNewSlotTime('');
  };

  const removeSlot = (datetime: string) => {
    setNewRecruitmentData({
      ...newRecruitmentData,
      available_dates: newRecruitmentData.available_dates.filter(d => d.datetime !== datetime)
    });
  };

  // 編集時の日時追加
  const addEditSlot = () => {
    if (!editSlotDate || !editSlotTime || !editingRecruitment) {
      alert('日付と時刻を選択してください');
      return;
    }
    
    const jstDatetime = createJSTDateTime(editSlotDate, editSlotTime);
    const datetime = new Date(jstDatetime).toISOString();
    
    // 重複チェック
    if (editingRecruitment.available_dates?.some(d => d.datetime === datetime)) {
      alert('同じ日時がすでに追加されています');
      return;
    }
    
    const newDate: AvailableDate = {
      datetime,
      is_booked: false
    };
    
    const updatedDates = [...(editingRecruitment.available_dates || []), newDate].sort(
      (a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime()
    );
    
    setEditingRecruitment({
      ...editingRecruitment,
      available_dates: updatedDates
    });
    
    // 入力フィールドをクリア
    setEditSlotDate('');
    setEditSlotTime('');
  };

  const removeEditSlot = (datetime: string) => {
    if (!editingRecruitment) return;
    
    setEditingRecruitment({
      ...editingRecruitment,
      available_dates: editingRecruitment.available_dates?.filter(d => d.datetime !== datetime)
    });
  };

  const handleCreateRecruitment = async () => {
    if (!user) return;
    
    if (newRecruitmentData.menus.length === 0) {
      alert('メニューを1つ以上選択してください');
      return;
    }
    
    if (!newRecruitmentData.title) {
      alert('タイトルを入力してください');
      return;
    }
    
    if (newRecruitmentData.available_dates.length === 0) {
      alert('施術可能な日時を1つ以上追加してください');
      return;
    }
    
    setCreateLoading(true);
    try {
      await createRecruitment({
        ...newRecruitmentData,
        salon_id: user.id,
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
    
    // バリデーション
    if (!editingRecruitment.title) {
      alert('タイトルを入力してください');
      return;
    }
    
    if (!editingRecruitment.menus || editingRecruitment.menus.length === 0) {
      alert('メニューを1つ以上選択してください');
      return;
    }
    
    // 予約済みの日時が削除されていないかチェック
    const originalRecruitment = recruitments.find(r => r.id === editingRecruitment.id);
    if (originalRecruitment) {
      const bookedDates = originalRecruitment.available_dates.filter(d => d.is_booked);
      const hasAllBookedDates = bookedDates.every(bookedDate =>
        editingRecruitment.available_dates?.some(d => d.datetime === bookedDate.datetime)
      );
      
      if (!hasAllBookedDates) {
        alert('予約済みの日時は削除できません');
        return;
      }
    }
    
    setEditLoading(true);
    try {
      const { id, ...updateData } = editingRecruitment;
      await updateRecruitment(id, updateData);
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
  
  const handleToggleRecruitmentStatus = async (id: string, status: 'active' | 'closed') => {
    const action = status === 'active' ? '公開' : '非公開';
    if (window.confirm(`この募集を${action}にしますか？`)) {
      try {
        await updateRecruitment(id, { status });
        alert(`募集を${action}にしました`);
        await loadDashboardData();
      } catch (error: any) {
        alert(error.message || `処理に失敗しました`);
      }
    }
  };

  const handleDeleteRecruitment = async (id: string) => {
    if (window.confirm('この募集を完全に削除しますか？関連する予約もすべて削除され、この操作は元に戻せません。')) {
      try {
        await deleteRecruitment(id);
        alert('募集を削除しました');
        await loadDashboardData();
      } catch (error: any) {
        alert(error.message || '募集の削除に失敗しました');
      }
    }
  };

  const handleOpenEditModal = (recruitment: Recruitment) => {
    setEditingRecruitment({ ...recruitment });
    setShowEditModal(true);
  };
  
  const handleUpdateReservation = async (id: string, status: ReservationStatus) => {
    const action = {
      confirmed: '承認',
      cancelled_by_salon: 'キャンセル',
    }[status as 'confirmed' | 'cancelled_by_salon'];

    if (action && window.confirm(`この予約を${action}しますか？`)) {
      try {
        await updateReservationStatus(id, status);
        alert(`予約を${action}しました。`);
        await loadDashboardData();
      } catch(error: any) {
        alert(error.message || `予約の${action}に失敗しました。`);
      }
    }
  };

  const toggleMenu = (menu: MenuType, isEdit = false) => {
    const target = isEdit ? editingRecruitment : newRecruitmentData;
    const setter = isEdit ? setEditingRecruitment : setNewRecruitmentData;
    if (!target) return;
    const currentMenus = target.menus || [];
    const newMenus = currentMenus.includes(menu)
      ? currentMenus.filter(m => m !== menu)
      : [...currentMenus, menu];
    setter({ ...target, menus: newMenus } as any);
  };

  const getReservationStatusLabel = (status: ReservationStatus) => {
    switch (status) {
      case 'pending': return { text: '承認待ち', className: styles.statusPending };
      case 'confirmed': return { text: '予約確定', className: styles.statusAccepted };
      case 'cancelled_by_salon': return { text: 'サロン都合キャンセル', className: styles.statusRejected };
      case 'cancelled_by_student': return { text: '本人キャンセル', className: styles.statusWithdrawn };
      default: return { text: status, className: '' };
    }
  };

  if (loading) return <Spinner fullScreen />;
  if (!user) return null;
  
  const pendingReservations = reservations.filter(res => res.status === 'pending');
  const nonPendingReservations = reservations.filter(res => res.status !== 'pending');

  const renderSalonReservation = (res: ReservationWithDetails) => (
    <div
      key={res.id}
      className={[
        styles.applicationItem,
        res.status === 'pending' ? styles.pendingReservation : '',
      ].filter(Boolean).join(' ')}
    >
      <div className={styles.applicationHeader}>
        <div className={styles.reservationDetails}>
          <Link to={`/recruitment/${res.recruitment_id}`} className={styles.applicationTitle}>
            {res.recruitment.title}
          </Link>
          <div className={styles.studentInfo}>
            <p className={styles.studentInfoRow}>
              <strong>予約者:</strong> {res.student.name}
            </p>
            {res.student.school_name && (
              <p className={styles.studentInfoRow}>
                <strong>学校:</strong> {res.student.school_name}
              </p>
            )}
            <p className={styles.studentInfoRow}>
              <strong>メール:</strong>{' '}
              <a className={styles.contactLink} href={`mailto:${res.student.email}`}>
                {res.student.email}
              </a>
            </p>
            {res.student.instagram_url && (
              <p className={styles.studentInfoRow}>
                <strong>Instagram:</strong>{' '}
                <a
                  className={styles.contactLink}
                  href={res.student.instagram_url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {res.student.instagram_url}
                </a>
              </p>
            )}
          </div>
          <p className={styles.applicationSalon}>
            <strong>予約日時:</strong> {formatDateTime(res.reservation_datetime)}
          </p>
          <p className={styles.applicationDate}>仮予約日: {formatDateTime(res.created_at)}</p>
          {res.message && (
            <p className={styles.applicationSalon}>
              <strong>メッセージ:</strong> {res.message}
            </p>
          )}
        </div>
        <span className={getReservationStatusLabel(res.status).className}>
          {getReservationStatusLabel(res.status).text}
        </span>
      </div>
      {res.status === 'pending' && (
        <div className={styles.recruitmentActions}>
          <Button size="sm" variant="primary" onClick={() => handleUpdateReservation(res.id, 'confirmed')}>
            承認
          </Button>
          <Button size="sm" variant="danger" onClick={() => handleUpdateReservation(res.id, 'cancelled_by_salon')}>
            キャンセル
          </Button>
        </div>
      )}
    </div>
  );

  const renderRecruitmentForm = (
    data: typeof newRecruitmentData | typeof editingRecruitment | null,
    setter: any,
    isEdit: boolean
  ) => {
    if (!data) return null;
    return (
      <div className={styles.modalContent}>
        <Input 
          label="募集タイトル" 
          value={data.title || ''} 
          onChange={(e) => setter({ ...data, title: e.target.value })} 
          required 
          fullWidth
        />
        
        <div className={styles.inputWrapper}>
          <label className={styles.label}>募集内容</label>
          <textarea 
            className={styles.textarea} 
            value={data.description || ''} 
            onChange={(e) => setter({ ...data, description: e.target.value })} 
            placeholder="詳しい募集内容を入力してください" 
            rows={4}
          />
        </div>
        
        <div className={styles.inputWrapper}>
          <label className={styles.label}>
            メニュー（複数選択可）<span className={styles.required}>*</span>
          </label>
          <div className={styles.checkboxGrid}>
            {MENU_OPTIONS.map(menu => (
              <label key={menu} className={styles.checkboxLabel}>
                <input 
                  type="checkbox" 
                  checked={data.menus?.includes(menu)} 
                  onChange={() => toggleMenu(menu, isEdit)}
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
                  name={`gender_${isEdit}`} 
                  value={gender} 
                  checked={data.gender_requirement === gender} 
                  onChange={(e) => setter({...data, gender_requirement: e.target.value as GenderRequirement})}
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
                  name={`hairLength_${isEdit}`} 
                  value={length} 
                  checked={data.hair_length_requirement === length} 
                  onChange={(e) => setter({...data, hair_length_requirement: e.target.value as HairLengthRequirement})}
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
                  name={`experience_${isEdit}`} 
                  value={exp} 
                  checked={data.model_experience_requirement === exp} 
                  onChange={(e) => setter({...data, model_experience_requirement: e.target.value as ModelExperienceRequirement})}
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
                  name={`photoShoot_${isEdit}`} 
                  value={photo} 
                  checked={data.photo_shoot_requirement === photo} 
                  onChange={(e) => setter({...data, photo_shoot_requirement: e.target.value as PhotoShootRequirement})}
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
              checked={data.has_reward} 
              onChange={(e) => setter({ ...data, has_reward: e.target.checked })}
            />
            <span>謝礼あり</span>
          </label>
        </div>
        
        {data.has_reward && (
          <Input 
            label="謝礼詳細（任意）" 
            value={data.reward_details || ''} 
            onChange={(e) => setter({ ...data, reward_details: e.target.value })} 
            placeholder="例: 交通費支給、トリートメントサービスなど" 
            fullWidth
          />
        )}
        
        <Input 
          label="施術時間（任意）" 
          type="text" 
          value={data.treatment_duration || ''} 
          onChange={(e) => setter({ ...data, treatment_duration: e.target.value })} 
          placeholder="例: 2〜3時間" 
          fullWidth
        />
      </div>
    );
  };

  // 日時管理UIコンポーネント
  const renderDateTimeManager = (isEdit: boolean) => {
    const dates = isEdit ? (editingRecruitment?.available_dates || []) : newRecruitmentData.available_dates;
    const dateValue = isEdit ? editSlotDate : newSlotDate;
    const timeValue = isEdit ? editSlotTime : newSlotTime;
    const setDateValue = isEdit ? setEditSlotDate : setNewSlotDate;
    const setTimeValue = isEdit ? setEditSlotTime : setNewSlotTime;
    const addFunc = isEdit ? addEditSlot : addSlot;
    const removeFunc = isEdit ? removeEditSlot : removeSlot;

    return (
      <div className={styles.inputWrapper}>
        <label className={styles.label}>
          施術可能な日時を追加 <span className={styles.required}>*</span>
        </label>
        <div style={{ display: 'flex', gap: 'var(--spacing-sm)', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <Input 
            type="date" 
            value={dateValue} 
            onChange={e => setDateValue(e.target.value)}
            style={{ flex: '1 1 150px', minWidth: '150px' }}
          />
          <Input 
            type="time" 
            value={timeValue} 
            onChange={e => setTimeValue(e.target.value)}
            style={{ flex: '1 1 120px', minWidth: '120px' }}
          />
          <Button onClick={addFunc} size="sm">追加</Button>
        </div>
        
        {dates.length > 0 && (
          <div style={{ 
            marginTop: 'var(--spacing-md)', 
            display: 'flex', 
            flexDirection: 'column', 
            gap: 'var(--spacing-xs)' 
          }}>
            {dates.map(date => (
              <div 
                key={date.datetime} 
                style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  padding: 'var(--spacing-sm)',
                  backgroundColor: date.is_booked ? 'var(--color-gray-200)' : 'var(--color-bg-secondary)',
                  borderRadius: 'var(--radius-md)'
                }}
              >
                <span>
                  {formatDateTime(date.datetime)}
                  {date.is_booked && <strong style={{ marginLeft: 'var(--spacing-sm)', color: 'var(--color-danger)' }}>（予約済み）</strong>}
                </span>
                {!date.is_booked && (
                  <button 
                    onClick={() => removeFunc(date.datetime)}
                    style={{
                      background: 'none',
                      border: 'none',
                      fontSize: 'var(--font-size-xl)',
                      cursor: 'pointer',
                      color: 'var(--color-danger)',
                      padding: '0 var(--spacing-sm)'
                    }}
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.header}>
          <h1 className={styles.title}>マイページ</h1>
          <div className={styles.headerActions}>
            <Link to="/"><Button variant="secondary">募集一覧へ</Button></Link>
            <Button 
              variant="outline" 
              onClick={() => { 
                setProfileData(user.profile); 
                setShowProfileModal(true); 
              }}
            >
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
          <>
            {pendingReservations.length > 0 && (
              <Card padding="lg" className={styles.pendingCard}>
                <div className={styles.sectionHeader}>
                  <h2 className={styles.sectionTitle}>承認待ちの予約</h2>
                </div>
                <p className={styles.pendingDescription}>
                  サロンからの承認をお待ちください。連絡が届いたら早めに返信しましょう。
                </p>
                <div className={styles.applicationList}>
                  {pendingReservations.map(res => (
                    <div key={res.id} className={`${styles.applicationItem} ${styles.pendingReservation}`}>
                      <div className={styles.applicationHeader}>
                        <div className={styles.reservationDetails}>
                          <Link to={`/recruitment/${res.recruitment_id}`} className={styles.applicationTitle}>
                            {res.recruitment.title}
                          </Link>
                          <p className={styles.applicationSalon}>
                            <strong>サロン:</strong> {res.recruitment.salon.salon_name}
                          </p>
                          <p className={styles.applicationSalon}>
                            <strong>予約日時:</strong> {formatDateTime(res.reservation_datetime)}
                          </p>
                          <p className={styles.applicationDate}>仮予約日: {formatDateTime(res.created_at)}</p>
                        </div>
                        <span className={getReservationStatusLabel(res.status).className}>
                          {getReservationStatusLabel(res.status).text}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            <Card padding="lg">
              <h2 className={styles.sectionTitle}>予約履歴</h2>
              {nonPendingReservations.length === 0 ? (
                <p className={styles.emptyMessage}>
                  {pendingReservations.length > 0 ? '承認待ち以外の予約はまだありません' : '予約履歴はありません'}
                </p>
              ) : (
                <div className={styles.applicationList}>
                  {nonPendingReservations.map(res => (
                    <div
                      key={res.id}
                      className={[
                        styles.applicationItem,
                        res.status === 'confirmed' ? styles.confirmedReservation : '',
                      ].filter(Boolean).join(' ')}
                    >
                      <div className={styles.applicationHeader}>
                        <div className={styles.reservationDetails}>
                          <Link to={`/recruitment/${res.recruitment_id}`} className={styles.applicationTitle}>
                            {res.recruitment.title}
                          </Link>
                          <p className={styles.applicationSalon}>
                            <strong>サロン:</strong> {res.recruitment.salon.salon_name}
                          </p>
                          <p className={styles.applicationSalon}>
                            <strong>予約日時:</strong> {formatDateTime(res.reservation_datetime)}
                          </p>
                          <p className={styles.applicationDate}>仮予約日: {formatDateTime(res.created_at)}</p>
                          {res.status === 'confirmed' && (
                            <p className={styles.confirmedNote}>
                              予約が確定しました。集合時間や持ち物などの連絡を確認しましょう。
                            </p>
                          )}
                        </div>
                        <span className={getReservationStatusLabel(res.status).className}>
                          {getReservationStatusLabel(res.status).text}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </>
        )}

        {user.userType === 'salon' && (
          <>
            <Card padding="lg">
              <h2 className={styles.sectionTitle}>予約管理</h2>
              {reservations.length === 0 ? (
                <p className={styles.emptyMessage}>現在、予約はありません</p>
              ) : (
                <div className={styles.reservationSections}>
                  {pendingReservations.length > 0 && (
                    <div className={styles.reservationSection}>
                      <h3 className={styles.subSectionTitle}>承認待ち</h3>
                      <div className={styles.applicationList}>
                        {pendingReservations.map(renderSalonReservation)}
                      </div>
                    </div>
                  )}
                  {nonPendingReservations.length > 0 && (
                    <div className={styles.reservationSection}>
                      <h3 className={styles.subSectionTitle}>その他の予約</h3>
                      <div className={styles.applicationList}>
                        {nonPendingReservations.map(renderSalonReservation)}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </Card>
            
            <Card padding="lg">
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>募集管理</h2>
                <Button variant="primary" onClick={() => setShowCreateModal(true)}>新規募集作成</Button>
              </div>
              {recruitments.length === 0 ? (
                <p className={styles.emptyMessage}>まだ募集を作成していません</p>
              ) : (
                <div className={styles.recruitmentList}>
                  {recruitments.map((rec) => (
                    <div key={rec.id} className={styles.recruitmentItem}>
                      <div className={styles.recruitmentHeader}>
                        <Link to={`/recruitment/${rec.id}`} className={styles.recruitmentTitle}>
                          {rec.title}
                        </Link>
                        <span className={rec.status === 'active' ? styles.statusActive : styles.statusClosed}>
                          {rec.status === 'active' ? '公開中' : '非公開'}
                        </span>
                      </div>
                      <p className={styles.applicationDate}>
                        空き枠: {rec.available_dates.filter(d => !d.is_booked).length}件
                      </p>
                      <div className={styles.recruitmentActions}>
                        <Button variant="outline" size="sm" onClick={() => handleOpenEditModal(rec)}>
                          編集
                        </Button>
                        {rec.status === 'active' 
                          ? <Button variant="outline" size="sm" onClick={() => handleToggleRecruitmentStatus(rec.id, 'closed')}>
                              非公開にする
                            </Button>
                          : <Button variant="outline" size="sm" onClick={() => handleToggleRecruitmentStatus(rec.id, 'active')}>
                              公開する
                            </Button>
                        }
                        <Button variant="danger" size="sm" onClick={() => handleDeleteRecruitment(rec.id)}>
                          削除
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </>
        )}
      </div>

      {/* プロフィール編集モーダル */}
      <Modal isOpen={showProfileModal} onClose={() => setShowProfileModal(false)} title="プロフィール編集" size="md">
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
            <Button variant="outline" onClick={() => setShowProfileModal(false)}>キャンセル</Button>
            <Button variant="primary" onClick={handleUpdateProfile} loading={profileLoading}>保存</Button>
          </div>
        </div>
      </Modal>

      {/* 募集作成モーダル */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="新規募集作成" size="lg">
        {renderRecruitmentForm(newRecruitmentData, setNewRecruitmentData, false)}
        {renderDateTimeManager(false)}
        
        <div className={styles.modalActions}>
          <Button variant="outline" onClick={() => setShowCreateModal(false)}>キャンセル</Button>
          <Button 
            variant="primary" 
            onClick={handleCreateRecruitment} 
            loading={createLoading}
            disabled={
              newRecruitmentData.menus.length === 0 || 
              !newRecruitmentData.title || 
              newRecruitmentData.available_dates.length === 0
            }
          >
            作成
          </Button>
        </div>
      </Modal>

      {/* 募集編集モーダル */}
      {editingRecruitment && (
        <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="募集内容を編集" size="lg">
          {renderRecruitmentForm(editingRecruitment, setEditingRecruitment, true)}
          {renderDateTimeManager(true)}
          
          <div className={styles.modalActions}>
            <Button variant="outline" onClick={() => setShowEditModal(false)}>キャンセル</Button>
            <Button variant="primary" onClick={handleUpdateRecruitment} loading={editLoading}>更新</Button>
          </div>
        </Modal>
      )}
    </div>
  );
};

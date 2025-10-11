import { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
  ReservationMessage,
  AvailableDate,
} from '@/types';
import { formatDateTime, getHoursBefore, isBeforeHoursBefore } from '@/utils/date';
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
import { Button } from '@/components/Button';
import { Modal } from '@/components/Modal';
import { Input } from '@/components/Input';
import { Spinner } from '@/components/Spinner';
import { ReservationChatModal } from '@/components/ReservationChatModal';
import { supabase } from '@/lib/supabase';
import { ProfileCard } from './dashboard/components/ProfileCard';
import { StudentReservationsSection } from './dashboard/components/StudentReservationsSection';
import { SalonReservationsSection } from './dashboard/components/SalonReservationsSection';
import { RecruitmentManagementSection } from './dashboard/components/RecruitmentManagementSection';
import { RecruitmentCreateForm } from './dashboard/components/RecruitmentCreateForm';
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
  flexible_schedule_text: '',
  is_fully_booked: false,
};

export const DashboardPage = () => {
  const { user, updateProfile, deleteAccount } = useAuth();
  const navigate = useNavigate();
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
  const [expandedReservations, setExpandedReservations] = useState<Record<string, boolean>>({});
  const [chatReservation, setChatReservation] = useState<ReservationWithDetails | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [latestMessages, setLatestMessages] = useState<Record<string, ReservationMessage | null>>({});
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showProfileActions, setShowProfileActions] = useState(false);
  const profileActionsRef = useRef<HTMLDivElement | null>(null);
  const [cancelReservationTarget, setCancelReservationTarget] = useState<ReservationWithDetails | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelSubmitting, setCancelSubmitting] = useState(false);
  const [cancelError, setCancelError] = useState('');

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

useEffect(() => {
  setExpandedReservations({});
}, [reservations]);

useEffect(() => {
  const confirmedIds = reservations
    .filter(res => res.status === 'confirmed')
    .map(res => res.id);

  if (confirmedIds.length === 0) {
    setLatestMessages({});
    return;
  }

  let isActive = true;

  const loadLatestMessages = async () => {
    const { data, error } = await supabase
      .from('reservation_messages')
      .select('*')
      .in('reservation_id', confirmedIds)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to load latest messages:', error);
      return;
    }

    if (!isActive) return;

    const map: Record<string, ReservationMessage | null> = {};
    for (const message of data || []) {
      if (!map[message.reservation_id]) {
        map[message.reservation_id] = message as ReservationMessage;
      }
    }
    setLatestMessages(map);
  };

  loadLatestMessages();

  return () => {
    isActive = false;
  };
}, [reservations]);

useEffect(() => {
  const confirmedReservations = reservations.filter(res => res.status === 'confirmed');
  if (confirmedReservations.length === 0) return;

  const channels = confirmedReservations.map(reservation =>
    supabase
      .channel(`reservation-messages-dashboard-${reservation.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'reservation_messages',
          filter: `reservation_id=eq.${reservation.id}`,
        },
        payload => {
          const newMessage = payload.new as ReservationMessage;
          setLatestMessages(prev => {
            if (prev[reservation.id]?.id === newMessage.id) {
              return prev;
            }
            return {
              ...prev,
              [reservation.id]: newMessage,
            };
          });
        }
      )
      .subscribe()
  );

  return () => {
    channels.forEach(channel => {
      supabase.removeChannel(channel);
    });
  };
}, [reservations]);

useEffect(() => {
  const handleClickOutside = (event: MouseEvent) => {
    if (
      profileActionsRef.current &&
      !profileActionsRef.current.contains(event.target as Node)
    ) {
      setShowProfileActions(false);
    }
  };

  document.addEventListener('mousedown', handleClickOutside);
  return () => {
    document.removeEventListener('mousedown', handleClickOutside);
  };
}, []);

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
    // ISO 8601形式でJST(+09:00)を明示
    return `${date}T${time}:00+09:00`;
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
    
    if (newRecruitmentData.available_dates.length === 0 && !newRecruitmentData.flexible_schedule_text) {
      alert('施術可能な日時を追加するか、文章で日時を指定してください');
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

    if ((!editingRecruitment.available_dates || editingRecruitment.available_dates.length === 0) && !editingRecruitment.flexible_schedule_text) {
      alert('施術可能な日時を追加するか、文章で日時を指定してください');
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
    if (window.confirm(`この募集を${action}にしますか?`)) {
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
    if (window.confirm('この募集を完全に削除しますか?関連する予約もすべて削除され、この操作は元に戻せません。')) {
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

    if (action && window.confirm(`この予約を${action}しますか?`)) {
      try {
        await updateReservationStatus(id, status);
        alert(`予約を${action}しました。`);
        await loadDashboardData();
      } catch(error: any) {
        alert(error.message || `予約の${action}に失敗しました。`);
      }
    }
  };

  const handleOpenCancelModal = (reservation: ReservationWithDetails) => {
    setCancelReservationTarget(reservation);
    setCancelReason('');
    setCancelError('');
  };

  const handleCloseCancelModal = () => {
    if (cancelSubmitting) return;
    setCancelReservationTarget(null);
    setCancelReason('');
    setCancelError('');
  };

  const handleCancelReservation = async () => {
    if (!cancelReservationTarget) return;
    if (!cancelReason.trim()) {
      setCancelError('キャンセル理由を入力してください');
      return;
    }
    if (!isBeforeHoursBefore(cancelReservationTarget.reservation_datetime, 48)) {
      alert('キャンセル期限を過ぎています。サロンに直接ご連絡ください。');
      return;
    }

    setCancelSubmitting(true);
    setCancelError('');
    try {
      await updateReservationStatus(cancelReservationTarget.id, 'cancelled_by_student', {
        cancellationReason: cancelReason.trim(),
      });
      alert('予約をキャンセルしました。');
      setCancelReservationTarget(null);
      setCancelReason('');
      await loadDashboardData();
    } catch(error: any) {
      alert(error.message || '予約のキャンセルに失敗しました。');
    } finally {
      setCancelSubmitting(false);
    }
  };

  const toggleReservationDetails = (id: string) => {
    setExpandedReservations(prev => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleOpenChat = (reservation: ReservationWithDetails) => {
    setChatReservation(reservation);
    setIsChatOpen(true);
  };

  const handleCloseChat = () => {
    setIsChatOpen(false);
    setChatReservation(null);
  };

  const handleDeleteAccount = async () => {
    setShowProfileActions(false);
    if (!window.confirm('アカウントを本当に削除しますか?この操作は取り消せません。')) {
      return;
    }

    setDeleteLoading(true);
    try {
      await deleteAccount();
      alert('アカウントを削除しました。ご利用ありがとうございました。');
      navigate('/');
    } catch (error: any) {
      alert(error.message || 'アカウントの削除に失敗しました');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleChatMessageActivity = useCallback(
    (message: ReservationMessage | null) => {
      if (!chatReservation) return;
      setLatestMessages(prev => ({
        ...prev,
        [chatReservation.id]: message,
      }));
    },
    [chatReservation]
  );

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
  
  const hasUnreadMessage = (reservationId: string) => {
    if (!user) return false;
    const latest = latestMessages[reservationId];
    if (!latest) return false;
    return latest.sender_id !== user.id;
  };

  const handleOpenProfileModal = () => {
    setProfileData(user!.profile);
    setShowProfileModal(true);
    setShowProfileActions(false);
  };

  if (loading) return <Spinner fullScreen />;
  if (!user) return null;
  
  const pendingReservations = reservations.filter(res => res.status === 'pending');
  const confirmedReservations = reservations.filter(res => res.status === 'confirmed');
  const otherReservations = reservations.filter(
    res => res.status !== 'pending' && res.status !== 'confirmed'
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
            メニュー(複数選択可)<span className={styles.required}>*</span>
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
            label="謝礼詳細(任意)" 
            value={data.reward_details || ''} 
            onChange={(e) => setter({ ...data, reward_details: e.target.value })} 
            placeholder="例: 交通費支給、トリートメントサービスなど" 
            fullWidth
          />
        )}
        
        <Input 
          label="施術時間(任意)" 
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
    const dateValue = isEdit ? editSlotDate : '';
    const timeValue = isEdit ? editSlotTime : '';
    const setDateValue = isEdit ? setEditSlotDate : () => {};
    const setTimeValue = isEdit ? setEditSlotTime : () => {};
    const addFunc = isEdit ? addEditSlot : () => {};
    const removeFunc = isEdit ? removeEditSlot : () => {};

    const targetRecruitment = isEdit ? editingRecruitment : newRecruitmentData;
    const flexibleText = targetRecruitment?.flexible_schedule_text ?? '';
    const handleFlexibleTextChange = (text: string) => {
      if (isEdit) {
        setEditingRecruitment(prev => prev ? { ...prev, flexible_schedule_text: text } : prev);
      } else {
        setNewRecruitmentData(prev => ({ ...prev, flexible_schedule_text: text }));
      }
    };

    return (
      <div className={styles.inputWrapper}>
        <label className={styles.label}>
          施術可能な日時を追加
          <span className={styles.required}>*</span>
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
                  backgroundColor: date.is_booked ? 'var(--color-status-neutral-bg)' : 'var(--color-surface-muted)',
                  borderRadius: 'var(--radius-md)'
                }}
              >
                <span>
                  {formatDateTime(date.datetime)}
                  {date.is_booked && <strong style={{ marginLeft: 'var(--spacing-sm)', color: 'var(--color-danger)' }}>(予約済み)</strong>}
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

        <div style={{ 
          margin: 'var(--spacing-lg) 0', 
          display: 'flex', 
          alignItems: 'center',
          gap: 'var(--spacing-md)'
        }}>
          <div style={{ flex: 1, height: '1px', background: 'var(--color-border-light)' }} />
          <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-tertiary)', fontWeight: '500' }}>
            または
          </span>
          <div style={{ flex: 1, height: '1px', background: 'var(--color-border-light)' }} />
        </div>

        <div className={styles.inputWrapper}>
          <label className={styles.label}>文章で日時を指定</label>
          <Input 
            type="text" 
            value={flexibleText}
            onChange={e => handleFlexibleTextChange(e.target.value)}
            placeholder="例: 毎週月曜日の18時以降"
            fullWidth
          />
          <p className={styles.helperText}>
            具体的な日時が決まっていない場合は、こちらに希望の時間帯を入力してください
          </p>
        </div>
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
            <div className={styles.actionMenu} ref={profileActionsRef}>
              <Button
                variant="outline"
                onClick={() => setShowProfileActions(prev => !prev)}
              >
                アカウント設定
              </Button>
              {showProfileActions && (
                <div className={styles.actionDropdown}>
                  <button
                    type="button"
                    className={styles.actionItem}
                    onClick={handleOpenProfileModal}
                  >
                    プロフィール編集
                  </button>
                  <button
                    type="button"
                    className={[styles.actionItem, styles.actionDanger].join(' ')}
                    onClick={handleDeleteAccount}
                    disabled={deleteLoading}
                  >
                    {deleteLoading ? '削除中…' : 'アカウント削除'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <ProfileCard
          user={user}
        />

        {user.userType === 'student' ? (
          <StudentReservationsSection
            pendingReservations={pendingReservations}
            confirmedReservations={confirmedReservations}
            otherReservations={otherReservations}
            expandedReservations={expandedReservations}
            onToggleDetails={toggleReservationDetails}
            onOpenChat={handleOpenChat}
            onRequestCancel={handleOpenCancelModal}
            hasUnreadMessage={hasUnreadMessage}
            getReservationStatusLabel={getReservationStatusLabel}
          />
        ) : (
          <>
            <SalonReservationsSection
              pendingReservations={pendingReservations}
              confirmedReservations={confirmedReservations}
              otherReservations={otherReservations}
              expandedReservations={expandedReservations}
              onToggleDetails={toggleReservationDetails}
              onUpdateStatus={handleUpdateReservation}
              onOpenChat={handleOpenChat}
              hasUnreadMessage={hasUnreadMessage}
              getReservationStatusLabel={getReservationStatusLabel}
            />
            <RecruitmentManagementSection
              recruitments={recruitments}
              onCreateClick={() => setShowCreateModal(true)}
              onEditClick={handleOpenEditModal}
              onToggleStatus={handleToggleRecruitmentStatus}
              onDelete={handleDeleteRecruitment}
            />
          </>
        )}
      </div>

      {/* 予約キャンセルモーダル */}
      <Modal
        isOpen={!!cancelReservationTarget}
        onClose={handleCloseCancelModal}
        title="予約をキャンセルする"
        size="sm"
      >
        {cancelReservationTarget && (
          <div className={styles.modalContent}>
            <p className={styles.modalDescription}>
              以下の予約をキャンセルします。理由を入力して送信してください。
            </p>
            <div className={styles.modalInfoBox}>
              <p className={styles.modalInfoLabel}>予約日時</p>
              <p className={styles.modalInfoValue}>
                {formatDateTime(cancelReservationTarget.reservation_datetime)}
              </p>
            </div>
            <div className={styles.modalField}>
              <label className={styles.label} htmlFor="cancel-reason">
                キャンセル理由
                <span className={styles.required}>*</span>
              </label>
              <textarea
                id="cancel-reason"
                className={styles.textarea}
                value={cancelReason}
                onChange={e => {
                  setCancelReason(e.target.value);
                  if (cancelError) {
                    setCancelError('');
                  }
                }}
                rows={4}
                required
              />
              {cancelError && <p className={styles.modalError}>{cancelError}</p>}
            </div>
            <p className={styles.cancelModalNote}>
              キャンセル期限:{' '}
              {formatDateTime(getHoursBefore(cancelReservationTarget.reservation_datetime, 48).toISOString())}
            </p>
            <p className={styles.cancelModalSubNote}>
              期限を過ぎている場合はサロンに直接お電話いただくか、チャットでご相談ください。
            </p>
            <div className={styles.modalActions}>
              <Button variant="ghost" onClick={handleCloseCancelModal} disabled={cancelSubmitting}>
                戻る
              </Button>
              <Button
                variant="danger"
                onClick={handleCancelReservation}
                loading={cancelSubmitting}
              >
                キャンセルを確定する
              </Button>
            </div>
          </div>
        )}
      </Modal>

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
              <Input
                label="WEBサイトURL"
                value={profileData.website_url || ''}
                onChange={(e) => setProfileData({ ...profileData, website_url: e.target.value })}
                placeholder="https://example.com"
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

      {/* 募集作成モーダル（新デザイン） */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="新規募集作成" size="lg">
        <RecruitmentCreateForm
          data={newRecruitmentData}
          onUpdate={setNewRecruitmentData}
          onSubmit={handleCreateRecruitment}
          loading={createLoading}
          onCancel={() => setShowCreateModal(false)}
        />
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

      <ReservationChatModal
        isOpen={isChatOpen}
        onClose={handleCloseChat}
        reservation={chatReservation}
        currentUserId={user.id}
        currentUserType={user.userType}
        onMessageActivity={handleChatMessageActivity}
      />
    </div>
  );
};

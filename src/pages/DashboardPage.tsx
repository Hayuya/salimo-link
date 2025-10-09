import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/auth';
import { useReservations } from '@/hooks/useReservations';
import { useRecruitments } from '@/recruitment';
import {
  RecruitmentSlot,
  Student,
  Salon,
  MenuType,
  GenderRequirement,
  HairLengthRequirement,
  PhotoShootRequirement,
  ModelExperienceRequirement,
  RecruitmentSlotUpdate,
  ReservationWithDetails,
  ReservationStatus,
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
  available_slots: [] as string[],
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
  const [recruitments, setRecruitments] = useState<RecruitmentSlot[]>([]);
  const [loading, setLoading] = useState(true);

  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  const [profileData, setProfileData] = useState<Partial<Student & Salon>>({});
  const [newRecruitmentData, setNewRecruitmentData] = useState(initialRecruitmentState);
  const [editingRecruitment, setEditingRecruitment] = useState<(RecruitmentSlotUpdate & { id: string }) | null>(null);

  const [profileLoading, setProfileLoading] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [editLoading, setEditLoading] = useState(false);

  const [newSlotDate, setNewSlotDate] = useState('');
  const [newSlotTime, setNewSlotTime] = useState('');


  useEffect(() => {
    loadDashboardData();
  }, [user]);

  const loadDashboardData = async () => {
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

  const handleOpenEditModal = (recruitment: RecruitmentSlot) => {
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
  }

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

  const addSlot = () => {
    if (!newSlotDate || !newSlotTime) return;
    const dateTime = new Date(`${newSlotDate}T${newSlotTime}`).toISOString();
    if (newRecruitmentData.available_slots.includes(dateTime)) {
      alert('同じ日時がすでに追加されています。');
      return;
    }
    const updatedSlots = [...newRecruitmentData.available_slots, dateTime].sort();
    setNewRecruitmentData({ ...newRecruitmentData, available_slots: updatedSlots });
  };

  const removeSlot = (slot: string) => {
    const updatedSlots = newRecruitmentData.available_slots.filter(s => s !== slot);
    setNewRecruitmentData({ ...newRecruitmentData, available_slots: updatedSlots });
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
  
  const renderRecruitmentForm = (
    data: typeof newRecruitmentData | typeof editingRecruitment | null,
    setter: any,
    isEdit: boolean
  ) => {
    if (!data) return null;
    return (
      <div className={styles.modalContent}>
        <Input label="募集タイトル" value={data.title || ''} onChange={(e) => setter({ ...data, title: e.target.value })} required fullWidth/>
        <div className={styles.inputWrapper}><label className={styles.label}>募集内容</label><textarea className={styles.textarea} value={data.description || ''} onChange={(e) => setter({ ...data, description: e.target.value })} placeholder="詳しい募集内容を入力してください" rows={4}/></div>
        <div className={styles.inputWrapper}><label className={styles.label}>メニュー（複数選択可）<span className={styles.required}>*</span></label><div className={styles.checkboxGrid}>{MENU_OPTIONS.map(menu => ( <label key={menu} className={styles.checkboxLabel}> <input type="checkbox" checked={data.menus?.includes(menu)} onChange={() => toggleMenu(menu, isEdit)}/> <span>{MENU_LABELS[menu]}</span> </label> ))}</div></div>
        <div className={styles.inputWrapper}><label className={styles.label}>性別</label><div className={styles.radioGroup}>{GENDER_OPTIONS.map(gender => ( <label key={gender} className={styles.radioLabel}> <input type="radio" name={`gender_${isEdit}`} value={gender} checked={data.gender_requirement === gender} onChange={(e) => setter({...data, gender_requirement: e.target.value as GenderRequirement})}/> <span>{GENDER_LABELS[gender]}</span> </label> ))}</div></div>
        <div className={styles.inputWrapper}><label className={styles.label}>髪の長さ</label><div className={styles.radioGroup}>{HAIR_LENGTH_OPTIONS.map(length => ( <label key={length} className={styles.radioLabel}> <input type="radio" name={`hairLength_${isEdit}`} value={length} checked={data.hair_length_requirement === length} onChange={(e) => setter({...data, hair_length_requirement: e.target.value as HairLengthRequirement})}/> <span>{HAIR_LENGTH_LABELS[length]}</span> </label> ))}</div></div>
        <div className={styles.inputWrapper}><label className={styles.label}>モデル経験</label><div className={styles.radioGroup}>{EXPERIENCE_OPTIONS.map(exp => ( <label key={exp} className={styles.radioLabel}> <input type="radio" name={`experience_${isEdit}`} value={exp} checked={data.model_experience_requirement === exp} onChange={(e) => setter({...data, model_experience_requirement: e.target.value as ModelExperienceRequirement})}/> <span>{EXPERIENCE_LABELS[exp]}</span> </label>))}</div></div>
        <div className={styles.inputWrapper}><label className={styles.label}>撮影</label><div className={styles.radioGroup}>{PHOTO_SHOOT_OPTIONS.map(photo => ( <label key={photo} className={styles.radioLabel}> <input type="radio" name={`photoShoot_${isEdit}`} value={photo} checked={data.photo_shoot_requirement === photo} onChange={(e) => setter({...data, photo_shoot_requirement: e.target.value as PhotoShootRequirement})}/> <span>{PHOTO_SHOOT_LABELS[photo]}</span> </label> ))}</div></div>
        <div className={styles.inputWrapper}><label className={styles.checkboxLabel}><input type="checkbox" checked={data.has_reward} onChange={(e) => setter({ ...data, has_reward: e.target.checked })}/><span>謝礼あり</span></label></div>
        {data.has_reward && ( <Input label="謝礼詳細（任意）" value={data.reward_details || ''} onChange={(e) => setter({ ...data, reward_details: e.target.value })} placeholder="例: 交通費支給、トリートメントサービスなど" fullWidth/> )}
        <Input label="施術時間（任意）" type="text" value={data.treatment_duration || ''} onChange={(e) => setter({ ...data, treatment_duration: e.target.value })} placeholder="例: 2〜3時間" fullWidth/>
      </div>
    );
  };

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.header}><h1 className={styles.title}>マイページ</h1><div className={styles.headerActions}><Link to="/"><Button variant="secondary">募集一覧へ</Button></Link><Button variant="outline" onClick={() => { setProfileData(user.profile); setShowProfileModal(true); }}>プロフィール編集</Button></div></div>

        <Card padding="lg">
          <h2 className={styles.sectionTitle}>プロフィール</h2>
          {user.userType === 'student' ? (<div className={styles.profileInfo}><p><strong>名前:</strong> {(user.profile as Student).name}</p><p><strong>学校名:</strong> {(user.profile as Student).school_name || '未設定'}</p><p><strong>メールアドレス:</strong> {user.email}</p></div>) 
          : (<div className={styles.profileInfo}><p><strong>サロン名:</strong> {(user.profile as Salon).salon_name}</p><p><strong>住所:</strong> {(user.profile as Salon).address || '未設定'}</p><p><strong>メールアドレス:</strong> {user.email}</p><p><strong>電話番号:</strong> {(user.profile as Salon).phone_number || '未設定'}</p></div>)}
        </Card>

        {user.userType === 'student' && (
          <Card padding="lg">
            <h2 className={styles.sectionTitle}>予約履歴</h2>
            {reservations.length === 0 ? ( <p className={styles.emptyMessage}>予約履歴はありません</p> ) : (
              <div className={styles.applicationList}>
                {reservations.map((res) => (
                  <div key={res.id} className={styles.applicationItem}>
                    <div className={styles.applicationHeader}>
                      <Link to={`/recruitment/${res.recruitment_slot_id}`} className={styles.applicationTitle}>{res.recruitment_slot.title}</Link>
                      <span className={getReservationStatusLabel(res.status).className}>{getReservationStatusLabel(res.status).text}</span>
                    </div>
                    <p className={styles.applicationSalon}><strong>予約日時:</strong> {formatDateTime(res.available_slot.slot_time)}</p>
                    <p className={styles.applicationDate}>仮予約日: {formatDateTime(res.created_at)}</p>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}

        {user.userType === 'salon' && (
          <>
            <Card padding="lg">
                <h2 className={styles.sectionTitle}>予約管理</h2>
                {reservations.length === 0 ? (<p className={styles.emptyMessage}>現在、予約はありません</p>) : (
                    <div className={styles.reservationList}>
                        {reservations.map(res => (
                            <div key={res.id} className={styles.reservationItem}>
                                <div className={styles.reservationInfo}>
                                    <p><strong>募集:</strong> <Link to={`/recruitment/${res.recruitment_slot_id}`}>{res.recruitment_slot.title}</Link></p>
                                    <p><strong>予約者:</strong> {res.student.name}</p>
                                    <p><strong>予約日時:</strong> {formatDateTime(res.available_slot.slot_time)}</p>
                                    <p><strong>ステータス:</strong> <span className={getReservationStatusLabel(res.status).className}>{getReservationStatusLabel(res.status).text}</span></p>
                                </div>
                                {res.status === 'pending' && (
                                    <div className={styles.reservationActions}>
                                        <Button size="sm" variant="primary" onClick={() => handleUpdateReservation(res.id, 'confirmed')}>承認</Button>
                                        <Button size="sm" variant="danger" onClick={() => handleUpdateReservation(res.id, 'cancelled_by_salon')}>キャンセル</Button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </Card>
            <Card padding="lg">
              <div className={styles.sectionHeader}><h2 className={styles.sectionTitle}>募集管理</h2><Button variant="primary" onClick={() => setShowCreateModal(true)}>新規募集作成</Button></div>
              {recruitments.length === 0 ? ( <p className={styles.emptyMessage}>まだ募集を作成していません</p> ) : (
                <div className={styles.recruitmentList}>
                  {recruitments.map((rec) => (
                    <div key={rec.id} className={styles.recruitmentItem}>
                      <div className={styles.recruitmentHeader}>
                        <Link to={`/recruitment/${rec.id}`} className={styles.recruitmentTitle}>{rec.title}</Link>
                        <span className={rec.status === 'active' ? styles.statusActive : styles.statusClosed}>{rec.status === 'active' ? '公開中' : '非公開'}</span>
                      </div>
                      <div className={styles.recruitmentActions}>
                          <Button variant="outline" size="sm" onClick={() => handleOpenEditModal(rec)}>編集</Button>
                          {rec.status === 'active' 
                            ? <Button variant="outline" size="sm" onClick={() => handleToggleRecruitmentStatus(rec.id, 'closed')}>非公開にする</Button>
                            : <Button variant="outline" size="sm" onClick={() => handleToggleRecruitmentStatus(rec.id, 'active')}>公開する</Button>
                          }
                          <Button variant="danger" size="sm" onClick={() => handleDeleteRecruitment(rec.id)}>削除</Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </>
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
        <div className={styles.inputWrapper}>
            <label className={styles.label}>施術可能な日時を追加 <span className={styles.required}>*</span></label>
            <div className={styles.dateTimeInput}>
                <Input type="date" value={newSlotDate} onChange={e => setNewSlotDate(e.target.value)} />
                <Input type="time" step="3600" value={newSlotTime} onChange={e => setNewSlotTime(e.target.value)} />
                <Button onClick={addSlot} size="sm">追加</Button>
            </div>
            <div className={styles.slotList}>
                {newRecruitmentData.available_slots.map(slot => (
                    <div key={slot} className={styles.slotItem}>
                        <span>{formatDateTime(slot)}</span>
                        <button onClick={() => removeSlot(slot)}>&times;</button>
                    </div>
                ))}
            </div>
        </div>
        <div className={styles.modalActions}>
          <Button variant="outline" onClick={() => setShowCreateModal(false)}>キャンセル</Button>
          <Button variant="primary" onClick={handleCreateRecruitment} loading={createLoading} disabled={newRecruitmentData.menus.length === 0 || !newRecruitmentData.title || newRecruitmentData.available_slots.length === 0}>作成</Button>
        </div>
      </Modal>

      {editingRecruitment && (
        <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="募集内容を編集" size="lg">
          {renderRecruitmentForm(editingRecruitment, setEditingRecruitment, true)}
          <div className={styles.modalActions}>
            <Button variant="outline" onClick={() => setShowEditModal(false)}>キャンセル</Button>
            <Button variant="primary" onClick={handleUpdateRecruitment} loading={editLoading}>更新</Button>
          </div>
        </Modal>
      )}
    </div>
  );
};
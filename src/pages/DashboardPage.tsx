import { Link } from 'react-router-dom';
import { useDashboard } from './dashboard/hooks/useDashboard';
import type {
  GenderRequirement,
  HairLengthRequirement,
  PhotoShootRequirement,
  ModelExperienceRequirement,
  ReservationStatus,
} from '@/types';
import { formatDateTime, getHoursBefore } from '@/utils/date';
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
import { ProfileCard } from './dashboard/components/ProfileCard';
import { StudentReservationsSection } from './dashboard/components/StudentReservationsSection';
import { SalonReservationsSection } from './dashboard/components/SalonReservationsSection';
import { RecruitmentManagementSection } from './dashboard/components/RecruitmentManagementSection';
import { RecruitmentCreateForm } from './dashboard/components/RecruitmentCreateForm';
import styles from './DashboardPage.module.css';

export const DashboardPage = () => {
  const {
    user,
    loading,
    recruitments,
    profileData,
    setProfileData,
    newRecruitmentData,
    setNewRecruitmentData,
    editingRecruitment,
    setEditingRecruitment,
    showProfileModal,
    setShowProfileModal,
    showCreateModal,
    setShowCreateModal,
    showEditModal,
    setShowEditModal,
    profileLoading,
    createLoading,
    editLoading,
    expandedReservations,
    toggleReservationDetails,
    chatReservation,
    isChatOpen,
    handleOpenChat,
    handleCloseChat,
    handleUpdateProfile,
    handleCreateRecruitment,
    handleUpdateRecruitment,
    handleToggleRecruitmentStatus,
    handleDeleteRecruitment,
    handleOpenEditModal,
    handleUpdateReservation,
    showProfileActions,
    setShowProfileActions,
    profileActionsRef,
    handleDeleteAccount,
    deleteLoading,
    handleChatMessageActivity,
    hasUnreadMessage,
    handleOpenProfileModal,
    pendingReservations,
    confirmedReservations,
    otherReservations,
    cancelReservationTarget,
    cancelReason,
    setCancelReason,
    cancelError,
    setCancelError,
    cancelSubmitting,
    handleOpenCancelModal,
    handleCloseCancelModal,
    handleCancelReservation,
    editSlotDate,
    setEditSlotDate,
    editSlotTime,
    setEditSlotTime,
    addEditSlot,
    removeEditSlot,
    toggleMenu,
  } = useDashboard();

  if (loading) return <Spinner fullScreen />;
  if (!user) return null;

  const getReservationStatusLabel = (status: ReservationStatus) => {
    switch (status) {
      case 'pending':
        return { text: '承認待ち', className: styles.statusPending };
      case 'confirmed':
        return { text: '予約確定', className: styles.statusAccepted };
      case 'cancelled_by_salon':
        return { text: 'サロン都合キャンセル', className: styles.statusRejected };
      case 'cancelled_by_student':
        return { text: '本人キャンセル', className: styles.statusWithdrawn };
      default:
        return { text: status, className: '' };
    }
  };


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
              <Input
                label="電話番号"
                value={profileData.phone_number || ''}
                onChange={(e) => setProfileData({ ...profileData, phone_number: e.target.value })}
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

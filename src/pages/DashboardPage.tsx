import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useDashboard, dashboardInitialRecruitmentState } from './dashboard/hooks/useDashboard';
import type { Recruitment, ReservationStatus } from '@/types';
import { formatDateTime, getHoursBefore } from '@/utils/date';
import { Button } from '@/components/Button';
import { Modal } from '@/components/Modal';
import { Input } from '@/components/Input';
import { Spinner } from '@/components/Spinner';
import { ReservationChatModal } from '@/components/ReservationChatModal';
import { ProfileCard } from './dashboard/components/ProfileCard';
import { StudentReservationsSection } from './dashboard/components/StudentReservationsSection';
import { SalonReservationsSection } from './dashboard/components/SalonReservationsSection';
import { RecruitmentManagementSection } from './dashboard/components/RecruitmentManagementSection';
import { RecruitmentForm, RecruitmentFormData } from './dashboard/components/RecruitmentForm';
import styles from './DashboardPage.module.css';

const cloneRecruitmentFormData = (data: RecruitmentFormData): RecruitmentFormData => ({
  ...data,
  menus: [...(data.menus ?? [])],
  available_dates: (data.available_dates ?? []).map(date => ({ ...date })),
});

const recruitmentToFormData = (recruitment: Recruitment): RecruitmentFormData =>
  cloneRecruitmentFormData({
    title: recruitment.title || '',
    description: recruitment.description || '',
    menus: recruitment.menus ? [...recruitment.menus] : [],
    gender_requirement: recruitment.gender_requirement,
    hair_length_requirement: recruitment.hair_length_requirement,
    treatment_duration: recruitment.treatment_duration || '',
    status: recruitment.status,
    photo_shoot_requirement: recruitment.photo_shoot_requirement,
    model_experience_requirement: recruitment.model_experience_requirement,
    payment_type: recruitment.payment_type,
    payment_amount:
      recruitment.payment_type === 'paid'
        ? recruitment.payment_amount ?? null
        : null,
    has_reward: Boolean(recruitment.has_reward),
    reward_details: recruitment.reward_details || '',
    available_dates: recruitment.available_dates ? recruitment.available_dates.map(date => ({ ...date })) : [],
    flexible_schedule_text: recruitment.flexible_schedule_text || '',
    is_fully_booked: Boolean(recruitment.is_fully_booked),
  });

export const DashboardPage = () => {
  const {
    user,
    loading,
    recruitments,
    profileData,
    setProfileData,
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
    selectedCancelPreset,
    handleSelectCancelPreset,
    cancelError,
    setCancelError,
    cancelSubmitting,
    handleOpenCancelModal,
    handleCloseCancelModal,
    handleCancelReservation,
  } = useDashboard();

  const createFormInitialData = useMemo(
    () => cloneRecruitmentFormData(dashboardInitialRecruitmentState),
    [showCreateModal],
  );

  const editingFormInitialData = useMemo(() => {
    if (!editingRecruitment) return null;
    return recruitmentToFormData(editingRecruitment);
  }, [editingRecruitment]);

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setEditingRecruitment(null);
  };

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
                {showProfileActions ? 'プロフィールを隠す' : 'プロフィールを表示'}
              </Button>
              {showProfileActions && (
                <div className={[styles.actionDropdown, styles.profileDropdown].join(' ')}>
                  <ProfileCard user={user} />
                  <div className={styles.profileDropdownActions}>
                    <Button variant="primary" onClick={handleOpenProfileModal}>
                      プロフィール編集
                    </Button>
                    <Button
                      variant="danger"
                      onClick={handleDeleteAccount}
                      disabled={deleteLoading}
                    >
                      {deleteLoading ? '削除中…' : 'アカウント削除'}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

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
              <div className={styles.presetReasonRow}>
                <select
                  className={styles.select}
                  value={selectedCancelPreset}
                  onChange={e => handleSelectCancelPreset(e.target.value)}
                >
                  <option value="">理由を選択してください</option>
                  <option value="システム障害">システム障害</option>
                  <option value="スタッフ体調不良">スタッフ体調不良</option>
                  <option value="ダブルブッキング">ダブルブッキング</option>
                  <option value="設備トラブル">設備トラブル</option>
                  <option value="その他">その他</option>
                </select>
              </div>
              <textarea
                id="cancel-reason"
                className={styles.textarea}
                placeholder="詳細を入力してください"
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
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="新規募集作成"
        size="lg"
      >
        {showCreateModal && (
          <RecruitmentForm
            initialData={createFormInitialData}
            onSubmit={handleCreateRecruitment}
            submitLabel="作成する"
            loading={createLoading}
            onCancel={() => setShowCreateModal(false)}
          />
        )}
      </Modal>

      {/* 募集編集モーダル */}
      {editingRecruitment && (
        <Modal
          isOpen={showEditModal}
          onClose={handleCloseEditModal}
          title="募集内容を編集"
          size="lg"
        >
          {editingFormInitialData && (
            <RecruitmentForm
              initialData={editingFormInitialData}
              onSubmit={data => handleUpdateRecruitment(editingRecruitment.id, data)}
              submitLabel="更新する"
              loading={editLoading}
              onCancel={handleCloseEditModal}
            />
          )}
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

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/auth';
import { useReservations } from '@/hooks/useReservations';
import { useRecruitments } from '@/recruitment';
import { supabase } from '@/lib/supabase';
import { isBeforeHoursBefore } from '@/utils/date';
import type { RecruitmentFormData } from '../components/RecruitmentForm';
import type {
  Recruitment,
  Student,
  Salon,
  GenderRequirement,
  HairLengthRequirement,
  PhotoShootRequirement,
  ModelExperienceRequirement,
  RecruitmentUpdate,
  ReservationWithDetails,
  ReservationStatus,
  ReservationMessage,
} from '@/types';

const initialRecruitmentState: RecruitmentFormData = {
  title: '',
  description: '',
  menus: [],
  gender_requirement: 'any' as GenderRequirement,
  hair_length_requirement: 'any' as HairLengthRequirement,
  treatment_duration: '',
  status: 'active' as const,
  photo_shoot_requirement: 'none' as PhotoShootRequirement,
  model_experience_requirement: 'any' as ModelExperienceRequirement,
  has_reward: false,
  reward_details: '',
  available_dates: [],
  flexible_schedule_text: '',
  is_fully_booked: false,
};

export const useDashboard = () => {
  const { user, updateProfile, deleteAccount } = useAuth();
  const navigate = useNavigate();
  const { fetchReservationsByStudent, fetchReservationsBySalon, updateReservationStatus } = useReservations();
  const { fetchRecruitmentsBySalonId, createRecruitment, updateRecruitment, deleteRecruitment } = useRecruitments();

  const [reservations, setReservations] = useState<ReservationWithDetails[]>([]);
  const [recruitments, setRecruitments] = useState<Recruitment[]>([]);
  const [loading, setLoading] = useState(true);

  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  const [profileData, setProfileData] = useState<Partial<Student & Salon>>({});
  const [editingRecruitment, setEditingRecruitment] = useState<Recruitment | null>(null);

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
          fetchReservationsBySalon(user.id),
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
          },
        )
        .subscribe(),
    );

    return () => {
      channels.forEach(channel => {
        supabase.removeChannel(channel);
      });
    };
  }, [reservations]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileActionsRef.current && !profileActionsRef.current.contains(event.target as Node)) {
        setShowProfileActions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleUpdateProfile = useCallback(async () => {
    setProfileLoading(true);
    try {
      await updateProfile(profileData);
      alert('プロフィールを更新しました');
      setShowProfileModal(false);
    } catch (error: any) {
      alert(error?.message || 'プロフィール更新に失敗しました');
    } finally {
      setProfileLoading(false);
    }
  }, [profileData, updateProfile]);

  const handleCreateRecruitment = useCallback(
    async (formData: RecruitmentFormData) => {
      if (!user) return;

      if (!formData.menus || formData.menus.length === 0) {
        alert('メニューを1つ以上選択してください');
        return;
      }

      if (!formData.title) {
        alert('タイトルを入力してください');
        return;
      }

      if (
        (formData.available_dates?.length ?? 0) === 0 &&
        !formData.flexible_schedule_text
      ) {
        alert('施術可能な日時を追加するか、文章で日時を指定してください');
        return;
      }

      setCreateLoading(true);
      try {
        await createRecruitment({
          ...formData,
          salon_id: user.id,
        });
        alert('募集を作成しました');
        setShowCreateModal(false);
        await loadDashboardData();
      } catch (error: any) {
        alert(error?.message || '募集作成に失敗しました');
      } finally {
        setCreateLoading(false);
      }
    },
    [createRecruitment, loadDashboardData, user],
  );

  const handleUpdateRecruitment = useCallback(async (id: string, formData: RecruitmentFormData) => {
    if (!id) return;

    if (!formData.title) {
      alert('タイトルを入力してください');
      return;
    }

    if (!formData.menus || formData.menus.length === 0) {
      alert('メニューを1つ以上選択してください');
      return;
    }

    if (
      (formData.available_dates?.length ?? 0) === 0 &&
      !formData.flexible_schedule_text
    ) {
      alert('施術可能な日時を追加するか、文章で日時を指定してください');
      return;
    }

    const originalRecruitment = recruitments.find(r => r.id === id);
    if (originalRecruitment) {
      const bookedDates = originalRecruitment.available_dates.filter(d => d.is_booked);
      const hasAllBookedDates = bookedDates.every(bookedDate =>
        formData.available_dates?.some(d => d.datetime === bookedDate.datetime),
      );

      if (!hasAllBookedDates) {
        alert('予約済みの日時は削除できません');
        return;
      }
    }

    setEditLoading(true);
    try {
      await updateRecruitment(id, formData as RecruitmentUpdate);
      alert('募集を更新しました');
      setShowEditModal(false);
      setEditingRecruitment(null);
      await loadDashboardData();
    } catch (error: any) {
      alert(error?.message || '募集更新に失敗しました');
    } finally {
      setEditLoading(false);
    }
  }, [loadDashboardData, recruitments, updateRecruitment]);

  const handleToggleRecruitmentStatus = useCallback(
    async (id: string, status: 'active' | 'closed') => {
      const action = status === 'active' ? '公開' : '非公開';
      if (window.confirm(`この募集を${action}にしますか?`)) {
        try {
          await updateRecruitment(id, { status });
          alert(`募集を${action}にしました`);
          await loadDashboardData();
        } catch (error: any) {
          alert(error?.message || `処理に失敗しました`);
        }
      }
    },
    [loadDashboardData, updateRecruitment],
  );

  const handleDeleteRecruitment = useCallback(
    async (id: string) => {
      if (
        window.confirm(
          'この募集を完全に削除しますか?関連する予約もすべて削除され、この操作は元に戻せません。',
        )
      ) {
        try {
          await deleteRecruitment(id);
          alert('募集を削除しました');
          await loadDashboardData();
        } catch (error: any) {
          alert(error?.message || '募集の削除に失敗しました');
        }
      }
    },
    [deleteRecruitment, loadDashboardData],
  );

  const handleOpenEditModal = useCallback((recruitment: Recruitment) => {
    setEditingRecruitment({ ...recruitment });
    setShowEditModal(true);
  }, []);

  const handleUpdateReservation = useCallback(
    async (id: string, status: ReservationStatus) => {
      const action = {
        confirmed: '承認',
        cancelled_by_salon: 'キャンセル',
      }[status as 'confirmed' | 'cancelled_by_salon'];

      if (action && window.confirm(`この予約を${action}しますか?`)) {
        try {
          await updateReservationStatus(id, status);
          alert(`予約を${action}しました。`);
          await loadDashboardData();
        } catch (error: any) {
          alert(error?.message || `予約の${action}に失敗しました。`);
        }
      }
    },
    [loadDashboardData, updateReservationStatus],
  );

  const handleOpenCancelModal = useCallback((reservation: ReservationWithDetails) => {
    setCancelReservationTarget(reservation);
    setCancelReason('');
    setCancelError('');
  }, []);

  const handleCloseCancelModal = useCallback(() => {
    if (cancelSubmitting) return;
    setCancelReservationTarget(null);
    setCancelReason('');
    setCancelError('');
  }, [cancelSubmitting]);

  const handleCancelReservation = useCallback(async () => {
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
    } catch (error: any) {
      alert(error?.message || '予約のキャンセルに失敗しました。');
    } finally {
      setCancelSubmitting(false);
    }
  }, [cancelReason, cancelReservationTarget, loadDashboardData, updateReservationStatus]);

  const toggleReservationDetails = useCallback((id: string) => {
    setExpandedReservations(prev => ({
      ...prev,
      [id]: !prev[id],
    }));
  }, []);

  const handleOpenChat = useCallback((reservation: ReservationWithDetails) => {
    setChatReservation(reservation);
    setIsChatOpen(true);
  }, []);

  const handleCloseChat = useCallback(() => {
    setIsChatOpen(false);
    setChatReservation(null);
  }, []);

  const handleDeleteAccount = useCallback(async () => {
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
      alert(error?.message || 'アカウントの削除に失敗しました');
    } finally {
      setDeleteLoading(false);
    }
  }, [deleteAccount, navigate]);

  const handleChatMessageActivity = useCallback(
    (message: ReservationMessage | null) => {
      if (!chatReservation) return;
      setLatestMessages(prev => ({
        ...prev,
        [chatReservation.id]: message,
      }));
    },
    [chatReservation],
  );

  const hasUnreadMessage = useCallback(
    (reservationId: string) => {
      if (!user) return false;
      const latest = latestMessages[reservationId];
      if (!latest) return false;
      return latest.sender_id !== user.id;
    },
    [latestMessages, user],
  );

  const handleOpenProfileModal = useCallback(() => {
    if (!user) return;
    setProfileData(user.profile);
    setShowProfileModal(true);
    setShowProfileActions(false);
  }, [user]);

  const pendingReservations = useMemo(
    () => reservations.filter(res => res.status === 'pending'),
    [reservations],
  );
  const confirmedReservations = useMemo(
    () => reservations.filter(res => res.status === 'confirmed'),
    [reservations],
  );
  const otherReservations = useMemo(
    () => reservations.filter(res => res.status !== 'pending' && res.status !== 'confirmed'),
    [reservations],
  );

  return {
    user,
    loading,
    reservations,
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
    cancelError,
    setCancelError,
    cancelSubmitting,
    handleOpenCancelModal,
    handleCloseCancelModal,
    handleCancelReservation,
  };
};

export type UseDashboardReturn = ReturnType<typeof useDashboard>;

export const dashboardInitialRecruitmentState = initialRecruitmentState;

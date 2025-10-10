// src/hooks/useReservations.ts
import { useState, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { Reservation, ReservationWithDetails, ReservationUpdate } from '@/types';

export const useReservations = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReservationsByStudent = useCallback(async (studentId: string): Promise<ReservationWithDetails[]> => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('reservations')
        .select(`
          *,
          student:students(*),
          recruitment:recruitments(*, salon:salons(*))
        `)
        .eq('student_id', studentId)
        .order('created_at', { ascending: false });

      if (error) throw new Error(error.message);
      return data || [];
    } catch (err: any) {
      const errorMessage = err.message || '予約情報の取得に失敗しました';
      setError(errorMessage);
      console.error('fetchReservationsByStudent error:', err);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchReservationsBySalon = useCallback(async (salonId: string): Promise<ReservationWithDetails[]> => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('reservations')
        .select(`
          *,
          student:students(*),
          recruitment:recruitments(*, salon:salons(*))
        `)
        .eq('salon_id', salonId)
        .order('created_at', { ascending: false });

      if (error) throw new Error(error.message);
      return data || [];
    } catch (err: any) {
      const errorMessage = err.message || '予約情報の取得に失敗しました';
      setError(errorMessage);
      console.error('fetchReservationsBySalon error:', err);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const createReservation = useCallback(async (
    recruitmentId: string,
    studentId: string,
    salonId: string,
    reservationDatetime: string,
    message?: string
  ): Promise<string> => {
    setLoading(true);
    setError(null);
    try {
      // データベースのmake_reservation関数を使用
      const { data, error } = await supabase.rpc('make_reservation', {
        p_recruitment_id: recruitmentId,
        p_student_id: studentId,
        p_salon_id: salonId,
        p_reservation_datetime: reservationDatetime,
        p_message: message || null,
      });

      if (error) {
        // エラーメッセージを日本語化
        let errorMessage = error.message;
        if (errorMessage.includes('already booked')) {
          errorMessage = 'この日時はすでに予約されています';
        } else if (errorMessage.includes('not found or closed')) {
          errorMessage = '募集が見つからないか、募集が終了しています';
        } else if (errorMessage.includes('Invalid reservation datetime')) {
          errorMessage = '選択された日時は予約できません';
        }
        throw new Error(errorMessage);
      }

      if (data) {
        const { error: closeError } = await supabase
          .from('recruitments')
          .update({ status: 'closed', is_fully_booked: true })
          .eq('id', recruitmentId);

        if (closeError) {
          console.error('Failed to close recruitment after reservation:', closeError);
        }
      }
      
      return data; // 予約IDを返す
    } catch (err: any) {
      const errorMessage = err.message || '予約の作成に失敗しました';
      setError(errorMessage);
      console.error('createReservation error:', err);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateReservationStatus = useCallback(async (
    id: string,
    status: ReservationUpdate['status']
  ): Promise<Reservation> => {
    setLoading(true);
    setError(null);
    try {
      // ステータスを更新
      const { data: updatedReservation, error } = await supabase
        .from('reservations')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw new Error(error.message);

      // キャンセルされた場合はavailable_datesを更新
      if (status === 'cancelled_by_salon' || status === 'cancelled_by_student') {
        const { error: cancelError } = await supabase.rpc('cancel_reservation', {
          p_reservation_id: id
        });
        
        if (cancelError) {
          console.error('cancel_reservation error:', cancelError);
          // キャンセル処理のエラーは警告のみとして扱う
          console.warn('予約の日時を空き枠に戻す処理に失敗しました');
        }

        if (updatedReservation?.recruitment_id) {
          const recruitmentId = updatedReservation.recruitment_id;
          const { data: activeReservations, error: activeError } = await supabase
            .from('reservations')
            .select('id')
            .eq('recruitment_id', recruitmentId)
            .in('status', ['pending', 'confirmed']);

          if (activeError) {
            console.error('Failed to check active reservations:', activeError);
          } else if ((activeReservations?.length || 0) === 0) {
            const { error: reopenError } = await supabase
              .from('recruitments')
              .update({ status: 'active', is_fully_booked: false })
              .eq('id', recruitmentId);

            if (reopenError) {
              console.error('Failed to reopen recruitment:', reopenError);
            }
          }
        }
      }
      
      return updatedReservation;
    } catch (err: any) {
      const errorMessage = err.message || '予約のステータス更新に失敗しました';
      setError(errorMessage);
      console.error('updateReservationStatus error:', err);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  return useMemo(() => ({
    loading,
    error,
    fetchReservationsByStudent,
    fetchReservationsBySalon,
    createReservation,
    updateReservationStatus,
  }), [
    loading,
    error,
    fetchReservationsByStudent,
    fetchReservationsBySalon,
    createReservation,
    updateReservationStatus,
  ]);
};

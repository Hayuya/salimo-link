// src/hooks/useReservations.ts
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Reservation, ReservationWithDetails, ReservationUpdate } from '@/types';

export const useReservations = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReservationsByStudent = async (studentId: string): Promise<ReservationWithDetails[]> => {
    setLoading(true);
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

      if (error) throw error;
      return data || [];
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const fetchReservationsBySalon = async (salonId: string): Promise<ReservationWithDetails[]> => {
    setLoading(true);
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

      if (error) throw error;
      return data || [];
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const createReservation = async (
    recruitmentId: string,
    studentId: string,
    salonId: string,
    reservationDatetime: string,
    message?: string
  ): Promise<string> => {
    setLoading(true);
    try {
      // データベースのmake_reservation関数を使用
      const { data, error } = await supabase.rpc('make_reservation', {
        p_recruitment_id: recruitmentId,
        p_student_id: studentId,
        p_salon_id: salonId,
        p_reservation_datetime: reservationDatetime,
        p_message: message || null,
      });

      if (error) throw error;
      return data; // 予約IDを返す
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateReservationStatus = async (
    id: string,
    status: ReservationUpdate['status']
  ): Promise<Reservation> => {
    setLoading(true);
    try {
      // ステータスを更新
      const { data: updatedReservation, error } = await supabase
        .from('reservations')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;

      // キャンセルされた場合はavailable_datesを更新
      if (status === 'cancelled_by_salon' || status === 'cancelled_by_student') {
        const { error: cancelError } = await supabase.rpc('cancel_reservation', {
          p_reservation_id: id
        });
        
        if (cancelError) throw cancelError;
      }
      
      return updatedReservation;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    fetchReservationsByStudent,
    fetchReservationsBySalon,
    createReservation,
    updateReservationStatus,
  };
};
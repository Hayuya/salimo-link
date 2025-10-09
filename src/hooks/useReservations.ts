// src/hooks/useReservations.ts
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Reservation, ReservationWithDetails, ReservationInsert, ReservationUpdate } from '@/types';

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
          recruitment_slot:recruitment_slots(*, salon:salons(*)),
          available_slot:available_slots(*)
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
          recruitment_slot:recruitment_slots(*, salon:salons(*)),
          available_slot:available_slots(*)
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

  const createReservation = async (reservationData: ReservationInsert): Promise<Reservation> => {
    setLoading(true);
    try {
      // トランザクションで予約作成とスロットの更新を同時に行う
      const { data, error } = await supabase.rpc('create_reservation_and_book_slot', {
        p_slot_id: reservationData.slot_id,
        p_student_id: reservationData.student_id,
        p_salon_id: reservationData.salon_id,
        p_recruitment_slot_id: reservationData.recruitment_slot_id,
        p_message: reservationData.message,
      });

      if (error) throw error;
      return data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateReservationStatus = async (id: string, status: ReservationUpdate['status']): Promise<Reservation> => {
    setLoading(true);
    try {
      const { data: updatedReservation, error } = await supabase
        .from('reservations')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;

      // キャンセルされた場合はスロットを再度利用可能にする
      if (status === 'cancelled_by_salon' || status === 'cancelled_by_student') {
        const { error: slotError } = await supabase
          .from('available_slots')
          .update({ is_booked: false })
          .eq('id', updatedReservation.slot_id);
        if (slotError) throw slotError;
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
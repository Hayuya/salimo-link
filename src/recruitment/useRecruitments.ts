// src/recruitment/useRecruitments.ts
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import {
  RecruitmentSlot,
  RecruitmentSlotWithDetails,
  RecruitmentSlotInsert,
  RecruitmentSlotUpdate,
} from '@/types';

export const useRecruitments = () => {
  const [recruitments, setRecruitments] = useState<RecruitmentSlotWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRecruitments = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('recruitment_slots')
        .select(`
          *,
          salon:salons(*),
          available_slots(*)
        `)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRecruitments(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecruitmentById = async (id: string): Promise<RecruitmentSlotWithDetails | null> => {
    try {
      const { data, error } = await supabase
        .from('recruitment_slots')
        .select(`
          *,
          salon:salons(*),
          available_slots(*)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (err: any) {
      throw err;
    }
  };

  const fetchRecruitmentsBySalonId = async (salonId: string): Promise<RecruitmentSlot[]> => {
    try {
      const { data, error } = await supabase
        .from('recruitment_slots')
        .select('*')
        .eq('salon_id', salonId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (err: any) {
      throw err;
    }
  };

  const createRecruitment = async (data: RecruitmentSlotInsert): Promise<RecruitmentSlot> => {
    try {
      const { available_slots, ...recruitmentData } = data;

      // 1. 募集スロットを作成
      const { data: newRecruitment, error: recruitmentError } = await supabase
        .from('recruitment_slots')
        .insert(recruitmentData)
        .select()
        .single();
      
      if (recruitmentError) throw recruitmentError;

      // 2. 利用可能な日時スロットを作成
      const slotInsertData = available_slots.map(slot => ({
        recruitment_slot_id: newRecruitment.id,
        slot_time: slot,
      }));

      const { error: slotsError } = await supabase
        .from('available_slots')
        .insert(slotInsertData);

      if (slotsError) throw slotsError;

      return newRecruitment;
    } catch (err: any) {
      throw err;
    }
  };

  const updateRecruitment = async (id: string, data: RecruitmentSlotUpdate): Promise<RecruitmentSlot> => {
    try {
      const { data: updatedRecruitment, error } = await supabase
        .from('recruitment_slots')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return updatedRecruitment;
    } catch (err: any) {
      throw err;
    }
  };

  const deleteRecruitment = async (id: string): Promise<void> => {
    try {
      const { error } = await supabase
        .from('recruitment_slots')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (err: any) {
      throw err;
    }
  };

  useEffect(() => {
    fetchRecruitments();
  }, []);

  return {
    recruitments,
    loading,
    error,
    fetchRecruitments,
    fetchRecruitmentById,
    fetchRecruitmentsBySalonId,
    createRecruitment,
    updateRecruitment,
    deleteRecruitment,
  };
};
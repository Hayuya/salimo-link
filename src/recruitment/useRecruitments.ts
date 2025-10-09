// src/recruitment/useRecruitments.ts
import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import {
  Recruitment,
  RecruitmentWithDetails,
  RecruitmentInsert,
  RecruitmentUpdate,
} from '@/types';

export const useRecruitments = () => {
  const [recruitments, setRecruitments] = useState<RecruitmentWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRecruitments = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('recruitments')
        .select(`
          *,
          salon:salons(*)
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
  }, []);

  const fetchRecruitmentById = useCallback(async (id: string): Promise<RecruitmentWithDetails | null> => {
    try {
      const { data, error } = await supabase
        .from('recruitments')
        .select(`
          *,
          salon:salons(*)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (err: any) {
      throw err;
    }
  }, []);

  const fetchRecruitmentsBySalonId = useCallback(async (salonId: string): Promise<Recruitment[]> => {
    try {
      const { data, error } = await supabase
        .from('recruitments')
        .select('*')
        .eq('salon_id', salonId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (err: any) {
      throw err;
    }
  }, []);

  const createRecruitment = useCallback(async (data: RecruitmentInsert): Promise<Recruitment> => {
    try {
      const { data: newRecruitment, error } = await supabase
        .from('recruitments')
        .insert(data)
        .select()
        .single();

      if (error) throw error;
      return newRecruitment;
    } catch (err: any) {
      throw err;
    }
  }, []);

  const updateRecruitment = useCallback(async (id: string, data: RecruitmentUpdate): Promise<Recruitment> => {
    try {
      const { data: updatedRecruitment, error } = await supabase
        .from('recruitments')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return updatedRecruitment;
    } catch (err: any) {
      throw err;
    }
  }, []);

  const deleteRecruitment = useCallback(async (id: string): Promise<void> => {
    try {
      const { error } = await supabase
        .from('recruitments')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (err: any) {
      throw err;
    }
  }, []);

  useEffect(() => {
    fetchRecruitments();
  }, [fetchRecruitments]);

  return useMemo(() => ({
    recruitments,
    loading,
    error,
    fetchRecruitments,
    fetchRecruitmentById,
    fetchRecruitmentsBySalonId,
    createRecruitment,
    updateRecruitment,
    deleteRecruitment,
  }), [
    recruitments,
    loading,
    error,
    fetchRecruitments,
    fetchRecruitmentById,
    fetchRecruitmentsBySalonId,
    createRecruitment,
    updateRecruitment,
    deleteRecruitment,
  ]);
};

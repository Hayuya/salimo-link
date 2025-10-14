// src/recruitment/useRecruitments.ts
import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import {
  Recruitment,
  RecruitmentWithDetails,
  RecruitmentInsert,
  RecruitmentUpdate,
  AvailableDate,
} from '@/types';

export const useRecruitments = () => {
  const [recruitments, setRecruitments] = useState<RecruitmentWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRecruitments = useCallback(async () => {
    setLoading(true);
    try {
      const { error: normalizeError } = await supabase.rpc('normalize_all_recruitments');
      if (normalizeError) {
        console.error('normalize_all_recruitments error:', normalizeError);
      }

      const { data, error } = await supabase
        .from('recruitments')
        .select(`
          *,
          salon:salons(*)
        `)
        .eq('status', 'active')
        .eq('is_fully_booked', false)
        .order('created_at', { ascending: false });

      if (error) throw error;
      const filteredRecruitments = (data || [])
        .filter(recruitment => {
          if (recruitment.status !== 'active') return false;
          if (recruitment.is_fully_booked) return false;
          const flexibleText = (recruitment.flexible_schedule_text || '').trim();
          const hasFlexibleSchedule = flexibleText.length > 0;
          if (!Array.isArray(recruitment.available_dates)) return hasFlexibleSchedule;
          const hasAvailableSlot = (recruitment.available_dates as AvailableDate[]).some(
            (date: AvailableDate) => !date.is_booked
          );
          return hasAvailableSlot || hasFlexibleSchedule;
        })
        .map(rest => rest as RecruitmentWithDetails);
      setRecruitments(filteredRecruitments);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchRecruitmentById = useCallback(async (id: string): Promise<RecruitmentWithDetails | null> => {
    try {
      const { error: normalizeError } = await supabase.rpc('normalize_recruitment_schedule', {
        p_recruitment_id: id,
      });
      if (normalizeError) {
        console.error('normalize_recruitment_schedule error:', normalizeError);
      }

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
      const { error: normalizeError } = await supabase.rpc('normalize_all_recruitments');
      if (normalizeError) {
        console.error('normalize_all_recruitments error:', normalizeError);
      }

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
        .insert({
          ...data,
          is_fully_booked: data.is_fully_booked ?? false,
        })
        .select()
        .single();

      if (error) throw error;

      if (newRecruitment?.id) {
        const { error: normalizeError } = await supabase.rpc('normalize_recruitment_schedule', {
          p_recruitment_id: newRecruitment.id,
        });
        if (normalizeError) {
          console.error('normalize_recruitment_schedule error:', normalizeError);
        }
      }

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

      const { error: normalizeError } = await supabase.rpc('normalize_recruitment_schedule', {
        p_recruitment_id: id,
      });
      if (normalizeError) {
        console.error('normalize_recruitment_schedule error:', normalizeError);
      }

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

  useEffect(() => {
    const channel = supabase
      .channel('recruitments-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'recruitments',
        },
        () => {
          fetchRecruitments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
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

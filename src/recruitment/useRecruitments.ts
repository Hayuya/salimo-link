import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import {
  RecruitmentSlot,
  RecruitmentSlotWithSalon,
  RecruitmentSlotInsert,
  RecruitmentSlotUpdate,
} from '@/types';

/**
 * 募集情報を管理するカスタムフック
 */
export const useRecruitments = () => {
  const [recruitments, setRecruitments] = useState<RecruitmentSlotWithSalon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * 全ての募集情報を取得（アクティブなもののみ）
   */
  const fetchRecruitments = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('recruitment_slots')
        .select(`
          *,
          salon:salons(*)
        `)
        .eq('status', 'active')
        .order('deadline_date', { ascending: true });

      if (error) throw error;

      setRecruitments(data || []);
      setError(null);
    } catch (err: any) {
      console.error('募集情報の取得エラー:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * 特定の募集情報を取得
   */
  const fetchRecruitmentById = async (id: string): Promise<RecruitmentSlotWithSalon | null> => {
    try {
      const { data, error } = await supabase
        .from('recruitment_slots')
        .select(`
          *,
          salon:salons(*)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (err: any) {
      console.error('募集情報の取得エラー:', err);
      throw err;
    }
  };

  /**
   * サロンの募集情報を取得
   */
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
      console.error('サロンの募集情報取得エラー:', err);
      throw err;
    }
  };

  /**
   * 新しい募集を作成
   */
  const createRecruitment = async (data: RecruitmentSlotInsert): Promise<RecruitmentSlot> => {
    try {
      const { data: newRecruitment, error } = await supabase
        .from('recruitment_slots')
        .insert(data)
        .select()
        .single();

      if (error) throw error;
      return newRecruitment;
    } catch (err: any) {
      console.error('募集作成エラー:', err);
      throw err;
    }
  };

  /**
   * 募集情報を更新
   */
  const updateRecruitment = async (
    id: string,
    data: RecruitmentSlotUpdate
  ): Promise<RecruitmentSlot> => {
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
      console.error('募集更新エラー:', err);
      throw err;
    }
  };

  /**
   * 募集を削除
   */
  const deleteRecruitment = async (id: string): Promise<void> => {
    try {
      const { error } = await supabase
        .from('recruitment_slots')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (err: any) {
      console.error('募集削除エラー:', err);
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
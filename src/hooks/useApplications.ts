import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import {
  Application,
  ApplicationWithDetails,
  ApplicationInsert,
  ApplicationUpdate,
} from '@/types';

/**
 * 応募情報を管理するカスタムフック
 */
export const useApplications = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * 学生の応募一覧を取得
   */
  const fetchApplicationsByStudent = async (studentId: string): Promise<ApplicationWithDetails[]> => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('applications')
        .select(`
          *,
          student:students(*),
          recruitment_slot:recruitment_slots(
            *,
            salon:salons(*)
          )
        `)
        .eq('student_id', studentId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setError(null);
      return data || [];
    } catch (err: any) {
      console.error('応募一覧取得エラー:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * 募集の応募一覧を取得
   */
  const fetchApplicationsByRecruitment = async (recruitmentId: string): Promise<ApplicationWithDetails[]> => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('applications')
        .select(`
          *,
          student:students(*),
          recruitment_slot:recruitment_slots(
            *,
            salon:salons(*)
          )
        `)
        .eq('recruitment_slot_id', recruitmentId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setError(null);
      return data || [];
    } catch (err: any) {
      console.error('応募一覧取得エラー:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * 特定の応募を取得
   */
  const fetchApplicationById = async (id: string): Promise<ApplicationWithDetails | null> => {
    try {
      const { data, error } = await supabase
        .from('applications')
        .select(`
          *,
          student:students(*),
          recruitment_slot:recruitment_slots(
            *,
            salon:salons(*)
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (err: any) {
      console.error('応募取得エラー:', err);
      throw err;
    }
  };

  /**
   * 学生が特定の募集に応募済みかチェック
   */
  const checkIfApplied = async (studentId: string, recruitmentId: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('applications')
        .select('id')
        .eq('student_id', studentId)
        .eq('recruitment_slot_id', recruitmentId)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 = not found
      return !!data;
    } catch (err: any) {
      console.error('応募確認エラー:', err);
      return false;
    }
  };

  /**
   * 新しい応募を作成
   */
  const createApplication = async (data: ApplicationInsert): Promise<Application> => {
    try {
      setLoading(true);
      const { data: newApplication, error } = await supabase
        .from('applications')
        .insert(data)
        .select()
        .single();

      if (error) throw error;
      setError(null);
      return newApplication;
    } catch (err: any) {
      console.error('応募作成エラー:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * 応募を更新
   */
  const updateApplication = async (
    id: string,
    data: ApplicationUpdate
  ): Promise<Application> => {
    try {
      setLoading(true);
      const { data: updatedApplication, error } = await supabase
        .from('applications')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      setError(null);
      return updatedApplication;
    } catch (err: any) {
      console.error('応募更新エラー:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * 応募を削除（辞退）
   */
  const deleteApplication = async (id: string): Promise<void> => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('applications')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setError(null);
    } catch (err: any) {
      console.error('応募削除エラー:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    fetchApplicationsByStudent,
    fetchApplicationsByRecruitment,
    fetchApplicationById,
    checkIfApplied,
    createApplication,
    updateApplication,
    deleteApplication,
  };
};
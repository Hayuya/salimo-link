import React, { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import {
  AuthUser,
  AuthContextType,
  UserType,
  StudentInsert,
  SalonInsert,
  StudentUpdate,
  SalonUpdate,
} from '@/types';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 初期セッションチェック
    checkUser();

    // 認証状態の変更を監視
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        loadUserProfile(session.user.id, session.user.email!);
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const checkUser = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user) {
        await loadUserProfile(session.user.id, session.user.email!);
      } else {
        setLoading(false);
      }
    } catch (error) {
      console.error('セッション確認エラー:', error);
      setLoading(false);
    }
  };

  const loadUserProfile = async (userId: string, email: string) => {
    try {
      // 学生として検索
      const { data: studentData, error: studentError } = await supabase
        .from('students')
        .select('*')
        .eq('id', userId)
        .single();

      if (!studentError && studentData) {
        setUser({
          id: userId,
          email,
          userType: 'student',
          profile: studentData,
        });
        setLoading(false);
        return;
      }

      // サロンとして検索
      const { data: salonData, error: salonError } = await supabase
        .from('salons')
        .select('*')
        .eq('id', userId)
        .single();

      if (!salonError && salonData) {
        setUser({
          id: userId,
          email,
          userType: 'salon',
          profile: salonData,
        });
        setLoading(false);
        return;
      }

      // プロフィールが見つからない場合
      console.error('ユーザープロフィールが見つかりません');
      setUser(null);
      setLoading(false);
    } catch (error) {
      console.error('プロフィール読み込みエラー:', error);
      setUser(null);
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        await loadUserProfile(data.user.id, data.user.email!);
      }
    } catch (error: any) {
      console.error('ログインエラー:', error);
      throw new Error(error.message || 'ログインに失敗しました');
    }
  };

  const signUp = async (
    email: string,
    password: string,
    userType: UserType,
    profileData: StudentInsert | SalonInsert
  ) => {
    try {
      // プロフィールデータをメタデータとして含めてユーザー登録
      // Database Triggerがこのメタデータを使用してプロフィールを自動作成
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            user_type: userType,
            ...profileData,
          },
        },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('ユーザー作成に失敗しました');

      // メール確認が必要な場合は、確認を促すメッセージを表示
      if (authData.user && !authData.session) {
        alert('確認メールを送信しました。メールを確認してアカウントを有効化してください。');
      }

      // セッションがあればプロフィールを読み込み（メール確認不要の場合）
      if (authData.session) {
        await loadUserProfile(authData.user.id, authData.user.email!);
      }
    } catch (error: any) {
      console.error('新規登録エラー:', error);
      throw new Error(error.message || '新規登録に失敗しました');
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
    } catch (error: any) {
      console.error('ログアウトエラー:', error);
      throw new Error(error.message || 'ログアウトに失敗しました');
    }
  };

  const updateProfile = async (data: StudentUpdate | SalonUpdate) => {
    if (!user) throw new Error('ログインしていません');

    try {
      const tableName = user.userType === 'student' ? 'students' : 'salons';
      const { error } = await supabase
        .from(tableName)
        .update(data)
        .eq('id', user.id);

      if (error) throw error;

      // プロフィール再読み込み
      await loadUserProfile(user.id, user.email);
    } catch (error: any) {
      console.error('プロフィール更新エラー:', error);
      throw new Error(error.message || 'プロフィール更新に失敗しました');
    }
  };

  const value = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
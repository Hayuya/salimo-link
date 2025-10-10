import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
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
      console.log('Auth state changed:', _event, session?.user?.id);
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

      console.log('Current session:', session?.user?.id);

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
      console.log('Loading profile for user:', userId);

      // 学生として検索
      const { data: studentData, error: studentError } = await supabase
        .from('students')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      console.log('Student query result:', { studentData, studentError });

      if (studentError) {
        console.error('Student query error:', studentError);
      }

      if (studentData) {
        console.log('Found student profile:', studentData);
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
        .maybeSingle();

      console.log('Salon query result:', { salonData, salonError });

      if (salonError) {
        console.error('Salon query error:', salonError);
      }

      if (salonData) {
        console.log('Found salon profile:', salonData);
        setUser({
          id: userId,
          email,
          userType: 'salon',
          profile: salonData,
        });
        setLoading(false);
        return;
      }

      // プロファイルが見つからない場合 - 手動作成を試みる
      console.warn('プロファイルが見つかりません。自動作成を試みます...');
      
      // auth.usersからメタデータを取得
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
      
      if (authError) {
        console.error('Auth user fetch error:', authError);
        throw new Error('ユーザー情報の取得に失敗しました');
      }

      if (authUser && authUser.user_metadata) {
        const userType = authUser.user_metadata.user_type as UserType;
        console.log('User metadata:', authUser.user_metadata);

        if (userType === 'student') {
          // 学生プロファイルを手動作成
          const { data: newStudent, error: createError } = await supabase
            .from('students')
            .insert({
              id: userId,
              email: email,
              name: authUser.user_metadata.name || 'Student User',
              school_name: authUser.user_metadata.school_name || null,
              instagram_url: authUser.user_metadata.instagram_url || null,
              avatar_url: authUser.user_metadata.avatar_url || null,
            })
            .select()
            .single();

          if (createError) {
            console.error('Student profile creation error:', createError);
            throw new Error('学生プロファイルの作成に失敗しました');
          }

          console.log('Created student profile:', newStudent);
          setUser({
            id: userId,
            email,
            userType: 'student',
            profile: newStudent,
          });
          setLoading(false);
          return;
        } else if (userType === 'salon') {
          // サロンプロファイルを手動作成
          const { data: newSalon, error: createError } = await supabase
            .from('salons')
            .insert({
              id: userId,
              email: email,
              salon_name: authUser.user_metadata.salon_name || 'Salon User',
              description: authUser.user_metadata.description || null,
              address: authUser.user_metadata.address || null,
              phone_number: authUser.user_metadata.phone_number || null,
              website_url: authUser.user_metadata.website_url || null,
              photo_url: authUser.user_metadata.photo_url || null,
            })
            .select()
            .single();

          if (createError) {
            console.error('Salon profile creation error:', createError);
            throw new Error('サロンプロファイルの作成に失敗しました');
          }

          console.log('Created salon profile:', newSalon);
          setUser({
            id: userId,
            email,
            userType: 'salon',
            profile: newSalon,
          });
          setLoading(false);
          return;
        }
      }

      // それでも見つからない場合はエラー
      console.error('プロファイルの作成に失敗しました');
      alert('プロファイルの読み込みに失敗しました。ログアウトして再度ログインしてください。');
      setUser(null);
      setLoading(false);
    } catch (error) {
      console.error('プロファイル読み込みエラー:', error);
      alert('プロファイルの読み込み中にエラーが発生しました。詳細はコンソールを確認してください。');
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
      console.log('Sign up started with:', { email, userType, profileData });

      // 1. Supabase Auth でユーザー作成（メタデータも保存）
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

      console.log('Sign up result:', { authData, authError });

      if (authError) throw authError;
      if (!authData.user) throw new Error('ユーザー作成に失敗しました');

      // 2. プロファイルを手動で作成
      console.log('Creating profile for user:', authData.user.id);

      if (userType === 'student') {
        const studentData = profileData as StudentInsert;
        const { data: newStudent, error: profileError } = await supabase
          .from('students')
          .insert({
            id: authData.user.id,
            email: authData.user.email!,
            name: studentData.name || 'Student User',
            school_name: studentData.school_name || null,
            instagram_url: studentData.instagram_url || null,
            avatar_url: studentData.avatar_url || null,
          })
          .select()
          .single();

        if (profileError) {
          console.error('Student profile creation error:', profileError);
          // プロファイル作成に失敗した場合、作成したユーザーを削除
          await supabase.auth.admin.deleteUser(authData.user.id);
          throw new Error('学生プロファイルの作成に失敗しました');
        }

        console.log('Created student profile:', newStudent);

        // メール確認が必要な場合
        if (!authData.session) {
          alert('確認メールを送信しました。メールを確認してアカウントを有効化してください。');
          return;
        }

        // セッションがある場合は即座にログイン状態にする
        setUser({
          id: authData.user.id,
          email: authData.user.email!,
          userType: 'student',
          profile: newStudent,
        });
        setLoading(false);

      } else if (userType === 'salon') {
        const salonData = profileData as SalonInsert;
        const { data: newSalon, error: profileError } = await supabase
          .from('salons')
          .insert({
            id: authData.user.id,
            email: authData.user.email!,
            salon_name: salonData.salon_name || 'Salon User',
            description: salonData.description || null,
            address: salonData.address || null,
            phone_number: salonData.phone_number || null,
            website_url: salonData.website_url || null,
            photo_url: salonData.photo_url || null,
          })
          .select()
          .single();

        if (profileError) {
          console.error('Salon profile creation error:', profileError);
          // プロファイル作成に失敗した場合、作成したユーザーを削除
          await supabase.auth.admin.deleteUser(authData.user.id);
          throw new Error('サロンプロファイルの作成に失敗しました');
        }

        console.log('Created salon profile:', newSalon);

        // メール確認が必要な場合
        if (!authData.session) {
          alert('確認メールを送信しました。メールを確認してアカウントを有効化してください。');
          return;
        }

        // セッションがある場合は即座にログイン状態にする
        setUser({
          id: authData.user.id,
          email: authData.user.email!,
          userType: 'salon',
          profile: newSalon,
        });
        setLoading(false);
      }

      console.log('Sign up completed successfully');
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

      // プロファイル再読み込み
      await loadUserProfile(user.id, user.email);
    } catch (error: any) {
      console.error('プロファイル更新エラー:', error);
      throw new Error(error.message || 'プロファイル更新に失敗しました');
    }
  };

  const deleteAccount = async () => {
    if (!user) throw new Error('ログインしていません');

    const { error: rpcError } = await supabase.rpc('delete_user_data', {
      p_user_id: user.id,
    });

    if (rpcError) {
      console.error('Supabase RPC error:', rpcError);
      throw new Error(rpcError.message || 'ユーザーデータの削除に失敗しました');
    }

    const { error: authError } = await supabase.auth.admin.deleteUser(user.id);

    if (authError) {
      console.error('Auth delete error:', authError);
      throw new Error(authError.message || 'アカウントの削除に失敗しました');
    }

    await supabase.auth.signOut();
    setUser(null);
  };

  const value = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    updateProfile,
    deleteAccount,
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
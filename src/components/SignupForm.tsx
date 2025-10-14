import { useState, FormEvent, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/auth';
import { Input } from './Input';
import { Button } from './Button';
import { UserType } from '@/types';
import { isValidEmail, isSchoolEmail, isValidPassword, isValidPhoneNumber } from '@/utils/validators';
import styles from './SignupForm.module.css';

export const SignupForm = () => {
  const location = useLocation();
  const [userType, setUserType] = useState<UserType>(() => {
    const params = new URLSearchParams(location.search);
    return params.get('role') === 'salon' ? 'salon' : 'student';
  });
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // 学生用フィールド
  const [studentName, setStudentName] = useState('');
  const [schoolName, setSchoolName] = useState('');
  const [studentPhone, setStudentPhone] = useState('');
  
  // サロン用フィールド
  const [salonName, setSalonName] = useState('');
  const [address, setAddress] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [salonPhone, setSalonPhone] = useState('');
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  
  const { signUp } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const roleParam = params.get('role');
    setUserType(roleParam === 'salon' ? 'salon' : 'student');
  }, [location.search]);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    // 共通バリデーション
    if (!email) {
      newErrors.email = 'メールアドレスを入力してください';
    } else if (!isValidEmail(email)) {
      newErrors.email = '有効なメールアドレスを入力してください';
    } else if (userType === 'student' && !isSchoolEmail(email)) {
      newErrors.email = '学校発行のメールアドレス（.ac.jp）を使用してください';
    }

    if (!password) {
      newErrors.password = 'パスワードを入力してください';
    } else if (!isValidPassword(password)) {
      newErrors.password = 'パスワードは8文字以上である必要があります';
    }

    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'パスワードが一致しません';
    }

    // 学生用バリデーション
    if (userType === 'student') {
      if (!studentName) {
        newErrors.studentName = '名前を入力してください';
      }
      if (!schoolName) {
        newErrors.schoolName = '学校名を入力してください';
      }
      if (!studentPhone) {
        newErrors.studentPhone = '電話番号を入力してください';
      } else if (!isValidPhoneNumber(studentPhone)) {
        newErrors.studentPhone = '有効な電話番号を入力してください（例: 09012345678）';
      }
    }

    // サロン用バリデーション
    if (userType === 'salon') {
      if (!salonName) {
        newErrors.salonName = 'サロン名を入力してください';
      }
      if (!address) {
        newErrors.address = '住所を入力してください';
      }
      if (!salonPhone) {
        newErrors.salonPhone = '電話番号を入力してください';
      } else if (!isValidPhoneNumber(salonPhone)) {
        newErrors.salonPhone = '有効な電話番号を入力してください（例: 0312345678）';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (!validate()) return;

    setLoading(true);
    try {
      const profileData = userType === 'student'
        ? {
            id: '',
            email,
            name: studentName,
            school_name: schoolName,
            phone_number: studentPhone,
          }
        : {
            id: '',
            email,
            salon_name: salonName,
            address,
            phone_number: salonPhone,
            website_url: websiteUrl || undefined,
          };

      await signUp(email, password, userType, profileData);
      
      // 登録成功メッセージを表示してログインページへ
      alert('登録が完了しました！メールを確認してアカウントを有効化してください。');
      navigate('/login');
    } catch (error: any) {
      setErrors({ general: error.message || '新規登録に失敗しました' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      {/* ユーザータイプ選択 */}
      <div className={styles.userTypeSelector}>
        <button
          type="button"
          className={`${styles.userTypeButton} ${userType === 'student' ? styles.active : ''}`}
          onClick={() => setUserType('student')}
        >
          学生として登録
        </button>
        <button
          type="button"
          className={`${styles.userTypeButton} ${userType === 'salon' ? styles.active : ''}`}
          onClick={() => setUserType('salon')}
        >
          サロンとして登録
        </button>
      </div>

      {/* 共通フィールド */}
      <Input
        type="email"
        label="メールアドレス"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        error={errors.email}
        placeholder={userType === 'student' ? 'student@university.ac.jp' : 'salon@example.com'}
        required
        fullWidth
      />

      <Input
        type="password"
        label="パスワード"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        error={errors.password}
        placeholder="8文字以上"
        required
        fullWidth
      />

      <Input
        type="password"
        label="パスワード（確認）"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        error={errors.confirmPassword}
        placeholder="もう一度入力してください"
        required
        fullWidth
      />

      {/* 学生用フィールド */}
      {userType === 'student' && (
        <>
          <Input
            type="text"
            label="名前"
            value={studentName}
            onChange={(e) => setStudentName(e.target.value)}
            error={errors.studentName}
            placeholder="山田 太郎"
            required
            fullWidth
          />

          <Input
            type="text"
            label="学校名"
            value={schoolName}
            onChange={(e) => setSchoolName(e.target.value)}
            error={errors.schoolName}
            placeholder="〇〇大学"
            required
            fullWidth
          />

          <Input
            type="tel"
            label="電話番号"
            value={studentPhone}
            onChange={(e) => setStudentPhone(e.target.value)}
            error={errors.studentPhone}
            placeholder="09012345678"
            required
            fullWidth
          />
        </>
      )}

      {/* サロン用フィールド */}
      {userType === 'salon' && (
        <>
          <Input
            type="text"
            label="サロン名"
            value={salonName}
            onChange={(e) => setSalonName(e.target.value)}
            error={errors.salonName}
            placeholder="〇〇美容室"
            required
            fullWidth
          />

          <Input
            type="text"
            label="住所"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            error={errors.address}
            placeholder="東京都渋谷区..."
            required
            fullWidth
          />

          <Input
            type="tel"
            label="電話番号"
            value={salonPhone}
            onChange={(e) => setSalonPhone(e.target.value)}
            error={errors.salonPhone}
            placeholder="0312345678"
            required
            fullWidth
          />

          <Input
            type="url"
            label="WEBサイトURL（任意）"
            value={websiteUrl}
            onChange={(e) => setWebsiteUrl(e.target.value)}
            placeholder="https://example.com"
            fullWidth
          />
        </>
      )}

      {errors.general && (
        <div className={styles.errorBox}>
          {errors.general}
        </div>
      )}

      <Button
        type="submit"
        variant="primary"
        size="lg"
        fullWidth
        loading={loading}
      >
        新規登録
      </Button>
    </form>
  );
};

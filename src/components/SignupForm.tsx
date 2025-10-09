import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/auth';
import { Input } from './Input';
import { Button } from './Button';
import { UserType } from '@/types';
import { isValidEmail, isSchoolEmail, isValidPassword } from '@/utils/validators';
import styles from './SignupForm.module.css';

export const SignupForm = () => {
  const [userType, setUserType] = useState<UserType>('student');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // 学生用フィールド
  const [studentName, setStudentName] = useState('');
  const [schoolName, setSchoolName] = useState('');
  
  // サロン用フィールド
  const [salonName, setSalonName] = useState('');
  const [address, setAddress] = useState('');
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  
  const { signUp } = useAuth();
  const navigate = useNavigate();

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
    }

    // サロン用バリデーション
    if (userType === 'salon') {
      if (!salonName) {
        newErrors.salonName = 'サロン名を入力してください';
      }
      if (!address) {
        newErrors.address = '住所を入力してください';
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
          }
        : {
            id: '',
            email,
            salon_name: salonName,
            address,
          };

      await signUp(email, password, userType, profileData);
      navigate('/');
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
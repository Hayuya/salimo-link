import { Card } from '@/components/Card';
import { AuthUser, Salon, Student } from '@/types';
import styles from './ProfileCard.module.css';

interface ProfileCardProps {
  user: AuthUser;
}

export const ProfileCard = ({ user }: ProfileCardProps) => {
  return (
    <Card padding="lg" className={styles.card}>
      <h2 className={styles.title}>プロフィール</h2>
      <div className={styles.profileInfo}>
        {user.userType === 'student' ? (
          <>
            <ProfileRow label="名前" value={(user.profile as Student).name} />
            <ProfileRow
              label="学校名"
              value={(user.profile as Student).school_name || '未設定'}
            />
            <ProfileRow
              label="電話番号"
              value={(user.profile as Student).phone_number || '未設定'}
            />
            <ProfileRow label="メールアドレス" value={user.email} />
          </>
        ) : (
          <>
            <ProfileRow label="サロン名" value={(user.profile as Salon).salon_name} />
            <ProfileRow
              label="住所"
              value={(user.profile as Salon).address || '未設定'}
            />
            <ProfileRow label="メールアドレス" value={user.email} />
            <ProfileRow
              label="電話番号"
              value={(user.profile as Salon).phone_number || '未設定'}
            />
            <ProfileRow
              label="WEBサイト"
              value={(user.profile as Salon).website_url || '未設定'}
              isLink={Boolean((user.profile as Salon).website_url)}
            />
          </>
        )}
      </div>
    </Card>
  );
};

interface ProfileRowProps {
  label: string;
  value: string;
  isLink?: boolean;
}

const ProfileRow = ({ label, value, isLink }: ProfileRowProps) => (
  <p className={styles.profileRow}>
    <strong>{label}:</strong>{' '}
    {isLink ? (
      <a className={styles.link} href={value} target="_blank" rel="noopener noreferrer">
        {value}
      </a>
    ) : (
      value
    )}
  </p>
);

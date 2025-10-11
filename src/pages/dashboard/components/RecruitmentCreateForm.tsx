import { useState } from 'react';
import {
  MenuType,
  GenderRequirement,
  HairLengthRequirement,
  PhotoShootRequirement,
  ModelExperienceRequirement,
  AvailableDate,
} from '@/types';
import {
  MENU_OPTIONS,
  MENU_LABELS,
  GENDER_OPTIONS,
  GENDER_LABELS,
  HAIR_LENGTH_OPTIONS,
  HAIR_LENGTH_LABELS,
  PHOTO_SHOOT_OPTIONS,
  PHOTO_SHOOT_LABELS,
  EXPERIENCE_OPTIONS,
  EXPERIENCE_LABELS
} from '@/utils/recruitment';
import { formatDateTime } from '@/utils/date';
import styles from './RecruitmentCreateForm.module.css';

interface RecruitmentData {
  title: string;
  description: string;
  menus: MenuType[];
  gender_requirement: GenderRequirement;
  hair_length_requirement: HairLengthRequirement;
  treatment_duration: string;
  status: 'active';
  photo_shoot_requirement: PhotoShootRequirement;
  model_experience_requirement: ModelExperienceRequirement;
  has_reward: boolean;
  reward_details: string;
  available_dates: AvailableDate[];
  flexible_schedule_text: string;
  is_fully_booked: boolean;
}

interface RecruitmentCreateFormProps {
  data: RecruitmentData;
  onUpdate: (data: RecruitmentData) => void;
  onSubmit: () => void;
  loading: boolean;
  onCancel: () => void;
}

export const RecruitmentCreateForm = ({ 
  data, 
  onUpdate, 
  onSubmit, 
  loading,
  onCancel 
}: RecruitmentCreateFormProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [newSlotDate, setNewSlotDate] = useState('');
  const [newSlotTime, setNewSlotTime] = useState('');
  
  const steps = [
    { id: 'info', label: '募集情報登録', icon: '1' },
    { id: 'schedule', label: '日時設定', icon: '2' }
  ];

  const toggleMenu = (menu: MenuType) => {
    const currentMenus = data.menus || [];
    const newMenus = currentMenus.includes(menu)
      ? currentMenus.filter(m => m !== menu)
      : [...currentMenus, menu];
    onUpdate({ ...data, menus: newMenus });
  };

  const createJSTDateTime = (date: string, time: string): string => {
    return `${date}T${time}:00+09:00`;
  };

  const addSlot = () => {
    if (!newSlotDate || !newSlotTime) {
      alert('日付と時刻を選択してください');
      return;
    }
    
    const jstDatetime = createJSTDateTime(newSlotDate, newSlotTime);
    const datetime = new Date(jstDatetime).toISOString();
    
    if (data.available_dates?.some(d => d.datetime === datetime)) {
      alert('同じ日時がすでに追加されています');
      return;
    }
    
    const newDate: AvailableDate = { datetime, is_booked: false };
    const updatedDates = [...(data.available_dates || []), newDate].sort(
      (a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime()
    );
    
    onUpdate({ ...data, available_dates: updatedDates });
    setNewSlotDate('');
    setNewSlotTime('');
  };

  const removeSlot = (datetime: string) => {
    onUpdate({
      ...data,
      available_dates: data.available_dates.filter(d => d.datetime !== datetime)
    });
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0:
        return data.title && data.menus?.length > 0;
      case 1:
        return (data.available_dates?.length > 0) || (data.flexible_schedule_text && data.flexible_schedule_text.trim() !== '');
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onSubmit();
    }
  };

  return (
    <div className={styles.container}>
      {/* Progress Steps */}
      <div className={styles.stepsContainer}>
        {steps.map((step, index) => (
          <div
            key={step.id}
            className={`${styles.step} ${
              index === currentStep ? styles.stepActive : ''
            } ${index < currentStep ? styles.stepCompleted : ''}`}
            onClick={() => index < currentStep && setCurrentStep(index)}
          >
            <div className={styles.stepIcon}>{step.icon}</div>
            <div className={styles.stepLabel}>{step.label}</div>
            {index < steps.length - 1 && <div className={styles.stepConnector} />}
          </div>
        ))}
      </div>

      {/* Form Content */}
      <div className={styles.formContent}>
        {currentStep === 0 && (
          <div className={styles.stepContent}>
            <h3 className={styles.stepTitle}>募集情報を入力</h3>
            
            {/* 基本情報 */}
            <div className={styles.sectionGroup}>
              <h4 className={styles.sectionTitle}>基本情報</h4>
              
              <div className={styles.formGroup}>
                <label className={styles.label}>
                  募集タイトル <span className={styles.required}>*</span>
                </label>
                <input
                  type="text"
                  value={data.title || ''}
                  onChange={(e) => onUpdate({ ...data, title: e.target.value })}
                  placeholder="例: 春の新色カラーモデル募集"
                  className={styles.input}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>募集内容</label>
                <textarea
                  value={data.description || ''}
                  onChange={(e) => onUpdate({ ...data, description: e.target.value })}
                  placeholder="詳しい募集内容を入力してください"
                  className={styles.textarea}
                  rows={4}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>
                  メニュー(複数選択可) <span className={styles.required}>*</span>
                </label>
                <div className={styles.menuGrid}>
                  {MENU_OPTIONS.map(menu => (
                    <button
                      key={menu}
                      type="button"
                      onClick={() => toggleMenu(menu)}
                      className={`${styles.menuButton} ${
                        data.menus?.includes(menu) ? styles.menuButtonActive : ''
                      }`}
                    >
                      {MENU_LABELS[menu]}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 募集条件 */}
            <div className={styles.sectionGroup}>
              <h4 className={styles.sectionTitle}>募集条件</h4>
              
              <div className={styles.formGroup}>
                <label className={styles.label}>性別</label>
                <div className={styles.radioGroup}>
                  {GENDER_OPTIONS.map(gender => (
                    <label key={gender} className={styles.radioLabel}>
                      <input
                        type="radio"
                        name="gender"
                        value={gender}
                        checked={data.gender_requirement === gender}
                        onChange={(e) => onUpdate({ ...data, gender_requirement: e.target.value as GenderRequirement })}
                        className={styles.radio}
                      />
                      <span>{GENDER_LABELS[gender]}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>髪の長さ</label>
                <div className={styles.radioGroup}>
                  {HAIR_LENGTH_OPTIONS.map(length => (
                    <label key={length} className={styles.radioLabel}>
                      <input
                        type="radio"
                        name="hairLength"
                        value={length}
                        checked={data.hair_length_requirement === length}
                        onChange={(e) => onUpdate({ ...data, hair_length_requirement: e.target.value as HairLengthRequirement })}
                        className={styles.radio}
                      />
                      <span>{HAIR_LENGTH_LABELS[length]}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>モデル経験</label>
                <div className={styles.radioGroup}>
                  {EXPERIENCE_OPTIONS.map(exp => (
                    <label key={exp} className={styles.radioLabel}>
                      <input
                        type="radio"
                        name="experience"
                        value={exp}
                        checked={data.model_experience_requirement === exp}
                        onChange={(e) => onUpdate({ ...data, model_experience_requirement: e.target.value as ModelExperienceRequirement })}
                        className={styles.radio}
                      />
                      <span>{EXPERIENCE_LABELS[exp]}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>撮影</label>
                <div className={styles.radioGroup}>
                  {PHOTO_SHOOT_OPTIONS.map(photo => (
                    <label key={photo} className={styles.radioLabel}>
                      <input
                        type="radio"
                        name="photoShoot"
                        value={photo}
                        checked={data.photo_shoot_requirement === photo}
                        onChange={(e) => onUpdate({ ...data, photo_shoot_requirement: e.target.value as PhotoShootRequirement })}
                        className={styles.radio}
                      />
                      <span>{PHOTO_SHOOT_LABELS[photo]}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* 謝礼・詳細 */}
            <div className={styles.sectionGroup}>
              <h4 className={styles.sectionTitle}>謝礼・詳細</h4>
              
              <div className={styles.formGroup}>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={data.has_reward || false}
                    onChange={(e) => onUpdate({ ...data, has_reward: e.target.checked })}
                    className={styles.checkbox}
                  />
                  <span>謝礼あり</span>
                </label>
              </div>

              {data.has_reward && (
                <div className={styles.formGroup}>
                  <label className={styles.label}>謝礼詳細(任意)</label>
                  <input
                    type="text"
                    value={data.reward_details || ''}
                    onChange={(e) => onUpdate({ ...data, reward_details: e.target.value })}
                    placeholder="例: 交通費支給、トリートメントサービスなど"
                    className={styles.input}
                  />
                </div>
              )}

              <div className={styles.formGroup}>
                <label className={styles.label}>施術時間(任意)</label>
                <input
                  type="text"
                  value={data.treatment_duration || ''}
                  onChange={(e) => onUpdate({ ...data, treatment_duration: e.target.value })}
                  placeholder="例: 2〜3時間"
                  className={styles.input}
                />
              </div>
            </div>
          </div>
        )}

        {currentStep === 1 && (
          <div className={styles.stepContent}>
            <h3 className={styles.stepTitle}>施術可能な日時を設定</h3>
            
            <div className={styles.instructionBox}>
              <p className={styles.instructionText}>
                施術可能な日時を選択して<strong>追加ボタン</strong>を押してください。
              </p>
              <p className={styles.instructionHint}>
                💡 複数の選択肢があることで成約率がグッと高まります
              </p>
            </div>

            <div className={styles.dateTimeSelector}>
              <input
                type="date"
                value={newSlotDate}
                onChange={(e) => setNewSlotDate(e.target.value)}
                className={styles.dateInput}
              />
              <input
                type="time"
                value={newSlotTime}
                onChange={(e) => setNewSlotTime(e.target.value)}
                className={styles.timeInput}
              />
              <button
                type="button"
                onClick={addSlot}
                className={styles.addButton}
              >
                + 追加
              </button>
            </div>

            {data.available_dates?.length > 0 && (
              <div className={styles.datesList}>
                <p className={styles.datesLabel}>追加された日時:</p>
                {data.available_dates.map(date => (
                  <div key={date.datetime} className={styles.dateItem}>
                    <span className={styles.dateText}>{formatDateTime(date.datetime)}</span>
                    <button
                      type="button"
                      onClick={() => removeSlot(date.datetime)}
                      className={styles.removeButton}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className={styles.divider}>
              <span className={styles.dividerText}>または</span>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>文章で日時を指定</label>
              <input
                type="text"
                value={data.flexible_schedule_text || ''}
                onChange={(e) => onUpdate({ ...data, flexible_schedule_text: e.target.value })}
                placeholder="例: 毎週月曜日の18時以降"
                className={styles.input}
              />
              <p className={styles.helperText}>
                具体的な日時が決まっていない場合は、こちらに希望の時間帯を入力してください
              </p>
            </div>

            <div className={styles.summaryBox}>
              <h4 className={styles.summaryTitle}>📋 募集内容の確認</h4>
              <div className={styles.summaryItem}>
                <strong>タイトル:</strong> {data.title || '未設定'}
              </div>
              <div className={styles.summaryItem}>
                <strong>メニュー:</strong> {data.menus?.map(m => MENU_LABELS[m]).join(', ') || '未選択'}
              </div>
              <div className={styles.summaryItem}>
                <strong>日時:</strong> {data.available_dates?.length || 0}件
                {data.flexible_schedule_text && ` + ${data.flexible_schedule_text}`}
              </div>
              <div className={styles.summaryItem}>
                <strong>謝礼:</strong> {data.has_reward ? (data.reward_details || 'あり') : 'なし'}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className={styles.buttonContainer}>
        <button
          type="button"
          onClick={onCancel}
          className={styles.cancelButton}
        >
          キャンセル
        </button>
        <div className={styles.navButtons}>
          {currentStep > 0 && (
            <button
              type="button"
              onClick={() => setCurrentStep(currentStep - 1)}
              className={styles.backButton}
            >
              ← 戻る
            </button>
          )}
          <button
            type="button"
            onClick={handleNext}
            disabled={!canProceed() || loading}
            className={`${styles.nextButton} ${
              !canProceed() || loading ? styles.buttonDisabled : ''
            }`}
          >
            {loading ? '作成中...' : currentStep === steps.length - 1 ? '作成する' : '次へ →'}
          </button>
        </div>
      </div>
    </div>
  );
};
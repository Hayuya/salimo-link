import { useEffect, useMemo, useState } from 'react';
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
  EXPERIENCE_LABELS,
} from '@/utils/recruitment';
import { formatDateTime } from '@/utils/date';
import styles from './RecruitmentForm.module.css';

export interface RecruitmentFormData {
  title: string;
  description: string;
  menus: MenuType[];
  gender_requirement: GenderRequirement;
  hair_length_requirement: HairLengthRequirement;
  treatment_duration: string;
  status: 'active' | 'closed';
  photo_shoot_requirement: PhotoShootRequirement;
  model_experience_requirement: ModelExperienceRequirement;
  payment_type: 'free' | 'paid';
  payment_amount: number | null;
  has_reward: boolean;
  reward_details: string;
  available_dates: AvailableDate[];
  flexible_schedule_text: string;
  is_fully_booked: boolean;
}

interface RecruitmentFormProps {
  initialData: RecruitmentFormData;
  onSubmit: (data: RecruitmentFormData) => void;
  submitLabel: string;
  loading: boolean;
  onCancel: () => void;
}

export const RecruitmentForm = ({
  initialData,
  onSubmit,
  submitLabel,
  loading,
  onCancel,
}: RecruitmentFormProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [newSlotDate, setNewSlotDate] = useState('');
  const [newSlotTime, setNewSlotTime] = useState('');
  const [formData, setFormData] = useState<RecruitmentFormData>(initialData);

  useEffect(() => {
    setFormData(initialData);
    setCurrentStep(0);
    setNewSlotDate('');
    setNewSlotTime('');
  }, [initialData]);

  const steps = useMemo(
    () => [
      { id: 'info', label: '募集情報登録', icon: '1' },
      { id: 'compensation', label: '料金・謝礼', icon: '2' },
      { id: 'schedule', label: '日時設定', icon: '3' },
    ],
    [],
  );

  const updateForm = (updater: (prev: RecruitmentFormData) => RecruitmentFormData) => {
    setFormData(prev => updater(prev));
  };

  const toggleMenu = (menu: MenuType) => {
    updateForm(prev => {
      const currentMenus = prev.menus || [];
      const newMenus = currentMenus.includes(menu)
        ? currentMenus.filter(m => m !== menu)
        : [...currentMenus, menu];
      return { ...prev, menus: newMenus };
    });
  };

  const createJSTDateTime = (date: string, time: string) => `${date}T${time}:00+09:00`;

  const addSlot = () => {
    if (!newSlotDate || !newSlotTime) {
      alert('日付と時刻を選択してください');
      return;
    }

    const jstDatetime = createJSTDateTime(newSlotDate, newSlotTime);
    const datetime = new Date(jstDatetime).toISOString();

    if (formData.available_dates?.some(d => d.datetime === datetime)) {
      alert('同じ日時がすでに追加されています');
      return;
    }

    const newDate: AvailableDate = { datetime, is_booked: false };
    const updatedDates = [...(formData.available_dates || []), newDate].sort(
      (a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime(),
    );

    updateForm(prev => ({ ...prev, available_dates: updatedDates }));
    setNewSlotDate('');
    setNewSlotTime('');
  };

  const removeSlot = (datetime: string) => {
    updateForm(prev => ({
      ...prev,
      available_dates: prev.available_dates.filter(d => d.datetime !== datetime),
    }));
  };

  const canProceed = useMemo(() => {
    switch (currentStep) {
      case 0:
        return !!(formData.title && formData.menus?.length > 0);
      case 1:
        if (formData.payment_type === 'paid') {
          return formData.payment_amount !== null && formData.payment_amount > 0;
        }
        return true;
      case 2:
        return (
          (formData.available_dates?.length ?? 0) > 0 ||
          (formData.flexible_schedule_text && formData.flexible_schedule_text.trim() !== '')
        );
      default:
        return true;
    }
  }, [currentStep, formData.available_dates, formData.flexible_schedule_text, formData.menus, formData.payment_amount, formData.payment_type, formData.title]);

  const handleNext = () => {
    if (!canProceed) return;
    if (currentStep < steps.length - 1) {
      setCurrentStep(step => step + 1);
    } else {
      onSubmit({
        ...formData,
        payment_amount:
          formData.payment_type === 'paid' && formData.payment_amount ? formData.payment_amount : null,
        reward_details: formData.has_reward ? formData.reward_details : '',
      });
    }
  };

  const submitInProgressLabel = useMemo(() => '送信中...', []);

  return (
    <div className={styles.container}>
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

      <div className={styles.formContent}>
        {currentStep === 0 && (
          <div className={styles.stepContent}>
            <h3 className={styles.stepTitle}>募集情報を入力</h3>
            <div className={styles.sectionGroup}>
              <h4 className={styles.sectionTitle}>基本情報</h4>

              <div className={styles.formGroup}>
                <label className={styles.label}>
                  募集タイトル <span className={styles.required}>*</span>
                </label>
                <input
                  type='text'
                  value={formData.title || ''}
                  onChange={e => updateForm(prev => ({ ...prev, title: e.target.value }))}
                  placeholder='例: 春の新色カラーモデル募集'
                  className={styles.input}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>募集内容</label>
                <textarea
                  value={formData.description || ''}
                  onChange={e => updateForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder='詳しい募集内容を入力してください'
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
                      type='button'
                      onClick={() => toggleMenu(menu)}
                      className={`${styles.menuButton} ${
                        formData.menus?.includes(menu) ? styles.menuButtonActive : ''
                      }`}
                    >
                      {MENU_LABELS[menu]}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className={styles.sectionGroup}>
              <h4 className={styles.sectionTitle}>募集条件</h4>

              <div className={styles.formGroup}>
                <label className={styles.label}>性別</label>
                <div className={styles.radioGroup}>
                  {GENDER_OPTIONS.map(gender => (
                    <label key={gender} className={styles.radioLabel}>
                      <input
                        type='radio'
                        name='gender'
                        value={gender}
                        checked={formData.gender_requirement === gender}
                        onChange={e =>
                          updateForm(prev => ({
                            ...prev,
                            gender_requirement: e.target.value as GenderRequirement,
                          }))
                        }
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
                        type='radio'
                        name='hairLength'
                        value={length}
                        checked={formData.hair_length_requirement === length}
                        onChange={e =>
                          updateForm(prev => ({
                            ...prev,
                            hair_length_requirement: e.target.value as HairLengthRequirement,
                          }))
                        }
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
                        type='radio'
                        name='experience'
                        value={exp}
                        checked={formData.model_experience_requirement === exp}
                        onChange={e =>
                          updateForm(prev => ({
                            ...prev,
                            model_experience_requirement: e.target.value as ModelExperienceRequirement,
                          }))
                        }
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
                        type='radio'
                        name='photoShoot'
                        value={photo}
                        checked={formData.photo_shoot_requirement === photo}
                        onChange={e =>
                          updateForm(prev => ({
                            ...prev,
                            photo_shoot_requirement: e.target.value as PhotoShootRequirement,
                          }))
                        }
                        className={styles.radio}
                      />
                      <span>{PHOTO_SHOOT_LABELS[photo]}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className={styles.sectionGroup}>
              <h4 className={styles.sectionTitle}>施術時間</h4>
              <div className={styles.formGroup}>
                <label className={styles.label}>施術時間(任意)</label>
                <input
                  type='text'
                  value={formData.treatment_duration || ''}
                  onChange={e =>
                    updateForm(prev => ({ ...prev, treatment_duration: e.target.value }))
                  }
                  placeholder='例: 2〜3時間'
                  className={styles.input}
                />
              </div>
            </div>
          </div>
        )}

        {currentStep === 1 && (
          <div className={styles.stepContent}>
            <h3 className={styles.stepTitle}>料金と謝礼を設定</h3>

            <div className={styles.sectionGroup}>
              <h4 className={styles.sectionTitle}>料金プラン</h4>

              <div className={styles.radioGroup}>
                <label className={styles.radioLabel}>
                  <input
                    type='radio'
                    name='paymentType'
                    value='free'
                    checked={formData.payment_type === 'free'}
                    onChange={() =>
                      updateForm(prev => ({
                        ...prev,
                        payment_type: 'free',
                        payment_amount: null,
                      }))
                    }
                    className={styles.radio}
                  />
                  <span>無料</span>
                </label>
                <label className={styles.radioLabel}>
                  <input
                    type='radio'
                    name='paymentType'
                    value='paid'
                    checked={formData.payment_type === 'paid'}
                    onChange={() =>
                      updateForm(prev => ({
                        ...prev,
                        payment_type: 'paid',
                        payment_amount: prev.payment_amount && prev.payment_amount > 0 ? prev.payment_amount : null,
                      }))
                    }
                    className={styles.radio}
                  />
                  <span>有料</span>
                </label>
              </div>

              {formData.payment_type === 'paid' && (
                <div className={styles.formGroup}>
                  <label className={styles.label}>料金 (税込・円)</label>
                  <input
                    type='number'
                    min='0'
                    value={formData.payment_amount ?? ''}
                    onChange={e => {
                      const value = e.target.value;
                      const numericValue = Number(value);
                      updateForm(prev => ({
                        ...prev,
                        payment_amount:
                          value === '' || Number.isNaN(numericValue)
                            ? null
                            : Math.max(0, numericValue),
                      }));
                    }}
                    placeholder='例: 3000'
                    className={styles.input}
                  />
                  <p className={styles.helperText}>税込の料金を半角数字で入力してください</p>
                </div>
              )}
            </div>

            <div className={styles.sectionGroup}>
              <h4 className={styles.sectionTitle}>謝礼</h4>
              <div className={styles.radioGroup}>
                <label className={styles.radioLabel}>
                  <input
                    type='radio'
                    name='reward'
                    value='no'
                    checked={!formData.has_reward}
                    onChange={() =>
                      updateForm(prev => ({
                        ...prev,
                        has_reward: false,
                        reward_details: '',
                      }))
                    }
                    className={styles.radio}
                  />
                  <span>なし</span>
                </label>
                <label className={styles.radioLabel}>
                  <input
                    type='radio'
                    name='reward'
                    value='yes'
                    checked={!!formData.has_reward}
                    onChange={() =>
                      updateForm(prev => ({
                        ...prev,
                        has_reward: true,
                      }))
                    }
                    className={styles.radio}
                  />
                  <span>あり</span>
                </label>
              </div>

              {formData.has_reward && (
                <div className={styles.formGroup}>
                  <label className={styles.label}>謝礼内容(任意)</label>
                  <input
                    type='text'
                    value={formData.reward_details || ''}
                    onChange={e =>
                      updateForm(prev => ({ ...prev, reward_details: e.target.value }))
                    }
                    placeholder='例: 交通費支給、トリートメントサービスなど'
                    className={styles.input}
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className={styles.stepContent}>
            <h3 className={styles.stepTitle}>施術可能な日時を設定</h3>

            <div className={styles.instructionBox}>
              <p className={styles.instructionText}>
                施術可能な日時を選択して<strong>追加ボタン</strong>を押してください。
              </p>
              <p className={styles.instructionHint}>💡 複数の選択肢があることで成約率がグッと高まります</p>
            </div>

            <div className={styles.dateTimeSelector}>
              <input
                type='date'
                value={newSlotDate}
                onChange={e => setNewSlotDate(e.target.value)}
                className={styles.dateInput}
              />
              <input
                type='time'
                value={newSlotTime}
                onChange={e => setNewSlotTime(e.target.value)}
                className={styles.timeInput}
              />
              <button type='button' onClick={addSlot} className={styles.addButton}>
                + 追加
              </button>
            </div>

            {formData.available_dates?.length > 0 && (
              <div className={styles.datesList}>
                <p className={styles.datesLabel}>追加された日時:</p>
                {formData.available_dates.map(date => (
                  <div key={date.datetime} className={styles.dateItem}>
                    <span className={styles.dateText}>{formatDateTime(date.datetime)}</span>
                    <button
                      type='button'
                      onClick={() => removeSlot(date.datetime)}
                      disabled={date.is_booked}
                      className={styles.removeButton}
                      title={date.is_booked ? '予約済みの日時は削除できません' : undefined}
                    >
                      {date.is_booked ? '予約済み' : '×'}
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
                type='text'
                value={formData.flexible_schedule_text || ''}
                onChange={e =>
                  updateForm(prev => ({ ...prev, flexible_schedule_text: e.target.value }))
                }
                placeholder='例: 毎週月曜日の18時以降'
                className={styles.input}
              />
              <p className={styles.helperText}>
                具体的な日時が決まっていない場合は、こちらに希望の時間帯を入力してください
              </p>
            </div>

            <div className={styles.summaryBox}>
              <h4 className={styles.summaryTitle}>📋 募集内容の確認</h4>
              <div className={styles.summaryItem}>
                <strong>タイトル:</strong> {formData.title || '未設定'}
              </div>
              <div className={styles.summaryItem}>
                <strong>メニュー:</strong> {formData.menus?.map(m => MENU_LABELS[m]).join(', ') || '未選択'}
              </div>
              <div className={styles.summaryItem}>
                <strong>料金:</strong>{' '}
                {formData.payment_type === 'free'
                  ? '無料'
                  : formData.payment_amount
                  ? `¥${new Intl.NumberFormat('ja-JP').format(formData.payment_amount)}`
                  : '未設定'}
              </div>
              <div className={styles.summaryItem}>
                <strong>謝礼:</strong>{' '}
                {formData.has_reward
                  ? formData.reward_details?.trim() || 'あり'
                  : 'なし'}
              </div>
              <div className={styles.summaryItem}>
                <strong>日時:</strong> {formData.available_dates?.length || 0}件
                {formData.flexible_schedule_text && ` + ${formData.flexible_schedule_text}`}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className={styles.buttonContainer}>
        <button type='button' onClick={onCancel} className={styles.cancelButton}>
          キャンセル
        </button>
        <div className={styles.navButtons}>
          {currentStep > 0 && (
            <button
              type='button'
              onClick={() => setCurrentStep(step => Math.max(step - 1, 0))}
              className={styles.backButton}
            >
              ← 戻る
            </button>
          )}
          <button
            type='button'
            onClick={handleNext}
            disabled={!canProceed || loading}
            className={`${styles.nextButton} ${!canProceed || loading ? styles.buttonDisabled : ''}`}
          >
            {loading
              ? submitInProgressLabel
              : currentStep === steps.length - 1
              ? submitLabel
              : '次へ →'}
          </button>
        </div>
      </div>
    </div>
  );
};

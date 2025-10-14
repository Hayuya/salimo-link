// src/utils/recruitment.ts
import { MenuType, GenderRequirement, HairLengthRequirement, PhotoShootRequirement, ModelExperienceRequirement } from '@/types';
import type { MenuSelectionType } from '@/types';

/**
 * メニューの日本語ラベル
 */
export const MENU_LABELS: Record<MenuType, string> = {
  cut: 'カット',
  color: 'カラー',
  perm: 'パーマ',
  treatment: 'トリートメント',
  straight: 'ストレート',
  hair_set: 'ヘアセット',
  head_spa: 'ヘッドスパ',
  hair_straightening: '縮毛矯正',
  extensions: 'エクステ',
  other: 'その他',
};

/**
 * 性別の日本語ラベル
 */
export const GENDER_LABELS: Record<GenderRequirement, string> = {
  male: '男性',
  female: '女性',
  any: 'どちらでも',
};

/**
 * 髪の長さの日本語ラベル
 */
export const HAIR_LENGTH_LABELS: Record<HairLengthRequirement, string> = {
  short: 'ショート',
  bob: 'ボブ',
  medium: 'ミディアム',
  long: 'ロング',
  any: '指定なし',
};

/**
 * 撮影要件の日本語ラベル
 */
export const PHOTO_SHOOT_LABELS: Record<PhotoShootRequirement, string> = {
  required: '必須',
  optional: '任意',
  none: 'なし',
};

/**
 * モデル経験の日本語ラベル
 */
export const EXPERIENCE_LABELS: Record<ModelExperienceRequirement, string> = {
  any: '問わない',
  experienced: '経験者のみ',
  beginner: '未経験者歓迎',
};

/**
 * メニューの選択肢
 */
export const MENU_OPTIONS: MenuType[] = [
  'cut', 
  'color', 
  'perm', 
  'treatment', 
  'straight', 
  'hair_set', 
  'head_spa', 
  'hair_straightening', 
  'extensions',
  'other'
];

export const MENU_SELECTION_LABELS: Record<MenuSelectionType, string> = {
  fixed: '選択したメニューで固定',
  selectable: '掲載メニューから選択可',
};

/**
 * 性別の選択肢
 */
export const GENDER_OPTIONS: GenderRequirement[] = ['male', 'female', 'any'];

/**
 * 髪の長さの選択肢
 */
export const HAIR_LENGTH_OPTIONS: HairLengthRequirement[] = ['short', 'bob', 'medium', 'long', 'any'];

/**
 * 撮影要件の選択肢
 */
export const PHOTO_SHOOT_OPTIONS: PhotoShootRequirement[] = ['required', 'optional', 'none'];

/**
 * モデル経験の選択肢
 */
export const EXPERIENCE_OPTIONS: ModelExperienceRequirement[] = ['any', 'experienced', 'beginner'];

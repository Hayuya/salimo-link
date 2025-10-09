import { MenuType, GenderRequirement, HairLengthRequirement } from '@/types';

/**
 * メニューの日本語ラベル
 */
export const MENU_LABELS: Record<MenuType, string> = {
  cut: 'カット',
  color: 'カラー',
  perm: 'パーマ',
  treatment: 'トリートメント',
  straight: 'ストレート',
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
 * メニューの選択肢
 */
export const MENU_OPTIONS: MenuType[] = ['cut', 'color', 'perm', 'treatment', 'straight', 'other'];

/**
 * 性別の選択肢
 */
export const GENDER_OPTIONS: GenderRequirement[] = ['male', 'female', 'any'];

/**
 * 髪の長さの選択肢
 */
export const HAIR_LENGTH_OPTIONS: HairLengthRequirement[] = ['short', 'bob', 'medium', 'long', 'any'];
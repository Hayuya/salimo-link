/**
 * バリデーション関連のユーティリティ関数
 */

/**
 * 学校発行メールアドレスかどうかをチェック
 * .ac.jp で終わるメールアドレスを許可
 */
export const isSchoolEmail = (email: string): boolean => {
  const schoolEmailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.ac\.jp$/;
  return schoolEmailPattern.test(email);
};

/**
 * メールアドレスの基本的なバリデーション
 */
export const isValidEmail = (email: string): boolean => {
  const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailPattern.test(email);
};

/**
 * InstagramプロフィールURLのバリデーション
 */
export const isValidInstagramUrl = (url: string): boolean => {
  const instagramPattern = /^https?:\/\/(www\.)?instagram\.com\/[a-zA-Z0-9._]+\/?$/;
  return instagramPattern.test(url);
};

/**
 * パスワードの強度チェック
 * 最低8文字以上
 */
export const isValidPassword = (password: string): boolean => {
  return password.length >= 8;
};

/**
 * 電話番号のバリデーション（日本の電話番号）
 */
export const isValidPhoneNumber = (phone: string): boolean => {
  // ハイフンありなしどちらも許可
  const phonePattern = /^0\d{9,10}$|^0\d{1,4}-\d{1,4}-\d{4}$/;
  return phonePattern.test(phone);
};

/**
 * URLのバリデーション
 */
export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * 文字列の長さチェック
 */
export const isWithinLength = (
  text: string,
  minLength: number,
  maxLength: number
): boolean => {
  return text.length >= minLength && text.length <= maxLength;
};

/**
 * 空文字列かどうかをチェック
 */
export const isEmpty = (text: string | undefined | null): boolean => {
  return !text || text.trim().length === 0;
};
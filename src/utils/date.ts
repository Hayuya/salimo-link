/**
 * 日付フォーマット関連のユーティリティ関数
 */

/**
 * ISO形式の日付文字列を "YYYY年MM月DD日" 形式に変換
 */
export const formatDate = (dateString: string): string => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}年${month}月${day}日`;
};

/**
 * ISO形式の日付文字列を "YYYY-MM-DD" 形式に変換 (input[type=date]用)
 */
export const formatDateForInput = (dateString?: string): string => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * ISO形式の日時文字列を "YYYY-MM-DDTHH:MM" 形式に変換 (input[type=datetime-local]用)
 */
export const formatDateTimeForInput = (dateString?: string): string => {
    if (!dateString) return '';
    const date = new Date(dateString);
    // タイムゾーンのオフセットを考慮してフォーマット
    const timezoneOffset = date.getTimezoneOffset() * 60000;
    const localDate = new Date(date.getTime() - timezoneOffset);
    return localDate.toISOString().slice(0, 16);
};


/**
 * ISO形式の日時文字列を "YYYY年MM月DD日 HH:MM" 形式に変換
 */
export const formatDateTime = (dateString: string): string => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}年${month}月${day}日 ${hours}:${minutes}`;
};

/**
 * 現在日時から相対的な時間を表示（例: "3分前", "2日前"）
 */
export const formatRelativeTime = (dateString: string): string => {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) {
    return 'たった今';
  } else if (diffMinutes < 60) {
    return `${diffMinutes}分前`;
  } else if (diffHours < 24) {
    return `${diffHours}時間前`;
  } else if (diffDays < 7) {
    return `${diffDays}日前`;
  } else {
    return formatDate(dateString);
  }
};

/**
 * 締切日が過ぎているかチェック
 */
export const isDeadlinePassed = (deadlineDate: string): boolean => {
  const now = new Date();
  const deadline = new Date(deadlineDate);
  deadline.setHours(23, 59, 59, 999); // 日付の終わりまでを考慮
  return now > deadline;
};

/**
 * 締切まであと何日かを計算
 */
export const daysUntilDeadline = (deadlineDate: string): number => {
  const now = new Date();
  const deadline = new Date(deadlineDate);
  // 時間をリセットして日付のみで比較
  now.setHours(0, 0, 0, 0);
  deadline.setHours(0, 0, 0, 0);
  const diffMs = deadline.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  return diffDays;
};

/**
 * 指定した日時の指定時間前を返す
 */
export const getHoursBefore = (dateString: string, hours: number): Date => {
  const target = new Date(dateString);
  const result = new Date(target);
  result.setHours(result.getHours() - hours);
  return result;
};

/**
 * 指定した日時が現在より未来かどうか
 */
export const isFutureDate = (dateString: string): boolean => {
  const now = new Date();
  const target = new Date(dateString);
  return target.getTime() > now.getTime();
};

/**
 * 現在が指定した時間前の締切より前かどうか
 */
export const isBeforeHoursBefore = (dateString: string, hours: number): boolean => {
  const now = new Date();
  const cutoff = getHoursBefore(dateString, hours);
  return now.getTime() < cutoff.getTime();
};

/**
 * 現在が締切は過ぎているがイベント自体はまだ未来かどうか
 */
export const isPastCutoffButBeforeEvent = (dateString: string, hours: number): boolean => {
  const now = new Date();
  const eventDate = new Date(dateString);
  const cutoff = getHoursBefore(dateString, hours);
  return now.getTime() >= cutoff.getTime() && now.getTime() < eventDate.getTime();
};

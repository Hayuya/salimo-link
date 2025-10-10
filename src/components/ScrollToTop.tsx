// src/components/ScrollToTop.tsx (拡張版)
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

interface ScrollToTopProps {
  smooth?: boolean; // スムーズスクロールを有効にするか
  delay?: number;   // スクロールまでの遅延（ミリ秒）
}

/**
 * ページ遷移時に自動的に最上部にスクロールするコンポーネント
 * 
 * @param smooth - trueの場合スムーズにスクロール、falseの場合即座に移動（デフォルト: false）
 * @param delay - スクロールまでの遅延時間（ミリ秒）。アニメーションと同期させたい場合に使用（デフォルト: 0）
 * 
 * @example
 * // 基本的な使い方（即座にスクロール）
 * <ScrollToTop />
 * 
 * @example
 * // スムーズにスクロール
 * <ScrollToTop smooth />
 * 
 * @example
 * // 100ms遅延してからスクロール
 * <ScrollToTop delay={100} />
 */
export const ScrollToTop = ({ smooth = false, delay = 0 }: ScrollToTopProps = {}) => {
  const { pathname } = useLocation();

  useEffect(() => {
    const scrollToTop = () => {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: smooth ? 'smooth' : 'instant'
      });
    };

    if (delay > 0) {
      const timeoutId = setTimeout(scrollToTop, delay);
      return () => clearTimeout(timeoutId);
    } else {
      scrollToTop();
    }
  }, [pathname, smooth, delay]);

  return null;
};
import { useEffect, useRef } from 'react';

let activeLockCount = 0;
let originalBodyOverflow = '';
let originalBodyPaddingRight = '';
let originalBodyPosition = '';
let originalBodyTop = '';
let originalBodyWidth = '';
let savedScrollY = 0;

/**
 * Robust scroll lock hook for desktop and mobile modals.
 * - Locks body and document scrolling when active using fixed positioning
 * - Completely prevents mobile iOS/Android touchmove background scroll leaks
 * - Prevents layout shift from disappearing scrollbar
 * - Safely handles stacked modals via global ref-counting
 * - Restores original scroll position precisely on close
 */
export function useScrollLock(isLocked: boolean, options: { onEscape?: () => void } = {}) {
  const { onEscape } = options;
  const onEscapeRef = useRef(onEscape);
  onEscapeRef.current = onEscape;

  useEffect(() => {
    if (!isLocked) return;

    if (activeLockCount === 0) {
      savedScrollY = window.scrollY || window.pageYOffset || document.documentElement.scrollTop || 0;
      originalBodyOverflow = document.body.style.overflow;
      originalBodyPaddingRight = document.body.style.paddingRight;
      originalBodyPosition = document.body.style.position;
      originalBodyTop = document.body.style.top;
      originalBodyWidth = document.body.style.width;

      // Compensate for scrollbar width to prevent horizontal layout shift
      const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth;
      if (scrollBarWidth > 0) {
        document.body.style.paddingRight = `${scrollBarWidth}px`;
      }

      // Bulletproof background scroll lock for both mobile touch and desktop wheel
      document.body.style.position = 'fixed';
      document.body.style.top = `-${savedScrollY}px`;
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';
      document.body.style.overscrollBehavior = 'none';
      document.documentElement.style.overflow = 'hidden';
    }

    activeLockCount++;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onEscapeRef.current) {
        e.preventDefault();
        onEscapeRef.current();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      activeLockCount--;

      if (activeLockCount <= 0) {
        activeLockCount = 0;
        document.body.style.position = originalBodyPosition;
        document.body.style.top = originalBodyTop;
        document.body.style.width = originalBodyWidth;
        document.body.style.overflow = originalBodyOverflow;
        document.body.style.paddingRight = originalBodyPaddingRight;
        document.body.style.overscrollBehavior = '';
        document.documentElement.style.overflow = '';
        if (savedScrollY > 0) {
          window.scrollTo(0, savedScrollY);
        }
      }
    };
  }, [isLocked]);
}

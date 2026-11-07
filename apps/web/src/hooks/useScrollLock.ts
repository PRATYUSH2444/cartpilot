import { useEffect, useRef } from 'react';

let activeLockCount = 0;
let originalBodyOverflow = '';
let originalBodyPaddingRight = '';
let savedScrollY = 0;

/**
 * Robust scroll lock hook for desktop and mobile modals.
 * - Locks body and document scrolling when active
 * - Prevents layout shift from disappearing scrollbar
 * - Safely handles stacked modals via global ref-counting
 * - Restores original scroll position on close
 */
export function useScrollLock(isLocked: boolean, options: { onEscape?: () => void } = {}) {
  const { onEscape } = options;
  const onEscapeRef = useRef(onEscape);
  onEscapeRef.current = onEscape;

  useEffect(() => {
    if (!isLocked) return;

    if (activeLockCount === 0) {
      savedScrollY = window.scrollY || document.documentElement.scrollTop;
      originalBodyOverflow = document.body.style.overflow;
      originalBodyPaddingRight = document.body.style.paddingRight;

      // Compensate for scrollbar width to prevent horizontal layout shift
      const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth;
      if (scrollBarWidth > 0) {
        document.body.style.paddingRight = `${scrollBarWidth}px`;
      }

      document.body.style.overflow = 'hidden';
      document.body.style.overscrollBehavior = 'contain';
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
        document.body.style.overflow = originalBodyOverflow;
        document.body.style.paddingRight = originalBodyPaddingRight;
        document.body.style.overscrollBehavior = '';
        if (savedScrollY > 0) {
          window.scrollTo(0, savedScrollY);
        }
      }
    };
  }, [isLocked]);
}

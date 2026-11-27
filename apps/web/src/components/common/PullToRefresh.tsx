import React, { useState, useRef, useEffect } from 'react';
import { ArrowDown, RefreshCw, Check } from 'lucide-react';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
  disabled?: boolean;
  threshold?: number;
  maxPull?: number;
  className?: string;
}

export const PullToRefresh: React.FC<PullToRefreshProps> = ({
  onRefresh,
  children,
  disabled = false,
  threshold = 60,
  maxPull = 110,
  className = '',
}) => {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const startYRef = useRef(0);
  const startXRef = useRef(0);
  const isPullingRef = useRef(false);
  const isMouseDownRef = useRef(false);

  // Check if target or any scroll parent is scrolled down
  const isScrolledToTop = (target: EventTarget | null): boolean => {
    let el = target as HTMLElement | null;
    while (el && el !== containerRef.current && el !== document.body) {
      if (el.scrollTop > 0) return false;
      el = el.parentElement;
    }
    if (containerRef.current) {
      const scrollables = containerRef.current.querySelectorAll<HTMLElement>(
        '.overflow-y-auto, .overflow-auto'
      );
      for (let i = 0; i < scrollables.length; i++) {
        if (scrollables[i].scrollTop > 0) {
          return false;
        }
      }
    }
    return true;
  };

  // Touch Handlers
  const handleTouchStart = (e: TouchEvent) => {
    if (disabled || isRefreshing) return;
    if (!isScrolledToTop(e.target)) return;

    startYRef.current = e.touches[0].clientY;
    startXRef.current = e.touches[0].clientX;
    isPullingRef.current = true;
    setIsDragging(true);
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (!isPullingRef.current || disabled || isRefreshing) return;

    const currentY = e.touches[0].clientY;
    const currentX = e.touches[0].clientX;
    const deltaY = currentY - startYRef.current;
    const deltaX = currentX - startXRef.current;

    // Cancel pull if horizontal swipe is dominant (e.g. banners, tabs, carousels)
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      isPullingRef.current = false;
      setIsDragging(false);
      setPullDistance(0);
      return;
    }

    if (!isScrolledToTop(e.target)) {
      isPullingRef.current = false;
      setIsDragging(false);
      setPullDistance(0);
      return;
    }

    if (deltaY > 0) {
      // Elastic damping curve
      const damped = Math.min(maxPull, Math.pow(deltaY, 0.82) * 1.5);
      setPullDistance(damped);
      if (e.cancelable && damped > 8) {
        e.preventDefault();
      }
    } else {
      setPullDistance(0);
    }
  };

  const handleTouchEnd = async () => {
    if (!isPullingRef.current || disabled || isRefreshing) {
      isPullingRef.current = false;
      setIsDragging(false);
      return;
    }

    isPullingRef.current = false;
    setIsDragging(false);

    if (pullDistance >= threshold) {
      setIsRefreshing(true);
      setPullDistance(threshold * 0.7);

      try {
        await onRefresh();
        setIsSuccess(true);
        setTimeout(() => {
          setIsSuccess(false);
          setIsRefreshing(false);
          setPullDistance(0);
        }, 450);
      } catch (err) {
        console.warn('Pull to refresh failed:', err);
        setIsRefreshing(false);
        setPullDistance(0);
      }
    } else {
      setPullDistance(0);
    }
  };

  // Desktop Mouse Handlers (Enables testing in browser & on desktop touchscreens)
  const handleMouseDown = (e: MouseEvent) => {
    if (disabled || isRefreshing || e.button !== 0) return;
    if (!isScrolledToTop(e.target)) return;

    startYRef.current = e.clientY;
    startXRef.current = e.clientX;
    isMouseDownRef.current = true;
    setIsDragging(true);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isMouseDownRef.current || disabled || isRefreshing) return;
    const deltaY = e.clientY - startYRef.current;
    const deltaX = e.clientX - startXRef.current;

    if (Math.abs(deltaX) > Math.abs(deltaY) || !isScrolledToTop(e.target)) {
      isMouseDownRef.current = false;
      setIsDragging(false);
      setPullDistance(0);
      return;
    }

    if (deltaY > 0) {
      const damped = Math.min(maxPull, Math.pow(deltaY, 0.82) * 1.5);
      setPullDistance(damped);
    } else {
      setPullDistance(0);
    }
  };

  const handleMouseUp = async () => {
    if (!isMouseDownRef.current || disabled || isRefreshing) {
      isMouseDownRef.current = false;
      setIsDragging(false);
      return;
    }
    isMouseDownRef.current = false;
    setIsDragging(false);

    if (pullDistance >= threshold) {
      setIsRefreshing(true);
      setPullDistance(threshold * 0.7);

      try {
        await onRefresh();
        setIsSuccess(true);
        setTimeout(() => {
          setIsSuccess(false);
          setIsRefreshing(false);
          setPullDistance(0);
        }, 450);
      } catch (err) {
        console.warn('Pull to refresh failed:', err);
        setIsRefreshing(false);
        setPullDistance(0);
      }
    } else {
      setPullDistance(0);
    }
  };

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    el.addEventListener('touchstart', handleTouchStart, { passive: true });
    el.addEventListener('touchmove', handleTouchMove, { passive: false });
    el.addEventListener('touchend', handleTouchEnd);
    el.addEventListener('touchcancel', handleTouchEnd);

    el.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      el.removeEventListener('touchstart', handleTouchStart);
      el.removeEventListener('touchmove', handleTouchMove);
      el.removeEventListener('touchend', handleTouchEnd);
      el.removeEventListener('touchcancel', handleTouchEnd);

      el.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [disabled, isRefreshing, pullDistance, threshold, maxPull]);

  return (
    <div
      ref={containerRef}
      className={`flex-1 flex flex-col min-h-0 h-full w-full relative overflow-hidden select-none ${className}`}
    >
      {/* ── Floating Tactile Pull-to-Refresh Pill Indicator ─────────────────── */}
      <div
        className="absolute top-2 left-1/2 -translate-x-1/2 z-50 pointer-events-none select-none transition-all duration-150"
        style={{
          transform: `translate(-50%, ${pullDistance > 0 ? Math.min(pullDistance, 55) : -60}px)`,
          opacity: pullDistance > 12 ? Math.min(1, (pullDistance - 12) / 25) : 0,
          transition: isDragging ? 'none' : 'all 0.3s cubic-bezier(0.18, 0.89, 0.32, 1.28)',
        }}
      >
        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/98 dark:bg-stone-900/98 backdrop-blur-md shadow-lg shadow-black/10 border border-stone-200/90 dark:border-stone-800 text-stone-800 dark:text-stone-200 text-xs font-bold">
          {isRefreshing ? (
            isSuccess ? (
              <>
                <div className="w-4 h-4 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <Check className="w-3 h-3 stroke-[3px]" />
                </div>
                <span className="text-emerald-700 dark:text-emerald-400">Inventory Updated!</span>
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 text-emerald-600 dark:text-emerald-400 animate-spin stroke-[2.5px]" />
                <span className="text-stone-700 dark:text-stone-300">Refreshing live harvest...</span>
              </>
            )
          ) : pullDistance >= threshold ? (
            <>
              <ArrowDown className="w-4 h-4 text-emerald-600 dark:text-emerald-400 rotate-180 transition-transform duration-200 stroke-[2.5px]" />
              <span className="text-emerald-700 dark:text-emerald-400 font-extrabold">Release to refresh</span>
            </>
          ) : (
            <>
              <ArrowDown
                className="w-4 h-4 text-stone-400 dark:text-stone-500 transition-transform stroke-[2.2px]"
                style={{
                  transform: `rotate(${Math.min(180, (pullDistance / threshold) * 180)}deg)`,
                }}
              />
              <span className="text-stone-500 dark:text-stone-400 font-medium">Pull to refresh</span>
            </>
          )}
        </div>
      </div>

      {/* ── Page Content with Elastic Rubber-Band Physics ───────────────────── */}
      <div
        className="flex-1 flex flex-col min-h-0 h-full w-full"
        style={{
          transform: pullDistance > 0 ? `translateY(${pullDistance * 0.4}px)` : undefined,
          transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.18, 0.89, 0.32, 1.28)',
        }}
      >
        {children}
      </div>
    </div>
  );
};

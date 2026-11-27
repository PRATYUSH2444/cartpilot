import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, ShoppingBag, Truck, ArrowRight, ArrowLeft, X } from 'lucide-react';

interface WelcomeSheetProps {
  isOpen: boolean;
  onComplete: () => void;
}

interface SlideItem {
  tag: string;
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  iconBg: string;
  iconColor: string;
}

const SLIDES: SlideItem[] = [
  {
    tag: 'AI Cooking Assistant',
    title: "Ask AI what you're cooking",
    subtitle: 'Dish → full shopping list in one tap.',
    icon: Sparkles,
    iconBg: 'bg-purple-100 dark:bg-purple-950/70 border border-purple-200 dark:border-purple-800',
    iconColor: 'text-purple-700 dark:text-purple-300',
  },
  {
    tag: 'Budget Intelligence',
    title: 'One tap to cart',
    subtitle: 'Fresh ingredients that fit your budget.',
    icon: ShoppingBag,
    iconBg: 'bg-emerald-100 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800',
    iconColor: 'text-emerald-700 dark:text-emerald-300',
  },
  {
    tag: 'Daily Harvest Schedule',
    title: 'Fresh, on your schedule',
    subtitle: '6–10 AM delivery, spend guard.',
    icon: Truck,
    iconBg: 'bg-sky-100 dark:bg-sky-950/70 border border-sky-200 dark:border-sky-800',
    iconColor: 'text-sky-700 dark:text-sky-300',
  },
];

export const WelcomeSheet: React.FC<WelcomeSheetProps> = ({ isOpen, onComplete }) => {
  const [activeSlide, setActiveSlide] = useState(0);
  const touchStartXRef = useRef<number | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleDismiss();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, activeSlide]);

  if (!isOpen) return null;

  const handleDismiss = () => {
    try {
      localStorage.setItem('cartpilot_welcome_sheet_seen', 'true');
    } catch {
      // Ignore
    }
    onComplete();
  };

  const handleNext = () => {
    if (activeSlide < SLIDES.length - 1) {
      setActiveSlide((curr) => curr + 1);
    } else {
      handleDismiss();
    }
  };

  const handlePrev = () => {
    if (activeSlide > 0) {
      setActiveSlide((curr) => curr - 1);
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null) return;
    const diff = touchStartXRef.current - e.changedTouches[0].clientX;
    if (diff > 40) {
      // Swiped left -> next
      handleNext();
    } else if (diff < -40) {
      // Swiped right -> prev
      handlePrev();
    }
    touchStartXRef.current = null;
  };

  const current = SLIDES[activeSlide];
  const IconComp = current.icon;
  const isLast = activeSlide === SLIDES.length - 1;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Welcome to CartPilot"
      onClick={handleDismiss}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-300 select-none"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className="w-full sm:max-w-md bg-white dark:bg-stone-900 rounded-t-3xl sm:rounded-3xl border border-stone-200/90 dark:border-stone-800 shadow-2xl p-6 sm:p-7 space-y-6 animate-in slide-in-from-bottom duration-300 relative text-[#18231F] dark:text-[#EAF1EC]"
      >
        {/* Top Header: Dot Indicators & Always-Visible Skip */}
        <div className="flex items-center justify-between">
          {/* Dot Indicator */}
          <div className="flex items-center gap-1.5" aria-label={`Slide ${activeSlide + 1} of ${SLIDES.length}`}>
            {SLIDES.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setActiveSlide(idx)}
                className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                  activeSlide === idx
                    ? 'w-6 bg-[#08643D] dark:bg-[#43C07D]'
                    : 'w-2 bg-stone-300 dark:bg-stone-700 hover:bg-stone-400'
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>

          {/* Always-Visible Skip Button */}
          <button
            type="button"
            onClick={handleDismiss}
            className="flex items-center gap-1 text-xs font-semibold text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white transition-colors cursor-pointer px-2 py-1 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800"
            aria-label="Skip introduction"
          >
            <span>Skip</span>
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Slide Visual Accent & Icon */}
        <div className="flex flex-col items-center text-center space-y-4 py-2">
          <div
            className={`w-20 h-20 rounded-3xl ${current.iconBg} ${current.iconColor} flex items-center justify-center shadow-lg transition-all duration-300 transform scale-100`}
          >
            <IconComp className="w-10 h-10" />
          </div>

          <div className="space-y-1.5 max-w-sm">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-800 dark:text-emerald-400">
              {current.tag}
            </span>
            <h2 className="font-heading font-extrabold text-xl sm:text-2xl text-stone-900 dark:text-white tracking-tight leading-snug">
              {current.title}
            </h2>
            <p className="text-sm text-stone-500 dark:text-stone-400 font-medium leading-relaxed">
              {current.subtitle}
            </p>
          </div>
        </div>

        {/* Footer Navigation Buttons */}
        <div className="flex items-center gap-3 pt-2">
          {activeSlide > 0 && (
            <button
              type="button"
              onClick={handlePrev}
              className="py-3 px-4 rounded-xl border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 font-heading font-bold text-sm transition-colors cursor-pointer flex items-center justify-center"
              aria-label="Previous slide"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}

          <button
            type="button"
            onClick={handleNext}
            className={`flex-1 py-3.5 px-5 rounded-xl font-heading font-bold text-sm shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-[0.99] ${
              isLast
                ? 'bg-[#08643D] hover:bg-[#064E30] text-white shadow-emerald-700/25'
                : 'bg-stone-900 hover:bg-stone-800 dark:bg-white dark:hover:bg-stone-100 text-white dark:text-stone-900'
            }`}
          >
            <span>{isLast ? 'Start shopping' : 'Next'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

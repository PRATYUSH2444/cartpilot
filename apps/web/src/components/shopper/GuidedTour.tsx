import React, { useState, useEffect, useCallback } from 'react';
import { ArrowRight, ArrowLeft, X, Sparkles, Check } from 'lucide-react';

export interface TourStep {
  targetAttr: string;
  title: string;
  text: string;
}

const TOUR_STEPS: TourStep[] = [
  {
    targetAttr: 'search',
    title: 'Smart Product Search',
    text: 'Find fresh vegetables, daily essentials, or pantry staples in seconds.',
  },
  {
    targetAttr: 'ai-assistant',
    title: 'AI Cooking Assistant',
    text: "Tell AI what you're cooking to generate instant recipe ingredient carts.",
  },
  {
    targetAttr: 'cart',
    title: 'Instant Optimistic Cart',
    text: 'Zero-latency cart with instant steppers and live policy checks.',
  },
  {
    targetAttr: 'wallet',
    title: 'Wallet & Budget Guard',
    text: 'Fast 1-tap checkout protected by autonomous daily spending limits.',
  },
  {
    targetAttr: 'delivery-location',
    title: 'Morning Delivery Point',
    text: 'Set your address for guaranteed 6–10 AM farm deliveries.',
  },
  {
    targetAttr: 'account',
    title: 'Account & Orders',
    text: 'Track live harvest orders and replay this tour anytime.',
  },
];

interface GuidedTourProps {
  isOpen: boolean;
  onComplete: () => void;
}

interface TargetRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

export const GuidedTour: React.FC<GuidedTourProps> = ({ isOpen, onComplete }) => {
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [targetRect, setTargetRect] = useState<TargetRect | null>(null);

  const finishTour = useCallback(() => {
    try {
      localStorage.setItem('cartpilot_tour_completed', 'true');
    } catch {
      // Ignore
    }
    onComplete();
  }, [onComplete]);

  // Position recalculation for active target
  const updateTargetPosition = useCallback((stepIdx: number) => {
    if (stepIdx >= TOUR_STEPS.length) {
      finishTour();
      return;
    }

    const step = TOUR_STEPS[stepIdx];
    const el = document.querySelector(`[data-tour="${step.targetAttr}"]`);

    if (!el) {
      // Step target missing: silently skip to next step
      if (stepIdx < TOUR_STEPS.length - 1) {
        setCurrentStepIdx(stepIdx + 1);
      } else {
        finishTour();
      }
      return;
    }

    // Scroll into view smoothly if needed
    el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });

    // Measure bounding rect
    const updateRect = () => {
      const rect = el.getBoundingClientRect();
      // Ensure target has non-zero size
      if (rect.width > 0 && rect.height > 0) {
        setTargetRect({
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
        });
      } else if (stepIdx < TOUR_STEPS.length - 1) {
        // If element is hidden (e.g. 0 width/height), skip
        setCurrentStepIdx(stepIdx + 1);
      } else {
        finishTour();
      }
    };

    updateRect();
    const timeout = setTimeout(updateRect, 350); // Re-measure after smooth scroll

    return () => clearTimeout(timeout);
  }, [finishTour]);

  useEffect(() => {
    if (!isOpen) return;

    const cleanupTimeout = updateTargetPosition(currentStepIdx);

    const handleScrollOrResize = () => {
      const step = TOUR_STEPS[currentStepIdx];
      const el = document.querySelector(`[data-tour="${step.targetAttr}"]`);
      if (el) {
        const rect = el.getBoundingClientRect();
        setTargetRect({
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
        });
      }
    };

    window.addEventListener('scroll', handleScrollOrResize, { passive: true });
    window.addEventListener('resize', handleScrollOrResize);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        finishTour();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      if (cleanupTimeout) cleanupTimeout();
      window.removeEventListener('scroll', handleScrollOrResize);
      window.removeEventListener('resize', handleScrollOrResize);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, currentStepIdx, updateTargetPosition, finishTour]);

  if (!isOpen) return null;

  const handleNext = () => {
    if (currentStepIdx < TOUR_STEPS.length - 1) {
      setCurrentStepIdx((c) => c + 1);
    } else {
      finishTour();
    }
  };

  const handlePrev = () => {
    if (currentStepIdx > 0) {
      setCurrentStepIdx((c) => c - 1);
    }
  };

  const currentStep = TOUR_STEPS[currentStepIdx];
  const isLast = currentStepIdx === TOUR_STEPS.length - 1;

  // Tooltip positioning logic
  // Determine if tooltip sits above or below target based on viewport space
  const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 800;
  const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 380;

  const targetCenterY = targetRect ? targetRect.top + targetRect.height / 2 : viewportHeight / 2;
  const isTargetInUpperHalf = targetCenterY < viewportHeight * 0.55;

  // Tooltip coordinates
  let tooltipTop = 100;
  if (targetRect) {
    if (isTargetInUpperHalf) {
      // Below target
      tooltipTop = Math.min(targetRect.top + targetRect.height + 14, viewportHeight - 220);
    } else {
      // Above target
      tooltipTop = Math.max(targetRect.top - 180, 16);
    }
  }

  // Horizontal clamping
  const tooltipWidth = Math.min(320, viewportWidth - 32);
  let tooltipLeft = targetRect
    ? Math.max(16, Math.min(targetRect.left + targetRect.width / 2 - tooltipWidth / 2, viewportWidth - tooltipWidth - 16))
    : 16;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Interactive Guided Tour"
      className="fixed inset-0 z-50 pointer-events-auto select-none"
    >
      {/* ── Spotlight Box with Massive Mask Shadow ── */}
      {targetRect && (
        <div
          style={{
            position: 'fixed',
            top: `${Math.max(0, targetRect.top - 6)}px`,
            left: `${Math.max(0, targetRect.left - 6)}px`,
            width: `${targetRect.width + 12}px`,
            height: `${targetRect.height + 12}px`,
            borderRadius: '16px',
            boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.65)',
            transition: 'all 300ms cubic-bezier(0.16, 1, 0.3, 1)',
            pointerEvents: 'none',
          }}
          className="border-2 border-emerald-400 dark:border-emerald-500 ring-4 ring-emerald-500/20"
        />
      )}

      {/* Dim backdrop click-to-dismiss */}
      <div
        className="fixed inset-0 pointer-events-auto"
        onClick={finishTour}
        aria-hidden="true"
      />

      {/* ── Guided Tour Tooltip Card ── */}
      <div
        style={{
          position: 'fixed',
          top: `${tooltipTop}px`,
          left: `${tooltipLeft}px`,
          width: `${tooltipWidth}px`,
          transition: 'top 300ms cubic-bezier(0.16, 1, 0.3, 1), left 300ms cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        onClick={(e) => e.stopPropagation()}
        className="pointer-events-auto bg-white dark:bg-stone-900 border border-stone-200/90 dark:border-stone-800 rounded-2xl shadow-2xl p-4 sm:p-4.5 space-y-3 z-50 text-[#18231F] dark:text-[#EAF1EC] animate-in zoom-in-95 duration-200"
      >
        {/* Header: Step counter & Skip button */}
        <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-2">
          <div className="flex items-center gap-1.5 text-[11px] font-extrabold text-emerald-800 dark:text-emerald-400">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Step {currentStepIdx + 1} of {TOUR_STEPS.length}</span>
          </div>

          <button
            type="button"
            onClick={finishTour}
            className="flex items-center gap-1 text-[11px] font-semibold text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 cursor-pointer transition-colors"
            aria-label="Skip tour"
          >
            <span>Skip</span>
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-1">
          <h3 className="font-heading font-extrabold text-sm text-stone-900 dark:text-white leading-tight">
            {currentStep.title}
          </h3>
          <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed font-medium">
            {currentStep.text}
          </p>
        </div>

        {/* Progress Bar & Actions */}
        <div className="flex items-center justify-between pt-1 gap-2">
          {/* Back Button */}
          {currentStepIdx > 0 ? (
            <button
              type="button"
              onClick={handlePrev}
              className="py-1.5 px-3 rounded-lg border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
              aria-label="Previous step"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
          ) : (
            <div className="w-1" />
          )}

          {/* Next / Done Button */}
          <button
            type="button"
            onClick={handleNext}
            className="py-1.5 px-3.5 rounded-lg bg-[#08643D] hover:bg-[#064E30] text-white font-heading font-bold text-xs shadow-xs transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 ml-auto"
          >
            <span>{isLast ? 'Done' : 'Next'}</span>
            {isLast ? <Check className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
    </div>
  );
};

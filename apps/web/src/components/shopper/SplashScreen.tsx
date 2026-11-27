import React, { useEffect, useState } from 'react';
import { Leaf } from 'lucide-react';

interface SplashScreenProps {
  onComplete: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [shouldRender, setShouldRender] = useState(() => {
    try {
      return sessionStorage.getItem('cartpilot_session_splash_seen') !== 'true';
    } catch {
      return true;
    }
  });

  useEffect(() => {
    if (!shouldRender) {
      onComplete();
      return;
    }

    // Start fade-out at 900ms, complete by 1200ms (~1.2s max)
    const fadeTimer = setTimeout(() => {
      setIsFadingOut(true);
    }, 900);

    const endTimer = setTimeout(() => {
      try {
        sessionStorage.setItem('cartpilot_session_splash_seen', 'true');
      } catch {
        // Ignore session storage errors
      }
      setShouldRender(false);
      onComplete();
    }, 1200);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(endTimer);
    };
  }, [shouldRender, onComplete]);

  const handleDismissEarly = () => {
    try {
      sessionStorage.setItem('cartpilot_session_splash_seen', 'true');
    } catch {
      // Ignore
    }
    setShouldRender(false);
    onComplete();
  };

  if (!shouldRender) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Loading CartPilot"
      onClick={handleDismissEarly}
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center p-6 bg-[#FAFAF7] dark:bg-[#0E1411] text-[#18231F] dark:text-[#EAF1EC] select-none transition-opacity duration-300 ease-out cursor-pointer ${
        isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      <div className="flex flex-col items-center text-center space-y-4 animate-in zoom-in-95 fade-in duration-300">
        {/* Brand Leaf Icon */}
        <div className="relative">
          <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-3xl bg-[#08643D] dark:bg-[#43C07D] flex items-center justify-center text-white shadow-xl shadow-[#08643D]/20 dark:shadow-[#43C07D]/20">
            <Leaf className="w-10 h-10 sm:w-11 sm:h-11 fill-white dark:fill-[#0E1411] text-white dark:text-[#0E1411]" />
          </div>
          <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-400 text-stone-950 flex items-center justify-center text-xs shadow-md">
            🌱
          </span>
        </div>

        {/* Brand Name & Motto */}
        <div className="space-y-1">
          <h1 className="font-heading font-extrabold text-3xl sm:text-4xl tracking-tight text-[#18231F] dark:text-[#EAF1EC]">
            CartPilot
          </h1>
          <p className="text-xs sm:text-sm font-semibold text-emerald-800 dark:text-emerald-400 tracking-wide uppercase">
            Fresh Farm · Agentic Commerce
          </p>
        </div>

        {/* Minimal Hairline Progress Accent */}
        <div className="w-24 h-0.5 rounded-full bg-stone-200 dark:bg-stone-800 overflow-hidden mt-2">
          <div className="w-full h-full bg-[#08643D] dark:bg-[#43C07D] animate-pulse rounded-full" />
        </div>
      </div>
    </div>
  );
};

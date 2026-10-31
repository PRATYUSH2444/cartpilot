import React from 'react';
import { Leaf, ArrowRight } from 'lucide-react';

interface SplashScreenProps {
  isOpen: boolean;
  onGetStarted: () => void;
  onSignIn?: () => void;
  onClose?: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({
  isOpen,
  onGetStarted,
  onSignIn,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[--bg] flex flex-col justify-between p-6 max-w-md mx-auto animate-in fade-in duration-300">
      {/* Top Logo & Title */}
      <div className="pt-8 flex flex-col items-center text-center space-y-3">
        <div className="w-16 h-16 rounded-3xl bg-[--brand] flex items-center justify-center text-white shadow-lg">
          <Leaf className="w-9 h-9" />
        </div>
        <div>
          <h1 className="font-heading font-extrabold text-2xl text-[--ink] tracking-tight">
            CartPilot
          </h1>
          <p className="font-heading font-bold text-sm text-[--brand] tracking-wider uppercase">
            AI Shopping
          </p>
          <p className="text-xs text-[--mut] mt-1.5 max-w-[220px] mx-auto">
            Groceries made simple with the power of agentic AI
          </p>
        </div>
      </div>

      {/* Center Illustration Graphic */}
      <div className="my-auto py-8 flex flex-col items-center justify-center">
        <div className="relative w-56 h-56 rounded-full bg-[--brand-soft]/60 flex items-center justify-center shadow-inner">
          <span className="text-8xl select-none filter drop-shadow-xl animate-pulse">
            🥦
          </span>
          <span className="absolute -bottom-2 -right-2 text-6xl select-none filter drop-shadow-lg">
            🍅
          </span>
          <span className="absolute -top-2 -left-2 text-5xl select-none filter drop-shadow-lg">
            🥕
          </span>
        </div>
      </div>

      {/* Bottom Action Buttons */}
      <div className="pb-4 space-y-3 w-full">
        <button
          onClick={onGetStarted}
          className="w-full py-4 px-6 rounded-full bg-[--brand] hover:bg-[--brand-hover] text-white font-heading font-bold text-sm shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 min-h-[48px]"
        >
          <span>Get Started</span>
          <ArrowRight className="w-4 h-4" />
        </button>

        {onSignIn && (
          <button
            onClick={onSignIn}
            className="w-full py-3.5 px-6 rounded-full bg-[--surface] border border-[--line] text-[--ink] font-heading font-semibold text-sm hover:bg-[--surface-2] transition-colors cursor-pointer min-h-[44px]"
          >
            Sign In
          </button>
        )}
      </div>
    </div>
  );
};

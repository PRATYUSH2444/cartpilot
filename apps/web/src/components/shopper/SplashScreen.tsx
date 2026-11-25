import React from 'react';
import { Leaf, ArrowRight, Truck, ShieldCheck } from 'lucide-react';

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
    <div className="fixed inset-0 z-50 bg-gradient-to-b from-emerald-50 via-white to-emerald-50/50 dark:from-stone-950 dark:via-stone-900 dark:to-stone-950 flex flex-col justify-between p-6 max-w-md mx-auto animate-in fade-in duration-300">
      {/* Top Logo & Title */}
      <div className="pt-8 flex flex-col items-center text-center space-y-3">
        <div className="relative">
          <div className="w-20 h-20 rounded-3xl bg-emerald-600 flex items-center justify-center text-white shadow-xl shadow-emerald-600/20">
            <Leaf className="w-11 h-11 fill-white" />
          </div>
          <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-emerald-400 text-stone-950 flex items-center justify-center text-xs font-bold shadow">
            🌱
          </div>
        </div>

        <div>
          <div className="flex items-center justify-center gap-2">
            <h1 className="font-heading font-extrabold text-3xl text-stone-900 dark:text-white tracking-tight">
              CartPilot
            </h1>
            <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-800">
              100% Veg
            </span>
          </div>
          <p className="font-heading font-bold text-xs text-emerald-600 dark:text-emerald-400 tracking-wider uppercase mt-1">
            Fresh Pick · Fayda Quick
          </p>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-2 max-w-[260px] mx-auto leading-relaxed">
            Fresh Fruits & Vegetables Delivered Every Morning with Agentic AI Shopping
          </p>
        </div>
      </div>

      {/* Center Visual Illustration */}
      <div className="my-auto py-6 flex flex-col items-center justify-center">
        <div className="relative w-64 h-64 rounded-full bg-emerald-100/50 dark:bg-emerald-950/30 flex items-center justify-center shadow-inner border border-emerald-500/20">
          <span className="text-8xl select-none filter drop-shadow-2xl animate-bounce">
            🥦
          </span>
          <span className="absolute -bottom-1 -right-1 text-6xl select-none filter drop-shadow-lg">
            🍅
          </span>
          <span className="absolute -top-1 -left-1 text-5xl select-none filter drop-shadow-lg">
            🥕
          </span>
          <span className="absolute top-8 right-2 text-4xl select-none filter drop-shadow-md">
            🍋
          </span>
          <span className="absolute bottom-6 left-2 text-4xl select-none filter drop-shadow-md">
            🍇
          </span>
        </div>

        {/* Feature Highlights Pills */}
        <div className="flex items-center gap-2 mt-6">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
            <Truck className="w-3.5 h-3.5" />
            <span>Order till Midnight · 6 AM Delivery</span>
          </div>
        </div>
      </div>

      {/* Bottom Action Buttons */}
      <div className="pb-4 space-y-3 w-full">
        <button
          onClick={onGetStarted}
          className="w-full py-4 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-heading font-bold text-sm shadow-lg shadow-emerald-600/25 transition-all cursor-pointer flex items-center justify-center gap-2 min-h-[48px] active:scale-[0.99]"
        >
          <span>Explore Fresh Groceries</span>
          <ArrowRight className="w-4 h-4" />
        </button>

        {onSignIn && (
          <button
            onClick={onSignIn}
            className="w-full py-3.5 px-6 rounded-2xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-800 dark:text-stone-100 font-heading font-semibold text-sm hover:bg-stone-50 dark:hover:bg-stone-750 transition-colors cursor-pointer min-h-[44px]"
          >
            Sign In with Mobile OTP
          </button>
        )}

        <div className="flex items-center justify-center gap-1 text-[10px] text-stone-400 pt-1">
          <ShieldCheck className="w-3 h-3 text-emerald-600" />
          <span>FSSAI Certified · Farm Fresh Guarantee</span>
        </div>
      </div>
    </div>
  );
};

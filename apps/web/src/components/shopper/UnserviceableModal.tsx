import React from 'react';
import { X } from 'lucide-react';

interface UnserviceableModalProps {
  isOpen: boolean;
  onClose: () => void;
  locality?: string;
}

export const UnserviceableModal: React.FC<UnserviceableModalProps> = ({
  isOpen,
  onClose,
  locality,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm bg-white dark:bg-stone-900 rounded-3xl p-8 shadow-2xl text-center border border-emerald-500/20 text-stone-800 dark:text-stone-100 animate-in zoom-in-95 duration-200">
        {/* Subtle close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 flex items-center justify-center transition-colors cursor-pointer"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Center Circular Icon matching SBZee screenshot */}
        <div className="relative mx-auto my-4 w-36 h-36 flex items-center justify-center">
          {/* Outer soft emerald glow */}
          <div className="absolute inset-0 rounded-full bg-emerald-50 dark:bg-emerald-950/40" />

          {/* Concentric rings */}
          <div className="absolute w-28 h-28 rounded-full border-4 border-emerald-800/30 dark:border-emerald-700/40" />
          <div className="absolute w-20 h-20 rounded-full border-4 border-emerald-700/50 dark:border-emerald-600/50" />

          {/* Center Pin Graphic with Sad Face */}
          <div className="relative z-10 w-20 h-24 flex flex-col items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-emerald-600 dark:bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-600/30">
              <div className="w-10 h-10 rounded-full border-2 border-white/80 flex items-center justify-center">
                <span className="text-2xl select-none leading-none">☹️</span>
              </div>
            </div>
            {/* Pin triangle tail */}
            <div className="w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[10px] border-t-emerald-600 dark:border-t-emerald-500 -mt-0.5" />
          </div>
        </div>

        {/* Title & Description matching Reference screenshot 5 */}
        <div className="mt-4 mb-6">
          <h2 className="font-extrabold text-2xl text-stone-900 dark:text-white tracking-tight">
            We&apos;ll be back soon
          </h2>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-2 max-w-[240px] mx-auto leading-relaxed">
            Currently we are not serving at this location
            {locality ? ` (${locality})` : ''}.
          </p>
        </div>

        {/* Back Button matching Reference screenshot 5 */}
        <button
          onClick={onClose}
          className="w-full py-3.5 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md shadow-emerald-600/25 transition-all cursor-pointer active:scale-[0.99]"
        >
          Back
        </button>
      </div>
    </div>
  );
};

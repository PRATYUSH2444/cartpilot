import React, { useState } from 'react';
import { X, Ticket, Check } from 'lucide-react';

interface CouponsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyCoupon?: (code: string) => void;
}

const AVAILABLE_COUPONS = [
  {
    code: 'VEGFRESH',
    discount: '10% OFF',
    description: '10% discount on all certified farm-fresh fruits and vegetables.',
    minOrder: '₹200',
    validTill: 'Ongoing',
  },
  {
    code: 'MORNING',
    discount: '₹50 OFF',
    description: 'Flat ₹50 savings on scheduled morning delivery (6 AM – 9 AM).',
    minOrder: '₹300',
    validTill: 'Tomorrow morning',
  },
  {
    code: 'FRESH20',
    discount: '₹20 OFF',
    description: 'Flat ₹20 discount on your everyday grocery basket.',
    minOrder: '₹150',
    validTill: 'This week',
  },
  {
    code: 'WELCOME100',
    discount: '₹100 OFF',
    description: 'Flat ₹100 welcome bonus savings on orders above ₹500.',
    minOrder: '₹500',
    validTill: 'First order only',
  },
];

export const CouponsModal: React.FC<CouponsModalProps> = ({
  isOpen,
  onClose,
  onApplyCoupon,
}) => {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopyOrApply = (code: string) => {
    if (onApplyCoupon) {
      onApplyCoupon(code);
    }
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(code);
    }
    setCopiedCode(code);
    setTimeout(() => {
      setCopiedCode(null);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white dark:bg-stone-900 rounded-3xl shadow-2xl border border-stone-200 dark:border-stone-800 overflow-hidden text-stone-900 dark:text-stone-100 animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 flex items-center justify-center shadow-2xs">
              <Ticket className="w-4 h-4 fill-purple-600 text-purple-600" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-stone-900 dark:text-white leading-none">
                Available Coupons
              </h3>
              <p className="text-[11px] text-stone-400 mt-0.5">
                Apply promo codes to save on fresh groceries
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-500 hover:text-stone-900 flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Coupons List */}
        <div className="p-6 space-y-3 overflow-y-auto">
          {AVAILABLE_COUPONS.map((coupon) => (
            <div
              key={coupon.code}
              className="rounded-2xl border border-dashed border-purple-300 dark:border-purple-800 bg-purple-50/40 dark:bg-purple-950/20 p-4 relative overflow-hidden flex flex-col justify-between space-y-3 group"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-black text-sm tracking-widest text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-900/60 px-2.5 py-0.5 rounded-lg border border-purple-200 dark:border-purple-700">
                      {coupon.code}
                    </span>
                    <span className="font-extrabold text-xs text-emerald-600 dark:text-emerald-400">
                      {coupon.discount}
                    </span>
                  </div>
                  <p className="text-xs text-stone-600 dark:text-stone-300">
                    {coupon.description}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleCopyOrApply(coupon.code)}
                  className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center gap-1 shadow-xs transition-all cursor-pointer flex-shrink-0"
                >
                  {copiedCode === coupon.code ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Applied!</span>
                    </>
                  ) : (
                    <span>Apply</span>
                  )}
                </button>
              </div>

              <div className="flex items-center justify-between text-[10px] text-stone-400 pt-1 border-t border-purple-200/40 dark:border-purple-900/40">
                <span>Min order: {coupon.minOrder}</span>
                <span>Valid: {coupon.validTill}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

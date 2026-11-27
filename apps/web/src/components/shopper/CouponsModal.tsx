import React, { useState } from 'react';
import { X, Ticket, Check, Copy, Sparkles, AlertCircle } from 'lucide-react';
import { OFFICIAL_COUPONS, validateAndComputeCoupon } from '../../config/couponConfig';

interface CouponsModalProps {
  isOpen: boolean;
  onClose: () => void;
  showApply?: boolean;
  onApplyCoupon?: (code: string) => void;
  itemsTotalRupees?: number;
  isFirstOrder?: boolean;
}

export const CouponsModal: React.FC<CouponsModalProps> = ({
  isOpen,
  onClose,
  showApply = false,
  onApplyCoupon,
  itemsTotalRupees = 0,
  isFirstOrder = true,
}) => {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopy = (code: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(code);
    }
    setCopiedCode(code);
    setTimeout(() => {
      setCopiedCode(null);
    }, 1600);
  };

  const handleApply = (code: string) => {
    if (onApplyCoupon) {
      onApplyCoupon(code);
    }
    handleCopy(code);
    setTimeout(() => {
      onClose();
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white dark:bg-zinc-950 rounded-3xl shadow-2xl border border-stone-200/80 dark:border-zinc-800 overflow-hidden text-stone-900 dark:text-zinc-100 animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-stone-150 dark:border-zinc-800 bg-stone-50/60 dark:bg-zinc-900/60 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shadow-2xs border border-purple-500/20">
              <Ticket className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-stone-900 dark:text-white leading-none">
                Available Promotions
              </h3>
              <p className="text-[11px] text-stone-400 dark:text-zinc-400 mt-0.5">
                {showApply
                  ? 'Apply discount directly to your current basket'
                  : 'Official verified savings vouchers'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-stone-100 dark:bg-zinc-800 text-stone-500 hover:text-stone-900 dark:hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Coupons List */}
        <div className="p-4 space-y-3 overflow-y-auto">
          {OFFICIAL_COUPONS.map((coupon) => {
            const validation = validateAndComputeCoupon(
              coupon.code,
              itemsTotalRupees,
              isFirstOrder
            );
            const isEligible = validation.isValid;

            return (
              <div
                key={coupon.code}
                className={`rounded-2xl border p-3.5 relative overflow-hidden flex flex-col justify-between space-y-2.5 transition-colors ${
                  isEligible
                    ? 'border-stone-300 dark:border-zinc-700 bg-stone-50/70 dark:bg-zinc-900 shadow-2xs hover:border-emerald-500/50'
                    : 'border-stone-200 dark:border-zinc-800 bg-stone-50/30 dark:bg-zinc-900/40 opacity-70'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-black text-xs sm:text-sm tracking-wider text-stone-900 dark:text-white bg-stone-200/70 dark:bg-zinc-800 px-2 py-0.5 rounded-lg border border-stone-300 dark:border-zinc-700">
                        {coupon.code}
                      </span>
                      <span className="font-bold text-xs text-stone-900 dark:text-white">
                        FLAT ₹{coupon.discountAmount} OFF
                      </span>
                      {coupon.badge && (
                        <span className="text-[9px] font-black uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 px-1.5 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800 flex items-center gap-0.5">
                          <Sparkles className="w-2.5 h-2.5" />
                          {coupon.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-stone-600 dark:text-zinc-300 font-medium leading-snug">
                      {coupon.description}
                    </p>
                  </div>

                  {/* Right Action: Apply or Copy */}
                  {showApply ? (
                    <button
                      type="button"
                      disabled={!isEligible}
                      onClick={() => handleApply(coupon.code)}
                      className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1 shadow-2xs transition-all flex-shrink-0 ${
                        isEligible
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer active:scale-95'
                          : 'bg-stone-200 dark:bg-zinc-800 text-stone-400 dark:text-zinc-600 cursor-not-allowed border border-stone-300 dark:border-zinc-700'
                      }`}
                    >
                      {copiedCode === coupon.code ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Applied</span>
                        </>
                      ) : (
                        <span>Apply</span>
                      )}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleCopy(coupon.code)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer flex-shrink-0 active:scale-95 ${
                        copiedCode === coupon.code
                          ? 'bg-emerald-600 text-white'
                          : 'bg-white dark:bg-zinc-800 text-stone-900 dark:text-white border border-stone-300 dark:border-zinc-700 hover:bg-stone-100 dark:hover:bg-zinc-700 shadow-2xs'
                      }`}
                      title="Copy coupon code"
                    >
                      {copiedCode === coupon.code ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-stone-400" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  )}
                </div>

                {/* Eligibility note / shortfall or Terms */}
                {!isEligible && validation.reason && (
                  <div className="flex items-center gap-1.5 text-[11px] text-amber-600 dark:text-amber-400 font-medium pt-0.5">
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>{validation.reason}</span>
                  </div>
                )}

                {/* Footer terms */}
                <div className="flex items-center justify-between text-[10px] text-stone-500 dark:text-zinc-400 font-medium pt-1.5 border-t border-stone-200/60 dark:border-zinc-800">
                  <span>Min order: ₹{coupon.minCartValue}</span>
                  <span>{coupon.firstOrderOnly ? 'First order only' : 'Valid on all orders'}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

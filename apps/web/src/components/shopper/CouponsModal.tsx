import React, { useState, useEffect } from 'react';
import { X, Ticket, Check, Copy, Sparkles } from 'lucide-react';

export interface CouponItem {
  id?: string;
  code: string;
  discount: string;
  description: string;
  minOrder: string;
  validTill: string;
  category?: 'all' | 'farm' | 'delivery' | 'welcome';
  badge?: string;
}

interface CouponsModalProps {
  isOpen: boolean;
  onClose: () => void;
  showApply?: boolean;
  onApplyCoupon?: (code: string) => void;
  coupons?: CouponItem[];
}

export const DEFAULT_COUPONS: CouponItem[] = [
  {
    id: 'c-vegfresh',
    code: 'VEGFRESH',
    discount: '10% OFF',
    description: '10% discount on all certified farm-fresh fruits and vegetables.',
    minOrder: '₹200',
    validTill: 'Ongoing',
    category: 'farm',
    badge: 'POPULAR',
  },
  {
    id: 'c-morning',
    code: 'MORNING',
    discount: '₹50 OFF',
    description: 'Flat ₹50 savings on scheduled morning delivery (6 AM – 9 AM).',
    minOrder: '₹300',
    validTill: 'Tomorrow morning',
    category: 'delivery',
    badge: 'EARLY BIRD',
  },
  {
    id: 'c-fresh20',
    code: 'FRESH20',
    discount: '₹20 OFF',
    description: 'Flat ₹20 discount on your everyday grocery basket.',
    minOrder: '₹150',
    validTill: 'This week',
    category: 'farm',
  },
  {
    id: 'c-welcome100',
    code: 'WELCOME100',
    discount: '₹100 OFF',
    description: 'Flat ₹100 welcome bonus savings on orders above ₹500.',
    minOrder: '₹500',
    validTill: 'First order only',
    category: 'welcome',
    badge: 'NEW USER',
  },
  {
    id: 'c-organic15',
    code: 'ORGANIC15',
    discount: '15% OFF',
    description: 'Flat 15% discount on certified organic grains, dals, and cold-pressed oils.',
    minOrder: '₹400',
    validTill: 'Limited period',
    category: 'farm',
  },
];

export const CouponsModal: React.FC<CouponsModalProps> = ({
  isOpen,
  onClose,
  showApply = false,
  onApplyCoupon,
  coupons,
}) => {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [couponsList, setCouponsList] = useState<CouponItem[]>(coupons || DEFAULT_COUPONS);
  const [filterCategory, setFilterCategory] = useState<string>('all');

  // Dynamically sync coupons from props or merchant/admin updates
  useEffect(() => {
    if (coupons && coupons.length > 0) {
      setCouponsList(coupons);
      return;
    }
    try {
      const stored = localStorage.getItem('cartpilot_merchant_coupons');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const dynamicCoupons: CouponItem[] = parsed.map((c: any) => ({
            id: c.id || c.code,
            code: c.code,
            discount: `${c.discountPercent || 15}% OFF`,
            description: `Exclusive merchant discount of ${c.discountPercent || 15}% on farm orders.`,
            minOrder: `₹${Math.round((c.minOrderPaise || 20000) / 100)}`,
            validTill: c.validUntil || 'Active offer',
            category: 'farm',
          }));
          const combined = [
            ...dynamicCoupons,
            ...DEFAULT_COUPONS.filter((dc) => !dynamicCoupons.some((mc) => mc.code === dc.code)),
          ];
          setCouponsList(combined);
          return;
        }
      }
    } catch {
      // Fallback to DEFAULT_COUPONS
    }
    setCouponsList(DEFAULT_COUPONS);
  }, [coupons, isOpen]);

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
    }, 600);
  };

  const filteredCoupons =
    filterCategory === 'all'
      ? couponsList
      : couponsList.filter((c) => c.category === filterCategory);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white dark:bg-stone-900 rounded-3xl shadow-2xl border border-stone-200 dark:border-stone-800 overflow-hidden text-stone-900 dark:text-stone-100 animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-5 sm:px-6 py-4 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 flex items-center justify-center shadow-2xs">
              <Ticket className="w-5 h-5 fill-purple-600 text-purple-600" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-stone-900 dark:text-white leading-none">
                Available Coupons
              </h3>
              <p className="text-[11px] text-stone-400 mt-0.5">
                {showApply
                  ? 'Apply promo code to save on your cart'
                  : 'Active promo codes & verified discount offers'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-500 hover:text-stone-900 dark:hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Category Filter Chips */}
        <div className="px-5 sm:px-6 pt-3 pb-2 flex items-center gap-1.5 overflow-x-auto no-scrollbar border-b border-stone-100 dark:border-stone-800/80">
          {[
            { id: 'all', label: `All (${couponsList.length})` },
            { id: 'farm', label: 'Farm Harvest' },
            { id: 'delivery', label: 'Morning Delivery' },
            { id: 'welcome', label: 'Welcome Bonus' },
          ].map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setFilterCategory(cat.id)}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                filterCategory === cat.id
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-750'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Coupons List */}
        <div className="p-4 sm:p-6 space-y-3 overflow-y-auto">
          {filteredCoupons.map((coupon) => (
            <div
              key={coupon.code}
              className="rounded-2xl border border-dashed border-purple-300 dark:border-purple-800 bg-purple-50/40 dark:bg-purple-950/20 p-4 relative overflow-hidden flex flex-col justify-between space-y-3 group hover:border-purple-400 dark:hover:border-purple-700 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono font-black text-xs sm:text-sm tracking-widest text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-900/60 px-2.5 py-0.5 rounded-lg border border-purple-200 dark:border-purple-700">
                      {coupon.code}
                    </span>
                    <span className="font-extrabold text-xs text-emerald-600 dark:text-emerald-400">
                      {coupon.discount}
                    </span>
                    {coupon.badge && (
                      <span className="text-[9px] font-black uppercase tracking-wider bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 px-1.5 py-0.2 rounded-md border border-amber-200 dark:border-amber-800 flex items-center gap-0.5">
                        <Sparkles className="w-2.5 h-2.5" />
                        {coupon.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-stone-600 dark:text-stone-300 leading-snug">
                    {coupon.description}
                  </p>
                </div>

                {/* Right Action: Show Apply only when explicitly requested (e.g. from Cart with items); Otherwise show Copy Code */}
                {showApply ? (
                  <button
                    type="button"
                    onClick={() => handleApply(coupon.code)}
                    className="px-3.5 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center gap-1 shadow-xs transition-all cursor-pointer flex-shrink-0 active:scale-95"
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
                ) : (
                  <button
                    type="button"
                    onClick={() => handleCopy(coupon.code)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer flex-shrink-0 active:scale-95 ${
                      copiedCode === coupon.code
                        ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700'
                        : 'bg-white dark:bg-stone-800 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/80 hover:bg-purple-50 dark:hover:bg-purple-950/60 shadow-2xs'
                    }`}
                    title="Copy coupon code"
                  >
                    {copiedCode === coupon.code ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                        <span>Copy Code</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between text-[10px] text-stone-400 pt-1.5 border-t border-purple-200/50 dark:border-purple-900/40">
                <span>Min order: {coupon.minOrder}</span>
                <span>Valid: {coupon.validTill}</span>
              </div>
            </div>
          ))}

          {filteredCoupons.length === 0 && (
            <div className="text-center py-8 text-stone-400 text-xs">
              No coupons found in this category.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

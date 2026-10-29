import React from 'react';
import { ShoppingBag, ArrowRight } from 'lucide-react';
import { CartData } from '../../types';

interface StickyCartBarProps {
  cart: CartData | null;
  onOpenCart: () => void;
}

export const StickyCartBar: React.FC<StickyCartBarProps> = ({ cart, onOpenCart }) => {
  if (!cart || cart.itemCount === 0) return null;

  return (
    <div
      data-testid="sticky-cart-bar"
      className="w-full px-4 py-2 bg-transparent pointer-events-auto"
    >
      <button
        onClick={onOpenCart}
        className="w-full py-3 px-4 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white flex items-center justify-between shadow-lg shadow-emerald-900/20 transition-all cursor-pointer min-h-[48px]"
        aria-label={`View cart with ${cart.itemCount} items, total ${cart.pricing.formatted.total}`}
      >
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center font-bold text-xs">
            <ShoppingBag className="w-4 h-4 text-white" />
          </div>
          <div className="text-left">
            <span className="text-xs font-bold block font-display">
              {cart.itemCount} {cart.itemCount === 1 ? 'item' : 'items'} in Cart
            </span>
            <span className="text-[10px] text-emerald-100 font-mono">
              Pure server-side pricing
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="font-display font-extrabold text-sm tracking-tight">
            {cart.pricing.formatted.total}
          </span>
          <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </div>
      </button>
    </div>
  );
};

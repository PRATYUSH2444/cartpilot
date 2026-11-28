import React, { useEffect, useState } from 'react';
import { X, Plus, Minus, Star, ShieldCheck, Sparkles, Heart } from 'lucide-react';
import { Product, PopulatedCartItem } from '../../types';

interface ProductSheetProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  cartItems?: PopulatedCartItem[];
  onAddToCart: (productId: string, quantity: number) => void;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onViewInChat: (product: Product) => void;
}

export const ProductSheet: React.FC<ProductSheetProps> = ({
  product,
  isOpen,
  onClose,
  cartItems,
  onAddToCart,
  onUpdateQuantity,
  onViewInChat,
}) => {
  const [isWishlisted, setIsWishlisted] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [isOpen, onClose]);

  if (!isOpen || !product) return null;

  const cartItem = cartItems?.find((i) => i.productId === product._id);
  const currentInCart = cartItem?.quantity ?? 0;
  const isOutOfStock = product.availableStock <= 0;
  const priceRupees = (product.pricePaise / 100).toFixed(2);
  const originalPriceRupees = ((product.pricePaise * 1.15) / 100).toFixed(2);

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="product-sheet-title"
    >
      <div
        data-testid="product-sheet"
        className="w-full max-w-lg bg-surface border border-line rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[88dvh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header with Back / Close and Wishlist */}
        <div className="flex items-center justify-between px-5 pt-4 pb-2 border-b border-line/60">
          <button
            onClick={onClose}
            className="p-2 rounded-full text-mut hover:text-ink hover:bg-surface-2 transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 border border-emerald-700 flex items-center justify-center p-[2px]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-700" />
            </span>
            <span className="text-[11px] font-mono uppercase tracking-wider text-emerald-800 font-bold">
              Vegetarian
            </span>
          </div>

          <button
            onClick={() => setIsWishlisted(!isWishlisted)}
            className={`p-2 rounded-full transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center cursor-pointer ${
              isWishlisted ? 'text-rose-500 bg-rose-50' : 'text-mut hover:text-ink hover:bg-surface-2'
            }`}
            aria-label="Wishlist"
          >
            <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-rose-500' : ''}`} />
          </button>
        </div>

        {/* Product Visual */}
        <div className="px-6 py-4 flex items-center justify-center bg-surface-2/40">
          <img
            src={product.imageUrl || 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=500'}
            alt={product.name}
            className="w-48 h-48 sm:w-56 sm:h-56 object-contain rounded-2xl drop-shadow-md"
          />
        </div>

        {/* Product Info Body */}
        <div className="p-6 space-y-4 overflow-y-auto">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                Fresh
              </span>
              <div className="flex items-center gap-1 text-xs text-amber-600 font-bold">
                <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                <span>4.6</span>
                <span className="text-mut font-normal">(1.2K reviews)</span>
              </div>
            </div>

            <h2 id="product-sheet-title" className="text-xl sm:text-2xl font-heading font-extrabold text-ink">
              {product.name}
            </h2>
            <p className="text-xs text-mut font-mono mt-0.5">
              {product.packageSize} {product.packageUnit} · Category: {product.category}
            </p>

            {/* Price section */}
            <div className="flex items-baseline gap-2.5 mt-3">
              <span className="text-2xl font-heading font-black text-ink">
                ₹{priceRupees}
              </span>
              <span className="text-sm font-mono text-mut line-through">
                ₹{originalPriceRupees}
              </span>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                12% OFF
              </span>
            </div>
          </div>

          {/* Key Trust Badges */}
          <div className="flex flex-wrap gap-2 pt-1">
            <span className="text-[11px] font-semibold text-mut bg-surface-2 px-2.5 py-1 rounded-lg border border-line flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-brand" />
              100% Certified Veg
            </span>
            <span className="text-[11px] font-semibold text-mut bg-surface-2 px-2.5 py-1 rounded-lg border border-line flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-brand" />
              Pesticide-Free
            </span>
            <span className="text-[11px] font-semibold text-mut bg-surface-2 px-2.5 py-1 rounded-lg border border-line">
              Locally Sourced
            </span>
          </div>

          {/* Description */}
          <div>
            <h3 className="text-xs font-bold text-ink uppercase tracking-wider mb-1">About this product</h3>
            <p className="text-xs text-mut leading-relaxed">
              {product.description ||
                'Selected premium quality farm produce, freshly harvested, packaged under strict hygienic conditions with zero chemicals or artificial additives.'}
            </p>
          </div>

          {/* Stock Indicator */}
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-mut">Availability:</span>
            <span className={`font-bold ${isOutOfStock ? 'text-rose-600' : 'text-emerald-700'}`}>
              {isOutOfStock ? 'Out of stock' : `${product.availableStock} units in stock`}
            </span>
          </div>
        </div>

        {/* Sticky Action Footer */}
        <div className="p-4 border-t border-line bg-surface flex items-center gap-2.5">
          {/* Main Cart Action: Dynamic Morph between Add to Cart & Interactive Stepper */}
          {currentInCart > 0 ? (
            <div className="flex-1 flex items-center justify-between border-2 border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl p-1 text-emerald-900 dark:text-emerald-200">
              <button
                type="button"
                onClick={() => onUpdateQuantity(product._id, currentInCart - 1)}
                className="w-9 h-9 rounded-xl bg-white dark:bg-stone-900 border border-emerald-300 dark:border-emerald-700/60 flex items-center justify-center text-emerald-800 dark:text-emerald-200 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-colors cursor-pointer shadow-2xs active:scale-95"
                aria-label="Decrease quantity"
              >
                <Minus className="w-4 h-4 stroke-[2.5]" />
              </button>

              <div className="flex flex-col items-center px-2">
                <span className="font-heading font-extrabold text-xs sm:text-sm text-emerald-950 dark:text-white leading-tight">
                  {currentInCart} in Cart
                </span>
                <span className="text-[10px] font-mono text-emerald-700 dark:text-emerald-300">
                  ₹{Math.round((product.pricePaise * currentInCart) / 100)} total
                </span>
              </div>

              <button
                type="button"
                onClick={() => onUpdateQuantity(product._id, currentInCart + 1)}
                disabled={currentInCart >= product.availableStock}
                className="w-9 h-9 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center transition-colors disabled:opacity-40 cursor-pointer shadow-2xs active:scale-95"
                aria-label="Increase quantity"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => onAddToCart(product._id, 1)}
              disabled={isOutOfStock}
              className="flex-1 py-3 px-4 rounded-2xl bg-emerald-700 hover:bg-emerald-800 active:scale-[0.985] text-white font-heading font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition-all disabled:opacity-40 cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>
                {isOutOfStock ? 'Out of Stock' : `Add to Cart · ₹${priceRupees}`}
              </span>
            </button>
          )}

          {/* Ask AI about this item Button */}
          <button
            type="button"
            onClick={() => {
              onClose();
              onViewInChat(product);
            }}
            title="Ask AI Assistant for recipes and nutrition advice"
            aria-label="Ask AI Assistant about this item"
            className="px-3.5 py-3 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/60 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/50 flex items-center gap-1.5 text-xs font-bold transition-all shadow-2xs active:scale-95 cursor-pointer shrink-0"
          >
            <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400 stroke-[2.2]" />
            <span className="hidden sm:inline">Ask AI</span>
          </button>
        </div>
      </div>
    </div>
  );
};

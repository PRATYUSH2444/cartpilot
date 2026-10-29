import React, { useEffect } from 'react';
import { X, Plus, Minus, MessageSquare, Leaf, Package } from 'lucide-react';
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
  const currentQty = cartItem?.quantity ?? 0;
  const isOutOfStock = product.availableStock <= 0;
  const priceRupees = (product.pricePaise / 100).toFixed(2);
  const merchantName = (product as any).merchantName || 'Fresh Greens Organics';

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="product-sheet-title"
    >
      <div
        data-testid="product-sheet"
        className="w-full sm:max-w-lg bg-card dark:bg-card-top border border-brd rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90dvh] animate-in slide-in-from-bottom duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile Drag Handle */}
        <div className="w-12 h-1.5 bg-brd rounded-full mx-auto mt-3 mb-1 sm:hidden" />

        {/* Header / Close button */}
        <div className="flex items-center justify-between px-6 pt-3 pb-2">
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 border border-emerald-600 flex items-center justify-center p-[2px]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
            </span>
            <span className="text-[11px] font-mono uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-bold">
              100% Vegetarian
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-mut hover:text-ink hover:bg-paper transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
            aria-label="Close product sheet"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Product Visual */}
        <div className="px-6 py-2 flex items-center justify-center bg-paper/40">
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.name}
              className="w-48 h-48 sm:w-56 sm:h-56 object-contain rounded-2xl drop-shadow-md"
            />
          ) : (
            <div className="w-48 h-48 sm:w-56 sm:h-56 rounded-2xl bg-card border border-brd flex flex-col items-center justify-center text-mut p-4 text-center">
              <Package className="w-16 h-16 text-acc/40 mb-2" />
              <span className="text-xs font-mono font-medium text-ink">{product.name}</span>
              <span className="text-[10px] text-mut">{product.packageSize} {product.packageUnit}</span>
            </div>
          )}
        </div>

        {/* Product Info Body */}
        <div className="p-6 space-y-4 overflow-y-auto">
          <div>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 id="product-sheet-title" className="text-lg sm:text-xl font-display font-bold text-ink">
                  {product.name}
                </h2>
                <div className="text-xs text-mut font-mono mt-0.5">
                  Pack: {product.packageSize} {product.packageUnit} · Category: {product.category}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xl font-display font-black text-acc">
                  ₹{priceRupees}
                </div>
                <div className="text-[10px] text-mut font-mono">Inclusive of 5% GST</div>
              </div>
            </div>

            {/* Merchant Attribution */}
            <div className="mt-3 p-3 rounded-xl border border-brd bg-paper/60 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <Leaf className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] text-mut uppercase block">Merchant Attribution</span>
                  <span className="text-xs font-bold text-ink font-display">Sold by {merchantName}</span>
                </div>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold border border-emerald-500/20">
                Verified Seller
              </span>
            </div>

            {/* Description if present */}
            {product.description && (
              <p className="text-xs text-mut leading-relaxed mt-3">
                {product.description}
              </p>
            )}

            {/* Stock State */}
            <div className="mt-3 flex items-center gap-2">
              <span
                className={`text-[11px] font-mono font-semibold px-2.5 py-1 rounded-lg border ${
                  isOutOfStock
                    ? 'bg-rose-500/10 text-rose-600 border-rose-500/20'
                    : product.availableStock <= 5
                      ? 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                      : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                }`}
              >
                {isOutOfStock
                  ? 'Out of Stock'
                  : product.availableStock <= 5
                    ? `Only ${product.availableStock} left in stock`
                    : `In Stock (${product.availableStock} available)`}
              </span>
            </div>
          </div>

          {/* Action Row */}
          <div className="pt-2 border-t border-brd flex flex-col sm:flex-row gap-3">
            {/* Cart Stepper / Add */}
            <div className="flex-1">
              {currentQty > 0 ? (
                <div className="flex items-center justify-between border border-emerald-600/40 rounded-xl bg-card p-1">
                  <button
                    onClick={() => onUpdateQuantity(product._id, currentQty - 1)}
                    className="p-2.5 hover:bg-paper text-mut hover:text-ink rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
                    aria-label="Decrease quantity"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="font-mono text-sm font-bold text-ink">
                    {currentQty} in cart (₹{((product.pricePaise * currentQty) / 100).toFixed(2)})
                  </span>
                  <button
                    onClick={() => onUpdateQuantity(product._id, currentQty + 1)}
                    disabled={currentQty >= product.availableStock}
                    className="p-2.5 hover:bg-paper text-mut hover:text-ink rounded-lg transition-colors disabled:opacity-40 min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
                    aria-label="Increase quantity"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => onAddToCart(product._id, 1)}
                  disabled={isOutOfStock}
                  className="w-full py-3 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-display font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-900/20 transition-all disabled:opacity-40 min-h-[44px] cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add to Cart · ₹{priceRupees}</span>
                </button>
              )}
            </div>

            {/* View In Chat Action */}
            <button
              onClick={() => {
                onClose();
                onViewInChat(product);
              }}
              className="py-3 px-4 rounded-xl border border-brd bg-paper hover:bg-paper/80 text-ink font-display font-semibold text-xs flex items-center justify-center gap-2 transition-all min-h-[44px] cursor-pointer"
            >
              <MessageSquare className="w-4 h-4 text-acc" />
              <span>Ask AI in Chat</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

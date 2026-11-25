import React from 'react';
import { X, Heart, Plus, Trash2 } from 'lucide-react';
import { Product } from '../../types';

interface WishlistModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  favoriteIds: string[];
  onRemoveFavorite: (productId: string) => void;
  onAddToCart: (productId: string, quantity: number) => void;
  onSelectProduct: (product: Product) => void;
}

export const WishlistModal: React.FC<WishlistModalProps> = ({
  isOpen,
  onClose,
  products,
  favoriteIds,
  onRemoveFavorite,
  onAddToCart,
  onSelectProduct,
}) => {
  if (!isOpen) return null;

  const favoriteProducts = products.filter((p) => favoriteIds.includes(p._id));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white dark:bg-stone-900 rounded-3xl shadow-2xl border border-stone-200 dark:border-stone-800 overflow-hidden flex flex-col max-h-[85vh] text-stone-900 dark:text-stone-100 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-500 flex items-center justify-center shadow-2xs">
              <Heart className="w-4 h-4 fill-rose-500" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-stone-900 dark:text-white leading-none">
                My Wishlist & Favorites
              </h3>
              <p className="text-[11px] text-stone-400 mt-0.5">
                {favoriteProducts.length} saved {favoriteProducts.length === 1 ? 'item' : 'items'}
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

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {favoriteProducts.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-16 h-16 mx-auto rounded-3xl bg-rose-50 dark:bg-rose-950/30 flex items-center justify-center text-rose-300">
                <Heart className="w-8 h-8" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-stone-800 dark:text-stone-200">
                  Your wishlist is empty
                </h4>
                <p className="text-xs text-stone-400 mt-1 max-w-xs mx-auto">
                  Click the heart icon on any fresh fruits, vegetables, or everyday essentials to bookmark them here.
                </p>
              </div>
            </div>
          ) : (
            favoriteProducts.map((prod) => {
              const price = Math.round(prod.pricePaise / 100);

              return (
                <div
                  key={prod._id}
                  className="rounded-2xl border border-stone-200 dark:border-stone-800 p-3 bg-stone-50/50 dark:bg-stone-850 flex items-center justify-between gap-3 hover:border-emerald-500/40 transition-all"
                >
                  <div
                    onClick={() => {
                      onSelectProduct(prod);
                      onClose();
                    }}
                    className="flex items-center gap-3 min-w-0 cursor-pointer flex-1"
                  >
                    <div className="w-12 h-12 rounded-xl bg-white dark:bg-stone-800 flex items-center justify-center overflow-hidden border border-stone-200/60 dark:border-stone-700 flex-shrink-0">
                      {prod.imageUrl ? (
                        <img
                          src={prod.imageUrl}
                          alt={prod.name}
                          className="w-full h-full object-contain p-1"
                        />
                      ) : (
                        <span className="text-xl">🥗</span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-xs text-stone-900 dark:text-white truncate">
                        {prod.name}
                      </h4>
                      <p className="text-[11px] text-stone-400">
                        {prod.packageSize} {prod.packageUnit}
                      </p>
                      <span className="text-xs font-black text-emerald-700 dark:text-emerald-400">
                        ₹{price}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => onRemoveFavorite(prod._id)}
                      className="p-2 text-stone-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-xl transition-colors cursor-pointer"
                      title="Remove from favorites"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        onAddToCart(prod._id, 1);
                        onClose();
                      }}
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 shadow-xs transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add to Cart</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

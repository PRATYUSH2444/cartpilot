import React, { useState, useMemo, useEffect } from 'react';
import {
  Search,
  X,
  Plus,
  Minus,
  RotateCcw,
  Truck,
  Package,
} from 'lucide-react';
import { Product, OrderData, CartData } from '../../types';

interface BrowseSheetProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  cart: CartData | null;
  orders?: OrderData[];
  onAddToCart: (productId: string, quantity: number) => void;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onSelectProduct: (product: Product) => void;
  isSlideOver?: boolean; // True for tablet slide-over / desktop panel
}

const CATEGORIES = [
  { id: 'ALL', label: 'All Items' },
  { id: 'VEGETABLES', label: 'Vegetables' },
  { id: 'DAIRY', label: 'Dairy' },
  { id: 'GRAINS', label: 'Grains & Atta' },
  { id: 'PULSES', label: 'Pulses & Dal' },
  { id: 'SPICES', label: 'Spices' },
  { id: 'OILS', label: 'Oils & Ghee' },
];

// Common Indian grocery vernacular aliases for quick search
const COMMON_ALIASES: Record<string, string[]> = {
  tamatar: ['tomato', 'tomatoes'],
  aloo: ['potato', 'potatoes', 'batata'],
  alu: ['potato', 'potatoes'],
  pyaz: ['onion', 'onions', 'kanda'],
  doodh: ['milk', 'dairy'],
  paneer: ['cottage cheese'],
  chawal: ['rice', 'basmati'],
  atta: ['flour', 'wheat'],
  tel: ['oil', 'mustard oil', 'sunflower'],
  haldi: ['turmeric'],
  dhaniya: ['coriander'],
  jeera: ['cumin'],
  mirch: ['chilli', 'chili'],
  ghee: ['clarified butter'],
  adrak: ['ginger'],
  lahsun: ['garlic'],
};

export const BrowseSheet: React.FC<BrowseSheetProps> = ({
  isOpen,
  onClose,
  products,
  cart,
  orders = [],
  onAddToCart,
  onUpdateQuantity,
  onSelectProduct,
  isSlideOver = false,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Extract "Buy Again" candidate products from completed past orders
  const buyAgainProducts = useMemo(() => {
    if (!orders || orders.length === 0) return [];
    const pastProductIds = new Set<string>();
    for (const order of orders) {
      if (order.status !== 'CANCELLED' && order.status !== 'FAILED') {
        for (const item of order.items || []) {
          pastProductIds.add(item.productId);
        }
      }
    }
    return products.filter((p) => pastProductIds.has(p._id)).slice(0, 6);
  }, [orders, products]);

  // Filter products by category, search text, and alias expansion
  const filteredProducts = useMemo(() => {
    let result = products;

    // Filter by category
    if (selectedCategory !== 'ALL') {
      result = result.filter(
        (p) => p.category?.toUpperCase() === selectedCategory.toUpperCase()
      );
    }

    // Filter by query and aliases
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      // Find expanded search terms from aliases
      const aliasMatches = Object.entries(COMMON_ALIASES)
        .filter(([alias]) => alias.includes(q) || q.includes(alias))
        .flatMap(([, targetWords]) => targetWords);

      const searchTerms = [q, ...aliasMatches];

      result = result.filter((p) => {
        const name = p.name.toLowerCase();
        const desc = (p.description || '').toLowerCase();
        const cat = (p.category || '').toLowerCase();
        const productAliases = (p as any).aliases
          ? (p as any).aliases.map((a: string) => a.toLowerCase())
          : [];

        return searchTerms.some(
          (term) =>
            name.includes(term) ||
            desc.includes(term) ||
            cat.includes(term) ||
            productAliases.some((pa: string) => pa.includes(term))
        );
      });
    }

    return result;
  }, [products, selectedCategory, searchQuery]);

  if (!isOpen) return null;

  // Free delivery progress
  const subtotalPaise = cart?.pricing.subtotalPaise || 0;
  const freeDeliveryThresholdPaise = 50000; // ₹500
  const isFreeDelivery = subtotalPaise >= freeDeliveryThresholdPaise;
  const remainingForFreePaise = Math.max(0, freeDeliveryThresholdPaise - subtotalPaise);
  const freeDeliveryPercent = Math.min(100, Math.round((subtotalPaise / freeDeliveryThresholdPaise) * 100));

  return (
    <div
      className={`fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex ${
        isSlideOver ? 'justify-end' : 'items-end sm:items-center justify-center p-0 sm:p-4'
      }`}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="browse-sheet-title"
    >
      <div
        data-testid="browse-sheet"
        className={`w-full ${
          isSlideOver
            ? 'max-w-xl h-full'
            : 'sm:max-w-4xl max-h-[92dvh] sm:rounded-3xl rounded-t-3xl'
        } bg-card dark:bg-card-top border border-brd shadow-2xl flex flex-col overflow-hidden animate-in ${
          isSlideOver ? 'slide-in-from-right' : 'slide-in-from-bottom'
        } duration-200`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile Drag Handle */}
        {!isSlideOver && (
          <div className="w-12 h-1.5 bg-brd rounded-full mx-auto mt-3 mb-1 sm:hidden flex-shrink-0" />
        )}

        {/* Top Header */}
        <div className="p-4 sm:p-5 border-b border-brd flex-shrink-0 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 id="browse-sheet-title" className="text-base sm:text-lg font-display font-bold text-ink">
                Browse Grocery Catalog
              </h2>
              <p className="text-xs text-mut font-mono">
                100% vegetarian quick-commerce catalog
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full text-mut hover:text-ink hover:bg-paper transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
              aria-label="Close browse sheet"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Search Bar with Aliases */}
          <div className="relative">
            <Search className="w-4 h-4 text-mut absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search groceries or vernacular aliases (e.g. tamatar, doodh, atta, alu)..."
              className="w-full pl-10 pr-9 py-2.5 rounded-xl bg-paper/80 border border-brd text-xs text-ink placeholder:text-mut focus:outline-none focus:border-acc font-sans min-h-[44px]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-mut hover:text-ink p-1 cursor-pointer"
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Category Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-full font-sans text-xs whitespace-nowrap transition-all cursor-pointer min-h-[36px] ${
                  selectedCategory === cat.id
                    ? 'bg-emerald-700 text-white font-bold shadow-xs'
                    : 'bg-paper/70 border border-brd text-mut hover:text-ink hover:border-acc/40'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Free Delivery Tracker */}
          <div className="p-2.5 rounded-xl bg-paper/50 border border-brd text-xs">
            <div className="flex items-center justify-between mb-1">
              <span className="flex items-center gap-1.5 font-medium text-ink">
                <Truck className="w-3.5 h-3.5 text-acc" />
                {isFreeDelivery
                  ? 'Free Delivery unlocked!'
                  : `Add ₹${(remainingForFreePaise / 100).toFixed(0)} more for FREE delivery`}
              </span>
              <span className="font-mono text-[11px] text-mut">{freeDeliveryPercent}%</span>
            </div>
            <div className="w-full h-1.5 bg-brd rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                style={{ width: `${freeDeliveryPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Scrollable Products Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-6">
          {/* "Buy Again" Row from History */}
          {buyAgainProducts.length > 0 && !searchQuery && selectedCategory === 'ALL' && (
            <div className="space-y-2.5">
              <div className="flex items-center gap-1.5">
                <RotateCcw className="w-3.5 h-3.5 text-acc" />
                <h3 className="text-xs font-display font-bold uppercase tracking-wider text-ink">
                  Buy Again from Past Orders
                </h3>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
                {buyAgainProducts.map((p) => {
                  const cartItem = cart?.items?.find((i) => i.productId === p._id);
                  const qty = cartItem?.quantity ?? 0;
                  return (
                    <div
                      key={`reorder-${p._id}`}
                      className="p-2 rounded-xl border border-brd bg-paper/40 hover:border-acc/40 transition-all flex flex-col justify-between text-xs group"
                    >
                      <div
                        onClick={() => onSelectProduct(p)}
                        className="cursor-pointer"
                      >
                        <div className="w-full h-16 bg-card rounded-lg flex items-center justify-center mb-1 overflow-hidden">
                          {p.imageUrl ? (
                            <img src={p.imageUrl} alt={p.name} className="w-full h-full object-contain p-1" />
                          ) : (
                            <Package className="w-6 h-6 text-mut/40" />
                          )}
                        </div>
                        <h4 className="font-bold text-ink truncate text-[11px] font-display">{p.name}</h4>
                        <span className="font-mono text-[10px] text-acc block">
                          ₹{(p.pricePaise / 100).toFixed(2)}
                        </span>
                      </div>
                      <div className="mt-1.5 pt-1 border-t border-brd/60">
                        {qty > 0 ? (
                          <div className="flex items-center justify-between border border-brd rounded-lg bg-card overflow-hidden">
                            <button
                              onClick={() => onUpdateQuantity(p._id, qty - 1)}
                              className="p-1 hover:bg-paper text-mut hover:text-ink cursor-pointer min-h-[32px] min-w-[28px] flex items-center justify-center"
                            >
                              <Minus className="w-2.5 h-2.5" />
                            </button>
                            <span className="font-mono text-[11px] font-bold text-ink">{qty}</span>
                            <button
                              onClick={() => onUpdateQuantity(p._id, qty + 1)}
                              disabled={qty >= p.availableStock}
                              className="p-1 hover:bg-paper text-mut hover:text-ink cursor-pointer disabled:opacity-40 min-h-[32px] min-w-[28px] flex items-center justify-center"
                            >
                              <Plus className="w-2.5 h-2.5" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => onAddToCart(p._id, 1)}
                            disabled={p.availableStock <= 0}
                            className="w-full py-1 px-2 rounded-lg bg-card border border-brd hover:border-acc text-ink hover:text-acc font-semibold text-[10px] flex items-center justify-center gap-1 cursor-pointer min-h-[32px]"
                          >
                            <Plus className="w-2.5 h-2.5" /> Add
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Catalog Grid */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-mut uppercase tracking-wider font-mono">
                {selectedCategory === 'ALL' ? 'All Products' : selectedCategory} ({filteredProducts.length})
              </span>
              <span className="text-[11px] text-mut font-mono">
                Pure Server Pricing · No Markups
              </span>
            </div>

            {filteredProducts.length === 0 ? (
              <div className="py-12 text-center space-y-2">
                <Package className="w-10 h-10 text-mut/40 mx-auto" />
                <h4 className="text-sm font-bold text-ink">No items found</h4>
                <p className="text-xs text-mut max-w-sm mx-auto">
                  No matching grocery items for "{searchQuery}". Try searching vernacular terms like "tamatar", "atta", or "doodh".
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {filteredProducts.map((p) => {
                  const cartItem = cart?.items?.find((i) => i.productId === p._id);
                  const qty = cartItem?.quantity ?? 0;
                  const isOutOfStock = p.availableStock <= 0;

                  return (
                    <div
                      key={p._id}
                      data-testid="product-card"
                      className="p-3 rounded-2xl border border-brd bg-paper/40 hover:border-acc/40 transition-all flex flex-col justify-between group shadow-xs"
                    >
                      <div
                        data-testid="product-tile"
                        onClick={() => onSelectProduct(p)}
                        className="cursor-pointer"
                      >
                        {/* Thumbnail */}
                        <div className="w-full h-28 bg-card rounded-xl flex items-center justify-center mb-2 overflow-hidden relative border border-brd/40">
                          {p.imageUrl ? (
                            <img
                              src={p.imageUrl}
                              alt={p.name}
                              className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform"
                            />
                          ) : (
                            <div className="flex flex-col items-center justify-center text-mut p-2 text-center">
                              <Package className="w-8 h-8 text-acc/30 mb-1" />
                              <span className="text-[10px] text-mut font-mono">No Image</span>
                            </div>
                          )}
                          <span className="absolute top-1.5 left-1.5 w-3 h-3 border border-emerald-600 flex items-center justify-center p-[2px] bg-white/90 rounded-xs">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                          </span>
                        </div>

                        {/* Details */}
                        <h4 className="font-bold text-xs text-ink truncate font-display group-hover:text-acc transition-colors">
                          {p.name}
                        </h4>
                        <div className="text-[10px] text-mut font-mono mt-0.5">
                          {p.packageSize} {p.packageUnit}
                        </div>

                        {/* Price & Stock */}
                        <div className="flex items-baseline justify-between mt-1">
                          <span className="font-display font-bold text-sm text-ink">
                            ₹{(p.pricePaise / 100).toFixed(2)}
                          </span>
                          <span
                            className={`text-[9px] font-mono font-semibold px-1 py-0.2 rounded ${
                              isOutOfStock
                                ? 'bg-rose-500/10 text-rose-600'
                                : p.availableStock <= 5
                                  ? 'bg-amber-500/10 text-amber-600'
                                  : 'text-mut'
                            }`}
                          >
                            {isOutOfStock ? 'Out' : p.availableStock <= 5 ? `Only ${p.availableStock} left` : 'In stock'}
                          </span>
                        </div>
                      </div>

                      {/* Unified Stepper / Add button */}
                      <div className="mt-2.5 pt-2 border-t border-brd/60">
                        {qty > 0 ? (
                          <div className="flex items-center justify-between border border-emerald-600/40 rounded-xl bg-card overflow-hidden">
                            <button
                              onClick={() => onUpdateQuantity(p._id, qty - 1)}
                              className="p-1.5 hover:bg-paper text-mut hover:text-ink cursor-pointer min-h-[38px] min-w-[34px] flex items-center justify-center"
                              aria-label="Decrease quantity"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="font-mono text-xs font-bold text-ink">
                              {qty}
                            </span>
                            <button
                              onClick={() => onUpdateQuantity(p._id, qty + 1)}
                              disabled={qty >= p.availableStock}
                              className="p-1.5 hover:bg-paper text-mut hover:text-ink cursor-pointer disabled:opacity-40 min-h-[38px] min-w-[34px] flex items-center justify-center"
                              aria-label="Increase quantity"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => onAddToCart(p._id, 1)}
                            disabled={isOutOfStock}
                            className="w-full py-2 px-3 rounded-xl bg-card border border-brd hover:border-acc text-ink hover:text-acc font-display font-bold text-xs flex items-center justify-center gap-1.5 shadow-2xs transition-all cursor-pointer min-h-[38px] disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            <Plus className="w-3.5 h-3.5" /> Add
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

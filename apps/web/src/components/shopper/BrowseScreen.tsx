import React, { useState, useMemo } from 'react';
import {
  Search,
  X,
  Plus,
  Minus,
  Star,
  SlidersHorizontal,
} from 'lucide-react';
import { Product, CartData } from '../../types';

interface BrowseScreenProps {
  products: Product[];
  cart: CartData | null;
  onAddToCart: (productId: string, quantity: number) => void;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onSelectProduct: (product: Product) => void;
  initialCategory?: string;
}

const CATEGORIES = [
  { id: 'ALL', label: 'All Items', emoji: '🛒' },
  { id: 'FRUITS_VEGETABLES', label: 'Fruits & Veg', emoji: '🍎' },
  { id: 'DAIRY_BREAKFAST', label: 'Dairy & Breakfast', emoji: '🥛' },
  { id: 'ATTA_RICE_DAL', label: 'Atta, Rice & Dal', emoji: '🌾' },
  { id: 'SNACKS_MUNCHIES', label: 'Snacks & Munchies', emoji: '🍿' },
  { id: 'COLD_DRINKS_JUICES', label: 'Cold Drinks', emoji: '🧃' },
  { id: 'BAKERY', label: 'Bakery', emoji: '🍞' },
  { id: 'MASALA_DRY_FRUITS', label: 'Masala & Spices', emoji: '🌰' },
  { id: 'INSTANT_FROZEN_FOOD', label: 'Instant & Frozen', emoji: '🍲' },
];

const SUBCATEGORIES: Record<string, string[]> = {
  ALL: ['All', 'Popular', 'Organic', 'Seasonal', 'Best Value'],
  FRUITS_VEGETABLES: ['All', 'Vegetables', 'Fruits', 'Leafy Greens', 'Root Veg', 'Exotics'],
  DAIRY_BREAKFAST: ['All', 'Milk', 'Paneer & Tofu', 'Butter & Ghee', 'Curd & Yogurt', 'Bread'],
  ATTA_RICE_DAL: ['All', 'Atta & Flours', 'Basmati Rice', 'Dal & Pulses', 'Grains'],
  SNACKS_MUNCHIES: ['All', 'Namkeen', 'Chips', 'Biscuits', 'Nuts & Seeds'],
  COLD_DRINKS_JUICES: ['All', 'Fresh Juices', 'Soda & Soft Drinks', 'Cold Coffee', 'Energy Drinks'],
  BAKERY: ['All', 'Brown Bread', 'Pav & Buns', 'Cakes', 'Cookies'],
  MASALA_DRY_FRUITS: ['All', 'Whole Spices', 'Powdered Masala', 'Almonds & Cashews'],
  INSTANT_FROZEN_FOOD: ['All', 'Noodles & Pasta', 'Frozen Veg Snacks', 'Ready to Cook'],
};

export const BrowseScreen: React.FC<BrowseScreenProps> = ({
  products,
  cart,
  onAddToCart,
  onUpdateQuantity,
  onSelectProduct,
  initialCategory = 'ALL',
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const currentSubcategories = SUBCATEGORIES[selectedCategory] || ['All', 'Popular', 'Organic'];

  const getCartQuantity = (productId: string): number => {
    if (!cart || !cart.items) return 0;
    const item = cart.items.find((i) => i.productId === productId);
    return item ? item.quantity : 0;
  };

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // Category match
      if (selectedCategory !== 'ALL' && p.category !== selectedCategory) {
        return false;
      }

      // Search match
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const nameMatch = p.name.toLowerCase().includes(query);
        const descMatch = p.description?.toLowerCase().includes(query);
        const aliasMatch = p.aliases?.some((a) => a.toLowerCase().includes(query));
        if (!nameMatch && !descMatch && !aliasMatch) {
          return false;
        }
      }

      // Subcategory match
      if (selectedSubcategory !== 'All') {
        const sub = selectedSubcategory.toLowerCase();
        const matchesName = p.name.toLowerCase().includes(sub);
        const matchesDesc = p.description?.toLowerCase().includes(sub);
        const matchesAlias = p.aliases?.some((a) => a.toLowerCase().includes(sub));
        if (!matchesName && !matchesDesc && !matchesAlias) {
          return false;
        }
      }

      return true;
    });
  }, [products, selectedCategory, selectedSubcategory, searchQuery]);

  return (
    <div className="flex-1 overflow-y-auto pb-8 bg-[--bg]">
      {/* ── Top Search & Filter Bar ────────────────────────────────────────── */}
      <div className="sticky top-0 z-30 bg-[--bg]/95 backdrop-blur-md px-4 pt-3 pb-2 border-b border-[--line]/60 space-y-2.5">
        <div className="relative">
          <Search className="w-4 h-4 text-[--mut] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search products, brands, categories…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-9 py-2.5 rounded-[var(--radius-input)] bg-[--surface] border border-[--line] text-xs text-[--ink] placeholder:text-[--mut] focus:outline-none focus:ring-2 focus:ring-[--brand]/20 focus:border-[--brand]"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[--mut] hover:text-[--ink] p-0.5 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Category Circle Icons Row */}
        <div className="flex gap-2.5 overflow-x-auto pb-1 no-scrollbar scroll-smooth">
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => {
                  setSelectedCategory(cat.id);
                  setSelectedSubcategory('All');
                }}
                className={`flex-shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[--brand] text-white shadow-xs'
                    : 'bg-[--surface] text-[--mut] hover:text-[--ink] border border-[--line]'
                }`}
              >
                <span>{cat.emoji}</span>
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Subcategory Pills Row */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {currentSubcategories.map((sub) => {
            const isSubSelected = selectedSubcategory === sub;
            return (
              <button
                key={sub}
                onClick={() => setSelectedSubcategory(sub)}
                className={`flex-shrink-0 px-3 py-1 rounded-full text-[11px] font-medium transition-all cursor-pointer ${
                  isSubSelected
                    ? 'bg-[--brand-soft] text-[--brand] font-bold border border-[--brand]/30'
                    : 'bg-[--surface-2] text-[--mut] hover:text-[--ink]'
                }`}
              >
                {sub}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Products Grid ─────────────────────────────────────────────────── */}
      <div className="max-w-[760px] mx-auto px-4 pt-4 space-y-3">
        <div className="flex items-center justify-between text-xs text-[--mut]">
          <span>
            Showing <strong className="text-[--ink]">{filteredProducts.length}</strong> vegetarian
            items
          </span>
          <div className="flex items-center gap-1 font-medium">
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Fastest delivery</span>
          </div>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="py-16 text-center space-y-2">
            <span className="text-4xl">🔍</span>
            <h3 className="font-heading font-bold text-sm text-[--ink]">No products found</h3>
            <p className="text-xs text-[--mut] max-w-xs mx-auto">
              We couldn't find any items matching "{searchQuery}". Try searching for another item or
              clear filters.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('ALL');
                setSelectedSubcategory('All');
              }}
              className="mt-2 px-4 py-2 rounded-full bg-[--brand-soft] text-[--brand] text-xs font-bold hover:bg-[--brand]/20 cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {filteredProducts.map((prod) => {
              const qty = getCartQuantity(prod._id);
              const priceRupees = (prod.pricePaise / 100).toFixed(0);
              const origPrice = Math.round(Number(priceRupees) * 1.15);

              return (
                <div
                  key={prod._id}
                  onClick={() => onSelectProduct(prod)}
                  className="rounded-[var(--radius-card)] bg-[--surface] border border-[--line] hover:border-[--brand]/40 p-3 flex flex-col justify-between shadow-card transition-all cursor-pointer group"
                >
                  <div className="space-y-2">
                    {/* Image Area */}
                    <div className="relative aspect-square rounded-xl bg-[--surface-2] overflow-hidden flex items-center justify-center">
                      {prod.imageUrl ? (
                        <img
                          src={prod.imageUrl}
                          alt={prod.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <span className="text-4xl">🥬</span>
                      )}

                      {/* Pure Veg Green Badge */}
                      <div
                        className="absolute top-2 left-2 w-4 h-4 rounded-xs border border-emerald-600 bg-white flex items-center justify-center shadow-xs"
                        title="100% Pure Vegetarian"
                      >
                        <span className="w-2 h-2 rounded-full bg-emerald-600" />
                      </div>

                      {/* Discount Pill */}
                      <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded-full bg-rose-500 text-white font-mono font-bold text-[9px] shadow-xs">
                        15% OFF
                      </span>
                    </div>

                    {/* Details */}
                    <div>
                      <h4 className="font-heading font-semibold text-xs text-[--ink] line-clamp-1 group-hover:text-[--brand] transition-colors">
                        {prod.name}
                      </h4>
                      <p className="text-[10px] text-[--mut] mt-0.5">
                        {prod.packageSize} {prod.packageUnit}
                      </p>
                      <div className="flex items-center gap-1 mt-1 text-[10px] text-amber-500 font-semibold">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        <span>4.6</span>
                        <span className="text-[--mut] font-normal">(1.2k)</span>
                      </div>
                    </div>
                  </div>

                  {/* Price & Add Action */}
                  <div className="mt-3 pt-2 border-t border-[--line]/60 flex items-center justify-between gap-1">
                    <div>
                      <span className="font-heading font-bold text-sm text-[--ink]">
                        ₹{priceRupees}
                      </span>
                      <span className="text-[10px] text-[--mut] line-through ml-1">
                        ₹{origPrice}
                      </span>
                    </div>

                    {/* Quantity Stepper / Add button */}
                    <div onClick={(e) => e.stopPropagation()}>
                      {qty === 0 ? (
                        <button
                          onClick={() => onAddToCart(prod._id, 1)}
                          className="px-3 py-1.5 rounded-full bg-[--brand-soft] hover:bg-[--brand] text-[--brand] hover:text-white font-heading font-bold text-xs transition-colors cursor-pointer flex items-center gap-1"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Add</span>
                        </button>
                      ) : (
                        <div className="flex items-center gap-1.5 bg-[--brand] text-white px-2 py-1 rounded-full text-xs font-bold shadow-xs">
                          <button
                            onClick={() => onUpdateQuantity(prod._id, qty - 1)}
                            className="p-0.5 hover:opacity-80 cursor-pointer"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="font-mono px-1 min-w-[14px] text-center">{qty}</span>
                          <button
                            onClick={() => onUpdateQuantity(prod._id, qty + 1)}
                            className="p-0.5 hover:opacity-80 cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

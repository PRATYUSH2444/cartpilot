import React, { useState, useMemo } from 'react';
import {
  Search,
  X,
  Clock,
  Package,
  MessageSquare,
  Plus,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { Product, OrderData } from '../../types';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  orders: OrderData[];
  chatSessions: Array<{ _id: string; title: string }>;
  onSelectProduct: (product: Product) => void;
  onAddToCart: (productId: string, quantity: number) => void;
  onSelectOrder: (order: OrderData) => void;
  onSelectChat: (sessionId: string) => void;
}

type SearchFilter = 'ALL' | 'PRODUCTS' | 'CATEGORIES' | 'ORDERS' | 'CHATS';

const POPULAR_SEARCHES = ['milk', 'tomato', 'rice', 'paneer', 'atta', 'bread', 'ghee'];

const POPULAR_CATEGORIES = [
  { name: 'Fresh Vegetables', emoji: '🥦' },
  { name: 'Breakfast Essentials', emoji: '🍞' },
  { name: 'Dairy Products', emoji: '🥛' },
  { name: 'Healthy Snacks', emoji: '🍿' },
  { name: 'Organic Spices', emoji: '🌰' },
];

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  products,
  orders,
  chatSessions,
  onSelectProduct,
  onAddToCart,
  onSelectOrder,
  onSelectChat,
}) => {
  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<SearchFilter>('ALL');
  const [recentSearches, setRecentSearches] = useState<string[]>([
    'tomato',
    'milk',
    'paneer',
    'chawal',
  ]);

  const handleRecentClick = (text: string) => {
    setQuery(text);
  };

  const handleClearRecent = () => {
    setRecentSearches([]);
  };

  // Filtered results - hooks must always execute unconditionally
  const matchingProducts = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase().trim();
    return products
      .filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q) ||
          p.aliases?.some((a) => a.toLowerCase().includes(q))
      )
      .slice(0, 6);
  }, [products, query]);

  const matchingOrders = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase().trim();
    return orders
      .filter(
        (o) =>
          o.orderNumber?.toLowerCase().includes(q) ||
          o.items?.some((i) => i.name.toLowerCase().includes(q))
      )
      .slice(0, 4);
  }, [orders, query]);

  const matchingChats = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase().trim();
    return chatSessions.filter((s) => s.title.toLowerCase().includes(q)).slice(0, 4);
  }, [chatSessions, query]);

  // Early return placed AFTER all hooks adhering strictly to React Rules of Hooks
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex flex-col justify-start">
      <div className="w-full max-w-2xl mx-auto h-full bg-[--surface] flex flex-col shadow-2xl animate-in fade-in duration-200">
        {/* ── Search Input Bar ────────────────────────────────────────────── */}
        <div className="p-4 border-b border-[--line] space-y-3">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-[--mut] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                autoFocus
                type="text"
                placeholder="Search products, orders, or conversations…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full pl-10 pr-9 py-2.5 rounded-[var(--radius-input)] bg-[--surface-2] border border-[--line] text-xs text-[--ink] placeholder:text-[--mut] focus:outline-none focus:ring-2 focus:ring-[--brand]/20 focus:border-[--brand]"
              />
              {query && (
                <button
                  onClick={() => setQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[--mut] hover:text-[--ink] p-0.5"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <button
              onClick={onClose}
              className="px-3 py-2 text-xs font-bold text-[--brand] hover:underline cursor-pointer"
            >
              Cancel
            </button>
          </div>

          {/* Filter Chips */}
          <div className="flex gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
            {(['ALL', 'PRODUCTS', 'CATEGORIES', 'ORDERS', 'CHATS'] as SearchFilter[]).map((f) => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                className={`px-3 py-1 rounded-full text-[11px] font-semibold transition-colors cursor-pointer ${
                  activeFilter === f
                    ? 'bg-[--brand] text-white shadow-xs'
                    : 'bg-[--surface-2] text-[--mut] hover:text-[--ink]'
                }`}
              >
                {f ? (f.charAt(0) + f.slice(1).toLowerCase()) : ''}
              </button>
            ))}
          </div>
        </div>

        {/* ── Search Body ─────────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          {!query.trim() ? (
            <>
              {/* Recent Searches */}
              {recentSearches.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-[--ink] flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-[--mut]" />
                      Recent Searches
                    </span>
                    <button
                      onClick={handleClearRecent}
                      className="text-[10px] text-[--mut] hover:text-rose-600 cursor-pointer"
                    >
                      Clear all
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {recentSearches.map((s) => (
                      <button
                        key={s}
                        onClick={() => handleRecentClick(s)}
                        className="px-3 py-1.5 rounded-full bg-[--surface-2] hover:bg-[--brand-soft] text-[--ink] hover:text-[--brand] text-xs font-medium transition-colors cursor-pointer"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Popular Right Now */}
              <div className="space-y-2">
                <span className="font-bold text-xs text-[--ink] flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-[--brand]" />
                  Popular Right Now
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {POPULAR_CATEGORIES.map((c) => (
                    <button
                      key={c.name}
                      onClick={() => setQuery(c.name)}
                      className="flex items-center gap-2.5 p-3 rounded-2xl bg-[--surface-2] hover:bg-[--brand-soft] text-left transition-colors cursor-pointer group"
                    >
                      <span className="text-xl">{c.emoji}</span>
                      <span className="text-xs font-semibold text-[--ink] group-hover:text-[--brand]">
                        {c.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Popular Searches */}
              <div className="space-y-2">
                <span className="font-bold text-xs text-[--mut]">Suggestions</span>
                <div className="flex flex-wrap gap-2">
                  {POPULAR_SEARCHES.map((ps) => (
                    <button
                      key={ps}
                      onClick={() => setQuery(ps)}
                      className="px-3 py-1 rounded-full border border-[--line] text-xs text-[--mut] hover:text-[--ink] hover:border-[--brand]"
                    >
                      {ps}
                    </button>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Product Matches */}
              {(activeFilter === 'ALL' || activeFilter === 'PRODUCTS') && (
                <div className="space-y-2">
                  <span className="font-bold text-xs text-[--ink]">
                    Products ({matchingProducts.length})
                  </span>
                  {matchingProducts.length === 0 ? (
                    <p className="text-xs text-[--mut]">No matching grocery items</p>
                  ) : (
                    <div className="space-y-2">
                      {matchingProducts.map((p) => (
                        <div
                          key={p._id}
                          onClick={() => {
                            onSelectProduct(p);
                            onClose();
                          }}
                          className="flex items-center justify-between p-2.5 rounded-2xl bg-[--surface-2] hover:bg-[--brand-soft]/40 transition-colors cursor-pointer"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-10 h-10 rounded-xl bg-[--surface] overflow-hidden flex items-center justify-center flex-shrink-0">
                              {p.imageUrl ? (
                                <img
                                  src={p.imageUrl}
                                  alt={p.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <span>🥦</span>
                              )}
                            </div>
                            <div className="min-w-0">
                              <h5 className="font-heading font-bold text-xs text-[--ink] truncate">
                                {p.name}
                              </h5>
                              <p className="text-[10px] text-[--mut]">
                                {p.packageSize} {p.packageUnit} · ₹
                                {(p.pricePaise / 100).toFixed(0)}
                              </p>
                            </div>
                          </div>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onAddToCart(p._id, 1);
                              onClose();
                            }}
                            className="px-3 py-1.5 rounded-full bg-[--brand] text-white text-xs font-bold hover:opacity-90 transition-opacity cursor-pointer flex items-center gap-1"
                          >
                            <Plus className="w-3 h-3" />
                            <span>Add</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Order Matches */}
              {(activeFilter === 'ALL' || activeFilter === 'ORDERS') &&
                matchingOrders.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-[--line]">
                    <span className="font-bold text-xs text-[--ink]">Past Orders</span>
                    <div className="space-y-2">
                      {matchingOrders.map((o) => (
                        <div
                          key={o._id}
                          onClick={() => {
                            onSelectOrder(o);
                            onClose();
                          }}
                          className="flex items-center justify-between p-2.5 rounded-2xl bg-[--surface-2] hover:bg-[--brand-soft]/40 transition-colors cursor-pointer"
                        >
                          <div className="flex items-center gap-2">
                            <Package className="w-4 h-4 text-blue-600" />
                            <div>
                              <span className="font-bold text-xs text-[--ink]">
                                Order #{o.orderNumber}
                              </span>
                              <span className="text-[10px] text-[--mut] block">
                                {o.status} · {o.items?.length || 0} items
                              </span>
                            </div>
                          </div>
                          <span className="text-xs font-bold text-[--brand] flex items-center gap-1">
                            Track <ArrowRight className="w-3 h-3" />
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              {/* Chat Matches */}
              {(activeFilter === 'ALL' || activeFilter === 'CHATS') &&
                matchingChats.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-[--line]">
                    <span className="font-bold text-xs text-[--ink]">Conversations</span>
                    <div className="space-y-2">
                      {matchingChats.map((c) => (
                        <div
                          key={c._id}
                          onClick={() => {
                            onSelectChat(c._id);
                            onClose();
                          }}
                          className="flex items-center justify-between p-2.5 rounded-2xl bg-[--surface-2] hover:bg-[--brand-soft]/40 transition-colors cursor-pointer"
                        >
                          <div className="flex items-center gap-2">
                            <MessageSquare className="w-4 h-4 text-[--brand]" />
                            <span className="text-xs font-medium text-[--ink]">{c.title}</span>
                          </div>
                          <ArrowRight className="w-3.5 h-3.5 text-[--mut]" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

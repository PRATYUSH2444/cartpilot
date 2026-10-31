import React from 'react';
import {
  MapPin,
  ChevronDown,
  Search,
  Mic,
  Bell,
  Sparkles,
  ArrowRight,
  Plus,
  Minus,
  Truck,
  Star,
  Leaf,
  Clock,
} from 'lucide-react';
import { Product, CartData, OrderData, UserAddress } from '../../types';
import { TabKey } from './BottomTabBar';

interface HomeScreenProps {
  products: Product[];
  cart: CartData | null;
  orders: OrderData[];
  selectedAddress: UserAddress | null;
  onSelectTab: (tab: TabKey, categoryId?: string) => void;
  onOpenAddressModal: () => void;
  onOpenSearchModal: () => void;
  onOpenProfile: () => void;
  onSelectProduct: (product: Product) => void;
  onAddToCart: (productId: string, quantity: number) => void;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onOpenTracking: (order: OrderData) => void;
  userInitial?: string;
}

const CATEGORY_ITEMS = [
  { id: 'FRUITS_VEGETABLES', label: 'Fruits & Vegetables', emoji: '🍎', bg: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300' },
  { id: 'DAIRY_BREAKFAST', label: 'Dairy & Breakfast', emoji: '🥛', bg: 'bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300' },
  { id: 'ATTA_RICE_DAL', label: 'Atta, Rice & Dal', emoji: '🌾', bg: 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300' },
  { id: 'SNACKS_MUNCHIES', label: 'Snacks & Munchies', emoji: '🍿', bg: 'bg-orange-50 dark:bg-orange-950/40 text-orange-800 dark:text-orange-300' },
  { id: 'COLD_DRINKS_JUICES', label: 'Cold Drinks', emoji: '🧃', bg: 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300' },
  { id: 'BAKERY', label: 'Bakery', emoji: '🍞', bg: 'bg-yellow-50 dark:bg-yellow-950/40 text-yellow-800 dark:text-yellow-300' },
  { id: 'MASALA_DRY_FRUITS', label: 'Masala & Spices', emoji: '🌰', bg: 'bg-purple-50 dark:bg-purple-950/40 text-purple-800 dark:text-purple-300' },
];

export const HomeScreen: React.FC<HomeScreenProps> = ({
  products,
  cart,
  orders,
  selectedAddress,
  onSelectTab,
  onOpenAddressModal,
  onOpenSearchModal,
  onOpenProfile,
  onSelectProduct,
  onAddToCart,
  onUpdateQuantity,
  onOpenTracking,
  userInitial = 'U',
}) => {
  // Find active order (not yet delivered or cancelled)
  const activeOrder = orders.find(
    (o) => o.status !== 'DELIVERED' && o.status !== 'CANCELLED' && o.status !== 'FAILED'
  ) || (orders.length > 0 ? orders[0] : null);

  // Best sellers: take top products
  const bestSellers = products.slice(0, 8);

  const getCartQuantity = (productId: string): number => {
    if (!cart || !cart.items) return 0;
    const item = cart.items.find((i) => i.productId === productId);
    return item ? item.quantity : 0;
  };

  const addressLabel = selectedAddress
    ? `${selectedAddress.addressType}: ${selectedAddress.areaLocality || selectedAddress.city}`
    : 'Home: HSR Layout, Bengaluru';

  return (
    <div className="flex-1 overflow-y-auto pb-8 bg-[--bg]">
      {/* ── Top Header Bar ─────────────────────────────────────────────── */}
      <div className="sticky top-0 z-30 bg-[--bg]/95 backdrop-blur-md px-4 pt-3 pb-2 border-b border-[--line]/60">
        <div className="flex items-center justify-between gap-3 mb-2.5">
          {/* Location Selector Pill */}
          <button
            onClick={onOpenAddressModal}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[--surface] border border-[--line] hover:border-[--brand]/40 transition-colors cursor-pointer text-left max-w-[70%]"
            title="Select Delivery Location"
          >
            <div className="w-5 h-5 rounded-full bg-[--brand-soft] flex items-center justify-center text-[--brand] flex-shrink-0">
              <MapPin className="w-3 h-3 text-[--brand]" />
            </div>
            <div className="truncate">
              <span className="text-xs font-bold text-[--ink] flex items-center gap-1">
                <span className="truncate">{addressLabel}</span>
                <ChevronDown className="w-3 h-3 text-[--mut] flex-shrink-0" />
              </span>
            </div>
          </button>

          {/* Action Icons: Notification & Profile */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => onSelectTab('account')}
              className="w-9 h-9 rounded-full bg-[--surface] border border-[--line] text-[--mut] hover:text-[--ink] flex items-center justify-center transition-colors relative cursor-pointer"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white" />
            </button>
            <button
              onClick={onOpenProfile}
              className="w-9 h-9 rounded-full bg-[--brand] text-white flex items-center justify-center font-heading font-bold text-sm shadow-xs cursor-pointer hover:opacity-95 transition-opacity"
              title="My Account"
            >
              {userInitial}
            </button>
          </div>
        </div>

        {/* Global Search Bar Trigger */}
        <div
          onClick={onOpenSearchModal}
          className="flex items-center justify-between px-3.5 py-2.5 rounded-[var(--radius-input)] bg-[--surface] border border-[--line] shadow-xs cursor-pointer hover:border-[--brand]/40 transition-all"
        >
          <div className="flex items-center gap-2.5 text-[--mut]">
            <Search className="w-4 h-4 text-[--brand]" />
            <span className="text-xs font-medium">Search for anything or ask AI…</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-[--brand-soft] text-[--brand]">
              AI Search
            </span>
            <Mic className="w-4 h-4 text-[--mut]" />
          </div>
        </div>
      </div>

      <div className="max-w-[760px] mx-auto px-4 pt-4 space-y-5">
        {/* ── Promotional Hero Banner ───────────────────────────────────────── */}
        <div className="relative overflow-hidden rounded-[var(--radius-card)] bg-gradient-to-br from-[#08643D] to-[#0A7B4B] text-white p-5 shadow-card">
          <div className="relative z-10 max-w-[65%] space-y-2">
            <span className="inline-flex items-center gap-1 text-[11px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-xs text-white">
              <Clock className="w-3 h-3" /> 20-Minute Delivery
            </span>
            <h2 className="font-heading font-bold text-xl sm:text-2xl leading-tight text-white">
              Fresh groceries delivered in 20 minutes
            </h2>
            <p className="text-white/80 text-xs line-clamp-2">
              100% Certified Pure Vegetarian · Farm Fresh · Direct from Local Organic Hubs
            </p>
            <div className="pt-2">
              <button
                onClick={() => onSelectTab('browse')}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white text-[--brand] font-heading font-bold text-xs shadow-md hover:bg-white/95 transition-all cursor-pointer"
              >
                <span>Shop Now</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Decorative Basket Illustration */}
          <div className="absolute -right-4 -bottom-4 w-36 h-36 sm:w-44 sm:h-44 opacity-90 pointer-events-none select-none flex items-center justify-center">
            <span className="text-7xl sm:text-8xl drop-shadow-lg">🥗</span>
          </div>
        </div>

        {/* ── Popular Categories Horizontal Scroll ──────────────────────────── */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <h3 className="font-heading font-bold text-sm text-[--ink]">Popular Categories</h3>
            <button
              onClick={() => onSelectTab('browse')}
              className="text-xs font-semibold text-[--brand] hover:underline cursor-pointer"
            >
              See all
            </button>
          </div>

          <div className="flex gap-2.5 overflow-x-auto pb-1.5 no-scrollbar scroll-smooth">
            {CATEGORY_ITEMS.map((cat) => (
              <button
                key={cat.id}
                onClick={() => onSelectTab('browse', cat.id)}
                className="flex-shrink-0 flex flex-col items-center gap-1.5 p-2.5 rounded-2xl bg-[--surface] border border-[--line] hover:border-[--brand]/40 transition-all cursor-pointer min-w-[82px] group"
              >
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl transition-transform group-hover:scale-110 ${cat.bg}`}
                >
                  {cat.emoji}
                </div>
                <span className="text-[11px] font-semibold text-[--ink] text-center line-clamp-1 max-w-[80px]">
                  {cat.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* ── Active Order Live Tracking Floating Card ──────────────────────── */}
        {activeOrder && (
          <div className="rounded-[var(--radius-card)] bg-[--surface] border border-[--line] p-4 shadow-card space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[--go] animate-ping" />
                <span className="text-xs font-bold text-[--ink]">Your active order</span>
              </div>
              <span className="text-[11px] font-mono font-bold text-[--brand] bg-[--brand-soft] px-2 py-0.5 rounded-full">
                {activeOrder.status === 'OUT_FOR_DELIVERY' ? 'Arriving in 12 min' : activeOrder.status}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-[--brand-soft] flex items-center justify-center text-[--brand] flex-shrink-0">
                <Truck className="w-6 h-6 text-[--brand]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-[--ink] truncate">
                    Order #{activeOrder.orderNumber}
                  </span>
                  <span className="font-mono font-semibold text-[--mut]">
                    {activeOrder.items?.length || 0} items · ₹
                    {((activeOrder.pricingSnapshot?.totalPaise || 0) / 100).toFixed(0)}
                  </span>
                </div>
                <p className="text-[11px] text-[--mut] truncate mt-0.5">
                  {activeOrder.status === 'OUT_FOR_DELIVERY'
                    ? 'Rider Arjun is on the way to your doorstep'
                    : 'Store is packing your pure vegetarian groceries'}
                </p>
              </div>
            </div>

            {/* Visual Stepper Progress Bar */}
            <div className="space-y-1">
              <div className="w-full bg-[--line] h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-[--brand] h-full rounded-full transition-all duration-500"
                  style={{
                    width:
                      activeOrder.status === 'OUT_FOR_DELIVERY'
                        ? '75%'
                        : activeOrder.status === 'PACKING'
                        ? '45%'
                        : activeOrder.status === 'DELIVERED'
                        ? '100%'
                        : '25%',
                  }}
                />
              </div>
              <div className="flex justify-between text-[10px] font-medium text-[--mut]">
                <span className="text-[--brand] font-bold">Confirmed</span>
                <span className={activeOrder.status !== 'CONFIRMED' ? 'text-[--brand] font-bold' : ''}>
                  Packed
                </span>
                <span
                  className={
                    activeOrder.status === 'OUT_FOR_DELIVERY' || activeOrder.status === 'DELIVERED'
                      ? 'text-[--brand] font-bold'
                      : ''
                  }
                >
                  On the way
                </span>
                <span className={activeOrder.status === 'DELIVERED' ? 'text-[--brand] font-bold' : ''}>
                  Delivered
                </span>
              </div>
            </div>

            <button
              onClick={() => onOpenTracking(activeOrder)}
              className="w-full py-2 px-3 rounded-full bg-[--surface-2] hover:bg-[--brand-soft] hover:text-[--brand] text-[--ink] font-heading font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer min-h-[40px]"
            >
              <span>Track Order Live</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* ── Best Sellers 2-Column Product Grid ───────────────────────────── */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-heading font-bold text-base text-[--ink]">Best Sellers</h3>
              <p className="text-[11px] text-[--mut]">Certified pure vegetarian everyday essentials</p>
            </div>
            <button
              onClick={() => onSelectTab('browse')}
              className="text-xs font-semibold text-[--brand] hover:underline cursor-pointer"
            >
              See all
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {bestSellers.map((prod) => {
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
                    {/* Image Container with Badges */}
                    <div className="relative aspect-square rounded-xl bg-[--surface-2] overflow-hidden flex items-center justify-center">
                      {prod.imageUrl ? (
                        <img
                          src={prod.imageUrl}
                          alt={prod.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <span className="text-4xl">🥦</span>
                      )}

                      {/* Pure Veg Badge */}
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
                        <span>4.7</span>
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

                    {/* Quantity Stepper or Add Button */}
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
        </div>

        {/* ── AI Shopping Assistant Banner Card ─────────────────────────────── */}
        <div className="rounded-[var(--radius-card)] bg-[--brand-soft] border border-[--brand]/20 p-5 shadow-card flex items-center justify-between gap-4">
          <div className="space-y-1.5">
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[--brand] uppercase tracking-wider">
              <Sparkles className="w-3 h-3" /> Agentic Shopping
            </span>
            <h3 className="font-heading font-bold text-base text-[--ink]">
              Let CartPilot AI plan your meals &amp; budget
            </h3>
            <p className="text-xs text-[--mut]">
              Ask for recipe ingredients, weekly budgets, or high-protein vegetarian meal plans.
            </p>
            <button
              onClick={() => onSelectTab('chat')}
              className="inline-flex items-center gap-1.5 px-4 py-2 mt-1 rounded-full bg-[--brand] text-white font-heading font-bold text-xs shadow-xs hover:opacity-90 transition-opacity cursor-pointer"
            >
              <span>Chat with AI</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-[--brand] text-white flex items-center justify-center flex-shrink-0 shadow-md">
            <Leaf className="w-7 h-7" />
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import {
  MapPin,
  ChevronDown,
  Search,
  ArrowRight,
  Plus,
  Minus,
  Truck,
  Leaf,
  Sparkles,
  Heart,
  ShieldCheck,
  Wallet,
  Milk,
  Wheat,
  Flame,
  Utensils,
  Cookie,
  Soup,
} from 'lucide-react';
import { Product, CartData, OrderData, UserAddress } from '../../types';
import { TabKey } from './BottomTabBar';
import { getDeliveryWindowInfo } from '../../utils/deliveryWindow';

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
  onTriggerAIPrompt?: (prompt: string) => void;
  favorites?: string[];
  onToggleFavorite?: (productId: string) => void;
  userInitial?: string;
  avatarUrl?: string;
  walletBalance?: number;
  onOpenWallet?: () => void;
  onOpenCoupons?: () => void;
  onOpenWishlist?: () => void;
  onOpenNotifications?: () => void;
  unreadNotificationsCount?: number;
  primaryNotificationType?: 'order' | 'wallet' | 'mandate' | 'catalog' | 'general';
  onOpenRules?: () => void;
}

const CATEGORIES = [
  {
    id: 'VEGETABLES',
    title: 'Fresh Vegetables',
    icon: Leaf,
    bg: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300',
  },
  {
    id: 'FRUITS',
    title: 'Fresh Fruits',
    icon: Sparkles,
    bg: 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300',
  },
  {
    id: 'DAIRY',
    title: 'Dairy & Breakfast',
    icon: Milk,
    bg: 'bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300',
  },
  {
    id: 'STAPLES',
    title: 'Atta, Rice & Dal',
    icon: Wheat,
    bg: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300',
  },
  {
    id: 'MASALA',
    title: 'Oil, Ghee & Masala',
    icon: Flame,
    bg: 'bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300',
  },
  {
    id: 'BAKERY',
    title: 'Bakery & Bread',
    icon: Utensils,
    bg: 'bg-yellow-50 dark:bg-yellow-950/40 text-yellow-800 dark:text-yellow-300',
  },
  {
    id: 'SNACKS',
    title: 'Snacks & Munchies',
    icon: Cookie,
    bg: 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300',
  },
  {
    id: 'BEVERAGES',
    title: 'Drinks & Juices',
    icon: Sparkles,
    bg: 'bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300',
  },
  {
    id: 'INSTANT',
    title: 'Instant & Ready Food',
    icon: Soup,
    bg: 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300',
  },
];

const COOKING_SUGGESTIONS = [
  { name: 'Matar Biryani', prompt: 'Recipe and grocery ingredients for Matar Biryani for 4' },
  { name: 'Paneer Butter Masala', prompt: 'Recipe and grocery ingredients for Paneer Butter Masala for 4' },
  { name: 'Rajma Chawal', prompt: 'Recipe and grocery ingredients for Rajma Chawal for 4' },
  { name: 'Dal Tadka', prompt: 'Recipe and grocery ingredients for Dal Tadka for 4' },
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
  onTriggerAIPrompt,
  favorites = [],
  onToggleFavorite,
  userInitial = 'U',
  avatarUrl = '',
  walletBalance = 0,
  onOpenWallet,
  onOpenWishlist,
  onOpenNotifications: _onOpenNotifications,
  unreadNotificationsCount = 0,
  primaryNotificationType = 'general',
  onOpenRules,
}) => {
  const deliveryWindow = getDeliveryWindowInfo();
  const [cookingInput, setCookingInput] = useState('');

  // Active uncompleted order for live-track pill
  const activeOrder =
    orders.find(
      (o) => o.status !== 'DELIVERED' && o.status !== 'CANCELLED' && o.status !== 'FAILED'
    ) || (orders.length > 0 ? orders[0] : null);

  const getCartQuantity = (productId: string): number => {
    if (!cart || !cart.items) return 0;
    const item = cart.items.find((i) => i.productId === productId);
    return item ? item.quantity : 0;
  };

  const handleCookingSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = cookingInput.trim();
    if (!query) return;
    if (onTriggerAIPrompt) {
      onTriggerAIPrompt(query);
    } else {
      onSelectTab('chat');
    }
  };

  const handleRecipeChipClick = (prompt: string) => {
    if (onTriggerAIPrompt) {
      onTriggerAIPrompt(prompt);
    } else {
      onSelectTab('chat');
    }
  };

  const addressTypeLabel = selectedAddress?.addressType || 'Delivery to';
  const addressLocalityLabel = selectedAddress
    ? `${selectedAddress.areaLocality || selectedAddress.apartmentStreet || selectedAddress.city || 'Delivery Point'}${selectedAddress.city ? ', ' + selectedAddress.city : ''}`
    : 'Select Delivery Location';

  const bestSellers = products.slice(0, 10);

  const formatRupees = (amount: number) =>
    new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(Math.round(amount));

  return (
    <div className="flex-1 w-full pb-28 sm:pb-32 lg:pb-12 bg-[var(--bg)] text-[var(--ink)] font-body selection:bg-brand selection:text-white">
      {/* ── Mobile Top App Bar (< 1024px) ── */}
      <div className="block lg:hidden sticky top-0 z-30 bg-white/95 dark:bg-stone-900/95 backdrop-blur-md border-b border-stone-200/60 dark:border-stone-800/60 shadow-2xs">
        <div className="max-w-xl mx-auto px-4 pt-3 pb-2.5 space-y-2">
          {/* Top Row: Brand + Location + Actions */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-emerald-700 flex items-center justify-center text-white shadow-xs flex-shrink-0">
                <Leaf className="w-4.5 h-4.5 fill-white" />
              </div>
              <span className="font-heading font-extrabold text-lg text-stone-900 dark:text-white tracking-tight truncate">
                CartPilot
              </span>
            </div>

            <div className="flex items-center gap-1.5 flex-shrink-0">
              {/* Wallet Chip */}
              {onOpenWallet && (
                <button
                  type="button"
                  data-tour="wallet"
                  onClick={onOpenWallet}
                  className="px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 font-extrabold text-xs flex items-center gap-1 cursor-pointer"
                  title="CartPilot Wallet"
                  aria-label="CartPilot Wallet"
                >
                  <Wallet className="w-3 h-3 text-emerald-700" />
                  <span>₹{formatRupees(walletBalance)}</span>
                </button>
              )}

              {/* Wishlist Button */}
              {onOpenWishlist && (
                <button
                  type="button"
                  onClick={onOpenWishlist}
                  className="w-8 h-8 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:text-rose-500 flex items-center justify-center transition-colors relative cursor-pointer"
                  title="Wishlist"
                  aria-label="Wishlist"
                >
                  <Heart className={`w-4 h-4 ${favorites.length > 0 ? 'fill-rose-500 text-rose-500' : ''}`} />
                  {favorites.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center">
                      {favorites.length}
                    </span>
                  )}
                </button>
              )}

              {/* Profile Avatar with Floating Category-Aware Notification Tag */}
              <button
                type="button"
                data-tour="account"
                onClick={onOpenProfile}
                className="relative w-8 h-8 rounded-full bg-emerald-700 text-white font-extrabold text-xs flex items-center justify-center shadow-xs cursor-pointer border border-emerald-600/40 active:scale-95 overflow-visible"
                title="Profile & Settings"
                aria-label="Account"
              >
                <div className="w-full h-full rounded-full overflow-hidden flex items-center justify-center bg-emerald-700">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Account" className="w-full h-full object-cover" />
                  ) : (
                    userInitial
                  )}
                </div>

                {/* Floating Status Notification Tag (Category-Aware) */}
                {unreadNotificationsCount > 0 && (
                  <span
                    className={`absolute -top-1 -right-1 translate-x-1/4 -translate-y-1/4 z-30 flex items-center justify-center rounded-full ring-2 ring-white dark:ring-stone-900 transition-transform pointer-events-none ${
                      primaryNotificationType === 'order'
                        ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]'
                        : primaryNotificationType === 'wallet'
                        ? 'bg-sky-500 shadow-[0_0_8px_rgba(14,165,233,0.5)]'
                        : primaryNotificationType === 'mandate'
                        ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]'
                        : 'bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.5)]'
                    } ${
                      unreadNotificationsCount > 1
                        ? 'min-w-[16px] h-[16px] px-1 text-[9px] font-mono font-black text-white'
                        : 'w-3 h-3'
                    }`}
                  >
                    {unreadNotificationsCount > 1 ? (
                      unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount
                    ) : (
                      <span className="w-1 h-1 rounded-full bg-white animate-ping opacity-75" />
                    )}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Location Line (Blinkit / Zepto Style) */}
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              data-tour="delivery-location"
              onClick={onOpenAddressModal}
              className="flex items-center gap-1.5 text-xs font-semibold text-stone-800 dark:text-stone-200 hover:text-emerald-700 transition-colors cursor-pointer truncate max-w-[76%]"
            >
              <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 flex items-center justify-center flex-shrink-0">
                <MapPin className="w-3 h-3 text-emerald-700 dark:text-emerald-400" />
              </div>
              <span className="font-extrabold text-stone-900 dark:text-white capitalize truncate">
                {addressTypeLabel}:
              </span>
              <span className="text-stone-600 dark:text-stone-300 font-medium truncate">
                {addressLocalityLabel}
              </span>
              <ChevronDown className="w-3 h-3 text-stone-400 flex-shrink-0" />
            </button>

            {/* Next-Day Delivery Badge */}
            <div className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800 text-[10px] font-black text-emerald-800 dark:text-emerald-300 flex items-center gap-1 flex-shrink-0 shadow-2xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>Next-Day Delivery</span>
            </div>
          </div>

          {/* Search Bar + AI Assistant Shortcut */}
          <div className="flex items-center gap-2">
            <div
              data-tour="search"
              onClick={onOpenSearchModal}
              className="flex-1 min-w-0 flex items-center gap-2 px-3 py-2 rounded-full bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs text-stone-400 cursor-pointer"
            >
              <Search className="w-3.5 h-3.5 text-stone-400 flex-shrink-0" />
              <span className="truncate">Search groceries, vegetables...</span>
            </div>

            <button
              type="button"
              onClick={() => onSelectTab('chat')}
              className="px-3 py-2 rounded-full bg-purple-700 text-white text-xs font-bold flex items-center gap-1 shadow-xs flex-shrink-0 cursor-pointer"
            >
              <Sparkles className="w-3 h-3" />
              <span>AI</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Main Fluid Page Container (Capped at 1400px per UX_CONTRACT) ── */}
      <div className="page-container pt-4 lg:pt-6 space-y-5 lg:space-y-7">
        {/* ── Daily Delivery Schedule Strip (Humble, Factual & Aesthetic) ── */}
        <div className="rounded-2xl bg-stone-900 dark:bg-stone-900 text-white p-3.5 sm:p-4 border border-stone-800 shadow-2xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-stone-800 text-emerald-400 flex items-center justify-center flex-shrink-0">
              <Truck className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
            </div>
            <div className="min-w-0 space-y-0.5">
              <h3 className="font-heading font-bold text-xs sm:text-sm text-stone-100 leading-snug">
                Morning Deliveries: 6 AM – 10 AM
              </h3>
              <p className="text-[11px] sm:text-xs text-stone-400 leading-tight">
                Orders placed by midnight arrive tomorrow morning
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onSelectTab('browse')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-white hover:bg-stone-100 active:scale-95 text-stone-900 font-bold text-xs shadow-2xs transition-all cursor-pointer flex-shrink-0"
          >
            <span>Shop</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* ── AI Cooking Assistant Hero Card ── */}
        <div className="rounded-2xl sm:rounded-3xl bg-[#144f38] dark:bg-[#0e3b2a] border border-[#1b5e43] dark:border-[#134d37] p-4 sm:p-5 lg:p-6 shadow-xs text-white space-y-3.5">
          {/* Badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/10 text-emerald-200 text-[11px] sm:text-xs font-semibold backdrop-blur-xs">
            <Sparkles className="w-3.5 h-3.5 text-amber-300 fill-amber-300/40" />
            <span>AI Cooking Assistant</span>
          </div>

          {/* Heading */}
          <div className="space-y-1">
            <h3 className="font-heading font-extrabold text-xl sm:text-2xl text-white tracking-tight leading-snug">
              What are you cooking today?
            </h3>
          </div>

          {/* Search / Input Box */}
          <form onSubmit={handleCookingSubmit} className="relative flex items-center bg-white rounded-xl sm:rounded-2xl p-1.5 sm:p-2 shadow-2xs">
            <input
              type="text"
              value={cookingInput}
              onChange={(e) => setCookingInput(e.target.value)}
              placeholder="Ask AI: Matar Biryani for 4..."
              className="flex-1 bg-transparent px-3 py-1.5 sm:py-2 text-xs sm:text-sm text-stone-900 placeholder:text-stone-400 font-medium outline-none min-w-0"
            />
            <button
              type="submit"
              disabled={!cookingInput.trim()}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-amber-400 hover:bg-amber-300 disabled:opacity-40 disabled:hover:bg-amber-400 text-stone-900 flex items-center justify-center transition-all cursor-pointer flex-shrink-0 active:scale-95 shadow-2xs"
              title="Send to AI Cooking Assistant"
              aria-label="Send to AI Cooking Assistant"
            >
              <ArrowRight className="w-4 h-4 sm:w-4.5 sm:h-4.5 stroke-[2.5]" />
            </button>
          </form>

          {/* 4 Recipe Suggestion Chips */}
          <div className="flex flex-wrap items-center gap-2 pt-0.5">
            {COOKING_SUGGESTIONS.map((item) => (
              <button
                key={item.name}
                type="button"
                onClick={() => handleRecipeChipClick(item.prompt)}
                className="px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 border border-white/15 text-white/95 text-xs sm:text-sm font-medium transition-all cursor-pointer"
              >
                {item.name}
              </button>
            ))}
          </div>

          {/* Factual Subtext */}
          <p className="text-[11px] sm:text-xs text-emerald-100/75 leading-relaxed pt-0.5">
            AI turns any dish into a shopping list that fits your budget. Add it all in one tap.
          </p>
        </div>

        {/* ── Shop by Category (Smooth Horizontal Single-Row Scroll) ── */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="section-headline font-heading font-extrabold text-stone-900 dark:text-white tracking-tight">
              Shop by Category
            </h3>
          </div>

          <div className="flex items-center gap-3 sm:gap-4 overflow-x-auto no-scrollbar scroll-smooth pb-1 pt-0.5 -mx-4 px-4 sm:mx-0 sm:px-0">
            {CATEGORIES.map((cat) => {
              const IconComp = cat.icon;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => onSelectTab('browse', cat.id)}
                  className="flex-shrink-0 w-24 sm:w-28 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 p-3 flex flex-col items-center text-center shadow-2xs hover:shadow-xs hover:border-emerald-500/40 transition-all cursor-pointer group active:scale-95"
                >
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center mb-2 transition-transform group-hover:scale-105 shadow-2xs ${cat.bg}`}
                  >
                    <IconComp className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-bold text-stone-800 dark:text-stone-200 leading-tight text-center line-clamp-2">
                    {cat.title}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── 3 Compact Feature Cards (AI Recipe -> List, Budget Guard, Morning Delivery) ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            type="button"
            data-tour="ai-feature-card"
            onClick={() => onSelectTab('chat')}
            className="rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 p-3.5 shadow-2xs hover:border-emerald-500/50 hover:shadow-xs transition-all cursor-pointer text-left flex items-start gap-3 group active:scale-[0.99]"
          >
            <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950/60 border border-purple-200/60 dark:border-purple-800/60 text-purple-700 dark:text-purple-300 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Sparkles className="w-4.5 h-4.5" />
            </div>
            <div className="space-y-0.5 min-w-0">
              <h4 className="font-heading font-bold text-xs sm:text-sm text-stone-900 dark:text-white leading-tight flex items-center gap-1">
                <span>AI Recipe → List</span>
                <ArrowRight className="w-3 h-3 text-stone-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all" />
              </h4>
              <p className="text-[11px] text-stone-500 dark:text-stone-400 leading-tight">
                Turn any dish into a ready cart in one tap.
              </p>
            </div>
          </button>

          <button
            type="button"
            data-tour="budget-guard-card"
            onClick={() => {
              if (onOpenRules) onOpenRules();
              else if (onOpenWallet) onOpenWallet();
              else onSelectTab('account');
            }}
            className="rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 p-3.5 shadow-2xs hover:border-emerald-500/50 hover:shadow-xs transition-all cursor-pointer text-left flex items-start gap-3 group active:scale-[0.99]"
          >
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/60 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <ShieldCheck className="w-4.5 h-4.5" />
            </div>
            <div className="space-y-0.5 min-w-0">
              <h4 className="font-heading font-bold text-xs sm:text-sm text-stone-900 dark:text-white leading-tight flex items-center gap-1">
                <span>Budget Guard</span>
                <ArrowRight className="w-3 h-3 text-stone-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all" />
              </h4>
              <p className="text-[11px] text-stone-500 dark:text-stone-400 leading-tight">
                Set daily spend caps & anomaly safety.
              </p>
            </div>
          </button>

          <button
            type="button"
            data-tour="delivery-feature-card"
            onClick={() => onSelectTab('browse')}
            className="rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 p-3.5 shadow-2xs hover:border-emerald-500/50 hover:shadow-xs transition-all cursor-pointer text-left flex items-start gap-3 group active:scale-[0.99]"
          >
            <div className="w-9 h-9 rounded-xl bg-sky-50 dark:bg-sky-950/60 border border-sky-200/60 dark:border-sky-800/60 text-sky-700 dark:text-sky-300 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Truck className="w-4.5 h-4.5" />
            </div>
            <div className="space-y-0.5 min-w-0">
              <h4 className="font-heading font-bold text-xs sm:text-sm text-stone-900 dark:text-white leading-tight flex items-center gap-1">
                <span>Morning Delivery</span>
                <ArrowRight className="w-3 h-3 text-stone-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all" />
              </h4>
              <p className="text-[11px] text-stone-500 dark:text-stone-400 leading-tight">
                6:00 AM – 10:00 AM fresh farm harvest.
              </p>
            </div>
          </button>
        </div>

        {/* ── Active Order Live Tracking Floating Card ── */}
        {activeOrder && (
          <div className="rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-4 shadow-2xs space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-bold text-stone-900 dark:text-white">
                  Active order #{activeOrder.orderNumber}
                </span>
              </div>
              <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 rounded-full">
                {activeOrder.status === 'OUT_FOR_DELIVERY' ? 'Out for Delivery' : activeOrder.status}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-700 flex-shrink-0">
                <Truck className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span>{activeOrder.items?.length || 0} items</span>
                  <span>₹{((activeOrder.pricingSnapshot?.totalPaise || 0) / 100).toFixed(0)}</span>
                </div>
                <p className="text-[11px] text-stone-500 truncate mt-0.5">
                  Scheduled delivery: {deliveryWindow.title.toLowerCase()} {deliveryWindow.slot}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onOpenTracking(activeOrder)}
              className="w-full py-2 px-3 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-stone-800 dark:text-stone-200 hover:text-emerald-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>Track Order Live</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* ── Best Sellers Product Cards (Responsive Multi-Column Grid 2 to 5 columns) ── */}
        <div className="space-y-3 pt-1">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="section-headline font-heading font-extrabold text-stone-900 dark:text-white tracking-tight">
                Best Sellers & Fresh Arrivals
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Daily Essentials · Farm Fresh Harvest
              </p>
            </div>
            <button
              type="button"
              onClick={() => onSelectTab('browse')}
              className="text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer flex items-center gap-1"
            >
              <span>See all ({products.length})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 min-h-[360px]">
            {products.length === 0 ? (
              Array.from({ length: 10 }).map((_, idx) => (
                <div
                  key={`home-skeleton-${idx}`}
                  className="rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 p-3 shadow-2xs flex flex-col justify-between animate-pulse min-h-[220px]"
                >
                  <div className="space-y-2">
                    <div className="w-full aspect-square rounded-xl bg-stone-100 dark:bg-stone-800" />
                    <div className="h-4 w-3/4 rounded-md bg-stone-100 dark:bg-stone-800" />
                    <div className="h-3 w-1/2 rounded-md bg-stone-100 dark:bg-stone-800" />
                  </div>
                  <div className="mt-3 pt-2 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between">
                    <div className="h-5 w-12 rounded-md bg-stone-100 dark:bg-stone-800" />
                    <div className="w-8 h-8 rounded-lg bg-stone-100 dark:bg-stone-800" />
                  </div>
                </div>
              ))
            ) : (
              bestSellers.map((prod) => {
              const qty = getCartQuantity(prod._id);
              const price = Math.round(prod.pricePaise / 100);
              const strikethroughMrp = Math.round(price * 1.15);
              const isFav = favorites.includes(prod._id);

              return (
                <div
                  key={prod._id}
                  onClick={() => onSelectProduct(prod)}
                  className="rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 p-3 shadow-2xs hover:shadow-md hover:border-emerald-500/40 transition-all flex flex-col justify-between cursor-pointer group"
                >
                  <div>
                    {/* Top Right Wishlist Heart */}
                    <div className="flex justify-end mb-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onToggleFavorite) onToggleFavorite(prod._id);
                        }}
                        className="p-1 rounded-full text-stone-300 hover:text-rose-500 transition-colors"
                        aria-label="Wishlist"
                        title={isFav ? 'Remove from wishlist' : 'Add to wishlist'}
                      >
                        <Heart
                          className={`w-4 h-4 ${
                            isFav ? 'fill-rose-500 text-rose-500' : 'text-stone-300'
                          }`}
                        />
                      </button>
                    </div>

                    {/* Product Photo */}
                    <div className="relative w-full aspect-square rounded-xl bg-stone-50 dark:bg-stone-800/80 mb-2 overflow-hidden flex items-center justify-center p-2">
                      {prod.imageUrl ? (
                        <img
                          src={prod.imageUrl}
                          alt={prod.name}
                          className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                      ) : (
                        <span className="text-3xl lg:text-4xl select-none">🥗</span>
                      )}

                      {/* Pure Veg Green Badge */}
                      <div className="absolute top-2 left-2 w-3.5 h-3.5 rounded-xs border border-emerald-600 bg-white flex items-center justify-center shadow-2xs">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                      </div>
                    </div>

                    {/* Title & Unit */}
                    <div className="space-y-0.5">
                      <h4 className="card-title font-heading font-bold text-stone-900 dark:text-stone-100 line-clamp-2 leading-snug group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
                        {prod.name}
                      </h4>
                      <p className="text-[11px] text-stone-400">
                        {prod.packageSize && prod.packageUnit
                          ? `${prod.packageSize} ${prod.packageUnit}`
                          : '1 unit'}
                      </p>
                    </div>
                  </div>

                  {/* Price & Add to Cart Square Button */}
                  <div className="mt-2.5 pt-2 border-t border-stone-100 dark:border-stone-800/60 flex items-center justify-between">
                    <div className="flex items-baseline gap-1">
                      <span className="font-heading font-black text-sm sm:text-base text-stone-900 dark:text-white">
                        ₹{price}
                      </span>
                      <span className="text-[10px] text-stone-400 line-through">
                        ₹{strikethroughMrp}
                      </span>
                    </div>

                    {qty === 0 ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onAddToCart(prod._id, 1);
                        }}
                        className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold flex items-center justify-center shadow-xs cursor-pointer active:scale-90 transition-all"
                        aria-label="Add to cart"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    ) : (
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-1 bg-emerald-700 text-white rounded-lg px-1.5 py-0.5 shadow-xs"
                      >
                        <button
                          type="button"
                          onClick={() => onUpdateQuantity(prod._id, qty - 1)}
                          className="w-4 h-4 flex items-center justify-center rounded hover:bg-emerald-800 transition-colors cursor-pointer"
                          aria-label="Decrease"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="font-mono font-bold text-xs min-w-[14px] text-center">
                          {qty}
                        </span>
                        <button
                          type="button"
                          onClick={() => onUpdateQuantity(prod._id, qty + 1)}
                          className="w-4 h-4 flex items-center justify-center rounded hover:bg-emerald-800 transition-colors cursor-pointer"
                          aria-label="Increase"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            }))}
          </div>
        </div>
      </div>
    </div>
  );
};

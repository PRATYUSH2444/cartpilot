import React from 'react';
import {
  MapPin,
  ChevronDown,
  Search,
  Mic,
  ArrowRight,
  Plus,
  Minus,
  Truck,
  Leaf,
  Clock,
  Sparkles,
  Bell,
  Heart,
  ShieldCheck,
  Zap,
  Calendar,
  Percent,
  LayoutGrid,
  Tag,
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
  walletBalance?: number;
  onOpenWallet?: () => void;
  onOpenCoupons?: () => void;
  onOpenWishlist?: () => void;
  onOpenNotifications?: () => void;
}

const CATEGORIES = [
  {
    id: 'FRUITS_VEGETABLES',
    title: 'Fruits &\nVegetables',
    emoji: '🍎',
    bg: 'bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300',
  },
  {
    id: 'DAIRY_BREAKFAST',
    title: 'Dairy &\nEggs',
    emoji: '🥛',
    bg: 'bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300',
  },
  {
    id: 'ATTA_RICE_DAL',
    title: 'Atta, Rice\n& Dal',
    emoji: '🥣',
    bg: 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300',
  },
  {
    id: 'SNACKS_MUNCHIES',
    title: 'Snacks &\nBeverages',
    emoji: '🥔',
    bg: 'bg-orange-50 dark:bg-orange-950/30 text-orange-700 dark:text-orange-300',
  },
  {
    id: 'PERSONAL_CARE',
    title: 'Personal\nCare',
    emoji: '🧴',
    bg: 'bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300',
  },
  {
    id: 'MORE',
    title: 'All\nCategories',
    emoji: '▦',
    bg: 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300',
  },
];

const PROMPT_CHIPS = [
  { label: 'Recipe for paneer pulao', emoji: '🍲' },
  { label: 'Weekly grocery list', emoji: '📅' },
  { label: 'Groceries under ₹1,000', emoji: '₹' },
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
  walletBalance = 349,
  onOpenWallet,
  onOpenCoupons,
  onOpenWishlist,
  onOpenNotifications,
}) => {
  // Dynamic delivery window calculation
  const deliveryWindow = getDeliveryWindowInfo();

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

  const handleChipClick = (prompt: string) => {
    if (onTriggerAIPrompt) {
      onTriggerAIPrompt(prompt);
    } else {
      onSelectTab('chat');
    }
  };

  const addressTypeLabel = selectedAddress?.addressType || 'Home';
  const addressLocalityLabel = selectedAddress
    ? selectedAddress.areaLocality || selectedAddress.apartmentStreet || selectedAddress.city
    : 'HSR Layout, Bengaluru';

  // Take top best sellers from catalog
  const bestSellers = products.slice(0, 12);

  return (
    <div className="flex-1 overflow-y-auto pb-16 bg-[#f8faf9] dark:bg-stone-950 text-stone-900 dark:text-stone-100 font-sans selection:bg-emerald-500 selection:text-white">
      {/* ── Mobile Top Sticky App Bar (Visible on mobile/tablet, hidden on desktop >= 1024px) ── */}
      <div className="block lg:hidden sticky top-0 z-30 bg-white/95 dark:bg-stone-900/95 backdrop-blur-md border-b border-stone-200/60 dark:border-stone-800/60 shadow-xs">
        <div className="max-w-xl mx-auto px-4 pt-3 pb-3 space-y-2.5">
          {/* Header Row: Logo + Wallet Pill + Bell & Profile */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-sm shadow-emerald-600/30">
                <Leaf className="w-5 h-5 fill-white" />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-xl text-stone-900 dark:text-white tracking-tight">
                  CartPilot
                </span>
                <span className="text-[9px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 px-1.5 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-700">
                  100% Veg
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Wallet Pill Button matching Sbzee reference */}
              {onOpenWallet && (
                <button
                  type="button"
                  onClick={onOpenWallet}
                  className="px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-700/60 text-emerald-800 dark:text-emerald-300 font-extrabold text-xs flex items-center gap-1 shadow-2xs hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-colors cursor-pointer"
                  title="CartPilot Wallet"
                  aria-label="CartPilot Wallet"
                >
                  <span className="text-[10px]">👛</span>
                  <span>₹{walletBalance.toFixed(1)}</span>
                </button>
              )}

              {/* Wishlist Quick Access Button */}
              {onOpenWishlist && (
                <button
                  type="button"
                  onClick={onOpenWishlist}
                  className="w-8 h-8 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:text-rose-500 flex items-center justify-center transition-colors relative cursor-pointer"
                  title="Saved Wishlist Items"
                  aria-label="Wishlist"
                >
                  <Heart className={`w-4 h-4 ${favorites.length > 0 ? 'fill-rose-500 text-rose-500' : ''}`} />
                  {favorites.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center ring-2 ring-white dark:ring-stone-800">
                      {favorites.length}
                    </span>
                  )}
                </button>
              )}

              <button
                type="button"
                onClick={onOpenNotifications || (() => onSelectTab('account'))}
                className="w-8 h-8 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:text-stone-900 flex items-center justify-center transition-colors relative cursor-pointer"
                title="Notifications"
                aria-label="Notifications"
              >
                <Bell className="w-4 h-4" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white dark:ring-stone-800" />
              </button>

              <button
                type="button"
                onClick={onOpenProfile}
                className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/70 text-emerald-800 dark:text-emerald-200 border-2 border-emerald-300 dark:border-emerald-600 flex items-center justify-center font-bold text-xs shadow-xs cursor-pointer hover:scale-105 transition-transform"
                title="Account"
                aria-label="Account"
              >
                {userInitial}
              </button>
            </div>
          </div>

          {/* Location Line */}
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={onOpenAddressModal}
              className="flex items-center gap-1 text-xs font-semibold text-stone-800 dark:text-stone-200 hover:text-emerald-700 transition-colors cursor-pointer group truncate max-w-[85%]"
            >
              <div className="w-4 h-4 rounded-full bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center flex-shrink-0">
                <MapPin className="w-2.5 h-2.5 text-emerald-700 dark:text-emerald-400" />
              </div>
              <span className="font-bold text-stone-900 dark:text-white capitalize">
                {addressTypeLabel}
              </span>
              <span className="text-stone-400 font-normal">•</span>
              <span className="text-stone-600 dark:text-stone-300 truncate">
                {addressLocalityLabel}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-stone-400 group-hover:text-stone-700 flex-shrink-0" />
            </button>
          </div>

          {/* Search Bar with Embedded "AI Shop ✦" Button */}
          <div
            onClick={onOpenSearchModal}
            className="flex items-center justify-between pl-3.5 pr-1.5 py-1.5 rounded-full bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm cursor-pointer hover:border-emerald-500/40 transition-all"
          >
            <div className="flex items-center gap-2 text-stone-400 text-xs font-medium truncate">
              <Search className="w-4 h-4 text-stone-400 flex-shrink-0" />
              <span className="truncate">Search for groceries, recipes, ingredients...</span>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <Mic className="w-4 h-4 text-stone-400 hover:text-stone-600" />
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectTab('chat');
                }}
                className="px-3.5 py-1.5 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center gap-1 shadow-sm transition-all cursor-pointer"
              >
                <span>AI Shop</span>
                <Sparkles className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Responsive Content Area (Expands gracefully across widescreen desktop max-w-[1560px]) ── */}
      <div className="w-full max-w-[1560px] mx-auto px-4 sm:px-6 lg:px-10 pt-4 lg:pt-6 space-y-6 lg:space-y-8">
        {/* ── Hero Promotional Banner ── */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#175c37] via-[#1d6e42] to-[#258550] text-white p-6 sm:p-8 lg:p-12 shadow-md">
          {/* Subtle Ambient Leaf Lighting */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-md sm:max-w-xl lg:max-w-2xl space-y-3 sm:space-y-4">
            {/* Top Cutoff Pill Tag */}
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/20 backdrop-blur-md text-xs sm:text-sm font-semibold text-white tracking-wide">
              <Clock className="w-4 h-4 text-emerald-200" />
              <span>{deliveryWindow.cutoffHeadline}</span>
            </div>

            {/* Headline with 6 AM - 9 AM Gold Pill Badge */}
            <div className="space-y-1">
              <h2 className="font-extrabold text-2xl sm:text-4xl lg:text-5xl leading-tight tracking-tight text-white">
                Get it Tomorrow
              </h2>
              <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
                <span className="font-extrabold text-2xl sm:text-4xl lg:text-5xl leading-tight text-white">
                  Morning
                </span>
                <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#fbf4d8] text-stone-900 font-black text-xs sm:text-sm shadow-xs">
                  <Calendar className="w-3.5 h-3.5 text-amber-600" />
                  <span>{deliveryWindow.slot}</span>
                </span>
              </div>
            </div>

            <p className="text-white/90 text-xs sm:text-base leading-relaxed max-w-xl">
              Fresh groceries, fruits & everyday essentials delivered to your doorstep with agentic AI meal planning.
            </p>

            {/* Action Button & Carousel Dots */}
            <div className="pt-2 flex items-center gap-5">
              <button
                type="button"
                onClick={() => onSelectTab('browse')}
                className="inline-flex items-center gap-2 px-7 py-3 rounded-full bg-white text-emerald-950 font-black text-xs sm:text-sm shadow-md hover:bg-stone-50 active:scale-[0.98] transition-all cursor-pointer"
              >
                <span>Shop Now</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-1.5 select-none">
                <span className="w-2.5 h-2.5 rounded-full bg-white" />
                <span className="w-2 h-2 rounded-full bg-white/40" />
                <span className="w-2 h-2 rounded-full bg-white/40" />
              </div>
            </div>
          </div>

          {/* Right Kraft Grocery Bag Illustration */}
          <div className="absolute right-2 sm:right-8 lg:right-16 -bottom-2 sm:-bottom-4 w-48 h-52 sm:w-64 sm:h-68 lg:w-88 lg:h-88 flex items-center justify-center pointer-events-none select-none">
            <div className="relative w-40 sm:w-56 lg:w-72 h-44 sm:h-60 lg:h-72 bg-[#d8ab76] rounded-t-2xl rounded-b-md shadow-2xl flex flex-col items-center justify-end p-3 border-t-4 border-[#b88c58]">
              {/* CartPilot Leaf Emblem on Bag */}
              <div className="flex items-center gap-1.5 mb-4 bg-[#b88c58]/35 px-3 py-1 rounded-lg">
                <Leaf className="w-4 h-4 text-emerald-950 fill-emerald-950" />
                <span className="text-xs sm:text-sm font-black text-emerald-950 tracking-wider">
                  CartPilot
                </span>
              </div>

              {/* Overflowing Produce Visuals */}
              <div className="absolute -top-8 sm:-top-12 left-4 text-4xl sm:text-6xl">🥬</div>
              <div className="absolute -top-8 sm:-top-10 left-16 sm:left-24 text-4xl sm:text-6xl">🍎</div>
              <div className="absolute -top-9 sm:-top-12 right-4 sm:right-8 text-4xl sm:text-6xl">🍌</div>
              <div className="absolute -top-6 sm:-top-8 right-1 sm:right-2 text-3xl sm:text-5xl">🥛</div>
              <div className="absolute -top-4 sm:-top-6 left-8 sm:left-12 text-3xl sm:text-5xl">🍅</div>
            </div>
          </div>
        </div>

        {/* ── Offers & Wallet Bonus Banner (Sbzee Reference Feature) ── */}
        <div
          onClick={onOpenWallet || onOpenCoupons}
          className="rounded-3xl bg-gradient-to-r from-emerald-50 via-white to-amber-50/40 dark:from-emerald-950/30 dark:via-stone-900 dark:to-amber-950/20 border-2 border-emerald-500/25 p-4 sm:p-5 shadow-2xs hover:shadow-md hover:border-emerald-500/40 transition-all cursor-pointer relative overflow-hidden group"
        >
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-1.5 z-10">
              <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 font-extrabold text-[11px] border border-emerald-300/60 dark:border-emerald-800">
                <Tag className="w-3 h-3 text-emerald-600" />
                <span>Limited Time Offer</span>
              </div>
              <h4 className="font-extrabold text-base sm:text-xl text-stone-900 dark:text-white leading-tight">
                Add ₹999 & Get ₹100 Bonus
              </h4>
              <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400">
                Bonus will be instantly added to your CartPilot wallet balance
              </p>
            </div>

            <div className="flex items-center gap-3.5 flex-shrink-0 z-10">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-emerald-600/10 dark:bg-emerald-500/20 flex items-center justify-center text-3xl sm:text-4xl shadow-inner group-hover:scale-105 transition-transform select-none">
                👛
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (onOpenWallet) onOpenWallet();
                }}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs sm:text-sm shadow-sm cursor-pointer transition-colors"
              >
                Add
              </button>
            </div>
          </div>
        </div>

        {/* ── 6-Category Squircle Row (Responsive: 6 columns on all screens with spacious padding) ── */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-extrabold text-base sm:text-lg text-stone-900 dark:text-white tracking-tight">
              Shop by Category
            </h3>
            <button
              type="button"
              onClick={() => onSelectTab('browse')}
              className="text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer"
            >
              View all categories →
            </button>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 sm:gap-4">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  if (cat.id === 'MORE') {
                    onSelectTab('browse');
                  } else {
                    onSelectTab('browse', cat.id);
                  }
                }}
                className="rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 p-3 sm:p-4 flex flex-col items-center text-center shadow-2xs hover:shadow-md hover:border-emerald-500/40 transition-all cursor-pointer group"
              >
                <div
                  className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center text-2xl sm:text-3xl mb-2 transition-transform group-hover:scale-110 shadow-2xs ${cat.bg}`}
                >
                  {cat.id === 'MORE' ? (
                    <LayoutGrid className="w-6 h-6 text-emerald-700 dark:text-emerald-400" />
                  ) : (
                    cat.emoji
                  )}
                </div>
                <span className="text-xs font-bold text-stone-800 dark:text-stone-200 leading-tight whitespace-pre-line">
                  {cat.title}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* ── "CartPilot AI" Interactive Prompt Card ── */}
        <div className="rounded-3xl bg-gradient-to-r from-purple-50/90 via-white to-emerald-50/90 dark:from-purple-950/20 dark:via-stone-900 dark:to-emerald-950/20 border border-purple-200/70 dark:border-purple-800/40 p-5 sm:p-6 shadow-2xs space-y-3.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-purple-100 dark:bg-purple-900/60 flex items-center justify-center text-purple-600 shadow-2xs">
                <Sparkles className="w-5 h-5 fill-purple-600" />
              </div>
              <div>
                <h4 className="font-extrabold text-base text-stone-900 dark:text-white leading-tight">
                  CartPilot AI Shopping Assistant
                </h4>
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                  Ask, plan recipes, match pantry ingredients & shop autonomously with AI
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onSelectTab('chat')}
              className="self-start sm:self-auto px-4 py-2 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <span>Launch AI Shop</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* 3 Clickable AI Planning Chips */}
          <div className="flex items-center gap-2.5 overflow-x-auto no-scrollbar pt-1">
            {PROMPT_CHIPS.map((chip, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleChipClick(chip.label)}
                className="flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-full bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 hover:border-emerald-500 text-stone-700 dark:text-stone-200 text-xs font-bold shadow-2xs hover:shadow-xs transition-all cursor-pointer group"
              >
                <span className="text-sm">{chip.emoji}</span>
                <span className="group-hover:text-emerald-700 dark:group-hover:text-emerald-300">
                  {chip.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* ── 4 Feature Highlights Row ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 p-4 sm:p-5 shadow-2xs text-center">
          <div className="flex flex-col items-center space-y-1">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 mb-0.5">
              <Zap className="w-4 h-4" />
            </div>
            <p className="font-extrabold text-xs sm:text-sm text-stone-900 dark:text-white leading-tight">
              Same-day
            </p>
            <p className="text-[10px] sm:text-xs text-stone-400 leading-tight">
              (on select items)
            </p>
          </div>

          <div className="flex flex-col items-center space-y-1">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 mb-0.5">
              <Truck className="w-4 h-4" />
            </div>
            <p className="font-extrabold text-xs sm:text-sm text-stone-900 dark:text-white leading-tight">
              Scheduled
            </p>
            <p className="text-[10px] sm:text-xs text-stone-400 leading-tight">
              Delivery 6 AM–9 AM
            </p>
          </div>

          <div className="flex flex-col items-center space-y-1">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 mb-0.5">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <p className="font-extrabold text-xs sm:text-sm text-stone-900 dark:text-white leading-tight">
              Secure
            </p>
            <p className="text-[10px] sm:text-xs text-stone-400 leading-tight">
              100% Veg Guarantee
            </p>
          </div>

          <div className="flex flex-col items-center space-y-1">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 mb-0.5">
              <Percent className="w-4 h-4" />
            </div>
            <p className="font-extrabold text-xs sm:text-sm text-stone-900 dark:text-white leading-tight">
              Best
            </p>
            <p className="text-[10px] sm:text-xs text-stone-400 leading-tight">
              Offers & Cashback
            </p>
          </div>
        </div>

        {/* ── Active Order Live Tracking Floating Card ── */}
        {activeOrder && (
          <div className="rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-4 sm:p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                <span className="text-xs sm:text-sm font-bold text-stone-900 dark:text-white">
                  Active order #{activeOrder.orderNumber}
                </span>
              </div>
              <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950 px-2.5 py-0.5 rounded-full">
                {activeOrder.status === 'OUT_FOR_DELIVERY' ? 'Out for Delivery' : activeOrder.status}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-700 flex-shrink-0">
                <Truck className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between text-xs sm:text-sm font-bold">
                  <span>{activeOrder.items?.length || 0} items</span>
                  <span>₹{((activeOrder.pricingSnapshot?.totalPaise || 0) / 100).toFixed(0)}</span>
                </div>
                <p className="text-xs text-stone-500 truncate mt-0.5">
                  Scheduled delivery: {deliveryWindow.title.toLowerCase()} {deliveryWindow.slot}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onOpenTracking(activeOrder)}
              className="w-full py-2.5 px-4 rounded-2xl bg-stone-100 dark:bg-stone-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-stone-800 dark:text-stone-200 hover:text-emerald-700 font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>Track Order Live</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ── Best Sellers Product Cards (Responsive Multi-Column Grid: 2 on mobile, 3 on tablet, 4 to 6 on desktop) ── */}
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-lg sm:text-2xl text-stone-900 dark:text-white tracking-tight">
                Best Sellers & Fresh Arrivals
              </h3>
              <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400">
                100% Certified Vegetarian · Farm Fresh Guarantee
              </p>
            </div>
            <button
              type="button"
              onClick={() => onSelectTab('browse')}
              className="text-xs sm:text-sm font-bold text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer flex items-center gap-1"
            >
              <span>See all ({products.length})</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-5 lg:gap-6">
            {bestSellers.map((prod) => {
              const qty = getCartQuantity(prod._id);
              const price = Math.round(prod.pricePaise / 100);
              const strikethroughMrp = Math.round(price * 1.18);
              const isFav = favorites.includes(prod._id);

              return (
                <div
                  key={prod._id}
                  onClick={() => onSelectProduct(prod)}
                  className="rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 p-3.5 sm:p-5 shadow-2xs hover:shadow-xl hover:border-emerald-500/40 transition-all flex flex-col justify-between cursor-pointer group"
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
                        className="p-1.5 rounded-full text-stone-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                        aria-label="Wishlist"
                        title={isFav ? 'Remove from wishlist' : 'Add to wishlist'}
                      >
                        <Heart
                          className={`w-4 h-4 sm:w-5 sm:h-5 ${
                            isFav ? 'fill-rose-500 text-rose-500' : 'text-stone-300'
                          }`}
                        />
                      </button>
                    </div>

                    {/* Product Photo */}
                    <div className="relative w-full aspect-square rounded-2xl bg-stone-50 dark:bg-stone-800/80 mb-3 overflow-hidden flex items-center justify-center p-3">
                      {prod.imageUrl ? (
                        <img
                          src={prod.imageUrl}
                          alt={prod.name}
                          className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                      ) : (
                        <span className="text-4xl sm:text-5xl select-none">🥗</span>
                      )}

                      {/* Pure Veg Green Badge */}
                      <div className="absolute top-2 left-2 w-4 h-4 rounded border border-emerald-600 bg-white flex items-center justify-center shadow-xs">
                        <div className="w-2 h-2 rounded-full bg-emerald-600" />
                      </div>
                    </div>

                    {/* Title & Unit */}
                    <div className="space-y-1">
                      <h4 className="font-extrabold text-xs sm:text-sm lg:text-base text-stone-900 dark:text-stone-100 line-clamp-2 leading-snug group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
                        {prod.name}
                      </h4>
                      <p className="text-[11px] sm:text-xs text-stone-400 font-medium">
                        {prod.packageSize && prod.packageUnit
                          ? `${prod.packageSize} ${prod.packageUnit}`
                          : '1 unit'}
                      </p>
                    </div>
                  </div>

                  {/* Price & Add to Cart Square Button */}
                  <div className="mt-3.5 pt-3 border-t border-stone-100 dark:border-stone-800/60 flex items-center justify-between">
                    <div className="flex items-baseline gap-1.5">
                      <span className="font-black text-sm sm:text-base lg:text-lg text-stone-900 dark:text-white">
                        ₹{price}
                      </span>
                      <span className="text-[10px] sm:text-xs text-stone-400 line-through">
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
                        className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold flex items-center justify-center shadow-xs cursor-pointer active:scale-90 transition-all"
                        aria-label="Add to cart"
                      >
                        <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                      </button>
                    ) : (
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-1.5 bg-emerald-600 text-white rounded-xl px-2 py-1 shadow-xs"
                      >
                        <button
                          type="button"
                          onClick={() => onUpdateQuantity(prod._id, qty - 1)}
                          className="w-5 h-5 flex items-center justify-center rounded hover:bg-emerald-700 transition-colors cursor-pointer"
                          aria-label="Decrease"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="font-extrabold text-xs sm:text-sm min-w-[16px] text-center">
                          {qty}
                        </span>
                        <button
                          type="button"
                          onClick={() => onUpdateQuantity(prod._id, qty + 1)}
                          className="w-5 h-5 flex items-center justify-center rounded hover:bg-emerald-700 transition-colors cursor-pointer"
                          aria-label="Increase"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

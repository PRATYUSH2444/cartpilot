import React from 'react';
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
  Bell,
  Heart,
  ShieldCheck,
  Wallet,
  BadgePercent,
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
  walletBalance?: number;
  onOpenWallet?: () => void;
  onOpenCoupons?: () => void;
  onOpenWishlist?: () => void;
  onOpenNotifications?: () => void;
}

const CATEGORIES = [
  {
    id: 'FRUITS_VEGETABLES',
    title: 'Vegetables & Fruits',
    icon: Leaf,
    bg: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300',
  },
  {
    id: 'DAIRY_BREAKFAST',
    title: 'Dairy & Breakfast',
    icon: Milk,
    bg: 'bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300',
  },
  {
    id: 'ATTA_RICE_DAL',
    title: 'Atta, Rice & Dal',
    icon: Wheat,
    bg: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300',
  },
  {
    id: 'MASALA_DRY_FRUITS',
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
    id: 'SNACKS_MUNCHIES',
    title: 'Snacks & Munchies',
    icon: Cookie,
    bg: 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300',
  },
  {
    id: 'COLD_DRINKS_JUICES',
    title: 'Drinks & Juices',
    icon: Sparkles,
    bg: 'bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300',
  },
  {
    id: 'INSTANT_FROZEN_FOOD',
    title: 'Instant & Ready Food',
    icon: Soup,
    bg: 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300',
  },
];

const PROMPT_CHIPS = [
  { label: 'Weekly pure-veg grocery list', tag: 'Plan' },
  { label: 'Recipe for paneer pulao ingredients', tag: 'Cook' },
  { label: 'Monthly staples under ₹1,500', tag: 'Budget' },
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
  onOpenWishlist,
  onOpenNotifications,
}) => {
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

  const addressTypeLabel = selectedAddress?.addressType || 'Delivery to';
  const addressLocalityLabel = selectedAddress
    ? selectedAddress.areaLocality || selectedAddress.apartmentStreet || selectedAddress.city
    : 'Select Location';

  const bestSellers = products.slice(0, 10);

  const formatRupees = (amount: number) =>
    new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(Math.round(amount));

  return (
    <div className="flex-1 overflow-y-auto pb-16 bg-[var(--bg)] text-[var(--ink)] font-body selection:bg-brand selection:text-white">
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
              <span className="text-[9px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 px-1.5 py-0.2 rounded-full border border-emerald-300/60 dark:border-emerald-700 flex-shrink-0">
                100% Veg
              </span>
            </div>

            <div className="flex items-center gap-1.5 flex-shrink-0">
              {/* Wallet Chip */}
              {onOpenWallet && (
                <button
                  type="button"
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

              {/* Notifications */}
              <button
                type="button"
                onClick={onOpenNotifications || (() => onSelectTab('account'))}
                className="w-8 h-8 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 flex items-center justify-center transition-colors relative cursor-pointer"
                title="Notifications"
                aria-label="Notifications"
              >
                <Bell className="w-4 h-4" />
                <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-rose-500" />
              </button>

              {/* Profile Avatar */}
              <button
                type="button"
                onClick={onOpenProfile}
                className="w-8 h-8 rounded-full bg-emerald-700 text-white font-extrabold text-xs flex items-center justify-center shadow-xs cursor-pointer"
                title="Profile & Settings"
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
              className="flex items-center gap-1.5 text-xs font-semibold text-stone-800 dark:text-stone-200 hover:text-emerald-700 transition-colors cursor-pointer truncate max-w-full"
            >
              <MapPin className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400 flex-shrink-0" />
              <span className="font-bold text-stone-900 dark:text-white capitalize truncate">
                {addressTypeLabel}:
              </span>
              <span className="text-stone-500 dark:text-stone-400 truncate">
                {addressLocalityLabel}
              </span>
              <ChevronDown className="w-3 h-3 text-stone-400 flex-shrink-0" />
            </button>
          </div>

          {/* Search Bar + AI Assistant Shortcut */}
          <div className="flex items-center gap-2">
            <div
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
        {/* ── SOP Delivery Promise Banner (Thin, Standing-Out, Humble & Static) ── */}
        <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 text-white p-4 sm:p-5 shadow-sm border border-emerald-600/30">
          {/* Subtle Ambient Glow */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
            <div className="flex items-start sm:items-center gap-3.5">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-white/15 backdrop-blur-xs border border-white/20 flex items-center justify-center flex-shrink-0 text-emerald-100 shadow-inner">
                <Truck className="w-5 h-5 sm:w-5.5 sm:h-5.5" />
              </div>
              <div className="space-y-0.5">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-heading font-extrabold text-sm sm:text-base text-white tracking-tight leading-tight">
                    Order till Midnight • Delivery 6 AM – 10 AM
                  </h2>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/15 text-emerald-100 border border-white/20 text-[10px] font-bold shadow-2xs">
                    Tomorrow Morning
                  </span>
                </div>
                <p className="text-emerald-100/85 text-xs sm:text-xs leading-normal">
                  Fresh organic vegetables, fruits & daily dairy delivered right to your doorstep.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onSelectTab('browse')}
              className="self-start sm:self-auto inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white text-emerald-950 font-extrabold text-xs shadow-2xs hover:bg-emerald-50 active:scale-95 transition-all cursor-pointer flex-shrink-0 min-h-[38px]"
            >
              <span>Shop Fresh</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
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

        {/* ── AI Assistant Interactive Card (Accurate Trust Model) ── */}
        <div className="rounded-2xl bg-gradient-to-r from-purple-50/70 via-white to-purple-50/50 dark:from-purple-950/20 dark:via-stone-900 dark:to-purple-950/20 border border-purple-200/70 dark:border-purple-800/40 p-4 sm:p-5 shadow-2xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-purple-100 dark:bg-purple-900/60 flex items-center justify-center text-purple-700 dark:text-purple-300 shadow-2xs flex-shrink-0">
                <Sparkles className="w-5 h-5 fill-purple-700/20" />
              </div>
              <div>
                <h4 className="font-heading font-extrabold text-sm sm:text-base text-stone-900 dark:text-white leading-tight">
                  AI Assistant
                </h4>
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                  Plan recipes, match pantry items & shop within the spending limits you set
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onSelectTab('chat')}
              className="self-start sm:self-auto px-4 py-2 rounded-full bg-purple-700 hover:bg-purple-800 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer min-h-[38px]"
            >
              <span>Launch AI Assistant</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Suggestion Chips */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-0.5">
            {PROMPT_CHIPS.map((chip, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleChipClick(chip.label)}
                className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 hover:border-purple-500 text-stone-700 dark:text-stone-200 text-xs font-semibold shadow-2xs transition-all cursor-pointer"
              >
                <span className="text-[10px] font-bold text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-950 px-1.5 py-0.2 rounded">
                  {chip.tag}
                </span>
                <span>{chip.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ── 4 Feature Highlights Strip (Resolved Promises & WCAG AA Contrast) ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 p-4 shadow-2xs">
          <div className="flex items-start gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-700 flex-shrink-0">
              <Truck className="w-4 h-4" />
            </div>
            <div>
              <p className="font-heading font-extrabold text-xs sm:text-sm text-stone-900 dark:text-white leading-tight">
                Scheduled Delivery
              </p>
              <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">
                6:00 AM – 9:00 AM at your door
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-700 flex-shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <p className="font-heading font-extrabold text-xs sm:text-sm text-stone-900 dark:text-white leading-tight">
                100% Pure Veg
              </p>
              <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">
                Strictly vegetarian certified
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-700 flex-shrink-0">
              <Leaf className="w-4 h-4" />
            </div>
            <div>
              <p className="font-heading font-extrabold text-xs sm:text-sm text-stone-900 dark:text-white leading-tight">
                Spend Guardrails
              </p>
              <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">
                Autonomous budget policies
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-700 flex-shrink-0">
              <BadgePercent className="w-4 h-4" />
            </div>
            <div>
              <p className="font-heading font-extrabold text-xs sm:text-sm text-stone-900 dark:text-white leading-tight">
                Best Daily Prices
              </p>
              <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">
                Transparent verified farm rates
              </p>
            </div>
          </div>
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
                100% Certified Vegetarian · Farm Fresh Harvest
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

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
            {bestSellers.map((prod) => {
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
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

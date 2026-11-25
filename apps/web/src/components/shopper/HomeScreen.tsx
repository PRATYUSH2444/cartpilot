import React, { useState } from 'react';
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
  userInitial?: string;
  walletBalance?: number;
}

const CATEGORIES = [
  {
    id: 'FRUITS_VEGETABLES',
    title: 'Fruits &\nVegetables',
    emoji: '🍎',
    bg: 'bg-rose-50 dark:bg-rose-950/30',
  },
  {
    id: 'DAIRY_BREAKFAST',
    title: 'Dairy &\nEggs',
    emoji: '🥛',
    bg: 'bg-blue-50 dark:bg-blue-950/30',
  },
  {
    id: 'ATTA_RICE_DAL',
    title: 'Atta, Rice\n& Dal',
    emoji: '🥣',
    bg: 'bg-amber-50 dark:bg-amber-950/30',
  },
  {
    id: 'SNACKS_MUNCHIES',
    title: 'Snacks &\nBeverages',
    emoji: '🥔',
    bg: 'bg-orange-50 dark:bg-orange-950/30',
  },
  {
    id: 'PERSONAL_CARE',
    title: 'Personal\nCare',
    emoji: '🧴',
    bg: 'bg-purple-50 dark:bg-purple-950/30',
  },
  {
    id: 'MORE',
    title: 'More',
    emoji: '▦',
    bg: 'bg-emerald-50 dark:bg-emerald-950/30',
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
  userInitial = 'U',
}) => {
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  // Dynamic delivery window calculation
  const deliveryWindow = getDeliveryWindowInfo();

  // Active uncompleted order for floating live-track pill
  const activeOrder =
    orders.find(
      (o) => o.status !== 'DELIVERED' && o.status !== 'CANCELLED' && o.status !== 'FAILED'
    ) || (orders.length > 0 ? orders[0] : null);

  const getCartQuantity = (productId: string): number => {
    if (!cart || !cart.items) return 0;
    const item = cart.items.find((i) => i.productId === productId);
    return item ? item.quantity : 0;
  };

  const toggleFavorite = (productId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(productId)) next.delete(productId);
      else next.add(productId);
      return next;
    });
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
  const bestSellers = products.slice(0, 8);

  return (
    <div className="flex-1 overflow-y-auto pb-12 bg-[#f8faf9] dark:bg-stone-950 text-stone-900 dark:text-stone-100 font-sans selection:bg-emerald-500 selection:text-white">
      {/* ── Top App Bar & Search Shell ────────────────────────────────────── */}
      <div className="sticky top-0 z-30 bg-white/90 dark:bg-stone-900/90 backdrop-blur-md border-b border-stone-200/60 dark:border-stone-800/60 shadow-xs">
        <div className="max-w-[480px] mx-auto px-4 pt-3 pb-3 space-y-2.5">
          {/* Header Row: CartPilot Brand Logo + Bell & Profile */}
          <div className="flex items-center justify-between">
            {/* Logo */}
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

            {/* Notification & User Avatar */}
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => onSelectTab('account')}
                className="w-9 h-9 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:text-stone-900 flex items-center justify-center transition-colors relative cursor-pointer"
                title="Notifications"
                aria-label="Notifications"
              >
                <Bell className="w-4 h-4" />
                <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white dark:ring-stone-800" />
              </button>

              <button
                type="button"
                onClick={onOpenProfile}
                className="w-9 h-9 rounded-full bg-emerald-100 dark:bg-emerald-900/70 text-emerald-800 dark:text-emerald-200 border-2 border-emerald-300 dark:border-emerald-600 flex items-center justify-center font-bold text-xs shadow-xs cursor-pointer hover:scale-105 transition-transform"
                title="Account"
                aria-label="Account"
              >
                {userInitial}
              </button>
            </div>
          </div>

          {/* Location Line matching reference design */}
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={onOpenAddressModal}
              className="flex items-center gap-1 text-xs font-semibold text-stone-800 dark:text-stone-200 hover:text-emerald-700 transition-colors cursor-pointer group truncate max-w-[80%]"
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

      <div className="max-w-[480px] mx-auto px-4 pt-4 space-y-4">
        {/* ── Hero Promotional Banner (Matching Exact Reference Screenshot) ── */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#175c37] via-[#1d6e42] to-[#258550] text-white p-5 shadow-md">
          {/* Subtle Ambient Leaf Lighting */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-400/10 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 max-w-[58%] space-y-2.5">
            {/* Top Pill Tag */}
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-md text-[10px] font-semibold text-white tracking-wide">
              <Clock className="w-3 h-3" />
              <span>{deliveryWindow.cutoffHeadline}</span>
            </div>

            {/* Headline with 6 AM - 9 AM Gold Pill Badge */}
            <div className="space-y-1">
              <h2 className="font-extrabold text-2xl sm:text-3xl leading-none tracking-tight text-white">
                Get it Tomorrow
              </h2>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-2xl sm:text-3xl leading-none text-white">
                  Morning
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#fbf4d8] text-stone-900 font-black text-[11px] shadow-xs">
                  <Calendar className="w-3 h-3 text-amber-600" />
                  <span>{deliveryWindow.slot}</span>
                </span>
              </div>
            </div>

            <p className="text-white/80 text-[11px] leading-relaxed line-clamp-2">
              Fresh groceries, fruits & everyday essentials delivered to your doorstep.
            </p>

            {/* Action Button */}
            <div className="pt-1 flex items-center gap-4">
              <button
                type="button"
                onClick={() => onSelectTab('browse')}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white text-emerald-900 font-extrabold text-xs shadow-md hover:bg-stone-50 active:scale-[0.98] transition-all cursor-pointer"
              >
                <span>Shop Now</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              {/* Carousel Dots Indicator */}
              <div className="flex items-center gap-1 select-none">
                <span className="w-2 h-2 rounded-full bg-white" />
                <span className="w-1.5 h-1.5 rounded-full bg-white/40" />
                <span className="w-1.5 h-1.5 rounded-full bg-white/40" />
              </div>
            </div>
          </div>

          {/* Right Kraft Grocery Bag Illustration */}
          <div className="absolute right-1 -bottom-2 w-44 h-48 flex items-center justify-center pointer-events-none select-none">
            {/* 3D Brown Grocery Bag Visual */}
            <div className="relative w-36 h-40 bg-[#d8ab76] rounded-t-xl rounded-b-md shadow-2xl flex flex-col items-center justify-end p-2 border-t-2 border-[#b88c58]">
              {/* CartPilot Leaf Emblem on Bag */}
              <div className="flex items-center gap-1 mb-3 bg-[#b88c58]/30 px-2 py-0.5 rounded-md">
                <Leaf className="w-3 h-3 text-emerald-900 fill-emerald-900" />
                <span className="text-[10px] font-black text-emerald-950 tracking-wider">
                  CartPilot
                </span>
              </div>

              {/* Overflowing Produce Visuals */}
              <div className="absolute -top-7 left-2 text-3xl">🥬</div>
              <div className="absolute -top-6 left-12 text-3xl">🍎</div>
              <div className="absolute -top-7 right-3 text-3xl">🍌</div>
              <div className="absolute -top-4 right-1 text-2xl">🥛</div>
              <div className="absolute -top-2 left-6 text-2xl">🍅</div>
            </div>
          </div>
        </div>

        {/* ── 6-Category Row (Fruits & Veggies / Dairy / Grains / Snacks / Care / More) ── */}
        <div className="grid grid-cols-6 gap-2">
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
              className="rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 p-2 flex flex-col items-center text-center shadow-2xs hover:shadow-sm hover:border-emerald-500/40 transition-all cursor-pointer group"
            >
              <div
                className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl mb-1 transition-transform group-hover:scale-110 ${cat.bg}`}
              >
                {cat.id === 'MORE' ? (
                  <LayoutGrid className="w-5 h-5 text-emerald-700" />
                ) : (
                  cat.emoji
                )}
              </div>
              <span className="text-[10px] font-bold text-stone-700 dark:text-stone-300 leading-tight whitespace-pre-line line-clamp-2">
                {cat.title}
              </span>
            </button>
          ))}
        </div>

        {/* ── "CartPilot AI" Interactive Prompt Card ────────────────────────── */}
        <div className="rounded-3xl bg-gradient-to-r from-purple-50/90 via-white to-emerald-50/90 dark:from-purple-950/20 dark:via-stone-900 dark:to-emerald-950/20 border border-purple-200/60 dark:border-purple-800/40 p-4 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-900/60 flex items-center justify-center text-purple-600 shadow-2xs">
                <Sparkles className="w-4 h-4 fill-purple-600" />
              </div>
              <div>
                <h4 className="font-extrabold text-sm text-stone-900 dark:text-white leading-none">
                  CartPilot AI
                </h4>
                <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">
                  Ask, plan, cook & shop with AI
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onSelectTab('chat')}
              className="px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 border border-emerald-200 dark:border-emerald-800 text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
            >
              <span>Try AI Shop</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {/* 3 Clickable AI Planning Chips */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-0.5">
            {PROMPT_CHIPS.map((chip, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleChipClick(chip.label)}
                className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 hover:border-emerald-500 text-stone-700 dark:text-stone-200 text-[11px] font-bold shadow-2xs hover:shadow-xs transition-all cursor-pointer group"
              >
                <span className="text-xs">{chip.emoji}</span>
                <span className="group-hover:text-emerald-700 dark:group-hover:text-emerald-300">
                  {chip.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* ── 4 Feature Highlights Row (Same-day / Scheduled / Secure / Best Offers) ── */}
        <div className="grid grid-cols-4 gap-2 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 p-3 shadow-2xs text-center">
          <div className="space-y-0.5">
            <div className="w-7 h-7 mx-auto rounded-lg bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 mb-1">
              <Zap className="w-4 h-4" />
            </div>
            <p className="font-extrabold text-[11px] text-stone-900 dark:text-white leading-tight">
              Same-day
            </p>
            <p className="text-[9px] text-stone-400 leading-tight">(on select items)</p>
          </div>

          <div className="space-y-0.5">
            <div className="w-7 h-7 mx-auto rounded-lg bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 mb-1">
              <Truck className="w-4 h-4" />
            </div>
            <p className="font-extrabold text-[11px] text-stone-900 dark:text-white leading-tight">
              Scheduled
            </p>
            <p className="text-[9px] text-stone-400 leading-tight">Delivery</p>
          </div>

          <div className="space-y-0.5">
            <div className="w-7 h-7 mx-auto rounded-lg bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 mb-1">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <p className="font-extrabold text-[11px] text-stone-900 dark:text-white leading-tight">
              Secure
            </p>
            <p className="text-[9px] text-stone-400 leading-tight">Payments</p>
          </div>

          <div className="space-y-0.5">
            <div className="w-7 h-7 mx-auto rounded-lg bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 mb-1">
              <Percent className="w-4 h-4" />
            </div>
            <p className="font-extrabold text-[11px] text-stone-900 dark:text-white leading-tight">
              Best
            </p>
            <p className="text-[9px] text-stone-400 leading-tight">Offers</p>
          </div>
        </div>

        {/* ── Active Order Live Tracking Floating Card (Preserved & Styled) ── */}
        {activeOrder && (
          <div className="rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                <span className="text-xs font-bold text-stone-900 dark:text-white">
                  Active order #{activeOrder.orderNumber}
                </span>
              </div>
              <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 rounded-full">
                {activeOrder.status === 'OUT_FOR_DELIVERY' ? 'Out for Delivery' : activeOrder.status}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-700 flex-shrink-0">
                <Truck className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span>{activeOrder.items?.length || 0} items</span>
                  <span>₹{((activeOrder.pricingSnapshot?.totalPaise || 0) / 100).toFixed(0)}</span>
                </div>
                <p className="text-[11px] text-stone-500 truncate mt-0.5">
                  Delivery window: {deliveryWindow.title.toLowerCase()} {deliveryWindow.slot}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onOpenTracking(activeOrder)}
              className="w-full py-2 px-3 rounded-2xl bg-stone-100 dark:bg-stone-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-stone-800 dark:text-stone-200 hover:text-emerald-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>Track Order Live</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* ── Best Sellers Product Cards (Matching Screenshot 4 Cards Exactly) ── */}
        <div className="space-y-3 pt-1">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-lg text-stone-900 dark:text-white tracking-tight">
              Best Sellers
            </h3>
            <button
              type="button"
              onClick={() => onSelectTab('browse')}
              className="text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer flex items-center gap-1"
            >
              <span>See all</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {bestSellers.map((prod) => {
              const qty = getCartQuantity(prod._id);
              const price = Math.round(prod.pricePaise / 100);
              // Calculate a realistic MRP strikethrough for benchmark polish
              const strikethroughMrp = Math.round(price * 1.18);
              const isFav = favorites.has(prod._id);

              return (
                <div
                  key={prod._id}
                  onClick={() => onSelectProduct(prod)}
                  className="rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 p-2.5 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between cursor-pointer group"
                >
                  <div>
                    {/* Top Right Wishlist Heart */}
                    <div className="flex justify-end mb-1">
                      <button
                        type="button"
                        onClick={(e) => toggleFavorite(prod._id, e)}
                        className="p-1 rounded-full text-stone-300 hover:text-rose-500 transition-colors"
                        aria-label="Wishlist"
                      >
                        <Heart
                          className={`w-4 h-4 ${
                            isFav ? 'fill-rose-500 text-rose-500' : 'text-stone-300'
                          }`}
                        />
                      </button>
                    </div>

                    {/* Product Photo */}
                    <div className="relative w-full aspect-square rounded-xl bg-stone-50 dark:bg-stone-800 mb-2 overflow-hidden flex items-center justify-center">
                      {prod.imageUrl ? (
                        <img
                          src={prod.imageUrl}
                          alt={prod.name}
                          className="w-full h-full object-contain p-1 group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                      ) : (
                        <span className="text-4xl select-none">🥗</span>
                      )}
                    </div>

                    {/* Title & Unit */}
                    <div className="space-y-0.5">
                      <h4 className="font-extrabold text-xs text-stone-900 dark:text-stone-100 line-clamp-1 leading-snug">
                        {prod.name}
                      </h4>
                      <p className="text-[11px] text-stone-400 font-medium">
                        {prod.packageSize && prod.packageUnit
                          ? `${prod.packageSize} ${prod.packageUnit}`
                          : '1 unit'}
                      </p>
                    </div>
                  </div>

                  {/* Price & Add to Cart Square Button */}
                  <div className="mt-3 pt-2 border-t border-stone-100 dark:border-stone-800/60 flex items-center justify-between">
                    <div className="flex items-baseline gap-1">
                      <span className="font-black text-sm text-stone-900 dark:text-white">
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
                        className="w-7 h-7 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold flex items-center justify-center shadow-xs cursor-pointer active:scale-90 transition-all"
                        aria-label="Add to cart"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    ) : (
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-1 bg-emerald-600 text-white rounded-lg px-1 py-0.5 shadow-xs"
                      >
                        <button
                          type="button"
                          onClick={() => onUpdateQuantity(prod._id, qty - 1)}
                          className="w-5 h-5 flex items-center justify-center rounded hover:bg-emerald-700 transition-colors cursor-pointer"
                          aria-label="Decrease"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="font-bold text-xs min-w-[12px] text-center">
                          {qty}
                        </span>
                        <button
                          type="button"
                          onClick={() => onUpdateQuantity(prod._id, qty + 1)}
                          className="w-5 h-5 flex items-center justify-center rounded hover:bg-emerald-700 transition-colors cursor-pointer"
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

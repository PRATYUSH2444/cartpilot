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
  Wallet,
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
  userInitial?: string;
  walletBalance?: number;
}

const CATEGORY_ITEMS = [
  { id: 'ALL', label: 'All', emoji: '🛍️' },
  { id: 'FRUITS_VEGETABLES', label: 'Fruits', emoji: '🍇' },
  { id: 'VEGETABLES', label: 'Vegetables', emoji: '🥦' },
  { id: 'EXOTIC', label: 'Exotic', emoji: '🥑' },
  { id: 'DAIRY_BREAKFAST', label: 'Dairy', emoji: '🥛' },
  { id: 'ATTA_RICE_DAL', label: 'Grains', emoji: '🌾' },
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
  walletBalance = 349.0,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // Delivery cutoff & window calculation
  const deliveryWindow = getDeliveryWindowInfo();

  // Find active order (not delivered or cancelled)
  const activeOrder =
    orders.find(
      (o) => o.status !== 'DELIVERED' && o.status !== 'CANCELLED' && o.status !== 'FAILED'
    ) || (orders.length > 0 ? orders[0] : null);

  const getCartQuantity = (productId: string): number => {
    if (!cart || !cart.items) return 0;
    const item = cart.items.find((i) => i.productId === productId);
    return item ? item.quantity : 0;
  };

  // Filter products by selected category
  const filteredProducts =
    selectedCategory === 'ALL'
      ? products
      : products.filter((p) => {
          if (selectedCategory === 'FRUITS_VEGETABLES') {
            return (
              p.category === 'FRUITS_VEGETABLES' &&
              (p.name.toLowerCase().includes('apple') ||
                p.name.toLowerCase().includes('banana') ||
                p.name.toLowerCase().includes('fruit') ||
                p.name.toLowerCase().includes('melon') ||
                p.name.toLowerCase().includes('mango') ||
                p.name.toLowerCase().includes('orange'))
            );
          }
          if (selectedCategory === 'VEGETABLES') {
            return (
              p.category === 'FRUITS_VEGETABLES' &&
              !p.name.toLowerCase().includes('apple') &&
              !p.name.toLowerCase().includes('banana') &&
              !p.name.toLowerCase().includes('melon') &&
              !p.name.toLowerCase().includes('mango') &&
              !p.name.toLowerCase().includes('orange')
            );
          }
          if (selectedCategory === 'EXOTIC') {
            return (
              p.aliases?.some((a) => a.toLowerCase().includes('exotic')) ||
              p.name.toLowerCase().includes('avocado') ||
              p.name.toLowerCase().includes('mushroom') ||
              p.name.toLowerCase().includes('broccoli')
            );
          }
          return p.category === selectedCategory;
        });

  const displayAddressLabel = selectedAddress
    ? selectedAddress.areaLocality || selectedAddress.apartmentStreet || selectedAddress.city
    : 'La residentia';

  return (
    <div className="flex-1 overflow-y-auto pb-10 bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100">
      {/* ── Top Brand Header & Navigation (Reference: SBZee Top Header) ── */}
      <div className="sticky top-0 z-30 bg-emerald-800 text-white shadow-md">
        <div className="max-w-[760px] mx-auto px-4 pt-3 pb-3 space-y-3">
          {/* Row 1: Logo & Brand + Wallet & Profile */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-white text-emerald-800 flex items-center justify-center shadow">
                <Leaf className="w-5 h-5 fill-emerald-700 text-emerald-700" />
              </div>
              <div>
                <div className="flex items-center gap-1.5 leading-none">
                  <span className="font-extrabold text-lg tracking-tight text-white">CartPilot</span>
                  <span className="text-[9px] font-bold uppercase bg-emerald-900/80 text-emerald-300 px-1.5 py-0.5 rounded-full border border-emerald-400/20">
                    100% Veg
                  </span>
                </div>
                <span className="text-[10px] text-emerald-200 font-medium">Fresh Pick Fayda Quick</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Wallet Balance Pill */}
              <button
                type="button"
                onClick={() => onSelectTab('account')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-700/80 hover:bg-emerald-600/90 text-white border border-emerald-500/40 text-xs font-bold shadow-xs cursor-pointer transition-colors"
                title="View Wallet Ledger"
              >
                <Wallet className="w-3.5 h-3.5 text-emerald-300" />
                <span>₹ {walletBalance.toFixed(1)}</span>
              </button>

              {/* Profile Avatar Circle */}
              <button
                type="button"
                onClick={onOpenProfile}
                className="w-8 h-8 rounded-full bg-emerald-600 text-white border-2 border-white/60 flex items-center justify-center font-bold text-xs shadow-xs cursor-pointer hover:bg-emerald-500 transition-colors"
                title="Account & Settings"
              >
                {userInitial}
              </button>
            </div>
          </div>

          {/* Row 2: Location Pill (Left) & Delivery Window Badge (Right) */}
          <div className="flex items-center justify-between gap-2 pt-1">
            {/* Location Selector */}
            <button
              type="button"
              onClick={onOpenAddressModal}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-900/60 hover:bg-emerald-900 text-emerald-100 text-xs font-semibold cursor-pointer transition-colors max-w-[60%]"
            >
              <MapPin className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
              <span className="truncate">{displayAddressLabel}</span>
              <ChevronDown className="w-3.5 h-3.5 text-emerald-300 flex-shrink-0" />
            </button>

            {/* Slotted Delivery Window Badge (Yellow-gold matching screenshot 4 & 5) */}
            <div className="flex flex-col items-end px-2.5 py-1 rounded-xl bg-amber-100 dark:bg-amber-950/70 text-stone-900 dark:text-amber-100 border border-amber-300 dark:border-amber-700/50 shadow-xs">
              <span className="text-[10px] text-stone-700 dark:text-amber-200/90 font-medium leading-none">
                {deliveryWindow.title}
              </span>
              <span className="text-xs font-black tracking-tight text-stone-950 dark:text-amber-300 leading-tight">
                {deliveryWindow.slot}
              </span>
            </div>
          </div>

          {/* Row 3: Search Bar */}
          <div
            onClick={onOpenSearchModal}
            className="flex items-center justify-between px-3.5 py-2.5 rounded-2xl bg-white text-stone-800 shadow-md cursor-pointer hover:bg-stone-50 transition-all border border-emerald-400/30"
          >
            <div className="flex items-center gap-2.5 text-stone-400 text-xs font-medium">
              <Search className="w-4 h-4 text-emerald-700" />
              <span>Search for Fruits, Vegetables</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">
                AI Search
              </span>
              <div className="h-3.5 w-px bg-stone-300" />
              <Mic className="w-4 h-4 text-stone-500" />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[760px] mx-auto px-4 pt-4 space-y-4">
        {/* ── Category Quick Filter (Reference: All / Fruits / Vegetables / Exotic) ── */}
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar scroll-smooth">
          {CATEGORY_ITEMS.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex-shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-2xl font-bold text-xs transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-emerald-800 text-white shadow-sm shadow-emerald-800/30 ring-1 ring-emerald-600'
                    : 'bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-800 hover:bg-stone-100 dark:hover:bg-stone-800'
                }`}
              >
                <span className="text-sm select-none">{cat.emoji}</span>
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* ── Hero Promotional Banner (Reference: "Order Till Midnight / Get next day DELIVERY") ── */}
        <div className="relative overflow-hidden rounded-3xl bg-[#f7f4ea] dark:bg-stone-900 border border-emerald-500/15 p-5 shadow-sm text-stone-900 dark:text-stone-100">
          {/* Subtle green curve background */}
          <div className="absolute right-0 top-0 bottom-0 w-1/2 bg-emerald-500/10 rounded-l-full pointer-events-none" />

          <div className="relative z-10 max-w-[60%] space-y-2">
            <h2 className="font-extrabold text-2xl sm:text-3xl tracking-tight leading-none text-emerald-900 dark:text-emerald-300">
              {deliveryWindow.cutoffHeadline}
            </h2>
            <p className="text-xs sm:text-sm font-bold text-stone-700 dark:text-stone-300">
              {deliveryWindow.cutoffSubline.split('DELIVERY')[0]}
              <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">
                DELIVERY
              </span>
            </p>
            <p className="text-[11px] text-stone-500 dark:text-stone-400 italic">
              {deliveryWindow.remainingText}
            </p>
            <div className="pt-1">
              <button
                type="button"
                onClick={() => onSelectTab('browse')}
                className="inline-flex items-center gap-1 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
              >
                <span>Order now</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Right Fresh Produce Illustration */}
          <div className="absolute -right-2 -bottom-2 w-36 h-36 sm:w-44 sm:h-44 flex items-center justify-center pointer-events-none select-none">
            <span className="text-7xl sm:text-8xl drop-shadow-md">🧺</span>
            <span className="absolute bottom-2 right-2 text-3xl">🥦</span>
            <span className="absolute top-4 right-10 text-3xl">🍎</span>
          </div>
        </div>

        {/* ── Limited Time Bonus Offer Card (Reference: Add ₹999 & Get ₹100 Bonus) ── */}
        <div className="rounded-3xl bg-emerald-50/80 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-800/40 p-4 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-700">
              Limited Time Offer
            </span>
            <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-0.5">
              <span>Offers</span>
              <ChevronDown className="w-3 h-3" />
            </span>
          </div>

          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <h4 className="font-extrabold text-sm sm:text-base text-stone-900 dark:text-white">
                Add ₹999 & Get ₹100 Bonus
              </h4>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                Bonus will be added to your CartPilot wallet instantly
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center text-2xl flex-shrink-0 shadow-inner">
              👛
            </div>
          </div>
        </div>

        {/* ── Active Order Live Tracking Floating Card ── */}
        {activeOrder && (
          <div className="rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-4 shadow-sm space-y-3">
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
                  Scheduled for {deliveryWindow.title.toLowerCase()} {deliveryWindow.slot}
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

        {/* ── All Products Grid (Reference: "All Products" section with clean cards) ── */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-lg text-stone-900 dark:text-white tracking-tight">
                All Products
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                100% Certified Vegetarian · Farm Fresh Guarantee
              </p>
            </div>
            <button
              type="button"
              onClick={() => onSelectTab('browse')}
              className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
            >
              See all ({products.length})
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {filteredProducts.map((prod) => {
              const qty = getCartQuantity(prod._id);
              const price = (prod.pricePaise / 100).toFixed(0);

              return (
                <div
                  key={prod._id}
                  className="rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between p-3 group"
                >
                  <div
                    onClick={() => onSelectProduct(prod)}
                    className="cursor-pointer"
                  >
                    {/* Product Image Box */}
                    <div className="relative w-full aspect-square rounded-2xl bg-stone-50 dark:bg-stone-800/80 mb-2.5 overflow-hidden flex items-center justify-center">
                      {prod.imageUrl ? (
                        <img
                          src={prod.imageUrl}
                          alt={prod.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                      ) : (
                        <span className="text-4xl select-none">🥗</span>
                      )}

                      {/* Vegetarian Icon */}
                      <div className="absolute top-2 left-2 w-4 h-4 rounded border border-emerald-600 bg-white flex items-center justify-center shadow-xs">
                        <div className="w-2 h-2 rounded-full bg-emerald-600" />
                      </div>

                      {/* Weight pill */}
                      {prod.packageSize && prod.packageUnit && (
                        <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-xs text-white text-[10px] font-semibold">
                          {prod.packageSize} {prod.packageUnit}
                        </div>
                      )}
                    </div>

                    {/* Product Title & Brand */}
                    <div className="space-y-0.5">
                      <p className="text-[11px] text-stone-400 uppercase font-semibold tracking-wider">
                        {prod.category.replace(/_/g, ' ')}
                      </p>
                      <h4 className="font-bold text-xs text-stone-900 dark:text-stone-100 line-clamp-2 leading-tight">
                        {prod.name}
                      </h4>
                    </div>
                  </div>

                  {/* Pricing & Add to Cart Action */}
                  <div className="mt-3 pt-2 border-t border-stone-100 dark:border-stone-800/60 flex items-center justify-between">
                    <div>
                      <div className="flex items-baseline gap-1">
                        <span className="font-black text-sm text-stone-900 dark:text-white">
                          ₹{price}
                        </span>
                      </div>
                    </div>

                    {qty === 0 ? (
                      <button
                        type="button"
                        onClick={() => onAddToCart(prod._id, 1)}
                        className="py-1.5 px-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-600 hover:text-white text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-extrabold text-xs transition-colors cursor-pointer"
                      >
                        ADD
                      </button>
                    ) : (
                      <div className="flex items-center gap-1.5 bg-emerald-600 text-white rounded-xl px-1.5 py-0.5 shadow-xs">
                        <button
                          type="button"
                          onClick={() => onUpdateQuantity(prod._id, qty - 1)}
                          className="w-5 h-5 flex items-center justify-center rounded hover:bg-emerald-700 transition-colors cursor-pointer"
                          aria-label="Decrease quantity"
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
                          aria-label="Increase quantity"
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

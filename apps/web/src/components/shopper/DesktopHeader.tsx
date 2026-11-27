import React, { useState } from 'react';
import {
  Leaf,
  MapPin,
  ChevronDown,
  Search,
  Sparkles,
  Heart,
  Wallet,
  ShoppingBag,
  Bell,
  Sun,
  Moon,
  User,
  Shield,
  LogOut,
  Package,
} from 'lucide-react';
import { TabKey } from './BottomTabBar';
import { CartData, UserAddress } from '../../types';

interface DesktopHeaderProps {
  activeTab: TabKey;
  onSelectTab: (tab: TabKey, categoryId?: string) => void;
  cart: CartData | null;
  selectedAddress: UserAddress | null;
  onOpenAddressModal: () => void;
  onOpenSearchModal: () => void;
  onOpenWishlist: () => void;
  onOpenWallet: () => void;
  onOpenNotifications: () => void;
  onOpenRules: () => void;
  onOpenOrders: () => void;
  onOpenProfile: () => void;
  onLogout: () => void;
  userInitial?: string;
  userName?: string;
  walletBalance?: number;
  favoritesCount?: number;
  isDark: boolean;
  onToggleTheme: () => void;
}

export const DesktopHeader: React.FC<DesktopHeaderProps> = ({
  activeTab,
  onSelectTab,
  cart,
  selectedAddress,
  onOpenAddressModal,
  onOpenSearchModal,
  onOpenWishlist,
  onOpenWallet,
  onOpenNotifications,
  onOpenRules,
  onOpenOrders,
  onOpenProfile,
  onLogout,
  userInitial = 'U',
  userName = 'Customer',
  walletBalance = 349,
  favoritesCount = 0,
  isDark,
  onToggleTheme,
}) => {
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  const cartCount = cart?.items?.reduce((sum, item) => sum + item.quantity, 0) ?? (cart?.itemCount || 0);
  const addressTypeLabel = selectedAddress?.addressType || 'Delivery to';
  const addressLocalityLabel = selectedAddress
    ? selectedAddress.areaLocality || selectedAddress.apartmentStreet || selectedAddress.city
    : 'Select Location';

  // Format currency with standard INR formatting without stray decimals
  const formattedWallet = new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 0,
  }).format(Math.round(walletBalance));

  return (
    <header className="hidden lg:block sticky top-0 z-40 bg-white/95 dark:bg-stone-900/95 backdrop-blur-md border-b border-stone-200/80 dark:border-stone-800 shadow-2xs">
      <div className="page-container h-16 lg:h-18 flex items-center justify-between gap-3 lg:gap-4 xl:gap-6">
        {/* ── Left: Brand Identity & Location Chip ── */}
        <div className="flex items-center gap-3 xl:gap-5 flex-shrink-0">
          {/* Logo */}
          <button
            type="button"
            onClick={() => onSelectTab('home')}
            className="flex items-center gap-2.5 cursor-pointer text-left group"
            aria-label="CartPilot Home"
          >
            <div className="w-9 h-9 lg:w-10 lg:h-10 rounded-xl bg-emerald-700 flex items-center justify-center text-white shadow-xs group-hover:scale-105 transition-transform flex-shrink-0">
              <Leaf className="w-5 h-5 fill-white" />
            </div>
            <div className="flex items-center gap-1.5 leading-none">
              <span className="font-heading font-extrabold text-xl lg:text-2xl text-stone-900 dark:text-white tracking-tight">
                CartPilot
              </span>
            </div>
          </button>

          {/* Location Selector Pill */}
          <button
            type="button"
            data-tour="delivery-location"
            onClick={onOpenAddressModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-stone-100 dark:bg-stone-800 hover:bg-stone-200/80 dark:hover:bg-stone-700 border border-stone-200 dark:border-stone-700 text-xs font-semibold text-stone-800 dark:text-stone-200 transition-colors cursor-pointer max-w-[220px] xl:max-w-[280px]"
            title="Change Delivery Location"
          >
            <MapPin className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400 flex-shrink-0" />
            <div className="truncate text-left text-xs">
              <span className="font-bold text-stone-900 dark:text-white mr-1 capitalize">
                {addressTypeLabel}:
              </span>
              <span className="text-stone-500 dark:text-stone-400 truncate">
                {addressLocalityLabel}
              </span>
            </div>
            <ChevronDown className="w-3 h-3 text-stone-400 flex-shrink-0 ml-auto" />
          </button>
        </div>

        {/* ── Center: Clean Search Bar + Dedicated Standalone AI Assistant Button ── */}
        <div className="flex-1 max-w-2xl min-w-0 flex items-center gap-2">
          {/* Search Input Box */}
          <div
            data-tour="search"
            onClick={onOpenSearchModal}
            className="flex-1 min-w-0 flex items-center gap-2 px-3.5 h-10 rounded-full bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 hover:border-emerald-500/50 shadow-2xs cursor-pointer transition-all"
            role="search"
            title="Search groceries"
          >
            <Search className="w-4 h-4 text-stone-400 flex-shrink-0" />
            <span className="text-xs lg:text-sm text-stone-400 truncate select-none">
              Search fresh vegetables, fruits, dairy, staples...
            </span>
          </div>

          {/* Dedicated Standalone AI Assistant Button (Distinct, never overlapping search) */}
          <button
            type="button"
            data-tour="ai-assistant"
            onClick={() => onSelectTab('chat')}
            className={`h-10 px-3.5 rounded-full text-xs lg:text-sm font-bold flex items-center gap-1.5 shadow-xs whitespace-nowrap flex-shrink-0 cursor-pointer active:scale-95 transition-all ${
              activeTab === 'chat'
                ? 'bg-purple-700 text-white shadow-purple-700/20'
                : 'bg-purple-100 hover:bg-purple-200/90 text-purple-900 dark:bg-purple-950/70 dark:text-purple-200 dark:hover:bg-purple-900 border border-purple-200 dark:border-purple-800'
            }`}
            title="Open AI Assistant for intelligent meal planning and autonomous cart generation"
          >
            <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400 flex-shrink-0" />
            <span>AI Assistant</span>
          </button>
        </div>

        {/* ── Right: Priority-Collapsed Actions (Never overflows viewport) ── */}
        <div className="flex items-center gap-2 xl:gap-3 flex-shrink-0">
          {/* Quick Nav Links Segmented Toggle (Desktop View) with Smooth Sliding & Color Fill Animation */}
          <nav
            role="tablist"
            aria-label="Store navigation"
            className="hidden lg:relative lg:inline-flex items-center p-1 rounded-full bg-stone-100 dark:bg-stone-800/80 border border-stone-200/90 dark:border-stone-700/70 shadow-2xs select-none"
          >
            {/* Sliding Pill Active Backdrop */}
            <span
              aria-hidden="true"
              className={`absolute top-1 bottom-1 left-1 w-20 rounded-full bg-[#0a5c36] shadow-sm shadow-[#0a5c36]/25 pointer-events-none transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                activeTab === 'home'
                  ? 'translate-x-0 opacity-100 scale-100'
                  : activeTab === 'browse'
                  ? 'translate-x-full opacity-100 scale-100'
                  : 'opacity-0 scale-90'
              }`}
            />

            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'home'}
              onClick={() => onSelectTab('home')}
              className={`relative z-10 w-20 py-1.5 rounded-full text-xs text-center transition-colors duration-300 cursor-pointer select-none active:scale-95 ${
                activeTab === 'home'
                  ? 'text-white font-extrabold'
                  : 'text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white font-semibold'
              }`}
            >
              Home
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'browse'}
              onClick={() => onSelectTab('browse')}
              className={`relative z-10 w-20 py-1.5 rounded-full text-xs text-center transition-colors duration-300 cursor-pointer select-none active:scale-95 ${
                activeTab === 'browse'
                  ? 'text-white font-extrabold'
                  : 'text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white font-semibold'
              }`}
            >
              Browse
            </button>
          </nav>

          {/* Wishlist Button (Visible on xl: 1280px+) */}
          <button
            type="button"
            onClick={onOpenWishlist}
            className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 text-xs font-bold transition-colors cursor-pointer relative"
            title="Wishlist & Favorites"
          >
            <Heart
              className={`w-4 h-4 ${
                favoritesCount > 0
                  ? 'fill-rose-500 text-rose-500'
                  : 'text-stone-500 dark:text-stone-400'
              }`}
            />
            <span>Wishlist</span>
            {favoritesCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-mono font-bold flex items-center justify-center">
                {favoritesCount > 99 ? '99+' : favoritesCount}
              </span>
            )}
          </button>

          {/* Wallet Balance Chip (Always visible on Desktop) */}
          <button
            type="button"
            data-tour="wallet"
            onClick={onOpenWallet}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-extrabold transition-colors cursor-pointer whitespace-nowrap"
            title={`CartPilot Wallet Balance: ₹${formattedWallet}`}
          >
            <Wallet className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400 flex-shrink-0" />
            <span>Wallet: ₹{formattedWallet}</span>
          </button>

          {/* Cart Button with Count Badge (Always visible on Desktop) */}
          <button
            type="button"
            data-tour="cart"
            onClick={() => onSelectTab('cart')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer relative whitespace-nowrap ${
              activeTab === 'cart'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-stone-900 text-white hover:bg-stone-800 dark:bg-white dark:text-stone-900'
            }`}
            title="View Cart"
          >
            <ShoppingBag className="w-4 h-4 flex-shrink-0" />
            <span className="hidden sm:inline">Cart</span>
            {cartCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-emerald-500 text-white text-[10px] font-mono font-bold min-w-[16px] text-center">
                {cartCount > 99 ? '99+' : cartCount}
              </span>
            )}
          </button>

          {/* Notifications Bell (Visible on 2xl: 1440px+) */}
          <button
            type="button"
            onClick={onOpenNotifications}
            className="hidden 2xl:flex w-9 h-9 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white items-center justify-center transition-colors relative cursor-pointer"
            title="Notifications"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white dark:ring-stone-800" />
          </button>

          {/* Theme Toggle (Visible on 2xl: 1440px+) */}
          <button
            type="button"
            onClick={onToggleTheme}
            className="hidden 2xl:flex w-9 h-9 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white items-center justify-center transition-colors cursor-pointer"
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label="Toggle theme"
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* User Profile Avatar with Comprehensive Dropdown */}
          <div className="relative">
            <button
              type="button"
              data-tour="account"
              onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
              className="w-9 h-9 rounded-full bg-emerald-700 text-white font-extrabold text-xs flex items-center justify-center shadow-2xs cursor-pointer hover:ring-2 hover:ring-emerald-500/40 transition-all"
              title={userName}
              aria-label="Open profile menu"
            >
              {userInitial}
            </button>

            {isProfileMenuOpen && (
              <div
                onMouseLeave={() => setIsProfileMenuOpen(false)}
                className="absolute right-0 top-12 w-64 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xl py-2 z-50 text-xs animate-in fade-in zoom-in-95 duration-150"
              >
                <div className="px-4 py-2.5 border-b border-stone-100 dark:border-stone-800">
                  <p className="font-extrabold text-stone-900 dark:text-white truncate text-sm">
                    {userName}
                  </p>
                  <p className="text-[11px] text-stone-400">Customer Account</p>
                </div>

                <div className="py-1">
                  <button
                    type="button"
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      onOpenProfile();
                    }}
                    className="w-full px-4 py-2 flex items-center gap-2.5 text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 font-medium cursor-pointer"
                  >
                    <User className="w-4 h-4 text-stone-400" />
                    <span>My Profile & Settings</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      onOpenOrders();
                    }}
                    className="w-full px-4 py-2 flex items-center gap-2.5 text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 font-medium cursor-pointer"
                  >
                    <Package className="w-4 h-4 text-stone-400" />
                    <span>Order History</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      onOpenWishlist();
                    }}
                    className="w-full px-4 py-2 flex items-center justify-between text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 font-medium cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <Heart className="w-4 h-4 text-rose-500" />
                      <span>Wishlist & Favorites</span>
                    </div>
                    {favoritesCount > 0 && (
                      <span className="text-[10px] font-bold text-rose-600 bg-rose-50 dark:bg-rose-950 px-2 py-0.5 rounded-full">
                        {favoritesCount}
                      </span>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      onOpenRules();
                    }}
                    className="w-full px-4 py-2 flex items-center gap-2.5 text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 font-medium cursor-pointer"
                  >
                    <Shield className="w-4 h-4 text-purple-600" />
                    <span>Spending Mandates</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      onOpenNotifications();
                    }}
                    className="w-full px-4 py-2 flex items-center gap-2.5 text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 font-medium cursor-pointer"
                  >
                    <Bell className="w-4 h-4 text-amber-600" />
                    <span>Notifications Center</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      onToggleTheme();
                    }}
                    className="w-full px-4 py-2 flex items-center justify-between text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 font-medium cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      {isDark ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-stone-400" />}
                      <span>{isDark ? 'Light Theme' : 'Dark Theme'}</span>
                    </div>
                    <span className="text-[10px] text-stone-400">Toggle</span>
                  </button>
                </div>

                <div className="pt-1 border-t border-stone-100 dark:border-stone-800">
                  <button
                    type="button"
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      onLogout();
                    }}
                    className="w-full px-4 py-2 flex items-center gap-2.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 font-bold cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

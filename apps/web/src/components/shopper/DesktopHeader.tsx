import React, { useState, useRef, useEffect } from 'react';
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
  unreadNotificationsCount?: number;
  onOpenRules: () => void;
  onOpenOrders: () => void;
  onOpenProfile: () => void;
  onLogout: () => void;
  userInitial?: string;
  userName?: string;
  avatarUrl?: string;
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
  unreadNotificationsCount = 0,
  onOpenRules,
  onOpenOrders,
  onOpenProfile,
  onLogout,
  userInitial = 'U',
  userName = 'Customer',
  avatarUrl = '',
  walletBalance = 0,
  favoritesCount = 0,
  isDark,
  onToggleTheme,
}) => {
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  // Close profile dropdown on click outside or Escape key
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsProfileMenuOpen(false);
      }
    };

    if (isProfileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isProfileMenuOpen]);

  const cartCount = cart?.items?.reduce((sum, item) => sum + item.quantity, 0) ?? (cart?.itemCount || 0);
  const addressTypeLabel = selectedAddress?.addressType || 'Delivery to';
  const addressLocalityLabel = selectedAddress
    ? `${selectedAddress.areaLocality || selectedAddress.apartmentStreet || selectedAddress.city || 'Delivery Point'}${selectedAddress.city ? ', ' + selectedAddress.city : ''}`
    : 'Select Delivery Location';

  // Format currency with standard INR formatting without stray decimals
  const formattedWallet = new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 0,
  }).format(Math.round(walletBalance));

  return (
    <header className="hidden lg:block shrink-0 sticky top-0 z-40 bg-white/95 dark:bg-stone-900/95 backdrop-blur-md border-b border-stone-200/80 dark:border-stone-800 shadow-2xs transition-colors duration-200">
      <div className="page-container h-16 lg:h-18 flex items-center justify-between gap-3 lg:gap-4 xl:gap-5">
        {/* ── Left: Brand Identity & Location Chip ── */}
        <div className="flex items-center gap-3 xl:gap-4 flex-shrink-0">
          {/* Logo */}
          <button
            type="button"
            onClick={() => onSelectTab('home')}
            className="flex items-center gap-2.5 cursor-pointer text-left group select-none"
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

          {/* Location Selector Pill (Blinkit / Zepto Quick Commerce Style) */}
          <button
            type="button"
            data-tour="delivery-location"
            onClick={onOpenAddressModal}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-stone-100 dark:bg-stone-850 hover:bg-stone-200/80 dark:hover:bg-stone-800 border border-stone-200 dark:border-stone-750 text-xs font-semibold text-stone-800 dark:text-stone-200 transition-all cursor-pointer max-w-[190px] xl:max-w-[260px] 2xl:max-w-[300px] shadow-2xs"
            title="Change Delivery Location"
          >
            <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-emerald-700 dark:text-emerald-400 flex-shrink-0">
              <MapPin className="w-3.5 h-3.5" />
            </div>
            <div className="truncate text-left text-xs min-w-0">
              <div className="flex items-center gap-1.5 leading-tight">
                <span className="font-extrabold text-stone-900 dark:text-white capitalize text-[11px]">
                  {addressTypeLabel}:
                </span>
                <span className="text-emerald-700 dark:text-emerald-400 font-bold text-[10px] tracking-tight">
                  Next-Day Slot
                </span>
              </div>
              <p className="text-stone-500 dark:text-stone-400 truncate text-[11px] font-medium leading-tight">
                {addressLocalityLabel}
              </p>
            </div>
            <ChevronDown className="w-3 h-3 text-stone-400 flex-shrink-0 ml-auto" />
          </button>
        </div>

        {/* ── Center: Clean Search Bar + Dedicated Standalone AI Assistant Button ── */}
        <div className="flex-1 max-w-xl xl:max-w-2xl min-w-0 flex items-center gap-2">
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

        {/* ── Right: Balanced, Consistent Action Controls (No disappearing loose icons) ── */}
        <div className="flex items-center gap-2 xl:gap-2.5 flex-shrink-0">
          {/* Quick Nav Links Segmented Toggle */}
          <nav
            role="tablist"
            aria-label="Store navigation"
            className="relative inline-flex items-center p-1 rounded-full bg-stone-100 dark:bg-stone-800/80 border border-stone-200/90 dark:border-stone-700/70 shadow-2xs select-none"
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

          {/* Wishlist Button */}
          <button
            type="button"
            onClick={onOpenWishlist}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 text-xs font-bold transition-colors cursor-pointer relative"
            title="Wishlist & Favorites"
          >
            <Heart
              className={`w-4 h-4 ${
                favoritesCount > 0
                  ? 'fill-rose-500 text-rose-500'
                  : 'text-stone-500 dark:text-stone-400'
              }`}
            />
            <span className="hidden xl:inline">Wishlist</span>
            {favoritesCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-mono font-bold flex items-center justify-center">
                {favoritesCount > 99 ? '99+' : favoritesCount}
              </span>
            )}
          </button>

          {/* Wallet Balance Chip */}
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

          {/* Cart Button with Count Badge */}
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
            <span>Cart</span>
            {cartCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-emerald-500 text-white text-[10px] font-mono font-bold min-w-[16px] text-center">
                {cartCount > 99 ? '99+' : cartCount}
              </span>
            )}
          </button>

          {/* ── User Profile Control Hub (Consolidated Hamburger / Account Menu) ── */}
          <div className="relative" ref={profileMenuRef}>
            <button
              type="button"
              data-tour="account"
              onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
              className="w-9 h-9 rounded-full bg-emerald-700 text-white font-extrabold text-xs flex items-center justify-center shadow-2xs cursor-pointer hover:ring-2 hover:ring-emerald-500/40 transition-all overflow-hidden border border-emerald-600/40 relative active:scale-95"
              title={`${userName} (Account Controls & Settings)`}
              aria-label="Open profile and settings menu"
              aria-expanded={isProfileMenuOpen}
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt={userName} className="w-full h-full object-cover" />
              ) : (
                userInitial
              )}
              {/* Notification ping badge when unread alerts exist */}
              {unreadNotificationsCount > 0 && (
                <span className="absolute top-0 right-0 w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-white dark:ring-stone-900 animate-pulse" />
              )}
            </button>

            {/* Consolidated Dropdown Menu: Clean, Non-Repetitive, Premium UX */}
            {isProfileMenuOpen && (
              <div
                className="absolute right-0 top-12 w-68 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-2xl py-2 z-50 text-xs animate-in fade-in zoom-in-95 duration-150 select-none"
              >
                {/* User Header */}
                <div className="px-4 py-3 border-b border-stone-100 dark:border-stone-800 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-700 text-white font-extrabold text-sm flex items-center justify-center overflow-hidden shrink-0 border border-stone-200 dark:border-stone-700 shadow-inner">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt={userName} className="w-full h-full object-cover" />
                    ) : (
                      userInitial
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-extrabold text-stone-900 dark:text-white truncate text-sm leading-tight">
                      {userName}
                    </p>
                    <p className="text-[11px] text-stone-400 mt-0.5">Customer Account</p>
                  </div>
                </div>

                <div className="py-1.5 space-y-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      onOpenProfile();
                    }}
                    className="w-full px-4 py-2 flex items-center gap-2.5 text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 hover:text-stone-900 dark:hover:text-white font-medium cursor-pointer transition-colors"
                  >
                    <User className="w-4 h-4 text-stone-400" />
                    <span>My Profile &amp; Settings</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      onOpenOrders();
                    }}
                    className="w-full px-4 py-2 flex items-center gap-2.5 text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 hover:text-stone-900 dark:hover:text-white font-medium cursor-pointer transition-colors"
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
                    className="w-full px-4 py-2 flex items-center justify-between text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 hover:text-stone-900 dark:hover:text-white font-medium cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <Heart className="w-4 h-4 text-rose-500" />
                      <span>Wishlist &amp; Favorites</span>
                    </div>
                    {favoritesCount > 0 && (
                      <span className="text-[10px] font-bold text-rose-600 bg-rose-50 dark:bg-rose-950 px-2 py-0.5 rounded-full font-mono">
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
                    className="w-full px-4 py-2 flex items-center gap-2.5 text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 hover:text-stone-900 dark:hover:text-white font-medium cursor-pointer transition-colors"
                  >
                    <Shield className="w-4 h-4 text-purple-600" />
                    <span>Spending Mandates</span>
                  </button>

                  {/* Notifications Center inside Control Hub */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      onOpenNotifications();
                    }}
                    className="w-full px-4 py-2 flex items-center justify-between text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 hover:text-stone-900 dark:hover:text-white font-medium cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <Bell className="w-4 h-4 text-amber-500" />
                      <span>Notifications Center</span>
                    </div>
                    {unreadNotificationsCount > 0 && (
                      <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-950 px-2 py-0.5 rounded-full font-mono">
                        {unreadNotificationsCount}
                      </span>
                    )}
                  </button>

                  {/* Dark & Light Theme Switcher inside Control Hub */}
                  <button
                    type="button"
                    onClick={() => {
                      onToggleTheme();
                    }}
                    className="w-full px-4 py-2 flex items-center justify-between text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 hover:text-stone-900 dark:hover:text-white font-medium cursor-pointer transition-colors group"
                  >
                    <div className="flex items-center gap-2.5">
                      {isDark ? (
                        <Sun className="w-4 h-4 text-amber-500 group-hover:rotate-45 transition-transform" />
                      ) : (
                        <Moon className="w-4 h-4 text-stone-400 group-hover:-rotate-12 transition-transform" />
                      )}
                      <span>{isDark ? 'Light Theme' : 'Dark Theme'}</span>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 border border-stone-200 dark:border-stone-700">
                      Toggle
                    </span>
                  </button>
                </div>

                {/* Sign Out Action */}
                <div className="pt-1.5 mt-1 border-t border-stone-100 dark:border-stone-800">
                  <button
                    type="button"
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      onLogout();
                    }}
                    className="w-full px-4 py-2 flex items-center gap-2.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 font-bold cursor-pointer transition-colors"
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

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
  userName = 'Priya Sharma',
  walletBalance = 349.0,
  favoritesCount = 0,
  isDark,
  onToggleTheme,
}) => {
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  const cartCount = cart?.itemCount || 0;
  const addressTypeLabel = selectedAddress?.addressType || 'Home';
  const addressLocalityLabel = selectedAddress
    ? selectedAddress.areaLocality || selectedAddress.apartmentStreet || selectedAddress.city
    : 'HSR Layout, Bengaluru';

  return (
    <header className="hidden lg:block sticky top-0 z-40 bg-white/95 dark:bg-stone-900/95 backdrop-blur-md border-b border-stone-200/80 dark:border-stone-800 shadow-xs">
      <div className="w-full max-w-[1600px] mx-auto px-6 lg:px-10 h-20 flex items-center justify-between gap-6">
        {/* Left: Brand Logo & Location */}
        <div className="flex items-center gap-6 flex-shrink-0">
          {/* Logo */}
          <button
            type="button"
            onClick={() => onSelectTab('home')}
            className="flex items-center gap-3 cursor-pointer text-left group"
          >
            <div className="w-11 h-11 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-md shadow-emerald-600/30 group-hover:scale-105 transition-transform">
              <Leaf className="w-6 h-6 fill-white" />
            </div>
            <div>
              <div className="flex items-center gap-2 leading-none">
                <span className="font-extrabold text-2xl text-stone-900 dark:text-white tracking-tight">
                  CartPilot
                </span>
                <span className="text-xs font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 px-2.5 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-700">
                  100% Veg
                </span>
              </div>
              <span className="text-xs text-stone-400 font-medium">
                Fresh Pick · Fayda Quick
              </span>
            </div>
          </button>

          {/* Location Selector Pill */}
          <button
            type="button"
            onClick={onOpenAddressModal}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-stone-50 dark:bg-stone-800 hover:bg-stone-100 dark:hover:bg-stone-750 border border-stone-200 dark:border-stone-700 text-sm font-semibold text-stone-800 dark:text-stone-200 transition-colors cursor-pointer max-w-[280px]"
            title="Change Delivery Location"
          >
            <MapPin className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <div className="truncate text-left">
              <span className="font-bold text-stone-900 dark:text-white mr-1 capitalize">
                {addressTypeLabel}:
              </span>
              <span className="text-stone-500 dark:text-stone-400 truncate">
                {addressLocalityLabel}
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-stone-400 flex-shrink-0 ml-auto" />
          </button>
        </div>

        {/* Center: Search Bar with AI Quick Trigger */}
        <div className="flex-1 max-w-2xl">
          <div
            onClick={onOpenSearchModal}
            className="flex items-center justify-between pl-5 pr-2 py-2 rounded-full bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 hover:border-emerald-500 shadow-2xs cursor-pointer transition-all h-12"
          >
            <div className="flex items-center gap-3 text-stone-400 text-sm font-medium truncate">
              <Search className="w-4.5 h-4.5 text-stone-400 flex-shrink-0" />
              <span className="truncate">Search for fresh fruits, vegetables, dairy, recipes...</span>
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSelectTab('chat');
              }}
              className="px-4 py-2 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
            >
              <span>AI Shop</span>
              <Sparkles className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Right: Navigation Links, Wallet, Wishlist, Cart & Profile */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {/* Quick Nav Links */}
          <nav className="flex items-center gap-1.5 font-bold text-sm text-stone-600 dark:text-stone-300">
            <button
              type="button"
              onClick={() => onSelectTab('home')}
              className={`px-4 py-2 rounded-full transition-colors cursor-pointer ${
                activeTab === 'home'
                  ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-extrabold'
                  : 'hover:text-emerald-700 hover:bg-stone-100 dark:hover:bg-stone-800'
              }`}
            >
              Home
            </button>

            <button
              type="button"
              onClick={() => onSelectTab('browse')}
              className={`px-4 py-2 rounded-full transition-colors cursor-pointer ${
                activeTab === 'browse'
                  ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-extrabold'
                  : 'hover:text-emerald-700 hover:bg-stone-100 dark:hover:bg-stone-800'
              }`}
            >
              Browse
            </button>

            <button
              type="button"
              onClick={() => onSelectTab('chat')}
              className={`px-4 py-2 rounded-full flex items-center gap-1.5 transition-colors cursor-pointer ${
                activeTab === 'chat'
                  ? 'bg-emerald-700 text-white font-extrabold shadow-xs'
                  : 'text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>AI Assistant</span>
            </button>
          </nav>

          <div className="h-6 w-px bg-stone-200 dark:bg-stone-800" />

          {/* Wishlist Button */}
          <button
            type="button"
            onClick={onOpenWishlist}
            className="flex items-center gap-2 px-3.5 py-2 rounded-full text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 text-sm font-bold transition-colors cursor-pointer relative"
            title="Wishlist & Favorites"
          >
            <Heart
              className={`w-4.5 h-4.5 ${
                favoritesCount > 0
                  ? 'fill-rose-500 text-rose-500'
                  : 'text-stone-500 dark:text-stone-400'
              }`}
            />
            <span>Wishlist</span>
            {favoritesCount > 0 && (
              <span className="w-4.5 h-4.5 rounded-full bg-rose-500 text-white text-xs font-mono font-bold flex items-center justify-center">
                {favoritesCount}
              </span>
            )}
          </button>

          {/* Wallet Balance Pill */}
          <button
            type="button"
            onClick={onOpenWallet}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-sm font-black transition-colors cursor-pointer"
            title="CartPilot Wallet"
          >
            <Wallet className="w-4 h-4 text-emerald-600" />
            <span>₹ {walletBalance.toFixed(1)}</span>
          </button>

          {/* Cart Button */}
          <button
            type="button"
            onClick={() => onSelectTab('cart')}
            className={`flex items-center gap-2.5 px-5 py-2 rounded-full text-sm font-black transition-all cursor-pointer relative ${
              activeTab === 'cart'
                ? 'bg-emerald-700 text-white shadow-sm'
                : 'bg-stone-900 text-white hover:bg-stone-800 dark:bg-white dark:text-stone-900'
            }`}
          >
            <ShoppingBag className="w-4.5 h-4.5" />
            <span>Cart</span>
            {cartCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-white text-xs font-mono font-bold">
                {cartCount}
              </span>
            )}
          </button>

          {/* Notifications Bell */}
          <button
            type="button"
            onClick={onOpenNotifications}
            className="w-10 h-10 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white flex items-center justify-center transition-colors relative cursor-pointer"
            title="Notifications"
          >
            <Bell className="w-4.5 h-4.5" />
            <span className="absolute top-2.5 right-2.5 w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-white dark:ring-stone-800" />
          </button>

          {/* Theme Toggle */}
          <button
            type="button"
            onClick={onToggleTheme}
            className="w-10 h-10 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {isDark ? <Sun className="w-4.5 h-4.5 text-amber-500" /> : <Moon className="w-4.5 h-4.5" />}
          </button>

          {/* User Profile Avatar with Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
              className="w-10 h-10 rounded-full bg-emerald-600 text-white font-black text-sm flex items-center justify-center shadow-xs cursor-pointer hover:ring-2 hover:ring-emerald-500/40 transition-all"
              title={userName}
            >
              {userInitial}
            </button>

            {isProfileMenuOpen && (
              <div
                onMouseLeave={() => setIsProfileMenuOpen(false)}
                className="absolute right-0 top-13 w-64 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xl py-2 z-50 text-sm animate-in fade-in zoom-in-95 duration-150"
              >
                <div className="px-5 py-3 border-b border-stone-100 dark:border-stone-800">
                  <p className="font-extrabold text-stone-900 dark:text-white truncate text-sm">
                    {userName}
                  </p>
                  <p className="text-xs text-stone-400 font-medium">Customer Account</p>
                </div>

                <div className="py-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      onOpenProfile();
                    }}
                    className="w-full px-5 py-2.5 flex items-center gap-3 text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 font-medium cursor-pointer"
                  >
                    <User className="w-4.5 h-4.5 text-stone-400" />
                    <span>My Profile & Settings</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      onOpenOrders();
                    }}
                    className="w-full px-5 py-2.5 flex items-center gap-3 text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 font-medium cursor-pointer"
                  >
                    <Package className="w-4.5 h-4.5 text-stone-400" />
                    <span>Order History</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      onOpenRules();
                    }}
                    className="w-full px-5 py-2.5 flex items-center gap-3 text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 font-medium cursor-pointer"
                  >
                    <Shield className="w-4.5 h-4.5 text-purple-500" />
                    <span>Spending Mandates</span>
                  </button>
                </div>

                <div className="pt-1.5 border-t border-stone-100 dark:border-stone-800">
                  <button
                    type="button"
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      onLogout();
                    }}
                    className="w-full px-5 py-2.5 flex items-center gap-3 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 font-bold cursor-pointer"
                  >
                    <LogOut className="w-4.5 h-4.5" />
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

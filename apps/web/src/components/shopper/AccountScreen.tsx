import React, { useState } from 'react';
import {
  ShoppingBag,
  MapPin,
  Heart,
  Ticket,
  Headphones,
  FileText,
  FileCheck2,
  Info,
  Share2,
  HelpCircle,
  Star,
  LogOut,
  ChevronRight,
  Camera,
  Edit2,
  Wallet,
  Shield,
  Zap,
  Sun,
  Moon,
  Smartphone,
} from 'lucide-react';
import { OrderData, UserAddress } from '../../types';

interface AccountScreenProps {
  user: {
    id?: string;
    name?: string;
    email?: string;
    phone?: string;
    role?: string;
  } | null;
  orders: OrderData[];
  selectedAddress?: UserAddress | null;
  walletBalance?: number;
  onOpenOrders: () => void;
  onOpenAddresses: () => void;
  onOpenRules: () => void;
  onOpenProfileModal: () => void;
  onOpenIntegrations?: () => void;
  onLogout: () => void;
  isDark: boolean;
  onToggleTheme: () => void;
}

export const AccountScreen: React.FC<AccountScreenProps> = ({
  user,
  orders,
  selectedAddress,
  walletBalance = 349.0,
  onOpenOrders,
  onOpenAddresses,
  onOpenRules,
  onOpenProfileModal,
  onOpenIntegrations,
  onLogout,
  isDark,
  onToggleTheme,
}) => {
  const [activeModalInfo, setActiveModalInfo] = useState<{
    title: string;
    content: string;
  } | null>(null);

  const [shareSuccess, setShareSuccess] = useState(false);

  const activeOrdersCount = orders.filter(
    (o) => o.status !== 'DELIVERED' && o.status !== 'CANCELLED' && o.status !== 'FAILED'
  ).length;

  const displayName = user?.name || 'pratyush prakash';
  const displayPhone = user?.phone || '8409826244';
  const displayLocality = selectedAddress
    ? selectedAddress.areaLocality || selectedAddress.apartmentStreet || selectedAddress.city
    : 'La residentia';

  const userInitial = displayName ? displayName.charAt(0).toUpperCase() : 'P';

  const handleShareApp = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: 'CartPilot - Fresh Fruits & Veggies Delivered Every Morning',
          text: 'Order 100% vegetarian groceries till midnight and get next morning delivery with AI shopping on CartPilot!',
          url: window.location.origin,
        });
      } catch {
        // User cancelled share
      }
    } else if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.origin);
      setShareSuccess(true);
      setTimeout(() => setShareSuccess(false), 2500);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto pb-12 bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100">
      <div className="max-w-[540px] mx-auto px-4 pt-4 space-y-4">
        {/* ── User Profile Header Card (Reference Screenshot 6) ───────────── */}
        <div className="rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-4 shadow-sm flex items-center justify-between gap-3">
          <div className="flex items-center gap-3.5 min-w-0">
            {/* Avatar circle with green ring & camera badge */}
            <div className="relative flex-shrink-0">
              <div className="w-16 h-16 rounded-full border-2 border-emerald-600 dark:border-emerald-500 p-0.5 flex items-center justify-center">
                <div className="w-full h-full rounded-full bg-emerald-700 text-white font-extrabold text-2xl flex items-center justify-center">
                  {userInitial}
                </div>
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-6 h-6 rounded-full bg-emerald-600 text-white border-2 border-white dark:border-stone-900 flex items-center justify-center shadow-xs">
                <Camera className="w-3 h-3" />
              </div>
            </div>

            {/* User Meta Information */}
            <div className="min-w-0 space-y-0.5">
              <h3 className="font-extrabold text-base text-stone-900 dark:text-white truncate">
                {displayName}
              </h3>
              <div className="flex items-center gap-1.5 text-xs text-stone-500 dark:text-stone-400 font-medium truncate">
                <Smartphone className="w-3.5 h-3.5 flex-shrink-0 text-stone-400" />
                <span className="truncate">{displayPhone}</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-stone-500 dark:text-stone-400 font-medium truncate">
                <MapPin className="w-3.5 h-3.5 flex-shrink-0 text-stone-400" />
                <span className="truncate">{displayLocality}</span>
              </div>
            </div>
          </div>

          {/* Edit Profile Button */}
          <button
            type="button"
            onClick={onOpenProfileModal}
            className="w-9 h-9 rounded-xl border border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-300 hover:border-emerald-500 hover:text-emerald-600 flex items-center justify-center transition-colors cursor-pointer flex-shrink-0"
            title="Edit Profile"
          >
            <Edit2 className="w-4 h-4 text-emerald-600" />
          </button>
        </div>

        {/* ── CartPilot Wallet Card (Reference Screenshot 6) ──────────────── */}
        <div className="rounded-3xl bg-emerald-50/90 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 p-4 shadow-sm flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-700 text-white flex items-center justify-center shadow-md shadow-emerald-700/20">
              <Wallet className="w-6 h-6 fill-white" />
            </div>
            <div>
              <span className="text-xs font-bold text-stone-700 dark:text-stone-300 block">
                CartPilot Wallet
              </span>
              <span className="text-xl font-black text-stone-900 dark:text-white">
                ₹{walletBalance.toFixed(2)}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() =>
              setActiveModalInfo({
                title: 'CartPilot Wallet',
                content:
                  'Current balance: ₹' +
                  walletBalance.toFixed(2) +
                  '. Instant wallet checkout is enabled for all fresh produce and daily grocery orders with 0 transaction fees.',
              })
            }
            className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs shadow-md shadow-emerald-700/20 transition-all cursor-pointer"
          >
            Add
          </button>
        </div>

        {/* ── 3-Card Quick Navigation Grid (Orders / Addresses / Favorites) ── */}
        <div className="grid grid-cols-3 gap-2.5">
          {/* Orders */}
          <button
            type="button"
            onClick={onOpenOrders}
            className="rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-3.5 shadow-xs flex flex-col items-center justify-center text-center hover:border-emerald-500/40 transition-all cursor-pointer group relative"
          >
            {activeOrdersCount > 0 && (
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-emerald-500" />
            )}
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform">
              <ShoppingBag className="w-5 h-5 fill-emerald-600 text-emerald-600" />
            </div>
            <span className="font-extrabold text-xs text-stone-900 dark:text-white">Orders</span>
          </button>

          {/* Saved Addresses */}
          <button
            type="button"
            onClick={onOpenAddresses}
            className="rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-3.5 shadow-xs flex flex-col items-center justify-center text-center hover:border-emerald-500/40 transition-all cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform">
              <MapPin className="w-5 h-5 fill-blue-500 text-blue-500" />
            </div>
            <span className="font-extrabold text-xs text-stone-900 dark:text-white leading-tight">
              Saved Addresses
            </span>
          </button>

          {/* Favorites */}
          <button
            type="button"
            onClick={() =>
              setActiveModalInfo({
                title: 'Favorites & Wishlist',
                content:
                  'Your favorite farm-fresh vegetables, organic milk, and daily essentials are bookmarked here for 1-tap reordering.',
              })
            }
            className="rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-3.5 shadow-xs flex flex-col items-center justify-center text-center hover:border-emerald-500/40 transition-all cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-500 flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform">
              <Heart className="w-5 h-5 fill-rose-500 text-rose-500" />
            </div>
            <span className="font-extrabold text-xs text-stone-900 dark:text-white">Favorites</span>
          </button>
        </div>

        {/* ── 2-Card Row (Coupons & Help Center) ───────────────────────────── */}
        <div className="grid grid-cols-2 gap-2.5">
          {/* Coupons */}
          <button
            type="button"
            onClick={() =>
              setActiveModalInfo({
                title: 'Available Coupons',
                content:
                  'Use code VEGFRESH for 10% off your daily vegetarian harvest. Code MORNING saves ₹50 on scheduled morning delivery orders above ₹300.',
              })
            }
            className="rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-3.5 shadow-xs flex items-center gap-3 hover:border-emerald-500/40 transition-all cursor-pointer"
          >
            <div className="w-9 h-9 rounded-2xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 flex items-center justify-center flex-shrink-0">
              <Ticket className="w-5 h-5 fill-purple-600 text-purple-600" />
            </div>
            <span className="font-extrabold text-xs text-stone-900 dark:text-white">Coupons</span>
          </button>

          {/* Help Center */}
          <button
            type="button"
            onClick={() =>
              setActiveModalInfo({
                title: 'Help Center & Support',
                content:
                  'Need assistance with your morning delivery or order? Our support team is active 24/7. Call: 1800-CART-PILOT or chat live through AI assistant.',
              })
            }
            className="rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-3.5 shadow-xs flex items-center gap-3 hover:border-emerald-500/40 transition-all cursor-pointer"
          >
            <div className="w-9 h-9 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 flex items-center justify-center flex-shrink-0">
              <Headphones className="w-5 h-5 text-emerald-700" />
            </div>
            <span className="font-extrabold text-xs text-stone-900 dark:text-white">
              Help Center
            </span>
          </button>
        </div>

        {/* ── Menu List Items (Matching Reference Screenshot 6) ───────────── */}
        <div className="rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 divide-y divide-stone-100 dark:divide-stone-800/80 shadow-xs overflow-hidden">
          {/* Privacy Policy */}
          <button
            type="button"
            onClick={() =>
              setActiveModalInfo({
                title: 'Privacy Policy',
                content:
                  'CartPilot respects your personal data. We comply with Indian Digital Personal Data Protection Act (DPDPA 2023) and GDPR principles. Location data is strictly used for order dispatch and route optimization.',
              })
            }
            className="w-full flex items-center justify-between px-4 py-3.5 text-left hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors cursor-pointer group"
          >
            <div className="flex items-center gap-3">
              <FileText className="w-4 h-4 text-stone-500" />
              <span className="text-xs font-bold text-stone-800 dark:text-stone-200 group-hover:text-emerald-600">
                Privacy Policy
              </span>
            </div>
            <ChevronRight className="w-4 h-4 text-stone-400" />
          </button>

          {/* Terms Conditions */}
          <button
            type="button"
            onClick={() =>
              setActiveModalInfo({
                title: 'Terms & Conditions',
                content:
                  'All items delivered through CartPilot are 100% vegetarian. Order cutoff is midnight (23:59:59) for standard morning delivery window (6:00 AM – 9:00 AM). Returns and replacements are honored within 2 hours of delivery for fresh produce.',
              })
            }
            className="w-full flex items-center justify-between px-4 py-3.5 text-left hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors cursor-pointer group"
          >
            <div className="flex items-center gap-3">
              <FileCheck2 className="w-4 h-4 text-stone-500" />
              <span className="text-xs font-bold text-stone-800 dark:text-stone-200 group-hover:text-emerald-600">
                Terms Conditions
              </span>
            </div>
            <ChevronRight className="w-4 h-4 text-stone-400" />
          </button>

          {/* About Us */}
          <button
            type="button"
            onClick={() =>
              setActiveModalInfo({
                title: 'About CartPilot',
                content:
                  'CartPilot is India’s first agentic AI-powered pure vegetarian grocery commerce platform. We empower shoppers with intelligent recipe matching, policy-based autonomous spending controls, and next-morning farm-fresh delivery.',
              })
            }
            className="w-full flex items-center justify-between px-4 py-3.5 text-left hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors cursor-pointer group"
          >
            <div className="flex items-center gap-3">
              <Info className="w-4 h-4 text-stone-500" />
              <span className="text-xs font-bold text-stone-800 dark:text-stone-200 group-hover:text-emerald-600">
                About Us
              </span>
            </div>
            <ChevronRight className="w-4 h-4 text-stone-400" />
          </button>

          {/* Share App */}
          <button
            type="button"
            onClick={handleShareApp}
            className="w-full flex items-center justify-between px-4 py-3.5 text-left hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors cursor-pointer group"
          >
            <div className="flex items-center gap-3">
              <Share2 className="w-4 h-4 text-stone-500" />
              <span className="text-xs font-bold text-stone-800 dark:text-stone-200 group-hover:text-emerald-600">
                Share App
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              {shareSuccess && (
                <span className="text-[10px] text-emerald-600 font-bold">Link Copied!</span>
              )}
              <ChevronRight className="w-4 h-4 text-stone-400" />
            </div>
          </button>

          {/* FAQs */}
          <button
            type="button"
            onClick={() =>
              setActiveModalInfo({
                title: 'Frequently Asked Questions (FAQs)',
                content:
                  'Q: What is the delivery timing?\nA: Order till midnight to receive guaranteed morning delivery between 6 AM and 9 AM.\n\nQ: Are all groceries vegetarian?\nA: Yes, 100% vegetarian. All non-vegetarian and meat products are strictly disallowed platform-wide.\n\nQ: What are spending rules?\nA: Spending rules are autonomous spending controls that prevent overspending on groceries without manual consent.',
              })
            }
            className="w-full flex items-center justify-between px-4 py-3.5 text-left hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors cursor-pointer group"
          >
            <div className="flex items-center gap-3">
              <HelpCircle className="w-4 h-4 text-stone-500" />
              <span className="text-xs font-bold text-stone-800 dark:text-stone-200 group-hover:text-emerald-600">
                FAQs
              </span>
            </div>
            <ChevronRight className="w-4 h-4 text-stone-400" />
          </button>

          {/* Rate App */}
          <button
            type="button"
            onClick={() =>
              setActiveModalInfo({
                title: 'Rate CartPilot',
                content:
                  'Thank you for rating CartPilot 5 Stars! Your feedback helps us connect more local organic farmers with families across your city.',
              })
            }
            className="w-full flex items-center justify-between px-4 py-3.5 text-left hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors cursor-pointer group"
          >
            <div className="flex items-center gap-3">
              <Star className="w-4 h-4 text-stone-500" />
              <span className="text-xs font-bold text-stone-800 dark:text-stone-200 group-hover:text-emerald-600">
                Rate App
              </span>
            </div>
            <ChevronRight className="w-4 h-4 text-stone-400" />
          </button>

          {/* Spending Mandate Rules (Preserved Foundation Feature) */}
          <button
            type="button"
            onClick={onOpenRules}
            className="w-full flex items-center justify-between px-4 py-3.5 text-left hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors cursor-pointer group"
          >
            <div className="flex items-center gap-3">
              <Shield className="w-4 h-4 text-purple-600" />
              <div>
                <span className="text-xs font-bold text-stone-800 dark:text-stone-200 group-hover:text-emerald-600 block">
                  Spending Permissions & Mandate
                </span>
                <span className="text-[10px] text-stone-400">
                  Autonomous caps, approval thresholds
                </span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-stone-400" />
          </button>

          {/* AI Engine & Integrations (Preserved Foundation Feature) */}
          {onOpenIntegrations && (
            <button
              type="button"
              onClick={onOpenIntegrations}
              className="w-full flex items-center justify-between px-4 py-3.5 text-left hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <Zap className="w-4 h-4 text-teal-600" />
                <div>
                  <span className="text-xs font-bold text-stone-800 dark:text-stone-200 group-hover:text-emerald-600 block">
                    AI Engine & Integrations
                  </span>
                  <span className="text-[10px] text-stone-400">
                    Google Gemini 3.1 Pro Preview & Flash Lite
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">
                  Active
                </span>
                <ChevronRight className="w-4 h-4 text-stone-400" />
              </div>
            </button>
          )}

          {/* Theme Toggle (Preserved Foundation Feature) */}
          <button
            type="button"
            onClick={onToggleTheme}
            className="w-full flex items-center justify-between px-4 py-3.5 text-left hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors cursor-pointer group"
          >
            <div className="flex items-center gap-3">
              {isDark ? (
                <Sun className="w-4 h-4 text-amber-500" />
              ) : (
                <Moon className="w-4 h-4 text-stone-500" />
              )}
              <span className="text-xs font-bold text-stone-800 dark:text-stone-200 group-hover:text-emerald-600">
                {isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              </span>
            </div>
            <span className="text-[10px] font-bold text-stone-400 uppercase">
              {isDark ? 'Dark' : 'Light'}
            </span>
          </button>
        </div>

        {/* ── Logout Button (Matching Reference Screenshot 6) ─────────────── */}
        <div className="rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xs overflow-hidden">
          <button
            type="button"
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-4 text-left hover:bg-rose-50 dark:hover:bg-rose-950/20 text-rose-600 transition-colors cursor-pointer"
          >
            <LogOut className="w-5 h-5 text-rose-600 flex-shrink-0" />
            <span className="text-sm font-extrabold text-rose-600 tracking-wide">Logout</span>
          </button>
        </div>

        {/* Information Dialog Modal */}
        {activeModalInfo && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-sm bg-white dark:bg-stone-900 rounded-3xl p-6 shadow-2xl border border-stone-200 dark:border-stone-800 text-stone-800 dark:text-stone-100 animate-in zoom-in-95 duration-200">
              <h3 className="font-extrabold text-base text-stone-900 dark:text-white mb-2">
                {activeModalInfo.title}
              </h3>
              <p className="text-xs text-stone-600 dark:text-stone-300 whitespace-pre-line leading-relaxed mb-6">
                {activeModalInfo.content}
              </p>
              <button
                type="button"
                onClick={() => setActiveModalInfo(null)}
                className="w-full py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
              >
                Got it
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

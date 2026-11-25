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
  Cpu,
  Sun,
  Moon,
  Smartphone,
  CheckCircle2,
  X,
  MessageCircle,
  Phone,
  Mail,
  ChevronDown,
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
  onOpenWishlist?: () => void;
  onOpenWallet?: () => void;
  onOpenCoupons?: () => void;
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
  onOpenWishlist,
  onOpenWallet,
  onOpenCoupons,
  onOpenIntegrations,
  onLogout,
  isDark,
  onToggleTheme,
}) => {
  const [activeInfoModal, setActiveInfoModal] = useState<{
    title: string;
    content: string | React.ReactNode;
  } | null>(null);

  const [isHelpCenterOpen, setIsHelpCenterOpen] = useState(false);
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
  const [selectedRating, setSelectedRating] = useState(5);
  const [ratingSubmitted, setRatingSubmitted] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  const activeOrdersCount = orders.filter(
    (o) => o.status !== 'DELIVERED' && o.status !== 'CANCELLED' && o.status !== 'FAILED'
  ).length;

  const displayName = user?.name || 'Pratyush Prakash';
  const displayPhone = user?.phone || '+91 8409826244';
  const displayLocality = selectedAddress
    ? selectedAddress.areaLocality || selectedAddress.apartmentStreet || selectedAddress.city
    : 'La residentia, Greater Noida West';

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

  const FAQS = [
    {
      q: 'When do I need to order for next-morning delivery?',
      a: 'All orders placed before 12:00 midnight are guaranteed for delivery the next morning between 6:00 AM and 9:00 AM directly to your doorstep.',
    },
    {
      q: 'Are all products strictly vegetarian?',
      a: 'Yes, 100%. CartPilot enforces a zero-meat, zero-egg guarantee. Every SKU is farm-verified and strictly vegetarian.',
    },
    {
      q: 'How does the CartPilot Wallet work?',
      a: 'Your wallet holds funds for instant 1-tap checkout with 0 transaction fees. Refunds, promotional cashbacks, and top-ups reflect immediately in your balance.',
    },
    {
      q: 'What are autonomous spending mandates?',
      a: 'Spending rules allow you to set daily and per-order budget limits. When active, our deterministic policy engine auto-approves safe daily groceries within budget while flagging anomalies for your sign-off.',
    },
  ];

  return (
    <div className="flex-1 overflow-y-auto pb-16 bg-[#f8faf9] dark:bg-stone-950 text-stone-900 dark:text-stone-100 font-sans">
      {/* ── Top Header ──────────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-30 bg-white/95 dark:bg-stone-900/95 backdrop-blur-md px-4 sm:px-6 lg:px-8 py-3.5 border-b border-stone-200/80 dark:border-stone-800 shadow-xs">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <h2 className="font-extrabold text-base sm:text-lg text-stone-900 dark:text-white leading-none">
              Account & Settings
            </h2>
            <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-700">
              Verified
            </span>
          </div>

          <button
            type="button"
            onClick={onToggleTheme}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 text-xs font-bold hover:text-stone-900 transition-colors cursor-pointer"
          >
            {isDark ? <Sun className="w-3.5 h-3.5 text-amber-500" /> : <Moon className="w-3.5 h-3.5" />}
            <span>{isDark ? 'Light Mode' : 'Dark Mode'}</span>
          </button>
        </div>
      </div>

      <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          {/* ── Left Column: Profile, Wallet & Mandates (5 Cols on Desktop) ── */}
          <div className="lg:col-span-5 space-y-4">
            {/* User Profile Header Card */}
            <div className="rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 p-5 shadow-xs flex items-center justify-between gap-3">
              <div className="flex items-center gap-3.5 min-w-0">
                {/* Avatar with Ring */}
                <div className="relative flex-shrink-0">
                  <div className="w-16 h-16 rounded-full border-2 border-emerald-600 dark:border-emerald-500 p-0.5 flex items-center justify-center">
                    <div className="w-full h-full rounded-full bg-emerald-700 text-white font-extrabold text-2xl flex items-center justify-center shadow-inner">
                      {userInitial}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={onOpenProfileModal}
                    className="absolute -bottom-0.5 -right-0.5 w-6 h-6 rounded-full bg-emerald-600 text-white border-2 border-white dark:border-stone-900 flex items-center justify-center shadow-xs cursor-pointer hover:scale-110 transition-transform"
                    title="Change Avatar"
                  >
                    <Camera className="w-3 h-3" />
                  </button>
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
                className="w-10 h-10 rounded-2xl border border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-300 hover:border-emerald-500 hover:text-emerald-600 flex items-center justify-center transition-colors cursor-pointer flex-shrink-0 shadow-2xs"
                title="Edit Profile"
              >
                <Edit2 className="w-4 h-4 text-emerald-600" />
              </button>
            </div>

            {/* CartPilot Wallet Card */}
            <div className="rounded-3xl bg-gradient-to-br from-emerald-50 via-emerald-50/60 to-emerald-100/40 dark:from-emerald-950/40 dark:to-emerald-900/20 border border-emerald-200/80 dark:border-emerald-800/50 p-5 shadow-xs flex items-center justify-between gap-3">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-emerald-700 text-white flex items-center justify-center shadow-md shadow-emerald-700/20">
                  <Wallet className="w-6 h-6 fill-white" />
                </div>
                <div>
                  <span className="text-xs font-bold text-stone-700 dark:text-stone-300 block">
                    CartPilot Wallet
                  </span>
                  <span className="text-2xl font-black text-stone-900 dark:text-white">
                    ₹{walletBalance.toFixed(2)}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={onOpenWallet}
                className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs shadow-md shadow-emerald-700/20 transition-all cursor-pointer"
              >
                + Add Money
              </button>
            </div>

            {/* Spending Rules & Mandate Card */}
            <div
              onClick={onOpenRules}
              className="rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 p-4 shadow-xs flex items-center justify-between cursor-pointer hover:border-purple-500/40 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h4 className="font-extrabold text-xs text-stone-900 dark:text-white group-hover:text-purple-600 transition-colors">
                    Spending Rules & Mandates
                  </h4>
                  <p className="text-[11px] text-stone-400">
                    Auto-approve ceiling & daily budget guards
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-stone-400 group-hover:text-purple-600 transition-colors" />
            </div>

            {/* AI Engine & Integrations Card */}
            {onOpenIntegrations && (
              <div
                onClick={onOpenIntegrations}
                className="rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 p-4 shadow-xs flex items-center justify-between cursor-pointer hover:border-emerald-500/40 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
                    <Cpu className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-xs text-stone-900 dark:text-white group-hover:text-emerald-600 transition-colors">
                      AI Engine & API Integrations
                    </h4>
                    <p className="text-[11px] text-stone-400">
                      Gemini API key & real-time tool settings
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-stone-400 group-hover:text-emerald-600 transition-colors" />
              </div>
            )}

            {/* Sign Out Card */}
            <button
              type="button"
              onClick={onLogout}
              className="w-full py-3.5 px-4 rounded-2xl bg-white dark:bg-stone-900 border border-rose-200/80 dark:border-rose-900/40 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 font-extrabold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Log Out of CartPilot</span>
            </button>
          </div>

          {/* ── Right Column: Hub Grid, Coupons & Information (7 Cols on Desktop) ── */}
          <div className="lg:col-span-7 space-y-4">
            {/* 3-Card Quick Navigation Grid */}
            <div className="grid grid-cols-3 gap-3">
              {/* Orders */}
              <button
                type="button"
                onClick={onOpenOrders}
                className="rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 p-4 shadow-xs flex flex-col items-center justify-center text-center hover:border-emerald-500/40 transition-all cursor-pointer group relative"
              >
                {activeOrdersCount > 0 && (
                  <span className="absolute top-2.5 right-2.5 w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                )}
                <div className="w-11 h-11 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform">
                  <ShoppingBag className="w-5 h-5 fill-emerald-600 text-emerald-600" />
                </div>
                <span className="font-extrabold text-xs text-stone-900 dark:text-white">Orders</span>
                <span className="text-[10px] text-stone-400 mt-0.5 font-medium">
                  {orders.length} placed
                </span>
              </button>

              {/* Saved Addresses */}
              <button
                type="button"
                onClick={onOpenAddresses}
                className="rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 p-4 shadow-xs flex flex-col items-center justify-center text-center hover:border-emerald-500/40 transition-all cursor-pointer group"
              >
                <div className="w-11 h-11 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform">
                  <MapPin className="w-5 h-5 fill-blue-500 text-blue-500" />
                </div>
                <span className="font-extrabold text-xs text-stone-900 dark:text-white leading-tight">
                  Saved Addresses
                </span>
                <span className="text-[10px] text-stone-400 mt-0.5 font-medium">Manage locations</span>
              </button>

              {/* Favorites / Wishlist */}
              <button
                type="button"
                onClick={onOpenWishlist}
                className="rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 p-4 shadow-xs flex flex-col items-center justify-center text-center hover:border-emerald-500/40 transition-all cursor-pointer group"
              >
                <div className="w-11 h-11 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-500 flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform">
                  <Heart className="w-5 h-5 fill-rose-500 text-rose-500" />
                </div>
                <span className="font-extrabold text-xs text-stone-900 dark:text-white">Favorites</span>
                <span className="text-[10px] text-stone-400 mt-0.5 font-medium">Wishlist items</span>
              </button>
            </div>

            {/* 2-Card Row: Coupons & Help Center */}
            <div className="grid grid-cols-2 gap-3">
              {/* Coupons */}
              <button
                type="button"
                onClick={onOpenCoupons}
                className="rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 p-4 shadow-xs flex items-center gap-3 hover:border-emerald-500/40 transition-all cursor-pointer group text-left"
              >
                <div className="w-10 h-10 rounded-2xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                  <Ticket className="w-5 h-5 fill-purple-600 text-purple-600" />
                </div>
                <div>
                  <span className="font-extrabold text-xs text-stone-900 dark:text-white block group-hover:text-emerald-700 transition-colors">
                    Coupons & Offers
                  </span>
                  <span className="text-[10px] text-stone-400">Save up to ₹100</span>
                </div>
              </button>

              {/* Help Center */}
              <button
                type="button"
                onClick={() => setIsHelpCenterOpen(true)}
                className="rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 p-4 shadow-xs flex items-center gap-3 hover:border-emerald-500/40 transition-all cursor-pointer group text-left"
              >
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                  <Headphones className="w-5 h-5 text-emerald-700" />
                </div>
                <div>
                  <span className="font-extrabold text-xs text-stone-900 dark:text-white block group-hover:text-emerald-700 transition-colors">
                    Help Center
                  </span>
                  <span className="text-[10px] text-stone-400">24/7 Live Support</span>
                </div>
              </button>
            </div>

            {/* Interactive Policy & App Links List */}
            <div className="rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 p-2 shadow-xs divide-y divide-stone-100 dark:divide-stone-800">
              {/* Privacy Policy */}
              <button
                type="button"
                onClick={() =>
                  setActiveInfoModal({
                    title: 'Privacy Policy',
                    content:
                      'CartPilot is engineered with strict zero-trust data protection principles. We never share your phone number, delivery address, or grocery preferences with third-party advertising brokers. All order communication is encrypted end-to-end, and payment credentials are processed directly via PCI-DSS Level 1 compliant gateway tokenization.',
                  })
                }
                className="w-full p-3.5 flex items-center justify-between text-left hover:bg-stone-50 dark:hover:bg-stone-850 rounded-2xl transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <FileText className="w-4 h-4 text-stone-400" />
                  <span className="font-bold text-xs text-stone-800 dark:text-stone-200">
                    Privacy Policy
                  </span>
                </div>
                <ChevronRight className="w-4 h-4 text-stone-400" />
              </button>

              {/* Terms & Conditions */}
              <button
                type="button"
                onClick={() =>
                  setActiveInfoModal({
                    title: 'Terms & Conditions',
                    content:
                      'CartPilot guarantees 100% pure vegetarian produce and pantry supplies. Morning deliveries are fulfilled between 6:00 AM and 9:00 AM for all orders placed before the 12:00 AM midnight cutoff. In the rare event of damaged produce, instant wallet compensation is issued with zero dispute hurdles.',
                  })
                }
                className="w-full p-3.5 flex items-center justify-between text-left hover:bg-stone-50 dark:hover:bg-stone-850 rounded-2xl transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <FileCheck2 className="w-4 h-4 text-stone-400" />
                  <span className="font-bold text-xs text-stone-800 dark:text-stone-200">
                    Terms & Conditions
                  </span>
                </div>
                <ChevronRight className="w-4 h-4 text-stone-400" />
              </button>

              {/* About Us */}
              <button
                type="button"
                onClick={() =>
                  setActiveInfoModal({
                    title: 'About CartPilot',
                    content:
                      'CartPilot is India\'s premier agentic grocery commerce platform. By combining farm-to-door direct sourcing with autonomous AI meal planning and spending mandates, CartPilot guarantees pure vegetarian essentials delivered fresh every single morning without the hassle of manual reordering.',
                  })
                }
                className="w-full p-3.5 flex items-center justify-between text-left hover:bg-stone-50 dark:hover:bg-stone-850 rounded-2xl transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <Info className="w-4 h-4 text-stone-400" />
                  <span className="font-bold text-xs text-stone-800 dark:text-stone-200">
                    About Us
                  </span>
                </div>
                <ChevronRight className="w-4 h-4 text-stone-400" />
              </button>

              {/* Share App */}
              <button
                type="button"
                onClick={handleShareApp}
                className="w-full p-3.5 flex items-center justify-between text-left hover:bg-stone-50 dark:hover:bg-stone-850 rounded-2xl transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <Share2 className="w-4 h-4 text-stone-400" />
                  <span className="font-bold text-xs text-stone-800 dark:text-stone-200">
                    Share App
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  {shareSuccess && (
                    <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-full">
                      Link Copied!
                    </span>
                  )}
                  <ChevronRight className="w-4 h-4 text-stone-400" />
                </div>
              </button>

              {/* FAQs Accordion */}
              <div className="p-3.5 space-y-2">
                <div className="flex items-center gap-3 text-stone-800 dark:text-stone-200">
                  <HelpCircle className="w-4 h-4 text-stone-400" />
                  <span className="font-bold text-xs">Frequently Asked Questions</span>
                </div>

                <div className="space-y-1.5 pt-1">
                  {FAQS.map((faq, idx) => (
                    <div
                      key={idx}
                      className="rounded-xl border border-stone-100 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-850 overflow-hidden"
                    >
                      <button
                        type="button"
                        onClick={() => setOpenFaqIndex(openFaqIndex === idx ? null : idx)}
                        className="w-full p-2.5 flex items-center justify-between text-left text-xs font-semibold text-stone-800 dark:text-stone-200 cursor-pointer"
                      >
                        <span>{faq.q}</span>
                        <ChevronDown
                          className={`w-3.5 h-3.5 text-stone-400 transition-transform ${
                            openFaqIndex === idx ? 'rotate-180' : ''
                          }`}
                        />
                      </button>
                      {openFaqIndex === idx && (
                        <div className="px-2.5 pb-2.5 text-[11px] text-stone-500 leading-relaxed border-t border-stone-100 dark:border-stone-800 pt-1.5">
                          {faq.a}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Rate App */}
              <button
                type="button"
                onClick={() => setIsRatingModalOpen(true)}
                className="w-full p-3.5 flex items-center justify-between text-left hover:bg-stone-50 dark:hover:bg-stone-850 rounded-2xl transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                  <span className="font-bold text-xs text-stone-800 dark:text-stone-200">
                    Rate Experience
                  </span>
                </div>
                <div className="flex items-center gap-1 text-[11px] text-amber-600 font-bold">
                  <span>5.0 ★</span>
                  <ChevronRight className="w-4 h-4 text-stone-400" />
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Help Center Modal ──────────────────────────────────────────────── */}
      {isHelpCenterOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-white dark:bg-stone-900 rounded-3xl shadow-2xl border border-stone-200 dark:border-stone-800 p-6 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-3">
              <div className="flex items-center gap-2">
                <Headphones className="w-5 h-5 text-emerald-600" />
                <h3 className="font-extrabold text-base text-stone-900 dark:text-white">
                  CartPilot Help & Support
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsHelpCenterOpen(false)}
                className="w-8 h-8 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-500 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-stone-500 leading-relaxed">
              Need assistance with an active delivery, wallet refund, or recipe suggestion? Our customer support team is available 24/7.
            </p>

            <div className="space-y-2">
              <a
                href="mailto:support@cartpilot.in"
                className="p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 flex items-center gap-3 text-xs font-bold text-stone-800 dark:text-stone-200 hover:border-emerald-500 transition-colors"
              >
                <Mail className="w-4 h-4 text-emerald-600" />
                <div>
                  <span>Email Support</span>
                  <p className="text-[10px] text-stone-400 font-normal">support@cartpilot.in</p>
                </div>
              </a>

              <a
                href="tel:1800123456"
                className="p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 flex items-center gap-3 text-xs font-bold text-stone-800 dark:text-stone-200 hover:border-emerald-500 transition-colors"
              >
                <Phone className="w-4 h-4 text-emerald-600" />
                <div>
                  <span>Toll-Free Customer Desk</span>
                  <p className="text-[10px] text-stone-400 font-normal">1800-123-456 (24x7 Helpline)</p>
                </div>
              </a>

              <button
                type="button"
                onClick={() => {
                  setIsHelpCenterOpen(false);
                  window.open('https://wa.me/918409826244', '_blank');
                }}
                className="w-full p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 flex items-center gap-3 text-xs font-bold text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 transition-colors cursor-pointer"
              >
                <MessageCircle className="w-4 h-4 text-emerald-600" />
                <div>
                  <span>Live WhatsApp Support</span>
                  <p className="text-[10px] text-emerald-600 font-normal">Typical reply time &lt; 2 minutes</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Rate Experience Modal ──────────────────────────────────────────── */}
      {isRatingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-sm bg-white dark:bg-stone-900 rounded-3xl shadow-2xl border border-stone-200 dark:border-stone-800 p-6 text-center space-y-4 animate-in zoom-in-95">
            <div className="w-14 h-14 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-500 mx-auto flex items-center justify-center">
              <Star className="w-7 h-7 fill-amber-500 text-amber-500" />
            </div>

            {ratingSubmitted ? (
              <div className="space-y-2 py-4">
                <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                <h4 className="font-extrabold text-sm text-stone-900 dark:text-white">
                  Thank You for Your Feedback!
                </h4>
                <p className="text-xs text-stone-500">
                  Your 5-star review inspires our local farmers and morning logistics team.
                </p>
              </div>
            ) : (
              <>
                <div className="space-y-1">
                  <h3 className="font-extrabold text-base text-stone-900 dark:text-white">
                    Rate Your CartPilot Experience
                  </h3>
                  <p className="text-xs text-stone-400">
                    How satisfied are you with our morning delivery & AI shopping?
                  </p>
                </div>

                {/* Stars selector */}
                <div className="flex items-center justify-center gap-2 py-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setSelectedRating(star)}
                      className="p-1 cursor-pointer hover:scale-125 transition-transform"
                    >
                      <Star
                        className={`w-8 h-8 ${
                          star <= selectedRating
                            ? 'text-amber-500 fill-amber-500'
                            : 'text-stone-300 dark:text-stone-700'
                        }`}
                      />
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsRatingModalOpen(false)}
                    className="flex-1 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 text-xs font-bold text-stone-600 dark:text-stone-300 hover:bg-stone-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setRatingSubmitted(true);
                      setTimeout(() => {
                        setIsRatingModalOpen(false);
                        setRatingSubmitted(false);
                      }, 1400);
                    }}
                    className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs cursor-pointer"
                  >
                    Submit
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Info Sheet Modal ───────────────────────────────────────────────── */}
      {activeInfoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-white dark:bg-stone-900 rounded-3xl shadow-2xl border border-stone-200 dark:border-stone-800 p-6 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-3">
              <h3 className="font-extrabold text-base text-stone-900 dark:text-white">
                {activeInfoModal.title}
              </h3>
              <button
                type="button"
                onClick={() => setActiveInfoModal(null)}
                className="w-8 h-8 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-500 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed max-h-80 overflow-y-auto">
              {activeInfoModal.content}
            </div>

            <button
              type="button"
              onClick={() => setActiveInfoModal(null)}
              className="w-full py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

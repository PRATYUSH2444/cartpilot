import React, { useState, useEffect } from 'react';
import { useAuth, isPlaceholderEmail } from '../../context/AuthContext';
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
  Sun,
  Moon,
  Smartphone,
  CheckCircle2,
  X,
  Mail,
  Send,
  Copy,
  Check,
  ChevronDown,
  Loader2,
  KeyRound,
  Sparkles,
} from 'lucide-react';
import { OrderData, UserAddress } from '../../types';
import { API_BASE } from '../../config/api';
import { useScrollLock } from '../../hooks/useScrollLock';

interface AccountScreenProps {
  user: {
    id?: string;
    name?: string;
    email?: string;
    phone?: string;
    role?: string;
    isEmailVerified?: boolean;
    isPhoneVerified?: boolean;
    hasRealEmail?: boolean;
    displayEmail?: string;
    hasPhone?: boolean;
    experienceRating?: number;
  } | null;
  orders: OrderData[];
  selectedAddress?: UserAddress | null;
  walletBalance?: number;
  favoritesCount?: number;
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
  onReplayTour?: () => void;
}

export const AccountScreen: React.FC<AccountScreenProps> = ({
  user,
  orders,
  selectedAddress,
  walletBalance = 0,
  favoritesCount = 0,
  onOpenOrders,
  onOpenAddresses,
  onOpenRules,
  onOpenProfileModal,
  onOpenWishlist,
  onOpenWallet,
  onOpenCoupons,
  onLogout,
  isDark,
  onToggleTheme,
  onReplayTour,
}) => {
  const [activeInfoModal, setActiveInfoModal] = useState<{
    title: string;
    content: string | React.ReactNode;
  } | null>(null);

  const [isHelpCenterOpen, setIsHelpCenterOpen] = useState(false);
  const [supportCategory, setSupportCategory] = useState('Order & Delivery');
  const [supportMessage, setSupportMessage] = useState('');
  const [supportSubmitted, setSupportSubmitted] = useState(false);
  const [isSubmittingSupport, setIsSubmittingSupport] = useState(false);
  const [supportTicketId, setSupportTicketId] = useState<string | null>(null);
  const [supportError, setSupportError] = useState<string | null>(null);
  const [emailCopied, setEmailCopied] = useState(false);

  const adminEmail = (import.meta.env.VITE_ADMIN_SUPPORT_EMAIL as string) || 'prakash.extra20@gmail.com';

  const { authFetch, sendEmailVerification, verifyEmail: verifyEmailAction, setUserProfile } = useAuth();

  // Persistent User Rating state (read from user profile and local storage)
  const [savedRating, setSavedRating] = useState<number | null>(() => {
    if (user?.experienceRating && user.experienceRating >= 1 && user.experienceRating <= 5) {
      return user.experienceRating;
    }
    try {
      const key = `cartpilot_user_rating_${user?.id || user?.email || 'guest'}`;
      const stored = localStorage.getItem(key);
      if (stored) {
        const parsed = parseInt(stored, 10);
        if (parsed >= 1 && parsed <= 5) return parsed;
      }
    } catch {}
    return null;
  });

  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
  const [selectedRating, setSelectedRating] = useState<number>(() => savedRating || 5);
  const [ratingSubmitted, setRatingSubmitted] = useState(false);

  useEffect(() => {
    if (user?.experienceRating && user.experienceRating >= 1 && user.experienceRating <= 5) {
      setSavedRating(user.experienceRating);
      setSelectedRating(user.experienceRating);
    }
  }, [user?.experienceRating]);

  const handleRatingSubmit = async () => {
    const star = selectedRating;
    setSavedRating(star);

    // 1. Immediately persist to localStorage
    try {
      const key = `cartpilot_user_rating_${user?.id || user?.email || 'guest'}`;
      localStorage.setItem(key, String(star));
    } catch {}

    // 2. Update user state in AuthContext
    if (user && setUserProfile) {
      const isPlaceholder = isPlaceholderEmail(user.email);
      setUserProfile({
        id: user.id || 'usr_current',
        email: isPlaceholder ? '' : (user.email || ''),
        name: user.name || 'Shopper',
        role: (user.role as any) || 'CUSTOMER',
        ...user,
        experienceRating: star,
      });
    }

    // 3. Sync to backend user profile and create support feedback record
    try {
      authFetch(`${API_BASE}/users/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ experienceRating: star }),
      }).catch(() => {});

      authFetch(`${API_BASE}/support`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: 'Rating & Feedback',
          message: `User submitted a ${star}-star experience rating on CartPilot.`,
          email: user?.email,
          name: user?.name,
          phone: user?.phone || displayPhone,
        }),
      }).catch(() => {});
    } catch {}

    setRatingSubmitted(true);
    setTimeout(() => {
      setIsRatingModalOpen(false);
      setRatingSubmitted(false);
    }, 1200);
  };

  const [shareSuccess, setShareSuccess] = useState(false);
  const [isFaqOpen, setIsFaqOpen] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  // In-context Email Verification & Auth state
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [verifyMessage, setVerifyMessage] = useState<string | null>(null);
  const [simulatedCode, setSimulatedCode] = useState<string | null>(null);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  // Lock body scroll when any submodal in Account screen is open
  const isAnyAccountModalOpen = Boolean(
    isHelpCenterOpen ||
    isRatingModalOpen ||
    activeInfoModal ||
    isEmailModalOpen
  );
  useScrollLock(isAnyAccountModalOpen);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (resendTimer > 0) {
      timer = setInterval(() => {
        setResendTimer((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendTimer]);

  const handleSendEmailCode = async () => {
    if (!hasRealEmail) {
      onOpenProfileModal();
      return;
    }
    setIsSendingCode(true);
    setVerifyMessage(null);
    const res = await sendEmailVerification();
    setIsSendingCode(false);
    if (res.success) {
      setVerifyMessage(res.message || 'Verification code sent to your email.');
      if (res.simulatedCode) setSimulatedCode(res.simulatedCode);
      setResendTimer(60);
    } else {
      setVerifyMessage(res.error || 'Failed to send verification code.');
    }
  };

  const handleVerifyEmail = async () => {
    if (!verificationCode || verificationCode.trim().length !== 6) {
      setVerifyMessage('Please enter a 6-digit verification code.');
      return;
    }
    setIsVerifying(true);
    const res = await verifyEmailAction(verificationCode.trim());
    setIsVerifying(false);
    if (res.success) {
      setVerifyMessage('Email verified successfully!');
      setTimeout(() => {
        setIsEmailModalOpen(false);
      }, 1200);
    } else {
      setVerifyMessage(res.error || 'Invalid verification code. Please check and try again.');
    }
  };

  const activeOrdersCount = orders.filter(
    (o) => o.status !== 'DELIVERED' && o.status !== 'CANCELLED' && o.status !== 'FAILED'
  ).length;

  const hasRealEmail = Boolean(user?.email && !isPlaceholderEmail(user.email));
  const displayName = user?.name || (hasRealEmail && user?.email ? user.email.split('@')[0] : 'Shopper');
  const displayPhone = user?.phone || '';
  const displayLocality = selectedAddress
    ? selectedAddress.areaLocality || selectedAddress.apartmentStreet || selectedAddress.city
    : 'Patna, Bihar';

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
      q: 'How do daily spending limits work?',
      a: 'Daily spending limits allow you to set grocery budget caps. When active, our smart system keeps your daily orders strictly within budget while preventing unexpected spikes.',
    },
  ];

  return (
    <div className="flex-1 w-full pb-4 lg:pb-6 bg-[#f8faf9] dark:bg-stone-950 text-stone-900 dark:text-stone-100 font-sans">
      {/* ── Top Header Banner ─────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-30 bg-white/95 dark:bg-stone-900/95 backdrop-blur-md py-4 border-b border-stone-200/80 dark:border-stone-800 shadow-xs">
        <div className="page-container flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="font-extrabold text-xl sm:text-2xl text-stone-900 dark:text-white leading-none">
              Account & Settings
            </h1>
          </div>

          <button
            type="button"
            onClick={onToggleTheme}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 text-sm font-bold hover:text-stone-900 dark:hover:text-white transition-colors cursor-pointer"
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4" />}
            <span>{isDark ? 'Light Theme' : 'Dark Theme'}</span>
          </button>
        </div>
      </div>

      {/* ── Main Proportional Desktop Viewport Container ─────────────────────── */}
      <div className="page-container pt-4 sm:pt-6 pb-4 sm:pb-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 lg:gap-8 items-start">
          {/* ── Left Column: Identity, Wallet & Spending Security (4-5 Cols) ─── */}
          <div className="lg:col-span-5 xl:col-span-4 space-y-3.5 sm:space-y-4">
            {/* User Profile Card */}
            <div className="rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 p-4 sm:p-5 shadow-xs">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative flex-shrink-0">
                    <div className="w-14 h-14 rounded-full border-2 border-stone-200 dark:border-stone-700 p-0.5 flex items-center justify-center">
                      <div className="w-full h-full rounded-full bg-stone-900 text-white font-extrabold text-2xl flex items-center justify-center shadow-inner">
                        {userInitial}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={onOpenProfileModal}
                      className="absolute -bottom-0.5 -right-0.5 w-5.5 h-5.5 rounded-full bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 border border-white dark:border-stone-800 flex items-center justify-center shadow-xs cursor-pointer hover:scale-110 transition-transform"
                      title="Update Avatar"
                    >
                      <Camera className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="min-w-0 space-y-0.5">
                    <h2 className="font-extrabold text-base sm:text-lg text-stone-900 dark:text-white truncate">
                      {displayName}
                    </h2>
                    {displayPhone ? (
                      <div className="flex items-center gap-1.5 text-xs text-stone-500 dark:text-stone-400 font-medium truncate">
                        <Smartphone className="w-3.5 h-3.5 flex-shrink-0 text-stone-400" />
                        <span className="truncate">{displayPhone}</span>
                        {user?.isPhoneVerified && (
                          <span className="text-[9px] font-bold text-emerald-800 dark:text-emerald-200 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.2 rounded-full border border-emerald-300 dark:border-emerald-700">
                            Verified
                          </span>
                        )}
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={onOpenProfileModal}
                        className="flex items-center gap-1.5 text-xs text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white cursor-pointer font-semibold group transition-colors"
                      >
                        <Smartphone className="w-3.5 h-3.5 flex-shrink-0 text-stone-400 group-hover:text-stone-700 dark:group-hover:text-stone-300" />
                        <span className="text-stone-500 dark:text-stone-400">No phone linked</span>
                        <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900 transition-colors">
                          + Add Phone
                        </span>
                      </button>
                    )}
                    {hasRealEmail ? (
                      <div className="flex items-center gap-1.5 text-xs text-stone-500 dark:text-stone-400 font-medium truncate">
                        <Mail className="w-3.5 h-3.5 flex-shrink-0 text-stone-400" />
                        <span className="truncate">{user?.email}</span>
                        {user?.isEmailVerified ? (
                          <span className="text-[9px] font-bold text-stone-800 dark:text-stone-200 bg-stone-100 dark:bg-stone-800 px-1.5 py-0.2 rounded-full border border-stone-300 dark:border-stone-700">
                            Verified
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setIsEmailModalOpen(true);
                              handleSendEmailCode();
                            }}
                            className="text-[9px] font-bold text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-950 px-1.5 py-0.2 rounded-full border border-amber-300 dark:border-amber-700 hover:underline cursor-pointer"
                          >
                            Verify
                          </button>
                        )}
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={onOpenProfileModal}
                        className="flex items-center gap-1.5 text-xs text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white cursor-pointer font-medium group transition-colors"
                      >
                        <Mail className="w-3.5 h-3.5 flex-shrink-0 text-stone-400 group-hover:text-stone-700 dark:group-hover:text-stone-300" />
                        <span className="text-stone-500 dark:text-stone-400">No email linked</span>
                        <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900 transition-colors">
                          + Add Email
                        </span>
                      </button>
                    )}
                    <div className="flex items-center gap-1.5 text-xs text-stone-500 dark:text-stone-400 font-medium truncate">
                      <MapPin className="w-3.5 h-3.5 flex-shrink-0 text-stone-400" />
                      <span className="truncate">{displayLocality}</span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onOpenProfileModal}
                  className="w-9 h-9 rounded-xl border border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-300 hover:border-stone-400 hover:text-stone-900 dark:hover:text-white flex items-center justify-center transition-colors cursor-pointer flex-shrink-0 shadow-2xs"
                  title="Edit Profile"
                >
                  <Edit2 className="w-4 h-4 text-stone-600 dark:text-stone-300" />
                </button>
              </div>
            </div>

            {/* CartPilot Wallet Card - Executive Obsidian Monochrome Luxury Style */}
            <div className="rounded-2xl bg-[#09090b] dark:bg-stone-900 border border-stone-800/90 text-white p-4 sm:p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center">
                    <Wallet className="w-4.5 h-4.5 text-white" />
                  </div>
                  <div>
                    <span className="text-[11px] uppercase font-bold tracking-wider text-stone-300 block">
                      CartPilot Wallet
                    </span>
                    <span className="text-[11px] text-stone-400">Instant 1-Tap Checkout</span>
                  </div>
                </div>

                <span className="text-[10px] font-medium bg-white/10 text-stone-300 border border-white/10 px-2.5 py-0.5 rounded-full">
                  Active
                </span>
              </div>

              <div className="space-y-0.5">
                <span className="text-2xl sm:text-3xl font-black font-mono tracking-tight block text-white">
                  ₹{walletBalance.toFixed(2)}
                </span>
                <p className="text-[11px] text-stone-400">
                  Zero transaction fees on daily farm harvest orders.
                </p>
              </div>

              <div className="pt-1">
                <button
                  type="button"
                  onClick={onOpenWallet}
                  className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-stone-100 text-stone-950 font-bold text-xs shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-98"
                >
                  <Wallet className="w-3.5 h-3.5 text-stone-900" />
                  <span>+ Add Money / View Passbook</span>
                </button>
              </div>
            </div>

            {/* Daily Spending Limits Card */}
            <div
              onClick={onOpenRules}
              className="rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 p-3.5 sm:p-4 shadow-xs flex items-center justify-between cursor-pointer hover:border-stone-400 dark:hover:border-stone-600 hover:shadow-xs transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                  <Shield className="w-5 h-5 text-stone-700 dark:text-stone-300" />
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-stone-900 dark:text-white group-hover:text-stone-950 dark:group-hover:text-white transition-colors">
                    Daily Spending Limits
                  </h3>
                  <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                    Set daily grocery budget and auto-order limits
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-stone-400 group-hover:text-stone-600 dark:group-hover:text-stone-200 transition-colors flex-shrink-0" />
            </div>
          </div>

          {/* ── Right Column: Interactive Grid, Coupons & Support (7-8 Cols) ─── */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-4 sm:space-y-5">
            {/* ── Clubbed Account Essentials Hub (Orders, Addresses, Wishlist) ─── */}
            <div className="rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 p-3 sm:p-4 shadow-xs">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-stone-100 dark:border-stone-800/80 px-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500">
                  Quick Actions
                </span>
                {activeOrdersCount > 0 ? (
                  <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-ping" />
                    <span>{activeOrdersCount} Active Order</span>
                  </span>
                ) : (
                  <span className="text-[10px] font-medium text-stone-400 dark:text-stone-500">
                    {orders.length} placed orders
                  </span>
                )}
              </div>

              {/* 3-Column Segmented Action Hub */}
              <div className="grid grid-cols-3 divide-x divide-stone-100 dark:divide-stone-800">
                {/* 1. Orders */}
                <button
                  type="button"
                  onClick={onOpenOrders}
                  className="p-2 sm:p-2.5 flex flex-col items-center text-center hover:bg-stone-50 dark:hover:bg-stone-850/60 rounded-xl transition-all cursor-pointer group active:scale-95"
                >
                  <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-emerald-50 dark:bg-emerald-950/70 text-emerald-600 flex items-center justify-center mb-1 group-hover:scale-105 transition-transform shadow-2xs">
                    <ShoppingBag className="w-5 h-5 fill-emerald-600 text-emerald-600" />
                  </div>
                  <h4 className="font-bold text-xs sm:text-sm text-stone-900 dark:text-white">Orders</h4>
                  <p className="text-[10px] sm:text-xs text-stone-500 dark:text-stone-400 mt-0.5 font-medium">
                    {orders.length} placed
                  </p>
                </button>

                {/* 2. Saved Addresses */}
                <button
                  type="button"
                  onClick={onOpenAddresses}
                  className="p-2 sm:p-2.5 flex flex-col items-center text-center hover:bg-stone-50 dark:hover:bg-stone-850/60 rounded-xl transition-all cursor-pointer group active:scale-95"
                >
                  <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-blue-50 dark:bg-blue-950/70 text-blue-600 flex items-center justify-center mb-1 group-hover:scale-105 transition-transform shadow-2xs">
                    <MapPin className="w-5 h-5 fill-blue-500 text-blue-500" />
                  </div>
                  <h4 className="font-bold text-xs sm:text-sm text-stone-900 dark:text-white">Addresses</h4>
                  <p className="text-[10px] sm:text-xs text-stone-500 dark:text-stone-400 mt-0.5 font-medium">
                    Delivery points
                  </p>
                </button>

                {/* 3. Wishlist */}
                <button
                  type="button"
                  onClick={onOpenWishlist}
                  className="p-2 sm:p-2.5 flex flex-col items-center text-center hover:bg-stone-50 dark:hover:bg-stone-850/60 rounded-xl transition-all cursor-pointer group active:scale-95"
                >
                  <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-rose-50 dark:bg-rose-950/70 text-rose-500 flex items-center justify-center mb-1 group-hover:scale-105 transition-transform shadow-2xs">
                    <Heart className="w-5 h-5 fill-rose-500 text-rose-500" />
                  </div>
                  <h4 className="font-bold text-xs sm:text-sm text-stone-900 dark:text-white">Wishlist</h4>
                  <p className="text-[10px] sm:text-xs text-stone-500 dark:text-stone-400 mt-0.5 font-medium">
                    {favoritesCount} saved
                  </p>
                </button>
              </div>
            </div>

            {/* ── 2-Column Compact Secondary Grid (Coupons & Offers + Help & Support) ─── */}
            <div className="grid grid-cols-2 gap-2.5 sm:gap-4">
              {/* Coupons */}
              <button
                type="button"
                onClick={onOpenCoupons}
                className="rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 p-3 sm:p-3.5 shadow-xs flex items-center gap-2.5 sm:gap-3 hover:border-purple-500/50 hover:shadow-xs transition-all cursor-pointer group text-left active:scale-98"
              >
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                  <Ticket className="w-4.5 h-4.5 sm:w-5 sm:h-5 fill-purple-600 text-purple-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-bold text-xs sm:text-sm text-stone-900 dark:text-white group-hover:text-purple-600 transition-colors truncate">
                    Coupons & Offers
                  </h3>
                  <p className="text-[10px] sm:text-xs text-stone-500 dark:text-stone-400 truncate">
                    Save up to ₹100
                  </p>
                </div>
              </button>

              {/* Help & Support */}
              <button
                type="button"
                onClick={() => setIsHelpCenterOpen(true)}
                className="rounded-2xl bg-white dark:bg-zinc-900 border border-stone-200/80 dark:border-zinc-800 p-3 sm:p-3.5 shadow-xs flex items-center gap-2.5 sm:gap-3 hover:border-emerald-500/50 hover:shadow-xs transition-all cursor-pointer group text-left active:scale-98"
              >
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-500/15 dark:bg-emerald-500/25 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                  <Headphones className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-emerald-600 dark:text-emerald-300" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-bold text-xs sm:text-sm text-stone-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors truncate">
                    Help & Support
                  </h3>
                  <p className="text-[10px] sm:text-xs text-stone-500 dark:text-zinc-400 truncate">
                    Direct assistance
                  </p>
                </div>
              </button>
            </div>

            {/* Transparency, Policy & Information Center */}
            <div className="rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 p-4 sm:p-5 shadow-xs space-y-3">
              <h3 className="font-extrabold text-xs text-stone-400 uppercase tracking-wider">
                Support, Transparency & Legal
              </h3>

              <div className="divide-y divide-stone-100 dark:divide-stone-800">
                {/* Replay Guided Tour */}
                {onReplayTour && (
                  <button
                    type="button"
                    onClick={onReplayTour}
                    className="w-full py-3.5 flex items-center justify-between text-left hover:text-stone-900 dark:hover:text-white transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400 group-hover:scale-105 transition-transform flex-shrink-0" />
                      <div>
                        <span className="font-medium text-sm text-stone-800 dark:text-stone-200 group-hover:text-stone-950 dark:group-hover:text-white block">
                          Replay Guided Tour
                        </span>
                        <span className="text-xs text-stone-400 dark:text-stone-500 block">
                          Refresher on search, AI shopping & spend rules
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-stone-400 group-hover:text-stone-700 dark:group-hover:text-stone-300 transition-colors flex-shrink-0" />
                  </button>
                )}

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
                  className="w-full py-3.5 flex items-center justify-between text-left hover:text-stone-900 dark:hover:text-white transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-stone-400 group-hover:text-stone-600 dark:group-hover:text-stone-300 transition-colors flex-shrink-0" />
                    <span className="font-medium text-sm text-stone-800 dark:text-stone-200 group-hover:text-stone-950 dark:group-hover:text-white">
                      Privacy Policy & Data Security
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-stone-400 group-hover:text-stone-700 dark:group-hover:text-stone-300 transition-colors flex-shrink-0" />
                </button>

                {/* Terms & Conditions */}
                <button
                  type="button"
                  onClick={() =>
                    setActiveInfoModal({
                      title: 'Terms & Conditions',
                      content:
                        'CartPilot provides fresh grocery produce and pantry supplies. Deliveries are fulfilled within scheduled morning and evening slots. In the rare event of damaged produce, instant wallet compensation is issued with zero dispute hurdles.',
                    })
                  }
                  className="w-full py-3.5 flex items-center justify-between text-left hover:text-stone-900 dark:hover:text-white transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <FileCheck2 className="w-5 h-5 text-stone-400 group-hover:text-stone-600 dark:group-hover:text-stone-300 transition-colors flex-shrink-0" />
                    <span className="font-medium text-sm text-stone-800 dark:text-stone-200 group-hover:text-stone-950 dark:group-hover:text-white">
                      Terms of Service & Delivery Commitment
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-stone-400 group-hover:text-stone-700 dark:group-hover:text-stone-300 transition-colors flex-shrink-0" />
                </button>

                {/* About Us */}
                <button
                  type="button"
                  onClick={() =>
                    setActiveInfoModal({
                      title: 'About CartPilot',
                      content:
                        'CartPilot is India\'s premier agentic grocery commerce platform. By combining farm-to-door direct sourcing with autonomous AI meal planning and spending mandates, CartPilot delivers fresh essentials with scheduled delivery windows without the hassle of manual reordering.',
                    })
                  }
                  className="w-full py-3.5 flex items-center justify-between text-left hover:text-stone-900 dark:hover:text-white transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <Info className="w-5 h-5 text-stone-400 group-hover:text-stone-600 dark:group-hover:text-stone-300 transition-colors flex-shrink-0" />
                    <span className="font-medium text-sm text-stone-800 dark:text-stone-200 group-hover:text-stone-950 dark:group-hover:text-white">
                      About CartPilot & Farm Direct Model
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-stone-400 group-hover:text-stone-700 dark:group-hover:text-stone-300 transition-colors flex-shrink-0" />
                </button>

                {/* Share App */}
                <button
                  type="button"
                  onClick={handleShareApp}
                  className="w-full py-3.5 flex items-center justify-between text-left hover:text-stone-900 dark:hover:text-white transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <Share2 className="w-5 h-5 text-stone-400 group-hover:text-stone-600 dark:group-hover:text-stone-300 transition-colors flex-shrink-0" />
                    <span className="font-medium text-sm text-stone-800 dark:text-stone-200 group-hover:text-stone-950 dark:group-hover:text-white">
                      Share CartPilot with Friends & Family
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {shareSuccess && (
                      <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                        Link Copied!
                      </span>
                    )}
                    <ChevronRight className="w-4 h-4 text-stone-400 group-hover:text-stone-700 dark:group-hover:text-stone-300 transition-colors flex-shrink-0" />
                  </div>
                </button>

                {/* FAQs Parent Accordion */}
                <div className="py-0.5">
                  <button
                    type="button"
                    onClick={() => setIsFaqOpen(!isFaqOpen)}
                    className="w-full py-3.5 flex items-center justify-between text-left hover:text-stone-900 dark:hover:text-white transition-colors cursor-pointer group"
                    aria-expanded={isFaqOpen}
                  >
                    <div className="flex items-center gap-3">
                      <HelpCircle className="w-5 h-5 text-stone-400 group-hover:text-stone-600 dark:group-hover:text-stone-300 transition-colors flex-shrink-0" />
                      <div>
                        <span className="font-medium text-sm text-stone-800 dark:text-stone-200 group-hover:text-stone-950 dark:group-hover:text-white block">
                          Frequently Asked Questions
                        </span>
                        <span className="text-xs text-stone-400 dark:text-stone-500 block">
                          Delivery timings, order policies & spending limits
                        </span>
                      </div>
                    </div>
                    <ChevronDown
                      className={`w-4 h-4 text-stone-400 group-hover:text-stone-700 dark:group-hover:text-stone-300 transition-transform duration-200 flex-shrink-0 ${
                        isFaqOpen ? 'rotate-180 text-stone-900 dark:text-white' : ''
                      }`}
                    />
                  </button>

                  {/* Nested Question Accordions */}
                  {isFaqOpen && (
                    <div className="space-y-2 pt-1 pb-3 pl-1 sm:pl-2 animate-in fade-in-50 duration-200">
                      {FAQS.map((faq, idx) => {
                        const isExpanded = openFaqIndex === idx;
                        return (
                          <div
                            key={idx}
                            className="rounded-2xl border border-stone-200/90 dark:border-stone-800 overflow-hidden shadow-2xs transition-all"
                          >
                            {/* Question Header */}
                            <button
                              type="button"
                              onClick={() => setOpenFaqIndex(isExpanded ? null : idx)}
                              className={`w-full p-3.5 sm:p-4 flex items-center justify-between text-left text-xs sm:text-sm font-semibold transition-colors cursor-pointer ${
                                isExpanded
                                  ? 'bg-emerald-700 text-white dark:bg-emerald-600 dark:text-white'
                                  : 'bg-stone-50 text-stone-900 hover:bg-stone-100 dark:bg-stone-900 dark:text-white dark:hover:bg-stone-850'
                              }`}
                            >
                              <span className="pr-3 leading-snug text-stone-900 dark:text-white">{faq.q}</span>
                              <ChevronDown
                                className={`w-4 h-4 transition-transform duration-200 flex-shrink-0 ${
                                  isExpanded
                                    ? 'rotate-180 text-white'
                                    : 'text-stone-400 dark:text-stone-300'
                                }`}
                              />
                            </button>

                            {/* Answer Body */}
                            {isExpanded && (
                              <div className="bg-white text-stone-700 dark:bg-stone-900 dark:text-stone-300 px-4 py-3.5 text-xs sm:text-sm leading-relaxed border-t border-stone-200/80 dark:border-stone-800 animate-in fade-in-50 duration-150">
                                {faq.a}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Rate App */}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedRating(savedRating || 5);
                    setIsRatingModalOpen(true);
                  }}
                  className="w-full py-3.5 flex items-center justify-between text-left hover:text-stone-900 dark:hover:text-white transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <Star className="w-5 h-5 text-amber-500 fill-amber-500 flex-shrink-0" />
                    <div>
                      <span className="font-medium text-sm text-stone-800 dark:text-stone-200 group-hover:text-stone-950 dark:group-hover:text-white block">
                        Rate CartPilot
                      </span>
                      <span className="text-xs text-stone-400 dark:text-stone-500 block">
                        Share your experience with our team
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {savedRating ? (
                      <span className="flex items-center gap-1 text-xs font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2.5 py-0.5 rounded-full border border-amber-200 dark:border-amber-900/60">
                        <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                        <span>{savedRating}.0</span>
                      </span>
                    ) : (
                      <span className="text-xs text-stone-400 font-normal">
                        Tap to rate
                      </span>
                    )}
                    <ChevronRight className="w-4 h-4 text-stone-400 group-hover:text-stone-700 dark:group-hover:text-stone-300 transition-colors flex-shrink-0" />
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── Sign Out Dedicated Bottom Section ──────────────────────────────── */}
        <div className="mt-4 pt-2 border-t border-stone-200/60 dark:border-stone-800/60">
          <button
            type="button"
            onClick={onLogout}
            className="w-full py-3.5 px-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/90 dark:border-stone-800 text-stone-700 dark:text-stone-300 hover:text-rose-600 dark:hover:text-rose-400 hover:border-rose-300 dark:hover:border-rose-900/60 font-semibold text-xs sm:text-sm flex items-center justify-center gap-2.5 shadow-2xs transition-all cursor-pointer group active:scale-98"
          >
            <LogOut className="w-4 h-4 text-stone-400 group-hover:text-rose-500 transition-colors" />
            <span>Log Out of CartPilot</span>
          </button>
        </div>
      </div>

      {/* ── Help Center Modal ──────────────────────────────────────────────── */}
      {isHelpCenterOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-white dark:bg-stone-900 rounded-3xl shadow-2xl border border-stone-200 dark:border-stone-800 p-6 sm:p-7 space-y-5 animate-in zoom-in-95 max-h-[92vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 flex items-center justify-center">
                  <Headphones className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-lg text-stone-900 dark:text-white">
                    Help & Support
                  </h3>
                  <p className="text-xs text-stone-400">Direct admin assistance & inquiry desk</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsHelpCenterOpen(false);
                  setSupportSubmitted(false);
                }}
                className="w-9 h-9 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-500 hover:text-stone-900 dark:hover:text-white flex items-center justify-center cursor-pointer transition-colors"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Direct Admin Email Card */}
            <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center flex-shrink-0">
                  <Mail className="w-4.5 h-4.5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                    Direct Email Support
                  </p>
                  <p className="text-xs sm:text-sm font-semibold text-stone-900 dark:text-stone-100 truncate">
                    {adminEmail}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(adminEmail);
                    setEmailCopied(true);
                    setTimeout(() => setEmailCopied(false), 2000);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs font-bold text-stone-700 dark:text-stone-200 hover:border-emerald-500 flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Copy admin email"
                >
                  {emailCopied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-600">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-stone-400" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Quick Crisp Support Form */}
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!supportMessage.trim() || isSubmittingSupport) return;

                setIsSubmittingSupport(true);
                setSupportError(null);
                setSupportSubmitted(false);

                try {
                  const res = await authFetch(`${API_BASE}/support`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      topic: supportCategory,
                      message: supportMessage.trim(),
                      name: user?.name,
                      email: user?.email,
                      phone: user?.phone || displayPhone,
                    }),
                  });

                  const data = await res.json();
                  if (!res.ok) {
                    throw new Error(data?.message || 'Failed to submit support inquiry. Please try again.');
                  }

                  setSupportTicketId(data?.data?.ticketId || 'TICK-RECEIVED');
                  setSupportSubmitted(true);
                  setSupportMessage('');
                } catch (err: any) {
                  console.error('Support ticket submission error:', err);
                  setSupportError(err?.message || 'Network error submitting inquiry. Please try again or copy the email directly.');
                } finally {
                  setIsSubmittingSupport(false);
                }
              }}
              className="space-y-3.5"
            >
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-stone-700 dark:text-stone-300 flex items-center justify-between">
                  <span>Inquiry Topic</span>
                  <span className="text-[11px] font-normal text-stone-400">Select reason</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    '📦 Order & Delivery',
                    '💳 Payment & Wallet',
                    '🥬 Item Quality',
                    '❓ General Question',
                  ].map((topic) => (
                    <button
                      key={topic}
                      type="button"
                      onClick={() => setSupportCategory(topic)}
                      className={`px-3 py-2 rounded-xl text-xs font-bold text-left border transition-all cursor-pointer ${
                        supportCategory === topic
                          ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-500 text-emerald-800 dark:text-emerald-300 shadow-2xs'
                          : 'bg-stone-50 dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:border-stone-300'
                      }`}
                    >
                      {topic}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-stone-700 dark:text-stone-300">
                  Your Message or Question
                </label>
                <textarea
                  rows={3}
                  value={supportMessage}
                  onChange={(e) => setSupportMessage(e.target.value)}
                  placeholder="Ask your question or describe your issue here..."
                  className="w-full p-3 rounded-2xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs sm:text-sm text-stone-900 dark:text-white placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 resize-none transition-all"
                  required
                />
              </div>

              {supportSubmitted && (
                <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 text-xs space-y-1.5 animate-in fade-in">
                  <div className="flex items-center gap-2 font-bold text-emerald-800 dark:text-emerald-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                    <span>Ticket #{supportTicketId} Created Successfully!</span>
                  </div>
                  <p className="text-[11.5px] text-emerald-700 dark:text-emerald-300/90 leading-relaxed">
                    Your inquiry has been recorded and delivered to <strong>{adminEmail}</strong>. Our team will review your ticket and reply directly to <strong>{user?.email || 'your registered email'}</strong>.
                  </p>
                </div>
              )}

              {supportError && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs flex items-center gap-2 animate-in fade-in">
                  <X className="w-4 h-4 text-rose-600 flex-shrink-0" />
                  <span>{supportError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmittingSupport || !supportMessage.trim()}
                className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm shadow-emerald-950/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer active:scale-98"
              >
                {isSubmittingSupport ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Submitting Ticket to Support...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Submit Inquiry to Admin</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── Rate Experience Modal ──────────────────────────────────────────── */}
      {isRatingModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-white dark:bg-stone-900 rounded-3xl shadow-2xl border border-stone-200 dark:border-stone-800 p-7 text-center space-y-5 animate-in zoom-in-95">
            <div className="w-16 h-16 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-500 mx-auto flex items-center justify-center">
              <Star className="w-8 h-8 fill-amber-500 text-amber-500" />
            </div>

            {ratingSubmitted ? (
              <div className="space-y-3 py-4">
                <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
                <h4 className="font-extrabold text-lg text-stone-900 dark:text-white">
                  Thank You for Your Feedback!
                </h4>
                <p className="text-sm text-stone-500">
                  Your review directly empowers our local organic farmers and morning delivery riders.
                </p>
              </div>
            ) : (
              <>
                <div className="space-y-1.5">
                  <h3 className="font-extrabold text-lg sm:text-xl text-stone-900 dark:text-white">
                    Rate Your CartPilot Experience
                  </h3>
                  <p className="text-sm text-stone-500">
                    How satisfied are you with our morning delivery, freshness & AI agent?
                  </p>
                </div>

                <div className="flex items-center justify-center gap-3 py-3">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setSelectedRating(star)}
                      className="p-1 cursor-pointer hover:scale-125 transition-transform"
                    >
                      <Star
                        className={`w-9 h-9 ${
                          star <= selectedRating
                            ? 'text-amber-500 fill-amber-500'
                            : 'text-stone-300 dark:text-stone-700'
                        }`}
                      />
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsRatingModalOpen(false)}
                    className="flex-1 py-3 rounded-2xl border border-stone-200 dark:border-stone-700 text-sm font-semibold text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleRatingSubmit}
                    className="flex-1 py-3 rounded-2xl bg-stone-900 hover:bg-black dark:bg-white dark:text-stone-950 dark:hover:bg-stone-100 text-white text-sm font-semibold shadow-xs transition-all cursor-pointer active:scale-98"
                  >
                    Submit Feedback
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Info Sheet Modal ───────────────────────────────────────────────── */}
      {activeInfoModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-xl bg-white dark:bg-stone-900 rounded-3xl shadow-2xl border border-stone-200 dark:border-stone-800 p-7 space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-4">
              <h3 className="font-extrabold text-lg text-stone-900 dark:text-white">
                {activeInfoModal.title}
              </h3>
              <button
                type="button"
                onClick={() => setActiveInfoModal(null)}
                className="w-9 h-9 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-500 flex items-center justify-center cursor-pointer hover:text-stone-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-sm text-stone-600 dark:text-stone-300 leading-relaxed max-h-96 overflow-y-auto pr-2">
              {activeInfoModal.content}
            </div>

            <button
              type="button"
              onClick={() => setActiveInfoModal(null)}
              className="w-full py-3.5 rounded-2xl bg-stone-900 hover:bg-black dark:bg-white dark:text-stone-950 dark:hover:bg-stone-100 text-white text-sm font-semibold cursor-pointer shadow-xs transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* ── Email Verification Modal ─────────────────────────────────────── */}
      {isEmailModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-white dark:bg-stone-900 rounded-3xl shadow-2xl border border-stone-200 dark:border-stone-800 p-6 sm:p-7 space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-stone-900 dark:text-white leading-tight">
                    Verify Your Email
                  </h3>
                  <p className="text-xs text-stone-500">6-digit verification code</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEmailModalOpen(false)}
                className="w-8 h-8 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-500 flex items-center justify-center cursor-pointer hover:text-stone-900"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
              We send an OTP to <span className="font-bold text-stone-900 dark:text-white">{user?.email}</span>. Verifying your email is required to checkout and protects your account.
            </p>

            {verifyMessage && (
              <div className="p-3 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-200 text-xs font-semibold">
                {verifyMessage}
              </div>
            )}

            <div className="space-y-3">
              <div className="relative">
                <KeyRound className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  maxLength={6}
                  placeholder="Enter 6-digit code"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="w-full pl-9 pr-3 py-3 text-sm font-mono font-bold tracking-widest rounded-xl bg-stone-50 dark:bg-stone-850 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {simulatedCode && (
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-stone-500 font-mono">Dev code:</span>
                  <button
                    type="button"
                    onClick={() => setVerificationCode(simulatedCode)}
                    className="text-[11px] font-mono font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 rounded-md hover:underline cursor-pointer"
                  >
                    Auto-fill {simulatedCode}
                  </button>
                </div>
              )}

              <button
                type="button"
                onClick={handleVerifyEmail}
                disabled={isVerifying || verificationCode.length !== 6}
                className="w-full py-3.5 rounded-2xl bg-stone-900 hover:bg-black dark:bg-white dark:text-stone-950 dark:hover:bg-stone-100 text-white font-bold text-sm shadow-xs transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isVerifying ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verifying Code…</span>
                  </>
                ) : (
                  <span>Verify Email Address</span>
                )}
              </button>

              <div className="flex items-center justify-between text-xs pt-1 text-stone-500">
                <button
                  type="button"
                  onClick={handleSendEmailCode}
                  disabled={isSendingCode || resendTimer > 0}
                  className="text-emerald-700 dark:text-emerald-400 font-bold hover:underline cursor-pointer disabled:opacity-50"
                >
                  {isSendingCode ? 'Sending…' : resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend Code'}
                </button>
                <span>Code valid for 15 minutes</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
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
  Loader2,
  KeyRound,
} from 'lucide-react';
import { OrderData, UserAddress } from '../../types';

interface AccountScreenProps {
  user: {
    id?: string;
    name?: string;
    email?: string;
    phone?: string;
    role?: string;
    isEmailVerified?: boolean;
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

  // In-context Email Verification state
  const { sendEmailVerification, verifyEmail: verifyEmailAction } = useAuth();
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [verifyMessage, setVerifyMessage] = useState<string | null>(null);
  const [simulatedCode, setSimulatedCode] = useState<string | null>(null);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

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
    <div className="flex-1 overflow-y-auto pb-20 bg-[#f8faf9] dark:bg-stone-950 text-stone-900 dark:text-stone-100 font-sans">
      {/* ── Top Header Banner ─────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-30 bg-white/95 dark:bg-stone-900/95 backdrop-blur-md py-4 border-b border-stone-200/80 dark:border-stone-800 shadow-xs">
        <div className="page-container flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="font-extrabold text-xl sm:text-2xl text-stone-900 dark:text-white leading-none">
              Account & Settings
            </h1>
            <span className="text-xs font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 px-3 py-1 rounded-full border border-emerald-300 dark:border-emerald-700">
              Verified Shopper
            </span>
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
      <div className="page-container pt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
          {/* ── Left Column: Identity, Wallet & Spending Security (4-5 Cols) ─── */}
          <div className="lg:col-span-5 xl:col-span-4 space-y-6">
            {/* User Profile Card */}
            <div className="rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 p-6 sm:p-7 shadow-xs space-y-5">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="relative flex-shrink-0">
                    <div className="w-20 h-20 rounded-full border-3 border-emerald-600 dark:border-emerald-500 p-1 flex items-center justify-center">
                      <div className="w-full h-full rounded-full bg-emerald-700 text-white font-extrabold text-3xl flex items-center justify-center shadow-inner">
                        {userInitial}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={onOpenProfileModal}
                      className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-emerald-600 text-white border-2 border-white dark:border-stone-900 flex items-center justify-center shadow-xs cursor-pointer hover:scale-110 transition-transform"
                      title="Update Avatar"
                    >
                      <Camera className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="min-w-0 space-y-1">
                    <h2 className="font-extrabold text-lg sm:text-xl text-stone-900 dark:text-white truncate">
                      {displayName}
                    </h2>
                    <div className="flex items-center gap-2 text-sm text-stone-500 dark:text-stone-400 font-medium truncate">
                      <Smartphone className="w-4 h-4 flex-shrink-0 text-stone-400" />
                      <span className="truncate">{displayPhone}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-stone-500 dark:text-stone-400 font-medium truncate">
                      <Mail className="w-4 h-4 flex-shrink-0 text-stone-400" />
                      <span className="truncate">{user?.email || 'shopper@cartpilot.local'}</span>
                      {user?.isEmailVerified ? (
                        <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-700">
                          Verified
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setIsEmailModalOpen(true);
                            handleSendEmailCode();
                          }}
                          className="text-[10px] font-bold text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-950 px-2 py-0.5 rounded-full border border-amber-300 dark:border-amber-700 hover:underline cursor-pointer"
                        >
                          Verify Now
                        </button>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-stone-500 dark:text-stone-400 font-medium truncate">
                      <MapPin className="w-4 h-4 flex-shrink-0 text-stone-400" />
                      <span className="truncate">{displayLocality}</span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onOpenProfileModal}
                  className="w-11 h-11 rounded-2xl border border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-300 hover:border-emerald-500 hover:text-emerald-600 flex items-center justify-center transition-colors cursor-pointer flex-shrink-0 shadow-2xs"
                  title="Edit Profile"
                >
                  <Edit2 className="w-5 h-5 text-emerald-600" />
                </button>
              </div>

              <div className="pt-2 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between text-xs text-stone-500">
                <span>Account Status</span>
                <span className="font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Active · 100% Veg Assurance
                </span>
              </div>
            </div>

            {/* CartPilot Wallet Card */}
            <div className="rounded-3xl bg-gradient-to-br from-emerald-700 via-emerald-800 to-emerald-950 text-white p-6 sm:p-7 shadow-lg shadow-emerald-900/20 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center">
                    <Wallet className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <span className="text-xs uppercase font-extrabold tracking-wider text-emerald-200 block">
                      CartPilot Wallet
                    </span>
                    <span className="text-xs text-emerald-100/80">Instant 1-Tap Checkout</span>
                  </div>
                </div>

                <span className="text-xs font-bold bg-white/20 px-3 py-1 rounded-full backdrop-blur-md">
                  Active
                </span>
              </div>

              <div className="space-y-1">
                <span className="text-3xl sm:text-4xl font-black font-mono tracking-tight block">
                  ₹{walletBalance.toFixed(2)}
                </span>
                <p className="text-xs text-emerald-100/80">
                  Zero transaction fees on daily farm harvest orders.
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={onOpenWallet}
                  className="w-full py-3 px-5 rounded-2xl bg-white hover:bg-stone-50 text-emerald-950 font-extrabold text-sm shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <Wallet className="w-4 h-4 text-emerald-700" />
                  <span>+ Add Money / View Passbook</span>
                </button>
              </div>
            </div>

            {/* Spending Rules & Mandate Card */}
            <div
              onClick={onOpenRules}
              className="rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 p-5 sm:p-6 shadow-xs flex items-center justify-between cursor-pointer hover:border-purple-500/50 hover:shadow-md transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                  <Shield className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-stone-900 dark:text-white group-hover:text-purple-600 transition-colors">
                    Spending Rules & Mandates
                  </h3>
                  <p className="text-sm text-stone-500 dark:text-stone-400">
                    Auto-approve ceiling, daily budget caps & anomaly guards
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-stone-400 group-hover:text-purple-600 transition-colors flex-shrink-0" />
            </div>

            {/* AI Engine & API Integrations Card */}
            {onOpenIntegrations && (
              <div
                onClick={onOpenIntegrations}
                className="rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 p-5 sm:p-6 shadow-xs flex items-center justify-between cursor-pointer hover:border-emerald-500/50 hover:shadow-md transition-all group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                    <Cpu className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base text-stone-900 dark:text-white group-hover:text-emerald-600 transition-colors">
                      AI Engine & API Integrations
                    </h3>
                    <p className="text-sm text-stone-500 dark:text-stone-400">
                      Gemini model routing, live agent keys & MCP sidecars
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-stone-400 group-hover:text-emerald-600 transition-colors flex-shrink-0" />
              </div>
            )}

            {/* Sign Out Card */}
            <button
              type="button"
              onClick={onLogout}
              className="w-full py-4 px-6 rounded-2xl bg-white dark:bg-stone-900 border border-rose-200 dark:border-rose-900/60 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 font-extrabold text-sm flex items-center justify-center gap-2.5 shadow-xs transition-colors cursor-pointer"
            >
              <LogOut className="w-4.5 h-4.5" />
              <span>Log Out of CartPilot</span>
            </button>
          </div>

          {/* ── Right Column: Interactive Grid, Coupons & Support (7-8 Cols) ─── */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-6">
            {/* 3-Card Primary Actions Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
              {/* Orders */}
              <button
                type="button"
                onClick={onOpenOrders}
                className="rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 p-6 shadow-xs flex flex-col items-start justify-between text-left hover:border-emerald-500/50 hover:shadow-md transition-all cursor-pointer group relative min-h-[160px]"
              >
                {activeOrdersCount > 0 && (
                  <span className="absolute top-4 right-4 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                    <span className="w-2 h-2 rounded-full bg-emerald-600 animate-ping" />
                    <span>Active</span>
                  </span>
                )}
                <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                  <ShoppingBag className="w-7 h-7 fill-emerald-600 text-emerald-600" />
                </div>
                <div>
                  <h3 className="font-extrabold text-lg text-stone-900 dark:text-white">Orders</h3>
                  <p className="text-sm text-stone-500 dark:text-stone-400 mt-0.5">
                    {orders.length} placed orders & live tracking
                  </p>
                </div>
              </button>

              {/* Saved Addresses */}
              <button
                type="button"
                onClick={onOpenAddresses}
                className="rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 p-6 shadow-xs flex flex-col items-start justify-between text-left hover:border-emerald-500/50 hover:shadow-md transition-all cursor-pointer group min-h-[160px]"
              >
                <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                  <MapPin className="w-7 h-7 fill-blue-500 text-blue-500" />
                </div>
                <div>
                  <h3 className="font-extrabold text-lg text-stone-900 dark:text-white">
                    Saved Addresses
                  </h3>
                  <p className="text-sm text-stone-500 dark:text-stone-400 mt-0.5">
                    Manage home & work delivery points
                  </p>
                </div>
              </button>

              {/* Favorites / Wishlist */}
              <button
                type="button"
                onClick={onOpenWishlist}
                className="rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 p-6 shadow-xs flex flex-col items-start justify-between text-left hover:border-emerald-500/50 hover:shadow-md transition-all cursor-pointer group min-h-[160px]"
              >
                <div className="w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-500 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                  <Heart className="w-7 h-7 fill-rose-500 text-rose-500" />
                </div>
                <div>
                  <h3 className="font-extrabold text-lg text-stone-900 dark:text-white">
                    Wishlist & Favorites
                  </h3>
                  <p className="text-sm text-stone-500 dark:text-stone-400 mt-0.5">
                    Quick 1-tap reordering bookmarks
                  </p>
                </div>
              </button>
            </div>

            {/* 2-Card Secondary Actions Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              {/* Coupons */}
              <button
                type="button"
                onClick={onOpenCoupons}
                className="rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 p-6 shadow-xs flex items-center gap-4 hover:border-emerald-500/50 hover:shadow-md transition-all cursor-pointer group text-left"
              >
                <div className="w-14 h-14 rounded-2xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                  <Ticket className="w-7 h-7 fill-purple-600 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base sm:text-lg text-stone-900 dark:text-white group-hover:text-emerald-700 transition-colors">
                    Coupons & Offers
                  </h3>
                  <p className="text-sm text-stone-500 dark:text-stone-400">
                    Apply promo codes & save up to ₹100
                  </p>
                </div>
              </button>

              {/* Help Center */}
              <button
                type="button"
                onClick={() => setIsHelpCenterOpen(true)}
                className="rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 p-6 shadow-xs flex items-center gap-4 hover:border-emerald-500/50 hover:shadow-md transition-all cursor-pointer group text-left"
              >
                <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                  <Headphones className="w-7 h-7 text-emerald-700" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base sm:text-lg text-stone-900 dark:text-white group-hover:text-emerald-700 transition-colors">
                    24/7 Help Center
                  </h3>
                  <p className="text-sm text-stone-500 dark:text-stone-400">
                    Direct WhatsApp & toll-free customer helpline
                  </p>
                </div>
              </button>
            </div>

            {/* Transparency, Policy & Information Center */}
            <div className="rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 p-6 shadow-xs space-y-4">
              <h3 className="font-extrabold text-xs text-stone-400 uppercase tracking-wider">
                Support, Transparency & Legal
              </h3>

              <div className="divide-y divide-stone-100 dark:divide-stone-800">
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
                  className="w-full py-4 flex items-center justify-between text-left hover:text-emerald-700 transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-stone-400 group-hover:text-emerald-600 transition-colors" />
                    <span className="font-bold text-sm text-stone-800 dark:text-stone-200 group-hover:text-emerald-700">
                      Privacy Policy & Data Security
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-stone-400 group-hover:text-emerald-600 transition-colors" />
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
                  className="w-full py-4 flex items-center justify-between text-left hover:text-emerald-700 transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <FileCheck2 className="w-5 h-5 text-stone-400 group-hover:text-emerald-600 transition-colors" />
                    <span className="font-bold text-sm text-stone-800 dark:text-stone-200 group-hover:text-emerald-700">
                      Terms of Service & Delivery Commitment
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-stone-400 group-hover:text-emerald-600 transition-colors" />
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
                  className="w-full py-4 flex items-center justify-between text-left hover:text-emerald-700 transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <Info className="w-5 h-5 text-stone-400 group-hover:text-emerald-600 transition-colors" />
                    <span className="font-bold text-sm text-stone-800 dark:text-stone-200 group-hover:text-emerald-700">
                      About CartPilot & Farm Direct Model
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-stone-400 group-hover:text-emerald-600 transition-colors" />
                </button>

                {/* Share App */}
                <button
                  type="button"
                  onClick={handleShareApp}
                  className="w-full py-4 flex items-center justify-between text-left hover:text-emerald-700 transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <Share2 className="w-5 h-5 text-stone-400 group-hover:text-emerald-600 transition-colors" />
                    <span className="font-bold text-sm text-stone-800 dark:text-stone-200 group-hover:text-emerald-700">
                      Share CartPilot with Friends & Family
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {shareSuccess && (
                      <span className="text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-2.5 py-0.5 rounded-full">
                        Link Copied!
                      </span>
                    )}
                    <ChevronRight className="w-4 h-4 text-stone-400 group-hover:text-emerald-600 transition-colors" />
                  </div>
                </button>

                {/* FAQs Accordion */}
                <div className="py-4 space-y-3">
                  <div className="flex items-center gap-3 text-stone-800 dark:text-stone-200">
                    <HelpCircle className="w-5 h-5 text-stone-400" />
                    <span className="font-bold text-sm">Frequently Asked Questions</span>
                  </div>

                  <div className="space-y-2 pt-1">
                    {FAQS.map((faq, idx) => (
                      <div
                        key={idx}
                        className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-stone-50/60 dark:bg-stone-850 overflow-hidden"
                      >
                        <button
                          type="button"
                          onClick={() => setOpenFaqIndex(openFaqIndex === idx ? null : idx)}
                          className="w-full p-3.5 sm:p-4 flex items-center justify-between text-left text-sm font-semibold text-stone-800 dark:text-stone-200 cursor-pointer"
                        >
                          <span>{faq.q}</span>
                          <ChevronDown
                            className={`w-4 h-4 text-stone-400 transition-transform ${
                              openFaqIndex === idx ? 'rotate-180 text-emerald-600' : ''
                            }`}
                          />
                        </button>
                        {openFaqIndex === idx && (
                          <div className="px-4 pb-4 text-sm text-stone-600 dark:text-stone-300 leading-relaxed border-t border-stone-200 dark:border-stone-800 pt-3">
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
                  className="w-full py-4 flex items-center justify-between text-left hover:text-emerald-700 transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                    <span className="font-bold text-sm text-stone-800 dark:text-stone-200 group-hover:text-emerald-700">
                      Rate Your CartPilot Experience
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-amber-600 font-extrabold">
                    <span>5.0 ★ Rating</span>
                    <ChevronRight className="w-4 h-4 text-stone-400 group-hover:text-emerald-600 transition-colors" />
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Help Center Modal ──────────────────────────────────────────────── */}
      {isHelpCenterOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-white dark:bg-stone-900 rounded-3xl shadow-2xl border border-stone-200 dark:border-stone-800 p-7 space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <Headphones className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-lg text-stone-900 dark:text-white">
                    CartPilot Customer Support
                  </h3>
                  <p className="text-xs text-stone-400">Available 24x7 for all deliveries & queries</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsHelpCenterOpen(false)}
                className="w-9 h-9 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-500 flex items-center justify-center cursor-pointer hover:text-stone-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm text-stone-600 dark:text-stone-300 leading-relaxed">
              Have questions regarding morning delivery timings, missing produce, or wallet credits? Our customer assistance desk is online 24/7.
            </p>

            <div className="space-y-3">
              <a
                href="mailto:support@cartpilot.in"
                className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 flex items-center gap-3.5 text-sm font-bold text-stone-800 dark:text-stone-200 hover:border-emerald-500 transition-colors"
              >
                <Mail className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                <div>
                  <span>Email Support Desk</span>
                  <p className="text-xs text-stone-400 font-normal">support@cartpilot.in (Response within 30 min)</p>
                </div>
              </a>

              <a
                href="tel:1800123456"
                className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 flex items-center gap-3.5 text-sm font-bold text-stone-800 dark:text-stone-200 hover:border-emerald-500 transition-colors"
              >
                <Phone className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                <div>
                  <span>Toll-Free Customer Line</span>
                  <p className="text-xs text-stone-400 font-normal">1800-123-456 (24x7 Direct Calling)</p>
                </div>
              </a>

              <button
                type="button"
                onClick={() => {
                  setIsHelpCenterOpen(false);
                  window.open('https://wa.me/918409826244', '_blank');
                }}
                className="w-full p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 flex items-center gap-3.5 text-sm font-bold text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 transition-colors cursor-pointer"
              >
                <MessageCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                <div className="text-left">
                  <span>Instant WhatsApp Support</span>
                  <p className="text-xs text-emerald-600 font-normal">Average response time &lt; 2 minutes</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Rate Experience Modal ──────────────────────────────────────────── */}
      {isRatingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
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
                    className="flex-1 py-3 rounded-2xl border border-stone-200 dark:border-stone-700 text-sm font-bold text-stone-600 dark:text-stone-300 hover:bg-stone-50 cursor-pointer"
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
                    className="flex-1 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold shadow-md shadow-emerald-600/25 cursor-pointer"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
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
              className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold cursor-pointer shadow-md"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* ── Email Verification Modal ─────────────────────────────────────── */}
      {isEmailModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
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
                className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm shadow-md shadow-emerald-600/25 transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
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

import React from 'react';
import { CartData } from '../../types';

export type TabKey = 'home' | 'browse' | 'chat' | 'cart' | 'account';

interface BottomTabBarProps {
  activeTab: TabKey;
  onSelectTab: (tab: TabKey) => void;
  cart: CartData | null;
}

/* ─────────────────────────────────────────────────────────────────────────────
   Precision SVG Glyphs (Matching Exact Reference Screenshot Detailing)
───────────────────────────────────────────────────────────────────────────── */

// 1. Home Glyph: Solid house with lower horizontal pill slit
const HomeGlyph: React.FC<{ isActive: boolean; className?: string }> = ({
  isActive,
  className = 'w-6 h-6',
}) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M12 2.8L3.2 9.8c-.4.32-.7.81-.7 1.33V20c0 .9.7 1.6 1.6 1.6h15.8c.9 0 1.6-.7 1.6-1.6v-8.87c0-.52-.3-1.01-.7-1.33L12 2.8z" />
    <path
      d="M9 16.2h6"
      stroke={isActive ? '#101115' : '#1e2026'}
      strokeWidth="2.5"
      strokeLinecap="round"
    />
  </svg>
);

// 2. Browse / Catalog Glyph: 4 rounded squares in 2x2 grid
const BrowseGlyph: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <rect x="3.5" y="3.5" width="7.2" height="7.2" rx="2.2" />
    <rect x="13.3" y="3.5" width="7.2" height="7.2" rx="2.2" />
    <rect x="3.5" y="13.3" width="7.2" height="7.2" rx="2.2" />
    <rect x="13.3" y="13.3" width="7.2" height="7.2" rx="2.2" />
  </svg>
);

// 3. Center AI Vision / Scanner Glyph: 4 corner brackets framing 4 tiles (Exact match to Purple Orb)
const CenterScannerGlyph: React.FC<{ className?: string }> = ({ className = 'w-7 h-7' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M7 3.5H5a2 2 0 0 0-2 2v2" />
    <path d="M17 3.5h2a2 2 0 0 1 2 2v2" />
    <path d="M21 16.5v2a2 2 0 0 1-2 2h-2" />
    <path d="M3 16.5v2a2 2 0 0 0 2 2h2" />
    <rect x="7" y="7" width="3.6" height="3.6" rx="1.2" fill="currentColor" stroke="none" />
    <rect x="13.4" y="7" width="3.6" height="3.6" rx="1.2" fill="currentColor" stroke="none" />
    <rect x="7" y="13.4" width="3.6" height="3.6" rx="1.2" fill="currentColor" stroke="none" />
    <rect x="13.4" y="13.4" width="3.6" height="3.6" rx="1.2" fill="currentColor" stroke="none" />
  </svg>
);

// 4. Cart Glyph: Modern shopping bag
const CartGlyph: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M6 8V6a6 6 0 1 1 12 0v2h2.5c.83 0 1.5.67 1.5 1.5l-1.2 11.5c-.1.9-.8 1.5-1.7 1.5H4.9c-.9 0-1.6-.6-1.7-1.5L2 9.5C2 8.67 2.67 8 3.5 8H6zm2 0h8V6a4 4 0 0 0-8 0v2z" />
  </svg>
);

// 5. Account Glyph: Head circle + curved shoulder base (Exact match to screenshot)
const AccountGlyph: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <circle cx="12" cy="7.2" r="4.2" />
    <path d="M4.2 19.4c0-3.6 3.6-6.2 7.8-6.2s7.8 2.6 7.8 6.2v.6c0 .5-.4.8-.8.8H5c-.5 0-.8-.4-.8-.8v-.6z" />
  </svg>
);

export const BottomTabBar: React.FC<BottomTabBarProps> = ({
  activeTab,
  onSelectTab,
  cart,
}) => {
  const cartCount = cart?.itemCount || 0;

  // Active indicator translation across the 5 slots
  const getIndicatorOffset = () => {
    switch (activeTab) {
      case 'home':
        return '0%';
      case 'browse':
        return '100%';
      case 'cart':
        return '300%';
      case 'account':
        return '400%';
      default:
        return null; // When AI Assistant (chat) is active, center purple orb handles active state
    }
  };

  const indicatorOffset = getIndicatorOffset();
  const isChatActive = activeTab === 'chat';

  return (
    <nav
      role="tablist"
      aria-label="Bottom Navigation"
      className="relative w-full max-w-sm sm:max-w-md mx-auto select-none"
    >
      {/* ── Main Floating Capsule Dock (Obsidian Charcoal Container) ── */}
      <div className="relative h-15 rounded-full bg-[#1e2026] border border-white/10 shadow-[0_14px_40px_rgba(0,0,0,0.65)] px-2 flex items-center justify-between">
        {/* ── Sliding Inset Dark Pad Indicator ── */}
        <div
          aria-hidden="true"
          className="absolute top-0 bottom-0 left-2 w-[calc((100%-16px)/5)] flex items-center justify-center pointer-events-none transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
          style={{
            transform: indicatorOffset !== null ? `translateX(${indicatorOffset})` : 'translateX(0%)',
            opacity: indicatorOffset !== null ? 1 : 0,
            scale: indicatorOffset !== null ? 1 : 0.8,
          }}
        >
          {/* Circular Inset Active Well matching reference screenshot */}
          <div className="w-12 h-12 rounded-full bg-[#101115] shadow-inner shadow-black/60 border border-white/5" />
        </div>

        {/* ── 1. Home ── */}
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'home'}
          data-testid="tab-home"
          aria-label="Home"
          onClick={() => onSelectTab('home')}
          className="relative z-10 flex-1 h-full flex items-center justify-center cursor-pointer active:scale-90 transition-transform duration-150"
        >
          <span
            className={`transition-colors duration-300 ${
              activeTab === 'home' ? 'text-[#ff5722]' : 'text-white/80 hover:text-white'
            }`}
          >
            <HomeGlyph isActive={activeTab === 'home'} className="w-6 h-6" />
          </span>
        </button>

        {/* ── 2. Browse ── */}
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'browse'}
          data-testid="tab-browse"
          aria-label="Browse"
          onClick={() => onSelectTab('browse')}
          className="relative z-10 flex-1 h-full flex items-center justify-center cursor-pointer active:scale-90 transition-transform duration-150"
        >
          <span
            className={`transition-colors duration-300 ${
              activeTab === 'browse' ? 'text-[#ff5722]' : 'text-white/80 hover:text-white'
            }`}
          >
            <BrowseGlyph className="w-6 h-6" />
          </span>
        </button>

        {/* ── 3. AI Assistant (Elevated Center Purple Orb) ── */}
        <button
          type="button"
          role="tab"
          aria-selected={isChatActive}
          data-testid="tab-chat"
          aria-label="AI Assistant"
          onClick={() => onSelectTab('chat')}
          className="relative z-20 flex-1 h-full flex items-center justify-center cursor-pointer group"
        >
          {/* Elevated Floating Purple Circle with Dark Cutout Ring */}
          <div
            className={`-translate-y-4.5 w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 cursor-pointer ${
              isChatActive
                ? 'bg-gradient-to-tr from-[#7c3aed] to-[#9333ea] text-white shadow-xl shadow-purple-500/50 scale-105 ring-4 ring-[#101115]'
                : 'bg-[#802bf0] hover:bg-[#8b3eff] text-white shadow-lg shadow-purple-600/35 ring-4 ring-[#121316] group-hover:scale-105'
            }`}
          >
            <CenterScannerGlyph className="w-7 h-7 text-white" />
          </div>
        </button>

        {/* ── 4. Cart ── */}
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'cart'}
          data-testid="tab-cart"
          aria-label="Cart"
          onClick={() => onSelectTab('cart')}
          className="relative z-10 flex-1 h-full flex items-center justify-center cursor-pointer active:scale-90 transition-transform duration-150"
        >
          <div className="relative flex items-center justify-center">
            <span
              className={`transition-colors duration-300 ${
                activeTab === 'cart' ? 'text-[#ff5722]' : 'text-white/80 hover:text-white'
              }`}
            >
              <CartGlyph className="w-6 h-6" />
            </span>
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-2 px-1.5 py-0.2 min-w-[17px] h-4 rounded-full bg-rose-500 text-white text-[9px] font-mono font-bold flex items-center justify-center shadow-xs border-2 border-[#1e2026] animate-in zoom-in-75 duration-200">
                {cartCount > 99 ? '99+' : cartCount}
              </span>
            )}
          </div>
        </button>

        {/* ── 5. Account ── */}
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'account'}
          data-testid="tab-account"
          aria-label="Account"
          onClick={() => onSelectTab('account')}
          className="relative z-10 flex-1 h-full flex items-center justify-center cursor-pointer active:scale-90 transition-transform duration-150"
        >
          <span
            className={`transition-colors duration-300 ${
              activeTab === 'account' ? 'text-[#ff5722]' : 'text-white/80 hover:text-white'
            }`}
          >
            <AccountGlyph className="w-6 h-6" />
          </span>
        </button>
      </div>
    </nav>
  );
};

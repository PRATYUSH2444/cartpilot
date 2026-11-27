import React, { useState, useEffect } from 'react';
import {
  X,
  Shield,
  Zap,
  Users,
  Sliders,
  Check,
  ShieldCheck,
  AlertCircle,
  Loader2,
  Sparkles,
  Lock,
  Plus,
  Minus,
} from 'lucide-react';
import { MandateData, CartData } from '../../types';
import { useScrollLock } from '../../hooks/useScrollLock';

interface RulesSheetProps {
  isOpen: boolean;
  onClose: () => void;
  mandate: MandateData | null;
  cart: CartData | null;
  onSelectPreset: (presetKey: string) => Promise<void>;
  onUpdateCustomLimits: (autoApprovePaise: number, perOrderPaise: number, dailyPaise: number) => Promise<void>;
  isSlideOver?: boolean;
}

const PRESETS = [
  {
    key: 'careful',
    name: 'Careful Guard',
    icon: Shield,
    badge: 'STRICT',
    tagline: '₹300 / ₹1,000 / ₹1,500',
    desc: 'High friction: AI requires authorization for any standard grocery basket.',
    autoApproveUpToPaise: 30000,
    perOrderCapPaise: 100000,
    dailyCapPaise: 150000,
  },
  {
    key: 'everyday',
    name: 'Everyday Autonomy',
    icon: Zap,
    badge: 'RECOMMENDED',
    tagline: '₹800 / ₹2,000 / ₹3,000',
    desc: 'Balanced autonomy: AI handles routine daily milk, pantry & essentials freely.',
    autoApproveUpToPaise: 80000,
    perOrderCapPaise: 200000,
    dailyCapPaise: 300000,
  },
  {
    key: 'family',
    name: 'Family Executive',
    icon: Users,
    badge: 'EXPANDED',
    tagline: '₹1,500 / ₹4,000 / ₹5,000',
    desc: 'Generous headroom: Built for multi-member homes & bulk weekly provisioning.',
    autoApproveUpToPaise: 150000,
    perOrderCapPaise: 400000,
    dailyCapPaise: 500000,
  },
];

export const RulesSheet: React.FC<RulesSheetProps> = ({
  isOpen,
  onClose,
  mandate,
  cart,
  onSelectPreset,
  onUpdateCustomLimits,
}) => {
  // Lock background scrolling completely on mobile and desktop
  useScrollLock(isOpen, { onEscape: onClose });

  const currentAuto = mandate?.autoApproveUpToPaise || 30000;
  const currentOrder = mandate?.perOrderCapPaise || mandate?.maxOrderAmountPaise || 100000;
  const currentDaily = mandate?.dailyCapPaise || mandate?.dailyBudgetPaise || 150000;

  const [autoApproveRupees, setAutoApproveRupees] = useState<number>(Math.round(currentAuto / 100));
  const [perOrderRupees, setPerOrderRupees] = useState<number>(Math.round(currentOrder / 100));
  const [dailyRupees, setDailyRupees] = useState<number>(Math.round(currentDaily / 100));
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    setAutoApproveRupees(Math.round((mandate?.autoApproveUpToPaise || 30000) / 100));
    setPerOrderRupees(Math.round((mandate?.perOrderCapPaise || mandate?.maxOrderAmountPaise || 100000) / 100));
    setDailyRupees(Math.round((mandate?.dailyCapPaise || mandate?.dailyBudgetPaise || 150000) / 100));
  }, [mandate]);

  if (!isOpen) return null;

  const handlePresetClick = async (presetKey: string) => {
    const selected = PRESETS.find((p) => p.key === presetKey);
    if (selected) {
      setAutoApproveRupees(Math.round(selected.autoApproveUpToPaise / 100));
      setPerOrderRupees(Math.round(selected.perOrderCapPaise / 100));
      setDailyRupees(Math.round(selected.dailyCapPaise / 100));
    }
    try {
      setIsSaving(true);
      await onSelectPreset(presetKey);
      setSuccessMsg(true);
      setTimeout(() => setSuccessMsg(false), 2200);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to apply preset');
      setTimeout(() => setErrorMessage(null), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveCustom = async () => {
    // Basic logical validation
    if (autoApproveRupees > perOrderRupees) {
      setErrorMessage('Auto-approval limit cannot exceed the per-order hard cap.');
      setTimeout(() => setErrorMessage(null), 3500);
      return;
    }
    if (perOrderRupees > dailyRupees) {
      setErrorMessage('Per-order cap cannot exceed the daily spending budget.');
      setTimeout(() => setErrorMessage(null), 3500);
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);
    try {
      await onUpdateCustomLimits(
        Math.round(autoApproveRupees * 100),
        Math.round(perOrderRupees * 100),
        Math.round(dailyRupees * 100)
      );
      setSuccessMsg(true);
      setTimeout(() => setSuccessMsg(false), 2500);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to update spending limits.');
      setTimeout(() => setErrorMessage(null), 3500);
    } finally {
      setIsSaving(false);
    }
  };

  const currentTotalPaise = cart
    ? cart.pricing?.totalPaise ?? cart.items.reduce((s, i) => s + (i.pricePaise || 0) * i.quantity, 0)
    : 0;
  const isAutoApprovable = currentTotalPaise <= autoApproveRupees * 100;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="spending-rules-title"
    >
      <div
        data-testid="rules-sheet"
        className="relative w-full max-w-xl bg-stone-950 text-stone-100 rounded-3xl shadow-2xl border border-stone-800/80 overflow-hidden flex flex-col max-h-[90dvh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Top Header ──────────────────────────────────────────────────────── */}
        <div className="px-5 py-4 border-b border-stone-800/80 flex items-center justify-between bg-stone-900/60 backdrop-blur-sm flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shadow-inner">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="spending-rules-title" className="font-extrabold text-base sm:text-lg text-white tracking-tight leading-none">
                  Spending Rules &amp; Mandate
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-800/60">
                  GOVERNANCE
                </span>
              </div>
              <p className="text-xs text-stone-400 mt-1">
                Configure autonomous AI agent spending authority &amp; financial safeguards
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-stone-900 border border-stone-800 text-stone-400 hover:text-white hover:bg-stone-800 flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close rules sheet"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* ── Scrollable Body ─────────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5 overscroll-contain">
          {/* Active Cart Evaluation Banner */}
          {cart && (cart.itemCount || cart.items.length) > 0 && (
            <div className="p-3.5 rounded-2xl bg-stone-900/80 border border-stone-800 text-xs flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-2.5">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                  isAutoApprovable ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/60' : 'bg-amber-950/80 text-amber-400 border border-amber-800/60'
                }`}>
                  {isAutoApprovable ? <Check className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                </div>
                <div>
                  <span className="text-stone-400 block text-[11px]">Active Basket Status</span>
                  <span className="font-mono font-bold text-white text-sm">
                    ₹{(currentTotalPaise / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
              <span
                className={`text-[11px] font-mono px-2.5 py-1 rounded-full font-bold border ${
                  isAutoApprovable
                    ? 'bg-emerald-950 text-emerald-300 border-emerald-700/60'
                    : 'bg-amber-950 text-amber-300 border-amber-700/60'
                }`}
              >
                {isAutoApprovable ? '✓ Auto-Approvable' : '⚠ Requires Approval'}
              </span>
            </div>
          )}

          {/* ── 1. Preset Mandate Profiles ───────────────────────────────────── */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-stone-300 uppercase tracking-wider font-mono flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" /> 1. Select Autonomy Profile
              </label>
              <span className="text-[11px] text-stone-500 font-mono">1-Tap Switch</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {PRESETS.map((p) => {
                const Icon = p.icon;
                const isSelected =
                  currentAuto === p.autoApproveUpToPaise &&
                  currentOrder === p.perOrderCapPaise &&
                  currentDaily === p.dailyCapPaise;

                return (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() => handlePresetClick(p.key)}
                    className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between relative ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-950/30 ring-1 ring-emerald-500/40 shadow-md shadow-emerald-950/20'
                        : 'border-stone-800 bg-stone-900/50 hover:border-stone-700 hover:bg-stone-900/80'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-1.5">
                          <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${
                            isSelected ? 'bg-emerald-500/20 text-emerald-400' : 'bg-stone-800 text-stone-400'
                          }`}>
                            <Icon className="w-3.5 h-3.5" />
                          </div>
                          <span className="font-bold text-xs text-white">
                            {p.name}
                          </span>
                        </div>
                        {isSelected && (
                          <span className="w-4.5 h-4.5 rounded-full bg-emerald-500 text-stone-950 flex items-center justify-center font-bold">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-emerald-400 font-mono font-bold block mb-1">
                        {p.tagline}
                      </span>
                    </div>
                    <span className="text-[10px] text-stone-400 leading-snug">
                      {p.desc}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── 2. Fine-Tune Precision Limits (Institutional Stepper Cards) ──── */}
          <div className="space-y-3.5 pt-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-stone-300 uppercase tracking-wider font-mono flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-emerald-400" /> 2. Fine-Tune Precision Caps
              </label>
              <span className="text-[10px] font-mono text-emerald-400 font-bold px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-800/40">
                INR (₹) Integer Precision
              </span>
            </div>

            {/* Cap 1: Auto-Approve Threshold */}
            <div className="p-4 rounded-2xl border border-stone-800 bg-stone-900/40 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">Auto-Approval Threshold</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-stone-800 text-stone-300 font-mono">Baskets</span>
                  </div>
                  <p className="text-[11px] text-stone-400 mt-0.5">
                    Orders under this amount execute autonomously without explicit confirmation.
                  </p>
                </div>
                {/* Stepper Input */}
                <div className="flex items-center gap-1.5 bg-stone-950 border border-stone-800 rounded-xl px-2.5 py-1.5 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => setAutoApproveRupees((v) => Math.max(100, v - 50))}
                    className="w-6 h-6 rounded-lg bg-stone-900 hover:bg-stone-800 text-stone-300 flex items-center justify-center cursor-pointer transition-colors"
                    aria-label="Decrease auto-approve limit"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <div className="flex items-center font-mono font-bold text-emerald-400 text-sm px-1.5 min-w-[70px] justify-center">
                    ₹
                    <input
                      type="number"
                      value={autoApproveRupees}
                      onChange={(e) => setAutoApproveRupees(Math.max(0, Number(e.target.value) || 0))}
                      className="w-14 bg-transparent text-center text-emerald-400 font-mono font-bold focus:outline-none"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setAutoApproveRupees((v) => v + 50)}
                    className="w-6 h-6 rounded-lg bg-stone-900 hover:bg-stone-800 text-stone-300 flex items-center justify-center cursor-pointer transition-colors"
                    aria-label="Increase auto-approve limit"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>
              {/* Quick Chip Adjustments */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                <span className="text-[10px] text-stone-500 font-mono mr-1 self-center">Presets:</span>
                {[300, 500, 800, 1000, 1500].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setAutoApproveRupees(amt)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-semibold transition-colors cursor-pointer ${
                      autoApproveRupees === amt
                        ? 'bg-emerald-500 text-stone-950 font-bold'
                        : 'bg-stone-900 text-stone-300 hover:bg-stone-800 border border-stone-800'
                    }`}
                  >
                    ₹{amt}
                  </button>
                ))}
              </div>
            </div>

            {/* Cap 2: Per-Order Hard Cap */}
            <div className="p-4 rounded-2xl border border-stone-800 bg-stone-900/40 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">Per-Order Hard Ceiling</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-stone-800 text-stone-300 font-mono">Max Order</span>
                  </div>
                  <p className="text-[11px] text-stone-400 mt-0.5">
                    Hard ceiling per basket. Any order exceeding this is strictly rejected.
                  </p>
                </div>
                {/* Stepper Input */}
                <div className="flex items-center gap-1.5 bg-stone-950 border border-stone-800 rounded-xl px-2.5 py-1.5 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => setPerOrderRupees((v) => Math.max(500, v - 100))}
                    className="w-6 h-6 rounded-lg bg-stone-900 hover:bg-stone-800 text-stone-300 flex items-center justify-center cursor-pointer transition-colors"
                    aria-label="Decrease per-order limit"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <div className="flex items-center font-mono font-bold text-emerald-400 text-sm px-1.5 min-w-[70px] justify-center">
                    ₹
                    <input
                      type="number"
                      value={perOrderRupees}
                      onChange={(e) => setPerOrderRupees(Math.max(0, Number(e.target.value) || 0))}
                      className="w-16 bg-transparent text-center text-emerald-400 font-mono font-bold focus:outline-none"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setPerOrderRupees((v) => v + 100)}
                    className="w-6 h-6 rounded-lg bg-stone-900 hover:bg-stone-800 text-stone-300 flex items-center justify-center cursor-pointer transition-colors"
                    aria-label="Increase per-order limit"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>
              {/* Quick Chip Adjustments */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                <span className="text-[10px] text-stone-500 font-mono mr-1 self-center">Presets:</span>
                {[1000, 2000, 3000, 4000, 6000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setPerOrderRupees(amt)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-semibold transition-colors cursor-pointer ${
                      perOrderRupees === amt
                        ? 'bg-emerald-500 text-stone-950 font-bold'
                        : 'bg-stone-900 text-stone-300 hover:bg-stone-800 border border-stone-800'
                    }`}
                  >
                    ₹{amt}
                  </button>
                ))}
              </div>
            </div>

            {/* Cap 3: Daily Spending Budget */}
            <div className="p-4 rounded-2xl border border-stone-800 bg-stone-900/40 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">Daily Cumulative Budget</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-stone-800 text-stone-300 font-mono">24h Rolling</span>
                  </div>
                  <p className="text-[11px] text-stone-400 mt-0.5">
                    Rolling 24-hour total limit across all autonomous and manual checkouts.
                  </p>
                </div>
                {/* Stepper Input */}
                <div className="flex items-center gap-1.5 bg-stone-950 border border-stone-800 rounded-xl px-2.5 py-1.5 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => setDailyRupees((v) => Math.max(1000, v - 250))}
                    className="w-6 h-6 rounded-lg bg-stone-900 hover:bg-stone-800 text-stone-300 flex items-center justify-center cursor-pointer transition-colors"
                    aria-label="Decrease daily budget"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <div className="flex items-center font-mono font-bold text-emerald-400 text-sm px-1.5 min-w-[70px] justify-center">
                    ₹
                    <input
                      type="number"
                      value={dailyRupees}
                      onChange={(e) => setDailyRupees(Math.max(0, Number(e.target.value) || 0))}
                      className="w-16 bg-transparent text-center text-emerald-400 font-mono font-bold focus:outline-none"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setDailyRupees((v) => v + 250)}
                    className="w-6 h-6 rounded-lg bg-stone-900 hover:bg-stone-800 text-stone-300 flex items-center justify-center cursor-pointer transition-colors"
                    aria-label="Increase daily budget"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>
              {/* Quick Chip Adjustments */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                <span className="text-[10px] text-stone-500 font-mono mr-1 self-center">Presets:</span>
                {[1500, 3000, 5000, 8000, 10000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setDailyRupees(amt)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-semibold transition-colors cursor-pointer ${
                      dailyRupees === amt
                        ? 'bg-emerald-500 text-stone-950 font-bold'
                        : 'bg-stone-900 text-stone-300 hover:bg-stone-800 border border-stone-800'
                    }`}
                  >
                    ₹{amt}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Error & Feedback messages */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-red-950/80 border border-red-800/60 text-xs text-red-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-800/60 text-xs text-emerald-300 flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span className="font-semibold">Spending rules &amp; mandate updated successfully!</span>
            </div>
          )}

          {/* Bank-Grade Security Disclaimer */}
          <div className="p-3 rounded-xl bg-stone-900/60 border border-stone-800/60 flex items-start gap-2.5">
            <Lock className="w-3.5 h-3.5 text-stone-500 mt-0.5 flex-shrink-0" />
            <p className="text-[11px] text-stone-400 leading-relaxed">
              <strong>Enterprise Financial Guardrail:</strong> Spending caps are validated server-side on every agent transaction. Any cart exceeding limits triggers a mandatory human approval card.
            </p>
          </div>
        </div>

        {/* ── Sticky Bottom Action Footer ─────────────────────────────────────── */}
        <div className="p-4 border-t border-stone-800/80 bg-stone-900/70 backdrop-blur-sm flex items-center gap-3 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-3 rounded-2xl bg-stone-900 hover:bg-stone-800 border border-stone-800 text-stone-300 text-xs font-bold transition-all cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSaveCustom}
            disabled={isSaving}
            className="flex-1 py-3 px-5 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 active:scale-[0.99] text-stone-950 font-bold text-xs sm:text-sm tracking-tight flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/40 transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-stone-950" />
                <span>Saving Mandate Limits…</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-4.5 h-4.5 stroke-[2.5]" />
                <span>Save Spending Limits</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { X, Shield, Zap, Users, Sliders, Check, Lock } from 'lucide-react';
import { MandateData, CartData } from '../../types';

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
    name: 'Careful',
    icon: Shield,
    tagline: '₹300 / ₹1,000 / ₹1,500',
    desc: 'Strict approval for any big basket',
    autoApproveUpToPaise: 30000,
    perOrderCapPaise: 100000,
    dailyCapPaise: 150000,
  },
  {
    key: 'everyday',
    name: 'Everyday',
    icon: Zap,
    tagline: '₹800 / ₹2,000 / ₹3,000',
    desc: 'Balanced autonomy for routine daily groceries',
    autoApproveUpToPaise: 80000,
    perOrderCapPaise: 200000,
    dailyCapPaise: 300000,
  },
  {
    key: 'family',
    name: 'Family',
    icon: Users,
    tagline: '₹1,500 / ₹4,000 / ₹5,000',
    desc: 'Higher headroom for weekly family bulk shops',
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
  isSlideOver = false,
}) => {
  const currentAuto = mandate?.autoApproveUpToPaise || 30000;
  const currentOrder = mandate?.perOrderCapPaise || mandate?.maxOrderAmountPaise || 100000;
  const currentDaily = mandate?.dailyCapPaise || mandate?.dailyBudgetPaise || 150000;

  const [autoApproveInput, setAutoApproveInput] = useState<number>(currentAuto / 100);
  const [perOrderInput, setPerOrderInput] = useState<number>(currentOrder / 100);
  const [dailyInput, setDailyInput] = useState<number>(currentDaily / 100);
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);

  React.useEffect(() => {
    setAutoApproveInput((mandate?.autoApproveUpToPaise || 30000) / 100);
    setPerOrderInput((mandate?.perOrderCapPaise || mandate?.maxOrderAmountPaise || 100000) / 100);
    setDailyInput((mandate?.dailyCapPaise || mandate?.dailyBudgetPaise || 150000) / 100);
  }, [mandate]);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSaveCustom = async () => {
    setIsSaving(true);
    try {
      await onUpdateCustomLimits(
        Math.round(autoApproveInput * 100),
        Math.round(perOrderInput * 100),
        Math.round(dailyInput * 100)
      );
      setSuccessMsg(true);
      setTimeout(() => setSuccessMsg(false), 2500);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      className={`fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex ${
        isSlideOver ? 'justify-end' : 'items-end sm:items-center justify-center p-0 sm:p-4'
      }`}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="rules-sheet-title"
    >
      <div
        data-testid="rules-sheet"
        className={`w-full ${
          isSlideOver
            ? 'max-w-xl h-full'
            : 'sm:max-w-lg max-h-[90dvh] sm:rounded-3xl rounded-t-3xl'
        } bg-card dark:bg-card-top border border-brd shadow-2xl flex flex-col overflow-hidden animate-in ${
          isSlideOver ? 'slide-in-from-right' : 'slide-in-from-bottom'
        } duration-200`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile Drag Handle */}
        {!isSlideOver && (
          <div className="w-12 h-1.5 bg-brd rounded-full mx-auto mt-3 mb-1 sm:hidden flex-shrink-0" />
        )}

        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-brd flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-acc" />
            <div>
              <h2 id="rules-sheet-title" className="text-base sm:text-lg font-display font-bold text-ink">
                Spending Rules &amp; Mandate
              </h2>
              <p className="text-xs text-mut font-mono">
                All 3 canonical policy caps with integer paise precision
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-mut hover:text-ink hover:bg-paper transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
            aria-label="Close rules sheet"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
          {/* Current Cart Status */}
          {cart && (cart.itemCount || cart.items.length) > 0 && (() => {
            const currentTotalPaise = cart.pricing?.totalPaise ?? cart.items.reduce((s, i) => s + (i.pricePaise || 0) * i.quantity, 0);
            const isAutoApprovable = currentTotalPaise <= currentAuto;
            return (
              <div className="p-3 rounded-2xl bg-paper border border-brd text-xs text-mut flex items-center justify-between">
                <span>
                  Current Basket: <strong className="text-ink font-mono font-bold">₹{(currentTotalPaise / 100).toFixed(2)}</strong>
                </span>
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
                    isAutoApprovable
                      ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                      : 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                  }`}
                >
                  {isAutoApprovable ? 'Auto-Approvable' : 'Requires Approval'}
                </span>
              </div>
            );
          })()}

          {/* Preset Buttons */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-ink uppercase tracking-wider font-mono block">
              1. Choose a Mandate Preset
            </label>
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
                    onClick={() => onSelectPreset(p.key)}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between min-h-[90px] ${
                      isSelected
                        ? 'border-emerald-600 bg-emerald-500/10 shadow-xs'
                        : 'border-brd bg-paper/50 hover:border-acc/40'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-xs text-ink flex items-center gap-1 font-display">
                          <Icon className="w-3.5 h-3.5 text-acc" /> {p.name}
                        </span>
                        {isSelected && (
                          <span className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                            <Check className="w-2.5 h-2.5" />
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-acc font-mono font-bold block">
                        {p.tagline}
                      </span>
                    </div>
                    <span className="text-[10px] text-mut mt-1 leading-tight line-clamp-2">
                      {p.desc}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Caps Sliders / Inputs */}
          <div className="space-y-3.5 p-4 rounded-2xl border border-brd bg-paper/40">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-ink uppercase tracking-wider font-mono">
                2. Fine-Tune Canonical Limits
              </label>
              <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                Deterministic Policy
              </span>
            </div>

            {/* Cap 1: Auto-Approve Up To */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-ink font-medium">Auto-Approve Up To:</span>
                <span className="font-mono font-bold text-acc">₹{autoApproveInput.toFixed(0)}</span>
              </div>
              <input
                type="range"
                min="100"
                max="5000"
                step="50"
                value={autoApproveInput}
                onChange={(e) => setAutoApproveInput(Number(e.target.value))}
                className="w-full accent-emerald-600 cursor-pointer"
              />
              <span className="text-[10px] text-mut">
                Baskets below this total order without an explicit approval card.
              </span>
            </div>

            {/* Cap 2: Per-Order Cap */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-ink font-medium">Per-Order Hard Cap:</span>
                <span className="font-mono font-bold text-acc">₹{perOrderInput.toFixed(0)}</span>
              </div>
              <input
                type="range"
                min="500"
                max="10000"
                step="100"
                value={perOrderInput}
                onChange={(e) => setPerOrderInput(Number(e.target.value))}
                className="w-full accent-emerald-600 cursor-pointer"
              />
              <span className="text-[10px] text-mut">
                Strict limit per individual order. Carts exceeding this are blocked.
              </span>
            </div>

            {/* Cap 3: Daily Budget */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-ink font-medium">Daily Spending Budget:</span>
                <span className="font-mono font-bold text-acc">₹{dailyInput.toFixed(0)}</span>
              </div>
              <input
                type="range"
                min="1000"
                max="25000"
                step="250"
                value={dailyInput}
                onChange={(e) => setDailyInput(Number(e.target.value))}
                className="w-full accent-emerald-600 cursor-pointer"
              />
              <span className="text-[10px] text-mut">
                Cumulative daily cap across all orders in a 24-hour window.
              </span>
            </div>

            <div className="pt-2 flex items-center justify-between">
              {successMsg && (
                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1 font-mono">
                  <Check className="w-3.5 h-3.5" /> Mandate updated!
                </span>
              )}
              <div className="ml-auto">
                <button
                  onClick={handleSaveCustom}
                  disabled={isSaving}
                  className="py-2 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-display font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer min-h-[40px]"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>{isSaving ? 'Updating...' : 'Save Limits'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

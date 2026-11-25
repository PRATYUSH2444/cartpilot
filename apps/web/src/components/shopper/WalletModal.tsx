import React, { useState } from 'react';
import { X, Wallet, Plus, ArrowDownLeft, CheckCircle2 } from 'lucide-react';

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  balance: number;
  onAddFunds: (amount: number) => void;
}

export const WalletModal: React.FC<WalletModalProps> = ({
  isOpen,
  onClose,
  balance,
  onAddFunds,
}) => {
  const [selectedTopup, setSelectedTopup] = useState<number>(500);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleTopup = (e: React.FormEvent) => {
    e.preventDefault();
    const amountToAdd = customAmount ? parseFloat(customAmount) : selectedTopup;
    if (isNaN(amountToAdd) || amountToAdd <= 0) return;

    onAddFunds(amountToAdd);
    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white dark:bg-stone-900 rounded-3xl shadow-2xl border border-stone-200 dark:border-stone-800 overflow-hidden text-stone-900 dark:text-stone-100 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 flex items-center justify-center shadow-2xs">
              <Wallet className="w-4 h-4 fill-emerald-600 text-emerald-600" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-stone-900 dark:text-white leading-none">
                CartPilot Wallet
              </h3>
              <p className="text-[11px] text-stone-400 mt-0.5">
                Instant 1-tap checkout & cashback balance
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-500 hover:text-stone-900 flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Balance Card */}
          <div className="rounded-3xl bg-gradient-to-br from-emerald-600 to-emerald-800 text-white p-5 shadow-md flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-emerald-200 uppercase tracking-wider block">
                Total Available Balance
              </span>
              <span className="text-3xl font-black text-white mt-1 block">
                ₹{balance.toFixed(2)}
              </span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center">
              <Wallet className="w-6 h-6 text-white" />
            </div>
          </div>

          {isSuccess ? (
            <div className="p-6 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-center space-y-2 animate-in zoom-in-95">
              <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
              <h4 className="font-extrabold text-sm text-stone-900 dark:text-white">
                Funds Added Successfully!
              </h4>
              <p className="text-xs text-stone-500">
                Your new balance is updated and ready for 1-tap checkout.
              </p>
            </div>
          ) : (
            <form onSubmit={handleTopup} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-2">
                  Add Money to Wallet
                </label>

                {/* Preset Pills */}
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {[200, 500, 1000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => {
                        setSelectedTopup(amt);
                        setCustomAmount('');
                      }}
                      className={`py-2 px-3 rounded-2xl font-black text-xs border transition-all cursor-pointer ${
                        selectedTopup === amt && !customAmount
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 ring-2 ring-emerald-500/30'
                          : 'border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-700 dark:text-stone-300'
                      }`}
                    >
                      +₹{amt}
                    </button>
                  ))}
                </div>

                {/* Custom input */}
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-stone-400 text-sm">
                    ₹
                  </span>
                  <input
                    type="number"
                    min="10"
                    max="50000"
                    value={customAmount}
                    onChange={(e) => {
                      setCustomAmount(e.target.value);
                      setSelectedTopup(0);
                    }}
                    placeholder="Enter custom amount (e.g. 750)"
                    className="w-full pl-8 pr-4 py-2.5 rounded-2xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-xs font-bold text-stone-900 dark:text-white placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md shadow-emerald-600/25 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>
                  Proceed to Add ₹{customAmount ? customAmount : selectedTopup}
                </span>
              </button>
            </form>
          )}

          {/* Transaction Ledger */}
          <div className="pt-3 border-t border-stone-100 dark:border-stone-800 space-y-2">
            <h5 className="font-extrabold text-xs text-stone-500 uppercase tracking-wider">
              Recent Activity
            </h5>
            <div className="space-y-1.5 text-xs">
              <div className="p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800/60 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
                    <ArrowDownLeft className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <p className="font-bold text-stone-800 dark:text-stone-200">
                      Welcome Bonus Credited
                    </p>
                    <p className="text-[10px] text-stone-400">Promotional Offer</p>
                  </div>
                </div>
                <span className="font-black text-emerald-600">+₹100.00</span>
              </div>

              <div className="p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800/60 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
                    <ArrowDownLeft className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <p className="font-bold text-stone-800 dark:text-stone-200">
                      Pre-Seeded Wallet Balance
                    </p>
                    <p className="text-[10px] text-stone-400">Shopper Gateway</p>
                  </div>
                </div>
                <span className="font-black text-emerald-600">+₹249.00</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

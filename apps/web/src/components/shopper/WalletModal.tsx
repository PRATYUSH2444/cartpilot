import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  Wallet,
  Plus,
  ArrowDownLeft,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  AlertCircle,
  Loader2,
  ShieldCheck,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { API_BASE } from '../../config/api';
import { useScrollLock } from '../../hooks/useScrollLock';

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  balance: number;
  onAddFunds: (amount: number) => void;
  token?: string | null;
}

interface WalletTransactionItem {
  id: string;
  type: string;
  direction: 'CREDIT' | 'DEBIT';
  amountPaise: number;
  balanceAfterPaise: number;
  description: string;
  status: string;
  createdAt: string;
}

interface WalletLimits {
  minTopupPaise: number;
  maxTopupPaise: number;
  maxBalancePaise: number;
  quickAddChipsRupees: number[];
}

export const WalletModal: React.FC<WalletModalProps> = ({
  isOpen,
  onClose,
  balance,
  onAddFunds,
  token,
}) => {
  const { authFetch, user } = useAuth();

  // Bulletproof body scroll lock for mobile and desktop
  useScrollLock(isOpen, { onEscape: onClose });

  const [refreshing, setRefreshing] = useState(false);
  const [selectedTopup, setSelectedTopup] = useState<number>(100);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [liveBalancePaise, setLiveBalancePaise] = useState<number>(Math.round(balance * 100));
  const [limits, setLimits] = useState<WalletLimits>({
    minTopupPaise: 100, // ₹1 minimum topup (ultra-flexible for testing & production)
    maxTopupPaise: 1000000,
    maxBalancePaise: 5000000,
    quickAddChipsRupees: [50, 100, 200, 500],
  });
  const [transactions, setTransactions] = useState<WalletTransactionItem[]>([]);
  const [activeTab, setActiveTab] = useState<'topup' | 'history'>('topup');

  // Load Razorpay Checkout.js SDK dynamically if not loaded
  const loadRazorpaySdk = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if ((window as any).Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const fetchWalletData = useCallback(async () => {
    if (!token && !authFetch) return;
    try {
      setRefreshing(true);
      const res = await authFetch(`${API_BASE}/wallet`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          const w = json.data.wallet || json.data;
          if (w.balancePaise !== undefined) {
            setLiveBalancePaise(w.balancePaise);
          } else if (w.balanceRupees !== undefined) {
            setLiveBalancePaise(Math.round(w.balanceRupees * 100));
          }
          if (json.data.limits) {
            setLimits(json.data.limits);
          }
          if (Array.isArray(json.data.recentTransactions)) {
            setTransactions(json.data.recentTransactions);
          }
        }
      }
    } catch {
      // Graceful fallback to initial prop balance
    } finally {
      setRefreshing(false);
    }
  }, [authFetch, token]);

  useEffect(() => {
    if (isOpen) {
      setLiveBalancePaise(Math.round(balance * 100));
      fetchWalletData();
    }
  }, [isOpen, balance, fetchWalletData]);

  const currentRupees = liveBalancePaise / 100;
  const targetRupees = customAmount ? parseFloat(customAmount) || 0 : selectedTopup;

  const handleTopupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const amountToAdd = targetRupees;
    const minRupees = limits.minTopupPaise / 100;
    const maxRupees = limits.maxTopupPaise / 100;

    if (!amountToAdd || isNaN(amountToAdd) || amountToAdd < minRupees) {
      setErrorMessage(`Please enter a valid top-up amount of at least ₹${minRupees}`);
      return;
    }
    if (amountToAdd > maxRupees) {
      setErrorMessage(`Maximum top-up per transaction is ₹${maxRupees.toLocaleString('en-IN')}`);
      return;
    }
    if (liveBalancePaise + amountToAdd * 100 > limits.maxBalancePaise) {
      setErrorMessage(
        `Adding ₹${amountToAdd} would exceed the wallet limit of ₹${(
          limits.maxBalancePaise / 100
        ).toLocaleString('en-IN')}`
      );
      return;
    }

    setIsProcessing(true);

    try {
      // 1. Create top-up intent on backend
      const res = await authFetch(`${API_BASE}/wallet/topup-intent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amountRupees: amountToAdd }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || data.message || 'Could not initiate wallet top-up');
      }

      const intent = data.data;
      const { razorpayOrderId, amountPaise: serverPaise, keyId } = intent;

      // 2. Initialize Razorpay Checkout
      const sdkReady = await loadRazorpaySdk();

      const proceedVerification = async (paymentResponse: {
        razorpay_order_id: string;
        razorpay_payment_id: string;
        razorpay_signature: string;
      }) => {
        const amountPaiseFinal = serverPaise || Math.round(amountToAdd * 100);
        const verifyRes = await authFetch(`${API_BASE}/wallet/topup-verify`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId: paymentResponse.razorpay_order_id,
            paymentId: paymentResponse.razorpay_payment_id,
            signature: paymentResponse.razorpay_signature,
            amountPaise: amountPaiseFinal,
          }),
        });

        const verifyJson = await verifyRes.json();
        if (!verifyRes.ok) {
          throw new Error(verifyJson.error?.message || verifyJson.message || 'Payment verification failed');
        }

        const newBalPaise =
          verifyJson.data?.wallet?.balancePaise ??
          (verifyJson.data?.newBalancePaise !== undefined
            ? verifyJson.data.newBalancePaise
            : (verifyJson.data?.newBalanceRupees !== undefined
                ? Math.round(verifyJson.data.newBalanceRupees * 100)
                : (liveBalancePaise + amountPaiseFinal)));

        setLiveBalancePaise(newBalPaise);
        onAddFunds(amountToAdd);
        setIsSuccess(true);
        setSuccessMessage(`₹${amountToAdd.toLocaleString('en-IN')} added to your CartPilot Wallet!`);

        // Refresh transaction list
        await fetchWalletData();

        setTimeout(() => {
          setIsSuccess(false);
          setCustomAmount('');
        }, 2200);
      };

      if (
        sdkReady &&
        keyId &&
        razorpayOrderId &&
        !razorpayOrderId.startsWith('wallet_topup_sim_')
      ) {
        const options = {
          key: keyId,
          amount: serverPaise || Math.round(amountToAdd * 100),
          currency: 'INR',
          name: 'CartPilot Wallet',
          description: `Add ₹${amountToAdd} to Wallet Balance`,
          order_id: razorpayOrderId,
          prefill: {
            name: user?.name || 'Shopper',
            email: user?.email || '',
            contact: user?.phone || '',
          },
          theme: {
            color: '#08643D',
          },
          handler: async (response: any) => {
            try {
              await proceedVerification(response);
            } catch (vErr: any) {
              setErrorMessage(vErr.message || 'Payment verification failed');
            } finally {
              setIsProcessing(false);
            }
          },
          modal: {
            ondismiss: () => {
              setIsProcessing(false);
            },
          },
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.on('payment.failed', (resp: any) => {
          setErrorMessage(resp.error?.description || 'Payment failed');
          setIsProcessing(false);
        });
        rzp.open();
      } else {
        // High-fidelity sandbox / simulated fallback for development & immediate top-ups
        const mockResponse = {
          razorpay_order_id: razorpayOrderId || `wallet_topup_${Date.now()}`,
          razorpay_payment_id: `pay_sim_${Date.now()}`,
          razorpay_signature: `sig_sim_${Date.now()}`,
        };

        await proceedVerification(mockResponse);
        setIsProcessing(false);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to complete wallet top-up. Please try again.');
      setIsProcessing(false);
    }
  };

  const formatTxDate = (isoStr: string) => {
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoStr;
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/60 dark:bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="wallet-modal-title"
    >
      <div
        className="relative w-full max-w-md bg-white dark:bg-stone-950 text-stone-900 dark:text-stone-100 rounded-3xl shadow-2xl border border-stone-200/90 dark:border-stone-800/80 overflow-hidden flex flex-col max-h-[88dvh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Top Header ────────────────────────────────────────────────────── */}
        <div className="px-5 py-4 border-b border-stone-200/80 dark:border-stone-800/80 flex items-center justify-between bg-stone-50/90 dark:bg-stone-900/60 backdrop-blur-sm flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shadow-inner">
              <Wallet className="w-4.5 h-4.5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 id="wallet-modal-title" className="font-extrabold text-base text-stone-900 dark:text-white tracking-tight leading-none">
                  CartPilot Wallet
                </h3>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
                  LEDGER
                </span>
              </div>
              <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">
                Instant 1-tap checkout • Zero gateway fees
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={fetchWalletData}
              disabled={refreshing}
              className="p-2 rounded-xl text-stone-400 hover:text-stone-900 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-stone-800/80 transition-colors cursor-pointer"
              title="Refresh ledger"
              aria-label="Refresh wallet"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-emerald-600 dark:text-emerald-400' : ''}`} />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-stone-400 hover:text-stone-900 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-stone-800/80 transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ── Scrollable Body ────────────────────────────────────────────────── */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1 min-h-0 overscroll-contain">
          {/* Obsidian Black Balance Card (Premium Fintech Aesthetic) */}
          <div className="relative rounded-3xl bg-gradient-to-br from-stone-900 via-stone-900 to-stone-950 border border-stone-800/90 p-5 shadow-xl overflow-hidden text-white">
            {/* Subtle glow accent */}
            <div className="absolute -right-8 -bottom-8 w-32 h-32 rounded-full bg-emerald-500/10 blur-2xl pointer-events-none" />

            <div className="flex items-start justify-between relative z-10">
              <div>
                <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider block">
                  Available Balance
                </span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-3xl font-black text-white tracking-tight font-mono">
                    ₹{currentRupees.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              <div className="w-11 h-11 rounded-2xl bg-stone-800/90 border border-stone-700/60 flex items-center justify-center text-emerald-400 shadow-sm">
                <ShieldCheck className="w-5 h-5" />
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-stone-800/70 flex items-center justify-between text-[11px] text-stone-400">
              <span className="flex items-center gap-1.5 text-emerald-400/90 font-medium">
                <Sparkles className="w-3 h-3" />
                <span>100% Secure • Bank Grade Ledger</span>
              </span>
              <span className="font-mono text-stone-500">INR (₹)</span>
            </div>
          </div>

          {/* Tab Selector: Add Money vs Ledger Activity */}
          <div className="flex p-1 bg-stone-100 dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800/90 text-xs font-bold">
            <button
              type="button"
              onClick={() => setActiveTab('topup')}
              className={`flex-1 py-2 rounded-xl transition-all cursor-pointer ${
                activeTab === 'topup'
                  ? 'bg-white dark:bg-stone-800 text-stone-900 dark:text-white shadow-xs'
                  : 'text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-200'
              }`}
            >
              Add Money
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('history')}
              className={`flex-1 py-2 rounded-xl transition-all cursor-pointer ${
                activeTab === 'history'
                  ? 'bg-white dark:bg-stone-800 text-stone-900 dark:text-white shadow-xs'
                  : 'text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-200'
              }`}
            >
              Ledger Activity ({transactions.length})
            </button>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 dark:bg-rose-950/40 dark:border-rose-800/60 dark:text-rose-300 text-xs flex items-start gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-500 dark:text-rose-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1 font-medium">{errorMessage}</div>
            </div>
          )}

          {/* Success Banner */}
          {isSuccess && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 dark:bg-emerald-950/50 dark:border-emerald-800/60 text-center space-y-1.5 animate-in zoom-in-95">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400 mx-auto" />
              <h4 className="font-bold text-sm text-stone-900 dark:text-white">Funds Added!</h4>
              <p className="text-xs text-emerald-700 dark:text-emerald-300/80">{successMessage}</p>
            </div>
          )}

          {activeTab === 'topup' ? (
            <form onSubmit={handleTopupSubmit} className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-stone-700 dark:text-stone-300">
                    Select Quick Top-Up Amount
                  </label>
                  <span className="text-[11px] text-stone-400 dark:text-stone-500 font-mono">
                    Min ₹{limits.minTopupPaise / 100}
                  </span>
                </div>

                {/* Dynamic Quick Add Chips from Backend Settings */}
                <div className={`grid gap-2 mb-3 ${limits.quickAddChipsRupees.length >= 4 ? 'grid-cols-4' : 'grid-cols-3'}`}>
                  {limits.quickAddChipsRupees.map((amt) => {
                    const isSelected = selectedTopup === amt && !customAmount;
                    return (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => {
                          setSelectedTopup(amt);
                          setCustomAmount('');
                          setErrorMessage(null);
                        }}
                        className={`py-2.5 px-2 rounded-2xl font-black text-xs font-mono border transition-all cursor-pointer ${
                          isSelected
                            ? 'border-emerald-600 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-500/30 dark:border-emerald-500 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : 'border-stone-200 dark:border-stone-800 bg-stone-50 hover:bg-stone-100 dark:bg-stone-900 text-stone-700 dark:text-stone-300 dark:hover:bg-stone-850 hover:border-stone-300 dark:hover:border-stone-700'
                        }`}
                      >
                        +₹{amt}
                      </button>
                    );
                  })}
                </div>

                {/* Custom Amount Input */}
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-stone-400 text-sm font-mono">
                    ₹
                  </span>
                  <input
                    type="number"
                    min={limits.minTopupPaise / 100}
                    max={limits.maxTopupPaise / 100}
                    step="1"
                    value={customAmount}
                    onChange={(e) => {
                      setCustomAmount(e.target.value);
                      setSelectedTopup(0);
                      setErrorMessage(null);
                    }}
                    placeholder={`Enter custom amount (e.g. 10, 50, 750)`}
                    className="w-full pl-8 pr-4 py-3 rounded-2xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900 text-sm font-bold text-stone-900 dark:text-white placeholder:text-stone-400 dark:placeholder:text-stone-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all font-mono"
                  />
                </div>
              </div>

              {/* Action Button */}
              <button
                type="submit"
                disabled={isProcessing || targetRupees <= 0}
                className="w-full py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:scale-[0.99] text-white font-extrabold text-sm shadow-lg shadow-emerald-700/20 dark:shadow-emerald-900/30 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Processing Secure Gateway…</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 stroke-[2.5]" />
                    <span>
                      Proceed to Add ₹{targetRupees > 0 ? targetRupees.toLocaleString('en-IN') : '0'}
                    </span>
                  </>
                )}
              </button>

              <p className="text-center text-[11px] text-stone-400 dark:text-stone-500">
                Supports UPI, Credit/Debit Cards, NetBanking via Razorpay
              </p>
            </form>
          ) : (
            /* Real Ledger Activity */
            <div className="space-y-2">
              {transactions.length === 0 ? (
                <div className="py-8 text-center space-y-2 rounded-2xl bg-stone-50 dark:bg-stone-900/40 border border-stone-200 dark:border-stone-850">
                  <Clock className="w-8 h-8 text-stone-400 dark:text-stone-600 mx-auto" />
                  <p className="text-xs font-semibold text-stone-600 dark:text-stone-400">No transactions recorded yet</p>
                  <p className="text-[11px] text-stone-400 dark:text-stone-500 max-w-xs mx-auto">
                    Top up your wallet or place an order to see your double-entry ledger history here.
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {transactions.map((tx) => {
                    const isCredit = tx.direction === 'CREDIT';
                    const amountRupees = tx.amountPaise / 100;
                    const balanceAfterRupees = tx.balanceAfterPaise / 100;

                    return (
                      <div
                        key={tx.id}
                        className="p-3 rounded-2xl bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800/80 flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
                              isCredit
                                ? 'bg-emerald-100 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/80 dark:text-emerald-400 dark:border-emerald-800/50'
                                : 'bg-rose-100 text-rose-700 border border-rose-200 dark:bg-rose-950/80 dark:text-rose-400 dark:border-rose-800/50'
                            }`}
                          >
                            {isCredit ? (
                              <ArrowDownLeft className="w-4 h-4" />
                            ) : (
                              <ArrowUpRight className="w-4 h-4" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-stone-800 dark:text-stone-200 truncate leading-tight">
                              {tx.description || tx.type}
                            </p>
                            <p className="text-[10px] text-stone-400 dark:text-stone-500 font-mono mt-0.5">
                              {formatTxDate(tx.createdAt)}
                            </p>
                          </div>
                        </div>

                        <div className="text-right flex-shrink-0 font-mono">
                          <span
                            className={`font-black text-xs block ${
                              isCredit ? 'text-emerald-700 dark:text-emerald-400' : 'text-stone-700 dark:text-stone-300'
                            }`}
                          >
                            {isCredit ? '+' : '-'}₹{amountRupees.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </span>
                          <span className="text-[10px] text-stone-400 dark:text-stone-500 block">
                            Bal: ₹{balanceAfterRupees.toLocaleString('en-IN')}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

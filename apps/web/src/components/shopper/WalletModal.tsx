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

  // Fetch live wallet balance, limits, and real ledger transactions
  const fetchWalletData = useCallback(async () => {
    if (!token && !authFetch) return;
    try {
      setRefreshing(true);
      const [walletRes, txRes] = await Promise.all([
        authFetch(`${API_BASE}/wallet`),
        authFetch(`${API_BASE}/wallet/transactions?page=1&limit=20`),
      ]);

      if (walletRes.ok) {
        const walletData = await walletRes.json();
        if (walletData.data) {
          const w = walletData.data.wallet || walletData.data;
          const lim = walletData.data.limits;
          if (w && typeof w.balancePaise === 'number') {
            setLiveBalancePaise(w.balancePaise);
          } else if (typeof walletData.data.balancePaise === 'number') {
            setLiveBalancePaise(walletData.data.balancePaise);
          }
          if (lim) {
            const minPaise =
              lim.minTopupPaise ??
              (typeof lim.minTopupRupees === 'number' ? Math.round(lim.minTopupRupees * 100) : 100);
            const maxPaise =
              lim.maxTopupPaise ??
              (typeof lim.maxTopupRupees === 'number' ? Math.round(lim.maxTopupRupees * 100) : 1000000);
            const maxBal =
              lim.maxBalancePaise ??
              (typeof lim.maxBalanceRupees === 'number' ? Math.round(lim.maxBalanceRupees * 100) : 5000000);
            const chips =
              (lim.quickAddChipsRupees?.length && lim.quickAddChipsRupees) ||
              (lim.quickAddChips?.length && lim.quickAddChips) ||
              [50, 100, 200, 500];

            setLimits({
              minTopupPaise: minPaise,
              maxTopupPaise: maxPaise,
              maxBalancePaise: maxBal,
              quickAddChipsRupees: chips,
            });
          }
        }
      }

      if (txRes.ok) {
        const txData = await txRes.json();
        if (txData.data && Array.isArray(txData.data.items)) {
          setTransactions(txData.data.items);
        }
      }
    } catch (err) {
      console.error('Failed to fetch wallet info:', err);
    } finally {
      setRefreshing(false);
    }
  }, [authFetch, token]);

  useEffect(() => {
    if (isOpen) {
      fetchWalletData();
    }
  }, [isOpen, fetchWalletData]);

  // Keep liveBalance in sync with balance prop if updated externally
  useEffect(() => {
    if (balance > 0 && liveBalancePaise === 0) {
      setLiveBalancePaise(Math.round(balance * 100));
    }
  }, [balance, liveBalancePaise]);

  if (!isOpen) return null;

  const currentRupees = liveBalancePaise / 100;
  const targetRupees = customAmount ? parseFloat(customAmount) : selectedTopup;

  const handleTopupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const amountToAdd = customAmount ? parseFloat(customAmount) : selectedTopup;
    if (isNaN(amountToAdd) || amountToAdd <= 0) {
      setErrorMessage('Please enter a valid top-up amount');
      return;
    }

    const amountPaise = Math.round(amountToAdd * 100);
    if (amountPaise < limits.minTopupPaise) {
      setErrorMessage(`Minimum top-up is ₹${limits.minTopupPaise / 100}`);
      return;
    }
    if (amountPaise > limits.maxTopupPaise) {
      setErrorMessage(`Maximum top-up per transaction is ₹${limits.maxTopupPaise / 100}`);
      return;
    }
    if (liveBalancePaise + amountPaise > limits.maxBalancePaise) {
      setErrorMessage(
        `Wallet balance limit exceeded. Maximum wallet capacity is ₹${limits.maxBalancePaise / 100}`
      );
      return;
    }

    setIsProcessing(true);

    try {
      const idempotencyKey = `topup_${user?.id || 'guest'}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

      // 1. Create Top-up Intent on backend
      const intentRes = await authFetch(`${API_BASE}/wallet/topup/intent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'idempotency-key': idempotencyKey,
        },
        body: JSON.stringify({
          amountRupees: amountToAdd,
          amountPaise,
        }),
      });

      const intentJson = await intentRes.json();
      if (!intentRes.ok) {
        throw new Error(intentJson.error?.message || intentJson.message || 'Failed to initiate top-up');
      }

      const intentPayload = intentJson.data?.razorpay || intentJson.data?.intent || intentJson.data;
      const orderId = intentPayload?.orderId || intentPayload?.id || intentJson.data?.orderId;
      const keyId = intentPayload?.keyId || intentJson.data?.keyId;
      const amountPaiseFinal = intentPayload?.amountPaise || intentJson.data?.amountPaise || amountPaise;
      const currency = intentPayload?.currency || intentJson.data?.currency || 'INR';
      const isSimulated = intentJson.data?.isSimulated ?? (!keyId || keyId === 'rzp_test_placeholder');

      // 2. Open Razorpay Checkout or verify simulation
      const sdkReady = await loadRazorpaySdk();

      const completeVerification = async (paymentId: string, signature: string) => {
        const verifyRes = await authFetch(`${API_BASE}/wallet/topup/verify`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            razorpay_order_id: orderId,
            razorpay_payment_id: paymentId,
            razorpay_signature: signature,
            orderId,
            paymentId,
            signature,
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
        keyId.startsWith('rzp_') &&
        keyId !== 'rzp_test_placeholder' &&
        !isSimulated
      ) {
        const options = {
          key: keyId,
          amount: amountPaiseFinal,
          currency,
          name: 'CartPilot Wallet',
          description: `Top-up ₹${amountToAdd}`,
          order_id: orderId,
          prefill: {
            name: user?.name || '',
            email: user?.email || '',
          },
          theme: {
            color: '#10B981',
          },
          handler: async (response: any) => {
            try {
              await completeVerification(
                response.razorpay_payment_id,
                response.razorpay_signature
              );
            } catch (vErr: any) {
              setErrorMessage(vErr.message || 'Verification failed');
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
        rzp.open();
      } else {
        // Safe sandbox simulator for local testing or placeholder keys
        await completeVerification(
          `pay_sim_${Date.now()}`,
          'sig_sim_test'
        );
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

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full sm:max-w-md bg-stone-950 text-stone-100 rounded-t-3xl sm:rounded-3xl shadow-2xl border border-stone-800/80 overflow-hidden flex flex-col max-h-[92dvh] animate-in zoom-in-95 duration-200">
        {/* ── Top Header ────────────────────────────────────────────────────── */}
        <div className="px-5 py-4 border-b border-stone-800/80 flex items-center justify-between bg-stone-900/60 backdrop-blur-sm flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-emerald-950/80 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shadow-inner">
              <Wallet className="w-4.5 h-4.5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-extrabold text-base text-white tracking-tight leading-none">
                  CartPilot Wallet
                </h3>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-800/60">
                  LEDGER
                </span>
              </div>
              <p className="text-[11px] text-stone-400 mt-0.5">
                Instant 1-tap checkout • Zero gateway fees
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={fetchWalletData}
              disabled={refreshing}
              className="p-2 rounded-xl text-stone-400 hover:text-white hover:bg-stone-800/80 transition-colors cursor-pointer"
              title="Refresh ledger"
              aria-label="Refresh wallet"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-emerald-400' : ''}`} />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-stone-400 hover:text-white hover:bg-stone-800/80 transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ── Scrollable Body ────────────────────────────────────────────────── */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1 min-h-0">
          {/* Obsidian Black Balance Card (Premium Fintech Aesthetic) */}
          <div className="relative rounded-3xl bg-gradient-to-br from-stone-900 via-stone-900 to-stone-950 border border-stone-800/90 p-5 shadow-xl overflow-hidden">
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
          <div className="flex p-1 bg-stone-900 rounded-2xl border border-stone-800/90 text-xs font-bold">
            <button
              type="button"
              onClick={() => setActiveTab('topup')}
              className={`flex-1 py-2 rounded-xl transition-all cursor-pointer ${
                activeTab === 'topup'
                  ? 'bg-stone-800 text-white shadow-sm'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              Add Money
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('history')}
              className={`flex-1 py-2 rounded-xl transition-all cursor-pointer ${
                activeTab === 'history'
                  ? 'bg-stone-800 text-white shadow-sm'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              Ledger Activity ({transactions.length})
            </button>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-rose-950/40 border border-rose-800/60 text-rose-300 text-xs flex items-start gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1 font-medium">{errorMessage}</div>
            </div>
          )}

          {/* Success Banner */}
          {isSuccess && (
            <div className="p-4 rounded-2xl bg-emerald-950/50 border border-emerald-800/60 text-center space-y-1.5 animate-in zoom-in-95">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
              <h4 className="font-bold text-sm text-white">Funds Added!</h4>
              <p className="text-xs text-emerald-300/80">{successMessage}</p>
            </div>
          )}

          {activeTab === 'topup' ? (
            <form onSubmit={handleTopupSubmit} className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-stone-300">
                    Select Quick Top-Up Amount
                  </label>
                  <span className="text-[11px] text-stone-500 font-mono">
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
                            ? 'border-emerald-500 bg-emerald-950/60 text-emerald-300 ring-2 ring-emerald-500/30'
                            : 'border-stone-800 bg-stone-900 text-stone-300 hover:bg-stone-850 hover:border-stone-700'
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
                    className="w-full pl-8 pr-4 py-3 rounded-2xl border border-stone-800 bg-stone-900 text-sm font-bold text-white placeholder:text-stone-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all font-mono"
                  />
                </div>
              </div>

              {/* Action Button */}
              <button
                type="submit"
                disabled={isProcessing || targetRupees <= 0}
                className="w-full py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:scale-[0.99] text-white font-extrabold text-sm shadow-lg shadow-emerald-900/30 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
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

              <p className="text-center text-[11px] text-stone-500">
                Supports UPI, Credit/Debit Cards, NetBanking via Razorpay
              </p>
            </form>
          ) : (
            /* Real Ledger Activity */
            <div className="space-y-2">
              {transactions.length === 0 ? (
                <div className="py-8 text-center space-y-2 rounded-2xl bg-stone-900/40 border border-stone-850">
                  <Clock className="w-8 h-8 text-stone-600 mx-auto" />
                  <p className="text-xs font-semibold text-stone-400">No transactions recorded yet</p>
                  <p className="text-[11px] text-stone-500 max-w-xs mx-auto">
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
                        className="p-3 rounded-2xl bg-stone-900 border border-stone-800/80 flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
                              isCredit
                                ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/50'
                                : 'bg-rose-950/80 text-rose-400 border border-rose-800/50'
                            }`}
                          >
                            {isCredit ? (
                              <ArrowDownLeft className="w-4 h-4" />
                            ) : (
                              <ArrowUpRight className="w-4 h-4" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-stone-200 truncate leading-tight">
                              {tx.description || tx.type}
                            </p>
                            <p className="text-[10px] text-stone-500 font-mono mt-0.5">
                              {formatTxDate(tx.createdAt)}
                            </p>
                          </div>
                        </div>

                        <div className="text-right flex-shrink-0 font-mono">
                          <span
                            className={`font-black text-xs block ${
                              isCredit ? 'text-emerald-400' : 'text-stone-300'
                            }`}
                          >
                            {isCredit ? '+' : '-'}₹{amountRupees.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </span>
                          <span className="text-[10px] text-stone-500 block">
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

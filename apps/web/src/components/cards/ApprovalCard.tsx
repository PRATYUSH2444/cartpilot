import React from 'react';
import { Check, X, ShieldAlert, KeyRound, CheckCircle2, AlertOctagon, CreditCard, ShoppingBag, Store } from 'lucide-react';

interface ApprovalItem {
  name: string;
  quantity: number;
  unitPricePaise?: number;
  pricePaise?: number;
  subtotalPaise?: number;
  itemTotalPaise?: number;
  packageSize?: number;
  packageUnit?: string;
}

interface ApprovalCardProps {
  cartTotal: string;
  reason: string;
  cartVersion: number;
  approvalHash?: string;
  status?: string;
  merchantName?: string;
  items?: ApprovalItem[];
  paymentMethod?: string;
  onApprove: () => void;
  onReject: () => void;
  isLoading?: boolean;
}

export const ApprovalCard: React.FC<ApprovalCardProps> = ({
  cartTotal,
  reason,
  cartVersion,
  approvalHash,
  status = 'PENDING',
  merchantName = 'Fresh Greens Organics',
  items,
  paymentMethod = 'Standard UPI / Test Gateway',
  onApprove,
  onReject,
  isLoading = false,
}) => {
  const isApproved = status === 'APPROVED';
  const isInvalidated = status === 'INVALIDATED';
  const isRejected = status === 'REJECTED';

  return (
    <div
      className={`w-full rounded-2xl border p-5 backdrop-blur-xl shadow-lg transition-all ${
        isApproved
          ? 'border-emerald-500/30 bg-card/90 dark:bg-card-top/90 shadow-emerald-500/5'
          : isInvalidated || isRejected
            ? 'border-rose-500/30 bg-card/90 dark:bg-card-top/90 shadow-rose-500/5'
            : 'border-amber-500/30 bg-card/90 dark:bg-card-top/90 shadow-amber-500/5'
      }`}
    >
      {/* Status Chip Header */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-brd">
        <div className="flex items-center gap-2">
          <div
            className={`p-1.5 rounded-lg ${
              isApproved
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                : isInvalidated || isRejected
                  ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                  : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
            }`}
          >
            {isApproved ? (
              <CheckCircle2 className="w-4 h-4" />
            ) : isInvalidated || isRejected ? (
              <AlertOctagon className="w-4 h-4" />
            ) : (
              <ShieldAlert className="w-4 h-4" />
            )}
          </div>
          <span
            className={`text-[10px] font-mono uppercase tracking-wider font-bold px-2 py-0.5 rounded-full border ${
              isApproved
                ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
                : isInvalidated
                  ? 'text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/30'
                  : isRejected
                    ? 'text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/30'
                    : 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/30'
            }`}
          >
            {isApproved
              ? 'Permission Granted'
              : isInvalidated
                ? 'Approval Invalidated'
                : isRejected
                  ? 'Denied by User'
                  : 'Waiting for your confirmation'}
          </span>
        </div>
        <div className="text-right">
          <span className="text-[10px] font-mono text-mut block uppercase">Estimated Total</span>
          <span className="text-sm font-display font-extrabold text-ink">{cartTotal}</span>
        </div>
      </div>

      {/* Main Prompt */}
      <div className="mb-4">
        <h3 className="text-sm font-display font-bold text-ink leading-snug">
          {isApproved
            ? `Order confirmed with ${merchantName}`
            : `CartPilot wants to place an order with ${merchantName}. Verify the details before allowing.`}
        </h3>
        <p className="text-xs text-mut mt-1 leading-relaxed">
          {isInvalidated
            ? 'Cart items were modified after this approval token was created. Review and re-approve the updated total.'
            : isRejected
              ? 'You denied this purchase proposal. The cart remains preserved.'
              : reason}
        </p>
      </div>

      {/* Item Summary Row if provided */}
      {items && items.length > 0 && (
        <div className="p-3 rounded-xl border border-brd bg-paper/60 mb-3 space-y-1.5 text-xs">
          <div className="flex items-center justify-between text-muted-foreground text-[11px] font-semibold text-ink border-b border-brd/60 pb-1">
            <span className="flex items-center gap-1.5">
              <ShoppingBag className="w-3.5 h-3.5 text-acc" />
              <span>Basket Summary ({items.length} items)</span>
            </span>
            <span className="font-mono text-[10px] text-mut">Snapshot</span>
          </div>
          <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
            {items.map((it, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs py-0.5">
                <span className="text-ink truncate mr-2">
                  {it.name} <span className="text-mut font-mono">× {it.quantity}</span>
                </span>
                <span className="font-mono text-[11px] text-ink flex-shrink-0">
                  ₹{(((it.subtotalPaise || it.itemTotalPaise || (it.unitPricePaise || it.pricePaise || 0) * it.quantity)) / 100).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Payment Method & Cryptographic Digest Row */}
      <div className="p-3 rounded-xl border border-brd bg-paper/50 text-xs mb-4 space-y-2">
        <div className="flex items-center justify-between text-mut">
          <span className="flex items-center gap-1.5">
            <CreditCard className="w-3.5 h-3.5 text-acc" /> Payment Method:
          </span>
          <span className="font-mono font-medium text-ink">{paymentMethod}</span>
        </div>
        <div className="flex items-center justify-between text-mut">
          <span className="flex items-center gap-1.5">
            <Store className="w-3.5 h-3.5 text-acc" /> Merchant Store:
          </span>
          <span className="font-mono font-semibold text-ink">{merchantName}</span>
        </div>
        <div className="flex items-center justify-between text-mut">
          <span>Bound Cart Version:</span>
          <span className="font-mono font-bold text-ink">v{cartVersion}</span>
        </div>
        {approvalHash && (
          <div className="flex items-center justify-between text-mut">
            <span className="flex items-center gap-1">
              <KeyRound className="w-3 h-3 text-acc" /> SHA-256 Digest:
            </span>
            <span
              className="font-mono font-bold text-ink truncate max-w-[180px]"
              title={approvalHash}
            >
              {approvalHash.substring(0, 16)}...
            </span>
          </div>
        )}
      </div>

      {/* Action buttons: Deny and Allow */}
      {!isApproved && !isRejected && !isInvalidated && (
        <div className="flex items-center gap-3">
          <button
            onClick={onReject}
            disabled={isLoading}
            className="flex-1 py-2.5 px-4 rounded-xl border border-brd text-ink hover:bg-paper/80 font-display font-bold text-xs flex items-center justify-center gap-1.5 transition-all disabled:opacity-50 min-h-[44px] cursor-pointer"
          >
            <X className="w-4 h-4 text-rose-500" />
            <span>Deny</span>
          </button>
          <button
            onClick={onApprove}
            disabled={isLoading}
            className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-display font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20 transition-all disabled:opacity-50 min-h-[44px] cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>Allow &amp; Proceed</span>
          </button>
        </div>
      )}
    </div>
  );
};

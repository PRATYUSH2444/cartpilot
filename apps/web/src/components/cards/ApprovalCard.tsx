import React from 'react';
import { Check, X, ShieldAlert, KeyRound, CheckCircle2, AlertOctagon } from 'lucide-react';

interface ApprovalCardProps {
  cartTotal: string;
  reason: string;
  cartVersion: number;
  approvalHash?: string;
  status?: string;
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
  onApprove,
  onReject,
  isLoading = false,
}) => {
  const isApproved = status === 'APPROVED';
  const isInvalidated = status === 'INVALIDATED';

  return (
    <div
      className={`w-full rounded-2xl border p-5 backdrop-blur-xl shadow-lg transition-all ${
        isApproved
          ? 'border-emerald-500/30 bg-emerald-500/5 shadow-emerald-500/5'
          : isInvalidated
            ? 'border-rose-500/30 bg-rose-500/5 shadow-rose-500/5'
            : 'border-amber-500/30 bg-amber-500/5 shadow-amber-500/5'
      }`}
    >
      <div className="flex items-start gap-3.5 mb-4">
        <div
          className={`p-2.5 rounded-xl mt-0.5 ${
            isApproved
              ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
              : isInvalidated
                ? 'bg-rose-500/20 text-rose-600 dark:text-rose-400'
                : 'bg-amber-500/20 text-amber-600 dark:text-amber-400'
          }`}
        >
          {isApproved ? (
            <CheckCircle2 className="w-5 h-5" />
          ) : isInvalidated ? (
            <AlertOctagon className="w-5 h-5" />
          ) : (
            <ShieldAlert className="w-5 h-5" />
          )}
        </div>
        <div>
          <span
            className={`text-[10px] font-mono uppercase tracking-wider font-bold px-2 py-0.5 rounded-full border ${
              isApproved
                ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
                : isInvalidated
                  ? 'text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/30'
                  : 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/30'
            }`}
          >
            {isApproved
              ? 'Cryptographically Approved'
              : isInvalidated
                ? 'Approval Invalidated'
                : 'Human Confirmation Required'}
          </span>
          <h3 className="text-sm font-display font-bold text-ink mt-1.5">
            Cart Total of {cartTotal}{' '}
            {isApproved
              ? 'Approved by Customer'
              : isInvalidated
                ? 'Requires Re-Evaluation'
                : 'Exceeds Autonomous Limit'}
          </h3>
          <p className="text-xs text-mut mt-1 leading-relaxed">
            {isInvalidated
              ? 'Cart items were modified after this approval token was created. Review and re-approve the updated total.'
              : reason}
          </p>
        </div>
      </div>

      <div className="p-3 rounded-xl border border-brd bg-card/60 dark:bg-card-top/60 text-xs mb-4 space-y-2">
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
              className="font-mono font-bold text-ink truncate max-w-[190px]"
              title={approvalHash}
            >
              {approvalHash.substring(0, 16)}...
            </span>
          </div>
        )}
        <p className="text-[11px] text-mut pt-1 border-t border-brd/60">
          Cryptographically authorizes payment initiation for this exact snapshot. Mutating items
          will immediately invalidate this token.
        </p>
      </div>

      {/* Action buttons */}
      {!isApproved && (
        <div className="flex items-center gap-3">
          <button
            onClick={onApprove}
            disabled={isLoading}
            className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-display font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 transition-all disabled:opacity-50"
          >
            <Check className="w-4 h-4" /> Approve Proposal
          </button>
          <button
            onClick={onReject}
            disabled={isLoading}
            className="flex-1 py-2.5 px-4 rounded-xl border border-rose-500/30 text-rose-600 hover:bg-rose-500/10 font-display font-bold text-xs flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            <X className="w-4 h-4" /> Reject Proposal
          </button>
        </div>
      )}
    </div>
  );
};

import { Check, X, ShieldAlert } from 'lucide-react';

interface ApprovalCardProps {
  cartTotal: string;
  reason: string;
  cartVersion: number;
  onApprove: () => void;
  onReject: () => void;
  isLoading?: boolean;
}

export const ApprovalCard: React.FC<ApprovalCardProps> = ({
  cartTotal,
  reason,
  cartVersion,
  onApprove,
  onReject,
  isLoading = false,
}) => {
  return (
    <div className="w-full rounded-2xl border border-amber-500/30 bg-amber-500/5 backdrop-blur-xl p-5 shadow-lg shadow-amber-500/5 transition-all">
      <div className="flex items-start gap-3.5 mb-4">
        <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 mt-0.5">
          <ShieldAlert className="w-5 h-5" />
        </div>
        <div>
          <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30">
            Human-in-the-Loop Required
          </span>
          <h3 className="text-sm font-display font-bold text-ink mt-1.5">
            Cart Total of {cartTotal} Exceeds Autonomous Threshold
          </h3>
          <p className="text-xs text-mut mt-1 leading-relaxed">{reason}</p>
        </div>
      </div>

      <div className="p-3 rounded-xl border border-amber-500/20 bg-card/60 dark:bg-card-top/60 text-xs mb-4">
        <div className="flex items-center justify-between text-mut mb-1">
          <span>Bound Cart Version:</span>
          <span className="font-mono font-bold text-ink">v{cartVersion}</span>
        </div>
        <p className="text-[11px] text-mut">
          Signing this approval cryptographically authorizes payment initiation for this exact cart
          total. Mutating the cart will automatically invalidate this approval.
        </p>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-3">
        <button
          onClick={onApprove}
          disabled={isLoading}
          className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-display font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 transition-all"
        >
          <Check className="w-4 h-4" /> Approve Proposal
        </button>
        <button
          onClick={onReject}
          disabled={isLoading}
          className="flex-1 py-2.5 px-4 rounded-xl border border-rose-500/30 text-rose-600 hover:bg-rose-500/10 font-display font-bold text-xs flex items-center justify-center gap-2 transition-all"
        >
          <X className="w-4 h-4" /> Reject Proposal
        </button>
      </div>
    </div>
  );
};

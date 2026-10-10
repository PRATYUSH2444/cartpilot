import { ShieldCheck, Hash, FileCheck, Layers } from 'lucide-react';

interface ProofCardProps {
  orderNumber?: string;
  cartVersion?: number;
  totalPaise?: number;
  gatewayOrderId?: string;
}

export const ProofCard: React.FC<ProofCardProps> = ({
  orderNumber: _orderNumber = 'CP-20261010-9883',
  cartVersion = 4,
  totalPaise = 23950,
  gatewayOrderId = 'order_rzp_mock_live',
}) => {
  return (
    <div className="w-full rounded-2xl border border-brd bg-card/85 dark:bg-card-top/85 backdrop-blur-xl p-5 shadow-lg shadow-black/5 transition-all">
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-brd">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
            <FileCheck className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-display font-bold text-ink tracking-tight">
              Cryptographic Audit Proof
            </h3>
            <p className="text-xs text-mut font-mono">Immutable Evidence Ledger</p>
          </div>
        </div>
        <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 font-semibold border border-purple-500/20">
          SHA-256 VERIFIED
        </span>
      </div>

      <div className="space-y-2 text-xs mb-4">
        <div className="p-2.5 rounded-lg border border-brd bg-paper/50 flex items-center justify-between">
          <span className="text-mut flex items-center gap-1.5 font-sans">
            <Layers className="w-3.5 h-3.5 text-acc" /> Bound Cart Version
          </span>
          <span className="font-mono font-bold text-ink">v{cartVersion}</span>
        </div>

        <div className="p-2.5 rounded-lg border border-brd bg-paper/50 flex items-center justify-between">
          <span className="text-mut flex items-center gap-1.5 font-sans">
            <Hash className="w-3.5 h-3.5 text-emerald-500" /> Integer Paise Total
          </span>
          <span className="font-mono font-bold text-ink">{totalPaise} paise</span>
        </div>

        <div className="p-2.5 rounded-lg border border-brd bg-paper/50 flex items-center justify-between">
          <span className="text-mut flex items-center gap-1.5 font-sans">
            <ShieldCheck className="w-3.5 h-3.5 text-purple-500" /> Gateway Order ID
          </span>
          <span className="font-mono font-bold text-ink truncate max-w-[180px]">
            {gatewayOrderId}
          </span>
        </div>
      </div>

      <div className="p-3 rounded-xl border border-brd bg-paper/40 text-[11px] text-mut space-y-1">
        <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
          <ShieldCheck className="w-3.5 h-3.5" /> All 5 Gateway Invariants Satisfied:
        </div>
        <ul className="list-disc list-inside space-y-0.5 text-mut pl-1">
          <li>Catalog: 100% Strictly Vegetarian</li>
          <li>Pricing: Pure server-side integer paise calculation</li>
          <li>Inventory: Concurrency-safe atomic reservations</li>
          <li>Security: Agent cannot press Pay (Human-in-the-loop)</li>
          <li>Payment: Cryptographic HMAC signature verification</li>
        </ul>
      </div>
    </div>
  );
};

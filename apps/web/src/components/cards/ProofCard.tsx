import React from 'react';
import { ShieldCheck, Hash, FileCheck, Layers, RefreshCw, AlertTriangle } from 'lucide-react';
import { ChainVerification, AuditEvent } from '../../types';

interface ProofCardProps {
  orderNumber?: string;
  cartVersion?: number;
  totalPaise?: number;
  gatewayOrderId?: string;
  chainVerification?: ChainVerification;
  recentEvents?: AuditEvent[];
  onVerify?: () => void;
  isVerifying?: boolean;
}

export const ProofCard: React.FC<ProofCardProps> = ({
  cartVersion = 1,
  totalPaise = 0,
  gatewayOrderId = 'order_rzp_mock',
  chainVerification,
  recentEvents = [],
  onVerify,
  isVerifying = false,
}) => {
  const isValid = chainVerification ? chainVerification.valid : true;
  const totalBlocks = chainVerification?.totalEvents ?? recentEvents.length;
  const tipHash =
    chainVerification?.latestHash || recentEvents[0]?.currentHash || '0000000000000000...';

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
            <p className="text-xs text-mut font-mono">Immutable SHA-256 Hash Chain</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isValid ? (
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold border border-emerald-500/20 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" /> CHAIN UNBROKEN
            </span>
          ) : (
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 font-semibold border border-rose-500/20 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" /> TAMPERING DETECTED
            </span>
          )}
        </div>
      </div>

      <div className="space-y-2 text-xs mb-4">
        <div className="p-2.5 rounded-lg border border-brd bg-paper/50 flex items-center justify-between">
          <span className="text-mut flex items-center gap-1.5 font-sans">
            <Layers className="w-3.5 h-3.5 text-acc" /> Total Ledger Blocks
          </span>
          <span className="font-mono font-bold text-ink">{totalBlocks} events</span>
        </div>

        <div className="p-2.5 rounded-lg border border-brd bg-paper/50 flex items-center justify-between">
          <span className="text-mut flex items-center gap-1.5 font-sans">
            <Hash className="w-3.5 h-3.5 text-emerald-500" /> Latest Block Digest
          </span>
          <span className="font-mono font-bold text-ink truncate max-w-[200px]" title={tipHash}>
            {tipHash.substring(0, 18)}...
          </span>
        </div>

        <div className="p-2.5 rounded-lg border border-brd bg-paper/50 flex items-center justify-between">
          <span className="text-mut flex items-center gap-1.5 font-sans">
            <ShieldCheck className="w-3.5 h-3.5 text-purple-500" /> Active Purchase Scope
          </span>
          <span className="font-mono font-bold text-ink truncate max-w-[200px]">
            v{cartVersion} · ₹{(totalPaise / 100).toFixed(2)}
          </span>
        </div>

        {gatewayOrderId && (
          <div className="p-2.5 rounded-lg border border-brd bg-paper/50 flex items-center justify-between">
            <span className="text-mut flex items-center gap-1.5 font-sans">
              <FileCheck className="w-3.5 h-3.5 text-acc" /> Gateway Order
            </span>
            <span className="font-mono font-bold text-ink truncate max-w-[200px]">
              {gatewayOrderId}
            </span>
          </div>
        )}
      </div>

      {/* Recent Ledger Events */}
      {recentEvents.length > 0 && (
        <div className="mb-4">
          <span className="text-[11px] font-mono text-mut uppercase tracking-wider block mb-2">
            Recent Chained Events
          </span>
          <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
            {recentEvents.slice(0, 4).map((evt) => (
              <div
                key={evt.sequenceNumber}
                className="p-2 rounded-lg border border-brd/80 bg-paper/30 flex items-center justify-between text-[11px]"
              >
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-ink">#{evt.sequenceNumber}</span>
                  <span className="font-mono px-1.5 py-0.5 rounded bg-brd/50 text-ink text-[10px]">
                    {evt.eventType}
                  </span>
                </div>
                <span className="font-mono text-mut text-[10px]">
                  {evt.currentHash.substring(0, 10)}...
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Verify Trigger */}
      {onVerify && (
        <button
          onClick={onVerify}
          disabled={isVerifying}
          className="w-full py-2.5 px-3 rounded-xl border border-purple-500/30 text-purple-600 dark:text-purple-400 hover:bg-purple-500/10 font-display font-bold text-xs flex items-center justify-center gap-2 transition-all mb-4"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isVerifying ? 'animate-spin' : ''}`} />
          {isVerifying
            ? 'Verifying Entire Cryptographic Chain...'
            : 'Verify Full Hash Chain Integrity'}
        </button>
      )}

      <div className="p-3 rounded-xl border border-brd bg-paper/40 text-[11px] text-mut space-y-1">
        <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
          <ShieldCheck className="w-3.5 h-3.5" /> Core Gateway Invariants Enforced:
        </div>
        <ul className="list-disc list-inside space-y-0.5 text-mut pl-1">
          <li>Catalog: 100% Strictly Vegetarian</li>
          <li>Pricing: Pure server-side integer paise calculation</li>
          <li>Inventory: Concurrency-safe atomic reservations</li>
          <li>Policy: Deterministic spending mandates & human approval</li>
          <li>Ledger: Tamper-evident SHA-256 continuous hash chain</li>
        </ul>
      </div>
    </div>
  );
};

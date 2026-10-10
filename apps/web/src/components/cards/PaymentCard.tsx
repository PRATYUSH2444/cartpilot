import { CreditCard, ShieldCheck, ShieldAlert, Lock } from 'lucide-react';

interface PaymentCardProps {
  orderId: string;
  orderNumber: string;
  razorpayOrderId: string;
  amountPaise: number;
  onVerifySuccess: () => void;
  onVerifyFail: () => void;
  isLoading?: boolean;
}

export const PaymentCard: React.FC<PaymentCardProps> = ({
  orderId: _orderId,
  orderNumber,
  razorpayOrderId,
  amountPaise,
  onVerifySuccess,
  onVerifyFail,
  isLoading = false,
}) => {
  const rupees = (amountPaise / 100).toFixed(2);

  return (
    <div className="w-full rounded-2xl border border-blue-500/30 bg-card/90 dark:bg-card-top/90 backdrop-blur-xl p-5 shadow-xl shadow-blue-500/10 transition-all">
      {/* Razorpay Test Gateway Brand Banner */}
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-brd">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-black text-sm tracking-tighter">
            rzp
          </div>
          <div>
            <h3 className="text-sm font-display font-bold text-ink tracking-tight flex items-center gap-1.5">
              Razorpay Test Checkout Bridge
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-500/10 text-acc font-semibold border border-blue-500/20">
                SANDBOX
              </span>
            </h3>
            <p className="text-xs text-mut font-mono">Gateway Order: {razorpayOrderId}</p>
          </div>
        </div>
        <div className="text-right">
          <span className="text-[10px] text-mut uppercase font-mono">Amount Due</span>
          <div className="text-base font-display font-black text-acc">₹{rupees}</div>
        </div>
      </div>

      {/* Security & Human-in-the-loop reminder */}
      <div className="p-3.5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 mb-4 text-xs text-ink">
        <div className="flex items-center gap-1.5 font-bold text-emerald-600 dark:text-emerald-400 mb-1">
          <ShieldCheck className="w-4 h-4" />
          Strict Human-in-the-Loop Protocol Enforced
        </div>
        <p className="text-mut text-[11px] leading-relaxed">
          The AI agent is architecturally barred from pressing Pay. Only an explicit human action
          can sign the transaction and trigger server-side HMAC cryptographic verification.
        </p>
      </div>

      {/* Test Simulated Card Details */}
      <div className="p-3.5 rounded-xl border border-brd bg-paper/60 mb-5 space-y-2 text-xs">
        <div className="flex items-center justify-between text-mut">
          <span className="flex items-center gap-1.5">
            <CreditCard className="w-4 h-4 text-acc" /> Test Payment Method:
          </span>
          <span className="font-mono font-medium text-ink">Standard UPI / Visa Test</span>
        </div>
        <div className="flex items-center justify-between text-mut">
          <span>Order Number:</span>
          <span className="font-mono font-bold text-ink">{orderNumber}</span>
        </div>
        <div className="flex items-center justify-between text-mut">
          <span>Inventory Reservation:</span>
          <span className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
            15m TTL Active
          </span>
        </div>
      </div>

      {/* Two interactive action buttons for demo & security verification */}
      <div className="space-y-2.5">
        <button
          onClick={onVerifySuccess}
          disabled={isLoading}
          className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-display font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition-all"
        >
          <Lock className="w-3.5 h-3.5" />
          <span>Authorize & Pay ₹{rupees} (HMAC-SHA256 Signed)</span>
        </button>

        <button
          onClick={onVerifyFail}
          disabled={isLoading}
          className="w-full py-2 px-3 rounded-lg border border-rose-500/30 text-rose-600 hover:bg-rose-500/10 font-mono text-[11px] flex items-center justify-center gap-1.5 transition-all"
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>Simulate Forged Signature Attack (Expect 400 Reject)</span>
        </button>
      </div>
    </div>
  );
};

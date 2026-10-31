import React from 'react';
import {
  X,
  RefreshCw,
  Phone,
  Truck,
  Clock,
  Store,
  Home,
  Check,
} from 'lucide-react';
import { OrderData } from '../../types';

interface LiveTrackingModalProps {
  order: OrderData | null;
  isOpen: boolean;
  onClose: () => void;
  onRefresh?: () => void;
}

export const LiveTrackingModal: React.FC<LiveTrackingModalProps> = ({
  order,
  isOpen,
  onClose,
  onRefresh,
}) => {
  if (!isOpen || !order) return null;

  const orderNum = order.orderNumber || `ORD-${order._id.slice(-6).toUpperCase()}`;
  const totalRupees = ((order.pricingSnapshot?.totalPaise || 0) / 100).toFixed(0);
  const itemsCount = order.items?.length || 0;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="w-full sm:max-w-lg bg-[--surface] border border-[--line] rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[92dvh] overflow-hidden animate-in slide-in-from-bottom duration-250">
        {/* Header */}
        <div className="p-4 border-b border-[--line] flex items-center justify-between">
          <div>
            <h2 className="font-heading font-bold text-base text-[--ink] flex items-center gap-2">
              <span>Order #{orderNum}</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[--brand-soft] text-[--brand] font-bold">
                Live Tracking
              </span>
            </h2>
            <p className="text-[10px] text-[--mut] font-mono">
              Estimated Delivery: 20 minutes from confirmation
            </p>
          </div>
          <div className="flex items-center gap-1">
            {onRefresh && (
              <button
                onClick={onRefresh}
                className="p-1.5 text-[--mut] hover:text-[--ink] rounded-full hover:bg-[--surface-2] cursor-pointer"
                title="Refresh Status"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-[--mut] hover:text-[--ink] rounded-full hover:bg-[--surface-2] cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* ── Route Map Preview Graphic ─────────────────────────────────── */}
          <div className="relative h-44 rounded-2xl bg-gradient-to-b from-emerald-900/10 to-emerald-950/20 border border-emerald-500/20 overflow-hidden flex items-center justify-center p-4">
            {/* Background Grid Pattern */}
            <div
              className="absolute inset-0 opacity-20"
              style={{
                backgroundImage:
                  'radial-gradient(circle at 1px 1px, #08643D 1px, transparent 0)',
                backgroundSize: '16px 16px',
              }}
            />

            {/* Simulated Live Route Path SVG */}
            <svg
              className="w-full h-full absolute inset-0 text-[--brand]"
              viewBox="0 0 300 150"
              fill="none"
            >
              <path
                d="M 40 110 C 90 110, 110 50, 160 50 C 210 50, 230 90, 260 90"
                stroke="currentColor"
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray="6 6"
                className="opacity-70 animate-pulse"
              />
            </svg>

            {/* Store Pin (Origin) */}
            <div className="absolute left-8 bottom-7 flex flex-col items-center">
              <div className="w-8 h-8 rounded-full bg-white text-emerald-800 border-2 border-emerald-600 flex items-center justify-center shadow-md">
                <Store className="w-4 h-4" />
              </div>
              <span className="text-[9px] font-bold text-white bg-black/60 px-1.5 py-0.5 rounded-full mt-1">
                Store
              </span>
            </div>

            {/* Scooter Rider Pin (In Transit) */}
            <div className="absolute left-[52%] top-[24%] -translate-x-1/2 flex flex-col items-center animate-bounce">
              <div className="w-9 h-9 rounded-full bg-[--brand] text-white flex items-center justify-center shadow-lg ring-4 ring-white/50">
                <Truck className="w-4 h-4" />
              </div>
              <span className="text-[9px] font-bold text-white bg-[--brand] px-1.5 py-0.2 rounded-full mt-1 shadow-xs">
                Arjun (Rider)
              </span>
            </div>

            {/* Home Pin (Destination) */}
            <div className="absolute right-8 top-12 flex flex-col items-center">
              <div className="w-8 h-8 rounded-full bg-white text-rose-600 border-2 border-rose-600 flex items-center justify-center shadow-md">
                <Home className="w-4 h-4" />
              </div>
              <span className="text-[9px] font-bold text-white bg-black/60 px-1.5 py-0.5 rounded-full mt-1">
                Your Home
              </span>
            </div>
          </div>

          {/* ── Delivery Partner Info Card ─────────────────────────────────── */}
          <div className="p-3.5 rounded-2xl bg-[--surface-2] border border-[--line] flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-[--brand-soft] flex items-center justify-center text-[--brand] flex-shrink-0">
                <Truck className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-heading font-bold text-xs text-[--ink]">
                  Arriving in 12 min
                </h4>
                <p className="text-[11px] text-[--mut] mt-0.5">Your order is on the way</p>
                <p className="text-[10px] text-[--brand] font-semibold mt-0.5">
                  Rider: Arjun · KA 05 AB 1234
                </p>
              </div>
            </div>

            <a
              href="tel:+919876543210"
              className="w-10 h-10 rounded-full bg-[--brand] text-white flex items-center justify-center shadow-xs hover:opacity-90 transition-opacity cursor-pointer flex-shrink-0"
              title="Call Delivery Partner"
            >
              <Phone className="w-4 h-4" />
            </a>
          </div>

          {/* ── Real-Time Stepper ─────────────────────────────────────────── */}
          <div className="p-4 rounded-2xl bg-[--surface-2] border border-[--line] space-y-3">
            <h4 className="font-heading font-bold text-xs text-[--ink] uppercase tracking-wider">
              Order Timeline
            </h4>

            <div className="space-y-4 pl-2 relative border-l-2 border-[--line] ml-3">
              {/* Step 1: Confirmed */}
              <div className="relative pl-5">
                <div className="absolute -left-[19px] top-0.5 w-6 h-6 rounded-full bg-[--brand] text-white flex items-center justify-center shadow-xs">
                  <Check className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h5 className="font-heading font-bold text-xs text-[--ink]">Order Confirmed</h5>
                  <p className="text-[10px] text-[--mut]">10:12 AM · Merchant acknowledged items</p>
                </div>
              </div>

              {/* Step 2: Packed */}
              <div className="relative pl-5">
                <div className="absolute -left-[19px] top-0.5 w-6 h-6 rounded-full bg-[--brand] text-white flex items-center justify-center shadow-xs">
                  <Check className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h5 className="font-heading font-bold text-xs text-[--ink]">Packed at Store</h5>
                  <p className="text-[10px] text-[--mut]">10:18 AM · Quality and pure veg verified</p>
                </div>
              </div>

              {/* Step 3: Out for Delivery */}
              <div className="relative pl-5">
                <div className="absolute -left-[19px] top-0.5 w-6 h-6 rounded-full bg-[--brand] text-white flex items-center justify-center shadow-xs animate-pulse ring-4 ring-[--brand-soft]">
                  <Truck className="w-3 h-3" />
                </div>
                <div>
                  <h5 className="font-heading font-bold text-xs text-[--brand]">
                    Out for Delivery
                  </h5>
                  <p className="text-[10px] text-[--mut]">
                    10:25 AM · Rider Arjun picked up groceries
                  </p>
                </div>
              </div>

              {/* Step 4: Arriving */}
              <div className="relative pl-5 opacity-60">
                <div className="absolute -left-[19px] top-0.5 w-6 h-6 rounded-full bg-[--surface] border-2 border-[--line] text-[--mut] flex items-center justify-center">
                  <Clock className="w-3 h-3" />
                </div>
                <div>
                  <h5 className="font-heading font-semibold text-xs text-[--ink]">
                    Arriving at Doorstep
                  </h5>
                  <p className="text-[10px] text-[--mut]">Estimated at 10:37 AM</p>
                </div>
              </div>
            </div>
          </div>

          {/* ── Items Summary Card ────────────────────────────────────────── */}
          <div className="p-3.5 rounded-2xl bg-[--surface-2] border border-[--line] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[--ink]">
                {itemsCount} items · ₹{totalRupees}
              </span>
            </div>
            <button
              onClick={onClose}
              className="text-xs font-bold text-[--brand] hover:underline cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

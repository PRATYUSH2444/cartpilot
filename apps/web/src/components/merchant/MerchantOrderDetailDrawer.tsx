import React, { useState } from 'react';
import {
  ArrowLeft,
  Printer,
  Phone,
  Mail,
  MapPin,
  CheckCircle2,
} from 'lucide-react';
import { OrderData } from './types';
import { ModalPortal } from '../common/ModalPortal';
import { useScrollLock } from '../../hooks/useScrollLock';

interface OrderDetailDrawerProps {
  orderId: string | null;
  onClose: () => void;
  orders: OrderData[];
  onAdvanceStatus: (orderId: string) => Promise<void>;
  onAcceptOrder?: (orderId: string) => Promise<void>;
  onRejectOrder?: (orderId: string, reason?: string) => Promise<void>;
  isAdvancing: boolean;
}

export const MerchantOrderDetailDrawer: React.FC<OrderDetailDrawerProps> = ({
  orderId,
  onClose,
  orders,
  onAdvanceStatus,
  onAcceptOrder,
  onRejectOrder,
  isAdvancing,
}) => {
  useScrollLock(Boolean(orderId), { onEscape: onClose });
  const [internalNotes, setInternalNotes] = useState('');

  if (!orderId) return null;

  const order = orders.find((o) => o._id === orderId);
  if (!order) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-2xs">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-xl max-w-sm text-center space-y-3">
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">Order not found</p>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  const stages = ['New', 'Accepted', 'Preparing', 'Packed', 'Dispatched', 'Delivered'];

  // Current active step index
  let activeStep = 0;
  if (order.status === 'CONFIRMED' || order.status === 'PENDING_PAYMENT') activeStep = 0;
  else if (order.status === 'ACCEPTED') activeStep = 1;
  else if (order.status === 'PREPARING' || order.status === 'PACKING') activeStep = 2;
  else if (order.status === 'PACKED' || order.status === 'READY_FOR_HANDOVER') activeStep = 3;
  else if (order.status === 'OUT_FOR_DELIVERY' || order.status === 'DISPATCHED') activeStep = 4;
  else if (order.status === 'DELIVERED') activeStep = 5;

  // Next action label
  let nextActionLabel = 'Advance Order';
  if (order.status === 'CONFIRMED' || order.status === 'PENDING_PAYMENT') nextActionLabel = 'Accept Order';
  else if (order.status === 'ACCEPTED') nextActionLabel = 'Start Preparing';
  else if (order.status === 'PREPARING' || order.status === 'PACKING') nextActionLabel = 'Mark as Packed';
  else if (order.status === 'PACKED' || order.status === 'READY_FOR_HANDOVER') nextActionLabel = 'Handover & Dispatch';
  else if (order.status === 'OUT_FOR_DELIVERY' || order.status === 'DISPATCHED') nextActionLabel = 'Confirm Delivery';
  else if (order.status === 'DELIVERED') nextActionLabel = 'Order Completed';

  const orderNum = order.orderNumber || (order._id ? String(order._id).slice(-6).toUpperCase() : 'NEW');
  const subtotalPaise = order.pricingSnapshot?.subtotalPaise || 0;
  const deliveryPaise = order.pricingSnapshot?.deliveryFeePaise || 0;
  const platformPaise = order.pricingSnapshot?.platformFeePaise || 0;
  const totalPaise = order.pricingSnapshot?.totalPaise || 0;

  const addr: any = order.shippingAddressSnapshot || {};
  const customerName = addr.name || order.deliveryNote?.replace(/^Merchant direct order:? */, '') || 'Verified Customer';
  const customerPhone = addr.phone || 'Phone upon dispatch';
  const customerEmail = addr.email || 'customer@cartpilot.com';
  const streetAddress = addr.street || addr.houseFlat || 'Store Pickup / Delivery Address';
  const cityState = `${addr.city || 'Patna'}${addr.postalCode || addr.pincode ? ` - ${addr.postalCode || addr.pincode}` : ''}, ${addr.state || 'Bihar'}`;
  const deliveryInstructions = order.deliveryNote || addr.instructions || 'Standard door delivery.';

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-50 flex justify-end">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
          onClick={onClose}
        />

        {/* Drawer Panel */}
        <div className="relative w-full max-w-4xl h-full bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-200 dark:border-slate-800 z-10 flex flex-col overflow-hidden animate-in slide-in-from-right duration-200">
          {/* Stationary Header */}
          <div className="flex-shrink-0 p-4 sm:p-6 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900">
            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold font-mono text-slate-900 dark:text-white">
                    Order #{orderNum}
                  </h2>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                    Paid
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Placed on Today, 10:24 AM • Verified Vegetarian
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print</span>
              </button>

              {onRejectOrder && (order.status === 'CONFIRMED' || order.status === 'PENDING_PAYMENT') && (
                <button
                  disabled={isAdvancing}
                  onClick={() => {
                    const reason = window.prompt('Reason for rejecting order (e.g. out of stock, store closing):');
                    if (reason !== null) onRejectOrder(order._id, reason || 'Merchant declined');
                  }}
                  className="px-3 py-2 rounded-xl border border-rose-200 dark:border-rose-900/40 text-rose-600 dark:text-rose-400 text-xs font-semibold hover:bg-rose-50 dark:hover:bg-rose-950/20 cursor-pointer"
                >
                  Reject Order
                </button>
              )}

              {order.status !== 'DELIVERED' && order.status !== 'CANCELLED' && order.status !== 'REJECTED' && (
                <button
                  disabled={isAdvancing}
                  onClick={() => {
                    if (onAcceptOrder && (order.status === 'CONFIRMED' || order.status === 'PENDING_PAYMENT')) {
                      onAcceptOrder(order._id);
                    } else {
                      onAdvanceStatus(order._id);
                    }
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 shadow-xs cursor-pointer"
                >
                  {isAdvancing ? (
                    <span>Processing...</span>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{nextActionLabel}</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Stationary Linear Stepper */}
          <div className="flex-shrink-0 px-6 py-5 bg-slate-50/70 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between relative">
              <div className="absolute left-6 right-6 top-3 h-0.5 bg-slate-200 dark:bg-slate-700 -z-0" />
              {stages.map((stage, idx) => {
                const isPast = idx < activeStep;
                const isCurrent = idx === activeStep;
                return (
                  <div key={stage} className="relative z-10 flex flex-col items-center">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
                        isPast
                          ? 'bg-emerald-600 text-white'
                          : isCurrent
                          ? 'bg-emerald-500 text-white ring-4 ring-emerald-100 dark:ring-emerald-950'
                          : 'bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 text-slate-400'
                      }`}
                    >
                      {isPast ? <CheckCircle2 className="w-3.5 h-3.5" /> : idx + 1}
                    </div>
                    <span
                      className={`text-[11px] mt-1.5 font-medium ${
                        isCurrent
                          ? 'font-bold text-emerald-700 dark:text-emerald-400'
                          : isPast
                          ? 'text-slate-700 dark:text-slate-300'
                          : 'text-slate-400'
                      }`}
                    >
                      {stage}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Independently Scrollable Content Body */}
          <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Customer Details */}
            <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-2xs space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
                Customer Details
              </h3>
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-white">{customerName}</p>
                <p className="text-xs text-slate-400">{customerEmail}</p>
                <p className="text-xs font-mono text-slate-600 dark:text-slate-300 mt-1">
                  {customerPhone}
                </p>
              </div>
              <div className="flex items-center gap-2 pt-2">
                <a
                  href={`tel:${customerPhone}`}
                  className="flex-1 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 flex items-center justify-center gap-1.5"
                >
                  <Phone className="w-3.5 h-3.5" /> Call
                </a>
                <a
                  href={`mailto:${customerEmail}`}
                  className="flex-1 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 flex items-center justify-center gap-1.5"
                >
                  <Mail className="w-3.5 h-3.5" /> Message
                </a>
              </div>
            </div>

            {/* Delivery Address */}
            <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-2xs space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
                Delivery Address
              </h3>
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  <p className="font-semibold text-slate-900 dark:text-white">Delivery Destination</p>
                  <p>{streetAddress}</p>
                  <p>{cityState}</p>
                  <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-1 font-medium">
                    Instructions: {deliveryInstructions}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Order Items */}
          <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
              Order Items ({order.items?.length || 4})
            </h3>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {order.items?.map((item, idx) => (
                <div key={idx} className="py-3 flex items-center justify-between gap-4 text-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-800/60 flex items-center justify-center text-lg flex-shrink-0">
                      🥗
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">{item.name}</p>
                      <p className="text-[11px] text-slate-400">
                        {item.packageSize} {item.packageUnit} • ₹{(item.unitPricePaise / 100).toFixed(2)} each
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="font-mono text-slate-500 mr-4">Qty: {item.quantity}</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white">
                      ₹{((item.subtotalPaise || item.unitPricePaise * item.quantity) / 100).toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Payment & Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Payment Details */}
            <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-2xs space-y-2 text-xs">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono mb-2">
                Payment Details
              </h3>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Payment Method:</span>
                <span className="font-semibold text-slate-700 dark:text-slate-200">
                  UPI (Razorpay Gateway)
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Transaction ID:</span>
                <span className="font-mono font-medium text-slate-700 dark:text-slate-200">
                  pay_3H2dK89sL912
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Payment Status:</span>
                <span className="font-semibold text-emerald-600">Captured & Settled</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Paid Timestamp:</span>
                <span className="font-mono text-slate-700 dark:text-slate-200">
                  Today, 10:24 AM
                </span>
              </div>
            </div>

            {/* Order Financial Summary */}
            <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-2xs space-y-2 text-xs">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono mb-2">
                Financial Summary
              </h3>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Items Total:</span>
                <span className="font-mono text-slate-700 dark:text-slate-200">
                  ₹{(subtotalPaise / 100).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Delivery Fee:</span>
                <span className="font-mono text-emerald-600 font-medium">
                  {deliveryPaise === 0 ? 'FREE' : `₹${(deliveryPaise / 100).toFixed(2)}`}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Platform Convenience:</span>
                <span className="font-mono text-slate-700 dark:text-slate-200">
                  ₹{(platformPaise / 100).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between py-2 border-t border-slate-100 dark:border-slate-800 font-bold text-sm">
                <span className="text-slate-900 dark:text-white">Grand Total:</span>
                <span className="font-mono text-emerald-600 dark:text-emerald-400 text-base">
                  ₹{(totalPaise / 100).toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Internal Merchant Notes */}
          <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-2">
            <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Internal Fulfillment Notes
            </h4>
            <textarea
              rows={2}
              value={internalNotes}
              onChange={(e) => setInternalNotes(e.target.value)}
              placeholder="Add internal notes for store staff or packing team..."
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
        </div>
      </div>
    </div>
  </ModalPortal>
  );
};

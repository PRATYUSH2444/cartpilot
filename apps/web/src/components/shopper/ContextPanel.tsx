import React, { useState } from 'react';
import {
  ShoppingBag,
  Plus,
  Minus,
  Trash2,
  ArrowRight,
  Sliders,
  ChevronRight,
  ChevronLeft,
  FileText,
  Clock,
  MapPin,
  CreditCard,
  ShieldCheck,
  Zap,
  Banknote,
} from 'lucide-react';
import { CartData, MandateData, LampStatus, UserAddress } from '../../types';
import { DecisionLamp } from '../DecisionLamp';

interface ContextPanelProps {
  cart: CartData | null;
  mandate: MandateData | null;
  lampStatus: LampStatus;
  lampReasonCode?: string;
  lampReasonText?: string;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onClearCart: () => void;
  onInitiateCheckout: () => void;
  onUpdateDeliveryNote: (note: string) => void;
  onOpenRules: () => void;
  onOpenBrowse: () => void;
  selectedAddress?: UserAddress | null;
  onOpenAddressModal?: () => void;
  isLoading?: boolean;
}

export const ContextPanel: React.FC<ContextPanelProps> = ({
  cart,
  mandate,
  lampStatus,
  lampReasonCode,
  lampReasonText,
  isCollapsed,
  onToggleCollapse,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onInitiateCheckout,
  onUpdateDeliveryNote,
  onOpenRules,
  onOpenBrowse,
  selectedAddress,
  onOpenAddressModal,
  isLoading = false,
}) => {
  const [selectedPaymentMode, setSelectedPaymentMode] = useState<'razorpay' | 'cod'>('razorpay');

  if (isCollapsed) {
    return (
      <aside className="w-12 h-full bg-card dark:bg-card-top border-l border-brd flex flex-col items-center py-4 justify-between flex-shrink-0 transition-all">
        <button
          onClick={onToggleCollapse}
          className="p-2 rounded-xl text-mut hover:text-ink hover:bg-paper transition-colors cursor-pointer"
          title="Expand Context Panel"
          aria-label="Expand context panel"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="flex flex-col items-center gap-4 py-4">
          <button
            onClick={onToggleCollapse}
            className="relative p-2.5 rounded-xl bg-paper hover:bg-paper/80 text-ink cursor-pointer"
            title="Active Cart"
          >
            <ShoppingBag className="w-5 h-5 text-acc" />
            {(cart?.itemCount || 0) > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-600 text-white text-[10px] font-bold flex items-center justify-center font-mono">
                {cart?.itemCount}
              </span>
            )}
          </button>
          <button
            onClick={onOpenRules}
            className="p-2.5 rounded-xl bg-paper hover:bg-paper/80 text-ink cursor-pointer"
            title="Spending Rules"
          >
            <Sliders className="w-5 h-5 text-mut" />
          </button>
        </div>

        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
      </aside>
    );
  }

  const items = cart?.items || [];
  const pricing = cart?.pricing;
  const autoApprovePaise = mandate?.autoApproveUpToPaise || 30000;
  const perOrderCapPaise = mandate?.perOrderCapPaise || mandate?.maxOrderAmountPaise || 100000;
  const dailyCapPaise = mandate?.dailyCapPaise || mandate?.dailyBudgetPaise || 150000;

  const formattedAddress = selectedAddress
    ? `${selectedAddress.houseFlat || ''} ${selectedAddress.apartmentStreet || ''}, ${selectedAddress.city || 'Bengaluru'} ${selectedAddress.pincode ? `— ${selectedAddress.pincode}` : ''}`.trim()
    : 'Flat 402, Green Glen Layout, Bellandur, Bengaluru — 560103';

  return (
    <aside
      data-testid="context-panel"
      className="w-[380px] h-full bg-card dark:bg-card-top border-l border-brd flex flex-col flex-shrink-0 z-20 shadow-sm transition-all overflow-hidden"
      aria-label="Live Shopping Context"
    >
      {/* ── Top Header Bar ─────────────────────────────────────────────────── */}
      <div className="px-4 py-3 border-b border-brd flex items-center justify-between flex-shrink-0 bg-card">
        <div className="flex items-center gap-2">
          <ShoppingBag className="w-4 h-4 text-acc" />
          <h3 className="font-display font-bold text-sm text-ink">Live Basket &amp; Cart</h3>
          {items.length > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono text-[11px] font-bold border border-emerald-500/20">
              {cart?.itemCount} items
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {items.length > 0 && (
            <button
              onClick={onClearCart}
              disabled={isLoading}
              className="text-[11px] text-mut hover:text-rose-500 transition-colors px-1.5 py-0.5 rounded cursor-pointer font-medium"
              title="Clear all items"
            >
              Clear
            </button>
          )}
          <button
            onClick={onToggleCollapse}
            className="p-1 text-mut hover:text-ink hover:bg-paper rounded-lg transition-colors cursor-pointer"
            title="Collapse context panel"
            aria-label="Collapse context panel"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Scrollable Body Canvas (Items, Delivery Address, Delivery Note, Spending Rules) ── */}
      <div className="flex-1 overflow-y-auto min-h-0 divide-y divide-brd/70 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800">
        {/* Delivery ETA & Address Card */}
        <div className="p-3.5 space-y-2.5 bg-paper/40">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 min-w-0">
              <Clock className="w-3.5 h-3.5 text-acc flex-shrink-0" />
              <span className="text-ink font-semibold text-xs">{cart?.deliveryEstimate?.formattedEta || `${cart?.deliveryEstimate?.totalDeliveryMinutes || 45} min instant delivery`}</span>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
              FREE DELIVERY
            </span>
          </div>

          {/* Delivery Destination */}
          <div className="p-2.5 rounded-xl bg-card border border-brd text-xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-mut uppercase font-bold flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-acc" />
                Delivery Address
              </span>
              {onOpenAddressModal && (
                <button
                  onClick={onOpenAddressModal}
                  className="text-[11px] font-semibold text-acc hover:underline cursor-pointer"
                >
                  Change
                </button>
              )}
            </div>
            <p className="text-[11px] text-ink font-medium leading-relaxed truncate">
              {formattedAddress}
            </p>
          </div>
        </div>

        {/* Cart Items List */}
        <div className="p-3.5 space-y-2.5">
          {items.length === 0 ? (
            <div className="py-10 text-center space-y-2">
              <ShoppingBag className="w-10 h-10 text-mut/40 mx-auto" />
              <p className="text-xs text-mut">Your cart is currently empty</p>
              <button
                onClick={onOpenBrowse}
                className="px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-acc text-white hover:opacity-90 transition-opacity cursor-pointer shadow-xs"
              >
                Browse Fresh Produce
              </button>
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.productId}
                className="p-2.5 rounded-xl bg-paper/60 border border-brd/80 flex items-center justify-between gap-2.5 hover:border-acc/40 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-xs text-ink truncate leading-tight">
                    {item.name}
                  </div>
                  <div className="text-[10px] text-mut font-mono mt-0.5">
                    {item.packageSize ? `${item.packageSize} ${item.packageUnit}` : item.packageUnit || '1 unit'} • ₹{(item.pricePaise / 100).toFixed(2)}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <div className="flex items-center border border-brd rounded-lg bg-card overflow-hidden">
                    <button
                      onClick={() => onUpdateQuantity(item.productId, item.quantity - 1)}
                      disabled={isLoading}
                      className="p-1 hover:bg-paper text-mut hover:text-ink transition-colors cursor-pointer"
                      aria-label="Decrease quantity"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-6 text-center text-xs font-mono font-bold text-ink">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => onUpdateQuantity(item.productId, item.quantity + 1)}
                      disabled={isLoading}
                      className="p-1 hover:bg-paper text-mut hover:text-ink transition-colors cursor-pointer"
                      aria-label="Increase quantity"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  <button
                    onClick={() => onRemoveItem(item.productId)}
                    disabled={isLoading}
                    className="p-1.5 text-mut hover:text-rose-500 rounded-md transition-colors cursor-pointer"
                    aria-label="Remove item"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Shopper Delivery Note Input */}
        {items.length > 0 && (
          <div className="p-3.5 bg-paper/30 space-y-1.5">
            <label
              htmlFor="context-panel-delivery-note"
              className="text-[10px] font-semibold text-ink flex items-center gap-1 font-mono uppercase"
            >
              <FileText className="w-3 h-3 text-acc" />
              <span>Delivery Instructions</span>
            </label>
            <input
              id="context-panel-delivery-note"
              type="text"
              value={cart?.deliveryNote || ''}
              onChange={(e) => onUpdateDeliveryNote(e.target.value)}
              placeholder='e.g. "Deliver before noon; zero meat/egg guarantee acknowledged"'
              className="w-full px-3 py-2 rounded-xl bg-card border border-brd text-xs text-ink placeholder:text-mut focus:outline-none focus:ring-1 focus:ring-acc focus:border-acc font-sans"
              maxLength={500}
            />
          </div>
        )}

        {/* Spending Rules Summary Pill */}
        <div className="p-3.5 bg-paper/20 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 font-semibold text-ink">
              <Sliders className="w-3.5 h-3.5 text-acc" />
              <span>Spending Rules</span>
            </div>
            <button
              onClick={onOpenRules}
              className="text-[10px] font-mono text-acc hover:underline font-bold cursor-pointer"
            >
              Edit Rules
            </button>
          </div>
          <div className="grid grid-cols-3 gap-1.5 text-[10px] font-mono text-center">
            <div className="p-1.5 rounded-lg bg-card border border-brd">
              <span className="text-mut block text-[9px] uppercase">Auto-Approve</span>
              <span className="font-bold text-ink">₹{(autoApprovePaise / 100).toFixed(0)}</span>
            </div>
            <div className="p-1.5 rounded-lg bg-card border border-brd">
              <span className="text-mut block text-[9px] uppercase">Per-Order</span>
              <span className="font-bold text-ink">₹{(perOrderCapPaise / 100).toFixed(0)}</span>
            </div>
            <div className="p-1.5 rounded-lg bg-card border border-brd">
              <span className="text-mut block text-[9px] uppercase">Daily Budget</span>
              <span className="font-bold text-ink">₹{(dailyCapPaise / 100).toFixed(0)}</span>
            </div>
          </div>

          {/* Decision Lamp Indicator */}
          <div className="pt-1">
            <DecisionLamp
              status={lampStatus}
              reasonCode={lampReasonCode}
              reasonText={lampReasonText}
            />
          </div>
        </div>
      </div>

      {/* ── Fixed Bottom Checkout & Payment Bar (Guaranteed 100% Visible & Docked) ── */}
      {items.length > 0 && pricing && (
        <div className="p-4 border-t border-brd bg-card space-y-3 flex-shrink-0 shadow-lg">
          {/* Quick Payment Method Selector */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[10px] font-mono text-mut uppercase font-semibold flex items-center gap-1">
                <CreditCard className="w-3 h-3 text-acc" />
                Payment Method
              </span>
              <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                100% Secure
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setSelectedPaymentMode('razorpay')}
                className={`p-2 rounded-xl border text-left text-xs transition-all cursor-pointer flex items-center gap-2 ${
                  selectedPaymentMode === 'razorpay'
                    ? 'border-emerald-600 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 font-semibold ring-1 ring-emerald-500/30'
                    : 'border-brd hover:bg-paper/80 text-mut'
                }`}
              >
                <Zap className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <div className="truncate min-w-0">
                  <div className="leading-tight text-xs">Razorpay</div>
                  <div className="text-[9px] text-mut truncate">UPI, Cards, Net</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setSelectedPaymentMode('cod')}
                className={`p-2 rounded-xl border text-left text-xs transition-all cursor-pointer flex items-center gap-2 ${
                  selectedPaymentMode === 'cod'
                    ? 'border-emerald-600 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 font-semibold ring-1 ring-emerald-500/30'
                    : 'border-brd hover:bg-paper/80 text-mut'
                }`}
              >
                <Banknote className="w-3.5 h-3.5 text-acc shrink-0" />
                <div className="truncate min-w-0">
                  <div className="leading-tight text-xs">Cash on Del.</div>
                  <div className="text-[9px] text-mut truncate">Pay on arrival</div>
                </div>
              </button>
            </div>
          </div>

          {/* Pricing Summary */}
          <div className="space-y-1 text-xs font-mono text-mut pt-1 border-t border-brd/60">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span className="text-ink font-semibold">{pricing.formatted.subtotal}</span>
            </div>
            <div className="flex justify-between">
              <span>Delivery Fee:</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                {pricing.deliveryFeePaise === 0 ? 'FREE' : pricing.formatted.deliveryFee}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Taxes (GST 5%):</span>
              <span className="text-ink font-semibold">{pricing.formatted.tax}</span>
            </div>
            <div className="pt-1.5 border-t border-brd flex justify-between items-baseline font-bold text-sm text-ink">
              <span>Total:</span>
              <span className="font-display font-black text-base text-acc">
                {pricing.formatted.total}
              </span>
            </div>
          </div>

          {/* Proceed to Checkout Action CTA */}
          <button
            onClick={onInitiateCheckout}
            disabled={isLoading || items.length === 0}
            className={`w-full py-3 px-4 rounded-xl font-display font-bold text-xs flex items-center justify-between shadow-md transition-all cursor-pointer min-h-[46px] ${
              lampStatus === 'stop'
                ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-900/20'
                : 'bg-emerald-700 hover:bg-emerald-800 text-white shadow-emerald-900/20'
            }`}
          >
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4" />
              <span>
                {lampStatus === 'stop' ? 'Review & Checkout (Approval)' : 'Proceed to Checkout'}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-sm">{pricing.formatted.total}</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </button>
        </div>
      )}
    </aside>
  );
};

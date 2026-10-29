import React from 'react';
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
} from 'lucide-react';
import { CartData, MandateData, LampStatus } from '../../types';
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
  isLoading = false,
}) => {
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

  return (
    <aside
      data-testid="context-panel"
      className="w-[360px] h-full bg-card dark:bg-card-top border-l border-brd flex flex-col flex-shrink-0 z-20 shadow-sm transition-all"
      aria-label="Live Shopping Context"
    >
      {/* Header */}
      <div className="p-4 border-b border-brd flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShoppingBag className="w-4 h-4 text-acc" />
          <h3 className="font-display font-bold text-sm text-ink">Live Basket &amp; Cart</h3>
          {items.length > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono text-[11px] font-bold border border-emerald-500/20">
              {cart?.itemCount} items
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          {items.length > 0 && (
            <button
              onClick={onClearCart}
              disabled={isLoading}
              className="text-[11px] text-mut hover:text-rose-500 transition-colors p-1 cursor-pointer font-medium"
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

      {/* Delivery ETA pill */}
      <div className="px-4 py-2.5 bg-paper/50 border-b border-brd text-xs flex items-center justify-between font-sans">
        <div className="flex items-center gap-1.5 min-w-0">
          <Clock className="w-3.5 h-3.5 text-acc flex-shrink-0" />
          <span className="truncate text-ink font-medium">30 min instant delivery</span>
        </div>
        <span className="text-[10px] text-mut font-mono">Simulated</span>
      </div>

      {/* Cart Items List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
        {items.length === 0 ? (
          <div className="py-12 text-center space-y-2">
            <ShoppingBag className="w-10 h-10 text-mut/40 mx-auto" />
            <h4 className="text-xs font-bold text-ink font-display">Your cart is empty</h4>
            <p className="text-[11px] text-mut max-w-[220px] mx-auto">
              Ask CartPilot in chat or browse the vegetarian catalog to add items.
            </p>
            <button
              onClick={onOpenBrowse}
              className="mt-2 px-3 py-1.5 rounded-xl bg-card border border-brd hover:border-acc text-xs font-bold text-ink hover:text-acc transition-colors cursor-pointer"
            >
              Browse Groceries
            </button>
          </div>
        ) : (
          items.map((item) => (
            <div
              key={item.productId}
              className="p-2.5 rounded-xl border border-brd bg-paper/50 flex items-center justify-between gap-2 text-xs"
            >
              <div className="flex-1 min-w-0 pr-1">
                <span className="font-semibold text-ink truncate block text-xs">{item.name}</span>
                <span className="text-[10px] text-mut font-mono">
                  {item.packageSize} {item.packageUnit} · ₹{(item.pricePaise / 100).toFixed(2)}
                </span>
              </div>

              {/* Quantity Stepper */}
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
                  <span className="w-5 text-center font-mono text-[11px] font-bold text-ink">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => onUpdateQuantity(item.productId, item.quantity + 1)}
                    disabled={isLoading || item.quantity >= item.availableStock}
                    className="p-1 hover:bg-paper text-mut hover:text-ink transition-colors disabled:opacity-40 cursor-pointer"
                    aria-label="Increase quantity"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>

                <button
                  onClick={() => onRemoveItem(item.productId)}
                  disabled={isLoading}
                  className="p-1 text-mut hover:text-rose-500 transition-colors cursor-pointer"
                  aria-label="Remove item"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Shopper Delivery Note Input */}
      {items.length > 0 && (
        <div className="p-3 border-t border-brd bg-paper/30">
          <label className="text-[10px] font-semibold text-ink flex items-center gap-1 mb-1 font-mono uppercase">
            <FileText className="w-3 h-3 text-acc" />
            <span>Delivery Note</span>
          </label>
          <input
            type="text"
            value={cart?.deliveryNote || ''}
            onChange={(e) => onUpdateDeliveryNote(e.target.value)}
            placeholder="e.g. Leave with guard, ring bell twice"
            className="w-full px-2.5 py-1.5 rounded-lg bg-card border border-brd text-xs text-ink placeholder:text-mut focus:outline-none focus:border-acc font-sans"
            maxLength={500}
          />
        </div>
      )}

      {/* Rules Summary Pill */}
      <div className="p-3 border-t border-brd bg-paper/20">
        <div className="flex items-center justify-between text-xs mb-1.5">
          <div className="flex items-center gap-1 font-semibold text-ink">
            <Sliders className="w-3.5 h-3.5 text-acc" />
            <span>Spending Rules</span>
          </div>
          <button
            onClick={onOpenRules}
            className="text-[10px] font-mono text-acc hover:underline font-semibold cursor-pointer"
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
      </div>

      {/* Footer / Checkout CTA */}
      {items.length > 0 && pricing && (
        <div className="p-4 border-t border-brd bg-card space-y-3">
          {/* Decision Lamp */}
          <DecisionLamp
            status={lampStatus}
            reasonCode={lampReasonCode}
            reasonText={lampReasonText}
          />

          {/* Pricing Totals */}
          <div className="space-y-1 text-xs font-mono text-mut">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span className="text-ink font-semibold">{pricing.formatted.subtotal}</span>
            </div>
            <div className="flex justify-between">
              <span>Delivery Fee:</span>
              <span className="text-ink font-semibold">
                {pricing.deliveryFeePaise === 0 ? 'FREE' : pricing.formatted.deliveryFee}
              </span>
            </div>
            {(pricing.platformFeePaise ?? 0) > 0 && (
              <div className="flex justify-between">
                <span>Platform Fee:</span>
                <span className="text-ink font-semibold">{pricing.formatted.platformFee}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>GST (5%):</span>
              <span className="text-ink font-semibold">{pricing.formatted.tax}</span>
            </div>
            {pricing.discountPaise > 0 && (
              <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                <span>Discount:</span>
                <span>-{pricing.formatted.discount}</span>
              </div>
            )}
            <div className="pt-1.5 border-t border-brd flex justify-between items-baseline font-bold text-sm text-ink">
              <span>Total:</span>
              <span className="font-display font-extrabold text-base text-acc">
                {pricing.formatted.total}
              </span>
            </div>
          </div>

          <button
            onClick={onInitiateCheckout}
            disabled={isLoading || lampStatus === 'stop'}
            className="w-full py-3 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-display font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-900/20 transition-all disabled:opacity-40 min-h-[44px] cursor-pointer"
          >
            <span>Proceed to Checkout</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </aside>
  );
};

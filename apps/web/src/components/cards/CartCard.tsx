import React from 'react';
import { ShoppingCart, Plus, Minus, Trash2, ArrowRight, Truck, FileText } from 'lucide-react';
import { CartData, LampStatus } from '../../types';
import { DecisionLamp } from '../DecisionLamp';

interface CartCardProps {
  cart: CartData;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onClearCart: () => void;
  onInitiateCheckout: () => void;
  onUpdateDeliveryNote?: (note: string) => void;
  lampStatus: LampStatus;
  lampReasonCode?: string;
  lampReasonText?: string;
  isLoading?: boolean;
}

export const CartCard: React.FC<CartCardProps> = ({
  cart,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onInitiateCheckout,
  onUpdateDeliveryNote,
  lampStatus,
  lampReasonCode,
  lampReasonText,
  isLoading = false,
}) => {
  const { items, pricing } = cart;
  const thresholdPaise = pricing.freeDeliveryThresholdPaise || 50000;
  const isFreeDelivery = pricing.deliveryFeePaise === 0 && pricing.subtotalPaise > 0;
  const neededForFreeDeliveryPaise = Math.max(0, thresholdPaise - pricing.subtotalPaise);
  const neededForFreeDeliveryRupees = (neededForFreeDeliveryPaise / 100).toFixed(2);
  const freeDeliveryPercent = Math.min(100, Math.round((pricing.subtotalPaise / thresholdPaise) * 100));

  return (
    <div className="w-full rounded-2xl border border-brd bg-card/85 dark:bg-card-top/85 backdrop-blur-xl p-5 shadow-lg shadow-black/5 transition-all">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-brd">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-blue-500/10 text-acc">
            <ShoppingCart className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-display font-bold text-ink tracking-tight">
              Active Cart (Version {cart.version})
            </h3>
            <p className="text-xs text-mut font-mono">
              {cart.itemCount} items · Pure Server-Side Pricing
            </p>
          </div>
        </div>

        {items.length > 0 && (
          <button
            onClick={onClearCart}
            disabled={isLoading}
            className="text-xs text-mut hover:text-rose-500 transition-colors flex items-center gap-1 font-medium"
          >
            <Trash2 className="w-3.5 h-3.5" /> Clear
          </button>
        )}
      </div>

      {/* Items List */}
      {items.length === 0 ? (
        <div className="py-8 text-center">
          <p className="text-sm text-mut">Your shopping cart is currently empty.</p>
          <p className="text-xs text-sub mt-1">
            Ask the assistant to add vegetarian groceries or click a suggestion below.
          </p>
        </div>
      ) : (
        <div className="space-y-3 mb-5">
          {items.map((item) => (
            <div
              key={item.productId}
              className="p-3 rounded-xl border border-brd bg-paper/50 flex items-center justify-between gap-3"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 border border-emerald-600 flex items-center justify-center p-[2px]">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                  </span>
                  <h4 className="text-xs font-bold text-ink truncate font-display">{item.name}</h4>
                </div>
                <div className="text-[11px] text-mut font-mono mt-0.5">
                  ₹{(item.pricePaise / 100).toFixed(2)} / {item.packageSize} {item.packageUnit}
                </div>
              </div>

              {/* Quantity steppers */}
              <div className="flex items-center gap-2">
                <div className="flex items-center border border-brd rounded-lg bg-card overflow-hidden">
                  <button
                    onClick={() => onUpdateQuantity(item.productId, item.quantity - 1)}
                    disabled={isLoading}
                    className="p-1.5 hover:bg-paper text-mut hover:text-ink transition-colors"
                    aria-label="Decrease quantity"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="w-7 text-center font-mono text-xs font-bold text-ink">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => onUpdateQuantity(item.productId, item.quantity + 1)}
                    disabled={isLoading || item.quantity >= item.availableStock}
                    className="p-1.5 hover:bg-paper text-mut hover:text-ink transition-colors disabled:opacity-40"
                    aria-label="Increase quantity"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>

                <div className="w-16 text-right font-mono font-bold text-xs text-ink">
                  {item.formattedItemTotal}
                </div>

                <button
                  onClick={() => onRemoveItem(item.productId)}
                  disabled={isLoading}
                  className="p-1.5 text-mut hover:text-rose-500 transition-colors"
                  aria-label="Remove item"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Free delivery tracker */}
      {items.length > 0 && (
        <div className="mb-4 p-3 rounded-xl border border-brd bg-paper/40">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-mut flex items-center gap-1 font-medium">
              <Truck className="w-3.5 h-3.5 text-acc" />
              {isFreeDelivery
                ? '🎉 Congratulations! You have unlocked Free Delivery'
                : `Add ₹${neededForFreeDeliveryRupees} more for Free Delivery`}
            </span>
            <span className="font-mono text-ink text-[11px] font-bold">{freeDeliveryPercent}%</span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-brd overflow-hidden">
            <div
              className="h-full bg-acc rounded-full transition-all duration-500"
              style={{ width: `${freeDeliveryPercent}%` }}
            />
          </div>
        </div>
      )}

      {/* Authoritative Pricing Breakdown */}
      {items.length > 0 && (
        <div className="p-3.5 rounded-xl border border-brd bg-paper/50 space-y-1.5 text-xs mb-4">
          <div className="flex justify-between text-mut">
            <span>Subtotal</span>
            <span className="font-mono font-medium text-ink">{pricing.formatted.subtotal}</span>
          </div>
          <div className="flex justify-between text-mut">
            <span>Delivery Fee</span>
            <span className="font-mono font-medium text-ink">
              {isFreeDelivery ? (
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">FREE</span>
              ) : (
                pricing.formatted.deliveryFee
              )}
            </span>
          </div>
          <div className="flex justify-between text-mut">
            <span>5% Grocery GST (Tax)</span>
            <span className="font-mono font-medium text-ink">{pricing.formatted.tax}</span>
          </div>
          {pricing.discountPaise > 0 && (
            <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
              <span>Promotion Discount</span>
              <span className="font-mono font-medium">-{pricing.formatted.discount}</span>
            </div>
          )}
          <div className="pt-2 border-t border-brd flex justify-between items-baseline font-bold text-sm text-ink">
            <span>Authoritative Total</span>
            <span className="font-mono text-base text-acc font-extrabold">
              {pricing.formatted.total}
            </span>
          </div>
        </div>
      )}

      {/* Optional Shopper Delivery Note */}
      {items.length > 0 && (
        <div className="mb-4 p-3 rounded-xl border border-brd bg-paper/40">
          <label className="text-[11px] font-semibold text-ink flex items-center justify-between mb-1.5">
            <span className="flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-acc" />
              <span>Delivery Instructions / Note (Optional)</span>
            </span>
            <span className="text-[10px] text-mut font-mono">Visible to merchant & rider</span>
          </label>
          <input
            type="text"
            value={cart.deliveryNote || ''}
            onChange={(e) => onUpdateDeliveryNote?.(e.target.value)}
            placeholder="e.g. Leave with security, ring bell twice, fresh produce only"
            className="w-full px-3 py-2 rounded-lg bg-card border border-brd text-xs text-ink placeholder:text-mut focus:outline-none focus:border-acc transition-colors font-sans"
            maxLength={500}
          />
        </div>
      )}

      {/* Decision Lamp Assessment */}
      {items.length > 0 && (
        <div className="mb-4">
          <DecisionLamp
            status={lampStatus}
            reasonCode={lampReasonCode}
            reasonText={lampReasonText}
          />
        </div>
      )}

      {/* Checkout CTA Button */}
      {items.length > 0 && (
        <button
          onClick={onInitiateCheckout}
          disabled={isLoading || lampStatus === 'stop'}
          className={`w-full py-3 px-4 rounded-xl font-display font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-md ${
            lampStatus === 'stop'
              ? 'bg-rose-500/20 text-rose-500 border border-rose-500/30 cursor-not-allowed'
              : 'bg-acc text-white hover:bg-blue-600 shadow-blue-500/20'
          }`}
        >
          <span>Reserve Inventory & Initiate Checkout</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

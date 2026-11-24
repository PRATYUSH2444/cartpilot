import React, { useState } from 'react';
import { Plus, Minus, Check, ShoppingCart, Sparkles, CheckCircle2 } from 'lucide-react';
import { PopulatedCartItem } from '../../types';

export interface IngredientItemModel {
  ingredientName: string;
  requiredAmount?: number;
  requiredUnit?: string;
  status: 'AVAILABLE' | 'PARTIALLY_AVAILABLE' | 'OUT_OF_STOCK' | 'NOT_LISTED' | 'ALTERNATIVE_AVAILABLE';
  isMandatory?: boolean;
  matchedProduct?: {
    id: string;
    name: string;
    category?: string;
    packageSize: number;
    packageUnit: string;
    unitPricePaise: number;
    formattedUnitPrice: string;
    availableStock: number;
  };
  // Fallbacks for direct catalog proposals
  productId?: string;
  name?: string;
  packageSize?: number;
  packageUnit?: string;
  unitPricePaise?: number;
  pricePaise?: number;
  formattedUnitPrice?: string;
  availableStock?: number;
  quantity?: number;
  packCount?: number;
  subtotalPaise?: number;
  formattedSubtotal?: string;
  surplusNote?: string;
  alternativeSuggestion?: {
    name: string;
    reason: string;
    availableProduct?: {
      id: string;
      name: string;
      packageSize: number;
      packageUnit: string;
      pricePaise: number;
      formattedPrice: string;
      availableStock: number;
    };
  };
}

export interface DynamicRecipeCardPayload {
  status?: string;
  dishName?: string;
  servings?: number;
  cuisine?: string;
  instructions?: string[];
  totalIngredientsCount?: number;
  availableCount?: number;
  missingCount?: number;
  items?: IngredientItemModel[];
  availableItems?: IngredientItemModel[];
  missingItems?: IngredientItemModel[];
  pricing?: {
    subtotalPaise?: number;
    gstPaise?: number;
    deliveryFeePaise?: number;
    totalPaise?: number;
    formatted?: {
      subtotal?: string;
      gst?: string;
      delivery?: string;
      total?: string;
    };
  };
}

interface ItemsCardProps {
  cardData: DynamicRecipeCardPayload | any;
  onAddToCart: (productId: string, quantity: number) => void;
  onAddAllToCart?: (items: Array<{ productId: string; quantity: number }>) => void;
  cartItems?: PopulatedCartItem[];
  onUpdateQuantity?: (productId: string, quantity: number) => void;
  title?: string;
}

export const ItemsCard: React.FC<ItemsCardProps> = ({
  cardData,
  onAddToCart,
  onAddAllToCart,
  cartItems,
  onUpdateQuantity,
  title = 'Recipe & Ingredient Intelligence',
}) => {
  const [addingId, setAddingId] = useState<string | null>(null);
  const [isAddingAll, setIsAddingAll] = useState(false);

  // Normalize card payload
  const payload: DynamicRecipeCardPayload = cardData || {};
  const rawItems: IngredientItemModel[] =
    payload.items || (Array.isArray(cardData) ? cardData : []);

  // Standardize items into a unified text-first model
  const standardizedItems = rawItems.map((item) => {
    const isDirectCatalog = Boolean(item.productId && !item.matchedProduct);
    const prodId = item.matchedProduct?.id || item.productId || '';
    const prodName = item.matchedProduct?.name || item.name || item.ingredientName;
    const pkgSize = item.matchedProduct?.packageSize || item.packageSize || 100;
    const pkgUnit = item.matchedProduct?.packageUnit || item.packageUnit || 'G';
    const unitPrice =
      (item.matchedProduct?.unitPricePaise || item.unitPricePaise || item.pricePaise || 0) / 100;
    const reqAmount = item.requiredAmount || pkgSize;
    const reqUnit = item.requiredUnit || pkgUnit;
    const packs = item.packCount || item.quantity || 1;
    const stock = item.matchedProduct?.availableStock ?? item.availableStock ?? 0;
    const status = item.status || (isDirectCatalog ? 'AVAILABLE' : 'AVAILABLE');

    return {
      raw: item,
      productId: prodId,
      ingredientName: item.ingredientName || prodName,
      productName: prodName,
      requiredAmount: reqAmount,
      requiredUnit: reqUnit,
      packageSize: pkgSize,
      packageUnit: pkgUnit,
      unitPrice,
      packCount: packs,
      availableStock: stock,
      status,
      surplusNote: item.surplusNote,
      alternativeSuggestion: item.alternativeSuggestion,
      isAvailable: status === 'AVAILABLE' && Boolean(prodId),
    };
  });

  const availableItemsList = standardizedItems.filter((i) => i.isAvailable);
  const missingItemsList = standardizedItems.filter((i) => !i.isAvailable);

  const totalPaise = payload.pricing?.totalPaise ||
    availableItemsList.reduce((acc, i) => acc + Math.round(i.unitPrice * 100) * i.packCount, 0);
  const formattedTotal = payload.pricing?.formatted?.total || `₹${(totalPaise / 100).toFixed(2)}`;

  const handleAddSingle = async (productId: string, qty: number) => {
    if (!productId) return;
    setAddingId(productId);
    await onAddToCart(productId, qty);
    setTimeout(() => setAddingId(null), 500);
  };

  const handleAddAll = async () => {
    if (!onAddAllToCart || availableItemsList.length === 0) return;
    setIsAddingAll(true);
    const itemsToAdd = availableItemsList.map((i) => ({
      productId: i.productId,
      quantity: i.packCount,
    }));
    await onAddAllToCart(itemsToAdd);
    setTimeout(() => setIsAddingAll(false), 700);
  };

  return (
    <div className="w-full rounded-2xl border border-[--line] bg-[--surface] p-4.5 sm:p-5 shadow-sm space-y-4 font-sans text-[--ink]">
      {/* ── Card Header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[--line]">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Sparkles className="w-3.5 h-3.5" />
            </span>
            <h3 className="text-sm font-bold tracking-tight">
              {payload.dishName ? `${payload.dishName}` : title}
            </h3>
            {payload.servings && (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[--surface-2] text-[--mut]">
                {payload.servings} servings
              </span>
            )}
            {payload.cuisine && (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 font-medium">
                {payload.cuisine}
              </span>
            )}
          </div>
          <p className="text-xs text-[--mut] font-mono pl-7">
            Estimated Total: <span className="font-bold text-[--ink]">{formattedTotal}</span>
          </p>
        </div>

        {/* Status Counts Pill */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-semibold border border-emerald-500/20 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            {availableItemsList.length} of {standardizedItems.length} available
          </span>
          {missingItemsList.length > 0 && (
            <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 font-semibold border border-amber-500/20">
              {missingItemsList.length} missing
            </span>
          )}
        </div>
      </div>

      {/* ── Text-First Ingredient Grid (No Image Thumbnails) ────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
        {standardizedItems.map((item, idx) => {
          const cartItem = cartItems?.find((c) => c.productId === item.productId);
          const inCartQty = cartItem?.quantity ?? 0;
          const isAdding = addingId === item.productId;

          return (
            <div
              key={item.productId || `item-${idx}`}
              className={`p-3 rounded-xl border transition-all text-xs flex flex-col justify-between ${
                item.isAvailable
                  ? 'bg-[--surface-2]/60 border-[--line] hover:border-[--brand]/40'
                  : 'bg-amber-500/5 border-amber-500/20'
              }`}
            >
              {/* Ingredient & Product Meta */}
              <div className="space-y-1.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-0.5">
                    <span className="text-[11px] font-semibold text-[--ink] block leading-snug">
                      {item.ingredientName}
                    </span>
                    <span className="text-[10px] text-[--mut] font-mono block">
                      Required: {item.requiredAmount} {item.requiredUnit}
                    </span>
                  </div>

                  {/* Status Badge */}
                  {item.status === 'AVAILABLE' && (
                    <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/20">
                      Available
                    </span>
                  )}
                  {item.status === 'OUT_OF_STOCK' && (
                    <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-600 font-bold border border-rose-500/20">
                      Out of stock
                    </span>
                  )}
                  {item.status === 'NOT_LISTED' && (
                    <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 font-bold border border-amber-500/20">
                      Missing from store
                    </span>
                  )}
                  {item.status === 'ALTERNATIVE_AVAILABLE' && (
                    <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-600 font-bold border border-purple-500/20">
                      Alternative offered
                    </span>
                  )}
                </div>

                {/* Available Product Details */}
                {item.isAvailable ? (
                  <div className="pt-1.5 border-t border-[--line]/60 grid grid-cols-2 gap-1 text-[10px] font-mono text-[--mut]">
                    <div>
                      <span className="text-[--ink] font-medium block truncate" title={item.productName}>
                        {item.productName}
                      </span>
                      <span>Pack: {item.packageSize} {item.packageUnit}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-[--ink] text-[11px] block">
                        ₹{item.unitPrice.toFixed(2)}
                      </span>
                      <span>Stock: {item.availableStock}</span>
                    </div>
                  </div>
                ) : (
                  <div className="pt-1.5 border-t border-amber-500/20 text-[10px] text-amber-700 dark:text-amber-300 font-mono space-y-0.5">
                    <p>Not sold in current store catalogue.</p>
                    {item.alternativeSuggestion && (
                      <p className="text-purple-600 dark:text-purple-400">
                        💡 Suggestion: {item.alternativeSuggestion.name} ({item.alternativeSuggestion.reason})
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Action Bar (Quantity + Add to Cart) */}
              {item.isAvailable && (
                <div className="mt-3 pt-2 border-t border-[--line]/60 flex items-center justify-between">
                  <span className="text-[10px] font-mono text-[--mut]">
                    Pack count: {item.packCount}
                  </span>

                  {inCartQty > 0 && onUpdateQuantity ? (
                    <div className="flex items-center border border-[--line] rounded-lg bg-[--surface] overflow-hidden">
                      <button
                        onClick={() => onUpdateQuantity(item.productId, inCartQty - 1)}
                        className="px-2 py-0.5 hover:bg-[--surface-2] text-[--mut] hover:text-[--ink] transition-colors cursor-pointer"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-6 text-center font-mono text-xs font-bold text-[--ink]">
                        {inCartQty}
                      </span>
                      <button
                        onClick={() => onUpdateQuantity(item.productId, inCartQty + 1)}
                        disabled={inCartQty >= item.availableStock}
                        className="px-2 py-0.5 hover:bg-[--surface-2] text-[--mut] hover:text-[--ink] transition-colors disabled:opacity-40 cursor-pointer"
                        aria-label="Increase quantity"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleAddSingle(item.productId, item.packCount)}
                      disabled={isAdding || item.availableStock < item.packCount}
                      className={`px-3 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                        isAdding
                          ? 'bg-emerald-600 text-white'
                          : item.availableStock < item.packCount
                            ? 'bg-[--line] text-[--mut] cursor-not-allowed'
                            : 'bg-[--surface] border border-[--line] hover:border-[--brand] hover:text-[--brand] text-[--ink] shadow-xs'
                      }`}
                    >
                      {isAdding ? (
                        <>
                          <Check className="w-3 h-3" /> Added
                        </>
                      ) : (
                        <>
                          <Plus className="w-3 h-3" /> Add to Cart
                        </>
                      )}
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Summary & One-Click "Add All Available" ─────────────────────────── */}
      {availableItemsList.length > 0 && onAddAllToCart && (
        <div className="mt-3 pt-3 border-t border-[--line] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-[--surface-2]/40 -mx-4.5 -mb-4.5 p-3.5 rounded-b-2xl">
          <div className="text-xs text-[--mut] font-mono space-y-0.5">
            <p>
              Subtotal: <span className="font-bold text-[--ink]">{formattedTotal}</span> (5% GST included)
            </p>
            <p className="text-[10px]">
              {availableItemsList.length} items ready to order · 100% Certified Vegetarian
            </p>
          </div>

          <button
            onClick={handleAddAll}
            disabled={isAddingAll}
            className="w-full sm:w-auto px-4 py-2 rounded-xl bg-[--brand] hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
          >
            {isAddingAll ? (
              <>
                <Check className="w-3.5 h-3.5" /> Added All to Cart
              </>
            ) : (
              <>
                <ShoppingCart className="w-3.5 h-3.5" /> Add All {availableItemsList.length} Available Items
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

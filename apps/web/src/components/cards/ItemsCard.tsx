import React, { useState, useMemo } from 'react';
import { Plus, Minus, Check, ShoppingCart, CheckCircle2, XCircle, Info } from 'lucide-react';
import { PopulatedCartItem } from '../../types';

export interface IngredientLineItem {
  ingredientKey?: string;
  ingredientName: string;
  name?: string;
  role?: 'core' | 'optional' | 'pantry';
  isPantry?: boolean;
  requiredAmount?: number;
  requiredUnit?: string;
  status: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK' | 'NOT_IN_CATALOG' | 'AVAILABLE' | 'PARTIALLY_AVAILABLE' | 'NOT_LISTED' | 'ALTERNATIVE_AVAILABLE';
  statusLabel?: string;
  packCount?: number;
  subtotalPaise?: number;
  product?: {
    id: string;
    name: string;
    slug?: string;
    category?: string;
    packageSize: number;
    packageUnit: string;
    unitPricePaise: number;
    availableStock: number;
    imageUrl?: string;
  };
  matchedProduct?: {
    id: string;
    name: string;
    category?: string;
    packageSize: number;
    packageUnit: string;
    unitPricePaise: number;
    formattedUnitPrice?: string;
    availableStock: number;
  };
  alternatives?: Array<{
    id: string;
    name: string;
    packageSize: number;
    packageUnit: string;
    unitPricePaise: number;
    availableStock: number;
  }>;
  alternativeSuggestion?: {
    name: string;
    reason?: string;
    availableProduct?: {
      id: string;
      name: string;
      packageSize: number;
      packageUnit: string;
      pricePaise: number;
      formattedPrice?: string;
      availableStock: number;
    };
  };
  // Fallbacks for direct catalog proposals
  productId?: string;
  unitPricePaise?: number;
  pricePaise?: number;
  availableStock?: number;
  quantity?: number;
  surplusNote?: string;
}

export interface DynamicRecipeCardPayload {
  dishKey?: string;
  dishName?: string;
  dish?: string;
  servings?: number;
  cuisine?: string;
  instructions?: string[];
  totalIngredientsCount?: number;
  availableCount?: number;
  missingCount?: number;
  lines?: IngredientLineItem[];
  items?: IngredientLineItem[];
  availableItems?: IngredientLineItem[];
  missingItems?: IngredientLineItem[];
  unmatchedKeys?: string[];
  totalAvailablePaise?: number;
  coreTotalPaise?: number;
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
}) => {
  const [addingId, setAddingId] = useState<string | null>(null);
  const [isAddingAll, setIsAddingAll] = useState(false);

  // Normalize card payload
  const payload: DynamicRecipeCardPayload = cardData || {};
  const initialServings = Number(payload.servings) || 4;
  const [servings, setServings] = useState<number>(initialServings);

  const rawLines: IngredientLineItem[] = useMemo(() => {
    if (Array.isArray(payload.lines) && payload.lines.length > 0) return payload.lines;
    if (Array.isArray(payload.items) && payload.items.length > 0) return payload.items;
    if (Array.isArray(cardData)) return cardData;
    return [];
  }, [payload.lines, payload.items, cardData]);

  // Dish metadata
  const dishName = payload.dishName || payload.dish || 'Curated Recipe Ingredients';

  // Servings scale ratio
  const scaleRatio = initialServings > 0 ? servings / initialServings : 1;

  // Normalized items with active scaling
  const normalizedItems = useMemo(() => {
    return rawLines.map((item, idx) => {
      const name = item.ingredientName || item.name || `Ingredient #${idx + 1}`;
      const prod = item.product || item.matchedProduct || null;
      const prodId = prod?.id || item.productId || '';
      const unitPricePaise = prod?.unitPricePaise || item.unitPricePaise || item.pricePaise || 0;
      const stock = prod?.availableStock ?? item.availableStock ?? 10;
      const rawPackCount = item.packCount || item.quantity || 1;
      const scaledPackCount = Math.max(1, Math.round(rawPackCount * scaleRatio));
      const requiredAmount = item.requiredAmount ? Math.round(item.requiredAmount * scaleRatio) : undefined;
      const requiredUnit = item.requiredUnit || '';

      const isPantry = Boolean(item.isPantry || item.role === 'pantry');

      // Canonical status normalize
      let status: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK' | 'NOT_IN_CATALOG' = 'IN_STOCK';
      const rawStatus = (item.status || '').toUpperCase();

      if (rawStatus === 'NOT_IN_CATALOG' || rawStatus === 'NOT_LISTED' || !prodId) {
        status = 'NOT_IN_CATALOG';
      } else if (rawStatus === 'OUT_OF_STOCK' || stock <= 0) {
        status = 'OUT_OF_STOCK';
      } else if (rawStatus === 'LOW_STOCK' || stock <= 5) {
        status = 'LOW_STOCK';
      } else {
        status = 'IN_STOCK';
      }

      const subtotalPaise = unitPricePaise * scaledPackCount;

      return {
        id: prodId || `unmatched-${idx}`,
        productId: prodId,
        name,
        productName: prod?.name || name,
        category: prod?.category,
        packageSize: prod?.packageSize,
        packageUnit: prod?.packageUnit,
        unitPricePaise,
        stock,
        packCount: scaledPackCount,
        requiredAmount,
        requiredUnit,
        isPantry,
        role: item.role || (isPantry ? 'pantry' : 'core'),
        status,
        subtotalPaise,
        imageUrl: (prod as any)?.imageUrl,
        alternatives: item.alternatives || [],
        altSuggestion: item.alternativeSuggestion,
      };
    });
  }, [rawLines, scaleRatio]);

  // Selected items checkboxes (Pantry items start unticked as "I already have it", all other available items start ticked)
  const [selectedIds, setSelectedIds] = useState<Record<string, boolean>>(() => {
    const initialMap: Record<string, boolean> = {};
    for (const item of rawLines) {
      const prod = item.product || item.matchedProduct;
      const prodId = prod?.id || item.productId;
      if (prodId) {
        const isPantry = item.isPantry || item.role === 'pantry';
        // Non-pantry available items default to TRUE, pantry items default to FALSE
        initialMap[prodId] = !isPantry;
      }
    }
    return initialMap;
  });

  const toggleSelect = (productId: string) => {
    setSelectedIds((prev) => ({
      ...prev,
      [productId]: !prev[productId],
    }));
  };

  // Split items into available and not-in-catalog
  const { availableItems, unavailableItems } = useMemo(() => {
    const avail: typeof normalizedItems = [];
    const unavail: typeof normalizedItems = [];

    for (const it of normalizedItems) {
      if (it.status === 'NOT_IN_CATALOG') {
        unavail.push(it);
      } else {
        avail.push(it);
      }
    }
    return { availableItems: avail, unavailableItems: unavail };
  }, [normalizedItems]);

  // Calculate dynamic total of currently selected in-stock / low-stock items
  const { selectedCount, totalSelectedPaise, itemsToBulkAdd } = useMemo(() => {
    let count = 0;
    let totalPaise = 0;
    const toAdd: Array<{ productId: string; quantity: number }> = [];

    for (const it of availableItems) {
      if (it.status !== 'OUT_OF_STOCK' && it.productId && selectedIds[it.productId]) {
        count++;
        totalPaise += it.subtotalPaise;
        toAdd.push({ productId: it.productId, quantity: it.packCount });
      }
    }
    return { selectedCount: count, totalSelectedPaise: totalPaise, itemsToBulkAdd: toAdd };
  }, [availableItems, selectedIds]);

  // Check if item is already in user's active cart
  const getCartQuantity = (productId: string): number => {
    if (!cartItems || !productId) return 0;
    const match = cartItems.find(
      (ci) => (ci as any).product?._id === productId || (ci as any).productId === productId || ci.productId === productId
    );
    return match ? match.quantity : 0;
  };

  // Add individual item to cart
  const handleSingleAdd = async (productId: string, qty: number) => {
    if (!productId || addingId) return;
    setAddingId(productId);
    try {
      await onAddToCart(productId, qty);
    } finally {
      setAddingId(null);
    }
  };

  // Bulk add all selected items
  const handleBulkAdd = async () => {
    if (itemsToBulkAdd.length === 0 || isAddingAll) return;
    setIsAddingAll(true);
    try {
      if (onAddAllToCart) {
        await onAddAllToCart(itemsToBulkAdd);
      } else {
        for (const item of itemsToBulkAdd) {
          await onAddToCart(item.productId, item.quantity);
        }
      }
    } finally {
      setIsAddingAll(false);
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xl overflow-hidden my-3 transition-all">
      {/* ── Card Header: Dish title, Servings Stepper, Strict Veg badge ──────── */}
      <div className="p-4 sm:p-5 bg-stone-50 dark:bg-stone-850/80 border-b border-stone-200/80 dark:border-stone-800">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300/40 dark:border-emerald-700/50">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                100% Pure Vegetarian
              </span>
              <span className="text-[11px] font-semibold text-stone-500 dark:text-stone-400">
                Direct Catalog Match
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-black text-stone-900 dark:text-white tracking-tight">
              {dishName}
            </h3>
          </div>

          {/* Servings Stepper */}
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500 mb-1">
              Servings
            </span>
            <div className="inline-flex items-center rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 p-0.5 shadow-2xs">
              <button
                type="button"
                onClick={() => setServings((s) => Math.max(1, s - 1))}
                disabled={servings <= 1}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                title="Decrease servings"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="w-8 text-center text-xs font-black text-stone-900 dark:text-white font-mono">
                {servings}
              </span>
              <button
                type="button"
                onClick={() => setServings((s) => Math.min(20, s + 1))}
                disabled={servings >= 20}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                title="Increase servings"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Ingredients List ──────────────────────────────────────────────── */}
      <div className="p-3 sm:p-4 space-y-2.5 max-h-[460px] overflow-y-auto overscroll-contain">
        {availableItems.map((item) => {
          const inCartQty = getCartQuantity(item.productId);
          const isSelected = Boolean(selectedIds[item.productId]);
          const isOOS = item.status === 'OUT_OF_STOCK';
          const isLow = item.status === 'LOW_STOCK';

          return (
            <div
              key={item.id}
              className={`p-3 rounded-2xl border transition-all ${
                isOOS
                  ? 'bg-stone-50/70 dark:bg-stone-900/40 border-stone-200/50 dark:border-stone-800/40 opacity-70'
                  : isSelected
                  ? 'bg-white dark:bg-stone-850 border-emerald-500/40 dark:border-emerald-500/30 shadow-xs'
                  : 'bg-white dark:bg-stone-900 border-stone-200/80 dark:border-stone-800'
              }`}
            >
              <div className="flex items-center gap-3">
                {/* Checkbox (Ticked for items to add, unticked for pantry items) */}
                {!isOOS ? (
                  <button
                    type="button"
                    onClick={() => toggleSelect(item.productId)}
                    className={`w-5 h-5 rounded-md flex items-center justify-center transition-all flex-shrink-0 cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-600 text-white'
                        : 'border-2 border-stone-300 dark:border-stone-600 bg-transparent'
                    }`}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </button>
                ) : (
                  <div className="w-5 h-5 rounded-md flex items-center justify-center text-stone-400 dark:text-stone-600 flex-shrink-0">
                    <XCircle className="w-4 h-4" />
                  </div>
                )}

                {/* Product / Ingredient Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-bold text-xs sm:text-sm text-stone-900 dark:text-white truncate">
                      {item.productName}
                    </span>

                    {/* Pantry chip */}
                    {item.isPantry && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-medium">
                        Pantry staple
                      </span>
                    )}

                    {/* Stock status indicator */}
                    {isLow && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 font-bold">
                        Only {item.stock} left
                      </span>
                    )}
                    {isOOS && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-stone-200 dark:bg-stone-800 text-stone-600 dark:text-stone-400 font-bold">
                        Out of stock
                      </span>
                    )}
                  </div>

                  {/* Quantity & Pack Spec */}
                  <div className="flex items-center gap-2 mt-0.5 text-[11px] text-stone-500 dark:text-stone-400">
                    {item.packageSize && (
                      <span>
                        {item.packageSize} {item.packageUnit} pack
                      </span>
                    )}
                    {item.requiredAmount && (
                      <span>
                        • Needed: {item.requiredAmount} {item.requiredUnit}
                      </span>
                    )}
                    <span>• {item.packCount} {item.packCount > 1 ? 'packs' : 'pack'}</span>
                  </div>

                  {/* Out of stock alternative suggestions */}
                  {isOOS && (item.alternatives.length > 0 || item.altSuggestion) && (
                    <div className="mt-2 p-2 rounded-xl bg-stone-100 dark:bg-stone-800/60 text-[11px] text-stone-600 dark:text-stone-300">
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400">Suggested alternative: </span>
                      {item.alternatives[0]?.name || item.altSuggestion?.name} (₹{((item.alternatives[0]?.unitPricePaise || item.altSuggestion?.availableProduct?.pricePaise || 0) / 100).toFixed(2)})
                    </div>
                  )}
                </div>

                {/* Price and individual Add button */}
                <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                  <span className="font-mono font-black text-xs sm:text-sm text-stone-900 dark:text-white">
                    ₹{(item.subtotalPaise / 100).toFixed(2)}
                  </span>

                  {!isOOS && (
                    <>
                      {inCartQty > 0 ? (
                        <div className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950 border border-emerald-500/30 text-emerald-600 dark:text-emerald-300 text-[10px] font-bold">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>{inCartQty} in cart</span>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleSingleAdd(item.productId, item.packCount)}
                          disabled={addingId === item.productId}
                          className="px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 text-xs font-bold transition-all cursor-pointer disabled:opacity-40"
                        >
                          {addingId === item.productId ? 'Adding...' : 'Add'}
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {/* ── Items Not In Catalogue ───────────────────────────────────────── */}
        {unavailableItems.length > 0 && (
          <div className="mt-3 p-3 rounded-2xl bg-stone-50 dark:bg-stone-850 border border-dashed border-stone-300 dark:border-stone-700">
            <div className="flex items-center gap-1.5 text-stone-500 dark:text-stone-400 text-xs font-semibold mb-2">
              <Info className="w-3.5 h-3.5 text-stone-400" />
              <span>Not in catalogue (source from your pantry / local store):</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {unavailableItems.map((u, i) => (
                <span
                  key={i}
                  className="px-2.5 py-1 rounded-lg bg-stone-200/80 dark:bg-stone-800 text-[11px] font-medium text-stone-600 dark:text-stone-300"
                >
                  {u.name} {u.requiredAmount ? `(${u.requiredAmount} ${u.requiredUnit})` : ''}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Footer Action: "Add all available items · ₹X" ─────────────────── */}
      <div className="p-4 bg-stone-50 dark:bg-stone-850/80 border-t border-stone-200/80 dark:border-stone-800">
        <button
          type="button"
          onClick={handleBulkAdd}
          disabled={isAddingAll || selectedCount === 0}
          className="w-full py-3.5 px-5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-extrabold text-sm sm:text-base shadow-lg shadow-emerald-600/20 transition-all cursor-pointer flex items-center justify-between disabled:opacity-50 disabled:pointer-events-none"
        >
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5" />
            <span>
              {isAddingAll
                ? 'Adding items to cart...'
                : `Add all available items (${selectedCount})`}
            </span>
          </div>

          <span className="font-mono text-base font-black">
            ₹{(totalSelectedPaise / 100).toFixed(2)}
          </span>
        </button>

        <p className="text-center text-[11px] text-stone-400 dark:text-stone-500 mt-2">
          Pantry items are unselected by default. Tap checkboxes to toggle.
        </p>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { Plus, Check, Sparkles, ShoppingCart, Layers } from 'lucide-react';
import { Product } from '../../types';

export interface ProposedItem {
  productId: string;
  name: string;
  category?: string;
  packageSize: number;
  packageUnit: string;
  unitPricePaise?: number;
  pricePaise?: number;
  quantity?: number;
  packCount?: number;
  subtotalPaise?: number;
  availableStock?: number;
  imageUrl?: string;
  isOptional?: boolean;
  explain?: {
    matchMethod: 'DIRECT_EXACT' | 'DIRECT_ALIAS' | 'NORMALIZED_KEYWORD' | 'CATEGORY_FALLBACK';
    confidenceScore: number;
    matchedAlias?: string;
    leftoverPackGrams?: number;
    leftoverPackCostPaise?: number;
    ingredientSource: 'FRESH_GREENS' | 'DESI_KIRANA' | 'STANDARD_CATALOG';
    fssaiCertified: boolean;
  };
}

export interface ProposalPayload {
  status?: string;
  dishName?: string;
  servings?: number;
  rationale?: string;
  items?: ProposedItem[];
  pricing?: {
    totalPaise?: number;
    formatted?: { total?: string };
  };
  budgetComparison?: {
    budgetPaise: number;
    subtotalPaise: number;
    totalPaise: number;
    isOverBudget: boolean;
    differencePaise: number;
  };
}

interface ItemsCardProps {
  cardData: Product[] | ProposalPayload;
  onAddToCart: (productId: string, quantity: number) => void;
  onAddAllToCart?: (items: Array<{ productId: string; quantity: number }>) => void;
  title?: string;
}

export const ItemsCard: React.FC<ItemsCardProps> = ({
  cardData,
  onAddToCart,
  onAddAllToCart,
  title = 'Catalog Recommendations',
}) => {
  const [addingId, setAddingId] = useState<string | null>(null);
  const [isAddingAll, setIsAddingAll] = useState(false);
  const [expandedExplainId, setExpandedExplainId] = useState<string | null>(null);

  // Normalize input data
  const isProposal =
    !Array.isArray(cardData) && cardData && Array.isArray((cardData as ProposalPayload).items);

  const proposal = isProposal ? (cardData as ProposalPayload) : null;
  const itemsList: ProposedItem[] = isProposal
    ? proposal!.items || []
    : (cardData as Product[]).map((p) => ({
        productId: p._id,
        name: p.name,
        category: p.category,
        packageSize: p.packageSize,
        packageUnit: p.packageUnit,
        unitPricePaise: p.pricePaise,
        pricePaise: p.pricePaise,
        quantity: 1,
        packCount: 1,
        availableStock: p.availableStock,
        imageUrl: p.imageUrl,
      }));

  const handleAdd = async (productId: string, qty = 1) => {
    setAddingId(productId);
    await onAddToCart(productId, qty);
    setTimeout(() => setAddingId(null), 600);
  };

  const handleAddAll = async () => {
    if (!onAddAllToCart || itemsList.length === 0) return;
    setIsAddingAll(true);
    const toAdd = itemsList.map((i) => ({
      productId: i.productId,
      quantity: i.quantity || i.packCount || 1,
    }));
    await onAddAllToCart(toAdd);
    setTimeout(() => setIsAddingAll(false), 800);
  };

  const cardTitle = proposal?.dishName
    ? `Curated Ingredients for ${proposal.dishName} (${proposal.servings || 4} Servings)`
    : proposal?.rationale || title;

  const budgetComp = proposal?.budgetComparison;

  return (
    <div className="w-full rounded-2xl border border-brd bg-card/85 dark:bg-card-top/85 backdrop-blur-xl p-5 shadow-lg shadow-black/5 transition-all">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-brd">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-display font-bold text-ink tracking-tight">{cardTitle}</h3>
            {proposal?.pricing?.formatted?.total && (
              <p className="text-xs text-mut font-mono">
                Estimated Total:{' '}
                <span className="font-bold text-ink">{proposal.pricing.formatted.total}</span>
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {budgetComp && (
            <span
              className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-semibold border ${
                budgetComp.isOverBudget
                  ? 'bg-rose-500/10 text-rose-600 border-rose-500/20'
                  : 'bg-blue-500/10 text-acc border-blue-500/20'
              }`}
            >
              {budgetComp.isOverBudget
                ? `+₹${(budgetComp.differencePaise / 100).toFixed(0)} Over Budget`
                : `₹${(budgetComp.totalPaise / 100).toFixed(0)} of ₹${(budgetComp.budgetPaise / 100).toFixed(0)} Budget`}
            </span>
          )}
          <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold border border-emerald-500/20">
            100% Certified Vegetarian
          </span>
        </div>
      </div>

      {/* Products list */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {itemsList.map((item) => {
          const unitPrice = (item.unitPricePaise || item.pricePaise || 0) / 100;
          const qty = item.quantity || item.packCount || 1;
          const itemSubtotal = (unitPrice * qty).toFixed(2);
          const isAdding = addingId === item.productId;
          const isExplainOpen = expandedExplainId === item.productId;
          const explain = item.explain;

          return (
            <div
              key={item.productId}
              className="p-3.5 rounded-xl border border-brd bg-paper/50 hover:border-acc/40 transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="w-3.5 h-3.5 border border-emerald-600 flex items-center justify-center p-[2px]">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                      </span>
                      {item.category && (
                        <span className="text-[10px] font-mono text-mut uppercase">
                          {item.category}
                        </span>
                      )}
                      {item.isOptional && (
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-600 font-semibold">
                          Optional
                        </span>
                      )}
                    </div>
                    <h4 className="text-xs font-bold text-ink font-display line-clamp-1 group-hover:text-acc transition-colors">
                      {item.name}
                    </h4>
                  </div>
                  <span className="text-xs font-mono font-bold text-ink">
                    ₹{unitPrice.toFixed(2)}
                  </span>
                </div>

                <div className="flex items-center gap-2 mt-2">
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-brd/40 text-ink">
                    Pack: {item.packageSize} {item.packageUnit}
                  </span>
                  {qty > 1 && (
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-blue-500/10 text-acc font-semibold">
                      Required: {qty} packs (₹{itemSubtotal})
                    </span>
                  )}
                  {explain && (
                    <button
                      onClick={() => setExpandedExplainId(isExplainOpen ? null : item.productId)}
                      className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-600 dark:text-purple-400 hover:bg-purple-500/20 font-medium transition-all"
                    >
                      {isExplainOpen ? 'Hide reasoning' : 'Why this item?'}
                    </button>
                  )}
                </div>

                {/* Novelty N8: Explain reasoning drawer */}
                {explain && isExplainOpen && (
                  <div className="mt-2.5 p-2 rounded-lg bg-purple-500/5 border border-purple-500/20 text-[10px] space-y-1 font-mono text-mut">
                    <div className="flex justify-between text-ink font-semibold">
                      <span>Match Method:</span>
                      <span className="text-purple-600 dark:text-purple-400">
                        {explain.matchMethod} ({Math.round(explain.confidenceScore * 100)}% match)
                      </span>
                    </div>
                    {explain.matchedAlias && (
                      <div className="flex justify-between">
                        <span>Matched Alias:</span>
                        <span className="text-ink">"{explain.matchedAlias}"</span>
                      </div>
                    )}
                    {explain.leftoverPackGrams !== undefined && explain.leftoverPackGrams > 0 && (
                      <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                        <span>Leftover Saved:</span>
                        <span>
                          {explain.leftoverPackGrams}g (₹
                          {((explain.leftoverPackCostPaise || 0) / 100).toFixed(0)} saved)
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>Source / Safety:</span>
                      <span className="text-ink">
                        {explain.ingredientSource.replace('_', ' ')} ·{' '}
                        {explain.fssaiCertified ? 'FSSAI Certified' : 'Verified'}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Action footer */}
              <div className="mt-3 pt-2.5 border-t border-brd/60 flex items-center justify-between">
                <span className="text-[10px] text-mut font-mono">
                  Stock: {item.availableStock !== undefined ? item.availableStock : 'In Stock'}
                </span>

                <button
                  onClick={() => handleAdd(item.productId, qty)}
                  disabled={
                    isAdding || (item.availableStock !== undefined && item.availableStock < qty)
                  }
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    isAdding
                      ? 'bg-emerald-600 text-white'
                      : item.availableStock !== undefined && item.availableStock < qty
                        ? 'bg-brd text-mut cursor-not-allowed'
                        : 'bg-card text-ink border border-brd hover:border-acc hover:text-acc shadow-sm'
                  }`}
                >
                  {isAdding ? (
                    <>
                      <Check className="w-3 h-3" /> Added
                    </>
                  ) : (
                    <>
                      <Plus className="w-3 h-3" /> Add {qty > 1 ? `${qty} packs` : ''}
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add All To Cart Banner if proposal has multiple items */}
      {isProposal && onAddAllToCart && itemsList.length > 1 && (
        <div className="mt-4 pt-3 border-t border-brd flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-mut">
            <Layers className="w-4 h-4 text-acc" />
            <span>{itemsList.length} items suggested by AI recipe engine</span>
          </div>
          <button
            onClick={handleAddAll}
            disabled={isAddingAll}
            className="px-4 py-2 rounded-xl bg-acc hover:bg-blue-600 text-white text-xs font-bold transition-all shadow-md shadow-blue-500/20 flex items-center gap-2"
          >
            {isAddingAll ? (
              <>
                <Check className="w-4 h-4" /> Added All to Cart
              </>
            ) : (
              <>
                <ShoppingCart className="w-4 h-4" /> Add All {itemsList.length} Items to Cart
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

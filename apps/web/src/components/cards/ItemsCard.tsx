import React, { useState } from 'react';
import { Plus, Check, Sparkles, Tag } from 'lucide-react';
import { Product } from '../../types';

interface ItemsCardProps {
  products: Product[];
  onAddToCart: (productId: string, quantity: number) => void;
  title?: string;
  queryNote?: string;
}

export const ItemsCard: React.FC<ItemsCardProps> = ({
  products,
  onAddToCart,
  title = 'Catalog Recommendations',
  queryNote,
}) => {
  const [addingId, setAddingId] = useState<string | null>(null);

  const handleAdd = async (productId: string) => {
    setAddingId(productId);
    await onAddToCart(productId, 1);
    setTimeout(() => setAddingId(null), 600);
  };

  return (
    <div className="w-full rounded-2xl border border-brd bg-card/85 dark:bg-card-top/85 backdrop-blur-xl p-5 shadow-lg shadow-black/5 transition-all">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-brd">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-display font-bold text-ink tracking-tight">{title}</h3>
            {queryNote && <p className="text-xs text-mut">{queryNote}</p>}
          </div>
        </div>
        <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold border border-emerald-500/20">
          Strictly Vegetarian
        </span>
      </div>

      {/* Products list */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {products.map((prod) => {
          const priceRupees = (prod.pricePaise / 100).toFixed(2);
          const isAdding = addingId === prod._id;

          return (
            <div
              key={prod._id}
              className="p-3.5 rounded-xl border border-brd bg-paper/50 hover:border-acc/40 transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-1.5 mb-1">
                      {/* Vegetarian green square indicator */}
                      <span className="w-3.5 h-3.5 border border-emerald-600 flex items-center justify-center p-[2px]">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                      </span>
                      <span className="text-[10px] font-mono text-mut uppercase">
                        {prod.category}
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-ink font-display line-clamp-1 group-hover:text-acc transition-colors">
                      {prod.name}
                    </h4>
                  </div>
                  <span className="text-xs font-mono font-bold text-ink">₹{priceRupees}</span>
                </div>

                <p className="text-[11px] text-mut line-clamp-2 mt-1.5 leading-relaxed">
                  {prod.description}
                </p>

                {/* Aliases Pill */}
                {prod.aliases && prod.aliases.length > 0 && (
                  <div className="flex items-center gap-1 mt-2 flex-wrap">
                    <Tag className="w-2.5 h-2.5 text-mut" />
                    {prod.aliases.slice(0, 2).map((alias) => (
                      <span
                        key={alias}
                        className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-brd/40 text-mut"
                      >
                        {alias}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Action footer */}
              <div className="mt-3 pt-2.5 border-t border-brd/60 flex items-center justify-between">
                <span className="text-[10px] text-mut font-mono">
                  {prod.packageSize} {prod.packageUnit} · Stock: {prod.availableStock}
                </span>

                <button
                  onClick={() => handleAdd(prod._id)}
                  disabled={isAdding || prod.availableStock < 1}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    isAdding
                      ? 'bg-emerald-600 text-white'
                      : prod.availableStock < 1
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
                      <Plus className="w-3 h-3" /> Add
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

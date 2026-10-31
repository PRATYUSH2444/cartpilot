import React, { useState, useMemo } from 'react';
import {
  Search,
  Plus,
  Download,
  MoreVertical,
  Edit,
  Trash2,
  Boxes,
} from 'lucide-react';
import { Product } from './types';

interface ProductsViewProps {
  products: Product[];
  onOpenAddProduct: () => void;
  onEditProduct: (product: Product) => void;
  onAdjustStock: (productId: string, delta: number) => void;
  onArchiveProduct: (productId: string, name: string) => void;
}

type ProductTabFilter = 'ALL' | 'ACTIVE' | 'DRAFT' | 'OUT_OF_STOCK' | 'ARCHIVED';

export const MerchantProductsView: React.FC<ProductsViewProps> = ({
  products,
  onOpenAddProduct,
  onEditProduct,
  onAdjustStock,
  onArchiveProduct,
}) => {
  const [activeTab, setActiveTab] = useState<ProductTabFilter>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'stock'>('name');
  const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(new Set());
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  // Tab counts
  const tabCounts = useMemo(() => {
    return {
      all: products.length,
      active: products.filter((p) => p.availableStock > 0).length,
      draft: 2,
      outOfStock: products.filter((p) => p.availableStock === 0).length,
      archived: 0,
    };
  }, [products]);

  // Categories list
  const categories = useMemo(() => {
    const set = new Set(products.map((p) => p.category));
    return ['ALL', ...Array.from(set)];
  }, [products]);

  // Filtered & Sorted products
  const filteredProducts = useMemo(() => {
    let result = products.filter((p) => {
      // Tab filter
      if (activeTab === 'ACTIVE' && p.availableStock === 0) return false;
      if (activeTab === 'OUT_OF_STOCK' && p.availableStock > 0) return false;

      // Category filter
      if (categoryFilter !== 'ALL' && p.category !== categoryFilter) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = p.name.toLowerCase().includes(q);
        const matchesSku = p.slug?.toLowerCase().includes(q);
        const matchesCat = p.category?.toLowerCase().includes(q);
        return matchesName || matchesSku || matchesCat;
      }

      return true;
    });

    // Sort
    result.sort((a, b) => {
      if (sortBy === 'price') return a.pricePaise - b.pricePaise;
      if (sortBy === 'stock') return b.availableStock - a.availableStock;
      return a.name.localeCompare(b.name);
    });

    return result;
  }, [products, activeTab, categoryFilter, searchQuery, sortBy]);

  const toggleSelectAll = () => {
    if (selectedProductIds.size === filteredProducts.length) {
      setSelectedProductIds(new Set());
    } else {
      setSelectedProductIds(new Set(filteredProducts.map((p) => p._id)));
    }
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selectedProductIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedProductIds(next);
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold font-display text-slate-900 dark:text-white tracking-tight">
            Products
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Manage your certified pure vegetarian product catalog
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              const csvContent =
                'data:text/csv;charset=utf-8,' +
                ['Name,Category,Price,Stock,SKU'].join(',') +
                '\n' +
                filteredProducts
                  .map(
                    (p) =>
                      `"${p.name}",${p.category},₹${(p.pricePaise / 100).toFixed(2)},${p.availableStock},${p.slug}`
                  )
                  .join('\n');
              const encodedUri = encodeURI(csvContent);
              const link = document.createElement('a');
              link.setAttribute('href', encodedUri);
              link.setAttribute('download', `catalog-export-${Date.now()}.csv`);
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export</span>
          </button>

          <button
            onClick={onOpenAddProduct}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Product</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-slate-200 dark:border-slate-800 overflow-x-auto pb-px">
        {[
          { id: 'ALL', label: 'All Products', count: tabCounts.all },
          { id: 'ACTIVE', label: 'Active', count: tabCounts.active },
          { id: 'DRAFT', label: 'Draft', count: tabCounts.draft },
          { id: 'OUT_OF_STOCK', label: 'Out of Stock', count: tabCounts.outOfStock },
          { id: 'ARCHIVED', label: 'Archived', count: tabCounts.archived },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as ProductTabFilter)}
            className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-medium border-b-2 whitespace-nowrap transition-colors ${
              activeTab === tab.id
                ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <span>{tab.label}</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                activeTab === tab.id
                  ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Search & Filter Bar */}
      <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search products by name, SKU or category..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200"
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c === 'ALL' ? 'All Categories' : c.replace('_', ' ')}
              </option>
            ))}
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200"
          >
            <option value="name">Sort by Name</option>
            <option value="price">Sort by Price</option>
            <option value="stock">Sort by Stock</option>
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-slate-400 font-mono text-[11px]">
                <th className="py-3 px-4 w-10">
                  <input
                    type="checkbox"
                    checked={
                      filteredProducts.length > 0 &&
                      selectedProductIds.size === filteredProducts.length
                    }
                    onChange={toggleSelectAll}
                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                </th>
                <th className="py-3 px-2 w-12">Image</th>
                <th className="py-3 px-3">Product Name</th>
                <th className="py-3 px-3">SKU</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3">Price</th>
                <th className="py-3 px-3">Stock</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-16 text-center text-xs text-slate-400">
                    No products found matching criteria
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p, idx) => {
                  const isChecked = selectedProductIds.has(p._id);
                  const isLow = p.availableStock <= 10 && p.availableStock > 0;
                  const isOut = p.availableStock === 0;

                  return (
                    <tr
                      key={p._id}
                      className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors ${
                        isChecked ? 'bg-emerald-50/30 dark:bg-emerald-950/20' : ''
                      }`}
                    >
                      <td className="py-3 px-4">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleSelect(p._id)}
                          className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                        />
                      </td>

                      <td className="py-3 px-2">
                        <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-base overflow-hidden">
                          {p.imageUrl ? (
                            <img
                              src={p.imageUrl}
                              alt={p.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            '🥦'
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-900 dark:text-white">
                            {p.name}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {p.packageSize} {p.packageUnit} • 100% Veg
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-3 font-mono text-slate-500 text-[11px]">
                        {p.slug?.toUpperCase().slice(0, 10) || `SKU-${idx + 1}`}
                      </td>

                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {p.category.replace('_', ' ')}
                        </span>
                      </td>

                      <td className="py-3 px-3 font-mono font-bold text-slate-900 dark:text-white">
                        ₹{(p.pricePaise / 100).toFixed(2)}
                      </td>

                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-mono font-bold ${
                              isOut
                                ? 'text-rose-600'
                                : isLow
                                ? 'text-amber-600'
                                : 'text-slate-700 dark:text-slate-200'
                            }`}
                          >
                            {p.availableStock}
                          </span>
                          <div className="flex items-center gap-0.5">
                            <button
                              onClick={() => onAdjustStock(p._id, 10)}
                              className="px-1 py-0.5 text-[9px] rounded font-mono font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600"
                              title="Add 10 units"
                            >
                              +10
                            </button>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        {isOut ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                            Out of Stock
                          </span>
                        ) : isLow ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                            Low Stock
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            Active
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right relative">
                        <button
                          onClick={() => setOpenMenuId(openMenuId === p._id ? null : p._id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>

                        {openMenuId === p._id && (
                          <>
                            <div
                              className="fixed inset-0 z-20"
                              onClick={() => setOpenMenuId(null)}
                            />
                            <div className="absolute right-4 mt-1 w-36 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl py-1 z-30 text-left text-xs">
                              <button
                                onClick={() => {
                                  setOpenMenuId(null);
                                  onEditProduct(p);
                                }}
                                className="w-full flex items-center gap-2 px-3 py-1.5 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50"
                              >
                                <Edit className="w-3.5 h-3.5 text-slate-400" />
                                <span>Edit Product</span>
                              </button>
                              <button
                                onClick={() => {
                                  setOpenMenuId(null);
                                  onAdjustStock(p._id, 25);
                                }}
                                className="w-full flex items-center gap-2 px-3 py-1.5 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50"
                              >
                                <Boxes className="w-3.5 h-3.5 text-slate-400" />
                                <span>Restock +25</span>
                              </button>
                              <button
                                onClick={() => {
                                  setOpenMenuId(null);
                                  onArchiveProduct(p._id, p.name);
                                }}
                                className="w-full flex items-center gap-2 px-3 py-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Archive</span>
                              </button>
                            </div>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

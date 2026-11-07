import React, { useState, useMemo } from 'react';
import {
  Search,
  Plus,
  Download,
  MoreVertical,
  Edit,
  Trash2,
  Boxes,
  Zap,
  UploadCloud,
  FileSpreadsheet,
  X,
  Package,
  Check,
} from 'lucide-react';
import { Product } from './types';
import { ModalPortal } from '../common/ModalPortal';
import { useScrollLock } from '../../hooks/useScrollLock';

interface ProductsViewProps {
  products: Product[];
  onOpenAddProduct: () => void;
  onEditProduct: (product: Product) => void;
  onAdjustStock: (productId: string, delta: number) => void;
  onArchiveProduct: (productId: string, name: string) => void;
  onQuickAddProduct?: (formData: any) => Promise<void>;
}

type ProductTabFilter = 'ALL' | 'ACTIVE' | 'DRAFT' | 'OUT_OF_STOCK' | 'ARCHIVED';

export const MerchantProductsView: React.FC<ProductsViewProps> = ({
  products,
  onOpenAddProduct,
  onEditProduct,
  onAdjustStock,
  onArchiveProduct,
  onQuickAddProduct,
}) => {
  const [activeTab, setActiveTab] = useState<ProductTabFilter>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'stock'>('name');
  const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(new Set());
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  // Quick Add Modal state
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [quickName, setQuickName] = useState('');
  const [quickCategory, setQuickCategory] = useState('FRUITS_VEGETABLES');
  const [quickPriceRupees, setQuickPriceRupees] = useState('');
  const [quickStock, setQuickStock] = useState('50');
  const [quickUnit, setQuickUnit] = useState('1 KG');
  const [isQuickSubmitting, setIsQuickSubmitting] = useState(false);

  // Bulk Upload Modal state
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [bulkCsvText, setBulkCsvText] = useState('');
  const [bulkParsedItems, setBulkParsedItems] = useState<any[]>([]);

  useScrollLock(isQuickAddOpen || isBulkModalOpen, {
    onEscape: () => {
      setIsQuickAddOpen(false);
      setIsBulkModalOpen(false);
    },
  });

  // Tab counts
  const tabCounts = useMemo(() => {
    return {
      all: products.length,
      active: products.filter((p) => p.availableStock > 0).length,
      draft: 0,
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
      if (activeTab === 'ACTIVE' && p.availableStock === 0) return false;
      if (activeTab === 'OUT_OF_STOCK' && p.availableStock > 0) return false;
      if (categoryFilter !== 'ALL' && p.category !== categoryFilter) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = p.name.toLowerCase().includes(q);
        const matchesSku = p.slug?.toLowerCase().includes(q);
        const matchesCat = p.category?.toLowerCase().includes(q);
        return matchesName || matchesSku || matchesCat;
      }

      return true;
    });

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

  // Quick Add submit
  const handleQuickAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickName || !quickPriceRupees) return;
    setIsQuickSubmitting(true);
    try {
      const pricePaise = Math.round(parseFloat(quickPriceRupees) * 100);
      const stock = parseInt(quickStock || '10', 10);
      const payload = {
        name: quickName.trim(),
        description: `Fresh ${quickName.trim()} sourced directly from verified local suppliers.`,
        category: quickCategory,
        pricePaise,
        availableStock: stock,
        packageSize: 1,
        packageUnit: quickUnit,
        isVegetarianCertified: true,
        isOrganic: true,
      };

      if (onQuickAddProduct) {
        await onQuickAddProduct(payload);
      }
      setIsQuickAddOpen(false);
      setQuickName('');
      setQuickPriceRupees('');
      setQuickStock('50');
    } finally {
      setIsQuickSubmitting(false);
    }
  };

  // Parse Bulk CSV
  const handleParseCsv = (text: string) => {
    setBulkCsvText(text);
    const lines = text.trim().split('\n');
    if (lines.length < 2) return;
    const items = [];
    for (let i = 1; i < lines.length; i++) {
      const row = lines[i]?.split(',');
      if (row && row.length >= 3) {
        items.push({
          name: row[0]?.trim(),
          category: row[1]?.trim() || 'GROCERY',
          priceRupees: row[2]?.trim(),
          stock: row[3]?.trim() || '50',
        });
      }
    }
    setBulkParsedItems(items);
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200 pb-12">
      {/* ── Page Header & 3 Listing Methods ───────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold font-display text-slate-900 dark:text-white tracking-tight">
                My Products Catalog
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {products.length} pure vegetarian items active in your online shop
              </p>
            </div>
          </div>
        </div>

        {/* 3 Add Methods Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Method 1: 10-Second Quick Add */}
          <button
            onClick={() => setIsQuickAddOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-600 shadow-xs cursor-pointer transition-colors"
          >
            <Zap className="w-4 h-4 text-amber-300" />
            <span>Quick Add (10s)</span>
          </button>

          {/* Method 2: Complete Wizard */}
          <button
            onClick={onOpenAddProduct}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-2xs cursor-pointer transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Complete Product</span>
          </button>

          {/* Method 3: Bulk Upload CSV */}
          <button
            onClick={() => setIsBulkModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-2xs cursor-pointer transition-colors"
          >
            <UploadCloud className="w-3.5 h-3.5 text-slate-400" />
            <span>Bulk CSV</span>
          </button>

          {/* Export CSV */}
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
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 cursor-pointer"
            title="Download catalog as CSV"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ── Tabs Bar ──────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-1 border-b border-slate-200 dark:border-slate-800 overflow-x-auto pb-px">
        {[
          { id: 'ALL', label: 'All Products', count: tabCounts.all },
          { id: 'ACTIVE', label: 'Active', count: tabCounts.active },
          { id: 'OUT_OF_STOCK', label: 'Out of Stock', count: tabCounts.outOfStock },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as ProductTabFilter)}
            className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-medium border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === tab.id
                ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400 font-bold'
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

      {/* ── Search & Filter Controls ─────────────────────────────────────────── */}
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
            className="px-3 py-2 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 cursor-pointer"
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
            className="px-3 py-2 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 cursor-pointer"
          >
            <option value="name">Sort by Name</option>
            <option value="price">Sort by Price</option>
            <option value="stock">Sort by Stock</option>
          </select>
        </div>
      </div>

      {/* ── Products Table with Fast In-Line Stock Adjustments ───────────────── */}
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
                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                  />
                </th>
                <th className="py-3 px-2 w-12">Photo</th>
                <th className="py-3 px-3">Product Name</th>
                <th className="py-3 px-3">SKU</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3">Price</th>
                <th className="py-3 px-3">Quick Stock Adjust</th>
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
                          className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
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
                          <span className="font-bold text-slate-900 dark:text-white">
                            {p.name}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {p.packageSize} {p.packageUnit} • Pure Veg
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

                      {/* Fast In-line stock adjustments (+1, +5, +10) */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-mono font-bold text-xs min-w-[28px] ${
                              isOut
                                ? 'text-rose-600'
                                : isLow
                                ? 'text-amber-600'
                                : 'text-slate-800 dark:text-slate-200'
                            }`}
                          >
                            {p.availableStock}
                          </span>
                          <div className="inline-flex items-center rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-0.5">
                            <button
                              onClick={() => onAdjustStock(p._id, 1)}
                              className="px-1.5 py-0.5 text-[10px] font-mono font-bold hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded cursor-pointer"
                              title="Add 1 unit"
                            >
                              +1
                            </button>
                            <button
                              onClick={() => onAdjustStock(p._id, 5)}
                              className="px-1.5 py-0.5 text-[10px] font-mono font-bold hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded cursor-pointer"
                              title="Add 5 units"
                            >
                              +5
                            </button>
                            <button
                              onClick={() => onAdjustStock(p._id, 10)}
                              className="px-1.5 py-0.5 text-[10px] font-mono font-bold hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded cursor-pointer"
                              title="Add 10 units"
                            >
                              +10
                            </button>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        {isOut ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                            Out of Stock
                          </span>
                        ) : isLow ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                            Low Stock
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            Active
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right relative">
                        <button
                          onClick={() => setOpenMenuId(openMenuId === p._id ? null : p._id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
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
                                className="w-full flex items-center gap-2 px-3 py-1.5 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer"
                              >
                                <Edit className="w-3.5 h-3.5 text-slate-400" />
                                <span>Edit Product</span>
                              </button>
                              <button
                                onClick={() => {
                                  setOpenMenuId(null);
                                  onAdjustStock(p._id, 25);
                                }}
                                className="w-full flex items-center gap-2 px-3 py-1.5 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer"
                              >
                                <Boxes className="w-3.5 h-3.5 text-slate-400" />
                                <span>Restock +25</span>
                              </button>
                              <button
                                onClick={() => {
                                  setOpenMenuId(null);
                                  onArchiveProduct(p._id, p.name);
                                }}
                                className="w-full flex items-center gap-2 px-3 py-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 cursor-pointer"
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

      {/* ── Quick Add (10 Seconds) Modal ─────────────────────────────────────── */}
      {isQuickAddOpen && (
        <ModalPortal>
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs animate-in fade-in"
              onClick={() => setIsQuickAddOpen(false)}
            />
            <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 z-10 animate-in zoom-in-95">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
                    <Zap className="w-4 h-4 text-amber-300" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      Quick Add Product (10s)
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Instant catalog listing with 4 essential fields
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsQuickAddOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleQuickAddSubmit} className="space-y-4 pt-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-200 block mb-1">
                    Product Name *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Fresh Paneer 200g or Basmati Rice 1kg"
                    value={quickName}
                    onChange={(e) => setQuickName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-200 block mb-1">
                      Selling Price (₹) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="e.g. 85.00"
                      value={quickPriceRupees}
                      onChange={(e) => setQuickPriceRupees(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl text-xs font-mono font-bold border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-200 block mb-1">
                      Initial Stock *
                    </label>
                    <input
                      type="number"
                      value={quickStock}
                      onChange={(e) => setQuickStock(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl text-xs font-mono font-bold border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-200 block mb-1">
                      Category
                    </label>
                    <select
                      value={quickCategory}
                      onChange={(e) => setQuickCategory(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl text-xs font-medium border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none"
                    >
                      <option value="FRUITS_VEGETABLES">Fruits & Vegetables</option>
                      <option value="DAIRY_BREAKFAST">Dairy & Breakfast</option>
                      <option value="ATTA_RICE_DAL">Atta, Rice & Dal</option>
                      <option value="SNACKS_MUNCHIES">Snacks & Munchies</option>
                      <option value="BEVERAGES">Beverages</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-200 block mb-1">
                      Unit
                    </label>
                    <input
                      type="text"
                      value={quickUnit}
                      onChange={(e) => setQuickUnit(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl text-xs font-medium border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isQuickSubmitting}
                    className="w-full py-3 rounded-2xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>
                      {isQuickSubmitting ? 'Listing Product...' : 'Save & Publish Immediately'}
                    </span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* ── Bulk CSV Upload Modal ────────────────────────────────────────────── */}
      {isBulkModalOpen && (
        <ModalPortal>
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs animate-in fade-in"
              onClick={() => setIsBulkModalOpen(false)}
            />
            <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 z-10 animate-in zoom-in-95 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Bulk Product CSV Import
                  </h3>
                </div>
                <button
                  onClick={() => setIsBulkModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-xs text-slate-500">
                Paste CSV data or write lines with format:{' '}
                <code className="text-emerald-600 font-mono">Name, Category, Price, Stock</code>
              </p>

              <textarea
                rows={6}
                value={bulkCsvText}
                onChange={(e) => handleParseCsv(e.target.value)}
                placeholder="Name,Category,Price,Stock&#10;Organic Green Peas 500g,FRUITS_VEGETABLES,65.00,40&#10;Amul Cow Ghee 1L,DAIRY_BREAKFAST,620.00,25&#10;Tata Sampann Toor Dal 1kg,ATTA_RICE_DAL,185.00,30"
                className="w-full p-3 font-mono text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
              />

              {bulkParsedItems.length > 0 && (
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 max-h-36 overflow-y-auto">
                  <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Preview ({bulkParsedItems.length} items parsed):
                  </span>
                  <div className="space-y-1 text-xs font-mono text-slate-600 dark:text-slate-400">
                    {bulkParsedItems.map((item, i) => (
                      <div key={i}>
                        {i + 1}. {item.name} — ₹{item.priceRupees} ({item.stock} in stock)
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsBulkModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    if (bulkParsedItems.length === 0) return;
                    if (onQuickAddProduct) {
                      for (const it of bulkParsedItems) {
                        await onQuickAddProduct({
                          name: it.name,
                          description: `Fresh ${it.name} pure vegetarian`,
                          category: it.category || 'GROCERY',
                          pricePaise: Math.round(parseFloat(it.priceRupees || '0') * 100),
                          availableStock: parseInt(it.stock || '50', 10),
                          isVegetarianCertified: true,
                        });
                      }
                    }
                    setIsBulkModalOpen(false);
                    setBulkCsvText('');
                    setBulkParsedItems([]);
                  }}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-600 shadow-xs cursor-pointer"
                >
                  Import {bulkParsedItems.length} Products
                </button>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}
    </div>
  );
};

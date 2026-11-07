import React, { useState, useEffect } from 'react';
import {
  Check,
  Leaf,
  Image as ImageIcon,
} from 'lucide-react';
import { Product } from './types';
import { ModalPortal } from '../common/ModalPortal';
import { useScrollLock } from '../../hooks/useScrollLock';

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  productToEdit?: Product | null;
  onSubmit: (formData: any) => Promise<void>;
  isSubmitting: boolean;
}

type FormSection =
  | 'basic'
  | 'media'
  | 'category'
  | 'pricing'
  | 'variants'
  | 'inventory'
  | 'additional';

export const MerchantProductFormModal: React.FC<ProductFormModalProps> = ({
  isOpen,
  onClose,
  productToEdit,
  onSubmit,
  isSubmitting,
}) => {
  useScrollLock(isOpen, { onEscape: onClose });

  const [activeSection, setActiveSection] = useState<FormSection>('basic');

  // Form Fields
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [brand, setBrand] = useState('Fresh Greens');
  const [sku, setSku] = useState('');
  const [barcode, setBarcode] = useState('');
  const [isVegetarian] = useState(true);
  const [isOrganic, setIsOrganic] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [category, setCategory] = useState('FRUITS_VEGETABLES');
  const [subcategory, setSubcategory] = useState('Vegetables');
  const [aliases, setAliases] = useState('');
  const [priceRupees, setPriceRupees] = useState('');
  const [originalPriceRupees, setOriginalPriceRupees] = useState('');
  const [packageSize, setPackageSize] = useState('500');
  const [packageUnit, setPackageUnit] = useState('G');
  const [availableStock, setAvailableStock] = useState('50');
  const [lowStockLimit, setLowStockLimit] = useState('10');
  const [status, setStatus] = useState<'Active' | 'Draft'>('Active');

  useEffect(() => {
    if (productToEdit) {
      setName(productToEdit.name);
      setDescription(productToEdit.description || '');
      setCategory(productToEdit.category || 'FRUITS_VEGETABLES');
      setPriceRupees(((productToEdit.pricePaise || 0) / 100).toString());
      setPackageSize((productToEdit.packageSize || 500).toString());
      setPackageUnit(productToEdit.packageUnit || 'G');
      setAvailableStock((productToEdit.availableStock || 50).toString());
      setImageUrl(productToEdit.imageUrl || '');
      setAliases((productToEdit.aliases || []).join(', '));
      setSku(productToEdit.slug || '');
    } else {
      setName('');
      setDescription('');
      setCategory('FRUITS_VEGETABLES');
      setPriceRupees('');
      setOriginalPriceRupees('');
      setPackageSize('500');
      setPackageUnit('G');
      setAvailableStock('50');
      setImageUrl('');
      setAliases('');
      setSku('');
    }
    setActiveSection('basic');
  }, [productToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const pricePaise = Math.round(parseFloat(priceRupees || '0') * 100);
    const stock = parseInt(availableStock || '0', 10);
    const size = parseFloat(packageSize || '1');
    const aliasesList = aliases
      .split(',')
      .map((a) => a.trim().toLowerCase())
      .filter(Boolean);

    await onSubmit({
      name,
      description: description || name,
      category,
      pricePaise,
      packageSize: size,
      packageUnit,
      availableStock: stock,
      imageUrl,
      aliases: aliasesList,
      isVegetarian: true, // Always enforce certified vegetarian
    });
  };

  const sections = [
    { id: 'basic', label: '1. Basic Information', desc: 'Product name, description & brand' },
    { id: 'media', label: '2. Media & Images', desc: 'Upload product display images' },
    { id: 'category', label: '3. Category & Tags', desc: 'Classification and search keywords' },
    { id: 'pricing', label: '4. Pricing', desc: 'Price, discounts & tax structure' },
    { id: 'variants', label: '5. Variants & Packaging', desc: 'Weight, size & packaging units' },
    { id: 'inventory', label: '6. Inventory', desc: 'Stock level & low stock limit' },
    { id: 'additional', label: '7. Additional Details', desc: 'Dietary assurance & visibility' },
  ];

  if (!isOpen) return null;

  return (
    <ModalPortal>
      <div className="modal-overlay">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
          onClick={onClose}
        />

        {/* Modal Dialog */}
        <div className="modal-dialog relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 z-10 flex flex-col max-h-[90dvh] animate-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="modal-header px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900">
            <div>
              <h2 className="text-lg font-bold font-display text-slate-900 dark:text-white">
                {productToEdit ? 'Edit Product' : 'Add New Product'}
              </h2>
              <p className="text-xs text-slate-400">
                Create and manage products for your retail catalog
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting || !name || !priceRupees}
                className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 shadow-xs flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                {isSubmitting ? (
                  <span>Saving...</span>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Save Product</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* 2-Column Split: Left navigation + Right Form */}
          <div className="flex-1 min-h-0 overflow-hidden flex flex-col md:flex-row">
            {/* Left Vertical Stepper Tabs */}
            <div className="w-full md:w-64 border-r border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 p-3 space-y-1 overflow-y-auto overscroll-contain flex-shrink-0">
              {sections.map((sec) => (
                <button
                  type="button"
                  key={sec.id}
                  onClick={() => setActiveSection(sec.id as FormSection)}
                  className={`w-full text-left p-3 rounded-xl transition-colors cursor-pointer ${
                    activeSection === sec.id
                      ? 'bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-400 font-semibold shadow-xs border border-slate-200/80 dark:border-slate-700'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-white/60 dark:hover:bg-slate-800/40'
                  }`}
                >
                  <div className="text-xs font-semibold leading-tight">{sec.label}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5 truncate">{sec.desc}</div>
                </button>
              ))}
            </div>

            {/* Right Form Content */}
            <form onSubmit={handleSubmit} className="modal-body flex-1 p-6 space-y-5 text-xs">
            {/* 1. Basic Information */}
            {activeSection === 'basic' && (
              <div className="space-y-4 animate-in fade-in duration-150">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white pb-2 border-b border-slate-100 dark:border-slate-800">
                  Basic Information
                </h3>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Product Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Fresh Organic Tomatoes"
                    className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Description
                  </label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Farm fresh hand-picked red tomatoes rich in vitamins..."
                    className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Brand
                    </label>
                    <input
                      type="text"
                      value={brand}
                      onChange={(e) => setBrand(e.target.value)}
                      placeholder="e.g. Fresh Greens"
                      className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      SKU
                    </label>
                    <input
                      type="text"
                      value={sku}
                      onChange={(e) => setSku(e.target.value)}
                      placeholder="e.g. FG-TOM-001"
                      className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Barcode (Optional)
                    </label>
                    <input
                      type="text"
                      value={barcode}
                      onChange={(e) => setBarcode(e.target.value)}
                      placeholder="8901234567890"
                      className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                    />
                  </div>
                </div>

                {/* Dietary toggles */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isVegetarian}
                      disabled
                      className="rounded text-emerald-600 focus:ring-emerald-500 cursor-not-allowed"
                    />
                    <span className="font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1">
                      <Leaf className="w-3.5 h-3.5 text-emerald-600" />
                      100% Pure Vegetarian (Strict Mandate)
                    </span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isOrganic}
                      onChange={(e) => setIsOrganic(e.target.checked)}
                      className="rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="font-medium text-slate-700 dark:text-slate-300">
                      Certified Organic
                    </span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isFeatured}
                      onChange={(e) => setIsFeatured(e.target.checked)}
                      className="rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="font-medium text-slate-700 dark:text-slate-300">
                      Featured in Best Sellers
                    </span>
                  </label>
                </div>
              </div>
            )}

            {/* 2. Media & Images */}
            {activeSection === 'media' && (
              <div className="space-y-4 animate-in fade-in duration-150">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white pb-2 border-b border-slate-100 dark:border-slate-800">
                  Media & Images
                </h3>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Primary Image URL
                  </label>
                  <input
                    type="url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/photo-..."
                    className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>

                <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl p-6 text-center hover:border-emerald-500 transition-colors">
                  <div className="mx-auto w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center mb-2">
                    <ImageIcon className="w-5 h-5" />
                  </div>
                  <p className="font-semibold text-slate-700 dark:text-slate-300">
                    High Resolution Product Visual
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Paste an image URL above or drag and drop image files
                  </p>
                  {imageUrl && (
                    <div className="mt-4 inline-block w-24 h-24 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-xs">
                      <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 3. Category & Tags */}
            {activeSection === 'category' && (
              <div className="space-y-4 animate-in fade-in duration-150">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white pb-2 border-b border-slate-100 dark:border-slate-800">
                  Category & Classification
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Primary Category *
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                    >
                      <option value="FRUITS_VEGETABLES">Fruits & Vegetables</option>
                      <option value="DAIRY_BREAKFAST">Dairy & Breakfast</option>
                      <option value="ATTA_RICE_DAL">Atta, Rice & Dal</option>
                      <option value="SNACKS_MUNCHIES">Snacks & Munchies</option>
                      <option value="COLD_DRINKS_JUICES">Cold Drinks & Juices</option>
                      <option value="BAKERY">Bakery</option>
                      <option value="MASALA_DRY_FRUITS">Masala & Dry Fruits</option>
                      <option value="HOUSEHOLD_ESSENTIALS">Household Essentials</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Subcategory
                    </label>
                    <input
                      type="text"
                      value={subcategory}
                      onChange={(e) => setSubcategory(e.target.value)}
                      placeholder="e.g. Fresh Greens, Root Vegetables"
                      className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Search Aliases & Keywords (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={aliases}
                    onChange={(e) => setAliases(e.target.value)}
                    placeholder="tamatar, tomato, cherry tomato, hybrid tomato"
                    className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Helps CartPilot AI shopping assistant understand colloquial and multilingual search queries
                  </p>
                </div>
              </div>
            )}

            {/* 4. Pricing */}
            {activeSection === 'pricing' && (
              <div className="space-y-4 animate-in fade-in duration-150">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white pb-2 border-b border-slate-100 dark:border-slate-800">
                  Pricing & Discounts
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Selling Price (₹) *
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono">
                        ₹
                      </span>
                      <input
                        type="number"
                        step="0.01"
                        required
                        value={priceRupees}
                        onChange={(e) => setPriceRupees(e.target.value)}
                        placeholder="40.00"
                        className="w-full pl-7 pr-3 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-bold"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      MRP / Original Price (₹)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono">
                        ₹
                      </span>
                      <input
                        type="number"
                        step="0.01"
                        value={originalPriceRupees}
                        onChange={(e) => setOriginalPriceRupees(e.target.value)}
                        placeholder="50.00"
                        className="w-full pl-7 pr-3 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                      />
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-[11px] text-slate-500">
                  Prices are stored as exact integer paise in MongoDB to prevent floating-point rounding errors across checkout & payouts.
                </div>
              </div>
            )}

            {/* 5. Variants & Packaging */}
            {activeSection === 'variants' && (
              <div className="space-y-4 animate-in fade-in duration-150">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white pb-2 border-b border-slate-100 dark:border-slate-800">
                  Packaging & Unit Size
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Package Size *
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={packageSize}
                      onChange={(e) => setPackageSize(e.target.value)}
                      placeholder="500"
                      className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Unit of Measurement *
                    </label>
                    <select
                      value={packageUnit}
                      onChange={(e) => setPackageUnit(e.target.value)}
                      className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                    >
                      <option value="G">Grams (g)</option>
                      <option value="KG">Kilograms (kg)</option>
                      <option value="ML">Millilitres (ml)</option>
                      <option value="L">Litres (L)</option>
                      <option value="PIECE">Pieces / Bunch (pc)</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* 6. Inventory */}
            {activeSection === 'inventory' && (
              <div className="space-y-4 animate-in fade-in duration-150">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white pb-2 border-b border-slate-100 dark:border-slate-800">
                  Stock & Inventory Tracking
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Available Stock Units *
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={availableStock}
                      onChange={(e) => setAvailableStock(e.target.value)}
                      placeholder="50"
                      className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Low Stock Threshold
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={lowStockLimit}
                      onChange={(e) => setLowStockLimit(e.target.value)}
                      placeholder="10"
                      className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 7. Additional Details */}
            {activeSection === 'additional' && (
              <div className="space-y-4 animate-in fade-in duration-150">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white pb-2 border-b border-slate-100 dark:border-slate-800">
                  Visibility & Publication
                </h3>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Catalog Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  >
                    <option value="Active">Active (Visible in Shopper catalog)</option>
                    <option value="Draft">Draft (Hidden from shoppers)</option>
                  </select>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  </ModalPortal>
  );
};

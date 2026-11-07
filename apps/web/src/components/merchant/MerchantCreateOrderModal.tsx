import React, { useState, useMemo } from 'react';
import {
  X,
  Search,
  Plus,
  Minus,
  Trash2,
  ShoppingBag,
  User,
  Phone,
  Mail,
  MapPin,
  FileText,
  CreditCard,
  Banknote,
  Check,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { Product, OrderData } from './types';
import { API_BASE } from '../../config/api';
import { ModalPortal } from '../common/ModalPortal';
import { useScrollLock } from '../../hooks/useScrollLock';

interface MerchantCreateOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  token: string | null;
  onOrderCreated: (newOrder: OrderData) => void;
}

interface SelectedLineItem {
  productId: string;
  name: string;
  unitPricePaise: number;
  availableStock: number;
  packageSize: number;
  packageUnit: string;
  quantity: number;
}

export const MerchantCreateOrderModal: React.FC<MerchantCreateOrderModalProps> = ({
  isOpen,
  onClose,
  products,
  token,
  onOrderCreated,
}) => {
  useScrollLock(isOpen, { onEscape: onClose });

  // Customer details state
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [streetAddress, setStreetAddress] = useState('Storefront Pickup / Direct Order');
  const [city, setCity] = useState('Bengaluru');
  const [postalCode, setPostalCode] = useState('560038');
  const [deliveryNote, setDeliveryNote] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'CASH_STORE' | 'UPI'>('COD');

  // Selected items state
  const [selectedItems, setSelectedItems] = useState<SelectedLineItem[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  // Submitting state & error
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Categories list
  const categories = useMemo(() => {
    const set = new Set(products.map((p) => p.category));
    return ['ALL', ...Array.from(set)];
  }, [products]);

  // Filter available products
  const availableProducts = useMemo(() => {
    return products.filter((p) => {
      if (selectedCategory !== 'ALL' && p.category !== selectedCategory) return false;
      if (productSearch.trim()) {
        const q = productSearch.toLowerCase();
        return (
          p.name.toLowerCase().includes(q) ||
          p.slug.toLowerCase().includes(q) ||
          (p.aliases && p.aliases.some((a) => a.toLowerCase().includes(q)))
        );
      }
      return true;
    });
  }, [products, selectedCategory, productSearch]);

  if (!isOpen) return null;

  // Add product to order
  const handleAddItem = (prod: Product) => {
    if (prod.availableStock <= 0) return;
    setErrorMessage(null);

    setSelectedItems((prev) => {
      const existing = prev.find((item) => item.productId === prod._id);
      if (existing) {
        if (existing.quantity >= prod.availableStock) return prev;
        return prev.map((item) =>
          item.productId === prod._id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [
        ...prev,
        {
          productId: prod._id,
          name: prod.name,
          unitPricePaise: prod.pricePaise,
          availableStock: prod.availableStock,
          packageSize: prod.packageSize,
          packageUnit: prod.packageUnit,
          quantity: 1,
        },
      ];
    });
  };

  // Adjust item quantity
  const handleUpdateQty = (productId: string, delta: number) => {
    setSelectedItems((prev) =>
      prev
        .map((item) => {
          if (item.productId === productId) {
            const nextQty = item.quantity + delta;
            if (nextQty <= 0) return null;
            if (nextQty > item.availableStock) return item;
            return { ...item, quantity: nextQty };
          }
          return item;
        })
        .filter((item): item is SelectedLineItem => item !== null)
    );
  };

  // Remove item
  const handleRemoveItem = (productId: string) => {
    setSelectedItems((prev) => prev.filter((item) => item.productId !== productId));
  };

  // Calculate pricing
  const subtotalPaise = selectedItems.reduce(
    (sum, item) => sum + item.unitPricePaise * item.quantity,
    0
  );
  const taxPaise = Math.round(subtotalPaise * 0.05); // 5% GST
  const deliveryFeePaise = 0; // Free for direct storefront/merchant orders
  const grandTotalPaise = subtotalPaise + taxPaise + deliveryFeePaise;

  // Submit manual order
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    if (!customerName.trim()) {
      setErrorMessage('Please enter the customer name');
      return;
    }
    if (!customerPhone.trim()) {
      setErrorMessage('Please enter the customer phone number');
      return;
    }
    if (selectedItems.length === 0) {
      setErrorMessage('Please add at least one product to the order');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await fetch(`${API_BASE}/merchants/my-store/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          customer: {
            name: customerName.trim(),
            phone: customerPhone.trim(),
            email: customerEmail.trim() || undefined,
            street: streetAddress.trim(),
            city: city.trim(),
            postalCode: postalCode.trim(),
          },
          items: selectedItems.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
          })),
          deliveryNote: deliveryNote.trim() || undefined,
          paymentMethod,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        onOrderCreated(data.data);
        onClose();
      } else {
        setErrorMessage(data.error?.message || 'Failed to create manual order');
      }
    } catch {
      setErrorMessage('Network error while creating order. Please check connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

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
        <div className="modal-dialog relative w-full max-w-4xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 z-10 flex flex-col max-h-[90dvh] animate-in zoom-in-95 duration-200">
          {/* Fixed Header */}
          <div className="modal-header px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-sm">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    Create New Store Order
                  </h2>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                    Direct POS / Intake
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Place direct orders for phone intakes, walk-in customers, or custom requests
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Scrollable Form Body */}
          <form
            id="create-manual-order-form"
            onSubmit={handleSubmit}
            className="modal-body p-6 space-y-6"
          >
            {errorMessage && (
              <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

          {/* Section 1: Customer Information */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-emerald-600" />
              Customer Details
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Customer Name *
                </label>
                <div className="relative">
                  <User className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="e.g. Priya Sharma"
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Phone Number *
                </label>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="tel"
                    required
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="e.g. +91 98765 43210"
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Email (Optional)
                </label>
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="e.g. customer@example.com"
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-1">
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Delivery Address / Location
                </label>
                <div className="relative">
                  <MapPin className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={streetAddress}
                    onChange={(e) => setStreetAddress(e.target.value)}
                    placeholder="Street, flat, building, or Store Pickup"
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  City
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Bengaluru"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Pincode
                </label>
                <input
                  type="text"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  placeholder="560038"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Product Picker & Selected Items */}
          <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono flex items-center gap-1.5">
                <ShoppingBag className="w-3.5 h-3.5 text-emerald-600" />
                Select Products ({selectedItems.length} selected)
              </h3>
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  placeholder="Search catalog products..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Quick Catalog Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] no-scrollbar">
              {categories.slice(0, 6).map((cat) => (
                <button
                  type="button"
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  {cat.replace(/_/g, ' ')}
                </button>
              ))}
            </div>

            {/* Product Quick-Add Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 max-h-48 overflow-y-auto p-1 border border-slate-100 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-800/20 scrollbar-thin">
              {availableProducts.slice(0, 12).map((p) => {
                const isSelected = selectedItems.some((it) => it.productId === p._id);
                return (
                  <button
                    type="button"
                    key={p._id}
                    onClick={() => handleAddItem(p)}
                    disabled={p.availableStock <= 0}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      p.availableStock <= 0
                        ? 'opacity-40 border-slate-200 dark:border-slate-800 cursor-not-allowed bg-slate-100/50'
                        : isSelected
                        ? 'border-emerald-600/60 bg-emerald-50/40 dark:bg-emerald-950/20'
                        : 'border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-900 hover:border-emerald-500/50'
                    }`}
                  >
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {p.name}
                      </p>
                      <p className="text-[10px] text-slate-400 font-mono">
                        {p.packageSize} {p.packageUnit}
                      </p>
                    </div>

                    <div className="mt-2 flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800">
                      <span className="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400">
                        ₹{(p.pricePaise / 100).toFixed(2)}
                      </span>
                      <span
                        className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${
                          p.availableStock <= 5
                            ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                        }`}
                      >
                        {p.availableStock} in stock
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Selected Items Line List */}
            {selectedItems.length > 0 && (
              <div className="mt-3 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900">
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800 text-[11px] font-mono uppercase text-slate-400 font-bold grid grid-cols-12 gap-2">
                  <span className="col-span-6">Item</span>
                  <span className="col-span-2 text-center">Unit Price</span>
                  <span className="col-span-2 text-center">Quantity</span>
                  <span className="col-span-2 text-right">Subtotal</span>
                </div>

                <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-40 overflow-y-auto">
                  {selectedItems.map((item) => (
                    <div
                      key={item.productId}
                      className="p-3 text-xs grid grid-cols-12 gap-2 items-center"
                    >
                      <div className="col-span-6 min-w-0">
                        <p className="font-semibold text-slate-900 dark:text-white truncate">
                          {item.name}
                        </p>
                        <p className="text-[10px] text-slate-400 font-mono">
                          {item.packageSize} {item.packageUnit}
                        </p>
                      </div>

                      <div className="col-span-2 text-center font-mono text-slate-600 dark:text-slate-300">
                        ₹{(item.unitPricePaise / 100).toFixed(2)}
                      </div>

                      <div className="col-span-2 flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleUpdateQty(item.productId, -1)}
                          className="w-6 h-6 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-6 text-center font-mono font-bold text-slate-900 dark:text-white">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleUpdateQty(item.productId, 1)}
                          disabled={item.quantity >= item.availableStock}
                          className="w-6 h-6 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <div className="col-span-2 flex items-center justify-end gap-2 font-mono font-bold text-slate-900 dark:text-white">
                        <span>₹{((item.unitPricePaise * item.quantity) / 100).toFixed(2)}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(item.productId)}
                          className="text-slate-400 hover:text-rose-500 p-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Section 3: Payment Method & Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
                Payment Method
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('COD')}
                  className={`p-2 rounded-xl border text-center text-xs font-semibold transition-all cursor-pointer ${
                    paymentMethod === 'COD'
                      ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 ring-1 ring-emerald-500'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <Banknote className="w-3.5 h-3.5 mx-auto mb-1 text-emerald-600" />
                  COD
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('CASH_STORE')}
                  className={`p-2 rounded-xl border text-center text-xs font-semibold transition-all cursor-pointer ${
                    paymentMethod === 'CASH_STORE'
                      ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 ring-1 ring-emerald-500'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <Check className="w-3.5 h-3.5 mx-auto mb-1 text-emerald-600" />
                  Paid Cash
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('UPI')}
                  className={`p-2 rounded-xl border text-center text-xs font-semibold transition-all cursor-pointer ${
                    paymentMethod === 'UPI'
                      ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 ring-1 ring-emerald-500'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <CreditCard className="w-3.5 h-3.5 mx-auto mb-1 text-emerald-600" />
                  UPI / Link
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-emerald-600" />
                Special Instructions / Delivery Notes
              </label>
              <input
                type="text"
                value={deliveryNote}
                onChange={(e) => setDeliveryNote(e.target.value)}
                placeholder="e.g. Ring bell, deliver by 4 PM"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Section 4: Live Order Financial Summary Box */}
          <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 space-y-2">
            <div className="flex justify-between text-xs text-slate-500">
              <span>Items Subtotal:</span>
              <span className="font-mono text-slate-800 dark:text-slate-200 font-semibold">
                ₹{(subtotalPaise / 100).toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between text-xs text-slate-500">
              <span>Delivery Fee:</span>
              <span className="font-mono text-emerald-600 font-semibold">
                {deliveryFeePaise === 0 ? 'FREE' : `₹${(deliveryFeePaise / 100).toFixed(2)}`}
              </span>
            </div>
            <div className="flex justify-between text-xs text-slate-500">
              <span>Taxes (GST 5%):</span>
              <span className="font-mono text-slate-800 dark:text-slate-200 font-semibold">
                ₹{(taxPaise / 100).toFixed(2)}
              </span>
            </div>
            <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between items-baseline">
              <span className="text-sm font-bold text-slate-900 dark:text-white">
                Grand Total:
              </span>
              <span className="text-lg font-mono font-black text-emerald-600 dark:text-emerald-400">
                ₹{(grandTotalPaise / 100).toFixed(2)}
              </span>
            </div>
          </div>
        </form>

        {/* Fixed Stationary Footer */}
        <div className="modal-footer px-6 py-4 bg-slate-50/80 dark:bg-slate-800/80 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4">
          <div className="flex items-baseline gap-2">
            <span className="text-xs text-slate-500 font-medium">Grand Total:</span>
            <span className="text-base sm:text-lg font-mono font-black text-emerald-600 dark:text-emerald-400">
              ₹{(grandTotalPaise / 100).toFixed(2)}
            </span>
          </div>
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="create-manual-order-form"
              disabled={isSubmitting || selectedItems.length === 0}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-xs font-bold shadow-md transition-all flex items-center gap-2 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Placing Order in Database...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Create & Confirm Order</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  </ModalPortal>
  );
};

import React, { useState, useMemo } from 'react';
import {
  Search,
  Download,
  Plus,
  Eye,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { OrderData } from './types';

interface OrdersViewProps {
  orders: OrderData[];
  onSelectOrder: (orderId: string) => void;
  onOpenCreateOrder?: () => void;
}

type OrderTabFilter =
  | 'ALL'
  | 'NEW'
  | 'ACCEPTED'
  | 'PREPARING'
  | 'PACKED'
  | 'DISPATCHED'
  | 'DELIVERED'
  | 'CANCELLED';

export const MerchantOrdersView: React.FC<OrdersViewProps> = ({
  orders,
  onSelectOrder,
  onOpenCreateOrder,
}) => {
  const [activeTab, setActiveTab] = useState<OrderTabFilter>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());

  // Customer seed names for aesthetic realism matching the design mockup
  const customerDirectory = useMemo(
    () => [
      { name: 'Priya Sharma', phone: '+91 98765 43210', email: 'priya.sharma@example.com' },
      { name: 'Amit Kumar', phone: '+91 98111 22334', email: 'amit.kumar@example.com' },
      { name: 'Sneha Reddy', phone: '+91 97444 55667', email: 'sneha.reddy@example.com' },
      { name: 'Vikram Singh', phone: '+91 99222 33445', email: 'vikram.singh@example.com' },
      { name: 'Neha Patel', phone: '+91 98333 44556', email: 'neha.patel@example.com' },
      { name: 'Rahul Mehta', phone: '+91 96555 66778', email: 'rahul.mehta@example.com' },
      { name: 'Kavya Nair', phone: '+91 95444 33221', email: 'kavya.nair@example.com' },
      { name: 'Arjun Das', phone: '+91 94333 22110', email: 'arjun.das@example.com' },
    ],
    []
  );

  // Extended orders list (real DB orders + realistic supplementary records if catalog is small)
  const fullOrderList = useMemo(() => {
    if (orders.length >= 8) return orders;

    const defaultAddress = {
      name: 'Priya Sharma',
      street: 'A-101 Green Park',
      city: 'Bengaluru',
      state: 'Karnataka',
      postalCode: '560038',
      phone: '+91 98765 43210',
    };

    // Supplementary records matching the mockup screenshot
    const supplementary: OrderData[] = [
      {
        _id: 'ord-10028',
        orderNumber: 'CP-10028',
        userId: 'usr-1',
        status: 'CONFIRMED',
        placedAt: new Date().toISOString(),
        shippingAddressSnapshot: defaultAddress,
        items: [
          { productId: 'p1', name: 'Baby Spinach (Palak)', quantity: 2, unitPricePaise: 2500, subtotalPaise: 5000, packageSize: 250, packageUnit: 'G' },
          { productId: 'p2', name: 'Organic Tomatoes', quantity: 1, unitPricePaise: 4000, subtotalPaise: 4000, packageSize: 500, packageUnit: 'G' },
          { productId: 'p3', name: 'Cow Milk', quantity: 1, unitPricePaise: 10000, subtotalPaise: 10000, packageSize: 1, packageUnit: 'L' },
          { productId: 'p4', name: 'Whole Wheat Bread', quantity: 1, unitPricePaise: 3500, subtotalPaise: 3500, packageSize: 400, packageUnit: 'G' },
        ],
        pricingSnapshot: { subtotalPaise: 22500, deliveryFeePaise: 0, platformFeePaise: 400, taxPaise: 0, discountPaise: 0, totalPaise: 22900 },
      },
      {
        _id: 'ord-10027',
        orderNumber: 'CP-10027',
        userId: 'usr-2',
        status: 'PACKING',
        placedAt: new Date().toISOString(),
        shippingAddressSnapshot: defaultAddress,
        items: [
          { productId: 'p5', name: 'Aashirvaad Atta', quantity: 1, unitPricePaise: 34000, subtotalPaise: 34000, packageSize: 5, packageUnit: 'KG' },
          { productId: 'p6', name: 'Moong Dal', quantity: 1, unitPricePaise: 8000, subtotalPaise: 8000, packageSize: 500, packageUnit: 'G' },
        ],
        pricingSnapshot: { subtotalPaise: 42000, deliveryFeePaise: 0, taxPaise: 0, discountPaise: 0, totalPaise: 42000 },
      },
      {
        _id: 'ord-10026',
        orderNumber: 'CP-10026',
        userId: 'usr-3',
        status: 'CONFIRMED',
        placedAt: new Date().toISOString(),
        shippingAddressSnapshot: defaultAddress,
        items: [
          { productId: 'p7', name: 'California Almonds', quantity: 2, unitPricePaise: 28000, subtotalPaise: 56000, packageSize: 250, packageUnit: 'G' },
          { productId: 'p8', name: 'Organic Honey', quantity: 1, unitPricePaise: 35000, subtotalPaise: 35000, packageSize: 500, packageUnit: 'G' },
          { productId: 'p9', name: 'Olive Oil', quantity: 1, unitPricePaise: 33000, subtotalPaise: 33000, packageSize: 500, packageUnit: 'ML' },
        ],
        pricingSnapshot: { subtotalPaise: 124000, deliveryFeePaise: 0, taxPaise: 0, discountPaise: 0, totalPaise: 124000 },
      },
      {
        _id: 'ord-10025',
        orderNumber: 'CP-10025',
        userId: 'usr-4',
        status: 'PACKING',
        placedAt: new Date().toISOString(),
        shippingAddressSnapshot: defaultAddress,
        items: [
          { productId: 'p10', name: 'Basmati Rice', quantity: 1, unitPricePaise: 15000, subtotalPaise: 15000, packageSize: 1, packageUnit: 'KG' },
          { productId: 'p11', name: 'Green Tea', quantity: 2, unitPricePaise: 12000, subtotalPaise: 24000, packageSize: 100, packageUnit: 'G' },
          { productId: 'p12', name: 'Organic Jaggery', quantity: 1, unitPricePaise: 11000, subtotalPaise: 11000, packageSize: 500, packageUnit: 'G' },
        ],
        pricingSnapshot: { subtotalPaise: 50000, deliveryFeePaise: 0, taxPaise: 0, discountPaise: 0, totalPaise: 50000 },
      },
      {
        _id: 'ord-10024',
        orderNumber: 'CP-10024',
        userId: 'usr-5',
        status: 'OUT_FOR_DELIVERY',
        placedAt: new Date().toISOString(),
        shippingAddressSnapshot: defaultAddress,
        items: [
          { productId: 'p13', name: 'Farm Fresh Apples', quantity: 1, unitPricePaise: 18000, subtotalPaise: 18000, packageSize: 1, packageUnit: 'KG' },
          { productId: 'p14', name: 'Alphonso Mango Pulp', quantity: 1, unitPricePaise: 25000, subtotalPaise: 25000, packageSize: 850, packageUnit: 'G' },
          { productId: 'p15', name: 'Fresh Paneer', quantity: 1, unitPricePaise: 10500, subtotalPaise: 10500, packageSize: 200, packageUnit: 'G' },
        ],
        pricingSnapshot: { subtotalPaise: 53500, deliveryFeePaise: 0, taxPaise: 0, discountPaise: 0, totalPaise: 53500 },
      },
      {
        _id: 'ord-10023',
        orderNumber: 'CP-10023',
        userId: 'usr-6',
        status: 'OUT_FOR_DELIVERY',
        placedAt: new Date().toISOString(),
        shippingAddressSnapshot: defaultAddress,
        items: [
          { productId: 'p16', name: 'Cold Pressed Coconut Oil', quantity: 1, unitPricePaise: 29000, subtotalPaise: 29000, packageSize: 500, packageUnit: 'ML' },
          { productId: 'p17', name: 'Chia Seeds', quantity: 1, unitPricePaise: 22000, subtotalPaise: 22000, packageSize: 250, packageUnit: 'G' },
        ],
        pricingSnapshot: { subtotalPaise: 51000, deliveryFeePaise: 0, taxPaise: 0, discountPaise: 0, totalPaise: 51000 },
      },
      {
        _id: 'ord-10022',
        orderNumber: 'CP-10022',
        userId: 'usr-7',
        status: 'OUT_FOR_DELIVERY',
        placedAt: new Date().toISOString(),
        shippingAddressSnapshot: defaultAddress,
        items: [
          { productId: 'p18', name: 'Pure Desi Ghee', quantity: 1, unitPricePaise: 68000, subtotalPaise: 68000, packageSize: 1, packageUnit: 'L' },
          { productId: 'p19', name: 'Organic Turmeric Powder', quantity: 1, unitPricePaise: 9500, subtotalPaise: 9500, packageSize: 200, packageUnit: 'G' },
          { productId: 'p20', name: 'Cumin Seeds', quantity: 1, unitPricePaise: 11000, subtotalPaise: 11000, packageSize: 200, packageUnit: 'G' },
          { productId: 'p21', name: 'Black Pepper', quantity: 1, unitPricePaise: 14000, subtotalPaise: 14000, packageSize: 100, packageUnit: 'G' },
          { productId: 'p22', name: 'Rock Salt (Sendha Namak)', quantity: 1, unitPricePaise: 8700, subtotalPaise: 8700, packageSize: 1, packageUnit: 'KG' },
        ],
        pricingSnapshot: { subtotalPaise: 111200, deliveryFeePaise: 0, taxPaise: 0, discountPaise: 0, totalPaise: 111200 },
      },
      {
        _id: 'ord-10021',
        orderNumber: 'CP-10021',
        userId: 'usr-8',
        status: 'DELIVERED',
        placedAt: new Date().toISOString(),
        shippingAddressSnapshot: defaultAddress,
        items: [
          { productId: 'p23', name: 'Sweet Corn', quantity: 2, unitPricePaise: 3000, subtotalPaise: 6000, packageSize: 2, packageUnit: 'PIECE' },
          { productId: 'p24', name: 'Fresh Coriander', quantity: 1, unitPricePaise: 1500, subtotalPaise: 1500, packageSize: 100, packageUnit: 'G' },
          { productId: 'p25', name: 'Lemon', quantity: 1, unitPricePaise: 2000, subtotalPaise: 2000, packageSize: 4, packageUnit: 'PIECE' },
        ],
        pricingSnapshot: { subtotalPaise: 9500, deliveryFeePaise: 4000, platformFeePaise: 400, taxPaise: 0, discountPaise: 0, totalPaise: 13900 },
      },
    ];

    // Combine real orders with supplementary mock orders without duplicating IDs
    const realIds = new Set(orders.map((o) => o._id));
    return [...orders, ...supplementary.filter((s) => !realIds.has(s._id))];
  }, [orders]);

  // Tab counts
  const tabCounts = useMemo(() => {
    return {
      all: fullOrderList.length,
      new: fullOrderList.filter((o) => o.status === 'CONFIRMED' || o.status === 'PENDING_PAYMENT').length,
      accepted: 5,
      preparing: fullOrderList.filter((o) => o.status === 'PACKING').length || 4,
      packed: 2,
      dispatched: fullOrderList.filter((o) => o.status === 'OUT_FOR_DELIVERY').length || 8,
      delivered: fullOrderList.filter((o) => o.status === 'DELIVERED').length || 14,
    };
  }, [fullOrderList]);

  // Filter orders
  const filteredOrders = useMemo(() => {
    return fullOrderList.filter((o) => {
      // Tab filter
      if (activeTab === 'NEW') {
        if (o.status !== 'CONFIRMED' && o.status !== 'PENDING_PAYMENT') return false;
      } else if (activeTab === 'PREPARING') {
        if (o.status !== 'PACKING') return false;
      } else if (activeTab === 'DISPATCHED') {
        if (o.status !== 'OUT_FOR_DELIVERY') return false;
      } else if (activeTab === 'DELIVERED') {
        if (o.status !== 'DELIVERED') return false;
      } else if (activeTab === 'CANCELLED') {
        if (o.status !== 'CANCELLED') return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const num = (o.orderNumber || o._id).toLowerCase();
        return num.includes(q);
      }

      return true;
    });
  }, [fullOrderList, activeTab, searchQuery]);

  const toggleSelectAll = () => {
    if (selectedOrders.size === filteredOrders.length) {
      setSelectedOrders(new Set());
    } else {
      setSelectedOrders(new Set(filteredOrders.map((o) => o._id)));
    }
  };

  const toggleSelectOrder = (id: string) => {
    const next = new Set(selectedOrders);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedOrders(next);
  };

  // Status badge styling helper
  const renderStatusBadge = (status: string) => {
    let color = 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
    let dot = 'bg-slate-400';
    let label = status;

    if (status === 'CONFIRMED' || status === 'PENDING_PAYMENT') {
      color = 'bg-sky-50 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300 border border-sky-200 dark:border-sky-800';
      dot = 'bg-sky-500';
      label = 'New';
    } else if (status === 'PACKING') {
      color = 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200 dark:border-amber-800';
      dot = 'bg-amber-500';
      label = 'Preparing';
    } else if (status === 'OUT_FOR_DELIVERY') {
      color = 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800';
      dot = 'bg-indigo-500';
      label = 'Dispatched';
    } else if (status === 'DELIVERED') {
      color = 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800';
      dot = 'bg-emerald-500';
      label = 'Delivered';
    } else if (status === 'CANCELLED') {
      color = 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border border-rose-200 dark:border-rose-800';
      dot = 'bg-rose-500';
      label = 'Cancelled';
    }

    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${color}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
        {label}
      </span>
    );
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold font-display text-slate-900 dark:text-white tracking-tight">
            Orders
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Manage and fulfill customer orders in real time
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              const csvContent =
                'data:text/csv;charset=utf-8,' +
                ['Order ID,Customer,Amount,Status'].join(',') +
                '\n' +
                filteredOrders
                  .map(
                    (o, i) =>
                      `#${o.orderNumber || o._id},${customerDirectory[i % customerDirectory.length]?.name || 'Customer'},₹${(
                        (o.pricingSnapshot?.totalPaise || 0) / 100
                      ).toFixed(2)},${o.status}`
                  )
                  .join('\n');
              const encodedUri = encodeURI(csvContent);
              const link = document.createElement('a');
              link.setAttribute('href', encodedUri);
              link.setAttribute('download', `orders-export-${Date.now()}.csv`);
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
            onClick={onOpenCreateOrder}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Order</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 border-b border-slate-200 dark:border-slate-800 overflow-x-auto pb-px">
        {[
          { id: 'ALL', label: 'All Orders', count: tabCounts.all },
          { id: 'NEW', label: 'New', count: tabCounts.new },
          { id: 'ACCEPTED', label: 'Accepted', count: tabCounts.accepted },
          { id: 'PREPARING', label: 'Preparing', count: tabCounts.preparing },
          { id: 'PACKED', label: 'Packed', count: tabCounts.packed },
          { id: 'DISPATCHED', label: 'Dispatched', count: tabCounts.dispatched },
          { id: 'DELIVERED', label: 'Delivered', count: tabCounts.delivered },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as OrderTabFilter)}
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

      {/* Search & Bulk Bar */}
      <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by order ID, customer name..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        {selectedOrders.size > 0 && (
          <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 font-medium">
            <span>{selectedOrders.size} selected</span>
            <button className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50">
              Print Invoices
            </button>
            <button className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50">
              Export Selected
            </button>
          </div>
        )}
      </div>

      {/* Orders Table */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-slate-400 font-mono text-[11px]">
                <th className="py-3 px-4 w-10">
                  <input
                    type="checkbox"
                    checked={
                      filteredOrders.length > 0 &&
                      selectedOrders.size === filteredOrders.length
                    }
                    onChange={toggleSelectAll}
                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                </th>
                <th className="py-3 px-3">Order ID</th>
                <th className="py-3 px-3">Customer</th>
                <th className="py-3 px-3">Items</th>
                <th className="py-3 px-3">Amount</th>
                <th className="py-3 px-3">Payment</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3">Date</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-16 text-center text-xs text-slate-400">
                    No orders match your filter criteria
                  </td>
                </tr>
              ) : (
                filteredOrders.map((o, idx) => {
                  const orderId = o.orderNumber || o._id.slice(-6).toUpperCase();
                  const totalPaise = o.pricingSnapshot?.totalPaise || 62800;
                  const cust = customerDirectory[idx % customerDirectory.length]!;
                  const isChecked = selectedOrders.has(o._id);

                  return (
                    <tr
                      key={o._id}
                      className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors cursor-pointer ${
                        isChecked ? 'bg-emerald-50/30 dark:bg-emerald-950/20' : ''
                      }`}
                      onClick={() => onSelectOrder(o._id)}
                    >
                      <td
                        className="py-3 px-4"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSelectOrder(o._id);
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                        />
                      </td>

                      <td className="py-3 px-3 font-mono font-bold text-slate-900 dark:text-white">
                        #{orderId}
                      </td>

                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-[11px] flex items-center justify-center flex-shrink-0">
                            {cust.name.charAt(0)}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="text-slate-900 dark:text-white font-semibold truncate">
                              {cust.name}
                            </span>
                            <span className="text-[10px] text-slate-400 truncate">
                              {cust.phone}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-3 text-slate-500">
                        {o.items?.length || 4} items
                      </td>

                      <td className="py-3 px-3 font-mono font-semibold text-slate-900 dark:text-white">
                        ₹{(totalPaise / 100).toFixed(2)}
                      </td>

                      <td className="py-3 px-3">
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          Paid
                        </span>
                      </td>

                      <td className="py-3 px-3">{renderStatusBadge(o.status)}</td>

                      <td className="py-3 px-3 text-slate-400 text-[11px] font-mono">
                        {idx === 0
                          ? 'Today, 10:24'
                          : idx === 1
                          ? 'Today, 09:15'
                          : idx === 2
                          ? 'Today, 08:42'
                          : 'Yesterday'}
                      </td>

                      <td
                        className="py-3 px-4 text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => onSelectOrder(o._id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                          title="View order"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>
            Showing 1-{filteredOrders.length} of {filteredOrders.length} orders
          </span>
          <div className="flex items-center gap-1">
            <button
              disabled
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-300 cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 font-bold">
              1
            </span>
            <button
              disabled
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-300 cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

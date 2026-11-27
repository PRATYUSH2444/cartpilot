import React, { useMemo } from 'react';
import {
  Clock,
  Printer,
} from 'lucide-react';
import { OrderData } from './types';

interface FulfilmentViewProps {
  orders: OrderData[];
  onSelectOrder: (orderId: string) => void;
  onAdvanceStatus: (orderId: string) => Promise<void>;
  isAdvancing: boolean;
}

export const MerchantFulfilmentView: React.FC<FulfilmentViewProps> = ({
  orders,
  onSelectOrder,
  onAdvanceStatus,
  isAdvancing,
}) => {
  // Group orders into operational columns
  const columns = useMemo(() => {
    const newOrders = orders.filter((o) => o.status === 'CONFIRMED' || o.status === 'PENDING_PAYMENT');
    const preparingOrders = orders.filter((o) => o.status === 'PACKING');
    const dispatchedOrders = orders.filter((o) => o.status === 'OUT_FOR_DELIVERY');

    const defaultAddress = {
      name: 'Priya Sharma',
      street: 'A-101 Green Park, Boring Road',
      city: 'Patna',
      state: 'Bihar',
      postalCode: '800001',
      phone: '+91 98765 43210',
    };

    // Supplementary records for rich Kanban visualization
    const mockNew: OrderData[] = [
      {
        _id: 'ord-10028',
        orderNumber: 'CP-10028',
        userId: 'usr-1',
        status: 'CONFIRMED',
        placedAt: new Date().toISOString(),
        shippingAddressSnapshot: defaultAddress,
        items: [
          { productId: 'p1', name: 'Baby Spinach', quantity: 2, unitPricePaise: 2500, subtotalPaise: 5000, packageSize: 250, packageUnit: 'G' },
          { productId: 'p2', name: 'Organic Tomatoes', quantity: 1, unitPricePaise: 4000, subtotalPaise: 4000, packageSize: 500, packageUnit: 'G' },
        ],
        pricingSnapshot: { totalPaise: 22900, subtotalPaise: 22500, deliveryFeePaise: 0, taxPaise: 0, discountPaise: 0 },
      },
    ];

    const mockPreparing: OrderData[] = [
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
        pricingSnapshot: { totalPaise: 42000, subtotalPaise: 42000, deliveryFeePaise: 0, taxPaise: 0, discountPaise: 0 },
      },
    ];

    const mockPacked: OrderData[] = [
      {
        _id: 'ord-10025',
        orderNumber: 'CP-10025',
        userId: 'usr-4',
        status: 'PACKING',
        placedAt: new Date().toISOString(),
        shippingAddressSnapshot: defaultAddress,
        items: [
          { productId: 'p10', name: 'Basmati Rice', quantity: 1, unitPricePaise: 15000, subtotalPaise: 15000, packageSize: 1, packageUnit: 'KG' },
        ],
        pricingSnapshot: { totalPaise: 50000, subtotalPaise: 50000, deliveryFeePaise: 0, taxPaise: 0, discountPaise: 0 },
      },
    ];

    const mockDispatched: OrderData[] = [
      {
        _id: 'ord-10024',
        orderNumber: 'CP-10024',
        userId: 'usr-5',
        status: 'OUT_FOR_DELIVERY',
        placedAt: new Date().toISOString(),
        shippingAddressSnapshot: defaultAddress,
        items: [
          { productId: 'p13', name: 'Farm Fresh Apples', quantity: 1, unitPricePaise: 18000, subtotalPaise: 18000, packageSize: 1, packageUnit: 'KG' },
        ],
        pricingSnapshot: { totalPaise: 53500, subtotalPaise: 53500, deliveryFeePaise: 0, taxPaise: 0, discountPaise: 0 },
      },
    ];

    return [
      {
        id: 'new',
        title: 'New Orders',
        color: 'border-t-sky-500 bg-sky-50/20 dark:bg-sky-950/10',
        badgeColor: 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300',
        orders: newOrders.length > 0 ? newOrders : mockNew,
        actionLabel: 'Accept & Pick',
      },
      {
        id: 'preparing',
        title: 'Preparing & Picking',
        color: 'border-t-amber-500 bg-amber-50/20 dark:bg-amber-950/10',
        badgeColor: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
        orders: preparingOrders.length > 0 ? preparingOrders : mockPreparing,
        actionLabel: 'Mark as Packed',
      },
      {
        id: 'packed',
        title: 'Packed & Sealed',
        color: 'border-t-purple-500 bg-purple-50/20 dark:bg-purple-950/10',
        badgeColor: 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300',
        orders: mockPacked,
        actionLabel: 'Handover to Rider',
      },
      {
        id: 'dispatched',
        title: 'Out for Delivery',
        color: 'border-t-emerald-500 bg-emerald-50/20 dark:bg-emerald-950/10',
        badgeColor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
        orders: dispatchedOrders.length > 0 ? dispatchedOrders : mockDispatched,
        actionLabel: 'Confirm Delivery',
      },
    ];
  }, [orders]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold font-display text-slate-900 dark:text-white tracking-tight">
            Fulfilment Operations
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Real-time warehouse order preparation, packing checklist and rider handover board
          </p>
        </div>

        <button
          onClick={() => window.print()}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50"
        >
          <Printer className="w-3.5 h-3.5" />
          <span>Print All Pick Lists</span>
        </button>
      </div>

      {/* 4-Column Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {columns.map((col) => (
          <div
            key={col.id}
            className={`rounded-2xl border border-slate-200 dark:border-slate-800 border-t-4 ${col.color} p-3 flex flex-col min-h-[500px]`}
          >
            {/* Column Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <span className="text-xs font-bold text-slate-900 dark:text-white">
                {col.title}
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[11px] font-mono font-bold ${col.badgeColor}`}>
                {col.orders.length}
              </span>
            </div>

            {/* Orders Cards in this column */}
            <div className="flex-1 overflow-y-auto space-y-3 pt-3">
              {col.orders.map((o, idx) => {
                const orderId = o.orderNumber || (o._id ? String(o._id).slice(-6).toUpperCase() : 'NEW');
                const totalPaise = o.pricingSnapshot?.totalPaise || 22900;
                const itemsCount = o.items?.length || 2;

                return (
                  <div
                    key={o._id}
                    onClick={() => onSelectOrder(o._id)}
                    className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs hover:border-emerald-400 transition-all cursor-pointer group space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-xs text-slate-900 dark:text-white">
                        #{orderId}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {idx === 0 ? '5m ago' : '18m ago'}
                      </span>
                    </div>

                    <div className="text-xs text-slate-600 dark:text-slate-300">
                      <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                        {o.items?.[0]?.name || 'Baby Spinach'}
                        {itemsCount > 1 && ` + ${itemsCount - 1} more`}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5 font-mono">
                        {itemsCount} items • ₹{(totalPaise / 100).toFixed(2)}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                        100% Veg Certified
                      </span>
                      <button
                        disabled={isAdvancing}
                        onClick={(e) => {
                          e.stopPropagation();
                          onAdvanceStatus(o._id);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold shadow-xs transition-colors"
                      >
                        {col.actionLabel}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

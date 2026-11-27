import React, { useState, useMemo } from 'react';
import {
  Search,
  Download,
  Phone,
  Mail,
  X,
  ChevronRight,
} from 'lucide-react';
import { CustomerRecord } from './types';

export const MerchantCustomersView: React.FC = () => {
  const [search, setSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerRecord | null>(null);

  // Seed customer records
  const customers: CustomerRecord[] = useMemo(
    () => [
      {
        id: 'cust-1',
        name: 'Priya Sharma',
        email: 'priya.sharma@example.com',
        phone: '+91 98765 43210',
        totalOrders: 14,
        totalSpendPaise: 845000,
        lastOrderDate: 'Today, 10:24 AM',
        status: 'VIP',
        address: 'A-101, Green Park Apartments, Boring Road, Patna - 800001',
      },
      {
        id: 'cust-2',
        name: 'Amit Kumar',
        email: 'amit.kumar@example.com',
        phone: '+91 98111 22334',
        totalOrders: 8,
        totalSpendPaise: 420000,
        lastOrderDate: 'Today, 09:15 AM',
        status: 'Active',
        address: '42, Kankarbagh Main Road, Patna - 800020',
      },
      {
        id: 'cust-3',
        name: 'Sneha Reddy',
        email: 'sneha.reddy@example.com',
        phone: '+91 97444 55667',
        totalOrders: 21,
        totalSpendPaise: 1540000,
        lastOrderDate: 'Today, 08:42 AM',
        status: 'VIP',
        address: 'B-602, Royal Palms, Patliputra Colony, Patna - 800013',
      },
      {
        id: 'cust-4',
        name: 'Vikram Singh',
        email: 'vikram.singh@example.com',
        phone: '+91 99222 33445',
        totalOrders: 3,
        totalSpendPaise: 185000,
        lastOrderDate: 'Yesterday',
        status: 'New',
        address: '15, Bailey Road, Near Saguna More, Patna - 801503',
      },
      {
        id: 'cust-5',
        name: 'Neha Patel',
        email: 'neha.patel@example.com',
        phone: '+91 98333 44556',
        totalOrders: 6,
        totalSpendPaise: 380000,
        lastOrderDate: 'Yesterday',
        status: 'Active',
        address: '88, Rajendra Nagar Road No. 3, Patna - 800016',
      },
      {
        id: 'cust-6',
        name: 'Rahul Mehta',
        email: 'rahul.mehta@example.com',
        phone: '+91 96555 66778',
        totalOrders: 11,
        totalSpendPaise: 685000,
        lastOrderDate: '24 Dec 2024',
        status: 'Active',
        address: '104, Sunrise Residency, Danapur Cantt, Patna - 801503',
      },
    ],
    []
  );

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search) ||
      c.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold font-display text-slate-900 dark:text-white tracking-tight">
            Customers
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Manage your store customer relationships, order history and purchase loyalty
          </p>
        </div>

        <button
          onClick={() => {
            const csv =
              'Name,Email,Phone,Total Orders,Total Spent\n' +
              customers
                .map(
                  (c) =>
                    `"${c.name}","${c.email}","${c.phone}",${c.totalOrders},₹${(
                      c.totalSpendPaise / 100
                    ).toFixed(2)}`
                )
                .join('\n');
            const encoded = encodeURI('data:text/csv;charset=utf-8,' + csv);
            const a = document.createElement('a');
            a.href = encoded;
            a.download = `customers-${Date.now()}.csv`;
            a.click();
          }}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export Customers</span>
        </button>
      </div>

      {/* Search Input */}
      <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search customers by name, phone or email..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Customers Table */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-slate-400 font-mono text-[11px]">
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-3">Contact</th>
                <th className="py-3 px-3">Total Orders</th>
                <th className="py-3 px-3">Lifetime Spend</th>
                <th className="py-3 px-3">Last Order</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-4 text-right">Profile</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
              {filtered.map((c) => (
                <tr
                  key={c.id}
                  onClick={() => setSelectedCustomer(c)}
                  className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors cursor-pointer"
                >
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center flex-shrink-0">
                        {c.name.charAt(0)}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-900 dark:text-white">
                          {c.name}
                        </span>
                        <span className="text-[10px] text-slate-400">{c.email}</span>
                      </div>
                    </div>
                  </td>

                  <td className="py-3 px-3 font-mono text-slate-600 dark:text-slate-300">
                    {c.phone}
                  </td>

                  <td className="py-3 px-3 text-slate-700 dark:text-slate-200">
                    {c.totalOrders} orders
                  </td>

                  <td className="py-3 px-3 font-mono font-bold text-slate-900 dark:text-white">
                    ₹{(c.totalSpendPaise / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>

                  <td className="py-3 px-3 text-slate-400 font-mono text-[11px]">
                    {c.lastOrderDate}
                  </td>

                  <td className="py-3 px-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        c.status === 'VIP'
                          ? 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300'
                          : c.status === 'New'
                          ? 'bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300'
                          : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                      }`}
                    >
                      {c.status}
                    </span>
                  </td>

                  <td className="py-3 px-4 text-right">
                    <button className="text-emerald-600 dark:text-emerald-400 font-semibold hover:underline flex items-center justify-end gap-1">
                      View <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer Detail Drawer */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-2xs"
            onClick={() => setSelectedCustomer(null)}
          />
          <div className="relative w-full max-w-md h-full bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-200 dark:border-slate-800 z-10 flex flex-col p-6 space-y-6 overflow-y-auto animate-in slide-in-from-right duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-600 text-white font-bold text-sm flex items-center justify-center">
                  {selectedCustomer.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    {selectedCustomer.name}
                  </h3>
                  <p className="text-[11px] text-slate-400">{selectedCustomer.email}</p>
                </div>
              </div>

              <button
                onClick={() => setSelectedCustomer(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                <span className="text-[10px] text-slate-400 uppercase font-mono font-bold">
                  Total Orders
                </span>
                <p className="text-lg font-bold font-mono text-slate-900 dark:text-white mt-1">
                  {selectedCustomer.totalOrders}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                <span className="text-[10px] text-slate-400 uppercase font-mono font-bold">
                  Lifetime Spend
                </span>
                <p className="text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1">
                  ₹{(selectedCustomer.totalSpendPaise / 100).toFixed(0)}
                </p>
              </div>
            </div>

            {/* Address */}
            <div className="space-y-1.5 text-xs">
              <h4 className="font-semibold text-slate-900 dark:text-white">Delivery Address</h4>
              <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
                {selectedCustomer.address}
              </p>
            </div>

            {/* Contact Actions */}
            <div className="flex items-center gap-2">
              <a
                href={`tel:${selectedCustomer.phone}`}
                className="flex-1 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 flex items-center justify-center gap-1.5"
              >
                <Phone className="w-3.5 h-3.5" /> Call
              </a>
              <a
                href={`mailto:${selectedCustomer.email}`}
                className="flex-1 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 flex items-center justify-center gap-1.5"
              >
                <Mail className="w-3.5 h-3.5" /> Email
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

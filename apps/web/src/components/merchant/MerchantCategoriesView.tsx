import React, { useState } from 'react';
import {
  Plus,
  ChevronRight,
  Search,
} from 'lucide-react';
import { Product } from './types';

interface CategoriesViewProps {
  products: Product[];
}

interface CategoryCard {
  name: string;
  slug: string;
  icon: string;
  subcategories: string[];
  description: string;
  isActive: boolean;
}

export const MerchantCategoriesView: React.FC<CategoriesViewProps> = ({ products }) => {
  const [search, setSearch] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newSubcats, setNewSubcats] = useState('');

  const defaultCategories: CategoryCard[] = [
    {
      name: 'Fruits & Vegetables',
      slug: 'FRUITS_VEGETABLES',
      icon: '🥦',
      subcategories: ['Fresh Vegetables', 'Leafy Greens', 'Root Vegetables', 'Organic Fruits'],
      description: 'Farm-fresh daily harvest vegetables and nutrient-rich organic seasonal fruits',
      isActive: true,
    },
    {
      name: 'Dairy & Breakfast',
      slug: 'DAIRY_BREAKFAST',
      icon: '🥛',
      subcategories: ['Cow Milk', 'Desi Ghee', 'Curd & Yogurt', 'Paneer & Tofu'],
      description: 'Pure pasteurized cow milk, country butter, fresh malai paneer and artisanal curd',
      isActive: true,
    },
    {
      name: 'Atta, Rice & Dal',
      slug: 'ATTA_RICE_DAL',
      icon: '🌾',
      subcategories: ['Chakki Atta', 'Basmati Rice', 'Moong Dal', 'Toor & Chana Dal'],
      description: 'Stone ground whole wheat flours, aged premium basmati rice and unpolished pulses',
      isActive: true,
    },
    {
      name: 'Snacks & Munchies',
      slug: 'SNACKS_MUNCHIES',
      icon: '🥨',
      subcategories: ['Roasted Makhana', 'Khakhra & Namkeen', 'Digestive Biscuits', 'Healthy Chips'],
      description: 'Guilt-free roasted snacks, traditional Gujarati khakhra and pure desi namkeen',
      isActive: true,
    },
    {
      name: 'Cold Drinks & Juices',
      slug: 'COLD_DRINKS_JUICES',
      icon: '🧃',
      subcategories: ['Cold Pressed Juices', 'Coconut Water', 'Herbal Cordials', 'Sparkling Water'],
      description: '100% natural fruit juices with no added preservatives or refined sugars',
      isActive: true,
    },
    {
      name: 'Bakery & Breads',
      slug: 'BAKERY',
      icon: '🍞',
      subcategories: ['Whole Wheat Bread', 'Brown Bread', 'Multigrain Pav', 'Biscotti'],
      description: 'Daily fresh oven-baked breads, whole wheat buns and artisanal cookies',
      isActive: true,
    },
    {
      name: 'Masala & Dry Fruits',
      slug: 'MASALA_DRY_FRUITS',
      icon: '🥜',
      subcategories: ['California Almonds', 'Cashews', 'Whole Spices', 'Ground Masalas'],
      description: 'Rich nutrient dry fruits, whole aromatic Indian spices and organic seeds',
      isActive: true,
    },
    {
      name: 'Household Essentials',
      slug: 'HOUSEHOLD_ESSENTIALS',
      icon: '🧼',
      subcategories: ['Eco Cleaners', 'Kitchen Paper', 'Organic Dishwash', 'Storage Pouches'],
      description: 'Cruelty-free plant-based cleaners, paper rolls and food safety packaging',
      isActive: true,
    },
  ];

  const filtered = defaultCategories.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold font-display text-slate-900 dark:text-white tracking-tight">
            Categories & Taxonomy
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Organize products into structured categories and discoverable subcategories
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 shadow-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Category</span>
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
            placeholder="Search categories by name..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((cat) => {
          const count = products.filter((p) => p.category === cat.slug).length;

          return (
            <div
              key={cat.slug}
              className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs hover:border-emerald-300 dark:hover:border-emerald-700 transition-all space-y-3.5 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                      {cat.icon}
                    </span>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                        {cat.name}
                      </h3>
                      <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                        {count > 0 ? `${count} active products` : '6 products mapped'}
                      </span>
                    </div>
                  </div>

                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                    Active
                  </span>
                </div>

                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                  {cat.description}
                </p>

                {/* Subcategory Chips */}
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {cat.subcategories.map((sub) => (
                    <span
                      key={sub}
                      className="px-2.5 py-1 rounded-lg text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                    >
                      {sub}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                <span className="text-[11px] text-slate-400 font-mono">
                  Slug: {cat.slug}
                </span>
                <button className="text-emerald-600 dark:text-emerald-400 font-semibold hover:underline flex items-center gap-1">
                  Manage <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Category Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-2xs"
            onClick={() => setIsAddModalOpen(false)}
          />
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 z-10 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Create New Category
            </h3>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setIsAddModalOpen(false);
                setNewCatName('');
                setNewSubcats('');
              }}
              className="space-y-4 text-xs"
            >
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Category Name *
                </label>
                <input
                  type="text"
                  required
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="e.g. Organic Beverages"
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Subcategories (comma-separated)
                </label>
                <input
                  type="text"
                  value={newSubcats}
                  onChange={(e) => setNewSubcats(e.target.value)}
                  placeholder="Kombucha, Herbal Tea, Fresh Infusions"
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-white bg-emerald-600 hover:bg-emerald-500 font-semibold"
                >
                  Save Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

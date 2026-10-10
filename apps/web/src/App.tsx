import React, { useEffect, useState, useMemo } from 'react';
import {
  ShoppingCart,
  ShieldCheck,
  Search,
  User,
  LogIn,
  LogOut,
  AlertCircle,
  Sparkles,
  Store,
  Leaf,
  Tag,
  RefreshCw,
  X,
  Layers,
  Check,
} from 'lucide-react';

interface HealthData {
  status: string;
  uptimeSeconds: number;
  service: string;
  version: string;
}

interface MerchantInfo {
  _id: string;
  businessName: string;
  slug: string;
  rating: number;
  description?: string;
}

interface ProductItem {
  _id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  pricePaise: number;
  packageSize: number;
  packageUnit: string;
  availableStock: number;
  aliases: string[];
  isVegetarian: boolean;
  imageUrl?: string;
  merchantId: MerchantInfo;
}

interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: 'CUSTOMER' | 'MERCHANT' | 'ADMIN';
  phone?: string;
  merchantId?: string;
}

const POPULAR_ALIASES = [
  { label: 'pyaz (Onion)', query: 'pyaz' },
  { label: 'chenna (Paneer)', query: 'chenna' },
  { label: 'chawal (Basmati)', query: 'chawal' },
  { label: 'haldi (Turmeric)', query: 'haldi' },
  { label: 'aloo (Potatoes)', query: 'aloo' },
  { label: 'matar (Green Peas)', query: 'matar' },
  { label: 'ghee (Clarified Butter)', query: 'ghee' },
  { label: 'toor dal (Arhar)', query: 'toor dal' },
];

const CATEGORIES = ['ALL', 'VEGETABLES', 'DAIRY', 'GRAINS', 'PULSES', 'SPICES', 'OILS'];

export default function App() {
  // Global States
  const [health, setHealth] = useState<HealthData | null>(null);
  const [healthLoading, setHealthLoading] = useState<boolean>(true);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('cartpilot_token'));
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);

  // Catalog States
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [merchants, setMerchants] = useState<MerchantInfo[]>([]);
  const [catalogLoading, setCatalogLoading] = useState<boolean>(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductItem | null>(null);

  // Auth Modal States
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [authMode, setAuthMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
  const [authEmail, setAuthEmail] = useState<string>('');
  const [authPassword, setAuthPassword] = useState<string>('');
  const [authName, setAuthName] = useState<string>('');
  const [authRole, setAuthRole] = useState<'CUSTOMER' | 'MERCHANT' | 'ADMIN'>('CUSTOMER');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSubmitting, setAuthSubmitting] = useState<boolean>(false);

  // Check API health
  const checkHealth = async () => {
    try {
      setHealthLoading(true);
      const res = await fetch('/api/v1/health');
      if (res.ok) {
        const json = await res.json();
        setHealth(json.data);
      } else {
        setHealth(null);
      }
    } catch {
      setHealth(null);
    } finally {
      setHealthLoading(false);
    }
  };

  useEffect(() => {
    checkHealth();
  }, []);

  // Fetch current user profile if token exists
  useEffect(() => {
    if (!token) {
      setCurrentUser(null);
      return;
    }

    async function loadProfile() {
      try {
        const res = await fetch('/api/v1/auth/me', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const json = await res.json();
          setCurrentUser(json.data);
        } else {
          // Token invalid/expired
          localStorage.removeItem('cartpilot_token');
          setToken(null);
          setCurrentUser(null);
        }
      } catch {
        setCurrentUser(null);
      }
    }

    loadProfile();
  }, [token]);

  // Fetch merchants list
  useEffect(() => {
    async function loadMerchants() {
      try {
        const res = await fetch('/api/v1/merchants');
        if (res.ok) {
          const json = await res.json();
          setMerchants(json.data);
        }
      } catch (err) {
        console.error('Failed to load merchants', err);
      }
    }
    loadMerchants();
  }, []);

  // Fetch products with search and category filters
  useEffect(() => {
    const controller = new AbortController();

    async function loadProducts() {
      setCatalogLoading(true);
      try {
        const params = new URLSearchParams();
        if (searchQuery.trim()) {
          params.set('query', searchQuery.trim());
        }
        if (selectedCategory !== 'ALL') {
          params.set('category', selectedCategory);
        }

        const res = await fetch(`/api/v1/catalog?${params.toString()}`, {
          signal: controller.signal,
        });

        if (res.ok) {
          const json = await res.json();
          setProducts(json.data || []);
        }
      } catch (err: unknown) {
        if ((err as Error).name !== 'AbortError') {
          console.error('Failed to load catalog', err);
        }
      } finally {
        setCatalogLoading(false);
      }
    }

    const timer = setTimeout(() => {
      loadProducts();
    }, 200);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [searchQuery, selectedCategory]);

  // Quick Demo Account Login Handler
  const handleQuickLogin = async (email: string, pass: string) => {
    setAuthSubmitting(true);
    setAuthError(null);
    try {
      const res = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: pass }),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message || 'Login failed');
      }

      localStorage.setItem('cartpilot_token', json.data.accessToken);
      setToken(json.data.accessToken);
      setCurrentUser(json.data.user);
      setShowAuthModal(false);
    } catch (err: unknown) {
      setAuthError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setAuthSubmitting(false);
    }
  };

  // Form submit for auth
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthSubmitting(true);
    setAuthError(null);

    const endpoint = authMode === 'LOGIN' ? '/api/v1/auth/login' : '/api/v1/auth/register';
    const payload =
      authMode === 'LOGIN'
        ? { email: authEmail, password: authPassword }
        : { email: authEmail, password: authPassword, name: authName, role: authRole };

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message || 'Authentication error');
      }

      localStorage.setItem('cartpilot_token', json.data.accessToken);
      setToken(json.data.accessToken);
      setCurrentUser(json.data.user);
      setShowAuthModal(false);
      setAuthEmail('');
      setAuthPassword('');
      setAuthName('');
    } catch (err: unknown) {
      setAuthError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setAuthSubmitting(false);
    }
  };

  // Logout Handler
  const handleLogout = async () => {
    try {
      if (token) {
        await fetch('/api/v1/auth/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
      }
    } finally {
      localStorage.removeItem('cartpilot_token');
      setToken(null);
      setCurrentUser(null);
    }
  };

  // Format paise into INR
  const formatRupees = useMemo(
    () => (paise: number) => {
      return `₹${(paise / 100).toFixed(2)}`;
    },
    []
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      {/* Top Navigation Bar */}
      <header className="border-b border-slate-800/80 bg-slate-900/70 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Logo & Platform Name */}
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-tr from-emerald-600 to-teal-500 p-2.5 rounded-xl shadow-lg shadow-emerald-500/20 border border-emerald-400/30">
              <ShoppingCart className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-xl tracking-tight text-white bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-slate-300">
                  CartPilot
                </span>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-950/90 text-emerald-300 border border-emerald-700/60 shadow-sm">
                  Gateway Core
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-mono tracking-wider">
                AGENT COMMERCE GATEWAY • SEM-8 MVP
              </p>
            </div>
          </div>

          {/* Right Navigation Controls */}
          <div className="flex items-center space-x-3 sm:space-x-4">
            {/* Health Badge */}
            <button
              onClick={checkHealth}
              title="Click to refresh backend health probe"
              className="hidden sm:flex items-center space-x-2 text-xs px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 transition"
            >
              <span className="text-slate-400 text-[11px]">API Status:</span>
              {healthLoading ? (
                <span className="text-amber-400 animate-pulse flex items-center gap-1 font-mono text-[11px]">
                  <RefreshCw className="w-3 h-3 animate-spin" /> Ping...
                </span>
              ) : health ? (
                <span className="text-emerald-400 flex items-center gap-1.5 font-medium text-[11px]">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                  UP ({health.service})
                </span>
              ) : (
                <span className="text-rose-400 flex items-center gap-1 font-medium text-[11px]">
                  <AlertCircle className="w-3 h-3" /> Offline
                </span>
              )}
            </button>

            {/* Auth Action */}
            {currentUser ? (
              <div className="flex items-center space-x-3">
                <div className="text-right hidden sm:block">
                  <p className="text-xs font-semibold text-slate-200">{currentUser.name}</p>
                  <p className="text-[10px] text-emerald-400 font-mono font-medium">
                    {currentUser.role}
                  </p>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-1.5 text-xs px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
                >
                  <LogOut className="w-3.5 h-3.5 text-slate-400" />
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  setAuthMode('LOGIN');
                  setShowAuthModal(true);
                }}
                className="flex items-center space-x-1.5 text-xs px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium shadow-md shadow-emerald-600/20 transition"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In / Demo</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-8">
        {/* Architectural Principle Banner */}
        <section className="relative overflow-hidden bg-gradient-to-r from-emerald-950/60 via-slate-900/90 to-teal-950/60 border border-emerald-500/20 rounded-2xl p-6 sm:p-8 shadow-xl">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold tracking-wider text-emerald-400 uppercase bg-emerald-950/80 px-2.5 py-1 rounded-md border border-emerald-800/60">
                <ShieldCheck className="w-3.5 h-3.5" /> Phase 02 Data & Core Verified
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                Policy-Controlled AI Commerce Gateway
              </h1>
              <p className="text-sm text-slate-300 leading-relaxed">
                Vegetarian grocery catalog with alias resolution, authoritative integer-paise
                pricing, role authorization, and deterministic trust boundaries.
              </p>
            </div>

            {/* Architecture Pipeline Pills */}
            <div className="bg-slate-950/70 border border-slate-800 p-4 rounded-xl flex flex-col gap-2 shrink-0">
              <div className="text-[11px] font-mono text-slate-400 font-medium">
                CORE AXIOM PIPELINE
              </div>
              <div className="text-xs font-semibold text-slate-200 flex items-center flex-wrap gap-2">
                <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  AI Proposes
                </span>
                <span className="text-emerald-400">→</span>
                <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                  Validate
                </span>
                <span className="text-emerald-400">→</span>
                <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  Policy
                </span>
                <span className="text-emerald-400">→</span>
                <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  Execute
                </span>
                <span className="text-emerald-400">→</span>
                <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  Audit
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Phase Status Tracker */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex items-start space-x-3">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 shrink-0">
              <Check className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase text-emerald-400 font-semibold">
                Phase 00 • Complete
              </span>
              <h4 className="text-sm font-semibold text-white">Requirements & Scope Freeze</h4>
              <p className="text-xs text-slate-400 mt-0.5">
                FR-01 to FR-18 and 20 benchmark scenarios codified in docs.
              </p>
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex items-start space-x-3">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 shrink-0">
              <Check className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase text-emerald-400 font-semibold">
                Phase 01 • Complete
              </span>
              <h4 className="text-sm font-semibold text-white">Monorepo & CI Standards</h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Express API, Vite web app, health probes, GitHub Actions pipeline.
              </p>
            </div>
          </div>

          <div className="bg-slate-900/90 border border-emerald-500/40 rounded-xl p-4 flex items-start space-x-3 ring-1 ring-emerald-500/30">
            <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 shrink-0 animate-pulse">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-mono uppercase text-emerald-400 font-bold">
                  Phase 02 • Active
                </span>
                <span className="text-[9px] bg-emerald-950 text-emerald-300 px-1.5 py-0.2 rounded border border-emerald-700">
                  25 Tests Passed
                </span>
              </div>
              <h4 className="text-sm font-semibold text-white">Data & Backend Core</h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Vegetarian seed verified, JWT sessions, and alias resolution.
              </p>
            </div>
          </div>
        </section>

        {/* Product Catalog Search & Alias Exploration Section */}
        <section className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-6 space-y-6 shadow-md">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-emerald-400" />
                Vegetarian Grocery Catalog & Alias Resolution
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Demonstrates natural language ingredient resolution (e.g. searching{' '}
                <code className="text-emerald-400">pyaz</code> maps to Onion,{' '}
                <code className="text-emerald-400">chenna</code> maps to Paneer).
              </p>
            </div>

            {/* Merchant Badges */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-medium">Merchants:</span>
              {merchants.map((m) => (
                <span
                  key={m._id}
                  className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-800/90 text-slate-300 border border-slate-700 flex items-center gap-1"
                >
                  <Store className="w-3 h-3 text-emerald-400" />
                  {m.businessName} (⭐ {m.rating})
                </span>
              ))}
            </div>
          </div>

          {/* Search Input Bar */}
          <div className="relative">
            <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products by name, recipe ingredient, or colloquial alias (e.g. pyaz, chenna, chawal, haldi, aloo)..."
              className="w-full pl-11 pr-10 py-3 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Quick Alias Chips */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-slate-400 flex items-center gap-1">
              <Tag className="w-3.5 h-3.5 text-emerald-400" /> Try Aliases:
            </span>
            {POPULAR_ALIASES.map((alias) => (
              <button
                key={alias.query}
                onClick={() => setSearchQuery(alias.query)}
                className={`text-xs px-2.5 py-1 rounded-lg border transition font-mono ${
                  searchQuery === alias.query
                    ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
                    : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700 hover:text-white'
                }`}
              >
                {alias.label}
              </button>
            ))}
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-800/60">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`text-xs font-semibold px-3.5 py-1.5 rounded-lg transition whitespace-nowrap ${
                  selectedCategory === cat
                    ? 'bg-slate-100 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Products Grid */}
          {catalogLoading ? (
            <div className="py-16 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
              <RefreshCw className="w-6 h-6 animate-spin text-emerald-400" />
              <p className="text-sm font-medium">Resolving catalog products...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="py-16 text-center text-slate-400 border border-dashed border-slate-800 rounded-xl">
              <p className="text-base font-semibold text-slate-300">
                No matching vegetarian items found
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Try another alias such as &quot;pyaz&quot;, &quot;chenna&quot;, or
                &quot;chawal&quot;
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {products.map((product) => (
                <div
                  key={product._id}
                  onClick={() => setSelectedProduct(product)}
                  className="bg-slate-950/80 border border-slate-800/90 rounded-xl p-4 hover:border-emerald-500/40 hover:shadow-lg hover:shadow-emerald-950/20 transition cursor-pointer flex flex-col justify-between group"
                >
                  <div className="space-y-2.5">
                    {/* Top Badges */}
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/60">
                        {product.category}
                      </span>
                      <div className="flex items-center space-x-1 text-[11px] text-emerald-400 font-medium">
                        <Leaf className="w-3.5 h-3.5" />
                        <span>100% Veg</span>
                      </div>
                    </div>

                    {/* Product Image Preview */}
                    {product.imageUrl && (
                      <div className="w-full h-32 rounded-lg overflow-hidden bg-slate-900 border border-slate-800 relative">
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        />
                      </div>
                    )}

                    {/* Name & Description */}
                    <div>
                      <h3 className="font-bold text-sm text-slate-100 group-hover:text-emerald-300 transition">
                        {product.name}
                      </h3>
                      <p className="text-xs text-slate-400 line-clamp-2 mt-1">
                        {product.description}
                      </p>
                    </div>

                    {/* Pack Size & Merchant */}
                    <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1">
                      <span>
                        Pack:{' '}
                        <strong className="text-slate-200">
                          {product.packageSize} {product.packageUnit}
                        </strong>
                      </span>
                      <span
                        className="truncate max-w-[120px]"
                        title={product.merchantId?.businessName}
                      >
                        {product.merchantId?.businessName}
                      </span>
                    </div>

                    {/* Aliases List */}
                    <div className="flex items-center gap-1 flex-wrap pt-1">
                      {product.aliases.slice(0, 3).map((a) => (
                        <span
                          key={a}
                          className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800"
                        >
                          #{a}
                        </span>
                      ))}
                      {product.aliases.length > 3 && (
                        <span className="text-[10px] text-slate-500">
                          +{product.aliases.length - 3}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Price & Stock Bottom Bar */}
                  <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                    <div>
                      <span className="text-xs text-slate-400 block text-[10px]">
                        Authoritative Price
                      </span>
                      <span className="text-base font-extrabold text-white">
                        {formatRupees(product.pricePaise)}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-emerald-400 font-medium bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800/40">
                        Stock: {product.availableStock}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Product Detail Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl relative">
            <button
              onClick={() => setSelectedProduct(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                {selectedProduct.category}
              </span>
              <span className="text-xs text-emerald-400 font-medium flex items-center gap-1">
                <Leaf className="w-3.5 h-3.5" /> Strictly Vegetarian
              </span>
            </div>

            <div>
              <h2 className="text-xl font-bold text-white">{selectedProduct.name}</h2>
              <p className="text-xs text-slate-400 mt-1">{selectedProduct.description}</p>
            </div>

            <div className="grid grid-cols-2 gap-3 bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-xs">
              <div>
                <span className="text-slate-500 block">Package Size:</span>
                <span className="font-semibold text-slate-200">
                  {selectedProduct.packageSize} {selectedProduct.packageUnit}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Available Stock:</span>
                <span className="font-semibold text-emerald-400">
                  {selectedProduct.availableStock} units
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Fulfillment Merchant:</span>
                <span className="font-semibold text-slate-200">
                  {selectedProduct.merchantId?.businessName}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Server Integer Price:</span>
                <span className="font-bold text-emerald-300 font-mono">
                  {selectedProduct.pricePaise} paise ({formatRupees(selectedProduct.pricePaise)})
                </span>
              </div>
            </div>

            <div>
              <span className="text-xs font-semibold text-slate-300 block mb-1.5">
                Recognized Natural-Language Aliases:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {selectedProduct.aliases.map((alias) => (
                  <span
                    key={alias}
                    className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700"
                  >
                    {alias}
                  </span>
                ))}
              </div>
            </div>

            <button
              onClick={() => setSelectedProduct(null)}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs transition"
            >
              Close Specification
            </button>
          </div>
        </div>
      )}

      {/* Auth Modal with Quick Demo Switcher */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl relative">
            <button
              onClick={() => setShowAuthModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <User className="w-5 h-5 text-emerald-400" />
                {authMode === 'LOGIN' ? 'Sign In to CartPilot' : 'Create Customer Account'}
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Access your spending mandates, cart proposals, and order tracking.
              </p>
            </div>

            {/* Quick Demo Credentials Panel */}
            <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800/90 space-y-2">
              <span className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider block font-mono">
                ⚡ 1-Click Demo Accounts (Seeded)
              </span>
              <div className="grid grid-cols-1 gap-1.5">
                <button
                  type="button"
                  onClick={() => handleQuickLogin('customer@example.com', 'Customer1234!')}
                  disabled={authSubmitting}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-xs flex items-center justify-between border border-slate-800 transition"
                >
                  <div>
                    <span className="font-semibold text-slate-200">Priya Sharma</span>
                    <span className="text-[10px] text-slate-400 block">customer@example.com</span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 font-mono font-semibold">
                    CUSTOMER
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickLogin('merchant@freshgrocers.com', 'Merchant1234!')}
                  disabled={authSubmitting}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-xs flex items-center justify-between border border-slate-800 transition"
                >
                  <div>
                    <span className="font-semibold text-slate-200">
                      Ramesh Patel (Fresh Greens)
                    </span>
                    <span className="text-[10px] text-slate-400 block">
                      merchant@freshgrocers.com
                    </span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-950 text-indigo-400 font-mono font-semibold">
                    MERCHANT
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickLogin('admin@cartpilot.com', 'Admin1234!')}
                  disabled={authSubmitting}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-xs flex items-center justify-between border border-slate-800 transition"
                >
                  <div>
                    <span className="font-semibold text-slate-200">System Admin</span>
                    <span className="text-[10px] text-slate-400 block">admin@cartpilot.com</span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-rose-950 text-rose-400 font-mono font-semibold">
                    ADMIN
                  </span>
                </button>
              </div>
            </div>

            {/* Custom Credentials Form */}
            <form onSubmit={handleAuthSubmit} className="space-y-3.5">
              {authError && (
                <div className="p-3 rounded-lg bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{authError}</span>
                </div>
              )}

              {authMode === 'REGISTER' && (
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={authName}
                    onChange={(e) => setAuthName(e.target.value)}
                    placeholder="e.g. Maya Verma"
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  placeholder="shopper@example.com"
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Password</label>
                <input
                  type="password"
                  required
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              {authMode === 'REGISTER' && (
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Account Role
                  </label>
                  <select
                    value={authRole}
                    onChange={(e) =>
                      setAuthRole(e.target.value as 'CUSTOMER' | 'MERCHANT' | 'ADMIN')
                    }
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="CUSTOMER">Customer (Shopper)</option>
                    <option value="MERCHANT">Merchant</option>
                  </select>
                </div>
              )}

              <button
                type="submit"
                disabled={authSubmitting}
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-md transition disabled:opacity-50"
              >
                {authSubmitting
                  ? 'Authenticating...'
                  : authMode === 'LOGIN'
                    ? 'Sign In'
                    : 'Create Account'}
              </button>

              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode(authMode === 'LOGIN' ? 'REGISTER' : 'LOGIN');
                    setAuthError(null);
                  }}
                  className="text-xs text-slate-400 hover:text-emerald-400 transition"
                >
                  {authMode === 'LOGIN'
                    ? "Don't have an account? Register"
                    : 'Already registered? Sign in'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-6 text-center text-xs text-slate-500 space-y-1">
        <p>CartPilot — Policy-Controlled AI Commerce Gateway</p>
        <p className="text-[11px] text-slate-600 font-mono">
          Phase 00 & 01 Completed • Phase 02 Data & Core Verified • Target MVP Freeze: 31 October
          2026
        </p>
      </footer>
    </div>
  );
}

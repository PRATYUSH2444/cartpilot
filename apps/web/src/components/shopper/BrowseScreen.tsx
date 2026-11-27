import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import {
  Search,
  X,
  Plus,
  Minus,
  Star,
  SlidersHorizontal,
  Heart,
  ChevronDown,
  ChevronRight,
  ArrowLeft,
  ShoppingBag,
  Filter,
  Check,
  RotateCcw,
  MapPin,
  Clock,
} from 'lucide-react';
import { Product, CartData } from '../../types';

interface BrowseScreenProps {
  products: Product[];
  cart: CartData | null;
  onAddToCart: (productId: string, quantity: number) => void;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onSelectProduct: (product: Product) => void;
  initialCategory?: string;
  favorites?: string[];
  onToggleFavorite?: (productId: string) => void;
  selectedAddress?: any;
  onOpenAddresses?: () => void;
  selectedDeliverySlot?: 'morning' | 'evening';
  onOpenWishlist?: () => void;
  onOpenCart?: () => void;
  onBack?: () => void;
}

export interface CategoryDef {
  id: string;
  name: string;
  shortName: string;
  subtitle: string;
  emoji: string;
  iconUrl?: string;
  aliases: string[];
  subCategories: string[];
}

export const BROWSE_CATEGORIES: CategoryDef[] = [
  {
    id: 'ALL',
    name: 'All Items',
    shortName: 'All',
    subtitle: 'Explore our entire fresh catalogue',
    emoji: '🛒',
    iconUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=160',
    aliases: ['ALL'],
    subCategories: ['All', 'Popular', 'Best Value', 'Organic'],
  },
  {
    id: 'VEGETABLES',
    name: 'Fresh Vegetables',
    shortName: 'Vegetables',
    subtitle: 'Farm-fresh & handpicked daily',
    emoji: '🥬',
    iconUrl: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=160',
    aliases: ['VEGETABLES', 'FRUITS_VEGETABLES', 'fresh-vegetables'],
    subCategories: [
      'All',
      'Potatoes & Onions',
      'Tomatoes',
      'Leafy Greens',
      'Chillies & Garlic',
      'Root Veg',
      'Green Peas & Beans',
      'Exotics & Veg',
    ],
  },
  {
    id: 'FRUITS',
    name: 'Fresh Fruits',
    shortName: 'Fresh Fruits',
    subtitle: 'Naturally ripened sweet fruits & citrus',
    emoji: '🍎',
    iconUrl: 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=160',
    aliases: ['FRUITS', 'FRUITS_VEGETABLES', 'fresh-fruits'],
    subCategories: [
      'All',
      'Apples & Pears',
      'Bananas',
      'Grapes',
      'Citrus',
      'Citrus & Guava',
      'Exotics & Melons',
    ],
  },
  {
    id: 'DAIRY',
    name: 'Dairy & Breakfast',
    shortName: 'Dairy & Eggs',
    subtitle: 'Farm cow milk, creamy malai paneer & breads',
    emoji: '🥛',
    iconUrl: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=160',
    aliases: ['DAIRY', 'DAIRY_BREAKFAST', 'dairy-breakfast'],
    subCategories: ['All', 'Milk', 'Paneer & Tofu', 'Curd & Dahi', 'Butter & Cheese'],
  },
  {
    id: 'STAPLES',
    name: 'Atta, Rice & Dal',
    shortName: 'Atta & Dal',
    subtitle: 'Chakki fresh flours, aged basmati & unpolished dals',
    emoji: '🌾',
    iconUrl: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=160',
    aliases: ['GRAINS', 'PULSES', 'ATTA_RICE_DAL', 'staples-atta'],
    subCategories: [
      'All',
      'Whole Wheat Atta',
      'Basmati Rice',
      'Toor & Moong Dal',
      'Grains & Poha',
    ],
  },
  {
    id: 'MASALA',
    name: 'Oil, Ghee & Masala',
    shortName: 'Oil & Spices',
    subtitle: 'Desi cow ghee, kachi ghani oil & authentic spices',
    emoji: '🫙',
    iconUrl: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=160',
    aliases: ['OILS', 'SPICES', 'MASALA_DRY_FRUITS', 'masala-oil'],
    subCategories: [
      'All',
      'Cow Ghee',
      'Mustard Oil',
      'Whole Spices',
      'Powdered Masala',
      'Organic Staples',
    ],
  },
  {
    id: 'BAKERY',
    name: 'Bakery & Bread',
    shortName: 'Bakery',
    subtitle: 'Eggless brown bread, freshly baked pav buns',
    emoji: '🍞',
    iconUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=160',
    aliases: ['BAKERY', 'bakery'],
    subCategories: ['All', 'Brown Bread', 'Pav & Buns'],
  },
  {
    id: 'SNACKS',
    name: 'Snacks & Munchies',
    shortName: 'Snacks',
    subtitle: 'Crisp peri peri makhana, khakhra & dry fruits',
    emoji: '🍪',
    iconUrl: 'https://images.unsplash.com/photo-1599490659213-e2b9527bd087?w=160',
    aliases: ['SNACKS_MUNCHIES', 'snacks-munchies'],
    subCategories: ['All', 'Makhana', 'Khakhra', 'Dry Fruits', 'Namkeen & Chips', 'Biscuits'],
  },
  {
    id: 'BEVERAGES',
    name: 'Drinks & Juices',
    shortName: 'Drinks',
    subtitle: 'Freshly squeezed fruit juice & pure tender coconut',
    emoji: '🥤',
    iconUrl: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?w=160',
    aliases: ['COLD_DRINKS_JUICES', 'drinks-juices'],
    subCategories: ['All', 'Fresh Juices', 'Tender Coconut'],
  },
  {
    id: 'INSTANT',
    name: 'Instant & Ready Food',
    shortName: 'Instant Food',
    subtitle: 'Stone-ground idli dosa batter & sweet corn',
    emoji: '🍲',
    iconUrl: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=160',
    aliases: ['INSTANT_FROZEN_FOOD', 'instant-food'],
    subCategories: ['All', 'Idli & Dosa Batter', 'Frozen Veg'],
  },
];

// Helper to determine whether a product belongs to a fruit vs vegetable when category is FRUITS_VEGETABLES
function isFruitProduct(p: Product): boolean {
  const query = `${p.name} ${p.subCategory || ''} ${p.aliases?.join(' ') || ''}`.toLowerCase();
  return (
    query.includes('apple') ||
    query.includes('banana') ||
    query.includes('orange') ||
    query.includes('grapes') ||
    query.includes('guava') ||
    query.includes('papaya') ||
    query.includes('pomegranate') ||
    query.includes('coconut') ||
    query.includes('kela') ||
    query.includes('seb') ||
    query.includes('santra') ||
    query.includes('anar')
  );
}

// Helper to determine whether a dry fruit product belongs to Snacks vs Masala
function isDryFruitProduct(p: Product): boolean {
  const query = `${p.name} ${p.subCategory || ''} ${p.aliases?.join(' ') || ''}`.toLowerCase();
  return (
    query.includes('almond') ||
    query.includes('badam') ||
    query.includes('cashew') ||
    query.includes('kaju') ||
    query.includes('raisin') ||
    query.includes('kishmish') ||
    query.includes('walnut') ||
    query.includes('dry fruit')
  );
}

export function productMatchesCategory(p: Product, catId: string): boolean {
  if (catId === 'ALL') return true;

  if (catId === 'VEGETABLES') {
    if (p.category === 'VEGETABLES') return true;
    if (p.category === 'FRUITS_VEGETABLES' && !isFruitProduct(p)) return true;
    return false;
  }

  if (catId === 'FRUITS') {
    if (p.category === 'FRUITS') return true;
    if (p.category === 'FRUITS_VEGETABLES' && isFruitProduct(p)) return true;
    return false;
  }

  if (catId === 'DAIRY') {
    return p.category === 'DAIRY' || p.category === 'DAIRY_BREAKFAST';
  }

  if (catId === 'STAPLES') {
    return (
      p.category === 'GRAINS' ||
      p.category === 'PULSES' ||
      p.category === 'ATTA_RICE_DAL'
    );
  }

  if (catId === 'MASALA') {
    if (p.category === 'OILS' || p.category === 'SPICES') return true;
    if (p.category === 'MASALA_DRY_FRUITS' && !isDryFruitProduct(p)) return true;
    return false;
  }

  if (catId === 'BAKERY') {
    return p.category === 'BAKERY';
  }

  if (catId === 'SNACKS') {
    if (p.category === 'SNACKS_MUNCHIES') return true;
    if (p.category === 'MASALA_DRY_FRUITS' && isDryFruitProduct(p)) return true;
    return false;
  }

  if (catId === 'BEVERAGES') {
    return p.category === 'COLD_DRINKS_JUICES';
  }

  if (catId === 'INSTANT') {
    return p.category === 'INSTANT_FROZEN_FOOD';
  }

  return false;
}

export type SortOption =
  | 'relevance'
  | 'price_asc'
  | 'price_desc'
  | 'discount'
  | 'rating';

export type PriceBucket = 'all' | 'under50' | '50to100' | '100to200' | 'above200';

export const BrowseScreen: React.FC<BrowseScreenProps> = ({
  products,
  cart,
  onAddToCart,
  onUpdateQuantity,
  onSelectProduct,
  initialCategory = 'ALL',
  favorites = [],
  onToggleFavorite,
  selectedAddress,
  onOpenAddresses,
  selectedDeliverySlot = 'morning',
  onOpenWishlist,
  onOpenCart,
  onBack,
}) => {
  // ── Normalize initial category from props or aliases ─────────────────────
  const normalizedInitial = useMemo(() => {
    if (!initialCategory || initialCategory === 'ALL') return 'ALL';
    const found = BROWSE_CATEGORIES.find(
      (c) => c.id === initialCategory || c.aliases.includes(initialCategory)
    );
    return found ? found.id : 'ALL';
  }, [initialCategory]);

  const [activeCategoryId, setActiveCategoryId] = useState<string>(normalizedInitial);
  const [activeSpyCategoryId, setActiveSpyCategoryId] = useState<string>(normalizedInitial);
  const [isSingleCategoryMode, setIsSingleCategoryMode] = useState<boolean>(() => {
    return normalizedInitial !== 'ALL';
  });

  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSearchExpanded, setIsSearchExpanded] = useState<boolean>(false);
  const [searchInCurrentOnly, setSearchInCurrentOnly] = useState<boolean>(false);

  // Filters State
  const [sortBy, setSortBy] = useState<SortOption>('relevance');
  const [selectedPriceBucket, setSelectedPriceBucket] = useState<PriceBucket>('all');
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [inStockOnly, setInStockOnly] = useState<boolean>(false);

  // Bottom Sheets & Popups
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState<boolean>(false);
  const [isSortSheetOpen, setIsSortSheetOpen] = useState<boolean>(false);
  const [isPackSheetOpen, setIsPackSheetOpen] = useState<boolean>(false);
  const [packSheetProduct, setPackSheetProduct] = useState<Product | null>(null);

  // Notified items local toggle map
  const [notifiedItems, setNotifiedItems] = useState<Record<string, boolean>>({});

  // Refs for Scroll-Spy & DOM elements
  const productPaneRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});
  const railButtonRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Sync when initialCategory prop changes from external navigation (e.g. HomeScreen clicks)
  useEffect(() => {
    if (normalizedInitial !== 'ALL') {
      setActiveCategoryId(normalizedInitial);
      setActiveSpyCategoryId(normalizedInitial);
      setIsSingleCategoryMode(true);
      setSelectedSubcategory('All');
    } else {
      setActiveCategoryId('ALL');
      setActiveSpyCategoryId('ALL');
      setIsSingleCategoryMode(false);
    }
  }, [normalizedInitial]);

  // Sync URL query state
  useEffect(() => {
    try {
      const url = new URL(window.location.href);
      if (activeCategoryId !== 'ALL') {
        url.searchParams.set('category', activeCategoryId.toLowerCase());
      } else {
        url.searchParams.delete('category');
      }
      if (sortBy !== 'relevance') {
        url.searchParams.set('sort', sortBy);
      } else {
        url.searchParams.delete('sort');
      }
      window.history.replaceState({}, '', url.toString());
    } catch {}
  }, [activeCategoryId, sortBy]);

  // Active Category Definition
  const currentCategoryDef = useMemo(() => {
    return BROWSE_CATEGORIES.find((c) => c.id === activeCategoryId) || BROWSE_CATEGORIES[0];
  }, [activeCategoryId]);

  // Available brands in the current view
  const availableBrands = useMemo(() => {
    const brandMap: Record<string, number> = {};
    products.forEach((p) => {
      const brand = p.brand || 'Fresh Produce';
      brandMap[brand] = (brandMap[brand] || 0) + 1;
    });
    return Object.entries(brandMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [products]);

  // Helper for cart item quantities
  const getCartQuantity = useCallback(
    (productId: string): number => {
      if (!cart || !cart.items) return 0;
      const item = cart.items.find((i) => i.productId === productId);
      return item ? item.quantity : 0;
    },
    [cart]
  );

  // Latest added item in cart for the floating pill
  const latestCartItem = useMemo(() => {
    if (!cart || !cart.items || cart.items.length === 0) return null;
    return cart.items[cart.items.length - 1];
  }, [cart]);

  // Format delivery slot text cleanly without 10-mins
  const formattedDeliverySlot = useMemo(() => {
    return selectedDeliverySlot === 'evening'
      ? 'Evening, 5:00 PM – 9:00 PM'
      : 'Morning, 6:00 AM – 10:00 AM';
  }, [selectedDeliverySlot]);

  // Active filter count
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (sortBy !== 'relevance') count++;
    if (selectedPriceBucket !== 'all') count++;
    if (selectedBrands.length > 0) count += selectedBrands.length;
    if (inStockOnly) count++;
    return count;
  }, [sortBy, selectedPriceBucket, selectedBrands, inStockOnly]);

  const handleResetFilters = useCallback(() => {
    setSortBy('relevance');
    setSelectedPriceBucket('all');
    setSelectedBrands([]);
    setInStockOnly(false);
    setSelectedSubcategory('All');
    setSearchQuery('');
  }, []);

  // Filter & Sort core pipeline
  const applyProductFilters = useCallback(
    (productList: Product[], forCatId?: string): Product[] => {
      return productList
        .filter((p) => {
          // Category match
          if (forCatId && forCatId !== 'ALL') {
            if (!productMatchesCategory(p, forCatId)) return false;
          }

          // Search match
          if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase().trim();
            const inScope =
              !searchInCurrentOnly ||
              activeCategoryId === 'ALL' ||
              productMatchesCategory(p, activeCategoryId);

            if (!inScope) return false;

            const nameMatch = p.name.toLowerCase().includes(q);
            const brandMatch = p.brand?.toLowerCase().includes(q);
            const descMatch = p.description?.toLowerCase().includes(q);
            const subMatch = p.subCategory?.toLowerCase().includes(q);
            const aliasMatch = p.aliases?.some((a) => a.toLowerCase().includes(q));

            if (!nameMatch && !brandMatch && !descMatch && !subMatch && !aliasMatch) {
              return false;
            }
          }

          // Subcategory match
          if (selectedSubcategory !== 'All' && isSingleCategoryMode) {
            const subLower = selectedSubcategory.toLowerCase();
            const pSub = (p.subCategory || '').toLowerCase();
            const pName = p.name.toLowerCase();
            if (!pSub.includes(subLower) && !pName.includes(subLower)) {
              return false;
            }
          }

          // In-stock only
          if (inStockOnly && (p.availableStock ?? 0) <= 0) {
            return false;
          }

          // Brand filter
          if (selectedBrands.length > 0) {
            const pBrand = p.brand || 'Fresh Produce';
            if (!selectedBrands.includes(pBrand)) return false;
          }

          // Price bucket
          const price = p.pricePaise / 100;
          if (selectedPriceBucket === 'under50' && price > 50) return false;
          if (selectedPriceBucket === '50to100' && (price < 50 || price > 100)) return false;
          if (selectedPriceBucket === '100to200' && (price < 100 || price > 200)) return false;
          if (selectedPriceBucket === 'above200' && price < 200) return false;

          return true;
        })
        .sort((a, b) => {
          if (sortBy === 'price_asc') return a.pricePaise - b.pricePaise;
          if (sortBy === 'price_desc') return b.pricePaise - a.pricePaise;
          if (sortBy === 'discount') {
            const aMrp = a.mrpPaise || a.pricePaise * 1.15;
            const bMrp = b.mrpPaise || b.pricePaise * 1.15;
            const aDisc = (aMrp - a.pricePaise) / aMrp;
            const bDisc = (bMrp - b.pricePaise) / bMrp;
            return bDisc - aDisc;
          }
          if (sortBy === 'rating') {
            return (b.rating || 4.5) - (a.rating || 4.5);
          }
          return 0;
        });
    },
    [
      searchQuery,
      searchInCurrentOnly,
      activeCategoryId,
      selectedSubcategory,
      isSingleCategoryMode,
      inStockOnly,
      selectedBrands,
      selectedPriceBucket,
      sortBy,
    ]
  );

  // Filtered products for dedicated single category mode
  const singleCategoryProducts = useMemo(() => {
    return applyProductFilters(products, activeCategoryId);
  }, [products, activeCategoryId, applyProductFilters]);

  // Grouped products per category for "All" continuous view
  const continuousCategorySections = useMemo(() => {
    return BROWSE_CATEGORIES.filter((c) => c.id !== 'ALL')
      .map((cat) => {
        const catProds = applyProductFilters(products, cat.id);
        return {
          category: cat,
          totalCount: catProds.length,
          previewProducts: catProds.slice(0, 6),
        };
      })
      .filter((section) => section.totalCount > 0);
  }, [products, applyProductFilters]);

  // ── Scroll-Spy Implementation (Bidirectional) ────────────────────────────
  useEffect(() => {
    if (isSingleCategoryMode) return;

    const pane = productPaneRef.current;
    if (!pane) return;

    let timeoutId: any = null;

    const handleScroll = () => {
      if (timeoutId) return;
      timeoutId = setTimeout(() => {
        timeoutId = null;
        const containerTop = pane.getBoundingClientRect().top;

        // Find which section header is nearest to containerTop
        let closestCatId = 'ALL';
        let minDiff = Infinity;

        continuousCategorySections.forEach(({ category }) => {
          const el = sectionRefs.current[category.id];
          if (el) {
            const rect = el.getBoundingClientRect();
            const diff = Math.abs(rect.top - containerTop - 100);
            if (rect.top <= containerTop + 240 && diff < minDiff) {
              minDiff = diff;
              closestCatId = category.id;
            }
          }
        });

        if (closestCatId && closestCatId !== activeSpyCategoryId) {
          setActiveSpyCategoryId(closestCatId);
          // Keep rail item in view
          const railBtn = railButtonRefs.current[closestCatId];
          if (railBtn) {
            railBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
          }
        }
      }, 60);
    };

    pane.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      pane.removeEventListener('scroll', handleScroll);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [isSingleCategoryMode, continuousCategorySections, activeSpyCategoryId]);

  // Smooth scroll to section in "All" view or switch view
  const handleSelectCategoryFromRail = (catId: string) => {
    if (catId === 'ALL') {
      setIsSingleCategoryMode(false);
      setActiveCategoryId('ALL');
      setActiveSpyCategoryId('ALL');
      if (productPaneRef.current) {
        productPaneRef.current.scrollTo({ top: 0, behavior: 'smooth' });
      }
      return;
    }

    if (isSingleCategoryMode) {
      setActiveCategoryId(catId);
      setActiveSpyCategoryId(catId);
      setSelectedSubcategory('All');
      if (productPaneRef.current) {
        productPaneRef.current.scrollTo({ top: 0, behavior: 'instant' });
      }
    } else {
      // In "All" view, smooth scroll to the section
      const targetEl = sectionRefs.current[catId];
      if (targetEl && productPaneRef.current) {
        const paneTop = productPaneRef.current.getBoundingClientRect().top;
        const targetTop = targetEl.getBoundingClientRect().top;
        const offset = targetTop - paneTop + productPaneRef.current.scrollTop - 90;
        productPaneRef.current.scrollTo({ top: Math.max(0, offset), behavior: 'smooth' });
        setActiveSpyCategoryId(catId);
      } else {
        // Fallback: switch directly
        setActiveCategoryId(catId);
        setIsSingleCategoryMode(true);
        setSelectedSubcategory('All');
      }
    }
  };

  const handleOpenCategoryDedicatedView = (catId: string) => {
    setActiveCategoryId(catId);
    setActiveSpyCategoryId(catId);
    setIsSingleCategoryMode(true);
    setSelectedSubcategory('All');
    if (productPaneRef.current) {
      productPaneRef.current.scrollTo({ top: 0, behavior: 'instant' });
    }
  };

  const handleBackToAllCategories = () => {
    if (isSingleCategoryMode) {
      setIsSingleCategoryMode(false);
      setActiveCategoryId('ALL');
      setActiveSpyCategoryId('ALL');
      setSelectedSubcategory('All');
      if (productPaneRef.current) {
        productPaneRef.current.scrollTo({ top: 0, behavior: 'instant' });
      }
    } else if (onBack) {
      onBack();
    }
  };

  const handleToggleNotify = (productId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setNotifiedItems((prev) => ({ ...prev, [productId]: !prev[productId] }));
  };

  const handleOpenPackSheet = (prod: Product, e: React.MouseEvent) => {
    e.stopPropagation();
    setPackSheetProduct(prod);
    setIsPackSheetOpen(true);
  };

  // ── Render Product Card Component ─────────────────────────────────────────
  const renderProductCard = (prod: Product) => {
    const qty = getCartQuantity(prod._id);
    const priceRupees = Math.round(prod.pricePaise / 100);
    const origPrice = prod.mrpPaise
      ? Math.round(prod.mrpPaise / 100)
      : Math.round(priceRupees * 1.18);
    const discountPercent =
      origPrice > priceRupees
        ? Math.round(((origPrice - priceRupees) / origPrice) * 100)
        : 0;
    const isFav = favorites.includes(prod._id);
    const isOutOfStock = (prod.availableStock ?? 0) <= 0;
    const isLowStock = !isOutOfStock && (prod.availableStock ?? 0) < 5;
    const isNotified = Boolean(notifiedItems[prod._id]);

    return (
      <div
        key={prod._id}
        onClick={() => onSelectProduct(prod)}
        className="rounded-2xl bg-[#16181A] border border-[#2A2D31] hover:border-[#22C55E]/50 p-2.5 sm:p-3 flex flex-col justify-between transition-all duration-200 group active:scale-[0.985] cursor-pointer shadow-sm relative overflow-hidden"
      >
        <div className="space-y-2">
          {/* ── Image & Overlay Area ── */}
          <div className="relative aspect-square w-full rounded-xl bg-[#1E2124] overflow-hidden flex items-center justify-center">
            {prod.imageUrl ? (
              <img
                src={prod.imageUrl}
                alt={prod.name}
                loading="lazy"
                className={`w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 ${
                  isOutOfStock ? 'grayscale opacity-60' : ''
                }`}
              />
            ) : (
              <span className="text-4xl">{currentCategoryDef.emoji || '🛒'}</span>
            )}

            {/* Discount Badge (Top-Left) */}
            {discountPercent > 0 && (
              <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded-md bg-[#F97316] text-white font-mono font-extrabold text-[10px] shadow-sm leading-none">
                {discountPercent}% OFF
              </span>
            )}

            {/* Wishlist Heart (Top-Right) */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (onToggleFavorite) onToggleFavorite(prod._id);
              }}
              className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-stone-300 hover:text-rose-500 transition-transform active:scale-90"
              aria-label="Wishlist"
              title={isFav ? 'Remove from wishlist' : 'Add to wishlist'}
            >
              <Heart
                className={`w-4 h-4 transition-colors ${
                  isFav ? 'fill-rose-500 text-rose-500' : 'text-stone-300'
                }`}
              />
            </button>

            {/* Unit / Weight Pill (Bottom-Left of Image) */}
            <button
              type="button"
              onClick={(e) => handleOpenPackSheet(prod, e)}
              className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-black/75 backdrop-blur-md border border-white/10 text-[10px] font-bold text-white flex items-center gap-1 shadow-sm hover:bg-black/90 transition-colors"
            >
              <span>
                {prod.packageSize} {prod.packageUnit}
              </span>
              <ChevronDown className="w-2.5 h-2.5 text-stone-300" />
            </button>
          </div>

          {/* ── Metadata Body ── */}
          <div className="space-y-1">
            {/* Vegetarian Green Dot & Delivery ETA */}
            <div className="flex items-center justify-between text-[10px]">
              <div
                className="w-3.5 h-3.5 rounded-xs border border-emerald-500 bg-white flex items-center justify-center shadow-xs shrink-0"
                title="100% Vegetarian"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
              </div>
              <span className="font-semibold text-emerald-400">Tomorrow</span>
            </div>

            {/* Brand / Subcategory */}
            <p className="text-[10px] text-[#9AA0A6] font-semibold tracking-wide uppercase line-clamp-1">
              {prod.brand || prod.subCategory || 'Fresh Staple'}
            </p>

            {/* Product Title */}
            <h4 className="font-heading font-semibold text-xs sm:text-sm text-[#F2F3F4] line-clamp-2 leading-snug group-hover:text-emerald-400 transition-colors">
              {prod.name}
            </h4>

            {/* Rating & Stock Urgency */}
            <div className="flex items-center justify-between text-[10px] pt-0.5">
              <div className="flex items-center gap-1 text-amber-400 font-semibold">
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                <span>{prod.rating || 4.8}</span>
                <span className="text-[#9AA0A6] font-normal">
                  ({prod.reviewCount || '1.1k'})
                </span>
              </div>

              {isLowStock && (
                <span className="inline-flex items-center gap-1 text-amber-400 font-bold text-[10px]">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                  Only {prod.availableStock} left
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ── Pricing & CTA Button Block ── */}
        <div className="mt-3 pt-2 border-t border-[#2A2D31] flex items-center justify-between gap-1.5">
          <div className="min-w-0">
            <div className="flex items-baseline gap-1">
              <span className="font-heading font-extrabold text-sm sm:text-base text-[#F2F3F4] font-mono">
                ₹{priceRupees}
              </span>
              {origPrice > priceRupees && (
                <span className="text-[10px] sm:text-[11px] text-[#9AA0A6] line-through font-mono">
                  ₹{origPrice}
                </span>
              )}
            </div>
            {origPrice > priceRupees && origPrice - priceRupees >= 10 && (
              <p className="text-[9px] font-bold text-emerald-400">
                Save ₹{origPrice - priceRupees}
              </p>
            )}
          </div>

          {/* Stepper / ADD Button (Smooth Morphing, zero layout shift) */}
          <div onClick={(e) => e.stopPropagation()} className="shrink-0">
            {isOutOfStock ? (
              <button
                type="button"
                onClick={(e) => handleToggleNotify(prod._id, e)}
                className={`px-2.5 py-1.5 rounded-xl border text-[11px] font-bold transition-all cursor-pointer ${
                  isNotified
                    ? 'border-emerald-500/60 bg-emerald-500/10 text-emerald-400'
                    : 'border-[#2A2D31] bg-[#1E2124] text-[#9AA0A6] hover:text-white hover:border-stone-500'
                }`}
              >
                {isNotified ? 'Notified ✓' : 'Notify me'}
              </button>
            ) : qty === 0 ? (
              <button
                type="button"
                onClick={() => onAddToCart(prod._id, 1)}
                className="px-3.5 py-1.5 rounded-xl border border-[#22C55E] bg-[#22C55E]/10 hover:bg-[#22C55E] text-[#22C55E] hover:text-white font-heading font-extrabold text-xs transition-all active:scale-95 cursor-pointer flex items-center gap-1 shadow-sm"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>ADD</span>
              </button>
            ) : (
              <div className="flex items-center gap-1.5 bg-[#22C55E] text-white px-2 py-1 rounded-xl text-xs font-bold shadow-sm">
                <button
                  type="button"
                  onClick={() => onUpdateQuantity(prod._id, qty - 1)}
                  className="p-0.5 hover:bg-emerald-600 rounded transition-colors active:scale-90 cursor-pointer"
                  aria-label="Decrease quantity"
                >
                  <Minus className="w-3.5 h-3.5 stroke-[2.5]" />
                </button>
                <span className="font-mono font-extrabold px-1 min-w-[16px] text-center text-white">
                  {qty}
                </span>
                <button
                  type="button"
                  onClick={() => onUpdateQuantity(prod._id, qty + 1)}
                  className="p-0.5 hover:bg-emerald-600 rounded transition-colors active:scale-90 cursor-pointer"
                  aria-label="Increase quantity"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 w-full min-h-screen bg-[#0E0F10] text-[#F2F3F4] flex flex-col relative select-none pb-24 lg:pb-8">
      {/* ── 1. Top Sticky Bar (Scoped Category, Delivery Line, Search & Icons) ── */}
      <header className="sticky top-0 z-30 bg-[#0E0F10]/95 backdrop-blur-md border-b border-[#2A2D31]">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2.5 space-y-2">
          {/* Top Row: Back, Title + Delivery Subtitle, Search/Wishlist/Cart Icons */}
          <div className="flex items-center justify-between gap-3">
            {/* Left: Back button & Title */}
            <div className="flex items-center gap-2.5 min-w-0">
              <button
                type="button"
                onClick={handleBackToAllCategories}
                className="w-9 h-9 rounded-xl bg-[#16181A] border border-[#2A2D31] text-[#F2F3F4] hover:border-[#22C55E]/50 flex items-center justify-center transition-all cursor-pointer shrink-0 active:scale-95"
                title={isSingleCategoryMode ? 'Back to All Categories' : 'Back'}
                aria-label="Back"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>

              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h1 className="font-heading font-extrabold text-sm sm:text-base text-white tracking-tight truncate">
                    {isSingleCategoryMode
                      ? currentCategoryDef.name
                      : 'All Groceries'}
                  </h1>
                  {isSingleCategoryMode && (
                    <span className="text-xs text-[#9AA0A6] font-normal">
                      ({singleCategoryProducts.length})
                    </span>
                  )}
                </div>

                {/* Delivery Location & Schedule Subtitle */}
                <div className="flex items-center gap-2 text-[11px] text-[#9AA0A6] truncate">
                  <button
                    type="button"
                    onClick={onOpenAddresses}
                    className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300 font-medium truncate cursor-pointer"
                  >
                    <MapPin className="w-3 h-3 text-emerald-400 shrink-0" />
                    <span className="truncate">
                      {selectedAddress?.street
                        ? `${selectedAddress.street}, ${selectedAddress.city || 'Patna'}`
                        : 'Home: Boring Road, Patna'}
                    </span>
                    <ChevronDown className="w-2.5 h-2.5 text-emerald-400 shrink-0" />
                  </button>

                  <span className="text-[#2A2D31] hidden sm:inline">|</span>

                  <div className="hidden sm:flex items-center gap-1 text-[#9AA0A6]">
                    <Clock className="w-3 h-3 text-stone-400 shrink-0" />
                    <span>{formattedDeliverySlot}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Action Icons: Search Toggle, Wishlist, Cart */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setIsSearchExpanded((prev) => !prev);
                  if (!isSearchExpanded) {
                    setTimeout(() => searchInputRef.current?.focus(), 100);
                  }
                }}
                className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-all cursor-pointer ${
                  isSearchExpanded || searchQuery
                    ? 'border-[#22C55E] bg-[#22C55E]/15 text-[#22C55E]'
                    : 'border-[#2A2D31] bg-[#16181A] text-[#F2F3F4] hover:border-stone-500'
                }`}
                title="Search"
                aria-label="Search"
              >
                <Search className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={onOpenWishlist}
                className="w-9 h-9 rounded-xl border border-[#2A2D31] bg-[#16181A] text-[#F2F3F4] hover:border-rose-500/50 flex items-center justify-center transition-all cursor-pointer relative"
                title="Wishlist"
                aria-label="Wishlist"
              >
                <Heart className="w-4 h-4" />
                {favorites.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white font-mono text-[9px] font-bold flex items-center justify-center">
                    {favorites.length}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={onOpenCart}
                className="w-9 h-9 rounded-xl border border-[#2A2D31] bg-[#16181A] text-[#F2F3F4] hover:border-[#22C55E]/50 flex items-center justify-center transition-all cursor-pointer relative"
                title="Cart"
                aria-label="Cart"
              >
                <ShoppingBag className="w-4 h-4" />
                {(cart?.itemCount ?? 0) > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#22C55E] text-white font-mono text-[9px] font-bold flex items-center justify-center">
                    {cart?.itemCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Expandable In-Place Search Bar with Scope Toggle */}
          {isSearchExpanded && (
            <div className="pt-1 pb-1 animate-slide-down space-y-2">
              <div className="relative flex items-center">
                <Search className="w-4 h-4 text-[#9AA0A6] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder={
                    searchInCurrentOnly && isSingleCategoryMode
                      ? `Search in ${currentCategoryDef.name}…`
                      : 'Search veggies, fruits, dairy, atta, paneer…'
                  }
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-9 py-2.5 rounded-xl bg-[#16181A] border border-[#2A2D31] text-xs text-[#F2F3F4] placeholder:text-[#9AA0A6] focus:outline-none focus:border-[#22C55E] focus:ring-1 focus:ring-[#22C55E]/30"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9AA0A6] hover:text-white p-1"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Scoped toggle: Search in category vs everywhere */}
              {isSingleCategoryMode && (
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-[#9AA0A6]">Scope:</span>
                  <button
                    type="button"
                    onClick={() => setSearchInCurrentOnly(true)}
                    className={`px-2.5 py-1 rounded-full font-medium transition-colors ${
                      searchInCurrentOnly
                        ? 'bg-[#22C55E]/20 text-emerald-400 border border-[#22C55E]/40 font-bold'
                        : 'bg-[#16181A] text-[#9AA0A6] border border-[#2A2D31]'
                    }`}
                  >
                    In {currentCategoryDef.shortName}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSearchInCurrentOnly(false)}
                    className={`px-2.5 py-1 rounded-full font-medium transition-colors ${
                      !searchInCurrentOnly
                        ? 'bg-[#22C55E]/20 text-emerald-400 border border-[#22C55E]/40 font-bold'
                        : 'bg-[#16181A] text-[#9AA0A6] border border-[#2A2D31]'
                    }`}
                  >
                    Search Everywhere
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ── 2. Sticky Horizontal Filter Chips Bar ── */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth pb-1 pt-0.5">
            {/* Filters Sheet Button */}
            <button
              type="button"
              onClick={() => setIsFilterSheetOpen(true)}
              className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                activeFilterCount > 0
                  ? 'bg-[#22C55E] text-white shadow-xs'
                  : 'bg-[#16181A] text-[#F2F3F4] border border-[#2A2D31] hover:border-stone-500'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Filters</span>
              {activeFilterCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-white text-[#0E0F10] text-[10px] font-mono font-extrabold flex items-center justify-center ml-0.5">
                  {activeFilterCount}
                </span>
              )}
            </button>

            {/* Sort Dropdown Chip */}
            <button
              type="button"
              onClick={() => setIsSortSheetOpen(true)}
              className={`flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium border transition-all cursor-pointer ${
                sortBy !== 'relevance'
                  ? 'border-[#22C55E]/60 bg-[#22C55E]/15 text-emerald-400 font-bold'
                  : 'border-[#2A2D31] bg-[#16181A] text-[#F2F3F4] hover:border-stone-500'
              }`}
            >
              <span>
                Sort: {sortBy === 'price_asc'
                  ? 'Price: Low'
                  : sortBy === 'price_desc'
                    ? 'Price: High'
                    : sortBy === 'discount'
                      ? 'Discount'
                      : sortBy === 'rating'
                        ? 'Rating'
                        : 'Relevance'}
              </span>
              <ChevronDown className="w-3 h-3 text-[#9AA0A6]" />
            </button>

            {/* Price Filter Chips */}
            <button
              type="button"
              onClick={() =>
                setSelectedPriceBucket((prev) => (prev === 'under50' ? 'all' : 'under50'))
              }
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-all cursor-pointer ${
                selectedPriceBucket === 'under50'
                  ? 'border-[#22C55E]/60 bg-[#22C55E]/15 text-emerald-400 font-bold'
                  : 'border-[#2A2D31] bg-[#16181A] text-[#9AA0A6] hover:text-[#F2F3F4]'
              }`}
            >
              Under ₹50
            </button>

            <button
              type="button"
              onClick={() =>
                setSelectedPriceBucket((prev) => (prev === '50to100' ? 'all' : '50to100'))
              }
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-all cursor-pointer ${
                selectedPriceBucket === '50to100'
                  ? 'border-[#22C55E]/60 bg-[#22C55E]/15 text-emerald-400 font-bold'
                  : 'border-[#2A2D31] bg-[#16181A] text-[#9AA0A6] hover:text-[#F2F3F4]'
              }`}
            >
              ₹50 – ₹100
            </button>

            <button
              type="button"
              onClick={() =>
                setSelectedPriceBucket((prev) => (prev === '100to200' ? 'all' : '100to200'))
              }
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-all cursor-pointer ${
                selectedPriceBucket === '100to200'
                  ? 'border-[#22C55E]/60 bg-[#22C55E]/15 text-emerald-400 font-bold'
                  : 'border-[#2A2D31] bg-[#16181A] text-[#9AA0A6] hover:text-[#F2F3F4]'
              }`}
            >
              ₹100 – ₹200
            </button>

            {/* In-Stock Only Toggle */}
            <button
              type="button"
              onClick={() => setInStockOnly((prev) => !prev)}
              className={`flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium border transition-all cursor-pointer ${
                inStockOnly
                  ? 'border-[#22C55E]/60 bg-[#22C55E]/15 text-emerald-400 font-bold'
                  : 'border-[#2A2D31] bg-[#16181A] text-[#9AA0A6] hover:text-[#F2F3F4]'
              }`}
            >
              <span>In Stock Only</span>
            </button>

            {/* Pure Veg Badge (Always Active & Guaranteed) */}
            <div className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-950/40 border border-emerald-600/40 text-emerald-400 text-xs font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>100% Veg</span>
            </div>

            {/* Reset / Clear all button */}
            {activeFilterCount > 0 && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="flex-shrink-0 flex items-center gap-1 px-2.5 py-1 text-xs text-rose-400 hover:text-rose-300 font-semibold cursor-pointer underline"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Clear all</span>
              </button>
            )}
          </div>

          {/* Subcategory Pills Row (in Single Category Mode) */}
          {isSingleCategoryMode && currentCategoryDef.subCategories.length > 0 && (
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
              {currentCategoryDef.subCategories.map((sub) => {
                const isSelected = selectedSubcategory === sub;
                return (
                  <button
                    key={sub}
                    type="button"
                    onClick={() => setSelectedSubcategory(sub)}
                    className={`flex-shrink-0 px-3 py-1 rounded-full text-[11px] font-medium transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#22C55E] text-white font-bold shadow-xs'
                        : 'bg-[#16181A] text-[#9AA0A6] hover:text-white border border-[#2A2D31]'
                    }`}
                  >
                    {sub}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </header>

      {/* ── 3. Main Two-Pane Body (Left Category Rail + Continuous Right Product Pane) ── */}
      <div className="flex-1 flex max-w-7xl mx-auto w-full min-h-[calc(100vh-140px)]">
        {/* ── Left Category Vertical Rail ── */}
        <aside className="w-[76px] sm:w-[88px] lg:w-[108px] shrink-0 border-r border-[#2A2D31] bg-[#16181A] flex flex-col py-2 overflow-y-auto no-scrollbar overscroll-contain">
          <div className="space-y-1 px-1 sm:px-1.5">
            {BROWSE_CATEGORIES.map((cat) => {
              const isActive = isSingleCategoryMode
                ? activeCategoryId === cat.id
                : activeSpyCategoryId === cat.id;

              return (
                <button
                  key={cat.id}
                  ref={(el) => (railButtonRefs.current[cat.id] = el)}
                  type="button"
                  onClick={() => handleSelectCategoryFromRail(cat.id)}
                  className={`w-full rounded-xl py-2 px-1 flex flex-col items-center text-center transition-all cursor-pointer group relative ${
                    isActive
                      ? 'bg-[#1E2124] text-white font-bold border-l-[3px] border-[#22C55E]'
                      : 'text-[#9AA0A6] hover:text-white hover:bg-[#1E2124]/50'
                  }`}
                >
                  {/* Category Thumbnail / Circular Icon */}
                  <div
                    className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center overflow-hidden mb-1.5 transition-transform group-hover:scale-105 border ${
                      isActive
                        ? 'border-[#22C55E] bg-[#22C55E]/15 shadow-sm'
                        : 'border-[#2A2D31] bg-[#0E0F10]'
                    }`}
                  >
                    {cat.iconUrl ? (
                      <img
                        src={cat.iconUrl}
                        alt={cat.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <span className="text-xl">{cat.emoji}</span>
                    )}
                  </div>

                  {/* 2-line Label */}
                  <span className="text-[10px] sm:text-[11px] leading-tight line-clamp-2 px-0.5 font-medium">
                    {cat.shortName}
                  </span>
                </button>
              );
            })}
          </div>
        </aside>

        {/* ── Right Product Pane ── */}
        <main
          ref={productPaneRef}
          className="flex-1 min-w-0 p-3 sm:p-4 lg:p-5 overflow-y-auto"
        >
          {/* Case A: Single Category Dedicated View */}
          {isSingleCategoryMode ? (
            <div className="space-y-4">
              {/* Category Header Banner */}
              <div className="rounded-2xl bg-[#16181A] border border-[#2A2D31] p-3.5 sm:p-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-11 h-11 rounded-xl bg-[#1E2124] border border-[#2A2D31] flex items-center justify-center text-2xl shrink-0">
                    {currentCategoryDef.emoji}
                  </div>
                  <div className="min-w-0">
                    <h2 className="font-heading font-extrabold text-base sm:text-lg text-white leading-tight truncate">
                      {currentCategoryDef.name}
                    </h2>
                    <p className="text-xs text-[#9AA0A6] truncate mt-0.5">
                      {currentCategoryDef.subtitle}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleBackToAllCategories}
                  className="px-3 py-1.5 rounded-xl border border-[#2A2D31] bg-[#1E2124] hover:border-stone-500 text-xs font-semibold text-[#F2F3F4] transition-colors shrink-0 cursor-pointer"
                >
                  View All ›
                </button>
              </div>

              {/* Product Grid */}
              {singleCategoryProducts.length === 0 ? (
                <div className="py-16 text-center space-y-3">
                  <span className="text-4xl">🔍</span>
                  <h3 className="font-heading font-bold text-base text-white">
                    No products found in this category
                  </h3>
                  <p className="text-xs text-[#9AA0A6] max-w-xs mx-auto">
                    Try adjusting your filters or search keywords to find what you need.
                  </p>
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="px-4 py-2 rounded-full bg-[#22C55E]/15 border border-[#22C55E]/40 text-emerald-400 text-xs font-bold hover:bg-[#22C55E] hover:text-white transition-all cursor-pointer"
                  >
                    Reset Filters
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 gap-2.5 sm:gap-3.5">
                  {singleCategoryProducts.map(renderProductCard)}
                </div>
              )}
            </div>
          ) : (
            /* Case B: Continuous Sequential Sections ("All" View) */
            <div className="space-y-8">
              {continuousCategorySections.map(({ category, totalCount, previewProducts }) => (
                <section
                  key={category.id}
                  id={`cat-section-${category.id}`}
                  ref={(el) => (sectionRefs.current[category.id] = el)}
                  className="space-y-3 pt-2"
                >
                  {/* Category Section Header */}
                  <div className="flex items-center justify-between pb-2 border-b border-[#2A2D31]">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-2xl shrink-0">{category.emoji}</span>
                      <div className="min-w-0">
                        <h3 className="font-heading font-extrabold text-sm sm:text-base text-white leading-tight truncate">
                          {category.name}
                        </h3>
                        <p className="text-[11px] text-[#9AA0A6] truncate">
                          {category.subtitle}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleOpenCategoryDedicatedView(category.id)}
                      className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-0.5 shrink-0 transition-colors cursor-pointer"
                    >
                      <span>See all ({totalCount})</span>
                      <ChevronRight className="w-3.5 h-3.5 stroke-[2.5]" />
                    </button>
                  </div>

                  {/* 2-Column (Mobile) to 4-5 Column (Desktop) Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 gap-2.5 sm:gap-3.5">
                    {previewProducts.map(renderProductCard)}
                  </div>

                  {/* Full-width "See all products in {category}" button */}
                  {totalCount > previewProducts.length && (
                    <button
                      type="button"
                      onClick={() => handleOpenCategoryDedicatedView(category.id)}
                      className="w-full py-2.5 rounded-xl border border-[#2A2D31] bg-[#16181A] hover:bg-[#1E2124] hover:border-[#22C55E]/50 text-xs font-bold text-emerald-400 flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs active:scale-[0.99]"
                    >
                      <span>
                        See all {totalCount} products in {category.name}
                      </span>
                      <ChevronRight className="w-4 h-4 stroke-[2.5]" />
                    </button>
                  )}
                </section>
              ))}

              {continuousCategorySections.length === 0 && (
                <div className="py-20 text-center space-y-3">
                  <span className="text-4xl">🔍</span>
                  <h3 className="font-heading font-bold text-base text-white">
                    No products matching your search
                  </h3>
                  <p className="text-xs text-[#9AA0A6] max-w-xs mx-auto">
                    We couldn't find any groceries matching "{searchQuery}". Try searching for
                    another staple or clear filters.
                  </p>
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="px-4 py-2 rounded-full bg-[#22C55E] text-white text-xs font-bold hover:bg-emerald-600 cursor-pointer"
                  >
                    Reset Filters
                  </button>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* ── 4. Floating "View Cart" Bottom Pill ── */}
      {cart && cart.items && cart.items.length > 0 && (
        <div className="fixed bottom-[74px] lg:bottom-5 left-3 right-3 sm:left-6 sm:right-6 max-w-md mx-auto z-40 animate-slide-up">
          <button
            type="button"
            onClick={onOpenCart}
            className="w-full bg-[#22C55E] hover:bg-[#1ea750] active:scale-[0.985] text-white px-3.5 py-2.5 sm:px-4 sm:py-3 rounded-2xl shadow-xl flex items-center justify-between transition-all border border-emerald-400/40 cursor-pointer"
          >
            <div className="flex items-center gap-3 min-w-0">
              {latestCartItem?.imageUrl ? (
                <img
                  src={latestCartItem.imageUrl}
                  alt={latestCartItem.name}
                  className="w-10 h-10 rounded-xl object-cover bg-black/20 shrink-0 border border-white/20"
                />
              ) : (
                <div className="w-10 h-10 rounded-xl bg-black/20 flex items-center justify-center shrink-0">
                  <ShoppingBag className="w-5 h-5 text-white" />
                </div>
              )}
              <div className="text-left min-w-0">
                <p className="font-heading font-extrabold text-sm text-white leading-tight">
                  {cart.itemCount} {cart.itemCount === 1 ? 'item' : 'items'} · ₹
                  {Math.round((cart.pricing?.totalPaise ?? 0) / 100)}
                </p>
                <p className="text-[11px] text-emerald-100 font-medium truncate">
                  {latestCartItem?.name
                    ? `Added ${latestCartItem.name}`
                    : 'Next-day delivery guaranteed'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 font-bold text-xs uppercase tracking-wider bg-white/20 px-3 py-1.5 rounded-xl shrink-0 backdrop-blur-xs">
              <span>View Cart</span>
              <ChevronRight className="w-4 h-4 stroke-[2.5]" />
            </div>
          </button>
        </div>
      )}

      {/* ── 5. Bottom Sheet: Comprehensive Filters Modal ── */}
      {isFilterSheetOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="w-full sm:max-w-md max-h-[85vh] rounded-t-3xl sm:rounded-3xl bg-[#16181A] border border-[#2A2D31] flex flex-col shadow-2xl overflow-hidden animate-slide-up">
            {/* Modal Header */}
            <div className="p-4 border-b border-[#2A2D31] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-emerald-400" />
                <h3 className="font-heading font-bold text-base text-white">Filters</h3>
                {activeFilterCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-mono text-xs font-bold">
                    {activeFilterCount} active
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => setIsFilterSheetOpen(false)}
                className="w-8 h-8 rounded-full bg-[#1E2124] text-[#9AA0A6] hover:text-white flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 overflow-y-auto space-y-5 flex-1">
              {/* Sort Section */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#9AA0A6] uppercase tracking-wider">
                  Sort Products By
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'relevance', label: 'Relevance' },
                    { id: 'price_asc', label: 'Price: Low to High' },
                    { id: 'price_desc', label: 'Price: High to Low' },
                    { id: 'discount', label: 'Highest Discount' },
                    { id: 'rating', label: 'Customer Rating' },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setSortBy(opt.id as SortOption)}
                      className={`px-3 py-2 rounded-xl text-xs font-semibold text-left border transition-all cursor-pointer ${
                        sortBy === opt.id
                          ? 'border-[#22C55E] bg-[#22C55E]/15 text-emerald-400'
                          : 'border-[#2A2D31] bg-[#1E2124] text-[#9AA0A6] hover:text-white'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Range Section */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#9AA0A6] uppercase tracking-wider">
                  Price Range
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'all', label: 'All Prices' },
                    { id: 'under50', label: 'Under ₹50' },
                    { id: '50to100', label: '₹50 – ₹100' },
                    { id: '100to200', label: '₹100 – ₹200' },
                    { id: 'above200', label: 'Above ₹200' },
                  ].map((bucket) => (
                    <button
                      key={bucket.id}
                      type="button"
                      onClick={() => setSelectedPriceBucket(bucket.id as PriceBucket)}
                      className={`px-3 py-2 rounded-xl text-xs font-semibold text-left border transition-all cursor-pointer ${
                        selectedPriceBucket === bucket.id
                          ? 'border-[#22C55E] bg-[#22C55E]/15 text-emerald-400'
                          : 'border-[#2A2D31] bg-[#1E2124] text-[#9AA0A6] hover:text-white'
                      }`}
                    >
                      {bucket.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Brands Section */}
              {availableBrands.length > 0 && (
                <div className="space-y-2">
                  <label className="text-xs font-bold text-[#9AA0A6] uppercase tracking-wider">
                    Select Brands
                  </label>
                  <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                    {availableBrands.map(({ name, count }) => {
                      const isChecked = selectedBrands.includes(name);
                      return (
                        <button
                          key={name}
                          type="button"
                          onClick={() => {
                            setSelectedBrands((prev) =>
                              isChecked ? prev.filter((b) => b !== name) : [...prev, name]
                            );
                          }}
                          className={`w-full px-3 py-2 rounded-xl border flex items-center justify-between text-xs font-medium transition-colors cursor-pointer ${
                            isChecked
                              ? 'border-[#22C55E]/60 bg-[#22C55E]/10 text-emerald-400'
                              : 'border-[#2A2D31] bg-[#1E2124] text-[#F2F3F4] hover:border-stone-500'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-4 h-4 rounded border flex items-center justify-center ${
                                isChecked
                                  ? 'border-[#22C55E] bg-[#22C55E]'
                                  : 'border-[#2A2D31] bg-black/30'
                              }`}
                            >
                              {isChecked && <Check className="w-3 h-3 text-white stroke-[3]" />}
                            </div>
                            <span>{name}</span>
                          </div>
                          <span className="text-[#9AA0A6] font-mono text-[11px]">({count})</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-[#2A2D31] flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleResetFilters}
                className="px-4 py-2 rounded-xl text-xs font-bold text-rose-400 hover:text-rose-300"
              >
                Reset All
              </button>

              <button
                type="button"
                onClick={() => setIsFilterSheetOpen(false)}
                className="px-6 py-2.5 rounded-xl bg-[#22C55E] hover:bg-emerald-600 text-white font-heading font-extrabold text-xs shadow-md transition-all cursor-pointer"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 6. Bottom Sheet: Quick Sort Modal ── */}
      {isSortSheetOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="w-full sm:max-w-sm rounded-t-3xl sm:rounded-3xl bg-[#16181A] border border-[#2A2D31] p-4 space-y-3 shadow-2xl animate-slide-up">
            <div className="flex items-center justify-between pb-2 border-b border-[#2A2D31]">
              <h3 className="font-heading font-bold text-sm text-white">Sort By</h3>
              <button
                type="button"
                onClick={() => setIsSortSheetOpen(false)}
                className="w-7 h-7 rounded-full bg-[#1E2124] text-[#9AA0A6] hover:text-white flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1.5">
              {[
                { id: 'relevance', label: 'Relevance (Default)' },
                { id: 'price_asc', label: 'Price: Low to High' },
                { id: 'price_desc', label: 'Price: High to Low' },
                { id: 'discount', label: 'Highest Discount' },
                { id: 'rating', label: 'Top Customer Rating' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    setSortBy(opt.id as SortOption);
                    setIsSortSheetOpen(false);
                  }}
                  className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-semibold text-left border flex items-center justify-between transition-colors cursor-pointer ${
                    sortBy === opt.id
                      ? 'border-[#22C55E] bg-[#22C55E]/15 text-emerald-400'
                      : 'border-[#2A2D31] bg-[#1E2124] text-[#F2F3F4] hover:border-stone-500'
                  }`}
                >
                  <span>{opt.label}</span>
                  {sortBy === opt.id && <Check className="w-4 h-4 text-emerald-400 stroke-[2.5]" />}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── 7. Mini Sheet: Pack Size & Variants Modal ── */}
      {isPackSheetOpen && packSheetProduct && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="w-full sm:max-w-sm rounded-t-3xl sm:rounded-3xl bg-[#16181A] border border-[#2A2D31] p-4 space-y-4 shadow-2xl animate-slide-up">
            <div className="flex items-center justify-between pb-2 border-b border-[#2A2D31]">
              <div className="min-w-0 pr-2">
                <h3 className="font-heading font-bold text-sm text-white truncate">
                  {packSheetProduct.name}
                </h3>
                <p className="text-[11px] text-[#9AA0A6]">Select Pack Size / Quantity</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsPackSheetOpen(false);
                  setPackSheetProduct(null);
                }}
                className="w-7 h-7 rounded-full bg-[#1E2124] text-[#9AA0A6] hover:text-white flex items-center justify-center shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Default Variant */}
            <div className="space-y-2">
              <div className="p-3 rounded-2xl bg-[#1E2124] border border-[#22C55E]/60 flex items-center justify-between">
                <div>
                  <span className="font-heading font-bold text-sm text-white">
                    {packSheetProduct.packageSize} {packSheetProduct.packageUnit}
                  </span>
                  <div className="flex items-baseline gap-1.5 mt-0.5">
                    <span className="font-mono font-bold text-emerald-400 text-sm">
                      ₹{Math.round(packSheetProduct.pricePaise / 100)}
                    </span>
                    {packSheetProduct.mrpPaise && (
                      <span className="text-[10px] text-[#9AA0A6] line-through font-mono">
                        ₹{Math.round(packSheetProduct.mrpPaise / 100)}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {getCartQuantity(packSheetProduct._id) === 0 ? (
                    <button
                      type="button"
                      onClick={() => onAddToCart(packSheetProduct._id, 1)}
                      className="px-3.5 py-1.5 rounded-xl bg-[#22C55E] text-white font-heading font-extrabold text-xs shadow-sm hover:bg-emerald-600 transition-colors"
                    >
                      ADD
                    </button>
                  ) : (
                    <div className="flex items-center gap-1.5 bg-[#22C55E] text-white px-2 py-1 rounded-xl text-xs font-bold shadow-sm">
                      <button
                        type="button"
                        onClick={() =>
                          onUpdateQuantity(
                            packSheetProduct._id,
                            getCartQuantity(packSheetProduct._id) - 1
                          )
                        }
                        className="p-0.5"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="font-mono font-extrabold px-1">
                        {getCartQuantity(packSheetProduct._id)}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          onUpdateQuantity(
                            packSheetProduct._id,
                            getCartQuantity(packSheetProduct._id) + 1
                          )
                        }
                        className="p-0.5"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <p className="text-[10px] text-[#9AA0A6] text-center pt-1">
              Standard farm fresh packaging with 100% vegetarian quality guarantee.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

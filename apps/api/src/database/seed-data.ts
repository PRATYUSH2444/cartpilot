import { ProductCategory, PackageUnit } from '../modules/catalog/product.model.js';

export interface SeedProductInput {
  name: string;
  slug: string;
  description: string;
  category: ProductCategory;
  pricePaise: number; // In integer paise
  mrpPaise?: number; // Retail price before discount
  packageSize: number;
  packageUnit: PackageUnit;
  availableStock: number;
  aliases: string[];
  imageUrl?: string;
  brand?: string;
  subCategory?: string;
  rating?: number;
  reviewCount?: number;
}

export const SEED_MERCHANTS = [
  {
    businessName: 'Fresh Greens Organics',
    slug: 'fresh-greens-organics',
    description: 'Direct farm-fresh organic vegetables, dairy, and cold-pressed staples.',
    contactEmail: 'contact@freshgreens.in',
    contactPhone: '+91 98765 43210',
    isActive: true,
    rating: 4.9,
    address: {
      street: '14 Indiranagar 100ft Road',
      city: 'Bengaluru',
      state: 'Karnataka',
      postalCode: '560038',
    },
  },
  {
    businessName: 'Desi Kirana & Spices',
    slug: 'desi-kirana-spices',
    description: 'Traditional heritage grains, unpolished pulses, pure spices, and cow ghee.',
    contactEmail: 'orders@desikirana.in',
    contactPhone: '+91 98765 12345',
    isActive: true,
    rating: 4.8,
    address: {
      street: '42 Malleshwaram 8th Cross',
      city: 'Bengaluru',
      state: 'Karnataka',
      postalCode: '560003',
    },
  },
];

export const SEED_PRODUCTS_FRESH_GREENS: SeedProductInput[] = [
  // ── DAIRY & BREAKFAST ──────────────────────────────────────────
  {
    name: 'Fresh Malai Paneer',
    slug: 'fresh-malai-paneer-200g',
    description: 'Rich, soft, and vacuum-sealed cow milk cottage cheese block. 100% vegetarian.',
    category: 'DAIRY',
    brand: 'Amul',
    subCategory: 'Paneer & Tofu',
    pricePaise: 9500, // ₹95.00
    mrpPaise: 11500, // ₹115.00
    packageSize: 200,
    packageUnit: 'G',
    availableStock: 50,
    rating: 4.8,
    reviewCount: 1420,
    aliases: ['chenna', 'cottage cheese', 'fresh paneer', 'paneer block', 'malai paneer'],
    imageUrl: 'https://images.unsplash.com/photo-1589647363585-f4a7d3877b10?w=500',
  },
  {
    name: 'Fresh Malai Paneer (Family Pack)',
    slug: 'fresh-malai-paneer-500g',
    description: 'Extra value family pack of fresh creamy paneer for royal gravies and pulao.',
    category: 'DAIRY',
    brand: 'Amul',
    subCategory: 'Paneer & Tofu',
    pricePaise: 22000, // ₹220.00
    mrpPaise: 26000, // ₹260.00
    packageSize: 500,
    packageUnit: 'G',
    availableStock: 35,
    rating: 4.9,
    reviewCount: 890,
    aliases: ['paneer 500g', 'cottage cheese bulk', 'chenna 500g', 'big paneer'],
    imageUrl: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=500',
  },
  {
    name: 'Farm Fresh Cow Milk',
    slug: 'farm-fresh-cow-milk-1l',
    description: 'Pasteurized, homogenized whole cow milk, rich in calcium and vitamins.',
    category: 'DAIRY',
    brand: 'Amul Taaza',
    subCategory: 'Milk',
    pricePaise: 6800, // ₹68.00
    mrpPaise: 7500, // ₹75.00
    packageSize: 1,
    packageUnit: 'L',
    availableStock: 110,
    rating: 4.9,
    reviewCount: 3200,
    aliases: ['milk', 'cow milk', 'doodh', 'fresh milk', 'taaza doodh'],
    imageUrl: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=500',
  },
  {
    name: 'Amul Gold Full Cream Milk',
    slug: 'amul-gold-milk-1l',
    description: 'Rich full cream pasteurized milk with 6% fat, perfect for tea, coffee, and desserts.',
    category: 'DAIRY',
    brand: 'Amul Gold',
    subCategory: 'Milk',
    pricePaise: 7200, // ₹72.00
    mrpPaise: 7800, // ₹78.00
    packageSize: 1,
    packageUnit: 'L',
    availableStock: 80,
    rating: 4.9,
    reviewCount: 2450,
    aliases: ['amul gold', 'full cream milk', 'creamy milk', 'doodh amul'],
    imageUrl: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=500',
  },
  {
    name: 'Set Dahi / Curd (Pouch)',
    slug: 'set-dahi-curd-400g',
    description: 'Thick, creamy, traditional probiotic curd prepared with active cultures.',
    category: 'DAIRY',
    brand: 'Mother Dairy',
    subCategory: 'Curd & Dahi',
    pricePaise: 3500, // ₹35.00
    mrpPaise: 4200, // ₹42.00
    packageSize: 400,
    packageUnit: 'G',
    availableStock: 75,
    rating: 4.7,
    reviewCount: 650,
    aliases: ['dahi', 'curd', 'yogurt', 'fresh curd', 'plain yogurt'],
    imageUrl: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=500',
  },
  {
    name: 'Amul Salted Table Butter',
    slug: 'amul-salted-butter-100g',
    description: 'Utterly butterly delicious creamy pasteurized salted butter.',
    category: 'DAIRY',
    brand: 'Amul',
    subCategory: 'Butter & Cheese',
    pricePaise: 5800, // ₹58.00
    mrpPaise: 6200, // ₹62.00
    packageSize: 100,
    packageUnit: 'G',
    availableStock: 60,
    rating: 4.9,
    reviewCount: 2100,
    aliases: ['butter', 'makhan', 'amul butter', 'salted butter'],
    imageUrl: 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=500',
  },
  {
    name: 'Amul Butter (Family Pack)',
    slug: 'amul-salted-butter-500g',
    description: '500g economy family tub of iconic Indian salted butter.',
    category: 'DAIRY',
    brand: 'Amul',
    subCategory: 'Butter & Cheese',
    pricePaise: 27500, // ₹275.00
    mrpPaise: 29500, // ₹295.00
    packageSize: 500,
    packageUnit: 'G',
    availableStock: 40,
    rating: 4.9,
    reviewCount: 1600,
    aliases: ['amul butter 500g', 'makhan 500g', 'big butter'],
    imageUrl: 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=500',
  },
  {
    name: 'Amul Processed Cheese Slices',
    slug: 'amul-cheese-slices-200g',
    description: 'Individually wrapped cheese slices crafted from pure milk. 10 slices.',
    category: 'DAIRY',
    brand: 'Amul',
    subCategory: 'Butter & Cheese',
    pricePaise: 14500, // ₹145.00
    mrpPaise: 16500, // ₹165.00
    packageSize: 200,
    packageUnit: 'G',
    availableStock: 40,
    rating: 4.8,
    reviewCount: 980,
    aliases: ['cheese', 'cheese slices', 'amul cheese', 'sandwich cheese'],
    imageUrl: 'https://images.unsplash.com/photo-1618160702438-9b02ab6515c9?w=500',
  },

  // ── FRESH VEGETABLES ─────────────────────────────────────────────
  {
    name: 'Fresh Button Mushrooms',
    slug: 'fresh-button-mushrooms-200g',
    description: 'Firm, clean, whole white button mushrooms packed with umami flavor. 100% vegetarian.',
    category: 'VEGETABLES',
    brand: 'Fresho',
    subCategory: 'Exotics & Veg',
    pricePaise: 5000, // ₹50.00
    mrpPaise: 6500, // ₹65.00
    packageSize: 200,
    packageUnit: 'G',
    availableStock: 40,
    rating: 4.8,
    reviewCount: 590,
    aliases: ['mushroom', 'mushrooms', 'khumbi', 'button mushroom', 'white mushroom'],
    // 100% verified white button mushrooms photo (NOT steak!)
    imageUrl: 'https://images.unsplash.com/photo-1506806732259-39c2d0268443?w=500',
  },
  {
    name: 'Fresh Ginger Root (Adrak)',
    slug: 'fresh-ginger-root-250g',
    description: 'Aromatic, spicy, pesticide-free fresh ginger root rhizome for rich Indian tea and curries.',
    category: 'VEGETABLES',
    brand: 'Fresho',
    subCategory: 'Chillies & Garlic',
    pricePaise: 3000, // ₹30.00
    mrpPaise: 4000, // ₹40.00
    packageSize: 250,
    packageUnit: 'G',
    availableStock: 40,
    rating: 4.7,
    reviewCount: 820,
    aliases: ['adrak', 'ginger', 'fresh ginger', 'ginger root', 'saunth'],
    // 100% verified real ginger root photo (NOT broccoli!)
    imageUrl: 'https://images.unsplash.com/photo-1597362925123-77861d3fbac7?w=500',
  },
  {
    name: 'Farm Fresh Green Peas',
    slug: 'farm-fresh-green-peas-500g',
    description: 'Sweet, tender, hand-shelled organic green peas.',
    category: 'VEGETABLES',
    brand: 'Fresho',
    subCategory: 'Green Peas & Beans',
    pricePaise: 6000, // ₹60.00
    mrpPaise: 7500, // ₹75.00
    packageSize: 500,
    packageUnit: 'G',
    availableStock: 60,
    rating: 4.7,
    reviewCount: 520,
    aliases: ['matar', 'mutter', 'fresh peas', 'green peas', 'hari matar'],
    imageUrl: 'https://images.unsplash.com/photo-1515942400420-2b98fed1f515?w=500',
  },
  {
    name: 'Red Onions (Nashik Fresh)',
    slug: 'red-onions-nashik-1kg',
    description: 'Firm, pungent, top-grade red onions essential for Indian curries and pulao.',
    category: 'VEGETABLES',
    brand: 'Fresho',
    subCategory: 'Potatoes & Onions',
    pricePaise: 4500, // ₹45.00
    mrpPaise: 6000, // ₹60.00
    packageSize: 1,
    packageUnit: 'KG',
    availableStock: 100,
    rating: 4.8,
    reviewCount: 3800,
    aliases: ['pyaz', 'kanda', 'dungri', 'onion', 'onions', 'red onion', 'lal pyaz'],
    imageUrl: 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=500',
  },
  {
    name: 'Fresh Potatoes (Pahari)',
    slug: 'fresh-potatoes-1kg',
    description: 'High-starch hill potatoes, ideal for roasting, biryani, and curries.',
    category: 'VEGETABLES',
    brand: 'Fresho',
    subCategory: 'Potatoes & Onions',
    pricePaise: 3500, // ₹35.00
    mrpPaise: 4500, // ₹45.00
    packageSize: 1,
    packageUnit: 'KG',
    availableStock: 80,
    rating: 4.7,
    reviewCount: 2900,
    aliases: ['aloo', 'batata', 'potato', 'potatoes', 'pahari aloo'],
    imageUrl: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=500',
  },
  {
    name: 'Country Tomatoes (Nati)',
    slug: 'country-tomatoes-1kg',
    description: 'Juicy, slightly tangy regional heirloom tomatoes.',
    category: 'VEGETABLES',
    brand: 'Fresho',
    subCategory: 'Tomatoes',
    pricePaise: 4000, // ₹40.00
    mrpPaise: 5500, // ₹55.00
    packageSize: 1,
    packageUnit: 'KG',
    availableStock: 75,
    rating: 4.8,
    reviewCount: 3100,
    aliases: ['tamatar', 'tomato', 'tomatoes', 'nati tamatar'],
    imageUrl: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=500',
  },
  {
    name: 'Organic Garlic Bulbs',
    slug: 'organic-garlic-bulbs-250g',
    description: 'Strong, flavorful Indian garlic cloves with intense aroma.',
    category: 'VEGETABLES',
    brand: 'Fresho',
    subCategory: 'Chillies & Garlic',
    pricePaise: 5000, // ₹50.00
    mrpPaise: 6500, // ₹65.00
    packageSize: 250,
    packageUnit: 'G',
    availableStock: 45,
    rating: 4.7,
    reviewCount: 810,
    aliases: ['lehsun', 'lasun', 'garlic', 'garlic bulbs', 'desi lehsun'],
    imageUrl: 'https://images.unsplash.com/photo-1615477039956-65e94bcf9326?w=500',
  },
  {
    name: 'Fresh Mint Leaves (Pudina)',
    slug: 'fresh-mint-leaves-100g',
    description: 'Crisp and refreshing mint leaves for garnishing pulao and raita.',
    category: 'VEGETABLES',
    brand: 'Fresho',
    subCategory: 'Leafy Greens',
    pricePaise: 1500, // ₹15.00
    mrpPaise: 2000, // ₹20.00
    packageSize: 100,
    packageUnit: 'G',
    availableStock: 30,
    rating: 4.8,
    reviewCount: 390,
    aliases: ['pudina', 'mint', 'mint leaves', 'fresh pudina'],
    imageUrl: 'https://images.unsplash.com/photo-1608686207856-001b95cf60ca?w=500',
  },
  {
    name: 'Fresh Coriander Leaves (Dhaniya)',
    slug: 'fresh-coriander-leaves-100g',
    description: 'Farm fresh fragrant cilantro bunch with vibrant green leaves.',
    category: 'VEGETABLES',
    brand: 'Fresho',
    subCategory: 'Leafy Greens',
    pricePaise: 1500, // ₹15.00
    mrpPaise: 2000, // ₹20.00
    packageSize: 100,
    packageUnit: 'G',
    availableStock: 30,
    rating: 4.9,
    reviewCount: 1600,
    aliases: ['dhaniya', 'dhaniya patta', 'coriander', 'cilantro', 'kothmir'],
    imageUrl: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=500',
  },
  {
    name: 'Green Chillies (Teja)',
    slug: 'green-chillies-200g',
    description: 'Pungent and spicy fresh green chillies.',
    category: 'VEGETABLES',
    brand: 'Fresho',
    subCategory: 'Chillies & Garlic',
    pricePaise: 2000, // ₹20.00
    mrpPaise: 2800, // ₹28.00
    packageSize: 200,
    packageUnit: 'G',
    availableStock: 40,
    rating: 4.7,
    reviewCount: 540,
    aliases: ['hari mirch', 'green chillies', 'mirchi', 'spicy chilli'],
    imageUrl: 'https://images.unsplash.com/photo-1568584711075-3d021a7c3ca3?w=500',
  },
  {
    name: 'Baby Spinach (Palak Fresh)',
    slug: 'baby-spinach-palak-250g',
    description: 'Tender, hydroponically washed iron-rich green spinach leaves.',
    category: 'VEGETABLES',
    brand: 'Fresho',
    subCategory: 'Leafy Greens',
    pricePaise: 2500, // ₹25.00
    mrpPaise: 3500, // ₹35.00
    packageSize: 250,
    packageUnit: 'G',
    availableStock: 50,
    rating: 4.8,
    reviewCount: 890,
    aliases: ['palak', 'spinach', 'hari palak', 'green spinach', 'palak saag'],
    imageUrl: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=500',
  },
  {
    name: 'Fresh Ladyfinger (Bhindi)',
    slug: 'fresh-ladyfinger-bhindi-500g',
    description: 'Tender, crisp, dark green okra pods ideal for crispy bhindi fry.',
    category: 'VEGETABLES',
    brand: 'Fresho',
    subCategory: 'Exotics & Veg',
    pricePaise: 3800, // ₹38.00
    mrpPaise: 4800, // ₹48.00
    packageSize: 500,
    packageUnit: 'G',
    availableStock: 45,
    rating: 4.7,
    reviewCount: 710,
    aliases: ['bhindi', 'okra', 'ladyfinger', 'lady finger', 'dhendras'],
    imageUrl: 'https://images.unsplash.com/photo-1625944525533-473f1a3d54e7?w=500',
  },
  {
    name: 'Red Sweet Carrots (Gajar)',
    slug: 'red-sweet-carrots-500g',
    description: 'Juicy, deep red winter carrots perfect for halwa, salads, and curries.',
    category: 'VEGETABLES',
    brand: 'Fresho',
    subCategory: 'Root Veg',
    pricePaise: 3200, // ₹32.00
    mrpPaise: 4200, // ₹42.00
    packageSize: 500,
    packageUnit: 'G',
    availableStock: 55,
    rating: 4.8,
    reviewCount: 620,
    aliases: ['gajar', 'carrot', 'carrots', 'red carrot', 'gajar halwa'],
    imageUrl: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=500',
  },
  {
    name: 'Fresh Cauliflower (Phool Gobi)',
    slug: 'fresh-cauliflower-1pc',
    description: 'Tender, dense white cauliflower head fresh from local farms.',
    category: 'VEGETABLES',
    brand: 'Fresho',
    subCategory: 'Exotics & Veg',
    pricePaise: 4000, // ₹40.00
    mrpPaise: 5000, // ₹50.00
    packageSize: 1,
    packageUnit: 'PIECE',
    availableStock: 50,
    rating: 4.7,
    reviewCount: 430,
    aliases: ['cauliflower', 'gobi', 'phool gobi', 'gobhi'],
    imageUrl: 'https://images.unsplash.com/photo-1568584711075-3d021a7c3ca3?w=500',
  },
  {
    name: 'Fresh Green Capsicum (Shimla Mirch)',
    slug: 'fresh-green-capsicum-500g',
    description: 'Crisp bell peppers rich in vitamins, great for kadai paneer and noodles.',
    category: 'VEGETABLES',
    brand: 'Fresho',
    subCategory: 'Exotics & Veg',
    pricePaise: 4500, // ₹45.00
    mrpPaise: 6000, // ₹60.00
    packageSize: 500,
    packageUnit: 'G',
    availableStock: 40,
    rating: 4.8,
    reviewCount: 510,
    aliases: ['capsicum', 'shimla mirch', 'green pepper', 'bell pepper'],
    imageUrl: 'https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?w=500',
  },
  {
    name: 'Fresh Juicy Lemons (Pack of 4)',
    slug: 'fresh-juicy-lemons-4pcs',
    description: 'Zesty, vitamin C-packed yellow lemons for salads, dal, and lemonade.',
    category: 'VEGETABLES',
    brand: 'Fresho',
    subCategory: 'Tomatoes',
    pricePaise: 2000, // ₹20.00
    mrpPaise: 3000, // ₹30.00
    packageSize: 4,
    packageUnit: 'PIECE',
    availableStock: 70,
    rating: 4.8,
    reviewCount: 880,
    aliases: ['nimbu', 'lemon', 'lemons', 'citrus nimbu'],
    imageUrl: 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=500',
  },

  // ── FRESH FRUITS ─────────────────────────────────────────────────
  {
    name: 'Shimla Fresh Royal Apples',
    slug: 'shimla-fresh-royal-apples-1kg',
    description: 'Crisp, sweet, hand-picked mountain apples from Himachal orchards.',
    category: 'FRUITS_VEGETABLES',
    brand: 'Nature Choice',
    subCategory: 'Apples & Pears',
    pricePaise: 18000, // ₹180.00
    mrpPaise: 22000, // ₹220.00
    packageSize: 1,
    packageUnit: 'KG',
    availableStock: 65,
    rating: 4.8,
    reviewCount: 1540,
    aliases: ['apple', 'apples', 'seb', 'shimla seb', 'red apples', 'fresh apples'],
    imageUrl: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=500',
  },
  {
    name: 'Cavendish Bananas (Robusta)',
    slug: 'cavendish-bananas-1kg',
    description: 'Naturally ripened, nutrient-dense sweet dessert bananas.',
    category: 'FRUITS_VEGETABLES',
    brand: 'Nature Choice',
    subCategory: 'Bananas',
    pricePaise: 5500, // ₹55.00
    mrpPaise: 7000, // ₹70.00
    packageSize: 1,
    packageUnit: 'KG',
    availableStock: 90,
    rating: 4.7,
    reviewCount: 2200,
    aliases: ['banana', 'bananas', 'kela', 'ripe bananas', 'paka kela', 'robusta'],
    imageUrl: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=500',
  },
  {
    name: 'Fresh Green Seedless Grapes',
    slug: 'fresh-green-grapes-500g',
    description: 'Crisp, tangy-sweet Thomson seedless green grapes.',
    category: 'FRUITS_VEGETABLES',
    brand: 'Nature Choice',
    subCategory: 'Grapes',
    pricePaise: 8500, // ₹85.00
    mrpPaise: 11000, // ₹110.00
    packageSize: 500,
    packageUnit: 'G',
    availableStock: 45,
    rating: 4.8,
    reviewCount: 630,
    aliases: ['grapes', 'green grapes', 'angoor', 'seedless grapes'],
    imageUrl: 'https://images.unsplash.com/photo-1596363505729-4190a9506133?w=500',
  },
  {
    name: 'Sweet Nagpur Oranges',
    slug: 'sweet-nagpur-oranges-1kg',
    description: 'Juicy, easy-peel citrus oranges rich in Vitamin C.',
    category: 'FRUITS_VEGETABLES',
    brand: 'Nature Choice',
    subCategory: 'Citrus',
    pricePaise: 8000, // ₹80.00
    mrpPaise: 10000, // ₹100.00
    packageSize: 1,
    packageUnit: 'KG',
    availableStock: 50,
    rating: 4.6,
    reviewCount: 480,
    aliases: ['orange', 'oranges', 'santara', 'nagpur santra', 'citrus'],
    imageUrl: 'https://images.unsplash.com/photo-1547514701-42782101795e?w=500',
  },
  {
    name: 'Fresh Ruby Pomegranate (Anar)',
    slug: 'fresh-ruby-pomegranate-1kg',
    description: 'Dark ruby red arils bursting with sweet antioxidant-rich juice.',
    category: 'FRUITS_VEGETABLES',
    brand: 'Nature Choice',
    subCategory: 'Exotics & Melons',
    pricePaise: 16000, // ₹160.00
    mrpPaise: 19500, // ₹195.00
    packageSize: 1,
    packageUnit: 'KG',
    availableStock: 40,
    rating: 4.9,
    reviewCount: 790,
    aliases: ['pomegranate', 'anar', 'ruby anar', 'pom'],
    imageUrl: 'https://images.unsplash.com/photo-1541344999736-83eca872f241?w=500',
  },
  {
    name: 'Thai Guava (Amrood)',
    slug: 'thai-guava-amrood-500g',
    description: 'Crunchy, sweet white-flesh Thai guava with subtle tropical fragrance.',
    category: 'FRUITS_VEGETABLES',
    brand: 'Nature Choice',
    subCategory: 'Citrus & Guava',
    pricePaise: 6000, // ₹60.00
    mrpPaise: 7500, // ₹75.00
    packageSize: 500,
    packageUnit: 'G',
    availableStock: 35,
    rating: 4.7,
    reviewCount: 310,
    aliases: ['guava', 'amrood', 'thai guava', 'peru'],
    imageUrl: 'https://images.unsplash.com/photo-1536511135899-70530737ee9c?w=500',
  },
  {
    name: 'Ripe Honey Papaya',
    slug: 'ripe-honey-papaya-1pc',
    description: 'Naturally tree-ripened sweet yellow papaya with tender juicy flesh.',
    category: 'FRUITS_VEGETABLES',
    brand: 'Nature Choice',
    subCategory: 'Exotics & Melons',
    pricePaise: 6500, // ₹65.00
    mrpPaise: 8000, // ₹80.00
    packageSize: 1,
    packageUnit: 'PIECE',
    availableStock: 30,
    rating: 4.7,
    reviewCount: 290,
    aliases: ['papaya', 'papita', 'papeeta', 'honey papaya'],
    imageUrl: 'https://images.unsplash.com/photo-1517282009859-f000ec3b26fe?w=500',
  },

  // ── BEVERAGES ────────────────────────────────────────────────────
  {
    name: 'Cold Pressed Valencia Orange Juice',
    slug: 'valencia-orange-juice-300ml',
    description: '100% pure squeezed orange juice with pulp. Zero added sugar or preservatives.',
    category: 'COLD_DRINKS_JUICES',
    brand: 'Raw Pressery',
    subCategory: 'Fresh Juices',
    pricePaise: 9900, // ₹99.00
    mrpPaise: 12000, // ₹120.00
    packageSize: 300,
    packageUnit: 'ML',
    availableStock: 50,
    rating: 4.8,
    reviewCount: 610,
    aliases: ['orange juice', 'fresh juice', 'juice', 'santre ka juice', 'cold pressed juice'],
    imageUrl: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?w=500',
  },
  {
    name: 'Natural Tender Coconut Water',
    slug: 'tender-coconut-water-200ml',
    description: 'Refreshing isotonic natural coconut water harvested fresh from coastal farms.',
    category: 'COLD_DRINKS_JUICES',
    brand: 'Paper Boat',
    subCategory: 'Tender Coconut',
    pricePaise: 5000, // ₹50.00
    mrpPaise: 6000, // ₹60.00
    packageSize: 200,
    packageUnit: 'ML',
    availableStock: 80,
    rating: 4.9,
    reviewCount: 1450,
    aliases: ['nariyal pani', 'coconut water', 'tender coconut', 'elaneer'],
    imageUrl: 'https://images.unsplash.com/photo-1525385133512-2f3bdd039054?w=500',
  },

  // ── BAKERY ───────────────────────────────────────────────────────
  {
    name: 'Whole Wheat Brown Bread',
    slug: 'whole-wheat-brown-bread-400g',
    description: 'Soft, stone-ground 100% whole wheat bakery sliced loaf. 100% eggless.',
    category: 'BAKERY',
    brand: 'The Health Factory',
    subCategory: 'Brown Bread',
    pricePaise: 4500, // ₹45.00
    mrpPaise: 5000, // ₹50.00
    packageSize: 400,
    packageUnit: 'G',
    availableStock: 60,
    rating: 4.8,
    reviewCount: 1100,
    aliases: ['bread', 'brown bread', 'wheat bread', 'sliced bread', 'eggless bread'],
    imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=500',
  },
  {
    name: 'Eggless Butter Pav (Pack of 6)',
    slug: 'eggless-butter-pav-6pcs',
    description: 'Pillow-soft bakery pav buns baked fresh daily for pav bhaji and vada pav.',
    category: 'BAKERY',
    brand: 'Fresh Baker',
    subCategory: 'Pav & Buns',
    pricePaise: 3500, // ₹35.00
    mrpPaise: 4000, // ₹40.00
    packageSize: 6,
    packageUnit: 'PIECE',
    availableStock: 50,
    rating: 4.7,
    reviewCount: 780,
    aliases: ['pav', 'buns', 'bread pav', 'pav bhaji buns', 'eggless pav'],
    imageUrl: 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=500',
  },
];

export const SEED_PRODUCTS_DESI_KIRANA: SeedProductInput[] = [
  // ── ATTA, SATTU, BESAN, MAIDA, RICE & DALS (Staples) ─────────────
  {
    name: 'Chakki Whole Wheat Atta',
    slug: 'chakki-whole-wheat-atta-5kg',
    description: '100% whole grain wheat flour ground slowly to retain bran and natural sweetness.',
    category: 'GRAINS',
    brand: 'Aashirvaad',
    subCategory: 'Whole Wheat Atta',
    pricePaise: 24500, // ₹245.00
    mrpPaise: 28500, // ₹285.00
    packageSize: 5,
    packageUnit: 'KG',
    availableStock: 60,
    rating: 4.9,
    reviewCount: 4200,
    aliases: ['atta', 'gehun atta', 'wheat flour', 'chakki atta', 'roti flour', 'aashirvaad atta'],
    imageUrl: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=500',
  },
  {
    name: 'Pure Chana Sattu (Bihari Style)',
    slug: 'pure-chana-sattu-500g',
    description: 'Authentic stone-ground roasted Bengal gram flour, superfood for summer sherbet and litti.',
    category: 'GRAINS',
    brand: 'Desi Naturals',
    subCategory: 'Whole Wheat Atta',
    pricePaise: 9500, // ₹95.00
    mrpPaise: 12000, // ₹120.00
    packageSize: 500,
    packageUnit: 'G',
    availableStock: 55,
    rating: 4.9,
    reviewCount: 1850,
    aliases: ['sattu', 'chana sattu', 'roasted gram flour', 'sattu powder', 'bihari sattu'],
    imageUrl: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=500',
  },
  {
    name: 'Pure Chana Besan (Super Fine)',
    slug: 'pure-chana-besan-500g',
    description: '100% pure unadulterated split chickpea flour for pakodas, kadhi, and laddoos.',
    category: 'GRAINS',
    brand: 'Fortune',
    subCategory: 'Whole Wheat Atta',
    pricePaise: 6500, // ₹65.00
    mrpPaise: 8000, // ₹80.00
    packageSize: 500,
    packageUnit: 'G',
    availableStock: 65,
    rating: 4.8,
    reviewCount: 1400,
    aliases: ['besan', 'chana besan', 'gram flour', 'chickpea flour'],
    imageUrl: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=500',
  },
  {
    name: 'Premium Maida (All-Purpose Flour)',
    slug: 'premium-maida-flour-1kg',
    description: 'Finely milled refined wheat flour for crisp samosas, bhature, and baking.',
    category: 'GRAINS',
    brand: 'Fortune',
    subCategory: 'Whole Wheat Atta',
    pricePaise: 4800, // ₹48.00
    mrpPaise: 5800, // ₹58.00
    packageSize: 1,
    packageUnit: 'KG',
    availableStock: 50,
    rating: 4.7,
    reviewCount: 890,
    aliases: ['maida', 'refined flour', 'all purpose flour', 'maida flour'],
    imageUrl: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=500',
  },
  {
    name: 'Roasted Sooji / Rava (Semolina)',
    slug: 'roasted-sooji-rava-500g',
    description: 'Coarse durum wheat semolina roasted to golden perfection for halwa and upma.',
    category: 'GRAINS',
    brand: 'Fortune',
    subCategory: 'Whole Wheat Atta',
    pricePaise: 4500, // ₹45.00
    mrpPaise: 5500, // ₹55.00
    packageSize: 500,
    packageUnit: 'G',
    availableStock: 60,
    rating: 4.8,
    reviewCount: 740,
    aliases: ['sooji', 'suji', 'rava', 'semolina'],
    imageUrl: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=500',
  },
  {
    name: 'Royal Aged Basmati Rice',
    slug: 'royal-aged-basmati-rice-1kg',
    description: 'Extra-long grain aromatic aged basmati rice for pulao and biryani.',
    category: 'GRAINS',
    brand: 'India Gate',
    subCategory: 'Basmati Rice',
    pricePaise: 14000, // ₹140.00
    mrpPaise: 17500, // ₹175.00
    packageSize: 1,
    packageUnit: 'KG',
    availableStock: 120,
    rating: 4.9,
    reviewCount: 3100,
    aliases: ['chawal', 'biryani rice', 'basmati', 'pulao rice', 'rice', 'long grain rice'],
    imageUrl: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=500',
  },
  {
    name: 'Thick Poha (Flattened Rice)',
    slug: 'thick-poha-flattened-rice-1kg',
    description: 'Clean, uniformly flattened rice flakes for quick breakfast Kanda Poha.',
    category: 'GRAINS',
    brand: 'Fortune',
    subCategory: 'Grains & Poha',
    pricePaise: 6500, // ₹65.00
    mrpPaise: 8000, // ₹80.00
    packageSize: 1,
    packageUnit: 'KG',
    availableStock: 70,
    rating: 4.8,
    reviewCount: 930,
    aliases: ['poha', 'flattened rice', 'chivda', 'kanda poha flakes'],
    imageUrl: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=500',
  },

  // ── DALS & PULSES ────────────────────────────────────────────────
  {
    name: 'Unpolished Toor Dal',
    slug: 'unpolished-toor-dal-1kg',
    description: 'Chemical-free yellow split pigeon peas, quick-cooking for delicious sambar & dal tadka.',
    category: 'PULSES',
    brand: 'Tata Sampann',
    subCategory: 'Toor & Moong Dal',
    pricePaise: 16500, // ₹165.00
    mrpPaise: 19500, // ₹195.00
    packageSize: 1,
    packageUnit: 'KG',
    availableStock: 85,
    rating: 4.9,
    reviewCount: 2400,
    aliases: ['toor dal', 'arhar dal', 'tuvar dal', 'yellow pigeon peas', 'dal'],
    imageUrl: 'https://images.unsplash.com/photo-1585994192701-f1a505c817ea?w=500',
  },
  {
    name: 'Dhuli Moong Dal',
    slug: 'dhuli-moong-dal-1kg',
    description: 'Light, protein-packed yellow split moong dal for easy digestion and khichdi.',
    category: 'PULSES',
    brand: 'Tata Sampann',
    subCategory: 'Toor & Moong Dal',
    pricePaise: 13000, // ₹130.00
    mrpPaise: 15500, // ₹155.00
    packageSize: 1,
    packageUnit: 'KG',
    availableStock: 65,
    rating: 4.8,
    reviewCount: 1650,
    aliases: ['moong dal', 'yellow moong', 'moong dhuli', 'split mung'],
    imageUrl: 'https://images.unsplash.com/photo-1599940824399-b87987ceb72a?w=500',
  },
  {
    name: 'Desi Chana Dal',
    slug: 'desi-chana-dal-1kg',
    description: 'Premium split Bengal gram dal with high dietary fiber and rich nutty taste.',
    category: 'PULSES',
    brand: 'Tata Sampann',
    subCategory: 'Toor & Moong Dal',
    pricePaise: 11000, // ₹110.00
    mrpPaise: 13000, // ₹130.00
    packageSize: 1,
    packageUnit: 'KG',
    availableStock: 55,
    rating: 4.7,
    reviewCount: 810,
    aliases: ['chana dal', 'bengal gram', 'split chickpeas', 'dal chana'],
    imageUrl: 'https://images.unsplash.com/photo-1514733670139-4d87a1941d55?w=500',
  },
  {
    name: 'Dhuli Urad Dal (White Split)',
    slug: 'dhuli-urad-dal-1kg',
    description: 'Husked split black gram dal for crispy medu vada, dosa batter, and dal makhani.',
    category: 'PULSES',
    brand: 'Tata Sampann',
    subCategory: 'Toor & Moong Dal',
    pricePaise: 14500, // ₹145.00
    mrpPaise: 17000, // ₹170.00
    packageSize: 1,
    packageUnit: 'KG',
    availableStock: 50,
    rating: 4.8,
    reviewCount: 920,
    aliases: ['urad dal', 'white urad', 'urad dhuli', 'split black gram'],
    imageUrl: 'https://images.unsplash.com/photo-1585994192701-f1a505c817ea?w=500',
  },
  {
    name: 'Desi Kala Chana (Brown Chickpeas)',
    slug: 'desi-kala-chana-1kg',
    description: 'High-protein small brown chickpeas ideal for spicy sukha chana and prasad.',
    category: 'PULSES',
    brand: 'Tata Sampann',
    subCategory: 'Toor & Moong Dal',
    pricePaise: 10500, // ₹105.00
    mrpPaise: 12500, // ₹125.00
    packageSize: 1,
    packageUnit: 'KG',
    availableStock: 60,
    rating: 4.8,
    reviewCount: 1100,
    aliases: ['kala chana', 'black chana', 'brown chickpeas', 'chana'],
    imageUrl: 'https://images.unsplash.com/photo-1514733670139-4d87a1941d55?w=500',
  },
  {
    name: 'Chitra Rajma (Himalayan Red Beans)',
    slug: 'chitra-rajma-1kg',
    description: 'Speckled Kashmiri rajma beans that melt in your mouth for iconic Rajma Chawal.',
    category: 'PULSES',
    brand: 'Tata Sampann',
    subCategory: 'Toor & Moong Dal',
    pricePaise: 18000, // ₹180.00
    mrpPaise: 21500, // ₹215.00
    packageSize: 1,
    packageUnit: 'KG',
    availableStock: 50,
    rating: 4.9,
    reviewCount: 1950,
    aliases: ['rajma', 'red kidney beans', 'chitra rajma', 'rajma beans'],
    imageUrl: 'https://images.unsplash.com/photo-1514733670139-4d87a1941d55?w=500',
  },

  // ── OILS & GHEE ──────────────────────────────────────────────────
  {
    name: 'Pure Desi Cow Ghee',
    slug: 'pure-desi-cow-ghee-500ml',
    description: 'Traditional bilona churned A2 cow milk ghee, rich golden granular texture.',
    category: 'OILS',
    brand: 'Amul',
    subCategory: 'Cow Ghee',
    pricePaise: 36000, // ₹360.00
    mrpPaise: 41000, // ₹410.00
    packageSize: 500,
    packageUnit: 'ML',
    availableStock: 40,
    rating: 4.9,
    reviewCount: 3800,
    aliases: ['ghee', 'cow ghee', 'shuddha ghee', 'deshi ghee', 'clarified butter'],
    imageUrl: 'https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=500',
  },
  {
    name: 'Cold Pressed Kachi Ghani Mustard Oil',
    slug: 'cold-pressed-mustard-oil-1l',
    description: 'Pure mustard oil extracted with wooden kolhu for authentic pungent aroma.',
    category: 'OILS',
    brand: 'Fortune',
    subCategory: 'Mustard Oil',
    pricePaise: 18000, // ₹180.00
    mrpPaise: 21000, // ₹210.00
    packageSize: 1,
    packageUnit: 'L',
    availableStock: 50,
    rating: 4.8,
    reviewCount: 2200,
    aliases: ['sarson tel', 'mustard oil', 'kachi ghani', 'cooking oil'],
    imageUrl: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=500',
  },
  {
    name: 'Fortune Sunlite Refined Sunflower Oil',
    slug: 'fortune-sunflower-oil-1l',
    description: 'Light, healthy refined sunflower oil enriched with vitamins A & D for daily cooking.',
    category: 'OILS',
    brand: 'Fortune',
    subCategory: 'Mustard Oil',
    pricePaise: 14500, // ₹145.00
    mrpPaise: 17000, // ₹170.00
    packageSize: 1,
    packageUnit: 'L',
    availableStock: 55,
    rating: 4.7,
    reviewCount: 1600,
    aliases: ['sunflower oil', 'refined oil', 'cooking oil', 'tel'],
    imageUrl: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=500',
  },

  // ── SPICES & SALTS ───────────────────────────────────────────────
  {
    name: 'Whole Cumin Seeds (Jeera)',
    slug: 'whole-cumin-seeds-100g',
    description: 'Bold, unadulterated Rajasthani whole cumin seeds for fragrant tadka.',
    category: 'SPICES',
    brand: 'Catch',
    subCategory: 'Whole Spices',
    pricePaise: 4500, // ₹45.00
    mrpPaise: 5500, // ₹55.00
    packageSize: 100,
    packageUnit: 'G',
    availableStock: 80,
    rating: 4.8,
    reviewCount: 1400,
    aliases: ['jeera', 'zeera', 'cumin', 'cumin seeds', 'whole cumin'],
    imageUrl: 'https://images.unsplash.com/photo-1607672632458-9eb56696346b?w=500',
  },
  {
    name: 'Pure Salem Turmeric Powder',
    slug: 'salem-turmeric-powder-200g',
    description: 'High curcumin content, aromatic golden yellow ground turmeric.',
    category: 'SPICES',
    brand: 'Catch',
    subCategory: 'Powdered Masala',
    pricePaise: 4000, // ₹40.00
    mrpPaise: 4800, // ₹48.00
    packageSize: 200,
    packageUnit: 'G',
    availableStock: 90,
    rating: 4.9,
    reviewCount: 1900,
    aliases: ['haldi', 'haldi powder', 'turmeric', 'turmeric powder'],
    imageUrl: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=500',
  },
  {
    name: 'Kashmiri Red Chilli Powder',
    slug: 'kashmiri-red-chilli-powder-100g',
    description: 'Vibrant natural crimson red color with mild gentle warmth.',
    category: 'SPICES',
    brand: 'MDH',
    subCategory: 'Powdered Masala',
    pricePaise: 5500, // ₹55.00
    mrpPaise: 6800, // ₹68.00
    packageSize: 100,
    packageUnit: 'G',
    availableStock: 70,
    rating: 4.9,
    reviewCount: 2700,
    aliases: ['lal mirch', 'mirchi powder', 'kashmiri mirch', 'red chilli powder'],
    imageUrl: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=500',
  },
  {
    name: 'Royal Shahi Garam Masala',
    slug: 'royal-shahi-garam-masala-100g',
    description: 'Master blend of cinnamon, black cardamom, cloves, mace, and star anise.',
    category: 'SPICES',
    brand: 'Everest',
    subCategory: 'Powdered Masala',
    pricePaise: 7500, // ₹75.00
    mrpPaise: 9000, // ₹90.00
    packageSize: 100,
    packageUnit: 'G',
    availableStock: 50,
    rating: 4.8,
    reviewCount: 1560,
    aliases: ['garam masala', 'khada masala', 'pulao masala', 'biryani masala', 'all spice blend'],
    imageUrl: 'https://images.unsplash.com/photo-1532336414038-cf19250c5757?w=500',
  },
  {
    name: 'Tata Salt Vacuum Evaporated Iodized Salt',
    slug: 'tata-salt-iodized-1kg',
    description: 'Desh ka namak, vacuum evaporated pure white iodized salt for good health.',
    category: 'SPICES',
    brand: 'Tata Salt',
    subCategory: 'Organic Staples',
    pricePaise: 2800, // ₹28.00
    mrpPaise: 3000, // ₹30.00
    packageSize: 1,
    packageUnit: 'KG',
    availableStock: 120,
    rating: 4.9,
    reviewCount: 6500,
    aliases: ['namak', 'salt', 'tata namak', 'iodized salt'],
    imageUrl: 'https://images.unsplash.com/photo-1518110925495-5fe2fda0442c?w=500',
  },
  {
    name: 'Pink Himalayan Rock Salt (Sendha Namak)',
    slug: 'pink-himalayan-rock-salt-1kg',
    description: 'Unrefined mineral-rich crushed rock salt ideal for daily cooking and fasting.',
    category: 'SPICES',
    brand: 'Tata Salt',
    subCategory: 'Organic Staples',
    pricePaise: 6500, // ₹65.00
    mrpPaise: 8500, // ₹85.00
    packageSize: 1,
    packageUnit: 'KG',
    availableStock: 80,
    rating: 4.8,
    reviewCount: 1800,
    aliases: ['salt', 'sendha namak', 'rock salt', 'pink salt', 'namak'],
    imageUrl: 'https://images.unsplash.com/photo-1518110925495-5fe2fda0442c?w=500',
  },
  {
    name: 'Pure Raw Forest Honey',
    slug: 'pure-raw-forest-honey-250g',
    description: 'Unpasteurized wild multifloral organic honey straight from Himalayan hives.',
    category: 'SPICES',
    brand: 'Organic India',
    subCategory: 'Organic Staples',
    pricePaise: 19500, // ₹195.00
    mrpPaise: 24000, // ₹240.00
    packageSize: 250,
    packageUnit: 'G',
    availableStock: 40,
    rating: 4.9,
    reviewCount: 1200,
    aliases: ['honey', 'shahad', 'madhu', 'raw honey', 'forest honey'],
    imageUrl: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=500',
  },

  // ── SNACKS & DRY FRUITS ───────────────────────────────────────────
  {
    name: 'Roasted Peri Peri Makhana',
    slug: 'roasted-peri-peri-makhana-100g',
    description: 'Crunchy Himalayan foxnuts lightly roasted in olive oil with zesty peri peri spices.',
    category: 'SNACKS_MUNCHIES',
    brand: 'Farmley',
    subCategory: 'Makhana',
    pricePaise: 9500, // ₹95.00
    mrpPaise: 12500, // ₹125.00
    packageSize: 100,
    packageUnit: 'G',
    availableStock: 70,
    rating: 4.7,
    reviewCount: 880,
    aliases: ['makhana', 'foxnuts', 'roasted makhana', 'healthy snacks', 'phool makhana'],
    imageUrl: 'https://images.unsplash.com/photo-1599490659213-e2b9527bd087?w=500',
  },
  {
    name: 'Gujarati Methi Khakhra (Crispy)',
    slug: 'gujarati-methi-khakhra-200g',
    description: 'Traditional thin roasted whole wheat crisps seasoned with fenugreek and spices.',
    category: 'SNACKS_MUNCHIES',
    brand: 'Chheda',
    subCategory: 'Khakhra',
    pricePaise: 6500, // ₹65.00
    mrpPaise: 7500, // ₹75.00
    packageSize: 200,
    packageUnit: 'G',
    availableStock: 55,
    rating: 4.8,
    reviewCount: 650,
    aliases: ['khakhra', 'methi khakhra', 'roasted snack', 'gujarati snacks', 'dry roti'],
    imageUrl: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=500',
  },
  {
    name: 'California Almonds (Badam Giri)',
    slug: 'california-almonds-badam-250g',
    description: 'Selected premium crunchy almonds, 100% natural, unpolished and sweet.',
    category: 'MASALA_DRY_FRUITS',
    brand: 'Nutraj',
    subCategory: 'Dry Fruits',
    pricePaise: 28000, // ₹280.00
    mrpPaise: 34000, // ₹340.00
    packageSize: 250,
    packageUnit: 'G',
    availableStock: 60,
    rating: 4.9,
    reviewCount: 3100,
    aliases: ['badam', 'almonds', 'almond', 'badam giri', 'dry fruits'],
    imageUrl: 'https://images.unsplash.com/photo-1508061252445-564b882c3c5a?w=500',
  },
  {
    name: 'Whole Jumbo Cashews (Kaju)',
    slug: 'whole-jumbo-cashews-kaju-250g',
    description: 'Grade W240 premium whole crunchy cashew nuts packed with plant protein.',
    category: 'MASALA_DRY_FRUITS',
    brand: 'Nutraj',
    subCategory: 'Dry Fruits',
    pricePaise: 29500, // ₹295.00
    mrpPaise: 36000, // ₹360.00
    packageSize: 250,
    packageUnit: 'G',
    availableStock: 50,
    rating: 4.8,
    reviewCount: 2200,
    aliases: ['kaju', 'cashew', 'cashews', 'whole kaju', 'dry fruits', 'dryfruit'],
    imageUrl: 'https://images.unsplash.com/photo-1536591375315-1b83896504e3?w=500',
  },
  {
    name: 'Golden Afghani Kishmish (Raisins)',
    slug: 'golden-afghani-kishmish-250g',
    description: 'Naturally sweet, plump sun-dried golden raisins without added sugar.',
    category: 'MASALA_DRY_FRUITS',
    brand: 'Nutraj',
    subCategory: 'Dry Fruits',
    pricePaise: 13500, // ₹135.00
    mrpPaise: 16000, // ₹160.00
    packageSize: 250,
    packageUnit: 'G',
    availableStock: 75,
    rating: 4.7,
    reviewCount: 940,
    aliases: ['kishmish', 'kismis', 'raisins', 'dry grapes', 'sultanas'],
    imageUrl: 'https://images.unsplash.com/photo-1595415927878-5a4cbcf288cb?w=500',
  },
  {
    name: 'Haldiram Aloo Bhujia',
    slug: 'haldiram-aloo-bhujia-200g',
    description: 'Classic spicy and tangy crispy potato sev made with authentic spices.',
    category: 'SNACKS_MUNCHIES',
    brand: 'Haldiram',
    subCategory: 'Namkeen & Chips',
    pricePaise: 5500, // ₹55.00
    mrpPaise: 6000, // ₹60.00
    packageSize: 200,
    packageUnit: 'G',
    availableStock: 80,
    rating: 4.9,
    reviewCount: 4500,
    aliases: ['bhujia', 'aloo bhujia', 'haldiram bhujia', 'sev', 'namkeen'],
    imageUrl: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=500',
  },
  {
    name: 'Parle-G Gold Biscuits',
    slug: 'parle-g-gold-biscuits-250g',
    description: 'Iconic golden baked glucose biscuits enriched with milk and wheat goodness.',
    category: 'SNACKS_MUNCHIES',
    brand: 'Parle',
    subCategory: 'Biscuits',
    pricePaise: 3000, // ₹30.00
    mrpPaise: 3500, // ₹35.00
    packageSize: 250,
    packageUnit: 'G',
    availableStock: 95,
    rating: 4.9,
    reviewCount: 5200,
    aliases: ['parle-g', 'parle g', 'biscuits', 'glucose biscuit', 'chai biscuits'],
    imageUrl: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=500',
  },

  // ── INSTANT & READY FOOD ─────────────────────────────────────────
  {
    name: 'Fresh Idli & Dosa Batter (Stone Ground)',
    slug: 'fresh-idli-dosa-batter-1kg',
    description: 'Naturally fermented rice and urad dal batter. No soda, no preservatives. 100% veg.',
    category: 'INSTANT_FROZEN_FOOD',
    brand: 'iD Fresh Food',
    subCategory: 'Idli & Dosa Batter',
    pricePaise: 8500, // ₹85.00
    mrpPaise: 9500, // ₹95.00
    packageSize: 1,
    packageUnit: 'KG',
    availableStock: 50,
    rating: 4.8,
    reviewCount: 3100,
    aliases: ['dosa batter', 'idli batter', 'batter', 'idli dosa batter', 'fresh batter'],
    imageUrl: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=500',
  },
  {
    name: 'Organic Sweet Corn (Frozen)',
    slug: 'organic-sweet-corn-frozen-500g',
    description: 'Individually quick-frozen tender and naturally sweet American corn kernels.',
    category: 'INSTANT_FROZEN_FOOD',
    brand: 'Sumeru',
    subCategory: 'Frozen Veg',
    pricePaise: 8000, // ₹80.00
    mrpPaise: 9500, // ₹95.00
    packageSize: 500,
    packageUnit: 'G',
    availableStock: 65,
    rating: 4.7,
    reviewCount: 1100,
    aliases: ['sweet corn', 'corn', 'frozen corn', 'bhutta', 'makai dana'],
    imageUrl: 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=500',
  },
  {
    name: 'Maggi 2-Minute Masala Noodles (Pack of 4)',
    slug: 'maggi-masala-noodles-4pack',
    description: 'Classic Indian spice blend noodles made with quality roasted spices. 100% vegetarian.',
    category: 'INSTANT_FROZEN_FOOD',
    brand: 'Nestle Maggi',
    subCategory: 'Frozen Veg',
    pricePaise: 5600, // ₹56.00
    mrpPaise: 6000, // ₹60.00
    packageSize: 280,
    packageUnit: 'G',
    availableStock: 90,
    rating: 4.9,
    reviewCount: 6800,
    aliases: ['maggi', 'noodles', 'instant noodles', 'maggi masala', '2 minute noodles'],
    imageUrl: 'https://images.unsplash.com/photo-1612927601601-6638404737ce?w=500',
  },
];

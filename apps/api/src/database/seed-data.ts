import { ProductCategory, PackageUnit } from '../modules/catalog/product.model.js';

export interface SeedProductInput {
  name: string;
  slug: string;
  description: string;
  category: ProductCategory;
  pricePaise: number; // In integer paise
  packageSize: number;
  packageUnit: PackageUnit;
  availableStock: number;
  aliases: string[];
  imageUrl?: string;
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
  {
    name: 'Fresh Malai Paneer',
    slug: 'fresh-malai-paneer-200g',
    description: 'Rich, soft, and vacuum-sealed cow milk cottage cheese block. 100% vegetarian.',
    category: 'DAIRY',
    pricePaise: 9500, // ₹95.00
    packageSize: 200,
    packageUnit: 'G',
    availableStock: 50,
    aliases: ['chenna', 'cottage cheese', 'fresh paneer', 'paneer block', 'malai paneer'],
    imageUrl: 'https://images.unsplash.com/photo-1589647363585-f4a7d3877b10?w=500',
  },
  {
    name: 'Fresh Malai Paneer (Family Pack)',
    slug: 'fresh-malai-paneer-500g',
    description: 'Extra value family pack of fresh creamy paneer for royal gravies and pulao.',
    category: 'DAIRY',
    pricePaise: 22000, // ₹220.00
    packageSize: 500,
    packageUnit: 'G',
    availableStock: 35,
    aliases: ['paneer 500g', 'cottage cheese bulk', 'chenna 500g', 'big paneer'],
    imageUrl: 'https://images.unsplash.com/photo-1589647363585-f4a7d3877b10?w=500',
  },
  {
    name: 'Farm Fresh Green Peas',
    slug: 'farm-fresh-green-peas-500g',
    description: 'Sweet, tender, hand-shelled organic green peas.',
    category: 'VEGETABLES',
    pricePaise: 6000, // ₹60.00
    packageSize: 500,
    packageUnit: 'G',
    availableStock: 60,
    aliases: ['matar', 'mutter', 'fresh peas', 'green peas', 'hari matar'],
    imageUrl: 'https://images.unsplash.com/photo-1515942400420-2b98fed1f515?w=500',
  },
  {
    name: 'Red Onions (Nashik Fresh)',
    slug: 'red-onions-nashik-1kg',
    description: 'Firm, pungent, top-grade red onions essential for Indian curries and pulao.',
    category: 'VEGETABLES',
    pricePaise: 4500, // ₹45.00
    packageSize: 1,
    packageUnit: 'KG',
    availableStock: 100,
    aliases: ['pyaz', 'kanda', 'dungri', 'onion', 'onions', 'red onion', 'lal pyaz'],
    imageUrl: 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=500',
  },
  {
    name: 'Fresh Potatoes (Pahari)',
    slug: 'fresh-potatoes-1kg',
    description: 'High-starch hill potatoes, ideal for roasting, biryani, and curries.',
    category: 'VEGETABLES',
    pricePaise: 3500, // ₹35.00
    packageSize: 1,
    packageUnit: 'KG',
    availableStock: 80,
    aliases: ['aloo', 'batata', 'potato', 'potatoes', 'pahari aloo'],
    imageUrl: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=500',
  },
  {
    name: 'Country Tomatoes (Nati)',
    slug: 'country-tomatoes-1kg',
    description: 'Juicy, slightly tangy regional heirloom tomatoes.',
    category: 'VEGETABLES',
    pricePaise: 4000, // ₹40.00
    packageSize: 1,
    packageUnit: 'KG',
    availableStock: 75,
    aliases: ['tamatar', 'tomato', 'tomatoes', 'nati tamatar'],
    imageUrl: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=500',
  },
  {
    name: 'Fresh Ginger Root',
    slug: 'fresh-ginger-root-250g',
    description: 'Aromatic, spicy, pesticide-free fresh ginger root.',
    category: 'VEGETABLES',
    pricePaise: 3000, // ₹30.00
    packageSize: 250,
    packageUnit: 'G',
    availableStock: 40,
    aliases: ['adrak', 'ginger', 'fresh ginger', 'saunth'],
    imageUrl: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=500',
  },
  {
    name: 'Organic Garlic Bulbs',
    slug: 'organic-garlic-bulbs-250g',
    description: 'Strong, flavorful Indian garlic cloves with intense aroma.',
    category: 'VEGETABLES',
    pricePaise: 5000, // ₹50.00
    packageSize: 250,
    packageUnit: 'G',
    availableStock: 45,
    aliases: ['lehsun', 'lasun', 'garlic', 'garlic bulbs', 'desi lehsun'],
    imageUrl: 'https://images.unsplash.com/photo-1615477039956-65e94bcf9326?w=500',
  },
  {
    name: 'Fresh Mint Leaves',
    slug: 'fresh-mint-leaves-100g',
    description: 'Crisp and refreshing mint leaves for garnishing pulao and raita.',
    category: 'VEGETABLES',
    pricePaise: 1500, // ₹15.00
    packageSize: 100,
    packageUnit: 'G',
    availableStock: 30,
    aliases: ['pudina', 'mint', 'mint leaves', 'fresh pudina'],
    imageUrl: 'https://images.unsplash.com/photo-1608686207856-001b95cf60ca?w=500',
  },
  {
    name: 'Fresh Coriander Leaves',
    slug: 'fresh-coriander-leaves-100g',
    description: 'Farm fresh fragrant cilantro bunch with vibrant green leaves.',
    category: 'VEGETABLES',
    pricePaise: 1500, // ₹15.00
    packageSize: 100,
    packageUnit: 'G',
    availableStock: 30,
    aliases: ['dhaniya', 'dhaniya patta', 'coriander', 'cilantro', 'kothmir'],
    imageUrl: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=500',
  },
  {
    name: 'Green Chillies (Teja)',
    slug: 'green-chillies-200g',
    description: 'Pungent and spicy fresh green chillies.',
    category: 'VEGETABLES',
    pricePaise: 2000, // ₹20.00
    packageSize: 200,
    packageUnit: 'G',
    availableStock: 40,
    aliases: ['hari mirch', 'green chillies', 'mirchi', 'spicy chilli'],
    imageUrl: 'https://images.unsplash.com/photo-1568584711075-3d021a7c3ca3?w=500',
  },
  {
    name: 'Shimla Fresh Royal Apples',
    slug: 'shimla-fresh-royal-apples-1kg',
    description: 'Crisp, sweet, hand-picked mountain apples from Himachal orchards.',
    category: 'FRUITS_VEGETABLES',
    pricePaise: 18000, // ₹180.00
    packageSize: 1,
    packageUnit: 'KG',
    availableStock: 65,
    aliases: ['apple', 'apples', 'seb', 'shimla seb', 'red apples', 'fresh apples'],
    imageUrl: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=500',
  },
  {
    name: 'Cavendish Bananas (Robusta)',
    slug: 'cavendish-bananas-1kg',
    description: 'Naturally ripened, nutrient-dense sweet dessert bananas.',
    category: 'FRUITS_VEGETABLES',
    pricePaise: 5500, // ₹55.00
    packageSize: 1,
    packageUnit: 'KG',
    availableStock: 90,
    aliases: ['banana', 'bananas', 'kela', 'ripe bananas', 'paka kela'],
    imageUrl: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=500',
  },
  {
    name: 'Baby Spinach (Palak Fresh)',
    slug: 'baby-spinach-palak-250g',
    description: 'Tender, hydroponically washed iron-rich green spinach leaves.',
    category: 'VEGETABLES',
    pricePaise: 2500, // ₹25.00
    packageSize: 250,
    packageUnit: 'G',
    availableStock: 50,
    aliases: ['palak', 'spinach', 'hari palak', 'green spinach', 'palak saag'],
    imageUrl: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=500',
  },
  {
    name: 'Fresh Button Mushrooms',
    slug: 'fresh-button-mushrooms-200g',
    description: 'Firm, clean white button mushrooms packed with umami flavor.',
    category: 'VEGETABLES',
    pricePaise: 5000, // ₹50.00
    packageSize: 200,
    packageUnit: 'G',
    availableStock: 40,
    aliases: ['mushroom', 'mushrooms', 'khumbi', 'button mushroom'],
    imageUrl: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=500',
  },
  {
    name: 'Farm Fresh Cow Milk',
    slug: 'farm-fresh-cow-milk-1l',
    description: 'Pasteurized, homogenized whole cow milk, rich in calcium and vitamins.',
    category: 'DAIRY_BREAKFAST',
    pricePaise: 6800, // ₹68.00
    packageSize: 1,
    packageUnit: 'L',
    availableStock: 110,
    aliases: ['milk', 'cow milk', 'doodh', 'fresh milk', 'taaza doodh'],
    imageUrl: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=500',
  },
  {
    name: 'Set Dahi / Curd (Pouch)',
    slug: 'set-dahi-curd-400g',
    description: 'Thick, creamy, traditional probiotic curd prepared with active cultures.',
    category: 'DAIRY_BREAKFAST',
    pricePaise: 3500, // ₹35.00
    packageSize: 400,
    packageUnit: 'G',
    availableStock: 75,
    aliases: ['dahi', 'curd', 'yogurt', 'fresh curd', 'plain yogurt'],
    imageUrl: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=500',
  },
  {
    name: 'Rolled Oats (Gluten Free)',
    slug: 'rolled-oats-500g',
    description: 'High-fiber whole grain rolled oats for nourishing breakfast porridge.',
    category: 'DAIRY_BREAKFAST',
    pricePaise: 12000, // ₹120.00
    packageSize: 500,
    packageUnit: 'G',
    availableStock: 45,
    aliases: ['oats', 'rolled oats', 'breakfast oats', 'porridge'],
    imageUrl: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=500',
  },
  {
    name: 'Cold Pressed Valencia Orange Juice',
    slug: 'valencia-orange-juice-300ml',
    description: '100% pure squeezed orange juice with pulp. Zero added sugar or preservatives.',
    category: 'COLD_DRINKS_JUICES',
    pricePaise: 9900, // ₹99.00
    packageSize: 300,
    packageUnit: 'ML',
    availableStock: 50,
    aliases: ['orange juice', 'fresh juice', 'juice', 'santre ka juice', 'cold pressed juice'],
    imageUrl: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?w=500',
  },
  {
    name: 'Natural Tender Coconut Water',
    slug: 'tender-coconut-water-200ml',
    description: 'Refreshing isotonic natural coconut water harvested fresh from coastal farms.',
    category: 'COLD_DRINKS_JUICES',
    pricePaise: 5000, // ₹50.00
    packageSize: 200,
    packageUnit: 'ML',
    availableStock: 80,
    aliases: ['nariyal pani', 'coconut water', 'tender coconut', 'elaneer'],
    imageUrl: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=500',
  },
  {
    name: 'Whole Wheat Brown Bread',
    slug: 'whole-wheat-brown-bread-400g',
    description: 'Soft, stone-ground 100% whole wheat bakery sliced loaf. 100% eggless.',
    category: 'BAKERY',
    pricePaise: 4500, // ₹45.00
    packageSize: 400,
    packageUnit: 'G',
    availableStock: 60,
    aliases: ['bread', 'brown bread', 'wheat bread', 'sliced bread', 'eggless bread'],
    imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=500',
  },
  {
    name: 'Eggless Butter Pav (Pack of 6)',
    slug: 'eggless-butter-pav-6pcs',
    description: 'Pillow-soft bakery pav buns baked fresh daily for pav bhaji and vada pav.',
    category: 'BAKERY',
    pricePaise: 3500, // ₹35.00
    packageSize: 6,
    packageUnit: 'PIECE',
    availableStock: 50,
    aliases: ['pav', 'buns', 'bread pav', 'pav bhaji buns', 'eggless pav'],
    imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=500',
  },
];

export const SEED_PRODUCTS_DESI_KIRANA: SeedProductInput[] = [
  {
    name: 'Royal Aged Basmati Rice',
    slug: 'royal-aged-basmati-rice-1kg',
    description: 'Extra-long grain aromatic aged basmati rice for pulao and biryani.',
    category: 'GRAINS',
    pricePaise: 14000, // ₹140.00
    packageSize: 1,
    packageUnit: 'KG',
    availableStock: 120,
    aliases: ['chawal', 'biryani rice', 'basmati', 'pulao rice', 'rice', 'long grain rice'],
    imageUrl: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=500',
  },
  {
    name: 'Pure Desi Cow Ghee',
    slug: 'pure-desi-cow-ghee-500ml',
    description: 'Traditional bilona churned A2 cow milk ghee, rich golden color and aroma.',
    category: 'OILS',
    pricePaise: 36000, // ₹360.00
    packageSize: 500,
    packageUnit: 'ML',
    availableStock: 40,
    aliases: ['ghee', 'cow ghee', 'shuddha ghee', 'deshi ghee', 'clarified butter'],
    imageUrl: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=500',
  },
  {
    name: 'Whole Cumin Seeds (Jeera)',
    slug: 'whole-cumin-seeds-100g',
    description: 'Bold, unadulterated Rajasthani whole cumin seeds for fragrant tadka.',
    category: 'SPICES',
    pricePaise: 4500, // ₹45.00
    packageSize: 100,
    packageUnit: 'G',
    availableStock: 80,
    aliases: ['jeera', 'zeera', 'cumin', 'cumin seeds', 'whole cumin'],
    imageUrl: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=500',
  },
  {
    name: 'Pure Salem Turmeric Powder',
    slug: 'salem-turmeric-powder-200g',
    description: 'High curcumin content, aromatic golden yellow ground turmeric.',
    category: 'SPICES',
    pricePaise: 4000, // ₹40.00
    packageSize: 200,
    packageUnit: 'G',
    availableStock: 90,
    aliases: ['haldi', 'haldi powder', 'turmeric', 'turmeric powder'],
    imageUrl: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=500',
  },
  {
    name: 'Kashmiri Red Chilli Powder',
    slug: 'kashmiri-red-chilli-powder-100g',
    description: 'Vibrant natural crimson red color with mild gentle warmth.',
    category: 'SPICES',
    pricePaise: 5500, // ₹55.00
    packageSize: 100,
    packageUnit: 'G',
    availableStock: 70,
    aliases: ['lal mirch', 'mirchi powder', 'kashmiri mirch', 'red chilli powder'],
    imageUrl: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=500',
  },
  {
    name: 'Royal Shahi Garam Masala',
    slug: 'royal-shahi-garam-masala-100g',
    description: 'Blend of cinnamon, black cardamom, cloves, mace, and star anise.',
    category: 'SPICES',
    pricePaise: 7500, // ₹75.00
    packageSize: 100,
    packageUnit: 'G',
    availableStock: 50,
    aliases: ['garam masala', 'khada masala', 'pulao masala', 'biryani masala', 'all spice blend'],
    imageUrl: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=500',
  },
  {
    name: 'Unpolished Toor Dal',
    slug: 'unpolished-toor-dal-1kg',
    description:
      'Chemical-free yellow split pigeon peas, quick-cooking for delicious sambar & dal.',
    category: 'PULSES',
    pricePaise: 16500, // ₹165.00
    packageSize: 1,
    packageUnit: 'KG',
    availableStock: 85,
    aliases: ['toor dal', 'arhar dal', 'tuvar dal', 'yellow pigeon peas', 'dal'],
    imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500',
  },
  {
    name: 'Dhuli Moong Dal',
    slug: 'dhuli-moong-dal-1kg',
    description: 'Light, protein-packed yellow split moong dal for easy digestion.',
    category: 'PULSES',
    pricePaise: 13000, // ₹130.00
    packageSize: 1,
    packageUnit: 'KG',
    availableStock: 65,
    aliases: ['moong dal', 'yellow moong', 'moong dhuli', 'split mung'],
    imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500',
  },
  {
    name: 'Chakki Whole Wheat Atta',
    slug: 'chakki-whole-wheat-atta-5kg',
    description: '100% whole grain wheat flour ground slowly to retain bran and sweetness.',
    category: 'GRAINS',
    pricePaise: 24500, // ₹245.00
    packageSize: 5,
    packageUnit: 'KG',
    availableStock: 60,
    aliases: ['atta', 'gehun atta', 'wheat flour', 'chakki atta', 'roti flour'],
    imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=500',
  },
  {
    name: 'Cold Pressed Kachi Ghani Mustard Oil',
    slug: 'cold-pressed-mustard-oil-1l',
    description: 'Pure mustard oil extracted with wooden kolhu for authentic pungent aroma.',
    category: 'OILS',
    pricePaise: 18000, // ₹180.00
    packageSize: 1,
    packageUnit: 'L',
    availableStock: 50,
    aliases: ['sarson tel', 'mustard oil', 'kachi ghani', 'cooking oil'],
    imageUrl: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=500',
  },
  {
    name: 'Roasted Peri Peri Makhana',
    slug: 'roasted-peri-peri-makhana-100g',
    description: 'Crunchy Himalayan foxnuts lightly roasted in olive oil with zesty peri peri spices.',
    category: 'SNACKS_MUNCHIES',
    pricePaise: 9500, // ₹95.00
    packageSize: 100,
    packageUnit: 'G',
    availableStock: 70,
    aliases: ['makhana', 'foxnuts', 'roasted makhana', 'healthy snacks', 'phool makhana'],
    imageUrl: 'https://images.unsplash.com/photo-1599490659213-e2b9527bd087?w=500',
  },
  {
    name: 'Gujarati Methi Khakhra (Crispy)',
    slug: 'gujarati-methi-khakhra-200g',
    description: 'Traditional thin roasted whole wheat crisps seasoned with fenugreek and spices.',
    category: 'SNACKS_MUNCHIES',
    pricePaise: 6500, // ₹65.00
    packageSize: 200,
    packageUnit: 'G',
    availableStock: 55,
    aliases: ['khakhra', 'methi khakhra', 'roasted snack', 'gujarati snacks', 'dry roti'],
    imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=500',
  },
  {
    name: 'Whole Jumbo Cashews (Kaju)',
    slug: 'whole-jumbo-cashews-kaju-250g',
    description: 'Grade W240 premium whole crunchy cashew nuts packed with plant protein.',
    category: 'MASALA_DRY_FRUITS',
    pricePaise: 29500, // ₹295.00
    packageSize: 250,
    packageUnit: 'G',
    availableStock: 50,
    aliases: ['kaju', 'cashew', 'cashews', 'whole kaju', 'dry fruits', 'dryfruit'],
    imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=500',
  },
  {
    name: 'California Almonds (Badam Giri)',
    slug: 'california-almonds-badam-250g',
    description: 'Selected premium crunchy almonds, 100% natural and unpolished.',
    category: 'MASALA_DRY_FRUITS',
    pricePaise: 28000, // ₹280.00
    packageSize: 250,
    packageUnit: 'G',
    availableStock: 60,
    aliases: ['badam', 'almonds', 'almond', 'badam giri', 'dry fruits'],
    imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=500',
  },
  {
    name: 'Golden Afghani Kishmish (Raisins)',
    slug: 'golden-afghani-kishmish-250g',
    description: 'Naturally sweet, plump sun-dried golden raisins.',
    category: 'MASALA_DRY_FRUITS',
    pricePaise: 13500, // ₹135.00
    packageSize: 250,
    packageUnit: 'G',
    availableStock: 75,
    aliases: ['kishmish', 'kismis', 'raisins', 'dry grapes', 'sultanas'],
    imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=500',
  },
  {
    name: 'Organic Sweet Corn (Frozen)',
    slug: 'organic-sweet-corn-frozen-500g',
    description: 'Individually quick-frozen tender and naturally sweet American corn kernels.',
    category: 'INSTANT_FROZEN_FOOD',
    pricePaise: 8000, // ₹80.00
    packageSize: 500,
    packageUnit: 'G',
    availableStock: 65,
    aliases: ['sweet corn', 'corn', 'frozen corn', 'bhutta', 'makai dana'],
    imageUrl: 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=500',
  },
  {
    name: 'Fresh Idli & Dosa Batter (Stone Ground)',
    slug: 'fresh-idli-dosa-batter-1kg',
    description: 'Naturally fermented rice and urad dal batter. No soda, no preservatives. 100% veg.',
    category: 'INSTANT_FROZEN_FOOD',
    pricePaise: 8500, // ₹85.00
    packageSize: 1,
    packageUnit: 'KG',
    availableStock: 50,
    aliases: ['dosa batter', 'idli batter', 'batter', 'idli dosa batter', 'fresh batter'],
    imageUrl: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=500',
  },
  {
    name: 'Organic Ragi Baby Cereal (Stage 1)',
    slug: 'organic-ragi-baby-cereal-200g',
    description: 'Sprouted finger millet baby porridge mix with sprouted green gram. Pure vegetarian.',
    category: 'BABY_CARE',
    pricePaise: 16000, // ₹160.00
    packageSize: 200,
    packageUnit: 'G',
    availableStock: 35,
    aliases: ['baby food', 'ragi porridge', 'baby cereal', 'shishu ahar', 'baby care'],
    imageUrl: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=500',
  },
  {
    name: 'Pure Neem & Aloe Herbal Bathing Soap',
    slug: 'pure-neem-aloe-herbal-soap-125g',
    description: 'Cold-pressed Ayurvedic vegetable oil soap bar with antibacterial neem and pure aloe.',
    category: 'PERSONAL_CARE',
    pricePaise: 6500, // ₹65.00
    packageSize: 125,
    packageUnit: 'G',
    availableStock: 80,
    aliases: ['soap', 'neem soap', 'bathing soap', 'herbal soap', 'sabun'],
    imageUrl: 'https://images.unsplash.com/photo-1607006314163-ea06f9791475?w=500',
  },
  {
    name: 'Natural Citrus Floor Cleaner Liquid',
    slug: 'natural-citrus-floor-cleaner-1l',
    description: 'Plant-powered non-toxic surface cleaner infused with pure orange essential oils.',
    category: 'HOUSEHOLD_ESSENTIALS',
    pricePaise: 14500, // ₹145.00
    packageSize: 1,
    packageUnit: 'L',
    availableStock: 45,
    aliases: ['floor cleaner', 'cleaner', 'household cleaner', 'pocha liquid', 'disinfectant'],
    imageUrl: 'https://images.unsplash.com/photo-1585421514738-01798e348b17?w=500',
  },
  {
    name: 'Peanut Butter & Oats Dog Biscuits',
    slug: 'peanut-butter-oats-dog-biscuits-500g',
    description: '100% vegetarian crunchy dog treats made with whole oats, roasted peanuts, and honey.',
    category: 'PET_CARE',
    pricePaise: 21000, // ₹210.00
    packageSize: 500,
    packageUnit: 'G',
    availableStock: 30,
    aliases: ['dog food', 'dog biscuits', 'dog treats', 'pet treats', 'pet care'],
    imageUrl: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=500',
  },
];

export interface RawMaterial {
  id: number;
  name: string;
  phase: string;
  usage: string;
  packSize: number;
  packPrice: number;
  stockQty: number;
  minStockAlert: number;
}

export interface Ingredient {
  matId: number;
  pct: number;
}

export interface ProductSpec {
  id: string;
  name: string;
  category: string;
  packSize: number;
  unit: string;
  batchUnits: number;
  containerCost: number;
  labelCost: number;
  overheadCost?: number;
  targetTotalCost?: number;
  multiplier: number;
  stockQty?: number;
  minStockAlert?: number;
  ingredients: Ingredient[];
}

export interface ComputedProduct extends ProductSpec {
  overheadCost: number;
  activePctSum: number;
  waterPct: number;
  waterWeight: number;
  waterCost: number;
  activeCostSum: number;
  rawMaterialsCost: number;
  totalUnitCost: number;
  sellingPrice: number;
  unitProfit: number;
  stockQty: number;
  minStockAlert: number;
}

export interface CartItem {
  prodId: string;
  qty: number;
  customPrice: number | null;
}

export interface EnrichedCartItem {
  prodId: string;
  name: string;
  shortName: string;
  sizeText: string;
  qty: number;
  unitPrice: number;
  unitCost: number;
  lineTotal: number;
  lineCost: number;
  lineProfit: number;
}

export interface InvoiceItem {
  name: string;
  qty: number;
  price: number;
  cost?: number;
}

export interface Invoice {
  id: string;
  date: string;
  customer: string;
  mode: string;
  unitsCount: number;
  totalCost: number;
  discount: number;
  grandTotal: number;
  netProfit: number;
  items: InvoiceItem[];
}

export interface BatchStockItem {
  matId: number;
  name: string;
  isWater: boolean;
  unitWeight: number;
  required: number;
  available: number;
  shortage: number;
  maxUnits: number;
}

export interface BatchFeasibility {
  isFeasible: boolean;
  shortages: BatchStockItem[];
  maxPossibleUnits: number;
  items: BatchStockItem[];
}

export type TabType = 'pos' | 'calc' | 'catalog' | 'materials' | 'inventory';
export type PosPricingMode = 'retail' | 'wholesale';
export type ToastType = 'success' | 'error' | 'info';

export type CurrencyCode = 'YER' | 'SAR' | 'USD';

export interface CurrencyConfig {
  code: CurrencyCode;
  symbol: string;
  name: string;
  shortName: string;
  exchangeNote: string;
  rateFromYER: number; // Multiply YER by this to get Currency amount
  rateToYER: number;   // Multiply Currency amount by this to get YER
}

export const CURRENCIES: Record<CurrencyCode, CurrencyConfig> = {
  YER: {
    code: 'YER',
    symbol: 'ر.ي',
    name: 'ريال يمني (ر.ي)',
    shortName: 'ريال يمني',
    exchangeNote: 'العملة الأساسية المخزنة',
    rateFromYER: 1,
    rateToYER: 1,
  },
  SAR: {
    code: 'SAR',
    symbol: 'ر.س',
    name: 'ريال سعودي (ر.س)',
    shortName: 'ريال سعودي',
    exchangeNote: '140 ر.ي = 1 ر.س',
    rateFromYER: 1 / 140, // 140 YER -> 1 SAR
    rateToYER: 140,
  },
  USD: {
    code: 'USD',
    symbol: '$',
    name: 'دولار أمريكي ($)',
    shortName: 'دولار',
    exchangeNote: '533 ر.ي = 1 $',
    rateFromYER: 1 / 533, // 533 YER -> 1 USD
    rateToYER: 533,
  },
};

export interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
}


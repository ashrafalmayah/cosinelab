import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import {
  RawMaterial,
  ProductSpec,
  ComputedProduct,
  CartItem,
  EnrichedCartItem,
  Invoice,
  Expense,
  BatchFeasibility,
  BatchStockItem,
  TabType,
  PosPricingMode,
  ToastMessage,
  ToastType,
  CurrencyCode,
  CurrencyConfig,
  CURRENCIES
} from '../types';
import { DEFAULT_RAW_MATERIALS } from '../data/defaultRawMaterials';
import { DEFAULT_PRODUCTS_SPECS } from '../data/defaultProducts';
import { SAMPLE_INVOICES } from '../data/sampleInvoices';
import { SAMPLE_EXPENSES } from '../data/sampleExpenses';

const STORAGE_KEY = "COSINELAB_PWA_STATE_V1";

export function computeProductMetrics(prodSpec: ProductSpec, rawMaterials: RawMaterial[]): ComputedProduct {
  const packSize = Number(prodSpec.packSize) || 100;
  const containerCost = Number(prodSpec.containerCost) || 0;
  const labelCost = Number(prodSpec.labelCost) || 0;
  const multiplier = Number(prodSpec.multiplier) || 2.5;
  const hasWater = prodSpec.hasWater !== false;

  let activePctSum = 0;
  let activeCostSum = 0;

  (prodSpec.ingredients || []).forEach(ing => {
    const pct = Number(ing.pct) || 0;
    activePctSum += pct;
    const mat = rawMaterials.find(m => Number(m.id) === Number(ing.matId)) || rawMaterials[0];
    const pricePerGram = mat ? (Number(mat.packPrice) / Number(mat.packSize)) : 0;
    const weightInUnit = (pct / 100) * packSize;
    activeCostSum += weightInUnit * pricePerGram;
  });

  const waterPct = hasWater ? Math.max(0, +(100 - activePctSum).toFixed(2)) : 0;
  const waterWeight = hasWater ? +((waterPct / 100) * packSize).toFixed(2) : 0;
  const waterMat = rawMaterials.find(m => Number(m.id) === 1);
  const waterPricePerGram = waterMat ? (Number(waterMat.packPrice) / Number(waterMat.packSize)) : 0.0015;
  const waterCost = hasWater ? +(waterWeight * waterPricePerGram).toFixed(2) : 0;

  const rawMaterialsCost = +(waterCost + activeCostSum).toFixed(2);

  const overheadCost = prodSpec.overheadCost !== undefined
    ? Number(prodSpec.overheadCost)
    : Math.max(0.15, +(Number(prodSpec.targetTotalCost || 0) - rawMaterialsCost - containerCost - labelCost).toFixed(2));

  const totalUnitCost = +(rawMaterialsCost + containerCost + labelCost + overheadCost).toFixed(2);
  const sellingPrice = +(totalUnitCost * multiplier).toFixed(2);
  const unitProfit = +(sellingPrice - totalUnitCost).toFixed(2);
  const stockQty = prodSpec.stockQty !== undefined ? Number(prodSpec.stockQty) : 40;
  const minStockAlert = prodSpec.minStockAlert !== undefined ? Number(prodSpec.minStockAlert) : 10;

  return {
    ...prodSpec,
    hasWater,
    overheadCost,
    activePctSum: +activePctSum.toFixed(2),
    waterPct,
    waterWeight,
    waterCost: +waterCost.toFixed(2),
    activeCostSum: +activeCostSum.toFixed(2),
    rawMaterialsCost,
    totalUnitCost,
    sellingPrice,
    unitProfit,
    stockQty,
    minStockAlert
  };
}

export function checkBatchStockFeasibility(
  prod: ComputedProduct | null,
  batchUnits: number,
  rawMaterials: RawMaterial[]
): BatchFeasibility {
  if (!prod) return { isFeasible: true, shortages: [], maxPossibleUnits: 0, items: [] };
  const packSize = Number(prod.packSize) || 100;
  const bUnits = Number(batchUnits) || 100;
  let maxPossibleUnits = Infinity;
  const items: BatchStockItem[] = [];
  const shortages: BatchStockItem[] = [];

  const hasWater = prod.hasWater !== false;

  // Distilled water (id: 1) - only included if product has water
  if (hasWater) {
    const waterPct = prod.waterPct !== undefined ? Number(prod.waterPct) : 70;
    const waterUnitWeight = (waterPct / 100) * packSize;
    const waterRequired = +(waterUnitWeight * bUnits).toFixed(2);
    const waterMat = rawMaterials.find(m => Number(m.id) === 1);
    const waterStock = Number(waterMat?.stockQty || 0);
    const waterShortage = Math.max(0, +(waterRequired - waterStock).toFixed(2));
    const waterMax = waterUnitWeight > 0 ? Math.floor(waterStock / waterUnitWeight) : 999999;
    if (waterMax < maxPossibleUnits) maxPossibleUnits = waterMax;

    const waterItem: BatchStockItem = {
      matId: 1,
      name: waterMat?.name || "ماء مقطر (Distilled Water)",
      isWater: true,
      unitWeight: waterUnitWeight,
      required: waterRequired,
      available: waterStock,
      shortage: waterShortage,
      maxUnits: waterMax
    };
    items.push(waterItem);
    if (waterShortage > 0) shortages.push(waterItem);
  }

  // Active ingredients
  (prod.ingredients || []).forEach(ing => {
    const mat = rawMaterials.find(m => Number(m.id) === Number(ing.matId));
    const pct = Number(ing.pct) || 0;
    const unitWeight = (pct / 100) * packSize;
    const required = +(unitWeight * bUnits).toFixed(2);
    const available = Number(mat?.stockQty || 0);
    const shortage = Math.max(0, +(required - available).toFixed(2));
    const maxUnits = unitWeight > 0 ? Math.floor(available / unitWeight) : 999999;
    if (maxUnits < maxPossibleUnits) maxPossibleUnits = maxUnits;

    const ingItem: BatchStockItem = {
      matId: ing.matId,
      name: mat?.name || "مادة خام",
      isWater: false,
      unitWeight,
      required,
      available,
      shortage,
      maxUnits
    };
    items.push(ingItem);
    if (shortage > 0) shortages.push(ingItem);
  });

  if (maxPossibleUnits === Infinity) maxPossibleUnits = 0;

  return {
    isFeasible: shortages.length === 0,
    shortages,
    maxPossibleUnits,
    items
  };
}

interface AppContextType {
  currency: CurrencyCode;
  currencySymbol: string;
  currencyConfig: CurrencyConfig;
  setCurrency: (c: CurrencyCode) => void;
  toDisplayPrice: (valInYER: number | string) => number;
  fromDisplayPrice: (valInDisplay: number | string) => number;
  formatMoney: (val: number | string, decimals?: number) => string;
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  posCategory: string;
  setPosCategory: (cat: string) => void;
  posPricingMode: PosPricingMode;
  setPosPricingMode: (mode: PosPricingMode) => void;
  rawMaterials: RawMaterial[];
  products: ComputedProduct[];
  cart: CartItem[];
  invoices: Invoice[];
  expenses: Expense[];
  addExpense: (title: string, amount: number) => void;
  deleteExpense: (id: string) => void;
  currentCalcProduct: ProductSpec;
  setCurrentCalcProduct: React.Dispatch<React.SetStateAction<ProductSpec>>;
  toasts: ToastMessage[];
  showToast: (message: string, type?: ToastType) => void;
  addToCart: (prodId: string) => void;
  updateCartQty: (prodId: string, delta: number) => void;
  updateCartCustomPrice: (prodId: string, val: string | number) => void;
  clearCart: () => void;
  completeSale: (customerName: string, discount: number) => void;
  deleteInvoice: (idx: number) => void;
  loadProductIntoCalculator: (prodId: string) => void;
  openProductInCalculator: (prodId: string) => void;
  resetCalculatorToNew: () => void;
  updateCalcField: (field: keyof ProductSpec, val: any) => void;
  addIngredientRow: () => void;
  removeIngredientRow: (idx: number) => void;
  updateIngredientMaterial: (idx: number, matId: number) => void;
  updateIngredientPct: (idx: number, pct: number) => void;
  setMultiplier: (val: number) => void;
  saveCurrentProductToCatalog: () => void;
  executeBatchProduction: () => void;
  setBatchUnitsToMaxPossible: (units: number) => void;
  addNewRawMaterial: (data: Omit<RawMaterial, 'id'>) => void;
  updateRawMaterialField: (id: number, field: keyof RawMaterial, val: any) => void;
  deleteRawMaterial: (id: number) => void;
  updateProductStockField: (prodId: string, field: 'stockQty' | 'minStockAlert', val: number) => void;
  deleteProductFromCatalog: (id: string) => void;
  restockItem: (type: 'raw' | 'product', id: string | number, qty: number) => void;
  exportBackupJSON: () => void;
  importBackupJSON: (jsonStr: string) => boolean;
  resetToFactoryDefaults: () => void;
  // Print preview modal state
  printData: { isOpen: boolean; title: string; htmlContent: string };
  openPrintModal: (title: string, htmlContent: string) => void;
  closePrintModal: () => void;
  // Restock modal state
  restockModal: { isOpen: boolean; type: 'raw' | 'product'; itemId?: string | number };
  openRestockModal: (type?: 'raw' | 'product', itemId?: string | number) => void;
  closeRestockModal: () => void;
  // Backup modal state
  isBackupModalOpen: boolean;
  setIsBackupModalOpen: (b: boolean) => void;
  // PWA install modal state
  isPWAModalOpen: boolean;
  setIsPWAModalOpen: (b: boolean) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currency, setCurrencyState] = useState<CurrencyCode>("YER");
  const [activeTab, setActiveTab] = useState<TabType>("pos");
  const [posCategory, setPosCategory] = useState<string>("الكل");
  const [posPricingMode, setPosPricingMode] = useState<PosPricingMode>("retail");
  const [rawMaterials, setRawMaterials] = useState<RawMaterial[]>(DEFAULT_RAW_MATERIALS);
  const [rawProducts, setRawProducts] = useState<ProductSpec[]>(DEFAULT_PRODUCTS_SPECS);
  const [cart, setCart] = useState<CartItem[]>([
    { prodId: "prod-1", qty: 2, customPrice: null },
    { prodId: "prod-2", qty: 1, customPrice: null }
  ]);
  const [invoices, setInvoices] = useState<Invoice[]>(SAMPLE_INVOICES);
  const [expenses, setExpenses] = useState<Expense[]>(SAMPLE_EXPENSES);
  const [currentCalcProduct, setCurrentCalcProduct] = useState<ProductSpec>(DEFAULT_PRODUCTS_SPECS[0]);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Modals state
  const [printData, setPrintData] = useState<{ isOpen: boolean; title: string; htmlContent: string }>({
    isOpen: false,
    title: "",
    htmlContent: ""
  });
  const [restockModal, setRestockModal] = useState<{ isOpen: boolean; type: 'raw' | 'product'; itemId?: string | number }>({
    isOpen: false,
    type: 'raw'
  });
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  const [isPWAModalOpen, setIsPWAModalOpen] = useState(false);

  // Initialize from LocalStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.currency) {
          if (parsed.currency === "SAR" || parsed.currency === "ر.س") {
            setCurrencyState("SAR");
          } else if (parsed.currency === "USD" || parsed.currency === "$") {
            setCurrencyState("USD");
          } else {
            setCurrencyState("YER");
          }
        } else {
          setCurrencyState("YER");
        }
        if (parsed.rawMaterials && parsed.rawMaterials.length) setRawMaterials(parsed.rawMaterials);
        if (parsed.products && parsed.products.length) setRawProducts(parsed.products);
        if (parsed.invoices) setInvoices(parsed.invoices);
        if (parsed.expenses && Array.isArray(parsed.expenses)) setExpenses(parsed.expenses);
        if (parsed.cart) setCart(parsed.cart);
        if (parsed.products && parsed.products[0]) setCurrentCalcProduct(parsed.products[0]);
      }
    } catch (e) {
      console.error("Storage load error:", e);
    }
  }, []);

  // Save to LocalStorage
  const saveToStorage = (
    curr: CurrencyCode,
    mats: RawMaterial[],
    prods: ProductSpec[],
    invs: Invoice[],
    crt: CartItem[],
    exps: Expense[] = expenses
  ) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        currency: curr,
        rawMaterials: mats,
        products: prods,
        invoices: invs,
        cart: crt,
        expenses: exps
      }));
    } catch (e) {
      console.error("Storage save error:", e);
    }
  };

  const showToast = (message: string, type: ToastType = "success") => {
    const id = Date.now().toString() + Math.random().toString();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3500);
  };

  const currencyConfig = CURRENCIES[currency] || CURRENCIES.YER;
  const currencySymbol = currencyConfig.symbol;

  const toDisplayPrice = (valInYER: number | string): number => {
    const num = Number(valInYER) || 0;
    const cfg = CURRENCIES[currency] || CURRENCIES.YER;
    return +(num * cfg.rateFromYER).toFixed(4);
  };

  const fromDisplayPrice = (valInDisplay: number | string): number => {
    const num = Number(valInDisplay) || 0;
    const cfg = CURRENCIES[currency] || CURRENCIES.YER;
    return +(num * cfg.rateToYER).toFixed(4);
  };

  const setCurrency = (newCurr: CurrencyCode) => {
    setCurrencyState(newCurr);
    saveToStorage(newCurr, rawMaterials, rawProducts, invoices, cart);
    const cfg = CURRENCIES[newCurr] || CURRENCIES.YER;
    showToast(`تم تغيير العملة إلى ${cfg.name} (${cfg.exchangeNote})`, "success");
  };

  const formatMoney = (valInYER: number | string, decimals = 2) => {
    const num = Number(valInYER) || 0;
    const cfg = CURRENCIES[currency] || CURRENCIES.YER;
    const converted = num * cfg.rateFromYER;
    return converted.toLocaleString("en-US", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }) + " " + cfg.symbol;
  };

  // Recompute products reactively whenever rawMaterials or rawProducts change
  const products: ComputedProduct[] = useMemo(() => {
    return rawProducts.map(p => computeProductMetrics(p, rawMaterials));
  }, [rawProducts, rawMaterials]);

  // Cart operations
  const addToCart = (prodId: string) => {
    const prod = products.find(p => p.id === prodId);
    const existing = cart.find(c => c.prodId === prodId);
    const currentStock = prod ? (Number(prod.stockQty) || 0) : 0;
    const targetQty = (existing ? existing.qty : 0) + 1;

    if (targetQty > currentStock) {
      showToast(`تنبيه: الكمية المطلوبة (${targetQty}) تتجاوز رصيد المخزون المتوفر (${currentStock}) لمنتج "${prod ? prod.name : ''}"`, "error");
    }

    let updatedCart: CartItem[];
    if (existing) {
      updatedCart = cart.map(c => c.prodId === prodId ? { ...c, qty: c.qty + 1 } : c);
    } else {
      updatedCart = [...cart, { prodId, qty: 1, customPrice: null }];
    }
    setCart(updatedCart);
    saveToStorage(currency, rawMaterials, rawProducts, invoices, updatedCart);
    if (prod) showToast(`تمت إضافة "${prod.name}" إلى الفاتورة (المخزون: ${currentStock})`, "success");
  };

  const updateCartQty = (prodId: string, delta: number) => {
    const updated = cart.map(c => {
      if (c.prodId === prodId) {
        return { ...c, qty: c.qty + delta };
      }
      return c;
    }).filter(c => c.qty > 0);
    setCart(updated);
    saveToStorage(currency, rawMaterials, rawProducts, invoices, updated);
  };

  const updateCartCustomPrice = (prodId: string, val: string | number) => {
    const num = parseFloat(String(val));
    const price = isNaN(num) || num < 0 ? 0 : num;
    const updated = cart.map(c => c.prodId === prodId ? { ...c, customPrice: price } : c);
    setCart(updated);
    saveToStorage(currency, rawMaterials, rawProducts, invoices, updated);
  };

  const clearCart = () => {
    setCart([]);
    saveToStorage(currency, rawMaterials, rawProducts, invoices, []);
  };

  const completeSale = (customerName: string, discount: number) => {
    if (cart.length === 0) {
      showToast("السلة فارغة! أضف منتجاً واحداً على الأقل لإتمام البيع", "error");
      return;
    }

    const isWholesale = posPricingMode === "wholesale";
    let subtotal = 0;
    let totalCost = 0;
    let totalUnits = 0;
    const items: { name: string; qty: number; price: number; cost: number; prodId: string }[] = [];

    cart.forEach(c => {
      const prod = products.find(p => p.id === c.prodId);
      if (!prod) return;
      const defaultPrice = isWholesale ? +(prod.sellingPrice * 0.8).toFixed(2) : prod.sellingPrice;
      const unitPrice = c.customPrice !== null ? Number(c.customPrice) : defaultPrice;
      const lineTotal = +(unitPrice * c.qty).toFixed(2);
      const lineCost = +(prod.totalUnitCost * c.qty).toFixed(2);

      subtotal += lineTotal;
      totalCost += lineCost;
      totalUnits += c.qty;

      items.push({
        prodId: prod.id,
        name: `${prod.name} (${prod.packSize} ${prod.unit})`,
        qty: c.qty,
        price: unitPrice,
        cost: prod.totalUnitCost
      });
    });

    const disc = Math.max(0, Number(discount) || 0);
    const grandTotal = Math.max(0, +(subtotal - disc).toFixed(2));
    const netProfit = +(grandTotal - totalCost).toFixed(2);

    const now = new Date();
    const dateStr = now.toLocaleDateString("ar-EG") + " " + now.toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" });
    const invId = "INV-" + (1001 + invoices.length);

    const newInvoice: Invoice = {
      id: invId,
      date: dateStr,
      customer: customerName.trim() || "عميل نقدي مباشر",
      mode: isWholesale ? "جملة (-20%)" : "تجزئة",
      unitsCount: totalUnits,
      totalCost,
      discount: disc,
      grandTotal,
      netProfit,
      items: items.map(i => ({ name: i.name, qty: i.qty, price: i.price, cost: i.cost }))
    };

    // Deduct stock from products
    const updatedProducts = rawProducts.map(p => {
      const soldItem = items.find(i => i.prodId === p.id);
      if (soldItem) {
        return { ...p, stockQty: Math.max(0, (Number(p.stockQty) || 0) - soldItem.qty) };
      }
      return p;
    });

    const updatedInvoices = [newInvoice, ...invoices];
    setInvoices(updatedInvoices);
    setRawProducts(updatedProducts);
    setCart([]);
    saveToStorage(currency, rawMaterials, updatedProducts, updatedInvoices, []);
    showToast(`تم حفظ الفاتورة ${invId} بنجاح وخصم الكميات من المخزون! صافي الربح: ${formatMoney(netProfit)}`, "success");
  };

  const deleteInvoice = (idx: number) => {
    const updated = invoices.filter((_, i) => i !== idx);
    setInvoices(updated);
    saveToStorage(currency, rawMaterials, rawProducts, updated, cart);
    showToast("تم حذف الفاتورة من السجل", "info");
  };

  // Expenses operations
  const addExpense = (title: string, amount: number) => {
    const cleanTitle = title.trim();
    const cleanAmount = Math.max(0, Number(amount) || 0);
    if (!cleanTitle) {
      showToast("يرجى إدخال بيان أو اسم المصروف", "error");
      return;
    }
    if (cleanAmount <= 0) {
      showToast("يرجى إدخال مبلغ صحيح للمصروف", "error");
      return;
    }
    const now = new Date();
    const newExp: Expense = {
      id: "EXP-" + Date.now().toString().slice(-6),
      title: cleanTitle,
      amount: cleanAmount,
      date: now.toLocaleDateString("ar-EG") + " " + now.toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" })
    };
    const updated = [newExp, ...expenses];
    setExpenses(updated);
    saveToStorage(currency, rawMaterials, rawProducts, invoices, cart, updated);
    showToast(`تم تسجيل المصروف "${cleanTitle}" بنجاح!`, "success");
  };

  const deleteExpense = (id: string) => {
    const updated = expenses.filter(e => e.id !== id);
    setExpenses(updated);
    saveToStorage(currency, rawMaterials, rawProducts, invoices, cart, updated);
    showToast("تم حذف المصروف من السجل بنجاح", "info");
  };

  // Calculator operations
  const loadProductIntoCalculator = (prodId: string) => {
    const found = rawProducts.find(p => p.id === prodId) || rawProducts[0];
    if (found) {
      setCurrentCalcProduct(JSON.parse(JSON.stringify(found)));
    }
  };

  const openProductInCalculator = (prodId: string) => {
    loadProductIntoCalculator(prodId);
    setActiveTab("calc");
    showToast("تم تحميل التركيبة كاملة في الحاسبة للتعديل", "info");
  };

  const resetCalculatorToNew = () => {
    const newProd: ProductSpec = {
      id: "prod-" + Date.now(),
      name: "تركيبة منتج تجميلي جديد",
      category: "كريمات",
      packSize: 200,
      unit: "جم",
      batchUnits: 100,
      containerCost: 2.50,
      labelCost: 1.00,
      overheadCost: 0.35,
      multiplier: 2.5,
      hasWater: true,
      ingredients: [
        { matId: 2, pct: 4.0 },
        { matId: 9, pct: 5.0 },
        { matId: 17, pct: 4.0 },
        { matId: 5, pct: 2.0 },
        { matId: 35, pct: 0.8 }
      ]
    };
    setCurrentCalcProduct(newProd);
  };

  const updateCalcField = (field: keyof ProductSpec, val: any) => {
    setCurrentCalcProduct(prev => ({
      ...prev,
      [field]: val
    }));
  };

  const addIngredientRow = () => {
    setCurrentCalcProduct(prev => ({
      ...prev,
      ingredients: [...(prev.ingredients || []), { matId: 2, pct: 1.0 }]
    }));
  };

  const removeIngredientRow = (idx: number) => {
    setCurrentCalcProduct(prev => ({
      ...prev,
      ingredients: prev.ingredients.filter((_, i) => i !== idx)
    }));
  };

  const updateIngredientMaterial = (idx: number, matId: number) => {
    setCurrentCalcProduct(prev => {
      const ings = [...prev.ingredients];
      ings[idx] = { ...ings[idx], matId: Number(matId) };
      return { ...prev, ingredients: ings };
    });
  };

  const updateIngredientPct = (idx: number, pct: number) => {
    setCurrentCalcProduct(prev => {
      const ings = [...prev.ingredients];
      ings[idx] = { ...ings[idx], pct: Math.max(0, pct) };
      return { ...prev, ingredients: ings };
    });
  };

  const setMultiplier = (val: number) => {
    updateCalcField('multiplier', val);
  };

  const saveCurrentProductToCatalog = () => {
    const computed = computeProductMetrics(currentCalcProduct, rawMaterials);
    const existingIdx = rawProducts.findIndex(p => p.id === computed.id);

    let updatedProducts: ProductSpec[];
    if (existingIdx > -1) {
      updatedProducts = rawProducts.map((p, i) => i === existingIdx ? computed : p);
      showToast(`تم تحديث تركيبة وتسعير "${computed.name}" في الكتالوج ونقطة البيع!`, "success");
    } else {
      updatedProducts = [...rawProducts, computed];
      showToast(`تمت إضافة المنتج الجديد "${computed.name}" إلى الكتالوج ونقطة البيع!`, "success");
    }

    setRawProducts(updatedProducts);
    saveToStorage(currency, rawMaterials, updatedProducts, invoices, cart);
  };

  const executeBatchProduction = () => {
    const computed = computeProductMetrics(currentCalcProduct, rawMaterials);
    const batchUnits = Number(computed.batchUnits) || 100;
    const feasibility = checkBatchStockFeasibility(computed, batchUnits, rawMaterials);

    if (!feasibility.isFeasible) {
      const shortageList = feasibility.shortages.map(s => `• ${s.name}: مطلوب ${s.required} ${computed.unit}، المتوفر ${s.available} ${computed.unit} (عجز: ${s.shortage} ${computed.unit})`).join("\n");
      const proceed = window.confirm(`⚠️ تنبيه عجز المواد الخام:\nرصيد المخزون لا يكفي لإنتاج ${batchUnits} عبوة من "${computed.name}".\n\nالمواد الناقصة:\n${shortageList}\n\nهل تريد المتابعة رغم العجز وخصم الرصيد (سيصبح رصيد المواد سالباً)؟`);
      if (!proceed) return;
    }

    // Deduct Distilled Water (if product has water) & active ingredients
    const hasWater = computed.hasWater !== false;
    const waterWeight = hasWater ? +(computed.waterWeight * batchUnits).toFixed(2) : 0;
    const updatedMaterials = rawMaterials.map(m => {
      if (Number(m.id) === 1) {
        if (!hasWater || waterWeight <= 0) return m;
        return { ...m, stockQty: Math.max(0, +(Number(m.stockQty || 0) - waterWeight).toFixed(2)) };
      }
      const ing = computed.ingredients.find(i => Number(i.matId) === Number(m.id));
      if (ing) {
        const reqWeight = +(((Number(ing.pct) / 100) * computed.packSize) * batchUnits).toFixed(2);
        return { ...m, stockQty: +(Number(m.stockQty || 0) - reqWeight).toFixed(2) };
      }
      return m;
    });

    // Add to finished product inventory stock
    const existingProdIdx = rawProducts.findIndex(p => p.id === computed.id);
    let updatedProducts: ProductSpec[];
    if (existingProdIdx > -1) {
      updatedProducts = rawProducts.map((p, i) => i === existingProdIdx ? { ...p, stockQty: (Number(p.stockQty) || 0) + batchUnits } : p);
    } else {
      updatedProducts = [...rawProducts, { ...computed, stockQty: (Number(computed.stockQty) || 0) + batchUnits }];
    }

    setRawMaterials(updatedMaterials);
    setRawProducts(updatedProducts);
    saveToStorage(currency, updatedMaterials, updatedProducts, invoices, cart);
    showToast(`🎉 تم تصنيع تشغيلة (${batchUnits} عبوة) بنجاح! تم خصم المواد الخام وإيداع العبوات في مخزون المنتج.`, "success");
  };

  const setBatchUnitsToMaxPossible = (units: number) => {
    if (units <= 0) {
      showToast("لا يتوفر رصيد كافٍ لتصنيع أي عبوة كاملة حالياً، يرجى توريد المواد الناقصة أولاً", "error");
      return;
    }
    updateCalcField('batchUnits', units);
    showToast(`تم ضبط عدد عبوات التشغيلة على ${units} عبوة بناءً على رصيد الخامات المتاح`, "info");
  };

  // Raw Materials Operations
  const addNewRawMaterial = (data: Omit<RawMaterial, 'id'>) => {
    const newId = rawMaterials.reduce((max, m) => Math.max(max, Number(m.id)), 0) + 1;
    const newMat: RawMaterial = { id: newId, ...data };
    const updated = [...rawMaterials, newMat];
    setRawMaterials(updated);
    saveToStorage(currency, updated, rawProducts, invoices, cart);
    showToast(`تمت إضافة "${data.name}" برصيد ${data.stockQty} جم إلى قاعدة البيانات والمخزون`, "success");
  };

  const updateRawMaterialField = (id: number, field: keyof RawMaterial, val: any) => {
    const num = Math.max(0, parseFloat(val) || 0);
    const updated = rawMaterials.map(m => m.id === id ? { ...m, [field]: num } : m);
    setRawMaterials(updated);
    saveToStorage(currency, updated, rawProducts, invoices, cart);
    showToast("تم تحديث بيانات المادة الخام", "info");
  };

  const deleteRawMaterial = (id: number) => {
    if (Number(id) === 1) {
      showToast("الماء المقطر عنصر أساسي ثابت لا يمكن حذفه", "error");
      return;
    }
    const updated = rawMaterials.filter(m => m.id !== id);
    setRawMaterials(updated);
    saveToStorage(currency, updated, rawProducts, invoices, cart);
    showToast("تم حذف المادة الخام من القائمة", "info");
  };

  // Product Catalog Operations
  const updateProductStockField = (prodId: string, field: 'stockQty' | 'minStockAlert', val: number) => {
    const num = Math.max(0, val || 0);
    const updated = rawProducts.map(p => p.id === prodId ? { ...p, [field]: num } : p);
    setRawProducts(updated);
    saveToStorage(currency, rawMaterials, updated, invoices, cart);
    showToast(`تم تحديث مخزون المنتج`, "info");
  };

  const deleteProductFromCatalog = (id: string) => {
    const prod = rawProducts.find(p => p.id === id);
    if (!prod) return;
    if (!window.confirm(`هل أنت متأكد من حذف منتج "${prod.name}" نهائياً من الكتالوج ونقطة البيع؟`)) {
      return;
    }
    const updatedProducts = rawProducts.filter(p => p.id !== id);
    const updatedCart = cart.filter(c => c.prodId !== id);
    setRawProducts(updatedProducts);
    setCart(updatedCart);
    if (currentCalcProduct.id === id) {
      if (updatedProducts.length > 0) {
        setCurrentCalcProduct(updatedProducts[0]);
      } else {
        resetCalculatorToNew();
      }
    }
    saveToStorage(currency, rawMaterials, updatedProducts, invoices, updatedCart);
    showToast(`تم حذف منتج "${prod.name}" من الكتالوج بنجاح`, "info");
  };

  // Restock operations
  const restockItem = (type: 'raw' | 'product', id: string | number, qty: number) => {
    if (type === 'raw') {
      const mat = rawMaterials.find(m => Number(m.id) === Number(id));
      if (!mat) return;
      const updated = rawMaterials.map(m => Number(m.id) === Number(id) ? { ...m, stockQty: (Number(m.stockQty) || 0) + qty } : m);
      setRawMaterials(updated);
      saveToStorage(currency, updated, rawProducts, invoices, cart);
      showToast(`تم توريد وإيداع ${qty.toLocaleString("en-US")} جم في مخزون "${mat.name}" بنجاح!`, "success");
    } else {
      const prod = rawProducts.find(p => p.id === id);
      if (!prod) return;
      const updated = rawProducts.map(p => p.id === id ? { ...p, stockQty: (Number(p.stockQty) || 0) + qty } : p);
      setRawProducts(updated);
      saveToStorage(currency, rawMaterials, updated, invoices, cart);
      showToast(`تم إيداع ${qty.toLocaleString("en-US")} عبوة في مخزون "${prod.name}" بنجاح!`, "success");
    }
  };

  // Backup & Restore
  const exportBackupJSON = () => {
    const dataStr = JSON.stringify({
      currency,
      rawMaterials,
      products: rawProducts,
      invoices,
      expenses,
      cart
    }, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `CosineLab_Backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast("تم تحميل ملف النسخة الاحتياطية بنجاح", "success");
  };

  const importBackupJSON = (jsonStr: string): boolean => {
    try {
      const imported = JSON.parse(jsonStr);
      if (imported.rawMaterials && imported.products) {
        setRawMaterials(imported.rawMaterials);
        setRawProducts(imported.products);
        if (imported.invoices) setInvoices(imported.invoices);
        if (imported.expenses && Array.isArray(imported.expenses)) setExpenses(imported.expenses);
        if (imported.cart) setCart(imported.cart);
        if (imported.currency) {
          if (imported.currency === "SAR" || imported.currency === "ر.س") {
            setCurrencyState("SAR");
          } else if (imported.currency === "USD" || imported.currency === "$") {
            setCurrencyState("USD");
          } else {
            setCurrencyState("YER");
          }
        }
        if (imported.products[0]) setCurrentCalcProduct(imported.products[0]);
        saveToStorage(
          imported.currency || "YER",
          imported.rawMaterials,
          imported.products,
          imported.invoices || [],
          imported.cart || [],
          imported.expenses || []
        );
        showToast("تمت استعادة كافة البيانات والتركيبات بنجاح!", "success");
        return true;
      }
      showToast("ملف النسخة الاحتياطية غير صالح", "error");
      return false;
    } catch (e) {
      showToast("تعذر قراءة ملف النسخة الاحتياطية", "error");
      return false;
    }
  };

  const resetToFactoryDefaults = () => {
    setRawMaterials(DEFAULT_RAW_MATERIALS);
    setRawProducts(DEFAULT_PRODUCTS_SPECS);
    setInvoices(SAMPLE_INVOICES);
    setExpenses(SAMPLE_EXPENSES);
    setCart([
      { prodId: "prod-1", qty: 2, customPrice: null },
      { prodId: "prod-2", qty: 1, customPrice: null }
    ]);
    setCurrentCalcProduct(DEFAULT_PRODUCTS_SPECS[0]);
    saveToStorage(
      "YER",
      DEFAULT_RAW_MATERIALS,
      DEFAULT_PRODUCTS_SPECS,
      SAMPLE_INVOICES,
      [
        { prodId: "prod-1", qty: 2, customPrice: null },
        { prodId: "prod-2", qty: 1, customPrice: null }
      ],
      SAMPLE_EXPENSES
    );
    showToast("تمت استعادة بيانات المصنع الافتراضية (12 منتج و 50 مادة خام)", "success");
  };

  const openPrintModal = (title: string, htmlContent: string) => {
    setPrintData({ isOpen: true, title, htmlContent });
  };

  const closePrintModal = () => {
    setPrintData({ isOpen: false, title: "", htmlContent: "" });
  };

  const openRestockModal = (type: 'raw' | 'product' = 'raw', itemId?: string | number) => {
    setRestockModal({ isOpen: true, type, itemId });
  };

  const closeRestockModal = () => {
    setRestockModal(prev => ({ ...prev, isOpen: false }));
  };

  return (
    <AppContext.Provider
      value={{
        currency,
        currencySymbol,
        currencyConfig,
        setCurrency,
        toDisplayPrice,
        fromDisplayPrice,
        activeTab,
        setActiveTab,
        posCategory,
        setPosCategory,
        posPricingMode,
        setPosPricingMode,
        rawMaterials,
        products,
        cart,
        invoices,
        expenses,
        addExpense,
        deleteExpense,
        currentCalcProduct,
        setCurrentCalcProduct,
        toasts,
        showToast,
        formatMoney,
        addToCart,
        updateCartQty,
        updateCartCustomPrice,
        clearCart,
        completeSale,
        deleteInvoice,
        loadProductIntoCalculator,
        openProductInCalculator,
        resetCalculatorToNew,
        updateCalcField,
        addIngredientRow,
        removeIngredientRow,
        updateIngredientMaterial,
        updateIngredientPct,
        setMultiplier,
        saveCurrentProductToCatalog,
        executeBatchProduction,
        setBatchUnitsToMaxPossible,
        addNewRawMaterial,
        updateRawMaterialField,
        deleteRawMaterial,
        updateProductStockField,
        deleteProductFromCatalog,
        restockItem,
        exportBackupJSON,
        importBackupJSON,
        resetToFactoryDefaults,
        printData,
        openPrintModal,
        closePrintModal,
        restockModal,
        openRestockModal,
        closeRestockModal,
        isBackupModalOpen,
        setIsBackupModalOpen,
        isPWAModalOpen,
        setIsPWAModalOpen
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
};


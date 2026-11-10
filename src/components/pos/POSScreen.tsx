import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { EnrichedCartItem, Invoice, Expense } from '../../types';

const CATEGORIES = ["الكل", "كريمات", "سيروم", "عناية بالشعر", "غسول وتونر", "عناية بالجسم", "واقي شمسي"];

export const getCategoryIcon = (cat: string) => {
  const map: Record<string, string> = {
    "كريمات": "ph-jar",
    "سيروم": "ph-drop-half-bottom",
    "عناية بالشعر": "ph-sparkle",
    "غسول وتونر": "ph-bubbles",
    "عناية بالجسم": "ph-hand-soap",
    "واقي شمسي": "ph-sun"
  };
  return map[cat] || "ph-flask";
};

export const POSScreen: React.FC = () => {
  const {
    products,
    cart,
    invoices,
    expenses,
    currency,
    currencySymbol,
    toDisplayPrice,
    fromDisplayPrice,
    formatMoney,
    posCategory,
    setPosCategory,
    posPricingMode,
    setPosPricingMode,
    addToCart,
    updateCartQty,
    updateCartCustomPrice,
    clearCart,
    completeSale,
    deleteInvoice,
    addExpense,
    deleteExpense,
    openRestockModal,
    openProductInCalculator,
    openPrintModal
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [discount, setDiscount] = useState<number>(0);
  const [showMobileCartModal, setShowMobileCartModal] = useState(false);
  const [showMobileStats, setShowMobileStats] = useState(false);

  // Business & Expenses State
  const [historyTab, setHistoryTab] = useState<'invoices' | 'expenses' | 'analytics'>('invoices');
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [modalExpenseTitle, setModalExpenseTitle] = useState('');
  const [modalExpenseAmount, setModalExpenseAmount] = useState('');
  const [inlineExpenseTitle, setInlineExpenseTitle] = useState('');
  const [inlineExpenseAmount, setInlineExpenseAmount] = useState('');

  // Compute Sales & COGS stats
  let totalSales = 0;
  let totalCOGS = 0;
  let totalGrossProfit = 0;
  let totalUnits = 0;

  invoices.forEach(inv => {
    totalSales += Number(inv.grandTotal) || 0;
    totalCOGS += Number(inv.totalCost) || 0;
    totalGrossProfit += Number(inv.netProfit) || 0;
    totalUnits += Number(inv.unitsCount) || 0;
  });

  // Compute Expenses & Net Business Profit
  let totalExpenses = 0;
  expenses.forEach(exp => {
    totalExpenses += Number(exp.amount) || 0;
  });

  const netBusinessProfit = +(totalGrossProfit - totalExpenses).toFixed(2);
  const grossMargin = totalSales > 0 ? ((totalGrossProfit / totalSales) * 100).toFixed(1) : '0';
  const netMargin = totalSales > 0 ? ((netBusinessProfit / totalSales) * 100).toFixed(1) : '0';
  const expenseRatio = totalSales > 0 ? ((totalExpenses / totalSales) * 100).toFixed(1) : '0';

  const handleModalAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalExpenseTitle.trim()) return;
    const amt = fromDisplayPrice(parseFloat(modalExpenseAmount) || 0);
    addExpense(modalExpenseTitle, amt);
    setModalExpenseTitle('');
    setModalExpenseAmount('');
    setIsExpenseModalOpen(false);
  };

  const handleInlineAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inlineExpenseTitle.trim()) return;
    const amt = fromDisplayPrice(parseFloat(inlineExpenseAmount) || 0);
    addExpense(inlineExpenseTitle, amt);
    setInlineExpenseTitle('');
    setInlineExpenseAmount('');
  };

  // Compute cart enriched data
  const isWholesale = posPricingMode === "wholesale";
  let cartSubtotal = 0;
  let cartTotalCost = 0;
  let cartTotalUnits = 0;
  const enrichedCartItems: EnrichedCartItem[] = [];

  cart.forEach(c => {
    const prod = products.find(p => p.id === c.prodId);
    if (!prod) return;
    const defaultPrice = isWholesale ? +(prod.sellingPrice * 0.8).toFixed(2) : prod.sellingPrice;
    const unitPrice = c.customPrice !== null ? Number(c.customPrice) : defaultPrice;
    const lineTotal = +(unitPrice * c.qty).toFixed(2);
    const lineCost = +(prod.totalUnitCost * c.qty).toFixed(2);
    const lineProfit = +(lineTotal - lineCost).toFixed(2);

    cartSubtotal += lineTotal;
    cartTotalCost += lineCost;
    cartTotalUnits += c.qty;

    enrichedCartItems.push({
      prodId: prod.id,
      name: `${prod.name} (${prod.packSize} ${prod.unit})`,
      shortName: prod.name,
      sizeText: `${prod.packSize} ${prod.unit}`,
      qty: c.qty,
      unitPrice,
      unitCost: prod.totalUnitCost,
      lineTotal,
      lineCost,
      lineProfit
    });
  });

  const safeDiscountInCurrent = Math.max(0, Number(discount) || 0);
  const safeDiscountInYER = Math.max(0, fromDisplayPrice(safeDiscountInCurrent));
  const cartGrandTotal = Math.max(0, +(cartSubtotal - safeDiscountInYER).toFixed(2));
  const cartNetProfit = +(cartGrandTotal - cartTotalCost).toFixed(2);

  // Filter products
  const filteredProducts = products.filter(p => {
    const matchCat = posCategory === "الكل" || p.category === posCategory;
    const q = searchQuery.trim().toLowerCase();
    const matchSearch = !q || p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q);
    return matchCat && matchSearch;
  });

  const handlePrintDraftInvoice = () => {
    if (enrichedCartItems.length === 0) return;
    const now = new Date();
    const inv: Invoice = {
      id: "DRAFT-" + Math.floor(1000 + Math.random() * 9000),
      date: now.toLocaleDateString("ar-EG") + " " + now.toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" }),
      customer: customerName.trim() || "عميل نقدي مباشر",
      mode: isWholesale ? "جملة (-20%)" : "تجزئة",
      unitsCount: cartTotalUnits,
      totalCost: cartTotalCost,
      discount: safeDiscountInYER,
      grandTotal: cartGrandTotal,
      netProfit: cartNetProfit,
      items: enrichedCartItems.map(i => ({ name: i.name, qty: i.qty, price: i.unitPrice }))
    };
    renderInvoicePrintModal(inv);
  };

  const handlePrintSavedInvoice = (inv: Invoice) => {
    renderInvoicePrintModal(inv);
  };

  const renderInvoicePrintModal = (inv: Invoice) => {
    const rowsHtml = inv.items.map((item, i) => `
      <tr class="border-b border-slate-200">
        <td class="py-2 px-3">${i + 1}</td>
        <td class="py-2 px-3 font-bold">${item.name}</td>
        <td class="py-2 px-3 text-center">${item.qty}</td>
        <td class="py-2 px-3 text-center">${toDisplayPrice(item.price).toFixed(2)}</td>
        <td class="py-2 px-3 text-left font-bold">${toDisplayPrice(item.qty * item.price).toFixed(2)} ${currencySymbol}</td>
      </tr>
    `).join("");

    const html = `
      <div class="bg-white p-6 rounded-xl border border-slate-300 text-slate-900 space-y-5" dir="rtl">
        <div class="flex items-center justify-between border-b-2 border-emeraldLab-800 pb-4">
          <div>
            <h2 class="text-xl font-extrabold text-emeraldLab-800">معمل ومبيعات التجميل - CosineLab</h2>
            <p class="text-xs text-slate-500">فاتورة مبيعات مستحضرات تجميل طبيعية</p>
          </div>
          <div class="text-left text-xs space-y-1">
            <div class="font-extrabold text-sm">رقم الفاتورة: ${inv.id}</div>
            <div>التاريخ: ${inv.date}</div>
            <div>العميل: <strong>${inv.customer}</strong> (${inv.mode})</div>
          </div>
        </div>

        <table class="w-full text-right text-xs">
          <thead class="bg-slate-100 text-slate-700 font-bold border-b border-slate-300">
            <tr>
              <th class="py-2.5 px-3">#</th>
              <th class="py-2.5 px-3">المنتج التجميلي</th>
              <th class="py-2.5 px-3 text-center">الكمية</th>
              <th class="py-2.5 px-3 text-center">سعر الوحدة (${currencySymbol})</th>
              <th class="py-2.5 px-3 text-left">الإجمالي (${currencySymbol})</th>
            </tr>
          </thead>
          <tbody>${rowsHtml}</tbody>
        </table>

        <div class="flex justify-end pt-3">
          <div class="w-64 space-y-1.5 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            ${inv.discount > 0 ? `<div class="flex justify-between text-rose-600"><span>الخصم:</span><span>- ${toDisplayPrice(inv.discount).toFixed(2)} ${currencySymbol}</span></div>` : ""}
            <div class="flex justify-between text-base font-extrabold text-emeraldLab-900 pt-1 border-t border-slate-300">
              <span>الإجمالي النهائي:</span>
              <span>${toDisplayPrice(inv.grandTotal).toFixed(2)} ${currencySymbol}</span>
            </div>
          </div>
        </div>

        <div class="text-center text-[11px] text-slate-400 pt-4 border-t border-slate-100">
          شكراً لتعاملكم مع معمل CosineLab لمستحضرات التجميل — صُنعت بكل عناية وفق معايير الجودة
        </div>
      </div>
    `;

    openPrintModal(`فاتورة مبيعات (${inv.id})`, html);
  };

  const handleCheckout = () => {
    completeSale(customerName, safeDiscountInYER);
    setCustomerName('');
    setDiscount(0);
    setShowMobileCartModal(false);
  };

  // Shared Cart Panel Content for both Desktop and Mobile Drawer
  const renderCartContent = () => (
    <div className="space-y-4">
      {/* Customer Name */}
      <div>
        <label className="block text-xs font-bold text-slate-700 mb-1">اسم العميل / الصيدلية:</label>
        <input
          type="text"
          value={customerName}
          onChange={e => setCustomerName(e.target.value)}
          placeholder="عميل نقدي مباشر"
          className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm bg-slate-50 focus:bg-white focus:outline-none focus:border-emeraldLab-600 transition"
        />
      </div>

      {/* Cart Items List */}
      <div className="space-y-2.5 max-h-[300px] sm:max-h-[340px] overflow-y-auto pr-1">
        {enrichedCartItems.length === 0 ? (
          <div className="text-center py-8 px-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            <i className="ph-duotone ph-shopping-bag-open text-4xl text-slate-400"></i>
            <p className="text-xs font-bold text-slate-500 mt-2">السلة فارغة، اختر المنتجات لإضافتها للفاتورة</p>
          </div>
        ) : (
          enrichedCartItems.map(item => (
            <div key={item.prodId} className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h5 className="font-extrabold text-xs sm:text-sm text-slate-800">{item.shortName}</h5>
                  <span className="text-[11px] text-slate-500">الحجم: {item.sizeText} | التكلفة: {toDisplayPrice(item.unitCost).toFixed(2)} {currencySymbol}</span>
                </div>
                <span className="font-extrabold text-xs sm:text-sm text-emeraldLab-800 shrink-0">{formatMoney(item.lineTotal)}</span>
              </div>

              <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-200/60">
                {/* Quantity Controls */}
                <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl p-0.5">
                  <button
                    onClick={() => updateCartQty(item.prodId, 1)}
                    className="w-7 h-7 rounded-lg bg-emeraldLab-50 hover:bg-emeraldLab-100 text-emeraldLab-800 font-extrabold text-sm flex items-center justify-center active:scale-95 transition"
                  >
                    +
                  </button>
                  <span className="px-2.5 text-xs font-extrabold text-slate-800">{item.qty}</span>
                  <button
                    onClick={() => updateCartQty(item.prodId, -1)}
                    className="w-7 h-7 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-extrabold text-sm flex items-center justify-center active:scale-95 transition"
                  >
                    -
                  </button>
                </div>

                {/* Editable Unit Price */}
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="text-slate-500">السعر ({currencySymbol}):</span>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={toDisplayPrice(item.unitPrice)}
                    onChange={e => updateCartCustomPrice(item.prodId, fromDisplayPrice(e.target.value))}
                    className="w-20 px-1.5 py-1 rounded-lg border border-slate-300 text-center font-bold text-xs bg-white"
                  />
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Discount & Totals */}
      <div className="space-y-2 pt-2 border-t border-slate-200/80 text-xs">
        <div className="flex items-center justify-between">
          <span className="text-slate-500 font-medium">المجموع الفرعي:</span>
          <span className="font-bold text-slate-800">{formatMoney(cartSubtotal)}</span>
        </div>

        <div className="flex items-center justify-between gap-2">
          <span className="text-slate-500 font-medium">خصم إضافي:</span>
          <div className="flex items-center gap-1">
            <input
              type="number"
              min="0"
              step="any"
              value={discount}
              onChange={e => setDiscount(Math.max(0, parseFloat(e.target.value) || 0))}
              className="w-20 px-2 py-1 rounded-lg border border-slate-300 text-left font-bold text-xs bg-white text-rose-600"
            />
            <span className="text-slate-500 font-bold">{currencySymbol}</span>
          </div>
        </div>

        <div className="flex items-center justify-between text-slate-500">
          <span>إجمالي تكلفة البضاعة:</span>
          <span className="font-semibold text-slate-700">{formatMoney(cartTotalCost)}</span>
        </div>

        <div className="flex items-center justify-between text-emerald-600 font-bold">
          <span>صافي ربح الفاتورة:</span>
          <span className="font-extrabold text-sm">+{formatMoney(cartNetProfit)}</span>
        </div>

        <div className="flex items-center justify-between text-base font-extrabold text-emeraldLab-900 pt-2 border-t border-slate-200">
          <span>الإجمالي المطلوب:</span>
          <span className="text-xl text-emeraldLab-800">{formatMoney(cartGrandTotal)}</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-2 pt-2">
        <button
          onClick={handleCheckout}
          disabled={enrichedCartItems.length === 0}
          className={`w-full py-3.5 px-4 rounded-2xl font-extrabold text-sm flex items-center justify-center gap-2 shadow-md transition active:scale-95 ${
            enrichedCartItems.length === 0
              ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
              : 'bg-emeraldLab-800 hover:bg-emeraldLab-700 text-white'
          }`}
        >
          <i className="ph-bold ph-check-circle text-lg text-goldLab-300"></i>
          <span>إتمام البيع وحفظ الفاتورة</span>
        </button>

        <button
          onClick={handlePrintDraftInvoice}
          disabled={enrichedCartItems.length === 0}
          className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 border transition ${
            enrichedCartItems.length === 0
              ? 'border-slate-200 text-slate-400 cursor-not-allowed'
              : 'border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-700'
          }`}
        >
          <i className="ph-bold ph-printer text-base"></i>
          <span>معاينة وطباعة الفاتورة</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* 1. Mobile Collapsible Summary Card */}
      <div className="sm:hidden bg-white rounded-2xl p-3.5 shadow-sm border border-slate-200/90">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center text-base font-bold">
              <i className="ph-fill ph-chart-line-up"></i>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block">إجمالي المبيعات</span>
              <strong className="text-sm font-extrabold text-slate-900">{formatMoney(totalSales)}</strong>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className={`text-xs font-bold px-2 py-0.5 rounded-lg border ${
              netBusinessProfit >= 0
                ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                : 'text-rose-700 bg-rose-50 border-rose-200'
            }`}>
              صافي: {netBusinessProfit >= 0 ? '+' : ''}{formatMoney(netBusinessProfit)}
            </span>
            <button
              onClick={() => setShowMobileStats(prev => !prev)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
              title="عرض باقي المؤشرات"
            >
              <i className={`ph-bold ${showMobileStats ? 'ph-caret-up' : 'ph-caret-down'}`}></i>
            </button>
          </div>
        </div>

        {/* Expandable details on mobile */}
        {showMobileStats && (
          <div className="grid grid-cols-2 gap-2 mt-3 pt-2.5 border-t border-slate-100 text-xs animate-fade-in">
            <div className="bg-slate-50 p-2 rounded-xl">
              <span className="text-[10px] text-slate-400">تكلفة البضاعة (COGS)</span>
              <div className="font-bold text-slate-700">{formatMoney(totalCOGS)}</div>
            </div>
            <div className="bg-slate-50 p-2 rounded-xl">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-400">المصروفات</span>
                <button
                  onClick={() => setIsExpenseModalOpen(true)}
                  className="text-[10px] font-extrabold text-rose-600 hover:underline"
                >
                  + إضافة
                </button>
              </div>
              <div className="font-bold text-rose-600">{formatMoney(totalExpenses)}</div>
            </div>
            <div className="bg-slate-50 p-2 rounded-xl">
              <span className="text-[10px] text-slate-400">ربح المنتجات (Gross)</span>
              <div className="font-bold text-slate-800">+{formatMoney(totalGrossProfit)} ({grossMargin}%)</div>
            </div>
            <div className="bg-slate-50 p-2 rounded-xl">
              <span className="text-[10px] text-slate-400">صافي هامش الربح</span>
              <div className={`font-extrabold ${netBusinessProfit >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                {netMargin}%
              </div>
            </div>
            <div className="bg-slate-50 p-2 rounded-xl">
              <span className="text-[10px] text-slate-400">العبوات المباعة</span>
              <div className="font-bold text-goldLab-900">{totalUnits} عبوة</div>
            </div>
            <div className="bg-slate-50 p-2 rounded-xl">
              <span className="text-[10px] text-slate-400">عدد الفواتير</span>
              <div className="font-bold text-slate-800">{invoices.length} فاتورة</div>
            </div>
          </div>
        )}
      </div>

      {/* Desktop Analytics KPI Header Cards */}
      <div className="hidden sm:grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* Total Sales */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/80 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500">إجمالي المبيعات</span>
            <h3 className="text-lg sm:text-2xl font-extrabold text-slate-900 mt-1">{formatMoney(totalSales)}</h3>
            <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1 mt-0.5">
              <i className="ph-bold ph-trend-up"></i>
              <span>{invoices.length} فاتورة مسجلة</span>
            </span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-emeraldLab-50 text-emeraldLab-800 flex items-center justify-center text-xl shrink-0">
            <i className="ph-fill ph-hand-coins"></i>
          </div>
        </div>

        {/* COGS */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/80 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500">تكلفة البضاعة (COGS)</span>
            <h3 className="text-lg sm:text-2xl font-extrabold text-slate-700 mt-1">{formatMoney(totalCOGS)}</h3>
            <span className="text-[11px] text-slate-400 font-medium mt-0.5 block">خامات وتغليف مباشر</span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center text-xl shrink-0">
            <i className="ph-fill ph-calculator"></i>
          </div>
        </div>

        {/* Total Expenses */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-rose-100 bg-gradient-to-br from-white to-rose-50/30 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-rose-800">إجمالي المصروفات</span>
              <button
                onClick={() => setIsExpenseModalOpen(true)}
                className="text-[10px] bg-rose-100 hover:bg-rose-200 text-rose-700 px-1.5 py-0.5 rounded font-extrabold transition"
                title="تسجيل مصروف جديد"
              >
                + تسجيل
              </button>
            </div>
            <h3 className="text-lg sm:text-2xl font-extrabold text-rose-600 mt-1">{formatMoney(totalExpenses)}</h3>
            <span className="text-[11px] text-rose-700/80 font-medium mt-0.5 block">
              {expenses.length} بند (إعلانات/عبوات/تشغيل)
            </span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center text-xl shrink-0">
            <i className="ph-fill ph-receipt-x"></i>
          </div>
        </div>

        {/* Net Business Profit */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-emerald-100 bg-gradient-to-br from-white to-emerald-50/50 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-emerald-800">صافي ربح النشاط</span>
            <h3 className={`text-lg sm:text-2xl font-extrabold mt-1 ${netBusinessProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {netBusinessProfit >= 0 ? '+' : ''}{formatMoney(netBusinessProfit)}
            </h3>
            <span className="text-[11px] text-emerald-700 font-bold mt-0.5 block">
              هامش صافي فعلي: {netMargin}%
            </span>
          </div>
          <div className={`w-11 h-11 rounded-2xl text-white flex items-center justify-center text-xl shrink-0 shadow-sm ${
            netBusinessProfit >= 0 ? 'bg-emerald-500' : 'bg-rose-500'
          }`}>
            <i className={`ph-fill ${netBusinessProfit >= 0 ? 'ph-chart-line-up' : 'ph-chart-line-down'}`}></i>
          </div>
        </div>

        {/* Units Sold */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/80 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500">المنتجات المباعة</span>
            <h3 className="text-lg sm:text-2xl font-extrabold text-goldLab-900 mt-1">{totalUnits} عبوة</h3>
            <span className="text-[11px] text-slate-500 mt-0.5 block">ربح المنتجات: +{formatMoney(totalGrossProfit)}</span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-goldLab-100 text-goldLab-800 flex items-center justify-center text-xl shrink-0">
            <i className="ph-fill ph-shopping-bag"></i>
          </div>
        </div>
      </div>

      {/* 2. Main POS Grid: Products (Left) + Cart Invoice (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Products Showcase (8 Cols) */}
        <div className="lg:col-span-8 space-y-3 sm:space-y-4">
          {/* Filter Bar & Search */}
          <div className="bg-white rounded-2xl sm:rounded-3xl p-3 sm:p-4 shadow-sm border border-slate-200/80 space-y-3">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
              {/* Search Box */}
              <div className="relative flex-1">
                <i className="ph-bold ph-magnifying-glass absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-base"></i>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="ابحث باسم المستحضر أو التصنيف..."
                  className="w-full pr-10 pl-4 py-2 sm:py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm bg-slate-50 focus:bg-white focus:outline-none focus:border-emeraldLab-600 transition"
                />
              </div>

              {/* Retail / Wholesale Mode Switcher */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl shrink-0">
                <button
                  onClick={() => setPosPricingMode('retail')}
                  className={`flex-1 sm:flex-initial py-1.5 sm:py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                    !isWholesale ? 'bg-emeraldLab-800 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <i className="ph-bold ph-tag"></i>
                  <span>تجزئة</span>
                </button>
                <button
                  onClick={() => setPosPricingMode('wholesale')}
                  className={`flex-1 sm:flex-initial py-1.5 sm:py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                    isWholesale ? 'bg-goldLab-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <i className="ph-bold ph-buildings"></i>
                  <span>جملة (-20%)</span>
                </button>
              </div>
            </div>

            {/* Category Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-0.5">
              {CATEGORIES.map(cat => {
                const active = posCategory === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setPosCategory(cat)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-1.5 ${
                      active ? 'bg-emeraldLab-800 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <i className={`ph-fill ${cat === 'الكل' ? 'ph-squares-four' : getCategoryIcon(cat)}`}></i>
                    <span>{cat}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Product Cards Grid */}
          {filteredProducts.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center border border-slate-200">
              <i className="ph-duotone ph-magnifying-glass text-4xl text-slate-400 mx-auto"></i>
              <p className="font-bold text-slate-700 mt-2">لا توجد منتجات مطابقة للبحث</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
              {filteredProducts.map(prod => {
                const effectivePrice = isWholesale ? +(prod.sellingPrice * 0.8).toFixed(2) : prod.sellingPrice;
                const effectiveProfit = +(effectivePrice - prod.totalUnitCost).toFixed(2);
                const stock = Number(prod.stockQty) || 0;
                const minAlert = Number(prod.minStockAlert) || 10;
                const inCartItem = cart.find(c => c.prodId === prod.id);

                return (
                  <div
                    key={prod.id}
                    className="bg-white rounded-2xl sm:rounded-3xl p-3.5 sm:p-4 shadow-sm border border-slate-200/90 card-hover flex flex-col justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1.5 mb-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="px-2 py-0.5 rounded-lg bg-emeraldLab-50 text-emeraldLab-800 border border-emeraldLab-200 text-[11px] font-bold flex items-center gap-1">
                            <i className={`ph-fill ${getCategoryIcon(prod.category)} text-goldLab-600`}></i>
                            {prod.category}
                          </span>
                          {stock <= 0 ? (
                            <span className="px-2 py-0.5 rounded-lg bg-rose-100 text-rose-800 border border-rose-200 text-[10px] font-extrabold flex items-center gap-1">
                              <i className="ph-bold ph-warning-circle"></i>نافد (0)
                            </span>
                          ) : stock <= minAlert ? (
                            <span className="px-2 py-0.5 rounded-lg bg-amber-100 text-amber-800 border border-amber-200 text-[10px] font-bold flex items-center gap-1">
                              <i className="ph-bold ph-warning"></i>مخزون: {stock}
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold flex items-center gap-1">
                              <i className="ph-bold ph-check"></i>مخزون: {stock}
                            </span>
                          )}
                        </div>
                        <span className="text-xs font-extrabold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-lg shrink-0">
                          {prod.packSize} {prod.unit}
                        </span>
                      </div>

                      <h4 className="font-extrabold text-xs sm:text-sm text-slate-800 leading-snug">{prod.name}</h4>

                      {prod.hasWater !== false ? (
                        <div className="mt-2 flex items-center gap-1.5 text-[10px] sm:text-[11px] text-sky-800 bg-sky-50 px-2 py-1 rounded-lg border border-sky-100">
                          <i className="ph-fill ph-drop text-sky-500"></i>
                          <span>ماء مقطر: <strong>{prod.waterPct}%</strong> ({prod.waterWeight} {prod.unit})</span>
                        </div>
                      ) : (
                        <div className="mt-2 flex items-center gap-1.5 text-[10px] sm:text-[11px] text-slate-600 bg-slate-100 px-2 py-1 rounded-lg border border-slate-200">
                          <i className="ph-bold ph-drop-slash text-slate-400"></i>
                          <span>خالٍ من الماء <strong>(100% خامات)</strong></span>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2.5 pt-2 border-t border-slate-100">
                      <div className="grid grid-cols-3 gap-1 text-center bg-slate-50 p-2 rounded-xl border border-slate-100">
                        <div>
                          <div className="text-[10px] text-slate-400 font-semibold">التكلفة ({currencySymbol})</div>
                          <div className="text-xs font-bold text-slate-700">{toDisplayPrice(prod.totalUnitCost).toFixed(2)}</div>
                        </div>
                        <div className="border-x border-slate-200">
                          <div className="text-[10px] text-slate-400 font-semibold">{isWholesale ? 'الجملة' : 'البيع'} ({currencySymbol})</div>
                          <div className="text-xs font-extrabold text-emeraldLab-800">{toDisplayPrice(effectivePrice).toFixed(2)}</div>
                        </div>
                        <div>
                          <div className="text-[10px] text-emerald-600 font-semibold">الربح ({currencySymbol})</div>
                          <div className="text-xs font-extrabold text-emerald-600">+{toDisplayPrice(effectiveProfit).toFixed(2)}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => addToCart(prod.id)}
                          className={`flex-1 ${
                            stock <= 0 ? 'bg-slate-700 hover:bg-slate-600' : 'bg-emeraldLab-800 hover:bg-emeraldLab-700'
                          } text-white font-bold py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm transition active:scale-95`}
                        >
                          <i className="ph-bold ph-plus-circle text-base text-goldLab-300"></i>
                          <span>
                            {inCartItem ? `بالسلة (${inCartItem.qty}) +` : 'إضافة للسلة'}
                          </span>
                        </button>
                        <button
                          onClick={() => openRestockModal('product', prod.id)}
                          title="توريد مخزون فوري"
                          className="p-2.5 rounded-xl bg-goldLab-100 hover:bg-goldLab-200 text-goldLab-900 transition shrink-0"
                        >
                          <i className="ph-bold ph-arrow-down text-base"></i>
                        </button>
                        <button
                          onClick={() => openProductInCalculator(prod.id)}
                          title="فتح التركيبة في الحاسبة"
                          className="p-2.5 rounded-xl bg-slate-100 hover:bg-goldLab-100 text-slate-700 hover:text-goldLab-900 transition shrink-0"
                        >
                          <i className="ph-bold ph-sliders text-base"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Desktop Cart & Checkout Panel (4 Cols, hidden on mobile < lg) */}
        <div className="hidden lg:block lg:col-span-4 space-y-4">
          <div className="bg-white rounded-3xl p-5 shadow-lg border border-slate-200/90 space-y-4 sticky top-20">
            {/* Cart Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-emeraldLab-100 text-emeraldLab-900 flex items-center justify-center text-lg">
                  <i className="ph-fill ph-receipt"></i>
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-800">فاتورة البيع الحالية</h3>
                  <span className="text-[11px] text-slate-500">
                    {enrichedCartItems.length > 0
                      ? `${enrichedCartItems.length} أصناف (${cartTotalUnits} عبوة)`
                      : "السلة فارغة حالياً"}
                  </span>
                </div>
              </div>
              {enrichedCartItems.length > 0 && (
                <button
                  onClick={clearCart}
                  className="text-xs text-rose-500 hover:text-rose-700 font-bold transition flex items-center gap-1"
                >
                  <i className="ph-bold ph-trash"></i>
                  <span>تفريغ</span>
                </button>
              )}
            </div>

            {renderCartContent()}
          </div>
        </div>
      </div>

      {/* Floating Bottom Cart Bar for Mobile (< lg) */}
      {enrichedCartItems.length > 0 && (
        <div className="lg:hidden fixed bottom-16 inset-x-3 z-30 no-print animate-fade-in">
          <button
            onClick={() => setShowMobileCartModal(true)}
            className="w-full bg-emeraldLab-900 text-white rounded-2xl p-3 shadow-2xl border border-emeraldLab-700/80 flex items-center justify-between active:scale-98 transition"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl gold-gradient flex items-center justify-center text-white text-lg shadow-sm">
                <i className="ph-bold ph-shopping-cart"></i>
              </div>
              <div className="text-right">
                <div className="text-xs font-bold text-emeraldLab-200">{enrichedCartItems.length} أصناف ({cartTotalUnits} عبوة)</div>
                <div className="text-sm font-extrabold text-goldLab-300">{formatMoney(cartGrandTotal)}</div>
              </div>
            </div>
            <div className="flex items-center gap-1 text-xs font-bold text-white bg-emeraldLab-800 px-3 py-1.5 rounded-xl border border-emeraldLab-600">
              <span>عرض الفاتورة</span>
              <i className="ph-bold ph-caret-left"></i>
            </div>
          </button>
        </div>
      )}

      {/* Mobile Cart Bottom Sheet Modal */}
      {showMobileCartModal && (
        <div className="lg:hidden fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex flex-col justify-end p-0 no-print animate-fade-in">
          <div className="bg-white rounded-t-3xl max-h-[85vh] overflow-y-auto p-5 space-y-4 shadow-2xl border-t border-slate-200" dir="rtl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emeraldLab-100 text-emeraldLab-900 flex items-center justify-center text-base">
                  <i className="ph-fill ph-receipt"></i>
                </div>
                <h3 className="font-extrabold text-base text-slate-800">سلة المبيعات</h3>
              </div>
              <div className="flex items-center gap-3">
                {enrichedCartItems.length > 0 && (
                  <button onClick={clearCart} className="text-xs text-rose-500 font-bold">تفريغ السلة</button>
                )}
                <button
                  onClick={() => setShowMobileCartModal(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
                >
                  <i className="ph-bold ph-x text-lg"></i>
                </button>
              </div>
            </div>

            {renderCartContent()}
          </div>
        </div>
      )}

      {/* 3. Multi-Tab Business Center: Invoices | Expenses | Financial Analytics */}
      <div className="bg-white rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 shadow-sm border border-slate-200/90 space-y-4">
        {/* Tab Navigation Header (Scrollable on mobile, pills style) */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar w-full sm:w-auto -mx-1 px-1 py-0.5">
            <button
              onClick={() => setHistoryTab('invoices')}
              className={`px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition flex items-center gap-1.5 shrink-0 ${
                historyTab === 'invoices'
                  ? 'bg-emeraldLab-800 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <i className="ph-bold ph-receipt text-sm sm:text-base"></i>
              <span>فواتير المبيعات</span>
              <span className={`px-1.5 py-0.2 text-[10px] sm:text-xs rounded-full font-bold ${
                historyTab === 'invoices' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
              }`}>
                {invoices.length}
              </span>
            </button>

            <button
              onClick={() => setHistoryTab('expenses')}
              className={`px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition flex items-center gap-1.5 shrink-0 ${
                historyTab === 'expenses'
                  ? 'bg-rose-700 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <i className="ph-bold ph-hand-coins text-sm sm:text-base"></i>
              <span>سجل المصروفات</span>
              <span className={`px-1.5 py-0.2 text-[10px] sm:text-xs rounded-full font-bold ${
                historyTab === 'expenses' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
              }`}>
                {expenses.length}
              </span>
            </button>

            <button
              onClick={() => setHistoryTab('analytics')}
              className={`px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition flex items-center gap-1.5 shrink-0 ${
                historyTab === 'analytics'
                  ? 'bg-emeraldLab-800 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <i className="ph-bold ph-chart-polar text-sm sm:text-base"></i>
              <span>التحليل المالي (P&L)</span>
              <span className={`px-1.5 py-0.2 text-[10px] sm:text-xs rounded-full font-bold ${
                historyTab === 'analytics' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
              }`}>
                {netMargin}%
              </span>
            </button>
          </div>

          {/* Quick action button for expenses */}
          {historyTab === 'expenses' && (
            <button
              onClick={() => setIsExpenseModalOpen(true)}
              className="py-2 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 transition shadow-sm active:scale-95 shrink-0 w-full sm:w-auto"
            >
              <i className="ph-bold ph-plus-circle text-sm"></i>
              <span>تسجيل مصروف سريع</span>
            </button>
          )}
        </div>

        {/* Tab 1: Invoices History */}
        {historyTab === 'invoices' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="font-semibold">سجل عمليات البيع المحفوظة</span>
              <span className="font-bold text-emeraldLab-800">إجمالي المبيعات: {formatMoney(totalSales)}</span>
            </div>

            {/* Mobile Card List View (< sm) */}
            <div className="sm:hidden space-y-2.5">
              {invoices.length === 0 ? (
                <div className="py-8 text-center text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <i className="ph-duotone ph-receipt text-3xl mb-1 block text-slate-300"></i>
                  <p className="text-xs font-bold">لا توجد فواتير مبيعات مسجلة بعد</p>
                </div>
              ) : (
                invoices.map((inv, idx) => (
                  <div key={inv.id + idx} className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200/90 space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-extrabold text-xs text-emeraldLab-900">{inv.id}</span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            inv.mode.includes('جملة') ? 'bg-goldLab-100 text-goldLab-900' : 'bg-emeraldLab-100 text-emeraldLab-900'
                          }`}>
                            {inv.mode}
                          </span>
                        </div>
                        <h4 className="font-bold text-xs text-slate-800 mt-1">{inv.customer}</h4>
                        <span className="text-[10px] text-slate-400 block">{inv.date}</span>
                      </div>

                      <div className="text-left shrink-0">
                        <div className="font-black text-sm text-slate-900">{formatMoney(inv.grandTotal)}</div>
                        <span className="text-[10px] font-extrabold text-emerald-600 block">+{formatMoney(inv.netProfit)} ربح</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-200/60 text-xs">
                      <div className="flex items-center gap-2 text-[11px] text-slate-500">
                        <span>{inv.unitsCount} عبوة</span>
                        <span>•</span>
                        <span>تكلفة: {formatMoney(inv.totalCost)}</span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handlePrintSavedInvoice(inv)}
                          className="py-1 px-2.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs flex items-center gap-1 transition"
                        >
                          <i className="ph-bold ph-printer"></i>
                          <span>طباعة</span>
                        </button>
                        <button
                          onClick={() => deleteInvoice(idx)}
                          className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 transition"
                          title="حذف الفاتورة"
                        >
                          <i className="ph-bold ph-trash text-sm"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Desktop Table View (Hidden on mobile < sm) */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-right text-xs min-w-[650px]">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">رقم الفاتورة</th>
                    <th className="py-2.5 px-3">التاريخ</th>
                    <th className="py-2.5 px-3">العميل</th>
                    <th className="py-2.5 px-3">النوع</th>
                    <th className="py-2.5 px-3 text-center">الكمية</th>
                    <th className="py-2.5 px-3">التكلفة</th>
                    <th className="py-2.5 px-3">الإجمالي</th>
                    <th className="py-2.5 px-3">الربح</th>
                    <th className="py-2.5 px-3 text-center">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {invoices.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-slate-400">
                        <i className="ph-duotone ph-receipt text-3xl mb-1 block text-slate-300"></i>
                        لا توجد فواتير مبيعات مسجلة بعد
                      </td>
                    </tr>
                  ) : (
                    invoices.map((inv, idx) => (
                      <tr key={inv.id + idx} className="hover:bg-slate-50 transition">
                        <td className="py-2.5 px-3 font-extrabold text-emeraldLab-800">{inv.id}</td>
                        <td className="py-2.5 px-3 text-[11px] text-slate-500">{inv.date}</td>
                        <td className="py-2.5 px-3 font-bold text-slate-800">{inv.customer}</td>
                        <td className="py-2.5 px-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            inv.mode.includes('جملة') ? 'bg-goldLab-100 text-goldLab-900' : 'bg-emeraldLab-50 text-emeraldLab-800'
                          }`}>
                            {inv.mode}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center font-bold">{inv.unitsCount}</td>
                        <td className="py-2.5 px-3 text-slate-600">{formatMoney(inv.totalCost)}</td>
                        <td className="py-2.5 px-3 font-extrabold text-slate-900">{formatMoney(inv.grandTotal)}</td>
                        <td className="py-2.5 px-3 font-extrabold text-emerald-600">+{formatMoney(inv.netProfit)}</td>
                        <td className="py-2.5 px-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => handlePrintSavedInvoice(inv)}
                              className="p-1.5 rounded-lg bg-slate-100 hover:bg-emeraldLab-100 text-slate-700 transition"
                              title="طباعة"
                            >
                              <i className="ph-bold ph-printer"></i>
                            </button>
                            <button
                              onClick={() => deleteInvoice(idx)}
                              className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 transition"
                              title="حذف"
                            >
                              <i className="ph-bold ph-trash"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 2: Expenses & Outflows */}
        {historyTab === 'expenses' && (
          <div className="space-y-4">
            {/* Quick Add Form (Mobile-first responsive) */}
            <form onSubmit={handleInlineAddExpense} className="bg-slate-50 border border-slate-200/90 rounded-2xl p-3 sm:p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-extrabold text-slate-800">
                  <i className="ph-bold ph-plus-circle text-rose-600 text-base"></i>
                  <span>تسجيل مصروف جديد</span>
                </div>
                <span className="text-[10px] text-slate-400">إعلانات، عبوات، شحن، تشغيل</span>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <input
                  type="text"
                  value={inlineExpenseTitle}
                  onChange={e => setInlineExpenseTitle(e.target.value)}
                  placeholder="بيان أو اسم المصروف (مثال: إعلانات سناب شات، أجزاء عبوات 500 قطعة...)"
                  className="flex-1 px-3 py-2 sm:py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm bg-white focus:outline-none focus:border-rose-500 transition font-medium"
                  required
                />
                <div className="flex items-center gap-2">
                  <div className="relative flex-1 sm:w-36">
                    <input
                      type="number"
                      step="any"
                      min="0.01"
                      value={inlineExpenseAmount}
                      onChange={e => setInlineExpenseAmount(e.target.value)}
                      placeholder="المبلغ"
                      className="w-full px-3 py-2 sm:py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm bg-white focus:outline-none focus:border-rose-500 transition font-bold text-left"
                      required
                    />
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-bold pointer-events-none">
                      {currencySymbol}
                    </span>
                  </div>
                  <button
                    type="submit"
                    className="px-4 py-2 sm:py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs transition active:scale-95 shadow-sm flex items-center justify-center gap-1.5 shrink-0"
                  >
                    <i className="ph-bold ph-check"></i>
                    <span>حفظ</span>
                  </button>
                </div>
              </div>
            </form>

            {/* Expenses List */}
            <div>
              <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                <span>سجل النفقات والمصروفات ({expenses.length} بند)</span>
                <span className="font-extrabold text-rose-600">إجمالي النفقات: {formatMoney(totalExpenses)}</span>
              </div>

              {/* Mobile Card List View (< sm) */}
              <div className="sm:hidden space-y-2">
                {expenses.length === 0 ? (
                  <div className="py-8 text-center text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                    <i className="ph-duotone ph-hand-coins text-3xl mb-1 block text-slate-300"></i>
                    <p className="text-xs font-bold">لا توجد مصروفات مسجلة حتى الآن</p>
                  </div>
                ) : (
                  expenses.map(exp => (
                    <div key={exp.id} className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-2.5">
                      <div className="min-w-0 flex-1">
                        <h4 className="font-bold text-xs text-slate-800 leading-snug">{exp.title}</h4>
                        <span className="text-[10px] text-slate-400 block mt-0.5">{exp.date} • {exp.id}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="font-black text-sm text-rose-600">{formatMoney(exp.amount)}</span>
                        <button
                          onClick={() => deleteExpense(exp.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                          title="حذف المصروف"
                        >
                          <i className="ph-bold ph-trash text-sm"></i>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Desktop Table View (Hidden on mobile < sm) */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-right text-xs min-w-[550px]">
                  <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">كود المصروف</th>
                      <th className="py-2.5 px-3">التاريخ والوقت</th>
                      <th className="py-2.5 px-3">بيان وتفاصيل المصروف</th>
                      <th className="py-2.5 px-3">المبلغ ({currencySymbol})</th>
                      <th className="py-2.5 px-3 text-center">إجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {expenses.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-400">
                          <i className="ph-duotone ph-hand-coins text-3xl mb-1 block text-slate-300"></i>
                          لا توجد مصروفات مسجلة حتى الآن
                        </td>
                      </tr>
                    ) : (
                      expenses.map(exp => (
                        <tr key={exp.id} className="hover:bg-slate-50 transition">
                          <td className="py-2.5 px-3 font-extrabold text-slate-500 text-[11px]">{exp.id}</td>
                          <td className="py-2.5 px-3 text-[11px] text-slate-500">{exp.date}</td>
                          <td className="py-2.5 px-3 font-bold text-slate-800">{exp.title}</td>
                          <td className="py-2.5 px-3 font-extrabold text-rose-600 text-sm">
                            {formatMoney(exp.amount)}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <button
                              onClick={() => deleteExpense(exp.id)}
                              className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 transition"
                              title="حذف المصروف"
                            >
                              <i className="ph-bold ph-trash"></i>
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Financial & Business Analytics (P&L) */}
        {historyTab === 'analytics' && (
          <div className="space-y-4 sm:space-y-5">
            {/* Executive P&L Income Statement Card */}
            <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm border border-slate-200/90 text-slate-800 space-y-4 sm:space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-slate-100 pb-3 sm:pb-4">
                <div>
                  <span className="text-emeraldLab-800 text-[11px] sm:text-xs font-black tracking-wide uppercase">
                    CosineLab Business Financials
                  </span>
                  <h3 className="text-sm sm:text-lg font-black text-slate-900 mt-0.5">
                    قائمة الدخل والتحليل المالي للأرباح (P&L)
                  </h3>
                </div>
                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <span className="text-xs text-slate-500 font-semibold">صافي هامش الربح:</span>
                  <span className={`px-2.5 py-0.5 sm:py-1 rounded-xl text-xs font-black border ${
                    netBusinessProfit >= 0
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : 'bg-rose-50 text-rose-800 border-rose-200'
                  }`}>
                    {netMargin}%
                  </span>
                </div>
              </div>

              {/* Step-by-Step P&L Flow (2x2 grid on mobile + full-width final profit card) */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2 sm:gap-3 text-center">
                {/* 1. Gross Revenue */}
                <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-2.5 sm:p-3.5">
                  <span className="text-[10px] sm:text-[11px] text-slate-500 block font-bold">1. المبيعات (+)</span>
                  <div className="text-base sm:text-lg font-black text-slate-900 mt-0.5 sm:mt-1">{formatMoney(totalSales)}</div>
                  <span className="text-[10px] text-emerald-700 font-bold mt-0.5 block">{invoices.length} فواتير</span>
                </div>

                {/* 2. COGS */}
                <div className="bg-amber-50/60 border border-amber-200/80 rounded-2xl p-2.5 sm:p-3.5">
                  <span className="text-[10px] sm:text-[11px] text-amber-900/80 block font-bold">2. تكلفة الإنتاج (-)</span>
                  <div className="text-base sm:text-lg font-black text-amber-700 mt-0.5 sm:mt-1">-{formatMoney(totalCOGS)}</div>
                  <span className="text-[10px] text-amber-800/80 font-bold mt-0.5 block">{totalUnits} عبوة مصنعة</span>
                </div>

                {/* 3. Gross Margin */}
                <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-2xl p-2.5 sm:p-3.5">
                  <span className="text-[10px] sm:text-[11px] text-emerald-900/80 block font-bold">3. ربح المنتجات (=)</span>
                  <div className="text-base sm:text-lg font-black text-emerald-700 mt-0.5 sm:mt-1">+{formatMoney(totalGrossProfit)}</div>
                  <span className="text-[10px] text-emerald-800/80 font-bold mt-0.5 block">هامش: {grossMargin}%</span>
                </div>

                {/* 4. Operating Expenses */}
                <div className="bg-rose-50/60 border border-rose-200/80 rounded-2xl p-2.5 sm:p-3.5">
                  <span className="text-[10px] sm:text-[11px] text-rose-900/80 block font-bold">4. المصروفات (-)</span>
                  <div className="text-base sm:text-lg font-black text-rose-600 mt-0.5 sm:mt-1">-{formatMoney(totalExpenses)}</div>
                  <span className="text-[10px] text-rose-800/80 font-bold mt-0.5 block">{expenses.length} بنود نفقات</span>
                </div>

                {/* 5. Net Business Profit */}
                <div className={`col-span-2 md:col-span-1 border-2 rounded-2xl p-2.5 sm:p-3.5 ${
                  netBusinessProfit >= 0
                    ? 'bg-emerald-50/90 border-emerald-400'
                    : 'bg-rose-50/90 border-rose-400'
                }`}>
                  <span className="text-[10px] sm:text-[11px] text-slate-700 block font-extrabold">5. صافي الربح الفعلي (=)</span>
                  <div className={`text-lg sm:text-xl font-black mt-0.5 sm:mt-1 ${
                    netBusinessProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'
                  }`}>
                    {netBusinessProfit >= 0 ? '+' : ''}{formatMoney(netBusinessProfit)}
                  </div>
                  <span className={`text-[10px] font-extrabold mt-0.5 block ${
                    netBusinessProfit >= 0 ? 'text-emerald-800' : 'text-rose-800'
                  }`}>
                    {netBusinessProfit >= 0 ? 'ربح صافٍ مستحق' : 'عجز مؤقت'}
                  </span>
                </div>
              </div>

              {/* Visual Distribution Bar */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between text-[11px] sm:text-xs text-slate-600 font-bold">
                  <span>توزيع تدفق الإيرادات:</span>
                  <span>100% من حجم المبيعات</span>
                </div>
                {totalSales > 0 ? (
                  <div className="w-full h-3 sm:h-3.5 rounded-full overflow-hidden flex bg-slate-100 border border-slate-200">
                    <div
                      style={{ width: `${Math.min(100, Math.max(0, (totalCOGS / totalSales) * 100))}%` }}
                      className="bg-amber-400"
                      title={`تكلفة البضاعة: ${formatMoney(totalCOGS)}`}
                    ></div>
                    <div
                      style={{ width: `${Math.min(100, Math.max(0, (totalExpenses / totalSales) * 100))}%` }}
                      className="bg-rose-500"
                      title={`المصروفات: ${formatMoney(totalExpenses)}`}
                    ></div>
                    {netBusinessProfit > 0 && (
                      <div
                        style={{ width: `${Math.min(100, Math.max(0, (netBusinessProfit / totalSales) * 100))}%` }}
                        className="bg-emerald-500"
                        title={`صافي الأرباح: ${formatMoney(netBusinessProfit)}`}
                      ></div>
                    )}
                  </div>
                ) : (
                  <div className="w-full h-3 sm:h-3.5 rounded-full bg-slate-100 border border-slate-200"></div>
                )}
                <div className="flex flex-wrap items-center gap-2.5 sm:gap-4 text-[10px] sm:text-xs font-semibold text-slate-600 pt-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-amber-400"></span>
                    <span>تكلفة البضاعة: {totalSales > 0 ? ((totalCOGS / totalSales) * 100).toFixed(1) : 0}%</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-rose-500"></span>
                    <span>المصروفات: {expenseRatio}%</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-emerald-500"></span>
                    <span>صافي الربح: {netMargin}%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Strategic Health Diagnosis Note */}
            <div className={`p-3.5 sm:p-4 rounded-2xl border flex items-start gap-2.5 sm:gap-3 ${
              netBusinessProfit > 0
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-amber-50 border-amber-200 text-amber-900'
            }`}>
              <div className="text-xl sm:text-2xl shrink-0 mt-0.5">
                <i className={`ph-fill ${netBusinessProfit > 0 ? 'ph-check-circle text-emerald-600' : 'ph-warning text-amber-600'}`}></i>
              </div>
              <div className="space-y-1 text-xs">
                <h5 className="font-extrabold text-xs sm:text-sm">
                  {netBusinessProfit > 0
                    ? 'الأداء المالي ممتاز ومستدام'
                    : 'تنبيه: المصروفات تفوق أو تعادل أرباح المبيعات'}
                </h5>
                <p className="leading-relaxed opacity-90 text-[11px] sm:text-xs">
                  {netBusinessProfit > 0
                    ? `يحقق النشاط هامش ربح صافي قدره ${netMargin}% بعد تغطية تكاليف الخامات وتغليف العبوات وكافة المصروفات التسويقية والتشغيلية (${formatMoney(totalExpenses)}). استمر في تعزيز المنتجات الأكثر ربحية.`
                    : `إجمالي المصروفات (${formatMoney(totalExpenses)}) يستهلك مجمل ربح المبيعات. يُنصح بمراجعة ميزانية الإعلانات، أو رفع أسعار البيع، أو تحسين تكلفة شراء الخامات والعبوات.`}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Mobile Bottom Clearance for Sticky Cart Bar and BottomNav */}
      <div className="h-28 lg:hidden shrink-0" aria-hidden="true" />

      {/* Quick Add Expense Modal */}
      {isExpenseModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in no-print">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4" dir="rtl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center text-lg font-bold">
                  <i className="ph-fill ph-hand-coins"></i>
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-800">تسجيل مصروف جديد</h3>
                  <span className="text-[11px] text-slate-400">إعلانات، عبوات، شحن، تشغيل...</span>
                </div>
              </div>
              <button
                onClick={() => setIsExpenseModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
              >
                <i className="ph-bold ph-x text-lg"></i>
              </button>
            </div>

            <form onSubmit={handleModalAddExpense} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  بيان وتفاصيل المصروف:
                </label>
                <input
                  type="text"
                  value={modalExpenseTitle}
                  onChange={e => setModalExpenseTitle(e.target.value)}
                  placeholder="مثال: إعلانات سناب شات، أجزاء عبوات 500 قطعة..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-slate-50 focus:bg-white focus:outline-none focus:border-rose-500 transition font-medium"
                  autoFocus
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  المبلغ ({currencySymbol}):
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="any"
                    min="0.01"
                    value={modalExpenseAmount}
                    onChange={e => setModalExpenseAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-slate-50 focus:bg-white focus:outline-none focus:border-rose-500 transition font-extrabold text-left"
                    required
                  />
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-bold pointer-events-none">
                    {currencySymbol}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs transition active:scale-95 shadow-md flex items-center justify-center gap-1.5"
                >
                  <i className="ph-bold ph-check"></i>
                  <span>حفظ المصروف</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsExpenseModalOpen(false)}
                  className="py-3 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold text-xs transition"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

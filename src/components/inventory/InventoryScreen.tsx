import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { checkBatchStockFeasibility } from '../../context/AppContext';

export const InventoryScreen: React.FC = () => {
  const {
    rawMaterials,
    products,
    updateRawMaterialField,
    updateProductStockField,
    openRestockModal,
    openProductInCalculator,
    formatMoney,
    currencySymbol,
    toDisplayPrice
  } = useApp();

  const [currentSubTab, setCurrentSubTab] = useState<'raw' | 'products' | 'checker'>('raw');

  // Search & Filter state
  const [rawSearch, setRawSearch] = useState('');
  const [rawFilter, setRawFilter] = useState<'all' | 'low' | 'healthy'>('all');

  const [prodSearch, setProdSearch] = useState('');
  const [prodFilter, setProdFilter] = useState<'all' | 'low' | 'in_stock'>('all');

  // Checker state
  const [checkerProdId, setCheckerProdId] = useState(products[0]?.id || '');
  const [checkerBatchUnits, setCheckerBatchUnits] = useState(100);

  // Compute KPIs
  let rawVal = 0;
  let lowRawCount = 0;
  rawMaterials.forEach(m => {
    const ppg = (Number(m.packPrice) || 0) / (Number(m.packSize) || 1);
    const stock = Number(m.stockQty) || 0;
    rawVal += stock * ppg;
    if (stock <= (Number(m.minStockAlert) || 500)) lowRawCount++;
  });

  let prodUnits = 0;
  let prodCostVal = 0;
  let prodSaleVal = 0;
  let lowProdCount = 0;
  products.forEach(p => {
    const stock = Number(p.stockQty) || 0;
    prodUnits += stock;
    prodCostVal += stock * (Number(p.totalUnitCost) || 0);
    prodSaleVal += stock * (Number(p.sellingPrice) || 0);
    if (stock <= (Number(p.minStockAlert) || 10)) lowProdCount++;
  });

  const totalAlerts = lowRawCount + lowProdCount;

  // Filter Raw Materials
  const filteredRaw = rawMaterials.filter(m => {
    const q = rawSearch.trim().toLowerCase();
    const matchQ = !q || m.name.toLowerCase().includes(q) || m.phase.toLowerCase().includes(q);
    const stock = Number(m.stockQty) || 0;
    const alertThresh = Number(m.minStockAlert) || 500;
    if (!matchQ) return false;
    if (rawFilter === 'low') return stock <= alertThresh;
    if (rawFilter === 'healthy') return stock > alertThresh;
    return true;
  });

  // Filter Products
  const filteredProducts = products.filter(p => {
    const q = prodSearch.trim().toLowerCase();
    const matchQ = !q || p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q);
    const stock = Number(p.stockQty) || 0;
    const alertThresh = Number(p.minStockAlert) || 10;
    if (!matchQ) return false;
    if (prodFilter === 'low') return stock <= alertThresh;
    if (prodFilter === 'in_stock') return stock > 0;
    return true;
  });

  // Checker computations
  const checkedProduct = products.find(p => p.id === checkerProdId) || products[0];
  const checkerFeasibility = checkedProduct
    ? checkBatchStockFeasibility(checkedProduct, checkerBatchUnits, rawMaterials)
    : null;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* 1. Inventory KPIs Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-4">
        {/* Raw Materials Value */}
        <div className="bg-white rounded-2xl sm:rounded-3xl p-3.5 sm:p-4 shadow-sm border border-slate-200/80 flex items-center justify-between">
          <div>
            <span className="text-[10px] sm:text-xs font-bold text-slate-500">قيمة خامات المعمل</span>
            <h3 className="text-base sm:text-2xl font-extrabold text-slate-900 mt-0.5">{formatMoney(rawVal)}</h3>
            <span className="text-[10px] sm:text-[11px] text-emeraldLab-600 font-semibold mt-0.5 block">
              {rawMaterials.length} مادة مسجلة
            </span>
          </div>
          <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-emeraldLab-50 text-emeraldLab-800 flex items-center justify-center text-lg sm:text-xl shrink-0">
            <i className="ph-fill ph-drop-half-bottom"></i>
          </div>
        </div>

        {/* Finished Products Cost */}
        <div className="bg-white rounded-2xl sm:rounded-3xl p-3.5 sm:p-4 shadow-sm border border-slate-200/80 flex items-center justify-between">
          <div>
            <span className="text-[10px] sm:text-xs font-bold text-slate-500">تكلفة مخزون العبوات</span>
            <h3 className="text-base sm:text-2xl font-extrabold text-slate-700 mt-0.5">{formatMoney(prodCostVal)}</h3>
            <span className="text-[10px] sm:text-[11px] text-slate-400 font-medium mt-0.5 block">
              {prodUnits.toLocaleString("en-US")} عبوة تامة
            </span>
          </div>
          <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center text-lg sm:text-xl shrink-0">
            <i className="ph-fill ph-package"></i>
          </div>
        </div>

        {/* Finished Products Retail Sale Value */}
        <div className="bg-white rounded-2xl sm:rounded-3xl p-3.5 sm:p-4 shadow-sm border border-emerald-100 bg-gradient-to-br from-white to-emerald-50/50 flex items-center justify-between">
          <div>
            <span className="text-[10px] sm:text-xs font-bold text-emerald-800">قيمة بيع المخزون</span>
            <h3 className="text-base sm:text-2xl font-extrabold text-emerald-600 mt-0.5">{formatMoney(prodSaleVal)}</h3>
            <span className="text-[10px] sm:text-[11px] text-emerald-700 font-bold mt-0.5 block">
              ربح: {formatMoney(prodSaleVal - prodCostVal)}
            </span>
          </div>
          <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-emerald-500 text-white flex items-center justify-center text-lg sm:text-xl shrink-0 shadow-sm">
            <i className="ph-fill ph-chart-line-up"></i>
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-white rounded-2xl sm:rounded-3xl p-3.5 sm:p-4 shadow-sm border border-slate-200/80 flex items-center justify-between">
          <div>
            <span className="text-[10px] sm:text-xs font-bold text-slate-500">نقص حرج بالمخزون</span>
            <h3 className="text-base sm:text-2xl font-extrabold text-rose-600 mt-0.5">{totalAlerts} أصناف حرجة</h3>
            <span className="text-[10px] sm:text-[11px] text-slate-500 mt-0.5 block">
              {lowRawCount} خامات | {lowProdCount} منتجات
            </span>
          </div>
          <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center text-lg sm:text-xl shrink-0">
            <i className="ph-fill ph-warning-circle"></i>
          </div>
        </div>
      </div>

      {/* 2. Sub-tabs Selector */}
      <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setCurrentSubTab('raw')}
          className={`px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition flex items-center gap-1.5 shrink-0 ${
            currentSubTab === 'raw'
              ? 'bg-emeraldLab-800 text-white shadow-sm'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <i className="ph-bold ph-flask"></i>
          <span>الخامات</span>
          <span className="px-1.5 py-0.2 text-[10px] sm:text-xs rounded-full bg-white/20">{rawMaterials.length}</span>
        </button>

        <button
          onClick={() => setCurrentSubTab('products')}
          className={`px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition flex items-center gap-1.5 shrink-0 ${
            currentSubTab === 'products'
              ? 'bg-emeraldLab-800 text-white shadow-sm'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <i className="ph-bold ph-package"></i>
          <span>المنتجات</span>
          <span className="px-1.5 py-0.2 text-[10px] sm:text-xs rounded-full bg-white/20">{products.length}</span>
        </button>

        <button
          onClick={() => setCurrentSubTab('checker')}
          className={`px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition flex items-center gap-1.5 shrink-0 ${
            currentSubTab === 'checker'
              ? 'bg-emeraldLab-800 text-white shadow-sm'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <i className="ph-bold ph-seal-check"></i>
          <span>فاحص التشغيلات</span>
        </button>
      </div>

      {/* Sub-view 1: Raw Materials Stock */}
      {currentSubTab === 'raw' && (
        <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-sm border border-slate-200/90 space-y-3.5">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 border-b border-slate-100 pb-3">
            <div className="relative flex-1">
              <i className="ph-bold ph-magnifying-glass absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-base"></i>
              <input
                type="text"
                value={rawSearch}
                onChange={e => setRawSearch(e.target.value)}
                placeholder="ابحث باسم المادة الخام..."
                className="w-full pr-10 pl-4 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm bg-slate-50 focus:bg-white focus:outline-none"
              />
            </div>

            <select
              value={rawFilter}
              onChange={e => setRawFilter(e.target.value as any)}
              className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold bg-slate-50 text-slate-700 focus:outline-none"
            >
              <option value="all">كل المواد</option>
              <option value="low">الرصيد الحرج فقط</option>
              <option value="healthy">الرصيد الوفير فقط</option>
            </select>
          </div>

          {/* Mobile Cards for Raw Inventory (< sm) */}
          <div className="sm:hidden space-y-2">
            {filteredRaw.map(mat => {
              const ppg = (Number(mat.packPrice) || 0) / (Number(mat.packSize) || 1);
              const stock = Number(mat.stockQty) || 0;
              const alertThresh = Number(mat.minStockAlert) || 500;
              const isLow = stock <= alertThresh;

              return (
                <div
                  key={mat.id}
                  className={`p-3 rounded-2xl border space-y-2 ${
                    isLow ? 'bg-amber-50/50 border-amber-300' : 'bg-slate-50/60 border-slate-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-extrabold text-xs text-slate-800">{mat.name}</h4>
                      <span className="text-[10px] text-slate-500">{mat.phase}</span>
                    </div>
                    {isLow ? (
                      <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-extrabold border border-amber-200 shrink-0">
                        نقص حرج
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[10px] font-bold border border-emerald-200 shrink-0">
                        وفير
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-200/60 text-xs">
                    <div className="flex items-center gap-1">
                      <span className="text-slate-500 text-[11px]">الرصيد:</span>
                      <input
                        type="number"
                        min="0"
                        step="50"
                        value={stock}
                        onChange={e => updateRawMaterialField(mat.id, 'stockQty', e.target.value)}
                        className="input-excel w-20 px-1.5 py-0.5 rounded-lg text-center font-extrabold text-xs text-emeraldLab-900"
                      />
                      <span className="text-[10px] text-slate-500">جم</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-700">{formatMoney(stock * ppg)}</span>
                      <button
                        onClick={() => openRestockModal('raw', mat.id)}
                        className="px-2.5 py-1 rounded-lg bg-goldLab-100 text-goldLab-900 font-bold text-xs"
                      >
                        + توريد
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop Table View (Hidden on mobile < sm) */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-3 text-center">كود</th>
                  <th className="py-3 px-4">اسم المادة الخام</th>
                  <th className="py-3 px-3">الطور</th>
                  <th className="py-3 px-3 text-center">الرصيد الحالي</th>
                  <th className="py-3 px-3 text-center">حد التنبيه</th>
                  <th className="py-3 px-3 text-center">سعر/جم</th>
                  <th className="py-3 px-3 text-center">القيمة الإجمالية</th>
                  <th className="py-3 px-3 text-center">الحالة</th>
                  <th className="py-3 px-3 text-center">إجراء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRaw.map(mat => {
                  const ppg = (Number(mat.packPrice) || 0) / (Number(mat.packSize) || 1);
                  const stock = Number(mat.stockQty) || 0;
                  const alertThresh = Number(mat.minStockAlert) || 500;
                  const stockValue = stock * ppg;

                  let statusBadge = (
                    <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold text-[11px] inline-flex items-center gap-1">
                      <i className="ph-bold ph-check"></i>رصيد وفير
                    </span>
                  );
                  if (stock <= 0) {
                    statusBadge = (
                      <span className="px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 border border-rose-300 font-extrabold text-[11px] inline-flex items-center gap-1">
                        <i className="ph-bold ph-warning-circle"></i>نافد (0)
                      </span>
                    );
                  } else if (stock <= alertThresh) {
                    statusBadge = (
                      <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-300 font-bold text-[11px] inline-flex items-center gap-1">
                        <i className="ph-bold ph-warning"></i>حد حرج منخفض
                      </span>
                    );
                  }

                  return (
                    <tr key={mat.id} className={`${stock <= alertThresh ? 'bg-amber-50/30' : 'hover:bg-slate-50'} transition`}>
                      <td className="py-3 px-3 text-center font-bold text-slate-400">
                        RM-{String(mat.id).padStart(2, '0')}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-extrabold text-slate-800 text-xs sm:text-sm">{mat.name}</div>
                        <div className="text-[11px] text-slate-500">{mat.phase}</div>
                      </td>
                      <td className="py-3 px-3 text-xs text-slate-600">{mat.phase}</td>
                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <input
                            type="number"
                            min="0"
                            step="50"
                            value={stock}
                            onChange={e => updateRawMaterialField(mat.id, 'stockQty', e.target.value)}
                            className="input-excel w-28 px-2 py-1 rounded-lg text-center font-extrabold text-xs sm:text-sm text-emeraldLab-900"
                          />
                          <span className="text-xs text-slate-500 font-bold">جم</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <input
                          type="number"
                          min="10"
                          step="50"
                          value={alertThresh}
                          onChange={e => updateRawMaterialField(mat.id, 'minStockAlert', e.target.value)}
                          className="w-20 px-2 py-1 rounded-lg text-center text-xs border border-slate-300"
                        />
                      </td>
                      <td className="py-3 px-3 text-center text-xs text-slate-600 font-bold">{ppg.toFixed(4)}</td>
                      <td className="py-3 px-3 text-center font-extrabold text-emeraldLab-800 text-xs sm:text-sm">
                        {formatMoney(stockValue)}
                      </td>
                      <td className="py-3 px-3 text-center">{statusBadge}</td>
                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={() => openRestockModal('raw', mat.id)}
                          className="px-3 py-1.5 rounded-xl bg-goldLab-100 hover:bg-goldLab-200 text-goldLab-900 border border-goldLab-300 text-xs font-bold transition flex items-center justify-center gap-1 mx-auto shadow-sm"
                        >
                          <i className="ph-bold ph-plus-circle"></i>
                          <span>توريد</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Sub-view 2: Finished Products Stock */}
      {currentSubTab === 'products' && (
        <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-sm border border-slate-200/90 space-y-3.5">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 border-b border-slate-100 pb-3">
            <div className="relative flex-1">
              <i className="ph-bold ph-magnifying-glass absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-base"></i>
              <input
                type="text"
                value={prodSearch}
                onChange={e => setProdSearch(e.target.value)}
                placeholder="ابحث باسم المنتج..."
                className="w-full pr-10 pl-4 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm bg-slate-50 focus:bg-white focus:outline-none"
              />
            </div>

            <select
              value={prodFilter}
              onChange={e => setProdFilter(e.target.value as any)}
              className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold bg-slate-50 text-slate-700 focus:outline-none"
            >
              <option value="all">كل المنتجات</option>
              <option value="low">المخزون المنخفض</option>
              <option value="in_stock">المتوفر فقط</option>
            </select>
          </div>

          {/* Mobile Cards for Products (< sm) */}
          <div className="sm:hidden space-y-2">
            {filteredProducts.map((prod, idx) => {
              const stock = Number(prod.stockQty) || 0;
              const alertThresh = Number(prod.minStockAlert) || 10;
              const isLow = stock <= alertThresh;

              return (
                <div
                  key={prod.id}
                  className={`p-3 rounded-2xl border space-y-2 ${
                    isLow ? 'bg-amber-50/50 border-amber-300' : 'bg-slate-50/60 border-slate-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-extrabold text-xs text-slate-800">{idx + 1}. {prod.name}</h4>
                      <span className="text-[10px] text-slate-500">{prod.packSize} {prod.unit} • {prod.category}</span>
                    </div>
                    {stock <= 0 ? (
                      <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-extrabold border border-rose-300 shrink-0">
                        نافد (0)
                      </span>
                    ) : isLow ? (
                      <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold border border-amber-300 shrink-0">
                        منخفض ({stock})
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[10px] font-bold border border-emerald-200 shrink-0">
                        متوفر ({stock})
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-200/60 text-xs">
                    <div className="flex items-center gap-1">
                      <span className="text-slate-500 text-[11px]">الرصيد:</span>
                      <input
                        type="number"
                        min="0"
                        step="5"
                        value={stock}
                        onChange={e => updateProductStockField(prod.id, 'stockQty', parseFloat(e.target.value) || 0)}
                        className="input-excel w-16 px-1.5 py-0.5 rounded-lg text-center font-extrabold text-xs text-emeraldLab-900"
                      />
                      <span className="text-[10px] text-slate-500">عبوة</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => openRestockModal('product', prod.id)}
                        className="px-2.5 py-1 rounded-lg bg-goldLab-100 text-goldLab-900 font-bold text-xs"
                      >
                        + توريد
                      </button>
                      <button
                        onClick={() => openProductInCalculator(prod.id)}
                        className="px-2 py-1 rounded-lg bg-emeraldLab-50 text-emeraldLab-800 text-xs font-bold"
                      >
                        تصنيع
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop Table View (Hidden on mobile < sm) */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-3 text-center">#</th>
                  <th className="py-3 px-4">اسم المستحضر</th>
                  <th className="py-3 px-3">التصنيف</th>
                  <th className="py-3 px-3 text-center">الحجم</th>
                  <th className="py-3 px-3 text-center">الرصيد الحالي</th>
                  <th className="py-3 px-3 text-center">التكلفة ({currencySymbol})</th>
                  <th className="py-3 px-3 text-center">سعر البيع ({currencySymbol})</th>
                  <th className="py-3 px-3 text-center">قيمة التكلفة</th>
                  <th className="py-3 px-3 text-center">قيمة البيع</th>
                  <th className="py-3 px-3 text-center">الحالة</th>
                  <th className="py-3 px-3 text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProducts.map((prod, idx) => {
                  const stock = Number(prod.stockQty) || 0;
                  const alertThresh = Number(prod.minStockAlert) || 10;
                  const costVal = stock * (Number(prod.totalUnitCost) || 0);
                  const saleVal = stock * (Number(prod.sellingPrice) || 0);

                  let statusBadge = (
                    <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold text-[11px] inline-flex items-center gap-1">
                      <i className="ph-bold ph-check"></i>متوفر
                    </span>
                  );
                  if (stock <= 0) {
                    statusBadge = (
                      <span className="px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 border border-rose-300 font-extrabold text-[11px] inline-flex items-center gap-1">
                        <i className="ph-bold ph-warning-circle"></i>نفد المخزون
                      </span>
                    );
                  } else if (stock <= alertThresh) {
                    statusBadge = (
                      <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-300 font-bold text-[11px] inline-flex items-center gap-1">
                        <i className="ph-bold ph-warning"></i>مخزون منخفض
                      </span>
                    );
                  }

                  return (
                    <tr key={prod.id} className={`${stock <= alertThresh ? 'bg-amber-50/30' : 'hover:bg-slate-50'} transition`}>
                      <td className="py-3 px-3 text-center font-bold text-slate-400">{idx + 1}</td>
                      <td className="py-3 px-4 font-extrabold text-slate-800 text-xs sm:text-sm">{prod.name}</td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-xs font-semibold">
                          {prod.category}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center font-bold">{prod.packSize} {prod.unit}</td>
                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <input
                            type="number"
                            min="0"
                            step="5"
                            value={stock}
                            onChange={e => updateProductStockField(prod.id, 'stockQty', parseFloat(e.target.value) || 0)}
                            className="input-excel w-24 px-2 py-1 rounded-lg text-center font-extrabold text-xs sm:text-sm text-emeraldLab-900"
                          />
                          <span className="text-xs text-slate-500 font-bold">عبوة</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-center font-bold text-slate-700">{toDisplayPrice(prod.totalUnitCost).toFixed(2)}</td>
                      <td className="py-3 px-3 text-center font-extrabold text-emeraldLab-800">{toDisplayPrice(prod.sellingPrice).toFixed(2)}</td>
                      <td className="py-3 px-3 text-center font-bold text-slate-800">{formatMoney(costVal)}</td>
                      <td className="py-3 px-3 text-center font-extrabold text-emerald-600">{formatMoney(saleVal)}</td>
                      <td className="py-3 px-3 text-center">{statusBadge}</td>
                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => openRestockModal('product', prod.id)}
                            className="px-2.5 py-1 rounded-lg bg-goldLab-100 hover:bg-goldLab-200 text-goldLab-900 border border-goldLab-300 text-xs font-bold transition flex items-center gap-1 shadow-sm"
                            title="إيداع عبوات جديدة"
                          >
                            <i className="ph-bold ph-plus"></i> توريد
                          </button>
                          <button
                            onClick={() => openProductInCalculator(prod.id)}
                            className="px-2 py-1 rounded-lg bg-emeraldLab-50 hover:bg-emeraldLab-100 text-emeraldLab-800 text-xs font-bold"
                            title="تصنيع تشغيلة بالحاسبة"
                          >
                            تصنيع
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Sub-view 3: Batch Feasibility Checker */}
      {currentSubTab === 'checker' && checkedProduct && (
        <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-sm border border-slate-200/90 space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-slate-800">أداة فحص جاهزية المواد الخام للتشغيلة</h3>
              <p className="text-[11px] sm:text-xs text-slate-500">اختر المنتج وحدد حجم التشغيلة لمعاينة كفاية رصيد المواد الخام فوراً</p>
            </div>

            <div className="flex items-center gap-2 min-w-0 w-full sm:w-auto">
              <select
                value={checkerProdId}
                onChange={e => setCheckerProdId(e.target.value)}
                className="flex-1 min-w-0 sm:flex-initial sm:w-72 truncate px-3 py-2 rounded-xl border border-slate-300 font-bold text-xs bg-slate-50"
              >
                {products.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.packSize} {p.unit})
                  </option>
                ))}
              </select>

              <div className="flex items-center gap-1 bg-slate-50 border border-slate-300 rounded-xl px-2 py-1 shrink-0">
                <span className="text-xs text-slate-500">عبوات:</span>
                <input
                  type="number"
                  min="1"
                  step="10"
                  value={checkerBatchUnits}
                  onChange={e => setCheckerBatchUnits(Math.max(1, parseInt(e.target.value) || 100))}
                  className="w-14 px-1 py-1 text-center font-extrabold text-xs bg-white rounded-lg border border-slate-200"
                />
              </div>
            </div>
          </div>

          {/* Checker Result Output */}
          {checkerFeasibility && (
            <div className="space-y-3">
              {!checkerFeasibility.isFeasible ? (
                <div className="rounded-2xl sm:rounded-3xl border-2 border-rose-300 bg-rose-50/80 p-4 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-rose-200 pb-2">
                    <div className="flex items-center gap-2 text-rose-900 font-extrabold text-xs sm:text-base">
                      <i className="ph-fill ph-warning-circle text-xl sm:text-2xl text-rose-600 shrink-0"></i>
                      <span>عجز بالمواد: الرصيد لا يكفي لإنتاج {checkerBatchUnits} عبوة</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-slate-600 font-bold">أقصى إنتاج متاح:</span>
                      <span className="px-2.5 py-0.5 rounded-xl bg-rose-600 text-white font-extrabold text-xs shadow-sm">
                        {checkerFeasibility.maxPossibleUnits} عبوة
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    {checkerFeasibility.shortages.map(s => (
                      <div key={s.matId} className="p-2.5 bg-white rounded-xl border border-rose-200 flex items-center justify-between gap-2 text-xs">
                        <div>
                          <strong className="text-rose-950 font-extrabold block">{s.name}</strong>
                          <span className="text-[11px] text-slate-500">
                            مطلوب: {s.required.toLocaleString("en-US")} | متاح: {s.available.toLocaleString("en-US")}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-lg bg-rose-100 text-rose-800 font-extrabold text-[11px]">
                            عجز: -{s.shortage.toLocaleString("en-US")}
                          </span>
                          <button
                            onClick={() => openRestockModal('raw', s.matId)}
                            className="px-2 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-[11px] shadow-sm"
                          >
                            توريد
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      onClick={() => openProductInCalculator(checkedProduct.id)}
                      className="px-4 py-2 rounded-xl bg-emeraldLab-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm"
                    >
                      <i className="ph-bold ph-sliders"></i>
                      <span>فتح في الحاسبة والتعديل</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl sm:rounded-3xl border border-emerald-300 bg-emerald-50/80 p-4 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-emerald-950 font-extrabold text-xs sm:text-base">
                      <i className="ph-fill ph-check-circle text-xl sm:text-2xl text-emerald-600"></i>
                      <span>المخزون كافٍ وجاهز لتصنيع تشغيلة {checkerBatchUnits} عبوة</span>
                    </div>
                    <div className="text-xs font-bold text-emerald-800">
                      أقصى تشغيلة: <strong className="bg-emerald-200 text-emerald-950 px-2 py-0.5 rounded-lg">{checkerFeasibility.maxPossibleUnits} عبوة</strong>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-2 border-t border-emerald-200">
                    <button
                      onClick={() => openProductInCalculator(checkedProduct.id)}
                      className="px-4 py-2 rounded-xl bg-emeraldLab-800 hover:bg-emeraldLab-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm"
                    >
                      <i className="ph-bold ph-factory"></i>
                      <span>فتح في الحاسبة والبدء بالتصنيع</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

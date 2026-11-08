import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { getCategoryIcon } from '../pos/POSScreen';

export const CatalogScreen: React.FC = () => {
  const {
    products,
    rawMaterials,
    addToCart,
    setActiveTab,
    openProductInCalculator,
    openRestockModal,
    deleteProductFromCatalog,
    formatMoney,
    currencySymbol,
    toDisplayPrice
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');

  const filteredProducts = products.filter(p => {
    const q = searchQuery.trim().toLowerCase();
    return !q || p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      {/* Search & Header */}
      <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200/90 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-extrabold text-base sm:text-lg text-slate-800">كتالوج المنتجات التجميلية الجاهزة</h2>
          <p className="text-xs text-slate-500">12 تركيبة قياسية جاهزة للإنتاج والتسعير ونقطة البيع</p>
        </div>

        <div className="relative w-full sm:w-80">
          <i className="ph-bold ph-magnifying-glass absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-base"></i>
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="ابحث باسم المنتج أو التصنيف..."
            className="w-full pr-10 pl-4 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm bg-slate-50 focus:bg-white focus:outline-none focus:border-emeraldLab-600 transition"
          />
        </div>
      </div>

      {/* Product Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredProducts.map((prod, idx) => {
          const topIngs = prod.ingredients.slice(0, 4).map(i => {
            const m = rawMaterials.find(rm => Number(rm.id) === Number(i.matId));
            return `${(m?.name || '').split("(")[0].trim()} (${i.pct}%)`;
          }).join(" • ");

          const stock = Number(prod.stockQty) || 0;
          const minAlert = Number(prod.minStockAlert) || 10;

          return (
            <div
              key={prod.id}
              className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200/90 card-hover flex flex-col justify-between gap-4"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-lg bg-emeraldLab-50 text-emeraldLab-800 border border-emeraldLab-200 text-xs font-bold flex items-center gap-1.5">
                      <i className={`ph-fill ${getCategoryIcon(prod.category)} text-goldLab-600`}></i>
                      {prod.category}
                    </span>
                    {stock <= 0 ? (
                      <span className="px-2.5 py-1 rounded-lg bg-rose-100 text-rose-800 border border-rose-300 text-xs font-extrabold flex items-center gap-1">
                        <i className="ph-bold ph-warning-circle"></i>نفد (0)
                      </span>
                    ) : stock <= minAlert ? (
                      <span className="px-2.5 py-1 rounded-lg bg-amber-100 text-amber-800 border border-amber-300 text-xs font-bold flex items-center gap-1">
                        <i className="ph-bold ph-warning"></i>مخزون منخفض ({stock})
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold flex items-center gap-1">
                        <i className="ph-bold ph-check"></i>المخزون: {stock} عبوة
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-extrabold bg-slate-100 text-slate-800 px-3 py-1 rounded-lg">
                    {prod.packSize} {prod.unit}
                  </span>
                </div>

                <h3 className="font-extrabold text-base text-slate-800">{idx + 1}. {prod.name}</h3>

                {/* Water vs Active Breakdown Pill */}
                <div className="p-3 rounded-2xl bg-sky-50/80 border border-sky-200/80 space-y-1.5">
                  <div className="flex justify-between text-xs font-bold text-sky-900">
                    <span><i className="ph-fill ph-drop text-sky-600 ml-1"></i>الماء المقطر: {prod.waterPct}%</span>
                    <span>{prod.waterWeight.toFixed(2)} {prod.unit}</span>
                  </div>
                  <div className="text-[11px] text-slate-600 leading-relaxed">
                    <strong>أبرز المكونات ({prod.activePctSum}%):</strong> {topIngs}...
                  </div>
                </div>
              </div>

              <div className="space-y-3 pt-2 border-t border-slate-100">
                <div className="grid grid-cols-4 gap-1.5 text-center bg-slate-50 p-2.5 rounded-xl border border-slate-200/60">
                  <div>
                    <div className="text-[10px] text-slate-400">التكلفة ({currencySymbol})</div>
                    <div className="text-xs font-extrabold text-slate-800">{toDisplayPrice(prod.totalUnitCost).toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400">المعامل</div>
                    <div className="text-xs font-extrabold text-goldLab-700">{prod.multiplier}x</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400">سعر البيع ({currencySymbol})</div>
                    <div className="text-xs font-extrabold text-emeraldLab-800">{toDisplayPrice(prod.sellingPrice).toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-emerald-600">صافي الربح ({currencySymbol})</div>
                    <div className="text-xs font-extrabold text-emerald-600">+{toDisplayPrice(prod.unitProfit).toFixed(2)}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openProductInCalculator(prod.id)}
                    className="flex-1 bg-emeraldLab-800 hover:bg-emeraldLab-700 text-white font-bold py-2 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 transition active:scale-95"
                  >
                    <i className="ph-bold ph-flask text-base text-goldLab-300"></i>
                    <span>تعديل</span>
                  </button>
                  <button
                    onClick={() => openRestockModal('product', prod.id)}
                    className="bg-goldLab-50 hover:bg-goldLab-100 text-goldLab-900 border border-goldLab-300 font-bold py-2 px-3 rounded-xl text-xs flex items-center gap-1 transition"
                    title="توريد مخزون عبوات"
                  >
                    <i className="ph-bold ph-plus-circle"></i>
                    <span>توريد</span>
                  </button>
                  <button
                    onClick={() => { addToCart(prod.id); setActiveTab('pos'); }}
                    className="bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold py-2 px-3 rounded-xl text-xs flex items-center gap-1 transition"
                    title="بيع سريع"
                  >
                    <i className="ph-bold ph-shopping-cart"></i>
                    <span>بيع</span>
                  </button>
                  <button
                    onClick={() => deleteProductFromCatalog(prod.id)}
                    className="p-2 rounded-xl border border-rose-200 text-rose-500 hover:bg-rose-50 hover:border-rose-300 transition"
                    title="حذف المنتج من الكتالوج"
                  >
                    <i className="ph-bold ph-trash text-base"></i>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Comparison Table */}
      <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200/90 space-y-4">
        <h3 className="font-extrabold text-base text-slate-800 flex items-center gap-2">
          <i className="ph-bold ph-table text-emeraldLab-700"></i>
          <span>جدول المقارنة الشامل للتكاليف وهوامش الربح</span>
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
              <tr>
                <th className="py-3 px-3">#</th>
                <th className="py-3 px-3">اسم المنتج</th>
                <th className="py-3 px-3">التصنيف</th>
                <th className="py-3 px-3 text-center">الحجم</th>
                <th className="py-3 px-3 text-center">نسبة ووزن الماء</th>
                <th className="py-3 px-3 text-center">تكلفة الخامات</th>
                <th className="py-3 px-3 text-center">التعبئة والتشغيل</th>
                <th className="py-3 px-3 text-center">التكلفة الكلية</th>
                <th className="py-3 px-3 text-center">المعامل</th>
                <th className="py-3 px-3 text-center">سعر البيع</th>
                <th className="py-3 px-3 text-center">صافي الربح</th>
                <th className="py-3 px-3 text-center">المخزون</th>
                <th className="py-3 px-3 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.map((prod, idx) => {
                const packAndOh = +(prod.containerCost + prod.labelCost + prod.overheadCost).toFixed(2);
                const stock = Number(prod.stockQty) || 0;
                const minAlert = Number(prod.minStockAlert) || 10;
                let stockClass = "bg-emerald-50 text-emerald-800 border-emerald-200";
                if (stock <= 0) stockClass = "bg-rose-100 text-rose-800 border-rose-300";
                else if (stock <= minAlert) stockClass = "bg-amber-100 text-amber-800 border-amber-300";

                return (
                  <tr key={prod.id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-3 font-bold text-slate-400">{idx + 1}</td>
                    <td className="py-3 px-3 font-extrabold text-slate-800">{prod.name}</td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-xs font-semibold">
                        {prod.category}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center font-bold">{prod.packSize} {prod.unit}</td>
                    <td className="py-3 px-3 text-center text-sky-800 font-bold">
                      {prod.waterPct}% ({prod.waterWeight.toFixed(2)} {prod.unit})
                    </td>
                    <td className="py-3 px-3 text-center font-semibold">{prod.rawMaterialsCost.toFixed(2)}</td>
                    <td className="py-3 px-3 text-center text-slate-600">{packAndOh.toFixed(2)}</td>
                    <td className="py-3 px-3 text-center font-extrabold text-slate-900">{prod.totalUnitCost.toFixed(2)}</td>
                    <td className="py-3 px-3 text-center font-bold text-goldLab-700">{prod.multiplier}x</td>
                    <td className="py-3 px-3 text-center font-extrabold text-emeraldLab-800">{prod.sellingPrice.toFixed(2)}</td>
                    <td className="py-3 px-3 text-center font-extrabold text-emerald-600">+{prod.unitProfit.toFixed(2)}</td>
                    <td className="py-3 px-3 text-center">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold border ${stockClass}`}>
                        {stock} عبوة
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => openRestockModal('product', prod.id)}
                          className="px-2.5 py-1 rounded-lg bg-goldLab-50 hover:bg-goldLab-100 text-goldLab-900 font-bold text-xs flex items-center gap-1"
                          title="توريد مخزون"
                        >
                          <i className="ph-bold ph-plus"></i> توريد
                        </button>
                        <button
                          onClick={() => openProductInCalculator(prod.id)}
                          className="px-2.5 py-1 rounded-lg bg-emeraldLab-50 hover:bg-emeraldLab-100 text-emeraldLab-800 font-bold text-xs"
                        >
                          تعديل
                        </button>
                        <button
                          onClick={() => deleteProductFromCatalog(prod.id)}
                          className="p-1 rounded-lg text-rose-500 hover:bg-rose-50 transition"
                          title="حذف المنتج"
                        >
                          <i className="ph-bold ph-trash"></i>
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
    </div>
  );
};


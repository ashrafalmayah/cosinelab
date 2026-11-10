import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { computeProductMetrics, checkBatchStockFeasibility } from '../../context/AppContext';

export const CalculatorScreen: React.FC = () => {
  const {
    products,
    rawMaterials,
    currentCalcProduct,
    loadProductIntoCalculator,
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
    openRestockModal,
    openPrintModal,
    formatMoney,
    currency,
    currencySymbol,
    toDisplayPrice,
    fromDisplayPrice
  } = useApp();

  const [showMobileSummaryModal, setShowMobileSummaryModal] = useState(false);

  // Compute live metrics for the current product
  const computed = computeProductMetrics(currentCalcProduct, rawMaterials);
  const batchUnits = Number(computed.batchUnits) || 100;
  const packSize = Number(computed.packSize) || 100;
  const unit = computed.unit || "جم";

  // Check Batch Feasibility
  const feasibility = checkBatchStockFeasibility(computed, batchUnits, rawMaterials);

  // Filter selectable materials (excluding water id:1)
  const selectableMaterials = rawMaterials.filter(m => Number(m.id) !== 1);
  const waterMat = rawMaterials.find(m => Number(m.id) === 1);
  const waterPricePerGram = waterMat ? (Number(waterMat.packPrice) / Number(waterMat.packSize)) : 0.0015;
  const waterBatchWeight = computed.hasWater ? +(computed.waterWeight * batchUnits).toFixed(2) : 0;
  const waterItem = feasibility.items.find(i => i.isWater);

  const totalBatchWeightKg = ((packSize * batchUnits) / 1000).toFixed(2);
  const marginPct = computed.sellingPrice > 0 ? Math.round((computed.unitProfit / computed.sellingPrice) * 100) : 0;

  const handlePrintBatchSheet = () => {
    let rowsHtml = '';
    let rowIdx = 1;

    if (computed.hasWater) {
      rowsHtml += `
        <tr class="bg-sky-50 font-bold border-b border-slate-300">
          <td class="py-2 px-3">${rowIdx++}</td>
          <td class="py-2 px-3">${waterMat?.name || 'ماء مقطر'}</td>
          <td class="py-2 px-3">${waterMat?.phase || 'الطور المائي'}</td>
          <td class="py-2 px-3 text-center">${computed.waterPct.toFixed(2)}%</td>
          <td class="py-2 px-3 text-center">${computed.waterWeight.toFixed(2)} ${unit}</td>
          <td class="py-2 px-3 text-center font-extrabold">${(computed.waterWeight * batchUnits).toFixed(1)} ${unit}</td>
          <td class="py-2 px-3 text-center">${computed.waterCost.toFixed(2)}</td>
        </tr>
      `;
    }

    computed.ingredients.forEach((ing) => {
      const mat = rawMaterials.find(m => Number(m.id) === Number(ing.matId));
      if (!mat) return;
      const ppg = Number(mat.packPrice) / Number(mat.packSize);
      const uWeight = (ing.pct / 100) * packSize;
      const bWeight = uWeight * batchUnits;
      const uCost = uWeight * ppg;

      rowsHtml += `
        <tr class="border-b border-slate-200">
          <td class="py-2 px-3">${rowIdx++}</td>
          <td class="py-2 px-3 font-bold">${mat.name}</td>
          <td class="py-2 px-3 text-[11px]">${mat.phase}</td>
          <td class="py-2 px-3 text-center font-bold">${Number(ing.pct).toFixed(2)}%</td>
          <td class="py-2 px-3 text-center">${uWeight.toFixed(2)} ${unit}</td>
          <td class="py-2 px-3 text-center font-extrabold">${bWeight.toFixed(1)} ${unit}</td>
          <td class="py-2 px-3 text-center">${uCost.toFixed(2)}</td>
        </tr>
      `;
    });

    const html = `
      <div class="bg-white p-6 rounded-xl border border-slate-300 text-slate-900 space-y-4" dir="rtl">
        <div class="flex items-center justify-between border-b-2 border-emeraldLab-800 pb-3">
          <div>
            <h2 class="text-lg font-extrabold text-emeraldLab-800">أمر تصنيع وتشغيلة معملية (Batch Manufacturing Record)</h2>
            <p class="text-xs text-slate-600">اسم المستحضر: <strong>${computed.name}</strong> | التصنيف: ${computed.category}</p>
          </div>
          <div class="text-left text-xs">
            <div>حجم العبوة: <strong>${computed.packSize} ${unit}</strong></div>
            <div>عدد عبوات التشغيلة: <strong>${batchUnits} عبوة</strong></div>
            <div>إجمالي وزن التشغيلة: <strong>${totalBatchWeightKg} كجم/لتر</strong></div>
          </div>
        </div>

        <table class="w-full text-right text-xs">
          <thead class="bg-slate-100 font-bold border-b border-slate-300">
            <tr>
              <th class="py-2 px-3">#</th>
              <th class="py-2 px-3">المادة الخام</th>
              <th class="py-2 px-3">الطور</th>
              <th class="py-2 px-3 text-center">النسبة %</th>
              <th class="py-2 px-3 text-center">وزن العبوة</th>
              <th class="py-2 px-3 text-center">إجمالي وزن التشغيلة</th>
              <th class="py-2 px-3 text-center">تكلفة العبوة</th>
            </tr>
          </thead>
          <tbody>${rowsHtml}</tbody>
        </table>

        <div class="grid grid-cols-3 gap-3 pt-2 text-xs">
          <div class="p-3 rounded-lg bg-slate-50 border border-slate-200">
            <div>تكلفة الخامات للعبوة: <strong>${formatMoney(computed.rawMaterialsCost)}</strong></div>
            <div>العبوة والتغليف والتشغيل: <strong>${formatMoney(computed.containerCost + computed.labelCost + computed.overheadCost)}</strong></div>
          </div>
          <div class="p-3 rounded-lg bg-slate-50 border border-slate-200">
            <div>التكلفة النهائية للعبوة: <strong>${formatMoney(computed.totalUnitCost)}</strong></div>
            <div>سعر البيع (${computed.multiplier}x): <strong>${formatMoney(computed.sellingPrice)}</strong></div>
          </div>
          <div class="p-3 rounded-lg bg-emerald-50 border border-emerald-200">
            <div>صافي ربح العبوة: <strong>${formatMoney(computed.unitProfit)}</strong></div>
            <div>صافي ربح التشغيلة: <strong>${formatMoney(computed.unitProfit * batchUnits)}</strong></div>
          </div>
        </div>
      </div>
    `;

    openPrintModal(`أمر تصنيع: ${computed.name}`, html);
  };

  const renderFinancialSummaryContent = () => (
    <div className="space-y-4">
      {/* Cost Breakdown */}
      <div className="space-y-2 text-xs text-slate-600">
        {computed.hasWater ? (
          <div className="flex justify-between">
            <span>تكلفة الماء المقطر للعبوة:</span>
            <span className="font-bold text-slate-800">{formatMoney(computed.waterCost)}</span>
          </div>
        ) : (
          <div className="flex justify-between text-slate-500">
            <span>الطور المائي:</span>
            <span className="font-bold text-slate-600">بدون ماء (خالٍ من الماء)</span>
          </div>
        )}
        <div className="flex justify-between">
          <span>تكلفة المواد الفعالة والمستحلبات:</span>
          <span className="font-bold text-slate-800">{formatMoney(computed.activeCostSum)}</span>
        </div>
        <div className="flex justify-between font-bold text-emeraldLab-900 bg-emeraldLab-50/60 p-2 rounded-xl">
          <span>إجمالي تكلفة الخامات الكيميائية:</span>
          <span>{formatMoney(computed.rawMaterialsCost)}</span>
        </div>
        <div className="flex justify-between">
          <span>تكلفة العبوة والتغليف والملصق:</span>
          <span className="font-bold text-slate-800">{formatMoney(computed.containerCost + computed.labelCost)}</span>
        </div>
        <div className="flex justify-between">
          <span>مصاريف التشغيل والعمالة:</span>
          <span className="font-bold text-slate-800">{formatMoney(computed.overheadCost)}</span>
        </div>
        <div className="flex justify-between font-extrabold text-slate-900 bg-slate-100 p-2.5 rounded-xl border border-slate-200 text-sm">
          <span>التكلفة الكلية للعبوة:</span>
          <span>{formatMoney(computed.totalUnitCost)}</span>
        </div>
      </div>

      {/* Commercial Pricing Result */}
      <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-br from-emeraldLab-900 to-emeraldLab-800 text-white space-y-2.5 shadow-md">
        <div className="flex items-center justify-between">
          <span className="text-xs text-emeraldLab-200">سعر البيع المقترح ({computed.multiplier}x):</span>
          <span className="text-xl sm:text-2xl font-extrabold text-goldLab-300">{formatMoney(computed.sellingPrice)}</span>
        </div>
        <div className="flex items-center justify-between text-xs pt-2 border-t border-emeraldLab-700/80">
          <span className="text-emeraldLab-200">صافي ربح العبوة:</span>
          <span className="font-extrabold text-sm text-emerald-300">+{formatMoney(computed.unitProfit)}</span>
        </div>
      </div>

      {/* Batch Production Totals */}
      <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs">
        <div className="font-extrabold text-slate-800 flex items-center justify-between">
          <span>ملخص تشغيلة ({batchUnits} عبوة):</span>
          <span className="text-slate-500 font-normal">{totalBatchWeightKg} كجم/لتر</span>
        </div>
        <div className="flex justify-between text-slate-600">
          <span>تكلفة الإنتاج الكلية:</span>
          <strong className="text-slate-900">{formatMoney(computed.totalUnitCost * batchUnits)}</strong>
        </div>
        <div className="flex justify-between text-slate-600">
          <span>إيراد بيع التشغيلة:</span>
          <strong className="text-emeraldLab-800">{formatMoney(computed.sellingPrice * batchUnits)}</strong>
        </div>
        <div className="flex justify-between text-emerald-700 font-extrabold pt-1 border-t border-slate-200">
          <span>إجمالي صافي أرباح التشغيلة:</span>
          <strong className="text-sm">+{formatMoney(computed.unitProfit * batchUnits)}</strong>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-2 pt-1">
        <button
          onClick={saveCurrentProductToCatalog}
          className="w-full bg-slate-900 hover:bg-slate-800 text-white font-extrabold py-3 px-4 rounded-xl shadow-sm flex items-center justify-center gap-2 transition active:scale-95 text-xs sm:text-sm"
        >
          <i className="ph-bold ph-floppy-disk text-base text-goldLab-300"></i>
          <span>حفظ التركيبة بالكتالوج ونقطة البيع</span>
        </button>

        <button
          onClick={executeBatchProduction}
          className={`w-full font-extrabold py-3.5 px-4 rounded-xl shadow-md flex items-center justify-center gap-2 transition active:scale-95 text-xs sm:text-sm ${
            !feasibility.isFeasible
              ? 'bg-rose-800 hover:bg-rose-700 text-white border border-rose-600'
              : 'bg-emeraldLab-800 hover:bg-emeraldLab-700 text-white border border-emeraldLab-600'
          }`}
        >
          {!feasibility.isFeasible ? (
            <>
              <i className="ph-bold ph-warning text-lg text-amber-300"></i>
              <span>عجز بالمخزون ({feasibility.shortages.length}) — تصنيع مع هبوط الرصيد</span>
            </>
          ) : (
            <>
              <i className="ph-bold ph-factory text-lg text-goldLab-300"></i>
              <span>تصنيع التشغيلة وإيداعها بالمخزون</span>
            </>
          )}
        </button>

        <button
          onClick={handlePrintBatchSheet}
          className="w-full py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 border border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-700 transition"
        >
          <i className="ph-bold ph-printer text-base"></i>
          <span>أمر تصنيع وتشغيلة معملية (BMR)</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* 1. Preset Selector & Toolbar */}
      <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-sm border border-slate-200/90 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 sm:gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-goldLab-100 text-goldLab-900 flex items-center justify-center text-lg sm:text-xl shrink-0">
            <i className="ph-fill ph-scales"></i>
          </div>
          <div>
            <h2 className="font-extrabold text-sm sm:text-lg text-slate-800">حاسبة تركيبات وتكاليف مستحضرات التجميل</h2>
            <p className="text-[11px] sm:text-xs text-slate-500">موازنة تلقائية 100% مع حساب تكلفة الخامات والتعبئة وهوامش الربح</p>
          </div>
        </div>

        <div className="flex items-center gap-2 min-w-0 w-full sm:w-auto">
          <select
            value={currentCalcProduct.id}
            onChange={e => loadProductIntoCalculator(e.target.value)}
            className="flex-1 min-w-0 sm:flex-initial sm:w-72 truncate px-3 py-2 rounded-xl border border-slate-300 font-bold text-xs bg-slate-50 text-slate-800 focus:outline-none focus:border-emeraldLab-600"
          >
            {products.map((p, i) => (
              <option key={p.id} value={p.id}>
                {i + 1}. {p.name} ({p.packSize} {p.unit})
              </option>
            ))}
          </select>

          <button
            onClick={resetCalculatorToNew}
            className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition active:scale-95 shrink-0"
          >
            <i className="ph-bold ph-plus-circle"></i>
            <span>جديدة</span>
          </button>
        </div>
      </div>

      {/* 2. Main Two Columns: Formula Inputs (8 Cols) + Financial Summary (4 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left 8 Columns: Specifications + Ingredients */}
        <div className="lg:col-span-8 space-y-4 sm:space-y-5">
          {/* Product Specifications Form */}
          <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-sm border border-slate-200/90 space-y-3.5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <h3 className="font-extrabold text-xs sm:text-base text-slate-800 flex items-center gap-1.5">
                <i className="ph-bold ph-sliders-horizontal text-emeraldLab-700"></i>
                <span>مواصفات وتشغيلة المنتج: {computed.name}</span>
              </h3>
              <span className="px-2.5 py-0.5 rounded-lg bg-goldLab-50 text-goldLab-800 border border-goldLab-200 text-[11px] font-bold">
                {computed.category}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3.5 text-xs">
              {/* Product Name */}
              <div className="col-span-2 sm:col-span-2">
                <label className="block font-bold text-slate-600 mb-1">اسم المستحضر:</label>
                <input
                  type="text"
                  value={currentCalcProduct.name}
                  onChange={e => updateCalcField('name', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-extrabold text-xs bg-slate-50 focus:bg-white focus:outline-none focus:border-emeraldLab-600"
                />
              </div>

              {/* Category */}
              <div className="col-span-2 sm:col-span-1">
                <label className="block font-bold text-slate-600 mb-1">تصنيف المستحضر:</label>
                <select
                  value={currentCalcProduct.category}
                  onChange={e => updateCalcField('category', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold text-xs bg-slate-50 focus:bg-white focus:outline-none"
                >
                  <option value="كريمات">كريمات</option>
                  <option value="سيروم">سيروم</option>
                  <option value="عناية بالشعر">عناية بالشعر</option>
                  <option value="غسول وتونر">غسول وتونر</option>
                  <option value="عناية بالجسم">عناية بالجسم</option>
                  <option value="واقي شمسي">واقي شمسي</option>
                </select>
              </div>

              {/* Water Content Toggle */}
              <div className="col-span-2 sm:col-span-3">
                <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0 transition-colors ${
                      computed.hasWater ? 'bg-sky-100 text-sky-700' : 'bg-slate-200 text-slate-500'
                    }`}>
                      <i className={computed.hasWater ? "ph-fill ph-drop" : "ph-bold ph-drop-slash"}></i>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-xs text-slate-800">محتوى الماء المقطر (Aqua):</span>
                        <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                          computed.hasWater
                            ? 'bg-sky-100 text-sky-800 border border-sky-200'
                            : 'bg-amber-100 text-amber-800 border border-amber-200'
                        }`}>
                          {computed.hasWater ? 'يحتوي على ماء' : 'خالٍ من الماء (لامائي)'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {computed.hasWater
                          ? 'يحتوي المنتج على ماء مقطر يتم حسابه تلقائياً لإكمال 100%'
                          : 'تركيبة بدون ماء (زيوت، زبدة، بلسم، أو سيروم زيتي)'}
                      </p>
                    </div>
                  </div>

                  <label className="flex items-center gap-2.5 cursor-pointer select-none bg-white px-3 py-1.5 rounded-xl border border-slate-200 hover:border-slate-300 shadow-sm transition">
                    <input
                      type="checkbox"
                      checked={computed.hasWater}
                      onChange={e => updateCalcField('hasWater', e.target.checked)}
                      className="w-4 h-4 text-sky-600 rounded border-slate-300 focus:ring-sky-500 cursor-pointer"
                    />
                    <span className="font-bold text-xs text-slate-700">
                      {computed.hasWater ? 'يحتوي على ماء' : 'بدون ماء'}
                    </span>
                  </label>
                </div>
              </div>

              {/* Pack Size & Unit */}
              <div>
                <label className="block font-bold text-slate-600 mb-1">حجم العبوة:</label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min="1"
                    value={currentCalcProduct.packSize}
                    onChange={e => updateCalcField('packSize', Math.max(1, parseFloat(e.target.value) || 100))}
                    className="w-full px-2 py-2 rounded-xl border border-slate-200 font-extrabold text-xs text-center bg-slate-50"
                  />
                  <select
                    value={currentCalcProduct.unit}
                    onChange={e => updateCalcField('unit', e.target.value)}
                    className="w-14 px-1 py-2 rounded-xl border border-slate-200 font-bold text-xs bg-slate-50"
                  >
                    <option value="جم">جم</option>
                    <option value="مل">مل</option>
                  </select>
                </div>
              </div>

              {/* Batch Units */}
              <div>
                <label className="block font-bold text-slate-600 mb-1">عبوات التشغيلة:</label>
                <input
                  type="number"
                  min="1"
                  value={currentCalcProduct.batchUnits}
                  onChange={e => updateCalcField('batchUnits', Math.max(1, parseInt(e.target.value) || 100))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-extrabold text-xs text-center bg-slate-50 text-emeraldLab-900"
                />
              </div>

              {/* Container Cost */}
              <div>
                <label className="block font-bold text-slate-600 mb-1">تكلفة الزجاجة/العلبة ({currencySymbol}):</label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={toDisplayPrice(currentCalcProduct.containerCost)}
                  onChange={e => updateCalcField('containerCost', Math.max(0, fromDisplayPrice(e.target.value)))}
                  className="w-full px-2 py-2 rounded-xl border border-slate-200 font-bold text-xs text-center bg-slate-50"
                />
              </div>

              {/* Label Cost */}
              <div>
                <label className="block font-bold text-slate-600 mb-1">تكلفة الملصق ({currencySymbol}):</label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={toDisplayPrice(currentCalcProduct.labelCost)}
                  onChange={e => updateCalcField('labelCost', Math.max(0, fromDisplayPrice(e.target.value)))}
                  className="w-full px-2 py-2 rounded-xl border border-slate-200 font-bold text-xs text-center bg-slate-50"
                />
              </div>

              {/* Overhead Cost */}
              <div>
                <label className="block font-bold text-slate-600 mb-1">تكلفة التشغيل ({currencySymbol}):</label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={toDisplayPrice(computed.overheadCost)}
                  onChange={e => updateCalcField('overheadCost', Math.max(0, fromDisplayPrice(e.target.value)))}
                  className="w-full px-2 py-2 rounded-xl border border-slate-200 font-bold text-xs text-center bg-slate-50"
                />
              </div>

              {/* Multiplier */}
              <div>
                <label className="block font-bold text-slate-600 mb-1">المعامل:</label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min="0.5"
                    step="any"
                    value={currentCalcProduct.multiplier}
                    onChange={e => updateCalcField('multiplier', Math.max(0.5, parseFloat(e.target.value) || 2.5))}
                    className="w-full px-1.5 py-2 rounded-xl border border-slate-200 font-extrabold text-xs text-center bg-slate-50 text-goldLab-900"
                  />
                  <div className="flex items-center gap-0.5 shrink-0">
                    {[2.0, 2.5, 3.0].map(m => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setMultiplier(m)}
                        className={`px-1.5 py-1.5 rounded-lg text-[10px] font-bold ${
                          currentCalcProduct.multiplier === m
                            ? 'bg-goldLab-600 text-white'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {m}x
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Visual Progress Bar (Water vs Active Balance) */}
          <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-sm border border-slate-200/90 space-y-2.5">
            <div className="flex items-center justify-between text-xs font-extrabold">
              {computed.hasWater ? (
                <span className="text-sky-800 flex items-center gap-1">
                  <i className="ph-fill ph-drop text-sky-500"></i>
                  <span>ماء مقطر: {computed.waterPct.toFixed(2)}%</span>
                </span>
              ) : (
                <span className="text-slate-500 flex items-center gap-1">
                  <i className="ph-bold ph-drop-slash text-slate-400"></i>
                  <span>خالٍ من الماء (بدون ماء)</span>
                </span>
              )}
              <span className="text-emeraldLab-800 flex items-center gap-1">
                <i className="ph-fill ph-flask text-emeraldLab-600"></i>
                <span>المواد الفعالة: {computed.activePctSum.toFixed(2)}%</span>
              </span>
            </div>

            <div className="w-full h-5 sm:h-6 rounded-xl bg-slate-100 p-0.5 sm:p-1 flex overflow-hidden border border-slate-200">
              {computed.hasWater && (
                <div
                  style={{ width: `${Math.min(100, Math.max(0, computed.waterPct))}%` }}
                  className="h-full bg-gradient-to-r from-sky-400 to-sky-500 rounded-lg text-white text-[10px] font-bold flex items-center justify-center transition-all duration-300"
                >
                  {computed.waterPct > 12 ? `${computed.waterPct.toFixed(1)}% ماء` : ''}
                </div>
              )}
              <div
                style={{ width: `${Math.min(100, Math.max(0, computed.activePctSum))}%` }}
                className="h-full bg-gradient-to-r from-emeraldLab-600 to-emeraldLab-700 rounded-lg text-white text-[10px] font-bold flex items-center justify-center transition-all duration-300"
              >
                {computed.activePctSum > 12 ? `${computed.activePctSum.toFixed(1)}% مواد` : ''}
              </div>
            </div>

            {computed.activePctSum > 100.001 && (
              <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-300 text-rose-800 font-extrabold text-xs flex items-center gap-2">
                <i className="ph-fill ph-warning text-lg text-rose-600 shrink-0"></i>
                <span>تحذير: مجموع نسب المواد تجاوز 100%!</span>
              </div>
            )}
            {!computed.hasWater && computed.activePctSum < 99.99 && (
              <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-800 font-extrabold text-xs flex items-center gap-2">
                <i className="ph-fill ph-info text-lg text-amber-600 shrink-0"></i>
                <span>ملاحظة: مجموع نسب الخامات في التركيبة الخالية من الماء هو {computed.activePctSum.toFixed(2)}% (المتبقي للوصول إلى 100%: {(100 - computed.activePctSum).toFixed(2)}%)</span>
              </div>
            )}
          </div>

          {/* Batch Stock Feasibility & Shortage Banner */}
          <div className="rounded-2xl sm:rounded-3xl shadow-sm overflow-hidden">
            {!feasibility.isFeasible ? (
              <div className="bg-rose-50/90 border-2 border-rose-300 rounded-2xl sm:rounded-3xl p-4 sm:p-5 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-rose-200 pb-2.5">
                  <div className="flex items-center gap-2 text-rose-800 font-extrabold text-xs sm:text-base">
                    <i className="ph-fill ph-warning-octagon text-xl sm:text-2xl text-rose-600 shrink-0"></i>
                    <span>عجز بالمواد: لا تكفي لإنتاج {batchUnits} عبوة</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-rose-900">أقصى إنتاج:</span>
                    <span className="px-2.5 py-0.5 rounded-xl bg-rose-600 text-white font-extrabold text-xs shadow-sm">
                      {feasibility.maxPossibleUnits} عبوة
                    </span>
                    {feasibility.maxPossibleUnits > 0 && (
                      <button
                        onClick={() => setBatchUnitsToMaxPossible(feasibility.maxPossibleUnits)}
                        className="px-2.5 py-0.5 rounded-xl bg-white hover:bg-rose-100 text-rose-800 border border-rose-300 font-bold text-xs transition"
                      >
                        ضبط
                      </button>
                    )}
                  </div>
                </div>

                <div className="space-y-1.5">
                  {feasibility.shortages.map(s => (
                    <div
                      key={s.matId}
                      className="flex flex-wrap items-center justify-between gap-2 p-2 rounded-xl bg-white/90 border border-rose-200 text-xs"
                    >
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0"></span>
                        <span className="font-extrabold text-rose-950">{s.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-lg bg-rose-100 text-rose-800 font-extrabold border border-rose-300 text-[11px]">
                          عجز: -{s.shortage.toLocaleString("en-US")} {unit}
                        </span>
                        <button
                          onClick={() => openRestockModal('raw', s.matId)}
                          className="px-2 py-0.5 rounded-lg bg-emeraldLab-800 text-white font-bold text-[11px] flex items-center gap-1 shadow-sm"
                        >
                          توريد
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-emerald-50/90 border border-emerald-300 rounded-2xl sm:rounded-3xl p-3.5 sm:p-4 shadow-sm flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-emerald-900 font-extrabold text-xs sm:text-sm">
                  <i className="ph-fill ph-check-circle text-xl sm:text-2xl text-emerald-600 shrink-0"></i>
                  <span>رصيد المواد كافٍ لتشغيلة {batchUnits} عبوة</span>
                </div>
                <div className="text-xs font-bold text-emerald-800">
                  أقصى تشغيلة: <strong className="bg-emerald-200 text-emerald-950 px-2 py-0.5 rounded-lg">{feasibility.maxPossibleUnits} عبوة</strong>
                </div>
              </div>
            )}
          </div>

          {/* Ingredients Section (Dual Responsive: Mobile Cards vs Desktop Table) */}
          <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-sm border border-slate-200/90 space-y-3.5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emeraldLab-50 text-emeraldLab-800 flex items-center justify-center text-base">
                  <i className="ph-bold ph-list-numbers"></i>
                </div>
                <h3 className="font-extrabold text-sm sm:text-base text-slate-800">مكونات وخامات التركيبة</h3>
              </div>
              <div className="flex items-center gap-2">
                {!computed.hasWater && (
                  <button
                    type="button"
                    onClick={() => updateCalcField('hasWater', true)}
                    className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-300 text-xs font-extrabold flex items-center gap-1.5 shadow-sm transition active:scale-95"
                    title="إضافة ماء مقطر إلى التركيبة"
                  >
                    <i className="ph-bold ph-drop text-sky-600"></i>
                    <span>إضافة ماء</span>
                  </button>
                )}
                <button
                  onClick={addIngredientRow}
                  className="px-3 py-1.5 rounded-xl bg-emeraldLab-800 hover:bg-emeraldLab-700 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-sm transition active:scale-95"
                >
                  <i className="ph-bold ph-plus-circle"></i>
                  <span>إضافة مادة</span>
                </button>
              </div>
            </div>

            {/* Mobile Cards View (< sm) */}
            <div className="sm:hidden space-y-2.5">
              {/* Water Card (Only if hasWater is true) */}
              {computed.hasWater && (
                <div className="p-3.5 rounded-2xl bg-sky-50/90 border border-sky-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-xs text-sky-950 flex items-center gap-1.5">
                      <i className="ph-fill ph-drop text-sky-600"></i>
                      <span>ماء مقطر (Distilled Water)</span>
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold text-sky-800 bg-sky-100 px-2 py-0.5 rounded-lg">الطور المائي</span>
                      <button
                        type="button"
                        onClick={() => updateCalcField('hasWater', false)}
                        className="p-1 rounded-lg text-rose-500 hover:bg-rose-100 transition"
                        title="إزالة الماء من التركيبة"
                      >
                        <i className="ph-bold ph-trash text-sm"></i>
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center bg-white/80 p-2 rounded-xl text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block">النسبة</span>
                      <strong className="text-sky-900 font-extrabold">{computed.waterPct.toFixed(2)}%</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">وزن العبوة</span>
                      <strong className="text-slate-800">{computed.waterWeight.toFixed(2)} {unit}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">التكلفة</span>
                      <strong className="text-emeraldLab-800">{formatMoney(computed.waterCost)}</strong>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-[11px] pt-1 border-t border-sky-200/60 text-slate-600">
                    <span>وزن التشغيلة: {waterBatchWeight.toLocaleString("en-US")} {unit}</span>
                    <span className="text-emerald-700 font-bold">متوفر بالمخزون ✓</span>
                  </div>
                </div>
              )}

              {/* Active Ingredients Mobile Cards */}
              {computed.ingredients.map((ing, idx) => {
                const mat = rawMaterials.find(m => Number(m.id) === Number(ing.matId)) || rawMaterials[0];
                const ppg = (Number(mat.packPrice) / Number(mat.packSize)) || 0;
                const uWeight = (ing.pct / 100) * packSize;
                const uCost = uWeight * ppg;
                const bWeight = uWeight * batchUnits;
                const ingFeas = feasibility.items.find(i => Number(i.matId) === Number(ing.matId));

                return (
                  <div key={idx} className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2.5">
                    <div className="flex items-center justify-between gap-2 min-w-0 w-full">
                      <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 text-[10px] font-bold flex items-center justify-center shrink-0">
                        {computed.hasWater ? idx + 2 : idx + 1}
                      </span>
                      <select
                        value={ing.matId}
                        onChange={e => updateIngredientMaterial(idx, Number(e.target.value))}
                        className="input-excel flex-1 min-w-0 truncate px-2.5 py-1.5 rounded-xl text-xs font-bold text-slate-800"
                      >
                        {selectableMaterials.map(m => (
                          <option key={m.id} value={m.id}>
                            {m.name}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={() => removeIngredientRow(idx)}
                        className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 transition shrink-0"
                        title="حذف"
                      >
                        <i className="ph-bold ph-trash text-base"></i>
                      </button>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 px-1">
                      <span>{mat.phase}</span>
                      <span className="text-emeraldLab-700 font-medium">موصى: {mat.usage}</span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center bg-white p-2 rounded-xl border border-slate-200/60 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 block mb-0.5">النسبة</span>
                        <div className="flex items-center justify-center gap-0.5">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="any"
                            value={ing.pct}
                            onChange={e => updateIngredientPct(idx, Math.max(0, parseFloat(e.target.value) || 0))}
                            className="input-excel w-14 px-1 py-0.5 rounded-lg text-center font-extrabold text-xs text-emeraldLab-900"
                          />
                          <span className="font-bold text-slate-500">%</span>
                        </div>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block mb-0.5">وزن العبوة</span>
                        <strong className="text-slate-800">{uWeight.toFixed(2)} {unit}</strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block mb-0.5">التكلفة</span>
                        <strong className="text-emeraldLab-800">{formatMoney(uCost)}</strong>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-200/60 px-1">
                      <span className="text-slate-600">تشغيلة: {bWeight.toFixed(1)} {unit}</span>
                      {ingFeas && ingFeas.shortage > 0 ? (
                        <span className="px-2 py-0.5 rounded-lg bg-rose-100 text-rose-800 font-extrabold text-[10px]">
                          عجز: -{ingFeas.shortage.toFixed(1)} {unit}
                        </span>
                      ) : (
                        <span className="text-emerald-700 font-bold text-[10px]">متوفر ✓</span>
                      )}
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
                    <th className="py-2.5 px-3 text-center">#</th>
                    <th className="py-2.5 px-3 min-w-[180px]">المادة الخام</th>
                    <th className="py-2.5 px-3 min-w-[140px]">الطور والوظيفة</th>
                    <th className="py-2.5 px-3 text-center min-w-[90px]">النسبة %</th>
                    <th className="py-2.5 px-3 text-center">وزن العبوة</th>
                    <th className="py-2.5 px-3 text-center">سعر/جم</th>
                    <th className="py-2.5 px-3 text-center">التكلفة</th>
                    <th className="py-2.5 px-3 text-center">وزن التشغيلة</th>
                    <th className="py-2.5 px-3 text-center min-w-[110px]">حالة المخزون</th>
                    <th className="py-2.5 px-2 text-center">حذف</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {/* Row 1: Fixed Distilled Water (if hasWater is true) */}
                  {computed.hasWater && (
                    <tr className="water-row font-bold">
                      <td className="py-2.5 px-3 text-center font-extrabold text-sky-800">1</td>
                      <td className="py-2.5 px-3">
                        <div className="font-extrabold text-sky-950 flex items-center gap-1.5">
                          <i className="ph-fill ph-drop text-sky-600"></i>
                          <span>{waterMat?.name || 'ماء مقطر (Distilled Water)'}</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="text-xs text-sky-900">{waterMat?.phase}</span>
                        <div className="text-[10px] text-sky-600 font-bold">إكمال تلقائي حتى 100%</div>
                      </td>
                      <td className="py-2.5 px-3 text-center font-extrabold text-sky-900 text-sm">
                        {computed.waterPct.toFixed(2)}%
                      </td>
                      <td className="py-2.5 px-3 text-center font-extrabold text-sky-900">
                        {computed.waterWeight.toFixed(2)} {unit}
                      </td>
                      <td className="py-2.5 px-3 text-center text-slate-500">{waterPricePerGram.toFixed(4)}</td>
                      <td className="py-2.5 px-3 text-center font-extrabold text-emeraldLab-800">
                        {computed.waterCost.toFixed(2)}
                      </td>
                      <td className="py-2.5 px-3 text-center font-semibold text-slate-700">
                        {waterBatchWeight.toLocaleString("en-US", { maximumFractionDigits: 1 })} {unit}
                      </td>
                      <td className="py-2.5 px-3 text-center font-bold text-xs">
                        {waterItem && waterItem.shortage > 0 ? (
                          <div>
                            <span className="px-2 py-0.5 rounded-lg bg-rose-100 text-rose-800 text-[11px] font-bold border border-rose-300 block">
                              عجز: -{waterItem.shortage.toFixed(1)} {unit}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[11px] font-bold text-emerald-700 block">متوفر بالمخزون ✓</span>
                        )}
                      </td>
                      <td className="py-2.5 px-2 text-center">
                        <button
                          type="button"
                          onClick={() => updateCalcField('hasWater', false)}
                          className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 hover:text-rose-700 transition"
                          title="إزالة الماء من التركيبة"
                        >
                          <i className="ph-bold ph-trash text-base"></i>
                        </button>
                      </td>
                    </tr>
                  )}

                  {/* Active Ingredients Rows */}
                  {computed.ingredients.map((ing, idx) => {
                    const mat = rawMaterials.find(m => Number(m.id) === Number(ing.matId)) || rawMaterials[0];
                    const ppg = (Number(mat.packPrice) / Number(mat.packSize)) || 0;
                    const uWeight = (ing.pct / 100) * packSize;
                    const uCost = uWeight * ppg;
                    const bWeight = uWeight * batchUnits;
                    const ingFeas = feasibility.items.find(i => Number(i.matId) === Number(ing.matId));

                    return (
                      <tr key={idx} className="hover:bg-amber-50/40 transition">
                        <td className="py-2.5 px-3 text-center font-bold text-slate-400">
                          {computed.hasWater ? idx + 2 : idx + 1}
                        </td>
                        <td className="py-2.5 px-3">
                          <select
                            value={ing.matId}
                            onChange={e => updateIngredientMaterial(idx, Number(e.target.value))}
                            className="input-excel w-full px-2.5 py-1.5 rounded-xl text-xs font-bold text-slate-800"
                          >
                            {selectableMaterials.map(m => (
                              <option key={m.id} value={m.id}>
                                {m.name}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="text-xs font-semibold text-slate-600">{mat.phase}</div>
                          <div className="text-[10px] text-emeraldLab-600">النسبة الموصى بها: {mat.usage}</div>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              step="any"
                              value={ing.pct}
                              onChange={e => updateIngredientPct(idx, Math.max(0, parseFloat(e.target.value) || 0))}
                              className="input-excel w-20 px-2 py-1.5 rounded-xl text-center font-extrabold text-sm text-emeraldLab-900"
                            />
                            <span className="text-xs font-bold text-slate-500">%</span>
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-center font-bold text-slate-800">
                          {uWeight.toFixed(2)} {unit}
                        </td>
                        <td className="py-2.5 px-3 text-center text-slate-500">{ppg.toFixed(4)}</td>
                        <td className="py-2.5 px-3 text-center font-extrabold text-emeraldLab-800">
                          {uCost.toFixed(2)}
                        </td>
                        <td className="py-2.5 px-3 text-center font-semibold text-slate-700">
                          {bWeight.toLocaleString("en-US", { maximumFractionDigits: 1 })} {unit}
                        </td>
                        <td className="py-2.5 px-3 text-center font-bold text-xs">
                          {ingFeas && ingFeas.shortage > 0 ? (
                            <span className="px-2 py-0.5 rounded-lg bg-rose-100 text-rose-800 text-[11px] font-bold border border-rose-300 block">
                              عجز: -{ingFeas.shortage.toFixed(1)} {unit}
                            </span>
                          ) : (
                            <span className="text-[11px] font-bold text-emerald-700 block">متوفر ✓</span>
                          )}
                        </td>
                        <td className="py-2.5 px-2 text-center">
                          <button
                            onClick={() => removeIngredientRow(idx)}
                            className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 transition"
                            title="حذف المادة"
                          >
                            <i className="ph-bold ph-trash"></i>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right 4 Columns: Financial Viability Card & Actions (Desktop) */}
        <div className="hidden lg:block lg:col-span-4 space-y-4">
          <div className="bg-white rounded-3xl p-5 shadow-lg border border-slate-200/90 space-y-4 sticky top-20">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-goldLab-100 text-goldLab-900 flex items-center justify-center text-lg">
                  <i className="ph-fill ph-chart-pie"></i>
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-800">التسعير والجدوى التجارية</h3>
                  <p className="text-[11px] text-slate-500">حساب تكلفة العبوة وهامش ربح التشغيلة</p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-extrabold bg-emerald-50 text-emerald-800 border border-emerald-200">
                هامش {marginPct}%
              </span>
            </div>

            {renderFinancialSummaryContent()}
          </div>
        </div>
      </div>

      {/* Mobile Bottom Clearance for Sticky Actions Bar and BottomNav */}
      <div className="h-28 lg:hidden shrink-0" aria-hidden="true" />

      {/* Floating Bottom Metrics & Action Bar for Mobile (< lg) */}
      <div className="lg:hidden fixed bottom-16 inset-x-3 z-30 no-print animate-fade-in">
        <button
          onClick={() => setShowMobileSummaryModal(true)}
          className="w-full bg-slate-900 text-white rounded-2xl p-3 shadow-2xl border border-slate-700 flex items-center justify-between active:scale-98 transition"
        >
          <div className="flex items-center gap-2.5 text-right">
            <div className="w-9 h-9 rounded-xl gold-gradient flex items-center justify-center text-white text-lg shadow-sm">
              <i className="ph-bold ph-coins"></i>
            </div>
            <div>
              <div className="text-[11px] text-slate-300">تكلفة: {formatMoney(computed.totalUnitCost)}</div>
              <div className="text-sm font-extrabold text-goldLab-300">بيع: {formatMoney(computed.sellingPrice)} (+{formatMoney(computed.unitProfit)})</div>
            </div>
          </div>
          <div className="flex items-center gap-1 text-xs font-bold text-white bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700">
            <span>التسعير والتصنيع</span>
            <i className="ph-bold ph-caret-left"></i>
          </div>
        </button>
      </div>

      {/* Mobile Financial Summary Bottom Sheet */}
      {showMobileSummaryModal && (
        <div className="lg:hidden fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex flex-col justify-end p-0 no-print animate-fade-in">
          <div className="bg-white rounded-t-3xl max-h-[85vh] overflow-y-auto p-5 space-y-4 shadow-2xl border-t border-slate-200" dir="rtl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-goldLab-100 text-goldLab-900 flex items-center justify-center text-base">
                  <i className="ph-fill ph-chart-pie"></i>
                </div>
                <h3 className="font-extrabold text-base text-slate-800">التسعير والجدوى التجارية</h3>
              </div>
              <button
                onClick={() => setShowMobileSummaryModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <i className="ph-bold ph-x text-lg"></i>
              </button>
            </div>

            {renderFinancialSummaryContent()}
          </div>
        </div>
      )}
    </div>
  );
};

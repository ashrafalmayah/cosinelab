import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';

export const MaterialsScreen: React.FC = () => {
  const {
    rawMaterials,
    addNewRawMaterial,
    updateRawMaterialField,
    deleteRawMaterial,
    openRestockModal,
    currency,
    currencySymbol,
    toDisplayPrice,
    fromDisplayPrice,
    formatMoney
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [phaseFilter, setPhaseFilter] = useState('all');
  const [showAddForm, setShowAddForm] = useState(false);

  // New Material form state
  const [newMatName, setNewMatName] = useState('');
  const [newMatPhase, setNewMatPhase] = useState('مادة خام تجميلية');
  const [newMatUsage, setNewMatUsage] = useState('1% - 5%');
  const [newMatPackSize, setNewMatPackSize] = useState(1000);
  const [newMatPackPrice, setNewMatPackPrice] = useState(currency === 'YER' ? 1400 : 10);
  const [newMatStockQty, setNewMatStockQty] = useState(2000);

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMatName.trim()) return;

    addNewRawMaterial({
      name: newMatName.trim(),
      phase: newMatPhase.trim() || 'مادة خام تجميلية',
      usage: newMatUsage.trim() || '1% - 5%',
      packSize: Math.max(1, newMatPackSize),
      packPrice: Math.max(0.01, fromDisplayPrice(newMatPackPrice)),
      stockQty: Math.max(0, newMatStockQty),
      minStockAlert: 500
    });

    setNewMatName('');
    setShowAddForm(false);
  };

  const filteredMaterials = rawMaterials.filter(m => {
    const q = searchQuery.trim().toLowerCase();
    const matchSearch = !q || m.name.toLowerCase().includes(q) || m.phase.toLowerCase().includes(q);
    const matchPhase = phaseFilter === 'all' || m.phase.includes(phaseFilter) || m.name.includes(phaseFilter);
    return matchSearch && matchPhase;
  });

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Search & Top Action Bar */}
      <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-sm border border-slate-200/90 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h2 className="font-extrabold text-base sm:text-lg text-slate-800">قاعدة بيانات المواد الخام ({rawMaterials.length} مادة)</h2>
          <p className="text-[11px] sm:text-xs text-slate-500">إدارة أسعار العبوات، أحجام التعبئة، وتكلفة الجرام المحسوبة تلقائياً</p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full md:w-auto">
          <div className="relative w-full sm:w-64">
            <i className="ph-bold ph-magnifying-glass absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-base"></i>
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="ابحث باسم المادة أو الطور..."
              className="w-full pr-10 pl-4 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm bg-slate-50 focus:bg-white focus:outline-none focus:border-emeraldLab-600 transition"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={phaseFilter}
              onChange={e => setPhaseFilter(e.target.value)}
              className="flex-1 sm:flex-initial px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold bg-slate-50 text-slate-700 focus:outline-none"
            >
              <option value="all">كل الأطوار</option>
              <option value="مائي">الطور المائي</option>
              <option value="زيتي">الطور الزيتي</option>
              <option value="بارد">الطور البارد</option>
              <option value="مستحلب">مستحلبات ومثخنات</option>
            </select>

            <button
              onClick={() => setShowAddForm(prev => !prev)}
              className="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl bg-emeraldLab-800 hover:bg-emeraldLab-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition active:scale-95 shrink-0"
            >
              <i className={`ph-bold ${showAddForm ? 'ph-x' : 'ph-plus'}`}></i>
              <span>{showAddForm ? 'إلغاء' : 'إضافة مادة'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Add New Material Form */}
      {showAddForm && (
        <form onSubmit={handleAddSubmit} className="bg-emeraldLab-50/70 border-2 border-emeraldLab-200 rounded-2xl sm:rounded-3xl p-4 sm:p-5 space-y-3.5 animate-fade-in">
          <h3 className="font-extrabold text-xs sm:text-sm text-emeraldLab-950 flex items-center gap-1.5">
            <i className="ph-bold ph-flask"></i>
            <span>إضافة مادة خام جديدة</span>
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3 text-xs">
            <div className="col-span-2">
              <label className="block font-bold text-slate-700 mb-1">اسم المادة الخام:</label>
              <input
                type="text"
                required
                value={newMatName}
                onChange={e => setNewMatName(e.target.value)}
                placeholder="مثال: زيت الأرجان (Argan Oil)"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">الطور والوظيفة:</label>
              <input
                type="text"
                value={newMatPhase}
                onChange={e => setNewMatPhase(e.target.value)}
                placeholder="مثال: زيت مغذٍ (طور زيتي)"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">النسبة الموصى بها:</label>
              <input
                type="text"
                value={newMatUsage}
                onChange={e => setNewMatUsage(e.target.value)}
                placeholder="مثال: 1% - 5%"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">حجم العبوة (جم/مل):</label>
              <input
                type="number"
                min="1"
                step="any"
                value={newMatPackSize}
                onChange={e => setNewMatPackSize(parseFloat(e.target.value) || 1000)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold bg-white text-center"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">سعر شراء العبوة ({currencySymbol}):</label>
              <input
                type="number"
                min="0"
                step="any"
                value={newMatPackPrice}
                onChange={e => setNewMatPackPrice(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold bg-white text-center"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">الرصيد الافتتاحي (جم):</label>
              <input
                type="number"
                min="0"
                step="any"
                value={newMatStockQty}
                onChange={e => setNewMatStockQty(parseFloat(e.target.value) || 2000)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold bg-white text-center"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-emeraldLab-200">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 transition"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-xs font-extrabold bg-emeraldLab-800 hover:bg-emeraldLab-700 text-white shadow-sm flex items-center gap-1.5 transition active:scale-95"
            >
              <i className="ph-bold ph-plus"></i>
              <span>حفظ المادة</span>
            </button>
          </div>
        </form>
      )}

      {/* Mobile Card List View (< sm) */}
      <div className="sm:hidden space-y-2.5">
        {filteredMaterials.map(mat => {
          const ppg = (Number(mat.packPrice) / Number(mat.packSize)).toFixed(4);
          const isWater = Number(mat.id) === 1;

          return (
            <div
              key={mat.id}
              className={`p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-2.5 ${
                isWater ? 'border-sky-300 bg-sky-50/50' : ''
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600">
                      RM-{String(mat.id).padStart(2, '0')}
                    </span>
                    <span className="text-[10px] text-slate-500">{mat.phase}</span>
                  </div>
                  <h4 className="font-extrabold text-xs text-slate-800 leading-snug">{mat.name}</h4>
                </div>

                <div className="text-left shrink-0">
                  <span className="px-2 py-0.5 rounded-lg bg-emeraldLab-50 text-emeraldLab-800 font-extrabold text-xs">
                    {toDisplayPrice(ppg).toFixed(4)} {currencySymbol}/جم
                  </span>
                </div>
              </div>

              {/* Editable Fields Grid */}
              <div className="grid grid-cols-3 gap-2 bg-slate-50 p-2 rounded-xl border border-slate-100 text-center text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block mb-0.5">العبوة</span>
                  <input
                    type="number"
                    min="1"
                    step="any"
                    value={mat.packSize}
                    onChange={e => updateRawMaterialField(mat.id, 'packSize', e.target.value)}
                    className="input-excel w-full px-1 py-1 rounded-lg text-center font-bold text-xs"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block mb-0.5">السعر ({currencySymbol})</span>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={toDisplayPrice(mat.packPrice)}
                    onChange={e => updateRawMaterialField(mat.id, 'packPrice', fromDisplayPrice(e.target.value))}
                    className="input-excel w-full px-1 py-1 rounded-lg text-center font-bold text-xs"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block mb-0.5">الرصيد (جم)</span>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={mat.stockQty || 0}
                    onChange={e => updateRawMaterialField(mat.id, 'stockQty', e.target.value)}
                    className="input-excel w-full px-1 py-1 rounded-lg text-center font-extrabold text-xs text-emeraldLab-900"
                  />
                </div>
              </div>

              {/* Actions Row */}
              <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                <span className="text-[10px] text-slate-400">استخدام: {mat.usage}</span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => openRestockModal('raw', mat.id)}
                    className="px-2.5 py-1 rounded-lg bg-goldLab-100 hover:bg-goldLab-200 text-goldLab-900 font-bold text-xs flex items-center gap-1 transition"
                  >
                    <i className="ph-bold ph-plus text-xs"></i>
                    <span>توريد</span>
                  </button>
                  {!isWater && (
                    <button
                      onClick={() => deleteRawMaterial(mat.id)}
                      className="p-1 rounded-lg text-rose-500 hover:bg-rose-50 transition"
                      title="حذف"
                    >
                      <i className="ph-bold ph-trash text-sm"></i>
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop Materials Table (Hidden on mobile < sm) */}
      <div className="hidden sm:block bg-white rounded-3xl p-5 shadow-sm border border-slate-200/90 space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
              <tr>
                <th className="py-3 px-3 text-center">كود</th>
                <th className="py-3 px-4">اسم المادة الخام الكيميائية/الطبيعية</th>
                <th className="py-3 px-3">الطور والوظيفة</th>
                <th className="py-3 px-3 text-center">الاستخدام</th>
                <th className="py-3 px-3 text-center">حجم العبوة</th>
                <th className="py-3 px-3 text-center">سعر العبوة ({currencySymbol})</th>
                <th className="py-3 px-3 text-center">سعر الجرام ({currencySymbol})</th>
                <th className="py-3 px-3 text-center">رصيد المخزون</th>
                <th className="py-3 px-3 text-center">حذف</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMaterials.map(mat => {
                const pricePerGram = (Number(mat.packPrice) / Number(mat.packSize)).toFixed(4);
                const isWater = Number(mat.id) === 1;

                return (
                  <tr key={mat.id} className={`${isWater ? 'water-row font-bold' : 'hover:bg-slate-50'} transition`}>
                    <td className="py-3 px-3 text-center font-bold text-slate-500">
                      RM-{String(mat.id).padStart(2, '0')}
                    </td>
                    <td className="py-3 px-4 font-extrabold text-slate-800">{mat.name}</td>
                    <td className="py-3 px-3 text-xs text-slate-600">{mat.phase}</td>
                    <td className="py-3 px-3 text-center">
                      <span className="px-2.5 py-0.5 rounded-full bg-emeraldLab-50 text-emeraldLab-800 text-xs font-bold">
                        {mat.usage}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <input
                        type="number"
                        min="1"
                        step="any"
                        value={mat.packSize}
                        onChange={e => updateRawMaterialField(mat.id, 'packSize', e.target.value)}
                        className="input-excel w-24 px-2 py-1 rounded-lg text-center font-bold text-xs"
                      />
                    </td>
                    <td className="py-3 px-3 text-center">
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={toDisplayPrice(mat.packPrice)}
                        onChange={e => updateRawMaterialField(mat.id, 'packPrice', fromDisplayPrice(e.target.value))}
                        className="input-excel w-24 px-2 py-1 rounded-lg text-center font-bold text-xs"
                      />
                    </td>
                    <td className="py-3 px-3 text-center font-extrabold text-emeraldLab-800">
                      {toDisplayPrice(pricePerGram).toFixed(4)} {currencySymbol}/جم
                    </td>
                    <td className="py-3 px-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <input
                          type="number"
                          min="0"
                          step="any"
                          value={mat.stockQty || 0}
                          onChange={e => updateRawMaterialField(mat.id, 'stockQty', e.target.value)}
                          className="input-excel w-24 px-2 py-1 rounded-lg text-center font-extrabold text-xs text-emeraldLab-900"
                        />
                        <button
                          onClick={() => openRestockModal('raw', mat.id)}
                          className="p-1 rounded-lg bg-goldLab-100 hover:bg-goldLab-200 text-goldLab-900 transition"
                          title="توريد مخزون"
                        >
                          <i className="ph-bold ph-plus text-xs"></i>
                        </button>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-center">
                      {isWater ? (
                        <i className="ph-fill ph-lock-key text-sky-600" title="عنصر أساسي لا يحذف"></i>
                      ) : (
                        <button
                          onClick={() => deleteRawMaterial(mat.id)}
                          className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 transition"
                          title="حذف المادة الخام"
                        >
                          <i className="ph-bold ph-trash"></i>
                        </button>
                      )}
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

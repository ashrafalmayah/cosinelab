import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';

export const RestockModal: React.FC = () => {
  const { restockModal, closeRestockModal, restockItem, rawMaterials, products } = useApp();
  const [type, setType] = useState<'raw' | 'product'>('raw');
  const [selectedId, setSelectedId] = useState<string | number>('');
  const [qty, setQty] = useState<number>(1000);
  const [note, setNote] = useState<string>('');

  useEffect(() => {
    if (restockModal.isOpen) {
      setType(restockModal.type);
      if (restockModal.itemId) {
        setSelectedId(restockModal.itemId);
      } else {
        setSelectedId(restockModal.type === 'raw' ? rawMaterials[0]?.id : products[0]?.id);
      }
      setQty(restockModal.type === 'raw' ? 1000 : 25);
      setNote('');
    }
  }, [restockModal.isOpen, restockModal.type, restockModal.itemId, rawMaterials, products]);

  if (!restockModal.isOpen) return null;

  const handleTypeChange = (newType: 'raw' | 'product') => {
    setType(newType);
    setSelectedId(newType === 'raw' ? rawMaterials[0]?.id : products[0]?.id);
    setQty(newType === 'raw' ? 1000 : 25);
  };

  const selectedMat = type === 'raw' ? rawMaterials.find(m => Number(m.id) === Number(selectedId)) : null;
  const selectedProd = type === 'product' ? products.find(p => p.id === String(selectedId)) : null;

  const currentStockText = type === 'raw'
    ? `${(Number(selectedMat?.stockQty) || 0).toLocaleString("en-US")} جم / مل`
    : `${(Number(selectedProd?.stockQty) || 0).toLocaleString("en-US")} عبوة`;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (qty <= 0) return;
    restockItem(type, selectedId, qty);
    closeRestockModal();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 no-print animate-fade-in">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden space-y-4 p-5 sm:p-6" dir="rtl">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-2xl gold-gradient text-white flex items-center justify-center text-xl shadow-sm">
              <i className="ph-fill ph-arrow-down"></i>
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-800">توريد وإيداع رصيد بالمخزون</h3>
              <p className="text-xs text-slate-500">إضافة فورية لرصيد المواد الخام أو المنتجات التامة</p>
            </div>
          </div>
          <button onClick={closeRestockModal} className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition">
            <i className="ph-bold ph-x text-lg"></i>
          </button>
        </div>

        {/* Type Toggle */}
        <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1.5 rounded-2xl">
          <button
            type="button"
            onClick={() => handleTypeChange('raw')}
            className={`py-2 px-3 rounded-xl font-extrabold text-xs transition flex items-center justify-center gap-1.5 ${
              type === 'raw'
                ? 'border border-emeraldLab-600 bg-emeraldLab-800 text-white shadow-sm'
                : 'border border-transparent text-slate-700 hover:bg-slate-200'
            }`}
          >
            <i className="ph-bold ph-flask"></i>
            <span>مادة خام (خامات)</span>
          </button>
          <button
            type="button"
            onClick={() => handleTypeChange('product')}
            className={`py-2 px-3 rounded-xl font-extrabold text-xs transition flex items-center justify-center gap-1.5 ${
              type === 'product'
                ? 'border border-emeraldLab-600 bg-emeraldLab-800 text-white shadow-sm'
                : 'border border-transparent text-slate-700 hover:bg-slate-200'
            }`}
          >
            <i className="ph-bold ph-package"></i>
            <span>منتج تام (عبوات)</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Item Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              {type === 'raw' ? 'اختر المادة الخام التجميلية:' : 'اختر المنتج التجميلي التام:'}
            </label>
            <select
              value={selectedId}
              onChange={e => setSelectedId(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-300 font-bold text-xs bg-slate-50 focus:bg-white focus:outline-none focus:border-emeraldLab-600"
            >
              {type === 'raw'
                ? rawMaterials.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.name} (رصيد حالي: {m.stockQty || 0} جم)
                    </option>
                  ))
                : products.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} (رصيد حالي: {p.stockQty || 0} عبوة)
                    </option>
                  ))}
            </select>
            <div className="mt-1.5 flex items-center justify-between text-[11px] text-slate-500">
              <span>الرصيد المتوفر حالياً:</span>
              <strong className="text-emeraldLab-800 font-extrabold">{currentStockText}</strong>
            </div>
          </div>

          {/* Quantity Input */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              {type === 'raw' ? 'الكمية الواردة للإضافة (جم/مل):' : 'عدد العبوات الجاهزة للإضافة:'}
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="1"
                step={type === 'raw' ? '50' : '1'}
                value={qty}
                onChange={e => setQty(Math.max(0, parseFloat(e.target.value) || 0))}
                className="flex-1 px-3 py-2.5 rounded-xl border border-slate-300 font-extrabold text-sm text-center bg-slate-50 focus:bg-white focus:outline-none focus:border-emeraldLab-600 text-emeraldLab-900"
              />
              <span className="text-xs font-bold text-slate-600 shrink-0">
                {type === 'raw' ? 'جم / مل' : 'عبوة'}
              </span>
            </div>

            {/* Quick Presets */}
            <div className="flex items-center gap-1.5 mt-2 flex-wrap">
              <span className="text-[11px] text-slate-400">خيارات سريعة:</span>
              {type === 'raw' ? (
                <>
                  <button type="button" onClick={() => setQty(500)} className="px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-[11px] font-bold text-slate-700">+500 جم</button>
                  <button type="button" onClick={() => setQty(1000)} className="px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-[11px] font-bold text-slate-700">+1 كجم</button>
                  <button type="button" onClick={() => setQty(5000)} className="px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-[11px] font-bold text-slate-700">+5 كجم</button>
                  <button type="button" onClick={() => setQty(10000)} className="px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-[11px] font-bold text-slate-700">+10 كجم</button>
                </>
              ) : (
                <>
                  <button type="button" onClick={() => setQty(10)} className="px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-[11px] font-bold text-slate-700">+10 عبوات</button>
                  <button type="button" onClick={() => setQty(25)} className="px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-[11px] font-bold text-slate-700">+25 عبوة</button>
                  <button type="button" onClick={() => setQty(50)} className="px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-[11px] font-bold text-slate-700">+50 عبوة</button>
                  <button type="button" onClick={() => setQty(100)} className="px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-[11px] font-bold text-slate-700">+100 عبوة</button>
                </>
              )}
            </div>
          </div>

          {/* Note */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">ملاحظات التوريد (اختياري):</label>
            <input
              type="text"
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="رقم إذن توريد، اسم المورد، فاتورة شراء..."
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-slate-50 focus:bg-white focus:outline-none"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={closeRestockModal}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl text-xs font-extrabold bg-emeraldLab-800 hover:bg-emeraldLab-700 text-white shadow-md flex items-center gap-1.5 transition active:scale-95"
            >
              <i className="ph-bold ph-check"></i>
              <span>تأكيد الإيداع بالمخزون</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};


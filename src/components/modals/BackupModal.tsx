import React, { useRef } from 'react';
import { useApp } from '../../context/AppContext';

export const BackupModal: React.FC = () => {
  const { isBackupModalOpen, setIsBackupModalOpen, exportBackupJSON, importBackupJSON, resetToFactoryDefaults } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isBackupModalOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = event => {
      const content = event.target?.result as string;
      if (content) {
        const success = importBackupJSON(content);
        if (success) {
          setIsBackupModalOpen(false);
        }
      }
    };
    reader.readAsText(file);
  };

  const handleFactoryReset = () => {
    if (window.confirm("تحذير: هل أنت متأكد من استعادة ضبط المصنع؟ سيتم مسح أي تركيبات أو فواتير قمت بإنشائها والرجوع للقيم الافتراضية.")) {
      resetToFactoryDefaults();
      setIsBackupModalOpen(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 no-print animate-fade-in">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden space-y-4 p-5 sm:p-6" dir="rtl">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-2xl bg-emeraldLab-100 text-emeraldLab-900 flex items-center justify-center text-xl shadow-sm">
              <i className="ph-fill ph-database"></i>
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-800">النسخ الاحتياطي وإدارة البيانات</h3>
              <p className="text-xs text-slate-500">حفظ أو استعادة بيانات المعمل ونقطة البيع</p>
            </div>
          </div>
          <button onClick={() => setIsBackupModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition">
            <i className="ph-bold ph-x text-lg"></i>
          </button>
        </div>

        <div className="space-y-3 text-xs">
          {/* Export JSON */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3">
            <div>
              <h4 className="font-extrabold text-slate-800">1. تصدير نسخة احتياطية كاملة (JSON)</h4>
              <p className="text-[11px] text-slate-500">تحميل ملف يحتوي كافة الخامات والمنتجات والفواتير والمخزون</p>
            </div>
            <button
              onClick={exportBackupJSON}
              className="bg-emeraldLab-800 hover:bg-emeraldLab-700 text-white font-bold px-4 py-2 rounded-xl text-xs shrink-0 shadow-sm transition active:scale-95 flex items-center gap-1.5"
            >
              <i className="ph-bold ph-download-simple"></i>
              <span>تصدير JSON</span>
            </button>
          </div>

          {/* Import JSON */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
            <div>
              <h4 className="font-extrabold text-slate-800">2. استيراد واستعادة من ملف JSON</h4>
              <p className="text-[11px] text-slate-500">اختر ملف نسخة احتياطية سبق حفظه لاسترجاع البيانات</p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileUpload}
              className="block w-full text-xs text-slate-600 file:ml-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-goldLab-100 file:text-goldLab-900 hover:file:bg-goldLab-200 cursor-pointer"
            />
          </div>

          {/* Factory Reset */}
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-between gap-3">
            <div>
              <h4 className="font-extrabold text-rose-900">3. استعادة ضبط المصنع الافتراضي</h4>
              <p className="text-[11px] text-rose-700">إعادة الـ 12 منتجاً والـ 50 مادة خام إلى قيمها الأصلية</p>
            </div>
            <button
              onClick={handleFactoryReset}
              className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-3.5 py-2 rounded-xl text-xs shrink-0 shadow-sm transition active:scale-95"
            >
              إعادة ضبط المصنع
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};


import React from 'react';
import { useApp } from '../../context/AppContext';

export const PrintModal: React.FC = () => {
  const { printData, closePrintModal } = useApp();

  if (!printData.isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto no-print animate-fade-in">
      <div className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden my-8" dir="rtl">
        <div className="glass-header text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 font-extrabold text-base">
            <i className="ph-fill ph-printer text-goldLab-300 text-xl"></i>
            <span>{printData.title}</span>
          </div>
          <button onClick={closePrintModal} className="text-emeraldLab-200 hover:text-white p-1 rounded-lg">
            <i className="ph-bold ph-x text-xl"></i>
          </button>
        </div>

        <div className="p-6 max-h-[70vh] overflow-y-auto">
          <div dangerouslySetInnerHTML={{ __html: printData.htmlContent }} />
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            onClick={closePrintModal}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 transition"
          >
            إغلاق
          </button>
          <button
            onClick={handlePrint}
            className="px-6 py-2.5 rounded-xl text-xs font-extrabold bg-emeraldLab-800 hover:bg-emeraldLab-700 text-white shadow-md flex items-center gap-2 transition active:scale-95"
          >
            <i className="ph-bold ph-printer text-base"></i>
            <span>طباعة المستند الآن (Ctrl + P)</span>
          </button>
        </div>
      </div>
    </div>
  );
};


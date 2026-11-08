import React from 'react';
import { useApp } from '../../context/AppContext';

export const PWAModal: React.FC = () => {
  const { isPWAModalOpen, setIsPWAModalOpen } = useApp();

  if (!isPWAModalOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 no-print animate-fade-in">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden space-y-4 p-5 sm:p-6" dir="rtl">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-2xl gold-gradient text-white flex items-center justify-center text-xl shadow-sm">
              <i className="ph-fill ph-device-mobile"></i>
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-800">تثبيت التطبيق على جهازك</h3>
              <p className="text-xs text-slate-500">يعمل بدون اتصال بالإنترنت وسريع كأي تطبيق أصلي</p>
            </div>
          </div>
          <button onClick={() => setIsPWAModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition">
            <i className="ph-bold ph-x text-lg"></i>
          </button>
        </div>

        <div className="space-y-3 text-xs text-slate-700 leading-relaxed">
          <div className="p-3.5 rounded-2xl bg-emeraldLab-50 border border-emeraldLab-200 space-y-1">
            <h4 className="font-extrabold text-emeraldLab-900 flex items-center gap-1.5">
              <i className="ph-bold ph-apple-logo text-base"></i>
              <span>مستخدمي iPhone و iPad (سفاري):</span>
            </h4>
            <p className="text-[11px] text-emeraldLab-800">
              اضغط على زر المشاركة <strong className="px-1.5 py-0.5 bg-white rounded border">Share</strong> بالأسفل، ثم اختر <strong className="px-1.5 py-0.5 bg-white rounded border">"إضافة إلى الشاشة الرئيسية" (Add to Home Screen)</strong>.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-goldLab-50 border border-goldLab-200 space-y-1">
            <h4 className="font-extrabold text-goldLab-900 flex items-center gap-1.5">
              <i className="ph-bold ph-android-logo text-base"></i>
              <span>مستخدمي أندرويد و Chrome:</span>
            </h4>
            <p className="text-[11px] text-goldLab-800">
              اضغط على قائمة النقاط الثلاث <strong className="px-1.5 py-0.5 bg-white rounded border">⋮</strong> ثم اضغط على <strong className="px-1.5 py-0.5 bg-white rounded border">"تثبيت التطبيق" (Install App)</strong>.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
            <h4 className="font-extrabold text-slate-800 flex items-center gap-1.5">
              <i className="ph-bold ph-desktop text-base"></i>
              <span>أجهزة الكمبيوتر (Windows / Mac):</span>
            </h4>
            <p className="text-[11px] text-slate-600">
              اضغط على أيقونة التثبيت في شريط عنوان المتصفح بالأعلى لتثبيت أيقونة مستقلة على سطح المكتب.
            </p>
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            onClick={() => setIsPWAModalOpen(false)}
            className="w-full py-2.5 rounded-xl font-bold text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
          >
            حسناً، فهمت
          </button>
        </div>
      </div>
    </div>
  );
};


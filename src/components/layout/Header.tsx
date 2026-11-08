import React from 'react';
import { useApp } from '../../context/AppContext';
import { TabType, CurrencyCode } from '../../types';

export const Header: React.FC = () => {
  const {
    currency,
    setCurrency,
    activeTab,
    setActiveTab,
    products,
    rawMaterials,
    setIsBackupModalOpen,
    setIsPWAModalOpen,
    exportBackupJSON
  } = useApp();

  const lowMaterialsCount = rawMaterials.filter(m => (Number(m.stockQty) || 0) <= (Number(m.minStockAlert) || 500)).length;
  const lowProductsCount = products.filter(p => (Number(p.stockQty) || 0) <= (Number(p.minStockAlert) || 10)).length;
  const totalAlerts = lowMaterialsCount + lowProductsCount;

  const tabs: { id: TabType; title: string; subtitle?: string; icon: string; badge?: React.ReactNode }[] = [
    {
      id: 'pos',
      title: 'نقطة البيع',
      subtitle: 'والمبيعات (POS)',
      icon: 'ph-cash-register',
      badge: <span className="px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-xs rounded-full bg-white/20">{products.length}</span>
    },
    {
      id: 'calc',
      title: 'حاسبة التركيبة',
      subtitle: 'والتسعير',
      icon: 'ph-scales',
      badge: <span className="px-2 py-0.5 text-xs rounded-full bg-goldLab-500/30 text-goldLab-200">تلقائي 100%</span>
    },
    {
      id: 'catalog',
      title: 'كتالوج المنتجات',
      subtitle: 'الجاهزة',
      icon: 'ph-package',
      badge: <span className="px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-xs rounded-full bg-white/20">{products.length}</span>
    },
    {
      id: 'materials',
      title: 'قاعدة المواد الخام',
      icon: 'ph-eyedropper',
      badge: <span className="px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-xs rounded-full bg-white/20">{rawMaterials.length}</span>
    },
    {
      id: 'inventory',
      title: 'المخزون والمستودع',
      icon: 'ph-warehouse',
      badge: (
        <span
          className={`px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-xs rounded-full font-extrabold ${
            totalAlerts > 0 ? 'bg-rose-500 text-white' : 'bg-white/20'
          }`}
        >
          {totalAlerts > 0 ? `${totalAlerts} ⚠️` : '0'}
        </span>
      )
    }
  ];

  return (
    <header className="glass-header text-white shadow-md sticky top-0 z-40 no-print">
      <div className="max-w-[1600px] mx-auto px-3 sm:px-6 py-2.5 sm:py-3">
        {/* Top Row: Brand & Currency / Actions */}
        <div className="flex items-center justify-between gap-2">
          {/* Brand & Title */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <div className="w-8 h-8 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl gold-gradient flex items-center justify-center shadow-md shrink-0">
              <i className="ph-fill ph-flask text-lg sm:text-2xl text-white"></i>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <h1 className="text-xs sm:text-lg font-extrabold tracking-tight text-white truncate">
                  <span className="sm:hidden">معمل التجميل</span>
                  <span className="hidden sm:inline">معمل ومبيعات التجميل</span>
                </h1>
                <span className="hidden md:inline-block bg-goldLab-500/30 border border-goldLab-300/40 text-goldLab-200 text-xs px-2 py-0.5 rounded-full font-semibold shrink-0">
                  CosineLab
                </span>
              </div>
              <p className="text-[10px] sm:text-xs text-emeraldLab-200 flex items-center gap-1 mt-0.5">
                <span className="inline-flex items-center gap-1 text-emerald-300 font-medium shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>أوفلاين جاهز</span>
                </span>
                <span className="text-emeraldLab-400">|</span>
                <span className="truncate">حفظ محلي</span>
              </p>
            </div>
          </div>

          {/* Action Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Currency Selector */}
            <div className="flex items-center bg-emeraldLab-900/80 border border-emeraldLab-600 rounded-xl px-1.5 sm:px-2 py-1 sm:py-1.5 text-xs max-w-[125px] sm:max-w-none">
              <span className="hidden sm:inline text-emeraldLab-200 ml-1.5">العملة:</span>
              <select
                value={currency}
                onChange={e => setCurrency(e.target.value as CurrencyCode)}
                className="bg-transparent text-goldLab-300 font-bold focus:outline-none cursor-pointer text-xs w-full truncate"
                title="تغيير عملة العرض والحساب (أساس البيانات: ريال يمني YER)"
              >
                <option value="YER" className="text-slate-900">ر.ي (يمني)</option>
                <option value="SAR" className="text-slate-900">ر.س (140 ر.ي)</option>
                <option value="USD" className="text-slate-900">$ (533 ر.ي)</option>
              </select>
            </div>

            {/* Install PWA Button (Hidden on tiny screens) */}
            <button
              onClick={() => setIsPWAModalOpen(true)}
              className="hidden sm:flex gold-gradient hover:opacity-95 text-white font-bold px-3 py-1.5 rounded-xl text-xs items-center gap-1.5 shadow-sm transition active:scale-95"
              title="تثبيت التطبيق (PWA)"
            >
              <i className="ph-bold ph-device-mobile text-base"></i>
              <span>تثبيت PWA</span>
            </button>

            {/* Export JSON quick backup (Desktop) */}
            <button
              onClick={exportBackupJSON}
              className="hidden md:flex bg-emeraldLab-700 hover:bg-emeraldLab-600 border border-emeraldLab-500 text-white font-semibold px-3 py-1.5 rounded-xl text-xs items-center gap-1.5 transition active:scale-95"
              title="تصدير نسخة JSON فورية"
            >
              <i className="ph-bold ph-download-simple text-sm text-goldLab-300"></i>
              <span>تصدير</span>
            </button>

            {/* Backup / Restore Modal Trigger */}
            <button
              onClick={() => setIsBackupModalOpen(true)}
              className="bg-emeraldLab-900/80 hover:bg-emeraldLab-700 border border-emeraldLab-600 text-emeraldLab-100 font-semibold p-2 sm:px-3 sm:py-1.5 rounded-xl text-xs flex items-center gap-1.5 transition active:scale-95"
              title="نسخ احتياطي / استعادة"
            >
              <i className="ph-bold ph-database text-base text-emerald-300"></i>
              <span className="hidden lg:inline">نسخ احتياطي</span>
            </button>
          </div>
        </div>

        {/* Desktop / Tablet Navigation Tabs (Hidden on mobile < sm) */}
        <nav className="hidden sm:flex mt-2.5 pt-2 border-t border-emeraldLab-700/80 items-center gap-2 overflow-x-auto no-scrollbar">
          {tabs.map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-bold text-xs sm:text-sm whitespace-nowrap transition shrink-0 ${
                  isActive
                    ? 'gold-gradient text-white shadow-md font-extrabold'
                    : 'text-emeraldLab-100 hover:bg-emeraldLab-700/60'
                }`}
              >
                <i className={`ph-fill ${tab.icon} text-base`}></i>
                <span>{tab.title}</span>
                {tab.subtitle && <span className="hidden md:inline"> {tab.subtitle}</span>}
                {tab.badge}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};

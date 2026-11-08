import React from 'react';
import { useApp } from '../../context/AppContext';
import { TabType } from '../../types';

export const BottomNav: React.FC = () => {
  const { activeTab, setActiveTab, products, rawMaterials } = useApp();

  const lowMaterialsCount = rawMaterials.filter(m => (Number(m.stockQty) || 0) <= (Number(m.minStockAlert) || 500)).length;
  const lowProductsCount = products.filter(p => (Number(p.stockQty) || 0) <= (Number(p.minStockAlert) || 10)).length;
  const totalAlerts = lowMaterialsCount + lowProductsCount;

  const items: { id: TabType; label: string; icon: string; badge?: number | string; isAlert?: boolean }[] = [
    { id: 'pos', label: 'المبيعات', icon: 'ph-cash-register' },
    { id: 'calc', label: 'الحاسبة', icon: 'ph-scales' },
    { id: 'catalog', label: 'الكتالوج', icon: 'ph-package' },
    { id: 'materials', label: 'الخامات', icon: 'ph-eyedropper', badge: rawMaterials.length },
    { id: 'inventory', label: 'المخزون', icon: 'ph-warehouse', badge: totalAlerts > 0 ? totalAlerts : undefined, isAlert: totalAlerts > 0 }
  ];

  return (
    <nav className="sm:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] px-2 py-1.5 flex items-center justify-around no-print">
      {items.map(item => {
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => {
              setActiveTab(item.id);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className={`relative flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all duration-200 min-w-[58px] ${
              isActive
                ? 'text-emeraldLab-800 font-extrabold scale-105'
                : 'text-slate-400 hover:text-slate-600 font-medium'
            }`}
          >
            <div className="relative">
              <i className={`text-xl ${isActive ? 'ph-fill ' + item.icon : 'ph-bold ' + item.icon}`}></i>
              {item.badge !== undefined && (
                <span
                  className={`absolute -top-1.5 -left-2 px-1.5 py-0.2 text-[9px] font-extrabold rounded-full ${
                    item.isAlert
                      ? 'bg-rose-500 text-white animate-pulse'
                      : 'bg-emeraldLab-100 text-emeraldLab-900'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </div>
            <span className={`text-[10px] mt-0.5 whitespace-nowrap ${isActive ? 'text-emeraldLab-800 font-extrabold' : 'text-slate-500'}`}>
              {item.label}
            </span>
            {isActive && (
              <span className="w-1.5 h-1.5 rounded-full bg-goldLab-500 mt-0.5"></span>
            )}
          </button>
        );
      })}
    </nav>
  );
};


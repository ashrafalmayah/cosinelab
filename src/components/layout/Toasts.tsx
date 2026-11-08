import React from 'react';
import { useApp } from '../../context/AppContext';

export const Toasts: React.FC = () => {
  const { toasts } = useApp();

  if (toasts.length === 0) return null;

  const styles = {
    success: "bg-emeraldLab-900 border-emerald-400 text-white",
    error: "bg-rose-900 border-rose-400 text-white",
    info: "bg-slate-900 border-goldLab-400 text-white"
  };

  const icons = {
    success: "ph-check-circle text-emerald-400",
    error: "ph-warning-circle text-rose-400",
    info: "ph-info text-goldLab-300"
  };

  return (
    <div className="fixed bottom-4 inset-x-4 sm:inset-x-auto sm:left-5 sm:max-w-sm z-50 space-y-2 pointer-events-none no-print">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`pointer-events-auto flex items-center gap-2.5 px-4 py-3 rounded-2xl border shadow-xl text-xs font-bold transition-all duration-300 ${styles[toast.type] || styles.success}`}
        >
          <i className={`ph-fill ${icons[toast.type] || icons.success} text-xl shrink-0`}></i>
          <span className="leading-relaxed">{toast.message}</span>
        </div>
      ))}
    </div>
  );
};


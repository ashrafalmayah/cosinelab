import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/layout/Header';
import { BottomNav } from './components/layout/BottomNav';
import { Toasts } from './components/layout/Toasts';
import { POSScreen } from './components/pos/POSScreen';
import { CalculatorScreen } from './components/calculator/CalculatorScreen';
import { CatalogScreen } from './components/catalog/CatalogScreen';
import { MaterialsScreen } from './components/materials/MaterialsScreen';
import { InventoryScreen } from './components/inventory/InventoryScreen';
import { RestockModal } from './components/modals/RestockModal';
import { PrintModal } from './components/modals/PrintModal';
import { BackupModal } from './components/modals/BackupModal';
import { PWAModal } from './components/modals/PWAModal';

const MainContent: React.FC = () => {
  const { activeTab, printData } = useApp();

  return (
    <div className="min-h-screen flex flex-col bg-[#f4f7f6]">
      <Header />
      <main className="flex-1 max-w-[1600px] w-full mx-auto px-3 sm:px-6 py-4 sm:py-5 pb-24 sm:pb-6 no-print">
        {activeTab === 'pos' && <POSScreen />}
        {activeTab === 'calc' && <CalculatorScreen />}
        {activeTab === 'catalog' && <CatalogScreen />}
        {activeTab === 'materials' && <MaterialsScreen />}
        {activeTab === 'inventory' && <InventoryScreen />}
      </main>

      {/* Hidden container dedicated to window.print output */}
      <div id="printArea" className="hidden" dangerouslySetInnerHTML={{ __html: printData.htmlContent }} />

      <RestockModal />
      <PrintModal />
      <BackupModal />
      <PWAModal />
      <BottomNav />
      <Toasts />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AppProvider>
      <MainContent />
    </AppProvider>
  );
};

export default App;


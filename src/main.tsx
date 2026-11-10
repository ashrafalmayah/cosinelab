import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Local Arabic Google Fonts (Cairo & Tajawal) - bundled for 100% offline support
import '@fontsource/cairo/400.css';
import '@fontsource/cairo/600.css';
import '@fontsource/cairo/700.css';
import '@fontsource/cairo/800.css';
import '@fontsource/tajawal/400.css';
import '@fontsource/tajawal/500.css';
import '@fontsource/tajawal/700.css';

// Local Phosphor Icons Web Fonts - bundled for 100% offline support
import '@phosphor-icons/web/regular';
import '@phosphor-icons/web/bold';
import '@phosphor-icons/web/fill';

import { registerSW } from 'virtual:pwa-register';

// Register service worker immediately to ensure complete offline precaching
registerSW({
  immediate: true,
  onNeedRefresh() {
    window.location.reload();
  }
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

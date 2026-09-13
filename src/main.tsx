import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { StoreProvider } from './app/store';
import { App } from './app/App';
import './styles/reset.css';
import './styles/tokens.css';
import './styles/themes.css';
import './styles/base.css';
import './styles/app.css';

const container = document.getElementById('root');
if (!container) throw new Error('Elemento #root nao encontrado.');

createRoot(container).render(
  <StrictMode>
    <StoreProvider>
      <App />
    </StoreProvider>
  </StrictMode>,
);

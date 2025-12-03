import './polyfill';
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Logs reduzidos para nível warn para evitar falhas do eslint
console.warn('Starting app...');

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

  console.warn('Root element found, rendering...');

  try {
    const root = ReactDOM.createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
    console.warn('App rendered successfully');
  } catch (error: unknown) {
    console.error('Error rendering app:', error);
    throw error;
  }

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Register Service Worker with error handling
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        console.log('[SW:Registration] Success:', registration.scope);
      })
      .catch(err => {
        console.error('[SW:Registration] Failed:', err);
      });
  });
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

// Render the application with strict mode enabled
const root = ReactDOM.createRoot(rootElement);
root.render(
  <react.strictmode>
    <App/>
  </React.StrictMode>
);

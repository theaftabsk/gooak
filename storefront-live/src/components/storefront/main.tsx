import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import '@oaksol/shared-ui'; // Auto imports premium variables and resets

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

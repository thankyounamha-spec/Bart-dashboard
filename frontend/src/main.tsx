import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './app/App';
import ErrorBoundary from './components/common/ErrorBoundary';
import { ToastProvider, ToastContainer } from './components/common/Toast';
import './styles/index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <ToastProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
        <ToastContainer />
      </ToastProvider>
    </ErrorBoundary>
  </React.StrictMode>
);

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter as Router } from 'react-router-dom';
import App from './App.tsx';
import './index.css';

import { AuthProvider } from './context/AuthContext';
import { RemovalProvider } from './context/RemovalContext';
import { NotificationProvider } from './context/NotificationContext';
import { ChatProvider } from './context/ChatContext';
import { AgendaProvider } from './context/AgendaContext';
import { StockProvider } from './context/StockContext';
import { PricingProvider } from './context/PricingContext';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Router>
      <AuthProvider>
        <NotificationProvider>
          <RemovalProvider>
            <ChatProvider>
              <AgendaProvider>
                <StockProvider>
                  <PricingProvider>
                    <App />
                  </PricingProvider>
                </StockProvider>
              </AgendaProvider>
            </ChatProvider>
          </RemovalProvider>
        </NotificationProvider>
      </AuthProvider>
    </Router>
  </StrictMode>,
);

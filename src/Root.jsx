import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './components/context/AuthContext';
import { ErrorProvider } from './components/context/ErrorContext';
import ScrollToTop from "./components/ui/ScrollToTop.jsx";
import { App } from './App';

// Questo componente avvolge l'intera app con i provider di stato
export const Root = () => (
  <BrowserRouter>
    <ScrollToTop />
    <ErrorProvider>
      <AuthProvider>
        <App />
      </AuthProvider>
    </ErrorProvider>
  </BrowserRouter>
);

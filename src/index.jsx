import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css'; // Importa il CSS globale
import { Root } from './Root';
import { loadLeaflet } from './utils/leafletLoader';

// Carica script esterni (Leaflet) all'avvio
loadLeaflet();

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);
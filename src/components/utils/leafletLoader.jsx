export function loadLeaflet() {
  // Importiamo le librerie Leaflet in modo che siano disponibili globalmente
  // Utilizziamo un semplice trick per caricarli come script esterni
  if (typeof window !== 'undefined') {
    if (typeof L === 'undefined') {
      const leafletCss = document.createElement('link');
      leafletCss.rel = 'stylesheet';
      leafletCss.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(leafletCss);

      const leafletJs = document.createElement('script');
      leafletJs.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      document.head.appendChild(leafletJs);
    }
  }
}
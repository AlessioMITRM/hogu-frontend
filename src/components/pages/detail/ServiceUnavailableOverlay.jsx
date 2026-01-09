import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom'; // 1. Importiamo createPortal
import { CalendarX } from 'lucide-react';

export const ServiceUnavailableOverlay = ({ onSearchSimilar, onGoBack }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Blocca lo scroll del body
    document.body.style.overflow = 'hidden';
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  // Se non siamo ancora montati lato client, non renderizziamo nulla (per evitare errori SSR se usi Next.js/Remix)
  if (!mounted) return null;

  // Definiamo il contenuto dell'overlay
  const overlayContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-300">
      
      {/* 1. LAYER DI SFONDO POTENZIATO 
         - Cambiato da bg-white/60 a bg-white/90 (molto più coprente)
         - Aggiunto backdrop-blur-2xl (sfocatura più intensa)
      */}
      <div className="absolute inset-0 bg-white/90 backdrop-blur-2xl"></div>

      {/* 2. CARD CENTRALE */}
      <div className="relative z-10 w-full max-w-md bg-white rounded-[2rem] border border-gray-100 shadow-[0_20px_60px_rgba(0,0,0,0.2)] p-8 text-center overflow-hidden ring-1 ring-black/5">
        
        {/* Barra superiore decorativa */}
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gray-200"></div>

        {/* Icona */}
        <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
          <CalendarX size={40} className="text-red-400" strokeWidth={1.5} />
        </div>

        {/* Testi */}
        <h2 className="text-2xl font-extrabold text-gray-900 mb-3">
          Non disponibile
        </h2>
        
        <p className="text-gray-500 text-base mb-8 leading-relaxed">
          Ci dispiace, i dettagli di questo evento sono stati nascosti perché il servizio non è attualmente prenotabile o è scaduto.
        </p>

        {/* Azioni */}
        <div className="space-y-3">
          <button 
            onClick={onSearchSimilar}
            className="w-full py-4 px-6 rounded-xl bg-gray-900 text-white font-bold text-sm hover:bg-gray-800 active:scale-95 transition-all shadow-xl shadow-gray-200 hover:shadow-2xl"
          >
            Cerca eventi simili
          </button>
        </div>
      </div>
    </div>
  );

  // 3. USARE IL PORTAL
  // Questo renderizza il div direttamente nel body, ignorando i limiti del componente padre
  return createPortal(overlayContent, document.body);
};
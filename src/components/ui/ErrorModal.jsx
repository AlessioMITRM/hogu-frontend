import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

export const ErrorModal = ({ 
  message = 'Si è verificato un errore', 
  onClose, 
  details = null 
}) => {
  
  // Funzione per gestire il click sullo sfondo scuro
  const handleBackdropClick = (e) => {
    // Chiude solo se clicchi ESATTAMENTE sullo sfondo scuro, non sulla card bianca
    if (e.target === e.currentTarget) {
      if (onClose) onClose();
    }
  };

  return (
    <div 
      onClick={handleBackdropClick} // Aggiunto qui
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md transition-all cursor-pointer"
    >
      <div 
        // cursor-default impedisce che il click sulla card venga scambiato per un click sullo sfondo
        className="bg-white rounded-3xl shadow-2xl w-full max-w-md relative overflow-hidden ring-1 ring-black/5 cursor-default"
        role="dialog"
        aria-modal="true"
      >
        <button 
          type="button"
          onClick={(e) => {
            e.stopPropagation(); // Ferma la propagazione
            if (onClose) onClose();
          }} 
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all duration-200 z-10"
        >
          <X size={20} />
        </button>
        
        <div className="p-8">
          <div className="flex flex-col items-center text-center mb-6">
            <div className="mb-4 bg-red-50 text-red-500 p-4 rounded-full ring-8 ring-red-50/50 animate-pulse-slow">
              <AlertTriangle size={32} strokeWidth={2.5} />
            </div>
            
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
              Errore
            </h2>
            
            <p className="mt-2 text-gray-600 leading-relaxed text-center">
              {message}
            </p>
          </div>
          
          {details && (
            <div className="mt-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden">
                <div className="px-4 py-2 bg-slate-100/50 border-b border-slate-200">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Dettagli tecnici
                  </span>
                </div>
                <div className="p-3 max-h-40 overflow-y-auto custom-scrollbar">
                  <pre className="text-[11px] font-mono text-slate-600 whitespace-pre-wrap break-words leading-tight">
                    {typeof details === 'object' 
                      ? JSON.stringify(details, null, 2) 
                      : details}
                  </pre>
                </div>
              </div>
            </div>
          )}
          
          <div className="mt-8">
            <button 
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (onClose) onClose();
              }} 
              className="w-full bg-[#68B49B] text-white py-3.5 rounded-xl font-semibold shadow-lg shadow-[#68B49B]/20 hover:bg-[#33594C] hover:shadow-[#33594C]/20 active:scale-[0.98] transition-all duration-200 ease-out"
            >
              Chiudi
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ErrorModal;
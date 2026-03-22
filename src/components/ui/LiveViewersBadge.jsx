import React, { useState } from 'react';
import { useTranslation } from "react-i18next";
import { X } from 'lucide-react';

/**
 * Componente base che mostra l'indicatore pulsante e il testo
 */
export const LiveViewersBadge = ({ count, className = "" }) => {
    if (!count || count <= 0) return null;
    
    const { t } = useTranslation();
    
    return (
        <div className={`flex items-center gap-3 ${className}`}>
            <div className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </div>
            <span className="text-sm font-bold text-gray-800 whitespace-nowrap mr-2">
                {t('live_viewers', { count })}
            </span>
        </div>
    );
};

/**
 * Widget fluttuante completo con gestione stato visibilità e pulsante chiusura
 */
export const LiveViewersFloatingBadge = ({ count, className = "" }) => {
    const [isVisible, setIsVisible] = useState(true);

    if (!count || count <= 0 || !isVisible) return null;

    return (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 md:top-auto md:bottom-6 md:left-auto md:right-8 md:translate-x-0 z-50 pointer-events-none animate-fade-in-up ${className}`}>
             <div className="bg-white/90 backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-white/50 pl-5 pr-2 py-2 rounded-full flex items-center gap-3 pointer-events-auto transition-all hover:scale-105">
                <LiveViewersBadge count={count} />
                
                <button 
                    onClick={() => setIsVisible(false)}
                    className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                    aria-label="Chiudi notifica"
                >
                    <X size={14} strokeWidth={2.5} />
                </button>
            </div>
        </div>
    );
};

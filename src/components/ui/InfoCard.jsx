import React from 'react';

/**
 * Componente InfoCard
 * Mostra un'icona, un'etichetta e un valore.
 * Utilizzato per mostrare orari, info, dettagli.
 */
export const InfoCard = ({ icon: Icon, label, value, subValue, highlight = false }) => (
    <div className={`
        flex items-center gap-3 p-3 rounded-xl border transition-all
        ${highlight ? 'bg-[#F0FDF9] border-[#68B49B]/30' : 'bg-gray-50 border-gray-100'}
    `}>
        <div className={`p-2.5 rounded-lg shadow-sm ${highlight ? 'bg-[#68B49B] text-white' : 'bg-white text-[#68B49B]'}`}>
            <Icon size={20} strokeWidth={2.5} />
        </div>
        <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider leading-tight">{label}</p>
            <p className={`text-base font-bold leading-tight ${highlight ? 'text-[#33594C]' : 'text-[#1A202C]'}`}>{value}</p>
            {subValue && <p className="text-[10px] text-gray-500 mt-0.5">{subValue}</p>}
        </div>
    </div>
);

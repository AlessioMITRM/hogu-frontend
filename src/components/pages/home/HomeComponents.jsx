import React from 'react';
import { HOGU_COLORS, HOGU_THEME } from '../../../config/theme.js';
import { TrendingUp } from 'lucide-react';

export const ServiceCard = ({ type, description, icon: Icon, setPage, page }) => (
  <div
    onClick={() => setPage(page, type.replace(/s$/, '').replace(/&.*$/, '').trim())} // Passa il tipo
    className="flex flex-col items-center text-center p-6 bg-gray-50 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer border border-gray-100"
  >
    <div className={`p-4 mb-4 rounded-full bg-[${HOGU_COLORS.lightAccent}]`}>
      <Icon className={`w-8 h-8 text-[${HOGU_COLORS.primary}]`} />
    </div>
    <h3 className={`text-xl font-bold mb-2 ${HOGU_THEME.text}`}>{type}</h3>
    <p className={`text-sm ${HOGU_THEME.subtleText}`}>{description}</p>
  </div>
);

// Componente per il confronto dei guadagni
export const EarningComparisonCard = ({ title, metric, annualHogu, annualOther, saving }) => {
    // Calcola le percentuali per la barra (Mock)
    const total = annualHogu > annualOther ? annualHogu : annualOther; // Usa il valore massimo per la scala
    const hoguPercent = (annualHogu / total) * 100;
    const otherPercent = (annualOther / total) * 100;

    const formatCurrency = (value) => `€ ${value.toLocaleString('it-IT', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

    return (
        <div className="p-6 bg-white rounded-2xl shadow-lg border border-gray-100 flex flex-col transition-all duration-300 hover:shadow-xl">
            <h3 className={`text-2xl font-bold mb-1 ${HOGU_THEME.text}`}>{title}</h3>
            <p className={`text-sm mb-4 ${HOGU_THEME.subtleText}`}>{metric}</p>

            {/* Grafico a Barre (Mock) */}
            <div className="space-y-4 mb-6">
                {/* Hogu Bar */}
                <div>
                    <div 
                        className={`h-4 rounded-lg bg-[${HOGU_COLORS.primary}] shadow-md`}
                        style={{ width: `${hoguPercent}%` }}
                    />
                </div>
                {/* Altri Portali Bar */}
                <div>
                    <div 
                        className={`h-4 rounded-lg bg-gray-300 shadow-md`}
                        style={{ width: `${otherPercent}%` }}
                    />
                </div>
            </div>

            {/* Riepilogo Dati */}
            <div className="space-y-3 pt-2">
                {/* Hogu */}
                <div className="flex justify-between items-center text-base">
                    <span className={`font-semibold ${HOGU_THEME.text}`}>Hogu (8%)</span>
                    <span className={`font-bold text-[${HOGU_COLORS.primary}]`}>{formatCurrency(annualHogu)}</span>
                </div>
                {/* Altri */}
                <div className="flex justify-between items-center text-base">
                    <span className={`font-semibold ${HOGU_THEME.subtleText}`}>Altri (18%)</span>
                    <span className={`font-semibold text-[${HOGU_COLORS.subtleText}]`}>{formatCurrency(annualOther)}</span>
                </div>
               
                {/* Risparmio */}
                <div className="flex items-center space-x-2 pt-3 border-t border-gray-100">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                    <span className="text-green-600 font-bold text-sm">
                        Risparmio annuo: {formatCurrency(saving)}
                    </span>
                </div>
            </div>
        </div>
    );
};
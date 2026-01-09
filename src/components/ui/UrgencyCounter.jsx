import React from 'react';
import { Flame } from 'lucide-react';

/**
 * Componente UrgencyCounter
 * Mostra un contatore "caldo" per creare urgenza.
 * Props:
 * - count: Il numero da mostrare (es. 50)
 * - label: L'etichetta dopo il numero (default: 'prenotati')
 * - timeframe: Il periodo di tempo (default: 'nelle ultime 24h')
 */
export const UrgencyCounter = ({ count, label = 'prenotati', timeframe = 'nelle ultime 24h' }) => {
  if (!count || count === 0) {
    return null;
  }

  return (
    <div className={`flex items-center gap-2 p-3 rounded-lg bg-orange-50 border border-orange-400 shadow-sm`}>
        <Flame className={`w-6 h-6 text-orange-500`} />
        <span className={`text-sm font-semibold text-orange-700`}>
            <strong className={`text-orange-600`}>+{count} {label}</strong> {timeframe}
        </span>
    </div>
  );
};
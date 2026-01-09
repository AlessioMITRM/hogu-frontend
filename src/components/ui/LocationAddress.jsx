import React from 'react';
import { MapPin } from 'lucide-react';
import { HOGU_COLORS } from '../../config/theme.js'; // Assicurati che il percorso sia corretto

/**
 * Componente LocationAddress
 * Mostra un indirizzo formattato con un'icona.
 * Props:
 * - address: La stringa dell'indirizzo (es. "Via del Colosseo, 1, 00184 Roma RM")
 */
export const LocationAddress = ({ address }) => {
  if (!address) {
    return null;
  }

  return (
    // MODIFICA: mb-6 rimosso da qui. La mappa ora gestisce la spaziatura.
    <div className="flex items-start gap-3 p-4 rounded-lg bg-gray-50 border border-gray-200"> 
      <div>
        {/* mt-0.5 per allineare l'icona al testo. shrink-0 per evitare che si restringa */}
        <MapPin className={`w-5 h-5 text-[${HOGU_COLORS.primary}] mt-0.5 shrink-0`} />
      </div>
      <span className={`text-base font-medium text-[${HOGU_COLORS.dark}]`}>
        {address}
      </span>
    </div>
  );
};
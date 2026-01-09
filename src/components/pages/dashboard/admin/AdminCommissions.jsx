import React, { useState } from 'react';
import { useAuth } from '../../../context/AuthContext'; // Import useAuth per accedere ad api
import { HOGU_COLORS, HOGU_THEME } from '../../../../config/theme.js';
import { PrimaryButton } from '../../../../components/ui/Button.jsx';

export const AdminCommissions = () => {
  const { api } = useAuth(); // Ottieni l'oggetto api dal contesto
  const [commissionRate, setCommissionRate] = useState(8.0);

  const handleUpdateCommission = () => {
    // Simulazione di chiamata API
    api.admin.setCommission('All', commissionRate);
    // Usiamo una UI custom invece di alert()
    console.log('Commissione aggiornata con successo!');
  };

  return (
    <div title="Gestione Commissioni">
      <h2 className={`text-2xl font-semibold mb-4 ${HOGU_THEME.text}`}>Commissione Base</h2>
      <p className="text-gray-600 mb-4">Commissione fissa HOGU applicata a tutti i servizi.</p>

      <div className="flex items-center space-x-4 mb-8">
        <input
          type="number"
          step="0.1"
          min="0"
          value={commissionRate}
          onChange={(e) => setCommissionRate(parseFloat(e.target.value))}
          className={`p-3 border rounded-lg text-lg w-32 ${HOGU_THEME.focusRing} focus:border-[${HOGU_COLORS.primary}]`}
        />
        <span className={`text-2xl ${HOGU_THEME.text}`}>%</span>
        <PrimaryButton onClick={handleUpdateCommission}>
          Aggiorna Tasso
        </PrimaryButton>
      </div>

      <h2 className={`text-2xl font-semibold mb-4 ${HOGU_THEME.text}`}>Commissioni per Tipo di Servizio</h2>
      <p className="text-gray-600">Possibilità di definire commissioni specifiche per tipo di servizio (e.g., NCC, B&B).</p>
    </div>
  );
};
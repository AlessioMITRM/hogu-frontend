import React, { useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { HOGU_COLORS, HOGU_THEME } from '../../../../config/theme.js';
import { PrimaryButton } from '../../../../components/ui/Button.jsx';

// Importa solo le icone che servono qui
import { Zap } from 'lucide-react';

export const ProviderServices = () => {
  const { api } = useAuth();
  const serviceTypes = ['Ristorante', 'B&B', 'Club', 'NCC', 'Luggage'];
  const [selectedType, setSelectedType] = useState('Ristorante');
  const [serviceName, setServiceName] = useState('');
  const [description, setDescription] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateDescription = async () => {
    if (!serviceName) {
      // Usiamo console.warn o un messaggio UI invece di alert()
      console.warn("Inserisci il nome del servizio prima di generare la descrizione.");
      return;
    }
    setIsGenerating(true);
    
    // Placeholder per location e USP reali
    const location = "Roma o Milano"; 
    const uniqueSellingPoints = "Servizio concierge 24/7 e ingredienti freschi di stagione."; 

    try {
        const generatedText = await api.ai.generateDescription({
            serviceType: selectedType,
            serviceName: serviceName,
            location,
            uniqueSellingPoints
        });
        setDescription(generatedText);
    } catch (e) {
        setDescription("Errore nella generazione AI. Controlla la console.");
    } finally {
        setIsGenerating(false);
    }
  };

  const ServiceForm = ({ type }) => (
    <form className="space-y-4">
      <h3 className={`text-xl font-semibold mb-2 ${HOGU_THEME.text}`}>Modifica {type}</h3>
      <input 
        type="text" 
        placeholder="Nome Servizio" 
        value={serviceName}
        onChange={(e) => setServiceName(e.target.value)}
        className={`w-full p-3 border rounded-lg ${HOGU_THEME.focusRing} focus:border-[${HOGU_COLORS.primary}]`} 
      />
      
      {/* Blocco AI Generation */}
      <div className="flex justify-end">
        <PrimaryButton 
          type="button" 
          onClick={handleGenerateDescription} 
          disabled={isGenerating || !serviceName}
          className="text-sm py-2 px-4 flex items-center space-x-2"
        >
          {isGenerating ? (
            <>
              <Zap className="w-4 h-4 animate-pulse" />
              <span>Generazione in corso...</span>
            </>
          ) : (
            <>
              <Zap className="w-4 h-4" />
              <span>Genera Descrizione con AI</span>
            </>
          )}
        </PrimaryButton>
      </div>

      <textarea 
        placeholder="Descrizione" 
        rows="6" 
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className={`w-full p-3 border rounded-lg ${HOGU_THEME.focusRing} focus:border-[${HOGU_COLORS.primary}]`} 
      />

      <input type="number" placeholder="Prezzo/Tariffa base" className={`w-full p-3 border rounded-lg ${HOGU_THEME.focusRing} focus:border-[${HOGU_COLORS.primary}]`} />
      <label className="block text-sm font-medium text-gray-700 pt-2">Carica Immagini (Gestione Immagini)</label>
      <input type="file" multiple className="w-full p-3 border rounded-lg" />
      <PrimaryButton type="submit">Salva Servizio</PrimaryButton>
    </form>
  );

  return (
    <div title="Creazione e Modifica Servizi">
      <div className="flex space-x-2 border-b mb-6">
        {serviceTypes.map(type => (
          <button
            key={type}
            onClick={() => {
              setSelectedType(type);
              // Resetta la descrizione e il nome quando si cambia tab per coerenza
              setServiceName('');
              setDescription('');
            }}
            className={`px-4 py-2 font-medium transition-colors ${selectedType === type ? `border-b-2 border-[${HOGU_COLORS.primary}] text-[${HOGU_COLORS.dark}]` : 'text-gray-500 hover:text-gray-700'}`}
          >
            {type}
          </button>
        ))}
      </div>
      <ServiceForm type={selectedType} />
    </div>
  );
};
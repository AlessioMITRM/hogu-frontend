Certamente\! Ottima idea.

In questo modo, prepariamo un prompt "pre-caricato" con tutto il tuo Design System. Dovrai solo aggiungere la pagina su cui vuoi lavorare.

Ecco il tuo prompt modello personalizzato:

-----

### Prompt Modello (Pronto all'Uso)

```
Ciao Gemini,

Voglio lavorare su un file specifico della mia app HOGU. Per darti il contesto completo del mio Design System (colori e componenti), ti fornisco prima i file di supporto principali. Dopodiché, ti darò la pagina specifica su cui voglio lavorare.

Tratta questo come il contesto completo per la mia richiesta.

---[ 1. FILE DI SUPPORTO (Contesto Stile HOGU) ]---

### Contenuto di `src/config/theme.js`
// --- CONFIGURAZIONE E TEMA ---
export const HOGU_COLORS = {
  // Colore primario generale (per logo, accenti, bottoni non CTA critici)
  primary: '#68B49B', 
  // Colore primario per CTA critici (Diventa Provider) - (51, 89, 76)
  primaryHeroCTA: '#33594C', 
  dark: '#1A202C',     // Nero/Carbone Profondo (per testi e intestazioni)
  lightAccent: '#E6F5F0', // Sfondo Verde Chiaro (per tag)
  subtleText: '#4A5568', // Testo secondario
  // Colore per l'indicatore di risparmio
  success: '#009900', // Verde per Risparmio
  lightGray: '#E9EBF1', // Grigio molto chiaro per i grafici
  // Colore per gli accenti scuri nel widget di prenotazione (come il nero profondo del font)
  widgetDark: '#1E293B',
};

export const HOGU_THEME = {
  bg: 'bg-white',
  text: `text-[${HOGU_COLORS.dark}]`,
  primary: `bg-[${HOGU_COLORS.primary}] hover:bg-opacity-90`,
  primaryText: 'text-white',
  tag: `bg-[${HOGU_COLORS.lightAccent}] text-[${HOGU_COLORS.primary}]`,
  focusRing: `focus:ring-[${HOGU_COLORS.primary}]`,
  fontFamily: 'font-inter',
};

### Contenuto di `src/components/ui/Button.jsx`
import React from 'react';
import { HOGU_THEME, HOGU_COLORS } from '../../config/theme.js';

// Bottone Primario Standard (per tutte le aree tranne Hero CTA)
export const PrimaryButton = ({ children, onClick, className = '', disabled = false, type = 'button', style = {} }) => (
  <button
    type={type}
    onClick={onClick}
    disabled={disabled}
    style={style}
    className={`
      ${HOGU_THEME.primary} ${HOGU_THEME.primaryText} ${HOGU_THEME.fontFamily}
      px-6 py-3 text-lg font-semibold rounded-xl transition-all 
      shadow-[0_4px_10px_rgba(104,180,155,0.4)] hover:shadow-[0_4px_15px_rgba(104,180,155,0.6)]
      hover:scale-[1.03] disabled:opacity-50 disabled:cursor-not-allowed
      ${className}
    `}
  >
    {children}
  </button>
);

export const OutlineButton = ({ children, onClick, className = '', style = {} }) => (
  <button
    onClick={onClick}
    style={style}
    className={`
      ${HOGU_THEME.fontFamily} text-[${HOGU_COLORS.dark}]
      px-6 py-3 text-lg font-semibold rounded-xl transition-all
      border-2 border-[${HOGU_COLORS.primary}]
      hover:bg-[${HOGU_COLORS.primary}] hover:text-white
      ${className}
    `}
  >
    {children}
  </button>
);

// Componente OutlineButton Dark (Stile Nero/Trasparente nell'Hero)
export const OutlineButtonDark = ({ children, onClick, className = '', style = {} }) => (
  <button
    onClick={onClick}
    style={style}
    className={`
      ${HOGU_THEME.fontFamily} text-white
      px-6 py-3 text-xl font-semibold rounded-2xl transition-all
      border-2 border-white
      hover:bg-white hover:text-[${HOGU_COLORS.dark}]
      shadow-md hover:shadow-lg
      ${className}
    `}
  >
    {children}
  </button>
);

// Bottone Primario Scurito (SOLO per CTA Diventa Provider)
export const DarkPrimaryButton = ({ children, onClick, className = '', disabled = false, type = 'button', style = {} }) => (
  <button
    type={type}
    onClick={onClick}
    disabled={disabled}
    style={{ 
        backgroundColor: HOGU_COLORS.primaryHeroCTA, 
        // Ombra personalizzata che usa il colore scuro
        boxShadow: `0 4px 15px 0px rgba(51, 89, 76, 0.7)`,
        ...style
    }}
    className={`
      ${HOGU_THEME.primaryText} ${HOGU_THEME.fontFamily}
      px-6 py-3 text-lg font-semibold rounded-xl transition-all 
      hover:opacity-90 hover:scale-[1.03] disabled:opacity-50 disabled:cursor-not-allowed
      ${className}
    `}
  >
    {children}
  </button>
);

### Contenuto di `src/components/ui/Tag.jsx`
import React from 'react';
import { HOGU_THEME } from '../../config/theme.js';

export const Tag = ({ children, className = '' }) => (
  <span className={`
    ${HOGU_THEME.tag} ${HOGU_THEME.fontFamily}
    px-3 py-1 text-xs font-semibold rounded-full inline-block
    ${className}
  `}>
    {children}
  </span>
);



Analizza api-spec.json per le api di Restaurant Services Public 

2. Trova il componente ServiceListingRestaurant con i mock, proponi sostituzione con api-client.js.
3. SE parametri/endpoint mancanti: crea api-missing-fixes.md con proposte backend Java.
4. Genera plan step-by-step con diff preview. NON modificare senza approvazione.
5. Mantieni error handling, loading states, validazioni esistenti.
6. utilizza i seguenti componenti per modali di errore, successo o pagina in caricamento: 
   - LoadingScreen
   - SuccessModal
   - ErrorModal 

-----------------------------------------------------------------------------------------------------------------------------------------------

Devi fare i seguenti step:
- Modifica il componente ServiceListingLuggage.jsx levando i mock e creando delle api vere per apiClient.js, Implementa anche il componente per il caricamento dell'api LoadingScreen.jsx e quello di errore ErrorModal.jsx
- aggiorni il file api-missing-fixes.md riportando come dovrebbe essere il json della richiesta e risposta perl'api integrata

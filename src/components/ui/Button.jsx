import React from 'react';
import { HOGU_THEME, HOGU_COLORS } from '../../config/theme.js'; // .js

// ... (il resto del codice di tutti i bottoni rimane invariato)
// Bottone Primario Standard (per tutte le aree tranne Hero CTA)
export const PrimaryButton = ({ children, onClick, className = '' }) => (
    <button
        onClick={onClick}
        className={`
            bg-[#68B49B] hover:bg-[#599c86] text-white font-bold py-4 px-6
            rounded-2xl shadow-lg shadow-[#68B49B]/20 transition-all
            active:scale-95 w-full ${className}
        `}
    >
        {children}
    </button>
);

export const PrimaryEmphasis = ({ children, onClick, className = '' }) => (
    <button
        onClick={onClick}
        className={`
            w-full
            py-4 px-6
            font-bold text-white
            bg-[#4A8A75] hover:bg-[#3F7A66] 
            rounded-2xl
            shadow-lg shadow-[#4A8A75]/25
            transition-all active:scale-95
            ${className}
        `}>
        {children}
    </button>
);

export const SecondaryButton = ({
  children,
  onClick,
  className = '',
  disabled = false,
  type = 'button',
  style = {}
}) => (
  <button
    type={type}
    onClick={onClick}
    disabled={disabled}
    style={style}
    className={`
      ${HOGU_THEME.fontFamily}
      px-6 py-3 text-lg font-semibold rounded-xl transition-all
      border border-gray-300 text-gray-700 bg-white
      hover:bg-gray-100 hover:shadow-md hover:scale-[1.02]
      disabled:opacity-50 disabled:cursor-not-allowed
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
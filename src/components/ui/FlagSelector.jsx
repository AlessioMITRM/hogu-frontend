import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

// Componente per visualizzare le bandiere usando SVG inline
const InlineFlag = ({ country, className }) => {
  const baseClasses = `w-8 h-6 rounded-sm shadow-md flex-shrink-0 ${className}`;
  
  // SVG Bandiera Italiana (Verde, Bianco, Rosso)
  const ItalianFlag = (
    <svg viewBox="0 0 9 6" className={baseClasses}>
      <rect width="3" height="6" fill="#009246" /> {/* Verde */}
      <rect x="3" width="3" height="6" fill="#F4F5F0" /> {/* Bianco */}
      <rect x="6" width="3" height="6" fill="#CE2B37" /> {/* Rosso */}
    </svg>
  );

  // SVG Bandiera Britannica (Union Jack)
  const UKFlag = (
    <svg viewBox="0 0 20 10" className={baseClasses}>
      <rect width="20" height="10" fill="#012169" /> {/* Blu */}
      {/* Croci diagonali bianche */}
      <path fill="#FFFFFF" d="M0,0 L20,10 M20,0 L0,10" stroke="#FFFFFF" strokeWidth="2.5" />
      {/* Croci diagonali rosse */}
      <path fill="#C8102E" d="M0,0 L20,10 M20,0 L0,10" stroke="#C8102E" strokeWidth="1.5" />
      {/* Croce verticale e orizzontale bianche */}
      <rect x="8" width="4" height="10" fill="#FFFFFF" />
      <rect y="3" width="20" height="4" fill="#FFFFFF" />
      {/* Croce verticale e orizzontale rosse */}
      <rect x="9" width="2" height="10" fill="#C8102E" />
      <rect y="4" width="20" height="2" fill="#C8102E" />
    </svg>
  );

  return country === 'IT' ? ItalianFlag : UKFlag;
};

export const FlagSelector = () => {
    // True = IT, False = EN. Default IT.
    const [isItalian, setIsItalian] = useState(true);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    const toggleLanguage = (lang) => {
        setIsItalian(lang === 'IT');
        setIsDropdownOpen(false);
    };

    const currentLang = isItalian ? 'IT' : 'EN';
    const otherLang = isItalian ? 'EN' : 'IT';

    return (
      <div className="relative">
        <button 
          onClick={() => setIsDropdownOpen(!isDropdownOpen)} 
          className="p-1 rounded-lg hover:bg-gray-100 transition-colors flex items-center justify-center"
          aria-label={`Lingua Attuale: ${currentLang}`}
        >
          <InlineFlag country={currentLang} />
          <ChevronDown className="w-4 h-4 text-gray-600 ml-1" />
        </button>

        {isDropdownOpen && (
            <div className={`absolute right-0 mt-2 w-28 bg-white border border-gray-100 rounded-xl shadow-lg overflow-hidden z-10`}>
                <button
                    onClick={() => toggleLanguage(otherLang)}
                    className="flex items-center w-full p-2 cursor-pointer hover:bg-gray-50 transition-colors"
                >
                    <InlineFlag country={otherLang} className="mr-2" />
                    <span className="text-sm font-medium text-gray-700">{otherLang}</span>
                </button>
            </div>
        )}
      </div>
    );
  };
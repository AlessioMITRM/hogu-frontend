import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { processLocations, getLocationData } from '../../utils/locationUtils';
import { HOGU_COLORS } from '../../config/theme';

export const CityAutocomplete = ({ label, value, onChange, icon: Icon, placeholder = "Cerca città...", className = "", labelClassName = "", inputContainerClassName = "", inputClassName = "" }) => {
  const { i18n } = useTranslation();
  const [suggestions, setSuggestions] = useState([]);
  const [show, setShow] = useState(false);
  const wrapperRef = useRef(null);
  const [inputValue, setInputValue] = useState(value || '');

  // Sync internal state with external value prop
  useEffect(() => {
      if (value !== inputValue) {
          setInputValue(value || '');
      }
  }, [value]);

  const locationData = useMemo(() => {
    const raw = getLocationData(i18n.language);
    return processLocations(raw);
  }, [i18n.language]);

  useEffect(() => {
    const outside = e => wrapperRef.current && !wrapperRef.current.contains(e.target) && setShow(false);
    document.addEventListener('mousedown', outside);
    return () => document.removeEventListener('mousedown', outside);
  }, []);

  const handleInputChange = e => {
    const userInput = e.target.value;
    setInputValue(userInput);
    onChange(userInput);
    const lowerInput = userInput.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    
    if (userInput.length > 2) {
      const filtered = locationData
        .filter(item => item.searchString.includes(lowerInput))
        .sort((a, b) => {
          const aCity = a.city.toLowerCase();
          const bCity = b.city.toLowerCase();
          if (aCity === lowerInput && bCity !== lowerInput) return -1;
          if (bCity === lowerInput && aCity !== lowerInput) return 1;
          const aStarts = aCity.startsWith(lowerInput);
          const bStarts = bCity.startsWith(lowerInput);
          if (aStarts && !bStarts) return -1;
          if (!aStarts && bStarts) return 1;
          return aCity.localeCompare(bCity);
        })
        .slice(0, 8);
      setSuggestions(filtered);
      setShow(true);
    } else {
      setSuggestions([]);
      setShow(false);
    }
  };

  const handleSelect = item => {
    const formatted = `${item.city}, ${item.province}, ${item.region}`;
    setInputValue(formatted);
    onChange(formatted);
    setShow(false);
  };

  return (
    <div className={`flex flex-col gap-3 relative ${className}`} ref={wrapperRef}>
        {label && (
            <label className={`flex items-center gap-2 text-[10px] md:text-xs font-bold uppercase tracking-wide text-[${HOGU_COLORS.subtleText}] ml-1 ${labelClassName}`}>
                 {Icon && <Icon size={14} className="text-[#68B49B]" />}
                 {label}
            </label>
        )}
      <div className={`flex gap-2 bg-white p-1.5 rounded-2xl border border-gray-100 shadow-sm focus-within:ring-2 focus-within:ring-[#68B49B]/20 focus-within:border-[#68B49B] transition-all h-[50px] md:h-[60px] items-center relative z-20 ${inputContainerClassName}`}>
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => inputValue.length > 1 && setShow(true)}
          placeholder={placeholder}
          className={`w-full h-full px-3 bg-transparent border-none focus:ring-0 text-lg font-medium text-gray-800 placeholder:text-gray-400 outline-none ${inputClassName}`}
          autoComplete="off"
        />
        {show && suggestions.length > 0 && (
          <div className="absolute top-full left-0 mt-2 w-full bg-white rounded-xl shadow-xl border border-gray-100 max-h-60 overflow-y-auto z-[101]">
            {suggestions.map((it, idx) => (
              <button key={idx} type="button" onClick={() => handleSelect(it)} className="w-full text-left px-4 py-3 hover:bg-[#F0FDF9] hover:text-[#33594C] transition-colors border-b border-gray-50 last:border-0 group">
                <div className="font-bold text-sm text-gray-800 group-hover:text-[#33594C]">{it.city}</div>
                <div className="text-xs text-gray-400 group-hover:text-[#68B49B]/70">{it.province}, {it.region}</div>
              </button>
            ))}
          </div>
        )}
        {show && inputValue.length > 1 && suggestions.length === 0 && (
          <div className="absolute top-full left-0 mt-2 w-full bg-white rounded-xl shadow-xl border border-gray-100 p-4 text-center text-gray-400 text-sm z-[101]">
            Nessuna città trovata
          </div>
        )}
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next'; // ** AGGIUNTO **
import { Cookie, BarChart3, Megaphone, Settings2, X, Shield } from 'lucide-react';

// --- CONFIGURAZIONE E TEMA ---
const HOGU_THEME = {
  fontFamily: 'font-inter',
  text: 'text-gray-900',
  primary: '#68B49B',
  lightAccent: '#E6F5F0',
};

// --- COMPONENTI UI NECESSARI PER IL COOKIE CONSENT (Invariati) ---

const PrimaryButton = ({ children, onClick, className = '' }) => (
  <button
    onClick={onClick}
    className={`
      bg-[${HOGU_THEME.primary}] text-white font-bold py-3 px-6 rounded-xl 
      hover:bg-opacity-90 transition-all 
      shadow-lg shadow-[${HOGU_THEME.primary}]/20 
      active:scale-95 hover:scale-[1.02]
      ${className}
    `}
  >
    {children}
  </button>
);

const OutlineButton = ({ children, onClick, className = '' }) => (
  <button
    onClick={onClick}
    className={`
      bg-white text-gray-700 font-bold py-3 px-6 rounded-xl 
      border-2 border-gray-100 hover:border-[${HOGU_THEME.primary}] hover:text-[${HOGU_THEME.primary}]
      transition-all 
      active:scale-95
      ${className}
    `}
  >
    {children}
  </button>
);

const ToggleSwitch = ({ checked, onChange, disabled }) => (
  <button
    onClick={() => !disabled && onChange(!checked)}
    className={`
      relative w-12 h-7 rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-[${HOGU_THEME.primary}]/50
      ${checked ? `bg-[${HOGU_THEME.primary}]` : 'bg-gray-200'}
      ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
    `}
  >
    <span
      className={`
        absolute top-1 left-1 bg-white w-5 h-5 rounded-full shadow-sm transition-transform duration-300
        ${checked ? 'translate-x-5' : 'translate-x-0'}
      `}
    />
  </button>
);

// --- COMPONENTE PRINCIPALE ---
const CookieConsent = () => {
  const { t } = useTranslation("home"); // ** Hook di traduzione **
  const [isVisible, setIsVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [preferences, setPreferences] = useState({
    necessary: true,
    analytics: false,
    marketing: false
  });

  // Mostra il banner dopo 1 secondo (simulazione primo accesso)
  useEffect(() => {
    // Qui potresti controllare se esiste già un cookie salvato
    const consentGiven = localStorage.getItem('hogu_cookie_consent');
    if (!consentGiven) {
      const timer = setTimeout(() => setIsVisible(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const saveConsent = (prefs) => {
    localStorage.setItem('hogu_cookie_consent', JSON.stringify(prefs));
    setPreferences(prefs);
    setIsVisible(false);
    setShowDetails(false);
    console.log("Cookies: Preferenze salvate", prefs);
  };

  const handleAcceptAll = () => {
    saveConsent({ necessary: true, analytics: true, marketing: true });
  };

  const handleSavePreferences = () => {
    saveConsent(preferences);
  };

  const handleRejectOptional = () => {
    saveConsent({ necessary: true, analytics: false, marketing: false });
  };

  if (!isVisible && !showDetails) return null;

  return (
    <div className={HOGU_THEME.fontFamily}>
      {/* 1. BANNER BOTTOM (Sticky) */}
      {isVisible && !showDetails && (
        <div className="fixed bottom-4 left-4 right-4 z-[9999] animate-in slide-in-from-bottom-10 fade-in duration-500">
          <div className="max-w-4xl mx-auto bg-white/95 backdrop-blur-md rounded-[2rem] shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-white/50 p-6 md:p-4 flex flex-col md:flex-row items-center gap-6">
            
            <div className="flex items-start md:items-center gap-4 flex-1">
              <div className={`p-3 bg-[${HOGU_THEME.lightAccent}] rounded-2xl text-[${HOGU_THEME.primary}] shrink-0`}>
                <Cookie size={28} />
              </div>
              <div className="text-sm text-gray-600">
                <p className="font-bold text-gray-900 text-base mb-1">{t("cookie.banner.title")}</p>
                <p>
                    {t("cookie.banner.description_part1")}
                    <button onClick={() => setShowDetails(true)} className={`font-semibold text-[${HOGU_THEME.primary}] hover:underline`}>{t("cookie.banner.manage_preferences")}</button>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
              <OutlineButton onClick={() => setShowDetails(true)} className="flex-1 md:flex-none text-sm !py-2.5">{t("cookie.banner.customize")}</OutlineButton>
              <PrimaryButton onClick={handleAcceptAll} className="flex-1 md:flex-none text-sm !py-2.5 shadow-none">{t("cookie.banner.accept_all")}</PrimaryButton>
            </div>
          </div>
        </div>
      )}

      {/* 2. MODALE DI DETTAGLIO */}
      {showDetails && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm transition-opacity animate-in fade-in">
          <div className="bg-white rounded-[2.5rem] w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">
            
            {/* Header */}
            <div className="p-8 border-b border-gray-100 flex justify-between items-start bg-gray-50/50 rounded-t-[2.5rem]">
              <div>
                <div className="flex items-center gap-3 mb-2">
                   <div className={`p-2 bg-[${HOGU_THEME.lightAccent}] rounded-xl text-[${HOGU_THEME.primary}]`}>
                    <Settings2 size={24} />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">{t("cookie.modal.title")}</h3>
                </div>
                <p className="text-gray-500 text-sm">{t("cookie.modal.description")}</p>
              </div>
              <button onClick={() => setShowDetails(false)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors" aria-label={t("cookie.modal.close")}><X size={24} /></button>
            </div>

            {/* Lista Opzioni */}
            <div className="p-8 overflow-y-auto custom-scrollbar space-y-6">
              
              {/* Opzione 1: Necessari */}
              <div className="flex items-start gap-4 p-4 rounded-2xl bg-gray-50 border border-gray-100">
                <div className="text-gray-400 mt-1"><Shield size={24} /></div>
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <h4 className="font-bold text-gray-900">{t("cookie.categories.necessary.title")}</h4>
                    <ToggleSwitch checked={preferences.necessary} disabled={true} onChange={()=>{}} />
                  </div>
                  <p className="text-sm text-gray-500 leading-relaxed">{t("cookie.categories.necessary.description")}</p>
                </div>
              </div>

              {/* Opzione 2: Analitici */}
              <div className="flex items-start gap-4 p-4 rounded-2xl bg-white border border-gray-100 hover:border-gray-200 transition-colors">
                <div className={`text-[${HOGU_THEME.primary}] mt-1`}><BarChart3 size={24} /></div>
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <h4 className="font-bold text-gray-900">{t("cookie.categories.analytics.title")}</h4>
                    <ToggleSwitch 
                      checked={preferences.analytics} 
                      onChange={(val) => setPreferences({...preferences, analytics: val})} 
                    />
                  </div>
                  <p className="text-sm text-gray-500 leading-relaxed">{t("cookie.categories.analytics.description")}</p>
                </div>
              </div>

              {/* Opzione 3: Marketing */}
              <div className="flex items-start gap-4 p-4 rounded-2xl bg-white border border-gray-100 hover:border-gray-200 transition-colors">
                <div className={`text-[${HOGU_THEME.primary}] mt-1`}><Megaphone size={24} /></div>
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <h4 className="font-bold text-gray-900">{t("cookie.categories.marketing.title")}</h4>
                    <ToggleSwitch 
                      checked={preferences.marketing} 
                      onChange={(val) => setPreferences({...preferences, marketing: val})} 
                    />
                  </div>
                  <p className="text-sm text-gray-500 leading-relaxed">{t("cookie.categories.marketing.description")}</p>
                </div>
              </div>

            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-100 bg-gray-50/50 rounded-b-[2.5rem] flex flex-col sm:flex-row justify-end gap-3">
              <OutlineButton onClick={handleRejectOptional} className="text-sm">{t("cookie.modal.reject_optional")}</OutlineButton>
              <PrimaryButton onClick={handleSavePreferences} className="text-sm shadow-none">{t("cookie.modal.save_preferences")}</PrimaryButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CookieConsent;
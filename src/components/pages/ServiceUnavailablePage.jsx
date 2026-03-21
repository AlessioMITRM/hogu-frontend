import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, ArrowLeft, CalendarX, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { HOGU_COLORS, HOGU_THEME } from '../../config/theme.js';

const ServiceUnavailableContent = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div
      className={`min-h-screen bg-[${HOGU_COLORS.bgPage}] relative overflow-hidden flex flex-col items-center justify-start ${HOGU_THEME.fontFamily} pt-32 pb-12 px-4`}
    >
      {/* BACKGROUND FX */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-gray-200/30 rounded-full blur-3xl -translate-y-1/2 -translate-x-1/3 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-[#68B49B]/10 rounded-full blur-3xl translate-y-1/3 translate-x-1/3 pointer-events-none" />

      {/* CARD */}
      <div
        className={`
          relative z-10 max-w-xl w-full text-center 
          bg-white/70 backdrop-blur-md 
          border border-white/80 
          rounded-[2.5rem] p-8 md:p-12
          ${HOGU_THEME.shadowFloat}
          animate-in fade-in slide-in-from-bottom-4 duration-700
        `}
      >
        {/* ICON */}
        <div className="relative inline-flex items-center justify-center mb-10">
          <div
            className={`absolute inset-0 bg-gray-100 rounded-full blur-xl animate-pulse`}
          />
          <div className="relative bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
            <CalendarX
              size={64}
              className="text-gray-400"
              strokeWidth={1.5}
            />
          </div>
          <div className="absolute -bottom-3 -right-3 bg-white p-2 rounded-xl shadow-md border border-gray-50 text-gray-400">
            <AlertCircle size={24} />
          </div>
        </div>

        {/* TEXT */}
        <h1
          className={`text-4xl md:text-5xl font-extrabold text-[${HOGU_COLORS.dark}] mb-6 tracking-tight leading-tight`}
        >
          {t('service_unavailable.title', 'Servizio non disponibile')}
        </h1>

        <p
          className={`text-[${HOGU_COLORS.subtleText}] text-lg mb-10 leading-relaxed`}
        >
          {t('service_unavailable.description', 'Ci dispiace, ma il servizio che stai cercando non è più disponibile. Potrebbe essere stato prenotato da qualcun altro o rimosso dal fornitore.')}
        </p>

        {/* ACTIONS */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full">
          <button
            onClick={() => navigate(-1)}
            className="w-full sm:w-auto px-6 py-3.5 rounded-2xl border-2 border-gray-100 text-gray-600 font-bold hover:bg-white hover:border-gray-300 hover:text-gray-800 transition-all flex items-center justify-center gap-2 bg-transparent"
          >
            <ArrowLeft size={18} />
            {t('common.back', 'Torna indietro')}
          </button>

          <button
            onClick={() => navigate('/')}
            className={`
              w-full sm:w-auto px-8 py-3.5 rounded-2xl 
              bg-[${HOGU_COLORS.primary}] text-white font-bold 
              shadow-[0_8px_20px_-6px_rgba(104,180,155,0.5)] 
              hover:shadow-[0_12px_25px_-8px_rgba(104,180,155,0.7)]
              hover:bg-[${HOGU_COLORS.primaryDark}] 
              hover:-translate-y-0.5 
              transition-all duration-300
              flex items-center justify-center gap-2
            `}
          >
            <Home size={18} />
            {t('common.home', 'Torna alla Home')}
          </button>
        </div>

        {/* FOOTER */}
        <div className="mt-10 pt-6 border-t border-gray-100/60">
          <p className="text-xs text-gray-400 mt-3">
            {t('service_unavailable.code', 'ERROR_CODE')}{' '}
            <span className="font-mono">SERVICE_UNAVAILABLE</span>
          </p>
        </div>
      </div>
    </div>
  );
};

const ServiceUnavailablePage = () => <ServiceUnavailableContent />;

export default ServiceUnavailablePage;

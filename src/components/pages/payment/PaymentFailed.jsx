import React from 'react';
import { XCircle, ArrowRight, RefreshCw, Lock } from 'lucide-react';
import { Breadcrumbs } from '../../ui/Breadcrumbs.jsx'; 
import { HOGU_COLORS, HOGU_THEME } from '../../../config/theme.js';
import { useTranslation } from 'react-i18next';

const breadcrumbsItems = [
  { labelKey: 'breadcrumbs.home', href: '/' },
  { labelKey: 'breadcrumbs.catalog', href: '/catalog' },
  { labelKey: 'breadcrumbs.checkout', href: '#' }
];

// Bottone Primario per Errore (Rosso)
const ErrorButton = ({ children, onClick, className = '', disabled = false, type = 'button', style = {} }) => (
  <button type={type} onClick={onClick} disabled={disabled} style={style}
    className={`bg-red-600 text-white hover:bg-red-700 font-sans px-6 py-3 text-lg font-semibold rounded-xl transition-all 
      shadow-[0_4px_10px_rgba(239,68,68,0.4)] hover:shadow-[0_4px_15px_rgba(239,68,68,0.6)]
      hover:scale-[1.03] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${className}`}>
    {children}
  </button>
);

const OutlineButton = ({ children, onClick, className = '', style = {} }) => (
  <button onClick={onClick} style={style} 
    className={`font-sans text-[#1A202C] px-6 py-3 text-lg font-semibold rounded-xl transition-all
      border-2 border-[#68B49B] hover:bg-[#68B49B] hover:text-white flex items-center justify-center gap-2 ${className}`}>
    {children}
  </button>
);

const PaymentFailed = ({ onRetry, onCancel }) => {
  const { t } = useTranslation();

  return (
    <div className={`min-h-screen bg-[#F8FAFC] pb-24 ${HOGU_THEME.fontFamily}`}>
      
      <div className="bg-white pt-8 pb-20 px-4 lg:px-8 relative overflow-hidden border-b border-gray-100">
        <div className="max-w-7xl mx-auto relative z-10">
          <Breadcrumbs items={breadcrumbsItems.map(item => ({...item, label: t(item.labelKey)}))} />
        </div>

        <div className="max-w-7xl mx-auto relative z-10 flex flex-col items-center">
          <h1 className="text-3xl md:text-4xl font-extrabold text-[#1A202C]">
            {t('payment.failed_title')} <span className="text-red-600">{t('payment.payment')}</span>
          </h1>
          <p className="text-slate-500 mt-2 flex items-center gap-2 text-sm">
            <Lock size={14} className="text-red-600"/> {t('payment.secure_transaction')}
          </p>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 -mt-12 relative z-20">
        <div className="bg-white rounded-3xl shadow-xl w-full overflow-hidden relative border border-gray-100">
          
          {/* SOLO QUESTO HEADER È ROSSO */}
          <div className="bg-red-50 p-8 flex flex-col items-center text-center relative overflow-hidden">
            <div className="absolute top-[-50%] left-[-20%] w-64 h-64 bg-red-500 opacity-10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-[-20%] right-[-20%] w-40 h-40 bg-red-500 opacity-20 rounded-full blur-3xl"></div>

            <div className="relative mb-4">
              <div className="absolute inset-0 bg-red-500 opacity-10 rounded-full animate-pulse"></div>
              <div className="relative bg-white p-3 rounded-full shadow-sm">
                <XCircle size={64} color={HOGU_COLORS.error} strokeWidth={2.5} />
              </div>
            </div>

            <h2 className="text-2xl font-bold text-red-600 mb-2">
              {t('payment.failed_message')}
            </h2>
            <p className="text-red-700 text-sm">
              {t('payment.failed_submessage')}
            </p>
          </div>

          {/* Resto della card rimane invariato */}
          <div className="p-8 space-y-6">
            <div className="bg-white border border-gray-100 rounded-xl p-4 text-center">
              <p className="text-sm text-gray-700 font-medium">
                {t('payment.failed_reason')}
              </p>
            </div>

            <div className="flex flex-col gap-3 pt-2">
              <ErrorButton onClick={onRetry} className="w-full">
                <RefreshCw size={20} /> {t('payment.retry')}
              </ErrorButton>
              
              <OutlineButton onClick={onCancel} className="w-full border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-800 hover:border-gray-300 hover:shadow-sm">
                <ArrowRight size={20} className="rotate-180" /> {t('payment.cancel')}
              </OutlineButton>
            </div>
          </div>

          <div className="bg-gray-50 px-8 py-3 text-center border-t border-gray-100">
            <p className="text-xs text-gray-400">{t('payment.contact_support')}</p>
          </div>

        </div>
      </div>
    </div>
  );
};

export default function App() {
  const handleRetryPayment = () => console.log("Riprova pagamento cliccato");
  const handleCancel = () => console.log("Annulla cliccato");

  return <PaymentFailed onRetry={handleRetryPayment} onCancel={handleCancel} />;
}

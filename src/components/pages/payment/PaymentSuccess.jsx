import React, { useState } from 'react';
import { CheckCircle, Home, FileText, Copy, Lock } from 'lucide-react';
import { Breadcrumbs } from '../../ui/Breadcrumbs.jsx'; 
import { HOGU_COLORS, HOGU_THEME } from '../../../config/theme.js';
import { useTranslation } from 'react-i18next';

const breadcrumbsItems = [
    { labelKey: 'breadcrumbs.home', href: '/' },
    { labelKey: 'breadcrumbs.catalog', href: '/catalog' },
    { labelKey: 'breadcrumbs.checkout', href: '#' }
];

const PrimaryButton = ({ children, onClick, className = '', disabled = false, type = 'button', style = {} }) => (
  <button type={type} onClick={onClick} disabled={disabled} style={style}
    className={`bg-[#68B49B] text-white hover:bg-opacity-90 font-sans px-6 py-3 text-lg font-semibold rounded-xl transition-all 
      shadow-[0_4px_10px_rgba(104,180,155,0.4)] hover:shadow-[0_4px_15px_rgba(104,180,155,0.6)]
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

const PaymentSuccess = ({ onGoHome, onGoDetails }) => {
  const { t } = useTranslation();
  
  const bookingData = {
    id: "HOGU-88294X",
    service: "Pulizia Domestica Standard",
    date: "12 Ottobre 2025",
    amount: "€ 45,00",
    provider: "Maria Rossi"
  };

  const [copied, setCopied] = useState(false);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(bookingData.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`min-h-screen bg-[#F8FAFC] pb-24 ${HOGU_THEME.fontFamily}`}>
      <div className="bg-white pt-8 pb-20 px-4 lg:px-8 relative overflow-hidden border-b border-gray-100">
        <div className="max-w-7xl mx-auto relative z-10">
            <Breadcrumbs items={breadcrumbsItems.map(item => ({...item, label: t(item.labelKey)}))} />
        </div>

        <div className="max-w-7xl mx-auto relative z-10 flex flex-col items-center">
          <h1 className="text-3xl md:text-4xl font-extrabold text-[#1A202C]">
            {t('payment.title')} <span className="text-[#68B49B]">{t('payment.confirmed')}</span>
          </h1>
          <p className="text-slate-500 mt-2 flex items-center gap-2 text-sm">
              <Lock size={14} className="text-[#68B49B]"/> {t('payment.secure_transaction')}
          </p>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 -mt-12 relative z-20">
        <div className="bg-white rounded-3xl shadow-xl w-full overflow-hidden relative border border-gray-100">
          
          <div className="bg-[#E6F5F0] p-8 flex flex-col items-center text-center relative overflow-hidden">
            <div className="absolute top-[-50%] left-[-20%] w-64 h-64 bg-[#68B49B] opacity-10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-[-20%] right-[-20%] w-40 h-40 bg-[#68B49B] opacity-20 rounded-full blur-3xl"></div>

            <div className="relative mb-4">
              <div className="absolute inset-0 bg-[#68B49B] opacity-20 rounded-full animate-ping"></div>
              <div className="relative bg-white p-3 rounded-full shadow-sm">
                <CheckCircle size={64} color={HOGU_COLORS.primary} strokeWidth={2.5} />
              </div>
            </div>

            <h2 className={`text-2xl font-bold text-[${HOGU_COLORS.dark}] mb-2`}>
              {t('payment.all_done')}
            </h2>
            <p className={`text-[${HOGU_COLORS.subtleText}] text-sm`}>
              {t('payment.success_message')}
            </p>
          </div>

          <div className="p-8 space-y-6">
            <div className="bg-gray-50 border border-dashed border-gray-300 rounded-xl p-4 flex flex-col items-center justify-center space-y-2 relative">
              <span className="text-xs uppercase tracking-wider font-semibold text-gray-500">
                {t('payment.booking_code')}
              </span>
              <div className="flex items-center gap-2">
                <span className={`text-2xl font-mono font-bold text-[${HOGU_COLORS.dark}]`}>
                  {bookingData.id}
                </span>
                <button onClick={handleCopyCode} 
                  className="p-1.5 hover:bg-gray-200 rounded-md transition-colors" 
                  title={t('payment.copy_code')}>
                  {copied ? <CheckCircle size={16} color={HOGU_COLORS.primary} /> : <Copy size={16} />}
                </button>
              </div>
              {copied && <span className="absolute -bottom-2 text-[10px] text-[#68B49B] bg-white px-2 rounded-full border border-[#68B49B]">{t('copied')}</span>}
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm border-b border-gray-100 pb-2">
                <span className="text-gray-500">{t('payment.service')}</span>
                <span className="font-semibold text-gray-800">{bookingData.service}</span>
              </div>
              <div className="flex justify-between items-center text-sm border-b border-gray-100 pb-2">
                <span className="text-gray-500">{t('payment.date')}</span>
                <span className="font-semibold text-gray-800">{bookingData.date}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">{t('payment.total_paid')}</span>
                <span className={`font-bold text-[${HOGU_COLORS.primaryHeroCTA}]`}>{bookingData.amount}</span>
              </div>
            </div>

            <div className="flex flex-col gap-3 pt-4">
              <PrimaryButton onClick={onGoDetails} className="w-full">
                <FileText size={20} /> {t('payment.view_details')}
              </PrimaryButton>
              
              <OutlineButton onClick={onGoHome} className="w-full border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-800 hover:border-gray-300 hover:shadow-sm">
                <Home size={20} /> {t('payment.back_home')}
              </OutlineButton>
            </div>
          </div>

          <div className="bg-gray-50 px-8 py-3 text-center border-t border-gray-100">
              <p className="text-xs text-gray-400">{t('payment.confirmation_email')}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function App() {
  const [currentView, setCurrentView] = useState('success');

  const handleGoHome = () => setCurrentView('home');
  const handleGoDetails = () => setCurrentView('details');
  const handleReset = () => setCurrentView('success');

  const { t } = useTranslation('payment');

  if (currentView === 'home') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 font-sans pt-32">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">{t('payment.homepage')}</h1>
        <button onClick={handleReset} className="text-[#68B49B] underline font-semibold">{t('payment.simulate_payment')}</button>
      </div>
    );
  }

  if (currentView === 'details') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 font-sans pt-32">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">{t('payment.booking_details')}</h1>
        <OutlineButton onClick={handleReset}>{t('payment.back')}</OutlineButton>
      </div>
    );
  }

  return (
    <PaymentSuccess 
      onGoHome={handleGoHome}
      onGoDetails={handleGoDetails}
    />
  );
}

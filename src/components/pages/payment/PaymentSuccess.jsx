import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle, Home, Copy, Lock, Loader2 } from 'lucide-react';
import { Breadcrumbs } from '../../ui/Breadcrumbs.jsx'; 
import { HOGU_COLORS, HOGU_THEME } from '../../../config/theme.js';
import { useTranslation } from 'react-i18next';
import { paymentService } from '../../../api/apiClient';
import { getPaymentStatusLabel, getBookingStatusLabel, getStatusColor } from '../../../utils/statusUtils';

const breadcrumbsItems = [
    { labelKey: 'breadcrumbs.home', href: '/' },
    { labelKey: 'breadcrumbs.payment', href: '#' },
    { labelKey: 'breadcrumbs.checkout', href: '#' }
];

const OutlineButton = ({ children, onClick, className = '', style = {} }) => (
  <button onClick={onClick} style={style} 
    className={`font-sans text-[#1A202C] px-6 py-3 text-lg font-semibold rounded-xl transition-all
      border-2 border-[#68B49B] hover:bg-[#68B49B] hover:text-white flex items-center justify-center gap-2 ${className}`}>
    {children}
  </button>
);

const PaymentSuccess = () => {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [bookingInfo, setBookingInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const formatDate = (dateStr) => {
    try {
        const d = dateStr ? new Date(dateStr) : new Date();
        const day = d.getDate().toString().padStart(2, '0');
        const month = (d.getMonth() + 1).toString().padStart(2, '0');
        const year = d.getFullYear();
        const time = d.toLocaleTimeString(i18n.language, {
            hour: '2-digit', 
            minute: '2-digit'
        });
        return `${day}/${month}/${year} ${time}`;
    } catch {
        return dateStr;
    }
  };

  useEffect(() => {
    const fetchBookingInfo = async () => {
        // 1. Prova a prendere i dati dallo state della navigazione (flusso Stripe o PayPal diretto)
        if (location.state?.booking) {
            setBookingInfo({
                id: location.state.booking.id || location.state.booking._id,
                service: location.state.booking.serviceName || t('payment.service_booked'),
                date: formatDate(location.state.booking.date),
                amount: location.state.payment?.amount ? `€ ${(location.state.payment.amount).toFixed(2)}` : t('payment.payment_confirmed_status'),
                provider: location.state.booking.providerName || t('payment.hogu_provider'),
                bookingStatus: location.state.booking.bookingStatus || 'PENDING',
                paymentStatus: location.state.payment?.status || 'PENDING'
            });
            setIsLoading(false);
            return;
        }

        // 2. Recupera i parametri dall'URL (paymentId, payerId, bookingId)
        const queryParams = new URLSearchParams(location.search);
        const paymentId = queryParams.get('paymentId') || location.state?.paymentId;
        
        // Se abbiamo un paymentId, usiamo la nuova API per recuperare i dettagli
        if (paymentId) {
             try {
                 const details = await paymentService.getBookingInfoByPaymentId(paymentId);
                 // Mappiamo la risposta del backend nel formato atteso dal componente
                 setBookingInfo({
                    id: details.bookingId || "N/D",
                    service: details.serviceName || t('payment.hogu_service'),
                    date: formatDate(details.bookingDate),
                    amount: details.amount ? `€ ${Number(details.amount).toFixed(2)}` : t('payment.payment_confirmed_status'),
                    provider: details.providerName || t('payment.hogu_partner'),
                    bookingStatus: details.bookingStatus || 'PENDING',
                    paymentStatus: details.paymentStatus || 'PENDING'
                 });
             } catch (err) {
                 console.error("Errore recupero dettagli prenotazione:", err);
                 // Fallback in caso di errore
                 setBookingInfo({
                    id: location.state?.bookingId || "N/D",
                    service: t('payment.hogu_service'),
                    date: formatDate(new Date()),
                    amount: t('payment.payment_confirmed_status'),
                    provider: t('payment.hogu_partner'),
                    bookingStatus: 'PENDING',
                    paymentStatus: 'PENDING'
                 });
             }
             setIsLoading(false);
        } else {
            // Caso fallback se non abbiamo né state né paymentId
            const bookingId = location.state?.bookingId;
            if (bookingId) {
                setBookingInfo({
                    id: bookingId,
                    service: t('payment.hogu_service'),
                    date: formatDate(new Date()),
                    amount: t('payment.payment_confirmed_status'),
                    provider: t('payment.hogu_partner'),
                    bookingStatus: 'PENDING',
                    paymentStatus: 'PENDING'
                 });
            }
            setIsLoading(false);
        }
    };

    fetchBookingInfo();
  }, [location.state, location.search, i18n.language]);

  const [copied, setCopied] = useState(false);

  const handleCopyCode = () => {
    if (bookingInfo?.id) {
        navigator.clipboard.writeText(bookingInfo.id);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleGoHome = () => navigate('/');

  if (isLoading) {
      return (
          <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
              <Loader2 className="animate-spin text-[#68B49B]" size={48} />
          </div>
      );
  }

  if (!bookingInfo) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8FAFC]">
            <h1 className="text-2xl font-bold text-gray-800">{t('payment.no_booking_found')}</h1>
            <OutlineButton onClick={handleGoHome} className="mt-4">{t('payment.back_home')}</OutlineButton>
        </div>
      );
  }

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
              {bookingInfo.bookingStatus === 'PENDING' || bookingInfo.bookingStatus === 'WAITING_PROVIDER_CONFIRMATION'
                ? t('payment.request_sent')
                : t('payment.all_done')}
            </h2>
            <p className={`text-[${HOGU_COLORS.subtleText}] text-sm`}>
              {bookingInfo.bookingStatus === 'PENDING' || bookingInfo.bookingStatus === 'WAITING_PROVIDER_CONFIRMATION'
                ? t('payment.pending_message')
                : t('payment.success_message')}
            </p>
          </div>

          <div className="p-8 space-y-6">
            <div className="bg-gray-50 border border-dashed border-gray-300 rounded-xl p-4 flex flex-col items-center justify-center space-y-2 relative">
              <span className="text-xs uppercase tracking-wider font-semibold text-gray-500">
                {t('payment.booking_code')}
              </span>
              <div className="flex items-center gap-2">
                <span className={`text-2xl font-mono font-bold text-[${HOGU_COLORS.dark}]`}>
                  {bookingInfo.id}
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
                <span className="font-semibold text-gray-800">{bookingInfo.service}</span>
              </div>
              <div className="flex justify-between items-center text-sm border-b border-gray-100 pb-2">
                <span className="text-gray-500">{t('payment.date')}</span>
                <span className="font-semibold text-gray-800">{bookingInfo.date}</span>
              </div>
              
              <div className="flex justify-between items-center text-sm border-b border-gray-100 pb-2">
                <span className="text-gray-500">{t('payment.payment_status')}</span>
                <span className={`font-semibold ${getStatusColor(bookingInfo.paymentStatus)}`}>
                    {t(getPaymentStatusLabel(bookingInfo.paymentStatus))}
                </span>
              </div>

              <div className="flex justify-between items-center text-sm border-b border-gray-100 pb-2">
                <span className="text-gray-500">{t('payment.booking_status')}</span>
                <span className={`font-semibold ${getStatusColor(bookingInfo.bookingStatus)}`}>
                    {t(getBookingStatusLabel(bookingInfo.bookingStatus))}
                </span>
              </div>

              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">{t('payment.total_paid')}</span>
                <span className={`font-bold text-[${HOGU_COLORS.primaryHeroCTA}]`}>{bookingInfo.amount}</span>
              </div>
            </div>

            <div className="flex flex-col gap-3 pt-4">
              <OutlineButton onClick={handleGoHome} className="w-full border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-800 hover:border-gray-300 hover:shadow-sm">
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

export default PaymentSuccess;

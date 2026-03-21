import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { XCircle, ArrowRight, RefreshCw, Lock, Loader2 } from 'lucide-react';
import { Breadcrumbs } from '../../ui/Breadcrumbs.jsx';
import { HOGU_COLORS, HOGU_THEME } from '../../../config/theme.js';
import { useTranslation } from 'react-i18next';
import { paymentService, bookingService, authService } from '../../../api/apiClient';

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

const PaymentFailed = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const [isRetrying, setIsRetrying] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [retryError, setRetryError] = useState(null);

  const handleRetry = async () => {
    setIsRetrying(true);
    setRetryError(null);

    try {
      const queryParams = new URLSearchParams(location.search);
      let bookingId = queryParams.get('bookingId') || location.state?.bookingId;
      let amount = queryParams.get('amount');
      let serviceType = queryParams.get('serviceType');
      let method = queryParams.get('method') || location.state?.method || 'paypal';

      const paymentIdState = location.state?.paymentId;

      // Se mancano dati ma abbiamo il paymentId (da Callback failure), recuperiamo i dettagli
      if ((!amount || !serviceType) && paymentIdState) {
        try {
          const details = await paymentService.getBookingInfoByPaymentId(paymentIdState);
          amount = details.amount;
          serviceType = details.serviceType;
          if (!bookingId) bookingId = details.bookingId;
        } catch (fetchErr) {
          console.error("Impossibile recuperare dettagli pagamento:", fetchErr);
        }
      }

      if (!bookingId) {
        // Se non abbiamo l'ID, non possiamo riprovare -> redirect al summary (o catalog)
        navigate('/payment/summary');
        return;
      }

      if (method === 'stripe') {
        let userId = null;
        let userEmail = null;
        try {
          const profile = await authService.getCustomerProfile();
          userId = profile.id;
          userEmail = profile.email;
        } catch (err) {
          console.warn("Could not fetch user profile for retry", err);
        }

        const stripePayload = {
          bookingId,
          userId: userId,
          amount: amount,
          currency: 'EUR',
          serviceType: serviceType || 'UNKNOWN',
          customerEmail: userEmail,
          paymentIdMethod: "pm_card_visa",
          description: t('payment.retry_payment_desc'),
          returnUrl: `${window.location.origin}/payment/success`,
          cancelUrl: `${window.location.origin}/payment/cancel?bookingId=${bookingId}&amount=${amount}&serviceType=${serviceType}&method=stripe`
        };

        const stripeResponse = await paymentService.processStripePayment(stripePayload);
        if (stripeResponse.approvalUrl) {
          window.location.href = stripeResponse.approvalUrl;
        } else {
          navigate('/payment/success', { state: { booking: { id: bookingId }, payment: stripeResponse } });
        }
      } else {
        const payload = {
          bookingId,
          serviceType: serviceType || 'UNKNOWN',
          amount: amount,
          currency: 'EUR',
          returnUrl: `${window.location.origin}/payment/callback?bookingId=${bookingId}&method=paypal`,
          // Aggiorniamo anche qui i parametri di cancel per il prossimo tentativo
          cancelUrl: `${window.location.origin}/payment/cancel?bookingId=${bookingId}&amount=${amount}&serviceType=${serviceType}&method=paypal`
        };

        const response = await paymentService.startPayPalPayment(payload);
        const approvalUrl = response.approvalUrl ||
          (response.links && response.links.find(l => l.rel === 'approve' || l.rel === 'approval_url')?.href);

        if (approvalUrl) {
          window.location.href = approvalUrl;
        } else {
          throw new Error(t('payment.paypal_link_not_found'));
        }
      }

    } catch (err) {
      console.error("Retry Error:", err);
      setRetryError(err.message || t('payment.unable_to_retry_payment'));
      setIsRetrying(false);
    }
  };

  const handleCancel = async () => {
    setIsCancelling(true);
    try {
      const queryParams = new URLSearchParams(location.search);
      let bookingId = queryParams.get('bookingId') || location.state?.bookingId;
      let serviceType = queryParams.get('serviceType') || location.state?.serviceType;

      // Se non abbiamo l'ID o il tipo, proviamo a recuperarli dal paymentId
      if ((!bookingId || !serviceType) && location.state?.paymentId) {
        try {
          const details = await paymentService.getBookingInfoByPaymentId(location.state.paymentId);
          if (!bookingId) bookingId = details.bookingId;
          if (!serviceType) serviceType = details.serviceType;
        } catch (e) {
          console.warn("Impossibile recuperare dettagli per cancellazione:", e);
        }
      }

      if (bookingId) {
        await bookingService.cancelBooking(bookingId, serviceType || 'UNKNOWN');
      }
    } catch (err) {
      console.error("Errore durante l'annullamento della prenotazione:", err);
      // Anche se fallisce (es. già cancellata), procediamo al redirect
    } finally {
      setIsCancelling(false);
      navigate('/'); // Torna alla home dopo l'annullamento
    }
  };

  return (
    <div className={`min-h-screen bg-[#F8FAFC] pb-24 ${HOGU_THEME.fontFamily}`}>

      <div className="bg-white pt-8 pb-20 px-4 lg:px-8 relative overflow-hidden border-b border-gray-100">
        <div className="max-w-7xl mx-auto relative z-10">
          <Breadcrumbs items={breadcrumbsItems.map(item => ({ ...item, label: t(item.labelKey) }))} />
        </div>

        <div className="max-w-7xl mx-auto relative z-10 flex flex-col items-center">
          <h1 className="text-3xl md:text-4xl font-extrabold text-[#1A202C]">
            {t('payment.failed_title')} <span className="text-red-600">{t('payment.payment')}</span>
          </h1>
          <p className="text-slate-500 mt-2 flex items-center gap-2 text-sm">
            <Lock size={14} className="text-red-600" /> {t('payment.secure_transaction')}
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

          <div className="p-8 space-y-6">
            <div className="bg-white border border-gray-100 rounded-xl p-4 text-center">
              <p className="text-sm text-gray-700 font-medium">
                {t('payment.failed_reason')}
              </p>
            </div>

            {retryError && (
              <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-2 rounded-lg text-sm text-center mb-2">
                {retryError}
              </div>
            )}

            <div className="flex flex-col gap-3 pt-2">
              <ErrorButton onClick={handleRetry} disabled={isRetrying} className="w-full">
                {isRetrying ? <Loader2 className="animate-spin" size={20} /> : <RefreshCw size={20} />}
                {isRetrying ? t('payment.waiting') : t('payment.retry')}
              </ErrorButton>

              <OutlineButton onClick={handleCancel} disabled={isRetrying || isCancelling} className="w-full border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-800 hover:border-gray-300 hover:shadow-sm">
                {isCancelling ? <Loader2 className="animate-spin" size={20} /> : <ArrowRight size={20} className="rotate-180" />}
                {isCancelling ? t('payment.cancelling') : t('payment.cancel')}
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

export default PaymentFailed;

import React, { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { paymentService } from '../../../api/apiClient';
import LoadingScreen from '../../ui/LoadingScreen.jsx';

const PaymentCallbackPage = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const executePayment = async () => {
      const paymentId = searchParams.get('paymentId');
      // PayPal di solito invia 'PayerID', ma per robustezza controlliamo anche 'payerId'
      const payerId = searchParams.get('PayerID') || searchParams.get('payerId'); 
      let bookingId = searchParams.get('bookingId');

      console.log("PaymentCallback params:", { paymentId, payerId, bookingId });
      
      // Se mancano i parametri fondamentali, probabilmente è un errore o un accesso diretto non valido
      if (!paymentId || !payerId) {
        console.error("Parametri mancanti per la callback PayPal:", { paymentId, payerId });
        navigate('/payment/failed', { 
            state: { 
                error: t('payment.missing_payment_params'),
                bookingId: bookingId,
                paymentId: paymentId
            },
            replace: true // Sostituisce la history per evitare loop col tasto back
        });
        return;
      }

      try {
        await paymentService.executePayPalPayment(paymentId, payerId);

        if (!bookingId) {
          try {
            const info = await paymentService.getBookingInfoByPaymentId(paymentId);
            if (info && info.bookingId) {
              bookingId = info.bookingId;
            }
          } catch (infoErr) {
          }
        }

        navigate('/payment/success', { 
            state: { 
                bookingId: bookingId,
                method: 'paypal',
                status: 'completed',
                paymentId: paymentId 
            },
            replace: true
        });
      } catch (err) {
        console.error("Errore durante l'esecuzione del pagamento PayPal:", err);

        try {
          const info = await paymentService.getBookingInfoByPaymentId(paymentId);
          if (info && (info.paymentStatus === 'COMPLETED' || info.paymentStatus === 'AUTHORIZED')) {
            if (!bookingId && info.bookingId) {
              bookingId = info.bookingId;
            }

            navigate('/payment/success', { 
                state: { 
                    bookingId: bookingId,
                    method: 'paypal',
                    status: 'completed',
                    paymentId: paymentId 
                },
                replace: true
            });
            return;
          }
        } catch (infoErr) {
          console.error("Errore nel recuperare lo stato del pagamento:", infoErr);
        }

        navigate('/payment/failed', { 
            state: { 
                error: err.message || t('payment.payment_finalization_error'),
                bookingId: bookingId,
                paymentId: paymentId
            },
            replace: true
        });
      }
    };

    executePayment();
  }, [searchParams, navigate, t]);

  // Schermata di caricamento "fullscreen" che copre tutto finché non avviene il redirect
  return (
    <div className="fixed inset-0 z-50 bg-white flex items-center justify-center">
        <LoadingScreen isLoading={true} message={t('payment.confirming_payment')} />
    </div>
  );
};

export default PaymentCallbackPage;

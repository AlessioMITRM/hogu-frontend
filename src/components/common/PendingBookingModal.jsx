import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2, AlertTriangle, CreditCard, XCircle } from 'lucide-react';
import { paymentService, bookingService, authService } from '../../api/apiClient';

const PendingBookingModal = ({ booking, onResolved, onPaymentStart }) => {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!booking) return null;

  // Normalizza i dati ricevuti dal backend
  const bookingId = booking.bookingId || booking.id;
  // Se 'serviceName' arriva come "bomber eventi", potrebbe non essere valido per l'API di pagamento se si aspetta "CLUB_EVENT" o simili.
  // Tuttavia, basandoci sulla tua richiesta, usiamo esattamente ciò che arriva.
  const serviceType = booking.serviceType || booking.serviceName || 'UNKNOWN';
  const amount = booking.amount || booking.totalAmount;

  // Formatta l'importo: es. 0.5 diventa "0,50"
  const formattedAmount = new Intl.NumberFormat('it-IT', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);

  const handlePay = async () => {
    setIsLoading(true);
    setError(null);

    // Debug: Logga cosa stiamo per inviare
    console.log("Avvio pagamento pending per:", { bookingId, serviceType, amount, paymentMethod: booking.paymentMethod });

    try {
      // Notifica il genitore che il pagamento sta iniziando (per resettare flag)
      if (onPaymentStart) onPaymentStart();

      // Determina il metodo di pagamento (default a PAYPAL se mancante)
      const method = booking.paymentMethod ? booking.paymentMethod.toUpperCase() : 'PAYPAL';

      if (method === 'STRIPE' || method === 'CREDIT_CARD') {
        let userId = null;
        let userEmail = null;
        try {
          const profile = await authService.getCustomerProfile();
          userId = profile.id;
          userEmail = profile.email;
        } catch (err) {
          console.warn("Could not fetch user profile for retry", err);
        }

        // --- STRIPE FLOW ---
        const payload = {
          bookingId: bookingId,
          userId: userId,
          amount: amount,
          currency: 'EUR',
          serviceType: serviceType,
          customerEmail: userEmail,
          paymentIdMethod: "pm_card_visa", // Default per avviare checkout/session
          description: `Pagamento per ${serviceType}`,
          returnUrl: `${window.location.origin}/payment/success`,
          cancelUrl: `${window.location.origin}/payment/cancel?bookingId=${bookingId}&amount=${amount}&serviceType=${serviceType}&method=stripe`
        };

        const response = await paymentService.processStripePayment(payload);

        if (response.approvalUrl) {
          window.location.href = response.approvalUrl;
        } else if (response.paymentStatus === 'COMPLETED' || response.paymentStatus === 'AUTHORIZED') {
          // Se il pagamento è già completato (raro per redirect flow), ricarica o chiudi
          window.location.reload();
        } else {
          throw new Error("Impossibile ottenere il link di pagamento Stripe.");
        }

      } else {
        // --- PAYPAL FLOW ---
        const payload = {
          bookingId: bookingId,
          serviceType: serviceType, // Assicurati che questo valore sia quello atteso dal backend (es. enum)
          amount: amount,
          currency: 'EUR',
          returnUrl: `${window.location.origin}/payment/callback?bookingId=${bookingId}&method=paypal`,
          cancelUrl: `${window.location.origin}/payment/cancel?bookingId=${bookingId}&amount=${amount}&serviceType=${serviceType}&method=paypal`
        };

        const response = await paymentService.startPayPalPayment(payload);
        const approvalUrl = response.approvalUrl ||
          (response.links && response.links.find(l => l.rel === 'approve' || l.rel === 'approval_url')?.href);

        if (approvalUrl) {
          window.location.href = approvalUrl;
        } else {
          throw new Error("Link PayPal non trovato.");
        }
      }
    } catch (err) {
      console.error("Payment Start Error:", err);
      setError("Impossibile avviare il pagamento. Riprova.");
      setIsLoading(false);
    }
  };

  const handleCancel = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await bookingService.cancelBooking(bookingId, serviceType);
      onResolved(); // Chiude la modale o aggiorna lo stato
    } catch (err) {
      console.error("Cancel Error:", err);
      setError("Impossibile cancellare la prenotazione.");
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-300">
        <div className="bg-amber-50 p-6 flex flex-col items-center text-center border-b border-amber-100">
          <div className="bg-white p-3 rounded-full shadow-sm mb-4">
            <AlertTriangle size={48} className="text-amber-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Pagamento in Sospeso
          </h2>
          <p className="text-gray-600 text-sm">
            Hai una prenotazione <strong>{serviceType}</strong> in attesa di pagamento.
            <br />Per proseguire, completa il pagamento o annulla la prenotazione.
          </p>

          {booking.statusReason && (
            <div className="mt-4 p-3 bg-white/50 rounded-lg border border-amber-200 text-black text-xs italic">
              " {booking.statusReason} "
            </div>
          )}
        </div>

        <div className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm text-center">
              {error}
            </div>
          )}

          <div className="space-y-3">
            <button
              onClick={handlePay}
              disabled={isLoading}
              className="w-full bg-blue-600 text-white hover:bg-blue-700 font-semibold py-3 px-6 rounded-xl transition-all shadow-lg shadow-blue-200 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoading ? <Loader2 className="animate-spin" size={20} /> : <CreditCard size={20} />}
              {isLoading ? "Elaborazione..." : `Paga €${formattedAmount}`}
            </button>

            <button
              onClick={handleCancel}
              disabled={isLoading}
              className="w-full border-2 border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-800 font-semibold py-3 px-6 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoading ? <Loader2 className="animate-spin" size={20} /> : <XCircle size={20} />}
              Annulla Prenotazione
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PendingBookingModal;

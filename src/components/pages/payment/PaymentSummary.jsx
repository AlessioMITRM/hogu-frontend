import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    CreditCard, User, MapPin, Mail, FileText, Building2,
    Calendar, Clock, ShieldCheck, ArrowRight, Lock, Info,
    CheckCircle2, Users, Wallet, ChevronRight, Star, Loader2, AlertCircle, Car, Briefcase, Ticket
} from 'lucide-react';
import { Breadcrumbs } from '../../ui/Breadcrumbs.jsx';
import LoadingScreen from '../../ui/LoadingScreen.jsx';
import SuccessModal from '../../ui/SuccessModal.jsx';
import ErrorModal from '../../ui/ErrorModal.jsx';
import { CityAutocomplete } from '../../ui/CityAutocomplete';
import SafeImage from '../../ui/SafeImage.jsx';

import { createLocationPayload, getLocationData, processLocations, getDisplayLocation } from '../../../utils/locationUtils';
import { calculateLuggageTotal } from '../../../utils/pricingUtils';
import { HOGU_COLORS, HOGU_THEME } from '../../../config/theme.js';
import { useTranslation } from 'react-i18next';
import { bookingService, paymentService, authService } from '../../../api/apiClient';
import { withAuthProtection } from '../auth/withAuthProtection.jsx';

const breadcrumbsItems = [
    { labelKey: 'breadcrumbs.home', href: '/' },
    { labelKey: 'breadcrumbs.catalog', href: '/catalog' },
    { labelKey: 'breadcrumbs.checkout', href: '#' }
];

// --- COMPONENTI UI ---
const InputField = ({ labelKey, label, name, type = "text", placeholderKey, placeholder, icon: Icon, value, onChange, required = false, className = "" }) => {
    const { t } = useTranslation();
    return (
        <div className={`flex flex-col gap-2 ${className}`}>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5 ml-1">
                {Icon && <Icon size={14} className="text-[#68B49B]" />}
                {labelKey ? t(labelKey) : label} {required && <span className="text-red-400">*</span>}
            </label>
            <div className="relative group">
                <input
                    type={type}
                    name={name}
                    value={value}
                    onChange={onChange}
                    placeholder={placeholderKey ? t(placeholderKey) : placeholder}
                    required={required}
                    className={`${HOGU_THEME.inputStyle} pl-4 transition-all duration-300 group-hover:border-[#68B49B]/50`}
                />
                <div className="absolute inset-0 rounded-xl pointer-events-none border border-transparent group-hover:border-[#68B49B]/20 transition-all duration-300" />
            </div>
        </div>
    );
};

const PaymentMethodCard = ({ id, title, subtitle, icon, selected, onSelect, badge }) => {
    return (
        <div
            onClick={() => onSelect(id)}
            className={`
        group relative p-5 rounded-2xl border-2 cursor-pointer transition-all duration-300 flex items-start gap-4 overflow-hidden
        ${selected
                    ? 'bg-[#F0FDF9] border-[#68B49B] shadow-lg shadow-[#68B49B]/10 scale-[1.01]'
                    : 'bg-white border-gray-100 hover:border-gray-200 hover:bg-gray-50 hover:shadow-md'
                }
      `}
        >
            {/* Selection Circle */}
            <div className={`absolute top-5 right-5 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300 z-10 ${selected ? 'border-[#68B49B] bg-[#68B49B]' : 'border-gray-200 group-hover:border-gray-300'
                }`}>
                {selected && <CheckCircle2 size={14} className="text-white" />}
            </div>

            {/* Badge (Optional) */}
            {badge && (
                <div className="absolute top-0 right-0 bg-[#68B49B] text-white text-[10px] font-bold px-2 py-1 rounded-bl-xl z-20">
                    {badge}
                </div>
            )}

            {/* Icon Container */}
            <div className={`
            w-14 h-14 rounded-xl flex items-center justify-center text-2xl transition-all duration-300 shrink-0
            ${selected ? 'bg-white text-[#68B49B] shadow-sm rotate-0' : 'bg-gray-100 text-gray-400 group-hover:bg-white group-hover:shadow-sm group-hover:-rotate-6'}
        `}>
                {icon}
            </div>

            {/* Text Content */}
            <div className="flex-1 pr-8">
                <h4 className={`font-bold text-lg mb-1 transition-colors ${selected ? 'text-[#33594C]' : 'text-gray-700'}`}>
                    {title}
                </h4>
                <p className={`text-xs font-medium leading-relaxed transition-colors ${selected ? 'text-[#33594C]/70' : 'text-gray-400'}`}>
                    {subtitle}
                </p>
            </div>
        </div>
    );
};

// --- COMPONENTE PRINCIPALE ---
const PaymentSummaryBase = ({ user }) => {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const location = useLocation();

    const [billingData, setBillingData] = useState({
        nomeFatturazione: user?.name || '',
        cognomeFatturazione: user?.surname || '',
        ragioneSocialeFatturazione: '',
        indirizzoFatturazione: '',
        cittaFatturazione: '',
        capFatturazione: '',
        codiceFiscaleFatturazione: '',
        pivaFatturazione: '',
        emailFatturazione: user?.email || ''
    });

    const [isCorporateBilling, setIsCorporateBilling] = useState(false);

    const [paymentMethod, setPaymentMethod] = useState('credit_card');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showSuccess, setShowSuccess] = useState(false);

    // Recupero dati dallo state della navigazione
    const { state } = location;
    const bookingData = state?.booking || {};
    const serviceData = state?.service || {};

    // --- RICALCOLO PREZZO (SOLO PER LUGGAGE) ---
    // Se siamo in checkout Luggage, ricalcoliamo il totale usando la logica normalizzata
    // per assicurarci che il prezzo visualizzato in riepilogo sia coerente con Listing e Detail.
    let displayPrice = bookingData.total || 0;

    const rawServiceTypeCalc = (serviceData.category || bookingData.serviceType || "").toUpperCase();
    const isLuggage = rawServiceTypeCalc === 'LUGGAGE' || rawServiceTypeCalc === 'DEPOSITO BAGAGLI';

    if (isLuggage && serviceData.sizePrices) {
        // 1. Normalizzazione Size Prices (Stessa logica di ServiceDetailPageLuggage)
        let normalizedSizePrices = serviceData.sizePrices ? [...serviceData.sizePrices] : [];

        if (normalizedSizePrices.length > 0) {
            normalizedSizePrices = normalizedSizePrices.map(sp => {
                const pPerHour = sp.pricePerHour || 0;
                let pPerDay = sp.pricePerDay || 0;

                // FIX: Se il prezzo giornaliero è 0 ma c'è un prezzo orario,
                // impostiamo il giornaliero a (orario * 24) per evitare che il calcolo (Math.min) dia 0.
                if (pPerDay === 0 && pPerHour > 0) {
                    pPerDay = pPerHour * 24;
                }

                // Fallback inverso: se manca orario, usa giornaliero
                const finalHourly = pPerHour > 0 ? pPerHour : pPerDay;

                return {
                    ...sp,
                    size: sp.size || sp.sizeLabel, // Supporto per sizeLabel (da API)
                    pricePerDay: pPerDay,
                    pricePerHour: finalHourly
                };
            });
        } else {
            // Se sizePrices è vuoto, costruiscilo dai prezzi flat
            const base = serviceData.basePrice || 0;
            const pSmall = serviceData.priceSmall || base;
            const pMedium = serviceData.priceMedium || base;
            const pLarge = serviceData.priceLarge || base;

            normalizedSizePrices = [
                { size: 'SMALL', pricePerDay: pSmall, pricePerHour: pSmall },
                { size: 'MEDIUM', pricePerDay: pMedium, pricePerHour: pMedium },
                { size: 'LARGE', pricePerDay: pLarge, pricePerHour: pLarge }
            ];
        }

        // 2. Ricalcolo Totale
        const { total } = calculateLuggageTotal(
            bookingData.dateFrom,
            bookingData.timeFrom,
            bookingData.dateTo,
            bookingData.timeTo,
            {
                small: bookingData.bagsSmall || 0,
                medium: bookingData.bagsMedium || 0,
                large: bookingData.bagsLarge || 0
            },
            normalizedSizePrices
        );

        displayPrice = total;
        // Aggiorniamo anche bookingData.total per coerenza nel payload successivo
        bookingData.total = total;
    }

    useEffect(() => {
        const fetchProfileData = async () => {
            try {
                const profile = await authService.getCustomerProfile();
                const availableLocales = profile.serviceLocales || profile.locales || [];
                const enLocale = availableLocales.find(l => l.language === 'en') || availableLocales[0] || {};

                setBillingData(prev => ({
                    ...prev,
                    nomeFatturazione: profile.name || prev.nomeFatturazione,
                    cognomeFatturazione: profile.surname || prev.cognomeFatturazione,
                    emailFatturazione: profile.email || prev.emailFatturazione,
                    indirizzoFatturazione: enLocale.address || prev.indirizzoFatturazione,
                    cittaFatturazione: getDisplayLocation(enLocale, i18n.language) || prev.cittaFatturazione,
                    capFatturazione: enLocale.postalCode || prev.capFatturazione,
                    codiceFiscaleFatturazione: profile.fiscalCode || profile.taxCode || prev.codiceFiscaleFatturazione
                }));
            } catch (err) {
                console.error("Error fetching profile for billing:", err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchProfileData();
    }, []);

    const formatPrice = (value) => {
        if (value === undefined || value === null) return "0,00";
        const num = typeof value === 'string' ? parseFloat(value.replace(',', '.')) : value;
        return new Intl.NumberFormat('it-IT', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(num);
    };

    // --- DATE & TIME PARSING ---
    const rawDate = bookingData.date;
    const rawTime = bookingData.time;

    // Detect ISO string (usually in time/rawStartTime for Club)
    const isoDateObj = (rawTime && typeof rawTime === 'string' && rawTime.includes('T')) ? new Date(rawTime) :
        (rawDate && typeof rawDate === 'string' && rawDate.includes('T')) ? new Date(rawDate) : null;

    let displayDate = "Data da definire";
    let displayTime = "Orario da definire";

    if (isoDateObj && !isNaN(isoDateObj.getTime())) {
        displayDate = isoDateObj.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' });
        displayTime = isoDateObj.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
    } else {
        // Fallback
        displayDate = rawDate ? (rawDate.includes('-') ? rawDate.split('-').reverse().join('/') : rawDate) : "Data da definire";
        displayTime = rawTime || "Orario da definire";
    }

    // Normalize Data for Display
    const bookingDetails = {
        serviceName: serviceData.title || serviceData.name || "Servizio",
        serviceType: serviceData.category || bookingData.serviceType || "Prenotazione",
        date: displayDate,
        time: displayTime,
        location: serviceData.displayAddress || serviceData.address || "Luogo da definire",
        price: displayPrice,
        image: serviceData.image || ((serviceData.images && serviceData.images.length > 0)
            ? serviceData.images[0]
            : "https://placehold.co/800x600?text=No+Image"),
        guests: bookingData.guests || 1,
        gender: bookingData.gender,
        ticketType: bookingData.type,
        endTime: bookingData.endTime || null,
        // Campi specifici NCC / Altri
        from: (bookingData.fromAddress && bookingData.from && bookingData.fromAddress !== bookingData.from)
            ? `${bookingData.fromAddress}, ${bookingData.from}`
            : (bookingData.fromAddress || bookingData.from || null),
        to: (bookingData.toAddress && bookingData.to && bookingData.toAddress !== bookingData.to)
            ? `${bookingData.toAddress}, ${bookingData.to}`
            : (bookingData.toAddress || bookingData.to || null),
        providerName: serviceData.providerName || null,
        bagsSmall: bookingData.bagsSmall || 0,
        bagsMedium: bookingData.bagsMedium || 0,
        bagsLarge: bookingData.bagsLarge || 0,
        totalBags: bookingData.totalBags || 0,
        duration: bookingData.duration || null
    };

    // Determine API Service Type (Moved to component scope)
    const rawServiceType = (serviceData.category || bookingData.serviceType || "").toUpperCase();
    const typeMap = {
        'RISTORANTE': 'RESTAURANT',
        'RESTAURANT': 'RESTAURANT',
        'BNB': 'BNB',
        'CLUB': 'CLUB',
        'DISCOTECA': 'CLUB',
        'NCC': 'NCC',
        'LUGGAGE': 'LUGGAGE',
        'DEPOSITO BAGAGLI': 'LUGGAGE'
    };
    const apiServiceType = typeMap[rawServiceType] || rawServiceType;

    useEffect(() => {
        if (!state) {
            // Opzionale: redirect se non ci sono dati
            // navigate('/catalog');
        }
    }, [state, navigate]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setBillingData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        // Flag per evitare di nascondere il loader se stiamo reindirizzando
        let isRedirecting = false;

        try {
            // 1. Prepare Data
            // apiServiceType is now calculated at component scope

            const serviceId = serviceData.id || bookingData.serviceId;

            if (!serviceId) {
                throw new Error("ID servizio mancante. Impossibile procedere.");
            }

            const rawCityLabel = (billingData.cittaFatturazione || '').trim();
            const primaryDataset = getLocationData(i18n.language);
            const primaryFlat = processLocations(primaryDataset);
            const fallbackLang = i18n.language && i18n.language.startsWith('it') ? 'en' : 'it';
            const fallbackDataset = getLocationData(fallbackLang);
            const fallbackFlat = processLocations(fallbackDataset);

            const isValidCity =
                rawCityLabel.length > 0 &&
                (
                    primaryFlat.some(loc => loc.fullLabel === rawCityLabel) ||
                    fallbackFlat.some(loc => loc.fullLabel === rawCityLabel)
                );

            if (!isValidCity) {
                setError(t('payment_summary.invalid_city', 'Seleziona una città valida dall\'elenco.'));
                setIsLoading(false);
                return;
            }

            const commonBillingFields = {
                billingFirstName: isCorporateBilling ? "" : billingData.nomeFatturazione,
                // Se è aziendale usiamo la Ragione Sociale come cognome (per salvare il nome azienda)
                // Altrimenti usiamo il cognome normale
                billingLastName: isCorporateBilling
                    ? billingData.ragioneSocialeFatturazione
                    : billingData.cognomeFatturazione,
                billingEmail: billingData.emailFatturazione,
                billingAddress: `${billingData.indirizzoFatturazione}, ${billingData.capFatturazione} ${billingData.cittaFatturazione}`.trim(),
                fiscalCode: isCorporateBilling ? "" : billingData.codiceFiscaleFatturazione,
                taxId: isCorporateBilling ? billingData.pivaFatturazione : ""
            };

            const basePayload = {
                ...bookingData,
                ...commonBillingFields,
                paymentMethod
            };

            // 2. Create Booking (Internal API)
            let bookingResponse;

            let reservationTimeISO = null;
            switch (apiServiceType) {
                case 'RESTAURANT':
                    // Costruzione payload specifico per RestaurantBookingRequestDto
                    // Combina date e time in reservationTime ISO 8601
                    if (bookingData.date && bookingData.time) {
                        // bookingData.date è solitamente YYYY-MM-DD
                        // bookingData.time è HH:mm
                        const dateTimeStr = `${bookingData.date}T${bookingData.time}:00`;
                        reservationTimeISO = new Date(dateTimeStr).toISOString();
                    } else if (bookingData.reservationTime) {
                        reservationTimeISO = bookingData.reservationTime;
                    }

                    const restaurantPayload = {
                        restaurantServiceId: serviceId,
                        reservationTime: reservationTimeISO,
                        numberOfPeople: bookingData.guests,
                        specialRequests: bookingData.specialRequests || "",
                        ...commonBillingFields
                        // Non inviamo 'date', 'time', 'guests' per evitare errori di campo sconosciuto
                    };

                    bookingResponse = await bookingService.createRestaurantBooking(serviceId, restaurantPayload);
                    break;
                case 'BNB':
                    if (!serviceData.bnbServiceId) {
                        alert("Errore: ID Servizio B&B mancante. Per favore torna alla pagina precedente e riprova.");
                        setIsProcessing(false);
                        return;
                    }
                    const bnbPayload = {
                        bnbServiceId: serviceData.bnbServiceId,
                        roomId: serviceId,
                        checkInDate: bookingData.checkIn,
                        checkOutDate: bookingData.checkOut,
                        numberOfGuests: bookingData.guests,
                        ...commonBillingFields
                    };
                    bookingResponse = await bookingService.createBnbBooking(user?.id, bnbPayload);
                    break;
                case 'CLUB':
                    const clubPayload = {
                        eventId: serviceId,
                        clubServiceId: serviceData.clubServiceId,
                        reservationTime: serviceData.rawStartTime ? new Date(serviceData.rawStartTime).toISOString() : new Date().toISOString(),
                        numberOfPeople: bookingData.guests,
                        billingFirstName: billingData.nomeFatturazione,
                        billingLastName: billingData.cognomeFatturazione,
                        locale: createLocationPayload(serviceData.city || "", serviceData.address || "", "CLUB")[0],
                        fiscalCode: billingData.codiceFiscaleFatturazione,
                        taxId: billingData.pivaFatturazione,
                        pricingConfiguration: bookingData.pricingConfiguration,
                        specialRequests: bookingData.specialRequests || "Nessuna richiesta"
                    };
                    bookingResponse = await bookingService.createClubBooking(serviceId, clubPayload);
                    break;
                case 'NCC':
                    const nccPayload = {
                        nccServiceId: serviceId,
                        pickupLocation: bookingData.fromAddress ? `${bookingData.fromAddress}, ${bookingData.from}` : bookingData.from,
                        destination: bookingData.toAddress ? `${bookingData.toAddress}, ${bookingData.to}` : bookingData.to,
                        pickupTime: new Date(`${bookingData.date}T${bookingData.time}:00`).toISOString(),
                        totalAmount: bookingData.total,
                        pickupLatitude: bookingData.fromCoordinates?.lat ?? null,
                        pickupLongitude: bookingData.fromCoordinates?.lon ?? null,
                        destinationLatitude: bookingData.toCoordinates?.lat ?? null,
                        destinationLongitude: bookingData.toCoordinates?.lon ?? null,
                        passengers: bookingData.guests,
                        billingFirstName: billingData.nomeFatturazione,
                        billingLastName: billingData.cognomeFatturazione,
                        billingEmail: billingData.emailFatturazione,
                        billingAddress: `${billingData.indirizzoFatturazione} ${billingData.capFatturazione}`.trim(),
                        fiscalCode: billingData.codiceFiscaleFatturazione,
                        taxId: billingData.pivaFatturazione
                    };
                    bookingResponse = await bookingService.createNccBooking(serviceId, nccPayload);
                    break;
                case 'LUGGAGE':
                    const luggagePayload = {
                        luggageServiceId: serviceId,
                        dropOffTime: new Date(`${bookingData.dateFrom}T${bookingData.timeFrom}:00`).toISOString(),
                        pickUpTime: new Date(`${bookingData.dateTo}T${bookingData.timeTo}:00`).toISOString(),
                        bagsSmall: bookingData.bagsSmall || 0,
                        bagsMedium: bookingData.bagsMedium || 0,
                        bagsLarge: bookingData.bagsLarge || 0,
                        specialRequests: bookingData.specialRequests || "",
                        totalAmount: bookingData.total,
                        billingFirstName: billingData.nomeFatturazione,
                        billingLastName: billingData.cognomeFatturazione,
                        billingEmail: billingData.emailFatturazione,
                        billingAddress: `${billingData.indirizzoFatturazione} ${billingData.capFatturazione}`.trim(),
                        fiscalCode: billingData.codiceFiscaleFatturazione,
                        taxId: billingData.pivaFatturazione
                    };
                    bookingResponse = await bookingService.createLuggageBooking(serviceId, luggagePayload);
                    console.log("Luggage Booking Response:", bookingResponse);
                    break;
                default:
                    throw new Error(`Tipo servizio non supportato per la prenotazione: ${apiServiceType}`);
            }

            const bookingId = bookingResponse?.id || bookingResponse?._id;

            if (!bookingId) {
                console.error("Booking creation failed - No ID returned", bookingResponse);
                throw new Error("Errore nella creazione della prenotazione: ID mancante nella risposta del server.");
            }

            // Se è Ristorante, salta il pagamento e vai direttamente al successo
            if (apiServiceType === 'RESTAURANT') {
                const successState = {
                    booking: {
                        id: bookingId,
                        serviceName: bookingDetails.serviceName,
                        date: reservationTimeISO || bookingDetails.date || new Date().toISOString(),
                        providerName: bookingDetails.providerName,
                        bookingStatus: bookingResponse.status || 'PENDING'
                    },
                    payment: { status: 'NOT_REQUIRED', amount: 0 }
                };
                navigate('/payment/success', { state: successState });
                return;
            }

            // 3. Process Payment
            if (paymentMethod === 'paypal') {
                const paymentPayload = {
                    bookingId,
                    serviceType: apiServiceType,
                    amount: bookingDetails.price,
                    currency: 'EUR',
                    returnUrl: `${window.location.origin}/payment/callback?bookingId=${bookingId}&method=paypal`,
                    cancelUrl: `${window.location.origin}/payment/cancel?bookingId=${bookingId}&amount=${bookingDetails.price}&serviceType=${apiServiceType}&method=paypal`
                };

                const paypalResponse = await paymentService.startPayPalPayment(paymentPayload);
                console.log("PayPal Response:", paypalResponse);

                // Gestione Redirect PayPal
                const approvalUrl = paypalResponse.approvalUrl ||
                    (paypalResponse.links && paypalResponse.links.find(l => l.rel === 'approve' || l.rel === 'approval_url')?.href);

                if (approvalUrl) {
                    isRedirecting = true;

                    window.location.href = approvalUrl;
                } else {
                    throw new Error("Impossibile ottenere il link di pagamento PayPal.");
                }

            } else if (paymentMethod === 'credit_card') {
                // Stripe Flow - Allineato con StripePaymentRequestDto del backend
                const stripePayload = {
                    bookingId,
                    userId: user?.id,
                    amount: bookingDetails.price,
                    currency: 'EUR',
                    serviceType: apiServiceType,
                    customerEmail: billingData.emailFatturazione || user?.email,
                    paymentIdMethod: "pm_card_visa", // ID fittizio per test (in produzione si usa Stripe Elements)
                    description: `Pagamento per ${bookingDetails.serviceName}`,
                    returnUrl: `${window.location.origin}/payment/success`,
                    cancelUrl: `${window.location.origin}/payment/cancel?bookingId=${bookingId}&amount=${bookingDetails.price}&serviceType=${apiServiceType}&method=stripe`
                };

                const stripeResponse = await paymentService.processStripePayment(stripePayload);

                // Se Stripe richiede un'azione (es. 3DS) o un redirect (Stripe Checkout)
                if (stripeResponse.approvalUrl) {
                    isRedirecting = true;
                    window.location.href = stripeResponse.approvalUrl;
                } else {
                    // Successo diretto
                    navigate('/payment/success', { state: { booking: bookingResponse, payment: stripeResponse } });
                }
            }

        } catch (err) {
            console.error("Payment Process Error:", err);
            setError(err.response?.data?.message || err.message || "Si è verificato un errore durante il processo di pagamento.");
        } finally {
            if (!isRedirecting) {
                setIsLoading(false);
            }
        }
    };

    return (
        <div className={`min-h-screen bg-[#F8FAFC] pb-24 ${HOGU_THEME.fontFamily}`}>
            <LoadingScreen isLoading={isLoading} />
            {error && <ErrorModal message={error} onClose={() => setError(null)} />}
            <SuccessModal
                isOpen={showSuccess}
                onClose={() => setShowSuccess(false)}
                title={t('payment_summary.success_title', 'Pagamento Completato')}
                message={t('payment_summary.success_message', 'Il tuo pagamento è stato elaborato con successo.')}
                confirmText={t('common.close', 'Chiudi')}
            />

            {/* Header Minimal */}
            <div className="bg-white pt-8 pb-12 px-4 lg:px-8 border-b border-gray-100">
                <div className="max-w-7xl mx-auto">
                    <Breadcrumbs items={breadcrumbsItems.map(item => ({ ...item, label: t(item.labelKey) }))} />
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mt-6">
                        <div>
                            <h1 className="text-3xl md:text-4xl font-extrabold text-[#1A202C] tracking-tight">
                                {t('payment_summary.summary')} <span className="text-[#68B49B]">{t('payment_summary.booking')}</span>
                            </h1>
                            <p className="text-slate-500 mt-2 flex items-center gap-2 font-medium">
                                <Lock size={16} className="text-[#68B49B]" /> {t('payment_summary.secure_checkout')}
                            </p>
                        </div>
                        {/* Steps indicator (visual only) */}
                        <div className="flex items-center gap-2 text-sm font-bold text-gray-300 hidden md:flex">
                            <span className="text-[#68B49B]">1. Dettagli</span>
                            <ChevronRight size={16} />
                            <span className="text-[#68B49B]">2. Pagamento</span>
                            <ChevronRight size={16} />
                            <span className="text-gray-800">3. Conferma</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 lg:px-8 mt-8 relative z-20">
                <form onSubmit={handleSubmit} className="flex flex-col lg:flex-row gap-8 lg:gap-12">

                    {/* Colonna sinistra: Form e Pagamento */}
                    <div className="flex-1 flex flex-col gap-8">

                        {/* Sezione Dati Fatturazione */}
                        <div className={`bg-white rounded-[2rem] p-6 md:p-8 ${HOGU_THEME.shadowFloat} border border-gray-100/50`}>
                            <div className="flex items-center gap-4 mb-8">
                                <div className="w-10 h-10 rounded-xl bg-[#F0FDF9] text-[#68B49B] flex items-center justify-center font-bold text-lg shadow-sm">1</div>
                                <div>
                                    <h3 className="text-xl font-bold text-gray-800">{t('payment_summary.billing_data')}</h3>
                                    <p className="text-xs text-gray-400">Inserisci i dati per la fattura</p>
                                </div>
                            </div>

                            <div className="md:col-span-2 flex items-center justify-between py-2 border-b border-gray-100 mb-6 pb-4">
                                <div className="flex flex-col">
                                    <span className="text-sm font-bold text-gray-800">{t('payment_summary.corporate_billing', 'Fatturazione Aziendale')}</span>
                                    <span className="text-xs text-gray-400">Richiedi fattura per azienda o partita IVA</span>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="sr-only peer"
                                        checked={isCorporateBilling}
                                        onChange={(e) => setIsCorporateBilling(e.target.checked)}
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#68B49B]"></div>
                                </label>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {!isCorporateBilling && (
                                    <>
                                        <InputField labelKey="payment_summary.first_name" name="nomeFatturazione" required icon={User} value={billingData.nomeFatturazione} onChange={handleInputChange} placeholderKey="payment_summary.first_name_placeholder" />
                                        <InputField labelKey="payment_summary.last_name" name="cognomeFatturazione" required icon={User} value={billingData.cognomeFatturazione} onChange={handleInputChange} placeholderKey="payment_summary.last_name_placeholder" />
                                    </>
                                )}

                                {isCorporateBilling && (
                                    <>
                                        <InputField labelKey="payment_summary.company_name" name="ragioneSocialeFatturazione" required icon={Building2} className="md:col-span-2" value={billingData.ragioneSocialeFatturazione} onChange={handleInputChange} placeholderKey="payment_summary.company_name_placeholder" />
                                        <InputField labelKey="payment_summary.vat" name="pivaFatturazione" required icon={Building2} value={billingData.pivaFatturazione} onChange={handleInputChange} placeholderKey="payment_summary.vat_placeholder" />
                                    </>
                                )}

                                <InputField labelKey="payment_summary.email" name="emailFatturazione" type="email" required icon={Mail} value={billingData.emailFatturazione} onChange={handleInputChange} className={isCorporateBilling ? "" : "md:col-span-2"} placeholderKey="payment_summary.email_placeholder" />

                                <div className="flex flex-col gap-2">
                                    <CityAutocomplete
                                        label={t('payment_summary.city', 'Città')}
                                        value={billingData.cittaFatturazione}
                                        onChange={(val) => setBillingData(prev => ({ ...prev, cittaFatturazione: val }))}
                                        icon={MapPin}
                                        placeholder={t('payment_summary.city_placeholder', 'Cerca città...')}
                                    />
                                </div>

                                <InputField labelKey="payment_summary.address" name="indirizzoFatturazione" required icon={MapPin} value={billingData.indirizzoFatturazione} onChange={handleInputChange} placeholderKey="payment_summary.address_placeholder" />
                                <InputField label="CAP" name="capFatturazione" required icon={MapPin} value={billingData.capFatturazione} onChange={handleInputChange} placeholder="CAP" />


                            </div>
                        </div>

                        {/* Sezione Metodo di Pagamento - Nascosta per Ristoranti */}
                        {apiServiceType !== 'RESTAURANT' && (
                            <div className={`bg-white rounded-[2rem] p-6 md:p-8 ${HOGU_THEME.shadowFloat} border border-gray-100/50`}>
                                <div className="flex items-center gap-4 mb-8">
                                    <div className="w-10 h-10 rounded-xl bg-[#F0FDF9] text-[#68B49B] flex items-center justify-center font-bold text-lg shadow-sm">2</div>
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-800">{t('payment_summary.payment_method')}</h3>
                                        <p className="text-xs text-gray-400">Scegli come vuoi pagare</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-4">
                                    {/* Carta di Credito (Powered by Stripe) */}
                                    <PaymentMethodCard
                                        id="credit_card"
                                        title={t('payment_summary.credit_card')}
                                        subtitle={
                                            <span className="flex flex-col gap-1">
                                                <span>Visa, Mastercard, American Express.</span>
                                                <span className="text-[10px] font-bold text-[#635BFF] flex items-center gap-1">
                                                    Powered by <span className="font-extrabold text-sm">stripe</span>
                                                </span>
                                            </span>
                                        }
                                        icon={<CreditCard size={28} />}
                                        selected={paymentMethod === 'credit_card'}
                                        onSelect={setPaymentMethod}
                                        badge="Consigliato"
                                    />

                                    {/* PayPal */}
                                    <PaymentMethodCard
                                        id="paypal"
                                        title="PayPal"
                                        subtitle="Usa il tuo saldo PayPal o collega un conto."
                                        icon={<span className="font-bold italic text-[#003087] text-lg">Pay<span className="text-[#009cde]">Pal</span></span>}
                                        selected={paymentMethod === 'paypal'}
                                        onSelect={setPaymentMethod}
                                    />
                                </div>

                                <div className="mt-8 p-5 bg-blue-50/50 rounded-2xl border border-blue-100 flex gap-4 items-start">
                                    <div className="bg-blue-100 p-2 rounded-full text-blue-600 shrink-0">
                                        <ShieldCheck size={20} />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold text-blue-800 mb-1">Garanzia di Sicurezza HOGU</h4>
                                        <p className="text-xs text-blue-600/80 leading-relaxed">{t('payment_summary.payment_info')}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Pulsante Conferma Mobile (visibile solo su mobile) */}
                        <div className="lg:hidden pb-8">
                            <button
                                type="submit"
                                disabled={isLoading}
                                className={`w-full py-4 rounded-xl font-bold text-white shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95 ${HOGU_THEME.primary} ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 size={20} className="animate-spin" /> Elaborazione...
                                    </>
                                ) : (
                                    <>
                                        {(bookingDetails.serviceType === 'RESTAURANT' || bookingDetails.serviceType === 'Ristorante') ? "Conferma Prenotazione" : t('payment_summary.confirm_pay')}
                                        {(bookingDetails.serviceType !== 'RESTAURANT' && bookingDetails.serviceType !== 'Ristorante') && ` € ${formatPrice(bookingDetails.price)}`}
                                        <ArrowRight size={20} />
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Colonna destra: Summary Card (Ticket Style) */}
                    <div className="lg:w-[420px] flex-shrink-0">
                        <div className={`sticky top-28`}>
                            <div className={`bg-white rounded-[2.5rem] overflow-hidden ${HOGU_THEME.shadowFloat} border border-gray-100 relative`}>

                                {/* Image Header */}
                                <div className="h-56 relative overflow-hidden bg-gray-100 group">
                                    <div className="absolute top-4 left-4 z-10 flex gap-2">
                                        <span className="bg-white/95 backdrop-blur px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider shadow-sm text-[#68B49B] flex items-center gap-1">
                                            <Star size={10} fill="currentColor" /> {bookingDetails.serviceType}
                                        </span>
                                    </div>
                                    <SafeImage
                                        src={bookingDetails.image}
                                        alt={bookingDetails.serviceName}
                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                                    <div className="absolute bottom-6 left-6 right-6 text-white">
                                        <h3 className="font-bold text-2xl leading-tight text-shadow-sm mb-1">{bookingDetails.serviceName}</h3>
                                        <div className="flex items-center gap-1 text-white/80 text-sm">
                                            <MapPin size={14} />
                                            <span className="line-clamp-1">{bookingDetails.location}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Ticket Cut Effect */}
                                <div className="relative h-6 bg-white -mt-3 z-10">
                                    <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-[#F8FAFC] rounded-full" />
                                    <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-[#F8FAFC] rounded-full" />
                                    <div className="absolute left-4 right-4 top-1/2 border-t-2 border-dashed border-gray-200" />
                                </div>

                                {/* Details Body */}
                                <div className="px-8 pb-8 pt-2 space-y-6">

                                    {/* Info Grid */}
                                    <div className="space-y-5">
                                        <div className="flex items-center justify-between group">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-orange-50 text-orange-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                                                    <Calendar size={18} />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{t('payment_summary.date')}</p>
                                                    <p className="font-bold text-gray-800">{bookingDetails.date}</p>
                                                </div>
                                            </div>
                                        </div>

                                        {bookingDetails.serviceType !== 'BNB' && (
                                            <div className="flex items-center justify-between group">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                                                        <Clock size={18} />
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{t('payment_summary.time')}</p>
                                                        <p className="font-bold text-gray-800">
                                                            {bookingDetails.time}
                                                            {bookingDetails.endTime && <span className="text-gray-400 font-normal"> - {bookingDetails.endTime}</span>}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* LOGICA SPECIFICA PER NCC */}
                                        {bookingDetails.serviceType === 'NCC' ? (
                                            <>
                                                {/* Partenza */}
                                                <div className="flex items-center justify-between group">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-full bg-green-50 text-green-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                                                            <MapPin size={18} />
                                                        </div>
                                                        <div>
                                                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Partenza</p>
                                                            <p className="font-bold text-gray-800 text-sm" title={bookingDetails.from}>
                                                                {bookingDetails.from || "Indirizzo non disp."}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Arrivo */}
                                                <div className="flex items-center justify-between group">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-full bg-red-50 text-red-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                                                            <MapPin size={18} />
                                                        </div>
                                                        <div>
                                                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Arrivo</p>
                                                            <p className="font-bold text-gray-800 text-sm" title={bookingDetails.to}>
                                                                {bookingDetails.to || "Destinazione non disp."}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Passeggeri (invece di Guests generico) */}
                                                <div className="flex items-center justify-between group">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-full bg-purple-50 text-purple-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                                                            <Users size={18} />
                                                        </div>
                                                        <div>
                                                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Passeggeri</p>
                                                            <p className="font-bold text-gray-800">{bookingDetails.guests} Persone</p>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Compagnia */}
                                                {bookingDetails.providerName && (
                                                    <div className="flex items-center justify-between group">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-full bg-gray-50 text-gray-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                                                                <Car size={18} />
                                                            </div>
                                                            <div>
                                                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Compagnia</p>
                                                                <p className="font-bold text-gray-800">{bookingDetails.providerName}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </>
                                        ) : (bookingDetails.serviceType === 'LUGGAGE' || bookingDetails.serviceType === 'DEPOSITO BAGAGLI') ? (
                                            <>
                                                {/* Bagagli */}
                                                <div className="flex items-center justify-between group">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-full bg-purple-50 text-purple-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                                                            <Briefcase size={18} />
                                                        </div>
                                                        <div>
                                                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Bagagli</p>
                                                            <div className="flex flex-col">
                                                                <span className="font-bold text-gray-800">{bookingDetails.totalBags} Totali</span>
                                                                <span className="text-[10px] text-gray-500">
                                                                    {[
                                                                        bookingDetails.bagsSmall > 0 && `${bookingDetails.bagsSmall} Small`,
                                                                        bookingDetails.bagsMedium > 0 && `${bookingDetails.bagsMedium} Med`,
                                                                        bookingDetails.bagsLarge > 0 && `${bookingDetails.bagsLarge} Large`
                                                                    ].filter(Boolean).join(' • ')}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Durata Deposito */}
                                                {bookingDetails.duration && (
                                                    <div className="flex items-center justify-between group">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-full bg-orange-50 text-orange-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                                                                <Clock size={18} />
                                                            </div>
                                                            <div>
                                                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Durata</p>
                                                                <div className="flex flex-col">
                                                                    <span className="font-bold text-gray-800">
                                                                        {bookingDetails.duration.days > 0 && `${bookingDetails.duration.days}g `}
                                                                        {bookingDetails.duration.hours > 0 && `${bookingDetails.duration.hours}h`}
                                                                        {bookingDetails.duration.days === 0 && bookingDetails.duration.hours === 0 && 'N/A'}
                                                                    </span>
                                                                    <span className="text-[10px] text-gray-500">
                                                                        Tariffa mista: Giornaliera + Oraria
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Fornitore */}
                                                <div className="flex items-center justify-between group">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                                                            <Building2 size={18} />
                                                        </div>
                                                        <div>
                                                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Fornitore</p>
                                                            <p className="font-bold text-gray-800">{bookingDetails.serviceName}</p>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Indirizzo */}
                                                <div className="flex items-center justify-between group">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-full bg-green-50 text-green-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                                                            <MapPin size={18} />
                                                        </div>
                                                        <div>
                                                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Indirizzo</p>
                                                            <p className="font-bold text-gray-800 text-sm leading-tight">{bookingDetails.location}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </>
                                        ) : (bookingDetails.serviceType === 'CLUB' || bookingDetails.serviceType === 'Club') ? (
                                            <>
                                                <div className="flex items-center justify-between group">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-full bg-purple-50 text-purple-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                                                            <Ticket size={18} />
                                                        </div>
                                                        <div>
                                                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Tipo Ingresso</p>
                                                            <p className="font-bold text-gray-800">
                                                                {bookingDetails.ticketType === 'table' ? 'Tavolo Riservato' : 'Lista Ingresso'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center justify-between group">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-full bg-purple-50 text-purple-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                                                            <Users size={18} />
                                                        </div>
                                                        <div>
                                                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{t('payment_summary.guests')}</p>
                                                            <p className="font-bold text-gray-800">
                                                                {bookingDetails.guests} {t('payment_summary.people')}
                                                                {bookingDetails.gender && (
                                                                    <span className="text-gray-500 font-normal ml-1">
                                                                        ({bookingDetails.gender === 'MALE' ? 'Uomo' : (bookingDetails.gender === 'FEMALE' ? 'Donna' : bookingDetails.gender)})
                                                                    </span>
                                                                )}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center justify-between group">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                                                            <Clock size={18} />
                                                        </div>
                                                        <div>
                                                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Inizio Evento</p>
                                                            <p className="font-bold text-gray-800">{bookingDetails.time}</p>
                                                        </div>
                                                    </div>
                                                </div>

                                                {bookingDetails.endTime && (
                                                    <div className="flex items-center justify-between group">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-full bg-orange-50 text-orange-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                                                                <Clock size={18} />
                                                            </div>
                                                            <div>
                                                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Fine Evento</p>
                                                                <p className="font-bold text-gray-800">{bookingDetails.endTime}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </>
                                        ) : (
                                            /* DEFAULT per altri servizi (Ristoranti, BNB, ecc.) */
                                            <div className="flex items-center justify-between group">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-purple-50 text-purple-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                                                        <Users size={18} />
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{t('payment_summary.guests')}</p>
                                                        <p className="font-bold text-gray-800">{bookingDetails.guests} {t('payment_summary.people')}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Divider */}
                                    <div className="border-t border-gray-100" />

                                    {/* Price */}
                                    {(bookingDetails.serviceType !== 'RESTAURANT' && bookingDetails.serviceType !== 'Ristorante') && (
                                        <div className="bg-gray-50 rounded-2xl p-4 flex justify-between items-center border border-gray-100">
                                            <div>
                                                <p className="text-xs text-gray-500 font-medium">{t('payment_summary.total_amount')}</p>
                                                <p className="text-[10px] text-[#68B49B] font-bold">{t('payment_summary.taxes_included')}</p>
                                            </div>
                                            <div className="text-2xl font-extrabold text-[#1A202C]">
                                                € {formatPrice(bookingDetails.price)}
                                            </div>
                                        </div>
                                    )}

                                    {/* Button Desktop */}
                                    <div className="hidden lg:block">
                                        <button
                                            type="submit"
                                            disabled={isLoading}
                                            className={`w-full py-4 rounded-xl font-bold text-white shadow-lg flex items-center justify-center gap-2 transition-all hover:shadow-xl active:scale-95 group ${HOGU_THEME.primary} ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
                                        >
                                            {isLoading ? (
                                                <>
                                                    <Loader2 size={20} className="animate-spin" /> Elaborazione...
                                                </>
                                            ) : (
                                                <>
                                                    {(bookingDetails.serviceType === 'RESTAURANT' || bookingDetails.serviceType === 'Ristorante') ? "Conferma Prenotazione" : t('payment_summary.confirm_pay')} <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                                                </>
                                            )}
                                        </button>
                                        <p className="text-center text-[10px] text-gray-400 mt-3 flex items-center justify-center gap-1">
                                            <Lock size={10} /> {t('payment_summary.secure_transaction')}
                                        </p>
                                    </div>

                                </div>
                            </div>

                            {/* Trust Badges */}
                            <div className="mt-6 flex justify-center gap-4 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
                                {/* Placeholder for card logos if you have them as images, otherwise icons */}
                                <div className="flex gap-2">
                                    <div className="w-10 h-6 bg-gray-200 rounded flex items-center justify-center text-[8px] font-bold">VISA</div>
                                    <div className="w-10 h-6 bg-gray-200 rounded flex items-center justify-center text-[8px] font-bold">MC</div>
                                    <div className="w-10 h-6 bg-gray-200 rounded flex items-center justify-center text-[8px] font-bold">AMEX</div>
                                </div>
                            </div>
                        </div>
                    </div>

                </form>
            </div>
        </div>
    );
};

const PaymentSummary = withAuthProtection(PaymentSummaryBase, ['CUSTOMER'], null, '/booking-auth-required');

export default PaymentSummary;

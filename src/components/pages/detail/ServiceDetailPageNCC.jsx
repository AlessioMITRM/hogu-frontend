import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { HOGU_THEME } from "../../../config/theme.js";

import { nccService } from '../../../api/apiClient.js';
import { getServiceLocalization } from '../../../utils/dateUtils.js';
import { createLocationPayload } from "../../../utils/locationUtils.js";

import { LiveViewersFloatingBadge } from '../../../components/ui/LiveViewersBadge.jsx';

import { Breadcrumbs } from "../../ui/Breadcrumbs.jsx";
import { Tag } from "../../ui/Tag.jsx";
import { ServiceHeaderDetail } from "../../ui/ServiceHeaderDetail.jsx";
import { ServiceImageGallery } from "../../ui/ServiceImageGallery.jsx";

import { RideSummaryNCC } from "../../../components/pages/detail/RideSummaryNCC.jsx";
import { RouteMapNCC } from "../../../components/pages/detail/RouteMapNCC.jsx";
import { ProviderInfoCard } from "../../../components/pages/detail/ProviderInfoCard.jsx";
import LoadingScreen from '../../ui/LoadingScreen.jsx';
import ErrorModal from '../../ui/ErrorModal.jsx';
import ServiceUnavailablePage from '../ServiceUnavailablePage.jsx';

// ------------------------------------
// PAGINA DETTAGLIO SERVIZIO NCC
// ------------------------------------
export const ServiceDetailPageNCC = ({
    id,
    searchParams: propSearchParams,
    images: propImages = [],
    setPage
}) => {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();

    // Helper per tradurre nomi di città e regioni comuni dai parametri di ricerca
    const formatLocation = (val) => {
        if (!val) return val;
        return val.split(',').map(part => {
            const trimmed = part.trim();
            const key = `cities.${trimmed.toLowerCase()}`;
            const translated = t(key);
            return translated === key ? trimmed : translated;
        }).join(', ');
    };

    // Legge i searchParams sincronicamente per evitare flash/doppio render
    const [searchParams] = useState(() => {
        if (propSearchParams) return propSearchParams;
        try {
            const stored = sessionStorage.getItem('nccSearchParams');
            return stored ? JSON.parse(stored) : null;
        } catch (err) {
            console.error('Errore parsing nccSearchParams:', err);
            return null;
        }
    });

    // State per i dati del servizio provenienti dall'API
    const [serviceData, setServiceData] = useState(null);
    const [isLoadingService, setIsLoadingService] = useState(true);
    const [error, setError] = useState(null);

    // STATE PER LA PRENOTAZIONE
    const [isBooking, setIsBooking] = useState(false);
    const [bookingError, setBookingError] = useState(null);

    // Recupera i dettagli del servizio via API (searchParams già disponibili al primo render)
    useEffect(() => {
        const fetchServiceDetail = async () => {
            if (!id || !searchParams) return;

            setIsLoadingService(true);
            try {
                const currentParams = searchParams;

                // Helper per estrarre la città pulita
                const getCity = (cityParam, compositeParam) => {
                    if (cityParam) return cityParam;
                    if (!compositeParam) return "";
                    const parts = compositeParam.split(',');
                    return parts[0].trim();
                };

                const fromCity = getCity(currentParams.fromCity, currentParams.from);
                const toCity = getCity(currentParams.toCity, currentParams.to);

                const fromPayload = createLocationPayload(
                    fromCity,
                    currentParams.fromAddress || fromCity,
                    "NCC"
                )[0];

                const toPayload = createLocationPayload(
                    toCity,
                    currentParams.toAddress || toCity,
                    "NCC"
                )[0];

                // Formattazione data dd/MM/yyyy per il backend
                let formattedDate = currentParams.date || currentParams.dateFrom;
                if (formattedDate && formattedDate.includes('-')) {
                    const [year, month, day] = formattedDate.split('-');
                    formattedDate = `${day}/${month}/${year}`;
                }

                const data = await nccService.getNccDetail(
                    id,
                    formattedDate,
                    currentParams.time || currentParams.timeFrom,
                    currentParams.passengers || currentParams.totalPersons || 1,
                    fromPayload.address,
                    fromPayload.city,
                    fromPayload.province,
                    fromPayload.country,
                    toPayload.address,
                    toPayload.city,
                    toPayload.province,
                    toPayload.country,
                    currentParams.tripType || "oneway"
                );
                setServiceData(data);
            } catch (err) {
                console.error("Errore nel recupero del servizio NCC:", err);
                setError(err);
            } finally {
                setIsLoadingService(false);
            }
        };

        fetchServiceDetail();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    // ------------------------------------
    // LOGICA DI CONFERMA PRENOTAZIONE
    // ------------------------------------
    const handleConfirmBooking = async () => {
        setIsBooking(true); // Attiva LoadingScreen
        setBookingError(null);

        try {
            // Simuliamo un breve caricamento prima del redirect
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Costruzione oggetto dati per PaymentSummary
            const bookingState = {
                booking: {
                    serviceType: "NCC",
                    serviceId: serviceData.id,
                    date: searchParams.date,
                    time: searchParams.time,
                    guests: searchParams.passengers,
                    total: serviceData.estimatedPrice || 0,
                    from: searchParams.from || searchParams.fromCity,
                    fromAddress: searchParams.fromAddress,
                    to: searchParams.to || searchParams.toCity,
                    toAddress: searchParams.toAddress,
                    tripType: searchParams.tripType,
                    fromCoordinates: bookingCoordinates?.from || null,
                    toCoordinates: bookingCoordinates?.to || null
                },
                service: {
                    id: serviceData.id,
                    name: serviceData.name,
                    category: "NCC",
                    address: providerData.location,
                    images: providerData.images,
                    providerName: providerData.providerName
                }
            };

            // Reindirizzamento alla pagina di riepilogo pagamento
            navigate('/payment/summary', { state: bookingState });

        } catch (err) {
            console.error("Errore pre-prenotazione:", err);
            // Attiva ErrorModal
            setBookingError({
                message: t('ncc_detail.error_payment'),
                details: err.message || t('ncc_detail.error_unknown')
            });
        } finally {
            setIsBooking(false); // Disattiva LoadingScreen
        }
    };

    const breadcrumbsItems = [
        { label: t('breadcrumbs.home'), href: "/" },
        { label: t('breadcrumbs.ncc'), href: "/service/ncc" },
        { label: t('ncc_detail.breadcrumb_detail') }
    ];

    // Mappatura Dati API -> UI (Provider Info)
    const providerData = useMemo(() => {
        if (!serviceData) return null;

        const { displayLocale } = getServiceLocalization(serviceData.locales || serviceData.serviceLocale, i18n.language);
        const locationStr = displayLocale.city || displayLocale.name || (serviceData.locales && serviceData.locales[0] && (serviceData.locales[0].city || serviceData.locales[0].name)) || t('ncc_detail.location_not_available');

        return {
            providerName: serviceData.name,
            logoUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(serviceData.name)}&background=0D1F2D&color=fff&size=128`,
            rating: serviceData.averageRating || 0,
            reviews: 0,
            location: locationStr,
            description: displayLocale.description || serviceData.description || t('ncc_detail.no_description'),
            images: (serviceData.images && serviceData.images.length > 0)
                ? serviceData.images.map(filename => `/files/ncc/${serviceData.id}/${filename}`)
                : propImages
        };
    }, [serviceData, propImages]);

    // Estrazione coordinate A/B dal payload API
    // NOTA: Usiamo SOLO i dati dal backend (serviceData) per garantire coerenza con il calcolo del prezzo e la dashboard.
    // Non facciamo fallback su searchParams perché spesso contengono coordinate approssimative o errate (es. centro città invece dell'indirizzo specifico).
    const bookingCoordinates = useMemo(() => {
        const toNumber = (v) => {
            const n = typeof v === 'string' ? parseFloat(v) : v;
            return typeof n === 'number' && !Number.isNaN(n) ? n : null;
        };

        const normalizeCoordObj = (obj) => {
            if (!obj) return null;
            const lat = toNumber(obj.lat ?? obj.latitude);
            const lon = toNumber(obj.lon ?? obj.lng ?? obj.longitude);
            if (lat != null && lon != null) return { lat, lon };
            return null;
        };

        // 1. Prova da serviceData (Payload backend)
        if (serviceData) {
            const from = normalizeCoordObj(serviceData.pickupCoordinates)
                || (() => {
                    const lat = toNumber(serviceData.pickupLatitude);
                    const lon = toNumber(serviceData.pickupLongitude);
                    return (lat != null && lon != null) ? { lat, lon } : null;
                })();

            const to = normalizeCoordObj(serviceData.destinationCoordinates)
                || (() => {
                    const lat = toNumber(serviceData.destinationLatitude);
                    const lon = toNumber(serviceData.destinationLongitude);
                    return (lat != null && lon != null) ? { lat, lon } : null;
                })();

            if (from || to) return { from, to };
        }

        return null;
    }, [serviceData]);

    // Durante il caricamento iniziale mostra il LoadingScreen fullscreen
    // così non si vede mai il corpo vuoto della pagina
    if (!searchParams || isLoadingService) {
        return <LoadingScreen isLoading={true} />;
    }

    if (serviceData?.available === false) {
        return <ServiceUnavailablePage />;
    }

    // Gestione errore API iniziale
    if (error || !providerData) {
        return (
            <div className={`max-w-7xl mx-auto p-4 lg:p-8 ${HOGU_THEME.fontFamily}`}>
                <p className="text-red-500">{t('ncc_detail.error_load')}</p>
            </div>
        );
    }

    return (
        <div className={`max-w-7xl mx-auto p-4 lg:p-8 ${HOGU_THEME.fontFamily} relative`}>

            {/* -------------------------------- */}
            {/* COMPONENTI GLOBALI UI */}
            {/* -------------------------------- */}

            {/* 1. Loading Screen (Mostrato solo durante la conferma prenotazione) */}
            <LoadingScreen isLoading={isBooking} />

            {/* 2. Error Modal (Mostrato se la prenotazione fallisce) */}
            {bookingError && (
                <ErrorModal
                    message={bookingError.message}
                    details={bookingError.details}
                    onClose={() => setBookingError(null)}
                />
            )}

            {/* -------------------------------- */}
            {/* HEADER */}
            {/* -------------------------------- */}
            <Breadcrumbs items={breadcrumbsItems} />

            <ServiceHeaderDetail
                title={serviceData.name}
                tags={<Tag>{t('ncc_detail.tag_premium')}</Tag>}
                className="mb-6"
            />

            {/* -------------------------------- */}
            {/* SEZIONE MAPPA PRINCIPALE */}
            {/* -------------------------------- */}
            <div className="mb-10">
                <h3 className={`text-2xl font-bold mb-6 ${HOGU_THEME.text}`}>{t('ncc_detail.route_title')}</h3>
                <div className="relative z-0">
                    <RouteMapNCC
                        apiKey={import.meta.env.VITE_TOMTOM_KEY}
                        from={formatLocation(searchParams.from || searchParams.fromCity)}
                        fromAddress={searchParams.fromAddress ? `${searchParams.fromAddress}, ${formatLocation(searchParams.fromCity || '')}` : formatLocation(searchParams.fromCity)}
                        to={formatLocation(searchParams.to || searchParams.toCity)}
                        toAddress={searchParams.toAddress ? `${searchParams.toAddress}, ${formatLocation(searchParams.toCity || '')}` : formatLocation(searchParams.toCity)}
                        tripType={searchParams.tripType}
                        estimatedPrice={serviceData.estimatedPrice}
                        distanceKm={serviceData.distanceKm}
                        fromCoordinates={bookingCoordinates?.from}
                        toCoordinates={bookingCoordinates?.to}
                    />
                </div>
            </div>

            {/* -------------------------------- */}
            {/* GRID: IMMAGINI E PROVIDER */}
            {/* -------------------------------- */}
            <div className="flex flex-col md:flex-row gap-6 lg:gap-12 mb-12 relative">

                {/* COLONNA SINISTRA: INFO E GALLERIA */}
                <div className="flex-1 space-y-8 lg:space-y-12 w-full min-w-0">
                    
                    {/* Sezione Immagini (Spostata qui) */}
                    <div className="w-full">
                        <ServiceImageGallery images={providerData.images} className="mb-0" />
                    </div>

                    {/* Card Provider */}
                    <div>
                        <h3 className={`text-xl font-bold mb-4 ${HOGU_THEME.text}`}>{t('ncc_detail.provider_title')}</h3>
                        <ProviderInfoCard
                            providerName={providerData.providerName}
                            logoUrl={providerData.logoUrl}
                            rating={providerData.rating}
                            reviews={providerData.reviews}
                            location={providerData.location}
                            description={providerData.description}
                            images={providerData.images}
                        />
                    </div>
                </div>

                {/* COLONNA DESTRA: BOX PRENOTAZIONE (STICKY) */}
                <div className="w-full md:w-[340px] lg:w-[380px] flex-shrink-0 relative z-10">

                    {/* SEZIONE AZIONE: PRENOTAZIONE */}
                    <div className="bg-white p-6 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-gray-100 sticky top-24 transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)]">

                        {/* Header Prezzo */}
                        <div className="mb-6">
                            <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">{t('ncc_detail.estimated_total')}</p>
                            <div className="flex items-baseline gap-2">
                                <span className="text-4xl font-extrabold text-[#1A202C]">
                                    € {serviceData.estimatedPrice ? serviceData.estimatedPrice.toFixed(2).replace('.', ',') : 'N/A'}
                                </span>
                                <span className="text-sm text-gray-500 font-medium">{t('ncc_detail.all_included')}</span>
                            </div>
                        </div>

                        <div className="space-y-6">
                            {/* Riepilogo Dati Compatto */}
                            <div className="bg-gray-50/80 rounded-xl border border-gray-200/60 divide-y divide-gray-200/60">
                                <div className="p-4 flex items-center justify-between">
                                    <span className="text-sm text-gray-500">{t('ncc_detail.date')}</span>
                                    <span className="font-bold text-gray-900">{searchParams.date}</span>
                                </div>
                                <div className="p-4 flex items-center justify-between">
                                    <span className="text-sm text-gray-500">{t('ncc_detail.time')}</span>
                                    <span className="font-bold text-gray-900">{searchParams.time}</span>
                                </div>
                                <div className="p-4 flex items-center justify-between">
                                    <span className="text-sm text-gray-500">{t('ncc_detail.passengers')}</span>
                                    <span className="font-bold text-gray-900">{searchParams.passengers} {t('ncc_detail.people')}</span>
                                </div>
                            </div>


                            <button
                                onClick={handleConfirmBooking}
                                disabled={isBooking}
                                className="w-full bg-[#68B49B] text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-[#68B49B]/20 hover:bg-[#5aa38a] hover:shadow-[#5aa38a]/30 active:scale-[0.98] transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 group relative overflow-hidden"
                            >
                                <span className="relative z-10">{isBooking ? t('ncc_detail.processing') : t('ncc_detail.book_now')}</span>
                                {!isBooking && <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="relative z-10 group-hover:translate-x-1 transition-transform"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>}
                            </button>

                        </div>
                    </div>

                </div>

            </div>

            <LiveViewersFloatingBadge count={42} />

        </div>
    );
};

import React, { useState, useEffect } from "react";
import { HOGU_THEME } from "../../../config/theme.js";

import { nccService } from '../../../api/apiClient.js';

import { Breadcrumbs } from "../../ui/Breadcrumbs.jsx";
import { Tag } from "../../ui/Tag.jsx";
import { ServiceHeaderDetail } from "../../ui/ServiceHeaderDetail.jsx";
import { ServiceImageGallery } from "../../ui/ServiceImageGallery.jsx";

import { RideSummaryNCC } from "../../../components/pages/detail/RideSummaryNCC.jsx";
import { RouteMapNCC } from "../../../components/pages/detail/RouteMapNCC.jsx";
import { ProviderInfoCard } from "../../../components/pages/detail/ProviderInfoCard.jsx";
import LoadingScreen from '../../ui/LoadingScreen.jsx';
import ErrorModal from '../../ui/ErrorModal.jsx';

// ------------------------------------
// PAGINA DETTAGLIO SERVIZIO NCC
// ------------------------------------
export const ServiceDetailPageNCC = ({
    id,
    searchParams: propSearchParams,  
    images: propImages = [], 
    setPage
}) => {

    // State per i searchParams
    const [searchParams, setSearchParams] = useState(propSearchParams || null);
    
    // State per i dati del servizio provenienti dall'API
    const [serviceData, setServiceData] = useState(null);
    const [isLoadingService, setIsLoadingService] = useState(true);
    const [error, setError] = useState(null);

    // NUOVI STATE PER LA PRENOTAZIONE
    const [isBooking, setIsBooking] = useState(false); // Gestisce il LoadingScreen
    const [bookingError, setBookingError] = useState(null); // Gestisce l'ErrorModal

    // Recupera i searchParams dal sessionStorage al mount
    useEffect(() => {
        if (!propSearchParams) {
            try {
                const stored = sessionStorage.getItem('nccSearchParams');
                if (stored) {
                    setSearchParams(JSON.parse(stored));
                }
            } catch (err) {
                console.error('Errore parsing nccSearchParams:', err);
            }
        }
    }, [propSearchParams]);

    // Recupera i dettagli del servizio via API
    useEffect(() => {
        const fetchServiceDetail = async () => {
            if (!id) return;
            
            setIsLoadingService(true);
            try {
                const data = await nccService.getNccDetail(id);
                setServiceData(data);
            } catch (err) {
                console.error("Errore nel recupero del servizio NCC:", err);
                setError(err);
            } finally {
                setIsLoadingService(false);
            }
        };

        fetchServiceDetail();
    }, [id]);

    // ------------------------------------
    // LOGICA DI CONFERMA PRENOTAZIONE
    // ------------------------------------
    const handleConfirmBooking = async () => {
        setIsBooking(true); // Attiva LoadingScreen
        setBookingError(null);

        try {
            // SIMULAZIONE CHIAMATA API DI PRENOTAZIONE
            // Qui andrebbe la chiamata reale: await nccService.createBooking({...})
            await new Promise(resolve => setTimeout(resolve, 3000)); 

            // Se hai bisogno di simulare un errore random per testare l'ErrorModal:
            // if (Math.random() > 0.7) throw new Error("Errore di connessione al server.");

            console.log("Prenotazione confermata con successo!");
            
            // Logica di successo (es. redirect a pagina successo o dashboard)
            // setPage('success'); // Esempio ipotetico se gestito da setPage

        } catch (err) {
            console.error("Errore prenotazione:", err);
            // Attiva ErrorModal
            setBookingError({
                message: "Impossibile completare la prenotazione al momento.",
                details: err.message || "Errore sconosciuto"
            });
        } finally {
            setIsBooking(false); // Disattiva LoadingScreen
        }
    };

    const breadcrumbsItems = [
        { label: "Home", href: "/" },
        { label: "NCC", href: "/service/ncc" },
        { label: "Dettaglio Servizio" }
    ];

    // Mappatura Dati API -> UI (Provider Info)
    const providerData = serviceData ? {
        providerName: serviceData.name,
        logoUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(serviceData.name)}&background=0D1F2D&color=fff&size=128`,
        rating: serviceData.averageRating || 0,
        reviews: 0, 
        location: serviceData.locales?.map(l => l.city || l.name).join(", ") || "Posizione non disponibile",
        description: serviceData.description || "Nessuna descrizione disponibile.",
        images: (serviceData.images && serviceData.images.length > 0) ? serviceData.images : propImages
    } : null;

    // Loading state combinato (searchParams o dati API)
    // Nota: isLoadingService gestisce il caricamento iniziale della pagina
    if (!searchParams || isLoadingService) {
        return (
            <div className={`max-w-7xl mx-auto p-4 lg:p-8 ${HOGU_THEME.fontFamily}`}>
                {/* Usiamo lo stesso LoadingScreen anche per il load iniziale se desiderato, 
                    oppure un placeholder semplice come prima. Qui lascio il placeholder semplice
                    per distinguere dal caricamento "Prenotazione". */}
                <p className="text-gray-500 animate-pulse">Caricamento dettagli servizio...</p>
            </div>
        );
    }

    // Gestione errore API iniziale
    if (error || !providerData) {
         return (
            <div className={`max-w-7xl mx-auto p-4 lg:p-8 ${HOGU_THEME.fontFamily}`}>
                <p className="text-red-500">Impossibile caricare il servizio richiesto.</p>
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

            <Tag className="mb-2">NCC Premium</Tag>

            <ServiceHeaderDetail
                title={serviceData.name}
                urgencyCount={42}
                urgencyLabel="utenti in coda"
                urgencyTimeframe="oggi"
                className="mb-6"
            />

            {/* -------------------------------- */}
            {/* GALLERIA IMMAGINI PRINCIPALE */}
            {/* -------------------------------- */}
            <ServiceImageGallery images={providerData.images} className="mb-10" />

            {/* -------------------------------- */}
            {/* GRID: MAPPA E PROVIDER */}
            {/* -------------------------------- */}
            <div className="flex flex-col lg:flex-row gap-12 mb-12">
                
                {/* COLONNA SINISTRA: MAPPA E PERCORSO */}
                <div className="flex-1">
                    <h3 className={`text-2xl font-bold mb-6 ${HOGU_THEME.text}`}>Il tuo percorso</h3>
                    <RouteMapNCC
                        apiKey={import.meta.env.VITE_TOMTOM_KEY}
                        from={searchParams.from}
                        fromAddress={searchParams.fromAddress}
                        to={searchParams.to}
                        toAddress={searchParams.toAddress}
                        tripType={searchParams.tripType}
                    />
                </div>

                {/* COLONNA DESTRA: CHI OFFRE IL SERVIZIO + CONFERMA */}
                <div className="w-full lg:w-1/3 flex flex-col gap-8">
                    
                    {/* Card Provider */}
                    <div>
                        <h3 className={`text-xl font-bold mb-4 ${HOGU_THEME.text}`}>Chi offre il servizio</h3>
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

                    {/* SEZIONE AZIONE: PRENOTAZIONE */}
                    <div className="bg-white p-6 rounded-2xl shadow-xl border border-gray-100 sticky top-4">
                        <div className="flex justify-between items-end mb-6 border-b pb-4 border-gray-100">
                            <div>
                                <p className="text-gray-500 text-sm font-medium">Totale stimato</p>
                                <p className="text-3xl font-bold text-[#68B49B]">€ 120,00</p>
                                <p className="text-xs text-gray-400 mt-1">Tasse incluse</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                                <p>📅 Data: <strong>{searchParams.date}</strong></p>
                                <p>⏰ Ora: <strong>{searchParams.time}</strong></p>
                                <p>👥 Passeggeri: <strong>{searchParams.passengers}</strong></p>
                            </div>

                            <button
                                onClick={handleConfirmBooking}
                                disabled={isBooking}
                                className="w-full bg-[#68B49B] text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-[#68B49B]/30 hover:bg-[#5aa38a] hover:shadow-[#5aa38a]/30 active:scale-95 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {isBooking ? (
                                    <span>Elaborazione...</span>
                                ) : (
                                    <>
                                        <span>Conferma Prenotazione</span>
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                                        </svg>
                                    </>
                                )}
                            </button>
                            
                            <p className="text-xs text-center text-gray-400 mt-2">
                                Cliccando confermi di accettare i termini del servizio.
                            </p>
                        </div>
                    </div>

                </div>

            </div>

        </div>
    );
};
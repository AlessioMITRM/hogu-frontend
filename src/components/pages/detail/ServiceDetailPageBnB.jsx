import React, { useState, useEffect, useMemo, useRef } from 'react'; // <--- AGGIUNTO useRef
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
    MapPin, 
    Bed,
    Calendar,
    Users,
    X,
    BookOpen // Aggiunto BookOpen per coerenza con Ristorante
} from 'lucide-react';

import { HOGU_COLORS, HOGU_THEME } from '../../../config/theme.js';

// --- COMPONENTS ---
import { Breadcrumbs } from '../../../components/ui/Breadcrumbs.jsx';
import { ServiceHeaderDetail } from '../../../components/ui/ServiceHeaderDetail.jsx';
import { PrimaryButton, PrimaryEmphasis } from '../../../components/ui/Button.jsx';
import { ServiceImageGallery } from '../../../components/ui/ServiceImageGallery.jsx';
import { LocationAddress } from '../../../components/ui/LocationAddress.jsx';
import LoadingScreen from '../../../components/ui/LoadingScreen.jsx';
import ErrorModal from '../../../components/ui/ErrorModal.jsx';
import "leaflet/dist/leaflet.css";

// --- API ---
import { bnbService, mapService, infoService } from '../../../api/apiClient.js';

// Configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
const IMG_BASE_URL = `${API_BASE_URL}/uploads/`;
const SERVICE_FEE = 15; // Costo fisso di servizio

// --- 1. COMPONENTE MAPPA (LEAFLET) - STILE RISTORANTE ---
const LeafletMapBnB = ({ lat, lon, name }) => {
    const mapId = "service-map-bnb";
    
    // Ref per tracciare se la mappa è già stata inizializzata
    const mapInitializedRef = useRef(false);

    useEffect(() => {
        if (!lat || !lon) return;

        let mapInstance = null;
        if (typeof L !== 'undefined' && document.getElementById(mapId)) {
            // Pulizia preventiva rigorosa
            const container = L.DomUtil.get(mapId);
            if (container._leaflet_id) {
                container._leaflet_id = null;
            }
            
            // Rimuovi eventuali mappe precedenti
            if (L.Map.allMaps && L.Map.allMaps.length > 0) {
                 L.Map.allMaps.forEach(m => {
                    if (m._container && m._container.id === mapId) {
                        m.remove();
                    }
                 });
            }

            const position = [lat, lon];
            
            // MODIFICA 1: Aggiunto zoomControl: false per evitare duplicati o default indesiderati
            mapInstance = L.map(mapId, { 
                scrollWheelZoom: false,
                zoomControl: false 
            }).setView(position, 16);

            L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png', {
                attribution: '&copy; CARTO',
                subdomains: 'abcd',
                maxZoom: 20
            }).addTo(mapInstance);

            // MODIFICA 2: Impostato position: 'topleft' (puoi usare anche 'bottomleft')
            L.control.zoom({ position: 'topleft' }).addTo(mapInstance);

            const customIcon = L.divIcon({
                className: 'bg-transparent',
                html: `<div style="background-color: ${HOGU_COLORS.primary}; width: 28px; height: 28px; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 8px rgba(0,0,0,0.4);"></div>`
            });

            L.marker(position, { icon: customIcon }).addTo(mapInstance)
                .bindPopup(`<div style="font-family: sans-serif; text-align: center; padding: 5px;"><strong>${name}</strong></div>`)
                .openPopup();
        }

        return () => {
            if (mapInstance) {
                mapInstance.remove();
            }
        };
    }, [lat, lon, name]);

    if (!lat || !lon) return (
        <div className="h-72 md:h-[480px] w-full rounded-2xl bg-gray-50 flex flex-col items-center justify-center border border-dashed border-gray-300 animate-pulse mb-6">
            <MapPin className="text-gray-300 w-12 h-12 mb-3" />
            <span className="text-gray-400 text-sm font-medium">Caricamento mappa...</span>
        </div>
    );

    return (
        <div className="relative group rounded-3xl overflow-hidden shadow-lg border border-gray-100 mb-6 transition-all duration-300 hover:shadow-xl">
            <div id={mapId} className="h-72 md:h-[480px] w-full z-0" />
            <div className="absolute bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md px-5 py-3 text-xs text-gray-500 border-t border-gray-100 flex items-center justify-between z-[400]">
                <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full bg-[${HOGU_COLORS.primary}] animate-pulse`}></div>
                    <span className="font-medium">Posizione verificata</span>
                </div>
                <span className="opacity-60 text-[10px] uppercase tracking-wider">Stadia Maps ©</span>
            </div>
        </div>
    );
};

// --- 2. LOGICA FORM PRENOTAZIONE (INVARIATA) ---
const BookingFormContent = ({ checkIn, setCheckIn, checkOut, setCheckOut, guests, setGuests, onConfirm, pricePerNight }) => {
    
    const calculateNights = () => {
        if(!checkIn || !checkOut) return 0;
        const start = new Date(checkIn);
        const end = new Date(checkOut);
        const diffTime = Math.abs(end - start);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
        return diffDays > 0 ? diffDays : 0;
    };

    const nights = calculateNights();
    const totalPrice = nights * pricePerNight;
    const finalTotal = totalPrice > 0 ? totalPrice + SERVICE_FEE : 0;

    return (
        <div className="flex flex-col h-full">
            <div className="border border-gray-200 rounded-2xl overflow-hidden mb-4 shadow-sm">
                <div className="flex border-b border-gray-200">
                    <div className="flex-1 p-3 border-r border-gray-200 bg-white hover:bg-gray-50 transition-colors relative group">
                        <label className="text-[10px] font-bold text-gray-800 uppercase block mb-1 flex items-center gap-1">
                            <Calendar size={10} className={`text-[${HOGU_COLORS.primary}]`} /> Check-in
                        </label>
                        <input 
                            type="date" 
                            className="w-full text-sm font-medium bg-transparent border-none p-0 focus:ring-0 text-gray-600 cursor-pointer outline-none"
                            value={checkIn}
                            min={new Date().toISOString().split('T')[0]}
                            onChange={(e) => setCheckIn(e.target.value)}
                        />
                    </div>
                    <div className="flex-1 p-3 bg-white hover:bg-gray-50 transition-colors relative group">
                        <label className="text-[10px] font-bold text-gray-800 uppercase block mb-1 flex items-center gap-1">
                             <Calendar size={10} className={`text-[${HOGU_COLORS.primary}]`} /> Check-out
                        </label>
                        <input 
                            type="date" 
                            className="w-full text-sm font-medium bg-transparent border-none p-0 focus:ring-0 text-gray-600 cursor-pointer outline-none"
                            value={checkOut}
                            min={checkIn || new Date().toISOString().split('T')[0]}
                            onChange={(e) => setCheckOut(e.target.value)}
                        />
                    </div>
                </div>
                <div className="p-3 bg-white hover:bg-gray-50 transition-colors flex items-center justify-between">
                    <div>
                        <label className="text-[10px] font-bold text-gray-800 uppercase block mb-1 flex items-center gap-1">
                            <Users size={10} className={`text-[${HOGU_COLORS.primary}]`} /> Ospiti
                        </label>
                        <span className="text-sm text-gray-600 font-medium">{guests} Ospiti</span>
                    </div>
                    <div className="flex gap-2 items-center">
                        <button 
                            onClick={() => setGuests(Math.max(1, guests - 1))} 
                            className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center hover:border-gray-400 active:scale-95 transition-all text-gray-500"
                        >
                            -
                        </button>
                        <button 
                            onClick={() => setGuests(guests + 1)} 
                            className={`w-8 h-8 rounded-full border border-[${HOGU_COLORS.primary}]/30 flex items-center justify-center text-[${HOGU_COLORS.primary}] hover:bg-[${HOGU_COLORS.primary}] hover:text-white active:scale-95 transition-all`}
                        >
                            +
                        </button>
                    </div>
                </div>
            </div>

            {nights > 0 ? (
                <div className="mb-6 bg-gray-50 p-4 rounded-xl border border-dashed border-gray-200 animate-in fade-in zoom-in-95 duration-300">
                    <div className="flex justify-between text-sm text-gray-600 mb-2">
                        <span className="underline decoration-dotted">€{pricePerNight.toFixed(2)} x {nights} notti</span>
                        <span>€{totalPrice.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-600 mb-3">
                        <span className="underline decoration-dotted">Costi di pulizia & servizio</span>
                        <span>€{SERVICE_FEE.toFixed(2)}</span>
                    </div>
                    <div className="h-px bg-gray-200 my-2"></div>
                    <div className="flex justify-between font-bold text-gray-900 text-lg">
                        <span>Totale</span>
                        <span>€{finalTotal.toFixed(2)}</span>
                    </div>
                </div>
            ) : (
                <div className="mb-6 p-4 text-center text-gray-400 text-sm bg-gray-50 rounded-xl border border-dashed border-gray-200">
                    Seleziona le date per vedere il preventivo
                </div>
            )}

            <div className="mt-auto">
                <PrimaryButton 
                    onClick={() => onConfirm({ checkIn, checkOut, guests, total: finalTotal })} 
                    disabled={!checkIn || !checkOut}
                    className={`w-full py-4 text-base font-bold shadow-lg shadow-[${HOGU_COLORS.primary}]/25 transition-all hover:translate-y-[-2px] active:translate-y-[1px]`}
                >
                    Prenota ora
                </PrimaryButton>
                <p className="text-center text-[10px] text-gray-400 font-medium mt-3">
                    Non ti verrà addebitato nulla in questa fase
                </p>
            </div>
        </div>
    );
};

// --- 3. WIDGET MOBILE (SHEET) (INVARIATA) ---
const MobileBookingSheetBnB = ({ checkIn, setCheckIn, checkOut, setCheckOut, guests, setGuests, onConfirm, pricePerNight }) => {
    const [isOpen, setIsOpen] = useState(false);

    const handleConfirm = (data) => {
        setIsOpen(false);
        onConfirm(data);
    };

    return (
        <>
            <div className="fixed bottom-0 left-0 right-0 z-[900] bg-white border-t border-gray-100 p-4 shadow-[0_-5px_20px_rgba(0,0,0,0.1)] md:hidden safe-area-bottom">
                <div className="flex items-center justify-between gap-4 max-w-md mx-auto">
                    <div className="flex flex-col">
                        <span className="text-[10px] text-gray-500 uppercase tracking-wide font-semibold">Prezzo per notte</span>
                        <div className="flex items-baseline gap-1">
                            <span className={`text-xl font-bold text-[${HOGU_COLORS.primary}]`}>€ {pricePerNight.toFixed(0)}</span>
                            <span className="text-xs text-gray-400">/notte</span>
                        </div>
                    </div>
                    <PrimaryEmphasis
                        onClick={() => setIsOpen(true)}
                        className={`flex-1 py-3 text-base shadow-lg shadow-[${HOGU_COLORS.primary}]/25 active:scale-95 transition-transform`}
                    >
                        Verifica disp.
                    </PrimaryEmphasis>
                </div>
            </div>

            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[950] transition-opacity duration-300 md:hidden"
                    onClick={() => setIsOpen(false)}
                />
            )}

            <div className={`fixed bottom-0 left-0 right-0 z-[1000] bg-white rounded-t-[2rem] shadow-[0_-10px_40px_rgba(0,0,0,0.2)] transition-transform duration-500 cubic-bezier(0.32, 0.72, 0, 1) md:hidden flex flex-col max-h-[85vh] ${isOpen ? 'translate-y-0' : 'translate-y-[110%]'}`}>
                <div className="w-full flex justify-center pt-3 pb-1" onClick={() => setIsOpen(false)}>
                    <div className="w-12 h-1.5 bg-gray-300 rounded-full cursor-pointer hover:bg-gray-400 transition-colors opacity-50"></div>
                </div>
                <div className="px-6 pt-2 pb-4 border-b border-gray-50 flex justify-between items-center bg-white rounded-t-[2rem]">
                    <div>
                        <h3 className="text-xl font-bold text-gray-900 tracking-tight">La tua prenotazione</h3>
                        <p className="text-xs text-gray-400 font-medium">Seleziona date e ospiti</p>
                    </div>
                    <button onClick={() => setIsOpen(false)} className="p-2 bg-gray-50 rounded-full text-gray-400 hover:bg-gray-100">
                        <X size={20} />
                    </button>
                </div>
                <div className="p-6 overflow-y-auto safe-area-bottom bg-white">
                    <BookingFormContent 
                        checkIn={checkIn} setCheckIn={setCheckIn}
                        checkOut={checkOut} setCheckOut={setCheckOut}
                        guests={guests} setGuests={setGuests}
                        onConfirm={handleConfirm}
                        pricePerNight={pricePerNight}
                    />
                </div>
            </div>
        </>
    );
};

// --- PAGINA PRINCIPALE ---
// Riceve "id" come PROP dal DetailRouter
export const ServiceDetailPageBnB = ({ id, dateFrom, dateTo }) => {
    const navigate = useNavigate();
    const { t } = useTranslation();

    // Stati Dati
    const [service, setService] = useState(null);
    const [urgencyCount, setUrgencyCount] = useState(0);
    const [mapCoordinates, setMapCoordinates] = useState({ lat: null, lon: null });
    
    // Stati UI
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Stati Prenotazione
    const [checkIn, setCheckIn] = useState('');
    const [checkOut, setCheckOut] = useState('');
    const [guests, setGuests] = useState(2);

    // --- AGGIUNTA FONDAMENTALE PER EVITARE DOPPIE CHIAMATE ---
    const loadedId = useRef(null);

    useEffect(() => {
        // Se non c'è ID, non fare nulla
        if (!id) return;

        // CHECK ANTI-DUPLICAZIONE
        if (loadedId.current === id) return;
        loadedId.current = id;

        const fetchAllData = async () => {
            try {
                setLoading(true);

                // 1. Fetch Dati B&B e Info in parallelo
                const [bnbData, infoData] = await Promise.all([
                    bnbService.getBnBDetail(id, dateFrom, dateTo),
                    infoService.getInfoBnB()
                ]);

                // 2. Geocoding (Ottieni coordinate dall'indirizzo)
                // Questa logica è identica a quella del ristorante
                let coords = { lat: null, lon: null };
                let addressToGeocode = "";
                if (bnbData.serviceLocale) {
                    const locale = bnbData.serviceLocale.find(l => l.language === 'it') || bnbData.serviceLocale[0];
                    if (locale) addressToGeocode = `${locale.address}, ${locale.city}, ${locale.state}`;
                }

                if (addressToGeocode) {
                    try {
                        const mapData = await mapService.getCoordinatesFromAddress(addressToGeocode);
                        if (mapData && mapData.latitude) {
                            coords = { lat: mapData.latitude, lon: mapData.longitude };
                        }
                    } catch (mapError) {
                        console.warn("Mappa non caricata:", mapError);
                    }
                }

                // 3. Set stati in batch
                setService(bnbData);
                setUrgencyCount(infoData);
                setMapCoordinates(coords);

            } catch (err) {
                console.error(err);
                setError(err.message || "Impossibile caricare il B&B.");
                // Reset loadedId se fallisce per permettere retry
                loadedId.current = null;
            } finally {
                setLoading(false);
            }
        };

        fetchAllData();
    }, [id, dateFrom, dateTo]);

    const parsedData = useMemo(() => {
        if (!service) return null;

        const locale = service.serviceLocale
            ? (service.serviceLocale.find(l => l.language === 'it') || service.serviceLocale[0])
            : null;

        const displayAddress = locale ? `${locale.address}, ${locale.city}, ${locale.country}` : "Indirizzo non disponibile";
        
        // Gestione Immagini
        const images = (service.images && service.images.length > 0)
            ? service.images.map(img => img.startsWith('http') ? img : `${IMG_BASE_URL}${img}`)
            : ['https://placehold.co/1200x800/f1f5f9/94a3b8?text=Foto+Non+Disponibile'];

        // Parsing Descrizione o Amenities
        let features = [];
        try {
            if (service.features) {
                 features = JSON.parse(service.features);
            }
        } catch (e) { console.error("Errore parsing features", e); }

        return {
            title: service.name,
            description: service.description,
            price: service.basePrice || 0,
            displayAddress,
            images,
            providerName: service.providerName,
            features
        };
    }, [service]);

    const handleBookingRedirect = (bookingData) => {
        navigate('/payment/summary', { 
            state: { 
                booking: bookingData, 
                service: parsedData,
                type: 'BNB'
            } 
        });
    };

    if (loading) return <LoadingScreen isLoading={true} />;
    
    if (error) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <ErrorModal message={error} onClose={() => navigate('/service/bnb')} />
        </div>
    );

    if (!parsedData) return null;

    const breadcrumbsItems = [
        { label: 'Home', href: '/' },
        { label: 'B&B', href: '/service/bnb' },
        { label: parsedData.title }
    ];

    return (
        <div className={`min-h-screen bg-white ${HOGU_THEME.fontFamily} pb-24 md:pb-0`}>
            {/* Sfondo sfumato header */}
            <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-gray-50 to-white -z-10"></div>

            <div className="max-w-7xl mx-auto px-4 py-6 lg:px-8 lg:py-10">
                
                <Breadcrumbs items={breadcrumbsItems} className="mb-6 opacity-80" />

                <ServiceHeaderDetail 
                    title={parsedData.title}
                    urgencyCount={urgencyCount}
                />

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                    
                    {/* --- COLONNA SINISTRA (CONTENUTI) --- */}
                    <div className="lg:col-span-8 space-y-12">
                        
                        <div className="rounded-3xl overflow-hidden shadow-sm border border-gray-100">
                            <ServiceImageGallery images={parsedData.images} />
                        </div>

                        <section>
                             {/* --- HEADER UNIFORME --- */}
                            <div className="flex items-center gap-3 mb-6">
                                <div className={`p-3 rounded-xl bg-[${HOGU_COLORS.primary}]/10`}>
                                    <BookOpen className={`w-6 h-6 text-[${HOGU_COLORS.primary}]`} />
                                </div>
                                <h2 className="text-2xl font-bold tracking-tight text-gray-900">L'Alloggio</h2>
                            </div>
                            
                            <p className="text-gray-600 leading-relaxed text-lg whitespace-pre-line">
                                {parsedData.description}
                            </p>
                        </section>

                        <section className={`bg-white rounded-3xl border border-gray-100 p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden`}>
                            <div className={`absolute top-0 left-0 w-1 h-full bg-[${HOGU_COLORS.primary}]`}></div>
                            <div className="flex items-start gap-4 relative z-10">
                                <div className={`bg-[${HOGU_COLORS.primary}]/10 p-3 rounded-full text-[${HOGU_COLORS.primary}] shrink-0`}>
                                    <Bed size={24} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900 mb-2">La Camera</h3>
                                    <p className="text-gray-600 mb-4 leading-relaxed">
                                        Goditi un soggiorno rilassante. La struttura offre tutti i comfort necessari per una vacanza perfetta o un viaggio di lavoro.
                                    </p>
                                    
                                </div>
                            </div>
                        </section>

                        {/* --- SEZIONE MAPPA AGGIORNATA --- */}
                        <section className="pt-8 border-t border-gray-100">
                            {/* --- HEADER UNIFORME --- */}
                            <div className="flex items-center gap-3 mb-6">
                                <div className={`p-3 rounded-xl bg-[${HOGU_COLORS.primary}]/10`}>
                                    <MapPin className={`w-6 h-6 text-[${HOGU_COLORS.primary}]`} />
                                </div>
                                <h2 className="text-2xl font-bold tracking-tight text-gray-900">Dove dormirai</h2>
                            </div>
                            
                            <LeafletMapBnB lat={mapCoordinates.lat} lon={mapCoordinates.lon} name={parsedData.providerName} />
                            
                            <div className="pl-2 border-l-4 border-gray-200">
                                <LocationAddress address={parsedData.displayAddress} />
                            </div>
                        </section>

                    </div>

                    {/* --- COLONNA DESTRA (STICKY DESKTOP) --- */}
                    <div className="hidden md:block lg:col-span-4">
                        <div className="relative h-full">
                            <div className="bg-white rounded-3xl shadow-[0_20px_40px_-10px_rgba(0,0,0,0.1)] border border-gray-100 overflow-hidden sticky top-28">
                                 {/* Header Card */}
                                <div className="px-6 pt-6 pb-4 bg-white relative z-10 border-b border-gray-50">
                                    <div className="flex justify-between items-end mb-1">
                                        <div>
                                            <span className="text-2xl font-extrabold text-gray-900">€{parseFloat(parsedData.price).toFixed(0)}</span>
                                            <span className="text-gray-400 text-sm font-medium"> / notte</span>
                                        </div>
                                    </div>
                                </div>
                                
                                {/* Form Body */}
                                <div className="p-6">
                                    <BookingFormContent 
                                        checkIn={checkIn} setCheckIn={setCheckIn}
                                        checkOut={checkOut} setCheckOut={setCheckOut}
                                        guests={guests} setGuests={setGuests}
                                        onConfirm={handleBookingRedirect}
                                        pricePerNight={parsedData.price}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>

            {/* --- MOBILE BOOKING SHEET --- */}
            <MobileBookingSheetBnB 
                checkIn={checkIn} setCheckIn={setCheckIn}
                checkOut={checkOut} setCheckOut={setCheckOut}
                guests={guests} setGuests={setGuests}
                onConfirm={handleBookingRedirect}
                pricePerNight={parsedData.price}
            />
        </div>
    );
};

export default ServiceDetailPageBnB;
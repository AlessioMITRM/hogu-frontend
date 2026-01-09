import React, { useState, useEffect, useRef, useMemo } from 'react';
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { 
    Clock, 
    Calendar, 
    Users, 
    Shirt, 
    Check, 
    Info,
    Music,
    Armchair,
    Ticket,
    ChevronRight,
    Sparkles,
    MapPin,
    AlertCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// --- IMPORT COMPONENTI UI ---
import { Breadcrumbs } from '../../../components/ui/Breadcrumbs.jsx';
import { Tag } from '../../../components/ui/Tag.jsx';
import { ServiceHeaderDetail } from '../../../components/ui/ServiceHeaderDetail.jsx';
import { PrimaryButton } from '../../../components/ui/Button.jsx';
import { ServiceImageGallery } from '../../../components/ui/ServiceImageGallery.jsx';
import { LocationAddress } from '../../../components/ui/LocationAddress.jsx';
import LoadingScreen from '../../ui/LoadingScreen.jsx';
import ErrorModal from '../../ui/ErrorModal.jsx';
import { HOGU_THEME, HOGU_COLORS } from '../../../config/theme.js';
import { ServiceUnavailableOverlay } from './ServiceUnavailableOverlay.jsx';

// --- API ---
import { clubService, mapService, infoService } from '../../../api/apiClient.js';

// Base URL immagini
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
const IMG_BASE_URL = `${API_BASE_URL}/uploads/`;

// --- COMPONENTI UTILITY LOCALI ---

// InfoCard ottimizzata per Mobile
const InfoCard = ({ icon: Icon, label, value, subValue, highlight = false }) => (
    <div className={`
        flex items-center gap-3 p-3 rounded-xl border transition-all
        ${highlight ? 'bg-[#F0FDF9] border-[#68B49B]/30' : 'bg-gray-50 border-gray-100'}
    `}>
        <div className={`p-2.5 rounded-lg shadow-sm ${highlight ? 'bg-[#68B49B] text-white' : 'bg-white text-[#68B49B]'}`}>
            <Icon size={20} strokeWidth={2.5} />
        </div>
        <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider leading-tight">{label}</p>
            <p className={`text-base font-bold leading-tight ${highlight ? 'text-[#33594C]' : 'text-[#1A202C]'}`}>{value}</p>
            {subValue && <p className="text-[10px] text-gray-500 mt-0.5">{subValue}</p>}
        </div>
    </div>
);

// --- COMPONENTE MAPPA (LEAFLET - Stile Ristorante con Ref) ---
const LeafletMapClub = ({ lat, lon, name }) => {
    const mapContainerRef = useRef(null);
    const mapInstanceRef = useRef(null);

    useEffect(() => {
        if (!lat || !lon || !mapContainerRef.current) return;

        // Cleanup istanza precedente se esiste
        if (mapInstanceRef.current) {
            mapInstanceRef.current.remove();
            mapInstanceRef.current = null;
        }

        const position = [lat, lon];
        
        // Inizializza mappa
        const map = L.map(mapContainerRef.current, {
            scrollWheelZoom: false,
            zoomControl: false
        }).setView(position, 16);

        L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png', {
            attribution: '&copy; CARTO',
            subdomains: 'abcd',
            maxZoom: 20
        }).addTo(map);

        L.control.zoom({ position: 'topleft' }).addTo(map);

        const customIcon = L.divIcon({
            className: 'bg-transparent',
            html: `<div style="background-color: ${HOGU_COLORS.primary || '#68B49B'}; width: 28px; height: 28px; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 8px rgba(0,0,0,0.4);"></div>`
        });

        L.marker(position, { icon: customIcon }).addTo(map)
            .bindPopup(`<div style="font-family: sans-serif; text-align: center; padding: 5px;"><strong>${name}</strong></div>`)
            .openPopup();

        mapInstanceRef.current = map;

        return () => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
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
        <div className="relative group rounded-3xl overflow-hidden shadow-lg border border-gray-100 mb-6 mt-4 transition-all duration-300 hover:shadow-xl">
            <div ref={mapContainerRef} className="h-72 md:h-[480px] w-full z-0" />
            <div className="absolute bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md px-5 py-3 text-xs text-gray-500 border-t border-gray-100 flex items-center justify-between z-[400]">
                <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full bg-[${HOGU_COLORS.primary || '#68B49B'}] animate-pulse`}></div>
                    <span className="font-medium">Posizione verificata</span>
                </div>
                <span className="opacity-60 text-[10px] uppercase tracking-wider">Stadia Maps ©</span>
            </div>
        </div>
    );
};

// --- TICKET OPTION UI ---
const TicketOption = ({ type, title, subtitle, price, icon: Icon, isSelected, onClick, children }) => (
    <div 
        onClick={onClick}
        className={`
            relative overflow-hidden rounded-2xl border-2 transition-all duration-300 cursor-pointer group
            ${isSelected 
                ? 'border-[#68B49B] bg-white shadow-lg shadow-[#68B49B]/10 scale-[1.01]' 
                : 'border-transparent bg-gray-50 hover:bg-white hover:border-gray-200 hover:shadow-md'}
        `}
    >
        <div className={`absolute left-0 top-0 bottom-0 w-1.5 transition-colors ${isSelected ? 'bg-[#68B49B]' : 'bg-gray-200'}`} />
        <div className="p-4 pl-5 flex items-center justify-between">
            <div className="flex items-center gap-4">
                <div className={`
                    p-3 rounded-xl transition-colors
                    ${isSelected ? 'bg-[#F0FDF9] text-[#68B49B]' : 'bg-white text-gray-400'}
                `}>
                    <Icon size={24} />
                </div>
                <div>
                    <h4 className={`font-bold text-base leading-tight ${isSelected ? 'text-[#1A202C]' : 'text-gray-600'}`}>
                        {title}
                    </h4>
                    <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>
                </div>
            </div>
            
            <div className="text-right">
                <div className={`font-bold text-lg ${isSelected ? 'text-[#68B49B]' : 'text-gray-900'}`}>
                    {typeof price === 'number' ? `€ ${price}` : price}
                </div>
                {isSelected && (
                    <div className="absolute top-2 right-2">
                        <div className="bg-[#68B49B] rounded-full p-0.5">
                            <Check size={10} className="text-white" strokeWidth={3} />
                        </div>
                    </div>
                )}
            </div>
        </div>
        <div className={`
            overflow-hidden transition-all duration-300 ease-in-out border-t border-dashed
            ${isSelected ? 'max-h-24 opacity-100 border-[#68B49B]/20 bg-[#F0FDF9]/30' : 'max-h-0 opacity-0 border-transparent'}
        `}>
            <div className="p-3 pl-6">
                {children}
            </div>
        </div>
    </div>
);

// --- COMPONENTE PRINCIPALE ---
export const ServiceDetailPageClub = ({ id, table }) => {
    const navigate = useNavigate();
    
    // Stati Dati
    const [service, setService] = useState(null);
    const [urgencyCount, setUrgencyCount] = useState(0);
    const [mapCoordinates, setMapCoordinates] = useState({ lat: null, lon: null });
    
    // Stati UI/Loading
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // Stati Booking
    const [guestCount, setGuestCount] = useState(1);
    const [bookingType, setBookingType] = useState('list'); // 'list' | 'table'

    // Ref per evitare chiamate doppie
    const loadedId = useRef(null);

    // --- FETCH DATI ---
    useEffect(() => {
        if (!id) return;
        if (loadedId.current === id) return;
        loadedId.current = id;

        const fetchAllData = async () => {
            try {
                setLoading(true);
                
                // Fetch parallelo
                const [clubResponse, infoData] = await Promise.all([
                    clubService.getEventDetail(id),
                    infoService.getInfoClub()
                ]);

                // Normalizzazione risposta (Gestisce sia { data: ... } che risposta diretta)
                const clubData = clubResponse?.data || clubResponse;

                if (!clubData) throw new Error("Dati non trovati");

                // Geocoding Safely
                let coords = { lat: null, lon: null };
                let addressToGeocode = "";
                
                // Safe access a serviceLocale (gestisce null, undefined o array vuoto)
                if (clubData.serviceLocale && Array.isArray(clubData.serviceLocale) && clubData.serviceLocale.length > 0) {
                    const locale = clubData.serviceLocale.find(l => l.language === 'it') || clubData.serviceLocale[0];
                    if (locale) addressToGeocode = `${locale.address}, ${locale.city}`;
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

                setService(clubData);
                setUrgencyCount(infoData);
                setMapCoordinates(coords);

                if (table) {
                    setBookingType('table');
                }

            } catch (err) {
                console.error(err);
                setError(err.message || "Errore caricamento club.");
                loadedId.current = null;
            } finally {
                setLoading(false);
            }
        };

        fetchAllData();
    }, [id, table]);

    // --- PARSING DATI (SAFE & ROBUST) ---
    const parsedData = useMemo(() => {
        if (!service) return null;

        // Estrazione sicura del locale
        const locale = (service.serviceLocale && Array.isArray(service.serviceLocale))
            ? (service.serviceLocale.find(l => l.language === 'it') || service.serviceLocale[0])
            : (service.serviceLocale || {}); // Fallback oggetto vuoto se non è array

        const displayAddress = locale.address 
            ? `${locale.address}, ${locale.city || ''}, ${locale.country || ''}` 
            : (service.address ? `${service.address}, ${service.city || ''}` : "Indirizzo non disponibile");
        
        // Immagini sicure
        const rawImages = service.images || [];
        const images = rawImages.length > 0
            ? rawImages.map(img => img.startsWith('http') ? img : `${IMG_BASE_URL}${img}`)
            : ['https://placehold.co/1200x800/2D3748/A0AEC0?text=Club+Image'];

        // Date Mock (Logica mantenuta)
        const nextDate = new Date();
        nextDate.setDate(nextDate.getDate() + (5 - nextDate.getDay() + 7) % 7);
        const dateStr = nextDate.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' });
        const dayStr = nextDate.toLocaleDateString('it-IT', { weekday: 'long' });

        return {
            title: service.name || service.title || "Evento Senza Nome",
            description: service.description || "Nessuna descrizione disponibile.",
            displayAddress,
            images,
            available: service.available !== false, // Default true se undefined
            entryPrice: service.basePrice ?? service.price ?? 25, // Nullish coalescing per il prezzo
            tablePrice: service.tablePrice ?? 300,
            nextEvent: { date: dateStr, day: dayStr }
        };
    }, [service]);

    // --- HANDLERS ---
    const handleGuestChange = (delta) => {
        const newVal = guestCount + delta;
        if (newVal >= 1 && newVal <= 20) setGuestCount(newVal);
    };

    const handleProceedToCheckout = () => {
        const total = bookingType === 'table' ? parsedData.tablePrice : (guestCount * parsedData.entryPrice);
        
        navigate('/payment/summary', { 
            state: { 
                booking: {
                    type: bookingType,
                    guests: guestCount,
                    total: total,
                    date: parsedData.nextEvent.date
                }, 
                service: parsedData,
                serviceId: id
            } 
        });
    };

    // --- RENDER ---
    if (loading) return <LoadingScreen isLoading={true} />;
    
    if (error) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <ErrorModal message={error} onClose={() => navigate('/service/club')} />
        </div>
    );

    if (!parsedData) return null;

    const currentPrice = bookingType === 'table' ? parsedData.tablePrice : (guestCount * parsedData.entryPrice);

    const breadcrumbsItems = [
        { label: 'Home', href: '/' },
        { label: 'Club', href: '/service/club' },
        { label: parsedData.title }
    ];

    return (
        <div className={`max-w-7xl mx-auto px-4 py-6 md:py-12 ${HOGU_THEME.fontFamily}`}>
          
            {/* Breadcrumbs */}
            <div className="mb-4 hidden md:block">
                <Breadcrumbs items={breadcrumbsItems} />
            </div>

            {/* HEADER CON TAGS */}
            <ServiceHeaderDetail 
                title={parsedData.title}
                urgencyCount={urgencyCount}
                tags={
                    <>
                        <span className="bg-[#E6F5F0] text-[#33594C] px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 border border-[#68B49B]/30">
                            <Music size={12} /> DJ Set
                        </span>
                        <Tag>Esclusivo</Tag>
                    </>
                }
            />

            {/* Gallery (Stile aggiornato) */}
            <div className="rounded-3xl overflow-hidden shadow-sm border border-gray-100 mb-8">
                <ServiceImageGallery images={parsedData.images} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12 relative mt-8">
            
                {/* --- COLONNA SINISTRA (INFO) --- */}
                <div className="lg:col-span-2 space-y-8 md:space-y-12">
                    
                    {/* Intro */}
                    <section>
                        <h2 className="text-xl md:text-2xl font-bold text-[#1A202C] mb-3">About the Night</h2>
                        <p className="text-gray-600 leading-relaxed text-base md:text-lg whitespace-pre-line">
                            {parsedData.description}
                        </p>
                    </section>

                    {/* ORARI & INFO (Dynamic) */}
                    <section>
                        <h3 className="text-lg font-bold text-[#1A202C] mb-4 flex items-center gap-2">
                            <Clock size={20} className="text-[#68B49B]" /> Info Serata
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            <InfoCard 
                                icon={Calendar} 
                                label="Prossima Data" 
                                value={parsedData.nextEvent.date} 
                                subValue={parsedData.nextEvent.day} 
                                highlight={true} 
                            />
                            <InfoCard icon={Clock} label="Apertura" value="23:00" />
                            <InfoCard icon={Clock} label="Chiusura" value="05:00" />
                        </div>
                    </section>

                    {/* DRESS CODE & VIBE (Statico/Visuale per Club Context) */}
                    <section className="bg-gradient-to-br from-[#1A202C] to-[#2D3748] rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-[#68B49B] rounded-full blur-[60px] opacity-20"></div>
                        
                        <div className="relative z-10">
                            <h3 className="text-lg font-bold mb-6 flex items-center gap-2 text-white">
                                <Sparkles size={20} className="text-[#68B49B]" /> Vibe & Accesso
                            </h3>
                            
                            <div className="flex flex-col md:flex-row gap-6 md:gap-12">
                                {/* Dress Code */}
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="bg-white/10 p-2 rounded-lg">
                                            <Shirt size={20} className="text-[#68B49B]" />
                                        </div>
                                        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Dress Code</span>
                                    </div>
                                    <p className="text-xl font-bold mb-1">Smart Casual / Elegant</p>
                                    <p className="text-sm text-gray-400 leading-snug">
                                        Camicia gradita per gli uomini. No abbigliamento sportivo. Selezione all'ingresso.
                                    </p>
                                </div>

                                <div className="h-px w-full bg-white/10 md:hidden"></div>

                                {/* Crowd Mix (Visual Element) */}
                                <div className="flex-1">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className="bg-white/10 p-2 rounded-lg">
                                                <Users size={20} className="text-[#68B49B]" />
                                            </div>
                                            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Crowd Mix</span>
                                        </div>
                                        <span className="text-xs bg-[#68B49B] text-white px-2 py-0.5 rounded text-bold">Bilanciato</span>
                                    </div>
                                    
                                    <div className="space-y-2">
                                        <div className="h-3 w-full bg-white/10 rounded-full overflow-hidden flex">
                                            <div style={{ width: `50%` }} className="bg-blue-500 h-full"></div>
                                            <div className="flex-1 bg-pink-500 h-full"></div>
                                        </div>
                                        <div className="flex justify-between text-xs font-medium text-gray-300">
                                            <span>50% Uomo</span>
                                            <span>50% Donna</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section>
                        <div className="flex items-center gap-3 mb-6">
                            <div className={`p-3 rounded-xl bg-[${HOGU_COLORS.primary || '#68B49B'}]/10`}>
                                <MapPin className={`w-6 h-6 text-[${HOGU_COLORS.primary || '#68B49B'}]`} />
                            </div>
                            <h2 className="text-2xl font-bold tracking-tight text-gray-900">Dove trovarci</h2>
                        </div>
                        <LeafletMapClub 
                            lat={mapCoordinates.lat} 
                            lon={mapCoordinates.lon} 
                            name={parsedData.title} 
                        />
                        <div className="pl-2 border-l-4 border-gray-200">
                             <LocationAddress address={parsedData.displayAddress} />
                        </div>
                    </section>

                </div>

                {/* --- COLONNA DESTRA (PRENOTAZIONE) --- */}
                <div className="lg:col-span-1">
                    <div className="sticky top-24">
                        
                        {!parsedData.available ? (
                            <ServiceUnavailableOverlay 
                                onSearchSimilar={() => navigate('/service/club')} 
                                onGoBack={() => window.history.back()}
                            />
                        ) : (
                            <div className={`bg-white rounded-[2rem] shadow-sm border border-gray-100 p-5 md:p-6 overflow-hidden relative shadow-xl ring-1 ring-black/5`}>
                                <div className="flex items-center justify-between mb-6">
                                    <div>
                                        <h3 className="text-xl font-extrabold text-[#1A202C]">Seleziona Ingresso</h3>
                                        <p className="text-xs text-gray-500 mt-1">Prenotazione gratuita, paghi al locale</p>
                                    </div>
                                    <div className="bg-[#E6F5F0] p-2 rounded-full">
                                        <Ticket size={24} className="text-[#68B49B]" />
                                    </div>
                                </div>

                                <div className="space-y-4 mb-6">
                                    
                                    {/* Opzione 1: Lista */}
                                    <TicketOption 
                                        type="list"
                                        title="Mettiti in Lista"
                                        subtitle="Ingresso prioritario + Drink"
                                        price={parsedData.entryPrice}
                                        icon={Users}
                                        isSelected={bookingType === 'list'}
                                        onClick={() => setBookingType('list')}
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-bold text-gray-700">Numero Ospiti</span>
                                            <div className="flex items-center gap-3 bg-white rounded-lg border border-gray-200 p-1 shadow-sm">
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); handleGuestChange(-1); }}
                                                    className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-gray-100 text-gray-600 transition-colors"
                                                    disabled={guestCount <= 1}
                                                >
                                                    -
                                                </button>
                                                <span className="w-6 text-center font-bold text-lg">{guestCount}</span>
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); handleGuestChange(1); }}
                                                    className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-gray-100 text-[#68B49B] transition-colors"
                                                >
                                                    +
                                                </button>
                                            </div>
                                        </div>
                                    </TicketOption>

                                    {/* Opzione 2: Tavolo */}
                                    <TicketOption 
                                        type="table"
                                        title="Prenota Tavolo"
                                        subtitle="Zona VIP • Max 6 pax"
                                        price={parsedData.tablePrice}
                                        icon={Armchair}
                                        isSelected={bookingType === 'table'}
                                        onClick={() => setBookingType('table')}
                                    >
                                        <div className="flex items-center gap-2 text-xs text-gray-500">
                                            <Info size={14} />
                                            <span>Il prezzo indica la spesa minima (Min. Spending)</span>
                                        </div>
                                    </TicketOption>

                                </div>

                                <div className="pt-4 border-t border-dashed border-gray-200">
                                    <div className="flex justify-between items-end mb-4">
                                        <div>
                                            <p className="text-xs text-gray-400 font-bold uppercase">Totale Stimato</p>
                                            <p className="text-[10px] text-gray-400">Pagamento in cassa</p>
                                        </div>
                                        <div className="text-3xl font-extrabold text-[#1A202C]">
                                            € {currentPrice}
                                        </div>
                                    </div>

                                    <PrimaryButton onClick={handleProceedToCheckout} className="w-full py-4 text-lg shadow-xl shadow-[#68B49B]/20 flex justify-between items-center px-6 group">
                                        <span>Procedi</span>
                                        <div className="bg-white/20 p-1 rounded-lg group-hover:translate-x-1 transition-transform">
                                            <ChevronRight size={20} />
                                        </div>
                                    </PrimaryButton>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ServiceDetailPageClub;
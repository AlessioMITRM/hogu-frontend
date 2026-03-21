import React, { useState, useEffect, useRef, useMemo } from 'react';
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
    Clock,
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
    AlertCircle,
    Navigation,
    User
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';

// --- IMPORT COMPONENTI UI ---
import { Breadcrumbs } from '../../../components/ui/Breadcrumbs.jsx';
import { Tag } from '../../../components/ui/Tag.jsx';
import { ServiceHeaderDetail } from '../../../components/ui/ServiceHeaderDetail.jsx';
import { PrimaryButton } from '../../../components/ui/Button.jsx';
import { ServiceImageGallery } from '../../../components/ui/ServiceImageGallery.jsx';
import { LocationAddress } from '../../../components/ui/LocationAddress.jsx';
import { InfoCard } from '../../../components/ui/InfoCard.jsx';
import { ExpandableText } from '../../../components/ui/ExpandableText.jsx';
import LeafletMap from '../../../components/ui/LeafletMap.jsx';
import LoadingScreen from '../../ui/LoadingScreen.jsx';
import ErrorModal from '../../ui/ErrorModal.jsx';
import MapLoadingSkeleton from '../../ui/MapLoadingSkeleton.jsx';
import { HOGU_THEME, HOGU_COLORS } from '../../../config/theme.js';
import ServiceUnavailablePage from '../ServiceUnavailablePage.jsx';

// --- API ---
import { clubService, mapService, infoService } from '../../../api/apiClient.js';

import { getServiceLocalization, formatServiceDateTimes } from '../../../utils/dateUtils.js';

import { LiveViewersFloatingBadge } from '../../../components/ui/LiveViewersBadge.jsx';
import { MUSIC_THEMES, parseThemeFromAPI } from '../../utils/musicThemes.js';

// --- COMPONENTI UTILITY LOCALI ---

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
                    {typeof price === 'number' ? `€ ${price.toFixed(2)}` : price}
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
            ${isSelected ? 'max-h-[500px] opacity-100 border-[#68B49B]/20 bg-[#F0FDF9]/30' : 'max-h-0 opacity-0 border-transparent'}
        `}>
            <div className="p-3 pl-6">
                {children}
            </div>
        </div>
    </div>
);

// --- COMPONENTE PRINCIPALE ---
export const ServiceDetailPageClub = ({ id, table, guests }) => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    // Stati Dati
    const [service, setService] = useState(null);
    const [urgencyCount, setUrgencyCount] = useState(0);
    const [mapCoordinates, setMapCoordinates] = useState({ lat: null, lon: null });

    // Stati UI/Loading
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Stati Booking
    const [guestCount, setGuestCount] = useState(() => {
        if (guests) return Math.max(1, parseInt(guests, 10));
        const guestsParam = searchParams.get('guests') || searchParams.get('people') || searchParams.get('totalPersons');
        return guestsParam ? Math.max(1, parseInt(guestsParam, 10)) : 1;
    });

    const [bookingType, setBookingType] = useState(() => {
        const typeParam = searchParams.get('type');
        const tableParam = searchParams.get('table');
        const isTable = tableParam === 'true' || typeParam === 'table' || table === true;
        return isTable ? 'table' : 'list';
    });

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

                setService(clubData);
                setUrgencyCount(infoData);
                setMapCoordinates({ lat: null, lon: null });

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

    // Nuovo useEffect mappa
    useEffect(() => {
        if (!service) return;

        const fetchCoordinates = async () => {
            let addressToGeocode = "";

            // Safe access a serviceLocale (gestisce null, undefined o array vuoto)
            if (service.serviceLocale && Array.isArray(service.serviceLocale) && service.serviceLocale.length > 0) {
                const locale = service.serviceLocale.find(l => l.language === 'it') || service.serviceLocale[0];
                if (locale) addressToGeocode = `${locale.address}, ${locale.city}`;
            }

            if (addressToGeocode) {
                try {
                    const mapData = await mapService.getCoordinatesFromAddress(addressToGeocode);
                    if (mapData && mapData.latitude) {
                        setMapCoordinates({ lat: mapData.latitude, lon: mapData.longitude });
                    }
                } catch (mapError) {
                    console.warn("Mappa non caricata:", mapError);
                }
            }
        };
        fetchCoordinates();
    }, [service]);

    // --- STATE AGGIUNTIVI PER SELEZIONE GENERE ---
    const [selectedGender, setSelectedGender] = useState('MALE'); // Default MALE o null se necessario

    // --- PARSING DATI (SAFE & ROBUST) ---
    const parsedData = useMemo(() => {
        if (!service) return null;

        // 1. & 2. Gestione Localizzazione Centralizzata (Utils)
        const { displayLocale, timeZone, userFullLang } = getServiceLocalization(service.serviceLocale);

        const displayAddress = displayLocale.address
            ? `${displayLocale.address}, ${displayLocale.city || ''}, ${displayLocale.country || ''}`
            : (service.address ? `${service.address}, ${service.city || ''}` : "Indirizzo non disponibile");

        // Immagini sicure
        const rawImages = service.images || [];

        // Recupero clubId per path immagini (allineato con ServiceListingClub e EventServiceEditPage)
        const clubId = service.clubServiceId || service.clubId || service.providerId || service.userId || service.club?.id;

        const images = rawImages.length > 0
            ? rawImages.map(img => {
                if (img.startsWith('http')) return img;
                if (clubId) return `/files/club/${clubId}/event/${service.id}/${img}`;
                return `https://placehold.co/1200x800/2D3748/A0AEC0?text=${encodeURIComponent(service.name)}`;
            })
            : ['https://placehold.co/1200x800/2D3748/A0AEC0?text=Club+Image'];

        // 3. Gestione Date e Orari Reali (Centralizzata)
        let { dateStr, dayStr, startTimeStr, endTimeStr } = formatServiceDateTimes(
            service.startTime,
            service.endTime,
            timeZone,
            userFullLang
        );

        // Opzioni per formato Data + Ora
        const fullDateTimeOptions = {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
            timeZone
        };

        // Sovrascrivi SEMPRE startTimeStr per includere la data (perché abbiamo rimosso il box "Prossima Data")
        if (service.startTime) {
            const startObj = new Date(service.startTime);
            startTimeStr = startObj.toLocaleString(userFullLang, fullDateTimeOptions);
        }

        // Gestione eventi lunghi (Date diverse)
        if (service.startTime && service.endTime) {
            const startObj = new Date(service.startTime);
            const endObj = new Date(service.endTime);

            // Verifica se sono giorni diversi
            const startDay = startObj.toLocaleDateString(userFullLang, { timeZone });
            const endDay = endObj.toLocaleDateString(userFullLang, { timeZone });

            if (startDay !== endDay) {
                endTimeStr = endObj.toLocaleString(userFullLang, fullDateTimeOptions);
            }
        }

        // --- GESTIONE PREZZI DINAMICA (MALE/FEMALE) ---
        // Recuperiamo le configurazioni di prezzo attive
        const pricingConfigs = service.pricingConfigurations?.filter(p => p.isActive) || [];

        // Cerchiamo i prezzi specifici per genere
        const malePriceConfig = pricingConfigs.find(p => p.pricingType === 'MALE');
        const femalePriceConfig = pricingConfigs.find(p => p.pricingType === 'FEMALE');
        const vipTableConfig = pricingConfigs.find(p => p.pricingType === 'VIP_TABLE');

        // Determina se abbiamo opzioni miste (sia MALE che FEMALE disponibili)
        const hasGenderSelection = !!(malePriceConfig && femalePriceConfig);

        // Se non c'è distinzione, usa un prezzo base generico (fallback)
        const basePrice = service.basePrice ?? service.price ?? 25;

        // Calcola il prezzo di ingresso corrente in base alla selezione
        let currentEntryPrice = basePrice;
        if (hasGenderSelection) {
            // Se c'è selezione, usa il prezzo del genere selezionato (gestito nello state del componente padre, ma qui calcoliamo i valori disponibili)
            // Nota: 'selectedGender' è nello scope del componente, lo useremo nel render o in un useMemo separato se necessario.
            // Qui restituiamo le opzioni disponibili.
        } else if (malePriceConfig) {
            currentEntryPrice = malePriceConfig.price;
        } else if (femalePriceConfig) {
            currentEntryPrice = femalePriceConfig.price;
        }

        return {
            title: service.name || service.title || "Evento Senza Nome",
            description: service.description || "Nessuna descrizione disponibile.",
            displayAddress,
            images,
            available: service.available !== false, // Default true se undefined

            // Prezzi
            entryPrice: currentEntryPrice, // Prezzo di default o base
            tablePrice: vipTableConfig ? vipTableConfig.price : (service.tablePrice ?? 300),

            // Configurazione Prezzi Avanzata
            pricing: {
                hasGenderSelection,
                malePrice: malePriceConfig?.price,
                femalePrice: femalePriceConfig?.price,
                vipTablePrice: vipTableConfig?.price,
                malePriceId: malePriceConfig?.id,
                femalePriceId: femalePriceConfig?.id,
                vipTablePriceId: vipTableConfig?.id,
                malePriceConfig: malePriceConfig,
                femalePriceConfig: femalePriceConfig,
                vipTablePriceConfig: vipTableConfig,
                // Se non c'è distinzione di genere, prendiamo il primo prezzo disponibile come default (es. ingresso unico)
                defaultPriceId: (!hasGenderSelection && pricingConfigs.length > 0) ? pricingConfigs[0].id : null,
                defaultPriceConfig: (!hasGenderSelection && pricingConfigs.length > 0) ? pricingConfigs[0] : null
            },

            eventTime: startTimeStr,
            eventEndTime: endTimeStr,
            nextEvent: { date: dateStr, day: dayStr },
            // Campi raw per il checkout
            clubServiceId: clubId,
            rawStartTime: service.startTime,
            address: service.address,
            city: service.city,
            theme: service.theme,
            djName: service.djName
        };
    }, [service]);

    // --- THEME RESOLUTION ---
    const themeObj = useMemo(() => {
        if (!parsedData?.theme) return null;
        const themes = parseThemeFromAPI(parsedData.theme);
        if (!themes.length) return null;

        const mainTheme = themes[0].toLowerCase();

        const themeKey = Object.keys(MUSIC_THEMES).find(key => {
            const t = MUSIC_THEMES[key];
            return t.value.toLowerCase() === mainTheme ||
                t.subThemes.some(sub => sub.toLowerCase() === mainTheme);
        });

        return themeKey ? MUSIC_THEMES[themeKey] : null;
    }, [parsedData?.theme]);

    // Effetto per impostare il genere di default se necessario
    useEffect(() => {
        if (parsedData?.pricing?.hasGenderSelection) {
            // Se non è ancora settato o è invalido, resettiamo a MALE (o altro default)
            if (!selectedGender) setSelectedGender('MALE');
        }
    }, [parsedData?.pricing?.hasGenderSelection]);


    // --- HANDLERS ---
    const handleGuestChange = (delta) => {
        const newVal = guestCount + delta;
        if (newVal >= 1 && newVal <= 20) setGuestCount(newVal);
    };

    const handleProceedToCheckout = () => {
        // Calcolo prezzo dinamico in base alla selezione e ID configurazione
        let finalPrice = parsedData.entryPrice;
        let selectedPricingId = parsedData.pricing.defaultPriceId;
        let selectedPricingConfig = parsedData.pricing.defaultPriceConfig;

        if (bookingType === 'list') {
            if (parsedData.pricing.hasGenderSelection) {
                finalPrice = selectedGender === 'MALE' ? parsedData.pricing.malePrice : parsedData.pricing.femalePrice;
                selectedPricingId = selectedGender === 'MALE' ? parsedData.pricing.malePriceId : parsedData.pricing.femalePriceId;
                selectedPricingConfig = selectedGender === 'MALE' ? parsedData.pricing.malePriceConfig : parsedData.pricing.femalePriceConfig;
            }
        } else if (bookingType === 'table') {
            finalPrice = parsedData.tablePrice;
            selectedPricingId = parsedData.pricing.vipTablePriceId;
            selectedPricingConfig = parsedData.pricing.vipTablePriceConfig;
        }

        const total = bookingType === 'table' ? parsedData.tablePrice : (guestCount * finalPrice);

        navigate('/payment/summary', {
            state: {
                booking: {
                    serviceId: service.id,
                    date: parsedData.nextEvent.date,
                    time: parsedData.rawStartTime,
                    guests: guestCount,
                    total: total,
                    serviceType: 'CLUB',
                    type: bookingType === 'list' ? 'entry' : bookingType,
                    gender: bookingType === 'list' && parsedData.pricing.hasGenderSelection ? selectedGender : null,
                    pricingConfigurationId: selectedPricingId,
                    pricingConfiguration: selectedPricingConfig,
                    specialRequests: "Nessuna richiesta" // Default value to avoid "non deve essere spazio" error
                },
                service: {
                    id: service.id,
                    name: parsedData.title,
                    category: 'CLUB',
                    address: parsedData.displayAddress,
                    image: parsedData.images[0],
                    providerId: parsedData.clubServiceId,
                    clubServiceId: parsedData.clubServiceId,
                    city: parsedData.city
                }
            }
        });
    };

    // Calcola il prezzo attuale da visualizzare nel componente TicketOption (e nel riepilogo)
    const currentListPrice = useMemo(() => {
        if (!parsedData) return 0;
        if (parsedData.pricing.hasGenderSelection) {
            return selectedGender === 'MALE' ? parsedData.pricing.malePrice : parsedData.pricing.femalePrice;
        }
        return parsedData.entryPrice;
    }, [parsedData, selectedGender]);

    // --- RENDER ---
    if (loading) return <LoadingScreen isLoading={true} />;

    if (error) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <ErrorModal message={error} onClose={() => navigate('/service/club')} />
        </div>
    );

    if (!parsedData) return null;

    if (!parsedData.available) {
        return <ServiceUnavailablePage />;
    }

    const currentPrice = bookingType === 'table' ? parsedData.tablePrice : (guestCount * currentListPrice);

    const breadcrumbsItems = [
        { label: 'Home', href: '/' },
        { label: 'Club', href: '/service/club' },
        { label: parsedData.title }
    ];

    return (
        <div className={`min-h-screen bg-white ${HOGU_THEME.fontFamily} pb-24 md:pb-0`}>
            {/* Sfondo sfumato */}
            <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-gray-50 to-white -z-10"></div>

            <div className="max-w-7xl mx-auto px-4 py-6 lg:px-8 lg:py-10">

                {/* Breadcrumbs */}
                <div className="mb-4">
                    <Breadcrumbs items={breadcrumbsItems} />
                </div>

                {/* HEADER CON TAGS */}
                <ServiceHeaderDetail
                    title={parsedData.title}
                    tags={
                        <div className="flex items-center gap-3 mt-1 md:mt-0 flex-wrap">
                            {themeObj && (
                                <div className="inline-flex items-center gap-2 pl-1 pr-3 py-1 rounded-full border border-gray-200 bg-white/80 backdrop-blur-sm shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
                                    <div className="w-5 h-5 rounded-full bg-[#1A202C] flex items-center justify-center text-white text-[10px]">
                                        {themeObj.icon}
                                    </div>
                                    <span className="text-[10px] font-bold text-gray-600 uppercase tracking-[0.15em]">{themeObj.value}</span>
                                </div>
                            )}

                            {parsedData.djName && (
                                <div className="inline-flex items-center gap-2 pl-1 pr-3 py-1 rounded-full border border-gray-200 bg-white/80 backdrop-blur-sm shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
                                    <div className="w-5 h-5 rounded-full bg-[#E6F5F0] flex items-center justify-center text-[#33594C]">
                                        <User size={10} strokeWidth={3} />
                                    </div>
                                    <span className="text-[10px] font-bold text-[#33594C] uppercase tracking-[0.15em]">{parsedData.djName}</span>
                                </div>
                            )}
                        </div>
                    }
                />

                {/* Gallery (Stile aggiornato) */}
                <div className="-mx-4 md:mx-0 rounded-none md:rounded-3xl overflow-hidden shadow-none md:shadow-sm border-y md:border border-gray-100 md:border-gray-100 mb-8">
                    <ServiceImageGallery images={parsedData.images} mainImageHeight="h-64 md:h-96" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12 relative mt-8">

                    {/* --- COLONNA SINISTRA (INFO) --- */}
                    <div className="lg:col-span-2 space-y-8 md:space-y-12">

                        {/* Intro */}
                        <section>
                            <div className="flex items-center gap-3 mb-4 md:mb-6">
                                <div className={`p-2 md:p-3 rounded-xl bg-[${HOGU_COLORS.primary}]/10`}>
                                    <Info className={`w-5 h-5 md:w-6 md:h-6 text-[${HOGU_COLORS.primary}]`} />
                                </div>
                                <h2 className="text-lg md:text-2xl font-bold tracking-tight text-gray-900">About the Night</h2>
                            </div>
                            <ExpandableText text={parsedData.description} />
                        </section>

                        {/* ORARI & INFO (Dynamic) */}
                        <section>
                            <div className="flex items-center gap-3 mb-4 md:mb-6">
                                <div className={`p-2 md:p-3 rounded-xl bg-[${HOGU_COLORS.primary}]/10`}>
                                    <Clock className={`w-5 h-5 md:w-6 md:h-6 text-[${HOGU_COLORS.primary}]`} />
                                </div>
                                <h2 className="text-lg md:text-2xl font-bold tracking-tight text-gray-900">Info Serata</h2>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <InfoCard icon={Clock} label="Apertura" value={parsedData.eventTime} />
                                <InfoCard icon={Clock} label="Chiusura" value={parsedData.eventEndTime} />
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

                        <section className="pt-8 border-t border-gray-100">
                            <div className="flex items-center gap-3 mb-4 md:mb-6">
                                <div className={`p-2 md:p-3 rounded-xl bg-[${HOGU_COLORS.primary}]/10`}>
                                    <MapPin className={`w-5 h-5 md:w-6 md:h-6 text-[${HOGU_COLORS.primary}]`} />
                                </div>
                                <h2 className="text-lg md:text-2xl font-bold tracking-tight text-gray-900">Dove trovarci</h2>
                            </div>
                            <LeafletMap
                                lat={mapCoordinates.lat}
                                lon={mapCoordinates.lon}
                                name={parsedData.title}
                            />

                            {/* Address Card Elegante (Responsive) */}
                            <div className="mt-4 md:mt-6">
                                <div className="bg-white rounded-2xl p-5 shadow-[0_8px_30px_rgba(0,0,0,0.06)] border border-gray-100 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                    <div className="flex items-start gap-4">
                                        <div className={`p-3 rounded-2xl bg-[${HOGU_COLORS.primary}]/10 shrink-0`}>
                                            <MapPin className={`w-6 h-6 text-[${HOGU_COLORS.primary}]`} />
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Dove siamo</span>
                                            <p className="text-gray-900 font-medium leading-relaxed text-sm md:text-base">
                                                {parsedData.displayAddress}
                                            </p>
                                        </div>
                                    </div>
                                    <a
                                        href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(parsedData.displayAddress)}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={`w-full md:w-auto md:min-w-[200px] py-3 md:px-6 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-900 font-semibold text-sm flex items-center justify-center gap-2 transition-colors border border-gray-200 active:scale-[0.98]`}
                                    >
                                        <span>Ottieni indicazioni</span>
                                        <Navigation className="w-4 h-4" />
                                    </a>
                                </div>
                            </div>
                        </section>

                    </div>

                    {/* --- COLONNA DESTRA (PRENOTAZIONE) --- */}
                    <div className="lg:col-span-1">
                        <div className="sticky top-24">

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
                                        price={currentListPrice}
                                        icon={Users}
                                        isSelected={bookingType === 'list'}
                                        onClick={() => setBookingType('list')}
                                    >
                                        <div className="space-y-4">
                                            {/* SELEZIONE GENERE */}
                                            {parsedData.pricing.hasGenderSelection && (
                                                <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 block">Seleziona Genere</label>
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); setSelectedGender('MALE'); }}
                                                            className={`flex-1 py-2 px-2 rounded-lg border flex flex-col items-center justify-center gap-1 transition-all ${selectedGender === 'MALE'
                                                                ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm ring-1 ring-blue-200'
                                                                : 'border-gray-100 bg-gray-50 text-gray-500 hover:border-gray-200'
                                                                }`}
                                                        >
                                                            <span className="font-bold text-xs">Uomo</span>
                                                            <span className="bg-blue-200 text-blue-800 text-[10px] font-bold px-1.5 rounded-full">€{parsedData.pricing.malePrice}</span>
                                                        </button>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); setSelectedGender('FEMALE'); }}
                                                            className={`flex-1 py-2 px-2 rounded-lg border flex flex-col items-center justify-center gap-1 transition-all ${selectedGender === 'FEMALE'
                                                                ? 'border-pink-500 bg-pink-50 text-pink-700 shadow-sm ring-1 ring-pink-200'
                                                                : 'border-gray-100 bg-gray-50 text-gray-500 hover:border-gray-200'
                                                                }`}
                                                        >
                                                            <span className="font-bold text-xs">Donna</span>
                                                            <span className="bg-pink-200 text-pink-800 text-[10px] font-bold px-1.5 rounded-full">€{parsedData.pricing.femalePrice}</span>
                                                        </button>
                                                    </div>
                                                    <div className="flex items-center gap-1 mt-2 text-[10px] text-gray-400">
                                                        <Info size={12} />
                                                        <span>Prezzi differenti per genere</span>
                                                    </div>
                                                </div>
                                            )}

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

                                <div className="hidden lg:block pt-4 border-t border-dashed border-gray-200">
                                    <div className="flex justify-between items-end mb-4">
                                        <div>
                                            <p className="text-xs text-gray-400 font-bold uppercase">Totale Stimato</p>
                                            <p className="text-[10px] text-gray-400">Pagamento in cassa</p>
                                        </div>
                                        <div className="text-3xl font-extrabold text-[#1A202C]">
                                            € {typeof currentPrice === 'number' ? currentPrice.toFixed(2) : currentPrice}
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
                        </div>
                    </div>
                </div>

                {/* LIVE VIEWERS BADGE - FIXED & ELEGANT */}
                <LiveViewersFloatingBadge count={urgencyCount} />

            </div>

            {/* MOBILE FIXED BOTTOM BAR */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] lg:hidden pb-6 safe-area-bottom" style={{ zIndex: 40 }}>
                <div className="flex items-center gap-4 max-w-7xl mx-auto">
                    <div className="flex flex-col min-w-[80px]">
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Totale</span>
                        <span className="text-xl font-extrabold text-[#1A202C]">
                            € {typeof currentPrice === 'number' ? currentPrice.toFixed(2) : currentPrice}
                        </span>
                    </div>
                    <PrimaryButton
                        onClick={handleProceedToCheckout}
                        className="flex-1 py-3 text-base shadow-lg shadow-[#68B49B]/20 flex justify-center items-center gap-2 rounded-xl"
                    >
                        <span>Procedi</span>
                        <ChevronRight size={18} />
                    </PrimaryButton>
                </div>
            </div>
        </div>
    );
};

export default ServiceDetailPageClub;
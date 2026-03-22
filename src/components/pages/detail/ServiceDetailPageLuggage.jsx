import React, { useState, useEffect, useRef, useMemo } from 'react';
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
    Clock,
    Calendar,
    Briefcase,
    MapPin,
    ShieldCheck,
    Package,
    Info,
    AlertCircle
} from 'lucide-react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { HOGU_COLORS, HOGU_THEME } from '../../../config/theme.js';
import { X } from 'lucide-react';

// --- COMPONENTI UI ---
import { Breadcrumbs } from '../../../components/ui/Breadcrumbs.jsx';
import { Tag } from '../../../components/ui/Tag.jsx';
import { ServiceHeaderDetail } from '../../../components/ui/ServiceHeaderDetail.jsx';
import { PrimaryButton, PrimaryEmphasis } from '../../../components/ui/Button.jsx';
import { ServiceImageGallery } from '../../../components/ui/ServiceImageGallery.jsx';
import { LocationAddress } from '../../../components/ui/LocationAddress.jsx';
import LoadingScreen from '../../ui/LoadingScreen.jsx';
import ErrorModal from '../../ui/ErrorModal.jsx';
import MapLoadingSkeleton from '../../ui/MapLoadingSkeleton.jsx';
import ServiceUnavailablePage from '../ServiceUnavailablePage.jsx';

// --- API ---
import { luggageService, mapService, infoService } from '../../../api/apiClient.js';
import { getServiceLocalization } from '../../../utils/dateUtils.js';
import { calculateLuggageTotal } from '../../../utils/pricingUtils.js';

import { LiveViewersFloatingBadge } from '../../../components/ui/LiveViewersBadge.jsx';

// --- COSTANTI ---
const ENV_URL = import.meta.env.VITE_API_BASE_URL;
const DYNAMIC_URL = `${window.location.protocol}//${window.location.hostname}:8080`;
const API_BASE_URL =
    ENV_URL && ENV_URL.includes('localhost') && window.location.hostname !== 'localhost'
        ? DYNAMIC_URL
        : (ENV_URL || DYNAMIC_URL);
const IMG_BASE_URL = `${API_BASE_URL}/uploads/`;

// --- COMPONENTE MAPPA (LEAFLET) - STILE UNIFORME ---
const LeafletMapLuggage = ({ lat, lon, name }) => {
    const mapId = "service-map-luggage";

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

            mapInstance = L.map(mapId, {
                scrollWheelZoom: false,
                zoomControl: false
            }).setView(position, 16);

            L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png', {
                attribution: '&copy; CARTO',
                subdomains: 'abcd',
                maxZoom: 20
            }).addTo(mapInstance);

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

    if (!lat || !lon) return <MapLoadingSkeleton />;

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

// --- CARD SELETTORE BAGAGLIO ---
const LuggageSelectorCard = ({ label, count, onChange, icon: Icon, price, description }) => (
    <div
        className={`
            w-full flex items-center justify-between p-3 rounded-xl border transition-all duration-200
            ${count > 0 ? `border-[${HOGU_COLORS.primary}] bg-[#F0FDF9]` : 'border-gray-100 bg-white hover:border-gray-200'}
        `}
    >
        <div className="flex items-center gap-3 overflow-hidden cursor-pointer flex-1" onClick={() => onChange(count + 1)}>
            <div className={`p-2 rounded-lg shrink-0 ${count > 0 ? 'bg-white text-[#68B49B]' : 'bg-gray-50 text-gray-400'}`}>
                <Icon size={20} />
            </div>
            <div className="flex flex-col min-w-0">
                <span className="font-bold text-sm text-gray-900 truncate">{label}</span>
                <span className="text-xs text-gray-500 font-medium">€{typeof price === 'number' ? price.toFixed(2) : price}/gg</span>
            </div>
        </div>

        <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-1 ml-2 shrink-0">
            <button
                onClick={(e) => { e.stopPropagation(); onChange(Math.max(0, count - 1)); }}
                disabled={count === 0}
                className="w-7 h-7 flex items-center justify-center rounded-md bg-white shadow-sm text-gray-600 hover:text-red-500 disabled:opacity-50 disabled:hover:text-gray-600 transition-colors"
            >
                -
            </button>
            <span className="w-4 text-center text-sm font-bold text-gray-900">{count}</span>
            <button
                onClick={(e) => { e.stopPropagation(); onChange(count + 1); }}
                className={`w-7 h-7 flex items-center justify-center rounded-md bg-white shadow-sm text-[${HOGU_COLORS.primary}] hover:bg-[${HOGU_COLORS.primary}] hover:text-white transition-all`}
            >
                +
            </button>
        </div>
    </div>
);

// --- FORM PRENOTAZIONE LUGGAGE (CONTENUTO CONDIVISO) ---
const BookingFormContentLuggage = ({ bagsSmall, setBagsSmall, bagsMedium, setBagsMedium, bagsLarge, setBagsLarge, prices, onProceed, totalBags, totalPrice }) => {
    return (
        <div className="flex flex-col h-full">
            <label className="text-xs font-bold uppercase text-gray-500 mb-4 block tracking-wider">Seleziona bagagli</label>

            <div className="flex flex-col gap-3 mb-6">
                <LuggageSelectorCard
                    label="A Mano"
                    icon={Briefcase}
                    price={prices.small}
                    description="fino a 40cm"
                    count={bagsSmall}
                    onChange={setBagsSmall}
                />
                <LuggageSelectorCard
                    label="Media"
                    icon={Briefcase}
                    price={prices.medium}
                    description="fino a 65cm"
                    count={bagsMedium}
                    onChange={setBagsMedium}
                />
                <LuggageSelectorCard
                    label="XXL"
                    icon={Briefcase}
                    price={prices.large}
                    description="oltre 65cm"
                    count={bagsLarge}
                    onChange={setBagsLarge}
                />
            </div>

            <div className="mt-auto pt-4 border-t border-dashed border-gray-300">
                <div className="flex justify-between items-end mb-5">
                    <div>
                        <span className="block text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Totale stimato</span>
                        <div className="flex items-baseline gap-1">
                            <span className="text-3xl font-black text-gray-900">€{totalPrice.toFixed(2)}</span>
                            <span className="text-sm text-gray-500 font-medium">Totale</span>
                        </div>
                        <p className="text-[10px] text-gray-400 mt-1 leading-tight">
                            Tariffa calcolata su base mista (Giornaliera + Oraria)
                        </p>
                    </div>
                    <div className="text-right">
                        <span className={`text-sm font-bold text-[${HOGU_COLORS.primary}] bg-[#F0FDF9] px-3 py-1 rounded-full`}>
                            {totalBags} Bagagli
                        </span>
                    </div>
                </div>

                <PrimaryButton
                    onClick={onProceed}
                    disabled={totalBags === 0}
                    className={`w-full py-4 text-lg font-bold shadow-xl shadow-[${HOGU_COLORS.primary}]/20 transition-all hover:translate-y-[-2px] active:translate-y-[1px]`}
                >
                    Prenota Ora
                </PrimaryButton>
                <p className="text-center text-[10px] text-gray-400 font-medium mt-3 flex items-center justify-center gap-1">
                    <ShieldCheck size={12} /> Pagamento sicuro al 100%
                </p>
            </div>
        </div>
    );
};

// --- WIDGET MOBILE (SHEET) ---
const MobileBookingSheetLuggage = ({ bagsSmall, setBagsSmall, bagsMedium, setBagsMedium, bagsLarge, setBagsLarge, prices, onProceed, totalBags, totalPrice }) => {
    const [isOpen, setIsOpen] = useState(false);

    const handleProceed = () => {
        setIsOpen(false);
        onProceed();
    };

    return (
        <>
            <div className="fixed bottom-0 left-0 right-0 z-[900] bg-white border-t border-gray-100 p-4 shadow-[0_-5px_20px_rgba(0,0,0,0.1)] md:hidden safe-area-bottom">
                <div className="flex items-center justify-between gap-4 max-w-md mx-auto">
                    <div className="flex flex-col">
                        <span className="text-[10px] text-gray-500 uppercase tracking-wide font-semibold">Totale</span>
                        <div className="flex items-baseline gap-1">
                            <span className={`text-xl font-bold text-[${HOGU_COLORS.primary}]`}>€ {totalPrice.toFixed(2)}</span>
                            <span className="text-xs text-gray-400">Totale</span>
                        </div>
                    </div>
                    <PrimaryEmphasis
                        onClick={() => setIsOpen(true)}
                        className={`flex-1 py-3 text-base shadow-lg shadow-[${HOGU_COLORS.primary}]/25 active:scale-95 transition-transform`}
                    >
                        {totalBags > 0 ? `Prenota (${totalBags})` : 'Seleziona'}
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
                        <h3 className="text-xl font-bold text-gray-900 tracking-tight">I tuoi bagagli</h3>
                        <p className="text-xs text-gray-400 font-medium">Seleziona quantità e tipo</p>
                    </div>
                    <button onClick={() => setIsOpen(false)} className="p-2 bg-gray-50 rounded-full text-gray-400 hover:bg-gray-100">
                        <X size={20} />
                    </button>
                </div>
                <div className="p-6 overflow-y-auto safe-area-bottom bg-white">
                    <BookingFormContentLuggage
                        bagsSmall={bagsSmall} setBagsSmall={setBagsSmall}
                        bagsMedium={bagsMedium} setBagsMedium={setBagsMedium}
                        bagsLarge={bagsLarge} setBagsLarge={setBagsLarge}
                        prices={prices}
                        onProceed={handleProceed}
                        totalBags={totalBags}
                        totalPrice={totalPrice}
                    />
                </div>
            </div>
        </>
    );
};

// --- COMPONENTE PRINCIPALE ---
export const ServiceDetailPageLuggage = ({ id: propId }) => {
    const navigate = useNavigate();
    const { id: paramId } = useParams();
    const [searchParams] = useSearchParams();
    const id = propId || paramId;

    // Stati
    const [service, setService] = useState(null);
    const [urgencyCount, setUrgencyCount] = useState(0);
    const [mapCoordinates, setMapCoordinates] = useState({ lat: null, lon: null });

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [bagsSmall, setBagsSmall] = useState(parseInt(searchParams.get('bagsS') || '0', 10));
    const [bagsMedium, setBagsMedium] = useState(parseInt(searchParams.get('bagsM') || '0', 10));
    const [bagsLarge, setBagsLarge] = useState(parseInt(searchParams.get('bagsL') || '0', 10));

    const loadedId = useRef(null);

    // --- FETCH DATI (GEOCODING ISOLATO) ---
    useEffect(() => {
        if (!id) return;
        if (loadedId.current === id) return;
        loadedId.current = id;

        const fetchData = async () => {
            try {
                setLoading(true);
                setError(null);

                // 1. Dati principali (CRITICI)
                const luggageResponse = await luggageService.getLuggageDetail(id);
                const luggageData = luggageResponse?.data || luggageResponse;

                if (!luggageData) {
                    throw new Error("Punto deposito non trovato");
                }

                // Urgency count (opzionale)
                let urgency = 0;
                if (infoService.getInfoLuggage) {
                    try {
                        const infoData = await infoService.getInfoLuggage();
                        urgency = infoData || 0;
                    } catch (infoErr) {
                        console.warn("Urgency count non disponibile:", infoErr);
                    }
                }

                // Imposta dati principali subito
                setService(luggageData);
                setUrgencyCount(urgency);
                setMapCoordinates({ lat: null, lon: null });

            } catch (err) {
                // Solo errori critici arrivano qui
                console.error("Errore critico:", err);
                setError(err.message || "Impossibile caricare il deposito bagagli");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [id]);

    // --- GEOCODING ISOLATO ---
    useEffect(() => {
        if (!service) return;

        const fetchCoordinates = async () => {
            const locale = service.serviceLocale?.find(l => l.language === 'it') ||
                service.serviceLocale?.[0] || {};

            const addressParts = [
                locale.address?.trim(),
                locale.city?.trim(),
                locale.country?.trim()
            ].filter(Boolean);

            const fullAddress = addressParts.join(', ');

            if (fullAddress && fullAddress !== ',') {
                try {
                    const mapData = await mapService.getCoordinatesFromAddress(fullAddress);
                    if (mapData?.latitude && mapData?.longitude) {
                        setMapCoordinates({ lat: mapData.latitude, lon: mapData.longitude });
                    }
                } catch (mapError) {
                    console.warn("Geocoding fallito (indirizzo:", fullAddress, "):", mapError);
                }
            } else {
                console.info("Indirizzo non sufficiente per geocoding → mappa non caricata");
            }
        };

        fetchCoordinates();
    }, [service]);

    // --- PARSING DATI ---
    const parsedData = useMemo(() => {
        if (!service) return null;

        const { displayLocale } = getServiceLocalization(service.serviceLocale);

        const images = (service.images || []).length > 0
            ? service.images.map(img => img.startsWith('http') ? img : `/files/luggage/${id}/${img}`)
            : ['https://placehold.co/1200x800/2D3748/A0AEC0?text=Deposito+Bagagli'];

        const displayAddress = [
            displayLocale.address?.trim(),
            displayLocale.city?.trim(),
            displayLocale.country?.trim()
        ].filter(Boolean).join(', ') || "Indirizzo non disponibile";

        // Costruzione robusta di sizePrices
        let sizePrices = service.sizePrices ? [...service.sizePrices] : [];

        // Normalizzazione dei dati (mapping sizeLabel -> size e fix prezzi 0)
        if (sizePrices.length > 0) {
            sizePrices = sizePrices.map(sp => {
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
            const base = service.basePrice || 0;
            const pSmall = service.priceSmall || base;
            const pMedium = service.priceMedium || base;
            const pLarge = service.priceLarge || base;

            sizePrices = [
                { size: 'SMALL', pricePerDay: pSmall, pricePerHour: pSmall },
                { size: 'MEDIUM', pricePerDay: pMedium, pricePerHour: pMedium },
                { size: 'LARGE', pricePerDay: pLarge, pricePerHour: pLarge }
            ];
        }

        return {
            id: service.id || id,
            title: service.name || "Deposito Bagagli",
            description: displayLocale.description || service.description || "Deposito sicuro e assicurato.",
            displayAddress,
            images,
            available: service.available !== false,
            prices: {
                small: service.priceSmall || service.basePrice,
                medium: service.priceMedium || service.basePrice,
                large: service.priceLarge || service.basePrice
            },
            sizePrices: sizePrices,
            insurance: "N.D."
        };
    }, [service, id]);

    // Calcoli totale
    const totalBags = bagsSmall + bagsMedium + bagsLarge;

    // Recupera date/orari dai parametri URL
    const dateFrom = searchParams.get('dateFrom');
    const timeFrom = searchParams.get('timeFrom');
    const dateTo = searchParams.get('dateTo');
    const timeTo = searchParams.get('timeTo');

    const { total, duration } = useMemo(() => {
        if (!parsedData) return { total: 0, duration: null };
        return calculateLuggageTotal(
            dateFrom, timeFrom, dateTo, timeTo,
            { small: bagsSmall, medium: bagsMedium, large: bagsLarge },
            parsedData.sizePrices
        );
    }, [dateFrom, timeFrom, dateTo, timeTo, bagsSmall, bagsMedium, bagsLarge, parsedData]);

    const totalPrice = total;

    const handleProceed = () => {
        if (totalBags === 0) return;

        navigate('/payment/summary', {
            state: {
                booking: {
                    total: totalPrice,
                    bagsSmall,
                    bagsMedium,
                    bagsLarge,
                    totalBags,
                    serviceId: service.id || id,
                    serviceType: 'LUGGAGE',
                    date: dateFrom,
                    time: timeFrom,
                    dateFrom,
                    timeFrom,
                    dateTo,
                    timeTo,
                    duration // Pass duration info
                },
                service: parsedData,
                type: 'LUGGAGE'
            }
        });
    };

    // --- RENDER ---
    if (loading) return <LoadingScreen isLoading={true} />;

    if (error) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <ErrorModal message={error} onClose={() => navigate('/service/luggage')} />
        </div>
    );

    if (!parsedData) return null;

    if (!parsedData.available) {
        return <ServiceUnavailablePage />;
    }

    const breadcrumbsItems = [
        { label: 'Home', href: '/' },
        { label: 'Deposito Bagagli', href: '/service/luggage' },
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
                    tags={<Tag>Sicuro & Assicurato</Tag>}
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
                                    <Info className={`w-6 h-6 text-[${HOGU_COLORS.primary}]`} />
                                </div>
                                <h2 className="text-2xl font-bold tracking-tight text-gray-900">Descrizione</h2>
                            </div>

                            <p className="text-gray-600 leading-relaxed text-lg whitespace-pre-line">
                                {parsedData.description}
                            </p>
                        </section>

                        <section className={`bg-white rounded-3xl border border-gray-100 p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden`}>
                            <div className={`absolute top-0 left-0 w-1 h-full bg-[${HOGU_COLORS.primary}]`}></div>

                            <div className="flex items-center gap-3 mb-6 relative z-10">
                                <div className={`p-3 rounded-xl bg-[${HOGU_COLORS.primary}]/10`}>
                                    <Package className={`w-6 h-6 text-[${HOGU_COLORS.primary}]`} />
                                </div>
                                <h2 className="text-2xl font-bold tracking-tight text-gray-900">Tipologie Bagagli</h2>
                            </div>

                            <div className="space-y-6 relative z-10">
                                {[
                                    { label: "A Mano (Small)", price: parsedData.prices.small, desc: "Zaini, borse PC, shopping" },
                                    { label: "Media (Standard)", price: parsedData.prices.medium, desc: "Trolley cabina, valigie medie" },
                                    { label: "XXL (Large)", price: parsedData.prices.large, desc: "Valigie grandi, attrezzatura sportiva" }
                                ].map((item, i) => (
                                    <div key={i} className="flex items-start gap-5 pb-6 last:pb-0 border-b border-gray-100 last:border-none">
                                        <div className="bg-[#F0FDF9] p-4 rounded-2xl text-[#68B49B]">
                                            <Briefcase size={i === 0 ? 24 : i === 1 ? 32 : 40} />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex justify-between items-start mb-1">
                                                <h4 className="font-bold text-gray-900">{item.label}</h4>
                                                <span className="font-bold text-lg">€{typeof item.price === 'number' ? item.price.toFixed(2) : item.price}/gg</span>
                                            </div>
                                            <p className="text-sm text-gray-600">{item.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>

                        <section className="pt-8 border-t border-gray-100">
                            {/* --- HEADER UNIFORME --- */}
                            <div className="flex items-center gap-3 mb-6">
                                <div className={`p-3 rounded-xl bg-[${HOGU_COLORS.primary}]/10`}>
                                    <MapPin className={`w-6 h-6 text-[${HOGU_COLORS.primary}]`} />
                                </div>
                                <h2 className="text-2xl font-bold tracking-tight text-gray-900">Dove trovarci</h2>
                            </div>

                            <LeafletMapLuggage
                                lat={mapCoordinates.lat}
                                lon={mapCoordinates.lon}
                                name={parsedData.title}
                            />

                            <div className="pl-2 border-l-4 border-gray-200">
                                <LocationAddress address={parsedData.displayAddress} />
                            </div>
                        </section>
                    </div>

                    {/* --- COLONNA DESTRA (STICKY DESKTOP) --- */}
                    <div className="hidden md:block lg:col-span-4">
                        <div className="relative h-full">
                            <div className="bg-white rounded-[2rem] shadow-[0_20px_40px_-10px_rgba(0,0,0,0.1)] border border-gray-100 overflow-hidden sticky top-28 ring-1 ring-black/5 p-6">
                                <div className="flex justify-between items-center mb-6 border-b border-gray-50 pb-4">
                                    <h3 className="text-xl font-extrabold text-gray-900">Prenota Spazio</h3>
                                </div>

                                <BookingFormContentLuggage
                                    bagsSmall={bagsSmall} setBagsSmall={setBagsSmall}
                                    bagsMedium={bagsMedium} setBagsMedium={setBagsMedium}
                                    bagsLarge={bagsLarge} setBagsLarge={setBagsLarge}
                                    prices={parsedData.prices}
                                    onProceed={handleProceed}
                                    totalBags={totalBags}
                                    totalPrice={totalPrice}
                                />
                            </div>
                        </div>
                    </div>

                </div>
            </div>

            {/* --- MOBILE BOOKING SHEET --- */}
            <MobileBookingSheetLuggage
                bagsSmall={bagsSmall} setBagsSmall={setBagsSmall}
                bagsMedium={bagsMedium} setBagsMedium={setBagsMedium}
                bagsLarge={bagsLarge} setBagsLarge={setBagsLarge}
                prices={parsedData.prices}
                onProceed={handleProceed}
                totalBags={totalBags}
                totalPrice={totalPrice}
            />

            {urgencyCount > 0 && <LiveViewersFloatingBadge count={urgencyCount} />}
        </div>
    );
};

export default ServiceDetailPageLuggage;

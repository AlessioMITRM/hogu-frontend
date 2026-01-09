import React, { useState, useEffect, useRef, useMemo } from 'react';
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { 
    Clock, 
    Calendar, 
    Briefcase, 
    MapPin, 
    Star,
    Check,
    ShieldCheck,
    Package,
    Info,
    AlertCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// --- COMPONENTI UI ---
import { Breadcrumbs } from '../../../components/ui/Breadcrumbs.jsx';
import { Tag } from '../../../components/ui/Tag.jsx';
import { ServiceHeaderDetail } from '../../../components/ui/ServiceHeaderDetail.jsx';
import { PrimaryButton } from '../../../components/ui/Button.jsx';
import { ServiceImageGallery } from '../../../components/ui/ServiceImageGallery.jsx';
import { LocationAddress } from '../../../components/ui/LocationAddress.jsx';
import LoadingScreen from '../../ui/LoadingScreen.jsx';
import ErrorModal from '../../ui/ErrorModal.jsx';

// --- API ---
import { luggageService, mapService, infoService } from '../../../api/apiClient.js';

// --- COSTANTI ---
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
const IMG_BASE_URL = `${API_BASE_URL}/uploads/`;

// --- COMPONENTE MAPPA ---
const LeafletMapLuggage = ({ lat, lon, name }) => {
    const mapContainerRef = useRef(null);
    const mapInstanceRef = useRef(null);

    useEffect(() => {
        if (!lat || !lon || !mapContainerRef.current) return;

        if (mapInstanceRef.current) {
            mapInstanceRef.current.remove();
            mapInstanceRef.current = null;
        }

        const position = [lat, lon];
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
            html: `<div style="background-color: #68B49B; width: 28px; height: 28px; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 8px rgba(0,0,0,0.4);"></div>`
        });

        L.marker(position, { icon: customIcon }).addTo(map)
            .bindPopup(`<strong>${name}</strong>`)
            .openPopup();

        mapInstanceRef.current = map;

        return () => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
            }
        };
    }, [lat, lon, name]);

    // Placeholder se non ci sono coordinate
    if (!lat || !lon) {
        return (
            <div className="h-72 md:h-[480px] w-full rounded-3xl bg-gray-50 border border-dashed border-gray-200 flex flex-col items-center justify-center mb-6">
                <AlertCircle className="w-12 h-12 text-gray-300 mb-4" />
                <p className="text-gray-500 text-sm font-medium text-center px-8">
                    Mappa non disponibile per questo punto deposito
                </p>
                <p className="text-xs text-gray-400 mt-2">L'indirizzo è stato verificato manualmente</p>
            </div>
        );
    }

    return (
        <div className="relative group rounded-3xl overflow-hidden shadow-lg border border-gray-100 mb-6 mt-4 transition-all duration-300 hover:shadow-xl">
            <div ref={mapContainerRef} className="h-72 md:h-[480px] w-full z-0" />
            <div className="absolute bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md px-5 py-3 text-xs text-gray-500 border-t border-gray-100 flex items-center justify-between z-[400]">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[#68B49B] animate-pulse"></div>
                    <span className="font-medium">Posizione verificata</span>
                </div>
                <span className="opacity-60 text-[10px] uppercase tracking-wider">CARTO ©</span>
            </div>
        </div>
    );
};

// --- CARD SELETTORE BAGAGLIO ---
const LuggageSelectorCard = ({ label, count, onChange, icon: Icon, price, iconSize = 32, description }) => (
    <div 
        className={`
            relative flex flex-col items-center justify-center p-5 rounded-2xl border-2 transition-all duration-300 cursor-pointer hover:shadow-md
            ${count > 0 ? 'border-[#68B49B] bg-[#F0FDF9] shadow-sm' : 'border-gray-200 bg-white'}
        `} 
        onClick={() => onChange(count + 1)}
    >
        <div className={`mb-3 ${count > 0 ? 'text-[#68B49B]' : 'text-gray-400'}`}>
            <Icon size={iconSize} strokeWidth={1.8} />
        </div>
        <span className="font-bold text-base">{label}</span>
        {description && <p className="text-xs text-gray-500 text-center mt-1">{description}</p>}
        <span className="text-sm font-bold text-gray-700 mt-2">€{price}/giorno</span>

        <div className="flex items-center gap-4 bg-gray-50 rounded-xl px-3 py-2 mt-4 shadow-inner" onClick={(e) => e.stopPropagation()}>
            <button 
                onClick={(e) => { e.stopPropagation(); onChange(Math.max(0, count - 1)); }}
                className="w-9 h-9 rounded-lg bg-white shadow text-gray-600 hover:text-[#68B49B] flex items-center justify-center font-bold text-lg disabled:opacity-50"
                disabled={count === 0}
            >−</button>
            <span className="w-8 text-center font-extrabold text-lg">{count}</span>
            <button 
                onClick={(e) => { e.stopPropagation(); onChange(count + 1); }}
                className="w-9 h-9 rounded-lg bg-white shadow text-[#68B49B] flex items-center justify-center font-bold text-lg"
            >+</button>
        </div>
    </div>
);

// --- MODAL SUCCESSO (opzionale, puoi sostituirlo con navigazione reale) ---
const SuccessModal = ({ onClose }) => (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 text-center">
            <div className="w-20 h-20 bg-[#68B49B] rounded-full flex items-center justify-center mx-auto mb-6">
                <Check size={40} className="text-white" strokeWidth={3} />
            </div>
            <h2 className="text-2xl font-extrabold text-[#1A202C] mb-3">Prenotazione Confermata!</h2>
            <p className="text-gray-600 mb-8">Riceverai una mail con tutti i dettagli e il QR code.</p>
            <PrimaryButton onClick={onClose} className="w-full">Torna alla Home</PrimaryButton>
        </div>
    </div>
);

// --- COMPONENTE PRINCIPALE ---
export const ServiceDetailPageLuggage = ({ id }) => {
    const navigate = useNavigate();

    // Stati
    const [service, setService] = useState(null);
    const [urgencyCount, setUrgencyCount] = useState(0);
    const [mapCoordinates, setMapCoordinates] = useState({ lat: null, lon: null });

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showSuccess, setShowSuccess] = useState(false);

    const [bagsSmall, setBagsSmall] = useState(0);
    const [bagsMedium, setBagsMedium] = useState(0);
    const [bagsLarge, setBagsLarge] = useState(0);

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

                // 2. Geocoding (OPZIONALE e ISOLATO)
                const locale = luggageData.serviceLocale?.find(l => l.language === 'it') || 
                               luggageData.serviceLocale?.[0] || {};

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
                        // Non impostare errore globale → mappa mostrerà placeholder
                        setMapCoordinates({ lat: null, lon: null });
                    }
                } else {
                    console.info("Indirizzo non sufficiente per geocoding → mappa non caricata");
                    setMapCoordinates({ lat: null, lon: null });
                }

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

    // --- PARSING DATI ---
    const parsedData = useMemo(() => {
        if (!service) return null;

        const locale = service.serviceLocale?.find(l => l.language === 'it') || service.serviceLocale?.[0] || {};

        const images = (service.images || []).length > 0
            ? service.images.map(img => img.startsWith('http') ? img : `${IMG_BASE_URL}${img}`)
            : ['https://placehold.co/1200x800/2D3748/A0AEC0?text=Deposito+Bagagli'];

        const displayAddress = [
            locale.address?.trim(),
            locale.city?.trim(),
            locale.country?.trim()
        ].filter(Boolean).join(', ') || "Indirizzo non disponibile";

        return {
            title: service.name || "Deposito Bagagli",
            description: locale.description || service.description || "Deposito sicuro e assicurato.",
            displayAddress,
            images,
            available: service.available !== false,
            prices: {
                small: service.priceSmall || service.basePrice,
                medium: service.priceMedium || service.basePrice,
                large: service.priceLarge || service.basePrice
            },
            insurance: "N.D."
        };
    }, [service]);

    // Calcoli totale
    const totalBags = bagsSmall + bagsMedium + bagsLarge;
    const totalPrice = parsedData
        ? (bagsSmall * parsedData.prices.small) +
          (bagsMedium * parsedData.prices.medium) +
          (bagsLarge * parsedData.prices.large)
        : 0;

    const handleProceed = () => {
        if (totalBags === 0) return;
        setShowSuccess(true); // Da sostituire con navigazione reale o chiamata API
    };

    // --- RENDER ---
    if (loading) return <LoadingScreen isLoading={true} />;

    if (error) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <ErrorModal message={error} onClose={() => navigate('/service/luggage')} />
        </div>
    );

    if (!parsedData) return null;

    const breadcrumbsItems = [
        { label: 'Home', href: '/' },
        { label: 'Deposito Bagagli', href: '/service/luggage' },
        { label: parsedData.title }
    ];

    return (
        <>
            <div className="max-w-7xl mx-auto px-4 py-6 md:py-12 font-sans">
                <div className="mb-4 hidden md:block">
                    <Breadcrumbs items={breadcrumbsItems} />
                </div>

                <ServiceHeaderDetail 
                    title={parsedData.title}
                    urgencyCount={urgencyCount}
                    tags={<Tag>Sicuro & Assicurato</Tag>}
                />

                <div className="rounded-3xl overflow-hidden shadow-sm border border-gray-100 mb-8">
                    <ServiceImageGallery images={parsedData.images} />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12 mt-8">
                    {/* COLONNA SINISTRA - INFO */}
                    <div className="lg:col-span-2 space-y-12">
                        <section>
                            <h2 className="text-2xl font-bold text-[#1A202C] mb-4">Descrizione</h2>
                            <p className="text-gray-600 leading-relaxed text-lg whitespace-pre-line">
                                {parsedData.description}
                            </p>
                        </section>

                        <section className="bg-white rounded-[2rem] border border-gray-100 shadow-lg p-8 border-l-4 border-l-[#68B49B]">
                            <h3 className="text-xl font-bold text-[#1A202C] mb-6 flex items-center gap-2">
                                <Package size={22} className="text-[#68B49B]" /> Tipologie Bagagli
                            </h3>
                            <div className="space-y-6">
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
                                                <span className="font-bold text-lg">€{item.price}/gg</span>
                                            </div>
                                            <p className="text-sm text-gray-600">{item.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>

                        <section>
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-3 rounded-xl bg-[#68B49B]/10">
                                    <MapPin className="w-6 h-6 text-[#68B49B]" />
                                </div>
                                <h2 className="text-2xl font-bold">Dove trovarci</h2>
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

                    {/* COLONNA DESTRA - PRENOTAZIONE */}
                    <div className="lg:col-span-1">
                        <div className="sticky top-24">
                            <div className="bg-white rounded-[2rem] shadow-xl border border-gray-100 p-6 ring-1 ring-black/5">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-xl font-extrabold">Prenota il tuo spazio</h3>
                                    <div className="flex items-center gap-1 text-sm font-bold">
                                        <Star size={16} className="text-yellow-400 fill-yellow-400" /> 4.9
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div>
                                        <label className="text-xs font-bold uppercase text-gray-500 ml-1">Seleziona bagagli</label>
                                        <div className="grid grid-cols-2 gap-4 mt-3">
                                            <LuggageSelectorCard 
                                                label="A Mano" 
                                                icon={Briefcase} 
                                                iconSize={26}
                                                price={parsedData.prices.small}
                                                description="fino a 40cm"
                                                count={bagsSmall}
                                                onChange={setBagsSmall}
                                            />
                                            <LuggageSelectorCard 
                                                label="Media" 
                                                icon={Briefcase} 
                                                iconSize={34}
                                                price={parsedData.prices.medium}
                                                description="fino a 65cm"
                                                count={bagsMedium}
                                                onChange={setBagsMedium}
                                            />
                                            <div className="col-span-2">
                                                <LuggageSelectorCard 
                                                    label="XXL" 
                                                    icon={Briefcase} 
                                                    iconSize={44}
                                                    price={parsedData.prices.large}
                                                    description="oltre 65cm"
                                                    count={bagsLarge}
                                                    onChange={setBagsLarge}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-4 border-t border-dashed border-gray-300">
                                        <div className="flex justify-between items-end mb-5">
                                            <div>
                                                <p className="text-xs uppercase font-bold text-gray-500">Totale stimato</p>
                                                <p className="text-[10px] text-gray-500">{totalBags} bagagli × 1 giorno</p>
                                            </div>
                                            <div className="text-3xl font-extrabold text-[#1A202C]">€ {totalPrice}</div>
                                        </div>

                                        <PrimaryButton 
                                            onClick={handleProceed}
                                            disabled={totalBags === 0}
                                            className="w-full py-4 text-lg"
                                        >
                                            {totalBags > 0 ? 'Prenota Ora' : 'Seleziona almeno un bagaglio'}
                                        </PrimaryButton>

                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal successo (sostituibile con redirect o API reale) */}
            {showSuccess && <SuccessModal onClose={() => navigate('/')} />}
        </>
    );
};

export default ServiceDetailPageLuggage;
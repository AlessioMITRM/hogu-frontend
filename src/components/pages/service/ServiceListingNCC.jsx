import React, { useState, useMemo, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
    ArrowRight, MapPin, Users, Calendar, Clock, Search,
    CarFront, Star, ShieldCheck, Plane, Train,
    ChevronLeft, ChevronRight, ChevronDown, Navigation, Loader2, Minus, Plus
} from 'lucide-react';
import { slugify } from '../../../utils/slugify.js';
import ErrorModal from '../../ui/ErrorModal.jsx';
import LoadingScreen from "../../ui/LoadingScreen.jsx";
import { PageHeader } from '../../ui/PageHeader.jsx';

import { nccService } from '../../../api/apiClient.js';
import { CityAutocomplete } from '../../ui/CityAutocomplete.jsx';
import SafeImage from '../../ui/SafeImage.jsx';
import { HOGU_COLORS, HOGU_THEME } from '../../../config/theme.js';
import { createLocationPayload, getLocationData, processLocations } from "../../../utils/locationUtils.js";

const MOBILE_FONT = "font-['SF_Pro_Text',_Roboto,_'Inter',_system-ui,_sans-serif]";

const breadcrumbsItems = [
    { labelKey: 'breadcrumbs.home', href: '/' },
    { labelKey: 'breadcrumbs.ncc', href: '/service/ncc' }
];

// --- DATI ROTTE POPOLARI ---
const POPULAR_ROUTES_DATA = [
    {
        displayFromKey: 'ncc_listing.popular_routes.routes.roma_centro',
        displayToKey: 'ncc_listing.popular_routes.routes.fiumicino',
        price: '50',
        fromLocation: 'Roma, Lazio',
        fromAddress: 'Via del Corso, 18',
        toLocation: 'Fiumicino, Lazio',
        toAddress: "Aeroporto Leonardo da Vinci"
    },
    {
        displayFromKey: 'ncc_listing.popular_routes.routes.milano_duomo',
        displayToKey: 'ncc_listing.popular_routes.routes.malpensa',
        price: '95',
        fromLocation: 'Milano, Lombardia',
        fromAddress: 'Piazza del Duomo, 1',
        toLocation: 'Ferno, Lombardia',
        toAddress: 'Aeroporto Malpensa 2000, 1'
    },
    {
        displayFromKey: 'ncc_listing.popular_routes.routes.venezia',
        displayToKey: 'ncc_listing.popular_routes.routes.marco_polo',
        price: '45',
        fromLocation: 'Venezia, Veneto',
        fromAddress: 'Piazzale Roma, 1',
        toLocation: 'Tessera, Veneto',
        toAddress: 'Aeroporto Marco Polo'
    }
];

// --- GENERATORE SLOT 30 MINUTI ---
const generateTimeSlots = () => {
    const slots = [];
    for (let i = 0; i < 24; i++) {
        const hour = i.toString().padStart(2, '0');
        slots.push(`${hour}:00`);
        slots.push(`${hour}:30`);
    }
    return slots;
};
const TIME_SLOTS = generateTimeSlots();

const PRESET_LOCATIONS = [
    { labelKey: "ncc_listing.popular_routes.routes.fiumicino", city: "Fiumicino", address: "Aeroporto Leonardo da Vinci", type: "airport" },
    { labelKey: "ncc_listing.popular_routes.routes.ciampino", city: "Ciampino", address: "Aeroporto G.B. Pastine", type: "airport" },
    { labelKey: "ncc_listing.popular_routes.routes.malpensa", city: "Ferno", address: "Aeroporto Malpensa", type: "airport" },
    { labelKey: "ncc_listing.popular_routes.routes.linate", city: "Segrate", address: "Aeroporto Linate", type: "airport" },
    { labelKey: "ncc_listing.popular_routes.routes.roma_termini", city: "Roma", address: "Stazione Termini", type: "station" },
    { labelKey: "ncc_listing.popular_routes.routes.milano_centrale", city: "Milano", address: "Stazione Centrale", type: "station" }
];


// --- CONTAINER INPUT ---
const SearchInputContainer = ({ label, icon: Icon, children, className = '', required = false }) => (
    <div className={`flex flex-col gap-1 lg:gap-2 flex-1 min-w-0 md:min-w-[200px] ${className}`}>
        <label className={`flex items-center gap-1.5 ${MOBILE_FONT} text-[12px] leading-[16px] font-normal md:text-xs md:font-bold uppercase tracking-wide text-[${HOGU_COLORS.subtleText}] ml-1`}>
            <Icon size={12} className={`text-[${HOGU_COLORS.primary}]`} />
            {label} {required && <span className="text-red-500">*</span>}
        </label>
        <div className="flex gap-2 bg-white p-1 rounded-xl lg:rounded-2xl border border-gray-100 shadow-sm focus-within:ring-2 focus-within:ring-[#68B49B]/20 focus-within:border-[#68B49B] transition-all h-[42px] md:h-[50px] items-center">
            {children}
        </div>
    </div>
);

// --- CONTAINER MERGED INPUT (Desktop) ---
const MergedLocationInput = ({ label, icon: Icon, cityComponent, addressComponent }) => (
    <div className="flex flex-col gap-2 flex-1 min-w-0">
        <label className={`flex items-center gap-2 ${MOBILE_FONT} text-[12px] leading-[16px] font-normal md:text-xs md:font-bold uppercase tracking-wide text-[${HOGU_COLORS.subtleText}] ml-1`}>
            <Icon size={14} className={`text-[${HOGU_COLORS.primary}]`} />
            {label}
        </label>
        <div className="flex items-center bg-white p-1 rounded-2xl border border-gray-100 shadow-sm focus-within:ring-2 focus-within:ring-[#68B49B]/20 focus-within:border-[#68B49B] transition-all h-[50px] relative z-20">
            <div className="flex-1 h-full relative border-r border-gray-100 pr-2">
                {cityComponent}
            </div>
            <div className="flex-1 h-full pl-2">
                {addressComponent}
            </div>
        </div>
    </div>
);

// --- COMPONENTI UI ---
function IconButton({ onClick, icon: Icon, disabled, colorClass = "text-gray-600", sizeClass = "w-8 h-8" }) {
    return (
        <button
            onClick={(e) => { e.stopPropagation(); onClick(); }}
            disabled={disabled}
            type="button"
            className={`
                ${sizeClass} rounded-full flex items-center justify-center transition-all duration-200
                ${disabled
                    ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
                    : `bg-gray-50 hover:bg-[#68B49B] hover:text-white ${colorClass} shadow-sm hover:shadow-md`
                }
            `}
        >
            <Icon size={16} strokeWidth={3} />
        </button>
    );
}

function PassengerSelector({ value, onChange }) {
    const handleIncrement = () => onChange(value + 1);
    const handleDecrement = () => {
        if (value > 1) onChange(value - 1);
    };

    return (
        <div className="flex items-center justify-between w-full h-full px-2">
            <IconButton icon={Minus} onClick={handleDecrement} disabled={value <= 1} sizeClass="w-8 h-8" />
            <span className={`${MOBILE_FONT} text-[16px] leading-[24px] font-semibold text-gray-700 w-8 text-center md:text-lg md:font-bold`}>{value}</span>
            <IconButton icon={Plus} onClick={handleIncrement} colorClass="text-[#68B49B]" sizeClass="w-8 h-8" />
        </div>
    );
}

function MobileLocationSelector({ label, icon: Icon, city, address, onSelect, placeholder }) {
    const [isOpen, setIsOpen] = useState(false);
    const [tempCity, setTempCity] = useState(city);
    const [tempAddress, setTempAddress] = useState(address);

    useEffect(() => {
        if (isOpen) {
            setTempCity(city);
            setTempAddress(address);
        }
    }, [isOpen, city, address]);

    const handleConfirm = () => {
        onSelect(tempCity, tempAddress);
        setIsOpen(false);
    };

    const handlePresetClick = (preset) => {
        onSelect(preset.city, preset.address);
        setIsOpen(false);
    };

    return (
        <>
            <div className="flex flex-col gap-1 flex-1" onClick={() => setIsOpen(true)}>
                <label className={`flex items-center gap-1.5 ${MOBILE_FONT} text-[12px] leading-[16px] font-normal uppercase tracking-wide text-[${HOGU_COLORS.subtleText}] ml-1`}>
                    <Icon size={12} className={`text-[${HOGU_COLORS.primary}]`} />
                    {label}
                </label>
                <div className="bg-white p-2 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between h-[42px] active:scale-[0.98] transition-transform">
                    <div className="flex flex-col overflow-hidden w-full pr-2">
                        <span className={`${MOBILE_FONT} text-[16px] leading-[24px] font-semibold truncate ${city ? 'text-gray-800' : 'text-gray-400'}`}>
                            {city || placeholder}
                        </span>
                        {address && <span className={`${MOBILE_FONT} text-[14px] leading-[20px] font-normal text-gray-500 truncate leading-tight`}>{address}</span>}
                    </div>
                    <ChevronDown size={14} className="text-gray-400 flex-shrink-0" />
                </div>
            </div>

            {isOpen && createPortal(
                <div className="fixed inset-0 z-[99999] bg-white flex flex-col animate-in fade-in slide-in-from-bottom-10 duration-200">
                    <div className="px-4 py-4 border-b border-gray-100 flex items-center gap-3 shadow-sm z-10">
                        <button onClick={() => setIsOpen(false)} className="p-2 -ml-2 rounded-full hover:bg-gray-100">
                            <ChevronLeft size={24} className="text-gray-700" />
                        </button>
                        <h3 className={`${MOBILE_FONT} text-[18px] leading-[24px] font-semibold text-gray-800 md:text-lg md:font-bold`}>{t('ncc_listing.search.select_label', { label: label })}</h3>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-6 safe-area-bottom">
                        <div className="flex flex-col gap-4">
                            <CityAutocomplete
                                label={t('ncc_listing.search.city_label')}
                                icon={MapPin}
                                value={tempCity}
                                onChange={setTempCity}
                                placeholder={t('ncc_listing.search.city_search_placeholder')}
                                className="z-[50]"
                                labelClassName={`${MOBILE_FONT} !text-[12px] !leading-[16px] !font-normal !uppercase md:!text-xs md:!font-bold`}
                                inputClassName={`${MOBILE_FONT} text-[16px] leading-[24px] font-normal md:font-medium`}
                            />
                            <div className="flex flex-col gap-2">
                                <label className={`flex items-center gap-2 ${MOBILE_FONT} text-[12px] leading-[16px] font-normal uppercase tracking-wide text-gray-400 ml-1 md:text-xs md:font-bold`}>
                                    <Navigation size={14} className="text-[#68B49B]" /> {t('ncc_listing.search.address_label')}
                                </label>
                                <input
                                    type="text"
                                    className={`w-full p-4 bg-gray-50 rounded-xl border border-gray-200 focus:border-[#68B49B] outline-none ${MOBILE_FONT} text-[16px] leading-[24px] font-normal text-gray-700 md:font-medium`}
                                    placeholder={t('ncc_listing.search.address_placeholder')}
                                    value={tempAddress}
                                    onChange={(e) => setTempAddress(e.target.value)}
                                />
                            </div>
                        </div>

                        <div>
                            <p className={`${MOBILE_FONT} text-[12px] leading-[16px] font-normal text-gray-400 uppercase tracking-wide mb-3 md:text-xs md:font-bold`}>{t('ncc_listing.search.suggested_label')}</p>
                            <div className="grid grid-cols-2 gap-3">
                                {PRESET_LOCATIONS.map((p, i) => (
                                    <button
                                        key={i}
                                        onClick={() => handlePresetClick(p)}
                                        className="flex flex-col items-start p-3 rounded-xl border border-gray-100 bg-gray-50 hover:border-[#68B49B] hover:bg-[#F0FDF9] transition-all text-left"
                                    >
                                        <div className="flex items-center gap-2 mb-1">
                                            {p.type === 'airport' ? <Plane size={14} className="text-blue-500" /> : <Train size={14} className="text-orange-500" />}
                                            <span className={`${MOBILE_FONT} text-[12px] leading-[16px] font-semibold text-gray-800 md:text-xs md:font-bold`}>{p.labelKey ? t(p.labelKey) : p.label}</span>
                                        </div>
                                        <span className={`${MOBILE_FONT} text-[10px] text-gray-500 truncate w-full`}>{p.city}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="p-4 border-t border-gray-100 bg-white shadow-[0_-4px_20px_-8px_rgba(0,0,0,0.1)] z-10">
                        <PrimaryButton onClick={handleConfirm} className="w-full !rounded-xl !py-3">
                            {t('ncc_listing.search.confirm_selection')}
                        </PrimaryButton>
                    </div>
                </div>,
                document.body
            )}
        </>
    );
}

function PrimaryButton({ children, onClick, className = '', disabled = false, type = 'button', style = {} }) {
    return (
        <button type={type} onClick={onClick} disabled={disabled} style={style}
            className={`bg-[#68B49B] text-white ${HOGU_THEME.fontFamily} ${MOBILE_FONT}
        px-6 py-3 lg:px-8 lg:py-4 text-[16px] leading-[20px] font-semibold md:text-base md:font-bold lg:text-lg rounded-2xl transition-all duration-300 ease-out
        shadow-[0_8px_20px_-6px_rgba(104,180,155,0.5)] hover:shadow-[0_12px_25px_-8px_rgba(104,180,155,0.7)]
        hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed
        flex items-center justify-center gap-2 ${className}`}>
            {children}
        </button>
    );
}

// --- CARD RISULTATO ---
const NCCResultCard = ({ service, searchParams, navigate }) => {
    const { t } = useTranslation("home");
    const [isNavigating, setIsNavigating] = useState(false);
    const [isExpanded, setIsExpanded] = useState(true);

    const seoName = [
        searchParams?.fromCity,
        searchParams?.toCity,
        service.car || service.name
    ].filter(Boolean).join(' ');

    const handleOpenDetail = (e) => {
        if (e) e.stopPropagation();
        if (isNavigating) return;

        setIsNavigating(true);
        const slug = slugify(seoName);

        const queryParams = new URLSearchParams();
        if (searchParams?.date) queryParams.append("dateFrom", searchParams.date);
        if (searchParams?.time) queryParams.append("timeFrom", searchParams.time);
        if (service.distanceKm) queryParams.append("distanceKm", service.distanceKm);
        if (searchParams?.passengers) queryParams.append("totalPersons", searchParams.passengers);
        if (searchParams?.fromCity) queryParams.append("fromCity", searchParams.fromCity);
        if (searchParams?.toCity) queryParams.append("toCity", searchParams.toCity);
        if (searchParams?.fromAddress) queryParams.append("fromAddress", searchParams.fromAddress);
        if (searchParams?.toAddress) queryParams.append("toAddress", searchParams.toAddress);

        sessionStorage.setItem('nccSearchParams', JSON.stringify({
            ...searchParams,
            ...service
        }));

        // Piccolo delay per permettere all'UI di aggiornarsi col loader prima del cambio pagina
        setTimeout(() => {
            navigate(`/ncc/${slug}-${service.id}?${queryParams.toString()}`);
        }, 50);
    };

    const mainImage = (service.images && service.images.length > 0)
        ? service.images[0]
        : `https://images.unsplash.com/photo-1514890547357-a9ee288728e0?auto=format&fit=crop&w=800&q=80`;

    return (
        <div
            className={`group bg-white rounded-none md:rounded-3xl overflow-hidden flex flex-col md:flex-row border-y md:border border-gray-100 ${HOGU_THEME.shadowCard} transition-all duration-300 cursor-pointer hover:shadow-lg min-h-[180px] md:min-h-[240px] ${isNavigating ? 'opacity-80 pointer-events-none' : ''}`}
            onClick={handleOpenDetail}
        >
            <div
                className="md:w-1/3 h-40 md:h-64 relative overflow-hidden bg-gray-50 flex items-center justify-center md:p-4 isolate transform-gpu"
            >
                <SafeImage
                    src={mainImage}
                    alt={service.car}
                    className="w-full h-full object-cover transition-transform duration-700 scale-105 md:scale-100 md:group-hover:scale-105 backface-hidden rounded-none md:rounded-2xl shadow-none md:shadow-sm block"
                />
                {isNavigating && (
                    <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] flex items-center justify-center z-10">
                        <Loader2 className="w-10 h-10 text-[#68B49B] animate-spin" />
                    </div>
                )}
            </div>
            <div className="px-3 pb-3 pt-1.5 md:p-5 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-2 md:mb-1">
                    <div className="w-full">
                        <div className="flex justify-between items-start">
                            <div>
                                <h2 className={`${MOBILE_FONT} text-[22px] leading-[28px] font-semibold md:text-base md:text-xl md:font-bold text-slate-800 group-hover:text-[#68B49B] transition-colors leading-tight`}>
                                    {service.name}
                                </h2>
                                <p className={`${MOBILE_FONT} text-[14px] leading-[20px] font-normal text-slate-500 md:text-xs md:text-base md:font-medium`}>{service.car}</p>
                            </div>
                            {service.rating && service.rating > 0 && (
                                <div className="flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded-lg">
                                    <Star size={14} className="text-yellow-400 fill-yellow-400" />
                                    <span className={`${MOBILE_FONT} text-[14px] leading-[20px] font-semibold text-slate-700 md:text-sm md:font-bold`}>{service.rating}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap gap-2 md:gap-3 mt-2 md:mt-2">
                    <span className={`${MOBILE_FONT} flex items-center gap-1 text-[12px] leading-[16px] font-normal text-[#68B49B] bg-[#F0FDF9] px-2.5 py-1 rounded-md md:text-xs md:font-medium`}>
                        <Users size={12} /> Max {service.numberOfSeats || t('ncc_listing.card.max_pax')}
                    </span>
                    <span className={`${MOBILE_FONT} flex items-center gap-1 text-[12px] leading-[16px] font-normal text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md md:text-xs md:font-medium`}>
                        <ShieldCheck size={12} /> {t('ncc_listing.card.guaranteed')}
                    </span>
                </div>

                <div className="md:hidden border-t border-gray-200 my-1.5" />

                <div className={`mt-1 mb-1 md:my-2 pl-1 ${isExpanded ? 'block' : 'hidden md:block'}`}>
                    <p className={`${MOBILE_FONT} text-[14px] leading-[20px] font-normal text-gray-500 md:text-xs md:text-sm md:leading-relaxed mb-2 line-clamp-2`}>
                        {service.description || t('ncc_listing.card.default_description')}
                    </p>

                    {/* Mobile Price */}
                    <div className="mt-2 md:hidden">
                        <p className={`${MOBILE_FONT} text-[12px] leading-[16px] font-normal text-gray-400 mb-1`}>{t('ncc_listing.card.estimated_rate')}</p>
                        <div className="flex items-baseline gap-1">
                            <span className={`${MOBILE_FONT} text-[22px] leading-[28px] font-bold text-gray-800`}>€ {Math.floor(service.price)}</span>
                            <span className={`${MOBILE_FONT} text-[14px] leading-[20px] font-normal text-gray-500`}>,{(service.price % 1).toFixed(2).substring(2)}</span>
                        </div>
                        {service.pricePerKm && (
                            <div className={`${MOBILE_FONT} text-[14px] leading-[20px] font-normal text-slate-400 mt-1`}>
                                ~ € {service.pricePerKm} / km
                            </div>
                        )}
                        {service.distanceKm && (
                            <div className={`${MOBILE_FONT} text-[14px] leading-[20px] font-normal text-slate-400 mt-1`}>
                                ~ {Number(service.distanceKm).toFixed(2).replace('.', ',')} km
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex-grow" />

                {/* Mobile Toggle & Arrow */}
                <div className="md:hidden w-full flex items-center justify-between mt-2">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsExpanded(!isExpanded);
                        }}
                        className={`flex items-center gap-1 ${MOBILE_FONT} text-[16px] leading-[20px] font-semibold text-[#68B49B] bg-gray-50 px-3 py-1.5 rounded-full hover:bg-gray-100 transition-colors`}
                    >
                        {isExpanded ? (
                            <>
                                <ChevronDown size={14} className="rotate-180 transition-transform" />
                                {t('ncc_listing.card.hide')}
                            </>
                        ) : (
                            <>
                                <ChevronDown size={14} className="transition-transform" />
                                {t('ncc_listing.card.info_prices')}
                            </>
                        )}
                    </button>

                    <button
                        className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-[#68B49B] flex items-center justify-center text-white shadow-md active:scale-95 transition-all"
                        onClick={(e) => {
                            e.stopPropagation();
                            handleOpenDetail(e);
                        }}
                        disabled={isNavigating}
                    >
                        {isNavigating ? <Loader2 className="animate-spin" size={20} /> : <ArrowRight size={20} />}
                    </button>
                </div>

                {/* Desktop Footer */}
                <div className="hidden md:flex items-end justify-between mt-4 pt-3 border-t border-gray-50">
                    <div>
                        <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">{t('ncc_listing.card.estimated_rate')}</p>
                        <div className="flex items-baseline gap-1">
                            <span className="text-2xl font-extrabold text-gray-800">€ {Math.floor(service.price)}</span>
                            <span className="text-sm text-gray-500">,{(service.price % 1).toFixed(2).substring(2)}</span>
                        </div>
                        {service.pricePerKm && (
                            <div className="text-[10px] font-semibold text-slate-400 mt-0.5">
                                ~ € {service.pricePerKm} / km
                            </div>
                        )}
                        {service.distanceKm && (
                            <div className="text-[10px] font-semibold text-slate-400 mt-0.5">
                                ~ {Number(service.distanceKm).toFixed(2).replace('.', ',')} km
                            </div>
                        )}
                    </div>
                    <button
                        className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-[#68B49B] group-hover:bg-[#68B49B] group-hover:text-white transition-colors duration-300 shadow-sm"
                        onClick={handleOpenDetail}
                        title={t('ncc_listing.card.details_button')}
                        disabled={isNavigating}
                    >
                        {isNavigating ? <Loader2 className="animate-spin" size={20} /> : <ArrowRight size={20} />}
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- COMPONENTE PRINCIPALE ---
export const ServiceListingNCC = () => {
    const navigate = useNavigate();
    const [urlSearchParams] = useSearchParams();
    const { t, i18n } = useTranslation("home");

    const [services, setServices] = useState([]);
    const [hasSearched, setHasSearched] = useState(false);

    const [lastSearchPayload, setLastSearchPayload] = useState(null);
    const [lastSearchParams, setLastSearchParams] = useState(null);

    const [isLoading, setIsLoading] = useState(false);
    const [errorState, setErrorState] = useState({
        show: false,
        message: '',
        details: null
    });

    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const [itemsPerPage] = useState(10);

    // RIFERIMENTO PER SCROLL AUTOMATICO
    const resultsSectionRef = useRef(null);

    // --- CALCOLO DATA DI OGGI (PER MIN DATE) ---
    const today = new Date();
    const todayString = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');

    // Helper per calcolare orario default (Primo slot disponibile se oggi, altrimenti 12:00)
    const getDefaultTime = (dateStr) => {
        // Se la data è nel futuro (non oggi), default 12:00
        if (dateStr > todayString) return "12:00";

        // Se è oggi (o passato), calcola prossimo slot (+1h arrotondata)
        const now = new Date();
        const safeTime = new Date(now.getTime() + 60 * 60000);
        const minutes = safeTime.getMinutes();
        let hours = safeTime.getHours();

        let finalMinutes = "00";
        if (minutes < 30) {
            finalMinutes = "30";
        } else {
            finalMinutes = "00";
            hours += 1;
        }

        // Gestione overflow giorno
        if (hours >= 24) return "23:30";

        return `${String(hours).padStart(2, '0')}:${finalMinutes}`;
    };

    // Inizializzazione stato
    const [search, setSearch] = useState({
        fromCity: urlSearchParams.get('fromCity') || "",
        fromAddress: urlSearchParams.get('fromAddress') || "",
        toCity: urlSearchParams.get('toCity') || "",
        toAddress: urlSearchParams.get('toAddress') || "",
        dateOut: urlSearchParams.get('date') || todayString,
        timeOut: urlSearchParams.get('time') || getDefaultTime(urlSearchParams.get('date') || todayString),
        passengers: parseInt(urlSearchParams.get('passengers')) || 1
    });

    const primaryLocations = useMemo(() => {
        const data = getLocationData(i18n.language);
        return processLocations(data);
    }, [i18n.language]);

    const fallbackLang = i18n.language && i18n.language.startsWith('it') ? 'en' : 'it';

    const fallbackLocations = useMemo(() => {
        const data = getLocationData(fallbackLang);
        return processLocations(data);
    }, [fallbackLang]);

    const toFullCityLabel = (cityRegionStr) => {
        if (!cityRegionStr) return '';
        const parts = cityRegionStr.split(',').map(p => p.trim());
        if (parts.length < 2) return cityRegionStr;
        const city = parts[0];
        const region = parts[parts.length - 1];
        const match =
            primaryLocations.find(l => l.city === city && l.region === region) ||
            fallbackLocations.find(l => l.city === city && l.region === region);
        return match ? match.fullLabel : cityRegionStr;
    };

    const isValidCityLabel = (label) => {
        if (!label) return false;
        const trimmed = label.trim();
        if (!trimmed) return false;
        return (
            primaryLocations.some(loc => loc.fullLabel === trimmed) ||
            fallbackLocations.some(loc => loc.fullLabel === trimmed)
        );
    };

    const areCitiesValid =
        isValidCityLabel(search.fromCity) && isValidCityLabel(search.toCity);

    // --- LOGICA VALIDAZIONE ORARIO (+30 MINUTI) ---
    const isTimeSlotValid = (slot) => {
        // Se la data selezionata è nel futuro rispetto a oggi, ogni orario è valido
        if (search.dateOut > todayString) return true;

        // Se la data è nel passato (non dovrebbe accadere col min attr), disabilita
        if (search.dateOut < todayString) return false;

        // Se è OGGI, controlla l'ora
        const now = new Date();
        // Aggiungi 30 minuti a "adesso"
        const minTime = new Date(now.getTime() + 30 * 60000);

        const [slotHours, slotMinutes] = slot.split(':').map(Number);
        const slotDate = new Date();
        slotDate.setHours(slotHours, slotMinutes, 0, 0);

        return slotDate > minTime;
    };

    // Mapper DTO -> Frontend
    const mapServiceResponse = (dto) => {
        let kmRate = null;
        if (dto.distanceKm && dto.estimatedPrice) {
            kmRate = (dto.estimatedPrice / dto.distanceKm).toFixed(2);
        }
        const name = dto.name || t('ncc_listing.results.default_service_name', 'Servizio NCC');
        const carModel = dto.model || name;

        // Costruzione path immagini come in NCCServiceEditPage.jsx (/files/ncc/${id}/${filename})
        const images = (dto.images || []).map(filename => `/files/ncc/${dto.id}/${filename}`);

        return {
            id: dto.id,
            name: name,
            car: carModel,
            description: dto.description,
            numberOfSeats: dto.numberOfSeats,
            rating: dto.averageRating ? dto.averageRating.toFixed(1) : "0.0",
            price: dto.estimatedPrice,
            pricePerKm: kmRate,
            distanceKm: dto.distanceKm,
            images: images,
            type: dto.serviceType || "NCC"
        };
    };

    const fetchNccServices = async (payload, pageIndex, shouldScroll = false) => {
        setIsLoading(true);
        setErrorState({ ...errorState, show: false });
        try {
            const response = await nccService.advancedSearchNcc(payload, pageIndex, itemsPerPage);
            const responseBody = response.data || response;
            const contentList = responseBody.content || [];
            setServices(contentList.map(mapServiceResponse));
            setTotalPages(responseBody.totalPages || 0);
            setTotalElements(responseBody.totalElements || 0);
            setHasSearched(true);
            setCurrentPage(pageIndex + 1);

            if (shouldScroll) {
                setTimeout(() => {
                    if (resultsSectionRef.current) {
                        const yOffset = -120;
                        const element = resultsSectionRef.current;
                        const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
                        window.scrollTo({ top: y, behavior: 'smooth' });
                    }
                }, 100);
            }

        } catch (err) {
            console.error("Errore durante la ricerca NCC:", err);
            setErrorState({
                show: true,
                message: t('ncc_listing.results.not_found'),
                details: err.response?.data || err.message
            });
            setServices([]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const hasRequiredParams =
            search.fromCity &&
            search.toCity &&
            search.dateOut &&
            search.timeOut;

        if (hasRequiredParams) {
            // Clean locations
            const cleanFromCity = search.fromCity || '';
            const cleanToCity = search.toCity || '';

            // Format Date to dd/MM/yyyy
            let formattedDate = search.dateOut;
            if (formattedDate && formattedDate.includes('-')) {
                const [year, month, day] = formattedDate.split('-');
                formattedDate = `${day}/${month}/${year}`;
            }

            const payload = {
                departureAddress: createLocationPayload(cleanFromCity, search.fromAddress || cleanFromCity, "NCC")[0],
                destinationAddress: createLocationPayload(cleanToCity, search.toAddress || cleanToCity, "NCC")[0],
                departureDate: formattedDate,
                departureTime: search.timeOut,
                passengers: parseInt(search.passengers, 10) || 1
            };

            setLastSearchPayload(payload);
            setLastSearchParams({
                tripType: "oneway",
                fromCity: search.fromCity,
                fromAddress: search.fromAddress,
                toCity: search.toCity,
                toAddress: search.toAddress,
                passengers: search.passengers,
                date: search.dateOut,
                time: search.timeOut,
            });

            fetchNccServices(payload, 0, true);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const executeSearch = async (dataToUse, shouldScroll = false) => {
        const currentData = dataToUse || search;
        if (!currentData.fromCity || !currentData.fromAddress || !currentData.toCity || !currentData.toAddress || !currentData.dateOut || !currentData.timeOut) {
            setErrorState({
                show: true,
                message: t('ncc_listing.search.validation_error', "Per favore, compila tutti i campi richiesti.")
            });
            return;
        }

        // Clean locations
        const cleanFromCity = currentData.fromCity || '';
        const cleanToCity = currentData.toCity || '';

        // Format Date to dd/MM/yyyy
        let formattedDate = currentData.dateOut;
        if (formattedDate && formattedDate.includes('-')) {
            const [year, month, day] = formattedDate.split('-');
            formattedDate = `${day}/${month}/${year}`;
        }

        const payload = {
            departureAddress: createLocationPayload(cleanFromCity, currentData.fromAddress || cleanFromCity, "NCC")[0],
            destinationAddress: createLocationPayload(cleanToCity, currentData.toAddress || cleanToCity, "NCC")[0],
            departureDate: formattedDate,
            departureTime: currentData.timeOut,
            passengers: parseInt(currentData.passengers, 10) || 1
        };
        setLastSearchPayload(payload);
        setLastSearchParams({
            tripType: "oneway",
            fromCity: currentData.fromCity,
            fromAddress: currentData.fromAddress,
            toCity: currentData.toCity,
            toAddress: currentData.toAddress,
            passengers: currentData.passengers,
            date: currentData.dateOut,
            time: currentData.timeOut,
        });
        const queryString = new URLSearchParams({
            fromCity: currentData.fromCity,
            fromAddress: currentData.fromAddress,
            toCity: currentData.toCity,
            toAddress: currentData.toAddress,
            date: currentData.dateOut,
            time: currentData.timeOut,
            passengers: currentData.passengers.toString(),
        }).toString();
        navigate(`/service/ncc?${queryString}`, { replace: true });

        await fetchNccServices(payload, 0, shouldScroll);
    };

    const handleFormSubmit = (e) => {
        if (e) e.preventDefault();
        if (!areCitiesValid) {
            setErrorState({
                show: true,
                message: t('ncc_listing.search.invalid_city', "Seleziona città valide dall'elenco.")
            });
            return;
        }
        executeSearch(search, true);
    };

    const handlePopularRouteClick = (route) => {
        const now = new Date();
        // Calcoliamo un orario valido per la rotta popolare (adesso + 1 ora per sicurezza)
        const safeTime = new Date(now.getTime() + 60 * 60000);
        const hours = String(safeTime.getHours()).padStart(2, '0');
        const minutes = safeTime.getMinutes() < 30 ? '30' : '00';
        // Se minuti > 30, andiamo all'ora successiva :00 (logica semplificata)
        const finalTime = safeTime.getMinutes() >= 30
            ? `${String(safeTime.getHours() + 1).padStart(2, '0')}:00`
            : `${hours}:${minutes}`;

        const normalizedFromCity = toFullCityLabel(route.fromLocation);
        const normalizedToCity = toFullCityLabel(route.toLocation);

        const newSearchData = {
            ...search,
            fromCity: normalizedFromCity,
            fromAddress: route.fromAddress,
            toCity: normalizedToCity,
            toAddress: route.toAddress,
            dateOut: search.dateOut || todayString,
            timeOut: finalTime,
            passengers: search.passengers || 1
        };
        setSearch(newSearchData);
        executeSearch(newSearchData, true);
    };

    const handlePageChange = async (newPageNumber) => {
        if (!lastSearchPayload) return;
        const apiPageIndex = newPageNumber - 1;
        await fetchNccServices(lastSearchPayload, apiPageIndex, true);
    };

    const Pagination = () => {
        if (totalPages <= 1) return null;
        return (
            <div className="flex items-center justify-center gap-2 mt-12">
                <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1 || isLoading}
                    className={`w-10 h-10 flex items-center justify-center rounded-full border transition-all ${currentPage === 1 ? 'border-gray-100 text-gray-300 cursor-not-allowed' : 'border-gray-200 text-gray-600 hover:border-[#68B49B] hover:text-[#68B49B] bg-white hover:shadow-md'}`}
                >
                    <ChevronLeft size={20} />
                </button>
                <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((number) => {
                        if (totalPages > 7 && Math.abs(currentPage - number) > 2 && number !== 1 && number !== totalPages) {
                            if (Math.abs(currentPage - number) === 3) return <span key={number} className="text-gray-300">...</span>;
                            return null;
                        }
                        return (
                            <button
                                key={number}
                                onClick={() => handlePageChange(number)}
                                disabled={isLoading}
                                className={`w-10 h-10 rounded-full font-semibold ${MOBILE_FONT} text-[16px] leading-[20px] transition-all md:font-bold md:text-sm ${currentPage === number ? 'bg-[#68B49B] text-white shadow-lg shadow-[#68B49B]/30' : 'text-gray-600 hover:bg-gray-100'}`}
                            >
                                {number}
                            </button>
                        );
                    })}
                </div>
                <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages || isLoading}
                    className={`w-10 h-10 flex items-center justify-center rounded-full border transition-all ${currentPage === totalPages ? 'border-gray-100 text-gray-300 cursor-not-allowed' : 'border-gray-200 text-gray-600 hover:border-[#68B49B] hover:text-[#68B49B] bg-white hover:shadow-md'}`}
                >
                    <ChevronRight size={20} />
                </button>
            </div>
        );
    };

    return (
        <div className={`min-h-screen bg-[#F8FAFC] pb-20 ${HOGU_THEME.fontFamily}`}>
            <PageHeader
                breadcrumbs={breadcrumbsItems.map(item => ({ ...item, label: t(item.labelKey) }))}
                subtitle={t('ncc_listing.header.subtitle')}
                titlePart1={t('ncc_listing.header.title_part1')}
                titlePart2={t('ncc_listing.header.title_part2')}
                description={t('ncc_listing.header.description')}
                t={t}
            />

            <div className="max-w-7xl mx-auto px-4 lg:px-8 -mt-20 md:-mt-12 relative z-20">
                <div className={`relative z-50 bg-[#F1F5F9] rounded-[2rem] p-4 lg:p-5 ${HOGU_THEME.shadowFloat} border border-white/50 backdrop-blur-sm`}>
                    <form onSubmit={handleFormSubmit} className="flex flex-col gap-1 lg:gap-4">
                        <div className="flex flex-col gap-2 lg:gap-4">

                            {/* DESKTOP: Compact Locations Row */}
                            <div className="hidden lg:flex lg:gap-4">
                                {/* Departure Group */}
                                <MergedLocationInput
                                    label={t('ncc_listing.search.departure_point', "Partenza")}
                                    icon={MapPin}
                                    cityComponent={
                                        <CityAutocomplete
                                            label={null}
                                            value={search.fromCity}
                                            onChange={(val) => setSearch({ ...search, fromCity: val })}
                                            placeholder={t('ncc_listing.search.city_label')}
                                            className="!gap-0 h-full"
                                            inputContainerClassName="!border-none !shadow-none !bg-transparent !p-0 !h-full"
                                            inputClassName="!px-2"
                                        />
                                    }
                                    addressComponent={
                                        <input
                                            type="text"
                                            className="w-full h-full px-2 bg-transparent border-none focus:ring-0 text-base font-medium text-gray-700 outline-none placeholder:text-gray-300"
                                            placeholder={t('ncc_listing.search.address_label')}
                                            value={search.fromAddress}
                                            onChange={(e) => setSearch({ ...search, fromAddress: e.target.value })}
                                            required
                                        />
                                    }
                                />

                                {/* Destination Group */}
                                <MergedLocationInput
                                    label={t('ncc_listing.search.destination_point', "Destinazione")}
                                    icon={MapPin}
                                    cityComponent={
                                        <CityAutocomplete
                                            label={null}
                                            value={search.toCity}
                                            onChange={(val) => setSearch({ ...search, toCity: val })}
                                            placeholder={t('ncc_listing.search.city_label')}
                                            className="!gap-0 h-full"
                                            inputContainerClassName="!border-none !shadow-none !bg-transparent !p-0 !h-full"
                                            inputClassName="!px-2"
                                        />
                                    }
                                    addressComponent={
                                        <input
                                            type="text"
                                            className="w-full h-full px-2 bg-transparent border-none focus:ring-0 text-base font-medium text-gray-700 outline-none placeholder:text-gray-300"
                                            placeholder={t('ncc_listing.search.address_label')}
                                            value={search.toAddress}
                                            onChange={(e) => setSearch({ ...search, toAddress: e.target.value })}
                                            required
                                        />
                                    }
                                />
                            </div>
                        </div>

                        {/* MOBILE: Departure */}
                        <div className="lg:hidden w-full">
                            <MobileLocationSelector
                                label={t('ncc_listing.search.departure_point', "Partenza")}
                                icon={MapPin}
                                city={search.fromCity}
                                address={search.fromAddress}
                                onSelect={(c, a) => setSearch({ ...search, fromCity: c, fromAddress: a })}
                                placeholder={t('ncc_listing.search.departure_placeholder')}
                            />
                        </div>

                        {/* MOBILE: Destination */}
                        <div className="lg:hidden w-full">
                            <MobileLocationSelector
                                label={t('ncc_listing.search.destination_point', "Destinazione")}
                                icon={MapPin}
                                city={search.toCity}
                                address={search.toAddress}
                                onSelect={(c, a) => setSearch({ ...search, toCity: c, toAddress: a })}
                                placeholder={t('ncc_listing.search.destination_placeholder')}
                            />
                        </div>

                        <div className="flex flex-col lg:flex-row gap-2">
                            <div className="grid grid-cols-2 lg:flex lg:flex-1 w-full gap-2">
                                <SearchInputContainer label={t('ncc_listing.search.date_out')} icon={Calendar}>
                                    <input
                                        type="date"
                                        min={todayString}
                                        className={`w-full h-full px-2 lg:px-3 bg-transparent border-none focus:ring-0 ${MOBILE_FONT} text-[16px] leading-[24px] font-normal text-gray-700 outline-none cursor-pointer md:text-sm md:font-medium`}
                                        value={search.dateOut}
                                        onChange={(e) => {
                                            const newDate = e.target.value;
                                            let newTime = search.timeOut;
                                            if (newDate === todayString) {
                                                const [h, m] = newTime.split(':').map(Number);
                                                const slotDate = new Date();
                                                slotDate.setHours(h, m, 0, 0);
                                                const now = new Date();
                                                if (slotDate < new Date(now.getTime() + 30 * 60000)) {
                                                    newTime = getDefaultTime(newDate);
                                                }
                                            }
                                            setSearch({ ...search, dateOut: newDate, timeOut: newTime });
                                        }}
                                        required
                                    />
                                </SearchInputContainer>

                                <SearchInputContainer label={t('ncc_listing.search.time')} icon={Clock}>
                                    <select
                                        className={`w-full h-full px-2 lg:px-3 bg-transparent border-none focus:ring-0 ${MOBILE_FONT} text-[16px] leading-[24px] font-normal text-gray-700 outline-none cursor-pointer text-center appearance-none md:text-sm md:font-medium`}
                                        value={search.timeOut}
                                        onChange={(e) => setSearch({ ...search, timeOut: e.target.value })}
                                        required
                                    >
                                        {TIME_SLOTS.map(slot => {
                                            const isValid = isTimeSlotValid(slot);
                                            return (
                                                <option key={slot} value={slot} disabled={!isValid} className={!isValid ? 'text-gray-300 bg-gray-50' : ''}>
                                                    {slot}
                                                </option>
                                            );
                                        })}
                                    </select>
                                </SearchInputContainer>
                            </div>

                            <div className="grid grid-cols-2 lg:flex lg:flex-row lg:w-auto gap-2 lg:gap-4 w-full">
                                <SearchInputContainer label={t('ncc_listing.search.passengers')} icon={Users} className="w-full lg:w-40 flex-1 lg:flex-none">
                                    <PassengerSelector
                                        value={search.passengers}
                                        onChange={(val) => setSearch({ ...search, passengers: val })}
                                    />
                                </SearchInputContainer>

                                {/* Bottone Cerca — spacer per allineamento mobile */}
                                <div className="w-full lg:w-auto flex-1 lg:flex-none flex flex-col gap-1 lg:gap-3">
                                    <label className={`hidden lg:flex items-center gap-2 text-[10px] md:text-xs font-bold uppercase tracking-wide text-transparent ml-1 select-none`}>
                                        <Search size={14} />
                                        {t('ncc_listing.search.search_button')}
                                    </label>
                                    <span className="lg:hidden text-[9px] font-bold uppercase tracking-wide opacity-0 select-none ml-1">_</span>
                                    <PrimaryButton type="submit" disabled={isLoading || !areCitiesValid} className="w-full h-[42px] lg:!h-[50px] !rounded-xl lg:!rounded-2xl !px-4 !shadow-sm hover:!shadow-md !text-sm lg:!text-lg bg-[#68B49B] hover:bg-[#5aa38d]">
                                        {isLoading ? (
                                            <><Loader2 className="animate-spin" size={16} />{t('ncc_listing.search.searching')}</>
                                        ) : (
                                            <><Search size={16} />{t('ncc_listing.search.search_button')}</>
                                        )}
                                    </PrimaryButton>
                                </div>
                            </div>
                        </div>
                    </form>
                </div>

                {!hasSearched && !isLoading && (
                    <section className="mt-6 lg:mt-10 mb-4 lg:mb-8">
                        <h2 className="text-sm lg:text-2xl font-bold text-slate-800 mb-2 lg:mb-4">{t('ncc_listing.popular_routes.title')}</h2>
                        {/* Mobile: lista verticale compatta | Desktop: griglia 3 colonne */}
                        <div className="flex flex-col lg:grid lg:grid-cols-3 gap-2 lg:gap-4">
                            {POPULAR_ROUTES_DATA.map((route, idx) => (
                                <div
                                    key={idx}
                                    onClick={() => handlePopularRouteClick(route)}
                                    className="bg-white px-3 py-2 lg:p-4 rounded-xl lg:rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer flex items-center justify-between group"
                                >
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-7 h-7 lg:w-10 lg:h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-[#F0FDF9] group-hover:text-[#68B49B] transition-colors shrink-0">
                                            <Plane size={14} className="lg:w-5 lg:h-5" />
                                        </div>
                                        <div>
                                            <p className={`${MOBILE_FONT} text-[16px] leading-[20px] font-semibold text-gray-700 leading-tight md:text-xs md:text-sm md:font-bold`}>{t(route.displayFromKey)}</p>
                                            <p className={`${MOBILE_FONT} text-[12px] leading-[16px] font-normal text-gray-400 md:text-[10px] md:text-xs`}>{t('ncc_listing.popular_routes.to', { destination: t(route.displayToKey) })}</p>
                                        </div>
                                    </div>
                                    <div className="text-right shrink-0 ml-2">
                                        <p className={`${MOBILE_FONT} text-[12px] leading-[16px] font-normal text-gray-400 md:text-[9px] md:text-xs`}>{t('ncc_listing.popular_routes.from')}</p>
                                        <p className={`${MOBILE_FONT} text-[18px] leading-[24px] font-semibold text-[#68B49B] md:text-sm md:text-lg md:font-bold`}>€{route.price}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {isLoading && !hasSearched && (
                    <div className="mt-12 flex flex-col gap-3 md:gap-4 animate-pulse">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-44 md:h-48 bg-gray-200 rounded-2xl md:rounded-3xl w-full"></div>
                        ))}
                    </div>
                )}

                {hasSearched && (
                    <div className="mt-6 md:mt-12" id="ncc-results-section" ref={resultsSectionRef}>
                        <div className="flex items-center justify-between mb-4 md:mb-8">
                            <h2 className={`${MOBILE_FONT} text-[22px] leading-[28px] font-semibold text-slate-800 md:text-lg md:text-2xl md:font-bold`}>
                                <span className="text-[#68B49B]">{totalElements}</span> {t('ncc_listing.results.available_vehicles', { count: totalElements })}
                            </h2>
                            <span className={`${MOBILE_FONT} text-[14px] leading-[20px] font-normal text-gray-400 md:text-sm md:font-medium`}>
                                {t('ncc_listing.results.page_of', { current: currentPage, total: totalPages > 0 ? totalPages : 1 })}
                            </span>
                        </div>

                        {services.length === 0 ? (
                            <div className="text-center py-10 md:py-20 bg-white rounded-2xl md:rounded-3xl border border-gray-100">
                                <CarFront size={48} className="mx-auto text-gray-300 mb-4" />
                                <h3 className={`${MOBILE_FONT} text-[18px] leading-[24px] font-semibold text-gray-600 md:text-xl md:font-bold`}>{t('ncc_listing.results.not_found')}</h3>
                                <p className={`${MOBILE_FONT} text-[14px] leading-[20px] font-normal text-gray-400`}>{t('ncc_listing.results.no_results_retry')}</p>
                            </div>
                        ) : (
                            <div className={`${isLoading ? 'opacity-50 pointer-events-none' : 'opacity-100'} transition-opacity duration-200`}>
                                <div className="flex flex-col gap-3 md:gap-6">
                                    {services.map((service) => (
                                        <NCCResultCard
                                            key={service.id}
                                            service={service}
                                            searchParams={lastSearchParams}
                                            navigate={navigate}
                                        />
                                    ))}
                                </div>

                                <Pagination />
                            </div>
                        )}
                    </div>
                )}
            </div>

            <LoadingScreen isLoading={isLoading} />

            {errorState.show && (
                <ErrorModal
                    message={errorState.message}
                    details={errorState.details}
                    onClose={() => setErrorState({ ...errorState, show: false })}
                />
            )}
        </div>
    );
};
export default ServiceListingNCC;

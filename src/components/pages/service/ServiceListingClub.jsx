import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
    Search, Calendar, Ticket, Star, MapPin, Music, ArrowRight, Check, Armchair,
    ChevronLeft, ChevronRight, ChevronDown,
    PartyPopper, Flame, Loader2, Clock,
    Disc, Speaker, Mic2, GlassWater
} from 'lucide-react';
import { Breadcrumbs } from '../../ui/Breadcrumbs.jsx';
import { PageHeader } from '../../ui/PageHeader.jsx';
import { PopularDestinations } from '../../ui/PopularDestinations.jsx';
import { clubService } from '../../../api/apiClient.js';
import LoadingScreen from '../../ui/LoadingScreen.jsx';
import ErrorModal from '../../ui/ErrorModal.jsx';
import SafeImage from '../../ui/SafeImage.jsx';


import { CityAutocomplete } from "../../ui/CityAutocomplete.jsx";
import { HOGU_COLORS, HOGU_THEME } from '../../../config/theme.js';
import { slugify } from '../../../utils/slugify.js';
import { createLocationPayload } from "../../../utils/locationUtils.js";


const breadcrumbsItems = [
    { labelKey: 'breadcrumbs.home', href: '/' },
    { labelKey: 'breadcrumbs.club', href: '/service/club' }
];

// --- COMPONENTI UI ---

function Tag({ children, className = '' }) {
    return (
        <span className={`
      bg-purple-50 text-purple-700 border border-purple-100
      px-3 py-1 text-[11px] uppercase tracking-wider font-bold rounded-full inline-flex items-center
      ${className}
    `}>
            {children}
        </span>
    );
}

function PrimaryButton({ children, onClick, className = '', disabled = false, type = 'button', style = {} }) {
    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled}
            style={style}
            className={`
        bg-[#68B49B] text-white ${HOGU_THEME.fontFamily}
        px-6 py-3 lg:px-8 lg:py-4 text-base lg:text-lg font-bold rounded-2xl transition-all duration-300 ease-out
        shadow-[0_8px_20px_-6px_rgba(104,180,155,0.5)] 
        hover:shadow-[0_12px_25px_-8px_rgba(104,180,155,0.7)]
        hover:-translate-y-0.5 active:translate-y-0
        disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none disabled:translate-y-0
        flex items-center justify-center gap-2
        ${className}
      `}
        >
            {children}
        </button>
    );
}

const SearchInputContainer = ({ label, icon: Icon, children, className = '' }) => (
    <div className={`flex flex-col gap-1 lg:gap-3 flex-1 min-w-0 ${className}`}>
        <label className={`flex items-center gap-1.5 text-[9px] md:text-xs font-bold uppercase tracking-wide text-[${HOGU_COLORS.subtleText}] ml-1`}>
            <Icon size={12} className={`text-[${HOGU_COLORS.primary}]`} />
            {label}
        </label>
        <div className="flex gap-2 bg-white p-1 rounded-xl border border-gray-100 shadow-sm focus-within:ring-2 focus-within:ring-[#68B49B]/20 focus-within:border-[#68B49B] transition-all h-[42px] md:h-[60px] items-center">
            {children}
        </div>
    </div>
);

// --- CARD DESTINAZIONE CITTA' ---
/* RIMOSSO - Sostituito da PopularDestinations */

// --- CARD RISULTATO CLUB ---
const ClubResultCard = ({ service, onDetailClick, isTableReserved, isToday }) => {
    const { t, i18n } = useTranslation("home");
    const [isExpanded, setIsExpanded] = useState(false);

    const getThemeIcon = (theme) => {
        if (!theme) return PartyPopper;
        const normalizedTheme = theme.toLowerCase();
        if (normalizedTheme.includes('commerciale') || normalizedTheme.includes('techno') || normalizedTheme.includes('hardstyle') || normalizedTheme.includes('revival')) return Disc;
        if (normalizedTheme.includes('house') || normalizedTheme.includes('tech house') || normalizedTheme.includes('edm') || normalizedTheme.includes('festival')) return Speaker;
        if (normalizedTheme.includes('reggaeton') || normalizedTheme.includes('latin') || normalizedTheme.includes('rock') || normalizedTheme.includes('indie')) return Music;
        if (normalizedTheme.includes('hip hop') || normalizedTheme.includes('trap') || normalizedTheme.includes('live') || normalizedTheme.includes('band')) return Mic2;
        if (normalizedTheme.includes('jazz') || normalizedTheme.includes('lounge')) return GlassWater;
        return Music;
    };

    const ThemeIcon = getThemeIcon(service.theme);

    const currentLang = i18n.language || 'it';
    const localeInfo = service.locales?.find(l => l.language === currentLang) || service.locales?.[0];

    let locationString = 'Posizione non disponibile';
    if (service.address && service.city) {
        locationString = `${service.address}, ${service.city}`;
    } else if (localeInfo) {
        locationString = `${localeInfo.address}, ${localeInfo.city}`;
    } else if (service.address || service.city) {
        locationString = service.address || service.city;
    }

    // DEBUG: Check service structure for missing IDs
    useEffect(() => {
        if (service.images?.length > 0 && !service.clubServiceId && !service.clubId && !service.providerId) {
            console.warn("ServiceListingClub: Missing clubServiceId for service. Available keys:", Object.keys(service));
        }
    }, [service]);

    // Tentativo di recuperare il clubId da vari campi possibili
    // Espandiamo la ricerca anche a possibili oggetti annidati o providerId
    const clubId = service.clubServiceId || service.clubId || service.providerId || service.userId || service.club?.id;

    let bgImage = `https://placehold.co/800x600/${HOGU_COLORS.dark.substring(1)}/${HOGU_COLORS.primary.substring(1)}?text=${encodeURIComponent(service.name)}`;

    if (service.images && service.images.length > 0) {
        const firstImage = service.images[0];

        // Path allineato con EventServiceEditPage.jsx: /files/club/{clubId}/event/{eventId}/{filename}
        if (clubId) {
            bgImage = `/files/club/${clubId}/event/${service.id}/${firstImage}`;
        } else if (firstImage.startsWith('http')) {
            bgImage = firstImage;
        }
    }

    // Calculate prices from pricingConfigurations if available
    let computedManPrice = null;
    let computedWomanPrice = null;
    let computedTablePrice = null;

    if (service.pricingConfigurations && service.pricingConfigurations.length > 0) {
        const manPrices = service.pricingConfigurations
            .filter(pc => pc.pricingType === 'MALE')
            .map(pc => pc.price);
        if (manPrices.length > 0) computedManPrice = Math.min(...manPrices);

        const womanPrices = service.pricingConfigurations
            .filter(pc => pc.pricingType === 'FEMALE')
            .map(pc => pc.price);
        if (womanPrices.length > 0) computedWomanPrice = Math.min(...womanPrices);

        const tablePrices = service.pricingConfigurations
            .filter(pc => pc.pricingType === 'VIP_TABLE' || pc.pricingType === 'STANDARD_TABLE')
            .map(pc => pc.price);
        if (tablePrices.length > 0) computedTablePrice = Math.min(...tablePrices);
    }

    const manPrice = computedManPrice !== null ? computedManPrice : (service.priceMan !== undefined && service.priceMan !== null ? service.priceMan : service.price);
    const womanPrice = computedWomanPrice !== null ? computedWomanPrice : (service.priceWoman !== undefined && service.priceWoman !== null ? service.priceWoman : service.price);
    const tablePrice = computedTablePrice !== null ? computedTablePrice : (service.tableMinPrice !== undefined ? service.tableMinPrice : service.priceMinSpend);

    // Formattazione Date Evento
    const formatDateRange = (start, end) => {
        if (!start) return null;
        const startDate = new Date(start);
        const endDate = end ? new Date(end) : null;

        const dateOptions = { weekday: 'short', day: 'numeric', month: 'short' };
        const timeOptions = { hour: '2-digit', minute: '2-digit' };

        const startDay = startDate.toLocaleDateString('it-IT', dateOptions);
        const startTime = startDate.toLocaleTimeString('it-IT', timeOptions);

        if (!endDate) return `${startDay} • ${startTime}`;

        const endDay = endDate.toLocaleDateString('it-IT', dateOptions);
        const endTime = endDate.toLocaleTimeString('it-IT', timeOptions);

        if (startDate.toDateString() === endDate.toDateString()) {
            return `${startDay} • ${startTime} - ${endTime}`;
        } else {
            // Se finisce il giorno dopo ma entro le 6 del mattino, lo consideriamo "continuo" visivamente ma mostriamo l'orario di fine
            return `${startDay}, ${startTime} - ${endDay}, ${endTime}`;
        }
    };

    const timeString = formatDateRange(service.startTime, service.endTime);

    return (
        <div
            className={`
          bg-white rounded-none md:rounded-3xl overflow-hidden flex flex-col md:flex-row border-y md:border border-gray-100 
          ${HOGU_THEME.shadowCard} transition-all duration-300 hover:-translate-y-1 cursor-pointer group
          min-h-[180px] md:min-h-[240px]
        `}
            onClick={() => onDetailClick(service)}
        >
            <div className="md:w-1/3 h-40 md:h-72 relative overflow-hidden bg-gray-50 flex items-center justify-center md:p-4">
                <div className="absolute top-4 left-4 z-10 flex flex-col items-start gap-2">
                    <Tag className="bg-white/95 backdrop-blur !border-none text-gray-800 shadow-sm !text-[#68B49B]">
                        {service.theme ? (
                            <>
                                <ThemeIcon size={12} className="mr-1" /> {service.theme}
                            </>
                        ) : (
                            <>
                                <PartyPopper size={12} className="mr-1" /> {service.serviceType || 'CLUB'}
                            </>
                        )}
                    </Tag>
                    {isToday && (
                        <Tag className="bg-red-500/90 backdrop-blur !border-none !text-white shadow-sm animate-pulse">
                            <Flame size={12} className="mr-1 fill-current" /> OGGI
                        </Tag>
                    )}
                </div>
                <SafeImage
                    src={bgImage}
                    alt={service.name}
                    className="w-full h-full object-cover transition-transform duration-700 scale-105 md:scale-100 md:group-hover:scale-105 backface-hidden rounded-none md:rounded-2xl block"
                    style={{ backfaceVisibility: 'hidden' }}
                />
            </div>

            <div className="px-3 pb-3 pt-1.5 md:p-8 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-2 md:mb-1">
                    <h2 className={`text-base md:text-2xl font-bold ${HOGU_THEME.text} group-hover:text-[#68B49B] transition-colors uppercase leading-tight`}>{service.name}</h2>
                </div>
                <div className={`text-[11px] md:text-sm mt-0 flex items-center flex-wrap gap-3 ${HOGU_THEME.subtleText}`}>
                    <span className="flex items-center gap-1">
                        <MapPin size={12} className="text-[#68B49B]" /> {locationString}
                    </span>
                    {timeString && (
                        <span className="flex items-center gap-1.5 text-slate-600 font-semibold bg-slate-50 px-2.5 py-1 rounded-full border border-slate-100 shadow-sm whitespace-nowrap">
                            <Clock size={12} className="text-[#68B49B]" />
                            <span className="capitalize">{timeString}</span>
                        </span>
                    )}
                </div>
                <div className="md:hidden border-t border-gray-200 my-1.5" />

                <div className={`mt-1 mb-1 md:my-2 pl-1 ${isExpanded ? 'block' : 'hidden md:block'}`}>
                    <p className="text-gray-500 text-xs md:text-sm leading-relaxed line-clamp-2 md:line-clamp-3">
                        {service.description}
                    </p>
                </div>

                <div className="flex-grow" />

                {/* Mobile "Show More" Button & Detail Arrow */}
                <div className="md:hidden w-full flex items-center justify-between mt-2">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsExpanded(!isExpanded);
                        }}
                        className="flex items-center gap-1 text-[11px] font-bold text-[#68B49B] uppercase tracking-wide bg-gray-50 px-3 py-1.5 rounded-full hover:bg-gray-100 transition-colors"
                    >
                        {isExpanded ? (
                            <>
                                <ChevronDown size={14} className="rotate-180 transition-transform" />
                                Nascondi
                            </>
                        ) : (
                            <>
                                <ChevronDown size={14} className="transition-transform" />
                                Info & Prezzi
                            </>
                        )}
                    </button>

                    <button
                        className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-[#68B49B] flex items-center justify-center text-white shadow-md active:scale-95 transition-all"
                        onClick={(e) => {
                            e.stopPropagation();
                            onDetailClick(service);
                        }}
                    >
                        <ArrowRight size={20} />
                    </button>
                </div>

                <div className={`
             mt-auto pt-2 md:pt-3 border-t border-gray-50 w-full flex items-end justify-between
             ${isExpanded ? 'block' : 'hidden md:flex'}
          `}>
                    <div className="flex flex-col md:flex-row gap-3 md:gap-8 flex-1">
                        <div className={`${isTableReserved ? 'opacity-50 grayscale' : 'opacity-100'} transition-all`}>
                            <p className="text-[10px] text-black uppercase font-bold tracking-wider mb-1 md:mb-2">
                                {t('club_listing.card.entry_label', 'Ingresso')}
                            </p>
                            <div className="flex flex-col gap-1">
                                <div className="flex items-center justify-between md:justify-start gap-4 text-sm font-bold text-black px-2 py-1">
                                    <span className="text-gray-400 font-medium text-xs uppercase">Uomo</span>
                                    <span className="text-black">{manPrice ? `€${manPrice.toFixed(2)}` : `€${service.price.toFixed(2)}`}</span>
                                </div>
                                <div className="flex items-center justify-between md:justify-start gap-4 text-sm font-bold text-black px-2 py-1">
                                    <span className="text-gray-400 font-medium text-xs uppercase">Donna</span>
                                    <span className="text-black">{womanPrice ? `€${womanPrice.toFixed(2)}` : `€${service.price.toFixed(2)}`}</span>
                                </div>
                            </div>
                        </div>
                        <div className="hidden md:block w-[1px] bg-gray-100 h-auto"></div>
                        <div className={`${!isTableReserved ? 'opacity-70' : 'opacity-100'} transition-all`}>
                            <p className="text-[10px] text-black uppercase font-bold tracking-wider mb-1 md:mb-2 flex items-center gap-1">
                                <Armchair size={12} className="text-[#68B49B]" />
                                {t('club_listing.card.min_spend_label', 'Tavoli')}
                            </p>
                            <div className="flex items-baseline gap-1">
                                {tablePrice ? (
                                    <div className="flex items-center justify-between md:justify-start gap-4 text-sm font-bold text-black bg-[#F0FDF4] px-2 py-1 rounded-lg border border-[#68B49B]/30 shadow-sm w-full">
                                        <span className="text-xs text-[#2F5E4E] font-medium uppercase">Da</span>
                                        <span className="text-black text-base">
                                            €{tablePrice}
                                        </span>
                                    </div>
                                ) : (
                                    <span className="text-xs font-bold text-gray-400 italic px-2 py-1">
                                        Non disponibile
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                    <button
                        className="hidden md:flex w-12 h-12 rounded-full bg-gray-50 items-center justify-center text-[#68B49B] group-hover:bg-[#68B49B] group-hover:text-white transition-colors duration-300 shadow-sm ml-4"
                        onClick={(e) => {
                            e.stopPropagation();
                            onDetailClick(service);
                        }}
                    >
                        <ArrowRight size={24} />
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- COMPONENTE PRINCIPALE ---

export const ServiceListingClub = () => {
    const { t } = useTranslation("home");
    const navigate = useNavigate();
    const [urlSearchParams] = useSearchParams();

    // 1. INIZIALIZZAZIONE STATO DA URL
    const initialCity = urlSearchParams.get('location') || "";
    const initialEventType = urlSearchParams.get('eventType') || "";
    const initialDate = urlSearchParams.get('date') || "";
    const initialTable = urlSearchParams.get('table') === 'true';

    const [services, setServices] = useState([]);
    const [hasSearched, setHasSearched] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const [city, setCity] = useState(initialCity);
    const [eventType, setEventType] = useState(initialEventType);
    const [eventDate, setEventDate] = useState(initialDate);
    const [reserveTable, setReserveTable] = useState(initialTable);

    const [searchedDate, setSearchedDate] = useState(initialDate);

    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [itemsPerPage] = useState(5);

    // RIFERIMENTO PER SCROLL AUTOMATICO
    const resultsSectionRef = useRef(null);

    // --- FUNZIONE RICERCA PURA (MODIFICATA CON SCROLL) ---
    const executeSearch = async (params, shouldScroll = false) => {
        setLoading(true);
        setError(null);

        try {
            const rawLocation = params.location;
            const locationPayload = rawLocation ? createLocationPayload(rawLocation, "", "CLUB")[0] : null;

            const apiPageIndex = (params.page || 1) - 1;

            const searchRequest = {
                locale: locationPayload,
                eventType: params.eventType || null,
                date: params.date || null,
                table: params.table || false
            };

            const response = await clubService.advancedSearchClubs(searchRequest, apiPageIndex, itemsPerPage);

            let dataList = [];
            let pages = 0;
            if (Array.isArray(response)) {
                dataList = response;
                pages = 1;
            } else if (response && response.content) {
                dataList = response.content;
                pages = response.totalPages;
            }

            setServices(dataList);
            setTotalPages(pages);
            setHasSearched(true);
            setCurrentPage(params.page || 1);
            setSearchedDate(params.date);

            // LOGICA DI SCROLL AUTOMATICO
            if (shouldScroll) {
                setTimeout(() => {
                    if (resultsSectionRef.current) {
                        const yOffset = -120; // Offset per non attaccare troppo in alto
                        const element = resultsSectionRef.current;
                        const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;

                        window.scrollTo({ top: y, behavior: 'smooth' });
                    }
                }, 100);
            }

        } catch (err) {
            console.error("Search Error:", err);
            setError({
                title: t('club_listing.error.title', "Errore"),
                message: t('club_listing.error.message', { error: err.message || 'Unknown error' })
            });
            setServices([]);
        } finally {
            setLoading(false);
        }
    };

    // --- AUTO START DA URL ---
    useEffect(() => {
        if (initialCity && !hasSearched) {
            const payload = {
                location: initialCity,
                eventType: initialEventType,
                date: initialDate,
                table: initialTable,
                page: 1
            };

            setCity(initialCity);
            setEventType(initialEventType);
            setEventDate(initialDate);
            setReserveTable(initialTable);

            // True per scorrere ai risultati all'avvio da URL
            executeSearch(payload, true);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // --- HANDLER FORM SUBMIT ---
    const handleSearch = (e) => {
        e.preventDefault();

        const payload = {
            location: city,
            eventType: eventType,
            date: eventDate,
            table: reserveTable,
            page: 1
        };

        const urlParams = new URLSearchParams({
            location: city,
            eventType: eventType,
            date: eventDate,
            table: reserveTable.toString()
        }).toString();

        navigate(`/service/club?${urlParams}`, { replace: true });

        // True per scorrere ai risultati dopo click cerca
        executeSearch(payload, true);
    };

    // --- HANDLER CLICK CARD POPOLARE ---
    const handleCityQuickSearch = (dest) => {
        const today = new Date().toISOString().split('T')[0];
        const formattedLocation = dest?.searchLocation || `${dest.city}, ${dest.region}`;

        setCity(formattedLocation);
        setReserveTable(false);
        setEventType("");
        setEventDate(today);

        const payload = {
            location: formattedLocation,
            table: false,
            eventType: "",
            date: today,
            page: 1
        };

        const urlParams = new URLSearchParams({
            location: formattedLocation,
            eventType: "",
            date: today,
            table: "false"
        }).toString();

        navigate(`/service/club?${urlParams}`, { replace: true });

        // True per scorrere ai risultati
        executeSearch(payload, true);
    };

    const handlePageChange = (pageNumber) => {
        const payload = {
            location: city,
            eventType: eventType,
            date: eventDate,
            table: reserveTable,
            page: pageNumber
        };

        // True per scorrere all'inizio della lista al cambio pagina
        executeSearch(payload, true);
    };

    const handleGoToDetail = (service) => {
        if (!service || !service.id) return;
        const slug = slugify(service.name);
        navigate(`/club/${slug}-${service.id}?table=${reserveTable ? 'true' : 'false'}`);
    };

    const handleCloseError = () => {
        setError(null);
    };

    const todayStr = new Date().toISOString().split('T')[0];
    const isSearchDateToday = hasSearched && searchedDate === todayStr;

    return (
        <div className={`min-h-screen bg-[#F8FAFC] pb-20 ${HOGU_THEME.fontFamily}`}>
            <LoadingScreen isLoading={loading} />

            {error && (
                <ErrorModal
                    message={error.message}
                    onClose={handleCloseError}
                />
            )}

            <PageHeader
                breadcrumbs={breadcrumbsItems.map(item => ({ ...item, label: t(item.labelKey) }))}
                subtitle={t('club_listing.header.subtitle')}
                titlePart1={t('club_listing.header.title_part1')}
                titlePart2={t('club_listing.header.title_part2')}
                description={t('club_listing.header.description')}
            />

            <div className="max-w-7xl mx-auto px-4 lg:px-8 -mt-20 md:-mt-16 lg:-mt-12 relative z-20">

                <div className={`relative z-50 bg-[#F1F5F9] rounded-[2rem] p-4 lg:p-8 ${HOGU_THEME.shadowFloat} border border-white/50 backdrop-blur-sm`}>
                    <form onSubmit={handleSearch} className="flex flex-col gap-3 lg:gap-6">

                        {/* ===== MOBILE LAYOUT: griglia 2x2 ===== */}
                        <div className="grid grid-cols-2 gap-2 lg:hidden">

                            {/* Città — full width */}
                            <div className="col-span-2 z-[100]">
                                <CityAutocomplete
                                    label={t('club_listing.search.location_label', 'Città')}
                                    value={city}
                                    onChange={setCity}
                                    icon={MapPin}
                                    className="w-full z-[100]"
                                    inputClassName="text-left text-sm"
                                    labelClassName={`!text-[${HOGU_COLORS.subtleText}] !text-[9px]`}
                                    placeholder={t('club_listing.search.city_placeholder', "Dove vuoi andare?")}
                                />
                            </div>

                            {/* Tipo Evento */}
                            <SearchInputContainer label={t('club_listing.search.event_type_label')} icon={Ticket}>
                                <div className="relative w-full h-full">
                                    <select
                                        value={eventType}
                                        onChange={(e) => setEventType(e.target.value)}
                                        className="w-full h-full object-cover md:object-contain md:mix-blend-multiply transition-transform duration-500 group-hover:scale-105 drop-shadow-xl max-h-[200px] text-sm font-medium text-gray-700 outline-none cursor-pointer appearance-none"
                                    >
                                        <option value="">{t('club_listing.search.select_type')}</option>
                                        <option value="djset">{t('club_listing.search.type_djset')}</option>
                                        <option value="live">{t('club_listing.search.type_live_concert')}</option>
                                        <option value="private">{t('club_listing.search.type_private_event')}</option>
                                        <option value="aperitif">{t('club_listing.search.type_aperitif')}</option>
                                    </select>
                                    <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                        <ChevronDown size={14} />
                                    </div>
                                </div>
                            </SearchInputContainer>

                            {/* Data */}
                            <SearchInputContainer label={t('club_listing.search.when_label')} icon={Calendar}>
                                <input
                                    type="date"
                                    min={new Date().toISOString().split("T")[0]}
                                    value={eventDate}
                                    onChange={(e) => setEventDate(e.target.value)}
                                    className="w-full h-full px-2 bg-transparent border-none focus:ring-0 text-sm font-medium text-gray-700 outline-none cursor-pointer"
                                />
                            </SearchInputContainer>

                            {/* Toggle Tavolo */}
                            <div className="flex flex-col gap-1 min-w-0">
                                <label className={`flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wide text-[${HOGU_COLORS.subtleText}] ml-1`}>
                                    <Armchair size={12} className={`text-[${HOGU_COLORS.primary}]`} />
                                    {t('club_listing.search.table_label')}
                                </label>
                                <div
                                    className={`h-[42px] rounded-xl border cursor-pointer transition-all duration-300 flex items-center justify-between px-3 shadow-sm ${reserveTable ? 'bg-[#F0FDF9] border-[#68B49B] ring-1 ring-[#68B49B]' : 'bg-white border-gray-100 hover:border-[#68B49B]/30'
                                        }`}
                                    onClick={() => setReserveTable(!reserveTable)}
                                >
                                    <span className={`text-xs font-bold truncate ${reserveTable ? 'text-[#33594C]' : 'text-gray-500'}`}>
                                        {reserveTable ? t('club_listing.search.table_premium') : t('club_listing.search.entry_only')}
                                    </span>
                                    <div className={`w-5 h-5 rounded-full flex items-center justify-center transition-all border shrink-0 ${reserveTable ? 'bg-[#68B49B] border-[#68B49B] text-white' : 'bg-gray-100 border-gray-200 text-transparent'
                                        }`}>
                                        {reserveTable ? <Star size={12} fill="currentColor" /> : <Check size={12} strokeWidth={3} />}
                                    </div>
                                </div>
                            </div>

                            {/* Bottone Cerca — spacer + bottone allineato */}
                            <div className="flex flex-col gap-1 min-w-0">
                                <span className="text-[9px] font-bold uppercase tracking-wide opacity-0 select-none ml-1">_</span>
                                <PrimaryButton type="submit" disabled={loading || !city || !eventDate} className="w-full h-[42px] !rounded-xl !px-4 !text-sm !py-0">
                                    {loading ? (
                                        <><Loader2 className="animate-spin" size={16} />{t('club_listing.search.searching', 'Cercando...')}</>
                                    ) : (
                                        <><Search size={16} />{t('club_listing.search.search_button')}</>
                                    )}
                                </PrimaryButton>
                            </div>
                        </div>

                        {/* ===== DESKTOP LAYOUT: flex-row originale ===== */}
                        <div className="hidden lg:flex flex-row gap-6 items-end">

                            <CityAutocomplete
                                label={t('club_listing.search.location_label', 'Città')}
                                value={city}
                                onChange={setCity}
                                icon={MapPin}
                                className="flex-1 min-w-[200px]"
                                inputClassName="text-left"
                                labelClassName={`!text-[${HOGU_COLORS.subtleText}]`}
                                placeholder={t('club_listing.search.city_placeholder', "Dove vuoi andare?")}
                            />

                            <SearchInputContainer label={t('club_listing.search.event_type_label')} icon={Ticket} className="flex-[1]">
                                <div className="relative w-full h-full">
                                    <select
                                        value={eventType}
                                        onChange={(e) => setEventType(e.target.value)}
                                        className="w-full h-full pl-3 pr-8 bg-transparent border-none focus:ring-0 text-base font-medium text-gray-700 outline-none cursor-pointer appearance-none"
                                    >
                                        <option value="">{t('club_listing.search.select_type')}</option>
                                        <option value="djset">{t('club_listing.search.type_djset')}</option>
                                        <option value="live">{t('club_listing.search.type_live_concert')}</option>
                                        <option value="private">{t('club_listing.search.type_private_event')}</option>
                                        <option value="aperitif">{t('club_listing.search.type_aperitif')}</option>
                                    </select>
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                        <ChevronDown size={16} />
                                    </div>
                                </div>
                            </SearchInputContainer>

                            <SearchInputContainer label={t('club_listing.search.when_label')} icon={Calendar} className="flex-[0.8]">
                                <input
                                    type="date"
                                    min={new Date().toISOString().split("T")[0]}
                                    value={eventDate}
                                    onChange={(e) => setEventDate(e.target.value)}
                                    className="w-full h-full px-3 bg-transparent border-none focus:ring-0 text-sm font-medium text-gray-700 outline-none cursor-pointer"
                                />
                            </SearchInputContainer>

                            <div className="flex flex-col gap-3 flex-[0.8] min-w-[150px]">
                                <label className={`flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-[${HOGU_COLORS.subtleText}] ml-1`}>
                                    <Armchair size={14} className={`text-[${HOGU_COLORS.primary}]`} />
                                    {t('club_listing.search.table_label')}
                                </label>
                                <div
                                    className={`h-[60px] rounded-2xl border cursor-pointer transition-all duration-300 flex items-center justify-between px-4 shadow-sm ${reserveTable ? 'bg-[#F0FDF9] border-[#68B49B] ring-1 ring-[#68B49B]' : 'bg-white border-gray-100 hover:border-[#68B49B]/30'
                                        }`}
                                    onClick={() => setReserveTable(!reserveTable)}
                                >
                                    <span className={`text-sm font-bold ${reserveTable ? 'text-[#33594C]' : 'text-gray-500'}`}>
                                        {reserveTable ? t('club_listing.search.table_premium') : t('club_listing.search.entry_only')}
                                    </span>
                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all border ${reserveTable ? 'bg-[#68B49B] border-[#68B49B] text-white' : 'bg-gray-100 border-gray-200 text-transparent'
                                        }`}>
                                        {reserveTable ? <Star size={14} fill="currentColor" /> : <Check size={14} strokeWidth={3} />}
                                    </div>
                                </div>
                            </div>

                            <PrimaryButton
                                type="submit"
                                className="!h-[60px] !text-lg"
                                disabled={loading || !city || !eventDate}
                            >
                                {loading ? (
                                    <><Loader2 className="animate-spin" size={20} />{t('club_listing.search.searching', 'Cercando...')}</>
                                ) : (
                                    <><Search size={20} />{t('club_listing.search.search_button')}</>
                                )}
                            </PrimaryButton>

                        </div>

                    </form>
                </div>

                <div className="relative z-0">
                    {!hasSearched && (
                        <PopularDestinations
                            title="Destinazioni Popolari"
                            onDestinationClick={handleCityQuickSearch}
                        />
                    )}

                    {hasSearched && (
                        <div className="mt-6 md:mt-12" id="club-results-section" ref={resultsSectionRef}>
                            <div className="flex flex-col md:flex-row items-center justify-between mb-4 md:mb-8 gap-4 text-center md:text-left">
                                <h2 className={`text-lg md:text-2xl font-bold text-[${HOGU_COLORS.dark}]`}>
                                    <span className="text-[#68B49B]">{services.length}</span> {t('club_listing.results.found', { count: services.length })}
                                </h2>
                                {services.length > 0 && (
                                    <span className="text-sm text-gray-400 font-medium">
                                        Pagina {currentPage} di {totalPages}
                                    </span>
                                )}
                            </div>

                            {services.length === 0 ? (
                                <div className="text-center py-10 md:py-20 bg-white rounded-2xl md:rounded-3xl border border-gray-100">
                                    <Music size={40} className="text-gray-300 mx-auto mb-4" />
                                    <h3 className="text-lg font-bold text-gray-700">{t('club_listing.results.no_events')}</h3>
                                </div>
                            ) : (
                                <>
                                    <div className="flex flex-col gap-3 md:gap-6">
                                        {services.map(service => (
                                            <ClubResultCard
                                                key={service.id}
                                                service={service}
                                                onDetailClick={handleGoToDetail}
                                                isTableReserved={reserveTable}
                                                isToday={isSearchDateToday}
                                            />
                                        ))}
                                    </div>

                                    {totalPages > 1 && (
                                        <div className="flex items-center justify-center gap-2 mt-12">
                                            <button
                                                onClick={() => handlePageChange(currentPage - 1)}
                                                disabled={currentPage === 1 || loading}
                                                className={`w-10 h-10 flex items-center justify-center rounded-full border transition-all ${currentPage === 1 ? 'border-gray-100 text-gray-300 cursor-not-allowed' : 'border-gray-200 text-gray-600 hover:border-[#68B49B] hover:text-[#68B49B] bg-white hover:shadow-md'}`}
                                            >
                                                <ChevronLeft size={20} />
                                            </button>
                                            <div className="flex items-center gap-1">
                                                {Array.from({ length: totalPages }, (_, i) => i + 1).map((number) => (
                                                    <button
                                                        key={number}
                                                        onClick={() => handlePageChange(number)}
                                                        disabled={loading}
                                                        className={`w-10 h-10 rounded-full font-bold text-sm transition-all ${currentPage === number ? 'bg-[#68B49B] text-white shadow-lg shadow-[#68B49B]/30' : 'text-gray-600 hover:bg-gray-100'}`}
                                                    >
                                                        {number}
                                                    </button>
                                                ))}
                                            </div>
                                            <button
                                                onClick={() => handlePageChange(currentPage + 1)}
                                                disabled={currentPage === totalPages || loading}
                                                className={`w-10 h-10 flex items-center justify-center rounded-full border transition-all ${currentPage === totalPages ? 'border-gray-100 text-gray-300 cursor-not-allowed' : 'border-gray-200 text-gray-600 hover:border-[#68B49B] hover:text-[#68B49B] bg-white hover:shadow-md'}`}
                                            >
                                                <ChevronRight size={20} />
                                            </button>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};

export default ServiceListingClub;

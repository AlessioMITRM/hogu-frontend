import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
    Search, MapPin, Utensils, Calendar, ArrowRight, ChefHat, Clock,
    ChevronLeft, ChevronRight, ChevronDown, Loader2
} from 'lucide-react';
import { PageHeader } from '../../ui/PageHeader.jsx';
import { PopularDestinations } from '../../ui/PopularDestinations.jsx';
import { CityAutocomplete } from '../../ui/CityAutocomplete.jsx';
import { HOGU_COLORS, HOGU_THEME } from '../../../config/theme.js';
import { createLocationPayload } from "../../../utils/locationUtils.js";
import { restaurantService } from '../../../api/apiClient.js';

// ** IMPORT COMPONENTI UI **
import LoadingScreen from '../../ui/LoadingScreen.jsx';
import ErrorModal from '../../ui/ErrorModal.jsx';
import SafeImage from '../../ui/SafeImage.jsx';


const MOBILE_FONT = "font-['SF_Pro_Text',_Roboto,_'Inter',_system-ui,_sans-serif]";


const breadcrumbsItems = [
    { labelKey: 'breadcrumbs.home', href: '/' },
    { labelKey: 'breadcrumbs.restaurant', href: '/service/restaurant' }
];

// --- UTILITY PER GESTIRE I DATI GEOGRAFICI (INVARIATO) ---
// (Rimossa logica locale per usare CityAutocomplete condiviso)

const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 12; hour <= 23; hour++) {
        const formattedHour = hour.toString().padStart(2, '0');
        slots.push(`${formattedHour}:00`);
        slots.push(`${formattedHour}:30`);
    }
    return slots;
};

const isTimeSlotValidForDate = (slot, dateString) => {
    if (!dateString) return true;
    const now = new Date();
    const todayString = now.toISOString().split("T")[0];
    if (dateString > todayString) return true;
    if (dateString < todayString) return false;
    const [slotHours, slotMinutes] = slot.split(":").map(Number);
    const slotDate = new Date();
    slotDate.setHours(slotHours, slotMinutes, 0, 0);
    return slotDate >= now;
};

// --- HELPER SLUGIFY ---
const slugify = (text) => {
    if (!text) return '';
    return text
        .toString()
        .toLowerCase()
        .normalize('NFD')               // Normalizza i caratteri accentati
        .replace(/[\u0300-\u036f]/g, '') // Rimuove gli accenti
        .replace(/\s+/g, '-')           // Sostituisce spazi con -
        .replace(/[^\w\-]+/g, '')       // Rimuove caratteri non alfanumerici
        .replace(/\-\-+/g, '-')         // Rimuove trattini multipli
        .replace(/^-+/, '')             // Rimuove trattini iniziali
        .replace(/-+$/, '');            // Rimuove trattini finali
};

// --- UI HELPERS ---
function PrimaryButton({ children, onClick, className = '', disabled = false, type = 'button', style = {} }) {
    return (
        <button type={type} onClick={onClick} disabled={disabled} style={style}
            className={`bg-[#68B49B] text-white ${HOGU_THEME.fontFamily} ${MOBILE_FONT}
        px-5 py-2.5 lg:px-8 lg:py-4 text-[16px] leading-[20px] font-semibold md:text-sm md:font-bold lg:text-lg rounded-2xl transition-all duration-300 ease-out
        shadow-[0_8px_20px_-6px_rgba(104,180,155,0.5)] hover:shadow-[0_12px_25px_-8px_rgba(104,180,155,0.7)]
        hover:-translate-y-0.5 active:translate-y-0
        disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none flex items-center justify-center gap-2 ${className}`}>
            {children}
        </button>
    );
}

const SearchInputContainer = ({ label, icon: Icon, children, className = '' }) => (
    <div className={`flex flex-col gap-1 lg:gap-3 flex-1 min-w-0 relative z-10 ${className}`}>
        <label className={`flex items-center gap-1.5 ${MOBILE_FONT} text-[12px] leading-[16px] font-normal md:text-xs md:font-bold uppercase tracking-wide text-[${HOGU_COLORS.subtleText}] ml-1`}>
            <Icon size={12} className={`text-[${HOGU_COLORS.primary}]`} />
            {label}
        </label>
        <div className="flex gap-2 bg-white p-1 rounded-xl border border-gray-100 shadow-sm focus-within:ring-2 focus-within:ring-[#68B49B]/20 focus-within:border-[#68B49B] transition-all h-[42px] md:h-[60px] items-center relative">
            {children}
        </div>
    </div>
);


// --- CARD: RISULTATO RISTORANTE ---
const RestaurantResultCard = ({ service, onClick }) => {
    const { t } = useTranslation("home");
    const [isExpanded, setIsExpanded] = useState(false);

    const getPriceCategory = (price) => {
        const uniformStyle = 'bg-[#F0FDF9] text-[#68B49B] border-[#68B49B]/20 backdrop-blur-md';
        if (price <= 35) return { label: '€', style: uniformStyle };
        if (price <= 60) return { label: '€€', style: uniformStyle };
        return { label: '€€€', style: uniformStyle };
    };

    const priceInfo = getPriceCategory(service.averagePrice);

    return (
        <div
            className={`bg-white rounded-none md:rounded-3xl overflow-hidden flex flex-col md:flex-row border-y md:border border-gray-100 ${HOGU_THEME.shadowCard} transition-all duration-300 hover:-translate-y-1 cursor-pointer group min-h-[180px] md:min-h-[240px]`}
            onClick={onClick}
        >
            <div
                className="md:w-1/3 h-[200px] md:h-[240px] relative overflow-hidden bg-gray-50 flex items-center justify-center p-3 md:p-4 isolate transform-gpu shrink-0"
                style={{ WebkitMaskImage: '-webkit-radial-gradient(white, black)' }}
            >
                <div className="absolute top-4 left-4 z-20">
                    <span className={`text-xs font-extrabold tracking-widest px-3 py-1.5 rounded-lg shadow-sm border ${priceInfo.style}`}>
                        {priceInfo.label}
                    </span>
                </div>

                <SafeImage
                    src={service.imageUrl || `https://placehold.co/800x600/${HOGU_COLORS.dark.substring(1)}/${HOGU_COLORS.primary.substring(1)}?text=${encodeURIComponent(service.name)}`}
                    alt={service.name}
                    className="w-full h-full object-cover transition-transform duration-700 scale-105 md:scale-100 md:group-hover:scale-105 backface-hidden rounded-none md:rounded-2xl shadow-none md:shadow-sm block"
                    style={{ backfaceVisibility: 'hidden' }}
                />
            </div>

            <div className="px-3 pb-3 pt-1.5 md:p-8 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-2 md:mb-1">
                    <div className="w-full">
                        <div className="flex justify-between items-start">
                            <h2 className={`${MOBILE_FONT} text-[22px] leading-[28px] font-semibold md:text-base md:text-2xl md:font-bold ${HOGU_THEME.text} group-hover:text-[#68B49B] transition-colors uppercase leading-tight`}>{service.name}</h2>
                        </div>
                        <div className="flex items-center gap-2 mt-1 mb-0 md:mb-4">
                            <p className={`${MOBILE_FONT} text-[14px] leading-[20px] font-normal md:text-[11px] md:text-sm flex items-center gap-1 ${HOGU_THEME.subtleText}`}>
                                <MapPin size={12} className="text-[#68B49B]" /> {service.location}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="md:hidden border-t border-gray-200 my-1.5" />

                <div className={`mt-1 mb-1 md:my-2 pl-1 ${isExpanded ? 'block' : 'hidden md:block'}`}>
                    <p className={`${MOBILE_FONT} text-[14px] leading-[20px] font-normal text-gray-500 md:text-xs md:text-sm md:leading-relaxed mb-4 line-clamp-2`}>
                        {service.description}
                    </p>

                    {/* Prezzo Medio visibile solo se espanso su mobile, sempre su desktop */}
                    <div className="mt-2 md:hidden">
                        <p className={`${MOBILE_FONT} text-[12px] leading-[16px] font-normal text-gray-400 mb-1`}>
                            {t('restaurant_listing.card.avg_price_label', 'Prezzo Medio')}
                        </p>
                        <div className="flex items-baseline gap-1">
                            <span className={`${MOBILE_FONT} text-[22px] leading-[28px] font-bold text-gray-800`}>€ {service.averagePrice}</span>
                            <span className={`${MOBILE_FONT} text-[14px] leading-[20px] font-normal text-gray-500`}>,00</span>
                        </div>
                    </div>
                </div>

                <div className="flex-grow" />

                {/* Mobile "Show More" Button & Detail Arrow */}
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
                                {t('restaurant_listing.card.hide', 'Nascondi')}
                            </>
                        ) : (
                            <>
                                <ChevronDown size={14} className="transition-transform" />
                                {t('restaurant_listing.card.info_prices', 'Info & Prezzi')}
                            </>
                        )}
                    </button>

                    <button
                        className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-[#68B49B] flex items-center justify-center text-white shadow-md active:scale-95 transition-all"
                        onClick={(e) => {
                            e.stopPropagation();
                            onClick();
                        }}
                    >
                        <ArrowRight size={20} />
                    </button>
                </div>

                {/* Desktop Footer */}
                <div className="hidden md:flex mt-auto pt-4 border-t border-gray-50 items-end justify-between">
                    <div>
                        <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">
                            {t('restaurant_listing.card.avg_price_label', 'Prezzo Medio')}
                        </p>
                        <div className="flex items-baseline gap-1">
                            <span className="text-2xl md:text-3xl font-extrabold text-gray-800">€ {service.averagePrice}</span>
                            <span className="text-sm text-gray-500">,00</span>
                        </div>
                    </div>

                    <button
                        className="hidden md:flex w-12 h-12 rounded-full bg-gray-50 items-center justify-center text-[#68B49B] group-hover:bg-[#68B49B] group-hover:text-white transition-colors duration-300 shadow-sm"
                        title={t('restaurant_listing.card.view_details', 'Vedi Dettagli')}
                    >
                        <ArrowRight size={24} />
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- COMPONENTE PRINCIPALE ---
export const ServiceListingRestaurant = () => {
    const { t } = useTranslation("home");
    const navigate = useNavigate();
    const [urlSearchParams] = useSearchParams();

    // STATI
    const [services, setServices] = useState([]);
    const [hasSearched, setHasSearched] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [itemsPerPage] = useState(5);

    // RIFERIMENTO PER SCROLL AUTOMATICO
    const resultsSectionRef = useRef(null);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const timeSlots = useMemo(() => generateTimeSlots(), []);

    // STATI DI SUPPORTO RICERCA
    const [lastSearchPayload, setLastSearchPayload] = useState(null);

    // INIZIALIZZAZIONE STATO DA URL
    const [search, setSearch] = useState({
        location: urlSearchParams.get('location') || '',
        cuisine: urlSearchParams.get('cuisine') || '',
        date: urlSearchParams.get('date') || '',
        time: urlSearchParams.get('time') || '20:00'
    });

    const resultsFoundText = t('restaurant_listing.results.found', 'ristoranti trovati');
    const pageOfText = t('restaurant_listing.results.page_of', 'Pagina {{current}} di {{total}}');

    // --- FUNZIONE FETCH API ---
    const fetchRestaurants = async (payload, targetPage) => {
        setLoading(true);
        setError(null);

        try {
            const response = await restaurantService.advancedSearchRestaurants(
                payload,
                targetPage,
                itemsPerPage
            );

            let content = [];
            let totalP = 0;

            if (response && response.content) {
                content = response.content;
                totalP = response.totalPages;
            } else if (Array.isArray(response)) {
                content = response;
                totalP = Math.ceil(response.length / itemsPerPage);
            }

            const formattedResults = content.map(restaurant => {
                const address = (restaurant.locales && restaurant.locales.length > 0)
                    ? restaurant.locales[0].address
                    : t('restaurant_listing.card.address_not_available', 'Indirizzo non disponibile');

                const imageFilename = (restaurant.images && restaurant.images.length > 0)
                    ? restaurant.images[0]
                    : null;

                const imageUrl = imageFilename
                    ? `/files/restaurant/${restaurant.id}/${imageFilename}`
                    : null;

                return {
                    id: restaurant.id,
                    name: restaurant.name || t('restaurant_listing.card.restaurant_placeholder', 'Ristorante'),
                    location: address,
                    type: restaurant.serviceType || 'RESTAURANT',
                    description: restaurant.description || '',
                    averagePrice: restaurant.basePrice || 0,
                    imageUrl
                };
            });

            setServices(formattedResults);
            setTotalPages(totalP);
            setHasSearched(true);
            setCurrentPage(targetPage + 1);

            if (hasSearched || targetPage > 0) {
                const resultsSection = document.getElementById('restaurant-results-section');
                if (resultsSection) {
                    resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }

        } catch (err) {
            console.error("Search error:", err);
            setError(err.message || 'Errore durante la ricerca dei ristoranti.');
            setServices([]);
        } finally {
            setLoading(false);
        }
    };

    // --- ESECUZIONE RICERCA UNIFICATA ---
    const executeSearch = async (dataToUse) => {
        const currentData = dataToUse || search;

        const today = new Date().toISOString().split('T')[0];
        const dateToUse = currentData.date || today;

        // Costruzione Payload
        const rawLocation = currentData.location;
        const locationPayload = rawLocation ? createLocationPayload(rawLocation, "", "RESTAURANT")[0] : null;

        const payload = {
            locale: locationPayload,
            cuisine: currentData.cuisine || null,
            date: dateToUse,
            time: currentData.time || "20:00"
        };

        setLastSearchPayload(payload);

        // Aggiornamento URL per coerenza
        const queryParams = new URLSearchParams();
        if (currentData.location) queryParams.append("location", currentData.location);
        if (currentData.cuisine) queryParams.append("cuisine", currentData.cuisine);
        queryParams.append("date", dateToUse);
        if (currentData.time) queryParams.append("time", currentData.time);

        navigate(`/service/restaurant?${queryParams.toString()}`, { replace: true });

        await fetchRestaurants(payload, 0);
    };

    // --- AUTO START DA URL (UseEffect) ---
    useEffect(() => {
        if (search.location && !hasSearched) {
            executeSearch(search);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleFormSubmit = (e) => {
        if (e) e.preventDefault();
        executeSearch(search);
    };

    // --- CLICK CARTA CITTA POPOLARE ---
    const handlePopularCityClick = (locData) => {
        const today = new Date().toISOString().split('T')[0];

        const newData = {
            ...search,
            location: locData.searchLocation, // "Roma, Lazio"
            cuisine: '', // Resettiamo la cucina
            date: today, // Data odierna
            time: '20:00' // Orario fisso
        };

        setSearch(newData);
        executeSearch(newData);
    };

    const handlePageChange = async (newPageNumber) => {
        if (!lastSearchPayload) return;
        await fetchRestaurants(lastSearchPayload, newPageNumber - 1);
    };

    const handleNavigateToDetail = (item) => {
        if (!item || !item.id) return;
        const slug = slugify(item.name);
        const query = new URLSearchParams();
        const today = new Date().toISOString().split('T')[0];

        query.append("dateFrom", search.date || today);
        query.append("timeFrom", search.time || '20:00');
        query.append("totalPersons", "2");

        navigate(`/restaurant/${slug}-${item.id}?${query.toString()}`);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setSearch(prev => ({ ...prev, [name]: value }));
    };

    // --- PAGINAZIONE ---
    const Pagination = () => {
        if (totalPages <= 1) return null;
        return (
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
                            className={`w-10 h-10 rounded-full font-semibold ${MOBILE_FONT} text-[16px] leading-[20px] transition-all md:font-bold md:text-sm ${currentPage === number ? 'bg-[#68B49B] text-white shadow-lg shadow-[#68B49B]/30' : 'text-gray-600 hover:bg-gray-100'}`}
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
        );
    };

    return (
        <div className={`min-h-screen bg-[#F8FAFC] pb-20 ${HOGU_THEME.fontFamily}`}>

            <LoadingScreen isLoading={loading} />
            {error && <ErrorModal message={error} onClose={() => setError(null)} />}

            <PageHeader
                breadcrumbs={breadcrumbsItems.map(item => ({ ...item, label: t(item.labelKey) }))}
                subtitle={t('restaurant_listing.header.subtitle', 'Fine Dining & Experience')}
                titlePart1={t('restaurant_listing.header.title_part1', 'Hogu')}
                titlePart2={t('restaurant_listing.header.title_part2', 'Restaurant')}
                description={t('restaurant_listing.header.description', 'Scopri i migliori ristoranti ed esperienze culinarie esclusive.')}
            />

            <div className="max-w-7xl mx-auto px-4 lg:px-8 -mt-20 md:-mt-16 lg:-mt-12 relative z-20">
                <div className={`relative z-50 bg-[#F1F5F9] rounded-[2rem] p-4 lg:p-8 ${HOGU_THEME.shadowFloat} border border-white/50 backdrop-blur-sm`}>
                    <form onSubmit={handleFormSubmit} className="flex flex-col gap-3 lg:gap-6">

                        {/* ===== MOBILE LAYOUT: griglia 2x2 + bottone full-width ===== */}
                        <div className="grid grid-cols-2 gap-2 lg:hidden">

                            {/* Città — occupa tutta la larghezza */}
                            <div className="col-span-2 z-[100]">
                                <CityAutocomplete
                                    label={t('restaurant_listing.search.location_label')}
                                    value={search.location}
                                    onChange={(val) => setSearch(prev => ({ ...prev, location: val }))}
                                    icon={MapPin}
                                    placeholder={t('restaurant_listing.search.location_placeholder', "Cerca città...")}
                                    className="w-full z-[100]"
                                    labelClassName={`!text-[${HOGU_COLORS.subtleText}] ${MOBILE_FONT} !text-[12px] !leading-[16px] !font-normal md:!text-[9px] md:!font-bold md:uppercase`}
                                    inputClassName={`${MOBILE_FONT} text-left text-[16px] leading-[24px] font-normal md:text-sm`}
                                />
                            </div>

                            {/* Cucina */}
                            <SearchInputContainer label={t('restaurant_listing.search.cuisine_label')} icon={ChefHat}>
                                <input
                                    type="text"
                                    name="cuisine"
                                    value={search.cuisine}
                                    onChange={handleInputChange}
                                    placeholder={t('restaurant_listing.search.cuisine_placeholder')}
                                    className={`w-full h-full px-2 bg-transparent border-none focus:ring-0 ${MOBILE_FONT} text-[16px] leading-[24px] font-normal text-gray-800 outline-none placeholder:text-gray-400 md:text-sm md:font-medium`}
                                />
                            </SearchInputContainer>

                            {/* Data */}
                            <SearchInputContainer label={t('restaurant_listing.search.date_label')} icon={Calendar}>
                                <input
                                    type="date"
                                    name="date"
                                    min={new Date().toISOString().split("T")[0]}
                                    value={search.date}
                                    onChange={handleInputChange}
                                    className={`w-full h-full px-2 bg-transparent border-none focus:ring-0 ${MOBILE_FONT} text-[16px] leading-[24px] font-normal text-gray-700 outline-none cursor-pointer md:text-sm md:font-medium`}
                                />
                            </SearchInputContainer>

                            {/* Orario */}
                            <SearchInputContainer label={t('restaurant_listing.search.time_label')} icon={Clock}>
                                <div className="relative w-full h-full">
                                    <select
                                        name="time"
                                        value={search.time}
                                        onChange={handleInputChange}
                                        className={`w-full h-full pl-2 pr-7 bg-transparent border-none focus:ring-0 ${MOBILE_FONT} text-[16px] leading-[24px] font-normal text-gray-700 outline-none cursor-pointer appearance-none md:text-sm md:font-medium`}
                                    >
                                        <option value="">{t('restaurant_listing.search.all_times', 'Tutti')}</option>
                                        {timeSlots.map(slot => {
                                            const isValid = isTimeSlotValidForDate(slot, search.date);
                                            return (
                                                <option key={slot} value={slot} disabled={!isValid} className={!isValid ? 'text-gray-300 bg-gray-50' : ''}>
                                                    {slot}
                                                </option>
                                            );
                                        })}
                                    </select>
                                    <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                        <ChevronDown size={14} />
                                    </div>
                                </div>
                            </SearchInputContainer>

                            {/* Bottone cerca — allineato come gli altri input (label spacer + box) */}
                            <div className="flex flex-col gap-1 flex-1 min-w-0">
                                {/* Spacer label — stessa altezza della label degli altri campi */}
                                <span className="text-[9px] font-bold uppercase tracking-wide opacity-0 select-none ml-1">_</span>
                                <PrimaryButton type="submit" disabled={loading} className="w-full h-[42px] !rounded-xl !px-4 !text-sm !py-0">
                                    {loading ? (
                                        <><Loader2 className="animate-spin" size={16} />{t('restaurant_listing.search.searching', 'Cercando...')}</>
                                    ) : (
                                        <><Search size={16} />{t('restaurant_listing.search.search_button', 'Cerca')}</>
                                    )}
                                </PrimaryButton>
                            </div>
                        </div>

                        {/* ===== DESKTOP LAYOUT: flex-row originale ===== */}
                        <div className="hidden lg:flex flex-row gap-6">

                            <CityAutocomplete
                                label={t('restaurant_listing.search.location_label')}
                                value={search.location}
                                onChange={(val) => setSearch(prev => ({ ...prev, location: val }))}
                                icon={MapPin}
                                placeholder={t('restaurant_listing.search.location_placeholder', "Cerca città...")}
                                className="flex-[1.2] min-w-[200px] z-[100]"
                                labelClassName={`!text-[${HOGU_COLORS.subtleText}]`}
                                inputClassName="text-left"
                            />

                            <SearchInputContainer label={t('restaurant_listing.search.cuisine_label')} icon={ChefHat} className="flex-[1.2]">
                                <input
                                    type="text"
                                    name="cuisine"
                                    value={search.cuisine}
                                    onChange={handleInputChange}
                                    placeholder={t('restaurant_listing.search.cuisine_placeholder')}
                                    className="w-full h-full px-3 bg-transparent border-none focus:ring-0 text-base font-medium text-gray-800 outline-none placeholder:text-gray-400"
                                />
                            </SearchInputContainer>

                            <SearchInputContainer label={t('restaurant_listing.search.date_label')} icon={Calendar}>
                                <input
                                    type="date"
                                    name="date"
                                    min={new Date().toISOString().split("T")[0]}
                                    value={search.date}
                                    onChange={handleInputChange}
                                    className="w-full h-full px-3 bg-transparent border-none focus:ring-0 text-sm font-medium text-gray-700 outline-none cursor-pointer"
                                />
                            </SearchInputContainer>

                            <SearchInputContainer label={t('restaurant_listing.search.time_label')} icon={Clock} className="lg:max-w-[140px]">
                                <div className="relative w-full h-full">
                                    <select
                                        name="time"
                                        value={search.time}
                                        onChange={handleInputChange}
                                        className="w-full h-full pl-3 pr-8 bg-transparent border-none focus:ring-0 text-base font-medium text-gray-700 outline-none cursor-pointer appearance-none"
                                    >
                                        <option value="">{t('restaurant_listing.search.all_times', 'Tutti')}</option>
                                        {timeSlots.map(slot => {
                                            const isValid = isTimeSlotValidForDate(slot, search.date);
                                            return (
                                                <option key={slot} value={slot} disabled={!isValid} className={!isValid ? 'text-gray-300 bg-gray-50' : ''}>
                                                    {slot}
                                                </option>
                                            );
                                        })}
                                    </select>
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                        <ChevronDown size={16} />
                                    </div>
                                </div>
                            </SearchInputContainer>

                            <div className="flex items-end relative z-0">
                                <PrimaryButton type="submit" disabled={loading} className="w-full lg:w-auto h-[60px] !rounded-2xl !px-8 shadow-lg !text-lg">
                                    {loading ? (
                                        <><Loader2 className="animate-spin" size={20} />{t('restaurant_listing.search.searching', 'Cercando...')}</>
                                    ) : (
                                        <><Search size={20} />{t('restaurant_listing.search.search_button', 'Cerca')}</>
                                    )}
                                </PrimaryButton>
                            </div>
                        </div>

                    </form>
                </div>

                {!hasSearched && !loading && (
                    <PopularDestinations
                        title={t('restaurant_listing.popular.title')}
                        onDestinationClick={(dest) => handlePopularCityClick(dest)}
                    />
                )}

                {hasSearched && (
                    <div className="mt-6 md:mt-12 relative z-10" id="restaurant-results-section">
                        <div className="flex items-center justify-between mb-4 md:mb-8">
                            <h2 className={`${MOBILE_FONT} text-[22px] leading-[28px] font-semibold md:text-lg md:text-2xl md:font-bold text-[${HOGU_COLORS.dark}]`}>
                                {services.length > 0 ? (
                                    <>{services.length} {resultsFoundText} <span className={`${MOBILE_FONT} text-[14px] leading-[20px] font-normal md:text-sm md:font-normal text-gray-400 ml-2`}>({t('restaurant_listing.results.page_of', { current: currentPage, total: totalPages }) || `Pagina ${currentPage} di ${totalPages}`})</span></>
                                ) : (
                                    t('restaurant_listing.results.no_results_title')
                                )}
                            </h2>
                        </div>

                        {services.length === 0 ? (
                            <div className="text-center py-10 md:py-20 bg-white rounded-2xl md:rounded-3xl border border-gray-100">
                                <Utensils size={40} className="text-gray-300 mx-auto mb-4" />
                                <h3 className={`${MOBILE_FONT} text-[18px] leading-[24px] font-semibold text-gray-700 md:text-lg md:font-bold`}>{t('restaurant_listing.results.no_restaurants')}</h3>
                            </div>
                        ) : (
                            <>
                                <div className="flex flex-col gap-3 md:gap-6">
                                    {services.map(service => (
                                        <RestaurantResultCard
                                            key={service.id}
                                            service={service}
                                            onClick={() => handleNavigateToDetail(service)}
                                        />
                                    ))}
                                </div>
                                <Pagination />
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ServiceListingRestaurant;

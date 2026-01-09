import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom'; 
import { 
  Search, Calendar, Ticket, Star, MapPin, Music, ArrowRight, Check, Armchair,
  ChevronLeft, ChevronRight, ChevronDown, 
  PartyPopper, Flame, Loader2 
} from 'lucide-react';
import { Breadcrumbs } from '../../ui/Breadcrumbs.jsx'; 
import { clubService } from '../../../api/apiClient.js';
import LoadingScreen from '../../ui/LoadingScreen.jsx';
import ErrorModal from '../../ui/ErrorModal.jsx';

// ** IMPORTA I TUOI FILE JSON QUI **
import italianLocationsData from '../../../assets/data/italian_locations.json'; 
import englishLocationsData from '../../../assets/data/english_locations.json'; 
import { HOGU_COLORS, HOGU_THEME } from '../../../config/theme.js';
import { slugify } from '../../../utils/slugify.js'; 

const breadcrumbsItems = [
    { labelKey: 'breadcrumbs.home', href: '/' }, 
    { labelKey: 'breadcrumbs.club', href: '/service/club' }
];

// --- UTILITY PER GESTIRE I DATI GEOGRAFICI ---
const processLocations = (data) => {
    if (!data) return [];
    const flatLocations = [];
    data.forEach(region => {
        region.provinces.forEach(province => {
            province.cities.forEach(city => {
                const mapFriendlyString = `${city}, ${province.name}, ${region.region}`;
                flatLocations.push({
                    city: city,
                    province: province.name,
                    region: region.region,
                    fullLabel: mapFriendlyString,
                    searchString: mapFriendlyString.toLowerCase()
                });
            });
        });
    });
    return flatLocations;
};

// --- COMPONENTE AUTOCOMPLETE CITTA' ---
const CityAutocompleteSearch = ({ label, value, onChange, icon: Icon }) => {
    const { i18n, t } = useTranslation();
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const wrapperRef = useRef(null);

    const [inputValue, setInputValue] = useState(value || "");

    useEffect(() => {
        setInputValue(value || "");
    }, [value]);

    const locationData = useMemo(() => {
        const isItalian = i18n.language && i18n.language.startsWith('it');
        const rawData = isItalian ? italianLocationsData : (englishLocationsData || italianLocationsData);
        return processLocations(rawData);
    }, [i18n.language]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleInputChange = (e) => {
        const userInput = e.target.value;
        setInputValue(userInput);
        const lowerInput = userInput.toLowerCase();
        
        onChange(userInput);

        if (userInput.length > 2) {
            const filtered = locationData
                .filter(item => item.searchString.includes(lowerInput))
                .sort((a, b) => {
                    const aCity = a.city.toLowerCase();
                    const bCity = b.city.toLowerCase();
                    if (aCity === lowerInput && bCity !== lowerInput) return -1;
                    if (bCity === lowerInput && aCity !== lowerInput) return 1;
                    const aStarts = aCity.startsWith(lowerInput);
                    const bStarts = bCity.startsWith(lowerInput);
                    if (aStarts && !bStarts) return -1;
                    if (!aStarts && bStarts) return 1;
                    return aCity.localeCompare(bCity);
                })
                .slice(0, 8);

            setSuggestions(filtered);
            setShowSuggestions(true);
        } else {
            setSuggestions([]);
            setShowSuggestions(false);
        }
    };

    const handleSelect = (item) => {
        const formattedLocation = `${item.city}, ${item.region}`;
        setInputValue(formattedLocation); 
        onChange(formattedLocation); 
        setShowSuggestions(false);
    };

    return (
        <div className="flex flex-col gap-3 flex-1 min-w-[200px] relative" ref={wrapperRef}>
            <label className={`flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-[${HOGU_COLORS.subtleText}] ml-1`}>
                <Icon size={14} className={`text-[${HOGU_COLORS.primary}]`} />
                {label}
            </label>
            <div className="flex gap-2 bg-white p-1.5 rounded-2xl border border-gray-100 shadow-sm focus-within:ring-2 focus-within:ring-[#68B49B]/20 focus-within:border-[#68B49B] transition-all h-[60px] items-center relative">
                <input 
                    type="text"
                    value={inputValue}
                    onChange={handleInputChange}
                    onFocus={() => inputValue.length > 2 && setShowSuggestions(true)}
                    placeholder={t('club_listing.search.city_placeholder', "Dove vuoi andare?")}
                    className="w-full h-full px-3 bg-transparent border-none focus:ring-0 text-base font-medium text-gray-700 outline-none placeholder:text-gray-300"
                    autoComplete="off"
                />
                
                {showSuggestions && suggestions.length > 0 && (
                    <div className="absolute top-full left-0 mt-2 w-full bg-white rounded-xl shadow-xl border border-gray-100 max-h-60 overflow-y-auto z-[100]">
                        {suggestions.map((item, idx) => (
                            <button
                                key={idx}
                                type="button"
                                onClick={() => handleSelect(item)}
                                className="w-full text-left px-4 py-3 hover:bg-[#F0FDF9] hover:text-[#33594C] transition-colors border-b border-gray-50 last:border-0 group"
                            >
                                <div className="font-bold text-sm text-gray-800 group-hover:text-[#33594C]">{item.city}</div>
                                <div className="text-xs text-gray-400 group-hover:text-[#68B49B]/70">{item.province}, {item.region}</div>
                            </button>
                        ))}
                    </div>
                )}
                 {showSuggestions && inputValue.length > 2 && suggestions.length === 0 && (
                      <div className="absolute top-full left-0 mt-2 w-full bg-white rounded-xl shadow-xl border border-gray-100 p-4 text-center text-gray-400 text-sm z-[100]">
                        {t('club_listing.search.not_found_citys')}
                      </div>
                )}
            </div>
        </div>
    );
};

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
    <div className={`flex flex-col gap-3 flex-1 min-w-[150px] ${className}`}>
      <label className={`flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-[${HOGU_COLORS.subtleText}] ml-1`}>
        <Icon size={14} className={`text-[${HOGU_COLORS.primary}]`} />
        {label}
      </label>
      <div className="flex gap-2 bg-white p-1.5 rounded-2xl border border-gray-100 shadow-sm focus-within:ring-2 focus-within:ring-[#68B49B]/20 focus-within:border-[#68B49B] transition-all h-[60px] items-center">
        {children}
      </div>
    </div>
);

// --- CARD DESTINAZIONE CITTA' ---
const CityDestinationCard = ({ city, region, imageUrl, onClick }) => {
    return (
    <div 
      className="flex-shrink-0 w-64 snap-start cursor-pointer group relative"
      onClick={() => onClick(city, region)}
    >
        <div className="relative rounded-[2rem] overflow-hidden aspect-[3/4] shadow-md transition-all duration-500 group-hover:shadow-2xl group-hover:-translate-y-2">
            <img 
                src={imageUrl} 
                alt={city}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                onError={(e) => { e.target.src = 'https://placehold.co/400x600/222/FFF?text=City'; }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80" />

            <div className="absolute bottom-0 left-0 p-6 text-white w-full">
                <p className="text-xs font-bold text-[#68B49B] uppercase tracking-wider mb-1">{region}</p>
                <h3 className="text-3xl font-extrabold leading-tight mb-2">{city}</h3>
                
                <div className="flex items-center gap-2 text-sm text-gray-200 mt-2 group-hover:text-white transition-colors">
                    <span>Scopri eventi</span>
                    <ArrowRight size={16} className="transform group-hover:translate-x-1 transition-transform" />
                </div>
            </div>
        </div>
    </div>
)};

// --- CARD RISULTATO CLUB ---
const ClubResultCard = ({ service, onDetailClick, isTableReserved, isToday }) => { 
    const { t, i18n } = useTranslation("home");

    const currentLang = i18n.language || 'it';
    const localeInfo = service.locales?.find(l => l.language === currentLang) || service.locales?.[0];
    const locationString = localeInfo ? `${localeInfo.city}, ${localeInfo.address}` : 'Posizione non disponibile';

    const bgImage = service.images && service.images.length > 0 
        ? service.images[0] 
        : `https://placehold.co/800x600/${HOGU_COLORS.dark.substring(1)}/${HOGU_COLORS.primary.substring(1)}?text=${encodeURIComponent(service.name)}`;

    const manPrice = service.priceMan !== undefined && service.priceMan !== null ? service.priceMan : service.basePrice;
    const womanPrice = service.priceWoman !== undefined && service.priceWoman !== null ? service.priceWoman : service.basePrice;
    const tablePrice = service.priceMinSpend;

    return (  
      <div 
        className={`
          bg-white rounded-3xl overflow-hidden flex flex-col md:flex-row border border-gray-100 
          ${HOGU_THEME.shadowCard} transition-all duration-300 hover:-translate-y-1 cursor-pointer group
          min-h-[240px]
        `}
        onClick={() => onDetailClick(service)} 
      >
        <div className="md:w-1/3 h-64 md:h-auto relative overflow-hidden bg-gray-50 flex items-center justify-center p-4">
          <div className="absolute top-4 left-4 z-10 flex flex-col items-start gap-2">
             <Tag className="bg-white/95 backdrop-blur !border-none text-gray-800 shadow-sm !text-[#68B49B]">
                <PartyPopper size={12} className="mr-1" /> {service.serviceType || 'CLUB'}
             </Tag>
             {isToday && (
                <Tag className="bg-red-500/90 backdrop-blur !border-none !text-white shadow-sm animate-pulse">
                    <Flame size={12} className="mr-1 fill-current" /> OGGI
                </Tag>
             )}
          </div>
          <img 
            src={bgImage}
            alt={service.name}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            onError={(e) => { e.target.src = `https://placehold.co/600x400/CCCCCC/333333?text=${t('club_listing.card.img_fallback_search', 'Evento')}`; }}
          />
        </div>

        <div className="p-6 md:p-8 flex-1 flex flex-col">
          <div className="flex justify-between items-start mb-2">
              <h2 className={`text-2xl font-bold ${HOGU_THEME.text} group-hover:text-[#68B49B] transition-colors uppercase`}>{service.name}</h2>
          </div>
          <div className={`text-sm mt-0 flex items-center flex-wrap gap-3 ${HOGU_THEME.subtleText}`}>
            <span className="flex items-center gap-1">
                 <MapPin size={14} className="text-[#68B49B]" /> {locationString}
            </span>
          </div>
          <p className="text-gray-500 text-sm leading-relaxed my-3 line-clamp-2 md:line-clamp-3">
            {service.description}
          </p>
          <div className="flex flex-wrap gap-2 mb-4">
             <span className="text-[10px] bg-gray-50 text-gray-500 font-medium px-2 py-1 rounded-md border border-gray-100">Dress Code</span>
             <span className="text-[10px] bg-gray-50 text-gray-500 font-medium px-2 py-1 rounded-md border border-gray-100">Commerciale</span>
          </div>
          <div className="flex-grow" />
          
          <div className="mt-auto pt-4 border-t border-gray-50 w-full flex items-end justify-between">
            <div className="flex flex-col md:flex-row gap-4 md:gap-8 flex-1">
                <div className={`${isTableReserved ? 'opacity-50 grayscale' : 'opacity-100'} transition-all`}>
                    <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mb-1">
                        {t('club_listing.card.entry_label', 'Ingresso')}
                    </p>
                    <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-2 text-sm font-bold text-gray-700">
                            <span className="text-gray-400 font-normal text-xs">Uomo</span> 
                            <span>{manPrice ? `€${manPrice.toFixed(2)}` : `€${service.price.toFixed(2)}`}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm font-bold text-gray-700">
                            <span className="text-gray-400 font-normal text-xs">Donna</span> 
                            <span>{womanPrice ? `€${womanPrice.toFixed(2)}` : `€${service.price.toFixed(2)}`}</span>
                        </div>
                    </div>
                </div>
                <div className="hidden md:block w-[1px] bg-gray-100 h-auto"></div>
                <div className={`${!isTableReserved ? 'opacity-70' : 'opacity-100'} transition-all`}>
                    <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mb-1 flex items-center gap-1">
                        <Armchair size={10} className="text-[#68B49B]" />
                        {t('club_listing.card.min_spend_label', 'Tavoli')}
                    </p>
                    <div className="flex items-baseline gap-1">
                        {tablePrice ? (
                            <>
                                <span className="text-xs text-gray-400">da</span>
                                <span className={`text-xl font-extrabold text-[${HOGU_COLORS.dark}]`}>
                                     €{tablePrice}
                                </span>
                            </>
                        ) : (
                            <span className="text-xs font-bold text-gray-400 italic">
                                Non disponibile
                            </span>
                        )}
                    </div>
                </div>
            </div>
            <button 
                className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center text-[#68B49B] group-hover:bg-[#68B49B] group-hover:text-white transition-colors duration-300 shadow-sm ml-4"
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
            const locationToSend = rawLocation || null;

            const apiPageIndex = (params.page || 1) - 1;

            const searchRequest = {
                location: locationToSend,
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
                        
                        window.scrollTo({top: y, behavior: 'smooth'});
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
    const handleCityQuickSearch = (cityVal, regionVal) => {
        const formattedLocation = `${cityVal}, ${regionVal}`;

        setCity(formattedLocation); 
        setReserveTable(false); 
        setEventType(""); 
        setEventDate(""); 

        const payload = {
            location: formattedLocation, 
            table: false,
            eventType: "",
            date: "",
            page: 1
        };

        const urlParams = new URLSearchParams({
            location: formattedLocation,
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

    const popularLocations = [
        { city: 'Milano', region: 'Lombardia', imageUrl: 'https://images.unsplash.com/photo-1543336214-41d3e8d6411f?auto=format&fit=crop&w=600&q=80' },
        { city: 'Roma', region: 'Lazio', imageUrl: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=600&q=80' },
        { city: 'Napoli', region: 'Campania', imageUrl: 'https://images.unsplash.com/photo-1596825205489-a2585c1564dd?auto=format&fit=crop&w=600&q=80' },
        { city: 'Firenze', region: 'Toscana', imageUrl: 'https://images.unsplash.com/photo-1541370976299-4d24ebbc9077?auto=format&fit=crop&w=600&q=80' },
        { city: 'Gallipoli', region: 'Puglia', imageUrl: 'https://images.unsplash.com/photo-1596395992925-50e50125868e?auto=format&fit=crop&w=600&q=80' },
    ];

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
      
       <div className="bg-white pt-12 pb-24 px-4 lg:px-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl -translate-y-1/2 -translate-x-1/3"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#68B49B]/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
          
        <div className="max-w-7xl mx-auto relative z-10">
            <Breadcrumbs items={breadcrumbsItems.map(item => ({...item, label: t(item.labelKey)}))} />

            <span className={`text-[${HOGU_COLORS.primary}] mt-6 font-bold tracking-wider text-xs uppercase mb-3 block flex items-center gap-2`}>
                <div className="w-8 h-[1px] bg-[#68B49B]"></div> {t('club_listing.header.subtitle')}
            </span>
            <h1 className={`text-4xl md:text-6xl font-extrabold text-slate-800 mb-6 tracking-tight leading-tightt`}>
              {t('club_listing.header.title_part1')}, <br/>
              <span className="text-[#68B49B]">{t('club_listing.header.title_part2')}</span>
            </h1>
            <p className="text-lg text-slate-500 max-w-xl leading-relaxed">
              {t('club_listing.header.description')}
            </p>
         </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 lg:px-8 -mt-16 relative z-20">
        
        <div className={`relative z-50 bg-white rounded-[2rem] p-6 lg:p-8 ${HOGU_THEME.shadowFloat} border border-white/50 backdrop-blur-sm`}>
           <form onSubmit={handleSearch} className="flex flex-col gap-6">
              
              <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
                
                <CityAutocompleteSearch 
                    label={t('club_listing.search.location_label', 'Città')}
                    value={city}
                    onChange={setCity}
                    icon={MapPin}
                />

                <div className="flex flex-col md:flex-row gap-4 lg:gap-6 flex-[3]">
                    
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
                            className={`
                                h-[60px] rounded-2xl border cursor-pointer transition-all duration-300 flex items-center justify-between px-4 shadow-sm
                                ${reserveTable 
                                    ? `bg-[#F0FDF9] border-[#68B49B] ring-1 ring-[#68B49B]` 
                                    : 'bg-white border-gray-100 hover:border-[#68B49B]/30'
                                }
                            `}
                            onClick={() => setReserveTable(!reserveTable)}
                        >
                            <span className={`text-sm font-bold ${reserveTable ? 'text-[#33594C]' : 'text-gray-500'}`}>
                                {reserveTable ? t('club_listing.search.table_premium') : t('club_listing.search.entry_only')}
                            </span>
                            <div className={`
                                w-6 h-6 rounded-full flex items-center justify-center transition-all border
                                ${reserveTable ? 'bg-[#68B49B] border-[#68B49B] text-white' : 'bg-gray-100 border-gray-200 text-transparent'}
                            `}>
                                {reserveTable ? <Star size={14} fill="currentColor" /> : <Check size={14} strokeWidth={3} />}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex items-end">
                  <PrimaryButton type="submit" disabled={loading} className="w-full lg:w-auto h-[60px] !rounded-2xl !px-8 shadow-lg">
                    {loading ? <Loader2 className="animate-spin" size={22}/> : <><span className="ml-2">{t('club_listing.search.search_button')}</span><Search size={22} /></>}
                  </PrimaryButton>
                </div>

              </div>
           </form>
        </div>

        <div className="relative z-0">
            {!hasSearched && (
                <section className="mt-16 mb-12">
                    <div className="flex items-center justify-between mb-8">
                        <h2 className={`text-2xl font-bold text-[${HOGU_COLORS.dark}]`}>
                           Destinazioni Popolari
                        </h2>
                        <div className="flex gap-2">
                            <button className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50 text-gray-400 hover:text-gray-600"><ArrowRight className="rotate-180" size={18}/></button>
                            <button className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50 text-gray-400 hover:text-gray-600"><ArrowRight size={18}/></button>
                        </div>
                    </div>
                    <div className="flex gap-6 overflow-x-auto snap-x snap-mandatory pb-12 no-scrollbar" style={{ scrollbarWidth: 'none' }}>
                        {popularLocations.map((loc) => (
                            <CityDestinationCard 
                                key={loc.city} 
                                city={loc.city} 
                                region={loc.region}
                                imageUrl={loc.imageUrl}
                                onClick={handleCityQuickSearch} 
                            />
                        ))}
                    </div>
                </section>
            )}

            {hasSearched && (
            <div className="mt-12" id="club-results-section" ref={resultsSectionRef}>
                <div className="flex items-center justify-between mb-8">
                    <h2 className={`text-2xl font-bold text-[${HOGU_COLORS.dark}]`}>
                        <span className="text-[#68B49B]">{services.length}</span> {t('club_listing.results.found', { count: services.length })}
                    </h2>
                    {services.length > 0 && (
                        <span className="text-sm text-gray-400 font-medium">
                            Pagina {currentPage} di {totalPages}
                        </span>
                    )}
                </div>

                {services.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-3xl border border-gray-100">
                          <Music size={40} className="text-gray-300 mx-auto mb-4" />
                          <h3 className="text-lg font-bold text-gray-700">{t('club_listing.results.no_events')}</h3>
                    </div>
                ) : (
                    <>
                        <div className="flex flex-col gap-6">
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
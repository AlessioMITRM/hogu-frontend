import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom'; 
import { Search, MapPin, Luggage, Minus, Plus, Calendar, Clock, ArrowRight, CheckCircle2, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { Breadcrumbs } from '../../ui/Breadcrumbs.jsx'; 

// ** IMPORTA I TUOI FILE JSON QUI **
import italianLocationsData from '../../../assets/data/italian_locations.json'; 
import englishLocationsData from '../../../assets/data/english_locations.json'; 
import { HOGU_COLORS, HOGU_THEME } from '../../../config/theme.js';

// ** IMPORTA IL CLIENT API E COMPONENTI UI CONDIVISI **
import { listingService } from '../../../api/apiClient.js';
import LoadingScreen from "../../ui/LoadingScreen.jsx"; 
import ErrorModal from "../../ui/ErrorModal.jsx";

// ** UTILS **
import { slugify } from '../../../utils/slugify.js';

const breadcrumbsItems = [
    { labelKey: 'breadcrumbs.home', href: '/' },
    { labelKey: 'breadcrumbs.luggage', href: '/service/luggage' }
];

// --- DATI DESTINAZIONI POPOLARI ---
const POPULAR_DESTINATIONS = [
  {
    city: "Roma",
    country: "Italia",
    searchLocation: "Roma, Lazio", 
    img: "https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=600&q=80",
  },
  {
    city: "Milano",
    country: "Italia",
    searchLocation: "Milano, Lombardia",
    img: "https://images.unsplash.com/photo-1513581166391-887a96ddeafd?auto=format&fit=crop&w=600&q=80",
  },
  {
    city: "Firenze",
    country: "Italia",
    searchLocation: "Firenze, Toscana",
    img: "https://images.unsplash.com/photo-1541963463532-d68292c34b19?auto=format&fit=crop&w=600&q=80",
  },
  {
    city: "Palermo", 
    country: "Italia",
    searchLocation: "Palermo, Sicilia", 
    img: "https://images.unsplash.com/photo-1597913943622-540c49733072?auto=format&fit=crop&w=600&q=80",
  },
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
    
    // Stato locale per l'input visivo
    const [inputValue, setInputValue] = useState(value || "");

    // Sincronizza input locale se cambia value dall'esterno
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
        <div className="flex flex-col gap-3 flex-[1.5] min-w-[200px] relative" ref={wrapperRef}>
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
                    placeholder={t('luggage_listing.search.location_placeholder', "Dove ti serve il deposito?")}
                    className="w-full h-full px-3 bg-transparent border-none focus:ring-0 text-base font-medium text-gray-700 outline-none placeholder:text-gray-300"
                    autoComplete="off"
                />
                
                {showSuggestions && suggestions.length > 0 && (
                    <div className="absolute top-full left-0 mt-2 w-full bg-white rounded-xl shadow-xl border border-gray-100 max-h-60 overflow-y-auto z-50">
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
                      <div className="absolute top-full left-0 mt-2 w-full bg-white rounded-xl shadow-xl border border-gray-100 p-4 text-center text-gray-400 text-sm z-50">
                        {t('luggage_listing.search.not_found_citys')}
                      </div>
                )}
            </div>
        </div>
    );
};

// --- COMPONENTE CARD DESTINAZIONE ---
const DestinationCard = ({ city, country, img, onClick }) => {
    return (
      <div 
        onClick={onClick}
        className="flex-shrink-0 w-60 snap-start group cursor-pointer relative"
      >
        <div className="relative rounded-3xl overflow-hidden aspect-[3/4] shadow-md transition-all duration-500 group-hover:shadow-xl group-hover:-translate-y-2">
          <img
            src={img}
            alt={city}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            onError={(e) => { e.target.src = 'https://placehold.co/400x600/E6F5F0/68B49B?text=HOGU'; }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />
          <div className="absolute bottom-0 left-0 p-6 text-white transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
            <p className="text-xs font-medium uppercase tracking-wider opacity-80 mb-1">
              {country}
            </p>
            <h3 className="text-xl font-bold">{city}</h3>
            <div className="w-8 h-1 bg-[#68B49B] rounded-full mt-3 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          </div>
        </div>
      </div>
    );
};

// --- COMPONENTI UI BASE ---
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

function IconButton({ onClick, icon: Icon, disabled, colorClass = "text-gray-600" }) {
    return (
        <button 
            onClick={(e) => { e.stopPropagation(); onClick(); }}
            disabled={disabled}
            type="button"
            className={`
                w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200
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

const SearchInputContainer = ({ label, icon: Icon, children, className = '' }) => (
    <div className={`flex flex-col gap-3 flex-1 min-w-[200px] ${className}`}>
      <label className={`flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-[${HOGU_COLORS.subtleText}] ml-1`}>
        <Icon size={14} className={`text-[${HOGU_COLORS.primary}]`} />
        {label}
      </label>
      <div className="flex gap-2 bg-white p-1.5 rounded-2xl border border-gray-100 shadow-sm focus-within:ring-2 focus-within:ring-[#68B49B]/20 focus-within:border-[#68B49B] transition-all h-[60px] items-center">
        {children}
      </div>
    </div>
);

// --- DATI MOCK ---
const LUGGAGE_SIZES_MOCK = [
  { value: 'S', labelKey: 'luggage_listing.luggage_selector.size_s_label', descKey: 'luggage_listing.luggage_selector.size_s_desc' },
  { value: 'M', labelKey: 'luggage_listing.luggage_selector.size_m_label', descKey: 'luggage_listing.luggage_selector.size_m_desc' },
  { value: 'L', labelKey: 'luggage_listing.luggage_selector.size_l_label', descKey: 'luggage_listing.luggage_selector.size_l_desc' },
];

// --- COMPONENTE PRINCIPALE ---

function ServiceListingLuggage() {
    const { t } = useTranslation("home");
    const navigate = useNavigate();
    const [urlSearchParams] = useSearchParams();

    // 1. INIZIALIZZAZIONE STATO DA URL
    const today = new Date().toISOString().split('T')[0];
    
    const initialLocation = urlSearchParams.get('location') || '';
    const initialDepositDate = urlSearchParams.get('dateFrom') || today;
    const initialPickupDate = urlSearchParams.get('dateTo') || today;
    const initialDepositTime = urlSearchParams.get('timeFrom') || '09:00';
    const initialPickupTime = urlSearchParams.get('timeTo') || '18:00';
    
    // Luggage initialization (simplified for URL params, could be expanded)
    const initialBagsS = parseInt(urlSearchParams.get('bagsS')) || 0;
    const initialBagsM = parseInt(urlSearchParams.get('bagsM')) || 1;
    const initialBagsL = parseInt(urlSearchParams.get('bagsL')) || 0;
    
    const [services, setServices] = useState([]);
    const [hasSearched, setHasSearched] = useState(false);
    
    // Loading & Error
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    
    // Paginazione
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const pageSize = 5;
  
    // Stato Criteri Ricerca
    const [searchCriteria, setSearchCriteria] = useState({
      location: initialLocation, 
      depositDate: initialDepositDate,
      depositTime: initialDepositTime,
      pickupDate: initialPickupDate,
      pickupTime: initialPickupTime,
      luggage: [
        { id: 'S', size: 'S', labelKey: LUGGAGE_SIZES_MOCK[0].labelKey, descKey: LUGGAGE_SIZES_MOCK[0].descKey, quantity: initialBagsS },
        { id: 'M', size: 'M', labelKey: LUGGAGE_SIZES_MOCK[1].labelKey, descKey: LUGGAGE_SIZES_MOCK[1].descKey, quantity: initialBagsM },
        { id: 'L', size: 'L', labelKey: LUGGAGE_SIZES_MOCK[2].labelKey, descKey: LUGGAGE_SIZES_MOCK[2].descKey, quantity: initialBagsL },
      ], 
    });

    const totalBags = searchCriteria.luggage.reduce((acc, curr) => acc + curr.quantity, 0);
    
    // RIFERIMENTO PER SCROLL AUTOMATICO
    const resultsSectionRef = useRef(null);

    // Format UTC con "Z"
    const combineDateTime = (date, time) => {
        if (!date || !time) return null;
        return `${date}T${time}:00Z`; 
    };

    // Helper per calcolare la data di domani
    const getTomorrowDateString = () => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        return tomorrow.toISOString().split('T')[0];
    };

    // --- FUNZIONE FETCH PURA (MODIFICATA CON SCROLL) ---
    const executeSearch = async (params, shouldScroll = false) => {
        const rawLocation = params.location;
        const cleanLocation = rawLocation ? rawLocation.split(',')[0].trim() : '';

        if (!cleanLocation) {
             setError({
                title: t('errors.missing_location_title', 'Attenzione'),
                message: t('errors.missing_location', 'Inserisci una città per cercare.')
             });
             return;
        }

        setIsLoading(true);
        setError(null);
        
        try {
            const requestParams = {
                location: cleanLocation, 
                page: (params.page || 1) - 1,
                size: pageSize,
                dropOff: combineDateTime(params.depositDate, params.depositTime),
                pickUp: combineDateTime(params.pickupDate, params.pickupTime),
                bagsS: params.luggage.find(l => l.id === 'S')?.quantity || 0,
                bagsM: params.luggage.find(l => l.id === 'M')?.quantity || 0,
                bagsL: params.luggage.find(l => l.id === 'L')?.quantity || 0
            };

            const response = await listingService.searchLuggage(requestParams);
            
            if (response && response.content) {
                setServices(response.content);
                setTotalPages(response.totalPages);
            } else if (Array.isArray(response)) {
                setServices(response);
                setTotalPages(1);
            } else {
                setServices([]);
                setTotalPages(0);
            }
            
            setCurrentPage(params.page || 1);
            setHasSearched(true);
            
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
            console.error("Search error:", err);
            setError({
                title: t('errors.search_failed_title', 'Errore Ricerca'),
                message: err.message || t('errors.search_failed', 'Si è verificato un errore.')
            });
            setServices([]);
        } finally {
            setIsLoading(false);
        }
    };

    // --- AUTO START DA URL ---
    useEffect(() => {
        if (initialLocation && !hasSearched) {
            const payload = {
                location: initialLocation,
                depositDate: initialDepositDate,
                depositTime: initialDepositTime,
                pickupDate: initialPickupDate,
                pickupTime: initialPickupTime,
                luggage: searchCriteria.luggage, 
                page: 1
            };
            // Scroll attivo all'avvio
            executeSearch(payload, true);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleCloseError = () => {
        setError(null);
    };

    const handleSearchClick = (e) => {
        e.preventDefault();
        
        const payload = {
            ...searchCriteria,
            page: 1
        };

        // Aggiorna URL
        const bagsS = searchCriteria.luggage.find(l => l.id === 'S')?.quantity || 0;
        const bagsM = searchCriteria.luggage.find(l => l.id === 'M')?.quantity || 0;
        const bagsL = searchCriteria.luggage.find(l => l.id === 'L')?.quantity || 0;

        const urlParams = new URLSearchParams({
            location: searchCriteria.location,
            dateFrom: searchCriteria.depositDate,
            timeFrom: searchCriteria.depositTime,
            dateTo: searchCriteria.pickupDate,
            timeTo: searchCriteria.pickupTime,
            bagsS: bagsS.toString(),
            bagsM: bagsM.toString(),
            bagsL: bagsL.toString()
        }).toString();

        navigate(`/service/luggage?${urlParams}`, { replace: true });

        // Cerca con scroll
        executeSearch(payload, true);
    };

    // Handler per il click sulle card (Destinazioni Popolari)
    const handleDestinationClick = (locationStr) => {
        const tomorrowStr = getTomorrowDateString();
        
        // Aggiorna stato
        setSearchCriteria(prev => ({
            ...prev,
            location: locationStr,
            depositDate: tomorrowStr,
            pickupDate: tomorrowStr
        }));

        const payload = {
            ...searchCriteria,
            location: locationStr,
            depositDate: tomorrowStr,
            pickupDate: tomorrowStr,
            page: 1
        };

        // Aggiorna URL
        const bagsS = searchCriteria.luggage.find(l => l.id === 'S')?.quantity || 0;
        const bagsM = searchCriteria.luggage.find(l => l.id === 'M')?.quantity || 0;
        const bagsL = searchCriteria.luggage.find(l => l.id === 'L')?.quantity || 0;

        const urlParams = new URLSearchParams({
            location: locationStr,
            dateFrom: tomorrowStr,
            timeFrom: searchCriteria.depositTime,
            dateTo: tomorrowStr,
            timeTo: searchCriteria.pickupTime,
            bagsS: bagsS.toString(),
            bagsM: bagsM.toString(),
            bagsL: bagsL.toString()
        }).toString();

        navigate(`/service/luggage?${urlParams}`, { replace: true });

        // Cerca con scroll
        executeSearch(payload, true);
    };

    const handlePageChange = (newPageNumber) => {
        const payload = {
            ...searchCriteria,
            page: newPageNumber
        };
        // Scroll al cambio pagina
        executeSearch(payload, true);
    };

    const updateCriteria = (field, value) => {
      setSearchCriteria(prev => ({ ...prev, [field]: value }));
    };
  
    const updateLuggageQuantity = (id, change) => {
      setSearchCriteria(prev => ({
        ...prev,
        luggage: prev.luggage.map(item => {
          if (item.id === id) {
            const newQuantity = Math.max(0, item.quantity + change);
            return { ...item, quantity: newQuantity };
          }
          return item;
        }),
      }));
    };

    const handleServiceClick = (service) => {
        if (service && service.id) {
            const slug = slugify(service.name ? service.name : 'luggage-storage');
            
            const urlParams = new URLSearchParams({
                dateFrom: searchCriteria.depositDate,
                timeFrom: searchCriteria.depositTime,
                dateTo: searchCriteria.pickupDate,
                timeTo: searchCriteria.pickupTime,
                // Aggiungi qui altri dettagli se necessario per la pagina dettaglio
            }).toString();

            navigate(`/luggage/${slug}-${service.id}?${urlParams}`);
        }
    };

    // Card Bagaglio
    const LuggageSelectorCard = ({ bag }) => {
        const isSelected = bag.quantity > 0;
        return (
          <div 
              onClick={() => updateLuggageQuantity(bag.id, 1)}
              className={`
                  relative p-3 rounded-2xl border transition-all duration-200 cursor-pointer select-none group 
                  flex flex-row sm:flex-col items-center justify-between sm:justify-center text-left sm:text-center gap-3 sm:gap-0
                  ${isSelected 
                      ? 'bg-[#F0FDF9] border-[#68B49B] shadow-md' 
                      : 'bg-white border-gray-100 hover:border-[#68B49B]/50 hover:shadow-lg'
                  }
               `}
          >
              <div className="flex items-center sm:flex-col gap-3 sm:gap-0 flex-1">
                  <div className={`p-2 rounded-full sm:mb-1 shrink-0 ${isSelected ? 'bg-[#68B49B] text-white' : 'bg-gray-50 text-gray-400'}`}>
                      <Luggage size={18} />
                  </div>
                  <div>
                      <p className={`text-sm font-bold ${isSelected ? 'text-[#33594C]' : 'text-gray-700'}`}>{t(bag.labelKey)}</p>
                      <p className="text-[10px] text-gray-400 sm:mt-0.5 leading-tight">{t(bag.descKey)}</p>
                  </div>
              </div>
              
              <div className="flex items-center gap-2 sm:mt-2 shrink-0">
                  <IconButton icon={Minus} onClick={() => updateLuggageQuantity(bag.id, -1)} disabled={bag.quantity <= 0} />
                  <span className="text-sm font-bold w-3 text-center">{bag.quantity}</span>
                  <IconButton icon={Plus} onClick={() => updateLuggageQuantity(bag.id, 1)} colorClass="text-[#68B49B]" />
              </div>
          </div>
        );
    };

    // Paginazione
    const Pagination = () => {
        if (totalPages <= 1) return null;
        const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
        return (
            <div className="flex items-center justify-center gap-2 mt-12">
                <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`w-10 h-10 flex items-center justify-center rounded-full border transition-all ${currentPage === 1 ? 'border-gray-100 text-gray-300 cursor-not-allowed' : 'border-gray-200 text-gray-600 hover:border-[#68B49B] hover:text-[#68B49B] bg-white hover:shadow-md'}`}
                >
                    <ChevronLeft size={20} />
                </button>
                <div className="flex items-center gap-1">
                    {pages.map((number) => (
                        <button
                            key={number}
                            onClick={() => handlePageChange(number)}
                            className={`w-10 h-10 rounded-full font-bold text-sm transition-all ${currentPage === number ? 'bg-[#68B49B] text-white shadow-lg shadow-[#68B49B]/30' : 'text-gray-600 hover:bg-gray-100'}`}
                        >
                            {number}
                        </button>
                    ))}
                </div>
                <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={`w-10 h-10 flex items-center justify-center rounded-full border transition-all ${currentPage === totalPages ? 'border-gray-100 text-gray-300 cursor-not-allowed' : 'border-gray-200 text-gray-600 hover:border-[#68B49B] hover:text-[#68B49B] bg-white hover:shadow-md'}`}
                >
                    <ChevronRight size={20} />
                </button>
            </div>
        );
    };

  return (
    <div className={`min-h-screen bg-[#F8FAFC] pb-20 ${HOGU_THEME.fontFamily}`}>
      <LoadingScreen isLoading={isLoading} />
      {error && (
        <ErrorModal 
          isOpen={!!error} 
          title={error.title} 
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
                <div className="w-8 h-[1px] bg-[#68B49B]"></div> {t('luggage_listing.header.subtitle')}
            </span>
            <h1 className={`text-4xl md:text-6xl font-extrabold text-[${HOGU_COLORS.dark}] mb-6 tracking-tight leading-tight`}>
              {t('luggage_listing.header.title_part1')}, <br/>
              <span className="text-[#68B49B]">{t('luggage_listing.header.title_part2')}</span>
            </h1>
            <p className={`text-lg text-[${HOGU_COLORS.subtleText}] max-w-xl leading-relaxed`}>
              {t('luggage_listing.header.description')}
            </p>
         </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 lg:px-8 -mt-16 relative z-20">
        <div className={`bg-white rounded-[2rem] p-6 lg:p-8 ${HOGU_THEME.shadowFloat} border border-white/50 backdrop-blur-sm`}>
            <div className="flex flex-col gap-6">
                <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
                    <CityAutocompleteSearch 
                        label={t('luggage_listing.search.where_are_you')} 
                        value={searchCriteria.location}
                        onChange={(val) => updateCriteria('location', val)}
                        icon={MapPin}
                    />
                    <SearchInputContainer label={t('luggage_listing.search.deposit')} icon={Calendar}>
                        <input
                            type="date"
                            value={searchCriteria.depositDate}
                            onChange={(e) => updateCriteria('depositDate', e.target.value)}
                            className="w-full h-full px-2 bg-transparent border-none focus:ring-0 text-sm font-medium text-gray-700 outline-none cursor-pointer"
                        />
                        <input
                            type="time"
                            value={searchCriteria.depositTime}
                            onChange={(e) => updateCriteria('depositTime', e.target.value)}
                            className="w-20 h-full px-0 bg-transparent border-none focus:ring-0 text-sm font-medium text-gray-700 outline-none cursor-pointer text-right"
                        />
                    </SearchInputContainer>
                    <SearchInputContainer label={t('luggage_listing.search.pickup')} icon={Clock}>
                        <input
                            type="date"
                            value={searchCriteria.pickupDate}
                            onChange={(e) => updateCriteria('pickupDate', e.target.value)}
                            className="w-full h-full px-2 bg-transparent border-none focus:ring-0 text-sm font-medium text-gray-700 outline-none cursor-pointer"
                        />
                        <input
                            type="time"
                            value={searchCriteria.pickupTime}
                            onChange={(e) => updateCriteria('pickupTime', e.target.value)}
                            className="w-20 h-full px-0 bg-transparent border-none focus:ring-0 text-sm font-medium text-gray-700 outline-none cursor-pointer text-right"
                        />
                    </SearchInputContainer>
                </div>
                <div className="h-px w-full bg-gray-100 lg:hidden"></div>
                <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center">
                    <div className="flex-1 w-full">
                        <label className={`block text-xs font-bold uppercase tracking-wide text-[${HOGU_COLORS.subtleText}] mb-3 ml-1`}>
                            {t('luggage_listing.search.luggage_label')}
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            {searchCriteria.luggage.map(bag => (
                                <LuggageSelectorCard key={bag.id} bag={bag} />
                            ))}
                        </div>
                    </div>
                    <div className="w-full lg:w-auto flex self-stretch lg:self-end pt-2">
                        <PrimaryButton 
                            onClick={handleSearchClick} 
                            disabled={isLoading}
                            className="w-full lg:w-auto h-full min-h-[60px] !rounded-2xl shadow-lg shadow-[#68B49B]/20 hover:shadow-[#68B49B]/40"
                        >
                            <span className="ml-2">{t('luggage_listing.search.search_button')}</span>
                            <Search size={22} />
                        </PrimaryButton>
                    </div>
                </div>
            </div>
        </div>

        {/* SEZIONE DESTINAZIONI POPOLARI */}
        {!hasSearched && !isLoading && (
            <section className="mt-16 mb-12 relative z-10">
                <div className="flex items-center justify-between mb-8">
                    <h2 className={`text-2xl font-bold text-[${HOGU_COLORS.dark}]`}>
                        Destinazioni Popolari
                    </h2>
                    <div className="flex gap-2">
                        <button className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50 text-gray-400 hover:text-gray-600">
                            <ArrowRight className="rotate-180" size={18} />
                        </button>
                        <button className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50 text-gray-400 hover:text-gray-600">
                            <ArrowRight size={18} />
                        </button>
                    </div>
                </div>
                <div className="flex gap-6 overflow-x-auto snap-x snap-mandatory pb-8 no-scrollbar" style={{ scrollbarWidth: "none" }}>
                    {POPULAR_DESTINATIONS.map((dest) => (
                        <DestinationCard 
                            key={dest.city} 
                            {...dest} 
                            onClick={() => handleDestinationClick(dest.searchLocation)}
                        />
                    ))}
                </div>
            </section>
        )}

        <div className="mt-16 mb-12" id="results-section" ref={resultsSectionRef}>
            {!isLoading && hasSearched && !error && (
                 <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 mb-6 sm:mb-8">
                  <h2 className={`text-xl sm:text-2xl font-bold text-[${HOGU_COLORS.dark}]`}>
                      <span className="text-[#68B49B]">{services.length}</span> {t('luggage_listing.results.available_deposits', { count: services.length })}
                  </h2>
                  {services.length > 0 && (
                      <span className="text-xs sm:text-sm text-gray-400 font-medium">
                          Pagina {currentPage} di {totalPages}
                      </span>
                  )}
                 </div>
            )}

            {!isLoading && services.length === 0 && hasSearched && !error && (
              <div className="text-center py-20 bg-white rounded-3xl border border-gray-100">
                <div className="inline-block p-4 rounded-full bg-gray-50 mb-4">
                   <Search className="text-gray-300" size={40} />
                </div>
                <p className="text-gray-500 font-medium">{t('luggage_listing.results.no_deposits_found')}</p>
              </div>
            )}

            {!isLoading && services.length > 0 && !error && (
              <>
                <div className="flex flex-col gap-6">
                  {services.map(service => {
                    const basePrice = parseFloat(service.price || 0);
                    const days = 1; 
                    const totalPrice = (basePrice * (totalBags || 1) * days).toFixed(2);

                    return (
                    <div 
                      key={service.id} 
                      className={`
                        group bg-white rounded-3xl overflow-hidden flex flex-col md:flex-row border border-gray-100 
                        ${HOGU_THEME.shadowCard} transition-all duration-300 hover:-translate-y-1 cursor-pointer
                        min-h-[240px]
                      `}
                      onClick={() => handleServiceClick(service)}
                    >
                      <div className="md:w-1/3 h-64 md:h-auto relative overflow-hidden bg-gray-50 flex items-center justify-center p-4">
                        <img 
                          src={service.imageUrl || `https://placehold.co/800x600/${HOGU_COLORS.dark.substring(1)}/${HOGU_COLORS.primary.substring(1)}?text=${encodeURIComponent(service.name)}`}
                          alt={service.name}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                          onError={(e) => { e.target.src = `https://placehold.co/600x400/EEE/CCC?text=${t('luggage_listing.card.img_fallback')}`; }}
                        />
                      </div>

                      <div className="p-6 md:p-8 flex-1 flex flex-col">
                        <div className="flex justify-between items-start mb-2">
                            <h3 className={`text-2xl font-bold ${HOGU_THEME.text} group-hover:text-[#68B49B] transition-colors`}>{service.name}</h3>
                        </div>
                        <p className={`text-sm mt-0 flex items-center gap-1 text-[${HOGU_COLORS.subtleText}]`}>
                            <MapPin size={14} /> {service.location || service.address}
                        </p>
                        <p className="text-gray-500 text-sm leading-relaxed my-3 line-clamp-2">
                           {service.description}
                        </p>
                        <div className="flex flex-wrap gap-x-4 gap-y-2 mb-4 text-xs text-gray-500 font-medium">
                           <span className="flex items-center gap-1"><CheckCircle2 size={12} className="text-[#68B49B]"/> {t('luggage_listing.card.feature_insurance')}</span>
                           <span className="flex items-center gap-1"><CheckCircle2 size={12} className="text-[#68B49B]"/> {t('luggage_listing.card.feature_cancellation')}</span>
                        </div>
                        <div className="flex-grow" />
                        
                        <div className="mt-auto pt-4 border-t border-gray-50 flex justify-between items-end">
                           <div>
                               <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mb-0.5">
                                   {t('luggage_listing.card.estimated_total')}
                               </p>
                               <div className="flex items-baseline gap-1">
                                   <span className={`text-3xl font-extrabold text-[${HOGU_COLORS.dark}]`}>€{totalPrice}</span>
                                   <span className="text-sm text-gray-400 font-medium ml-1">
                                     (€{service.price} / bag / day)
                                   </span>
                               </div>
                           </div>
                           <button 
                               className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center text-[#68B49B] group-hover:bg-[#68B49B] group-hover:text-white transition-all duration-300 shadow-sm"
                           >
                              <ArrowRight size={24} />
                           </button>
                        </div>
                      </div>
                    </div>
                  )})}
                </div>
                <Pagination />
              </>
            )}
        </div>
      </div>
    </div>
  );
}

export default ServiceListingLuggage;
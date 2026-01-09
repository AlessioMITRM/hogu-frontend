import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Search, MapPin, Utensils, Calendar, ArrowRight, ChefHat, Clock,
  ChevronLeft, ChevronRight, ChevronDown, Loader2
} from 'lucide-react';
import { Breadcrumbs } from '../../ui/Breadcrumbs.jsx'; 
import { HOGU_COLORS, HOGU_THEME } from '../../../config/theme.js';
import { restaurantService } from '../../../api/apiClient.js';
import { slugify } from '../../../utils/slugify.js';

// ** IMPORT DATI GEOGRAFICI **
import italianLocationsData from '../../../assets/data/italian_locations.json'; 
import englishLocationsData from '../../../assets/data/english_locations.json'; 

// ** IMPORT COMPONENTI UI **
import LoadingScreen from '../../ui/LoadingScreen.jsx'; 
import ErrorModal from '../../ui/ErrorModal.jsx';

const breadcrumbsItems = [
    { labelKey: 'breadcrumbs.home', href: '/' }, 
    { labelKey: 'breadcrumbs.restaurant', href: '/service/restaurant' }
];

// --- UTILITY PER GESTIRE I DATI GEOGRAFICI (INVARIATO) ---
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

// --- UTILITY PER GLI SLOT ORARI (INVARIATO) ---
const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 12; hour <= 23; hour++) {
        const formattedHour = hour.toString().padStart(2, '0');
        slots.push(`${formattedHour}:00`);
        slots.push(`${formattedHour}:30`);
    }
    return slots;
};

// --- DATI POPOLARI (Città) ---
const POPULAR_LOCATIONS_DATA = [
  { 
    name: 'Roma',
    label: 'Roma, Lazio',
    searchLocation: 'Roma, Lazio',
    image: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=600&q=80'
  },
  { 
    name: 'Milano',
    label: 'Milano, Lombardia',
    searchLocation: 'Milano, Lombardia',
    image: 'https://images.unsplash.com/photo-1513581166391-887a96ddeafd?auto=format&fit=crop&w=600&q=80'
  },
  { 
    name: 'Firenze',
    label: 'Firenze, Toscana',
    searchLocation: 'Firenze, Toscana',
    image: 'https://images.unsplash.com/photo-1543429776-2782fc8e1acd?auto=format&fit=crop&w=600&q=80'
  },
  { 
    name: 'Napoli',
    label: 'Napoli, Campania',
    searchLocation: 'Napoli, Campania',
    image: 'https://images.unsplash.com/photo-1595842886737-1246c4f057d3?auto=format&fit=crop&w=600&q=80'
  }
];

// --- COMPONENTE AUTOCOMPLETE ---
const CityAutocompleteSearch = ({ label, value, onChange, icon: Icon }) => {
    const { i18n, t } = useTranslation("home");
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const wrapperRef = useRef(null);

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
        onChange(formattedLocation); 
        setShowSuggestions(false);
    };

    return (
        <div className="flex flex-col gap-3 flex-1 min-w-[200px] relative z-[100]" ref={wrapperRef}>
            <label className={`flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-[${HOGU_COLORS.subtleText}] ml-1`}>
                <Icon size={14} className={`text-[${HOGU_COLORS.primary}]`} />
                {label}
            </label>
            <div className="flex gap-2 bg-white p-1.5 rounded-2xl border border-gray-100 shadow-sm focus-within:ring-2 focus-within:ring-[#68B49B]/20 focus-within:border-[#68B49B] transition-all h-[60px] items-center relative">
                <input 
                    type="text"
                    value={value}
                    onChange={handleInputChange}
                    onFocus={() => value.length > 2 && setShowSuggestions(true)}
                    placeholder={t('restaurant_listing.search.location_placeholder', "Cerca città...")}
                    className="w-full h-full px-3 bg-transparent border-none focus:ring-0 text-base font-medium text-gray-700 outline-none placeholder:text-gray-300"
                    autoComplete="off"
                />
                
                {showSuggestions && suggestions.length > 0 && (
                    <div className="absolute top-full left-0 mt-2 w-full bg-white rounded-xl shadow-xl border border-gray-100 max-h-60 overflow-y-auto z-[101]">
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
                 {showSuggestions && value.length > 2 && suggestions.length === 0 && (
                      <div className="absolute top-full left-0 mt-2 w-full bg-white rounded-xl shadow-xl border border-gray-100 p-4 text-center text-gray-400 text-sm z-[101]">
                        {t('restaurant_listing.search.not_found_citys')}
                      </div>
                )}
            </div>
        </div>
    );
};

// --- UI HELPERS ---
function PrimaryButton({ children, onClick, className = '', disabled = false, type = 'button', style = {} }) {
  return (
    <button type={type} onClick={onClick} disabled={disabled} style={style}
      className={`bg-[#68B49B] text-white ${HOGU_THEME.fontFamily}
        px-6 py-3 lg:px-8 lg:py-4 text-base lg:text-lg font-bold rounded-2xl transition-all duration-300 ease-out
        shadow-[0_8px_20px_-6px_rgba(104,180,155,0.5)] hover:shadow-[0_12px_25px_-8px_rgba(104,180,155,0.7)]
        hover:-translate-y-0.5 active:translate-y-0
        disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none flex items-center justify-center gap-2 ${className}`}>
      {children}
    </button>
  );
}

const SearchInputContainer = ({ label, icon: Icon, children, className = '' }) => (
    <div className={`flex flex-col gap-3 flex-1 min-w-[180px] relative z-10 ${className}`}>
      <label className={`flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-[${HOGU_COLORS.subtleText}] ml-1`}>
        <Icon size={14} className={`text-[${HOGU_COLORS.primary}]`} />
        {label}
      </label>
      <div className="flex gap-2 bg-white p-1.5 rounded-2xl border border-gray-100 shadow-sm focus-within:ring-2 focus-within:ring-[#68B49B]/20 focus-within:border-[#68B49B] transition-all h-[60px]">
        {children}
      </div>
    </div>
);

// --- CARD: POPULAR LOCATION (Città) ---
const PopularLocationCard = ({ name, label, image, onClick }) => {
    return (
    <div 
      className="flex-shrink-0 w-72 snap-start cursor-pointer group relative"
      onClick={onClick}
    >
        <div className="relative rounded-[2rem] overflow-hidden aspect-[3/4] shadow-md transition-all duration-500 group-hover:shadow-2xl group-hover:-translate-y-2">
            <img 
                src={image} 
                alt={name}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                onError={(e) => { e.target.src = 'https://placehold.co/400x500/EEE/999?text=City'; }}
            />
            
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-80" />
            <div className="absolute bottom-0 left-0 p-6 text-white w-full transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                <h3 className="text-2xl font-extrabold leading-tight mb-1">{name}</h3>
                <div className="flex items-center gap-1 text-sm text-gray-300 mb-3">
                    <MapPin size={14} />
                    <span>{label}</span>
                </div>
                <div className="flex items-center gap-2 text-[#68B49B] font-bold text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    Scopri ristoranti <ArrowRight size={16} />
                </div>
            </div>
        </div>
    </div>
)};


// --- CARD: RISULTATO RISTORANTE ---
const RestaurantResultCard = ({ service, onClick }) => {
    const { t } = useTranslation("home");

    const getPriceCategory = (price) => {
        const uniformStyle = 'bg-[#F0FDF9] text-[#68B49B] border-[#68B49B]/20 backdrop-blur-md';
        if (price <= 35) return { label: '€', style: uniformStyle };
        if (price <= 60) return { label: '€€', style: uniformStyle };
        return { label: '€€€', style: uniformStyle };
    };

    const priceInfo = getPriceCategory(service.averagePrice);

    return (
      <div 
        className={`bg-white rounded-3xl overflow-hidden flex flex-col md:flex-row border border-gray-100 ${HOGU_THEME.shadowCard} transition-all duration-300 hover:-translate-y-1 cursor-pointer group min-h-[240px]`}
        onClick={onClick}
      >
        <div 
            className="md:w-1/3 h-64 md:h-auto relative overflow-hidden bg-white flex items-center justify-center p-4 isolate transform-gpu"
            style={{ WebkitMaskImage: '-webkit-radial-gradient(white, black)' }}
        >
          <div className="absolute top-4 left-4 z-20">
             <span className={`text-xs font-extrabold tracking-widest px-3 py-1.5 rounded-lg shadow-sm border ${priceInfo.style}`}>
                 {priceInfo.label}
             </span>
          </div>

          <img 
            src={service.imageUrl || `https://placehold.co/800x600/${HOGU_COLORS.dark.substring(1)}/${HOGU_COLORS.primary.substring(1)}?text=${encodeURIComponent(service.name)}`}
            alt={service.name}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 backface-hidden"
            style={{ backfaceVisibility: 'hidden' }}
            onError={(e) => { e.target.src = `https://placehold.co/600x400/CCCCCC/333333?text=${t('restaurant_listing.card.img_fallback_search')}`; }}
          />
        </div>

        <div className="p-6 md:p-8 flex-1 flex flex-col">
          <div className="flex justify-between items-start mb-1">
              <div className="w-full">
                 <div className="flex justify-between items-start">
                      <h2 className={`text-2xl font-bold ${HOGU_THEME.text} group-hover:text-[#68B49B] transition-colors`}>{service.name}</h2>
                 </div>
                 <div className="flex items-center gap-2 mt-1 mb-4">
                    <p className={`text-sm flex items-center gap-1 ${HOGU_THEME.subtleText}`}>
                        <MapPin size={14} className="text-[#68B49B]" /> {service.location}
                    </p>
                 </div>
              </div>
          </div>
          
          <p className="text-gray-500 text-sm leading-relaxed mb-4 line-clamp-2">
            {service.description}
          </p>
          
          <div className="flex-grow" />
          
          <div className="mt-auto pt-4 border-t border-gray-50 flex items-end justify-between">
            <div>
               <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">
                   {t('restaurant_listing.card.avg_price_label', 'Prezzo Medio')}
               </p>
               <div className="flex items-baseline gap-1">
                   <span className="text-3xl font-extrabold text-gray-800">€ {service.averagePrice}</span>
                   <span className="text-sm text-gray-500">,00</span>
               </div>
            </div>

            <button 
                className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center text-[#68B49B] group-hover:bg-[#68B49B] group-hover:text-white transition-colors duration-300 shadow-sm"
                title="Vedi Dettagli"
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

    // --- DATI POPOLARI (Città) ---
    const POPULAR_LOCATIONS_DATA = [
      { 
        name: 'Roma',
        label: 'Roma, Lazio',
        searchLocation: 'Roma, Lazio',
        image: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=600&q=80'
      },
      { 
        name: 'Milano',
        label: 'Milano, Lombardia',
        searchLocation: 'Milano, Lombardia',
        image: 'https://images.unsplash.com/photo-1513581166391-887a96ddeafd?auto=format&fit=crop&w=600&q=80'
      },
      { 
        name: 'Firenze',
        label: 'Firenze, Toscana',
        searchLocation: 'Firenze, Toscana',
        image: 'https://images.unsplash.com/photo-1543429776-2782fc8e1acd?auto=format&fit=crop&w=600&q=80'
      },
      { 
        name: 'Napoli',
        label: 'Napoli, Campania',
        searchLocation: 'Napoli, Campania',
        image: 'https://images.unsplash.com/photo-1595842886737-1246c4f057d3?auto=format&fit=crop&w=600&q=80'
      }
    ];

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
                  : 'Indirizzo non disponibile';
                
                return {
                    id: restaurant.id,
                    name: restaurant.name || 'Ristorante',
                    location: address,
                    type: restaurant.serviceType || 'RESTAURANT',
                    description: restaurant.description || '',
                    averagePrice: restaurant.basePrice || 0,
                    imageUrl: (restaurant.images && restaurant.images.length > 0) ? restaurant.images[0] : null
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

        // Costruzione Payload (location: "Roma, Lazio")
        const payload = {
            location: currentData.location || null,
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
        );
    };

    return (
        <div className={`min-h-screen bg-[#F8FAFC] pb-20 ${HOGU_THEME.fontFamily}`}>
            
            <LoadingScreen isLoading={loading} />
            {error && <ErrorModal message={error} onClose={() => setError(null)} />}

            <div className="bg-white pt-12 pb-24 px-4 lg:px-8 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl -translate-y-1/2 -translate-x-1/3"></div>
                <div className="absolute top-0 right-0 w-96 h-96 bg-[#68B49B]/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
                <div className="max-w-7xl mx-auto relative z-10">
                    <Breadcrumbs items={breadcrumbsItems.map(item => ({...item, label: t(item.labelKey)}))} />
                    <span className={`text-[${HOGU_COLORS.primary}] mt-6 font-bold tracking-wider text-xs uppercase mb-3 block flex items-center gap-2`}>
                        <div className="w-8 h-[1px] bg-[#68B49B]"></div> {t('restaurant_listing.header.subtitle')}
                    </span>
                    <h1 className={`text-4xl md:text-6xl font-extrabold text-[${HOGU_COLORS.dark}] mb-6 tracking-tight leading-tight`}>
                        {t('restaurant_listing.header.title_part1')}, <br/>
                        <span className="text-[#68B49B]">{t('restaurant_listing.header.title_part2')}</span>
                    </h1>
                    <p className={`text-lg text-[${HOGU_COLORS.subtleText}] max-w-xl leading-relaxed`}>
                        {t('restaurant_listing.header.description')}
                    </p>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 lg:px-8 -mt-16 relative z-20">
                <div className={`bg-white rounded-[2rem] p-6 lg:p-8 ${HOGU_THEME.shadowFloat} border border-white/50 backdrop-blur-sm relative z-30`}>
                    <form onSubmit={handleFormSubmit} className="flex flex-col gap-6">
                        <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
                            
                            <CityAutocompleteSearch 
                                label={t('restaurant_listing.search.location_label')}
                                value={search.location}
                                onChange={(val) => setSearch(prev => ({ ...prev, location: val }))}
                                icon={MapPin}
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
                                        className="w-full h-full pl-3 pr-8 bg-transparent border-none focus:ring-0 text-sm font-medium text-gray-700 outline-none cursor-pointer appearance-none"
                                    >
                                        <option value="">Tutti</option>
                                        {timeSlots.map(slot => (
                                            <option key={slot} value={slot}>{slot}</option>
                                        ))}
                                    </select>
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                        <ChevronDown size={16} />
                                    </div>
                                </div>
                            </SearchInputContainer>

                            <div className="flex items-end relative z-0">
                                <PrimaryButton type="submit" disabled={loading} className="w-full lg:w-auto h-[60px] !rounded-2xl !px-8 shadow-lg">
                                    {loading ? <Loader2 className="animate-spin" size={22}/> : <><span className="ml-2">{t('restaurant_listing.search.search_mobile_text')}</span><Search size={22} /></>}
                                </PrimaryButton>
                            </div>
                        </div>
                    </form>
                </div>

                {!hasSearched && !loading && (
                    <section className="mt-16 mb-12 relative z-10">
                        <div className="flex items-center justify-between mb-8">
                            <h2 className={`text-2xl font-bold text-[${HOGU_COLORS.dark}]`}>{t('restaurant_listing.popular.title')}</h2>
                        </div>
                        <div className="flex gap-6 overflow-x-auto snap-x snap-mandatory pb-12 no-scrollbar" style={{ scrollbarWidth: 'none' }}>
                            {POPULAR_LOCATIONS_DATA.map(loc => (
                                <PopularLocationCard 
                                    key={loc.name} 
                                    name={loc.name}
                                    label={loc.label}
                                    image={loc.image}
                                    onClick={() => handlePopularCityClick(loc)} // CORRETTO: Avvia la ricerca
                                />
                            ))}
                        </div>
                    </section>
                )}

                {hasSearched && (
                    <div className="mt-12 relative z-10" id="restaurant-results-section">
                        <div className="flex items-center justify-between mb-8">
                            <h2 className={`text-2xl font-bold text-[${HOGU_COLORS.dark}]`}>
                                {services.length > 0 ? (
                                    <>{services.length} {t('restaurant_listing.results.found', { count: services.length })} <span className="text-sm font-normal text-gray-400 ml-2">(Pagina {currentPage} di {totalPages})</span></>
                                ) : (
                                    t('restaurant_listing.results.no_results_title')
                                )}
                            </h2>
                        </div>

                        {services.length === 0 ? (
                            <div className="text-center py-20 bg-white rounded-3xl border border-gray-100">
                                <Utensils size={40} className="text-gray-300 mx-auto mb-4" />
                                <h3 className="text-lg font-bold text-gray-700">{t('restaurant_listing.results.no_restaurants')}</h3>
                            </div>
                        ) : (
                            <>
                                <div className="flex flex-col gap-6">
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
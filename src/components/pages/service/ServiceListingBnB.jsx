import React, { useState, useMemo, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Search,
  Calendar,
  Users,
  Minus,
  Plus,
  User,
  PersonStanding,
  BedDouble,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Loader2
} from "lucide-react";

import { Breadcrumbs } from "../../ui/Breadcrumbs.jsx";
import { slugify } from "../../../utils/slugify.js";
import { bnbService } from "../../../api/apiClient.js"; 
import LoadingScreen from "../../ui/LoadingScreen.jsx"; 
import ErrorModal from "../../ui/ErrorModal.jsx"; 

// ** IMPORTA I TUOI FILE JSON QUI **
import italianLocationsData from '../../../assets/data/italian_locations.json'; 
import englishLocationsData from '../../../assets/data/english_locations.json'; 
import { HOGU_COLORS, HOGU_THEME } from '../../../config/theme.js';


const breadcrumbsItems = [
  { labelKey: "breadcrumbs.home", href: "/" },
  { labelKey: "breadcrumbs.bnb", href: "/service/bnb" },
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

// --- COMPONENTE AUTOCOMPLETE CITTA' ---
const CityAutocompleteSearch = ({ label, value, onChange, icon: Icon }) => {
    const { i18n, t } = useTranslation();
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const wrapperRef = useRef(null);

    // Stato locale per visualizzare la stringa completa nell'input
    const [inputValue, setInputValue] = useState(value || "");

    // Sincronizza l'input locale se il valore esterno cambia (es. da URL o setCity)
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
        <div className="flex flex-col gap-3 flex-[2] min-w-[200px] relative" ref={wrapperRef}>
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
                    placeholder={t('bnb_listing.search.location_placeholder', "Dove vuoi andare?")}
                    className="w-full h-full px-4 bg-transparent border-none focus:ring-0 text-lg font-medium text-gray-800 placeholder:text-gray-400 outline-none"
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
                           {t('bnb.search.not_found_citys')}
                      </div>
                )}
            </div>
        </div>
    );
};

// --- COMPONENTI UI ---

function PrimaryButton({
  children,
  onClick,
  className = "",
  disabled = false,
  type = "button",
  style = {},
}) {
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

const SearchInputContainer = ({ label, icon: Icon, children, className = "" }) => (
  <div className={`flex flex-col gap-3 flex-1 min-w-[200px] ${className}`}>
    <label
      className={`flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-[${HOGU_COLORS.subtleText}] ml-1`}
    >
      <Icon size={14} className={`text-[${HOGU_COLORS.primary}]`} />
      {label}
    </label>
    <div className="flex gap-2 bg-white p-1.5 rounded-2xl border border-gray-100 shadow-sm focus-within:ring-2 focus-within:ring-[#68B49B]/20 focus-within:border-[#68B49B] transition-all h-[60px]">
      {children}
    </div>
  </div>
);

const GuestRoomModal = ({
  adults,
  setAdults,
  children,
  setChildren,
  rooms,
  setRooms,
  onClose,
}) => {
    const { t } = useTranslation("home");
    
  const Counter = ({ label, value, onDecrement, onIncrement, icon: Icon }) => (
    <div className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
      <div className="flex items-center">
        <div
          className={`p-2 rounded-full bg-[${HOGU_COLORS.lightAccent}] mr-3 text-[${HOGU_COLORS.primary}]`}
        >
          <Icon size={18} />
        </div>
        <span className={`text-sm font-semibold text-gray-700`}>{label}</span>
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={(e) => {
            e.preventDefault();
            onDecrement();
          }}
          disabled={value === 0 || (label === t('bnb_listing.modal.adults_label') && value === 1)}
          className="w-8 h-8 rounded-full border border-gray-200 text-gray-500 hover:bg-gray-50 hover:border-[#68B49B] hover:text-[#68B49B] disabled:opacity-30 flex items-center justify-center transition-colors"
        >
          <Minus size={14} strokeWidth={3} />
        </button>
        <span className="w-4 text-center font-bold text-gray-800">{value}</span>
        <button
          onClick={(e) => {
            e.preventDefault();
            onIncrement();
          }}
          className="w-8 h-8 rounded-full bg-[#68B49B] text-white hover:bg-[#33594C] flex items-center justify-center transition-colors shadow-sm"
        >
          <Plus size={14} strokeWidth={3} />
        </button>
      </div>
    </div>
  );

  return (
    <div className="absolute top-full mt-3 left-0 w-full md:w-80 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 p-5 animate-in fade-in zoom-in-95 duration-200">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-bold uppercase tracking-wide text-gray-400">
          {t('bnb_listing.modal.title')}
        </h3>
        <button onClick={onClose} className="text-xs text-[#68B49B] font-bold hover:underline">
          {t('bnb_listing.modal.close_button')}
        </button>
      </div>

      <div className="flex flex-col gap-1">
        <Counter
          label={t('bnb_listing.modal.adults_label')}
          icon={User}
          value={adults}
          onDecrement={() => setAdults((v) => Math.max(1, v - 1))}
          onIncrement={() => setAdults((v) => v + 1)}
        />

        <Counter
          label={t('bnb_listing.modal.children_label')}
          icon={PersonStanding}
          value={children}
          onDecrement={() => setChildren((v) => Math.max(0, v - 1))}
          onIncrement={() => setChildren((v) => v + 1)}
        />

        <Counter
          label={t('bnb_listing.modal.rooms_label')}
          icon={BedDouble}
          value={rooms}
          onDecrement={() => setRooms((v) => Math.max(1, v - 1))}
          onIncrement={() => setRooms((v) => v + 1)}
        />
      </div>
    </div>
  );
};

const DestinationCard = ({ city, country, img, onClick }) => {
    const { t } = useTranslation("home");
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
        onError={(e) => {
          e.target.onerror = null;
          e.target.src =
            "https://placehold.co/400x500/E6F5F0/68B49B?text=HOGU";
        }}
      />
      
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />
      <div className="absolute bottom-0 left-0 p-6 text-white transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
        <p className="text-xs font-medium uppercase tracking-wider opacity-80 mb-1">
          {t(country)}
        </p>
        <h3 className="text-2xl font-bold">{t(city)}</h3>
        <div className="w-8 h-1 bg-[#68B49B] rounded-full mt-3 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
      </div>
    </div>
  </div>
)};

const BnBResultCard = ({ service, onClick, nights }) => {
    const { t } = useTranslation("home");
    const totalPrice = service.price;

    const bgImage = service.images && service.images.length > 0 
        ? service.images[0] 
        : `https://placehold.co/800x600/CCCCCC/333333?text=${encodeURIComponent(service.name)}`;

    return (
  <div 
    className={`
      group bg-white rounded-3xl overflow-hidden flex flex-col md:flex-row border border-gray-100 
      ${HOGU_THEME.shadowCard} transition-all duration-300 hover:-translate-y-1 cursor-pointer
      min-h-[240px]
    `}
    onClick={onClick}
  >
    <div className="md:w-1/3 h-64 md:h-auto relative overflow-hidden bg-gray-50 flex items-center justify-center p-4">
      <img 
        src={bgImage}
        alt={service.name}
        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        onError={(e) => { e.target.src = `https://placehold.co/600x400/CCCCCC/333333?text=${t('bnb_listing.card.img_fallback')}`; }}
      />
    </div>

    <div className="flex-1 p-6 md:p-8 flex flex-col justify-between">
      <div>
          <div className="flex justify-between items-start mb-2">
              <div className="w-full">
                <h2 className={`text-2xl font-bold ${HOGU_THEME.text} group-hover:text-[#68B49B] transition-colors`}>
                    {service.name}
                </h2>
                <p className={`text-sm flex items-center gap-1 ${HOGU_THEME.subtleText} mt-1 font-medium`}>
                    <MapPin size={14} className="text-[#68B49B]" /> 
                    {service.locales?.[0]?.city || service.location || 'Posizione non disponibile'}
                </p>
              </div>
          </div>
          <p className="text-gray-500 text-sm leading-relaxed my-4 line-clamp-2">
            {service.description}
          </p>
      </div>
      
      <div className="mt-4 pt-4 border-t border-gray-50 flex justify-between items-end">
        <div>
            <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mb-0.5">
                Totale per {nights} {nights === 1 ? 'notte' : 'notti'}
            </p>
            <div className="flex items-baseline gap-1">
                <span className={`text-3xl font-extrabold text-[${HOGU_COLORS.dark}]`}>
                    {totalPrice}€
                </span>
                <span className="text-sm text-gray-400 font-medium">
                    {new Intl.NumberFormat('it-IT', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                    }).format(service.pricePerNight)}€ / Prezzo medio per notte
                </span>
            </div>
        </div>
        <div className="flex gap-2">
            <button 
                className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center text-[#68B49B] group-hover:bg-[#68B49B] group-hover:text-white transition-all duration-300 shadow-sm"
            >
                <ArrowRight size={24} /> 
            </button>
        </div>
      </div>
    </div>
  </div>
)};

// --- COMPONENTE PRINCIPALE ---

export const ServiceListingBnB = () => {
  const navigate = useNavigate();
  const { t } = useTranslation("home");
  const [urlSearchParams] = useSearchParams(); 

  // 1. INIZIALIZZAZIONE STATO DA URL
  const initialCity = urlSearchParams.get('location') || "";
  const initialCheckIn = urlSearchParams.get('dateFrom') || "";
  const initialCheckOut = urlSearchParams.get('dateTo') || "";
  const initialAdults = parseInt(urlSearchParams.get('adults')) || 2;
  const initialChildren = parseInt(urlSearchParams.get('children')) || 0;
  const initialRooms = parseInt(urlSearchParams.get('rooms')) || 1;

  const [services, setServices] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Stato del form
  const [city, setCity] = useState(initialCity);
  const [checkIn, setCheckIn] = useState(initialCheckIn);
  const [checkOut, setCheckOut] = useState(initialCheckOut);
  
  const [isGuestModalOpen, setIsGuestModalOpen] = useState(false);
  const [adults, setAdults] = useState(initialAdults);
  const [childrenCount, setChildrenCount] = useState(initialChildren);
  const [rooms, setRooms] = useState(initialRooms);
  
  // Stato ultima ricerca (inizializzato da URL per coerenza)
  const [searchedCheckIn, setSearchedCheckIn] = useState(initialCheckIn);
  const [searchedCheckOut, setSearchedCheckOut] = useState(initialCheckOut);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  const [totalPages, setTotalPages] = useState(0); 

  // RIFERIMENTO PER SCROLL AUTOMATICO
  const resultsSectionRef = useRef(null);

  // --- LOGICA DI ESECUZIONE RICERCA PURA (MODIFICATA CON SCROLL) ---
  const executeSearch = async (params, shouldScroll = false) => {
      setLoading(true);
      setError(null);
      
      try {
          const rawLocation = params.location;
          // Pulizia stringa per inviare solo la città al backend (es. "Roma")
          const cleanLocation = rawLocation ? rawLocation.split(',')[0].trim() : '';

          const apiPayload = {
              page: (params.page || 1) - 1, // API is 0-indexed
              size: itemsPerPage,
              location: cleanLocation || null, 
              checkIn: params.checkIn || null,
              checkOut: params.checkOut || null,
              adults: params.adults,
              children: params.children,
              rooms: params.rooms
          };

          const response = await bnbService.getActiveBnBs(apiPayload);
          
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
          
          // Aggiorna stati "searched" per coerenza UI
          setSearchedCheckIn(params.checkIn);
          setSearchedCheckOut(params.checkOut);

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
          console.error("BnB API Error:", err);
          setError({
              title: t('bnb_listing.error.title', "Impossibile caricare i B&B"),
              message: t('bnb_listing.error.message', { error: err.message || 'Errore del server' })
          });
          setServices([]);
      } finally {
          setLoading(false);
      }
  };

  // --- AUTO START DA URL (UseEffect) ---
  useEffect(() => {
    const urlLoc = urlSearchParams.get('location');
    const urlCheckIn = urlSearchParams.get('dateFrom');
    
    // Se c'è almeno la location nell'URL, prova a cercare
    if (urlLoc && !hasSearched) {
        const payload = {
            location: urlLoc,
            checkIn: urlCheckIn,
            checkOut: urlSearchParams.get('dateTo'),
            adults: parseInt(urlSearchParams.get('adults')) || 2,
            children: parseInt(urlSearchParams.get('children')) || 0,
            rooms: parseInt(urlSearchParams.get('rooms')) || 1,
            page: 1
        };
        
        // Sincronizza lo stato locale del form (nel caso non lo fosse già)
        setCity(urlLoc);
        if(urlCheckIn) setCheckIn(urlCheckIn);
        
        // Scroll attivo all'avvio
        executeSearch(payload, true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Esegui solo al mount

  // --- HANDLER FORM SUBMIT ---
  const handleFormSubmit = (e) => {
    if (e) e.preventDefault();
    setIsGuestModalOpen(false);

    // 1. Costruisci il payload dai valori attuali del form
    const payload = {
        location: city,
        checkIn: checkIn,
        checkOut: checkOut,
        adults: adults,
        children: childrenCount,
        rooms: rooms,
        page: 1
    };

    // 2. Aggiorna URL
    const urlParams = new URLSearchParams({
        location: city,
        dateFrom: checkIn,
        dateTo: checkOut,
        adults: adults.toString(),
        children: childrenCount.toString(),
        rooms: rooms.toString()
    }).toString();
    navigate(`/service/bnb?${urlParams}`, { replace: true });

    // 3. Esegui ricerca con scroll
    executeSearch(payload, true);
  };

  // --- HANDLER CLICK CARD POPOLARE ---
  const handleDestinationClick = (dest) => {
      const today = new Date();
      const nextDay = new Date(today);
      nextDay.setDate(today.getDate() + 1);
      
      const defaultCheckIn = checkIn || today.toISOString().split('T')[0];
      const defaultCheckOut = checkOut || nextDay.toISOString().split('T')[0];

      // Aggiorna stato form
      setCity(dest.searchLocation);
      setCheckIn(defaultCheckIn);
      setCheckOut(defaultCheckOut);

      // Prepara payload
      const payload = {
          location: dest.searchLocation,
          checkIn: defaultCheckIn,
          checkOut: defaultCheckOut,
          adults: adults,
          children: childrenCount,
          rooms: rooms,
          page: 1
      };

      // Aggiorna URL
      const urlParams = new URLSearchParams({
        location: dest.searchLocation,
        dateFrom: defaultCheckIn,
        dateTo: defaultCheckOut,
        adults: adults.toString(),
        children: childrenCount.toString(),
        rooms: rooms.toString()
      }).toString();
      navigate(`/service/bnb?${urlParams}`, { replace: true });

      // Cerca con scroll
      executeSearch(payload, true);
  };

  const handlePageChange = (pageNumber) => {
      const payload = {
          location: city, // Usa lo stato corrente
          checkIn: searchedCheckIn,
          checkOut: searchedCheckOut,
          adults: adults,
          children: childrenCount,
          rooms: rooms,
          page: pageNumber
      };
      
      // Esegui con scroll
      executeSearch(payload, true);
  };

  const handleCloseError = () => {
      setError(null);
  };

  const calculateNights = () => {
    if (!searchedCheckIn || !searchedCheckOut) return 1; 
    const start = new Date(searchedCheckIn);
    const end = new Date(searchedCheckOut);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    return diffDays > 0 ? diffDays : 1;
  };
  const currentNights = calculateNights();

  const guestButtonText = t('bnb_listing.search.guest_summary', { adults: adults, children: childrenCount });
  const roomButtonText = t('bnb_listing.search.room_summary', { rooms: rooms });

  const popularDestinations = [
    {
      city: "bnb_listing.destinations.rome",
      country: "bnb_listing.destinations.italy",
      searchLocation: "Roma, Lazio", 
      img: "https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=600&q=80",
    },
    {
      city: "bnb_listing.destinations.florence",
      country: "bnb_listing.destinations.italy",
      searchLocation: "Firenze, Toscana", 
      img: "https://images.unsplash.com/photo-1541963463532-d68292c34b19?auto=format&fit=crop&w=600&q=80",
    },
    {
      city: "bnb_listing.destinations.venice",
      country: "bnb_listing.destinations.italy",
      searchLocation: "Venezia, Veneto", 
      img: "https://images.unsplash.com/photo-1514890547357-a9ee288728e0?auto=format&fit=crop&w=600&q=80",
    },
    {
      city: "bnb_listing.destinations.milan",
      country: "bnb_listing.destinations.italy",
      searchLocation: "Milano, Lombardia", 
      img: "https://images.unsplash.com/photo-1513581166391-887a96ddeafd?auto=format&fit=crop&w=600&q=80",
    },
  ];

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

          <span
            className={`text-[${HOGU_COLORS.primary}] mt-6 font-bold tracking-wider text-xs uppercase mb-3 block flex items-center gap-2`}
          >
            <div className="w-8 h-[1px] bg-[#68B49B]"></div> {t('bnb_listing.header.subtitle')}
          </span>
          <h1
            className={`text-4xl md:text-6xl font-extrabold text-[${HOGU_COLORS.dark}] mb-6 tracking-tight leading-tight`}
          >
            {t('bnb_listing.header.title_part1')}, <br />
            <span className="text-[#68B49B]">{t('bnb_listing.header.title_part2')}</span>
          </h1>
          <p
            className={`text-lg text-[${HOGU_COLORS.subtleText}] max-w-xl leading-relaxed`}
          >
            {t('bnb_listing.header.description')}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 lg:px-8 -mt-16 relative z-20">
        <div
          className={`relative z-50 bg-white rounded-[2rem] p-6 lg:p-8 ${HOGU_THEME.shadowFloat} border border-white/50 backdrop-blur-sm`}
        >
          <form onSubmit={handleFormSubmit} className="flex flex-col gap-6">
            <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
              
              <CityAutocompleteSearch 
                  label={t('bnb_listing.search.location_label', 'Città')}
                  value={city}
                  onChange={setCity}
                  icon={Search}
              />

              <div className="flex-1 flex flex-col md:flex-row gap-4 lg:gap-2">
                <SearchInputContainer 
                    label={t('bnb_listing.search.check_in')} 
                    icon={Calendar} 
                    className="min-w-0"
                >
                  <input
                    type="date"
                    className="w-full h-full px-3 bg-transparent border-none focus:ring-0 text-sm font-medium text-gray-700 outline-none cursor-pointer"
                    min={new Date().toISOString().split("T")[0]}
                    value={checkIn}
                    onChange={(e) => setCheckIn(e.target.value)}
                  />
                </SearchInputContainer>

                <SearchInputContainer 
                    label={t('bnb_listing.search.check_out')} 
                    icon={Calendar} 
                    className="min-w-0"
                >
                  <input
                    type="date"
                    className="w-full h-full px-3 bg-transparent border-none focus:ring-0 text-sm font-medium text-gray-700 outline-none cursor-pointer"
                    min={checkIn || new Date().toISOString().split("T")[0]}
                    value={checkOut}
                    onChange={(e) => setCheckOut(e.target.value)}
                  />
                </SearchInputContainer>
              </div>

              <div className="flex-1 relative">
                <SearchInputContainer label={t('bnb_listing.search.who_travels')} icon={Users}>
                  <button
                    type="button"
                    onClick={() => setIsGuestModalOpen((prev) => !prev)}
                    className="w-full h-full px-4 text-left flex flex-col justify-center hover:bg-gray-50 rounded-xl transition-colors outline-none"
                  >
                    <span className="text-sm font-bold text-gray-800 truncate">
                      {guestButtonText}
                    </span>
                    <span className="text-xs text-gray-400 truncate">
                      {roomButtonText}
                    </span>
                  </button>
                </SearchInputContainer>

                {isGuestModalOpen && (
                  <GuestRoomModal
                    adults={adults}
                    setAdults={setAdults}
                    children={childrenCount}
                    setChildren={setChildrenCount}
                    rooms={rooms}
                    setRooms={setRooms}
                    onClose={() => setIsGuestModalOpen(false)}
                  />
                )}
              </div>

              <div className="flex items-end">
                <PrimaryButton type="submit" disabled={loading} className="w-full lg:w-auto h-[60px] !rounded-2xl !px-8 shadow-lg">
                  {loading ? <Loader2 className="animate-spin" size={22}/> : <><span className="ml-2">{t('bnb_listing.search.search_button')}</span><Search size={22} /></>}
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
                    {t('bnb_listing.inspiration.title')}
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

                <div
                className="flex gap-6 overflow-x-auto snap-x snap-mandatory pb-8 no-scrollbar"
                style={{ scrollbarWidth: "none" }}
                >
                {popularDestinations.map((dest) => (
                    <DestinationCard 
                        key={dest.city} 
                        {...dest} 
                        onClick={() => handleDestinationClick(dest)}
                    />
                ))}
                </div>
            </section>
            )}

            {hasSearched && (
            <div className="mt-12" id="bnb-results-section" ref={resultsSectionRef}>
                <div className="flex items-center justify-between mb-8">
                <h2 className={`text-2xl font-bold text-[${HOGU_COLORS.dark}]`}>
                    <span className="text-[#68B49B]">
                    {services.length}
                    </span>{" "}
                    {t('bnb_listing.search_results.available_accommodations', { count: services.length })}
                </h2>
                {services.length > 0 && (
                        <span className="text-sm text-gray-400 font-medium">
                            Pagina {currentPage} di {totalPages > 0 ? totalPages : 1}
                        </span>
                )}
                </div>

                {services.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-3xl border border-gray-100">
                    <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Search size={30} className="text-gray-300" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-700">
                    {t('bnb_listing.search_results.no_results_title')}
                    </h3>
                </div>
                ) : (
                <>
                    <div className="flex flex-col gap-6">
                        {services.map((service) => (
                            <BnBResultCard 
                                key={service.id} 
                                service={service} 
                                nights={currentNights} 
                                onClick={() => {
                                    const slug = slugify(service.name);
                                    navigate(`/bnb/${slug}-${service.id}?dateFrom=${searchedCheckIn}&dateTo=${searchedCheckOut}`);
                                }} 
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

export default ServiceListingBnB;
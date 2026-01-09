import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  ArrowRight, MapPin, Users, Calendar, Clock, Search,
  CarFront, Star, ShieldCheck, Plane,
  ChevronLeft, ChevronRight, Navigation, Loader2
} from 'lucide-react';
import { Breadcrumbs } from '../../ui/Breadcrumbs.jsx';
import { slugify } from '../../../utils/slugify.js';
import ErrorModal from '../../ui/ErrorModal.jsx';
import LoadingScreen from "../../ui/LoadingScreen.jsx"; 

import { nccService } from '../../../api/apiClient.js';

// ** IMPORTA I TUOI FILE JSON QUI **
import italianLocationsData from '../../../assets/data/italian_locations.json'; 
import englishLocationsData from '../../../assets/data/english_locations.json'; 
import { HOGU_COLORS, HOGU_THEME } from '../../../config/theme.js';

const breadcrumbsItems = [
  { labelKey: 'breadcrumbs.home', href: '/' },
  { labelKey: 'breadcrumbs.ncc', href: '/service/ncc' }
];

// --- DATI ROTTE POPOLARI ---
const POPULAR_ROUTES_DATA = [
  { 
    displayFrom: 'Roma Centro',
    displayTo: 'Fiumicino (FCO)',
    price: '50',
    fromLocation: 'Roma, Lazio',
    fromAddress: 'Via del Corso, 18',
    toLocation: 'Fiumicino, Lazio',
    toAddress: "Via dell' Aeroporto di Fiumicino, 320"
  },
  { 
    displayFrom: 'Milano (Duomo)',
    displayTo: 'Malpensa (MXP)',
    price: '95',
    fromLocation: 'Milano, Lombardia',
    fromAddress: 'Piazza del Duomo, 1',
    toLocation: 'Ferno, Lombardia',
    toAddress: 'Aeroporto Malpensa 2000, 1'
  },
  { 
    displayFrom: 'Venezia (P.le Roma)',
    displayTo: 'Marco Polo (VCE)',
    price: '45',
    fromLocation: 'Venezia, Veneto',
    fromAddress: 'Piazzale Roma, 1',
    toLocation: 'Tessera, Veneto',
    toAddress: 'Viale Galileo Galilei, 30'
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

// --- UTILITY GEOGRAFICHE ---
const processLocations = (data) => {
    if (!data) return [];
    const flatLocations = [];
    data.forEach(region => {
        region.provinces.forEach(province => {
            province.cities.forEach(city => {
                const mapFriendlyString = `${city}, ${province.name}, ${region.region}`;
                const apiLabelString = `${city}, ${region.region}`;
                
                flatLocations.push({
                    city: city,
                    province: province.name,
                    region: region.region,
                    fullLabel: mapFriendlyString,
                    apiLabel: apiLabelString,
                    searchString: mapFriendlyString.toLowerCase()
                });
            });
        });
    });
    return flatLocations;
};

// --- COMPONENTE AUTOCOMPLETE ---
const CityAutocompleteSearch = ({ label, value, onChange, icon: Icon, placeholder, required = false }) => {
    const { i18n } = useTranslation();
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
        onChange(userInput);

        if (userInput.length > 2) {
            const lowerInput = userInput.toLowerCase();
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
        onChange(item.apiLabel); 
        setShowSuggestions(false);
    };

    return (
        <div className="flex flex-col gap-3 flex-[1.5] min-w-[200px] relative" ref={wrapperRef}>
            <label className={`flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-[${HOGU_COLORS.subtleText}] ml-1`}>
                <Icon size={14} className={`text-[${HOGU_COLORS.primary}]`} />
                {label} {required && <span className="text-red-500">*</span>}
            </label>
            <div className="flex gap-2 bg-white p-1.5 rounded-2xl border border-gray-100 shadow-sm focus-within:ring-2 focus-within:ring-[#68B49B]/20 focus-within:border-[#68B49B] transition-all h-[60px] items-center relative">
                <input 
                    type="text"
                    value={value}
                    onChange={handleInputChange}
                    onFocus={() => value.length > 2 && setShowSuggestions(true)}
                    placeholder={placeholder}
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
                 {showSuggestions && value.length > 2 && suggestions.length === 0 && (
                      <div className="absolute top-full left-0 mt-2 w-full bg-white rounded-xl shadow-xl border border-gray-100 p-4 text-center text-gray-400 text-sm z-50">
                        {t('ncc_listing.search.not_found_citys')}
                      </div>
                )}
            </div>
        </div>
    );
};

// --- CONTAINER INPUT ---
const SearchInputContainer = ({ label, icon: Icon, children, className = '', required = false }) => (
  <div className={`flex flex-col gap-3 flex-1 min-w-[160px] ${className}`}>
    <label className={`flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-[${HOGU_COLORS.subtleText}] ml-1`}>
      <Icon size={14} className={`text-[${HOGU_COLORS.primary}]`} />
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <div className="flex gap-2 bg-white p-1.5 rounded-2xl border border-gray-100 shadow-sm focus-within:ring-2 focus-within:ring-[#68B49B]/20 focus-within:border-[#68B49B] transition-all h-[60px] items-center">
      {children}
    </div>
  </div>
);

// --- COMPONENTI UI ---
function PrimaryButton({ children, onClick, className = '', disabled = false, type = 'button', style = {} }) {
  return (
    <button type={type} onClick={onClick} disabled={disabled} style={style}
      className={`bg-[#68B49B] text-white ${HOGU_THEME.fontFamily}
        px-6 py-3 lg:px-8 lg:py-4 text-base lg:text-lg font-bold rounded-2xl transition-all duration-300 ease-out
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
    
    const seoName = [
        searchParams?.fromCity,
        searchParams?.toCity,
        service.car || service.name
    ].filter(Boolean).join(' ');

    const handleOpenDetail = (e) => {
        if (e) e.stopPropagation();
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

        navigate(`/ncc/${slug}-${service.id}?${queryParams.toString()}`);
    };

    const mainImage = (service.images && service.images.length > 0) 
        ? service.images[0] 
        : `https://images.unsplash.com/photo-1514890547357-a9ee288728e0?auto=format&fit=crop&w=800&q=80`;

    return (
      <div className={`group bg-white rounded-3xl overflow-hidden flex flex-col md:flex-row border border-gray-100 ${HOGU_THEME.shadowCard} transition-all duration-300 cursor-pointer hover:shadow-lg`} onClick={handleOpenDetail}>
        <div className="md:w-1/3 h-64 md:h-auto relative overflow-hidden bg-gray-50 flex items-center justify-center p-4">
          <img 
            src={mainImage}
            alt={service.car}
            className="w-full h-full object-contain mix-blend-multiply transition-transform duration-500 group-hover:scale-105 drop-shadow-xl"
            onError={(e) => { e.target.src = `https://placehold.co/800x600/EEE/CCC?text=${t('ncc_listing.card.img_alt_fallback')}`; }}
          />
        </div>
        <div className="flex-1 p-6 md:p-8 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-2">
              <div>
                <h2 className="text-2xl font-bold text-slate-800 group-hover:text-[#68B49B] transition-colors">
                  {service.name}
                </h2>
                <p className="text-lg font-medium text-slate-500">{service.car}</p>
              </div>
              {service.rating && service.rating > 0 && (
                <div className="flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded-lg">
                    <Star size={16} className="text-yellow-400 fill-yellow-400" />
                    <span className="font-bold text-slate-700">{service.rating}</span>
                </div>
              )}
            </div>
            <div className="flex flex-wrap gap-3 mt-4">   
              <span className="flex items-center gap-1.5 text-xs font-medium text-[#68B49B] bg-[#F0FDF9] px-2.5 py-1 rounded-md">
                <Users size={12} /> Max {service.numberOfSeats || t('ncc_listing.card.max_pax')}
              </span>
              <span className="flex items-center gap-1.5 text-xs font-medium text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md">
                <ShieldCheck size={12} /> Garantito
              </span>
            </div>
            <p className="text-gray-500 text-sm leading-relaxed my-4 line-clamp-2">
               {service.description || "Servizio professionale con autista privato. Comfort garantito."}
            </p>
          </div>
          <div className="flex items-end justify-between mt-6 pt-4 border-t border-gray-50">
            <div>
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">{t('ncc_listing.card.estimated_rate')}</p>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-extrabold text-gray-800">€ {Math.floor(service.price)}</span>
                <span className="text-sm text-gray-500">,{ (service.price % 1).toFixed(2).substring(2) }</span>
              </div>
              {service.pricePerKm && (
                <div className="text-xs font-semibold text-slate-400 mt-1">
                    ~ € {service.pricePerKm} / km
                </div>
              )}
            </div>
            <button className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center text-[#68B49B] group-hover:bg-[#68B49B] group-hover:text-white transition-colors duration-300 shadow-sm" onClick={handleOpenDetail} title={t('ncc_listing.card.details_button')}>
                <ArrowRight size={24} /> 
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
  const { t } = useTranslation("home");
  
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

  const resultsSectionRef = useRef(null);

  // --- CALCOLO DATA DI OGGI (PER MIN DATE) ---
  const today = new Date();
  const todayString = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');

  // Inizializzazione stato
  const [search, setSearch] = useState({
    fromCity: urlSearchParams.get('fromCity') || "",
    fromAddress: urlSearchParams.get('fromAddress') || "",
    toCity: urlSearchParams.get('toCity') || "",
    toAddress: urlSearchParams.get('toAddress') || "",
    dateOut: urlSearchParams.get('date') || todayString,
    timeOut: urlSearchParams.get('time') || "12:00", // Default a mezzogiorno se non c'è nulla
    passengers: parseInt(urlSearchParams.get('passengers')) || 1
  });

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
      const name = dto.name || "Servizio NCC";
      const carModel = dto.model || name; 
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
          images: dto.images || [],
          type: dto.serviceType || "NCC"
      };
  };

  const fetchNccServices = async (payload, pageIndex, shouldScroll = false) => {
      setIsLoading(true);
      setErrorState({ ...errorState, show: false });
      try {
          const response = await nccService.search(payload, pageIndex, itemsPerPage);
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
                    window.scrollTo({top: y, behavior: 'smooth'});
                }
            }, 100);
        }

      } catch (err) {
          console.error("Errore durante la ricerca NCC:", err);
          setErrorState({
              show: true,
              message: "Si è verificato un errore durante la ricerca dei servizi NCC.",
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

    if (hasRequiredParams && !hasSearched) {
        const payload = {
            departureLocation: search.fromCity,
            departureAddress: search.fromAddress || search.fromCity, 
            destinationLocation: search.toCity,
            destinationAddress: search.toAddress || search.toCity,
            departureDate: search.dateOut,
            departureTime: search.timeOut,
            passengers: search.passengers
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
    const payload = {
        departureLocation: currentData.fromCity,
        departureAddress: currentData.fromAddress,
        destinationLocation: currentData.toCity,
        destinationAddress: currentData.toAddress,
        departureDate: currentData.dateOut,
        departureTime: currentData.timeOut,
        passengers: currentData.passengers
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
        ? `${String(safeTime.getHours() + 1).padStart(2,'0')}:00` 
        : `${hours}:${minutes}`;

      const newSearchData = {
          ...search,
          fromCity: route.fromLocation,    
          fromAddress: route.fromAddress,  
          toCity: route.toLocation,        
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
                            className={`w-10 h-10 rounded-full font-bold text-sm transition-all ${currentPage === number ? 'bg-[#68B49B] text-white shadow-lg shadow-[#68B49B]/30' : 'text-gray-600 hover:bg-gray-100'}`}
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
      <div className="bg-white pt-12 pb-24 px-4 lg:px-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl -translate-y-1/2 -translate-x-1/3"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#68B49B]/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
        
        <div className="max-w-7xl mx-auto relative z-10">
          <Breadcrumbs items={breadcrumbsItems.map(item => ({...item, label: t(item.labelKey)}))} />
          <span className="text-[#68B49B] mt-6 font-bold tracking-wider text-xs uppercase mb-3 block flex items-center gap-2">
            <div className="w-8 h-[1px] bg-[#68B49B]"></div> {t('ncc_listing.header.subtitle')}
          </span>
          <h1 className="text-4xl md:text-6xl font-extrabold text-slate-800 mb-6 tracking-tight leading-tight">
            {t('ncc_listing.header.title_part1')}, <br/>
            <span className="text-[#68B49B]">{t('ncc_listing.header.title_part2')}</span>
          </h1>
          <p className="text-lg text-slate-500 max-w-xl leading-relaxed">
            {t('ncc_listing.header.description')}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 lg:px-8 -mt-16 relative z-20">
        <div className={`bg-white rounded-[2rem] p-6 lg:p-8 ${HOGU_THEME.shadowFloat} border border-white/50 backdrop-blur-sm`}>
          <form onSubmit={handleFormSubmit} className="flex flex-col gap-8">
            <div className="flex flex-col gap-6">
              
              <div className="flex flex-col lg:flex-row gap-4">
                 <CityAutocompleteSearch 
                    label={t('ncc_listing.search.departure_point', "Città Partenza")} 
                    icon={MapPin} 
                    value={search.fromCity}
                    onChange={(val) => setSearch({ ...search, fromCity: val })}
                    placeholder="Città di partenza"
                    required
                />
                <SearchInputContainer label={t('ncc_listing.search.departure_address', "Indirizzo Partenza")} icon={Navigation} >
                    <input 
                        type="text" 
                        className="w-full h-full px-3 bg-transparent border-none focus:ring-0 text-base font-medium text-gray-700 outline-none placeholder:text-gray-300"
                        placeholder="Via / Civico / Aeroporto"
                        value={search.fromAddress}
                        onChange={(e) => setSearch({ ...search, fromAddress: e.target.value })}
                        required
                    />
                </SearchInputContainer>
              </div>

              <div className="flex flex-col lg:flex-row gap-4">
                 <CityAutocompleteSearch 
                    label={t('ncc_listing.search.destination_point', "Città Destinazione")} 
                    icon={MapPin} 
                    value={search.toCity}
                    onChange={(val) => setSearch({ ...search, toCity: val })}
                    placeholder="Città di arrivo"
                    required
                />
                <SearchInputContainer label={t('ncc_listing.search.destination_address', "Indirizzo Destinazione")} icon={Navigation} >
                    <input 
                        type="text" 
                        className="w-full h-full px-3 bg-transparent border-none focus:ring-0 text-base font-medium text-gray-700 outline-none placeholder:text-gray-300"
                        placeholder="Via / Civico / Aeroporto"
                        value={search.toAddress}
                        onChange={(e) => setSearch({ ...search, toAddress: e.target.value })}
                        required
                    />
                </SearchInputContainer>
              </div>

              <div className="flex flex-col lg:flex-row gap-4 lg:items-end">
                <div className="flex flex-1 w-full gap-2">
                  <SearchInputContainer label={t('ncc_listing.search.date_out')} icon={Calendar} >
                    {/* MODIFICATO: Aggiunto attributo min per bloccare date passate */}
                    <input 
                      type="date" 
                      min={todayString}
                      className="w-full h-full px-3 bg-transparent border-none focus:ring-0 text-sm font-medium text-gray-700 outline-none cursor-pointer"
                      value={search.dateOut} 
                      onChange={(e) => setSearch({ ...search, dateOut: e.target.value })} 
                      required 
                    />
                  </SearchInputContainer>
                  
                  <SearchInputContainer label={t('ncc_listing.search.time')} icon={Clock} >
                    {/* MODIFICATO: Sostituito input time con select e logica di slot 30 min */}
                    <select
                        className="w-full h-full px-3 bg-transparent border-none focus:ring-0 text-sm font-medium text-gray-700 outline-none cursor-pointer text-center appearance-none"
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

                <SearchInputContainer label={t('ncc_listing.search.passengers')} icon={Users} className="w-full lg:flex-[0.5]">
                  <input type="number" min="1" className="w-full h-full px-3 bg-transparent border-none focus:ring-0 text-base font-medium text-gray-700 outline-none"
                    value={search.passengers} onChange={(e) => setSearch({ ...search, passengers: parseInt(e.target.value) || 1 })} required />
                </SearchInputContainer>

                <div className="w-full lg:w-auto">
                  <PrimaryButton type="submit" disabled={isLoading} className="w-full h-[60px] !rounded-2xl !px-8 shadow-lg shadow-[#68B49B]/20 hover:shadow-[#68B49B]/40">
                    {isLoading ? (
                        <>
                            <Loader2 className="animate-spin" size={22} /> Cercando...
                        </>
                    ) : (
                        <>
                            {t('ncc_listing.search.search_button')}
                            <Search size={22} />
                        </>
                    )}
                  </PrimaryButton>
                </div>
              </div>
            </div>
          </form>
        </div>
        
        {!hasSearched && !isLoading && (
          <section className="mt-16 mb-12">
            <h2 className="text-2xl font-bold text-slate-800 mb-6">{t('ncc_listing.popular_routes.title')}</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {POPULAR_ROUTES_DATA.map((route, idx) => (
                <div 
                  key={idx} 
                  onClick={() => handlePopularRouteClick(route)}
                  className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-[#F0FDF9] group-hover:text-[#68B49B] transition-colors">
                      <Plane size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-700">{route.displayFrom}</p>
                      <p className="text-xs text-gray-400">{t('ncc_listing.popular_routes.to', { destination: route.displayTo })}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-400">{t('ncc_listing.popular_routes.from')}</p>
                    <p className="text-lg font-bold text-[#68B49B]">€{route.price}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {isLoading && !hasSearched && (
            <div className="mt-12 flex flex-col gap-4 animate-pulse">
                {[1,2,3].map(i => (
                    <div key={i} className="h-48 bg-gray-200 rounded-3xl w-full"></div>
                ))}
            </div>
        )}

        {hasSearched && (
          <div className="mt-12" id="ncc-results-section" ref={resultsSectionRef}>
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-slate-800">
                <span className="text-[#68B49B]">{totalElements}</span> {t('ncc_listing.results.available_vehicles', { count: totalElements })}
              </h2>
              <span className="text-sm text-gray-400 font-medium">
                  Pagina {currentPage} di {totalPages > 0 ? totalPages : 1}
              </span>
            </div>

            {services.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-3xl border border-gray-100">
                    <CarFront size={48} className="mx-auto text-gray-300 mb-4" />
                    <h3 className="text-xl font-bold text-gray-600">{t('ncc_listing.results.not_found')}</h3>
                    <p className="text-gray-400">Prova a modificare i parametri di ricerca.</p>
                </div>
            ) : (
                <div className={`${isLoading ? 'opacity-50 pointer-events-none' : 'opacity-100'} transition-opacity duration-200`}>
                    <div className="flex flex-col gap-6">
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
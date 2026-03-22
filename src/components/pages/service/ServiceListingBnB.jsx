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
  ChevronDown,
  MapPin,
  Loader2
} from "lucide-react";
import { formatValue } from 'react-currency-input-field';

import { Breadcrumbs } from "../../ui/Breadcrumbs.jsx";
import { PageHeader } from '../../ui/PageHeader.jsx';
import { PopularDestinations } from '../../ui/PopularDestinations.jsx';
import { slugify } from "../../../utils/slugify.js";
import { createLocationPayload, getDisplayLocation } from "../../../utils/locationUtils.js";
import { bnbService } from "../../../api/apiClient.js";
import LoadingScreen from "../../ui/LoadingScreen.jsx";
import ErrorModal from "../../ui/ErrorModal.jsx";
import SafeImage from "../../ui/SafeImage.jsx";


import { CityAutocomplete } from "../../ui/CityAutocomplete.jsx";
import { HOGU_COLORS, HOGU_THEME } from '../../../config/theme.js';


const MOBILE_FONT = "font-['SF_Pro_Text',_Roboto,_'Inter',_system-ui,_sans-serif]";


const breadcrumbsItems = [
  { labelKey: "breadcrumbs.home", href: "/" },
  { labelKey: "breadcrumbs.bnb", href: "/service/bnb" },
];

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
        bg-[#68B49B] text-white ${HOGU_THEME.fontFamily} ${MOBILE_FONT}
        px-6 py-3 lg:px-8 lg:py-4 text-[16px] leading-[20px] font-semibold md:text-base md:font-bold lg:text-lg rounded-2xl transition-all duration-300 ease-out
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
  <div className={`flex flex-col gap-1 lg:gap-3 flex-1 min-w-0 ${className}`}>
    <label
      className={`flex items-center gap-1.5 ${MOBILE_FONT} text-[12px] leading-[16px] font-normal md:text-xs md:font-bold uppercase tracking-wide text-[${HOGU_COLORS.subtleText}] ml-1`}
    >
      <Icon size={12} className={`text-[${HOGU_COLORS.primary}]`} />
      {label}
    </label>
    <div className="flex gap-2 bg-white p-1 rounded-xl border border-gray-100 shadow-sm focus-within:ring-2 focus-within:ring-[#68B49B]/20 focus-within:border-[#68B49B] transition-all h-[42px] md:h-[60px] items-center relative">
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
        <span className={`${MOBILE_FONT} text-[14px] leading-[20px] font-semibold text-gray-700`}>{label}</span>
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
        <span className={`${MOBILE_FONT} text-[16px] leading-[20px] w-4 text-center font-bold text-gray-800`}>{value}</span>
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
        <h3 className={`${MOBILE_FONT} text-[12px] leading-[16px] font-bold uppercase tracking-wide text-gray-400`}>
          {t('bnb_listing.modal.title')}
        </h3>
        <button onClick={onClose} className={`text-xs ${MOBILE_FONT} text-[#68B49B] font-bold hover:underline`}>
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

// --- CARD: CITY DESTINATION (Città) ---
/* RIMOSSO - Sostituito da PopularDestinations */

const BnBResultCard = ({ service, onClick, nights }) => {
  const { t, i18n } = useTranslation("home");
  const [isExpanded, setIsExpanded] = useState(true);
  const totalPrice = service.price;

  const formattedTotalPrice = formatValue({
    value: totalPrice ? totalPrice.toString() : '0',
    intlConfig: { locale: i18n.language === 'it' ? 'it-IT' : 'en-US', currency: i18n.language === 'it' ? 'EUR' : 'USD' },
    decimalsLimit: 2,
    decimalScale: 2,
    fixedDecimalLength: 2,
  });

  const bgImage = service.images && service.images.length > 0
    ? service.images[0]
    : `https://placehold.co/800x600/CCCCCC/333333?text=${encodeURIComponent(service.name)}`;

  const displayLocation = useMemo(() => {
      if (service.locales && service.locales.length > 0) {
          return getDisplayLocation(service.locales[0], i18n.language);
      }
      return service.location || t('bnb_listing.card.location_not_available');
  }, [service.locales, service.location, i18n.language]);

  return (
    <div
      className={`bg-white rounded-none md:rounded-3xl overflow-hidden flex flex-col md:flex-row border-y md:border border-gray-100 ${HOGU_THEME.shadowCard} transition-all duration-300 hover:-translate-y-1 cursor-pointer group min-h-[180px] md:min-h-[240px]`}
      onClick={onClick}
    >
      <div
        className="md:w-1/3 h-40 md:h-64 relative overflow-hidden bg-gray-50 flex items-center justify-center md:p-4 isolate transform-gpu"
      >
        <SafeImage
          src={bgImage}
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
                <MapPin size={12} className="text-[#68B49B]" /> {displayLocation}
              </p>
            </div>
          </div>
        </div>

        <div className="md:hidden border-t border-gray-200 my-1.5" />

        <div className={`mt-1 mb-1 md:my-2 pl-1 ${isExpanded ? 'block' : 'hidden md:block'}`}>
          <p className={`${MOBILE_FONT} text-[14px] leading-[20px] font-normal text-gray-500 md:text-xs md:text-sm md:leading-relaxed mb-4 line-clamp-2`}>
            {service.description}
          </p>

          {/* Prezzo Mobile visibile solo se espanso */}
          <div className="mt-2 md:hidden">
            <p className={`${MOBILE_FONT} text-[12px] leading-[16px] font-normal text-gray-400 mb-1`}>
              {t('bnb_listing.search_results.total_per_night', { nights: nights, unit: nights === 1 ? t('bnb_listing.search_results.night') : t('bnb_listing.search_results.nights') })}
            </p>
            <div className="flex items-baseline gap-1">
              <span className={`${MOBILE_FONT} text-[22px] leading-[28px] font-bold text-gray-800`}>{formattedTotalPrice}</span>
              <span className={`${MOBILE_FONT} text-[14px] leading-[20px] font-normal text-gray-500`}>
                {new Intl.NumberFormat(i18n.language === 'it' ? 'it-IT' : 'en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(service.pricePerNight)}{t('bnb_listing.card.currency')} {t('bnb_listing.card.per_night')}
              </span>
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
                {t('bnb_listing.card.hide')}
              </>
            ) : (
              <>
                <ChevronDown size={14} className="transition-transform" />
                {t('bnb_listing.card.info_prices')}
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
              {t('bnb_listing.search_results.total_per_night', { nights: nights, unit: nights === 1 ? t('bnb_listing.search_results.night') : t('bnb_listing.search_results.nights') })}
            </p>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl md:text-3xl font-extrabold text-gray-800">{formattedTotalPrice}</span>
              <span className="text-sm text-gray-500">
                {new Intl.NumberFormat(i18n.language === 'it' ? 'it-IT' : 'en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(service.pricePerNight)}{t('bnb_listing.card.currency')} {t('bnb_listing.card.per_night')}
              </span>
            </div>
          </div>

          <button
            className="hidden md:flex w-12 h-12 rounded-full bg-gray-50 items-center justify-center text-[#68B49B] group-hover:bg-[#68B49B] group-hover:text-white transition-colors duration-300 shadow-sm"
          >
            <ArrowRight size={24} />
          </button>
        </div>
      </div>
    </div>
  );
};

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
      const locationPayload = rawLocation ? createLocationPayload(rawLocation, "", "BNB")[0] : null;

      const apiPayload = {
        locale: locationPayload,
        checkIn: params.checkIn || null,
        checkOut: params.checkOut || null,
        adults: params.adults,
        children: params.children,
        rooms: params.rooms
      };

      const response = await bnbService.advancedSearchBnB(apiPayload, (params.page || 1) - 1, itemsPerPage);

      let dataList = [];
      let pages = 0;
      if (Array.isArray(response)) {
        dataList = response;
        pages = 1;
      } else if (response && response.content) {
        dataList = response.content;
        pages = response.totalPages;
      }

      const formattedList = dataList.map(bnb => {
        // La risposta API è un array di stringhe, come confermato
        const rawImages = Array.isArray(bnb.images) ? bnb.images : [];
        const serviceIdForImages = bnb.bnbServiceId || bnb.serviceId;

        const images = rawImages.length > 0 && serviceIdForImages && bnb.id
          ? rawImages.map(filename => `/files/bnb/${serviceIdForImages}/${bnb.id}/${filename}`)
          : [];

        return {
          ...bnb,
          images
        };
      });

      setServices(formattedList);
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

            window.scrollTo({ top: y, behavior: 'smooth' });
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
      if (urlCheckIn) setCheckIn(urlCheckIn);

      // Scroll attivo all'avvio
      executeSearch(payload, true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Esegui solo al mount

  // --- HANDLER FORM SUBMIT ---
  const handleFormSubmit = (e) => {
    if (e) e.preventDefault();
    setIsGuestModalOpen(false);

    if (checkIn && checkOut) {
      if (checkIn === checkOut) {
        setError({
          title: t('bnb_listing.error.invalid_dates_title', 'Date non valide'),
          message: t('bnb_listing.error.same_dates_message', 'La data di check-out non può coincidere con la data di check-in. Seleziona almeno una notte.')
        });
        return;
      }
      if (new Date(checkOut) < new Date(checkIn)) {
        setError({
          title: t('bnb_listing.error.invalid_dates_title', 'Date non valide'),
          message: t('bnb_listing.error.checkout_before_checkin', 'La data di check-out deve essere successiva alla data di check-in.')
        });
        return;
      }
    }

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
        subtitle={t('bnb_listing.header.subtitle', 'Soggiorni Esclusivi')}
        titlePart1={t('bnb_listing.header.title_part1', 'Trova il tuo')}
        titlePart2={t('bnb_listing.header.title_part2', 'B&B Ideale')}
        description={t('bnb_listing.header.description')}
      />

      <div className="max-w-7xl mx-auto px-4 lg:px-8 -mt-20 md:-mt-16 lg:-mt-12 relative z-20">
        <div className={`relative z-50 bg-[#F1F5F9] rounded-[2rem] p-4 lg:p-8 ${HOGU_THEME.shadowFloat} border border-white/50 backdrop-blur-sm`}>
          <form onSubmit={handleFormSubmit} className="flex flex-col gap-3 lg:gap-6">

            {/* ===== MOBILE LAYOUT: griglia 2x2 ===== */}
            <div className="grid grid-cols-2 gap-2 lg:hidden">

              {/* Città — full width */}
              <div className="col-span-2 z-[100]">
                <CityAutocomplete
                  label={t('bnb_listing.search.location_label', 'Città')}
                  value={city}
                  onChange={setCity}
                  icon={Search}
                  className="w-full z-[100]"
                  labelClassName={`!text-[${HOGU_COLORS.subtleText}] ${MOBILE_FONT} !text-[12px] !leading-[16px] !font-normal md:!text-xs md:!font-bold md:uppercase`}
                  inputClassName={`${MOBILE_FONT} text-left text-[16px] leading-[24px] font-normal md:text-sm`}
                  placeholder={t('bnb_listing.search.location_placeholder', "Dove vuoi andare?")}
                />
              </div>

              {/* Check-in */}
              <SearchInputContainer label={t('bnb_listing.search.check_in')} icon={Calendar}>
                <input
                  type="date"
                  className={`w-full h-full px-2 bg-transparent border-none focus:ring-0 ${MOBILE_FONT} text-[16px] leading-[24px] font-normal text-gray-700 outline-none cursor-pointer md:text-sm md:font-medium`}
                  min={new Date().toISOString().split("T")[0]}
                  value={checkIn}
                  onChange={(e) => setCheckIn(e.target.value)}
                />
              </SearchInputContainer>

              {/* Check-out */}
              <SearchInputContainer label={t('bnb_listing.search.check_out')} icon={Calendar}>
                <input
                  type="date"
                  className={`w-full h-full px-2 bg-transparent border-none focus:ring-0 ${MOBILE_FONT} text-[16px] leading-[24px] font-normal text-gray-700 outline-none cursor-pointer md:text-sm md:font-medium`}
                  min={checkIn || new Date().toISOString().split("T")[0]}
                  value={checkOut}
                  onChange={(e) => setCheckOut(e.target.value)}
                />
              </SearchInputContainer>

              {/* Ospiti */}
              <div className="relative">
                <SearchInputContainer label={t('bnb_listing.search.who_travels')} icon={Users}>
                  <button
                    type="button"
                    onClick={() => setIsGuestModalOpen((prev) => !prev)}
                    className="w-full h-full px-2 text-left flex flex-col justify-center hover:bg-gray-50 rounded-xl transition-colors outline-none"
                  >
                    <span className={`${MOBILE_FONT} text-[16px] leading-[24px] font-semibold text-gray-800 truncate md:text-xs md:font-bold`}>{guestButtonText}</span>
                    <span className={`${MOBILE_FONT} text-[14px] leading-[16px] font-normal text-gray-400 truncate md:text-[10px]`}>{roomButtonText}</span>
                  </button>
                </SearchInputContainer>
                {isGuestModalOpen && (
                  <GuestRoomModal
                    adults={adults} setAdults={setAdults}
                    children={childrenCount} setChildren={setChildrenCount}
                    rooms={rooms} setRooms={setRooms}
                    onClose={() => setIsGuestModalOpen(false)}
                  />
                )}
              </div>

              {/* Bottone Cerca — allineato con spacer */}
              <div className="flex flex-col gap-1 flex-1 min-w-0">
                <span className="text-[9px] font-bold uppercase tracking-wide opacity-0 select-none ml-1">_</span>
                <PrimaryButton type="submit" disabled={loading} className="w-full h-[42px] !rounded-xl !px-4 !text-sm !py-0">
                  {loading ? (
                    <><Loader2 className="animate-spin" size={16} />{t('bnb_listing.search.searching', 'Cercando...')}</>
                  ) : (
                    <><Search size={16} />{t('bnb_listing.search.search_button')}</>
                  )}
                </PrimaryButton>
              </div>
            </div>

            {/* ===== DESKTOP LAYOUT: flex-row originale ===== */}
            <div className="hidden lg:flex flex-row gap-6">

              <CityAutocomplete
                label={t('bnb_listing.search.location_label', 'Città')}
                value={city}
                onChange={setCity}
                icon={Search}
                className="flex-[2] min-w-[200px]"
                placeholder={t('bnb_listing.search.location_placeholder', "Dove vuoi andare?")}
              />

              <div className="flex-1 flex flex-row gap-2">
                <SearchInputContainer label={t('bnb_listing.search.check_in')} icon={Calendar} className="min-w-0">
                  <input
                    type="date"
                    className="w-full h-full px-3 bg-transparent border-none focus:ring-0 md:text-lg md:font-medium text-gray-700 outline-none cursor-pointer"
                    min={new Date().toISOString().split("T")[0]}
                    value={checkIn}
                    onChange={(e) => setCheckIn(e.target.value)}
                  />
                </SearchInputContainer>
                <SearchInputContainer label={t('bnb_listing.search.check_out')} icon={Calendar} className="min-w-0">
                  <input
                    type="date"
                    className="w-full h-full px-3 bg-transparent border-none focus:ring-0 md:text-lg md:font-medium text-gray-700 outline-none cursor-pointer"
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
                    <span className="md:text-lg md:font-bold text-gray-800 truncate">{guestButtonText}</span>
                    <span className="md:text-sm text-gray-400 truncate">{roomButtonText}</span>
                  </button>
                </SearchInputContainer>
                {isGuestModalOpen && (
                  <GuestRoomModal
                    adults={adults} setAdults={setAdults}
                    children={childrenCount} setChildren={setChildrenCount}
                    rooms={rooms} setRooms={setRooms}
                    onClose={() => setIsGuestModalOpen(false)}
                  />
                )}
              </div>

              <div className="flex items-end">
                <PrimaryButton type="submit" disabled={loading} className="w-full lg:w-auto h-[60px] !rounded-2xl !px-8 shadow-lg !text-lg">
                  {loading ? (
                    <><Loader2 className="animate-spin" size={20} />{t('bnb_listing.search.searching', 'Cercando...')}</>
                  ) : (
                    <><Search size={20} />{t('bnb_listing.search.search_button')}</>
                  )}
                </PrimaryButton>
              </div>
            </div>

          </form>
        </div>

        <div className="relative z-0">
          {!hasSearched && !loading && (
            <PopularDestinations
              title={t('bnb_listing.popular.title', 'Destinazioni Popolari')}
              onDestinationClick={(dest) => handleDestinationClick(dest)}
            />
          )}

          {hasSearched && (
            <div className="mt-6 md:mt-12 relative z-10" id="bnb-results-section" ref={resultsSectionRef}>
              <div className="flex items-center justify-between mb-4 md:mb-8">
                <h2 className={`${MOBILE_FONT} text-[22px] leading-[28px] font-semibold text-[${HOGU_COLORS.dark}] md:text-lg md:text-2xl md:font-bold`}>
                  <span className="text-[#68B49B]">
                    {services.length}
                  </span>{" "}
                  {t('bnb_listing.search_results.available_accommodations', { count: services.length })}
                </h2>
                {services.length > 0 && (
                  <span className={`${MOBILE_FONT} text-[14px] leading-[20px] font-normal text-gray-400 md:text-sm md:font-medium`}>
                    {t('bnb_listing.search_results.page_of', { current: currentPage, total: totalPages > 0 ? totalPages : 1 })}
                  </span>
                )}
              </div>

              {services.length === 0 ? (
                <div className="text-center py-10 md:py-20 bg-white rounded-2xl md:rounded-3xl border border-gray-100">
                  <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Search size={30} className="text-gray-300" />
                  </div>
                  <h3 className={`${MOBILE_FONT} text-[18px] leading-[24px] font-semibold text-gray-700 md:text-lg md:font-bold`}>
                    {t('bnb_listing.search_results.no_results_title')}
                  </h3>
                </div>
              ) : (
                <>
                  <div className="flex flex-col gap-3 md:gap-6">
                    {services.map((service) => (
                      <BnBResultCard
                        key={service.id}
                        service={service}
                        nights={currentNights}
                        onClick={() => {
                          const slug = slugify(service.name);
                          const totalGuests = adults + childrenCount;
                          navigate(`/bnb/${slug}-${service.id}?dateFrom=${searchedCheckIn}&dateTo=${searchedCheckOut}&guests=${totalGuests}`);
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

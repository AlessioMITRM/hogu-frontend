import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Utensils, Home, CarFront, Music, Luggage, Search, 
  Calendar, MapPin, Clock, Users, Ticket, GlassWater, 
  Check, Star, Minus, Plus, Briefcase, Navigation, Loader2
} from 'lucide-react';

// ** IMPORTA QUI IL TUO JSON REALE **
// import italianLocationsData from '../../../assets/data/italian_locations.json';

// --- MOCK DATI (PER FAR FUNZIONARE IL CODICE QUI, RIMUOVI QUANDO USI IL TUO JSON) ---
const italianLocationsData = [
    {
        region: "Lazio",
        provinces: [
            { name: "Roma", cities: ["Roma", "Fiumicino", "Ciampino", "Tivoli"] },
            { name: "Latina", cities: ["Latina", "Terracina"] }
        ]
    },
    {
        region: "Lombardia",
        provinces: [
            { name: "Milano", cities: ["Milano", "Sesto San Giovanni", "Rho"] },
            { name: "Bergamo", cities: ["Bergamo", "Orio al Serio"] }
        ]
    },
    {
        region: "Campania",
        provinces: [
             { name: "Caserta", cities: ["Roccaromana", "Caserta"] },
             { name: "Napoli", cities: ["Napoli", "Pozzuoli"] }
        ]
    }
];

// --- CONFIGURAZIONE E TEMA ---
const HOGU_COLORS = {
  primary: '#68B49B',
  dark: '#1A202C',
  subtleText: '#64748B',
};

const HOGU_THEME = {
  fontFamily: 'font-sans',
};

// --- HELPER DATE & TIME ---
const getTodayDate = () => new Date().toISOString().split('T')[0];

// --- 1. PROCESSO DEI DATI GEOGRAFICI (DAL TUO ESEMPIO) ---
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
                    fullLabel: `${city}, ${region.region}`, // Modificato per visualizzare "Roma, Lazio"
                    searchString: mapFriendlyString.toLowerCase()
                });
            });
        });
    });
    return flatLocations;
};

// --- COMPONENTI UI BASE ---

// Gestione Slot 30 min + Logica Ora Futura
const TimeSlotSelect = ({ value, onChange, date, className = '' }) => {
    const generateTimeSlots = () => {
        const slots = [];
        for (let i = 0; i < 24; i++) {
            const hour = i.toString().padStart(2, '0');
            slots.push(`${hour}:00`);
            slots.push(`${hour}:30`);
        }
        return slots;
    };

    const availableSlots = useMemo(() => {
        const allSlots = generateTimeSlots();
        const todayStr = getTodayDate();
        
        if (date === todayStr) {
            const now = new Date();
            const currentHour = now.getHours();
            // Logica: Ora attuale + 1 ora minimo
            const minHour = currentHour + 1;

            return allSlots.filter(slot => {
                const [slotHour] = slot.split(':').map(Number);
                return slotHour >= minHour;
            });
        }
        return allSlots;
    }, [date]);

    return (
        <div className="relative w-full h-full">
            <select 
                value={value} 
                onChange={onChange} 
                className={`w-full h-full px-3 bg-transparent border-none outline-none text-sm font-medium text-gray-700 appearance-none cursor-pointer ${className}`}
            >
                <option value="" disabled>--:--</option>
                {availableSlots.map(slot => (
                    <option key={slot} value={slot}>{slot}</option>
                ))}
                {availableSlots.length === 0 && <option disabled>Nessuno slot disp.</option>}
            </select>
        </div>
    );
};

// --- IL TUO COMPONENTE AUTOCOMPLETE ADATTATO ---
const CityAutocompleteSearch = ({ label, value, onChange, icon: Icon, placeholder, required = false, className = '' }) => {
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const wrapperRef = useRef(null);

    // Usa useMemo per elaborare i dati una volta sola
    const locationData = useMemo(() => processLocations(italianLocationsData), []);

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
                    
                    // Priorità 1: Match Esatto
                    if (aCity === lowerInput && bCity !== lowerInput) return -1;
                    if (bCity === lowerInput && aCity !== lowerInput) return 1;
                    
                    // Priorità 2: Inizia con
                    const aStarts = aCity.startsWith(lowerInput);
                    const bStarts = bCity.startsWith(lowerInput);
                    if (aStarts && !bStarts) return -1;
                    if (!aStarts && bStarts) return 1;
                    
                    // Priorità 3: Alfabetico
                    return aCity.localeCompare(bCity);
                })
                .slice(0, 8); // Prendi i primi 8

            setSuggestions(filtered);
            setShowSuggestions(true);
        } else {
            setSuggestions([]);
            setShowSuggestions(false);
        }
    };

    const handleSelect = (item) => {
        // Formato richiesto: "Roma, Lazio"
        onChange(item.fullLabel); 
        setShowSuggestions(false);
    };

    return (
        <div className={`flex flex-col gap-2 w-full relative ${className}`} ref={wrapperRef}>
            <label className={`flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-[${HOGU_COLORS.subtleText}] ml-1`}>
                {Icon && <Icon size={14} className={`text-[${HOGU_COLORS.primary}]`} />}
                {label} {required && <span className="text-red-500">*</span>}
            </label>
            <div className="flex gap-2 bg-gray-50 hover:bg-white p-1.5 rounded-2xl border border-gray-200 hover:border-[#68B49B] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#68B49B]/20 focus-within:border-[#68B49B] transition-all h-[64px] items-center relative">
                <input 
                    type="text" 
                    value={value} 
                    onChange={handleInputChange} 
                    onFocus={() => value.length > 2 && setShowSuggestions(true)}
                    placeholder={placeholder} 
                    className="w-full h-full px-3 bg-transparent border-none focus:ring-0 text-base font-medium text-gray-700 outline-none placeholder:text-gray-400" 
                    autoComplete="off" 
                    required={required}
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
                 {showSuggestions && value.length > 2 && suggestions.length === 0 && (
                      <div className="absolute top-full left-0 mt-2 w-full bg-white rounded-xl shadow-xl border border-gray-100 p-4 text-center text-gray-400 text-sm z-[100]">
                        Nessuna città trovata
                      </div>
                )}
            </div>
        </div>
    );
};

const PrimaryButton = ({ children, type = 'button', className = '' }) => (
  <button
    type={type}
    className={`bg-[#68B49B] text-white ${HOGU_THEME.fontFamily} px-6 py-3 lg:px-8 lg:py-4 text-lg font-bold rounded-2xl transition-all duration-300 ease-out shadow-[0_8px_20px_-6px_rgba(104,180,155,0.5)] hover:shadow-[0_12px_25px_-8px_rgba(104,180,155,0.7)] hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2 ${className}`}
  >
    {children}
  </button>
);

const SearchSubmitButton = () => (
    <div className="w-full lg:w-auto min-w-[60px] flex-none mt-2 lg:mt-auto">
        <PrimaryButton type="submit" className="w-full h-[64px] !rounded-2xl !px-8 shadow-lg shadow-emerald-500/20">
            <Search size={24} strokeWidth={2.5} />
            <span className="lg:hidden">Cerca</span>
        </PrimaryButton>
    </div>
);

const SearchInputContainer = ({ label, icon: Icon, children, className = '', required=false }) => (
    <div className={`flex flex-col gap-2 ${className}`}>
      <label className={`flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-[${HOGU_COLORS.subtleText}] ml-1`}>
        {Icon && <Icon size={14} className={`text-[${HOGU_COLORS.primary}]`} />}
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="flex gap-2 bg-gray-50 hover:bg-white p-1.5 rounded-2xl border border-gray-200 hover:border-[#68B49B] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#68B49B]/20 focus-within:border-[#68B49B] transition-all h-[64px] items-center relative overflow-hidden w-full">
        {children}
      </div>
    </div>
);

const LuggageCard = ({ label, count, onIncrement, onDecrement, icon: Icon }) => {
    const isSelected = count > 0;
    return (
        <div className={`flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all duration-200 flex-1 min-w-[100px] ${isSelected ? 'border-[#68B49B] bg-[#F0FDF9]' : 'border-gray-100 bg-white hover:border-gray-200'}`}>
            <div className={`p-2 rounded-full mb-1 ${isSelected ? 'bg-[#68B49B]/10 text-[#68B49B]' : 'bg-gray-50 text-gray-400'}`}>
                <Icon size={20} />
            </div>
            <span className={`text-xs font-bold mb-2 ${isSelected ? 'text-[#33594C]' : 'text-gray-600'}`}>{label}</span>
            <div className="flex items-center gap-2">
                <button type="button" onClick={onDecrement} disabled={count === 0} className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${count === 0 ? 'bg-gray-100 text-gray-300' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}>
                    <Minus size={12} strokeWidth={3} />
                </button>
                <span className="text-sm font-bold w-4 text-center">{count}</span>
                <button type="button" onClick={onIncrement} className="w-6 h-6 rounded-full bg-[#68B49B]/10 text-[#68B49B] hover:bg-[#68B49B] hover:text-white flex items-center justify-center transition-colors">
                    <Plus size={12} strokeWidth={3} />
                </button>
            </div>
        </div>
    );
};

// --- COMPONENTE PRINCIPALE ---

export const ServiceSearch = () => {
  const navigate = useNavigate();
  const today = getTodayDate();
  
  const serviceCategories = [
    { name: 'Ristoranti', route: '/service/restaurant', icon: Utensils, id: 'Ristoranti' }, 
    { name: 'B&B', route: '/service/bnb', icon: Home, id: 'B&B' },
    { name: 'NCC', route: '/service/ncc', icon: CarFront, id: 'NCC' },
    { name: 'Club', route: '/service/club', icon: Music, id: 'Club' }, 
    { name: 'Bagagli', route: '/service/luggage', icon: Luggage, id: 'Luggage' }, 
  ];

  const [activeTab, setActiveTab] = useState(serviceCategories[0].name); 
  
  // --- STATI ---
  const [location, setLocation] = useState(""); 
  
  // Ristoranti
  const [restCuisine, setRestCuisine] = useState("");
  const [restDate, setRestDate] = useState("");
  const [restTime, setRestTime] = useState("");

  // B&B
  const [bnbCheckIn, setBnbCheckIn] = useState("");
  const [bnbCheckOut, setBnbCheckOut] = useState("");
  const [bnbGuests, setBnbGuests] = useState("2");

  // Club
  const [clubType, setClubType] = useState("DJ Set");
  const [clubDate, setClubDate] = useState("");
  const [clubGuests, setClubGuests] = useState("2");
  const [reserveTable, setReserveTable] = useState(false); 

  // Luggage
  const [lugDateFrom, setLugDateFrom] = useState("");
  const [lugTimeFrom, setLugTimeFrom] = useState("");
  const [lugDateTo, setLugDateTo] = useState("");
  const [lugTimeTo, setLugTimeTo] = useState("");
  const [luggageCounts, setLuggageCounts] = useState({ hand: 0, medium: 1, xxl: 0 });

  // NCC
  const [nccFromCity, setNccFromCity] = useState("");
  const [nccFromAddress, setNccFromAddress] = useState("");
  const [nccToCity, setNccToCity] = useState("");
  const [nccToAddress, setNccToAddress] = useState("");
  const [nccDate, setNccDate] = useState("");
  const [nccTime, setNccTime] = useState("");
  const [nccPassengers, setNccPassengers] = useState(1);

  const updateLuggage = (type, delta) => {
    setLuggageCounts(prev => ({ ...prev, [type]: Math.max(0, prev[type] + delta) }));
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const activeCategory = serviceCategories.find(cat => cat.name === activeTab);
    if (!activeCategory) return;

    const params = new URLSearchParams();

    switch(activeCategory.id) {
        case 'Ristoranti':
            params.append('location', location);
            if(restDate) params.append('date', restDate);
            if(restTime) params.append('time', restTime);
            if(restCuisine) params.append('cuisine', restCuisine);
            break;

        case 'B&B':
            params.append('location', location);
            if(bnbCheckIn) params.append('dateFrom', bnbCheckIn);
            if(bnbCheckOut) params.append('dateTo', bnbCheckOut);
            params.append('adults', bnbGuests);
            params.append('children', '0');
            params.append('rooms', '1');
            break;

        case 'Club':
            params.append('location', location);
            params.append('table', reserveTable);
            if(clubDate) params.append('date', clubDate);
            break;

        case 'NCC':
            params.append('fromCity', nccFromCity);
            params.append('fromAddress', nccFromAddress);
            params.append('toCity', nccToCity);
            params.append('toAddress', nccToAddress);
            if(nccDate) params.append('date', nccDate);
            if(nccTime) params.append('time', nccTime);
            params.append('passengers', nccPassengers);
            break;

        case 'Luggage':
            params.append('location', location);
            if(lugDateFrom) params.append('dateFrom', lugDateFrom);
            if(lugTimeFrom) params.append('timeFrom', lugTimeFrom);
            if(lugDateTo) params.append('dateTo', lugDateTo);
            if(lugTimeTo) params.append('timeTo', lugTimeTo);
            params.append('bagsS', luggageCounts.hand);
            params.append('bagsM', luggageCounts.medium);
            params.append('bagsL', luggageCounts.xxl);
            break;
        default: break;
    }

    navigate(`${activeCategory.route}?${params.toString()}`);
  };

  const renderFormContent = () => {
    const currentCategory = serviceCategories.find(cat => cat.name === activeTab)?.id;
    const wrapperClass = "flex flex-col lg:flex-row gap-4 items-end w-full animate-in fade-in slide-in-from-bottom-1 duration-300";
    
    switch (currentCategory) {
      case 'Ristoranti':
        return (
          <div className={wrapperClass}>
            <CityAutocompleteSearch 
                label="Dove" icon={MapPin} 
                placeholder="Dove vuoi mangiare?" className="w-full lg:flex-[1.5]"
                value={location} onChange={setLocation}
            />
            <SearchInputContainer label="Cucina" icon={Utensils} className="w-full lg:flex-[1.2]">
               <input type="text" placeholder="Es. Pesce, Romana..." className="w-full h-full px-3 bg-transparent border-none focus:ring-0 text-base font-medium outline-none placeholder:text-gray-400" 
                 value={restCuisine} onChange={(e) => setRestCuisine(e.target.value)} />
            </SearchInputContainer>
            
            <div className="flex gap-3 w-full lg:flex-[1.2]">
                <SearchInputContainer label="Data" icon={Calendar} className="flex-1">
                    <input type="date" min={today} className="w-full h-full px-2 bg-transparent border-none outline-none text-sm font-medium text-gray-600" 
                        value={restDate} onChange={(e) => setRestDate(e.target.value)} />
                </SearchInputContainer>
                <SearchInputContainer label="Ora" icon={Clock} className="flex-1">
                    <TimeSlotSelect value={restTime} date={restDate} onChange={(e) => setRestTime(e.target.value)} />
                </SearchInputContainer>
            </div>
            <SearchSubmitButton />
          </div>
        );

      case 'B&B':
        return (
          <div className={wrapperClass}>
            <CityAutocompleteSearch 
                label="Destinazione" icon={MapPin} placeholder="Dove vuoi andare?" className="w-full lg:flex-[2]"
                value={location} onChange={setLocation}
            />
            <div className="flex flex-row gap-3 w-full lg:flex-[1.5]">
                <SearchInputContainer label="Check-in" icon={Calendar} className="flex-1">
                    <input type="date" min={today} className="w-full h-full px-2 bg-transparent border-none outline-none text-sm font-medium text-gray-600" 
                        value={bnbCheckIn} onChange={(e) => setBnbCheckIn(e.target.value)} />
                </SearchInputContainer>
                <SearchInputContainer label="Check-out" icon={Calendar} className="flex-1">
                    <input type="date" min={bnbCheckIn || today} className="w-full h-full px-2 bg-transparent border-none outline-none text-sm font-medium text-gray-600" 
                        value={bnbCheckOut} onChange={(e) => setBnbCheckOut(e.target.value)} />
                </SearchInputContainer>
            </div>
            <SearchInputContainer label="Ospiti" icon={Users} className="w-full lg:flex-[1.2]">
               <input type="number" min="1" placeholder="2 Ospiti" className="w-full h-full px-3 bg-transparent border-none focus:ring-0 text-base font-medium outline-none placeholder:text-gray-400" 
                 value={bnbGuests} onChange={(e) => setBnbGuests(e.target.value)} />
            </SearchInputContainer>
            <SearchSubmitButton />
          </div>
        );

      case 'Club':
        return (
          <div className={wrapperClass}>
             <CityAutocompleteSearch label="Città" icon={MapPin} placeholder="Dove vuoi ballare?" className="w-full lg:flex-[1.5]" value={location} onChange={setLocation} />
             <SearchInputContainer label="Tipo Evento" icon={Ticket} className="w-full lg:flex-[1.2]">
                <select className="w-full h-full px-3 bg-transparent border-none outline-none text-base font-medium appearance-none cursor-pointer text-gray-700"
                    value={clubType} onChange={(e) => setClubType(e.target.value)}>
                    <option>DJ Set</option><option>Live Concert</option><option>Evento Privato</option>
                </select>
             </SearchInputContainer>
             <div className="flex flex-row gap-3 w-full lg:flex-[1.2]">
                <SearchInputContainer label="Data" icon={Calendar} className="flex-1">
                    <input type="date" min={today} className="w-full h-full px-2 bg-transparent border-none outline-none text-sm font-medium text-gray-600" 
                        value={clubDate} onChange={(e) => setClubDate(e.target.value)} />
                </SearchInputContainer>
                <SearchInputContainer label="Persone" icon={Users} className="flex-1">
                    <input type="number" placeholder="2" className="w-full h-full px-2 bg-transparent border-none outline-none text-base font-medium placeholder:text-gray-400" 
                        value={clubGuests} onChange={(e) => setClubGuests(e.target.value)} />
                </SearchInputContainer>
             </div>
             <div className="flex flex-col gap-2 w-full lg:min-w-[160px] lg:w-auto">
                <label className={`flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-[${HOGU_COLORS.subtleText}] ml-1`}>
                      <GlassWater size={14} className={`text-[${HOGU_COLORS.primary}]`} /> Tavolo
                </label>
                <div className={`h-[64px] rounded-2xl border cursor-pointer transition-all duration-300 flex items-center justify-between px-4 shadow-sm ${reserveTable ? `bg-[#F0FDF9] border-[#68B49B] ring-1 ring-[#68B49B]` : 'bg-gray-50 border-gray-200 hover:border-[#68B49B]'}`} onClick={() => setReserveTable(!reserveTable)}>
                    <span className={`text-xs font-bold ${reserveTable ? 'text-[#33594C]' : 'text-gray-500'}`}>{reserveTable ? 'Sì, Tavolo' : 'No, Lista'}</span>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all border ${reserveTable ? 'bg-[#68B49B] border-[#68B49B] text-white' : 'bg-gray-200 border-gray-300 text-transparent'}`}>
                        {reserveTable ? <Star size={12} fill="currentColor" /> : <Check size={12} strokeWidth={3} />}
                    </div>
                </div>
             </div>
             <SearchSubmitButton />
          </div>
        );

      case 'Luggage':
        return (
          <div className="flex flex-col gap-4 w-full animate-in fade-in duration-300">
            <div className="flex flex-col lg:flex-row gap-4 items-end w-full">
                <CityAutocompleteSearch label="Città Deposito" icon={MapPin} placeholder="Dove lasci i bagagli?" className="w-full lg:flex-[1.5]" value={location} onChange={setLocation} />
                <div className="flex flex-col md:flex-row gap-4 w-full lg:flex-[2]">
                    <SearchInputContainer label="Deposito" icon={Calendar} className="w-full">
                        <div className="flex w-full h-full items-center gap-2 px-2">
                            <input type="date" min={today} className="flex-1 bg-transparent border-none outline-none text-sm font-medium text-gray-800 min-w-0" 
                                value={lugDateFrom} onChange={(e) => setLugDateFrom(e.target.value)} />
                            <div className="w-px h-6 bg-gray-200 mx-1 shrink-0"></div>
                            <Clock size={16} className="text-gray-400 shrink-0" />
                            <div className="w-24"><TimeSlotSelect value={lugTimeFrom} date={lugDateFrom} onChange={(e) => setLugTimeFrom(e.target.value)} /></div>
                        </div>
                    </SearchInputContainer>
                    <SearchInputContainer label="Ritiro" icon={Clock} className="w-full">
                        <div className="flex w-full h-full items-center gap-2 px-2">
                            <input type="date" min={lugDateFrom || today} className="flex-1 bg-transparent border-none outline-none text-sm font-medium text-gray-800 min-w-0" 
                                value={lugDateTo} onChange={(e) => setLugDateTo(e.target.value)} />
                            <div className="w-px h-6 bg-gray-200 mx-1 shrink-0"></div>
                            <Clock size={16} className="text-gray-400 shrink-0" />
                            <div className="w-24"><TimeSlotSelect value={lugTimeTo} date={lugDateTo} onChange={(e) => setLugTimeTo(e.target.value)} /></div>
                        </div>
                    </SearchInputContainer>
                </div>
                <SearchSubmitButton />
            </div>
            <div className="flex flex-col gap-2 bg-gray-50/50 p-4 rounded-2xl border border-dashed border-gray-200">
                <span className={`text-xs font-bold uppercase tracking-wide text-[${HOGU_COLORS.subtleText}]`}>Bagagli</span>
                <div className="flex gap-3 overflow-x-auto pb-2 w-full">
                    <LuggageCard label="A Mano" icon={Briefcase} count={luggageCounts.hand} onIncrement={() => updateLuggage('hand', 1)} onDecrement={() => updateLuggage('hand', -1)} />
                    <LuggageCard label="Medio" icon={Luggage} count={luggageCounts.medium} onIncrement={() => updateLuggage('medium', 1)} onDecrement={() => updateLuggage('medium', -1)} />
                    <LuggageCard label="XXL" icon={Luggage} count={luggageCounts.xxl} onIncrement={() => updateLuggage('xxl', 1)} onDecrement={() => updateLuggage('xxl', -1)} />
                </div>
            </div>
          </div>
        );

      case 'NCC':
      default:
        return (
           <div className="flex flex-col gap-4 w-full animate-in fade-in duration-300">
               <div className="flex flex-col md:flex-row gap-4 w-full">
                    <CityAutocompleteSearch label="Città Partenza" icon={MapPin} placeholder="Es. Milano" className="w-full flex-1" value={nccFromCity} onChange={setNccFromCity} required />
                    <SearchInputContainer label="Indirizzo Partenza" icon={Navigation} className="w-full flex-[1.5]">
                        <input type="text" placeholder="Via, Civico o Aeroporto" className="w-full h-full px-3 bg-transparent border-none focus:ring-0 text-base font-medium outline-none placeholder:text-gray-400" value={nccFromAddress} onChange={(e) => setNccFromAddress(e.target.value)} />
                    </SearchInputContainer>
               </div>
               <div className="flex flex-col md:flex-row gap-4 w-full">
                    <CityAutocompleteSearch label="Città Destinazione" icon={MapPin} placeholder="Es. Roma" className="w-full flex-1" value={nccToCity} onChange={setNccToCity} required />
                    <SearchInputContainer label="Indirizzo Destinazione" icon={Navigation} className="w-full flex-[1.5]">
                        <input type="text" placeholder="Via, Civico o Aeroporto" className="w-full h-full px-3 bg-transparent border-none focus:ring-0 text-base font-medium outline-none placeholder:text-gray-400" value={nccToAddress} onChange={(e) => setNccToAddress(e.target.value)} />
                    </SearchInputContainer>
               </div>
               <div className="flex flex-col lg:flex-row gap-4 items-end w-full">
                    <div className="flex gap-2 w-full lg:flex-1">
                        <SearchInputContainer label="Data" icon={Calendar} className="flex-1">
                            <input type="date" min={today} className="w-full h-full px-3 bg-transparent border-none outline-none text-sm font-medium text-gray-600 min-w-0" value={nccDate} onChange={(e) => setNccDate(e.target.value)} />
                        </SearchInputContainer>
                        <SearchInputContainer label="Ora" icon={Clock} className="flex-1 lg:!min-w-[100px] lg:max-w-[120px]">
                            <TimeSlotSelect value={nccTime} date={nccDate} onChange={(e) => setNccTime(e.target.value)} />
                        </SearchInputContainer>
                    </div>
                    <SearchInputContainer label="Passeggeri" icon={Users} className="w-full lg:max-w-[150px]">
                        <input type="number" min="1" className="w-full h-full px-3 bg-transparent border-none outline-none text-base font-medium text-center text-gray-700" value={nccPassengers} onChange={(e) => setNccPassengers(e.target.value)} />
                    </SearchInputContainer>
                    <SearchSubmitButton />
               </div>
           </div>
        );
    }
  };

  return (
    <div className={`max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 relative z-30 ${HOGU_THEME.fontFamily}`}>
      {/* TABS (SEMPLIFICATI PER BREVITÀ, USA LA LOGICA RESPONSIVE PRECEDENTE SE VUOI) */}
      <div className="flex flex-wrap md:flex-nowrap justify-center md:grid md:grid-cols-5 gap-2 md:gap-0 items-end px-1 mb-4 md:mb-0">
        {serviceCategories.map((cat) => {
            const isActive = activeTab === cat.name;
            return (
                <button key={cat.id} onClick={() => setActiveTab(cat.name)}
                    className={`
                        relative flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2 py-2 md:py-4 px-3 w-auto md:w-full
                        font-bold text-xs md:text-sm tracking-wide transition-all duration-200 rounded-2xl md:rounded-none md:rounded-t-2xl md:-mb-px md:border-t md:border-l md:border-r
                        ${isActive ? 'bg-[#68B49B] md:bg-white text-white md:text-[#68B49B] md:border-white shadow-md md:shadow-[0_-5px_10px_-5px_rgba(0,0,0,0.05)] z-20 h-[56px]' : 'bg-white md:bg-gray-100/90 text-gray-500 md:border-transparent hover:bg-gray-50 md:hover:bg-gray-200 z-10 h-[48px] md:mb-1'}
                    `}
                >
                    <cat.icon size={isActive ? 18 : 16} strokeWidth={2.5} />
                    <span>{cat.name}</span>
                    {isActive && <div className="hidden md:block absolute bottom-[-2px] left-0 right-0 h-[4px] bg-white z-30" />}
                </button>
            )
        })}
      </div>
      
      {/* BARRA RICERCA */}
      <div className="bg-white rounded-2xl md:rounded-b-3xl md:rounded-tr-3xl md:rounded-tl-none p-5 lg:p-8 shadow-xl relative z-10 min-h-[120px]">
        <form onSubmit={handleSearchSubmit} className="relative z-30">
            {renderFormContent()}
        </form>
      </div>
    </div>
  );
};

export default ServiceSearch;
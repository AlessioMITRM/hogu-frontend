import { useState, useMemo, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { 
    MapPin, Check, Wifi, Coffee, Bed, Wind, ShowerHead, Tv, Utensils, 
    ChevronRight, Save, Upload, Trash2, Plus, DollarSign, Eye, EyeOff, Home, Users, Bath, GripVertical, X, Navigation
} from 'lucide-react';

import { withAuthProtection } from './../../auth/withAuthProtection.jsx'; 

import { HOGU_COLORS, HOGU_THEME } from '../../../../config/theme.js';

import italianLocationsData from '../../../../assets/data/italian_locations.json'; 
import englishLocationsData from '../../../../assets/data/english_locations.json'; 

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
const CityAutocomplete = ({ label, value, onChange, icon: Icon }) => {
    const { i18n, t } = useTranslation();
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
                .slice(0, 8);

            setSuggestions(filtered);
            setShowSuggestions(true);
        } else {
            setSuggestions([]);
            setShowSuggestions(false);
        }
    };

    const handleSelect = (item) => {
        onChange(item.fullLabel); 
        setShowSuggestions(false);
    };

    return (
        <div className="group relative" ref={wrapperRef}>
            {label && <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 ml-1">{label}</label>}
            <div className="relative">
                {Icon && <Icon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />}
                <input 
                    type="text"
                    value={value}
                    onChange={handleInputChange}
                    onFocus={() => value.length > 2 && setShowSuggestions(true)}
                    placeholder="Cerca città..."
                    className={`${HOGU_THEME.inputBase} ${Icon ? 'pl-11' : ''}`}
                    autoComplete="off"
                />
                {showSuggestions && suggestions.length > 0 && (
                    <div className="absolute z-50 w-full mt-2 bg-white rounded-xl shadow-xl border border-gray-100 max-h-60 overflow-y-auto">
                        {suggestions.map((item, idx) => (
                            <button
                                key={idx}
                                onClick={() => handleSelect(item)}
                                className="w-full text-left px-4 py-3 hover:bg-[#F0FDF9] hover:text-[#33594C] transition-colors border-b border-gray-50 last:border-0"
                            >
                                <div className="font-bold text-sm text-gray-800">{item.city}</div>
                                <div className="text-xs text-gray-400">{item.province}, {item.region}</div>
                            </button>
                        ))}
                    </div>
                )}
                 {showSuggestions && value.length > 2 && suggestions.length === 0 && (
                     <div className="absolute z-50 w-full mt-2 bg-white rounded-xl shadow-xl border border-gray-100 p-4 text-center text-gray-400 text-sm">
                        Nessuna città trovata
                     </div>
                )}
            </div>
        </div>
    );
};

// --- COMPONENTI UI DI SUPPORTO ---

const EditableInput = ({ label, value, onChange, type = "text", className = "", large = false, placeholder = "", icon: Icon }) => (
    <div className={`group ${className}`}>
        {label && <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 ml-1">{label}</label>}
        <div className="relative">
             {Icon && <Icon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />}
            <input 
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className={`${HOGU_THEME.inputBase} ${large ? 'text-2xl font-bold' : 'text-base'} ${Icon ? 'pl-11' : ''}`}
            />
        </div>
    </div>
);

const EditableTextarea = ({ label, value, onChange, rows = 4 }) => (
    <div className="group">
        {label && <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 ml-1">{label}</label>}
        <textarea 
            value={value}
            onChange={(e) => onChange(e.target.value)}
            rows={rows}
            className={`${HOGU_THEME.inputBase} resize-none leading-relaxed`}
        />
    </div>
);

const AmenityToggle = ({ icon: Icon, label, active, onClick }) => (
    <button 
        onClick={onClick}
        type="button"
        className={`
            flex items-center gap-3 p-3 rounded-xl border transition-all w-full text-left
            ${active 
                ? `bg-[${HOGU_COLORS.bgLight}] border-[${HOGU_COLORS.primary}] text-[${HOGU_COLORS.primaryDark}] shadow-sm` 
                : 'bg-gray-50 border-gray-100 text-gray-500 hover:bg-gray-100'}
        `}
    >
        <Icon size={20} className={active ? `text-[${HOGU_COLORS.primary}]` : 'text-gray-400'} />
        <span className="text-sm font-bold">{label}</span>
        {active && <Check size={16} className="ml-auto" />}
    </button>
);

const ImageUploadCard = ({ src, onDelete, isMain = false }) => (
    <div className={`relative rounded-2xl overflow-hidden group ${isMain ? 'col-span-2 row-span-2 aspect-video' : 'aspect-[4/3]'}`}>
        <img src={src} alt="Service" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <button 
                onClick={onDelete}
                className="p-2 bg-white rounded-full text-red-500 hover:bg-red-50 transition-colors shadow-lg"
                title="Rimuovi foto"
            >
                <Trash2 size={20} />
            </button>
            {isMain && <span className="absolute bottom-4 left-4 bg-[#68B49B] text-white text-xs px-2 py-1 rounded-md font-bold">Copertina</span>}
        </div>
    </div>
);

// --- COMPONENTE GESTIONE CAMERA SINGOLA ---
const RoomEditorCard = ({ room, index, onChange, onDelete }) => (
    <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200 relative group transition-all hover:bg-white hover:shadow-md hover:border-[#68B49B]/30">
        <div className="flex items-start justify-between gap-4 mb-3">
            <div className="flex items-center gap-2 flex-1">
                <div className="cursor-move text-gray-400 hover:text-gray-600">
                    <GripVertical size={20} />
                </div>
                <div className="flex-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Nome Camera</label>
                    <input 
                        type="text" 
                        value={room.name}
                        onChange={(e) => onChange(room.id, 'name', e.target.value)}
                        placeholder={`Camera ${index + 1}`}
                        className="bg-transparent border-b border-gray-300 focus:border-[#68B49B] w-full font-bold text-gray-800 focus:outline-none pb-1 transition-colors"
                    />
                </div>
            </div>
            <button 
                onClick={() => onDelete(room.id)}
                className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                title="Rimuovi Camera"
            >
                <X size={18} />
            </button>
        </div>
        
        <div className="flex gap-4 pl-7">
            <div className="flex-1 bg-white rounded-xl p-2 border border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2 text-gray-500">
                    <Users size={16} />
                    <span className="text-xs font-semibold">Ospiti</span>
                </div>
                <input 
                    type="number" 
                    min="1"
                    value={room.guests}
                    onChange={(e) => onChange(room.id, 'guests', parseInt(e.target.value) || 0)}
                    className="w-12 text-center font-bold text-gray-900 bg-transparent focus:outline-none"
                />
            </div>
            <div className="flex-1 bg-white rounded-xl p-2 border border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2 text-gray-500">
                    <Bath size={16} />
                    <span className="text-xs font-semibold">Bagni</span>
                </div>
                <input 
                    type="number" 
                    min="0"
                    value={room.bathrooms}
                    onChange={(e) => onChange(room.id, 'bathrooms', parseInt(e.target.value) || 0)}
                    className="w-12 text-center font-bold text-gray-900 bg-transparent focus:outline-none"
                />
            </div>
        </div>
    </div>
);

// --- COMPONENTE PRINCIPALE: SERVICE EDIT ---

export const ServiceEditPageBnBBase = () => {
    // --- STATE MANAGEMENT ---
    const [isLoading, setIsLoading] = useState(false);
    
    // Dati del servizio
    const [formData, setFormData] = useState({
        title: 'Hogu Suite Trastevere',
        description: "Immergiti nell'atmosfera autentica di Roma soggiornando in questa elegante suite nel cuore di Trastevere.",
        city: "Roma, Roma, Lazio", // ** NUOVO CAMPO **
        address: "Vicolo del Cinque, 12",
        price: 120,
        mq: 25,
        isActive: true,
        amenities: ['wifi', 'coffee', 'ac', 'tv'],
        // NUOVA STRUTTURA CAMERE
        rooms: [
            { id: 1, name: 'Suite Principale', guests: 2, bathrooms: 1 },
            { id: 2, name: 'Camera Ospiti', guests: 1, bathrooms: 1 }
        ]
    });

    const [images, setImages] = useState([
        'https://picsum.photos/800/600',
        'https://picsum.photos/600/500',
        'https://picsum.photos/600/501',
        'https://picsum.photos/500/400'
    ]);

    // --- CALCOLA TOTALI ---
    const totalStats = useMemo(() => {
        return formData.rooms.reduce((acc, room) => ({
            guests: acc.guests + (room.guests || 0),
            bathrooms: acc.bathrooms + (room.bathrooms || 0),
            count: acc.count + 1
        }), { guests: 0, bathrooms: 0, count: 0 });
    }, [formData.rooms]);

    // --- HANDLERS ---
    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const toggleAmenity = (id) => {
        setFormData(prev => {
            const exists = prev.amenities.includes(id);
            return {
                ...prev,
                amenities: exists 
                    ? prev.amenities.filter(a => a !== id) 
                    : [...prev.amenities, id]
            };
        });
    };

    // --- ROOM HANDLERS ---
    const addRoom = () => {
        const newId = Math.max(...formData.rooms.map(r => r.id), 0) + 1;
        setFormData(prev => ({
            ...prev,
            rooms: [...prev.rooms, { id: newId, name: '', guests: 2, bathrooms: 1 }]
        }));
    };

    const updateRoom = (id, field, value) => {
        setFormData(prev => ({
            ...prev,
            rooms: prev.rooms.map(r => r.id === id ? { ...r, [field]: value } : r)
        }));
    };

    const removeRoom = (id) => {
        if (formData.rooms.length <= 1) {
            alert("Devi avere almeno una camera.");
            return;
        }
        setFormData(prev => ({
            ...prev,
            rooms: prev.rooms.filter(r => r.id !== id)
        }));
    };

    const handleSave = () => {
        setIsLoading(true);
        console.log("Saving Data:", formData); // Include city e address
        setTimeout(() => {
            setIsLoading(false);
            alert("Modifiche salvate con successo!");
        }, 1000);
    };

    const removeImage = (indexToRemove) => {
        setImages(images.filter((_, index) => index !== indexToRemove));
    };

    // --- RENDER ---
    return (
        <div className={`max-w-7xl mx-auto px-4 py-8 lg:py-12 ${HOGU_THEME.fontFamily} bg-gray-50/50 min-h-screen`}>
            
            {/* TOP BAR */}
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                <nav className="flex items-center text-sm font-medium text-gray-500">
                    <span>Dashboard</span>
                    <ChevronRight size={16} className="mx-2" />
                    <span>I miei Servizi</span>
                    <ChevronRight size={16} className="mx-2" />
                    <span className={`text-[${HOGU_COLORS.primary}] font-bold`}>Modifica Servizio</span>
                </nav>
                <div className="flex items-center gap-3">
                     <span className="text-xs text-gray-400 hidden md:block">Ultima modifica: Oggi, 14:30</span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-10">

                {/* --- COLONNA SINISTRA --- */}
                <div className="lg:col-span-2 space-y-8">
                    
                    {/* SEZIONE 1: INFO BASE & INDIRIZZO */}
                    <section className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100">
                        <div className="mb-6">
                            <EditableInput 
                                label="Nome Struttura / Servizio" 
                                value={formData.title} 
                                onChange={(val) => handleInputChange('title', val)}
                                large={true}
                                className="mb-6"
                            />
                            
                            {/* ** NUOVO: CITTA' CON AUTOCOMPLETE ** */}
                            <CityAutocomplete 
                                label="Città"
                                value={formData.city} 
                                onChange={(val) => handleInputChange('city', val)}
                                icon={MapPin}
                            />

                            {/* ** NUOVO: INDIRIZZO (VIA/NUMERO) ** */}
                            <EditableInput 
                                label="Indirizzo (Via e Civico)" 
                                value={formData.address} 
                                onChange={(val) => handleInputChange('address', val)}
                                placeholder="Es. Vicolo del Cinque, 12"
                                icon={Navigation}
                                className="mt-4"
                            />

                        </div>
                        <EditableTextarea 
                            label="Descrizione Dettagliata" 
                            value={formData.description}
                            onChange={(val) => handleInputChange('description', val)}
                            rows={4}
                        />
                    </section>

                    {/* SEZIONE 2: CONFIGURAZIONE CAMERE (NEW) */}
                    <section className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100">
                        <div className="flex justify-between items-end mb-6">
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                    <Bed size={24} className={`text-[${HOGU_COLORS.primary}]`} />
                                    Camere & Disposizione
                                </h3>
                                <p className="text-sm text-gray-500 mt-1">Definisci la composizione del tuo alloggio.</p>
                            </div>
                            
                            {/* Totali Calcolati */}
                            <div className="flex gap-3 text-sm bg-gray-50 px-4 py-2 rounded-xl border border-gray-100">
                                <div className="flex items-center gap-1 font-bold text-gray-700">
                                    <Users size={14} className="text-gray-400" />
                                    <span>{totalStats.guests} Tot.</span>
                                </div>
                                <div className="w-px h-4 bg-gray-300 self-center"></div>
                                <div className="flex items-center gap-1 font-bold text-gray-700">
                                    <Bath size={14} className="text-gray-400" />
                                    <span>{totalStats.bathrooms} Tot.</span>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {formData.rooms.map((room, index) => (
                                <RoomEditorCard 
                                    key={room.id}
                                    index={index}
                                    room={room}
                                    onChange={updateRoom}
                                    onDelete={removeRoom}
                                />
                            ))}
                        </div>

                        <button 
                            onClick={addRoom}
                            className={`w-full mt-4 py-3 rounded-xl border-2 border-dashed border-gray-200 text-gray-500 font-bold flex items-center justify-center gap-2 hover:border-[${HOGU_COLORS.primary}] hover:text-[${HOGU_COLORS.primary}] hover:bg-[#F0FDF9] transition-all group`}
                        >
                            <div className="bg-gray-100 p-1 rounded-full group-hover:bg-[#68B49B] group-hover:text-white transition-colors">
                                <Plus size={16} />
                            </div>
                            Aggiungi Camera
                        </button>
                    </section>

                    {/* SEZIONE 3: FOTO */}
                    <section className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-gray-900">Foto & Media</h3>
                            <button className={`text-[${HOGU_COLORS.primary}] font-bold text-sm flex items-center gap-2 hover:underline`}>
                                <Upload size={18} /> Carica Nuove
                            </button>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {images.map((img, idx) => (
                                <ImageUploadCard key={idx} src={img} isMain={idx === 0} onDelete={() => removeImage(idx)} />
                            ))}
                            <div className="aspect-[4/3] rounded-2xl border-2 border-dashed border-gray-200 hover:border-[#68B49B] bg-gray-50 flex flex-col items-center justify-center text-gray-400 hover:text-[#68B49B] cursor-pointer transition-all group">
                                <div className="p-3 bg-white rounded-full shadow-sm group-hover:scale-110 transition-transform mb-2">
                                    <Plus size={24} />
                                </div>
                                <span className="text-xs font-bold">Aggiungi</span>
                            </div>
                        </div>
                    </section>

                    {/* SEZIONE 4: SERVIZI */}
                    <section className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100">
                        <h3 className="text-xl font-bold text-gray-900 mb-6">Dotazioni & Servizi</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <AmenityToggle icon={Wifi} label="Wi-Fi Fibra" active={formData.amenities.includes('wifi')} onClick={() => toggleAmenity('wifi')} />
                            <AmenityToggle icon={Coffee} label="Colazione Inclusa" active={formData.amenities.includes('coffee')} onClick={() => toggleAmenity('coffee')} />
                            <AmenityToggle icon={Wind} label="Aria Condizionata" active={formData.amenities.includes('ac')} onClick={() => toggleAmenity('ac')} />
                            <AmenityToggle icon={ShowerHead} label="Set Cortesia" active={formData.amenities.includes('set')} onClick={() => toggleAmenity('set')} />
                            <AmenityToggle icon={Tv} label="Smart TV" active={formData.amenities.includes('tv')} onClick={() => toggleAmenity('tv')} />
                            <AmenityToggle icon={Utensils} label="Cucina / Frigo" active={formData.amenities.includes('kitchen')} onClick={() => toggleAmenity('kitchen')} />
                        </div>
                    </section>
                </div>

                {/* --- COLONNA DESTRA (STICKY) --- */}
                <div className="lg:col-span-1">
                    <div className="sticky top-24 space-y-6">
                        
                        {/* CARD PREZZO */}
                        <div className={`${HOGU_THEME.cardBase} p-6 overflow-hidden relative`}>
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#68B49B] to-emerald-400"></div>
                            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <DollarSign size={20} className={`text-[${HOGU_COLORS.primary}]`} />
                                Impostazioni Vendita
                            </h3>

                            <div className="mb-6">
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Prezzo per notte (€)</label>
                                <div className="relative">
                                    <input 
                                        type="number" 
                                        value={formData.price}
                                        onChange={(e) => handleInputChange('price', e.target.value)}
                                        className="w-full pl-8 pr-4 py-4 bg-gray-50 border-2 border-transparent rounded-2xl text-3xl font-bold text-gray-900 focus:bg-white focus:border-[#68B49B] focus:ring-0 outline-none transition-all"
                                    />
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xl font-bold">€</span>
                                </div>
                            </div>

                            <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${formData.isActive ? 'bg-green-100 text-green-600' : 'bg-gray-200 text-gray-500'}`}>
                                        {formData.isActive ? <Eye size={20} /> : <EyeOff size={20} />}
                                    </div>
                                    <div>
                                        <p className="font-bold text-sm text-gray-900">Visibilità</p>
                                        <p className="text-xs text-gray-500">{formData.isActive ? 'Online' : 'Nascosto'}</p>
                                    </div>
                                </div>
                                <div className="relative inline-block w-12 mr-2 align-middle select-none transition duration-200 ease-in">
                                    <input 
                                        type="checkbox" 
                                        id="toggle" 
                                        checked={formData.isActive}
                                        onChange={(e) => handleInputChange('isActive', e.target.checked)}
                                        className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer transition-transform duration-200 ease-in-out checked:translate-x-full checked:border-[#68B49B]"
                                    />
                                    <label htmlFor="toggle" className={`toggle-label block overflow-hidden h-6 rounded-full cursor-pointer transition-colors duration-200 ${formData.isActive ? 'bg-[#68B49B]' : 'bg-gray-300'}`}></label>
                                </div>
                            </div>

                            <button 
                                onClick={handleSave}
                                disabled={isLoading}
                                className={`
                                    w-full py-4 rounded-xl font-bold text-lg text-white shadow-xl shadow-[#68B49B]/20 flex items-center justify-center gap-2 transition-all
                                    ${isLoading ? 'bg-gray-400 cursor-not-allowed' : `bg-[${HOGU_COLORS.primary}] hover:scale-[1.02] hover:bg-opacity-90`}
                                `}
                            >
                                {isLoading ? 'Salvataggio...' : (
                                    <>
                                        <Save size={20} /> Salva Modifiche
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export const ServiceEditPageBnB = withAuthProtection(ServiceEditPageBnBBase, ['PROVIDER', "BNB"]);

export default ServiceEditPageBnB;
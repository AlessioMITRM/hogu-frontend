import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
    Clock, MapPin, Info, Star, Check, Wifi, Utensils, Wine, Vegan, Accessibility, Car,
    ChevronRight, Save, Upload, Trash2, Plus, DollarSign, Eye, EyeOff, ChefHat, Flame, GripVertical, X, Navigation, Euro,
    // Icone necessarie per l'Accordion Info Servizio (come da riferimento)
    CalendarCheck, CreditCard, FileText
} from 'lucide-react';

import { withAuthProtection } from './../../auth/withAuthProtection.jsx'; 

import { Breadcrumbs } from '../../../../components/ui/Breadcrumbs.jsx'; 

// --- 1. DATI MOCK E CONFIGURAZIONE ---

const HOGU_COLORS = {
    primary: '#68B49B',
    dark: '#1A202C',
    lightAccent: '#E6F5F0',
    subtleText: '#4A5568',
};

const HOGU_THEME = {
    bg: 'bg-white',
    text: `text-[${HOGU_COLORS.dark}]`,
    inputBase: 'w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:ring-2 focus:ring-[#68B49B]/20 focus:border-[#68B49B] outline-none transition-all placeholder:text-gray-400 text-gray-800',
    cardBase: 'bg-white rounded-[2rem] shadow-sm border border-gray-100',
    fontFamily: 'font-sans',
};

// Breadcrumbs Configuration
const breadcrumbsItems = [
    { label: 'Dashboard', href: '#' },
    { label: 'I miei Locali', href: '#' },
    { label: 'Modifica Ristorante', href: '#' }
];

// Mock Locations Data (Identico a quello usato per NCC)
const mockLocationsData = [
    { city: "Milano", province: "Milano", region: "Lombardia" },
    { city: "Roma", province: "Roma", region: "Lazio" },
    { city: "Napoli", province: "Napoli", region: "Campania" },
    { city: "Torino", province: "Torino", region: "Piemonte" },
    { city: "Firenze", province: "Firenze", region: "Toscana" },
    { city: "Bologna", province: "Bologna", region: "Emilia-Romagna" },
    { city: "Venezia", province: "Venezia", region: "Veneto" },
    { city: "Verona", province: "Verona", region: "Veneto" },
];

const processLocations = (data) => {
    return data.map(item => ({
        ...item,
        fullLabel: `${item.city}, ${item.province}, ${item.region}`,
        searchString: `${item.city}, ${item.province}, ${item.region}`.toLowerCase()
    }));
};

// --- COMPONENTE INFO ACCORDION ITEM (COPIATO DAL PRIMO ESEMPIO) ---
const InfoAccordionItem = ({ icon: Icon, title, description, colorClass, defaultOpen = false }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <div className="border-b border-gray-100 last:border-0">
            <button 
                onClick={() => setIsOpen(!isOpen)} 
                className="w-full flex items-center justify-between py-3 hover:bg-gray-50 transition-colors rounded-lg px-2 -mx-2 group"
            >
                <div className="flex items-center gap-3">
                    <div className={`p-1.5 rounded-lg shrink-0 transition-colors ${colorClass}`}>
                        <Icon size={16} />
                    </div>
                    <span className="font-bold text-sm text-gray-900">{title}</span>
                </div>
                <ChevronRight 
                    size={16} 
                    className={`text-gray-400 transition-transform duration-300 ${isOpen ? 'rotate-90' : ''}`} 
                />
            </button>
            <div 
                className={`
                    overflow-hidden transition-all duration-300 ease-in-out
                    ${isOpen ? 'max-h-24 opacity-100 mb-3' : 'max-h-0 opacity-0'}
                `}
            >
                <p className="text-xs text-gray-500 leading-relaxed pl-[2.8rem] pr-2">
                    {description}
                </p>
            </div>
        </div>
    );
};


// --- 2. COMPONENTI UI ---

const CityAutocomplete = ({ label, value, onChange, icon: Icon }) => {
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const wrapperRef = useRef(null);

    const locationData = useMemo(() => processLocations(mockLocationsData), []);

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

        if (userInput.length > 1) {
            const filtered = locationData
                .filter(item => item.searchString.includes(lowerInput))
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
                    onFocus={() => value.length > 1 && setShowSuggestions(true)}
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
                {showSuggestions && value.length > 1 && suggestions.length === 0 && (
                     <div className="absolute z-50 w-full mt-2 bg-white rounded-xl shadow-xl border border-gray-100 p-4 text-center text-gray-400 text-sm">
                        Nessuna città trovata
                     </div>
                )}
            </div>
        </div>
    );
};

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
                // MODIFICATO: Colori Arancioni -> Colori HOGU (Verde/Teal)
                ? `bg-[#F0FDF9] border-[#68B49B]/30 text-[#33594C] shadow-sm` 
                : 'bg-gray-50 border-gray-100 text-gray-500 hover:bg-gray-100'}
        `}
    >
        {/* MODIFICATO: Icona colorata HOGU */}
        <Icon size={20} className={active ? `text-[#68B49B]` : 'text-gray-400'} />
        <span className="text-sm font-bold">{label}</span>
        {/* MODIFICATO: Check verde */}
        {active && <Check size={16} className="ml-auto text-[#68B49B]" />}
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

// --- COMPONENTE MENU ITEM (PIATTO SINGOLO) ---
const MenuItemEditor = ({ item, onUpdate, onDelete }) => (
    <div className="flex items-start gap-3 p-3 bg-white rounded-xl border border-gray-100 hover:border-[#68B49B]/50 transition-colors group">
        <div className="mt-2 text-gray-300 cursor-move hover:text-gray-500">
            <GripVertical size={16} />
        </div>
        <div className="flex-1 space-y-2">
            <div className="flex gap-3">
                <input 
                    type="text" 
                    value={item.name}
                    onChange={(e) => onUpdate(item.id, 'name', e.target.value)}
                    className="font-bold text-gray-900 bg-transparent focus:outline-none w-full border-b border-transparent focus:border-gray-200 placeholder:text-gray-300"
                    placeholder="Nome Piatto (es. Carbonara)"
                />
                <div className="relative w-24 shrink-0">
                    <input 
                        type="number" 
                        value={item.price}
                        onChange={(e) => onUpdate(item.id, 'price', parseFloat(e.target.value))}
                        className="w-full text-right font-bold text-[#68B49B] bg-transparent focus:outline-none border-b border-transparent focus:border-gray-200"
                        placeholder="0.00"
                    />
                    <span className="absolute right-full mr-1 top-0 text-gray-400 text-sm">€</span>
                </div>
            </div>
            <input 
                type="text" 
                value={item.description}
                onChange={(e) => onUpdate(item.id, 'description', e.target.value)}
                className="text-sm text-gray-500 bg-transparent focus:outline-none w-full placeholder:text-gray-300"
                placeholder="Descrizione ingredienti..."
            />
        </div>
        <button 
            onClick={() => onDelete(item.id)}
            className="mt-1 text-gray-300 hover:text-red-500 p-1 rounded-md hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
        >
            <X size={16} />
        </button>
    </div>
);

// --- COMPONENTE SEZIONE MENU (CATEGORIA) ---
const MenuSectionEditor = ({ section, onUpdateSection, onDeleteSection }) => {
    
    const updateItem = (itemId, field, value) => {
        const newItems = section.items.map(i => i.id === itemId ? { ...i, [field]: value } : i);
        onUpdateSection(section.id, 'items', newItems);
    };

    const deleteItem = (itemId) => {
        const newItems = section.items.filter(i => i.id !== itemId);
        onUpdateSection(section.id, 'items', newItems);
    };

    const addItem = () => {
        const newId = Math.max(...section.items.map(i => i.id), 0) + 1;
        const newItems = [...section.items, { id: newId, name: '', price: '', description: '' }];
        onUpdateSection(section.id, 'items', newItems);
    };

    return (
        <div className="bg-gray-50 rounded-2xl p-5 border border-gray-200">
            <div className="flex justify-between items-center mb-4">
                <input 
                    type="text" 
                    value={section.category}
                    onChange={(e) => onUpdateSection(section.id, 'category', e.target.value)}
                    className="text-lg font-bold text-gray-900 bg-transparent focus:outline-none border-b-2 border-transparent focus:border-[#68B49B] placeholder:text-gray-400"
                    placeholder="Nome Categoria (es. Primi)"
                />
                <button onClick={() => onDeleteSection(section.id)} className="text-gray-400 hover:text-red-500 transition-colors">
                    <Trash2 size={18} />
                </button>
            </div>
            
            <div className="space-y-2 mb-4">
                {section.items.map(item => (
                    <MenuItemEditor key={item.id} item={item} onUpdate={updateItem} onDelete={deleteItem} />
                ))}
            </div>

            <button 
                onClick={addItem}
                className="w-full py-2 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 text-sm font-bold hover:border-[#68B49B] hover:text-[#68B49B] hover:bg-white transition-all flex items-center justify-center gap-2"
            >
                <Plus size={16} /> Aggiungi Piatto
            </button>
        </div>
    );
};

// --- COMPONENTE PRINCIPALE: RESTAURANT EDIT ---

export const RestaurantServiceEditPageBase = () => {
    // --- STATE ---
    const [isLoading, setIsLoading] = useState(false);
    
    const [formData, setFormData] = useState({
        title: 'Ristorante Stellato Roma',
        description: "Un'esperienza culinaria unica nel cuore di Roma. La nostra cucina unisce tradizione e innovazione, utilizzando solo ingredienti di stagione selezionati dai migliori produttori locali.",
        city: "Roma, Roma, Lazio", 
        address: "Piazza Navona, 1", 
        isActive: true,
        avgPrice: 45,
        cuisineType: "Italiana Gourmet",
        features: ['wifi', 'wine', 'accessible', 'outdoor'],
        
        // MENU STRUTTURATO
        menu: [
            {
                id: 1,
                category: "Primi Piatti",
                items: [
                    { id: 101, name: "Carbonara", description: "Guanciale croccante, pecorino romano DOP, uova bio", price: 18 },
                    { id: 102, name: "Cacio e Pepe", description: "Pecorino romano buccia nera, pepe tellicherry", price: 16 }
                ]
            },
            {
                id: 2,
                category: "Secondi",
                items: [
                    { id: 201, name: "Filetto di Manzo", description: "Frollatura 30 giorni, riduzione al vino rosso", price: 28 }
                ]
            }
        ]
    });

    const [images, setImages] = useState([
        'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80', 
        'https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=800&q=80',  
        'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=800&q=80'
    ]);

    // --- HANDLERS ---
    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const toggleFeature = (id) => {
        setFormData(prev => {
            const exists = prev.features.includes(id);
            return {
                ...prev,
                features: exists 
                    ? prev.features.filter(f => f !== id) 
                    : [...prev.features, id]
            };
        });
    };

    // MENU HANDLERS
    const updateMenuSection = (sectionId, field, value) => {
        setFormData(prev => ({
            ...prev,
            menu: prev.menu.map(s => s.id === sectionId ? { ...s, [field]: value } : s)
        }));
    };

    const deleteMenuSection = (sectionId) => {
        setFormData(prev => ({
            ...prev,
            menu: prev.menu.filter(s => s.id !== sectionId)
        }));
    };

    const addMenuSection = () => {
        const newId = Math.max(...formData.menu.map(s => s.id), 0) + 1;
        setFormData(prev => ({
            ...prev,
            menu: [...prev.menu, { id: newId, category: '', items: [] }]
        }));
    };

    const handleSave = () => {
        setIsLoading(true);
        console.log("Saving Restaurant Data:", formData); 
        setTimeout(() => {
            setIsLoading(false);
            alert("Ristorante aggiornato con successo!");
        }, 1000);
    };

    const removeImage = (indexToRemove) => {
        setImages(images.filter((_, index) => index !== indexToRemove));
    };

    return (
        <div className={`min-h-screen bg-[#F8FAFC] pb-20 ${HOGU_THEME.fontFamily}`}>
            
            {/* --- HERO SECTION (NUOVA STRUTTURA) --- */}
            <div className="bg-white pt-12 pb-24 px-4 lg:px-8 relative overflow-hidden">
                {/* Sfumature nere/grigie */}
                <div className="absolute top-0 left-0 w-96 h-96 bg-black/5 rounded-full blur-3xl -translate-y-1/2 -translate-x-1/3"></div>
                <div className="absolute top-0 right-0 w-96 h-96 bg-black/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
                
                <div className="max-w-7xl mx-auto relative z-10">
                    <Breadcrumbs items={breadcrumbsItems} />
                    
                    {/* Status Tag Nero */}
                    <span className={`text-gray-900 mt-6 font-bold tracking-wider text-xs uppercase mb-3 block flex items-center gap-2`}>
                        {/* MODIFICATO: Linea separatrice grigia scura invece che verde */}
                        <div className="w-8 h-[1px] bg-gray-900"></div> Servizio Ristorante
                    </span>
                    
                    <h1 className={`text-3xl md:text-5xl font-extrabold text-[${HOGU_COLORS.dark}] mb-2 tracking-tight leading-tight`}>
                        Modifica Ristorante
                    </h1>
                    <p className={`text-lg text-[${HOGU_COLORS.subtleText}] max-w-xl leading-relaxed`}>
                        Gestisci il profilo, il menu digitale e le impostazioni del tuo locale.
                    </p>
                </div>
            </div>

            {/* --- CONTENUTO PRINCIPALE (CON MARGINE NEGATIVO PER SOVRAPPOSIZIONE) --- */}
            <div className="max-w-7xl mx-auto px-4 lg:px-8 -mt-16 relative z-20">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-10">

                    {/* --- COLONNA SINISTRA (CONTENT) --- */}
                    <div className="lg:col-span-2 space-y-8">
                        
                        {/* SEZIONE 1: INFO BASE */}
                        <section className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100">
                            <div className="mb-6">
                                <EditableInput 
                                    label="Nome Ristorante" 
                                    value={formData.title} 
                                    onChange={(val) => handleInputChange('title', val)}
                                    large={true}
                                    className="mb-4"
                                />
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                    {/* Città con Autocomplete */}
                                    <CityAutocomplete 
                                        label="Città"
                                        value={formData.city} 
                                        onChange={(val) => handleInputChange('city', val)}
                                        icon={MapPin}
                                    />
                                    {/* Indirizzo (Via/Civico) */}
                                    <EditableInput 
                                        label="Indirizzo (Via e Civico)" 
                                        value={formData.address} 
                                        onChange={(val) => handleInputChange('address', val)}
                                        icon={Navigation}
                                        placeholder="es. Piazza Navona, 1"
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <EditableInput 
                                        label="Tipo Cucina" 
                                        value={formData.cuisineType} 
                                        onChange={(val) => handleInputChange('cuisineType', val)}
                                        icon={ChefHat}
                                        placeholder="es. Pesce, Romana, Sushi..."
                                    />
                                </div>
                            </div>
                            <EditableTextarea 
                                label="Descrizione & Storia" 
                                value={formData.description}
                                onChange={(val) => handleInputChange('description', val)}
                                rows={4}
                            />
                        </section>

                        {/* SEZIONE 2: MENU DIGITALE */}
                        <section className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100">
                            <div className="flex justify-between items-end mb-6">
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                        {/* MODIFICATO: Icona Arancione -> Primary */}
                                        <Utensils size={24} className={`text-[${HOGU_COLORS.primary}]`} />
                                        Menu Digitale
                                    </h3>
                                    <p className="text-sm text-gray-500 mt-1">Organizza i piatti per categorie.</p>
                                </div>
                                <button 
                                    onClick={addMenuSection}
                                    className="text-sm font-bold text-[#68B49B] hover:underline flex items-center gap-1"
                                >
                                    <Plus size={16} /> Nuova Categoria
                                </button>
                            </div>

                            <div className="space-y-6">
                                {formData.menu.map(section => (
                                    <MenuSectionEditor 
                                        key={section.id} 
                                        section={section} 
                                        onUpdateSection={updateMenuSection} 
                                        onDeleteSection={deleteMenuSection} 
                                    />
                                ))}
                            </div>
                        </section>

                        {/* SEZIONE 4: FOTO */}
                        <section className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold text-gray-900">Foto Piatti & Locale</h3>
                                <button className={`text-[${HOGU_COLORS.primary}] font-bold text-sm flex items-center gap-2 hover:underline`}>
                                    <Upload size={18} /> Carica
                                </button>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {images.map((img, idx) => (
                                    <ImageUploadCard key={idx} src={img} isMain={idx === 0} onDelete={() => removeImage(idx)} />
                                ))}
                                <div className="aspect-[4/3] rounded-2xl border-2 border-dashed border-gray-200 hover:border-[#68B49B] bg-gray-50 flex flex-col items-center justify-center text-gray-400 hover:text-[#68B49B] cursor-pointer transition-all group">
                                    <Plus size={24} className="group-hover:scale-110 transition-transform" />
                                </div>
                            </div>
                        </section>
                    </div>

                    {/* --- COLONNA DESTRA (STICKY ACTIONS) --- */}
                    <div className="lg:col-span-1">
                        <div className="sticky top-24 space-y-6">
                            
                            {/* --- NUOVA SEZIONE INFORMAZIONI SERVIZIO (ACCORDION) --- */}
                            <div className={`${HOGU_THEME.cardBase} p-6 shadow-[0_8px_30px_rgb(0,0,0,0.08)]`}>
                                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <Info size={18} className={`text-[${HOGU_COLORS.primary}]`} />
                                    Info Servizio
                                </h3>
                                
                                <div className="space-y-1">
                                    <InfoAccordionItem 
                                        icon={Clock} // Usiamo Clock come riferimento per Orari
                                        colorClass="bg-blue-50 text-blue-600"
                                        title="Orari & Disponibilità"
                                        description="Assicurati di aggiornare regolarmente gli orari di apertura e chiusura. Il sistema blocca automaticamente le prenotazioni fuori dagli orari indicati."
                                    />
                                    <InfoAccordionItem 
                                        icon={CalendarCheck} // Usiamo CalendarCheck per Prenotazioni
                                        colorClass="bg-emerald-50 text-emerald-600"
                                        title="Gestione Prenotazioni"
                                        description="Tutte le prenotazioni di tavoli e posti vengono notificate in tempo reale. Le modifiche al menu sono immediatamente visibili online."
                                    />
                                    <InfoAccordionItem 
                                        icon={CreditCard} // Usiamo CreditCard per Pagamenti
                                        colorClass="bg-purple-50 text-purple-600"
                                        title="Pagamenti & Commissioni"
                                        description="La prenotazione è gratuita per il cliente. Una commissione è applicata solo sui servizi extra o sulle prenotazioni con deposito richiesto."
                                    />
                                </div>
                            </div>
                            
                            {/* MAIN ACTION CARD - Modificata per matchare stile NCC (Slate) */}
                            <div className={`${HOGU_THEME.cardBase} p-6 overflow-hidden relative shadow-[0_8px_30px_rgb(0,0,0,0.08)]`}>
                                {/* MODIFICATO: Gradiente Slate invece di Arancio */}
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-slate-700 to-slate-900"></div>
                                
                                <h3 className="text-lg font-bold text-gray-900 mb-4">Impostazioni Vendita</h3>

                                {/* Prezzo Medio */}
                                <div className="mb-6">
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Scontrino Medio (€)</label>
                                    <div className="relative">
                                        {/* MODIFICATO: Icona Slate/Primary */}
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 bg-[#F0FDF9] p-1.5 rounded-lg text-[#33594C]">
                                            <Euro size={16} />
                                        </div>
                                        <input 
                                            type="number"
                                            value={formData.avgPrice}
                                            onChange={(e) => handleInputChange('avgPrice', parseInt(e.target.value))}
                                            // MODIFICATO: Focus ring color
                                            className="w-full pl-12 pr-4 py-3 bg-gray-50 border-2 border-transparent rounded-xl font-bold text-gray-700 outline-none focus:bg-white focus:border-[#68B49B] transition-all"
                                        />
                                    </div>
                                </div>

                                {/* Visibility Toggle */}
                                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg ${formData.isActive ? 'bg-green-100 text-green-600' : 'bg-gray-200 text-gray-500'}`}>
                                            {formData.isActive ? <Eye size={20} /> : <EyeOff size={20} />}
                                        </div>
                                        <div>
                                            <p className="font-bold text-sm text-gray-900">Prenotazioni</p>
                                            <p className="text-xs text-gray-500">{formData.isActive ? 'Aperte' : 'Chiuse'}</p>
                                        </div>
                                    </div>
                                    <div className="relative inline-block w-12 mr-2 align-middle select-none">
                                        <input 
                                            type="checkbox" 
                                            id="toggle-rest" 
                                            checked={formData.isActive}
                                            onChange={(e) => handleInputChange('isActive', e.target.checked)}
                                            className="absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer checked:right-0 right-6 transition-all duration-300"
                                        />
                                        <label htmlFor="toggle-rest" className={`block overflow-hidden h-6 rounded-full cursor-pointer transition-colors duration-200 ${formData.isActive ? 'bg-green-500' : 'bg-gray-300'}`}></label>
                                    </div>
                                </div>

                                {/* MODIFICATO: Bottone Stile Slate (Come NCC) */}
                                <button 
                                    onClick={handleSave}
                                    disabled={isLoading}
                                    className={`
                                        w-full py-4 rounded-xl font-bold text-lg text-white shadow-xl shadow-slate-500/20 flex items-center justify-center gap-2 transition-all
                                        ${isLoading ? 'bg-gray-400 cursor-not-allowed' : `bg-slate-800 hover:bg-slate-700 hover:scale-[1.02]`}
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
        </div>
    );
};

export const RestaurantServiceEditPage = withAuthProtection(RestaurantServiceEditPageBase, ['PROVIDER'], "RESTAURANT");

export default RestaurantServiceEditPage;
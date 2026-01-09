import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { 
    MapPin, Info, Car, Briefcase, Users,
    Save, Upload, Trash2, Plus, Euro, Eye, EyeOff, Navigation,
    CalendarCheck, CreditCard, FileText, ChevronDown
} from 'lucide-react';

import { HOGU_COLORS, HOGU_THEME } from '../../../../config/theme.js';
import { withAuthProtection } from './../../auth/withAuthProtection.jsx'; 
import { Breadcrumbs } from '../../../../components/ui/Breadcrumbs.jsx'; 

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

// --- BREADCRUMBS CONFIGURATION ---
const breadcrumbsItems = [
    { labelKey: 'ncc_edit.nav.dashboard', href: '#' },
    { labelKey: 'ncc_edit.nav.fleet', href: '#' },
    { labelKey: 'ncc_edit.nav.edit_profile', href: '#' }
];

// --- COMPONENTE INFO ACCORDION ITEM (SOTTO-SEZIONE ESPANDIBILE) ---
const InfoAccordionItem = ({ icon: Icon, title, description, colorClass }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="border-b border-gray-50 last:border-0">
            <button 
                onClick={() => setIsOpen(!isOpen)} 
                className="w-full flex items-center justify-between py-3 hover:bg-gray-50 transition-colors rounded-lg px-2 -mx-2 group"
            >
                <div className="flex items-center gap-3">
                    <div className={`p-1.5 rounded-lg shrink-0 transition-colors ${colorClass}`}>
                        <Icon size={16} />
                    </div>
                    <span className="font-bold text-sm text-gray-900 group-hover:text-gray-700">{title}</span>
                </div>
                <ChevronDown 
                    size={16} 
                    className={`text-gray-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} 
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

// --- COMPONENTE AUTOCOMPLETE CITTA' ---
const CityAutocomplete = ({ label, value, onChange, icon: Icon }) => {
    const { i18n, t } = useTranslation();
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const wrapperRef = useRef(null);

    const locationData = useMemo(() => {
        const isItalian = i18n.language && i18n.language.startsWith('it');
        const rawData = isItalian ? italianLocationsData : (englishLocationsData || italianLocationsData);
        return rawData ? processLocations(rawData) : [];
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

        if (userInput.length > 2 && locationData.length > 0) {
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
                    placeholder={t('ncc_edit.profile.city_placeholder', "Cerca città...")}
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

const ImageUploadCard = ({ src, onDelete, isMain = false }) => {
    const { t } = useTranslation("home");
    return (
    <div className={`relative rounded-2xl overflow-hidden group ${isMain ? 'col-span-2 row-span-2 aspect-video' : 'aspect-[4/3]'}`}>
        <img src={src} alt={t('ncc_edit.image_alt')} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <button onClick={onDelete} className="p-2 bg-white rounded-full text-red-500 hover:bg-red-50 transition-colors shadow-lg">
                <Trash2 size={20} />
            </button>
            {isMain && <span className="absolute bottom-4 left-4 bg-[#68B49B] text-white text-xs px-2 py-1 rounded-md font-bold">{t('ncc_edit.image_cover_label')}</span>}
        </div>
    </div>
)};

const VehicleEditorCard = ({ vehicle, onChange, onDelete, canDelete }) => {
    const { t } = useTranslation("home");
    return (
    <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm relative group hover:border-[#68B49B] transition-all">
        <div className="flex justify-between items-start mb-4 border-b border-gray-100 pb-3">
            <div className="flex items-center gap-3">
                <div className="bg-slate-100 p-2 rounded-xl text-slate-700">
                    <Car size={24} />
                </div>
                <div>
                    <input 
                        type="text" 
                        value={vehicle.name}
                        onChange={(e) => onChange(vehicle.id, 'name', e.target.value)}
                        className="font-bold text-gray-900 bg-transparent focus:outline-none border-b border-transparent focus:border-[#68B49B] w-40 sm:w-auto"
                        placeholder={t('ncc_edit.vehicle.category_name_placeholder')}
                    />
                    <input 
                        type="text" 
                        value={vehicle.model}
                        onChange={(e) => onChange(vehicle.id, 'model', e.target.value)}
                        className="text-xs text-gray-500 bg-transparent focus:outline-none block mt-0.5 w-full"
                        placeholder={t('ncc_edit.vehicle.model_placeholder')}
                    />
                </div>
            </div>
            {canDelete && (
                <button onClick={() => onDelete(vehicle.id)} className="text-gray-300 hover:text-red-500 transition-colors">
                    <Trash2 size={18} />
                </button>
            )}
        </div>
        <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-gray-50 p-2 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2 text-gray-500"><Users size={16} /> <span className="text-xs font-bold">{t('ncc_edit.vehicle.pax_label')}</span></div>
                <input 
                    type="number" 
                    value={vehicle.pax}
                    onChange={(e) => onChange(vehicle.id, 'pax', parseInt(e.target.value))}
                    className="w-10 text-center bg-transparent font-bold text-gray-900 focus:outline-none"
                />
            </div>
            <div className="bg-gray-50 p-2 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2 text-gray-500"><Briefcase size={16} /> <span className="text-xs font-bold">{t('ncc_edit.vehicle.luggage_label')}</span></div>
                <input 
                    type="number" 
                    value={vehicle.luggage}
                    onChange={(e) => onChange(vehicle.id, 'luggage', parseInt(e.target.value))}
                    className="w-10 text-center bg-transparent font-bold text-gray-900 focus:outline-none"
                />
            </div>
        </div>
        <div className="bg-[#F0FDF9] p-3 rounded-xl border border-[#68B49B]/30">
            <label className="text-[10px] font-bold text-[#33594C] uppercase mb-1 block">{t('ncc_edit.vehicle.rate_label')}</label>
            <div className="flex items-center gap-2">
                <Euro size={16} className="text-[#68B49B]" />
                <input 
                    type="number" step="0.10" value={vehicle.pricePerKm}
                    onChange={(e) => onChange(vehicle.id, 'pricePerKm', parseFloat(e.target.value))}
                    className="w-full bg-transparent font-bold text-lg text-[#33594C] focus:outline-none"
                />
            </div>
        </div>
    </div>
)};

// --- COMPONENTE PRINCIPALE: NCC EDIT ---

export const NCCServiceEditPageBase = () => {
    const { t } = useTranslation("home");
    const [isLoading, setIsLoading] = useState(false);
    
    const [formData, setFormData] = useState({
        providerName: "Elite Drivers Milano",
        description: "Siamo un punto di riferimento per la mobilità di lusso...",
        baseLocation: "Milano, Milano, Lombardia",
        address: "Via Montenapoleone, 12",
        isActive: true,
        features: ['wifi', 'water', 'english', 'suit'],
        fleet: [
            { id: 1, name: 'Business Sedan', model: 'Mercedes E-Class', pax: 3, luggage: 2, pricePerKm: 2.50 }
        ]
    });

    const [images, setImages] = useState([
        "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1617788138017-80ad40651399?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?auto=format&fit=crop&w=800&q=80"
    ]);

    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const updateVehicle = (id, field, value) => {
        setFormData(prev => ({ ...prev, fleet: prev.fleet.map(v => v.id === id ? { ...v, [field]: value } : v) }));
    };
    
    const deleteVehicle = (id) => {
        if (formData.fleet.length <= 1) return alert(t('ncc_edit.vehicle.min_one_vehicle_error')); 
        setFormData(prev => ({ ...prev, fleet: prev.fleet.filter(v => v.id !== id) }));
    };

    const addVehicle = () => {
        const newId = Math.max(...formData.fleet.map(v => v.id), 0) + 1;
        setFormData(prev => ({ ...prev, fleet: [...prev.fleet, { id: newId, name: t('ncc_edit.vehicle.default_category_name'), model: '', pax: 4, luggage: 2, pricePerKm: 2.00 }] }));
    };
    
    const removeImage = (indexToRemove) => setImages(images.filter((_, index) => index !== indexToRemove));

    const handleSave = () => {
        setIsLoading(true);
        console.log("Saving Data:", formData);
        setTimeout(() => {
            setIsLoading(false);
            alert(t('ncc_edit.save_success_message'));
        }, 1000);
    };

    return (
        <div className={`min-h-screen bg-[#F8FAFC] pb-20 ${HOGU_THEME.fontFamily}`}>
            
            {/* --- HEADER --- */}
            <div className="bg-white pt-12 pb-24 px-4 lg:px-8 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-96 h-96 bg-black/5 rounded-full blur-3xl -translate-y-1/2 -translate-x-1/3"></div>
                <div className="absolute top-0 right-0 w-96 h-96 bg-black/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
                
                <div className="max-w-7xl mx-auto relative z-10">
                    <Breadcrumbs items={breadcrumbsItems.map(item => ({...item, label: t(item.labelKey) || item.labelKey}))} />
                    
                    <span className={`text-gray-900 mt-6 font-bold tracking-wider text-xs uppercase mb-3 block flex items-center gap-2`}>
                        <div className="w-8 h-[1px] bg-gray-900"></div> {t('ncc_edit.status_tag', 'Status Profilo')}
                    </span>
                    
                    <h1 className={`text-3xl md:text-5xl font-extrabold text-[${HOGU_COLORS.dark}] mb-2 tracking-tight leading-tight`}>
                        {t('ncc_edit.nav.edit_profile', 'Modifica Profilo')}
                    </h1>
                    <p className={`text-lg text-[${HOGU_COLORS.subtleText}] max-w-xl leading-relaxed`}>
                         {t('ncc_edit.fleet.description', 'Gestisci le informazioni della tua flotta, i servizi e la disponibilità.')}
                    </p>
                </div>
            </div>

            {/* --- CONTENT --- */}
            <div className="max-w-7xl mx-auto px-4 lg:px-8 -mt-16 relative z-20">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-10">

                    {/* --- COLONNA SINISTRA --- */}
                    <div className="lg:col-span-2 space-y-8">
                        
                        {/* SEZIONE 1: PROFILO */}
                        <section className="bg-white rounded-[2rem] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100/50">
                            <div className="mb-6">
                                <EditableInput 
                                    label={t('ncc_edit.profile.company_name_label')}
                                    value={formData.providerName} 
                                    onChange={(val) => handleInputChange('providerName', val)}
                                    large={true}
                                    className="mb-6"
                                />
                                
                                <CityAutocomplete 
                                    label={t('ncc_edit.profile.base_location_label')}
                                    value={formData.baseLocation} 
                                    onChange={(val) => handleInputChange('baseLocation', val)}
                                    icon={MapPin}
                                />

                                <EditableInput 
                                    label={t('ncc_edit.profile.address_label', 'Indirizzo Completo')}
                                    value={formData.address} 
                                    onChange={(val) => handleInputChange('address', val)}
                                    placeholder={t('ncc_edit.profile.address_placeholder', 'Es. Via Roma, 10')}
                                    icon={Navigation}
                                    className="mt-4"
                                />

                            </div>
                            <EditableTextarea 
                                label={t('ncc_edit.profile.description_label')}
                                value={formData.description}
                                onChange={(val) => handleInputChange('description', val)}
                                rows={4}
                            />
                        </section>

                        {/* SEZIONE 2: FLOTTA */}
                        <section className="bg-gray-50 rounded-[2rem] p-8 shadow-inner border border-gray-200">
                            <div className="flex justify-between items-end mb-6">
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                        <Car size={24} className={`text-[${HOGU_COLORS.primary}]`} />
                                        {t('ncc_edit.fleet.title', 'Dettagli Veicolo')}
                                    </h3>
                                    <p className="text-sm text-gray-500 mt-1">{t('ncc_edit.fleet.description')}</p>
                                </div>
                            </div>

                            <div className="flex flex-col gap-4">
                                {formData.fleet.map((vehicle) => (
                                    <VehicleEditorCard 
                                        key={vehicle.id}
                                        vehicle={vehicle}
                                        onChange={updateVehicle}
                                        onDelete={deleteVehicle}
                                        canDelete={formData.fleet.length > 1}
                                    />
                                ))}
                            </div>
                        </section>

                        {/* SEZIONE 4: FOTO */}
                        <section className="bg-white rounded-[2rem] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100/50">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold text-gray-900">{t('ncc_edit.photos.title')}</h3>
                                <button className={`text-[${HOGU_COLORS.primary}] font-bold text-sm flex items-center gap-2 hover:underline`}>
                                    <Upload size={18} /> {t('ncc_edit.photos.upload_button')}
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

                    {/* --- COLONNA DESTRA --- */}
                    <div className="lg:col-span-1">
                        <div className="sticky top-24 space-y-6">
                            
                            {/* --- NUOVA SEZIONE INFORMAZIONI SERVIZIO (ACCORDION) --- */}
                            <div className={`${HOGU_THEME.cardBase} p-6 shadow-[0_8px_30px_rgb(0,0,0,0.08)]`}>
                                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <Info size={18} className={`text-[${HOGU_COLORS.primary}]`} />
                                    {t('ncc_edit.info_service.title', 'Info Servizio')}
                                </h3>
                                
                                <div className="space-y-1">
                                    <InfoAccordionItem 
                                        icon={CalendarCheck}
                                        colorClass="bg-blue-50 text-blue-600"
                                        title={t('ncc_edit.info_service.bookings_label', 'Prenotazioni')}
                                        description={t('ncc_edit.info_service.bookings_desc', 'Richieste dirette con preavviso minimo 24h. Le conferme sono soggette alla disponibilità attuale.')}
                                    />
                                    <InfoAccordionItem 
                                        icon={CreditCard}
                                        colorClass="bg-emerald-50 text-emerald-600"
                                        title={t('ncc_edit.info_service.payments_label', 'Pagamenti')}
                                        description={t('ncc_edit.info_service.payments_desc', 'Accredito automatico settimanale (ogni Lunedì) sul conto bancario collegato al tuo profilo partner.')}
                                    />
                                    <InfoAccordionItem 
                                        icon={FileText}
                                        colorClass="bg-purple-50 text-purple-600"
                                        title={t('ncc_edit.info_service.policy_label', 'Commissioni')}
                                        description={t('ncc_edit.info_service.policy_desc', 'Service fee standard del 15% applicata su ogni corsa completata. Nessun costo fisso mensile.')}
                                    />
                                </div>
                            </div>

                            {/* --- CARD STATUS E SALVATAGGIO --- */}
                            <div className={`${HOGU_THEME.cardBase} p-6 overflow-hidden relative shadow-[0_8px_30px_rgb(0,0,0,0.08)]`}>
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-slate-700 to-slate-900"></div>
                                <h3 className="text-lg font-bold text-gray-900 mb-4">{t('ncc_edit.status.title')}</h3>
                                <div className="bg-gray-50 rounded-xl p-4 mb-6 border border-gray-100">
                                    <div className="flex justify-between mb-2">
                                        <span className="text-xs text-gray-500 font-bold uppercase">{t('ncc_edit.status.min_rate_label')}</span>
                                        <span className="font-bold text-gray-900">{t('ncc_edit.status.min_rate_value')}</span>
                                    </div>
                                </div>
                                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg ${formData.isActive ? 'bg-green-100 text-green-600' : 'bg-gray-200 text-gray-500'}`}>
                                            {formData.isActive ? <Eye size={20} /> : <EyeOff size={20} />}
                                        </div>
                                        <div>
                                            <p className="font-bold text-sm text-gray-900">{t('ncc_edit.status.availability_label')}</p>
                                            <p className="text-xs text-gray-500">{formData.isActive ? t('ncc_edit.status.status_available') : t('ncc_edit.status.status_unavailable')}</p>
                                        </div>
                                    </div>
                                    <div className="relative inline-block w-12 mr-2 align-middle select-none">
                                        <input 
                                            type="checkbox" 
                                            checked={formData.isActive}
                                            onChange={(e) => handleInputChange('isActive', e.target.checked)}
                                            className="absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer checked:right-0 right-6 transition-all duration-300"
                                        />
                                        <label className={`block overflow-hidden h-6 rounded-full cursor-pointer transition-colors duration-200 ${formData.isActive ? 'bg-green-500' : 'bg-gray-300'}`}></label>
                                    </div>
                                </div>
                                <button 
                                    onClick={handleSave}
                                    disabled={isLoading}
                                    className={`w-full py-4 rounded-xl font-bold text-lg text-white shadow-xl shadow-slate-500/20 flex items-center justify-center gap-2 transition-all ${isLoading ? 'bg-gray-400 cursor-not-allowed' : `bg-slate-800 hover:bg-slate-700 hover:scale-[1.02]`}`}
                                >
                                    {isLoading ? t('ncc_edit.status.saving_button') : <><Save size={20} /> {t('ncc_edit.status.save_button')}</>}
                                </button>
                            </div>
                             <div className="bg-slate-50 rounded-[2rem] p-6 border border-slate-200">
                                <h4 className="font-bold text-slate-800 mb-2 flex items-center gap-2"><Navigation size={18} /> {t('ncc_edit.help.title')}</h4>
                                <p className="text-sm text-slate-600 leading-relaxed">{t('ncc_edit.help.description')}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export const NCCServiceEditPage = withAuthProtection(NCCServiceEditPageBase, ['PROVIDER'], "NCC");

export default NCCServiceEditPage;
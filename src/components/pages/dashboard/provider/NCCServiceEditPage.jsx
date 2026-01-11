import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
    MapPin, Info, Car, Briefcase, Users,
    Save, Upload, Trash2, Plus, Euro, Eye, EyeOff, Navigation,
    CalendarCheck, CreditCard, FileText, ChevronDown
} from 'lucide-react';
import CurrencyInput from 'react-currency-input-field';

import { HOGU_COLORS, HOGU_THEME } from '../../../../config/theme.js';
import { withAuthProtection } from './../../auth/withAuthProtection.jsx'; 
import { Breadcrumbs } from '../../../../components/ui/Breadcrumbs.jsx'; 
import { nccService } from '../../../../api/apiClient.js';
import SuccessModal from '../../../ui/SuccessModal.jsx';
import ErrorModal from '../../../ui/ErrorModal.jsx';
import LoadingScreen from '../../../ui/LoadingScreen.jsx';

import italianLocationsData from '../../../../assets/data/italian_locations.json'; 
import englishLocationsData from '../../../../assets/data/english_locations.json'; 


// --- UTILITY PER GESTIRE I DATI GEOGRAFICI ---
const processLocations = (data) => {
    if (!data) return [];
    const flatLocations = [];
    data.forEach(region => {
        region.provinces.forEach(province => {
            province.cities.forEach(city => {
                flatLocations.push({
                    city: city,
                    province: province.name,
                    region: region.region,
                    fullLabel: `${city}, ${region.region}`,
                    searchString: `${city}, ${province.name}, ${region.region}`.toLowerCase()
                });
            });
        });
    });
    return flatLocations;
};

// --- BREADCRUMBS CONFIGURATION ---
const breadcrumbsItems = [
    { labelKey: 'ncc_edit.nav.dashboard', href: '/provider/dashboard' },
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
const CityAutocomplete = ({ label, value, onChange, icon: Icon, required = false }) => {
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
            {label && <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 ml-1">{label} {required && <span className="text-red-500">*</span>}</label>}
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
const EditableInput = ({ label, value, onChange, type = "text", className = "", large = false, placeholder = "", icon: Icon, required = false }) => (
    <div className={`group ${className}`}>
        {label && <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 ml-1">{label} {required && <span className="text-red-500">*</span>}</label>}
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

const EditableTextarea = ({ label, value, onChange, rows = 4, required = false }) => (
    <div className="group">
        {label && <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 ml-1">{label} {required && <span className="text-red-500">*</span>}</label>}
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
    
    const inputClasses = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-[#68B49B] focus:ring-1 focus:ring-[#68B49B] outline-none transition-all bg-gray-50 focus:bg-white text-gray-800 placeholder:text-gray-400";
    const labelClasses = "block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5";

    return (
    <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm relative group hover:border-[#68B49B] transition-all">
        {/* Header / Title */}
        <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
            <div className="flex items-center gap-3">
                <div className="bg-[#E6F4F1] p-2.5 rounded-xl text-[#33594C]">
                    <Car size={24} />
                </div>
                <span className="font-bold text-gray-900 text-lg">
                    {vehicle.name || t('ncc_edit.vehicle.default_title', 'Veicolo')}
                </span>
            </div>
            {canDelete && (
                <button 
                    onClick={() => onDelete(vehicle.id)} 
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
                    title={t('common.delete', 'Elimina')}
                >
                    <Trash2 size={20} />
                </button>
            )}
        </div>

        <div className="space-y-5">
            {/* Row 1: Type & Model */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className={labelClasses}>{t('ncc_edit.vehicle.category_name_placeholder', "Tipo (es. Van)")} <span className="text-red-500">*</span></label>
                    <input 
                        type="text" 
                        value={vehicle.name}
                        onChange={(e) => onChange(vehicle.id, 'name', e.target.value)}
                        className={inputClasses}
                        placeholder="Es. Mercedes V-Class"
                    />
                </div>
                <div>
                    <label className={labelClasses}>{t('ncc_edit.vehicle.model_placeholder', "Modello")} <span className="text-red-500">*</span></label>
                    <input 
                        type="text" 
                        value={vehicle.model}
                        onChange={(e) => onChange(vehicle.id, 'model', e.target.value)}
                        className={inputClasses}
                        placeholder="Es. Long Version"
                    />
                </div>
            </div>

            {/* Row 2: Plate */}
            <div>
                <label className={labelClasses}>Targa <span className="text-red-500">*</span></label>
                <input 
                    type="text" 
                    value={vehicle.plateNumber || ''}
                    onChange={(e) => onChange(vehicle.id, 'plateNumber', e.target.value)}
                    className={`${inputClasses} uppercase tracking-widest font-mono`}
                    placeholder="AA 000 AA"
                />
            </div>

            {/* Row 3: Capacity & Price */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Pax */}
                <div className="col-span-1">
                    <label className={labelClasses}>{t('ncc_edit.vehicle.pax_label', "Passeggeri")} <span className="text-red-500">*</span></label>
                    <div className="relative">
                        <Users size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input 
                            type="number" 
                            value={vehicle.pax}
                            onChange={(e) => onChange(vehicle.id, 'pax', parseInt(e.target.value))}
                            className={`${inputClasses} pl-9`}
                        />
                    </div>
                </div>
                
                {/* Luggage */}
                <div className="col-span-1">
                    <label className={labelClasses}>{t('ncc_edit.vehicle.luggage_label', "Bagagli")} <span className="text-red-500">*</span></label>
                    <div className="relative">
                        <Briefcase size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input 
                            type="number" 
                            value={vehicle.luggage}
                            onChange={(e) => onChange(vehicle.id, 'luggage', parseInt(e.target.value))}
                            className={`${inputClasses} pl-9`}
                        />
                    </div>
                </div>

                {/* Price */}
                 <div className="col-span-1">
                    <label className={`${labelClasses} text-[#33594C]`}>{t('ncc_edit.vehicle.rate_label', "Prezzo per Km")} <span className="text-red-500">*</span></label>
                    <div className="relative">
                         <CurrencyInput
                            id={`price-${vehicle.id}`}
                            name="pricePerKm"
                            placeholder="0,00"
                            value={vehicle.pricePerKm}
                            decimalsLimit={2}
                            decimalScale={2}
                            onValueChange={(value) => onChange(vehicle.id, 'pricePerKm', value ? parseFloat(value) : 0)}
                            className={`${inputClasses} font-bold text-[#33594C] bg-[#F0FDF9] border-[#68B49B]/30 focus:border-[#68B49B]`}
                            intlConfig={{ locale: 'it-IT', currency: 'EUR' }}
                        />
                    </div>
                </div>
            </div>
        </div>
    </div>
)};

// --- COMPONENTE PRINCIPALE: NCC EDIT ---

export const NCCServiceEditPageBase = () => {
    const { t, i18n } = useTranslation("home");
    const { id } = useParams();
    
    // --- STATO ---
    const [isLoading, setIsLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState(null);
    const [errorMessage, setErrorMessage] = useState(null);
    
    const [formData, setFormData] = useState({
        providerName: "",
        description: "",
        baseLocation: "",
        address: "",
        isActive: true,
        features: [],
        fleet: []
    });

    const [images, setImages] = useState([]);

    const fileInputRef = useRef(null);

    // --- INIT ---
    useEffect(() => {
        const loadData = async () => {
            if (!id) return;
            setIsLoading(true);
            try {
                const data = await nccService.getNccProvider(id);
                if (data) {
                    // Helper per formattare la città con supporto cross-language
                    const getFormattedCity = (locale) => {
                        if (!locale || !locale.city) return '';
                        
                        const isItalian = !i18n.language || i18n.language.startsWith('it');
                        const targetDataset = isItalian ? italianLocationsData : (englishLocationsData || italianLocationsData);
                        const otherDataset = isItalian ? (englishLocationsData || italianLocationsData) : italianLocationsData;

                        const normalizedCity = locale.city.toLowerCase().trim();
                        
                        // 1. Cerca nel dataset della lingua corrente
                        for (const region of targetDataset) {
                            for (const province of region.provinces) {
                                const foundCity = province.cities.find(c => c.toLowerCase() === normalizedCity);
                                if (foundCity) {
                                    return `${foundCity}, ${region.region}`;
                                }
                            }
                        }

                        // 2. Se non trovato, cerca nell'altro dataset e mappa
                        if (otherDataset) {
                            for (const region of otherDataset) {
                                for (const province of region.provinces) {
                                    // Cerca l'indice della città
                                    const cityIndex = province.cities.findIndex(c => c.toLowerCase() === normalizedCity);
                                    if (cityIndex !== -1) {
                                        // Trovata! Cerchiamo la provincia corrispondente nel dataset target
                                        const pId = province.provinceId;
                                        
                                        // Trova la regione/provincia target
                                        for (const tRegion of targetDataset) {
                                            const tProvince = tRegion.provinces.find(p => p.provinceId === pId);
                                            if (tProvince) {
                                                // Proviamo a prendere la città allo stesso indice
                                                // Assumiamo che gli array cities siano ordinati parallelamente
                                                const tCity = tProvince.cities[cityIndex] || locale.city;
                                                return `${tCity}, ${tRegion.region}`;
                                            }
                                        }
                                    }
                                }
                            }
                        }

                        // 3. Fallback
                        return locale.state ? `${locale.city}, ${locale.state}` : locale.city;
                    };
 
                    const localeString = getFormattedCity(data.locale);
  
                    setFormData({
                        providerName: data.name || "",
                        description: data.description || "",
                        baseLocation: localeString,
                        address: data.locale?.address || "",
                        isActive: data.publicationStatus !== false,
                        features: [], 
                        fleet: data.vehicle ? [{
                            id: data.vehicle.id,
                            name: data.vehicle.type || "Standard", 
                            model: data.vehicle.model || "",
                            plateNumber: data.vehicle.plateNumber || "",
                            pax: data.vehicle.numberOfSeats || 4,
                            luggage: 2, 
                            pricePerKm: data.basePrice || 0
                        }] : []
                    });
                    
                    const loadedImages = (data.images || []).map(filename => ({
                        url: `/files/ncc/${id}/${filename}`,
                        file: null
                    }));
                    setImages(loadedImages);
                }
            } catch (error) {
                console.error("Errore caricamento servizio:", error);
                setErrorMessage("Impossibile caricare i dati del servizio.");
            } finally {
                setIsLoading(false);
            }
        };
        loadData();
    }, [id, i18n.language]);

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
        const newId = formData.fleet.length > 0 ? Math.max(...formData.fleet.map(v => v.id)) + 1 : 1;
        setFormData(prev => ({ ...prev, fleet: [...prev.fleet, { id: newId, name: t('ncc_edit.vehicle.default_category_name'), model: '', plateNumber: '', pax: 4, luggage: 2, pricePerKm: 2.00 }] }));
    };
    
    const removeImage = (indexToRemove) => setImages(images.filter((_, index) => index !== indexToRemove));

    const handleImageUpload = (event) => {
        const files = event.target.files;
        if (files && files.length > 0) {
            Array.from(files).forEach(file => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    setImages(prev => [...prev, { url: reader.result, file: file }]);
                };
                reader.readAsDataURL(file);
            });
        }
        event.target.value = '';
    };

    const validate = () => {
        const errors = [];
        if (!formData.providerName.trim()) errors.push(t('ncc_edit.validation.company_name_required', "Il nome della compagnia è obbligatorio."));
        if (!formData.baseLocation.trim()) errors.push(t('ncc_edit.validation.city_required', "La città base è obbligatoria."));
        if (!formData.address.trim()) errors.push(t('ncc_edit.validation.address_required', "L'indirizzo è obbligatorio."));
        if (!formData.description.trim()) errors.push(t('ncc_edit.validation.description_required', "La descrizione è obbligatoria."));
        
        if (formData.fleet.length === 0) {
            errors.push(t('ncc_edit.validation.min_one_vehicle', "Devi inserire almeno un veicolo."));
        } else {
            formData.fleet.forEach((vehicle, index) => {
                if (!vehicle.name.trim()) errors.push(t('ncc_edit.validation.vehicle_type_required', "Veicolo {{number}}: Il tipo è obbligatorio.", { number: index + 1 }));
                if (!vehicle.model.trim()) errors.push(t('ncc_edit.validation.vehicle_model_required', "Veicolo {{number}}: Il modello è obbligatorio.", { number: index + 1 }));
                if (!vehicle.plateNumber || !vehicle.plateNumber.trim()) errors.push(t('ncc_edit.validation.vehicle_plate_required', "Veicolo {{number}}: La targa è obbligatoria.", { number: index + 1 }));
                if (!vehicle.pax || vehicle.pax < 1) errors.push(t('ncc_edit.validation.vehicle_pax_min', "Veicolo {{number}}: Passeggeri deve essere almeno 1.", { number: index + 1 }));
                if (!vehicle.pricePerKm || vehicle.pricePerKm <= 0) errors.push(t('ncc_edit.validation.vehicle_price_min', "Veicolo {{number}}: Il prezzo per Km deve essere maggiore di 0.", { number: index + 1 }));
            });
        }

        if (images.length < 6) {
            errors.push(t('ncc_edit.validation.min_images', "Devi caricare almeno 6 immagini (attuali: {{count}}).", { count: images.length }));
        }

        return errors;
    };

    const handleSave = async () => {
        const validationErrors = validate();
        if (validationErrors.length > 0) {
            setErrorMessage(validationErrors.join("\n"));
            return;
        }

        setIsLoading(true);
        try {
            const dataToSend = new FormData();
            
            // Parsing location
            const locationParts = formData.baseLocation.split(',').map(s => s.trim());
            const city = locationParts[0] || "";
            const state = locationParts[1] || "";

            // --- LOGIC FIND LOCATION (Like LuggageServiceEditPage.jsx) ---
            let locales = [];
            let foundProvinceId = null;
            let foundSourceLang = null;

            const findLocation = (dataset, cityName, regionName) => {
                if (!dataset) return null;
                for (const r of dataset) {
                    if (r.region && r.region.toLowerCase() === regionName.toLowerCase()) {
                        for (const p of r.provinces) {
                            if (p.cities && p.cities.some(c => c.toLowerCase() === cityName.toLowerCase())) {
                                return { region: r, province: p, city: cityName };
                            }
                        }
                    }
                }
                return null;
            };

            // 1. Prova a trovare nel DB Italiano
            let match = findLocation(italianLocationsData, city, state);
            if (match) {
                foundProvinceId = match.province.provinceId;
                foundSourceLang = 'it';
            } else {
                // 2. Prova Inglese
                match = findLocation(englishLocationsData, city, state);
                if (match) {
                    foundProvinceId = match.province.provinceId;
                    foundSourceLang = 'en';
                }
            }

            if (foundProvinceId) {
                // Lingua sorgente
                locales.push({
                    serviceType: "NCC",
                    language: foundSourceLang,
                    country: foundSourceLang === 'it' ? 'Italia' : 'Italy',
                    state: state,
                    city: city,
                    address: formData.address
                });

                // Lingua opposta
                const targetLang = foundSourceLang === 'it' ? 'en' : 'it';
                const targetDataset = foundSourceLang === 'it' ? englishLocationsData : italianLocationsData;
                
                let targetMatch = null;
                for (const r of targetDataset) {
                    for (const p of r.provinces) {
                        if (p.provinceId === foundProvinceId) {
                            targetMatch = {
                                region: r.region,
                                province: p.name,
                                city: city 
                            };
                            if (match.city.toLowerCase() === match.province.name.toLowerCase()) {
                                 targetMatch.city = p.name;
                            }
                            break;
                        }
                    }
                    if (targetMatch) break;
                }

                if (targetMatch) {
                    locales.push({
                        serviceType: "NCC",
                        language: targetLang,
                        country: targetLang === 'it' ? 'Italia' : 'Italy',
                        state: targetMatch.region,
                        city: targetMatch.city,
                        address: formData.address
                    });
                }
            } else {
                // Fallback standard
                const isEnglish = i18n.language && i18n.language.startsWith('en');
                const country = isEnglish ? 'Italy' : 'Italia';
                const lang = isEnglish ? 'en' : 'it';
                locales.push({
                    serviceType: "NCC",
                    language: lang,
                    country: country,
                    state: state,
                    city: city,
                    address: formData.address
                });
            }

            const payload = {
                name: formData.providerName,
                description: formData.description,
                basePrice: formData.fleet.length > 0 ? formData.fleet[0].pricePerKm : 0,
                publicationStatus: formData.isActive,
                locales: locales,
                vehicle: formData.fleet.length > 0 ? {
                    id: formData.fleet[0].id,
                    numberOfSeats: formData.fleet[0].pax,
                    plateNumber: formData.fleet[0].plateNumber,
                    model: formData.fleet[0].model,
                    type: formData.fleet[0].name
                } : null,
                images: images.filter(img => !img.file).map(img => img.url)
            };
            
            dataToSend.append('service', new Blob([JSON.stringify(payload)], { type: 'application/json' }));

            images.forEach(img => {
                if (img.file) {
                    dataToSend.append('images', img.file);
                }
            });
            
            await nccService.updateNccProvider(id, dataToSend);
            setSuccessMessage(t('ncc_edit.save_success_message', "Profilo aggiornato con successo!"));
        } catch (error) {
            console.error("Errore salvataggio:", error);
            setErrorMessage("Errore durante il salvataggio delle modifiche.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={`min-h-screen bg-[#F8FAFC] pb-20 ${HOGU_THEME.fontFamily}`}>
            <LoadingScreen isLoading={isLoading} />
            <SuccessModal isOpen={!!successMessage} onClose={() => setSuccessMessage(null)} message={successMessage} />
            {errorMessage && <ErrorModal onClose={() => setErrorMessage(null)} message={errorMessage} />}
            
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
                                    required={true}
                                />
                                
                                <CityAutocomplete 
                                    label={t('ncc_edit.profile.base_location_label')}
                                    value={formData.baseLocation} 
                                    onChange={(val) => handleInputChange('baseLocation', val)}
                                    icon={MapPin}
                                    required={true}
                                />

                                <EditableInput 
                                    label={t('ncc_edit.profile.address_label', 'Indirizzo Completo')}
                                    value={formData.address} 
                                    onChange={(val) => handleInputChange('address', val)}
                                    placeholder={t('ncc_edit.profile.address_placeholder', 'Es. Via Roma, 10')}
                                    icon={Navigation}
                                    className="mt-4"
                                    required={true}
                                />

                            </div>
                            <EditableTextarea 
                                label={t('ncc_edit.profile.description_label')}
                                value={formData.description}
                                onChange={(val) => handleInputChange('description', val)}
                                rows={4}
                                required={true}
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
                                <button 
                                    onClick={() => fileInputRef.current?.click()}
                                    className={`text-[${HOGU_COLORS.primary}] font-bold text-sm flex items-center gap-2 hover:underline`}
                                >
                                    <Upload size={18} /> {t('ncc_edit.photos.upload_button')}
                                </button>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {images.map((img, idx) => (
                                    <ImageUploadCard key={idx} src={img.url} isMain={idx === 0} onDelete={() => removeImage(idx)} />
                                ))}
                                <div 
                                    onClick={() => fileInputRef.current?.click()}
                                    className="aspect-[4/3] rounded-2xl border-2 border-dashed border-gray-200 hover:border-[#68B49B] bg-gray-50 flex flex-col items-center justify-center text-gray-400 hover:text-[#68B49B] cursor-pointer transition-all group"
                                >
                                    <Plus size={24} className="group-hover:scale-110 transition-transform" />
                                    <span className="text-xs font-bold mt-2 text-gray-400 group-hover:text-[#68B49B] transition-colors">{t('ncc_edit.photos.add_button', 'Aggiungi')}</span>
                                </div>
                                <input 
                                    type="file" 
                                    ref={fileInputRef}
                                    onChange={handleImageUpload}
                                    className="hidden" 
                                    accept="image/*"
                                    multiple
                                />
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
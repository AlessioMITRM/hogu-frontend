import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
    MapPin, Car, Briefcase, Users,
    Save, Upload, Trash2, Plus, Euro, Eye, EyeOff, Navigation
} from 'lucide-react';
import CurrencyInput from 'react-currency-input-field';

import { 
    getDisplayLocation, 
    createLocationPayload 
} from '../../../../utils/locationUtils';
import { MAX_IMAGE_SIZE_BYTES, splitFilesByMaxSize, buildOversizedFilesMessage } from '../../../../utils/imageValidation';
import { CityAutocomplete } from '../../../ui/CityAutocomplete';
import { HOGU_COLORS, HOGU_THEME } from '../../../../config/theme.js';
import { withAuthProtection } from './../../auth/withAuthProtection.jsx'; 
import { Breadcrumbs } from '../../../../components/ui/Breadcrumbs.jsx'; 
import { nccService } from '../../../../api/apiClient.js';
import SuccessModal from '../../../ui/SuccessModal.jsx';
import ErrorModal from '../../../ui/ErrorModal.jsx';
import LoadingScreen from '../../../ui/LoadingScreen.jsx';
import SafeImage from '../../../ui/SafeImage.jsx';


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


// --- COMPONENTE AUTOCOMPLETE CITTA' ---
// (Component moved to src/components/ui/CityAutocomplete.jsx)

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
        <SafeImage src={src} alt={t('ncc_edit.image_alt')} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
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
                            decimalSeparator=","
                            groupSeparator="."
                            onValueChange={(value) => onChange(vehicle.id, 'pricePerKm', value || '')}
                            className={`${inputClasses} font-bold text-[#33594C] bg-[#F0FDF9] border-[#68B49B]/30 focus:border-[#68B49B]`}
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
    const navigate = useNavigate();
    
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
                    const localeObj = data.locale || data.locales?.[0];
                    const localeString = getDisplayLocation(localeObj, i18n.language);
  
                    setFormData({
                        providerName: data.name || "",
                        description: data.description || "",
                        baseLocation: localeString,
                        address: localeObj?.address || "",
                        isActive: data.publicationStatus !== false,
                        features: [], 
                        fleet: data.vehicle ? [{
                            id: data.vehicle.id,
                            name: data.vehicle.type || "Standard", 
                            model: data.vehicle.model || "",
                            plateNumber: data.vehicle.plateNumber || "",
                            pax: data.vehicle.numberOfSeats || 4,
                            luggage: 2, 
                            pricePerKm: (data.basePrice !== undefined && data.basePrice !== null) ? data.basePrice.toString() : ''
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
        setFormData(prev => ({ 
            ...prev, 
            fleet: [
                ...prev.fleet, 
                { 
                    id: newId, 
                    name: t('ncc_edit.vehicle.default_category_name'), 
                    model: '', 
                    plateNumber: '', 
                    pax: 4, 
                    luggage: 2, 
                    pricePerKm: '2.00' 
                }
            ] 
        }));
    };
    
    const removeImage = (indexToRemove) => setImages(images.filter((_, index) => index !== indexToRemove));

    const handleImageUpload = (event) => {
        const files = event.target.files ? Array.from(event.target.files) : [];
        if (!files.length) {
            event.target.value = '';
            return;
        }

        const { validFiles, oversizedFiles } = splitFilesByMaxSize(files, MAX_IMAGE_SIZE_BYTES);

        if (oversizedFiles.length) {
            setErrorMessage(buildOversizedFilesMessage(oversizedFiles, MAX_IMAGE_SIZE_BYTES));
            setShowError(true);
        }

        if (!validFiles.length) {
            event.target.value = '';
            return;
        }

        validFiles.forEach(file => {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImages(prev => [...prev, { url: reader.result, file }]);
            };
            reader.readAsDataURL(file);
        });

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
                const priceNumber = vehicle.pricePerKm ? parseFloat(vehicle.pricePerKm.toString().replace(',', '.')) : NaN;
                if (!priceNumber || priceNumber <= 0) errors.push(t('ncc_edit.validation.vehicle_price_min', "Veicolo {{number}}: Il prezzo per Km deve essere maggiore di 0.", { number: index + 1 }));
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
            const locales = createLocationPayload(formData.baseLocation, formData.address, 'NCC');

            const payload = {
                name: formData.providerName,
                description: formData.description,
                basePrice: formData.fleet.length > 0 ? (parseFloat(formData.fleet[0].pricePerKm?.toString().replace(',', '.')) || 0) : 0,
                publicationStatus: formData.isActive,
                locales: locales,
                vehicle: formData.fleet.length > 0 ? {
                    id: formData.fleet[0].id,
                    numberOfSeats: formData.fleet[0].pax,
                    plateNumber: formData.fleet[0].plateNumber,
                    model: formData.fleet[0].model,
                    type: formData.fleet[0].name
                } : null
            };
            
            dataToSend.append('service', new Blob([JSON.stringify(payload)], { type: 'application/json' }));

            const imagePromises = images.map(async (img) => {
                if (img.file) return img.file;
                if (!img.url) return null;

                try {
                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), 10000);

                    const token = localStorage.getItem('authToken');
                    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

                    const response = await fetch(img.url, { signal: controller.signal, headers });
                    clearTimeout(timeoutId);

                    if (!response.ok) {
                        console.warn(`Failed to fetch image ${img.url}: ${response.status}`);
                        return null;
                    }

                    const blob = await response.blob();
                    const filename = img.url.split('/').pop() || 'image.jpg';
                    return new File([blob], filename, { type: blob.type });
                } catch (err) {
                    console.error('Error processing image:', img.url, err);
                    return null;
                }
            });

            const processedImages = await Promise.all(imagePromises);
            processedImages.forEach(file => {
                if (file) dataToSend.append('images', file);
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
            <SuccessModal 
                isOpen={!!successMessage} 
                onClose={() => {
                    setSuccessMessage(null);
                    navigate('/provider/dashboard');
                }} 
                message={successMessage} 
            />
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
                                <h3 className="text-xl font-bold text-gray-900 flex items-center justify-between">
                                    {t('ncc_edit.photos.title')}
                                    <span className="text-xs font-normal text-gray-400">{images.length} foto</span>
                                </h3>
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

                            <div className="mt-6 pt-4 border-t border-gray-100">
                                <h4 className="text-sm font-bold text-gray-900 mb-4">
                                    {t('ncc_edit.status.title')}
                                </h4>
                                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg ${formData.isActive ? 'bg-green-100 text-green-600' : 'bg-gray-200 text-gray-500'}`}>
                                            {formData.isActive ? <Eye size={20} /> : <EyeOff size={20} />}
                                        </div>
                                        <div>
                                            <p className="font-bold text-sm text-gray-900">
                                                {t('ncc_edit.status.availability_label')}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                {formData.isActive ? t('ncc_edit.status.status_available') : t('ncc_edit.status.status_unavailable')}
                                            </p>
                                        </div>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input 
                                            type="checkbox" 
                                            className="sr-only peer"
                                            checked={formData.isActive}
                                            onChange={(e) => handleInputChange('isActive', e.target.checked)}
                                        />
                                        <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#68B49B]"></div>
                                    </label>
                                </div>
                            </div>
                        </section>
                    </div>

                    {/* --- COLONNA DESTRA --- */}
                    <div className="lg:col-span-1">
                        <div className="sticky top-24 space-y-6">
                            

                            {/* --- CARD STATUS --- */}
                            <div className={`${HOGU_THEME.cardBase} p-6 overflow-hidden relative shadow-[0_8px_30px_rgb(0,0,0,0.08)]`}>
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-slate-700 to-slate-900"></div>
                                <h3 className="text-lg font-bold text-gray-900 mb-4">{t('ncc_edit.status.title')}</h3>
                                <div className="bg-gray-50 rounded-xl p-4 mb-4 border border-gray-100">
                                    <div className="flex justify-between mb-2">
                                        <span className="text-xs text-gray-500 font-bold uppercase">{t('ncc_edit.status.min_rate_label')}</span>
                                        <span className="font-bold text-gray-900">{t('ncc_edit.status.min_rate_value')}</span>
                                    </div>
                                </div>
                                <p className="text-xs text-gray-500">
                                    {t('ncc_edit.status.hint', 'Gestisci disponibilità e salvataggio dalla sezione foto e dalla barra in basso.')}
                                </p>
                            </div>
                             <div className="bg-slate-50 rounded-[2rem] p-6 border border-slate-200">
                                <h4 className="font-bold text-slate-800 mb-2 flex items-center gap-2"><Navigation size={18} /> {t('ncc_edit.help.title')}</h4>
                                <p className="text-sm text-slate-600 leading-relaxed">{t('ncc_edit.help.description')}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto px-4 lg:px-8 mt-8">
                    <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100 flex flex-col md:flex-row items-center justify-between gap-4 sticky bottom-4 z-40">
                        <div className="flex-1 flex flex-col gap-2">
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-gray-600">
                                    {t('ncc_edit.status.publish_status_label', 'Stato pubblicazione:')}
                                </span>
                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${formData.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}>
                                    {formData.isActive ? t('ncc_edit.status.status_available') : t('ncc_edit.status.status_unavailable')}
                                </span>
                            </div>
                            <div className="text-xs text-gray-500 font-medium">
                                {t('ncc_edit.status.required_note', 'I campi contrassegnati con * sono obbligatori.')}
                            </div>
                        </div>
                        <button 
                            onClick={handleSave}
                            disabled={isLoading}
                            className={`w-full md:w-auto px-10 py-4 rounded-xl font-bold text-white shadow-lg shadow-slate-500/20 hover:shadow-xl hover:-translate-y-1 transition-all flex items-center justify-center gap-2 ${isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-slate-800 hover:bg-slate-700'}`}
                        >
                            {isLoading ? t('ncc_edit.status.saving_button') : (
                                <>
                                    <Save size={20} />
                                    {t('ncc_edit.status.save_button')}
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export const NCCServiceEditPage = withAuthProtection(NCCServiceEditPageBase, ['PROVIDER'], "NCC");

export default NCCServiceEditPage;

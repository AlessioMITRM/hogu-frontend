import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import CurrencyInput from 'react-currency-input-field';
import {
    Clock, MapPin, Star, Check, Wifi, Utensils, Wine, Vegan, Accessibility, Car,
    ChevronRight, Save, Upload, Trash2, Plus, DollarSign, Eye, EyeOff, ChefHat, Flame, GripVertical, X, Navigation, Euro,
    CalendarCheck, CreditCard, FileText
} from 'lucide-react';

import { withAuthProtection } from './../../auth/withAuthProtection.jsx';
import { restaurantService } from '../../../../api/apiClient.js';
import { Breadcrumbs } from '../../../../components/ui/Breadcrumbs.jsx';
import { CityAutocomplete } from '../../../ui/CityAutocomplete';
import {
    getDisplayLocation,
    createLocationPayload
} from '../../../../utils/locationUtils';
import { MAX_IMAGE_SIZE_BYTES, splitFilesByMaxSize, buildOversizedFilesMessage } from '../../../../utils/imageValidation';

import LoadingScreen from '../../../ui/LoadingScreen.jsx';
import SafeImage from '../../../ui/SafeImage.jsx';


// --- 1. CONFIGURAZIONE ---

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

// --- UTILS LOCATIONS ---
// Logic moved to src/utils/locationUtils.js

// --- COMPONENTI UI DI BASE ---

// CityAutocomplete component moved to src/components/ui/CityAutocomplete.jsx

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

const EditableTextarea = ({ label, value, onChange, rows = 4, required = false, maxLength = null }) => (
    <div className="group">
        {label && (
            <div className="flex justify-between items-center mb-1.5 ml-1">
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">
                    {label} {required && <span className="text-red-500">*</span>}
                </label>
                {maxLength && (
                    <span className={`text-xs ${value.length >= maxLength ? 'text-red-500 font-bold' : 'text-gray-400'}`}>
                        {value.length}/{maxLength}
                    </span>
                )}
            </div>
        )}
        <textarea
            value={value}
            onChange={(e) => {
                const newValue = e.target.value;
                if (!maxLength || newValue.length <= maxLength) {
                    onChange(newValue);
                }
            }}
            rows={rows}
            maxLength={maxLength}
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
                ? `bg-[#F0FDF9] border-[#68B49B]/30 text-[#33594C] shadow-sm`
                : 'bg-gray-50 border-gray-100 text-gray-500 hover:bg-gray-100'}
        `}
    >
        <Icon size={20} className={active ? `text-[#68B49B]` : 'text-gray-400'} />
        <span className="text-sm font-bold">{label}</span>
        {active && <Check size={16} className="ml-auto text-[#68B49B]" />}
    </button>
);

const ImageUploadCard = ({ src, onDelete, isMain = false, isNew = false }) => (
    <div className={`relative rounded-2xl overflow-hidden group ${isMain ? 'col-span-2 row-span-2 aspect-video' : 'aspect-[4/3]'}`}>
        <SafeImage src={src} alt="Service" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <button
                onClick={onDelete}
                className="p-2 bg-white rounded-full text-red-500 hover:bg-red-50 transition-colors shadow-lg"
                title="Rimuovi foto"
            >
                <Trash2 size={20} />
            </button>
            {isMain && <span className="absolute bottom-4 left-4 bg-[#68B49B] text-white text-xs px-2 py-1 rounded-md font-bold">Copertina</span>}
            {isNew && <span className="absolute top-4 left-4 bg-blue-500 text-white text-xs px-3 py-1.5 rounded-md font-bold">Nuova</span>}
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
                    <CurrencyInput
                        value={item.price}
                        onValueChange={(value) => onUpdate(item.id, 'price', value)}
                        placeholder="0.00"
                        decimalsLimit={2}
                        decimalScale={2}
                        decimalSeparator=","
                        groupSeparator="."
                        prefix="€ "
                        className="w-full text-right font-bold text-[#68B49B] bg-transparent focus:outline-none border-b border-transparent focus:border-gray-200"
                    />
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
    const { t, i18n } = useTranslation('dashboard');
    const { id } = useParams();
    const navigate = useNavigate();
    const isEditMode = !!id;

    // --- STATE ---
    const [isLoading, setIsLoading] = useState(isEditMode);
    const [isSaving, setIsSaving] = useState(false);

    const [formData, setFormData] = useState({
        title: '', // name nel DTO
        description: '',
        city: '',
        address: '',
        isActive: true, // publicationStatus nel DTO
        basePrice: '', // era avgPrice
        capacity: '', // New field
        menu: [] // Array di sezioni
    });

    const [images, setImages] = useState([]);
    const [newImages, setNewImages] = useState([]);
    const fileInputRef = useRef(null);

    // --- CARICAMENTO DATI ---
    useEffect(() => {
        if (!isEditMode) {
            setIsLoading(false);
            return;
        }

        const fetchRestaurant = async () => {
            try {
                setIsLoading(true);
                const res = await restaurantService.getRestaurantProvider(id);
                const data = res;

                const cityStr = getDisplayLocation(data.locales?.[0], i18n.language);

                // Mappatura menu da API
                let menu = [];
                try {
                    if (data.menu) {
                        const parsed = typeof data.menu === 'string' ? JSON.parse(data.menu) : data.menu;
                        // Supporta sia formato array diretto che oggetto { menu: [...] }
                        const rawMenu = Array.isArray(parsed) ? parsed : (parsed.menu || []);

                        if (Array.isArray(rawMenu)) {
                            menu = rawMenu.map((cat, idx) => ({
                                id: idx + 1, // ID temporaneo per la UI
                                category: cat.category,
                                items: (cat.items || []).map((item, iIdx) => ({
                                    id: iIdx + 1, // ID temporaneo per la UI
                                    name: item.name,
                                    price: item.price,
                                    description: item.description || ''
                                }))
                            }));
                        }
                    }
                } catch (e) {
                    console.warn("Failed to parse menu JSON", e);
                    menu = [];
                }

                setFormData({
                    title: data.name || '',
                    description: data.description || '',
                    city: cityStr,
                    address: data.locales?.[0]?.address || '',
                    isActive: data.publicationStatus ?? true,
                    basePrice: data.basePrice || '',
                    capacity: data.capacity || '',
                    menu: menu
                });

                const loadedImages = Array.isArray(data.images)
                    ? data.images.map(filename => `/files/restaurant/${id}/${filename}`)
                    : [];
                setImages(loadedImages);

            } catch (e) {
                console.error(e);
                alert('Errore nel caricamento del ristorante');
            } finally {
                setIsLoading(false);
            }
        };

        fetchRestaurant();
    }, [id, isEditMode]);


    // --- HANDLERS ---
    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    // Removed toggleFeature since features are not in the DTO anymore


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

    // IMAGE HANDLERS
    const handleImageUpload = (e) => {
        const files = Array.from(e.target.files);
        if (!files.length) return;

        const { validFiles, oversizedFiles } = splitFilesByMaxSize(files, MAX_IMAGE_SIZE_BYTES);

        if (oversizedFiles.length) {
            alert(buildOversizedFilesMessage(oversizedFiles, MAX_IMAGE_SIZE_BYTES));
        }

        if (!validFiles.length) {
            if (fileInputRef.current) fileInputRef.current.value = '';
            return;
        }

        const newBlobs = validFiles.map(file => ({ file, preview: URL.createObjectURL(file) }));
        setNewImages(prev => [...prev, ...newBlobs]);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const removeImage = (indexToRemove) => {
        setImages(images.filter((_, index) => index !== indexToRemove));
    };

    const removeNewImage = (indexToRemove) => {
        setNewImages(prev => {
            const newArr = prev.filter((_, index) => index !== indexToRemove);
            // Revoca URL object per liberare memoria
            URL.revokeObjectURL(prev[indexToRemove].preview);
            return newArr;
        });
    };

    // VALIDATION
    const validate = () => {
        const errors = [];
        if (!formData.title.trim()) errors.push(t('restaurant_edit.validation.name', 'Il nome del ristorante è obbligatorio'));
        if (!formData.city.trim()) errors.push(t('restaurant_edit.validation.city', 'La città è obbligatoria'));
        if (!formData.address.trim()) errors.push(t('restaurant_edit.validation.address', "L'indirizzo è obbligatorio"));
        if (!formData.description.trim()) errors.push(t('restaurant_edit.validation.description', 'La descrizione è obbligatoria'));

        const totalImages = images.length + newImages.length;
        if (totalImages < 6) errors.push(t('restaurant_edit.validation.min_images', "Devi caricare almeno 6 immagini (attuali: {{count}}).", { count: totalImages }));

        return errors;
    };

    // SAVE
    const handleSave = async () => {
        const errors = validate();
        if (errors.length) {
            alert(errors.join('\n'));
            return;
        }

        setIsSaving(true);

        try {
            const locales = createLocationPayload(formData.city, formData.address, 'RESTAURANT');

            const payload = {
                name: formData.title,
                description: formData.description,
                locales: locales,
                publicationStatus: formData.isActive,
                basePrice: formData.basePrice ? parseFloat(formData.basePrice) : null,
                capacity: formData.capacity ? parseInt(formData.capacity) : null,
                menu: JSON.stringify({
                    menu: formData.menu.map(section => ({
                        category: section.category,
                        items: section.items.map(item => ({
                            name: item.name,
                            price: parseFloat(item.price) || 0,
                            description: item.description // Keep description if present
                        }))
                    }))
                })
            };

            const formDataToSend = new FormData();
            formDataToSend.append('data', new Blob([JSON.stringify(payload)], { type: 'application/json' }));

            // Process images
            const imagePromises = images.map(async (url) => {
                try {
                    if (!url) return null;
                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), 10000);
                    const response = await fetch(url, { signal: controller.signal });
                    clearTimeout(timeoutId);
                    if (!response.ok) return null;
                    const blob = await response.blob();
                    const filename = url.split('/').pop() || 'image.jpg';
                    return new File([blob], filename, { type: blob.type });
                } catch (err) {
                    return null;
                }
            });

            const processedImages = await Promise.all(imagePromises);
            processedImages.forEach(file => {
                if (file) formDataToSend.append('images', file);
            });

            newImages.forEach(item => formDataToSend.append('images', item.file));

            console.log("Sending restaurant request...", payload);

            if (isEditMode) {
                await restaurantService.updateRestaurantProvider(id, formDataToSend);
            } else {
                await restaurantService.createRestaurantProvider(formDataToSend);
            }

            navigate('/provider/dashboard');

        } catch (e) {
            console.error("Save error:", e);
            alert(e.message || 'Errore durante il salvataggio');
        } finally {
            setIsSaving(false);
        }
    };


    if (isLoading || isSaving) return <LoadingScreen isLoading={true} />;

    const breadcrumbsItems = [
        { label: 'Dashboard', href: '/provider/dashboard' },
        { label: isEditMode ? 'Modifica Ristorante' : 'Crea Ristorante', href: '#' }
    ];

    return (
        <div className={`min-h-screen bg-[#F8FAFC] pb-20 ${HOGU_THEME.fontFamily}`}>

            {/* --- HERO SECTION --- */}
            <div className="bg-white pt-12 pb-24 px-4 lg:px-8 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-96 h-96 bg-black/5 rounded-full blur-3xl -translate-y-1/2 -translate-x-1/3"></div>
                <div className="absolute top-0 right-0 w-96 h-96 bg-black/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>

                <div className="max-w-7xl mx-auto relative z-10">
                    <Breadcrumbs items={breadcrumbsItems} />

                    <span className={`text-gray-900 mt-6 font-bold tracking-wider text-xs uppercase mb-3 block flex items-center gap-2`}>
                        <div className="w-8 h-[1px] bg-gray-900"></div> Servizio Ristorante
                    </span>

                    <h1 className={`text-3xl md:text-5xl font-extrabold text-[${HOGU_COLORS.dark}] mb-2 tracking-tight leading-tight`}>
                        {isEditMode ? 'Modifica Ristorante' : 'Crea Nuovo Ristorante'}
                    </h1>
                    <p className={`text-lg text-[${HOGU_COLORS.subtleText}] max-w-xl leading-relaxed`}>
                        Gestisci il profilo, il menu digitale e le impostazioni del tuo locale.
                    </p>
                </div>
            </div>

            {/* --- CONTENUTO PRINCIPALE --- */}
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
                                    large
                                    placeholder="Es. Ristorante da Mario"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                <CityAutocomplete
                                    label="Città"
                                    value={formData.city}
                                    onChange={(val) => handleInputChange('city', val)}
                                    icon={MapPin}
                                />
                                <EditableInput
                                    label="Indirizzo Completo"
                                    value={formData.address}
                                    onChange={(val) => handleInputChange('address', val)}
                                    icon={Navigation}
                                    placeholder="Via Roma 123"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                <div className="group">
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 ml-1">Prezzo Medio</label>
                                    <div className="relative">
                                        <CurrencyInput
                                            value={formData.basePrice}
                                            onValueChange={(value) => handleInputChange('basePrice', value)}
                                            placeholder="0.00"
                                            decimalsLimit={2}
                                            decimalScale={2}
                                            decimalSeparator=","
                                            groupSeparator="."
                                            prefix="€ "
                                            className={`${HOGU_THEME.inputBase} pl-4`}
                                        />
                                    </div>
                                </div>
                                <EditableInput
                                    label="Capienza (Posti)"
                                    value={formData.capacity}
                                    onChange={(val) => handleInputChange('capacity', val)}
                                    type="number"
                                    icon={Utensils}
                                    placeholder="Es. 40"
                                />
                            </div>

                            <EditableTextarea
                                label="Descrizione Ristorante"
                                value={formData.description}
                                onChange={(val) => handleInputChange('description', val)}
                                rows={5}
                                required
                                maxLength={1000}
                            />
                        </section>

                        {/* SEZIONE 2: MENU EDITOR */}
                        <section className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                    <ChefHat size={24} className={`text-[${HOGU_COLORS.primary}]`} />
                                    Menu Digitale
                                </h3>
                                <button
                                    onClick={addMenuSection}
                                    className={`px-4 py-2 rounded-xl bg-[${HOGU_COLORS.primary}]/10 text-[${HOGU_COLORS.primary}] text-sm font-bold hover:bg-[${HOGU_COLORS.primary}]/20 transition-colors flex items-center gap-2`}
                                >
                                    <Plus size={16} /> Nuova Categoria
                                </button>
                            </div>

                            {formData.menu.length === 0 ? (
                                <div className="text-center py-10 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                                    <Utensils className="mx-auto text-gray-300 mb-3" size={48} />
                                    <p className="text-gray-500 font-medium">Il menu è vuoto</p>
                                    <button onClick={addMenuSection} className="text-[#68B49B] font-bold text-sm mt-2 hover:underline">
                                        Crea la prima categoria (es. Antipasti)
                                    </button>
                                </div>
                            ) : (
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
                            )}
                        </section>

                        {/* SEZIONE 3: GALLERY */}
                        <section className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold text-gray-900 flex items-center justify-between gap-2">
                                    <span className="flex items-center gap-2">
                                        <Eye size={24} className={`text-[${HOGU_COLORS.primary}]`} />
                                        Foto Ristorante
                                    </span>
                                    <span className="text-xs font-normal text-gray-400">{images.length + newImages.length} foto</span>
                                </h3>
                                <label className={`text-[${HOGU_COLORS.primary}] font-bold text-sm flex items-center gap-2 hover:underline cursor-pointer`}>
                                    <Upload size={18} /> Carica immagini
                                    <input ref={fileInputRef} type="file" multiple accept="image/*" onChange={handleImageUpload} className="hidden" />
                                </label>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {images.map((src, idx) => (
                                    <ImageUploadCard
                                        key={`existing-${idx}`}
                                        src={src}
                                        onDelete={() => removeImage(idx)}
                                        isMain={idx === 0}
                                    />
                                ))}
                                {newImages.map((item, idx) => (
                                    <ImageUploadCard
                                        key={`new-${idx}`}
                                        src={item.preview}
                                        onDelete={() => removeNewImage(idx)}
                                        isNew
                                    />
                                ))}

                                {/* Placeholder se vuoto */}
                                {images.length === 0 && newImages.length === 0 && (
                                    <div className="col-span-full py-8 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                                        <p className="text-gray-400 text-sm">Nessuna immagine caricata. Carica almeno 6 foto.</p>
                                    </div>
                                )}
                            </div>

                            <div className="mt-6 pt-4 border-t border-gray-100">
                                <h4 className="text-sm font-bold text-gray-900 mb-4">{t('provider.restaurant_service_edit.publishing.status_heading', 'Stato pubblicazione')}</h4>
                                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                                    <div className="flex items-center gap-3">
                                        <span className="text-sm font-bold text-gray-600 flex items-center gap-2">
                                            {formData.isActive ? <Eye size={18} /> : <EyeOff size={18} />}
                                            {formData.isActive ? t('provider.restaurant_service_edit.publishing.visible', 'Visibile online') : t('provider.restaurant_service_edit.publishing.hidden', 'Nascosto')}
                                        </span>
                                    </div>
                                    <button
                                        onClick={() => handleInputChange('isActive', !formData.isActive)}
                                        className={`
                                            w-12 h-7 rounded-full transition-colors relative
                                            ${formData.isActive ? `bg-[${HOGU_COLORS.primary}]` : 'bg-gray-300'}
                                        `}
                                    >
                                        <div className={`
                                            absolute top-1 w-5 h-5 bg-white rounded-full transition-all shadow-sm
                                            ${formData.isActive ? 'left-6' : 'left-1'}
                                        `}></div>
                                    </button>
                                </div>
                            </div>
                        </section>

                    </div>

                    {/* --- COLONNA DESTRA (SIDEBAR) --- */}
                    <div className="space-y-6">

                        {/* CARD STATO PUBBLICAZIONE / SUPPORTO */}
                        <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100 sticky top-24">
                            <h3 className="text-lg font-bold text-gray-900 mb-4">{t('provider.restaurant_service_edit.publishing.status_heading', 'Stato pubblicazione')}</h3>
                            <p className="text-xs text-gray-500">
                                {t('provider.restaurant_service_edit.publishing.sidebar_hint', 'Gestisci la visibilità e salva dalla barra in basso.')}
                            </p>
                            <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                                <div className="flex items-center justify-between gap-4">
                                    <span className="text-sm font-bold text-gray-600 flex items-center gap-2">
                                        {formData.isActive ? <Eye size={18} /> : <EyeOff size={18} />}
                                        {formData.isActive ? t('provider.restaurant_service_edit.publishing.visible', 'Visibile online') : t('provider.restaurant_service_edit.publishing.hidden', 'Nascosto')}
                                    </span>
                                    <button
                                        onClick={() => handleInputChange('isActive', !formData.isActive)}
                                        className={`
                                            w-12 h-7 rounded-full transition-colors relative shrink-0
                                            ${formData.isActive ? `bg-[${HOGU_COLORS.primary}]` : 'bg-gray-300'}
                                        `}
                                    >
                                        <div className={`
                                            absolute top-1 w-5 h-5 bg-white rounded-full transition-all shadow-sm
                                            ${formData.isActive ? 'left-6' : 'left-1'}
                                        `}></div>
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* CARD CARATTERISTICHE (SERVIZI) - REMOVED AS REQUESTED */}
                        {/* 
                        <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100">
                            <h3 className="text-lg font-bold text-gray-900 mb-4">Servizi Offerti</h3>
                            <div className="space-y-2">
                                <AmenityToggle 
                                    icon={Wifi} 
                                    label="Wi-Fi Gratuito" 
                                    active={formData.features.includes('wifi')} 
                                    onClick={() => toggleFeature('wifi')} 
                                />
                                <AmenityToggle 
                                    icon={Wine} 
                                    label="Carta dei Vini" 
                                    active={formData.features.includes('wine')} 
                                    onClick={() => toggleFeature('wine')} 
                                />
                                <AmenityToggle 
                                    icon={Accessibility} 
                                    label="Accessibile Disabili" 
                                    active={formData.features.includes('accessible')} 
                                    onClick={() => toggleFeature('accessible')} 
                                />
                                <AmenityToggle 
                                    icon={Car} 
                                    label="Parcheggio" 
                                    active={formData.features.includes('parking')} 
                                    onClick={() => toggleFeature('parking')} 
                                />
                                <AmenityToggle 
                                    icon={Vegan} 
                                    label="Opzioni Vegane" 
                                    active={formData.features.includes('vegan')} 
                                    onClick={() => toggleFeature('vegan')} 
                                />
                                <AmenityToggle 
                                    icon={Flame} 
                                    label="Dehor Esterno" 
                                    active={formData.features.includes('outdoor')} 
                                    onClick={() => toggleFeature('outdoor')} 
                                />
                            </div>
                        </div>
                        */}

                    </div>

                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 lg:px-8 mt-8">
                <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100 flex flex-col md:flex-row items-center justify-between gap-4 sticky bottom-4 z-40">
                    <div className="flex-1 flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-600">{t('provider.restaurant_service_edit.publishing.footer_label', 'Stato pubblicazione:')}</span>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${formData.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}>
                                {formData.isActive ? t('provider.restaurant_service_edit.publishing.visible', 'Visibile online') : t('provider.restaurant_service_edit.publishing.hidden', 'Nascosto')}
                            </span>
                        </div>
                        <div className="text-xs text-gray-500 font-medium">
                            I campi contrassegnati con * sono obbligatori. Carica almeno 6 foto del ristorante.
                        </div>
                    </div>
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className={`
                            w-full md:w-auto px-10 py-4 rounded-xl text-white font-bold text-lg shadow-lg shadow-[#68B49B]/20 
                            flex items-center justify-center gap-2 transition-all transform hover:scale-[1.02] active:scale-[0.98]
                            bg-[#68B49B] hover:bg-[#569C85] disabled:opacity-70 disabled:cursor-not-allowed
                        `}
                    >
                        {isSaving ? (
                            <>Salvataggio...</>
                        ) : (
                            <><Save size={20} /> Salva Modifiche</>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default withAuthProtection(RestaurantServiceEditPageBase);

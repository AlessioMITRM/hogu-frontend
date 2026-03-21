import { useState, useMemo, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';
import {
    MapPin, ChevronRight, Save, Upload, Trash2, Plus, Euro, Eye, EyeOff, Home, Users, Bath, GripVertical, X, Navigation, ArrowLeft,
    Info, CalendarCheck, CreditCard, FileText, Warehouse
} from 'lucide-react';
import CurrencyInput from 'react-currency-input-field';

import { withAuthProtection } from '../../auth/withAuthProtection.jsx';
import { bnbService } from '../../../../api/apiClient.js';
import { HOGU_COLORS, HOGU_THEME } from '../../../../config/theme.js';

import { CityAutocomplete } from '../../../ui/CityAutocomplete';
import {
    getDisplayLocation,
    createLocationPayload
} from '../../../../utils/locationUtils';
import { MAX_IMAGE_SIZE_BYTES, splitFilesByMaxSize, buildOversizedFilesMessage } from '../../../../utils/imageValidation';

import { Breadcrumbs } from '../../../../components/ui/Breadcrumbs.jsx';
import SuccessModal from '../../../ui/SuccessModal.jsx';
import ErrorModal from '../../../ui/ErrorModal.jsx';
import LoadingScreen from '../../../ui/LoadingScreen.jsx';
import SafeImage from '../../../ui/SafeImage.jsx';








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



const ImageUploadCard = ({ src, onDelete, isMain = false }) => (
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
        </div>
    </div>
);

// --- COMPONENTE PRINCIPALE: SERVICE EDIT ---

export const BnBServiceEditBase = () => {
    const { id } = useParams();
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const isEditMode = !!id;

    // --- STATE MANAGEMENT ---
    const [isLoading, setIsLoading] = useState(true);
    const [showSuccess, setShowSuccess] = useState(false);
    const [showError, setShowError] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    // Dati del servizio
    const [formData, setFormData] = useState({
        title: '',
        description: '', // Descrizione Struttura
        city: '',
        address: '',
        price: 0,
        maxGuests: 1,
        isActive: true,
        amenities: [],
        images: []
    });

    const [images, setImages] = useState([]);
    const [newImages, setNewImages] = useState([]);
    const fileInputRef = useRef(null);

    // --- FETCH DATA ---
    useEffect(() => {
        const fetchData = async () => {
            if (!id) return;

            setIsLoading(true);
            try {
                const data = await bnbService.getBnBProvider(id);

                const locale = data.locales && data.locales.length > 0 ? data.locales[0] : (data.serviceLocale && data.serviceLocale.length > 0 ? data.serviceLocale[0] : {});
                const cityStr = getDisplayLocation(locale, i18n.language);

                setFormData({
                    title: data.name || '',
                    description: data.description || '',
                    city: cityStr,
                    address: locale.address || '',
                    price: data.defaultPricePerNight || data.priceForNight || 0,
                    maxGuests: data.maxGuestsForRoom || data.maxGuests || 1,
                    isActive: data.publicationStatus ?? data.available ?? true,
                    amenities: [],
                    images: data.images || []
                });

                setImages(data.images ? data.images.map(filename => `/files/bnb/${id}/${filename}`) : []);
                setNewImages([]);

            } catch (error) {
                console.error("Errore caricamento dati:", error);
                alert("Errore nel caricamento dei dati del servizio.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [id]);

    // --- HANDLERS ---
    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };



    const handleSave = async () => {
        // VALIDAZIONE CAMPI OBBLIGATORI
        const totalImages = images.length + newImages.length;
        if (!formData.title || !formData.city || !formData.address || !formData.description || !formData.price || parseFloat(formData.price) <= 0 || !formData.maxGuests) {
            setErrorMessage("Compila tutti i campi obbligatori: Nome, Città, Indirizzo, Descrizione, Prezzo (>0) e Ospiti.");
            setShowError(true);
            return;
        }

        if (totalImages < 6) {
            setErrorMessage(`Devi caricare almeno 6 immagini (attualmente ne hai ${totalImages}).`);
            setShowError(true);
            return;
        }

        setIsLoading(true);
        try {
            // Genera il payload per la location usando l'utility centralizzata
            const locales = createLocationPayload(formData.city, formData.address, 'BNB');

            const payload = {
                name: formData.title,
                description: formData.description,
                defaultPricePerNight: parseFloat(formData.price),
                maxGuestsForRoom: parseInt(formData.maxGuests, 10),
                publicationStatus: formData.isActive,
                locales: locales
            };

            const formDataToSend = new FormData();
            formDataToSend.append('data', new Blob([JSON.stringify(payload)], { type: 'application/json' }));

            // Process images in parallel (Identico a LuggageServiceEditPage.jsx)
            const imagePromises = images.map(async (url) => {
                try {
                    if (!url) return null;

                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

                    const token = localStorage.getItem('authToken');
                    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

                    const response = await fetch(url, { signal: controller.signal, headers });
                    clearTimeout(timeoutId);

                    if (!response.ok) {
                        console.warn(`Failed to fetch image ${url}: ${response.status}`);
                        throw new Error(`Impossibile recuperare l'immagine: ${url}`);
                    }

                    const blob = await response.blob();
                    const filename = url.split('/').pop() || 'image.jpg';
                    return new File([blob], filename, { type: blob.type });
                } catch (err) {
                    console.error('Error processing image:', url, err);
                    throw err; // Propagate error to stop save
                }
            });

            let processedImages;
            try {
                processedImages = await Promise.all(imagePromises);
            } catch (err) {
                setIsLoading(false);
                alert("Errore durante il recupero delle immagini esistenti. Riprova.");
                return;
            }

            processedImages.forEach(file => {
                if (file) formDataToSend.append('images', file);
            });

            // Append new images directly
            newImages.forEach(item => formDataToSend.append('images', item.file));

            if (isEditMode) {
                await bnbService.updateBnBProvider(id, formDataToSend);
            } else {
                await bnbService.createBnBProvider(formDataToSend);
            }

            setShowSuccess(true);
            setNewImages([]);
            const updatedPreviews = [...images, ...newImages.map(i => i.preview)];
            setImages(updatedPreviews);
        } catch (error) {
            console.error("Errore salvataggio:", error);
            setErrorMessage("Errore durante il salvataggio delle modifiche.");
            setShowError(true);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteExisting = (idx) => setImages(prev => prev.filter((_, i) => i !== idx));
    const handleDeleteNew = (idx, preview) => {
        setNewImages(prev => prev.filter((_, i) => i !== idx));
        URL.revokeObjectURL(preview);
    };

    if (isLoading) {
        return <LoadingScreen isLoading={true} />;
    }

    const breadcrumbsItems = [
        { label: 'Dashboard', href: '/provider/dashboard' },
        { label: isEditMode ? 'Modifica Servizio' : 'Nuovo Servizio', href: '#' }
    ];

    // --- RENDER ---
    return (
        <div className={`min-h-screen bg-[#F8FAFC] pb-20 ${HOGU_THEME.fontFamily}`}>

            {/* HERO */}
            <div className="bg-white pt-12 pb-24 px-4 lg:px-8 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-96 h-96 bg-black/5 rounded-full blur-3xl -translate-y-1/2 -translate-x-1/3" />
                <div className="absolute top-0 right-0 w-96 h-96 bg-black/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
                <div className="max-w-7xl mx-auto relative z-10">
                    <Breadcrumbs items={breadcrumbsItems} />
                    <span className="text-gray-900 mt-6 font-bold tracking-wider text-xs uppercase mb-3 block flex items-center gap-2">
                        <div className="w-8 h-[1px] bg-gray-900" /> Servizio B&B / Affittacamere
                    </span>
                    <h1 className={`text-3xl md:text-5xl font-extrabold text-[${HOGU_COLORS.dark}] mb-2 tracking-tight leading-tight`}>
                        {isEditMode ? 'Modifica B&B' : 'Crea Nuovo B&B'}
                    </h1>
                    <p className={`text-lg text-[${HOGU_COLORS.subtleText}] max-w-xl leading-relaxed`}>
                        Gestisci descrizioni, prezzi, disponibilità e foto della tua struttura.
                    </p>
                </div>
            </div>

            {/* MAIN CONTENT */}
            <div className="max-w-7xl mx-auto px-4 lg:px-8 -mt-16 relative z-20">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-10">

                    {/* --- COLONNA SINISTRA --- */}
                    <div className="lg:col-span-2 space-y-8">

                        {/* SEZIONE 1: INFO BASE & INDIRIZZO */}
                        <section className={`${HOGU_THEME.cardBase} p-8`}>
                            <div className="mb-6">
                                <EditableInput
                                    label="Nome Camera / Servizio"
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

                            <div className="space-y-6">
                                <EditableTextarea
                                    label="Descrizione Struttura"
                                    value={formData.description}
                                    onChange={(val) => handleInputChange('description', val)}
                                    rows={6}
                                />
                            </div>
                        </section>

                        {/* SEZIONE 2: PREZZO E OSPITI */}
                        <section className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100">
                            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2 mb-6">
                                <Euro size={24} className={`text-[${HOGU_COLORS.primary}]`} />
                                Prezzo e Capienza massima della camera più grande
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="group">
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 ml-1">Prezzo per Notte (€)</label>
                                    <div className="relative">
                                        <Euro className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                        <CurrencyInput
                                            id="price-input"
                                            name="price-input"
                                            placeholder="0,00"
                                            defaultValue={formData.price}
                                            decimalsLimit={2}
                                            decimalScale={2}
                                            fixedDecimalLength={2}
                                            onValueChange={(value, name, values) => {
                                                handleInputChange('price', value ? value.replace(',', '.') : '');
                                            }}
                                            className={`${HOGU_THEME.inputBase} pl-11 text-base`}
                                            intlConfig={{ locale: 'it-IT', currency: 'EUR' }}
                                        />
                                    </div>
                                </div>

                                <EditableInput
                                    label="Max Ospiti"
                                    value={formData.maxGuests}
                                    onChange={(val) => handleInputChange('maxGuests', val)}
                                    type="number"
                                    icon={Users}
                                />
                            </div>
                        </section>

                        {/* GESTIONE FOTO (Spostata qui) */}
                        <section className={`${HOGU_THEME.cardBase} p-8`}>
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold text-gray-900 flex items-center justify-between">
                                    Foto della Camera
                                    <span className="text-xs font-normal text-gray-400">{images.length + newImages.length} foto</span>
                                </h3>
                                <label className={`text-[${HOGU_COLORS.primary}] font-bold text-sm flex items-center gap-2 hover:underline cursor-pointer`}>
                                    <Upload size={18} /> Carica immagini
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        multiple
                                        accept="image/*"
                                        className="hidden"
                                        onChange={(e) => {
                                            const files = Array.from(e.target.files);
                                            if (!files.length) return;

                                            const { validFiles, oversizedFiles } = splitFilesByMaxSize(files, MAX_IMAGE_SIZE_BYTES);

                                            if (oversizedFiles.length) {
                                                setErrorMessage(buildOversizedFilesMessage(oversizedFiles, MAX_IMAGE_SIZE_BYTES));
                                                setShowError(true);
                                            }

                                            if (!validFiles.length) {
                                                if (fileInputRef.current) fileInputRef.current.value = '';
                                                return;
                                            }

                                            const newBlobs = validFiles.map(file => ({ file, preview: URL.createObjectURL(file) }));
                                            setNewImages(prev => [...prev, ...newBlobs]);
                                            if (fileInputRef.current) fileInputRef.current.value = '';
                                        }}
                                    />
                                </label>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {images.map((img, idx) => (
                                    <ImageUploadCard
                                        key={`old-${idx}`}
                                        src={img}
                                        onDelete={() => handleDeleteExisting(idx)}
                                        isMain={idx === 0}
                                    />
                                ))}
                                {newImages.map((item, idx) => (
                                    <ImageUploadCard
                                        key={`new-${idx}`}
                                        src={item.preview}
                                        onDelete={() => handleDeleteNew(idx, item.preview)}
                                    />
                                ))}
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="aspect-[4/3] rounded-2xl border-2 border-dashed border-gray-200 hover:border-[#68B49B] bg-gray-50 flex flex-col items-center justify-center text-gray-400 hover:text-[#68B49B] cursor-pointer transition-all group"
                                >
                                    <Plus size={32} className="group-hover:scale-110 transition-transform" />
                                    <span className="text-xs mt-2">Aggiungi</span>
                                </button>
                            </div>
                        </section>

                    </div>

                    {/* --- COLONNA DESTRA (SIDEBAR) --- */}
                    <div className="lg:col-span-1">
                        <div className="sticky top-24 space-y-6">



                            {/* STATO OPERATIVO */}
                            <div className={`${HOGU_THEME.cardBase} p-6 shadow-[0_8px_30px_rgb(0,0,0,0.08)]`}>
                                <h3 className="text-lg font-bold text-gray-900 mb-6">Stato Operativo</h3>

                                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100 mb-6">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg ${formData.isActive ? 'bg-green-100 text-green-600' : 'bg-gray-200 text-gray-500'}`}>
                                            {formData.isActive ? <Eye size={20} /> : <EyeOff size={20} />}
                                        </div>
                                        <div>
                                            <p className="font-bold text-sm text-gray-900">Visibilità</p>
                                            <p className="text-xs text-gray-500">{formData.isActive ? 'Online' : 'Nascosto'}</p>
                                        </div>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input type="checkbox" className="sr-only peer" checked={formData.isActive} onChange={e => handleInputChange('isActive', e.target.checked)} />
                                        <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#68B49B]"></div>
                                    </label>
                                </div>

                                <button
                                    onClick={handleSave}
                                    disabled={isLoading}
                                    className={`w-full py-4 rounded-xl font-bold text-lg text-white shadow-xl flex items-center justify-center gap-2 transition-all
                                    ${isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-slate-800 hover:bg-slate-700 hover:scale-[1.02]'}`}
                                >
                                    {isLoading ? 'Salvataggio...' : (
                                        <>
                                            <Save size={20} />
                                            {isEditMode ? 'Salva Modifiche' : 'Crea Camera'}
                                        </>
                                    )}
                                </button>
                            </div>

                        </div>
                    </div>

                </div>
            </div>

            <SuccessModal
                isOpen={showSuccess}
                onClose={() => {
                    setShowSuccess(false);
                    navigate('/provider/dashboard');
                }}
                title="Modifiche Salvate"
                message="Il servizio è stato aggiornato con successo."
            />
            {showError && <ErrorModal message={errorMessage} onClose={() => setShowError(false)} />}
        </div>
    );
};

export const BnBServiceEdit = withAuthProtection(BnBServiceEditBase, ['PROVIDER', "BNB"]);

export default BnBServiceEdit;

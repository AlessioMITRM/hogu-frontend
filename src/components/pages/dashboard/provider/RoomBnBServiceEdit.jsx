import { useState, useMemo, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';
import CurrencyInput from 'react-currency-input-field';
import {
    MapPin, ChevronRight, Save, Upload, Trash2, Plus, Eye, EyeOff, Home, Users, Bath, GripVertical, X, Navigation, ArrowLeft, Euro
} from 'lucide-react';

import { withAuthProtection } from '../../auth/withAuthProtection.jsx';
import { bnbService } from '../../../../api/apiClient.js';
import { HOGU_COLORS, HOGU_THEME } from '../../../../config/theme.js';
import { Breadcrumbs } from '../../../../components/ui/Breadcrumbs.jsx';
import SuccessModal from '../../../ui/SuccessModal.jsx';
import ErrorModal from '../../../ui/ErrorModal.jsx';
import LoadingScreen from '../../../ui/LoadingScreen.jsx';
import SafeImage from '../../../ui/SafeImage.jsx';


// --- COMPONENTI UI DI SUPPORTO ---

const EditableInput = ({ label, value, onChange, type = "text", className = "", large = false, placeholder = "", icon: Icon, ...rest }) => (
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
                {...rest}
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

export const RoomBnBServiceEditBase = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEditMode = !!id;

    // --- STATE MANAGEMENT ---
    const [isLoading, setIsLoading] = useState(isEditMode);
    const [isSaving, setIsSaving] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [showError, setShowError] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        price: '',
        maxGuests: 1,
        isActive: true,
        amenities: [],
        images: []
    });

    const [images, setImages] = useState([]);
    const [newImages, setNewImages] = useState([]);
    const fileInputRef = useRef(null);
    const [pricePeriods, setPricePeriods] = useState([]);

    // --- FETCH DATA ---
    useEffect(() => {
        if (!isEditMode) {
            setIsLoading(false);
            return;
        }

        const fetchData = async () => {
            if (!id) return;

            setIsLoading(true);
            try {
                const data = await bnbService.getRoomProvider(id);

                setFormData({
                    title: data.name || '',
                    description: data.description || '',
                    price: data.priceForNight != null ? data.priceForNight.toString() : '',
                    maxGuests: data.maxGuests || 1,
                    isActive: (data.available ?? data.publicationStatus) ?? true,
                    amenities: [],
                    images: data.images || []
                });

                setImages(
                    data.images && data.images.length > 0 && data.bnbServiceId && data.id
                        ? data.images.map(filename => `/files/bnb/${data.bnbServiceId}/${data.id}/${filename}`)
                        : []
                );

                const periods = data.priceCalendar || data.pricePeriods || data.roomPrices || [];
                setPricePeriods(
                    Array.isArray(periods)
                        ? periods.map(p => ({
                            id: p.id || null,
                            startDate: p.startDate || '',
                            endDate: p.endDate || '',
                            pricePerNight: p.pricePerNight != null ? p.pricePerNight.toString() : ''
                        }))
                        : []
                );

            } catch (error) {
                console.error("Errore caricamento dati:", error);
                setErrorMessage("Errore nel caricamento dei dati del servizio.");
                setShowError(true);
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

    const handlePeriodChange = (index, field, value) => {
        setPricePeriods(prev => {
            const updated = prev.map((p, i) =>
                i === index ? { ...p, [field]: value } : p
            );

            const current = updated[index];
            if (!current.startDate || !current.endDate) {
                return updated;
            }

            const currentStart = new Date(current.startDate);
            const currentEnd = new Date(current.endDate);
            if (isNaN(currentStart.getTime()) || isNaN(currentEnd.getTime())) {
                return updated;
            }

            if (currentStart > currentEnd) {
                return updated;
            }

            for (let i = 0; i < updated.length; i++) {
                if (i === index) continue;
                const other = updated[i];
                if (!other.startDate || !other.endDate) continue;

                const otherStart = new Date(other.startDate);
                const otherEnd = new Date(other.endDate);
                if (isNaN(otherStart.getTime()) || isNaN(otherEnd.getTime())) continue;

                const noOverlap = currentEnd < otherStart || currentStart > otherEnd;
                if (!noOverlap) {
                    setErrorMessage("Attenzione: il periodo selezionato si sovrappone a un altro periodo di prezzo.");
                    setShowError(true);
                    return prev;
                }
            }

            return updated;
        });
    };

    const addPeriod = () => {
        setPricePeriods(prev => [
            ...prev,
            { id: null, startDate: '', endDate: '', pricePerNight: '' }
        ]);
    };

    const removePeriod = (indexToRemove) => {
        setPricePeriods(prev => prev.filter((_, index) => index !== indexToRemove));
    };

    const handleSave = async () => {
        // --- VALIDAZIONE ---
        if (!formData.title || !formData.description || !formData.price || !formData.maxGuests) {
            setErrorMessage("Tutti i campi sono obbligatori: Nome, Descrizione, Prezzo e Max Ospiti.");
            setShowError(true);
            return;
        }

        if (formData.description.length < 270 || formData.description.length > 1000) {
            setErrorMessage("La descrizione deve essere compresa tra 270 e 1000 caratteri.");
            setShowError(true);
            return;
        }

        const totalImages = images.length + newImages.length;
        if (totalImages < 6) {
            setErrorMessage("Devi inserire almeno 6 immagini per la camera.");
            setShowError(true);
            return;
        }

        // Validazione Periodi
        if (pricePeriods.length > 0) {
            // Verifica date valide
            for (const p of pricePeriods) {
                if (!p.startDate || !p.endDate || !p.pricePerNight) {
                    setErrorMessage("Tutti i campi dei periodi di prezzo devono essere compilati.");
                    setShowError(true);
                    return;
                }
                if (new Date(p.startDate) > new Date(p.endDate)) {
                    setErrorMessage(`La data di inizio non può essere successiva alla data di fine nel periodo: ${p.startDate}`);
                    setShowError(true);
                    return;
                }
            }

            // Verifica sovrapposizioni
            const sortedPeriods = [...pricePeriods].sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
            for (let i = 0; i < sortedPeriods.length - 1; i++) {
                const current = sortedPeriods[i];
                const next = sortedPeriods[i + 1];

                if (new Date(current.endDate) >= new Date(next.startDate)) {
                    setErrorMessage(`Attenzione: I periodi si sovrappongono tra ${current.startDate} - ${current.endDate} e ${next.startDate} - ${next.endDate}`);
                    setShowError(true);
                    return;
                }
            }
        }

        setIsSaving(true);
        try {
            // Prepare payload object for JSON serialization
            const payload = {
                name: formData.title,
                description: formData.description,
                priceForNight: formData.price ? parseFloat(formData.price.toString().replace(',', '.')) : null,
                maxGuests: formData.maxGuests,
                available: formData.isActive,
                priceCalendar: pricePeriods.map(p => ({
                    id: p.id,
                    startDate: p.startDate,
                    endDate: p.endDate,
                    pricePerNight: p.pricePerNight ? parseFloat(p.pricePerNight.toString().replace(',', '.')) : null
                }))
            };

            const updateData = new FormData();
            // Append JSON data as a Blob with application/json type
            updateData.append('data', new Blob([JSON.stringify(payload)], { type: 'application/json' }));

            // Append existing images (converted back to File)
            if (images.length > 0) {
                const existingFiles = await Promise.all(images.map(async (imgUrl) => {
                    try {
                        const response = await fetch(imgUrl);
                        const blob = await response.blob();
                        const filename = imgUrl.substring(imgUrl.lastIndexOf('/') + 1);
                        return new File([blob], filename, { type: blob.type });
                    } catch (err) {
                        console.error("Errore conversione immagine esistente:", err);
                        return null;
                    }
                }));

                existingFiles.forEach(file => {
                    if (file) updateData.append('images', file);
                });
            }

            // Append new images
            newImages.forEach(img => {
                updateData.append('images', img.file);
            });

            if (isEditMode) {
                await bnbService.updateRoomProvider(id, updateData);
            } else {
                await bnbService.createRoomProvider(updateData);
            }

            setShowSuccess(true);
            setNewImages([]); // Clear new images buffer

            if (!isEditMode) {
                // Se è creazione, torniamo alla dashboard dopo un breve ritardo o tramite il modal
                setTimeout(() => navigate('/provider/dashboard'), 2000);
            }

            if (isEditMode) {
                const data = await bnbService.getRoomProvider(id);
                setImages(
                    data.images && data.images.length > 0 && data.bnbServiceId && data.id
                        ? data.images.map(filename => `/files/bnb/${data.bnbServiceId}/${data.id}/${filename}`)
                        : []
                );
            }

        } catch (error) {
            console.error("Errore salvataggio:", error);
            setErrorMessage("Errore durante il salvataggio delle modifiche.");
            setShowError(true);
        } finally {
            setIsSaving(false);
        }
    };

    const removeImage = (indexToRemove) => {
        setImages(prev => prev.filter((_, index) => index !== indexToRemove));
    };

    const handleImageUpload = (e) => {
        const files = Array.from(e.target.files);
        if (!files.length) return;
        const newBlobs = files.map(file => ({ file, preview: URL.createObjectURL(file) }));
        setNewImages(prev => [...prev, ...newBlobs]);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const removeNewImage = (indexToRemove) => {
        setNewImages(prev => {
            const updated = prev.filter((_, index) => index !== indexToRemove);
            URL.revokeObjectURL(prev[indexToRemove].preview);
            return updated;
        });
    };

    const breadcrumbsItems = [
        { label: 'Dashboard', href: '/provider/dashboard' },
        { label: isEditMode ? 'Modifica Camera' : 'Crea Camera', href: '#' }
    ];

    return (
        <div className={`min-h-screen bg-[#F8FAFC] pb-20 ${HOGU_THEME.fontFamily}`}>
            <LoadingScreen isLoading={isLoading || isSaving} />
            <SuccessModal
                isOpen={showSuccess}
                onClose={() => setShowSuccess(false)}
                title="Camera Aggiornata"
                message="Le modifiche sono state salvate con successo!"
            />
            {showError && <ErrorModal onClose={() => setShowError(false)} message={errorMessage} />}
            <div className="bg-white pt-12 pb-24 px-4 lg:px-8 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-96 h-96 bg-black/5 rounded-full blur-3xl -translate-y-1/2 -translate-x-1/3" />
                <div className="absolute top-0 right-0 w-96 h-96 bg-black/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
                <div className="max-w-7xl mx-auto relative z-10">
                    <Breadcrumbs items={breadcrumbsItems} />
                    <span className="text-gray-900 mt-6 font-bold tracking-wider text-xs uppercase mb-3 block flex items-center gap-2">
                        <div className="w-8 h-[1px] bg-gray-900" /> Servizio B&B / Camere
                    </span>
                    <h1 className={`text-3xl md:text-5xl font-extrabold text-[${HOGU_COLORS.dark}] mb-2 tracking-tight leading-tight`}>
                        {isEditMode ? 'Modifica Camera' : 'Crea Nuova Camera'}
                    </h1>
                    <p className={`text-lg text-[${HOGU_COLORS.subtleText}] max-w-xl leading-relaxed`}>
                        Gestisci descrizione, prezzi e foto della tua camera.
                    </p>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 lg:px-8 -mt-16 relative z-20">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-10">

                    <div className="lg:col-span-2 space-y-8">
                        <section className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100">
                            <div className="mb-6">
                                <EditableInput
                                    label="Nome Camera / Servizio *"
                                    value={formData.title}
                                    onChange={(val) => handleInputChange('title', val)}
                                    large={true}
                                    className="mb-6"
                                />
                            </div>

                            <div className="space-y-6">
                                <EditableTextarea
                                    label="Descrizione Camera *"
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
                                Prezzo e Capienza
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="relative">
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 ml-1">Prezzo per Notte (€) *</label>
                                    <div className="relative">
                                        <CurrencyInput
                                            id="price"
                                            name="price"
                                            value={formData.price}
                                            onValueChange={(val) => handleInputChange('price', val)}
                                            placeholder="0,00"
                                            decimalsLimit={2}
                                            decimalScale={2}
                                            decimalSeparator=","
                                            groupSeparator="."
                                            prefix="€ "
                                            className={`${HOGU_THEME.inputBase} pl-4 font-bold text-xl`}
                                        />
                                    </div>
                                </div>

                                <EditableInput
                                    label="Max Ospiti *"
                                    value={formData.maxGuests}
                                    onChange={(val) => handleInputChange('maxGuests', val)}
                                    type="number"
                                    icon={Users}
                                />
                            </div>
                            <div className="mt-8 space-y-4">
                                <h4 className="text-sm font-bold text-gray-700">Periodi di prezzo</h4>
                                {pricePeriods.map((p, index) => (
                                    <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
                                        <EditableInput
                                            label="Data inizio"
                                            value={p.startDate}
                                            onChange={(val) => handlePeriodChange(index, 'startDate', val)}
                                            type="date"
                                            max={p.endDate || undefined}
                                        />
                                        <EditableInput
                                            label="Data fine"
                                            value={p.endDate}
                                            onChange={(val) => handlePeriodChange(index, 'endDate', val)}
                                            type="date"
                                            min={p.startDate || undefined}
                                        />
                                        <div className="relative">
                                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 ml-1">Prezzo (€)</label>
                                            <CurrencyInput
                                                id={`price-${index}`}
                                                name={`price-${index}`}
                                                value={p.pricePerNight}
                                                onValueChange={(val) => handlePeriodChange(index, 'pricePerNight', val)}
                                                placeholder="0,00"
                                                decimalsLimit={2}
                                                decimalScale={2}
                                                decimalSeparator=","
                                                groupSeparator="."
                                                prefix="€ "
                                                className={`${HOGU_THEME.inputBase} pl-4 font-bold text-sm`}
                                            />
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => removePeriod(index)}
                                            className="h-11 px-3 rounded-xl border border-red-100 text-red-500 text-sm font-bold hover:bg-red-50 transition-colors flex items-center justify-center"
                                        >
                                            <Trash2 size={16} className="mr-1" /> Rimuovi
                                        </button>
                                    </div>
                                ))}
                                <button
                                    type="button"
                                    onClick={addPeriod}
                                    className="inline-flex items-center px-3 py-2 rounded-xl border border-slate-200 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                                >
                                    <Plus size={16} className="mr-1" /> Aggiungi periodo
                                </button>
                            </div>
                        </section>


                    </div>

                    <div className="space-y-8">
                        <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100">
                            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center justify-between">
                                Galleria Foto
                                <span className="text-xs font-normal text-gray-400">{images.length + newImages.length} foto</span>
                            </h3>

                            <div className="grid grid-cols-2 gap-2 mb-4">
                                {images.map((img, idx) => (
                                    <ImageUploadCard
                                        key={`old-${idx}`}
                                        src={img}
                                        onDelete={() => removeImage(idx)}
                                        isMain={idx === 0}
                                    />
                                ))}
                                {newImages.map((item, idx) => (
                                    <ImageUploadCard
                                        key={`new-${idx}`}
                                        src={item.preview}
                                        onDelete={() => removeNewImage(idx)}
                                    />
                                ))}
                                <div
                                    onClick={() => fileInputRef.current?.click()}
                                    className="aspect-square rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-2 text-gray-400 hover:border-[#68B49B] hover:text-[#68B49B] hover:bg-[#68B49B]/5 transition-all group cursor-pointer"
                                >
                                    <div className="p-3 bg-gray-50 rounded-full group-hover:bg-white transition-colors">
                                        <Upload size={20} />
                                    </div>
                                    <span className="text-xs font-bold">Aggiungi</span>
                                </div>
                            </div>
                            <input
                                ref={fileInputRef}
                                type="file"
                                multiple
                                accept="image/*"
                                className="hidden"
                                onChange={handleImageUpload}
                            />

                            <div className="mt-6 pt-4 border-t border-gray-100">
                                <h4 className="text-sm font-bold text-gray-900 mb-4">Pubblicazione</h4>
                                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
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
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100 flex flex-col md:flex-row items-center justify-between gap-4 mt-8 sticky bottom-4 z-40">
                    <div className="flex-1 flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-600">Stato pubblicazione:</span>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${formData.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}>
                                {formData.isActive ? 'ATTIVO' : 'BOZZA'}
                            </span>
                        </div>
                        <div className="text-sm text-gray-500 font-medium">
                            <span className="text-red-500 font-bold">*</span> I campi contrassegnati sono obbligatori.
                            <br />
                            <span className="text-red-500 font-bold">*</span> Inserire almeno 6 immagini.
                        </div>
                    </div>
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className={`w-full md:w-auto px-10 py-4 rounded-xl font-bold text-white shadow-lg shadow-[${HOGU_COLORS.primary}]/20 hover:shadow-xl hover:-translate-y-1 transition-all flex items-center justify-center gap-2 bg-[#68B49B] ${isSaving ? 'opacity-70 cursor-not-allowed' : ''
                            }`}
                    >
                        <Save size={20} />
                        {isSaving ? 'Salvataggio...' : 'Salva Modifiche'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export const RoomBnBServiceEdit = withAuthProtection(RoomBnBServiceEditBase, ['PROVIDER', "BNB"]);

export default RoomBnBServiceEdit;

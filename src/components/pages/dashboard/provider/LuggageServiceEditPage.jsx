import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import CurrencyInput from 'react-currency-input-field'; // ← Libreria aggiunta
import { withAuthProtection } from '../../auth/withAuthProtection.jsx';
import { luggageService } from '../../../../api/apiClient.js';
import { Breadcrumbs } from '../../../../components/ui/Breadcrumbs.jsx';
import { CityAutocomplete } from '../../../ui/CityAutocomplete';
import {
  getDisplayLocation,
  createLocationPayload
} from '../../../../utils/locationUtils';
import { MAX_IMAGE_SIZE_BYTES, splitFilesByMaxSize, buildOversizedFilesMessage } from '../../../../utils/imageValidation';
import SuccessModal from '../../../ui/SuccessModal.jsx';
import ErrorModal from '../../../ui/ErrorModal.jsx';
import LoadingScreen from '../../../ui/LoadingScreen.jsx';
import SafeImage from '../../../ui/SafeImage.jsx';


import {
  Clock, MapPin, Check, Backpack, Briefcase, Package,
  ChevronRight, Save, Upload, Trash2, Plus, Eye, EyeOff, Warehouse, Navigation, DollarSign,
  AlertCircle
} from 'lucide-react';

const HOGU_COLORS = {
  primary: '#68B49B',
  dark: '#1A202C',
  lightAccent: '#E6F5F0',
  subtleText: '#4A5568',
  error: '#EF4444'
};

const HOGU_THEME = {
  bg: 'bg-white',
  text: `text-[${HOGU_COLORS.dark}]`,
  inputBase: 'w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:ring-2 focus:ring-[#68B49B]/20 focus:border-[#68B49B] outline-none transition-all placeholder:text-gray-400 text-gray-800',
  cardBase: 'bg-white rounded-[2rem] shadow-sm border border-gray-100',
  fontFamily: 'font-sans'
};

/* --------------  LOCATION UTILS  -------------- */
// Logic moved to src/utils/locationUtils.js


/* --------------  CityAutocomplete  -------------- */
// Moved to src/components/ui/CityAutocomplete.jsx

/* --------------  EditableInput & Textarea  -------------- */
const EditableInput = ({ label, value, onChange, type = 'text', large = false, placeholder = '', icon: Icon, className = '', required = false }) => (
  <div className={`group ${className}`}>
    {label && (
      <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 ml-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
    )}
    <div className="relative">
      {Icon && <Icon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />}
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className={`${HOGU_THEME.inputBase} ${large ? 'text-2xl font-bold' : 'text-base'} ${Icon ? 'pl-11' : ''}`}
      />
    </div>
  </div>
);

const EditableTextarea = ({ label, value, onChange, rows = 4, required = false }) => (
  <div className="group">
    {label && (
      <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 ml-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
    )}
    <textarea
      value={value}
      onChange={e => onChange(e.target.value)}
      rows={rows}
      className={`${HOGU_THEME.inputBase} resize-none leading-relaxed`}
    />
  </div>
);

/* --------------  ImageUploadCard  -------------- */
const ImageUploadCard = ({ src, onDelete, isMain = false, isNew = false }) => {
  const { t } = useTranslation();
  return (
    <div className={`relative rounded-2xl overflow-hidden group ${isMain ? 'col-span-2 row-span-2 aspect-video' : 'aspect-[4/3]'}`}>
      <SafeImage src={src} alt="Gallery" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-2">
        <button
          onClick={onDelete}
          className="p-3 bg-white/90 hover:bg-red-500 hover:text-white rounded-full text-red-600 transition-all shadow-lg"
        >
          <Trash2 size={22} />
        </button>
        {isMain && (
          <span className="absolute bottom-4 left-4 bg-[#68B49B] text-white text-xs px-3 py-1.5 rounded-md font-bold">
            Copertina
          </span>
        )}
        {isNew && (
          <span className="absolute top-4 left-4 bg-blue-500 text-white text-xs px-3 py-1.5 rounded-md font-bold">
            Nuova
          </span>
        )}
      </div>
    </div>
  );
};

/* --------------  LuggageSizePriceCard con CurrencyInput  -------------- */
const LuggageSizePriceCard = ({ size, label, icon: Icon, description, priceDay, priceHour, onPriceDayChange, onPriceHourChange, onDescChange }) => (
  <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 hover:border-[#68B49B]/30 transition-all">
    <div className="flex items-start gap-4 mb-4">
      <div className="p-3 bg-white rounded-xl shadow-sm">
        <Icon size={32} className="text-[#68B49B]" />
      </div>
      <div className="flex-1">
        <h4 className="font-bold text-gray-900 text-lg">{label}</h4>
        <input
          type="text"
          value={description}
          onChange={e => onDescChange(e.target.value)}
          placeholder="es. Zaino o borsa piccola - max 40cm"
          className="w-full mt-2 px-4 py-2 rounded-lg border border-gray-200 text-sm focus:border-[#68B49B] outline-none"
        />
      </div>
    </div>

    <div className="grid grid-cols-2 gap-4">
      {/* Prezzo / Ora */}
      <div className="relative">
        <label className="text-xs font-bold text-gray-400 uppercase">Prezzo / Ora</label>
        <div className="relative mt-2">
          <CurrencyInput
            id={`price-hour-${size}`}
            name={`price-hour-${size}`}
            value={priceHour}
            onValueChange={(value) => onPriceHourChange(value || '')}
            placeholder="0,00"
            decimalsLimit={2}
            decimalScale={2}
            decimalSeparator=","
            groupSeparator="."
            prefix="€ "
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 font-bold text-xl focus:border-[#68B49B] outline-none"
          />
        </div>
      </div>

      {/* Prezzo / Giorno */}
      <div className="relative">
        <label className="text-xs font-bold text-gray-400 uppercase">Prezzo / Giorno</label>
        <div className="relative mt-2">
          <CurrencyInput
            id={`price-day-${size}`}
            name={`price-day-${size}`}
            value={priceDay}
            onValueChange={(value) => onPriceDayChange(value || '')}
            placeholder="0,00"
            decimalsLimit={2}
            decimalScale={2}
            decimalSeparator=","
            groupSeparator="."
            prefix="€ "
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 font-bold text-xl focus:border-[#68B49B] outline-none"
          />
        </div>
      </div>
    </div>
  </div>
);

/* =========================================================
 * PAGINA PRINCIPALE - DEPOSITO BAGAGLI
 * ========================================================= */
export const LuggageServiceEditPageBase = () => {
  const { t, i18n } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!id;

  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(isEditMode);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    city: '',
    address: '',
    publicationStatus: true,
    openingTime: '08:00',
    closingTime: '20:00',
    closedOnHolidaysAndSunday: true,
    capacity: 50,
    sizes: {
      SMALL: { description: 'Zaino o borsa piccola - max 40cm', pricePerDay: '', pricePerHour: '' },
      MEDIUM: { description: 'Trolley cabina - fino a 65cm', pricePerDay: '', pricePerHour: '' },
      LARGE: { description: 'Valigia grande - oltre 65cm', pricePerDay: '', pricePerHour: '' }
    }
  });

  const [images, setImages] = useState([]);
  const [newImages, setNewImages] = useState([]);
  const fileInputRef = useRef(null);

  const handle = (field, value) => setFormData(p => ({ ...p, [field]: value }));
  const handleSize = (size, field, value) => setFormData(p => ({
    ...p,
    sizes: { ...p.sizes, [size]: { ...p.sizes[size], [field]: value } }
  }));

  // Calcolo basePrice automatico (solo prezzi validi)
  const calculatedBasePrice = Math.min(
    ...(Object.values(formData.sizes)
      .map(s => parseFloat(s.pricePerDay?.toString().replace(',', '.')) || Infinity)
      .filter(v => v !== Infinity))
  );
  const basePrice = calculatedBasePrice === Infinity ? 0 : calculatedBasePrice;

  const validate = () => {
    const errors = [];
    if (!formData.name.trim()) errors.push('Il nome del deposito è obbligatorio');
    if (!formData.city.trim()) errors.push('La città è obbligatoria');
    if (!formData.address.trim()) errors.push('L\'indirizzo è obbligatorio');
    if (!formData.description.trim()) errors.push('La descrizione è obbligatoria');
    if (!formData.openingTime || !formData.closingTime) errors.push('Orari di apertura e chiusura obbligatori');
    if (formData.openingTime >= formData.closingTime) errors.push('L\'orario di chiusura deve essere successivo all\'apertura');
    if (!formData.capacity || formData.capacity < 1) errors.push('La capacità deve essere almeno 1');

    const totalImages = images.length + newImages.length;
    if (totalImages < 6) errors.push(`Devi caricare almeno 6 immagini (attuali: ${totalImages})`);

    if (basePrice <= 0) errors.push('Almeno una categoria deve avere un prezzo maggiore di 0€');

    if (errors.length > 0) {
      console.log("Validation errors:", errors);
    }
    return errors;
  };

  /* ------  CARICAMENTO DATI ------ */
  useEffect(() => {
    if (!isEditMode) {
      setIsLoading(false);
      return;
    }

    const fetchLuggage = async () => {
      try {
        setIsLoading(true);
        const res = await luggageService.getLuggageProvider(id);
        const data = res;

        const cityStr = getDisplayLocation(data.locales?.[0] || data.serviceLocale?.[0], i18n.language);

        let openingTime = '08:00';
        let closingTime = '20:00';
        let closedOnHolidaysAndSunday = true;

        if (data.openingHours && data.openingHours.length > 0) {
          const monday = data.openingHours.find(h => h.dayOfWeek === 1);
          if (monday) {
            openingTime = monday.openingTime || '08:00';
            closingTime = monday.closingTime || '20:00';
          }
          const sunday = data.openingHours.find(h => h.dayOfWeek === 7);
          closedOnHolidaysAndSunday = sunday?.closed ?? true;
        }

        const sizes = {
          SMALL: { description: '', pricePerDay: '', pricePerHour: '' },
          MEDIUM: { description: '', pricePerDay: '', pricePerHour: '' },
          LARGE: { description: '', pricePerDay: '', pricePerHour: '' }
        };

        const sizePricesData = data.sizePrices || data.luggageSizePrices;
        if (sizePricesData) {
          sizePricesData.forEach(p => {
            if (sizes[p.sizeLabel]) {
              sizes[p.sizeLabel] = {
                description: p.description || '',
                pricePerDay: p.pricePerDay != null ? p.pricePerDay.toString() : '',
                pricePerHour: p.pricePerHour != null ? p.pricePerHour.toString() : ''
              };
            }
          });
        }

        setFormData({
          name: data.name || '',
          description: data.description || '',
          city: cityStr,
          address: data.locales?.[0]?.address || data.serviceLocale?.[0]?.address || '',
          publicationStatus: data.publicationStatus ?? data.available ?? true,
          openingTime,
          closingTime,
          closedOnHolidaysAndSunday,
          capacity: data.capacity || 50,
          sizes
        });

        const loadedImages = Array.isArray(data.images)
          ? data.images.map(filename => `/files/luggage/${id}/${filename}`)
          : [];
        setImages(loadedImages);
      } catch (e) {
        console.error(e);
        setErrorMessage('Errore nel caricamento del deposito');
        setShowError(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLuggage();
  }, [id, isEditMode]);

  /* ------  GESTIONE IMMAGINI ------ */
  const handleImageUpload = (e) => {
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
  };

  const handleDeleteExisting = (idx) => setImages(prev => prev.filter((_, i) => i !== idx));
  const handleDeleteNew = (idx, preview) => {
    setNewImages(prev => prev.filter((_, i) => i !== idx));
    URL.revokeObjectURL(preview);
  };

  /* ------  SALVATAGGIO ------ */
  const handleSave = async () => {
    const errors = validate();
    if (errors.length) {
      setErrorMessage(errors.join('\n'));
      setShowError(true);
      return;
    }

    setIsSaving(true);

    try {
      // Use centralized location payload creation
      const locales = createLocationPayload(formData.city, formData.address, 'LUGGAGE');

      const openingHours = [];
      for (let day = 1; day <= 7; day++) {
        const isSunday = day === 7;
        const closed = formData.closedOnHolidaysAndSunday && isSunday;
        openingHours.push({
          dayOfWeek: day,
          openingTime: formData.openingTime,
          closingTime: formData.closingTime,
          closed
        });
      }

      const sizePrices = Object.entries(formData.sizes).map(([sizeLabel, info]) => ({
        sizeLabel,
        pricePerDay: info.pricePerDay ? parseFloat(info.pricePerDay.toString().replace(',', '.')) : 0,
        pricePerHour: info.pricePerHour ? parseFloat(info.pricePerHour.toString().replace(',', '.')) : 0,
        description: info.description.trim() || null
      }));

      const payload = {
        name: formData.name,
        description: formData.description,
        locales: locales,
        capacity: parseInt(formData.capacity, 10) || null,
        basePrice: basePrice,
        publicationStatus: formData.publicationStatus,
        openingHours,
        sizePrices
      };

      const formDataToSend = new FormData();
      formDataToSend.append('data', new Blob([JSON.stringify(payload)], { type: 'application/json' }));

      // Process images in parallel to avoid hanging
      const imagePromises = images.map(async (url) => {
        try {
          // Check if URL is valid
          if (!url) return null;

          // If it's a relative URL, fetch might need full path if not proxied correctly, 
          // but usually relative works with fetch in browser.
          // Adding a timeout is crucial.
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

          const response = await fetch(url, { signal: controller.signal });
          clearTimeout(timeoutId);

          if (!response.ok) {
            console.warn(`Failed to fetch image ${url}: ${response.status}`);
            return null;
          }

          const blob = await response.blob();
          const filename = url.split('/').pop() || 'image.jpg';
          return new File([blob], filename, { type: blob.type });
        } catch (err) {
          console.error('Error processing image:', url, err);
          return null;
        }
      });

      const processedImages = await Promise.all(imagePromises);
      processedImages.forEach(file => {
        if (file) formDataToSend.append('images', file);
      });

      newImages.forEach(item => formDataToSend.append('images', item.file));

      console.log("Sending request...", payload); // Debug log

      if (isEditMode) {
        await luggageService.updateLuggageProvider(id, formDataToSend);
      } else {
        await luggageService.createLuggageProvider(formDataToSend);
      }

      setShowSuccess(true);
      setNewImages([]);
      const updatedPreviews = [...images, ...newImages.map(i => i.preview)];
      setImages(updatedPreviews);
    } catch (e) {
      console.error("Save error:", e);
      setErrorMessage(e.message || 'Errore durante il salvataggio');
      setShowError(true);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <LoadingScreen isLoading={true} />;

  const breadcrumbsItems = [
    { label: 'Dashboard', href: '/provider/dashboard' },
    { label: isEditMode ? 'Modifica Deposito' : 'Crea Deposito', href: '#' }
  ];

  return (
    <div className={`min-h-screen bg-[#F8FAFC] pb-20 ${HOGU_THEME.fontFamily}`}>
      {/* HERO */}
      <div className="bg-white pt-12 pb-24 px-4 lg:px-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-96 h-96 bg-black/5 rounded-full blur-3xl -translate-y-1/2 -translate-x-1/3" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-black/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
        <div className="max-w-7xl mx-auto relative z-10">
          <Breadcrumbs items={breadcrumbsItems} />
          <span className="text-gray-900 mt-6 font-bold tracking-wider text-xs uppercase mb-3 block flex items-center gap-2">
            <div className="w-8 h-[1px] bg-gray-900" /> Servizio Deposito Bagagli
          </span>
          <h1 className={`text-3xl md:text-5xl font-extrabold text-[${HOGU_COLORS.dark}] mb-2 tracking-tight leading-tight`}>
            {isEditMode ? 'Modifica Deposito' : 'Crea Nuovo Deposito'}
          </h1>
          <p className={`text-lg text-[${HOGU_COLORS.subtleText}] max-w-xl leading-relaxed`}>
            Configura orari, prezzi e dettagli del tuo punto deposito bagagli.
          </p>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="max-w-7xl mx-auto px-4 lg:px-8 -mt-16 relative z-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-10">
          {/* LEFT */}
          <div className="lg:col-span-2 space-y-8">
            {/* INFO BASE */}
            <section className={`${HOGU_THEME.cardBase} p-8`}>
              <EditableInput
                label="Nome del Deposito"
                value={formData.name}
                onChange={v => handle('name', v)}
                large
                className="mb-6"
                required
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <CityAutocomplete
                  label="Città *"
                  value={formData.city}
                  onChange={v => handle('city', v)}
                  icon={MapPin}
                />
                <EditableInput
                  label="Indirizzo completo"
                  value={formData.address}
                  onChange={v => handle('address', v)}
                  icon={Navigation}
                  placeholder="Via Example 123, 00100 Roma"
                  required
                />
              </div>

              {/* ORARI */}
              <div className="mb-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Clock size={22} className="text-[#68B49B]" /> Orario Standard
                </h3>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <EditableInput
                    label="Apertura"
                    type="time"
                    value={formData.openingTime}
                    onChange={v => handle('openingTime', v)}
                    required
                  />
                  <EditableInput
                    label="Chiusura"
                    type="time"
                    value={formData.closingTime}
                    onChange={v => handle('closingTime', v)}
                    required
                  />
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                  <AlertCircle size={20} className="text-amber-600 mt-0.5" />
                  <div>
                    <p className="font-bold text-amber-900 text-sm">Festivi e Domenica</p>
                    <div className="mt-2 space-y-2">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="radio"
                          name="holidayPolicy"
                          checked={!formData.closedOnHolidaysAndSunday}
                          onChange={() => handle('closedOnHolidaysAndSunday', false)}
                          className="w-4 h-4 text-[#68B49B]"
                        />
                        <span className="text-sm">Sempre aperto (anche domenica e festivi)</span>
                      </label>
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="radio"
                          name="holidayPolicy"
                          checked={formData.closedOnHolidaysAndSunday}
                          onChange={() => handle('closedOnHolidaysAndSunday', true)}
                          className="w-4 h-4 text-[#68B49B]"
                        />
                        <span className="text-sm">Chiuso la domenica e nei principali festivi europei</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              <EditableTextarea
                label="Descrizione e istruzioni per i clienti (visibile dopo prenotazione)"
                value={formData.description}
                onChange={v => handle('description', v)}
                rows={5}
                required
              />
            </section>

            {/* PREZZI */}
            <section className={`${HOGU_THEME.cardBase} p-8`}>
              <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <DollarSign size={24} className={`text-[${HOGU_COLORS.primary}]`} />
                Prezzi per Bagaglio al Giorno
              </h3>
              <div className="space-y-6">
                <LuggageSizePriceCard
                  size="SMALL"
                  label="Small"
                  icon={Backpack}
                  description={formData.sizes.SMALL.description}
                  priceDay={formData.sizes.SMALL.pricePerDay}
                  priceHour={formData.sizes.SMALL.pricePerHour}
                  onPriceDayChange={v => handleSize('SMALL', 'pricePerDay', v)}
                  onPriceHourChange={v => handleSize('SMALL', 'pricePerHour', v)}
                  onDescChange={v => handleSize('SMALL', 'description', v)}
                />
                <LuggageSizePriceCard
                  size="MEDIUM"
                  label="Medium"
                  icon={Briefcase}
                  description={formData.sizes.MEDIUM.description}
                  priceDay={formData.sizes.MEDIUM.pricePerDay}
                  priceHour={formData.sizes.MEDIUM.pricePerHour}
                  onPriceDayChange={v => handleSize('MEDIUM', 'pricePerDay', v)}
                  onPriceHourChange={v => handleSize('MEDIUM', 'pricePerHour', v)}
                  onDescChange={v => handleSize('MEDIUM', 'description', v)}
                />
                <LuggageSizePriceCard
                  size="LARGE"
                  label="Large"
                  icon={Package}
                  description={formData.sizes.LARGE.description}
                  priceDay={formData.sizes.LARGE.pricePerDay}
                  priceHour={formData.sizes.LARGE.pricePerHour}
                  onPriceDayChange={v => handleSize('LARGE', 'pricePerDay', v)}
                  onPriceHourChange={v => handleSize('LARGE', 'pricePerHour', v)}
                  onDescChange={v => handleSize('LARGE', 'description', v)}
                />
              </div>
            </section>

            {/* GALLERY */}
            <section className={`${HOGU_THEME.cardBase} p-8`}>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-900 flex items-center justify-between">
                  Foto del Deposito
                  <span className="text-xs font-normal text-gray-400">{images.length + newImages.length} foto</span>
                </h3>
                <label className={`text-[${HOGU_COLORS.primary}] font-bold text-sm flex items-center gap-2 hover:underline cursor-pointer`}>
                  <Upload size={18} /> Carica immagini
                  <input ref={fileInputRef} type="file" multiple accept="image/*" onChange={handleImageUpload} className="hidden" />
                </label>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {images.map((img, idx) => (
                  <ImageUploadCard key={`old-${idx}`} src={img} isMain={idx === 0} onDelete={() => handleDeleteExisting(idx)} />
                ))}
                {newImages.map((item, idx) => (
                  <ImageUploadCard key={`new-${idx}`} src={item.preview} isNew onDelete={() => handleDeleteNew(idx, item.preview)} />
                ))}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="aspect-[4/3] rounded-2xl border-2 border-dashed border-gray-200 hover:border-[#68B49B] bg-gray-50 flex flex-col items-center justify-center text-gray-400 hover:text-[#68B49B] cursor-pointer transition-all group"
                >
                  <Plus size={32} className="group-hover:scale-110 transition-transform" />
                  <span className="text-xs mt-2">Aggiungi foto</span>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-gray-100">
                <h4 className="text-sm font-bold text-gray-900 mb-4">Pubblicazione</h4>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${formData.publicationStatus ? 'bg-green-100 text-green-600' : 'bg-gray-200 text-gray-500'}`}>
                      {formData.publicationStatus ? <Eye size={20} /> : <EyeOff size={20} />}
                    </div>
                    <div>
                      <p className="font-bold text-sm text-gray-900">Visibilità</p>
                      <p className="text-xs text-gray-500">{formData.publicationStatus ? 'Online' : 'Nascosto'}</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={formData.publicationStatus}
                      onChange={e => handle('publicationStatus', e.target.checked)}
                    />
                    <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#68B49B]"></div>
                  </label>
                </div>
              </div>
            </section>
          </div>

          {/* RIGHT SIDEBAR */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">

              <div className={`${HOGU_THEME.cardBase} p-6 shadow-[0_8px_30px_rgb(0,0,0,0.08)]`}>
                <h3 className="text-lg font-bold text-gray-900 mb-6">Stato Operativo</h3>

                <div className="mb-6">
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                    Capienza Massima (numero bagagli) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Warehouse className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type="number"
                      min="1"
                      value={formData.capacity}
                      onChange={e => handle('capacity', parseInt(e.target.value, 10) || 1)}
                      className={`${HOGU_THEME.inputBase} pl-12`}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100 mb-2">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${formData.publicationStatus ? 'bg-green-100 text-green-600' : 'bg-gray-200 text-gray-500'}`}>
                      {formData.publicationStatus ? <Eye size={20} /> : <EyeOff size={20} />}
                    </div>
                    <div>
                      <p className="font-bold text-sm text-gray-900">Visibilità</p>
                      <p className="text-xs text-gray-500">{formData.publicationStatus ? 'Online' : 'Nascosto'}</p>
                    </div>
                  </div>
                  <span className="text-xs text-gray-500 font-medium">
                    Gestisci lo stato anche dalla sezione foto.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 lg:px-8 mt-8">
        <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100 flex flex-col md:flex-row items-center justify-between gap-4 sticky bottom-4 z-40">
          <div className="flex-1 flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-600">Stato pubblicazione:</span>
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${formData.publicationStatus ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}>
                {formData.publicationStatus ? 'Online' : 'Nascosto'}
              </span>
            </div>
            <div className="text-xs text-gray-500 font-medium">
              I campi contrassegnati con * sono obbligatori.
            </div>
          </div>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className={`w-full md:w-auto px-10 py-4 rounded-xl font-bold text-white shadow-lg shadow-slate-500/20 hover:shadow-xl hover:-translate-y-1 transition-all flex items-center justify-center gap-2 ${isSaving ? 'bg-gray-400 cursor-not-allowed' : 'bg-slate-800 hover:bg-slate-700'
              }`}
          >
            {isSaving ? 'Salvataggio in corso...' : (
              <>
                <Save size={20} />
                {isEditMode ? 'Salva Modifiche' : 'Crea Deposito'}
              </>
            )}
          </button>
        </div>
      </div>

      <SuccessModal
        isOpen={showSuccess}
        onClose={() => {
          setShowSuccess(false);
          if (!isEditMode) navigate('/provider/luggage');
        }}
        title={isEditMode ? 'Deposito Aggiornato' : 'Deposito Creato'}
        message={isEditMode ? 'Le modifiche sono state salvate con successo' : 'Il nuovo deposito è stato creato correttamente'}
        confirmText="Chiudi"
      />

      {showError && <ErrorModal message={errorMessage} onClose={() => setShowError(false)} />}
    </div>
  );
};

export const LuggageServiceEditPage = withAuthProtection(LuggageServiceEditPageBase, ['PROVIDER'], 'LUGGAGE');
export default LuggageServiceEditPage;

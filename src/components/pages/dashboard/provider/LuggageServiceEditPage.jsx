import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { withAuthProtection } from '../../auth/withAuthProtection.jsx';
import { luggageService } from '../../../../api/apiClient.js';
import italianLocationsData from '../../../../assets/data/italian_locations.json';
import englishLocationsData from '../../../../assets/data/english_locations.json';
import { Breadcrumbs } from '../../../../components/ui/Breadcrumbs.jsx';
import SuccessModal from '../../../ui/SuccessModal.jsx';
import ErrorModal from '../../../ui/ErrorModal.jsx';
import LoadingScreen from '../../../ui/LoadingScreen.jsx';

import {
  Clock, MapPin, Info, Check, Backpack, Briefcase, Package,
  ChevronRight, Save, Upload, Trash2, Plus, Eye, EyeOff, Warehouse, Navigation, DollarSign,
  CalendarCheck, CreditCard, FileText, AlertCircle
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
const processLocations = (data) => {
  if (!data) return [];
  const flat = [];
  data.forEach(region =>
    region.provinces.forEach(province =>
      province.cities.forEach(city =>
        flat.push({
          city,
          province: province.name,
          region: region.region,
          fullLabel: `${city}, ${region.region}`,
          searchString: `${city}, ${province.name}, ${region.region}`
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
        })
      )
    )
  );
  return flat;
};

/* --------------  InfoAccordionItem  -------------- */
const InfoAccordionItem = ({ icon: Icon, title, description, colorClass, defaultOpen = false }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-gray-100 last:border-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between py-3 hover:bg-gray-50 transition-colors rounded-lg px-2 -mx-2 group"
      >
        <div className="flex items-center gap-3">
          <div className={`p-1.5 rounded-lg shrink-0 transition-colors ${colorClass}`}><Icon size={16} /></div>
          <span className="font-bold text-sm text-gray-900">{title}</span>
        </div>
        <ChevronRight size={16} className={`text-gray-400 transition-transform duration-300 ${isOpen ? 'rotate-90' : ''}`} />
      </button>
      <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-32 opacity-100 mb-3' : 'max-h-0 opacity-0'}`}>
        <p className="text-xs text-gray-500 leading-relaxed pl-[2.8rem] pr-2">{description}</p>
      </div>
    </div>
  );
};

/* --------------  CityAutocomplete  -------------- */
const CityAutocomplete = ({ label, value, onChange, icon: Icon }) => {
  const { i18n, t } = useTranslation();
  const [suggestions, setSuggestions] = useState([]);
  const [show, setShow] = useState(false);
  const wrapperRef = useRef(null);
  const [inputValue, setInputValue] = useState(value || '');

  useEffect(() => setInputValue(value || ''), [value]);

  const locationData = useMemo(() => {
    const it = i18n.language?.startsWith('it');
    const raw = it ? italianLocationsData : (englishLocationsData || italianLocationsData);
    return processLocations(raw);
  }, [i18n.language]);

  useEffect(() => {
    const outside = e => wrapperRef.current && !wrapperRef.current.contains(e.target) && setShow(false);
    document.addEventListener('mousedown', outside);
    return () => document.removeEventListener('mousedown', outside);
  }, []);

  const handleInputChange = e => {
    const v = e.target.value;
    setInputValue(v);
    onChange(v);
    if (v.length < 2) { setSuggestions([]); setShow(false); return; }
    const norm = v.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const filtered = locationData
      .filter(item => item.searchString.includes(norm))
      .sort((a, b) => {
        const aCity = a.city.toLowerCase();
        const bCity = b.city.toLowerCase();
        const aStarts = aCity.startsWith(norm);
        const bStarts = bCity.startsWith(norm);
        if (aStarts && !bStarts) return -1;
        if (!bStarts && bStarts) return 1;
        return aCity.localeCompare(bCity);
      })
      .slice(0, 8);
    setSuggestions(filtered);
    setShow(true);
  };

  const handleSelect = item => {
    const formatted = `${item.city}, ${item.region}`;
    setInputValue(formatted);
    onChange(formatted);
    setShow(false);
  };

  return (
    <div className="flex flex-col gap-3 flex-[2] min-w-[200px] relative" ref={wrapperRef}>
      <label className={`flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-[${HOGU_COLORS.subtleText}] ml-1`}>
        <Icon size={14} className={`text-[${HOGU_COLORS.primary}]`} /> {label}
      </label>
      <div className="flex gap-2 bg-white p-1.5 rounded-2xl border border-gray-100 shadow-sm focus-within:ring-2 focus-within:ring-[#68B49B]/20 focus-within:border-[#68B49B] transition-all h-[60px] items-center">
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => inputValue.length > 1 && setShow(true)}
          placeholder={t('luggage.location_placeholder', 'Dove si trova il deposito?')}
          className="w-full h-full px-4 bg-transparent border-none focus:ring-0 text-lg font-medium text-gray-800 placeholder:text-gray-400 outline-none"
          autoComplete="off"
        />
        {show && suggestions.length > 0 && (
          <div className="absolute top-full left-0 mt-2 w-full bg-white rounded-xl shadow-xl border border-gray-100 max-h-60 overflow-y-auto z-50">
            {suggestions.map((it, idx) => (
              <button key={idx} type="button" onClick={() => handleSelect(it)} className="w-full text-left px-4 py-3 hover:bg-[#F0FDF9] hover:text-[#33594C] transition-colors border-b border-gray-50 last:border-0 group">
                <div className="font-bold text-sm text-gray-800 group-hover:text-[#33594C]">{it.city}</div>
                <div className="text-xs text-gray-400 group-hover:text-[#68B49B]/70">{it.province}, {it.region}</div>
              </button>
            ))}
          </div>
        )}
        {show && inputValue.length > 1 && suggestions.length === 0 && (
          <div className="absolute top-full left-0 mt-2 w-full bg-white rounded-xl shadow-xl border border-gray-100 p-4 text-center text-gray-400 text-sm z-50">
            Nessuna città trovata
          </div>
        )}
      </div>
    </div>
  );
};

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
      <img src={src} alt="Gallery" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
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

/* --------------  LuggageSizePriceCard  -------------- */
const LuggageSizePriceCard = ({ size, label, icon: Icon, description, price, onPriceChange, onDescChange }) => (
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
    <div className="relative">
      <label className="text-xs font-bold text-gray-400 uppercase">Prezzo al giorno</label>
      <div className="relative mt-2">
        <input
          type="number"
          min="0"
          step="0.01"
          value={price}
          onChange={e => onPriceChange(e.target.value)}
          className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 font-bold text-2xl focus:border-[#68B49B] outline-none"
        />
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-2xl">€</span>
      </div>
    </div>
  </div>
);

/* =========================================================
 * PAGINA PRINCIPALE - DEPOSITO BAGAGLI
 * ========================================================= */
export const LuggageServiceEditPageBase = () => {
  const { t } = useTranslation();
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
    closedOnHolidaysAndSunday: true, // true = chiuso domenica e festivi
    capacity: 50,
    sizes: {
      SMALL: { description: 'Zaino o borsa piccola - max 40cm', pricePerDay: 5 },
      MEDIUM: { description: 'Trolley cabina - fino a 65cm', pricePerDay: 8 },
      LARGE: { description: 'Valigia grande - oltre 65cm', pricePerDay: 12 }
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

  // Calcolo basePrice automatico
  const basePrice = Math.min(
    formData.sizes.SMALL.pricePerDay || Infinity,
    formData.sizes.MEDIUM.pricePerDay || Infinity,
    formData.sizes.LARGE.pricePerDay || Infinity
  );

  const validate = () => {
    const errors = [];
    if (!formData.name.trim()) errors.push('Il nome del deposito è obbligatorio');
    if (!formData.city.trim()) errors.push('La città è obbligatoria');
    if (!formData.address.trim()) errors.push('L\'indirizzo è obbligatorio');
    if (!formData.openingTime || !formData.closingTime) errors.push('Orari di apertura e chiusura obbligatori');
    if (formData.openingTime >= formData.closingTime) errors.push('L\'orario di chiusura deve essere successivo all\'apertura');
    if (images.length + newImages.length === 0) errors.push('Almeno un\'immagine è obbligatoria');
    if (basePrice <= 0) errors.push('Almeno una categoria deve avere un prezzo maggiore di 0€');
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

        const cityStr = data.locales?.[0]?.city && data.locales?.[0]?.state
          ? `${data.locales[0].city}, ${data.locales[0].state}`
          : '';

        // Estrai orari (cerca un giorno aperto per prendere orario standard)
        let openingTime = '08:00';
        let closingTime = '20:00';
        let closedOnHolidaysAndSunday = true;

        if (data.openingHours && data.openingHours.length > 0) {
          const monday = data.openingHours.find(h => h.dayOfWeek === 1);
          if (monday && !monday.closed) {
            openingTime = monday.openingTime || '08:00';
            closingTime = monday.closingTime || '20:00';
          }
          const sunday = data.openingHours.find(h => h.dayOfWeek === 7);
          closedOnHolidaysAndSunday = sunday?.closed ?? true;
        }

        const sizes = {
          SMALL: { description: '', pricePerDay: 0 },
          MEDIUM: { description: '', pricePerDay: 0 },
          LARGE: { description: '', pricePerDay: 0 }
        };

        if (data.luggageSizePrices) {
          data.luggageSizePrices.forEach(p => {
            if (sizes[p.sizeLabel]) {
              sizes[p.sizeLabel] = {
                description: p.description || '',
                pricePerDay: p.pricePerDay || 0
              };
            }
          });
        }

        setFormData({
          name: data.name || '',
          description: data.description || '',
          city: cityStr,
          address: data.locales?.[0]?.address || '',
          publicationStatus: data.publicationStatus ?? true,
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
    const newBlobs = files.map(file => ({ file, preview: URL.createObjectURL(file) }));
    setNewImages(prev => [...prev, ...newBlobs]);
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

    const cityParts = formData.city.split(',').map(p => p.trim());
    const city = cityParts[0] || '';
    const state = cityParts[1] || '';

    // Genera openingHours (7 giorni)
    const openingHours = [];
    for (let day = 1; day <= 7; day++) {
      const isSunday = day === 7;
      const closed = formData.closedOnHolidaysAndSunday && isSunday;
      openingHours.push({
        dayOfWeek: day,
        openingTime: closed ? null : formData.openingTime,
        closingTime: closed ? null : formData.closingTime,
        closed
      });
    }

    // Genera luggageSizePrices
    const luggageSizePrices = Object.entries(formData.sizes).map(([sizeLabel, info]) => ({
      sizeLabel,
      pricePerDay: parseFloat(info.pricePerDay) || 0,
      pricePerHour: null,
      description: info.description.trim() || null
    }));

    const payload = {
      name: formData.name,
      description: formData.description,
      locales: [{
        serviceType: 'LUGGAGE',
        language: 'it',
        country: 'IT',
        state: state,
        city: city,
        address: formData.address
      }],
      capacity: parseInt(formData.capacity, 10) || null,
      basePrice: basePrice,
      publicationStatus: formData.publicationStatus,
      openingHours,
      luggageSizePrices
    };

    const formDataToSend = new FormData();
    formDataToSend.append('data', new Blob([JSON.stringify(payload)], { type: 'application/json' }));

    // Rinvio tutte le immagini
    for (const url of images) {
      try {
        const response = await fetch(url);
        const blob = await response.blob();
        const filename = url.split('/').pop();
        const file = new File([blob], filename, { type: blob.type });
        formDataToSend.append('images', file);
      } catch (err) {
        console.error('Errore riconversione immagine:', url, err);
      }
    }
    newImages.forEach(item => formDataToSend.append('images', item.file));

    try {
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
      setErrorMessage(e.message || 'Errore durante il salvataggio');
      setShowError(true);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <LoadingScreen isLoading={true} />;

  const breadcrumbsItems = [
    { label: 'Dashboard', href: '/provider/dashboard' },
    { label: 'I miei Depositi', href: '/provider/luggage' },
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
                  label="Città"
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
                  price={formData.sizes.SMALL.pricePerDay}
                  onPriceChange={v => handleSize('SMALL', 'pricePerDay', v)}
                  onDescChange={v => handleSize('SMALL', 'description', v)}
                />
                <LuggageSizePriceCard
                  size="MEDIUM"
                  label="Medium"
                  icon={Briefcase}
                  description={formData.sizes.MEDIUM.description}
                  price={formData.sizes.MEDIUM.pricePerDay}
                  onPriceChange={v => handleSize('MEDIUM', 'pricePerDay', v)}
                  onDescChange={v => handleSize('MEDIUM', 'description', v)}
                />
                <LuggageSizePriceCard
                  size="LARGE"
                  label="Large"
                  icon={Package}
                  description={formData.sizes.LARGE.description}
                  price={formData.sizes.LARGE.pricePerDay}
                  onPriceChange={v => handleSize('LARGE', 'pricePerDay', v)}
                  onDescChange={v => handleSize('LARGE', 'description', v)}
                />
              </div>
            </section>

            {/* GALLERY */}
            <section className={`${HOGU_THEME.cardBase} p-8`}>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-900">Foto del Deposito</h3>
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
            </section>
          </div>

          {/* RIGHT SIDEBAR */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">
              <div className={`${HOGU_THEME.cardBase} p-6 shadow-[0_8px_30px_rgb(0,0,0,0.08)]`}>
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Info size={18} className={`text-[${HOGU_COLORS.primary}]`} />
                  Info Servizio
                </h3>
                <div className="space-y-1">
                  <InfoAccordionItem icon={CalendarCheck} colorClass="bg-blue-50 text-blue-600" title="Prenotazioni" description="Capienza gestita automaticamente per evitare overbooking." />
                  <InfoAccordionItem icon={CreditCard} colorClass="bg-emerald-50 text-emerald-600" title="Pagamenti" description="Ricevi i compensi settimanalmente al netto delle commissioni." />
                  <InfoAccordionItem icon={FileText} colorClass="bg-purple-50 text-purple-600" title="Commissioni" description="Applicate solo sulle prenotazioni completate." />
                </div>
              </div>

              <div className={`${HOGU_THEME.cardBase} p-6 shadow-[0_8px_30px_rgb(0,0,0,0.08)]`}>
                <h3 className="text-lg font-bold text-gray-900 mb-6">Stato Operativo</h3>

                <div className="mb-6">
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                    Capienza Massima (numero bagagli)
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

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100 mb-6">
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
                    <input type="checkbox" className="sr-only peer" checked={formData.publicationStatus} onChange={e => handle('publicationStatus', e.target.checked)} />
                    <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#68B49B]"></div>
                  </label>
                </div>

                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className={`w-full py-4 rounded-xl font-bold text-lg text-white shadow-xl flex items-center justify-center gap-2 transition-all
                    ${isSaving ? 'bg-gray-400 cursor-not-allowed' : 'bg-slate-800 hover:bg-slate-700 hover:scale-[1.02]'}`}
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
          </div>
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
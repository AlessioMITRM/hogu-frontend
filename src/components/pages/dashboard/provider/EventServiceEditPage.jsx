import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { withAuthProtection } from '../../auth/withAuthProtection.jsx';
import { clubService } from '../../../../api/apiClient.js';
import italianLocationsData from '../../../../assets/data/italian_locations.json';
import englishLocationsData from '../../../../assets/data/english_locations.json';
import { Breadcrumbs } from '../../../../components/ui/Breadcrumbs.jsx';
import SuccessModal from '../../../ui/SuccessModal.jsx';
import ErrorModal from '../../../ui/ErrorModal.jsx';
import LoadingScreen from '../../../ui/LoadingScreen.jsx';

import {
  Clock, MapPin, Info, Check, Music, GlassWater, Armchair, Ticket, Shirt, Users,
  ChevronRight, Save, Upload, Trash2, Plus, Eye, EyeOff, CreditCard, Navigation, Euro,
  Mic2, Disc, Speaker, CalendarCheck, FileText, VenetianMask, Calendar
} from 'lucide-react';

/* --------------  TEMA  -------------- */
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
      <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-24 opacity-100 mb-3' : 'max-h-0 opacity-0'}`}>
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
        if (!aStarts && bStarts) return 1;
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
          placeholder={t('bnb_listing.search.location_placeholder', 'Dove vuoi andare?')}
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
            {t('bnb.search.not_found_citys', 'Nessuna città trovata')}
          </div>
        )}
      </div>
    </div>
  );
};

/* --------------  EditableInput  -------------- */
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

/* --------------  EditableTextarea  -------------- */
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
            {t('EventServiceEditPage.cover', 'Copertina')}
          </span>
        )}
        {isNew && (
          <span className="absolute top-4 left-4 bg-blue-500 text-white text-xs px-3 py-1.5 rounded-md font-bold">
            {t('EventServiceEditPage.new', 'Nuova')}
          </span>
        )}
      </div>
    </div>
  );
};

/* --------------  CrowdMixEditor  -------------- */
const CrowdMixEditor = ({ malePercent, onChange, enabled, onToggle }) => {
  const { t } = useTranslation();

  return (
    <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
      <div className="flex items-center justify-between mb-3">
        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">
          {t('EventServiceEditPage.crowdMixLabel', 'Crowd Mix (Target Uomo/Donna)')} ({t('common.optional', 'Opzionale')})
        </label>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            className="sr-only peer"
            checked={enabled}
            onChange={e => onToggle(e.target.checked)}
          />
          <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#68B49B]"></div>
        </label>
      </div>
      {enabled && (
        <>
          <div className="flex items-center gap-4">
            <div className="text-sm font-bold text-gray-600 w-12">
              {malePercent}% {t('EventServiceEditPage.maleShort', 'U')}
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={malePercent}
              onChange={e => onChange(parseInt(e.target.value, 10))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#68B49B]"
            />
            <div className="text-sm font-bold text-gray-600 w-12">
              {100 - malePercent}% {t('EventServiceEditPage.femaleShort', 'D')}
            </div>
          </div>
          <div className="h-2 w-full mt-2 rounded-full overflow-hidden flex opacity-80">
            <div style={{ width: `${malePercent}%` }} className="bg-slate-400 h-full transition-all" />
            <div style={{ width: `${100 - malePercent}%` }} className="bg-[#68B49B] h-full transition-all" />
          </div>
        </>
      )}
    </div>
  );
};

/* --------------  MusicThemeSelector  -------------- */
const MusicThemeSelector = ({ selectedThemes, onChange }) => {
  const { t } = useTranslation();

  const genres = [
    { value: 'Commerciale', label: t('music.commercial', 'Commerciale'), icon: Disc },
    { value: 'House / Tech House', label: t('music.house', 'House / Tech House'), icon: Speaker },
    { value: 'Techno / Hardstyle', label: t('music.techno', 'Techno / Hardstyle'), icon: Disc },
    { value: 'Reggaeton / Latin', label: t('music.reggaeton', 'Reggaeton / Latin'), icon: Music },
    { value: 'Hip Hop / Trap', label: t('music.hiphop', 'Hip Hop / Trap'), icon: Mic2 },
    { value: 'Revival 90s/2000s', label: t('music.revival', 'Revival 90s/2000s'), icon: Disc },
    { value: 'EDM / Festival', label: t('music.edm', 'EDM / Festival'), icon: Speaker },
    { value: 'Live Music / Band', label: t('music.live', 'Live Music / Band'), icon: Mic2 },
    { value: 'Rock / Indie', label: t('music.indie', 'Rock / Indie'), icon: Music },
    { value: 'Jazz / Lounge', label: t('music.jazz', 'Jazz / Lounge'), icon: GlassWater }
  ];

  const handleSelect = (value) => {
    const newSel = selectedThemes.includes(value) ? [] : [value];
    onChange(newSel);
  };

  return (
    <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100">
      <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
        <Disc size={24} className={`text-[${HOGU_COLORS.primary}]`} />
        {t('EventServiceEditPage.musicTitle', 'Tema Musicale & Genere')}
      </h3>
      <p className="text-sm text-gray-500 mb-6 -mt-4">{t('EventServiceEditPage.musicSub', 'Seleziona il genere principale della serata.')}</p>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {genres.map(g => {
          const active = selectedThemes.includes(g.value);
          const Icon = g.icon;
          return (
            <button
              key={g.value}
              onClick={() => handleSelect(g.value)}
              className={`relative flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all gap-2 h-28
                ${active ? 'border-[#68B49B] bg-[#F0FDF9] text-[#33594C] shadow-md scale-[1.02]' : 'border-gray-100 bg-gray-50 text-gray-500 hover:bg-white hover:border-gray-200 hover:shadow-sm'}`}
            >
              <Icon size={24} className={active ? 'text-[#68B49B]' : 'text-gray-400'} />
              <span className="text-xs font-bold text-center leading-tight">{g.label}</span>
              {active && <Check size={14} className="absolute top-3 right-3 text-[#68B49B]" />}
            </button>
          );
        })}
      </div>
    </div>
  );
};

/* --------------  GenderPriceCard  -------------- */
const GenderPriceCard = ({ label, value, onChange, icon: Icon, placeholder = '0', pt4 = "", p4 = "" }) => {
  const { t } = useTranslation();
  return (
    <div className={`${pt4}`}>
      <div className={`p-5 rounded-2xl border border-gray-200 bg-gray-50/50 ${p4}`}>
        <div className={`flex items-center gap-2 mb-4 text-gray-700 font-bold ${p4}`}>
          <Icon size={20} /> {label}
        </div>
        <div className="space-y-4">
          <div className="relative">
            <label className="text-[10px] uppercase font-bold text-gray-400">{t('EventServiceEditPage.price', 'Prezzo')}</label>
            <div className="relative">
              <input
                type="number"
                min="0"
                step="0.01"
                value={value}
                onChange={e => onChange(e.target.value)}
                placeholder={placeholder}
                className="w-full pl-8 pr-4 py-3 rounded-xl border border-gray-200 font-bold text-xl focus:border-[#68B49B] outline-none"
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">€</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* =========================================================
 * PAGINA PRINCIPALE - MODIFICA + CREAZIONE
 * ========================================================= */
export const EventServiceEditPageBase = () => {
  const { t } = useTranslation();
  const { id } = useParams(); // eventId dalla URL
  const navigate = useNavigate();
  const isEditMode = !!id;

  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(isEditMode);
  const [isSaving, setIsSaving] = useState(false);

  // clubId ottenuto dalla risposta del backend
  const [clubId, setClubId] = useState(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    city: '',
    address: '',
    isActive: true,
    eventDateTime: { open: '', close: '' },
    crowdMixMale: 50,
    useCrowdMix: true,
    dressCode: '',
    musicThemes: [],
    djName: '',
    maxCapacity: 0,
    useVipTable: true,
    ticketPrice: 0,
    tablePrice: 0,
    tableMaxPax: 0,
    useGenderPricing: false,
    maleTicketPrice: 0,
    femaleTicketPrice: 0
  });

  const [images, setImages] = useState([]); // URL completi per visualizzazione
  const [newImages, setNewImages] = useState([]);
  const fileInputRef = useRef(null);

  const handle = (field, value) => setFormData(p => ({ ...p, [field]: value }));

  const getTimezoneOffsetString = () => {
    const offsetMinutes = new Date().getTimezoneOffset();
    const absOffset = Math.abs(offsetMinutes);
    const hours = String(Math.floor(absOffset / 60)).padStart(2, '0');
    const minutes = String(absOffset % 60).padStart(2, '0');
    const sign = offsetMinutes <= 0 ? '+' : '-';
    return `${sign}${hours}:${minutes}`;
  };

  const validate = () => {
    const errors = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (!formData.title.trim()) errors.push(t('EventServiceEditPage.val_title', 'Nome evento è obbligatorio'));
    if (!formData.description.trim()) errors.push(t('EventServiceEditPage.val_desc', 'Descrizione è obbligatoria'));
    if (!formData.city.trim()) errors.push(t('EventServiceEditPage.val_city', 'Città è obbligatoria'));
    if (!formData.address.trim()) errors.push(t('EventServiceEditPage.val_addr', 'Indirizzo è obbligatorio'));
    if (!formData.musicThemes.length) errors.push(t('EventServiceEditPage.val_theme', 'Tema musicale è obbligatorio'));
    if (images.length + newImages.length === 0) errors.push(t('EventServiceEditPage.val_img', 'Almeno un\'immagine è obbligatoria'));

    if (!formData.eventDateTime.open || !formData.eventDateTime.close) {
      errors.push('Data e orari di apertura e chiusura sono obbligatori');
    } else {
      const openDateTime = new Date(formData.eventDateTime.open);
      const closeDateTime = new Date(formData.eventDateTime.close);

      if (openDateTime < today) {
        errors.push('La data e ora di apertura deve essere oggi o una data futura');
      }

      if (closeDateTime <= openDateTime) {
        errors.push('La data e ora di chiusura deve essere successiva a quella di apertura');
      }
    }

    return errors;
  };

  /* ------  CARICAMENTO DATI (solo in modifica) ------ */
  useEffect(() => {
    if (!isEditMode) {
      setIsLoading(false);
      return;
    }

    const fetchEvent = async () => {
      try {
        setIsLoading(true);
        const res = await clubService.getEventProvider(id);
        
        const ev = res;
        if (!ev) return;

        // Estrai clubId dalla risposta (adatta se il campo ha nome diverso)
        const currentClubId = ev.clubServiceId || null;
        setClubId(currentClubId);

        const byType = type => ev.pricingConfigurations?.find(p => p.pricingType === type);
        const std = byType('STANDARD');
        const male = byType('MALE');
        const female = byType('FEMALE');
        const vip = byType('VIP_TABLE');

        const formatDateTimeLocal = (isoString) => {
          if (!isoString) return '';
          return isoString.replace(/:\d{2}(\.\d{3})?Z$/, '').slice(0, 16);
        };

        setFormData({
          title: ev.name || '',
          description: ev.description || '',
          city: ev.serviceLocale?.[0]?.city + ', ' + ev.serviceLocale?.[0]?.state || '',
          address: ev.serviceLocale?.[0]?.address || '',
          isActive: ev.isActive ?? true,
          eventDateTime: {
            open: formatDateTimeLocal(ev.startTime),
            close: formatDateTimeLocal(ev.endTime)
          },
          dressCode: ev.dressCode || '',
          crowdMixMale: ev.genderPercentage ?? 50,
          useCrowdMix: ev.genderPercentage !== null && ev.genderPercentage !== undefined,
          djName: ev.djName || '',
          musicThemes: ev.theme ? [ev.theme] : [],
          maxCapacity: ev.maxCapacity || 0,
          useVipTable: !!vip,
          ticketPrice: ev.price || std?.price || 0,
          tablePrice: vip?.price || 0,
          tableMaxPax: vip?.capacity || 0,
          useGenderPricing: !!(male || female),
          maleTicketPrice: male?.price || 0,
          femaleTicketPrice: female?.price || 0
        });

        // Costruisci path completo per ogni immagine esistente
        const loadedImages = Array.isArray(ev.images) && currentClubId
          ? ev.images.map(filename => 
            `/files/club/${currentClubId}/event/${id}/${filename}`)
          : [];
        setImages(loadedImages);
      } catch (e) {
        console.error(e);
        setErrorMessage(t('EventServiceEditPage.loadError', 'Errore nel caricamento dell\'evento'));
        setShowError(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvent();
  }, [id, t, isEditMode]);

  /* ------  GESTIONE IMMAGINI ------ */
  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    const newBlobs = files.map(file => ({ file, preview: URL.createObjectURL(file) }));
    setNewImages(prev => [...prev, ...newBlobs]);
  };

  const handleDeleteExisting = (idx) => {
    setImages(prev => prev.filter((_, i) => i !== idx));
  };

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

    const timezoneOffset = getTimezoneOffsetString();

    let basePrice = 0;
    const pricingConfigurations = [];

    if (formData.useGenderPricing) {
      const malePrice = parseFloat(formData.maleTicketPrice) || 0;
      const femalePrice = parseFloat(formData.femaleTicketPrice) || 0;
      const validPrices = [];
      if (malePrice > 0) validPrices.push(malePrice);
      if (femalePrice > 0) validPrices.push(femalePrice);
      basePrice = validPrices.length > 0 ? Math.min(...validPrices) : 0;

      if (malePrice > 0) {
        pricingConfigurations.push({ pricingType: 'MALE', price: malePrice, capacity: null, isActive: true });
      }
      if (femalePrice > 0) {
        pricingConfigurations.push({ pricingType: 'FEMALE', price: femalePrice, capacity: null, isActive: true });
      }
    } else {
      basePrice = parseFloat(formData.ticketPrice) || 0;
    }

    if (formData.useVipTable && parseFloat(formData.tablePrice) > 0) {
      pricingConfigurations.push({
        pricingType: 'VIP_TABLE',
        price: parseFloat(formData.tablePrice),
        capacity: parseInt(formData.tableMaxPax, 10) || null,
        isActive: true
      });
    }

    const cityParts = formData.city.split(',').map(part => part.trim());
    const city = cityParts[0] || '';
    const state = cityParts[1] || '';

    const serviceLocale = [{
      serviceType: 'CLUB',
      language: 'it',
      country: 'IT',
      state: state,
      city: city,
      address: formData.address
    }];

    const payload = {
      name: formData.title,
      description: formData.description,
      serviceLocale: serviceLocale,
      startTime: `${formData.eventDateTime.open}:00${timezoneOffset}`,
      endTime: `${formData.eventDateTime.close}:00${timezoneOffset}`,
      isActive: formData.isActive,
      dressCode: formData.dressCode,
      genderPercentage: formData.useCrowdMix ? formData.crowdMixMale : null,
      djName: formData.djName || null,
      theme: formData.musicThemes[0] || null,
      maxCapacity: formData.maxCapacity || null,
      price: basePrice,
      pricingConfigurations: pricingConfigurations
    };

    const formDataToSend = new FormData();
    formDataToSend.append('data', new Blob([JSON.stringify(payload)], { type: 'application/json' }));

    // === MODIFICA PRINCIPALE: rinviamo TUTTE le immagini (vecchie + nuove) ===
    // 1. Immagini esistenti rimaste (le convertiamo in File)
    for (const url of images) {
      try {
        const response = await fetch(url);
        const blob = await response.blob();
        const filename = url.split('/').pop(); // prende il nome file originale
        const file = new File([blob], filename, { type: blob.type });
        formDataToSend.append('images', file);
      } catch (err) {
        console.error('Errore nel riconvertire immagine esistente:', url, err);
      }
    }

    // 2. Immagini nuove
    newImages.forEach(item => formDataToSend.append('images', item.file));

    try {
      if (isEditMode) {
        await clubService.updateEventProvider(id, formDataToSend);
      } else {
        await clubService.createEventProvider(formDataToSend);
      }

      setShowSuccess(true);
      setNewImages([]);
      // Dopo il salvataggio manteniamo le preview (sia vecchie che nuove)
      const updatedPreviews = [...images, ...newImages.map(i => i.preview)];
      setImages(updatedPreviews);
    } catch (e) {
      setErrorMessage(e.message || t('EventServiceEditPage.saveErr', 'Si è verificato un errore durante il salvataggio.'));
      setShowError(true);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <LoadingScreen isLoading={true} />;
  }

  const pageTitle = isEditMode ? t('EventServiceEditPage.title', 'Modifica Evento') : 'Crea Nuovo Evento';
  const breadcrumbsItems = [
    { label: 'Dashboard', href: '/provider/dashboard' },
    { label: 'I miei Eventi', href: '/provider/events' },
    { label: pageTitle, href: '#' }
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
            <div className="w-8 h-[1px] bg-gray-900" /> {t('EventServiceEditPage.serviceLabel', 'Servizio Evento Club')}
          </span>
          <h1 className={`text-3xl md:text-5xl font-extrabold text-[${HOGU_COLORS.dark}] mb-2 tracking-tight leading-tight`}>
            {pageTitle}
          </h1>
          <p className={`text-lg text-[${HOGU_COLORS.subtleText}] max-w-xl leading-relaxed`}>
            {isEditMode
              ? t('EventServiceEditPage.subtitle', 'Gestisci le informazioni del locale, le serate e il listino prezzi.')
              : 'Compila tutti i campi per creare un nuovo evento nel tuo club.'}
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
                label={t('EventServiceEditPage.name', 'Nome Locale / Evento')}
                value={formData.title}
                onChange={v => handle('title', v)}
                large
                className="mb-4"
                required
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <CityAutocomplete
                  label={t('EventServiceEditPage.city', 'Città')}
                  value={formData.city}
                  onChange={v => handle('city', v)}
                  icon={MapPin}
                />
                <EditableInput
                  label={t('EventServiceEditPage.address', 'Indirizzo')}
                  value={formData.address}
                  onChange={v => handle('address', v)}
                  icon={Navigation}
                  placeholder="es. Via del Colosseo, 1"
                  required
                />
              </div>

              {/* DATA + ORA */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <EditableInput
                  label="Data e Ora Apertura"
                  type="datetime-local"
                  value={formData.eventDateTime.open}
                  onChange={v => handle('eventDateTime', { ...formData.eventDateTime, open: v })}
                  icon={Calendar}
                  required
                />
                <EditableInput
                  label="Data e Ora Chiusura"
                  type="datetime-local"
                  value={formData.eventDateTime.close}
                  onChange={v => handle('eventDateTime', { ...formData.eventDateTime, close: v })}
                  icon={Clock}
                  required
                />
              </div>

              <EditableTextarea
                label={t('EventServiceEditPage.description', 'Descrizione Serata')}
                value={formData.description}
                onChange={v => handle('description', v)}
                rows={4}
                required
              />
            </section>

            {/* Massima capienza */}
            <section className={`${HOGU_THEME.cardBase} p-8`}>
              <EditableInput
                label={t('EventServiceEditPage.maxCapacity', 'Massima Capienza Evento') + ` (${t('common.optional', 'Opzionale')})`}
                type="number"
                min="0"
                value={formData.maxCapacity}
                onChange={v => handle('maxCapacity', parseInt(v, 10) || 0)}
                icon={Users}
                placeholder="es. 500"
              />
            </section>

            {/* Nome DJ */}
            <section className={`${HOGU_THEME.cardBase} p-8`}>
              <EditableInput
                label={t('EventServiceEditPage.djName', 'Nome DJ / Artista') + ` (${t('common.optional', 'Opzionale')})`}
                value={formData.djName}
                onChange={v => handle('djName', v)}
                icon={Mic2}
                placeholder="es. DJ Example"
              />
            </section>

            {/* TEMI MUSICALI */}
            <MusicThemeSelector
              selectedThemes={formData.musicThemes}
              onChange={v => handle('musicThemes', v)}
            />

            {/* ATMOSFERA */}
            <section className={`${HOGU_THEME.cardBase} p-8`}>
              <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Info size={24} className={`text-[${HOGU_COLORS.primary}]`} />
                {t('EventServiceEditPage.atmosphere', 'Atmosfera & Selezione')}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <EditableInput
                  label={t('EventServiceEditPage.dressCode', 'Dress Code')}
                  value={formData.dressCode}
                  onChange={v => handle('dressCode', v)}
                  icon={Shirt}
                  placeholder="es. Elegant, Smart Casual..."
                />
                <CrowdMixEditor
                  malePercent={formData.crowdMixMale}
                  onChange={v => handle('crowdMixMale', v)}
                  enabled={formData.useCrowdMix}
                  onToggle={v => handle('useCrowdMix', v)}
                />
              </div>
            </section>

            {/* LISTINO */}
            <section className={`${HOGU_THEME.cardBase} p-8`}>
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Euro size={24} className={`text-[${HOGU_COLORS.primary}]`} />
                {t('EventServiceEditPage.pricing', 'Listino & Prezzi')}
              </h3>

              {/* Toggle Tavolo VIP */}
              <div className="flex items-center justify-between mb-6 p-4 bg-gray-50 rounded-xl border border-gray-100">
                <div className="flex items-center gap-3">
                  <Armchair size={20} className={`text-[${HOGU_COLORS.primary}]`} />
                  <div>
                    <p className="font-bold text-sm text-gray-900">{t('EventServiceEditPage.enableVipTable', 'Abilita Tavolo VIP')} ({t('common.optional', 'Opzionale')})</p>
                    <p className="text-xs text-gray-500">{t('EventServiceEditPage.enableVipTableSub', 'Offri la possibilità di prenotare tavoli VIP')}</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={formData.useVipTable}
                    onChange={e => handle('useVipTable', e.target.checked)}
                  />
                  <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#68B49B]"></div>
                </label>
              </div>

              {/* Toggle prezzi per sesso */}
              <div className="flex items-center justify-between mb-6 p-4 bg-gray-50 rounded-xl border border-gray-100">
                <div className="flex items-center gap-3">
                  <VenetianMask size={20} className={`text-[${HOGU_COLORS.primary}]`} />
                  <div>
                    <p className="font-bold text-sm text-gray-900">{t('EventServiceEditPage.enableGenderPrices', 'Attiva prezzi diversi per uomo/donna')}</p>
                    <p className="text-xs text-gray-500">{t('EventServiceEditPage.enableGenderPricesSub', 'Permetti di impostare importi separati per ciascun sesso')}</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={formData.useGenderPricing}
                    onChange={e => handle('useGenderPricing', e.target.checked)}
                  />
                  <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#68B49B]"></div>
                </label>
              </div>

              {/* Tavolo VIP */}
              {formData.useVipTable && (
                <div className="p-5 rounded-2xl border-2 border-[#68B49B]/20 bg-[#F0FDF9]/30 mb-6">
                  <div className="flex items-center gap-2 mb-4 text-[#33594C] font-bold">
                    <Armchair size={20} /> {t('EventServiceEditPage.vipTable', 'Tavolo VIP')}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] uppercase font-bold text-[#68B49B]">{t('EventServiceEditPage.minSpending', 'Min. Spending')}</label>
                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={formData.tablePrice}
                          onChange={e => handle('tablePrice', e.target.value)}
                          className="w-full pl-8 pr-4 py-3 rounded-xl border border-[#68B49B]/30 font-bold text-xl text-[#33594C] focus:border-[#68B49B] outline-none bg-white"
                        />
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#68B49B]">€</span>
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] uppercase font-bold text-[#68B49B]">{t('EventServiceEditPage.maxGuests', 'Max Ospiti per tavolo')}</label>
                      <div className="relative">
                        <Users size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#68B49B]" />
                        <input
                          type="number"
                          min="1"
                          value={formData.tableMaxPax}
                          onChange={e => handle('tableMaxPax', e.target.value)}
                          className="w-full pl-9 pr-4 py-3 rounded-xl border border-[#68B49B]/30 font-bold text-gray-700 focus:border-[#68B49B] outline-none bg-white"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Prezzi ingresso */}
              {!formData.useGenderPricing ? (
                <GenderPriceCard
                  label={t('EventServiceEditPage.ticketStandard', 'Ingresso in Lista')}
                  value={formData.ticketPrice}
                  onChange={v => handle('ticketPrice', v)}
                  icon={Ticket}
                  pt4='pt-4'
                />
              ) : (
                <div className="space-y-6 pt-4">
                  <div>
                    <h4 className="flex items-center gap-2 mb-4 text-[#33594C] font-bold">
                      <Ticket size={18} /> {t('EventServiceEditPage.ticketGender', 'Ingressi in Lista')}
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <GenderPriceCard
                        label={t('EventServiceEditPage.male', 'Uomo')}
                        value={formData.maleTicketPrice}
                        onChange={v => handle('maleTicketPrice', v)}
                        icon={Ticket}
                      />
                      <GenderPriceCard
                        label={t('EventServiceEditPage.female', 'Donna')}
                        value={formData.femaleTicketPrice}
                        onChange={v => handle('femaleTicketPrice', v)}
                        icon={Ticket}
                      />
                    </div>
                  </div>
                </div>
              )}
            </section>

            {/* GALLERY */}
            <section className={`${HOGU_THEME.cardBase} p-8`}>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-900">{t('EventServiceEditPage.galleryTitle', 'Media Gallery')}</h3>
                <label className={`text-[${HOGU_COLORS.primary}] font-bold text-sm flex items-center gap-2 hover:underline cursor-pointer`}>
                  <Upload size={18} />
                  {t('EventServiceEditPage.upload', 'Carica')}
                  <input ref={fileInputRef} type="file" multiple accept="image/*" onChange={handleImageUpload} className="hidden" />
                </label>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {images.map((img, idx) => (
                  <ImageUploadCard
                    key={`existing-${idx}`}
                    src={img}
                    isMain={idx === 0}
                    onDelete={() => handleDeleteExisting(idx)}
                  />
                ))}
                {newImages.map((item, idx) => (
                  <ImageUploadCard
                    key={`new-${idx}`}
                    src={item.preview}
                    isNew
                    onDelete={() => handleDeleteNew(idx, item.preview)}
                  />
                ))}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="aspect-[4/3] rounded-2xl border-2 border-dashed border-gray-200 hover:border-[#68B49B] bg-gray-50 flex flex-col items-center justify-center text-gray-400 hover:text-[#68B49B] cursor-pointer transition-all group"
                >
                  <Plus size={32} className="group-hover:scale-110 transition-transform" />
                  <span className="text-xs mt-2">{t('EventServiceEditPage.addMore', 'Aggiungi altre')}</span>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-6">
                {t('EventServiceEditPage.imagesNote', 'Passa il mouse sulle immagini per eliminarle (icona cestino). Le immagini rimosse verranno eliminate definitivamente al salvataggio.')}
              </p>
            </section>
          </div>

          {/* RIGHT SIDEBAR */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">
              <div className={`${HOGU_THEME.cardBase} p-6 shadow-[0_8px_30px_rgb(0,0,0,0.08)]`}>
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Info size={18} className={`text-[${HOGU_COLORS.primary}]`} />
                  {t('EventServiceEditPage.infoService', 'Info Servizio')}
                </h3>
                <div className="space-y-1">
                  <InfoAccordionItem icon={CalendarCheck} colorClass="bg-blue-50 text-blue-600" title={t('EventServiceEditPage.bookings', 'Prenotazioni')} description={t('EventServiceEditPage.bookingsDesc', 'Descrizione')} />
                  <InfoAccordionItem icon={CreditCard} colorClass="bg-emerald-50 text-emerald-600" title={t('EventServiceEditPage.payments', 'Pagamenti')} description={t('EventServiceEditPage.paymentsDesc', 'Descrizione pagamenti')} />
                  <InfoAccordionItem icon={FileText} colorClass="bg-purple-50 text-purple-600" title={t('EventServiceEditPage.commissions', 'Commissioni')} description={t('EventServiceEditPage.commissionsDesc', 'Descrizione commissioni')} />
                </div>
              </div>

              <div className={`${HOGU_THEME.cardBase} p-6 shadow-[0_8px_30px_rgb(0,0,0,0.08)]`}>
                <h3 className="text-lg font-bold text-gray-900 mb-4">{t('EventServiceEditPage.publish', 'Pubblicazione')}</h3>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100 mb-6">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${formData.isActive ? 'bg-green-100 text-green-600' : 'bg-gray-200 text-gray-500'}`}>
                      {formData.isActive ? <Eye size={20} /> : <EyeOff size={20} />}
                    </div>
                    <div>
                      <p className="font-bold text-sm text-gray-900">{t('EventServiceEditPage.visibility', 'Visibilità')}</p>
                      <p className="text-xs text-gray-500">{formData.isActive ? t('EventServiceEditPage.online', 'Online') : t('EventServiceEditPage.hidden', 'Nascosto')}</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={formData.isActive}
                      onChange={e => handle('isActive', e.target.checked)}
                    />
                    <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                  </label>
                </div>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className={`w-full py-4 rounded-xl font-bold text-lg text-white shadow-xl shadow-slate-500/20 flex items-center justify-center gap-2 transition-all
                    ${isSaving ? 'bg-gray-400 cursor-not-allowed' : 'bg-slate-800 hover:bg-slate-700 hover:scale-[1.02]'}`}
                >
                  {isSaving ? t('EventServiceEditPage.saving', 'Salvataggio...') : (
                    <>
                      <Save size={20} />
                      {isEditMode ? t('EventServiceEditPage.saveBtn', 'Salva Modifiche') : 'Crea Evento'}
                    </>
                  )}
                </button>
              </div>

              <div className="bg-slate-50 rounded-[2rem] p-6 border border-slate-200">
                <h4 className="font-bold text-slate-800 mb-2 flex items-center gap-2"><MapPin size={18} /> {t('EventServiceEditPage.venueType', 'Tip Locale')}</h4>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {t('EventServiceEditPage.venueDesc', 'Assicurati che la tua descrizione e l\'indirizzo siano aggiornati. Le informazioni accurate migliorano il tasso di conversione delle prenotazioni.')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <SuccessModal 
        isOpen={showSuccess}
        onClose={() => {
          setShowSuccess(false);
          if (!isEditMode) navigate('/provider/events');
        }}
        title={isEditMode ? t('EventServiceEditPage.successTitle', 'Evento Salvato') : 'Evento Creato'}
        message={isEditMode 
          ? t('EventServiceEditPage.successMsg', 'L\'Evento è stato salvato correttamente')
          : 'Il nuovo evento è stato creato con successo!'}
        confirmText={t('EventServiceEditPage.close', 'Chiudi')}
      />

      {showError && (
        <ErrorModal
          message={errorMessage} 
          onClose={() => setShowError(false)}
        />
      )}
    </div>
  );
};

export const EventServiceEditPage = withAuthProtection(EventServiceEditPageBase, ['PROVIDER'], 'CLUB');
export default EventServiceEditPage;
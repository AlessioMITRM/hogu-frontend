import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Calendar, Utensils, Star, MapPin, Clock, ChefHat, Sparkles, BookOpen, Navigation, ChevronDown, ChevronUp } from 'lucide-react';

import { HOGU_COLORS, HOGU_THEME } from '../../../config/theme.js';

// --- IMPORT COMPONENTI RIUTILIZZABILI --
import { PrimaryButton, PrimaryEmphasis } from '../../ui/Button.jsx';
import { getServiceLocalization } from '../../../utils/dateUtils.js';

import { LiveViewersFloatingBadge } from '../../../components/ui/LiveViewersBadge.jsx';

import { ServiceHeaderDetail } from '../../../components/ui/ServiceHeaderDetail.jsx';
import { ServiceImageGallery } from '../../../components/ui/ServiceImageGallery.jsx';
import { Breadcrumbs } from '../../ui/Breadcrumbs.jsx';
import LoadingScreen from '../../ui/LoadingScreen.jsx';
import ErrorModal from '../../ui/ErrorModal.jsx';
import MapLoadingSkeleton from '../../ui/MapLoadingSkeleton.jsx';

import ServiceUnavailablePage from '../ServiceUnavailablePage.jsx';

// --- API ---
import { restaurantService, mapService, infoService } from '../../../api/apiClient.js';

// Base URL immagini
const ENV_URL = import.meta.env.VITE_API_BASE_URL;
const DYNAMIC_URL = `${window.location.protocol}//${window.location.hostname}:8080`;
const API_BASE_URL =
    ENV_URL && ENV_URL.includes('localhost') && window.location.hostname !== 'localhost'
        ? DYNAMIC_URL
        : (ENV_URL || DYNAMIC_URL);
const IMG_BASE_URL = `${API_BASE_URL}/uploads/`;

// --- COMPONENTI INTERNI ---
const ExpandableDescription = ({ text }) => {
    const { t } = useTranslation('restaurant');
    const [isExpanded, setIsExpanded] = useState(false);
    const [shouldTruncate, setShouldTruncate] = useState(false);
    const textRef = useRef(null);

    useEffect(() => {
        // Calcolo approssimativo per decidere se troncare (es. se più di 300 caratteri)
        if (text && text.length > 300) {
            setShouldTruncate(true);
        }
    }, [text]);

    if (!text) return null;

    if (!shouldTruncate) {
        return <p className="text-gray-600 text-base md:text-lg leading-relaxed whitespace-pre-line">{text}</p>;
    }

    return (
        <div className="relative">
            <div className={`relative transition-all duration-500 ease-in-out ${isExpanded ? '' : 'max-h-[120px] overflow-hidden'}`}>
                <p ref={textRef} className="text-gray-600 text-base md:text-lg leading-relaxed whitespace-pre-line">
                    {text}
                </p>

                {/* Sfumatura quando chiuso */}
                {!isExpanded && (
                    <div className="absolute bottom-0 left-0 w-full h-16 bg-gradient-to-t from-white to-transparent pointer-events-none" />
                )}
            </div>

            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className={`mt-2 flex items-center gap-1.5 text-[${HOGU_COLORS.primary}] font-semibold text-sm hover:opacity-80 transition-opacity focus:outline-none`}
            >
                {isExpanded ? (
                    <>
                        {t('expandable.showLess')}
                        <ChevronUp className="w-4 h-4" />
                    </>
                ) : (
                    <>
                        {t('expandable.showMore')}
                        <ChevronDown className="w-4 h-4" />
                    </>
                )}
            </button>
        </div>
    );
};

// --- 1. COMPONENTE MAPPA (LEAFLET) ---
const LeafletMapClub = ({ lat, lon, name }) => {
    const { t } = useTranslation('restaurant');
    const mapId = "service-map-container";
    const mapInitializedRef = useRef(false);

    useEffect(() => {
        if (!lat || !lon) return;

        let mapInstance = null;
        if (typeof L !== 'undefined' && document.getElementById(mapId)) {
            const container = L.DomUtil.get(mapId);
            if (container._leaflet_id) {
                container._leaflet_id = null;
            }

            if (L.Map.allMaps && L.Map.allMaps.length > 0) {
                L.Map.allMaps.forEach(m => {
                    if (m._container && m._container.id === mapId) {
                        m.remove();
                    }
                });
            }

            const position = [lat, lon];
            mapInstance = L.map(mapId, {
                scrollWheelZoom: false,
                zoomControl: false
            }).setView(position, 16);

            L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png', {
                attribution: '&copy; CARTO',
                subdomains: 'abcd',
                maxZoom: 20
            }).addTo(mapInstance);

            L.control.zoom({ position: 'topleft' }).addTo(mapInstance);

            const customIcon = L.divIcon({
                className: 'bg-transparent',
                html: `<div style="background-color: ${HOGU_COLORS.primary}; width: 28px; height: 28px; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 8px rgba(0,0,0,0.4);"></div>`
            });

            L.marker(position, { icon: customIcon }).addTo(mapInstance)
                .bindPopup(`<div style="font-family: sans-serif; text-align: center; padding: 5px;"><strong>${name}</strong></div>`)
                .openPopup();
        }

        return () => {
            if (mapInstance) {
                mapInstance.remove();
            }
        };
    }, [lat, lon, name]);

    if (!lat || !lon) return <MapLoadingSkeleton />;

    return (
        <div className="relative group rounded-2xl md:rounded-3xl overflow-hidden shadow-lg border border-gray-100 mb-4 md:mb-6 transition-all duration-300 hover:shadow-xl">
            <div id={mapId} className="h-64 md:h-[480px] w-full z-0" />
            <div className="absolute bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md px-4 py-2 md:px-5 md:py-3 text-xs text-gray-500 border-t border-gray-100 flex items-center justify-between z-[400]">
                <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full bg-[${HOGU_COLORS.primary}] animate-pulse`}></div>
                    <span className="font-medium">{t('map.verifiedPosition')}</span>
                </div>
                <span className="opacity-60 text-[10px] uppercase tracking-wider">Stadia Maps ©</span>
            </div>
        </div>
    );
};

// --- 2. SEZIONE MENU (ELEGANCE) ---
const RestaurantMenuSection = ({ menuList, dailySpecials }) => {
    const { t } = useTranslation('restaurant');
    if ((!menuList || menuList.length === 0) && (!dailySpecials || dailySpecials.length === 0)) {
        return (
            <div className="mt-16 p-12 bg-gray-50/30 rounded-[2rem] border border-dashed border-gray-200 text-center">
                <div className="bg-white p-5 rounded-full inline-flex shadow-[0_4px_20px_rgba(0,0,0,0.05)] mb-5">
                    <Utensils className="h-7 w-7 text-gray-300" strokeWidth={1.5} />
                </div>
                <h3 className="text-xl font-medium text-gray-900 mb-2">{t('menu.notAvailable')}</h3>
                <p className="text-gray-500 text-base">{t('menu.notAvailableDesc')}</p>
            </div>
        );
    }

    const MenuItemStandard = ({ name, price, description }) => (
        <div className="flex justify-between items-start group w-full mb-3 md:mb-6 py-0.5 border-b border-gray-50 last:border-0">
            <div className="flex flex-col pr-4 md:pr-8">
                <span className={`text-[14px] md:text-[17px] font-medium text-gray-900 leading-tight group-hover:text-[${HOGU_COLORS.primary}] transition-colors`}>
                    {name}
                </span>
                {description && (
                    <span className="text-[11px] md:text-sm text-gray-500 mt-0.5 leading-snug">
                        {description}
                    </span>
                )}
            </div>
            {price !== undefined && (
                <span className="text-[14px] md:text-[16px] font-semibold text-gray-900 whitespace-nowrap pt-0.5">
                    € {parseFloat(price).toFixed(2)}
                </span>
            )}
        </div>
    );

    const MenuItemSpecial = ({ name, price, description }) => (
        <div className="flex flex-col items-center text-center group relative p-3 md:p-4">
            <span className="text-xl md:text-2xl font-serif text-gray-900 mb-1 md:mb-2 leading-tight group-hover:text-amber-700 transition-colors">
                {name}
            </span>
            {description && (
                <span className="text-xs md:text-sm text-gray-500 mb-2 md:mb-3 italic max-w-xs">
                    {description}
                </span>
            )}
            <div className="w-12 h-px bg-amber-400 mb-2 md:mb-3 opacity-0 transform translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300"></div>
            <span className="text-base md:text-lg font-bold text-amber-600 bg-amber-50/50 px-3 md:px-4 py-0.5 md:py-1 rounded-full border border-amber-100">
                € {parseFloat(price).toFixed(2)}
            </span>
        </div>
    );

    return (
        <div className="mt-6 md:mt-16 relative">
            <div className="flex items-center gap-3 mb-4 md:mb-8">
                <div className={`p-2 md:p-3 rounded-xl bg-[${HOGU_COLORS.primary}]/10`}>
                    <Utensils className={`w-5 h-5 md:w-6 md:h-6 text-[${HOGU_COLORS.primary}]`} />
                </div>
                <h2 className="text-lg md:text-2xl font-bold tracking-tight text-gray-900">{t('menu.title')}</h2>
            </div>

            <div className="bg-white rounded-2xl md:rounded-[2.5rem] p-4 md:p-12 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.05)] border border-gray-100/50">
                {dailySpecials && dailySpecials.items && dailySpecials.items.length > 0 && (
                    <div className="mb-6 md:mb-16 pb-6 md:pb-12 border-b border-gray-100">
                        <div className="flex items-center justify-center gap-4 md:gap-6 mb-4 md:mb-10">
                            <div className="h-px w-12 md:w-20 bg-gradient-to-r from-transparent to-amber-300"></div>
                            <div className="flex flex-col items-center text-amber-600">
                                <ChefHat className="w-6 h-6 md:w-8 md:h-8 mb-2" strokeWidth={1.5} />
                                <div className="flex items-center gap-2">
                                    <Sparkles className="w-3 h-3 md:w-4 md:h-4 opacity-60" />
                                    <h3 className="text-lg md:text-xl font-serif font-bold tracking-wider uppercase text-gray-900">
                                        {t('menu.chefSelection')}
                                    </h3>
                                    <Sparkles className="w-3 h-3 md:w-4 md:h-4 opacity-60" />
                                </div>
                                <span className="text-xs md:text-sm text-amber-600/70 font-medium mt-1 italic">{t('menu.limitedEdition')}</span>
                            </div>
                            <div className="h-px w-12 md:w-20 bg-gradient-to-l from-transparent to-amber-300"></div>
                        </div>
                        <div className="flex flex-col items-center space-y-4 px-0 md:px-12">
                            {dailySpecials.items.map((item, i) => (
                                <MenuItemSpecial key={i} name={item.name} price={item.price} description={item.description} />
                            ))}
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-20 gap-y-6 md:gap-y-16">
                    {menuList.map((section, idx) => (
                        <div key={idx} className="break-inside-avoid">
                            <div className="mb-4 md:mb-10 flex flex-col items-center">
                                <h3 className={`text-[11px] md:text-sm font-bold uppercase tracking-[0.2em] text-gray-800 mb-2 md:mb-4`}>
                                    {section.category}
                                </h3>
                                <div className="h-px w-24 bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
                            </div>
                            <div className="">
                                {section.items && section.items.map((item, i) => (
                                    <MenuItemStandard
                                        key={i}
                                        name={item.name}
                                        price={item.price}
                                        description={item.description}
                                    />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-4 md:mt-10 pt-4 md:pt-6 border-t border-gray-50 flex flex-col items-center text-center text-xs text-gray-400 font-light spacing-y-2">
                    <span className="">{t('menu.disclaimer1')}</span>
                    <span className="mt-0.5 font-medium text-gray-500">{t('menu.disclaimer2')}</span>
                </div>
            </div>
        </div>
    );
};

// --- 3. WIDGET PRENOTAZIONE ---
const generateTimeSlots = () => {
    // ... (Invariato)
    const slots = [];
    for (let hour = 12; hour <= 23; hour++) {
        slots.push(`${hour}:00`);
        if (hour < 23) slots.push(`${hour}:30`);
    }
    return slots;
};

const formatDateDocs = (dateString, lang = 'it-IT') => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat(lang, {
        weekday: 'long',
        day: 'numeric',
        month: 'long'
    }).format(date);
};

const BookingFormContent = ({ step, setStep, data, setData, basePrice, onConfirm, timeSlots }) => {
    const { t, i18n } = useTranslation('restaurant');
    const updateGuests = (increment) => {
        setData(prev => {
            const currentGuests = typeof prev.guests === 'string' ? parseInt(prev.guests, 10) : prev.guests;
            const newVal = currentGuests + increment;
            if (newVal < 1 || newVal > 20) return prev;
            return { ...prev, guests: newVal };
        });
    };

    return (
        <div className="flex flex-col h-full">
            <div className="flex-1 min-h-[240px] flex flex-col">
                {step === 1 && (
                    <div className="animate-in fade-in slide-in-from-right-8 duration-300 flex flex-col h-full justify-center">
                        <label className="text-sm font-medium text-gray-500 mb-3 text-center">{t('booking.when')}</label>
                        <div className="relative group">
                            <div className={`absolute inset-0 bg-[${HOGU_COLORS.primary}]/5 rounded-2xl`}></div>
                            <div className={`relative border-2 border-[${HOGU_COLORS.primary}]/20 bg-white rounded-2xl p-4 flex items-center gap-4`}>
                                <Calendar className="h-6 w-6" style={{ color: HOGU_COLORS.primary }} />
                                <input
                                    type="date"
                                    readOnly
                                    className="block w-full bg-transparent text-lg font-bold text-gray-600 focus:outline-none cursor-not-allowed select-none"
                                    value={data.date}
                                />
                            </div>
                        </div>
                        <p className="text-xs text-center text-gray-400 mt-6">
                            {t('booking.preSelected')}
                        </p>
                    </div>
                )}
                {step === 2 && (
                    <div className="animate-in fade-in slide-in-from-right-8 duration-300">
                        <label className="text-sm font-medium text-gray-500 mb-3 text-center block">{t('booking.time')}</label>
                        <div className="grid grid-cols-3 gap-2 max-h-[240px] overflow-y-auto pr-1 custom-scrollbar">
                            {timeSlots.map(time => (
                                <button
                                    key={time}
                                    onClick={() => setData(p => ({ ...p, time: time }))}
                                    className={`py-2 px-1 rounded-xl text-sm font-medium transition-all duration-200 border ${data.time === time
                                        ? `bg-[${HOGU_COLORS.primary}] text-white border-[${HOGU_COLORS.primary}] shadow-md`
                                        : 'bg-gray-50 text-gray-600 border-transparent hover:bg-gray-100'
                                        }`}
                                >
                                    {time}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
                {step === 3 && (
                    <div className="animate-in fade-in slide-in-from-right-8 duration-300 flex flex-col h-full">
                        <div className="bg-gray-50 rounded-2xl p-4 mb-6 border border-gray-100 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center shadow-sm`}>
                                    <Calendar size={14} style={{ color: HOGU_COLORS.primary }} />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wide">{t('booking.dateLabel')}</span>
                                    <span className="text-xs font-bold text-gray-900 capitalize leading-tight">
                                        {formatDateDocs(data.date, i18n.language === 'it' ? 'it-IT' : 'en-US')}
                                    </span>
                                </div>
                            </div>
                            <div className="w-px h-6 bg-gray-200 mx-1"></div>
                            <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center shadow-sm`}>
                                    <Clock size={14} style={{ color: HOGU_COLORS.primary }} />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wide">{t('booking.timeLabel')}</span>
                                    <span className="text-xs font-bold text-gray-900 leading-tight">
                                        {data.time}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <label className="text-sm font-medium text-gray-500 mb-4 text-center block">{t('booking.guestsLabel')}</label>
                        <div className="flex items-center justify-center gap-6 mb-8">
                            <button onClick={() => updateGuests(-1)} className="w-12 h-12 rounded-full border-2 border-gray-100 flex items-center justify-center text-gray-400 hover:bg-gray-50 text-2xl pb-1">-</button>
                            <span className="text-3xl font-bold text-gray-900">{data.guests}</span>
                            <button onClick={() => updateGuests(1)} className={`w-12 h-12 rounded-full border-2 border-[${HOGU_COLORS.primary}]/30 flex items-center justify-center text-[${HOGU_COLORS.primary}] hover:bg-[${HOGU_COLORS.primary}] hover:text-white text-2xl pb-1`}>+</button>
                        </div>
                    </div>
                )}
            </div>
            <div className="mt-6 flex gap-3 pt-4 border-t border-gray-50">
                {step > 1 && (
                    <button onClick={() => setStep(p => p - 1)} className="px-5 py-3 rounded-xl font-medium text-gray-400 hover:bg-gray-50">{t('booking.back')}</button>
                )}
                <PrimaryButton
                    onClick={() => {
                        if (step < 3) setStep(p => p + 1);
                        else onConfirm(data);
                    }}
                    disabled={(step === 1 && !data.date) || (step === 2 && !data.time) || (step === 3 && !data.guests)}
                    className="flex-1 py-4 text-base font-bold shadow-lg"
                >
                    {step === 3 ? t('booking.confirm') : t('booking.continue')}
                </PrimaryButton>
            </div>
        </div>
    );
};

// --- SIDEBAR DESKTOP ---
const DesktopBookingWidget = ({ onConfirmBooking, basePrice, initialDate, initialTime, initialPersons }) => {
    const { t } = useTranslation('restaurant');
    const [step, setStep] = useState((initialDate && initialTime) ? 3 : 1);
    const [data, setData] = useState({
        date: initialDate || '',
        time: initialTime || '',
        guests: initialPersons || 2
    });

    const timeSlots = generateTimeSlots();

    useEffect(() => {
        if (initialDate || initialTime) {
            setData(prev => ({
                ...prev,
                date: initialDate || prev.date,
                time: initialTime || prev.time
            }));
            if (initialDate && initialTime) {
                setStep(3);
            } else if (initialDate) {
                setStep(2);
            }
        }
    }, [initialDate, initialTime]);

    return (
        <div className="bg-white rounded-3xl shadow-[0_20px_40px_-10px_rgba(0,0,0,0.1)] border border-gray-100 overflow-hidden sticky top-28">
            <div className="px-6 pt-6 pb-4 bg-white relative z-10">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <Calendar className="w-5 h-5" style={{ color: HOGU_COLORS.primary }} /> {t('booking.prenotaTitle')}
                    </h2>
                    <span className="text-xs font-semibold text-gray-400 bg-gray-50 px-2 py-1 rounded-md uppercase">
                        {t('booking.step')} {step}/3
                    </span>
                </div>
                <div className="h-1 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div
                        className={`h-full bg-[${HOGU_COLORS.primary}] transition-all duration-500`}
                        style={{ width: step === 1 ? '33%' : step === 2 ? '66%' : '100%' }}
                    />
                </div>
            </div>
            <div className="p-6 pt-2">
                <BookingFormContent
                    step={step}
                    setStep={setStep}
                    data={data}
                    setData={setData}
                    basePrice={basePrice}
                    onConfirm={onConfirmBooking}
                    timeSlots={timeSlots}
                />
            </div>
        </div>
    );
};

// --- MOBILE SHEET ---
const MobileBookingSheet = ({ onConfirmBooking, basePrice, initialDate, initialTime, initialPersons }) => {
    const { t } = useTranslation('restaurant');
    const [isOpen, setIsOpen] = useState(false);
    const [step, setStep] = useState((initialDate && initialTime) ? 3 : 1);
    const [data, setData] = useState({
        date: initialDate || '',
        time: initialTime || '',
        guests: initialPersons || 2
    });

    const timeSlots = generateTimeSlots();

    useEffect(() => {
        if (!isOpen) {
            setTimeout(() => {
                setStep((initialDate && initialTime) ? 3 : 1);
            }, 300);
        }
    }, [isOpen, initialDate, initialTime]);

    useEffect(() => {
        if (initialDate || initialTime) {
            setData(prev => ({
                ...prev,
                date: initialDate || prev.date,
                time: initialTime || prev.time
            }));
            if (initialDate && initialTime) setStep(3);
            else if (initialDate) setStep(2);
        }
    }, [initialDate, initialTime]);

    return (
        <>
            <div className="fixed bottom-0 left-0 right-0 z-[900] bg-white/95 backdrop-blur-md border-t border-gray-200/50 p-4 shadow-[0_-5px_20px_rgba(0,0,0,0.1)] md:hidden safe-area-bottom rounded-t-2xl">
                <div className="flex items-center justify-between gap-4 max-w-md mx-auto">
                    <div className="flex flex-col">
                        <span className="text-[10px] text-gray-500 uppercase tracking-wide font-semibold">{t('booking.avgPrice')}</span>
                        <div className="flex items-baseline gap-1">
                            <span className="text-xl font-bold text-gray-900">€ {typeof basePrice === 'number' ? basePrice.toFixed(2) : basePrice}</span>
                            <span className="text-xs text-gray-400">{t('booking.perPerson')}</span>
                        </div>
                    </div>
                    <PrimaryEmphasis
                        onClick={() => setIsOpen(true)}
                        className={`flex-1 py-3 text-base shadow-lg shadow-[${HOGU_COLORS.primary}]/25 active:scale-95 transition-transform rounded-xl`}
                    >
                        {t('booking.bookTable')}
                    </PrimaryEmphasis>
                </div>
            </div>

            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[950] transition-opacity duration-300 md:hidden"
                    onClick={() => setIsOpen(false)}
                />
            )}

            <div className={`fixed bottom-0 left-0 right-0 z-[1000] bg-white rounded-t-[2rem] shadow-[0_-10px_40px_rgba(0,0,0,0.2)] transition-transform duration-500 cubic-bezier(0.32, 0.72, 0, 1) md:hidden flex flex-col max-h-[85vh] ${isOpen ? 'translate-y-0' : 'translate-y-[110%]'}`}>
                <div className="w-full flex justify-center pt-3 pb-1" onClick={() => setIsOpen(false)}>
                    <div className="w-12 h-1.5 bg-gray-300 rounded-full cursor-pointer hover:bg-gray-400 transition-colors opacity-50"></div>
                </div>
                <div className="px-6 pt-2 pb-4 border-b border-gray-50 flex justify-between items-center bg-white rounded-t-[2rem]">
                    <div>
                        <h3 className="text-xl font-bold text-gray-900 tracking-tight">{t('booking.bookTable')}</h3>
                        <p className="text-xs text-gray-400 font-medium">{t('booking.completeSteps')}</p>
                    </div>
                    <div className={`w-10 h-10 rounded-full bg-[${HOGU_COLORS.primary}]/10 flex items-center justify-center font-bold text-[${HOGU_COLORS.primary}] text-sm`}>
                        {step}/3
                    </div>
                </div>
                <div className="p-6 overflow-y-auto safe-area-bottom bg-white">
                    <BookingFormContent
                        step={step}
                        setStep={setStep}
                        data={data}
                        setData={setData}
                        basePrice={basePrice}
                        onConfirm={onConfirmBooking}
                        timeSlots={timeSlots}
                    />
                </div>
            </div>
        </>
    );
};

// --- 4. PAGINA DETTAGLIO PRINCIPALE ---
export const ServiceDetailPageRestaurant = ({ id, dateFrom, timeFrom, totalPersons }) => {
    const { t } = useTranslation('restaurant');
    const navigate = useNavigate();

    const [service, setService] = useState(null);
    const [urgencyCount, setUrgencyCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [mapCoordinates, setMapCoordinates] = useState({ lat: null, lon: null });

    const loadedId = useRef(null);

    useEffect(() => {
        if (!id) return;
        if (loadedId.current === id) return;
        loadedId.current = id;

        const fetchAllData = async () => {
            try {
                setLoading(true);
                const [restaurantData, infoData] = await Promise.all([
                    restaurantService.getRestaurantDetail(id),
                    infoService.getInfoRestaurant()
                ]);

                setService(restaurantData);
                setUrgencyCount(infoData);

            } catch (err) {
                console.error(err);
                setError(err.message || t('error.loading'));
                loadedId.current = null;
            } finally {
                setLoading(false);
            }
        };

        fetchAllData();
    }, [id]);

    // --- GEOCODING ISOLATO ---
    useEffect(() => {
        if (!service) return;

        const fetchCoordinates = async () => {
            const locale = service.serviceLocale?.find(l => l.language === 'it') ||
                service.serviceLocale?.[0] || {};

            const addressParts = [
                locale.address?.trim(),
                locale.city?.trim(),
                locale.country?.trim()
            ].filter(Boolean);

            const fullAddress = addressParts.join(', ');

            if (fullAddress && fullAddress !== ',') {
                try {
                    const mapData = await mapService.getCoordinatesFromAddress(fullAddress);
                    if (mapData?.latitude && mapData?.longitude) {
                        setMapCoordinates({ lat: mapData.latitude, lon: mapData.longitude });
                    }
                } catch (mapError) {
                    console.warn("Geocoding fallito (indirizzo:", fullAddress, "):", mapError);
                }
            } else {
                console.info("Indirizzo non sufficiente per geocoding → mappa non caricata");
            }
        };

        fetchCoordinates();
    }, [service]);

    const parsedData = useMemo(() => {
        if (!service) return null;

        let menuItems = [];
        let dailySpecials = null;

        try {
            if (service.menu) {
                const parsed = JSON.parse(service.menu);
                if (parsed && parsed.menu && Array.isArray(parsed.menu)) {
                    const fullMenu = parsed.menu;
                    const specialsIndex = fullMenu.findIndex(c => c.category.toLowerCase().includes('fuori menu'));
                    if (specialsIndex !== -1) {
                        dailySpecials = fullMenu[specialsIndex];
                        menuItems = fullMenu.filter((_, idx) => idx !== specialsIndex);
                    } else {
                        menuItems = fullMenu;
                    }
                }
            }
        } catch (e) { console.error("Errore parsing menu JSON:", e); }

        const locale = service.serviceLocale
            ? (service.serviceLocale.find(l => l.language === 'it') || service.serviceLocale[0])
            : null;

        const displayAddress = locale ? `${locale.address}, ${locale.city}, ${locale.country}` : "";
        const images = (service.images && service.images.length > 0)
            ? service.images.map(img => img.startsWith('http') ? img : `/files/restaurant/${id}/${img}`)
            : ['https://placehold.co/1200x800/f1f5f9/94a3b8?text=Foto+Non+Disponibile'];

        return {
            title: service.name,
            description: service.description,
            type: service.serviceType,
            price: service.basePrice,
            menuItems,
            dailySpecials,
            displayAddress,
            images,
            available: service.available !== false // Estraggo available (default true)
        };
    }, [service, id]);

    const handleBookingRedirect = (bookingData) => {
        const total = parsedData.price * bookingData.guests;
        navigate('/payment/summary', {
            state: {
                booking: {
                    ...bookingData,
                    serviceId: service.id,
                    serviceType: 'RESTAURANT',
                    total: total
                },
                service: parsedData
            }
        });
    };

    if (loading) return <LoadingScreen isLoading={true} />;

    if (error) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <ErrorModal message={error} onClose={() => navigate('/service/restaurant')} />
        </div>
    );

    if (!parsedData) return null;

    if (!parsedData.available) {
        return <ServiceUnavailablePage />;
    }

    const breadcrumbsItems = [
        { label: t('breadcrumb.home'), href: '/' },
        { label: t('breadcrumb.restaurants'), href: '/service/restaurant' },
        { label: parsedData.title }
    ];

    return (
        <div className={`min-h-screen bg-white ${HOGU_THEME.fontFamily} pb-24 md:pb-0`}>
            {/* Sfondo sfumato */}
            <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-gray-50 to-white -z-10"></div>

            <div className="max-w-7xl mx-auto px-4 py-6 lg:px-8 lg:py-10">
                <Breadcrumbs items={breadcrumbsItems} className="mb-6 opacity-80" />

                <ServiceHeaderDetail title={parsedData.title} />

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-10">
                    {/* COLONNA SINISTRA */}
                    <div className="lg:col-span-8 space-y-8 md:space-y-12">
                        <div className="-mx-4 md:mx-0 rounded-none md:rounded-3xl overflow-hidden shadow-none md:shadow-sm border-y md:border border-gray-100 md:border-gray-100">
                            <ServiceImageGallery
                                images={parsedData.images}
                                mainImageHeight="h-64 md:h-96"
                                thumbnailHeight="h-20"
                            />
                        </div>

                        <section>
                            {/* --- HEADER UNIFORME --- */}
                            <div className="flex items-center gap-3 mb-4 md:mb-6">
                                <div className={`p-2 md:p-3 rounded-xl bg-[${HOGU_COLORS.primary}]/10`}>
                                    <BookOpen className={`w-5 h-5 md:w-6 md:h-6 text-[${HOGU_COLORS.primary}]`} />
                                </div>
                                <h2 className="text-lg md:text-2xl font-bold tracking-tight text-gray-900">{t('experience.title')}</h2>
                            </div>
                            <ExpandableDescription text={parsedData.description} />
                        </section>

                        <RestaurantMenuSection
                            menuList={parsedData.menuItems}
                            dailySpecials={parsedData.dailySpecials}
                        />

                        <section className="pt-8 border-t border-gray-100">
                            {/* --- HEADER UNIFORME --- */}
                            <div className="flex items-center gap-3 mb-4 md:mb-6">
                                <div className={`p-2 md:p-3 rounded-xl bg-[${HOGU_COLORS.primary}]/10`}>
                                    <MapPin className={`w-5 h-5 md:w-6 md:h-6 text-[${HOGU_COLORS.primary}]`} />
                                </div>
                                <h2 className="text-lg md:text-2xl font-bold tracking-tight text-gray-900">{t('map.whereToFindUs')}</h2>
                            </div>
                            <LeafletMapClub lat={mapCoordinates.lat} lon={mapCoordinates.lon} name={parsedData.title} />

                            {/* Address Card Elegante (Responsive) */}
                            <div className="mt-4 md:mt-6">
                                <div className="bg-white rounded-2xl p-5 shadow-[0_8px_30px_rgba(0,0,0,0.06)] border border-gray-100 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                    <div className="flex items-start gap-4">
                                        <div className={`p-3 rounded-2xl bg-[${HOGU_COLORS.primary}]/10 shrink-0`}>
                                            <MapPin className={`w-6 h-6 text-[${HOGU_COLORS.primary}]`} />
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">{t('map.whereWeAre')}</span>
                                            <p className="text-gray-900 font-medium leading-relaxed text-sm md:text-base">
                                                {parsedData.displayAddress}
                                            </p>
                                        </div>
                                    </div>
                                    <a
                                        href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(parsedData.displayAddress)}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={`w-full md:w-auto md:min-w-[200px] py-3 md:px-6 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-900 font-semibold text-sm flex items-center justify-center gap-2 transition-colors border border-gray-200 active:scale-[0.98]`}
                                    >
                                        <span>{t('map.getDirections')}</span>
                                        <Navigation className="w-4 h-4" />
                                    </a>
                                </div>
                            </div>
                        </section>
                    </div>

                    {/* COLONNA DESTRA (SOLO DESKTOP) */}
                    <div className="hidden md:block lg:col-span-4">
                        <div className="relative h-full">
                            <DesktopBookingWidget
                                onConfirmBooking={handleBookingRedirect}
                                basePrice={parsedData.price}
                                initialDate={dateFrom}
                                initialTime={timeFrom}
                                initialPersons={totalPersons}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* WIDGET MOBILE (SOLO MOBILE) */}
            <MobileBookingSheet
                onConfirmBooking={handleBookingRedirect}
                basePrice={parsedData.price}
                initialDate={dateFrom}
                initialTime={timeFrom}
                initialPersons={totalPersons}
            />

            {urgencyCount > 0 && <LiveViewersFloatingBadge count={urgencyCount} />}
        </div>
    );
};

export default ServiceDetailPageRestaurant;

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
    ArrowRight, MapPin, Calendar, Clock, Search,
    ChevronLeft, ChevronRight, ChevronDown, Loader2, Minus, Plus, Luggage, CheckCircle2
} from 'lucide-react';
import { PageHeader } from '../../ui/PageHeader.jsx';
import { PopularDestinations } from '../../ui/PopularDestinations.jsx';
import { CityAutocomplete } from '../../ui/CityAutocomplete.jsx';
import SafeImage from '../../ui/SafeImage.jsx';

import { HOGU_COLORS, HOGU_THEME } from '../../../config/theme.js';
import { luggageService } from '../../../api/apiClient.js';
import { createLocationPayload } from "../../../utils/locationUtils.js";
import { calculateLuggageTotal } from "../../../utils/pricingUtils.js";
import LoadingScreen from "../../ui/LoadingScreen.jsx";
import ErrorModal from "../../ui/ErrorModal.jsx";
import { slugify } from '../../../utils/slugify.js';

const MOBILE_FONT = "font-['SF_Pro_Text',_Roboto,_'Inter',_system-ui,_sans-serif]";

const breadcrumbsItems = [
    { labelKey: 'breadcrumbs.home', href: '/' },
    { labelKey: 'breadcrumbs.luggage', href: '/service/luggage' }
];

// --- CONTAINER INPUT ---
const SearchInputContainer = ({ label, icon: Icon, children, className = '', required = false }) => (
    <div className={`flex flex-col gap-1 lg:gap-3 flex-1 min-w-0 md:min-w-[200px] ${className}`}>
        <label className={`flex items-center gap-1.5 ${MOBILE_FONT} text-[12px] leading-[16px] font-normal md:text-xs md:font-bold uppercase tracking-wide text-[${HOGU_COLORS.subtleText}] ml-1`}>
            <Icon size={12} className={`text-[${HOGU_COLORS.primary}]`} />
            {label} {required && <span className="text-red-500">*</span>}
        </label>
        <div className="flex gap-2 bg-white p-1 rounded-xl lg:rounded-2xl border border-gray-100 shadow-sm focus-within:ring-2 focus-within:ring-[#68B49B]/20 focus-within:border-[#68B49B] transition-all h-[42px] md:h-[60px] items-center">
            {children}
        </div>
    </div>
);

// --- COMPONENTI UI BASE ---
function IconButton({ onClick, icon: Icon, disabled, colorClass = "text-gray-600", sizeClass = "w-8 h-8" }) {
    return (
        <button
            onClick={(e) => { e.stopPropagation(); onClick(); }}
            disabled={disabled}
            type="button"
            className={`
                ${sizeClass} rounded-full flex items-center justify-center transition-all duration-200
                ${disabled
                    ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
                    : `bg-gray-50 hover:bg-[#68B49B] hover:text-white ${colorClass} shadow-sm hover:shadow-md`
                }
            `}
        >
            <Icon size={16} strokeWidth={3} />
        </button>
    );
}

function PrimaryButton({ children, onClick, className = '', disabled = false, type = 'button', style = {} }) {
    return (
        <button type={type} onClick={onClick} disabled={disabled} style={style}
            className={`bg-[#68B49B] text-white ${HOGU_THEME.fontFamily} ${MOBILE_FONT}
        px-6 py-3 lg:px-8 lg:py-4 text-[16px] leading-[20px] font-semibold md:text-base md:font-bold lg:text-lg rounded-2xl transition-all duration-300 ease-out
        shadow-[0_8px_20px_-6px_rgba(104,180,155,0.5)] hover:shadow-[0_12px_25px_-8px_rgba(104,180,155,0.7)]
        hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed
        flex items-center justify-center gap-2 ${className}`}>
            {children}
        </button>
    );
}

// --- COMPONENTI LUGGAGE SPECIFICI ---
const LUGGAGE_SIZES_MOCK = [
    { value: 'S', labelKey: 'luggage_listing.luggage_selector.size_s_label', descKey: 'luggage_listing.luggage_selector.size_s_desc' },
    { value: 'M', labelKey: 'luggage_listing.luggage_selector.size_m_label', descKey: 'luggage_listing.luggage_selector.size_m_desc' },
    { value: 'L', labelKey: 'luggage_listing.luggage_selector.size_l_label', descKey: 'luggage_listing.luggage_selector.size_l_desc' },
];

const LuggageSelectorCard = ({ bag, onUpdateQuantity }) => {
    const { t } = useTranslation("home");
    const isSelected = bag.quantity > 0;

    const handleUpdate = (id, change) => {
        if (onUpdateQuantity) onUpdateQuantity(id, change);
    };

    return (
        <div
            onClick={() => handleUpdate(bag.id, 1)}
            className={`
              relative p-2 sm:p-3 rounded-2xl border transition-all duration-200 cursor-pointer select-none group 
              flex flex-col items-center justify-center text-center gap-1 sm:gap-0
              ${isSelected
                    ? 'bg-[#F0FDF9] border-[#68B49B] shadow-md'
                    : 'bg-white border-gray-100 hover:border-[#68B49B]/50 hover:shadow-lg'
                }
           `}
        >
            <div className="flex flex-col items-center gap-1 sm:gap-0 flex-1">
                <div className={`w-10 h-10 flex items-center justify-center rounded-full sm:mb-1 shrink-0 ${isSelected ? 'bg-[#68B49B] text-white' : 'bg-gray-50 text-gray-400'}`}>
                    <Luggage size={bag.id === 'S' ? 18 : bag.id === 'M' ? 22 : 26} />
                </div>
                <div>
                    <p className={`${MOBILE_FONT} text-[14px] leading-[20px] font-normal md:text-[11px] md:font-bold md:text-xs sm:text-sm ${isSelected ? 'text-[#33594C]' : 'text-gray-700'}`}>{t(bag.labelKey)}</p>
                    <p className={`hidden sm:block ${MOBILE_FONT} text-[12px] leading-[16px] font-normal text-gray-400 sm:mt-0.5 leading-tight md:text-[10px]`}>{t(bag.descKey)}</p>
                </div>
            </div>

            <div className="flex items-center gap-1 sm:gap-2 mt-1 sm:mt-2 shrink-0">
                <IconButton icon={Minus} onClick={() => handleUpdate(bag.id, -1)} disabled={bag.quantity <= 0} sizeClass="w-6 h-6 sm:w-8 sm:h-8" />
                <span className="text-xs sm:text-sm font-bold w-3 text-center">{bag.quantity}</span>
                <IconButton icon={Plus} onClick={() => handleUpdate(bag.id, 1)} colorClass="text-[#68B49B]" sizeClass="w-6 h-6 sm:w-8 sm:h-8" />
            </div>
        </div>
    );
};

const DesktopLuggageSelector = ({ bags, onUpdateQuantity, className = '' }) => {
    const { t } = useTranslation("home");
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef(null);
    const totalBags = bags.reduce((acc, b) => acc + b.quantity, 0);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className={`relative flex flex-col gap-3 flex-1 min-w-0 md:min-w-[200px] ${className}`} ref={containerRef}>
            <label className={`hidden lg:flex items-center gap-2 text-[10px] md:text-xs font-bold uppercase tracking-wide text-[${HOGU_COLORS.subtleText}] ml-1`}>
                <Luggage size={14} className={`text-[${HOGU_COLORS.primary}]`} />
                {t('luggage_listing.search.luggage_label')}
            </label>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`
                    w-full h-[48px] md:h-[60px] bg-white rounded-2xl border border-gray-100 shadow-sm 
                    flex items-center justify-between px-4 transition-all hover:border-[#68B49B]/50
                    ${isOpen ? 'ring-2 ring-[#68B49B]/20 border-[#68B49B]' : ''}
                `}
            >
                <span className="font-medium text-gray-700 text-sm truncate">
                    {totalBags > 0 ? t('luggage_listing.card.luggage_count', { count: totalBags }) : t('luggage_listing.search.select')}
                </span>
                <ChevronDown size={16} className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 p-4 z-[60]">
                    <div className="flex flex-col gap-3">
                        {bags.map(bag => (
                            <LuggageSelectorCard
                                key={bag.id}
                                bag={bag}
                                onUpdateQuantity={onUpdateQuantity}
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

function MobileCombinedScheduleSelector({
    depositDate, depositTime,
    pickupDate, pickupTime,
    onUpdate,
    minDate
}) {
    const { t, i18n } = useTranslation("home");
    const [isOpen, setIsOpen] = useState(false);

    // Formatting for display
    const formatDateTime = (date, time) => {
        if (!date) return '-';
        const d = new Date(date).toLocaleDateString(i18n.language === 'en' ? 'en-US' : 'it-IT', { day: '2-digit', month: 'short' });
        return `${d} ${time || ''}`;
    };

    return (
        <>
            <div className="w-full h-full px-2 text-left flex items-center justify-between cursor-pointer" onClick={() => setIsOpen(true)}>
                <div className="flex items-center justify-between w-full">
                    <span className={`${MOBILE_FONT} text-[16px] leading-[24px] font-semibold text-gray-800 truncate flex-1 text-left leading-tight md:text-[11px] md:font-bold`}>{formatDateTime(depositDate, depositTime)}</span>
                    <ArrowRight size={12} className="text-gray-400 mx-1 flex-shrink-0" />
                    <span className={`${MOBILE_FONT} text-[16px] leading-[24px] font-semibold text-gray-800 truncate flex-1 text-right leading-tight md:text-[11px] md:font-bold`}>{formatDateTime(pickupDate, pickupTime)}</span>
                </div>
                <ChevronDown size={14} className="text-gray-400 flex-shrink-0 ml-1" />
            </div>

            {isOpen && createPortal(
                <div className="fixed inset-0 z-[9999] bg-gray-50 flex flex-col animate-in fade-in slide-in-from-bottom-10 duration-200">
                    <div className="px-4 py-4 bg-white border-b border-gray-100 flex items-center gap-3 shadow-sm z-10">
                        <button onClick={() => setIsOpen(false)} className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors">
                            <ChevronLeft size={24} className="text-gray-700" />
                        </button>
                        <h3 className={`${MOBILE_FONT} text-[22px] leading-[28px] font-semibold text-gray-800 md:text-lg md:font-bold`}>{t('luggage_listing.search.select_times')}</h3>
                    </div>

                    <div className="p-4 flex flex-col gap-4 overflow-y-auto flex-1">
                        {/* Deposit Card */}
                        <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100">
                            <h4 className={`${MOBILE_FONT} text-[12px] leading-[16px] font-normal md:font-bold text-[#68B49B] flex items-center gap-2 mb-2 md:text-sm uppercase tracking-wide`}>
                                <Calendar size={18} /> {t('luggage_listing.search.deposit')}
                            </h4>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="flex flex-col gap-1.5 min-w-0">
                                    <label className={`${MOBILE_FONT} text-[12px] leading-[16px] font-normal md:font-bold uppercase tracking-wide text-[${HOGU_COLORS.subtleText}] ml-1 md:text-[10px] md:text-xs`}>{t('luggage_listing.search.date')}</label>
                                    <div className="relative w-full">
                                        <input
                                            type="date"
                                            className={`w-full h-[56px] px-3 bg-gray-50 rounded-2xl border-transparent focus:bg-white focus:border-[#68B49B] focus:ring-4 focus:ring-[#68B49B]/10 outline-none ${MOBILE_FONT} text-[16px] leading-[24px] font-semibold text-gray-700 transition-all md:text-sm sm:text-base cursor-pointer`}
                                            value={depositDate}
                                            min={minDate}
                                            onChange={(e) => onUpdate('depositDate', e.target.value)}
                                            onClick={(e) => e.target.showPicker?.()}
                                        />
                                        <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
                                    </div>
                                </div>
                                <div className="flex flex-col gap-1.5 min-w-0">
                                    <label className={`${MOBILE_FONT} text-[12px] leading-[16px] font-normal md:font-bold uppercase tracking-wide text-[${HOGU_COLORS.subtleText}] ml-1 md:text-[10px] md:text-xs`}>{t('luggage_listing.search.time')}</label>
                                    <div className="relative w-full">
                                        <input
                                            type="time"
                                            className={`w-full h-[56px] px-3 bg-gray-50 rounded-2xl border-transparent focus:bg-white focus:border-[#68B49B] focus:ring-4 focus:ring-[#68B49B]/10 outline-none ${MOBILE_FONT} text-[16px] leading-[24px] font-semibold text-gray-700 transition-all md:text-sm sm:text-base cursor-pointer`}
                                            value={depositTime}
                                            onChange={(e) => onUpdate('depositTime', e.target.value)}
                                            onClick={(e) => e.target.showPicker?.()}
                                        />
                                        <Clock className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Connector */}
                        <div className="flex justify-center -my-2 relative z-0">
                            <div className="bg-gray-200 text-gray-400 rounded-full p-1.5 ring-4 ring-gray-50">
                                <ArrowRight size={16} className="rotate-90" />
                            </div>
                        </div>

                        {/* Pickup Card */}
                        <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100">
                            <h4 className={`${MOBILE_FONT} text-[12px] leading-[16px] font-normal md:font-bold text-[#68B49B] flex items-center gap-2 mb-2 md:text-sm uppercase tracking-wide`}>
                                <Clock size={18} /> {t('luggage_listing.search.pickup')}
                            </h4>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="flex flex-col gap-1.5 min-w-0">
                                    <label className={`${MOBILE_FONT} text-[12px] leading-[16px] font-normal md:font-bold uppercase tracking-wide text-[${HOGU_COLORS.subtleText}] ml-1 md:text-[10px] md:text-xs`}>{t('luggage_listing.search.date')}</label>
                                    <div className="relative w-full">
                                        <input
                                            type="date"
                                            className={`w-full h-[56px] px-3 bg-gray-50 rounded-2xl border-transparent focus:bg-white focus:border-[#68B49B] focus:ring-4 focus:ring-[#68B49B]/10 outline-none ${MOBILE_FONT} text-[16px] leading-[24px] font-semibold text-gray-700 transition-all md:text-sm sm:text-base cursor-pointer`}
                                            value={pickupDate}
                                            min={depositDate || minDate}
                                            onChange={(e) => onUpdate('pickupDate', e.target.value)}
                                            onClick={(e) => e.target.showPicker?.()}
                                        />
                                        <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
                                    </div>
                                </div>
                                <div className="flex flex-col gap-1.5 min-w-0">
                                    <label className={`${MOBILE_FONT} text-[12px] leading-[16px] font-normal md:font-bold uppercase tracking-wide text-[${HOGU_COLORS.subtleText}] ml-1 md:text-[10px] md:text-xs`}>{t('luggage_listing.search.time')}</label>
                                    <div className="relative w-full">
                                        <input
                                            type="time"
                                            className={`w-full h-[56px] px-3 bg-gray-50 rounded-2xl border-transparent focus:bg-white focus:border-[#68B49B] focus:ring-4 focus:ring-[#68B49B]/10 outline-none ${MOBILE_FONT} text-[16px] leading-[24px] font-semibold text-gray-700 transition-all md:text-sm sm:text-base cursor-pointer`}
                                            value={pickupTime}
                                            onChange={(e) => onUpdate('pickupTime', e.target.value)}
                                            onClick={(e) => e.target.showPicker?.()}
                                        />
                                        <Clock className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-auto p-4 border-t border-gray-100 bg-white safe-area-bottom shadow-[0_-4px_20px_-8px_rgba(0,0,0,0.1)] z-10">
                        <PrimaryButton onClick={() => setIsOpen(false)} className={`w-full !rounded-xl !py-4 ${MOBILE_FONT} !text-[16px] !leading-[20px] !font-semibold shadow-lg shadow-[#68B49B]/30 md:text-lg md:font-bold`}>
                            {t('luggage_listing.search.confirm_times')}
                        </PrimaryButton>
                    </div>
                </div>,
                document.body
            )}
        </>
    );
}

function MobileLuggageSelector({ bags, onUpdateQuantity }) {
    const { t } = useTranslation("home");
    const [isOpen, setIsOpen] = useState(false);
    const totalBags = bags.reduce((acc, b) => acc + b.quantity, 0);

    return (
        <>
            <div className="w-full h-full px-2 text-left flex items-center justify-between cursor-pointer" onClick={() => setIsOpen(true)}>
                <span className={`${MOBILE_FONT} text-[16px] leading-[24px] font-semibold text-gray-800 shrink-0 md:text-xs md:font-bold`}>
                    {totalBags > 0 ? t('luggage_listing.card.luggage_count', { count: totalBags }) : t('luggage_listing.search.select')}
                </span>
                <div className="flex items-center gap-1 overflow-hidden justify-end flex-1 ml-2">
                    <div className="flex gap-1 overflow-hidden justify-end">
                        {bags.map(b => b.quantity > 0 && (
                            <span key={b.id} className="text-[9px] bg-gray-100 px-1 py-0.5 rounded text-gray-500 font-medium whitespace-nowrap">
                                {b.quantity}x{b.size}
                            </span>
                        ))}
                    </div>
                    <ChevronDown size={14} className="text-gray-400 shrink-0" />
                </div>
            </div>
            {isOpen && createPortal(
                <div className="fixed inset-0 z-[99999] bg-white flex flex-col animate-in fade-in slide-in-from-bottom-10 duration-200">
                    <div className="px-4 py-4 border-b border-gray-100 flex items-center gap-3">
                        <button onClick={() => setIsOpen(false)} className="p-2 -ml-2 rounded-full hover:bg-gray-100">
                            <ChevronLeft size={24} className="text-gray-700" />
                        </button>
                        <h3 className={`${MOBILE_FONT} text-[22px] leading-[28px] font-semibold text-gray-800 md:text-lg md:font-bold`}>{t('luggage_listing.search.select_luggage')}</h3>
                    </div>

                    <div className="p-6 flex flex-col bg-white">
                        {bags.map((bag, idx) => {
                            const isSelected = bag.quantity > 0;
                            const iconSize = bag.id === 'S' ? 18 : bag.id === 'M' ? 26 : 34;

                            return (
                                <div key={bag.id} className={`flex items-center justify-between py-5 ${idx !== bags.length - 1 ? 'border-b border-gray-100' : ''}`}>
                                    <div className="flex items-center gap-4">
                                        <div className={`w-12 h-12 flex items-center justify-center rounded-full transition-colors ${isSelected ? 'bg-[#68B49B]/10 text-[#68B49B]' : 'bg-gray-50 text-gray-400'}`}>
                                            <Luggage size={iconSize} />
                                        </div>
                                        <div>
                                            <p className={`${MOBILE_FONT} text-[16px] leading-[24px] font-semibold text-gray-800 md:text-base md:font-bold`}>{t(bag.labelKey)}</p>
                                            <p className={`${MOBILE_FONT} text-[14px] leading-[20px] font-normal text-gray-500 md:text-xs md:font-medium`}>{t(bag.descKey)}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <button type="button" onClick={() => onUpdateQuantity(bag.id, -1)} disabled={bag.quantity <= 0}
                                            className="w-10 h-10 rounded-full border border-gray-200 text-gray-500 flex items-center justify-center transition-colors disabled:opacity-30">
                                            <Minus size={18} strokeWidth={3} />
                                        </button>
                                        <span className={`${MOBILE_FONT} text-[18px] leading-[24px] font-semibold text-gray-800 w-5 text-center md:text-lg md:font-black`}>{bag.quantity}</span>
                                        <button type="button" onClick={() => onUpdateQuantity(bag.id, 1)}
                                            className="w-10 h-10 rounded-full bg-[#68B49B] text-white flex items-center justify-center transition-transform active:scale-90 shadow-md">
                                            <Plus size={18} strokeWidth={3} />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="mt-auto p-4 border-t border-gray-100 bg-white safe-area-bottom">
                        <PrimaryButton onClick={() => setIsOpen(false)} className={`${MOBILE_FONT} !text-[16px] !leading-[20px] !font-semibold w-full !rounded-xl !py-3`}>
                            {t('luggage_listing.search.confirm_count', { count: totalBags })}
                        </PrimaryButton>
                    </div>
                </div>,
                document.body
            )}
        </>
    )
}

const LuggageResultCard = ({ service, totalBags, onClick, searchCriteria }) => {
    const { t } = useTranslation("home");
    const [isExpanded, setIsExpanded] = useState(true);

    const bagsS = searchCriteria?.luggage?.find(l => l.id === 'S')?.quantity || 0;
    const bagsM = searchCriteria?.luggage?.find(l => l.id === 'M')?.quantity || 0;
    const bagsL = searchCriteria?.luggage?.find(l => l.id === 'L')?.quantity || 0;

    // --- NORMALIZZAZIONE SIZE PRICES (Stessa logica di ServiceDetailPageLuggage) ---
    let normalizedSizePrices = service.sizePrices ? [...service.sizePrices] : [];

    if (normalizedSizePrices.length > 0) {
        normalizedSizePrices = normalizedSizePrices.map(sp => {
            const pPerHour = sp.pricePerHour || 0;
            let pPerDay = sp.pricePerDay || 0;

            // FIX: Se il prezzo giornaliero è 0 ma c'è un prezzo orario,
            // impostiamo il giornaliero a (orario * 24) per evitare che il calcolo (Math.min) dia 0.
            if (pPerDay === 0 && pPerHour > 0) {
                pPerDay = pPerHour * 24;
            }

            // Fallback inverso: se manca orario, usa giornaliero
            const finalHourly = pPerHour > 0 ? pPerHour : pPerDay;

            return {
                ...sp,
                size: sp.size || sp.sizeLabel, // Supporto per sizeLabel (da API)
                pricePerDay: pPerDay,
                pricePerHour: finalHourly
            };
        });
    } else {
        // Se sizePrices è vuoto, costruiscilo dai prezzi flat
        const base = service.basePrice || 0;
        const pSmall = service.priceSmall || base;
        const pMedium = service.priceMedium || base;
        const pLarge = service.priceLarge || base;

        normalizedSizePrices = [
            { size: 'SMALL', pricePerDay: pSmall, pricePerHour: pSmall },
            { size: 'MEDIUM', pricePerDay: pMedium, pricePerHour: pMedium },
            { size: 'LARGE', pricePerDay: pLarge, pricePerHour: pLarge }
        ];
    }

    // Use shared pricing utility
    const { total, pricePerDay } = calculateLuggageTotal(
        searchCriteria?.depositDate,
        searchCriteria?.depositTime,
        searchCriteria?.pickupDate,
        searchCriteria?.pickupTime,
        { small: bagsS, medium: bagsM, large: bagsL },
        normalizedSizePrices
    );

    let totalPriceVal = total;
    let pricePerBagVal = 0;

    if (totalBags > 0) {
        pricePerBagVal = pricePerDay / totalBags;
    } else {
        // Fallback: Show minimum daily rate from sizePrices or basePrice
        const prices = service.sizePrices?.map(p => p.pricePerDay) || [];
        const minPrice = prices.length > 0 ? Math.min(...prices) : (service.basePrice || 0);
        totalPriceVal = minPrice;
        pricePerBagVal = minPrice;
    }

    const totalPrice = totalPriceVal.toFixed(2);
    const pricePerBag = pricePerBagVal.toFixed(2);

    const mainImage = (() => {
        const img = (service.images && service.images.length > 0) ? service.images[0] : service.imageUrl;
        if (!img) return `https://placehold.co/800x600/${HOGU_COLORS.dark.substring(1)}/${HOGU_COLORS.primary.substring(1)}?text=${encodeURIComponent(service.name)}`;
        if (img.startsWith('http')) return img;
        return `/files/luggage/${service.id}/${img}`;
    })();

    return (
        <div
            className={`
            group bg-white rounded-none md:rounded-3xl overflow-hidden flex flex-col md:flex-row border-y md:border border-gray-100 
            ${HOGU_THEME.shadowCard} transition-all duration-300 hover:-translate-y-1 cursor-pointer
            min-h-[180px] md:min-h-[240px]
          `}
            onClick={onClick}
        >
            <div className="md:w-1/3 h-40 md:h-72 relative overflow-hidden bg-gray-50 flex items-center justify-center md:p-4">
                <SafeImage
                    src={mainImage}
                    alt={service.name}
                    className="w-full h-full object-cover md:object-contain md:mix-blend-multiply transition-transform duration-700 scale-105 md:scale-100 md:group-hover:scale-105 drop-shadow-none md:drop-shadow-xl max-h-none md:max-h-[200px] rounded-none md:rounded-2xl block"
                />
            </div>

            <div className="px-3 pb-3 pt-1.5 md:p-8 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-2">
                    <h3 className={`${MOBILE_FONT} text-[22px] leading-[28px] font-semibold md:text-2xl md:font-bold ${HOGU_THEME.text} group-hover:text-[#68B49B] transition-colors uppercase leading-tight`}>{service.name}</h3>
                </div>
                <p className={`${MOBILE_FONT} text-[14px] leading-[20px] font-normal md:text-[11px] md:text-sm mt-0 flex items-center gap-1 text-[${HOGU_COLORS.subtleText}]`}>
                    <MapPin size={14} /> {service.location || service.address}
                </p>

                <div className={`mt-1 mb-1 md:my-2 ${isExpanded ? 'block' : 'hidden md:block'}`}>
                    <p className={`${MOBILE_FONT} text-[14px] leading-[20px] font-normal text-gray-500 md:text-xs md:text-sm md:leading-relaxed line-clamp-2 md:line-clamp-3`}>
                        {service.description}
                    </p>
                    <div className={`flex flex-wrap gap-x-4 gap-y-2 mb-4 mt-3 ${MOBILE_FONT} text-[12px] leading-[16px] font-normal text-gray-500 md:text-xs md:font-medium`}>
                        <span className="flex items-center gap-1"><CheckCircle2 size={12} className="text-[#68B49B]" /> {t('luggage_listing.card.feature_insurance')}</span>
                        <span className="flex items-center gap-1"><CheckCircle2 size={12} className="text-[#68B49B]" /> {t('luggage_listing.card.feature_cancellation')}</span>
                    </div>

                    {/* Mobile Price */}
                    <div className="mt-2 md:hidden">
                        <p className={`${MOBILE_FONT} text-[12px] leading-[16px] font-normal md:font-bold text-gray-400 uppercase tracking-wider mb-0.5 md:text-[10px]`}>
                            {t('luggage_listing.card.estimated_total')}
                        </p>
                        <div className="flex items-baseline gap-1">
                            <span className={`${MOBILE_FONT} text-[22px] leading-[28px] font-bold text-[${HOGU_COLORS.dark}] md:text-xl md:font-extrabold`}>€{totalPrice}</span>
                            <span className={`${MOBILE_FONT} text-[12px] leading-[16px] font-normal text-gray-400 md:font-medium ml-1 md:text-xs`}>
                                (€{pricePerBag} {t('luggage_listing.card.bag_per_day', '/ bag / day')})
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex-grow" />

                {/* Mobile Toggle & Arrow */}
                <div className="md:hidden w-full flex items-center justify-between mt-2">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsExpanded(!isExpanded);
                        }}
                        className={`flex items-center gap-1 ${MOBILE_FONT} text-[16px] leading-[20px] font-semibold text-[#68B49B] bg-gray-50 px-3 py-1.5 rounded-full hover:bg-gray-100 transition-colors md:text-[11px] md:font-bold md:uppercase md:tracking-wide`}
                    >
                        {isExpanded ? (
                            <>
                                <ChevronDown size={14} className="rotate-180 transition-transform" />
                                {t('luggage_listing.card.hide')}
                            </>
                        ) : (
                            <>
                                <ChevronDown size={14} className="transition-transform" />
                                {t('luggage_listing.card.info_prices')}
                            </>
                        )}
                    </button>

                    <button
                        className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-[#68B49B] flex items-center justify-center text-white shadow-md active:scale-95 transition-all"
                    >
                        <ArrowRight size={20} />
                    </button>
                </div>

                {/* Desktop Footer */}
                <div className="hidden md:flex mt-auto pt-2 md:pt-3 border-t border-gray-50 justify-between items-end">
                    <div>
                        <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mb-0.5">
                            {t('luggage_listing.card.estimated_total')}
                        </p>
                        <div className="flex items-baseline gap-1">
                            <span className={`text-3xl font-extrabold text-[${HOGU_COLORS.dark}]`}>€{totalPrice}</span>
                            <span className="text-sm text-gray-400 font-medium ml-1">
                                (€{pricePerBag} {t('luggage_listing.card.bag_per_day', '/ bag / day')})
                            </span>
                        </div>
                    </div>
                    <button
                        className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center text-[#68B49B] group-hover:bg-[#68B49B] group-hover:text-white transition-all duration-300 shadow-sm"
                    >
                        <ArrowRight size={24} />
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- COMPONENTE PRINCIPALE ---
function ServiceListingLuggage() {
    const navigate = useNavigate();
    const [urlSearchParams] = useSearchParams();
    const { t } = useTranslation("home");

    // 1. INIZIALIZZAZIONE STATO DA URL
    const today = new Date().toISOString().split('T')[0];
    const currentTime = new Date().toTimeString().slice(0, 5);

    const initialLocation = urlSearchParams.get('location') || '';
    const initialDepositDate = urlSearchParams.get('dateFrom') || today;
    const initialPickupDate = urlSearchParams.get('dateTo') || today;
    const initialDepositTime = urlSearchParams.get('timeFrom') || '09:00';
    const initialPickupTime = urlSearchParams.get('timeTo') || '18:00';

    const initialBagsS = parseInt(urlSearchParams.get('bagsS')) || 0;
    const initialBagsM = parseInt(urlSearchParams.get('bagsM')) || 1;
    const initialBagsL = parseInt(urlSearchParams.get('bagsL')) || 0;

    const [services, setServices] = useState([]);
    const [hasSearched, setHasSearched] = useState(false);

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const pageSize = 5;
    const [totalElements, setTotalElements] = useState(0); // Added for consistency with NCC

    // RIFERIMENTO PER SCROLL AUTOMATICO
    const resultsSectionRef = useRef(null);

    // Stato Criteri Ricerca
    const [searchCriteria, setSearchCriteria] = useState({
        location: initialLocation,
        depositDate: initialDepositDate,
        depositTime: initialDepositTime,
        pickupDate: initialPickupDate,
        pickupTime: initialPickupTime,
        luggage: [
            { id: 'S', size: 'S', labelKey: LUGGAGE_SIZES_MOCK[0].labelKey, descKey: LUGGAGE_SIZES_MOCK[0].descKey, quantity: initialBagsS },
            { id: 'M', size: 'M', labelKey: LUGGAGE_SIZES_MOCK[1].labelKey, descKey: LUGGAGE_SIZES_MOCK[1].descKey, quantity: initialBagsM },
            { id: 'L', size: 'L', labelKey: LUGGAGE_SIZES_MOCK[2].labelKey, descKey: LUGGAGE_SIZES_MOCK[2].descKey, quantity: initialBagsL },
        ],
    });

    const minDepositTime = searchCriteria.depositDate === today ? currentTime : '';
    let minPickupTime = '';
    if (searchCriteria.pickupDate === searchCriteria.depositDate && searchCriteria.depositTime) {
        minPickupTime = searchCriteria.depositTime;
    } else if (searchCriteria.pickupDate === today) {
        minPickupTime = currentTime;
    }

    const totalBags = searchCriteria.luggage.reduce((acc, curr) => acc + curr.quantity, 0);

    // Format UTC con "Z"
    const combineDateTime = (date, time) => {
        if (!date || !time) return null;
        return `${date}T${time}:00Z`;
    };

    const getTomorrowDateString = () => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        return tomorrow.toISOString().split('T')[0];
    };

    const executeSearch = async (params, shouldScroll = false) => {
        const rawLocation = params.location;
        const locationPayload = rawLocation ? createLocationPayload(rawLocation, "", "LUGGAGE")[0] : null;

        if (!locationPayload) {
            setError({
                title: t('errors.missing_location_title', 'Attenzione'),
                message: t('errors.missing_location', 'Inserisci una città per cercare.')
            });
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const requestParams = {
                locale: locationPayload,
                page: (params.page || 1) - 1,
                size: pageSize,
                dropOff: combineDateTime(params.depositDate, params.depositTime),
                pickUp: combineDateTime(params.pickupDate, params.pickupTime),
                bagsS: params.luggage.find(l => l.id === 'S')?.quantity || 0,
                bagsM: params.luggage.find(l => l.id === 'M')?.quantity || 0,
                bagsL: params.luggage.find(l => l.id === 'L')?.quantity || 0
            };

            const response = await luggageService.searchLuggage(requestParams);

            if (response && response.content) {
                setServices(response.content);
                setTotalPages(response.totalPages);
                setTotalElements(response.totalElements || response.content.length);
            } else if (Array.isArray(response)) {
                setServices(response);
                setTotalPages(1);
                setTotalElements(response.length);
            } else {
                setServices([]);
                setTotalPages(0);
                setTotalElements(0);
            }

            setCurrentPage(params.page || 1);
            setHasSearched(true);

            if (shouldScroll) {
                setTimeout(() => {
                    if (resultsSectionRef.current) {
                        const yOffset = -120;
                        const element = resultsSectionRef.current;
                        const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
                        window.scrollTo({ top: y, behavior: 'smooth' });
                    }
                }, 100);
            }

        } catch (err) {
            console.error("Search error:", err);
            setError({
                title: t('errors.search_failed_title', 'Errore Ricerca'),
                message: err.message || t('errors.search_failed', 'Si è verificato un errore.')
            });
            setServices([]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (initialLocation && !hasSearched) {
            const payload = {
                location: initialLocation,
                depositDate: initialDepositDate,
                depositTime: initialDepositTime,
                pickupDate: initialPickupDate,
                pickupTime: initialPickupTime,
                luggage: searchCriteria.luggage,
                page: 1
            };
            executeSearch(payload, true);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleCloseError = () => {
        setError(null);
    };

    const handleSearchClick = (e) => {
        if (e) e.preventDefault();

        const payload = {
            ...searchCriteria,
            page: 1
        };

        const bagsS = searchCriteria.luggage.find(l => l.id === 'S')?.quantity || 0;
        const bagsM = searchCriteria.luggage.find(l => l.id === 'M')?.quantity || 0;
        const bagsL = searchCriteria.luggage.find(l => l.id === 'L')?.quantity || 0;

        const urlParams = new URLSearchParams({
            location: searchCriteria.location,
            dateFrom: searchCriteria.depositDate,
            timeFrom: searchCriteria.depositTime,
            dateTo: searchCriteria.pickupDate,
            timeTo: searchCriteria.pickupTime,
            bagsS: bagsS.toString(),
            bagsM: bagsM.toString(),
            bagsL: bagsL.toString()
        }).toString();

        navigate(`/service/luggage?${urlParams}`, { replace: true });
        executeSearch(payload, true);
    };

    const handleDestinationClick = (locationStr) => {
        const tomorrowStr = getTomorrowDateString();

        setSearchCriteria(prev => ({
            ...prev,
            location: locationStr,
            depositDate: tomorrowStr,
            pickupDate: tomorrowStr
        }));

        const payload = {
            ...searchCriteria,
            location: locationStr,
            depositDate: tomorrowStr,
            pickupDate: tomorrowStr,
            page: 1
        };

        const bagsS = searchCriteria.luggage.find(l => l.id === 'S')?.quantity || 0;
        const bagsM = searchCriteria.luggage.find(l => l.id === 'M')?.quantity || 0;
        const bagsL = searchCriteria.luggage.find(l => l.id === 'L')?.quantity || 0;

        const urlParams = new URLSearchParams({
            location: locationStr,
            dateFrom: tomorrowStr,
            timeFrom: searchCriteria.depositTime,
            dateTo: tomorrowStr,
            timeTo: searchCriteria.pickupTime,
            bagsS: bagsS.toString(),
            bagsM: bagsM.toString(),
            bagsL: bagsL.toString()
        }).toString();

        navigate(`/service/luggage?${urlParams}`, { replace: true });
        executeSearch(payload, true);
    };

    const handlePageChange = (newPageNumber) => {
        const payload = {
            ...searchCriteria,
            page: newPageNumber
        };
        executeSearch(payload, true);
    };

    const updateCriteria = (field, value) => {
        setSearchCriteria(prev => ({ ...prev, [field]: value }));
    };

    const updateLuggageQuantity = (id, change) => {
        setSearchCriteria(prev => ({
            ...prev,
            luggage: prev.luggage.map(item => {
                if (item.id === id) {
                    const newQuantity = Math.max(0, item.quantity + change);
                    return { ...item, quantity: newQuantity };
                }
                return item;
            }),
        }));
    };

    const handleServiceClick = (service) => {
        if (service && service.id) {
            const slug = slugify(service.name ? service.name : 'luggage-storage');
            const urlParams = new URLSearchParams({
                dateFrom: searchCriteria.depositDate,
                timeFrom: searchCriteria.depositTime,
                dateTo: searchCriteria.pickupDate,
                timeTo: searchCriteria.pickupTime,
                bagsS: searchCriteria.luggage.find(l => l.id === 'S')?.quantity || 0,
                bagsM: searchCriteria.luggage.find(l => l.id === 'M')?.quantity || 0,
                bagsL: searchCriteria.luggage.find(l => l.id === 'L')?.quantity || 0,
            }).toString();
            navigate(`/luggage/${slug}-${service.id}?${urlParams}`);
        }
    };

    const Pagination = () => {
        if (totalPages <= 1) return null;
        return (
            <div className="flex items-center justify-center gap-2 mt-12">
                <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`w-10 h-10 flex items-center justify-center rounded-full border transition-all ${currentPage === 1 ? 'border-gray-100 text-gray-300 cursor-not-allowed' : 'border-gray-200 text-gray-600 hover:border-[#68B49B] hover:text-[#68B49B] bg-white hover:shadow-md'}`}
                >
                    <ChevronLeft size={20} />
                </button>
                <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((number) => (
                        <button
                            key={number}
                            onClick={() => handlePageChange(number)}
                            className={`w-10 h-10 rounded-full ${MOBILE_FONT} text-[16px] leading-[20px] font-semibold md:font-bold md:text-sm transition-all ${currentPage === number ? 'bg-[#68B49B] text-white shadow-lg shadow-[#68B49B]/30' : 'text-gray-600 hover:bg-gray-100'}`}
                        >
                            {number}
                        </button>
                    ))}
                </div>
                <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={`w-10 h-10 flex items-center justify-center rounded-full border transition-all ${currentPage === totalPages ? 'border-gray-100 text-gray-300 cursor-not-allowed' : 'border-gray-200 text-gray-600 hover:border-[#68B49B] hover:text-[#68B49B] bg-white hover:shadow-md'}`}
                >
                    <ChevronRight size={20} />
                </button>
            </div>
        );
    };

    return (
        <div className={`min-h-screen bg-[#F8FAFC] pb-20 ${HOGU_THEME.fontFamily}`}>
            <PageHeader
                breadcrumbs={breadcrumbsItems.map(item => ({ ...item, label: t(item.labelKey) }))}
                subtitle={t('luggage_listing.header.subtitle')}
                titlePart1={t('luggage_listing.header.title_part1')}
                titlePart2={t('luggage_listing.header.title_part2')}
                description={t('luggage_listing.header.description')}
            />

            <div className="max-w-7xl mx-auto px-4 lg:px-8 -mt-20 md:-mt-16 lg:-mt-12 relative z-20">
                <div className={`relative z-50 bg-[#F1F5F9] rounded-[2rem] p-4 lg:p-8 ${HOGU_THEME.shadowFloat} border border-white/50 backdrop-blur-sm`}>
                    <form onSubmit={handleSearchClick} className="flex flex-col gap-1 lg:gap-6">
                        <div className="flex flex-col gap-2 lg:gap-4">

                            {/* DESKTOP: Flex Row Layout matching NCC */}
                            <div className="hidden lg:flex lg:flex-row gap-2 lg:gap-4 items-end">
                                {/* Location Group */}
                                <div className="flex-1 min-w-0 md:min-w-[200px]">
                                    <CityAutocomplete
                                        label={t('luggage_listing.search.where_are_you')}
                                        value={searchCriteria.location}
                                        onChange={(val) => updateCriteria('location', val)}
                                        icon={MapPin}
                                        className="w-full h-full"
                                        inputClassName="text-left"
                                        labelClassName={`!text-[${HOGU_COLORS.subtleText}]`}
                                        placeholder={t('luggage_listing.search.location_placeholder', "Dove ti serve il deposito?")}
                                    />
                                </div>

                                <SearchInputContainer label={t('luggage_listing.search.deposit')} icon={Calendar} className="w-full">
                                    <input
                                        type="date"
                                        min={new Date().toISOString().split("T")[0]}
                                        value={searchCriteria.depositDate}
                                        onChange={(e) => updateCriteria('depositDate', e.target.value)}
                                        onClick={(e) => e.target.showPicker?.()}
                                        className="flex-1 min-w-[110px] px-2 bg-transparent border-none focus:ring-0 text-sm font-medium text-gray-700 outline-none cursor-pointer"
                                    />
                                    <div className="w-[1px] h-6 bg-gray-200 mx-1"></div>
                                    <input
                                        type="time"
                                        value={searchCriteria.depositTime}
                                        min={minDepositTime}
                                        onChange={(e) => updateCriteria('depositTime', e.target.value)}
                                        onClick={(e) => e.target.showPicker?.()}
                                        className="min-w-[85px] bg-transparent border-none focus:ring-0 text-sm font-medium text-gray-700 outline-none cursor-pointer"
                                    />
                                </SearchInputContainer>

                                <SearchInputContainer label={t('luggage_listing.search.pickup')} icon={Clock} className="w-full">
                                    <input
                                        type="date"
                                        min={searchCriteria.depositDate || new Date().toISOString().split("T")[0]}
                                        value={searchCriteria.pickupDate}
                                        onChange={(e) => updateCriteria('pickupDate', e.target.value)}
                                        onClick={(e) => e.target.showPicker?.()}
                                        className="flex-1 min-w-[110px] px-2 bg-transparent border-none focus:ring-0 text-sm font-medium text-gray-700 outline-none cursor-pointer"
                                    />
                                    <div className="w-[1px] h-6 bg-gray-200 mx-1"></div>
                                    <input
                                        type="time"
                                        value={searchCriteria.pickupTime}
                                        min={minPickupTime}
                                        onChange={(e) => updateCriteria('pickupTime', e.target.value)}
                                        onClick={(e) => e.target.showPicker?.()}
                                        className="min-w-[85px] bg-transparent border-none focus:ring-0 text-sm font-medium text-gray-700 outline-none cursor-pointer"
                                    />
                                </SearchInputContainer>

                                <DesktopLuggageSelector bags={searchCriteria.luggage} onUpdateQuantity={updateLuggageQuantity} />

                                <div className="flex flex-col gap-3 w-auto min-w-[140px]">
                                    <label className="hidden lg:flex items-center gap-2 text-[10px] md:text-xs font-bold uppercase tracking-wide text-transparent select-none ml-1">
                                        <Search size={14} />
                                        {t('luggage_listing.search.search_button')}
                                    </label>
                                    <PrimaryButton
                                        type="submit"
                                        disabled={isLoading}
                                        className="w-full !h-[48px] md:!h-[60px] !rounded-2xl !px-6 flex items-center justify-center shadow-sm hover:shadow-md"
                                    >
                                        {isLoading ? (
                                            <>
                                                <Loader2 className="animate-spin" size={20} />
                                                <span className="ml-2">{t('luggage_listing.search.searching', 'Cerca')}</span>
                                            </>
                                        ) : (
                                            <>
                                                <Search size={20} />
                                                <span className="ml-2 font-bold">{t('luggage_listing.search.search_button', 'Cerca')}</span>
                                            </>
                                        )}
                                    </PrimaryButton>
                                </div>
                            </div>

                            {/* MOBILE: Layout compatto */}
                            <div className="lg:hidden w-full flex flex-col gap-2">
                                <div className="z-[100]">
                                    <CityAutocomplete
                                        label={t('luggage_listing.search.where_are_you')}
                                        value={searchCriteria.location}
                                        onChange={(val) => updateCriteria('location', val)}
                                        icon={MapPin}
                                        className="w-full z-[100]"
                                        inputClassName={`${MOBILE_FONT} bg-white text-left text-[16px] leading-[24px] font-normal md:text-sm md:font-medium`}
                                        labelClassName={`${MOBILE_FONT} !text-[${HOGU_COLORS.subtleText}] !text-[12px] !leading-[16px] !font-normal md:!text-[9px] md:!font-bold`}
                                        placeholder={t('luggage_listing.search.location_placeholder', "Dove ti serve il deposito?")}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                    <SearchInputContainer label={t('luggage_listing.search.deposit')} icon={Calendar}>
                                        <MobileCombinedScheduleSelector
                                            depositDate={searchCriteria.depositDate}
                                            depositTime={searchCriteria.depositTime}
                                            pickupDate={searchCriteria.pickupDate}
                                            pickupTime={searchCriteria.pickupTime}
                                            onUpdate={updateCriteria}
                                            minDate={new Date().toISOString().split("T")[0]}
                                        />
                                    </SearchInputContainer>
                                    <SearchInputContainer label={t('luggage_listing.search.luggage_label')} icon={Luggage}>
                                        <MobileLuggageSelector
                                            bags={searchCriteria.luggage}
                                            onUpdateQuantity={updateLuggageQuantity}
                                        />
                                    </SearchInputContainer>
                                </div>

                                <PrimaryButton
                                    type="submit"
                                    disabled={isLoading}
                                    className={`w-full h-[42px] !rounded-xl ${MOBILE_FONT} !text-[16px] !leading-[20px] !font-semibold !py-0 md:!text-sm`}
                                >
                                    {isLoading ? (
                                        <><Loader2 className="animate-spin" size={16} />{t('luggage_listing.search.searching', 'Cercando...')}</>
                                    ) : (
                                        <><Search size={16} />{t('luggage_listing.search.search_button')}</>
                                    )}
                                </PrimaryButton>
                            </div>

                        </div>
                    </form>
                </div>

                {!hasSearched && !isLoading && (
                    <PopularDestinations onDestinationClick={(dest) => handleDestinationClick(dest.searchLocation)} />
                )}

                {hasSearched && (
                    <div className="mt-6 md:mt-12" id="results-section" ref={resultsSectionRef}>
                        <div className="flex items-center justify-between mb-4 md:mb-8">
                            <h2 className={`${MOBILE_FONT} text-[22px] leading-[28px] font-semibold text-slate-800 md:text-2xl md:font-bold`}>
                                <span className="text-[#68B49B]">{totalElements}</span> {t('luggage_listing.results.available_deposits', { count: totalElements })}
                            </h2>
                            <span className={`${MOBILE_FONT} text-[14px] leading-[20px] font-normal text-gray-400 md:font-medium md:text-sm`}>
                                {t('luggage_listing.results.page_of', { current: currentPage, total: totalPages > 0 ? totalPages : 1 })}
                            </span>
                        </div>

                        {services.length === 0 ? (
                            <div className="text-center py-10 md:py-20 bg-white rounded-2xl md:rounded-3xl border border-gray-100">
                                <div className="inline-block p-4 rounded-full bg-gray-50 mb-4">
                                    <Search className="text-gray-300" size={40} />
                                </div>
                                <h3 className={`${MOBILE_FONT} text-[18px] leading-[24px] font-semibold text-gray-600 md:text-xl md:font-bold`}>{t('luggage_listing.results.no_deposits_found')}</h3>
                                <p className={`${MOBILE_FONT} text-[14px] leading-[20px] font-normal text-gray-400`}>{t('luggage_listing.results.retry_search')}</p>
                            </div>
                        ) : (
                            <div className={`${isLoading ? 'opacity-50 pointer-events-none' : 'opacity-100'} transition-opacity duration-200`}>
                                <div className="flex flex-col gap-3 md:gap-6">
                                    {services.map((service) => (
                                        <LuggageResultCard
                                            key={service.id}
                                            service={service}
                                            totalBags={totalBags}
                                            searchCriteria={searchCriteria}
                                            onClick={() => handleServiceClick(service)}
                                        />
                                    ))}
                                </div>

                                <Pagination />
                            </div>
                        )}
                    </div>
                )}
            </div>

            <LoadingScreen isLoading={isLoading} />

            {error && (
                <ErrorModal
                    isOpen={!!error}
                    title={error.title}
                    message={error.message}
                    onClose={handleCloseError}
                />
            )}
        </div>
    );
}

export default ServiceListingLuggage;
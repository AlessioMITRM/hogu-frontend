import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
    Calendar, Clock, ChevronLeft, ChevronRight, Eye, MoreVertical,
    AlertTriangle, Ban, BellRing, Edit2, CheckCircle, XCircle,
    User, Wallet, Activity, ScanLine,
    Phone, ListTodo, RefreshCw, Send, ChevronUp, X,

    // Icone Specifiche Categorie
    Utensils, BedDouble, Car, Luggage, PartyPopper,

    // Icone Specifiche Dashboard NCC
    MapPin, Navigation, Settings, History, QrCode, ArrowRight, CarFront, CalendarClock
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import CurrencyInput from 'react-currency-input-field';

const formatPrice = (value) => {
    if (value === undefined || value === null) return '0,00';
    const num = typeof value === 'string' ? parseFloat(value.replace(',', '.')) : value;
    if (isNaN(num)) return '0,00';
    return num.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const formatDate = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleDateString('it-IT');
};

const formatTime = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
};

import { nccService } from '../../../../../api/apiClient';
import { HOGU_COLORS, HOGU_THEME } from '../../../../../config/theme.js';
import SuccessModal from '../../../../ui/SuccessModal.jsx';
import ErrorModal from '../../../../ui/ErrorModal.jsx';
import LoadingScreen from '../../../../ui/LoadingScreen.jsx';
import { RouteMapNCC } from '../../../detail/RouteMapNCC.jsx';
import SafeImage from '../../../../ui/SafeImage.jsx';


// =================================================================================
// 1. CONFIGURAZIONE & COSTANTI
// =================================================================================

const getServiceCategories = (t) => ({
    RESTAURANT: { id: 'restaurant', label: t('dashboard:provider.categories.restaurant'), icon: Utensils, unit: t('dashboard:provider.categories.units.coperti') },
    BEB: { id: 'beb', label: t('dashboard:provider.categories.beb'), icon: BedDouble, unit: t('dashboard:provider.categories.units.notti') },
    CLUB: { id: 'club', label: t('dashboard:provider.categories.club'), icon: PartyPopper, unit: t('dashboard:provider.categories.units.ingressi') },
    NCC: { id: 'ncc', label: t('dashboard:provider.categories.ncc'), icon: Car, unit: t('dashboard:provider.categories.units.pax') },
    STORAGE: { id: 'storage', label: t('dashboard:provider.categories.storage'), icon: Luggage, unit: t('dashboard:provider.categories.units.bags') }
});

const NCC_BOOKINGS = [];


// =================================================================================
// 2. COMPONENTI UI CONDIVISI (ProviderUI)
// =================================================================================

// *** Componente Sticky Trigger Mobile ***
const MobileStickyTrigger = ({ count, onClick }) => {
    const { t } = useTranslation(['dashboard']);
    if (count === 0) return null;
    return (
        <div className="fixed bottom-4 left-3 right-3 z-40 md:hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
            <button
                onClick={onClick}
                className={`w-full bg-[${HOGU_COLORS.dark}] text-white p-3.5 rounded-2xl shadow-2xl shadow-slate-900/40 flex items-center justify-between border border-slate-700/50 backdrop-blur-md active:scale-[0.98] transition-transform`}
            >
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <div className="bg-amber-50 rounded-xl p-2.5 text-white animate-pulse">
                            <BellRing size={20} fill="currentColor" />
                        </div>
                        <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full border-2 border-[#1a1a1a] shadow-sm">
                            {count}
                        </span>
                    </div>
                    <div className="text-left">
                        <h4 className="font-bold text-sm">{t('dashboard:provider.mobile.have_requests', { count })}</h4>
                        <p className="text-xs text-slate-400">{t('dashboard:provider.mobile.click_manage')}</p>
                    </div>
                </div>
                <div className="bg-white/10 p-2 rounded-full">
                    <ChevronUp size={18} />
                </div>
            </button>
        </div>
    );
};

// *** OTTIMIZZATO: Componente Full Page Overlay Mobile ***
const MobilePendingFullPage = ({ isOpen, onClose, pendingList, onAccept, onReject, onRectify, onOpenDetails, currentPage, totalPages, onNext, onPrev }) => {
    const { t } = useTranslation(['dashboard']);
    const sheetRef = useRef(null);
    const startY = useRef(null);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [isOpen]);

    const handleTouchStart = (e) => { startY.current = e.touches[0].clientY; };
    const handleTouchEnd = (e) => {
        if (startY.current === null) return;
        const deltaY = e.changedTouches[0].clientY - startY.current;
        if (deltaY > 60) onClose();
        startY.current = null;
    };

    return createPortal(
        <>
            <div
                className={`fixed inset-0 z-[90] bg-black/40 backdrop-blur-[2px] md:hidden transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={onClose}
            />

            <div
                ref={sheetRef}
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
                className={`fixed bottom-0 left-0 right-0 z-[100] md:hidden bg-[#f8f9fc] rounded-t-[2rem] shadow-2xl shadow-black/30
                    transition-transform duration-300 ease-out flex flex-col
                    ${isOpen ? 'translate-y-0' : 'translate-y-full'}`}
                style={{ maxHeight: '82vh' }}
            >
                <div className="flex justify-center pt-3 pb-1 shrink-0 cursor-grab active:cursor-grabbing">
                    <div className="w-10 h-1 bg-slate-300 rounded-full" />
                </div>

                <div className="px-4 pt-2 pb-3 shrink-0">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                            <div className="bg-amber-50 border border-amber-100 p-2 rounded-xl">
                                <BellRing size={16} className="text-amber-500" />
                            </div>
                            <div>
                                <h2 className="text-base font-extrabold text-slate-800 leading-tight">
                                    {t('dashboard:provider.mobile.requests_title')}
                                </h2>
                                <p className="text-xs text-slate-400 font-medium">
                                    {pendingList.length === 1 
                                        ? t('dashboard:provider.mobile.pending_count_one') 
                                        : t('dashboard:provider.mobile.pending_count_other', { count: pendingList.length })}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            {totalPages > 1 && (
                                <PaginationControls
                                    currentPage={currentPage}
                                    totalPages={totalPages}
                                    onNext={onNext}
                                    onPrev={onPrev}
                                />
                            )}
                            <button
                                onClick={onClose}
                                className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center active:scale-95 transition-transform"
                            >
                                <X size={16} className="text-slate-500" />
                            </button>
                        </div>
                    </div>
                </div>

                <div className="h-px bg-slate-200 mx-4 shrink-0" />

                <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2.5">
                    {pendingList && pendingList.length > 0 ? (
                        pendingList.map(b => (
                            <PendingRequestCard
                                key={b.id}
                                booking={b}
                                activeCategory="ncc"
                                onAccept={(id) => {
                                    onAccept(id);
                                    if (pendingList.length === 1) onClose();
                                }}
                                onReject={onReject}
                                onRectify={onRectify}
                                onOpenDetails={onOpenDetails}
                            />
                        ))
                    ) : (
                        <div className="py-10 flex flex-col items-center justify-center text-center">
                            <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mb-3">
                                <CheckCircle size={28} className="text-emerald-500" />
                            </div>
                            <p className="font-bold text-slate-700 text-sm">{t('dashboard:provider.mobile.all_done')}</p>
                            <p className="text-xs text-slate-400 mt-1">{t('dashboard:provider.mobile.no_pending')}</p>
                            <button
                                onClick={onClose}
                                className="mt-4 text-sm font-bold text-emerald-600 bg-emerald-50 px-5 py-2.5 rounded-xl active:scale-95 transition-transform"
                            >
                                {t('dashboard:provider.mobile.close')}
                            </button>
                        </div>
                    )}
                    <div className="h-2" />
                </div>
            </div>
        </>,
        document.body
    );
};

// --- COMPONENTI UI STANDARD ---

const ModalBackdrop = ({ children, onClose }) => (
    <div
        className={`fixed inset-0 bg-[${HOGU_COLORS.dark}]/60 backdrop-blur-sm z-[100] flex items-end sm:items-center justify-center sm:p-4 animate-in fade-in duration-200`}
        onClick={onClose}
    >
        <div
            className="bg-white w-full sm:max-w-2xl shadow-2xl shadow-black/20 transform animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200 rounded-t-[2.5rem] sm:rounded-[2.5rem] p-6 sm:p-8 max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
        >
            {children}
        </div>
    </div>
);

const PaginationControls = ({ currentPage, totalPages, onNext, onPrev, darkBg = false }) => {
    const { t } = useTranslation(['dashboard']);
    if (totalPages <= 1) return null;
    const bgClass = darkBg ? "bg-white/10 border-white/10 text-white" : "bg-white border-slate-200 text-slate-600";
    const btnHover = darkBg ? "hover:bg-white/20 disabled:opacity-30" : "hover:bg-slate-50 disabled:opacity-30";
    const textClass = darkBg ? "text-white" : "text-slate-500";
    return (
        <div className={`flex items-center gap-1 rounded-full p-1.5 border shadow-sm ${bgClass}`}>
            <button
                onClick={onPrev}
                disabled={currentPage === 1}
                className={`p-2 rounded-full transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center ${btnHover}`}
                aria-label={t('dashboard:pagination.prev')}
            >
                <ChevronLeft size={16} />
            </button>
            <span className={`text-xs font-bold min-w-[3rem] text-center tracking-wider ${textClass}`}>{currentPage} / {totalPages}</span>
            <button
                onClick={onNext}
                disabled={currentPage === totalPages}
                className={`p-2 rounded-full transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center ${btnHover}`}
                aria-label={t('dashboard:pagination.next')}
            >
                <ChevronRight size={16} />
            </button>
        </div>
    );
};

const StatusBadge = ({ status }) => {
    const { t } = useTranslation(['dashboard']);
    const styles = {
        FULL_PAYMENT_COMPLETED: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-100', label: t('dashboard:provider.status.payment_completed') },
        COMPLETED: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-100', label: t('dashboard:provider.status.completed') },
        WAITING_COMPLETION: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-100', label: t('dashboard:provider.status.in_progress') },
        PENDING: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-100', label: t('dashboard:provider.status.pending') },
        PAYMENT_AUTHORIZED: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-100', label: t('dashboard:provider.status.pending') },
        WAITING_PROVIDER_CONFIRMATION: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-100', label: t('dashboard:provider.status.pending') },
        WAITING_CUSTOMER_PAYMENT: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-100', label: t('dashboard:provider.status.waiting_customer') },
        CANCELLED_BY_PROVIDER: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-100', label: t('dashboard:provider.status.cancelled') },
        CANCELLED_BY_ADMIN: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-100', label: t('dashboard:provider.status.cancelled') },
        MODIFIED_BY_PROVIDER: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-100', label: t('dashboard:provider.status.cancelled') },
        REFUNDED_BY_ADMIN: { bg: 'bg-white', text: 'text-slate-600', border: 'border-slate-200', label: t('dashboard:provider.status.refunded') },
        CONFIRMED: { bg: 'bg-white', text: 'text-slate-600', border: 'border-slate-200', label: t('dashboard:provider.status.confirmed') },
        cancelled: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-100', label: t('dashboard:provider.status.cancelled') },
        completed: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-100', label: t('dashboard:provider.status.completed') },
        pending: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-100', label: t('dashboard:provider.status.pending') },
        waiting_customer: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-100', label: t('dashboard:provider.status.waiting_customer') },
        confirmed: { bg: 'bg-white', text: 'text-slate-600', border: 'border-slate-200', label: t('dashboard:provider.status.confirmed') }
    };
    const normalizedStatus = (() => {
        if (!status) return 'UNKNOWN';
        if (typeof status === 'string') return status.toUpperCase();
        if (typeof status === 'object') {
            if (status.name) return String(status.name).toUpperCase();
            if (status.italianValue) return String(status.italianValue).toUpperCase();
        }
        return 'UNKNOWN';
    })();
    const style = styles[normalizedStatus] || { bg: 'bg-gray-100', text: 'text-gray-600', border: 'border-gray-200', label: normalizedStatus };
    return (
        <span className={`px-2.5 py-1 rounded-full text-[10px] uppercase tracking-wider font-bold border whitespace-nowrap ${style.bg} ${style.text} ${style.border}`}>
            {style.label}
        </span>
    );
};

const CategorySpecificDetails = ({ booking, category }) => {
    const { t } = useTranslation(['dashboard']);
    const catKey = category?.toUpperCase();
    const config = getServiceCategories(t)[catKey] || getServiceCategories(t).RESTAURANT;
    const Icon = config.icon;

    let detailText = `${booking.guests} ${t('dashboard:provider.booking_details.guests')}`;

    if (category === 'beb') detailText = `${booking.guests} ${t('dashboard:provider.booking_details.guests')} • ${booking.quantity || 1} ${t('dashboard:provider.booking_details.nights')}`;
    else if (category === 'storage') detailText = `${booking.quantity || 1} ${t('dashboard:provider.booking_details.quantity')} • ${booking.duration || '24h'}`;
    else if (category === 'ncc') detailText = `${booking.guests} Pax • ${booking.location ? (booking.location.length > 20 ? booking.location.substring(0, 20) + '...' : booking.location) : 'Transfer'}`;
    else if (category === 'restaurant') detailText = `${booking.guests} ${t('dashboard:provider.booking_details.quantity')} • ${booking.area || 'Sala Interna'}`;

    return (
        <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-medium">
            <Icon size={12} /> {detailText}
        </div>
    );
};

const StatsSummary = ({ activeCategory, stats }) => {
    const { t } = useTranslation(['dashboard']);
    const label = getServiceCategories(t)[activeCategory?.toUpperCase()]?.label || t('dashboard:provider.actions.details');
    const amount = stats?.totalBookingsAmount;
    const totalBookings = stats?.totalBookings;
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-1 gap-4 sm:gap-5 mb-0">
            {/* Fatturato */}
            <div className={`bg-[${HOGU_COLORS.dark}] rounded-[1.75rem] p-5 sm:p-6 text-white relative overflow-hidden shadow-xl shadow-slate-900/10 group`}>
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform duration-500 pointer-events-none">
                    <Wallet size={90} />
                </div>
                <div className="relative z-10">
                    <p className="text-slate-400 text-[10px] sm:text-xs font-bold uppercase tracking-widest mb-1">{t('dashboard:provider.stats.revenue', { label })}</p>
                    <h3 className="text-2xl sm:text-3xl font-extrabold">€ {amount != null ? formatPrice(amount) : '--,--'}</h3>
                </div>
            </div>
            {/* Prenotazioni */}
            <div className={`bg-white p-5 sm:p-6 rounded-[1.75rem] border border-slate-100 shadow-sm flex flex-col justify-center relative overflow-hidden group hover:border-[${HOGU_COLORS.primary}]/30 hover:shadow-lg transition-all`}>
                <div className={`absolute -right-4 -bottom-4 text-slate-50 opacity-50 group-hover:text-[${HOGU_COLORS.primary}]/10 transition-colors pointer-events-none`}>
                    <Activity size={90} />
                </div>
                <div className="flex items-center gap-2 text-slate-400 mb-2">
                    <Activity size={16} /> <span className="text-[10px] sm:text-xs font-bold uppercase">{t('dashboard:provider.stats.bookings')}</span>
                </div>
                <span className={`text-3xl sm:text-4xl font-black text-slate-800 group-hover:text-[${HOGU_COLORS.primary}] transition-colors`}>
                    {totalBookings != null ? totalBookings : '--'}
                </span>
                <p className="text-xs text-slate-400 mt-1.5 font-medium">{t('dashboard:provider.stats.monthly_total')}</p>
            </div>
        </div>
    );
};

// --- CARDS ---

// *** OTTIMIZZATA: PendingRequestCard — mobile-first, compatta, touch-friendly ***
const PendingRequestCard = ({ booking, onAccept, onReject, onRectify, onOpenDetails, activeCategory }) => {
    const { t } = useTranslation(['dashboard']);
    const isWaitingCustomer = booking.status === 'waiting_customer';
// ... (omitted parts for brevity in thought, but full content needed in replacement)

    let pickup = booking.pickup;
    let dropoff = booking.dropoff;
    if (activeCategory === 'ncc' && (!pickup || !dropoff) && booking.location) {
        const sep = booking.location.includes('→') ? '→' : (booking.location.includes('->') ? '->' : null);
        if (sep) {
            const parts = booking.location.split(sep);
            pickup = parts[0].trim();
            dropoff = parts[1].trim();
        } else {
            pickup = booking.location;
        }
    }
    pickup = pickup || booking.location || '—';
    dropoff = dropoff || '—';

    return (
        <div className={`group bg-white rounded-2xl border shadow-sm transition-all duration-200 flex flex-col relative overflow-hidden
            ${isWaitingCustomer
                ? 'border-blue-100 bg-blue-50/20'
                : `border-slate-100 hover:border-[${HOGU_COLORS.primary}]/30 hover:shadow-md`
            }`}
        >
            {/* Indicatore laterale colorato */}
            <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl opacity-80
                ${isWaitingCustomer ? 'bg-blue-400' : 'bg-gradient-to-b from-amber-300 to-amber-500'}`}
            />

            {/* HEADER: Avatar + Nome + Prezzo */}
            <div className="flex items-center gap-3 px-4 pt-4 pb-2 pl-5">
                <div className="relative shrink-0">
                    {booking.image ? (
                        <SafeImage src={booking.image} alt="" className="w-10 h-10 rounded-xl object-cover ring-2 ring-white shadow-sm" />
                    ) : (
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm
                            ${isWaitingCustomer ? 'bg-blue-400' : 'bg-amber-400'}`}>
                            <User size={18} />
                        </div>
                    )}
                    {!isWaitingCustomer && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[8px] font-black px-1 py-0.5 rounded-full border border-white leading-none">
                            NEW
                        </span>
                    )}
                </div>

                <div className="flex-1 min-w-0">
                    <h4 className={`font-bold text-[${HOGU_COLORS.dark}] text-sm leading-tight truncate`}>{booking.customerName}</h4>
                    <p className={`text-[11px] text-[${HOGU_COLORS.primary}] font-semibold truncate`}>{booking.serviceName}</p>
                </div>

                <div className="text-right shrink-0">
                    <span className={`block font-extrabold text-base ${isWaitingCustomer ? 'text-blue-600' : `text-[${HOGU_COLORS.dark}]`}`}>
                        € {formatPrice(booking.price)}
                    </span>
                    {booking.oldPrice && (
                        <span className="text-[10px] text-slate-400 line-through">€ {formatPrice(booking.oldPrice)}</span>
                    )}
                </div>
            </div>

            {/* DATA + ORA + PAX: pill compatte inline */}
            <div className="flex flex-wrap gap-1.5 px-5 pb-2">
                <span className="flex items-center gap-1.5 bg-slate-50 border border-slate-100 px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-600">
                    <Calendar size={11} className={`text-[${HOGU_COLORS.primary}] shrink-0`} />
                    {booking.date}
                </span>
                <span className="flex items-center gap-1.5 bg-slate-50 border border-slate-100 px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-600">
                    <Clock size={11} className={`text-[${HOGU_COLORS.primary}] shrink-0`} />
                    {booking.time}
                </span>
                <span className="flex items-center gap-1.5 bg-slate-50 border border-slate-100 px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-600">
                    <User size={11} className={`text-[${HOGU_COLORS.primary}] shrink-0`} />
                    {booking.guests} pax
                </span>
            </div>

            {/* ITINERARIO NCC: compatto con punti connessi */}
            {activeCategory === 'ncc' && (
                <div className="mx-4 mb-3 bg-slate-50 border border-slate-100 rounded-xl px-3 py-2.5 flex flex-col gap-1.5 relative">
                    <div className="flex items-start gap-2">
                        <div className="w-2 h-2 rounded-full bg-slate-300 border-2 border-white shadow-sm shrink-0 mt-1" />
                        <p className="text-[11px] text-slate-500 font-medium leading-snug truncate">{pickup}</p>
                    </div>
                    {/* Linea tratteggiata verticale */}
                    <div className="absolute left-[18px] top-[22px] h-[14px] w-px border-l border-dashed border-slate-300" />
                    <div className="flex items-start gap-2">
                        <div className={`w-2 h-2 rounded-full bg-[${HOGU_COLORS.primary}] border-2 border-white shadow-sm shrink-0 mt-1`} />
                        <p className="text-[11px] text-slate-700 font-semibold leading-snug truncate">{dropoff}</p>
                    </div>
                </div>
            )}

            {/* Dettagli categoria non-NCC */}
            {activeCategory !== 'ncc' && (
                <div className="px-5 pb-2">
                    <CategorySpecificDetails booking={booking} category={activeCategory} />
                </div>
            )}

            {/* AZIONI */}
            <div className="px-4 pb-4 pl-5 mt-auto">
                {isWaitingCustomer ? (
                    <div className="w-full bg-blue-50 border border-blue-100 text-blue-500 py-3 rounded-xl font-semibold text-xs flex items-center justify-center gap-2">
                        <Clock size={14} className="animate-pulse" />
                        {t('dashboard:provider.dashboard.waiting_customer')}
                    </div>
                ) : (
                    <div className="flex gap-2">
                        {/* ACCETTA: principale, largo */}
                        <button
                            onClick={() => onAccept(booking.id)}
                            className={`flex-1 bg-[${HOGU_COLORS.primary}] hover:bg-[${HOGU_COLORS.primaryEmphasis}] text-white py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all shadow-sm min-h-[44px]`}
                        >
                            <CheckCircle size={14} />
                            {t('dashboard:provider.actions.accept')}
                        </button>

                        {/* RETTIFICA: icona */}
                        <button
                            onClick={() => onRectify(booking)}
                            title={t('dashboard:provider.actions.rectify')}
                            aria-label={t('dashboard:provider.actions.rectify')}
                            className="w-11 h-11 shrink-0 flex items-center justify-center bg-amber-50 border border-amber-100 text-amber-500 hover:bg-amber-100 rounded-xl active:scale-95 transition-all"
                        >
                            <Edit2 size={15} />
                        </button>

                        {/* RIFIUTA: icona */}
                        <button
                            onClick={() => onReject(booking)}
                            title={t('dashboard:provider.actions.reject')}
                            aria-label={t('dashboard:provider.actions.reject')}
                            className="w-11 h-11 shrink-0 flex items-center justify-center bg-white border border-slate-200 text-slate-400 hover:bg-rose-50 hover:text-rose-500 hover:border-rose-200 rounded-xl active:scale-95 transition-all"
                        >
                            <XCircle size={15} />
                        </button>

                        {/* DETTAGLI: icona */}
                        <button
                            onClick={() => onOpenDetails(booking)}
                            title={t('dashboard:provider.actions.details')}
                            aria-label={t('dashboard:provider.actions.details')}
                            className={`w-11 h-11 shrink-0 flex items-center justify-center bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-[${HOGU_COLORS.primary}] rounded-xl active:scale-95 transition-all`}
                        >
                            <Eye size={15} />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

const ProviderBookingCard = ({ booking, onOpenDetails, onOpenComplaint, onCancelBooking, activeCategory }) => {
    const { t } = useTranslation(['dashboard']);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef(null);
    useEffect(() => {
        const handleClickOutside = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setIsMenuOpen(false); };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);
    const normStatus = (() => {
        const s = booking?.status;
        if (!s) return '';
        if (typeof s === 'string') return s.toUpperCase();
        if (typeof s === 'object') {
            if (s.name) return String(s.name).toUpperCase();
            if (s.italianValue) return String(s.italianValue).toUpperCase();
        }
        return '';
    })();
    const isCancelled = normStatus === 'CANCELLED_BY_PROVIDER' || normStatus === 'CANCELLED_BY_ADMIN' || normStatus === 'MODIFIED_BY_PROVIDER';
    return (
        <div className={`rounded-2xl sm:rounded-3xl border p-4 sm:p-5 flex flex-col sm:flex-row gap-4 sm:gap-6 transition-all duration-300 relative group
            bg-white border-slate-100 hover:border-[${HOGU_COLORS.primary}]/30 hover:shadow-lg hover:shadow-slate-200/50`}>

            {/* Avatar */}
            <div className="relative shrink-0">
                {(booking.customerImage ?? booking.image) ? (
                    <SafeImage
                        src={booking.customerImage ?? booking.image}
                        alt=""
                        className="w-14 h-14 sm:w-20 sm:h-20 rounded-2xl object-cover shadow-sm ring-2 ring-white grayscale"
                    />
                ) : (
                    <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-2xl bg-slate-200 text-slate-500 flex items-center justify-center shadow-sm ring-2 ring-white grayscale">
                        <User size={22} />
                    </div>
                )}
            </div>

            <div className="flex-1 flex flex-col justify-between min-w-0">
                {/* Intestazione */}
                <div className="flex justify-between items-start mb-2 gap-2">
                    <div className="min-w-0 flex-1">
                        <h4 className={`font-bold text-base truncate text-[${HOGU_COLORS.dark}]`}>
                            {booking.customerName}
                        </h4>
                        <p className={`text-xs font-medium uppercase tracking-wide truncate text-slate-500`}>
                            {booking.serviceName}
                        </p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                        <StatusBadge status={booking.status} />
                        <button
                            onClick={() => onOpenDetails(booking)}
                            aria-label={t('dashboard:provider.actions.details')}
                            className={`w-8 h-8 flex items-center justify-center rounded-full transition-all shadow-sm bg-slate-50 text-slate-400 hover:bg-[${HOGU_COLORS.primary}] hover:text-white`}
                        >
                            <Eye size={14} />
                        </button>
                        {booking.status === 'confirmed' && (
                            <div className="relative" ref={menuRef}>
                                <button
                                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                                    aria-label={t('dashboard:provider.actions.other_options')}
                                    className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                                >
                                    <MoreVertical size={16} />
                                </button>
                                {isMenuOpen && (
                                    <div className="absolute right-0 top-full mt-2 w-52 bg-white shadow-xl shadow-slate-200/60 border border-slate-100 rounded-2xl p-1.5 z-50 animate-in fade-in zoom-in-95 origin-top-right">
                                        <button
                                            onClick={() => { setIsMenuOpen(false); onCancelBooking(booking); }}
                                            className="w-full flex items-center gap-2.5 px-3 py-3 text-xs font-bold hover:bg-rose-50 text-slate-600 hover:text-rose-600 rounded-xl transition-colors"
                                        >
                                            <Ban size={14} /> {t('dashboard:provider.actions.cancel_booking')}
                                        </button>
                                        <button
                                            onClick={() => { setIsMenuOpen(false); onOpenComplaint(booking); }}
                                            className="w-full flex items-center gap-2.5 px-3 py-3 text-xs font-bold hover:bg-amber-50 text-slate-600 hover:text-amber-600 rounded-xl transition-colors"
                                        >
                                            <AlertTriangle size={14} /> {t('dashboard:provider.actions.report_problem')}
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer: Data/Ora + Prezzo */}
                <div className={`flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-50`}>
                    <div className={`flex flex-wrap gap-2 text-xs font-semibold tracking-wide text-slate-500`}>
                        <span className={`flex items-center gap-1.5 px-2 py-1 rounded-md bg-slate-50`}>
                            <Calendar size={11} className={`text-[${HOGU_COLORS.primary}]`} />
                            {booking.date}
                        </span>
                        <span className={`flex items-center gap-1.5 px-2 py-1 rounded-md bg-slate-50`}>
                            <Clock size={11} className={`text-[${HOGU_COLORS.primary}]`} />
                            {booking.time}
                        </span>
                    </div>
                    <span className={`font-extrabold text-base text-[${HOGU_COLORS.dark}]`}>
                        € {formatPrice(booking.price)}
                    </span>
                </div>
            </div>
        </div>
    );
};

// --- MODALS ---

const BookingDetailModal = ({ isOpen, onClose, booking }) => {
    const { t } = useTranslation(['dashboard']);

    const bookingCoordinates = React.useMemo(() => {
        if (!booking?.raw) return null;

        const toNumber = (v) => {
            const n = typeof v === 'string' ? parseFloat(v) : v;
            return typeof n === 'number' && !Number.isNaN(n) ? n : null;
        };

        const normalizeCoordObj = (obj) => {
            if (!obj) return null;
            const lat = toNumber(obj.lat ?? obj.latitude);
            const lon = toNumber(obj.lon ?? obj.lng ?? obj.longitude);
            if (lat != null && lon != null) return { lat, lon };
            return null;
        };

        const from = normalizeCoordObj(booking.raw.pickupCoordinates)
            || (() => {
                const lat = toNumber(booking.raw.pickupLatitude);
                const lon = toNumber(booking.raw.pickupLongitude);
                return (lat != null && lon != null) ? { lat, lon } : null;
            })();

        const to = normalizeCoordObj(booking.raw.destinationCoordinates)
            || (() => {
                const lat = toNumber(booking.raw.destinationLatitude);
                const lon = toNumber(booking.raw.destinationLongitude);
                return (lat != null && lon != null) ? { lat, lon } : null;
            })();

        if (from || to) {
            return { from, to };
        }
        return null;
    }, [booking]);

    if (!isOpen || !booking) return null;

    const activeCategory = booking.category || 'ncc';

    let pickup = booking.pickup;
    let dropoff = booking.dropoff;

    if (activeCategory === 'ncc') {
        if (!pickup && booking.raw?.pickupLocation) {
            pickup = booking.raw.pickupLocation;
        }
        if (!dropoff && booking.raw?.destination) {
            dropoff = booking.raw.destination;
        }

        if ((!pickup || !dropoff) && booking.location) {
            const sep = booking.location.includes('→')
                ? '→'
                : (booking.location.includes('->') ? '->' : null);

            if (sep) {
                const parts = booking.location.split(sep);
                if (!pickup && parts[0]) pickup = parts[0].trim();
                if (!dropoff && parts[1]) dropoff = parts[1].trim();
            } else if (!pickup) {
                pickup = booking.location;
            }
        }
    }

    const renderExtraDetails = () => {
        switch (activeCategory) {
            case 'ncc':
                return (
                    <>
                        <div className="col-span-2 bg-slate-50 p-4 rounded-2xl border border-slate-100 mt-2">
                            <span className="text-[10px] uppercase text-slate-400 font-bold tracking-wider block mb-2">{t('dashboard:provider.booking_details.itinerary')}</span>
                            <div className="flex flex-col gap-3 relative">
                                <div className="absolute left-[9px] top-2 bottom-4 w-0.5 bg-slate-200"></div>
                                <div className="flex items-start gap-3 relative z-10">
                                    <div className="w-5 h-5 rounded-full bg-white border-2 border-slate-300 shrink-0 mt-0.5"></div>
                                    <div>
                                        <p className="text-xs text-slate-400 font-bold uppercase mb-0.5">{t('dashboard:provider.booking_details.departure')}</p>
                                        <p className="font-bold text-slate-700 leading-tight">{pickup || booking.location || t('dashboard:provider.booking_details.not_specified')}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3 relative z-10">
                                    <div className={`w-5 h-5 rounded-full bg-[${HOGU_COLORS.primary}] border-2 border-white shadow-md shrink-0 mt-0.5`}></div>
                                    <div>
                                        <p className="text-xs text-slate-400 font-bold uppercase mb-0.5">{t('dashboard:provider.booking_details.arrival')}</p>
                                        <p className="font-bold text-slate-700 leading-tight">{dropoff || t('dashboard:provider.booking_details.not_specified')}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="col-span-2 mt-4">
                            <div className="bg-slate-50 border border-slate-100 rounded-2xl overflow-hidden">
                                <RouteMapNCC
                                    from={pickup || booking.raw?.pickupLocation}
                                    fromAddress={booking.raw?.pickupLocation}
                                    to={dropoff || booking.raw?.destination}
                                    toAddress={booking.raw?.destination}
                                    tripType={booking.raw?.tripType || "oneway"}
                                    estimatedPrice={booking.price}
                                    fromCoordinates={bookingCoordinates?.from}
                                    toCoordinates={bookingCoordinates?.to}
                                />
                            </div>
                        </div>
                    </>
                );
            case 'beb':
                return (
                    <div className="col-span-2 grid grid-cols-2 gap-4 mt-2">
                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                            <span className="text-[10px] uppercase text-slate-400 font-bold tracking-wider block mb-1">{t('dashboard:provider.booking_details.checkin_out')}</span>
                            <div className="flex items-center gap-2 font-bold text-slate-700">{booking.checkInTime || booking.time}</div>
                        </div>
                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                            <span className="text-[10px] uppercase text-slate-400 font-bold tracking-wider block mb-1">{t('dashboard:provider.booking_details.nights')}</span>
                            <div className="flex items-center gap-2 font-bold text-slate-700">{booking.quantity || 1} {t('dashboard:provider.booking_details.nights')}</div>
                        </div>
                    </div>
                );
            case 'storage':
                return (
                    <div className="col-span-2 bg-slate-50 p-4 rounded-2xl border border-slate-100 mt-2">
                        <span className="text-[10px] uppercase text-slate-400 font-bold tracking-wider block mb-1">{t('dashboard:provider.booking_details.luggage_details')}</span>
                        <div className="font-bold text-slate-700">{t('dashboard:provider.booking_details.luggage_desc', { count: booking.quantity, duration: booking.duration || t('dashboard:provider.booking_details.full_day') })}</div>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <ModalBackdrop onClose={onClose}>
            <div className="flex flex-col md:flex-row gap-6 md:gap-8">
                {/* Profilo cliente */}
                <div className="w-full md:w-1/3 flex flex-col items-center text-center border-b md:border-b-0 md:border-r border-slate-100 pb-5 md:pb-0 md:pr-6">
                    <div className="relative mb-4">
                        {booking?.image ? (
                            <SafeImage src={booking.image} className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl object-cover shadow-xl ring-4 ring-white" alt="" />
                        ) : (
                            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-amber-400 text-white flex items-center justify-center shadow-xl ring-4 ring-white">
                                <User size={36} />
                            </div>
                        )}
                        <div className="absolute -bottom-2 -right-2 bg-white p-1.5 rounded-xl shadow-sm"><StatusBadge status={booking?.status} /></div>
                    </div>
                    <h2 className={`font-extrabold text-xl sm:text-2xl text-[${HOGU_COLORS.dark}] mb-1`}>{booking?.customerName}</h2>
                    <p className={`text-[${HOGU_COLORS.primary}] font-bold text-sm mb-4`}>{booking?.serviceName}</p>
                    {booking?.phone && (
                        <a
                            href={`tel:${booking.phone}`}
                            className="flex items-center gap-2 bg-slate-50 px-4 py-3 rounded-xl text-slate-600 text-sm font-bold hover:bg-slate-100 transition-colors w-full justify-center min-h-[48px]"
                        >
                            <Phone size={16} /> {booking.phone}
                        </a>
                    )}
                </div>

                {/* Dettagli prenotazione */}
                <div className="flex-1">
                    <h3 className={`text-base sm:text-lg font-bold text-[${HOGU_COLORS.dark}] mb-4 flex items-center gap-2`}>
                        <ListTodo size={18} className="text-slate-400" /> {t('dashboard:provider.booking_details.title')}
                    </h3>

                    <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-6">
                        <div className="bg-slate-50 p-3 sm:p-4 rounded-2xl border border-slate-100">
                            <span className="text-[10px] uppercase text-slate-400 font-bold tracking-wider block mb-1">{t('dashboard:provider.booking_details.date')}</span>
                            <div className="flex items-center gap-2 font-bold text-slate-700 text-base sm:text-lg">
                                <Calendar size={16} className={`text-[${HOGU_COLORS.primary}]`} /> {booking?.date}
                            </div>
                        </div>
                        <div className="bg-slate-50 p-3 sm:p-4 rounded-2xl border border-slate-100">
                            <span className="text-[10px] uppercase text-slate-400 font-bold tracking-wider block mb-1">{t('dashboard:provider.booking_details.time')}</span>
                            <div className="flex items-center gap-2 font-bold text-slate-700 text-base sm:text-lg">
                                <Clock size={16} className={`text-[${HOGU_COLORS.primary}]`} /> {booking?.time}
                            </div>
                        </div>

                        <div className="bg-slate-50 p-3 sm:p-4 rounded-2xl border border-slate-100">
                            <span className="text-[10px] uppercase text-slate-400 font-bold tracking-wider block mb-1">
                                {activeCategory === 'beb' ? t('dashboard:provider.booking_details.guests') : activeCategory === 'ncc' ? t('dashboard:provider.booking_details.passengers') : activeCategory === 'storage' ? t('dashboard:provider.booking_details.quantity') : t('dashboard:provider.categories.units.coperti')}
                            </span>
                            <div className="flex items-center gap-2 font-bold text-slate-700 text-base sm:text-lg">
                                <User size={16} className={`text-[${HOGU_COLORS.primary}]`} />
                                {booking?.guests || booking?.quantity || 1}
                            </div>
                        </div>

                        <div className="bg-slate-50 p-3 sm:p-4 rounded-2xl border border-slate-100">
                            <span className="text-[10px] uppercase text-slate-400 font-bold tracking-wider block mb-1">{t('dashboard:provider.booking_details.total')}</span>
                            <div className={`flex items-center gap-2 font-extrabold text-[${HOGU_COLORS.dark}] text-base sm:text-lg`}>
                                € {formatPrice(booking?.price)}
                            </div>
                        </div>

                        {renderExtraDetails()}
                    </div>

                    <button
                        onClick={onClose}
                        className="w-full py-3.5 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-colors min-h-[48px]"
                    >
                        {t('dashboard:provider.mobile.close')}
                    </button>
                </div>
            </div>
        </ModalBackdrop>
    );
};

const ComplaintModal = ({ isOpen, onClose, onConfirm, booking }) => {
    const { t } = useTranslation(['dashboard']);
    const [reason, setReason] = useState("");
    useEffect(() => { if (isOpen) setReason(""); }, [isOpen]);
    if (!isOpen) return null;
    return (
        <ModalBackdrop onClose={onClose}>
            <div className="max-w-sm mx-auto">
                <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-500 mb-4 mx-auto"><AlertTriangle size={24} /></div>
                <h2 className={`font-bold text-xl text-[${HOGU_COLORS.dark}] mb-4 text-center`}>{t('dashboard:provider.modals.complaint.title')}</h2>
                <textarea
                    className="w-full border border-slate-200 p-4 rounded-xl mb-6 bg-slate-50 focus:ring-2 focus:ring-amber-100 outline-none transition-all text-sm resize-none"
                    rows="4"
                    placeholder={t('dashboard:provider.modals.complaint.placeholder')}
                    value={reason}
                    onChange={e => setReason(e.target.value)}
                />
                <button
                    onClick={() => onConfirm(booking.id, reason)}
                    disabled={!reason.trim()}
                    className="w-full bg-amber-500 text-white py-3.5 rounded-xl font-bold text-sm hover:bg-amber-600 transition-all min-h-[48px] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {t('dashboard:provider.modals.complaint.submit')}
                </button>
            </div>
        </ModalBackdrop>
    );
};

const CancellationModal = ({ isOpen, onClose, onConfirm, booking }) => {
    const { t } = useTranslation(['dashboard']);
    const [reason, setReason] = useState("");
    if (!isOpen) return null;
    return (
        <ModalBackdrop onClose={onClose}>
            <div className="max-w-sm mx-auto">
                <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center text-red-500 mb-4 mx-auto"><Ban size={24} /></div>
                <h2 className={`font-bold text-xl text-[${HOGU_COLORS.dark}] mb-4 text-center`}>{t('dashboard:provider.modals.cancellation.title')}</h2>
                <textarea
                    className="w-full border border-slate-200 p-4 rounded-xl mb-6 bg-slate-50 focus:ring-2 focus:ring-red-100 outline-none transition-all text-sm resize-none"
                    rows="4"
                    placeholder={t('dashboard:provider.modals.cancellation.placeholder')}
                    value={reason}
                    onChange={e => setReason(e.target.value)}
                />
                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 bg-slate-100 text-slate-600 py-3.5 rounded-xl font-bold text-sm min-h-[48px]"
                    >
                        {t('dashboard:provider.actions.back')}
                    </button>
                    <button
                        onClick={() => onConfirm(booking.id, reason)}
                        className="flex-1 bg-red-500 text-white py-3.5 rounded-xl font-bold text-sm hover:bg-red-600 transition-all min-h-[48px]"
                    >
                        {t('dashboard:provider.actions.confirm')}
                    </button>
                </div>
            </div>
        </ModalBackdrop>
    );
};

const PriceCorrectionModal = ({ isOpen, onClose, onConfirm, booking }) => {
    const { t } = useTranslation(['dashboard']);
    const [newPrice, setNewPrice] = useState("");
    const [note, setNote] = useState("");
    useEffect(() => {
        if (isOpen && booking) { setNewPrice(booking.price); setNote(""); }
    }, [isOpen, booking]);
    if (!isOpen || !booking) return null;
    return (
        <ModalBackdrop onClose={onClose}>
            <div className="max-w-sm mx-auto">
                <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-500 mb-4 mx-auto"><RefreshCw size={24} /></div>
                <h2 className={`font-bold text-xl text-[${HOGU_COLORS.dark}] mb-4 text-center`}>{t('dashboard:provider.modals.correction.title')}</h2>
                <div className="mb-4">
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">{t('dashboard:provider.modals.correction.label')}</label>
                    <CurrencyInput
                        className="w-full border border-slate-200 p-4 rounded-xl bg-slate-50 focus:ring-2 focus:ring-amber-100 outline-none font-bold text-slate-800"
                        placeholder={t('dashboard:provider.modals.correction.placeholder')}
                        decimalsLimit={2}
                        decimalScale={2}
                        suffix=" €"
                        value={newPrice}
                        onValueChange={(value) => setNewPrice(value)}
                    />
                </div>
                <div className="mb-6">
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">{t('dashboard:provider.modals.correction.notes')}</label>
                    <textarea
                        className="w-full border border-slate-200 p-4 rounded-xl bg-slate-50 focus:ring-2 focus:ring-amber-100 outline-none text-sm resize-none"
                        rows="3"
                        value={note}
                        onChange={e => setNote(e.target.value)}
                    />
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 bg-slate-100 text-slate-600 py-3.5 rounded-xl font-bold text-sm min-h-[48px]"
                    >
                        {t('dashboard:provider.actions.cancel')}
                    </button>
                    <button
                        onClick={() => onConfirm(booking.id, newPrice, note)}
                        className="flex-1 bg-amber-500 text-white py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 min-h-[48px]"
                    >
                        <Send size={16} /> {t('dashboard:provider.actions.send')}
                    </button>
                </div>
            </div>
        </ModalBackdrop>
    );
};


// =================================================================================
// 3. MAIN DASHBOARD COMPONENT (NCC Dashboard)
// =================================================================================

const NccDashboard = () => {
    const { t } = useTranslation(['dashboard']);
    const navigate = useNavigate();

    // --- STATO ---
// ... (omitted parts for brevity, but I need to replace from line 951)
    const [bookings, setBookings] = useState([]);
    const [fullyPaidBookings, setFullyPaidBookings] = useState([]);
    const [historyBookings, setHistoryBookings] = useState([]);
    const [serviceId, setServiceId] = useState(null);
    const [infoStats, setInfoStats] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState(null);
    const [errorMessage, setErrorMessage] = useState(null);

    const [currentRide, setCurrentRide] = useState(null);

    const fetchBookings = async (id) => {
        try {
            const sid = id || serviceId;
            if (!sid) return;
            const data = await nccService.getBookings(sid);
            const list = data.content || data || [];
            const mapped = list.map(b => {
                const mainDateTime = b.pickupTime || b.creationDate;
                return {
                    id: b.id,
                    serviceId: b.serviceId,
                    status: b.status,
                    price: b.totalAmount,
                    date: formatDate(mainDateTime),
                    time: formatTime(mainDateTime),
                    location: b.pickupLocation && b.destination
                        ? `${b.pickupLocation} → ${b.destination}`
                        : b.pickupLocation || b.destination || '',
                    guests: b.passengers || 1,
                    customerName: 'Cliente',
                    serviceName: b.serviceName,
                    image: '',
                    raw: b
                };
            });
            setBookings(mapped);
        } catch (error) {
            console.error("Errore recupero prenotazioni:", error);
        }
    };

    const fetchFullyPaidBookings = async (id) => {
        try {
            const sid = id || serviceId;
            if (!sid) return;
            const data = await nccService.getFullyPaidBookings(sid);
            const list = data.content || data || [];
            const mapped = list.map(b => {
                const mainDateTime = b.pickupTime || b.creationDate;
                return {
                    id: b.id,
                    serviceId: b.serviceId,
                    status: b.status,
                    price: b.totalAmount,
                    date: formatDate(mainDateTime),
                    time: formatTime(mainDateTime),
                    location: b.pickupLocation && b.destination
                        ? `${b.pickupLocation} → ${b.destination}`
                        : b.pickupLocation || b.destination || '',
                    guests: b.passengers || 1,
                    customerName: 'Cliente',
                    serviceName: b.serviceName,
                    image: '',
                    raw: b
                };
            });
            setFullyPaidBookings(mapped);
        } catch (error) {
            console.error("Errore recupero prenotazioni fully paid:", error);
        }
    };

    const fetchHistoryBookings = async (id) => {
        try {
            const sid = id || serviceId;
            if (!sid) return;
            const data = await nccService.getBookingsHistory(sid, Math.max(historyPage - 1, 0), ITEMS_PER_PAGE);
            const list = data.content || data || [];
            const mapped = list.map(b => {
                const mainDateTime = b.pickupTime || b.creationDate;
                return {
                    id: b.id,
                    serviceId: b.serviceId,
                    status: b.status,
                    price: b.totalAmount,
                    date: formatDate(mainDateTime),
                    time: formatTime(mainDateTime),
                    location: b.pickupLocation && b.destination
                        ? `${b.pickupLocation} → ${b.destination}`
                        : b.pickupLocation || b.destination || '',
                    guests: b.passengers || 1,
                    customerName: 'Cliente',
                    serviceName: b.serviceName,
                    image: '',
                    raw: b
                };
            });
            setHistoryBookings(mapped);
        } catch (error) {
            console.error("Errore recupero prenotazioni archivio:", error);
        }
    };

    useEffect(() => {
        const init = async () => {
            try {
                const info = await nccService.getInfoProvider();
                const sid = info.serviceId || info.id;
                if (info && sid) {
                    setInfoStats(info);
                    setServiceId(sid);
                    await fetchBookings(sid);
                    await fetchFullyPaidBookings(sid);
                    try {
                        const current = await nccService.getCurrentBooking(sid);
                        if (current) {
                            const mainDateTime = current.pickupTime || current.creationDate;
                            setCurrentRide({
                                id: current.id,
                                serviceId: current.serviceId,
                                status: current.status,
                                price: current.totalAmount,
                                date: formatDate(mainDateTime),
                                time: formatTime(mainDateTime),
                                location: current.pickupLocation && current.destination
                                    ? `${current.pickupLocation} → ${current.destination}`
                                    : current.pickupLocation || current.destination || '',
                                guests: current.passengers || 1,
                                customerName: 'Cliente',
                                serviceName: current.serviceName,
                                image: '',
                                raw: current
                            });
                        } else {
                            setCurrentRide(null);
                        }
                    } catch (e) {
                        setCurrentRide(null);
                    }
                }
            } catch (error) {
                console.error("Errore inizializzazione provider:", error);
            }
        };
        init();
    }, []);

    const [isMobileOverlayOpen, setIsMobileOverlayOpen] = useState(false);

    // --- PAGINAZIONE ---
    const [pendingPage, setPendingPage] = useState(1);
    const [historyPage, setHistoryPage] = useState(1);
    const ITEMS_PER_PAGE = 3;

    // --- FILTRI ---
    const [filter, setFilter] = useState('active');

    // --- MODALI ---
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [detailsOpen, setDetailsOpen] = useState(false);
    const [complaintOpen, setComplaintOpen] = useState(false);
    const [cancelOpen, setCancelOpen] = useState(false);
    const [correctionOpen, setCorrectionOpen] = useState(false);

    // --- CALCOLO LISTE ---

    const normalizeStatus = (status) => {
        if (!status) return '';
        if (typeof status === 'string') return status.toUpperCase();
        if (typeof status === 'object') {
            if (status.name) return String(status.name).toUpperCase();
            if (status.italianValue) return String(status.italianValue).toUpperCase();
        }
        return '';
    };

    const isPendingStatus = (status) => {
        const norm = normalizeStatus(status);
        return (
            norm === 'PENDING' ||
            norm === 'IN_ATTESA' ||
            norm === 'PAYMENT_AUTHORIZED' ||
            norm === 'PAGAMENTO_AUTORIZZATO' ||
            norm === 'WAITING_PROVIDER_CONFIRMATION' ||
            norm === 'IN_ATTESA_CONFERMA_DEL_FORNITORE'
        );
    };

    const isWaitingCustomerStatus = (status) => {
        const norm = normalizeStatus(status);
        return norm === 'WAITING_CUSTOMER_PAYMENT' || norm === 'IN_ATTESA_PAGAMENTO_DEL_CLIENTE';
    };

    const isFullyPaidStatus = (status) => {
        const norm = normalizeStatus(status);
        return (
            norm === 'FULL_PAYMENT_COMPLETED' ||
            norm === 'PAGAMENTO_COMPLETO_ESEGUITO' ||
            norm === 'COMPLETED' ||
            norm === 'COMPLETATO' ||
            norm === 'WAITING_COMPLETION' ||
            norm === 'IN_ATTESA_DI_COMPLETAMENTO' ||
            norm === 'WAITING_CUSTOMER_PAYMENT' ||
            norm === 'IN_ATTESA_PAGAMENTO_DEL_CLIENTE'
        );
    };

    const isCancelledStatus = (status) => {
        const norm = normalizeStatus(status);
        return (
            norm === 'CANCELLED_BY_PROVIDER' ||
            norm === 'CANCELLED_BY_ADMIN' ||
            norm === 'MODIFIED_BY_PROVIDER' ||
            norm === 'CANCELLED' ||
            norm === 'ANNULLATA' ||
            norm === 'REFUNDED_BY_ADMIN'
        );
    };

    const getBookingDateObj = (booking) => {
        const iso = booking?.raw?.pickupTime || booking?.raw?.creationDate;
        if (!iso) return null;
        const d = new Date(iso);
        return isNaN(d.getTime()) ? null : d;
    };

    // 1. Pending
    const pendingListFull = bookings.filter(b => isPendingStatus(b.status));
    const totalPendingPages = Math.ceil(pendingListFull.length / ITEMS_PER_PAGE);

    const currentPendingList = pendingListFull.slice(
        (pendingPage - 1) * ITEMS_PER_PAGE,
        pendingPage * ITEMS_PER_PAGE
    );

    // 2. History / Agenda
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);

    const allConfirmedOrCancelled = [...bookings, ...fullyPaidBookings, ...(filter === 'past' ? historyBookings : [])]
        .filter((v, i, a) => a.findIndex(t => t.id === v.id) === i) // Unique
        .filter(b => !isPendingStatus(b.status))
        .map(b => ({ booking: b, date: getBookingDateObj(b) }))
        .filter(x => x.date !== null);

    let historySource;
    if (filter === 'past') {
        // Archivio: < Oggi
        historySource = allConfirmedOrCancelled.filter(x => x.date < startOfToday);
    } else {
        // In Arrivo: >= Oggi (include tutti gli stati non-pending, compresi annullati)
        historySource = allConfirmedOrCancelled.filter(x => x.date >= startOfToday);
    }

    historySource.sort((a, b) => a.date - b.date);
    const historyListFull = historySource.map(x => x.booking);
    const totalHistoryPages = Math.ceil(historyListFull.length / ITEMS_PER_PAGE);
    const currentHistoryList = historyListFull.slice(
        (historyPage - 1) * ITEMS_PER_PAGE,
        historyPage * ITEMS_PER_PAGE
    );

    // --- HANDLERS ---

    const handleOpenDetails = (bk) => {
        setIsMobileOverlayOpen(false);
        setSelectedBooking(bk);
        setDetailsOpen(true);
    };

    const handleAccept = async (id) => {
        setIsLoading(true);
        try {
            await nccService.acceptBooking(id);
            await fetchBookings();
            await fetchFullyPaidBookings();
            setSuccessMessage("Prenotazione accettata con successo!");
        } catch (error) {
            console.error("Errore accettazione:", error);
            setErrorMessage("Errore durante l'accettazione della prenotazione.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleCompleteRide = async (id) => {
        setIsLoading(true);
        try {
            await nccService.completeBooking(id);
            await fetchBookings();
            await fetchFullyPaidBookings();
            setSuccessMessage("Corsa segnata come completata.");
        } catch (error) {
            console.error("Errore completamento:", error);
            setErrorMessage("Errore durante la chiusura della corsa.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleReject = (bk) => { setSelectedBooking(bk); setCancelOpen(true); };
    const handleRectify = (bk) => { setSelectedBooking(bk); setCorrectionOpen(true); };

    const confirmCancel = async (id, reason) => {
        setIsLoading(true);
        try {
            const booking = bookings.find(b => b.id === id);
            if (booking?.status === 'pending' || booking?.status === 'waiting_customer') {
                await nccService.rejectBooking(id, reason);
                setSuccessMessage("Richiesta rifiutata.");
            } else {
                await nccService.cancelBooking(id, reason);
                setSuccessMessage("Prenotazione cancellata.");
            }
            await fetchBookings();
            setCancelOpen(false);
        } catch (error) {
            console.error("Errore cancellazione:", error);
            setErrorMessage("Errore durante la cancellazione.");
        } finally {
            setIsLoading(false);
        }
    };

    const confirmComplaint = async (id, reason) => {
        setIsLoading(true);
        try {
            await nccService.reportComplaint(id, reason);
            setSuccessMessage("Segnalazione inviata con successo.");
            setComplaintOpen(false);
        } catch (error) {
            console.error("Errore segnalazione:", error);
            setErrorMessage("Errore durante l'invio della segnalazione.");
        } finally {
            setIsLoading(false);
        }
    };

    const confirmCorrection = async (id, price, note) => {
        setIsLoading(true);
        try {
            await nccService.rectifyBooking(id, price, note);
            await fetchBookings();
            setSuccessMessage("Proposta di rettifica inviata.");
            setCorrectionOpen(false);
        } catch (error) {
            console.error("Errore rettifica:", error);
            setErrorMessage("Errore durante l'invio della rettifica.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleFilterChange = async (newFilter) => {
        setFilter(newFilter);
        setHistoryPage(1);
        setIsLoading(true);
        try {
            await fetchFullyPaidBookings();
            await fetchBookings();
            if (newFilter === 'past') {
                await fetchHistoryBookings();
            }
        } catch (e) {
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (filter === 'past') {
            fetchHistoryBookings();
        }
    }, [filter, historyPage, serviceId]);

    const currentRideCoords = React.useMemo(() => {
        if (!currentRide?.raw) return null;
        const toNumber = (v) => {
            const n = typeof v === 'string' ? parseFloat(v) : v;
            return typeof n === 'number' && !Number.isNaN(n) ? n : null;
        };
        const normalizeCoordObj = (obj) => {
            if (!obj) return null;
            const lat = toNumber(obj.lat ?? obj.latitude);
            const lon = toNumber(obj.lon ?? obj.lng ?? obj.longitude);
            return (lat != null && lon != null) ? { lat, lon } : null;
        };
        const from = normalizeCoordObj(currentRide.raw.pickupCoordinates)
            || (() => {
                const lat = toNumber(currentRide.raw.pickupLatitude);
                const lon = toNumber(currentRide.raw.pickupLongitude);
                return (lat != null && lon != null) ? { lat, lon } : null;
            })();
        const to = normalizeCoordObj(currentRide.raw.destinationCoordinates)
            || (() => {
                const lat = toNumber(currentRide.raw.destinationLatitude);
                const lon = toNumber(currentRide.raw.destinationLongitude);
                return (lat != null && lon != null) ? { lat, lon } : null;
            })();
        return (from || to) ? { from, to } : null;
    }, [currentRide]);

    const currentRideLocs = React.useMemo(() => {
        if (!currentRide) return { p: '', d: '' };
        let p = currentRide.raw?.pickupLocation || '';
        let d = currentRide.raw?.destination || '';
        if ((!p || !d) && currentRide.location) {
            const sep = currentRide.location.includes('→') ? '→' : (currentRide.location.includes('->') ? '->' : null);
            if (sep) {
                const parts = currentRide.location.split(sep);
                if (!p) p = parts[0].trim();
                if (!d) d = parts[1].trim();
            } else if (!p) p = currentRide.location;
        }
        return { p, d };
    }, [currentRide]);

    return (
        <div className="w-full max-w-6xl mx-auto px-3 sm:px-4 md:px-6 space-y-6 md:space-y-10 animate-in fade-in pb-28 md:pb-16 relative">
            <LoadingScreen isLoading={isLoading} />
            <SuccessModal isOpen={!!successMessage} onClose={() => setSuccessMessage(null)} message={successMessage} />
            {errorMessage && <ErrorModal onClose={() => setErrorMessage(null)} message={errorMessage} />}

            {/* --- MODALI --- */}
            <BookingDetailModal isOpen={detailsOpen} onClose={() => setDetailsOpen(false)} booking={selectedBooking} />
            <ComplaintModal isOpen={complaintOpen} onClose={() => setComplaintOpen(false)} onConfirm={confirmComplaint} booking={selectedBooking} />
            <CancellationModal isOpen={cancelOpen} onClose={() => setCancelOpen(false)} onConfirm={confirmCancel} booking={selectedBooking} />
            <PriceCorrectionModal isOpen={correctionOpen} onClose={() => setCorrectionOpen(false)} onConfirm={confirmCorrection} booking={selectedBooking} />

            {/* --- ELEMENTI UI MOBILE DEDICATI --- */}

            {/* 1. Sticky trigger mobile */}
            {!isMobileOverlayOpen && (
                <MobileStickyTrigger
                    count={pendingListFull.length}
                    onClick={() => setIsMobileOverlayOpen(true)}
                />
            )}

            {/* 2. Overlay full page mobile */}
            <MobilePendingFullPage
                isOpen={isMobileOverlayOpen}
                onClose={() => setIsMobileOverlayOpen(false)}
                pendingList={currentPendingList}
                currentPage={pendingPage}
                totalPages={totalPendingPages}
                onNext={() => setPendingPage(p => p + 1)}
                onPrev={() => setPendingPage(p => p - 1)}
                onAccept={handleAccept}
                onReject={handleReject}
                onRectify={handleRectify}
                onOpenDetails={handleOpenDetails}
            />

            {/* =========================================================
                HEADER: STATS + AZIONI
            ========================================================= */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 items-stretch">

                {/* Stats (2/3 larghezza su lg) */}
                <div className="lg:col-span-2">
                    <StatsSummary activeCategory="ncc" stats={infoStats} />
                </div>

                {/* Azioni (1/3 larghezza su lg) */}
                <div className="flex flex-row lg:flex-col gap-3 sm:gap-4">

                    {/* Scanner Corsa */}
                    <div
                        onClick={() => navigate('/provider/qr-validator?type=ncc')}
                        className={`flex-1 lg:flex-none min-h-[120px] lg:min-h-[140px] bg-gradient-to-br from-[${HOGU_COLORS.dark}] to-slate-800 rounded-[1.75rem] p-4 sm:p-6 text-white relative overflow-hidden group cursor-pointer shadow-xl shadow-slate-900/10 hover:shadow-2xl hover:-translate-y-0.5 transition-all flex flex-col justify-center`}
                    >
                        <div className="absolute -right-4 -top-4 text-white/5 group-hover:text-white/10 transition-colors pointer-events-none">
                            <QrCode size={90} />
                        </div>
                        <div className="relative z-10">
                            <div className="bg-white/10 w-fit p-2 rounded-xl backdrop-blur-md border border-white/10 mb-2 sm:mb-3">
                                <ScanLine size={18} className={`text-[${HOGU_COLORS.primary}]`} />
                            </div>
                            <h3 className="text-base sm:text-xl font-bold mb-1">{t('dashboard:provider.dashboard.scanner_title')}</h3>
                            <p className="text-slate-400 text-xs font-medium hidden sm:block">{t('dashboard:provider.dashboard.scanner_desc')}</p>
                        </div>
                        <div className={`absolute bottom-4 right-4 sm:bottom-6 sm:right-6 text-[${HOGU_COLORS.primary}] opacity-0 group-hover:opacity-100 transition-opacity`}>
                            <ArrowRight size={20} />
                        </div>
                    </div>

                    {/* Modifica Servizio */}
                    <button
                        onClick={() => navigate(`/provider/edit/ncc/${serviceId}`)}
                        className={`flex-1 lg:flex-none h-auto lg:h-20 bg-white border border-slate-200 rounded-[1.5rem] px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between hover:bg-slate-50 hover:border-[${HOGU_COLORS.primary}]/50 transition-all group shadow-sm hover:shadow-md`}
                    >
                        <div className="flex items-center gap-3 text-left">
                            <div className={`p-2 sm:p-2.5 bg-slate-100 rounded-xl group-hover:bg-[${HOGU_COLORS.primary}]/10 group-hover:text-[${HOGU_COLORS.primary}] transition-colors text-slate-600`}>
                                <CarFront size={18} />
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-800 text-sm">{t('dashboard:provider.dashboard.service_title')}</h4>
                                <p className="text-slate-400 text-xs">{t('dashboard:provider.dashboard.service_desc')}</p>
                            </div>
                        </div>
                        <Settings size={16} className={`text-slate-300 group-hover:text-[${HOGU_COLORS.primary}] transition-colors shrink-0`} />
                    </button>
                </div>
            </div>

            {/* =========================================================
                CORSA IN CORSO — Visibile mobile + desktop
            ========================================================= */}
            <section>
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2.5 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-600 shrink-0">
                        <Navigation size={20} />
                    </div>
                    <div>
                        <h2 className={`text-lg sm:text-xl md:text-2xl font-extrabold text-[${HOGU_COLORS.dark}]`}>{t('dashboard:provider.dashboard.current_ride_title')}</h2>
                        <p className="text-xs sm:text-sm text-slate-500 font-medium">
                            {currentRide ? t('dashboard:provider.dashboard.current_ride_desc_active') : t('dashboard:provider.dashboard.current_ride_desc_none')}
                        </p>
                    </div>
                </div>

                {currentRide ? (
                    <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden p-5 sm:p-6 transition-all hover:shadow-md">
                        <div className="flex flex-col gap-6">
                            {/* Dettagli Corsa */}
                            <div className="flex items-start gap-4 min-w-0">
                                <div className={`w-12 h-12 rounded-2xl bg-[${HOGU_COLORS.primary}]/10 flex items-center justify-center text-[${HOGU_COLORS.primary}] shrink-0 shadow-inner`}>
                                    <CarFront size={24} />
                                </div>
                                <div className="space-y-1.5 flex-1 min-w-0">
                                    <div className="flex items-center gap-2 text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap overflow-hidden">
                                        <CalendarClock size={14} className="text-slate-300" />
                                        <span>{currentRide.date} • {currentRide.time}</span>
                                    </div>
                                    <h3 className="text-base sm:text-lg font-extrabold text-slate-800 leading-tight truncate">
                                        {currentRide.location || t('dashboard:provider.actions.details')}
                                    </h3>
                                    <div className="flex items-center gap-3 text-xs sm:text-sm text-slate-500 font-medium">
                                        <span className="flex items-center gap-1"><User size={14} className="text-slate-300" /> {currentRide.guests} Pax</span>
                                        <span className="w-1 h-1 rounded-full bg-slate-300" />
                                        <span className="text-[${HOGU_COLORS.primary}] font-bold">€ {formatPrice(currentRide.price)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Mappa - Integrata nella card */}
                            <div className="w-full h-48 sm:h-64 rounded-2xl overflow-hidden border border-slate-100 bg-slate-50 shadow-inner">
                                <RouteMapNCC
                                    from={currentRideLocs.p}
                                    fromAddress={currentRide.raw?.pickupLocation}
                                    to={currentRideLocs.d}
                                    toAddress={currentRide.raw?.destination}
                                    tripType={currentRide.raw?.tripType || "oneway"}
                                    estimatedPrice={currentRide.price}
                                    fromCoordinates={currentRideCoords?.from}
                                    toCoordinates={currentRideCoords?.to}
                                />
                            </div>

                            {/* Azioni - Sempre sotto ai dettagli, uno accanto all'altro da tablet in su */}
                            <div className="flex flex-col sm:flex-row gap-3 w-full border-t border-slate-50 pt-4">
                                <button
                                    onClick={() => handleCompleteRide(currentRide.id)}
                                    className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl text-sm font-bold bg-emerald-500 text-white hover:bg-emerald-600 active:scale-95 transition-all min-h-[52px] shadow-lg shadow-emerald-100"
                                >
                                    <CheckCircle size={20} />
                                    <span>{t('dashboard:provider.actions.mark_completed')}</span>
                                </button>
                                <button
                                    onClick={() => { setSelectedBooking(currentRide); setCancelOpen(true); }}
                                    className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl text-sm font-bold bg-white text-rose-500 border-2 border-rose-50 hover:bg-rose-50 hover:border-rose-100 active:scale-95 transition-all min-h-[52px]"
                                >
                                    <XCircle size={20} />
                                    <span>{t('dashboard:provider.actions.cancel_ride')}</span>
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="bg-slate-50 border border-slate-200 border-dashed rounded-2xl sm:rounded-3xl p-6 flex items-center gap-3 text-slate-400">
                        <Navigation size={20} className="opacity-40 shrink-0" />
                        <p className="text-sm font-medium">{t('dashboard:provider.dashboard.current_ride_desc_none')}</p>
                    </div>
                )}
            </section>

            {/* =========================================================
                RICHIESTE TRANSFER IN ATTESA — Solo desktop
            ========================================================= */}
            <section className="hidden md:block">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-5">
                    <div className="flex items-center gap-3">
                        <div className={`p-3 rounded-2xl border shrink-0 ${pendingListFull.length > 0 ? 'bg-amber-50 border-amber-100 text-amber-600' : 'bg-slate-50 border-slate-100 text-slate-400'}`}>
                            <BellRing size={24} className={pendingListFull.length > 0 ? 'animate-bounce' : ''} />
                        </div>
                        <div>
                            <h2 className={`text-xl sm:text-2xl font-extrabold text-[${HOGU_COLORS.dark}]`}>{t('dashboard:provider.dashboard.pending_requests_title')}</h2>
                            <p className="text-sm text-slate-500 font-medium">
                                {pendingListFull.length > 0
                                    ? (pendingListFull.length === 1 ? t('dashboard:provider.dashboard.pending_requests_desc_one') : t('dashboard:provider.dashboard.pending_requests_desc_other', { count: pendingListFull.length }))
                                    : t('dashboard:provider.dashboard.pending_requests_none')
                                }
                            </p>
                        </div>
                    </div>

                    <PaginationControls
                        currentPage={pendingPage}
                        totalPages={totalPendingPages}
                        onNext={() => setPendingPage(p => p + 1)}
                        onPrev={() => setPendingPage(p => p - 1)}
                    />
                </div>

                {currentPendingList.length > 0 ? (
                    <div className="p-1.5 rounded-[2rem] bg-gradient-to-br from-amber-50/60 via-orange-50/40 to-transparent">
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                            {currentPendingList.map(b => (
                                <PendingRequestCard
                                    key={b.id}
                                    booking={b}
                                    activeCategory="ncc"
                                    onAccept={handleAccept}
                                    onReject={handleReject}
                                    onRectify={handleRectify}
                                    onOpenDetails={handleOpenDetails}
                                />
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="bg-slate-50 border border-slate-200 border-dashed rounded-3xl p-10 flex flex-col items-center justify-center text-center">
                        <div className="w-16 h-16 bg-white text-slate-300 rounded-full flex items-center justify-center mb-3 border border-slate-100">
                            <Car className="opacity-50" size={32} />
                        </div>
                        <h3 className="text-base font-bold text-slate-700">{t('dashboard:provider.dashboard.fleet_idle')}</h3>
                        <p className="text-slate-400 text-sm mt-1">{t('dashboard:provider.dashboard.pending_requests_none')}</p>
                    </div>
                )}
            </section>

            <div className="hidden md:block border-t border-slate-100" />

            {/* =========================================================
                AGENDA CORSE
            ========================================================= */}
            <section>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-5 sm:mb-6">
                    <div className="flex-1">
                        <h2 className={`text-lg sm:text-xl md:text-2xl font-bold text-slate-800 flex items-center gap-2`}>
                            <Navigation className={`text-[${HOGU_COLORS.primary}]`} size={22} /> {t('dashboard:provider.dashboard.agenda_title')}
                        </h2>
                        <p className="text-xs text-slate-400 mt-1 font-medium">
                            {filter === 'active'
                                ? t('dashboard:provider.dashboard.agenda_desc_active')
                                : t('dashboard:provider.dashboard.agenda_desc_past')
                            }
                        </p>
                    </div>

                    <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                        {/* Filtri tab */}
                        <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
                            <button
                                onClick={() => handleFilterChange('active')}
                                className={`px-3 sm:px-4 py-2 rounded-lg text-[11px] sm:text-xs font-bold uppercase tracking-wide transition-all ${filter === 'active' ? `bg-[${HOGU_COLORS.primary}] text-white shadow-md` : 'text-slate-400 hover:bg-slate-50'}`}
                            >
                                {t('dashboard:provider.dashboard.tabs.upcoming')}
                            </button>
                            <button
                                onClick={() => handleFilterChange('past')}
                                className={`px-3 sm:px-4 py-2 rounded-lg text-[11px] sm:text-xs font-bold uppercase tracking-wide transition-all ${filter === 'past' ? 'bg-slate-800 text-white shadow-md' : 'text-slate-400 hover:bg-slate-50'}`}
                            >
                                {t('dashboard:provider.dashboard.tabs.archive')}
                            </button>
                        </div>

                        <PaginationControls
                            currentPage={historyPage}
                            totalPages={totalHistoryPages}
                            onNext={() => setHistoryPage(p => p + 1)}
                            onPrev={() => setHistoryPage(p => p - 1)}
                        />
                    </div>
                </div>

                <div className="flex flex-col gap-3 sm:gap-4">
                    {currentHistoryList.length > 0 ? (
                        currentHistoryList.map(b => (
                            <ProviderBookingCard
                                key={b.id}
                                booking={b}
                                activeCategory="ncc"
                                onOpenDetails={handleOpenDetails}
                                onOpenComplaint={(bk) => { setSelectedBooking(bk); setComplaintOpen(true); }}
                                onCancelBooking={(bk) => { setSelectedBooking(bk); setCancelOpen(true); }}
                            />
                        ))
                    ) : (
                        <div className="flex flex-col items-center justify-center py-10 sm:py-12 bg-white rounded-2xl sm:rounded-3xl border border-dashed border-slate-200">
                            <CalendarClock className="text-slate-300 mb-2" size={28} />
                            <p className="text-slate-400 font-medium text-sm">{t('dashboard:provider.dashboard.no_rides')}</p>
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
};

export default NccDashboard;

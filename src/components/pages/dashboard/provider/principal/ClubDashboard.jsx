import React, { useState, useRef, useEffect, useCallback } from 'react';
import CurrencyInput from 'react-currency-input-field'; // ← Libreria aggiunta
import {
    Calendar, Clock, ChevronLeft, ChevronRight, Eye, MoreVertical,
    AlertTriangle, Ban, BellRing, Edit2, CheckCircle,
    User, Wallet, Activity, ScanLine,
    Phone, ListTodo, RefreshCw, Send, ChevronUp, X, Loader2,
    PartyPopper, Plus, Edit3, ChevronDown, MousePointer2, Music, Armchair
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import LoadingScreen from '../../../../ui/LoadingScreen';
import SuccessModal from '../../../../ui/SuccessModal';
import ErrorModal from '../../../../ui/ErrorModal';
import SafeImage from '../../../../ui/SafeImage.jsx';

import { HOGU_COLORS, HOGU_THEME } from '../../../../../config/theme.js';

// *** IMPORT DEL SERVICE ***
import { clubService } from '../../../../../api/apiClient.js';

// =================================================================================
// 1. CONFIGURAZIONE & COSTANTI
// =================================================================================

const SERVICE_CATEGORIES = {
    CLUB: { id: 'club', label: 'Club / Eventi', icon: PartyPopper, unit: 'Ingressi' }
};

// Helper per formattare i prezzi (Globale per il file)
const formatPrice = (value) => {
    if (value === undefined || value === null) return '0,00';
    const num = typeof value === 'string' ? parseFloat(value.replace(',', '.')) : value;
    if (isNaN(num)) return '0,00';
    return num.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

// =================================================================================
// 2. COMPONENTI UI CONDIVISI
// =================================================================================

const LoadingComponent = () => (
    <div className="flex justify-center items-center py-10">
        <Loader2 size={32} className="animate-spin text-slate-400" />
    </div>
);

const FullModalBackdrop = ({ children, onClose }) => {
    useEffect(() => {
        const originalOverflow = document.body.style.overflow;
        const originalPosition = document.body.style.position;
        const originalWidth = document.body.style.width;
        const originalTop = document.body.style.top;

        document.body.style.overflow = 'hidden';
        document.body.style.position = 'fixed';
        document.body.style.width = '100%';
        document.body.style.top = '0';
        document.documentElement.style.overflow = 'hidden';

        return () => {
            document.body.style.overflow = originalOverflow;
            document.body.style.position = originalPosition;
            document.body.style.width = originalWidth;
            document.body.style.top = originalTop;
            document.documentElement.style.overflow = '';
        };
    }, []);

    return (
        <div
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 9999,
                backgroundColor: 'rgba(15, 23, 42, 0.6)',
                backdropFilter: 'blur(8px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '1rem',
                margin: 0
            }}
            onClick={onClose}
        >
            <div
                className="bg-white p-8 rounded-[2.5rem] w-full max-w-2xl shadow-2xl shadow-black/20 transform animate-in zoom-in-95 duration-200"
                style={{ maxHeight: '90vh', overflowY: 'auto' }}
                onClick={e => e.stopPropagation()}
            >
                {children}
            </div>
        </div>
    );
};

const ModalBackdrop = ({ children, onClose }) => {
    useEffect(() => {
        const originalOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = originalOverflow; };
    }, []);

    return createPortal(
        <div
            className={`fixed inset-0 bg-[${HOGU_COLORS.dark}]/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200`}
            style={{ zIndex: 9999 }}
            onClick={onClose}
        >
            <div className="bg-white p-8 rounded-[2.5rem] w-full max-w-2xl shadow-2xl shadow-black/20 transform animate-in zoom-in-95 duration-200 mx-4 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                {children}
            </div>
        </div>,
        document.body
    );
};

const PaginationControls = ({ currentPage, totalPages, onNext, onPrev, darkBg = false }) => {
    if (!totalPages || totalPages <= 1) return null;
    const bgClass = darkBg ? "bg-white/10 border-white/10 text-white" : "bg-white border-slate-200 text-slate-600";
    const btnHover = darkBg ? "hover:bg-white/20 disabled:opacity-30" : "hover:bg-slate-50 disabled:opacity-30";
    const textClass = darkBg ? "text-white" : "text-slate-500";
    return (
        <div className={`flex items-center gap-1 rounded-full p-1.5 border shadow-sm ${bgClass}`}>
            <button onClick={onPrev} disabled={currentPage === 1} className={`p-2 rounded-full transition-colors ${btnHover}`}><ChevronLeft size={16} /></button>
            <span className={`text-xs font-bold min-w-[3rem] text-center tracking-wider ${textClass}`}>{currentPage} / {totalPages}</span>
            <button onClick={onNext} disabled={currentPage === totalPages} className={`p-2 rounded-full transition-colors ${btnHover}`}><ChevronRight size={16} /></button>
        </div>
    );
};

const StatusBadge = ({ status }) => {
    const styles = {
        FULL_PAYMENT_COMPLETED: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-100', label: 'Pagamento Completato' },
        COMPLETED: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-100', label: 'Completato' },
        PENDING: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-100', label: 'In Attesa' },
        PAYMENT_AUTHORIZED: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-100', label: 'In Attesa' },
        WAITING_PROVIDER_CONFIRMATION: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-100', label: 'In Attesa' },
        WAITING_CUSTOMER_PAYMENT: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-100', label: 'In Attesa del Cliente' },
        CANCELLED_BY_PROVIDER: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-100', label: 'Annullata' },
        CANCELLED_BY_ADMIN: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-100', label: 'Annullata' },
        MODIFIED_BY_PROVIDER: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-100', label: 'Annullata' },
        REFUNDED_BY_ADMIN: { bg: 'bg-white', text: 'text-slate-600', border: 'border-slate-200', label: 'Rimborsato Admin' },
        CONFIRMED: { bg: 'bg-white', text: 'text-slate-600', border: 'border-slate-200', label: 'Confermata' },
    };
    const normalizedStatus = status ? status.toUpperCase() : 'UNKNOWN';
    const style = styles[normalizedStatus] || { bg: 'bg-gray-100', text: 'text-gray-600', border: 'border-gray-200', label: normalizedStatus };
    return (
        <span className={`px-2.5 py-1 rounded-full text-[10px] md:text-xs uppercase tracking-wider font-bold border ${style.bg} ${style.text} ${style.border} whitespace-nowrap`}>
            {style.label}
        </span>
    );
};

const CategorySpecificDetails = ({ booking, category }) => {
    const catKey = category?.toUpperCase();
    const config = SERVICE_CATEGORIES[catKey];
    const Icon = config.icon;

    let detailText = '';

    if (booking?.table) {
        detailText = booking.table === true ? 'Tavolo' : booking.table;
    } else {
        let entryText = 'Solo Ingresso';
        const pType = booking?.pricingConfiguration?.pricingType;
        if (pType === 'FEMALE') entryText = 'Ingresso Donna';
        else if (pType === 'MALE') entryText = 'Ingresso Uomo';
        else if (pType === 'STANDARD') entryText = 'Ingresso Lista';
        detailText = `${booking?.numberOfPeople ?? booking?.guests ?? 0} Pax • ${entryText}`;
    }

    return (
        <div className="flex items-start gap-1.5 text-xs md:text-sm text-slate-400 font-medium flex-wrap min-w-0">
            <Icon size={12} className="shrink-0 w-3 h-3 mt-[1px]" /> <span className="whitespace-normal break-words">{detailText}</span>
        </div>
    );
};

const StatsSummary = ({ activeCategory, revenue, count }) => {
    const label = SERVICE_CATEGORIES[activeCategory?.toUpperCase()]?.label || 'Attività';
    const formattedRevenue = new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(revenue || 0);
    const [intPart, decimalPart] = formattedRevenue.replace('€', '').trim().split(',');

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
            <div className={`md:col-span-1 bg-[${HOGU_COLORS.dark}] rounded-[2rem] p-5 text-white relative overflow-hidden shadow-xl shadow-slate-900/10 group`}>
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform duration-500"><Wallet size={100} /></div>
                <div className="relative z-10">
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Fatturato {label}</p>
                    <h3 className="text-xl sm:text-2xl font-extrabold mb-3">€ {intPart}<span className="text-slate-500 text-lg">,{decimalPart || '00'}</span></h3>
                </div>
            </div>
            <div className={`bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col justify-center relative overflow-hidden group hover:border-[${HOGU_COLORS.primary}]/30 hover:shadow-lg transition-all`}>
                <div className={`absolute -right-4 -bottom-4 text-slate-50 opacity-50 group-hover:text-[${HOGU_COLORS.primary}]/10 transition-colors`}><Activity size={100} /></div>
                <div className="flex items-center gap-2 text-slate-400 mb-2">
                    <Activity size={18} /> <span className="text-xs font-bold uppercase">Prenotazioni</span>
                </div>
                <span className={`text-2xl sm:text-3xl font-black text-slate-800 group-hover:text-[${HOGU_COLORS.primary}] transition-colors`}>{count || 0}</span>
                <p className="text-xs text-slate-400 mt-1.5 font-medium">Totali registrate</p>
            </div>
        </div>
    );
};

const TodayEventCard = ({ event, onValidate }) => {
    const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&q=80&w=600';
    const title = event.label || event.name || "Evento";

    let displayTime = event.time;
    if (!displayTime && event.startTime) {
        const dateObj = new Date(event.startTime);
        displayTime = dateObj.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
    } else if (!displayTime) {
        displayTime = "--:--";
    }

    let imageUrl = DEFAULT_IMAGE;
    if (event.image) {
        imageUrl = event.image;
    } else if (event.images && event.images.length > 0) {
        const imgName = event.images[0];
        const ENV_URL = import.meta.env.VITE_API_BASE_URL;
        const DYNAMIC_URL = `${window.location.protocol}//${window.location.hostname}:8080`;
        const API_BASE_URL =
            ENV_URL && ENV_URL.includes('localhost') && window.location.hostname !== 'localhost'
                ? DYNAMIC_URL
                : (ENV_URL || DYNAMIC_URL);
        imageUrl = imgName.startsWith('http') ? imgName : `${API_BASE_URL}/uploads/${imgName}`;
    }

    return (
        <div className="group bg-white/10 border border-white/10 hover:bg-white/20 p-5 rounded-3xl backdrop-blur-md transition-all flex flex-col justify-between h-full relative overflow-hidden min-h-[180px]">
            <div className="absolute inset-0 z-0 bg-slate-800">
                <SafeImage
                    src={imageUrl}
                    alt={title}
                    className="w-full h-full object-cover opacity-60 group-hover:scale-110 transition-transform duration-700"
                    loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent"></div>
            </div>

            <div className="relative z-10">
                <div className="flex justify-between items-start mb-3">
                    <h4 className="font-bold text-white text-lg leading-tight drop-shadow-md pr-2 truncate">
                        {title}
                    </h4>
                    <span className="bg-black/40 text-white border border-white/20 text-xs font-bold px-2 py-0.5 rounded-lg backdrop-blur-sm shrink-0">
                        {displayTime}
                    </span>
                </div>
            </div>

            <button
                onClick={() => onValidate(event.id)}
                className={`relative z-10 w-full bg-white text-[${HOGU_COLORS.dark}] hover:bg-[${HOGU_COLORS.primary}] hover:text-white py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95 mt-auto`}
            >
                <ScanLine size={18} /> Scanner Ingresso
            </button>
        </div>
    );
};

// =================================================================================
// COMPONENTI MOBILE DEDICATI — BOTTOM SHEET ELEGANTE
// =================================================================================

const MobileStickyTrigger = ({ count, onClick }) => {
    if (!count || count === 0) return null;
    return (
        <div className="fixed bottom-4 left-3 right-3 z-40 md:hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
            <button
                onClick={onClick}
                className={`w-full bg-[${HOGU_COLORS.dark}] text-white p-3 rounded-xl shadow-2xl shadow-slate-900/40 flex items-center justify-between border border-slate-700/50 backdrop-blur-md active:scale-95 transition-transform`}
            >
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <div className="bg-amber-500 rounded-xl p-2 text-white animate-pulse">
                            <BellRing size={20} fill="currentColor" />
                        </div>
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-3 h-3 flex items-center justify-center rounded-full border-2 border-[#1a1a1a] shadow-sm">
                        </span>
                    </div>
                    <div className="text-left">
                        <h4 className="font-bold text-sm">Hai delle richieste</h4>
                        <p className="text-xs text-slate-400">Gestisci tavoli e liste</p>
                    </div>
                </div>
                <div className="bg-white/10 p-2 rounded-full">
                    <ChevronUp size={18} />
                </div>
            </button>
        </div>
    );
};

// Card compatta ottimizzata per il bottom sheet mobile
const MobilePendingCard = ({ booking, onAccept, onReject, onOpenDetails, activeCategory, clubId }) => {
    const isWaitingCustomer = booking.status === 'waiting_customer';
    const customerName = booking.bookingFullName ?? booking.customerName;
    const serviceName = booking.eventName ?? booking.serviceName;
    const price = booking.totalAmount ?? booking.price;
    const dateObj = booking.reservationTime ? new Date(booking.reservationTime) : undefined;
    const dateStr = dateObj ? dateObj.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit' }) : (booking.date ?? '');
    const timeStr = dateObj ? dateObj.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }) : (booking.time ?? '');
    const imageUrl = booking.image ?? (Array.isArray(booking.eventImages) && booking.eventImages.length > 0
        ? (booking.eventImages[0].startsWith('http') ? booking.eventImages[0] : (clubId && booking.eventId ? `/files/club/${clubId}/event/${booking.eventId}/${booking.eventImages[0]}` : `/files/${booking.eventImages[0]}`))
        : '');

    return (
        <div className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all active:scale-[0.99]
            ${isWaitingCustomer ? 'border-blue-100' : 'border-slate-100'}`}
        >
            {/* Accent bar top */}
            <div className={`h-0.5 w-full ${isWaitingCustomer ? 'bg-blue-400' : 'bg-gradient-to-r from-amber-400 to-orange-400'}`} />

            <div className="p-3">
                {/* Header row */}
                <div className="flex items-center gap-3 mb-2.5">
                    {/* Avatar / immagine evento */}
                    <div className="relative shrink-0">
                        <SafeImage
                            src={imageUrl}
                            alt=""
                            className="w-11 h-11 rounded-xl object-cover ring-2 ring-white shadow-sm"
                            loading="lazy"
                        />
                        {!isWaitingCustomer && (
                            <span className="absolute -top-1 -right-1 bg-amber-400 text-white text-[8px] font-black px-1 py-px rounded-full border border-white leading-none">
                                NEW
                            </span>
                        )}
                    </div>

                    {/* Info principale */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-1">
                            <h4 className="font-bold text-slate-800 text-sm leading-tight truncate">{customerName}</h4>
                            <span className={`font-extrabold text-sm shrink-0 ml-1 ${isWaitingCustomer ? 'text-blue-600' : `text-[${HOGU_COLORS.dark}]`}`}>
                                € {formatPrice(price)}
                            </span>
                        </div>
                        <p className={`text-[11px] font-semibold truncate mt-0.5 text-[${HOGU_COLORS.primary}]`}>{serviceName}</p>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="flex items-center gap-1 text-[10px] text-slate-400 font-medium">
                                <Calendar size={10} className="shrink-0" /> {dateStr}
                            </span>
                            <span className="text-slate-200">•</span>
                            <span className="flex items-center gap-1 text-[10px] text-slate-400 font-medium">
                                <Clock size={10} className="shrink-0" /> {timeStr}
                            </span>
                            <span className="text-slate-200">•</span>
                            <CategorySpecificDetails booking={booking} category={activeCategory} />
                        </div>
                    </div>
                </div>

                {/* Azioni */}
                {isWaitingCustomer ? (
                    <div className="w-full bg-blue-50 text-blue-500 py-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 border border-blue-100">
                        <Clock size={12} className="animate-pulse" /> In attesa del cliente...
                    </div>
                ) : (
                    <div className="flex gap-2">
                        <button
                            onClick={() => onAccept(booking.id)}
                            className={`flex-1 bg-[${HOGU_COLORS.primary}] text-white py-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all shadow-sm`}
                        >
                            <CheckCircle size={12} /> Accetta
                        </button>
                        <button
                            onClick={() => onReject(booking)}
                            className="flex-1 py-2 bg-red-50 text-red-500 border border-red-100 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all"
                        >
                            <Ban size={12} /> Annulla
                        </button>
                        <button
                            onClick={() => onOpenDetails(booking)}
                            className="w-9 h-8 bg-slate-50 text-slate-500 border border-slate-100 rounded-xl font-bold text-xs flex items-center justify-center active:scale-95 transition-all shrink-0"
                        >
                            <Eye size={14} />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

// Bottom Sheet mobile elegante — non occupa tutta la pagina
const MobilePendingBottomSheet = ({ isOpen, onClose, pendingList, onAccept, onReject, onRectify, onOpenDetails, clubId, currentPage, totalPages, onNext, onPrev }) => {
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

    // Swipe down per chiudere
    const handleTouchStart = (e) => { startY.current = e.touches[0].clientY; };
    const handleTouchEnd = (e) => {
        if (startY.current === null) return;
        const deltaY = e.changedTouches[0].clientY - startY.current;
        if (deltaY > 60) onClose();
        startY.current = null;
    };

    return createPortal(
        <>
            {/* Overlay scuro */}
            <div
                className={`fixed inset-0 z-[90] bg-black/40 backdrop-blur-[2px] md:hidden transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={onClose}
            />

            {/* Bottom Sheet */}
            <div
                ref={sheetRef}
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
                className={`fixed bottom-0 left-0 right-0 z-[100] md:hidden bg-[#f8f9fc] rounded-t-[2rem] shadow-2xl shadow-black/30
                    transition-transform duration-300 ease-out flex flex-col
                    ${isOpen ? 'translate-y-0' : 'translate-y-full'}`}
                style={{ maxHeight: '82vh' }}
            >
                {/* Handle di drag */}
                <div className="flex justify-center pt-3 pb-1 shrink-0 cursor-grab active:cursor-grabbing">
                    <div className="w-10 h-1 bg-slate-300 rounded-full" />
                </div>

                {/* Header compatto */}
                <div className="px-4 pt-2 pb-3 shrink-0">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                            <div className="bg-amber-50 border border-amber-100 p-2 rounded-xl">
                                <BellRing size={16} className="text-amber-500" />
                            </div>
                            <div>
                                <h2 className="text-base font-extrabold text-slate-800 leading-tight">
                                    Richieste Urgenti
                                </h2>
                                <p className="text-xs text-slate-400 font-medium">
                                    {pendingList.length} {pendingList.length === 1 ? 'prenotazione' : 'prenotazioni'} in attesa
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

                {/* Divisore */}
                <div className="h-px bg-slate-200 mx-4 shrink-0" />

                {/* Lista scrollabile */}
                <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2.5">
                    {pendingList && pendingList.length > 0 ? (
                        pendingList.map(b => (
                            <MobilePendingCard
                                key={b.id}
                                booking={b}
                                activeCategory="club"
                                clubId={clubId}
                                onAccept={(id) => {
                                    onAccept(id);
                                    if (pendingList.length === 1) onClose();
                                }}
                                onReject={onReject}
                                onOpenDetails={onOpenDetails}
                            />
                        ))
                    ) : (
                        <div className="py-10 flex flex-col items-center justify-center text-center">
                            <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mb-3">
                                <CheckCircle size={28} className="text-emerald-500" />
                            </div>
                            <p className="font-bold text-slate-700 text-sm">Tutto a posto!</p>
                            <p className="text-xs text-slate-400 mt-1">Nessuna richiesta in sospeso.</p>
                            <button
                                onClick={onClose}
                                className="mt-4 text-sm font-bold text-emerald-600 bg-emerald-50 px-5 py-2.5 rounded-xl active:scale-95 transition-transform"
                            >
                                Chiudi
                            </button>
                        </div>
                    )}
                    {/* Spazio extra in fondo per non tagliare l'ultimo elemento */}
                    <div className="h-2" />
                </div>
            </div>
        </>,
        document.body
    );
};

// --- CARDS DESKTOP ---

const PendingRequestCard = ({ booking, onAccept, onReject, onRectify, onOpenDetails, activeCategory, clubId }) => {
    const isWaitingCustomer = booking.status === 'waiting_customer';
    const customerName = booking.bookingFullName ?? booking.customerName;
    const serviceName = booking.eventName ?? booking.serviceName;
    const price = booking.totalAmount ?? booking.price;
    const dateObj = booking.reservationTime ? new Date(booking.reservationTime) : undefined;
    const dateStr = dateObj ? dateObj.toLocaleDateString('it-IT') : (booking.date ?? '');
    const timeStr = dateObj ? dateObj.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }) : (booking.time ?? '');
    const imageUrl = booking.image ?? (Array.isArray(booking.eventImages) && booking.eventImages.length > 0
        ? (booking.eventImages[0].startsWith('http') ? booking.eventImages[0] : (clubId && booking.eventId ? `/files/club/${clubId}/event/${booking.eventId}/${booking.eventImages[0]}` : `/files/${booking.eventImages[0]}`))
        : '');
    return (
        <div className={`group bg-white rounded-3xl px-2 pt-2 pb-1 md:px-3 md:pt-3 md:pb-1.5 border shadow-[0_2px_15px_-3px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_25px_-5px_rgba(104,180,155,0.15)] transition-all duration-300 flex flex-col relative overflow-hidden 
        ${isWaitingCustomer ? 'border-blue-100 bg-blue-50/30' : `border-slate-100 hover:border-[${HOGU_COLORS.primary}]/30`}`}>
            <div className={`absolute left-0 top-0 bottom-0 w-1 opacity-80 ${isWaitingCustomer ? 'bg-blue-400' : 'bg-gradient-to-b from-amber-300 to-amber-500'}`}></div>
            <div className="flex items-start justify-between gap-1.5 md:gap-2 mb-1.5 pl-1 flex-wrap">
                <div className="flex gap-1.5 md:gap-2 flex-1 min-w-0">
                    <div className="relative shrink-0">
                        <SafeImage src={imageUrl} alt="" className="w-10 h-10 md:w-12 md:h-12 rounded-2xl object-cover shadow-sm ring-2 ring-white" loading="lazy" />
                        {!isWaitingCustomer && (<div className="absolute -bottom-2 -right-1 bg-amber-400 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full border-2 border-white shadow-sm tracking-wide">NEW</div>)}
                    </div>
                    <div className="min-w-0">
                        <h4 className={`font-bold text-[${HOGU_COLORS.dark}] text-sm md:text-base leading-[1.05] md:leading-[1.1] mb-0 truncate`}>{customerName}</h4>
                        <p className={`text-xs text-[${HOGU_COLORS.primary}] font-bold uppercase tracking-wide mb-0.5 truncate`}>{serviceName}</p>
                        <CategorySpecificDetails booking={booking} category={activeCategory} />
                    </div>
                </div>
                <div className="text-left md:text-right shrink-0 mt-2 md:mt-0 w-full md:w-auto order-2 md:order-none">
                    <span className={`block font-extrabold text-sm md:text-base ${isWaitingCustomer ? 'text-blue-600' : `text-[${HOGU_COLORS.dark}]`}`}>€ {formatPrice(price)}</span>
                    {booking.oldPrice && <span className="text-xs text-slate-400 line-through">€ {formatPrice(booking.oldPrice)}</span>}
                </div>
            </div>
            <div className="grid grid-cols-2 gap-2 mb-1 pl-1">
                <div className="bg-slate-50 p-1.5 rounded-xl border border-slate-100">
                    <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block mb-0.5">Data</span>
                    <div className="flex items-center justify-center text-center gap-1 text-slate-700 font-bold text-[10px] sm:text-sm w-full">
                        <Calendar size={12} className={`text-[${HOGU_COLORS.primary}]`} />{dateStr}
                    </div>
                </div>
                <div className="bg-slate-50 p-1.5 rounded-xl border border-slate-100">
                    <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block mb-0.5">Ora</span>
                    <div className="flex items-center justify-center text-center gap-1 text-slate-700 font-bold text-[10px] sm:text-sm w-full">
                        <Clock size={12} className={`text-[${HOGU_COLORS.primary}]`} />{timeStr}
                    </div>
                </div>
            </div>
            <div className="pl-1 mt-1">
                {isWaitingCustomer ? (
                    <div className="w-full bg-blue-100 text-blue-600 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 border border-blue-200"><Clock size={14} className="animate-pulse" /> In attesa del cliente...</div>
                ) : (
                    <div className="flex flex-col sm:flex-row md:flex-col lg:flex-row gap-2">
                        <button onClick={() => onAccept(booking.id)} className={`flex-1 bg-[${HOGU_COLORS.primary}] text-white px-3 py-[6px] rounded-xl font-bold text-xs md:text-sm hover:bg-[${HOGU_COLORS.primaryEmphasis}] shadow-sm hover:shadow-[${HOGU_COLORS.primary}]/20 active:scale-95 transition-all flex items-center justify-center gap-1.5`}><CheckCircle size={13} /> Accetta</button>
                        <button onClick={() => onReject(booking)} className="px-3 py-[6px] bg-rose-50 text-rose-600 border border-rose-100 rounded-xl font-bold text-xs md:text-sm hover:bg-rose-100 transition-all flex items-center justify-center gap-1.5"><Ban size={13} /> Annulla</button>
                        <button onClick={() => onOpenDetails(booking)} className="px-3 py-[6px] bg-slate-50 text-slate-600 border border-slate-200 rounded-xl font-bold text-xs md:text-sm hover:bg-slate-100 transition-all flex items-center justify-center gap-1.5"><Eye size={13} /> Dettagli</button>
                    </div>
                )}
            </div>
        </div>
    );
};

const ProviderBookingCard = ({ booking, onOpenDetails, onOpenComplaint, onCancelBooking, activeCategory, clubId }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef(null);
    useEffect(() => {
        const handleClickOutside = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setIsMenuOpen(false); };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);
    const isCancelled = booking.status === 'cancelled';
    const customerName = booking.bookingFullName ?? booking.customerName;
    const serviceName = booking.eventName ?? booking.serviceName;
    const price = booking.totalAmount ?? booking.price;
    const dateObj = booking.reservationTime ? new Date(booking.reservationTime) : undefined;
    const dateStr = dateObj ? dateObj.toLocaleDateString('it-IT') : (booking.date ?? '');
    const timeStr = dateObj ? dateObj.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }) : (booking.time ?? '');
    const imageUrl = booking.image ?? (Array.isArray(booking.eventImages) && booking.eventImages.length > 0
        ? (booking.eventImages[0].startsWith('http') ? booking.eventImages[0] : (clubId && booking.eventId ? `/files/club/${clubId}/event/${booking.eventId}/${booking.eventImages[0]}` : `/files/${booking.eventImages[0]}`))
        : '');
    return (
        <div className={`rounded-3xl border p-3 md:p-5 flex flex-col sm:flex-row gap-6 transition-all duration-300 relative group
            ${isCancelled ? 'bg-red-50 border-red-200' : `bg-white border-slate-100 hover:border-[${HOGU_COLORS.primary}]/30 hover:shadow-lg hover:shadow-slate-200/50`}`}>
            <div className={`w-16 h-16 md:w-20 md:h-20 rounded-2xl overflow-hidden shrink-0 shadow-sm ring-1 ${isCancelled ? 'ring-red-100 grayscale' : 'ring-slate-100'}`}>
                <SafeImage src={imageUrl} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
            </div>
            <div className="flex-1 flex flex-col justify-between">
                <div className="flex justify-between items-start mb-2 gap-3 md:gap-4 flex-wrap">
                    <div className="min-w-0 flex-1">
                        <h4 className={`font-bold text-base md:text-lg ${isCancelled ? 'text-red-700 line-through decoration-red-400' : `text-[${HOGU_COLORS.dark}]`} whitespace-normal break-words`}>{customerName}</h4>
                        <p className={`text-xs font-medium uppercase tracking-wide ${isCancelled ? 'text-red-400' : 'text-slate-500'} whitespace-normal break-words`}>{serviceName}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <StatusBadge status={booking.status} />
                        <button onClick={() => onOpenDetails(booking)} className={`w-8 h-8 flex items-center justify-center rounded-full transition-all ml-1 shadow-sm ${isCancelled ? 'bg-red-100 text-red-500 hover:bg-red-200' : `bg-slate-50 text-slate-400 hover:bg-[${HOGU_COLORS.primary}] hover:text-white`}`}><Eye size={16} /></button>
                        {booking.status === 'confirmed' && (
                            <div className="relative" ref={menuRef}>
                                <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"><MoreVertical size={18} /></button>
                                {isMenuOpen && (
                                    <div className="absolute right-0 top-full mt-2 w-48 bg-white shadow-xl shadow-slate-200/60 border border-slate-100 rounded-2xl p-1.5 z-50 animate-in fade-in zoom-in-95 origin-top-right">
                                        <button onClick={() => { setIsMenuOpen(false); onCancelBooking(booking); }} className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-bold hover:bg-rose-50 text-slate-600 hover:text-rose-600 rounded-xl transition-colors"><Ban size={14} /> Annulla Prenotazione</button>
                                        <button onClick={() => { setIsMenuOpen(false); onOpenComplaint(booking); }} className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-bold hover:bg-amber-50 text-slate-600 hover:text-amber-600 rounded-xl transition-colors"><AlertTriangle size={14} /> Segnala Problema</button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
                <div className={`flex items-center justify-between mt-auto pt-3 border-t ${isCancelled ? 'border-red-100' : 'border-slate-50'} flex-wrap gap-2`}>
                    <div className={`flex gap-4 text-xs font-semibold tracking-wide ${isCancelled ? 'text-red-400 opacity-70' : 'text-slate-500'}`}>
                        <span className={`flex items-center gap-1.5 px-2 py-1 rounded-md ${isCancelled ? 'bg-red-100/50' : 'bg-slate-50'}`}><Calendar size={12} className={isCancelled ? "text-red-500" : `text-[${HOGU_COLORS.primary}]`} /> {dateStr}</span>
                        <span className={`flex items-center gap-1.5 px-2 py-1 rounded-md ${isCancelled ? 'bg-red-100/50' : 'bg-slate-50'}`}><Clock size={12} className={isCancelled ? "text-red-500" : `text-[${HOGU_COLORS.primary}]`} /> {timeStr}</span>
                    </div>
                    <span className={`font-extrabold text-base md:text-lg ${isCancelled ? 'text-red-600' : `text-[${HOGU_COLORS.dark}]`} shrink-0 order-2 md:order-none w-full md:w-auto text-left md:text-right`}>€ {formatPrice(price)}</span>
                </div>
            </div>
        </div>
    );
};

// --- MODALS ---

const BookingDetailModal = ({ isOpen, onClose, booking, clubId }) => {
    if (!isOpen || !booking) return null;

    const activeCategory = booking.category || 'club';
    const customerName = booking.bookingFullName ?? booking.customerName;
    const serviceName = booking.eventName ?? booking.serviceName;
    const totalPrice = booking.totalAmount ?? booking.price;
    const dateObj = booking.reservationTime ? new Date(booking.reservationTime) : undefined;
    const dateStr = dateObj ? dateObj.toLocaleDateString('it-IT') : (booking.date ?? '');
    const timeStr = dateObj ? dateObj.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }) : (booking.time ?? '');
    const imageUrl = booking.image ?? (Array.isArray(booking.eventImages) && booking.eventImages.length > 0
        ? (booking.eventImages[0].startsWith('http') ? booking.eventImages[0] : (clubId && booking.eventId ? `/files/club/${clubId}/event/${booking.eventId}/${booking.eventImages[0]}` : `/files/${booking.eventImages[0]}`))
        : '');

    const renderExtraDetails = () => {
        const catKey = activeCategory?.toUpperCase();
        if (catKey === 'CLUB') {
            const isTable = booking.table === true || String(booking.table) === 'true';
            const pType = booking.pricingConfiguration?.pricingType;
            let typeLabel = 'Ingresso';
            if (isTable) typeLabel = 'Tavolo';
            else if (pType === 'FEMALE') typeLabel = 'Ingresso Donna';
            else if (pType === 'MALE') typeLabel = 'Ingresso Uomo';
            else if (pType === 'STANDARD') typeLabel = 'Ingresso Lista';

            return (
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 md:col-span-2">
                    <span className="text-[10px] uppercase text-slate-400 font-bold tracking-wider block mb-1">Dettagli Servizio</span>
                    <div className="font-bold text-slate-700 flex items-center gap-2">
                        <PartyPopper size={14} className="text-slate-400" />
                        {isTable ? typeLabel : `${typeLabel} • ${booking.numberOfPeople ?? booking.guests ?? 0} Persone`}
                    </div>
                </div>
            );
        }
        return null;
    };

    const renderCancellationReason = () => {
        if (booking.status === 'CANCELLED_BY_PROVIDER' && booking.statusReason) {
            return (
                <div className="col-span-2 bg-red-50 p-4 rounded-2xl border border-red-100 mt-2">
                    <span className="text-[10px] uppercase text-red-400 font-bold tracking-wider block mb-1">Motivo Cancellazione</span>
                    <p className="font-bold text-red-700">{booking.statusReason}</p>
                </div>
            );
        }
        return null;
    };

    return (
        <ModalBackdrop onClose={onClose}>
            <div className="flex flex-col md:flex-row gap-8">
                <div className="flex-1">
                    <h3 className={`text-lg font-bold text-[${HOGU_COLORS.dark}] mb-4 flex items-center gap-2`}><ListTodo size={20} className="text-slate-400" /> Dettagli Prenotazione</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                            <span className="text-[10px] uppercase text-slate-400 font-bold tracking-wider block mb-1">Cliente</span>
                            <div className="flex items-center gap-2 font-bold text-slate-700 text-sm">
                                <User size={14} className={`text-[${HOGU_COLORS.primary}]`} />
                                <span className="truncate">{customerName || 'Cliente'}</span>
                            </div>
                        </div>
                        <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                            <span className="text-[10px] uppercase text-slate-400 font-bold tracking-wider block mb-1">Stato</span>
                            <StatusBadge status={booking.status} />
                        </div>
                        <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                            <span className="text-[10px] uppercase text-slate-400 font-bold tracking-wider block mb-1">Prezzo Totale</span>
                            <div className={`font-bold text-lg text-[${HOGU_COLORS.dark}]`}>€ {formatPrice(totalPrice)}</div>
                        </div>
                        <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                            <span className="text-[10px] uppercase text-slate-400 font-bold tracking-wider block mb-1">Data</span>
                            <div className="flex items-center gap-2 font-bold text-slate-700"><Calendar size={14} className={`text-[${HOGU_COLORS.primary}]`} /> {dateStr}</div>
                        </div>
                        <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                            <span className="text-[10px] uppercase text-slate-400 font-bold tracking-wider block mb-1">Orario</span>
                            <div className="flex items-center gap-2 font-bold text-slate-700"><Clock size={14} className={`text-[${HOGU_COLORS.primary}]`} /> {timeStr}</div>
                        </div>
                        {renderExtraDetails()}
                        {renderCancellationReason()}
                    </div>

                    <div className="flex gap-3 mt-auto">
                        <button onClick={onClose} className="flex-1 py-3.5 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-colors">Chiudi</button>
                    </div>
                </div>
            </div>
        </ModalBackdrop>
    );
};

const ComplaintModal = ({ isOpen, onClose, onConfirm, booking }) => {
    const [reason, setReason] = useState("");
    useEffect(() => { if (isOpen) setReason(""); }, [isOpen]);
    if (!isOpen) return null;
    return (
        <ModalBackdrop onClose={onClose}>
            <div className="max-w-sm mx-auto">
                <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-500 mb-4 mx-auto"><AlertTriangle size={24} /></div>
                <h2 className={`font-bold text-xl text-[${HOGU_COLORS.dark}] mb-2 md:text-center text-left`}>Segnala Problema</h2>
                <textarea className="w-full border border-slate-200 p-4 rounded-xl mb-6 bg-slate-50 focus:ring-2 focus:ring-amber-100 outline-none transition-all text-sm" rows="3" placeholder="Dettagli segnalazione..." value={reason} onChange={e => setReason(e.target.value)} />
                <button onClick={() => onConfirm(booking.id, reason)} disabled={!reason.trim()} className="w-full bg-amber-500 text-white py-3 rounded-xl font-bold text-sm hover:bg-amber-600 transition-all">Invia Segnalazione</button>
            </div>
        </ModalBackdrop>
    );
};

const CancellationModal = ({ isOpen, onClose, onConfirm, booking }) => {
    const [reason, setReason] = useState("");
    if (!isOpen) return null;
    return (
        <ModalBackdrop onClose={onClose}>
            <div className="max-w-sm mx-auto">
                <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center text-red-500 mb-4 mx-auto"><Ban size={24} /></div>
                <h2 className={`font-bold text-xl text-[${HOGU_COLORS.dark}] mb-2 md:text-center text-left`}>Annulla Prenotazione</h2>
                <textarea className="w-full border border-slate-200 p-4 rounded-xl mb-6 bg-slate-50 focus:ring-2 focus:ring-red-100 outline-none transition-all text-sm" rows="3" placeholder="Motivo..." value={reason} onChange={e => setReason(e.target.value)} />
                <div className="flex gap-3">
                    <button onClick={onClose} className="flex-1 bg-slate-100 text-slate-600 py-3 rounded-xl font-bold text-sm">Indietro</button>
                    <button
                        onClick={() => onConfirm(booking.id, reason)}
                        disabled={!reason.trim()}
                        className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${!reason.trim() ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-red-500 text-white hover:bg-red-600'}`}
                    >
                        Conferma
                    </button>
                </div>
            </div>
        </ModalBackdrop>
    );
};

const PriceCorrectionModal = ({ isOpen, onClose, onConfirm, booking }) => {
    const [newPrice, setNewPrice] = useState("");
    const [note, setNote] = useState("");
    useEffect(() => {
        if (isOpen && booking) {
            const formatted = booking.price !== undefined && booking.price !== null
                ? Number(booking.price).toFixed(2).replace('.', ',')
                : "";
            setNewPrice(formatted);
            setNote("");
        }
    }, [isOpen, booking]);
    if (!isOpen || !booking) return null;
    return (
        <ModalBackdrop onClose={onClose}>
            <div className="max-w-sm mx-auto">
                <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-500 mb-4 mx-auto"><RefreshCw size={24} /></div>
                <h2 className={`font-bold text-xl text-[${HOGU_COLORS.dark}] mb-2 md:text-center text-left`}>Rettifica Prezzo</h2>
                <div className="mb-4">
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Nuovo Prezzo (€)</label>
                    <CurrencyInput
                        name="newPrice"
                        placeholder="0,00"
                        decimalsLimit={2}
                        decimalScale={2}
                        prefix="€ "
                        decimalSeparator=","
                        groupSeparator="."
                        onValueChange={(value) => setNewPrice(value)}
                        value={newPrice}
                        className="w-full border border-slate-200 p-4 rounded-xl bg-slate-50 focus:ring-2 focus:ring-amber-100 outline-none font-bold text-slate-800"
                    />
                </div>
                <div className="mb-6">
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Note</label>
                    <textarea className="w-full border border-slate-200 p-4 rounded-xl bg-slate-50 focus:ring-2 focus:ring-amber-100 outline-none text-sm" rows="3" value={note} onChange={e => setNote(e.target.value)} />
                </div>
                <div className="flex gap-3">
                    <button onClick={onClose} className="flex-1 bg-slate-100 text-slate-600 py-3 rounded-xl font-bold text-sm">Annulla</button>
                    <button onClick={() => onConfirm(booking.id, newPrice, note)} className="flex-1 bg-amber-500 text-white py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2"><Send size={16} /> Invia</button>
                </div>
            </div>
        </ModalBackdrop>
    );
};

// =================================================================================
// 3. MAIN DASHBOARD COMPONENT (CLUB Dashboard)
// =================================================================================

const ClubDashboard = () => {
    const navigate = useNavigate();

    // --- STATI API ---
    const [clubId, setClubId] = useState(null);
    const [stats, setStats] = useState({ revenue: 0, count: 0 });
    const [clubInfo, setClubInfo] = useState({ name: '', description: '' });
    const [isLoading, setIsLoading] = useState(true);
    const [isPageLoading, setIsPageLoading] = useState(false);

    // --- LISTE DATI ---
    const [pendingList, setPendingList] = useState([]);
    const [todayEvents, setTodayEvents] = useState([]);
    const [modalEvents, setModalEvents] = useState([]);
    const [historyList, setHistoryList] = useState([]);

    // --- PAGINAZIONE ---
    const [pendingPage, setPendingPage] = useState(1);
    const [eventsPage, setEventsPage] = useState(1);
    const [historyPage, setHistoryPage] = useState(1);
    const [modalEventsPage, setModalEventsPage] = useState(1);

    // --- TOTALI PAGINE (da API) ---
    const [totalPagesPending, setTotalPagesPending] = useState(0);
    const [totalPagesEvents, setTotalPagesEvents] = useState(0);
    const [totalPagesHistory, setTotalPagesHistory] = useState(0);
    const [totalPagesModal, setTotalPagesModal] = useState(0);

    const [isMobileOverlayOpen, setIsMobileOverlayOpen] = useState(false);
    const [isLoadingModalEvents, setIsLoadingModalEvents] = useState(false);

    // Configurazione elementi per pagina
    const ITEMS_PER_PAGE_PENDING = 3;
    const ITEMS_PER_PAGE_EVENTS = 4;
    const ITEMS_PER_PAGE_HISTORY = 5;
    const ITEMS_PER_MODAL_PAGE = 3;

    // --- FILTRI ---
    const [filter, setFilter] = useState('active');

    // --- MODALI & UI ---
    const [detailsOpen, setDetailsOpen] = useState(false);
    const [complaintOpen, setComplaintOpen] = useState(false);
    const [cancelOpen, setCancelOpen] = useState(false);
    const [correctionOpen, setCorrectionOpen] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState(null);

    const [isGlobalLoading, setIsGlobalLoading] = useState(false);
    const [successModal, setSuccessModal] = useState({ isOpen: false, title: '', message: '' });
    const [errorModal, setErrorModal] = useState({ isOpen: false, message: '', details: null });

    const [eventActionMenuOpen, setEventActionMenuOpen] = useState(false);
    const [eventSelectionOpen, setEventSelectionOpen] = useState(false);
    const [isMobileDevice, setIsMobileDevice] = useState(false);

    const actionMenuRef = useRef(null);
    const mobileMenuRef = useRef(null);

    const lastEventsParams = useRef({ clubId: null, page: null });
    const lastBookingsParams = useRef({ clubId: null, pPage: null, hPage: null, filter: null });

    useEffect(() => {
        const mql = window.matchMedia('(max-width: 767px)');
        const handler = (e) => setIsMobileDevice(e.matches);
        setIsMobileDevice(mql.matches);
        mql.addEventListener('change', handler);
        return () => mql.removeEventListener('change', handler);
    }, []);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (eventActionMenuOpen) {
                const isOutsideDesktop = actionMenuRef.current && !actionMenuRef.current.contains(event.target);
                const isOutsideMobile = mobileMenuRef.current && !mobileMenuRef.current.contains(event.target);
                if (isOutsideDesktop && isOutsideMobile) {
                    setEventActionMenuOpen(false);
                }
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [eventActionMenuOpen]);

    // =================================================================================
    // API CALLS & EFFECTS
    // =================================================================================

    const fetchTodayEvents = useCallback(async (currentClubId, page, force = false) => {
        if (!currentClubId) return;
        if (!force && lastEventsParams.current.clubId === currentClubId && lastEventsParams.current.page === page) return;

        setIsPageLoading(true);
        try {
            const data = await clubService.getEventsToday(currentClubId, page - 1, ITEMS_PER_PAGE_EVENTS);
            const fixedEvents = data.content.map(ev => {
                const startTime = ev.startTime || ev.time;
                let displayTime = "--:--";
                if (startTime) {
                    const d = new Date(startTime);
                    displayTime = d.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
                }
                let imgUrl = 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&q=80&w=600';
                if (ev.eventImages && ev.eventImages.length > 0) {
                    const filename = ev.eventImages[0];
                    imgUrl = filename.startsWith('http') ? filename : `/files/club/${currentClubId}/event/${ev.id}/${filename}`;
                } else if (ev.images && ev.images.length > 0) {
                    const filename = ev.images[0];
                    imgUrl = filename.startsWith('http') ? filename : `/files/club/${currentClubId}/event/${ev.id}/${filename}`;
                }
                return {
                    id: ev.id,
                    label: ev.name || ev.label || "Evento",
                    time: displayTime,
                    image: imgUrl,
                    totalBookings: ev.totalBookings || 0,
                    checkedIn: ev.checkedIn || 0
                };
            });
            setTodayEvents(fixedEvents);
            setTotalPagesEvents(data.totalPages);
            lastEventsParams.current = { clubId: currentClubId, page };
        } catch (error) {
            console.error("Errore eventi oggi", error);
        } finally {
            setIsPageLoading(false);
        }
    }, []);

    const fetchBookings = useCallback(async (currentClubId, pPage, hPage, currentFilter, force = false) => {
        if (!currentClubId) return;
        const last = lastBookingsParams.current;
        if (!force && last.clubId === currentClubId && last.pPage === pPage && last.hPage === hPage && last.filter === currentFilter) return;

        setIsPageLoading(true);
        try {
            const pendingRes = await clubService.getBookingsPending(currentClubId, pPage - 1, ITEMS_PER_PAGE_PENDING);
            setPendingList(pendingRes.content);
            setTotalPagesPending(pendingRes.totalPages);

            let historyRes;
            if (currentFilter === 'active') {
                historyRes = await clubService.getBookings(currentClubId, hPage - 1, ITEMS_PER_PAGE_HISTORY);
            } else {
                historyRes = await clubService.getBookingsHistory(currentClubId, hPage - 1, ITEMS_PER_PAGE_HISTORY);
            }

            setHistoryList(historyRes.content);
            setTotalPagesHistory(historyRes.totalPages);
            lastBookingsParams.current = { clubId: currentClubId, pPage, hPage, filter: currentFilter };
        } catch (error) {
            console.error("Errore bookings", error);
        } finally {
            setIsPageLoading(false);
        }
    }, []);

    useEffect(() => {
        const initDashboard = async () => {
            setIsLoading(true);
            try {
                const info = await clubService.getInfo();
                if (info) {
                    setClubId(info.clubId);
                    setStats({ revenue: info.totalBookingsAmount, count: info.totalBookings });
                    setClubInfo({ name: info.name, description: info.description });
                    await Promise.all([
                        fetchTodayEvents(info.clubId, eventsPage),
                        fetchBookings(info.clubId, pendingPage, historyPage, filter)
                    ]);
                }
            } catch (error) {
                console.error("Errore inizializzazione dashboard", error);
            } finally {
                setTimeout(() => setIsLoading(false), 500);
            }
        };
        initDashboard();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (!isLoading && clubId) fetchTodayEvents(clubId, eventsPage);
    }, [clubId, eventsPage, isLoading, fetchTodayEvents]);

    useEffect(() => {
        if (!isLoading && clubId) fetchBookings(clubId, pendingPage, historyPage, filter);
    }, [clubId, pendingPage, historyPage, filter, isLoading, fetchBookings]);

    useEffect(() => {
        if (!clubId || !eventSelectionOpen) return;

        const fetchAllEvents = async () => {
            setIsLoadingModalEvents(true);
            try {
                const data = await clubService.getAllEvents(clubId, modalEventsPage - 1, ITEMS_PER_MODAL_PAGE);
                const mappedContent = data.content.map(ev => {
                    let displayTime = "--:--";
                    if (ev.startTime) {
                        const d = new Date(ev.startTime);
                        const dateStr = d.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' });
                        const timeStr = d.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
                        displayTime = `${dateStr} • ${timeStr}`;
                    }
                    let imgUrl = 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&q=80&w=600';
                    if (ev.images && ev.images.length > 0) {
                        const filename = ev.images[0];
                        imgUrl = filename.startsWith('http') ? filename : `/files/club/${clubId}/event/${ev.id}/${filename}`;
                    } else if (ev.image) {
                        imgUrl = ev.image;
                    }
                    return { id: ev.id, label: ev.name || ev.label || "Evento", time: displayTime, image: imgUrl };
                });
                setModalEvents(mappedContent);
                setTotalPagesModal(data.totalPages);
            } catch (error) {
                console.error("Errore tutti eventi", error);
            } finally {
                setIsLoadingModalEvents(false);
            }
        };
        fetchAllEvents();
    }, [clubId, modalEventsPage, eventSelectionOpen]);

    const handleAccept = async (id) => {
        setIsGlobalLoading(true);
        try {
            await clubService.acceptBooking(id);
            await fetchBookings(clubId, pendingPage, historyPage, filter, true);
            setSuccessModal({ isOpen: true, title: 'Prenotazione Accettata', message: 'La prenotazione è stata confermata e il pagamento è stato processato con successo.' });
        } catch (error) {
            console.error("Errore accettazione:", error);
            setErrorModal({ isOpen: true, message: "Impossibile accettare la prenotazione", details: error.message || "Errore durante la conferma del pagamento." });
        } finally {
            setIsGlobalLoading(false);
        }
    };

    const handleReject = (bk) => { setSelectedBooking(bk); setCancelOpen(true); };
    const handleRectify = (bk) => { setSelectedBooking(bk); setCorrectionOpen(true); };

    const confirmCancel = async (id, reason) => {
        setCancelOpen(false);
        setIsGlobalLoading(true);
        try {
            await clubService.cancelBooking(id, reason);
            await fetchBookings(clubId, pendingPage, historyPage, filter, true);
            setSuccessModal({ isOpen: true, title: 'Prenotazione Annullata', message: `La prenotazione è stata cancellata con successo e il rimborso di € ${formatPrice(selectedBooking?.totalAmount ?? selectedBooking?.price ?? 0)} è stato avviato.` });
        } catch (error) {
            console.error("Errore cancellazione:", error);
            setErrorModal({ isOpen: true, message: "Errore durante la cancellazione della prenotazione", details: error.message || "Si è verificato un errore imprevisto." });
        } finally {
            setIsGlobalLoading(false);
        }
    };

    const confirmComplaint = async () => {
        alert("Segnalazione inviata");
        setComplaintOpen(false);
    };

    const confirmCorrection = async (id, price, note) => {
        setCorrectionOpen(false);
        fetchBookings(clubId, pendingPage, historyPage, filter, true);
    };

    const handleFilterChange = (newFilter) => { setFilter(newFilter); setHistoryPage(1); };

    const handleEventAction = (action) => {
        const mql = typeof window !== 'undefined' ? window.matchMedia('(max-width: 767px)') : null;
        const isMobile = mql ? mql.matches : false;
        if (action === 'create') {
            setEventActionMenuOpen(false);
            navigate('/provider/edit/club/event');
        } else if (action === 'edit') {
            setEventSelectionOpen(true);
            if (modalEventsPage !== 1) setModalEventsPage(1);
            if (!isMobile) setEventActionMenuOpen(false);
        }
    };

    const handleSelectEventToEdit = (eventId) => {
        setEventSelectionOpen(false);
        navigate(`/provider/edit/club/event/${eventId}`);
    };

    const isDefaultInfo = clubInfo.name === "Registrazione in corso..." || clubInfo.description === "Descrizione del servizio in aggiornamento.";

    return (
        <div className="px-4 sm:px-6 space-y-6 md:space-y-10 animate-in fade-in pb-20 md:pb-12 relative max-w-full">
            {isDefaultInfo && (
                <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded-xl shadow-sm mb-6 animate-in slide-in-from-top-4 duration-500">
                    <div className="flex items-center gap-3">
                        <AlertTriangle className="text-amber-500 shrink-0" size={24} />
                        <div>
                            <h3 className="text-sm font-bold text-amber-800">Profilo incompleto</h3>
                            <p className="text-xs text-amber-700">Per poter inserire o gestire eventi, devi prima aggiornare le informazioni base del tuo club (Nome e Descrizione).</p>
                        </div>
                        <button
                            onClick={() => navigate('/provider/edit/club')}
                            className="ml-auto bg-amber-500 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-amber-600 transition-colors whitespace-nowrap"
                        >
                            Aggiorna Ora
                        </button>
                    </div>
                </div>
            )}
            {/* Loading Screen Globale */}
            <LoadingScreen isLoading={isLoading || isPageLoading || isGlobalLoading} />

            {/* Modali Globali */}
            <SuccessModal
                isOpen={successModal.isOpen}
                title={successModal.title}
                message={successModal.message}
                onClose={() => setSuccessModal({ ...successModal, isOpen: false })}
            />

            {errorModal.isOpen && (
                <div className="fixed inset-0 z-[10000]">
                    <ErrorModal
                        message={errorModal.message}
                        details={errorModal.details}
                        onClose={() => setErrorModal({ ...errorModal, isOpen: false })}
                    />
                </div>
            )}

            {/* --- COMPONENTI MOBILE --- */}

            {!isMobileOverlayOpen && (
                <MobileStickyTrigger
                    count={pendingList.length}
                    onClick={() => setIsMobileOverlayOpen(true)}
                />
            )}

            {/* Bottom Sheet mobile (sostituisce MobilePendingFullPage) */}
            <MobilePendingBottomSheet
                isOpen={isMobileOverlayOpen}
                onClose={() => setIsMobileOverlayOpen(false)}
                pendingList={pendingList}
                clubId={clubId}
                currentPage={pendingPage}
                totalPages={totalPagesPending}
                onNext={() => setPendingPage(p => p + 1)}
                onPrev={() => setPendingPage(p => p - 1)}
                onAccept={handleAccept}
                onReject={handleReject}
                onRectify={handleRectify}
                onOpenDetails={(bk) => {
                    setIsMobileOverlayOpen(false);
                    setSelectedBooking(bk);
                    setDetailsOpen(true);
                }}
            />

            {/* --- UI STANDARD --- */}

            <BookingDetailModal isOpen={detailsOpen} onClose={() => setDetailsOpen(false)} booking={selectedBooking} clubId={clubId} />
            <CancellationModal isOpen={cancelOpen} onClose={() => setCancelOpen(false)} onConfirm={confirmCancel} booking={selectedBooking} />
            <ComplaintModal isOpen={complaintOpen} onClose={() => setComplaintOpen(false)} onConfirm={confirmComplaint} booking={selectedBooking} />
            <PriceCorrectionModal isOpen={correctionOpen} onClose={() => setCorrectionOpen(false)} onConfirm={confirmCorrection} booking={selectedBooking} />

            {/* MODALE SELEZIONE EVENTO */}
            {eventSelectionOpen && !isMobileDevice && (
                <FullModalBackdrop onClose={() => setEventSelectionOpen(false)}>
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold text-slate-800">Seleziona Evento</h3>
                        <button onClick={() => setEventSelectionOpen(false)} className="p-2 bg-slate-50 hover:bg-slate-100 rounded-full transition-colors">
                            <X size={20} className="text-slate-500" />
                        </button>
                    </div>

                    {isLoadingModalEvents ? (
                        <LoadingComponent />
                    ) : (
                        <>
                            <div className="space-y-3 mb-6">
                                {modalEvents.length > 0 ? modalEvents.map(ev => (
                                    <button
                                        key={ev.id}
                                        onClick={() => handleSelectEventToEdit(ev.id)}
                                        className={`w-full flex items-center gap-4 p-3 rounded-2xl border border-slate-100 hover:border-amber-300 hover:bg-amber-50/30 transition-all group text-left`}
                                    >
                                        <SafeImage src={ev.image} alt="" className="w-12 h-12 rounded-xl object-cover" loading="lazy" />
                                        <div className="flex-1">
                                            <h4 className={`font-bold text-slate-800 ${isDefaultInfo ? 'opacity-50' : 'group-hover:text-amber-600'}`}>{ev.label}</h4>
                                            <span className="text-xs text-slate-500 font-medium">{ev.time}</span>
                                        </div>
                                        <Edit3 size={18} className={`text-slate-300 ${isDefaultInfo ? 'opacity-30' : 'group-hover:text-amber-500'}`} />
                                    </button>
                                )) : (
                                    <div className="text-center py-8 text-slate-500">Nessun evento da modificare</div>
                                )}
                            </div>
                            <div className="flex justify-center border-t border-slate-100 pt-4">
                                <PaginationControls
                                    currentPage={modalEventsPage}
                                    totalPages={totalPagesModal}
                                    onNext={() => setModalEventsPage(p => p + 1)}
                                    onPrev={() => setModalEventsPage(p => p - 1)}
                                />
                            </div>
                        </>
                    )}
                </FullModalBackdrop>
            )}

            {/* 0. TOP SECTION */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
                <div className="lg:col-span-2">
                    <StatsSummary activeCategory="club" revenue={stats.revenue} count={stats.count} />
                </div>

                <div className="flex flex-col gap-4 h-full">
                    <div className={`hidden lg:flex bg-gradient-to-br from-[${HOGU_COLORS.dark}] to-slate-800 rounded-[2rem] p-6 text-white shadow-xl shadow-slate-900/10 flex-col justify-center relative group min-h-[140px]`}>
                        <div className="absolute inset-0 overflow-hidden rounded-[2rem] pointer-events-none">
                            <div className="absolute -right-6 -top-6 text-white/5 group-hover:text-white/10 transition-colors">
                                <PartyPopper size={140} />
                            </div>
                        </div>
                        <h3 className="text-lg font-bold mb-1 relative z-10">Gestione Eventi</h3>
                        <p className="text-slate-400 text-xs mb-6 relative z-10">Crea una nuova serata o modifica quelle esistenti.</p>
                        <div className="relative z-20" ref={actionMenuRef}>
                            <button
                                onClick={() => !isDefaultInfo && setEventActionMenuOpen(!eventActionMenuOpen)}
                                disabled={isDefaultInfo}
                                className={`w-full bg-white text-slate-900 font-bold py-3 px-4 rounded-xl flex items-center justify-between transition-colors shadow-lg relative z-20 ${isDefaultInfo ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-100 active:scale-95'}`}
                            >
                                <span className="flex items-center gap-2"><MousePointer2 size={18} /> Azioni Rapide</span>
                                <ChevronDown size={18} className={`transition-transform ${eventActionMenuOpen ? 'rotate-180' : ''}`} />
                            </button>
                            {eventActionMenuOpen && (
                                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 origin-top z-50">
                                    <button onClick={() => handleEventAction('create')} className={`w-full text-left px-4 py-3 text-sm font-bold text-slate-700 hover:bg-[${HOGU_COLORS.primary}] hover:text-white flex items-center gap-2 transition-colors border-b border-slate-50`}>
                                        <Plus size={16} /> Nuovo Evento
                                    </button>
                                    <button onClick={() => handleEventAction('edit')} className="w-full text-left px-4 py-3 text-sm font-bold text-slate-700 hover:bg-amber-500 hover:text-white flex items-center gap-2 transition-colors">
                                        <Edit3 size={16} /> Modifica Esistente
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 lg:hidden">
                        <button onClick={() => navigate('/provider/qr-validator?type=club')} className="bg-[#1a1a1a] text-white p-3 rounded-xl flex flex-col items-center justify-center gap-2 shadow-lg">
                            <ScanLine size={20} />
                            <span className="text-xs font-bold">Scanner</span>
                        </button>

                        <div className="relative" ref={mobileMenuRef}>
                            <button
                                onClick={() => !isDefaultInfo && setEventActionMenuOpen(!eventActionMenuOpen)}
                                disabled={isDefaultInfo}
                                className={`w-full h-full bg-white text-slate-700 p-3 rounded-xl flex flex-col items-center justify-center gap-2 border border-slate-100 shadow-sm transition-transform ${isDefaultInfo ? 'opacity-50 cursor-not-allowed' : 'active:scale-95'}`}
                            >
                                <PartyPopper size={20} />
                                <span className="text-xs font-bold">Eventi</span>
                            </button>

                            {eventActionMenuOpen && (
                                <div
                                    className="fixed inset-x-4 bottom-24 sm:absolute sm:inset-auto sm:top-full sm:left-0 sm:mt-2 sm:w-72 bg-white rounded-2xl shadow-2xl border border-slate-100 p-4 z-[9999] animate-in slide-in-from-bottom-5 fade-in duration-200 sm:origin-top-left"
                                    onClick={e => e.stopPropagation()}
                                >
                                    <div className="hidden sm:block absolute -top-2 left-6 w-4 h-4 bg-white border-t border-l border-slate-100 transform rotate-45"></div>
                                    <div>
                                        {!eventSelectionOpen ? (
                                            <>
                                                <div className="flex justify-between items-center mb-4">
                                                    <h3 className="text-lg font-bold text-slate-800">Gestione Eventi</h3>
                                                    <button onClick={() => setEventActionMenuOpen(false)} className="p-2 bg-slate-50 hover:bg-slate-100 rounded-full transition-colors">
                                                        <X size={18} className="text-slate-500" />
                                                    </button>
                                                </div>
                                                <p className="text-slate-500 text-xs mb-4">Crea una nuova serata o modifica quelle esistenti.</p>
                                                <div className="space-y-2">
                                                    <button type="button" onClick={() => handleEventAction('create')} className={`w-full px-4 py-3 text-sm font-bold text-slate-700 hover:bg-[${HOGU_COLORS.primary}] hover:text-white flex items-center gap-2 text-left rounded-xl border border-slate-100`}>
                                                        <Plus size={16} /> Crea Nuovo Evento
                                                    </button>
                                                    <button type="button" onClick={() => handleEventAction('edit')} className="w-full px-4 py-3 text-sm font-bold text-slate-700 hover:bg-amber-50 hover:text-amber-700 flex items-center gap-2 text-left rounded-xl border border-slate-100">
                                                        <Edit3 size={16} /> Modifica Esistente
                                                    </button>
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <div className="flex justify-between items-center mb-6">
                                                    <h3 className="text-xl font-bold text-slate-800">Seleziona Evento</h3>
                                                    <button onClick={() => setEventSelectionOpen(false)} className="p-2 bg-slate-50 hover:bg-slate-100 rounded-full transition-colors">
                                                        <X size={20} className="text-slate-500" />
                                                    </button>
                                                </div>
                                                {isLoadingModalEvents ? (
                                                    <LoadingComponent />
                                                ) : (
                                                    <>
                                                        <div className="space-y-3 mb-6">
                                                            {modalEvents.length > 0 ? modalEvents.map(ev => (
                                                                <button key={ev.id} onClick={() => handleSelectEventToEdit(ev.id)} className={`w-full flex items-center gap-4 p-3 rounded-2xl border border-slate-100 hover:border-amber-300 hover:bg-amber-50/30 transition-all group text-left`}>
                                                                    <SafeImage src={ev.image} alt="" className="w-12 h-12 rounded-xl object-cover" loading="lazy" />
                                                                    <div className="flex-1">
                                                                        <h4 className={`font-bold text-slate-800 group-hover:text-amber-600`}>{ev.label}</h4>
                                                                        <span className="text-xs text-slate-500 font-medium">{ev.time}</span>
                                                                    </div>
                                                                    <Edit3 size={18} className={`text-slate-300 group-hover:text-amber-500`} />
                                                                </button>
                                                            )) : (
                                                                <div className="text-center py-8 text-slate-500">Nessun evento da modificare</div>
                                                            )}
                                                        </div>
                                                        <div className="flex justify-center border-t border-slate-100 pt-4">
                                                            <PaginationControls currentPage={modalEventsPage} totalPages={totalPagesModal} onNext={() => setModalEventsPage(p => p + 1)} onPrev={() => setModalEventsPage(p => p - 1)} />
                                                        </div>
                                                    </>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </div>
                            )}

                            {eventActionMenuOpen && (
                                <div className="fixed inset-0 z-40 bg-black/5" onClick={() => { setEventActionMenuOpen(false); setEventSelectionOpen(false); }}></div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* 1. RICHIESTE PENDING (solo desktop) */}
            <section className="relative hidden md:block">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                    <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-2xl border ${pendingList.length > 0 ? 'bg-amber-50 border-amber-100 text-amber-600' : 'bg-slate-50 border-slate-100 text-slate-400'}`}>
                            <BellRing size={28} className={pendingList.length > 0 ? 'animate-bounce' : ''} />
                        </div>
                        <div>
                            <h2 className={`text-2xl font-extrabold text-[${HOGU_COLORS.dark}]`}>Richieste Urgenti</h2>
                            <p className="text-sm text-slate-500 font-medium">
                                {pendingList.length > 0 ? "Prenotazioni che richiedono attenzione." : "Nessuna richiesta in sospeso."}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                        <PaginationControls currentPage={pendingPage} totalPages={totalPagesPending} onNext={() => setPendingPage(p => p + 1)} onPrev={() => setPendingPage(p => p - 1)} />
                    </div>
                </div>

                {pendingList.length > 0 ? (
                    <div className="p-1.5 rounded-[2rem] bg-gradient-to-br from-amber-400/20 via-orange-100/10 to-transparent">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {pendingList.map(b => (
                                <PendingRequestCard
                                    key={b.id}
                                    booking={b}
                                    activeCategory="club"
                                    clubId={clubId}
                                    onOpenDetails={(bk) => { setSelectedBooking(bk); setDetailsOpen(true); }}
                                    onAccept={handleAccept}
                                    onReject={handleReject}
                                    onRectify={handleRectify}
                                />
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="bg-emerald-50/50 border border-emerald-100 rounded-3xl p-8 flex flex-col items-center justify-center text-center">
                        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-3">
                            <CheckCircle size={32} />
                        </div>
                        <h3 className="text-lg font-bold text-emerald-800">Tutto aggiornato</h3>
                    </div>
                )}
            </section>

            <div className="hidden md:block border-t border-slate-100 my-8"></div>

            {/* 2. MONITORAGGIO EVENTI */}
            <section className="bg-slate-900 rounded-[2.5rem] p-6 md:p-8 text-white shadow-2xl shadow-slate-900/20 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none"><PartyPopper size={200} /></div>

                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 relative z-10 mb-6 md:mb-8">
                    <div className="w-full">
                        <h2 className="text-lg sm:text-xl md:text-2xl font-bold flex items-center gap-3 text-left">
                            <PartyPopper className={`text-[${HOGU_COLORS.primary}]`} /> Monitoraggio Eventi
                        </h2>
                        <p className="text-slate-400 text-sm mt-1">Gestisci i flussi di ingresso in tempo reale.</p>
                    </div>
                    <PaginationControls currentPage={eventsPage} totalPages={totalPagesEvents} onNext={() => setEventsPage(p => p + 1)} onPrev={() => setEventsPage(p => p - 1)} darkBg={true} />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5 lg:gap-6 relative z-10">
                    {todayEvents.length > 0 ? (
                        todayEvents.map(ev => (
                            <TodayEventCard
                                key={ev.id}
                                event={ev}
                                onValidate={(eventId) => navigate(`/provider/qr-validator?type=club&eventId=${eventId}`)}
                            />
                        ))
                    ) : (
                        <div className="col-span-full text-center text-slate-500 py-10">Nessun evento oggi</div>
                    )}
                </div>
            </section>

            {/* 3. STORICO & AGENDA */}
            <section>
                <div className="flex flex-col sm:flex-row justify-between items-end sm:items-center gap-4 mb-6">
                    <div className="w-full">
                        <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-slate-800 flex items-center gap-2 text-left">
                            <Calendar size={22} className={`text-[${HOGU_COLORS.primary}]`} /> Agenda & Storico
                        </h2>
                    </div>

                    <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                        <div className="flex bg-white p-1 rounded-2xl border border-slate-200 shadow-sm">
                            <button onClick={() => handleFilterChange('active')} className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wide transition-all ${filter === 'active' ? `bg-[${HOGU_COLORS.primary}] text-white shadow-md` : 'text-slate-400 hover:bg-slate-50'}`}>In Arrivo</button>
                            <button onClick={() => handleFilterChange('past')} className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wide transition-all ${filter === 'past' ? 'bg-slate-800 text-white shadow-md' : 'text-slate-400 hover:bg-slate-50'}`}>Archivio</button>
                        </div>
                        <PaginationControls currentPage={historyPage} totalPages={totalPagesHistory} onNext={() => setHistoryPage(p => p + 1)} onPrev={() => setHistoryPage(p => p - 1)} />
                    </div>
                </div>

                <div className="flex flex-col gap-4">
                    {historyList.length > 0 ? (
                        historyList.map(b => (
                            <ProviderBookingCard
                                key={b.id}
                                booking={b}
                                activeCategory="club"
                                clubId={clubId}
                                onOpenDetails={(bk) => { setSelectedBooking(bk); setDetailsOpen(true); }}
                                onOpenComplaint={(bk) => { setSelectedBooking(bk); setComplaintOpen(true); }}
                                onCancelBooking={(bk) => { setSelectedBooking(bk); setCancelOpen(true); }}
                            />
                        ))
                    ) : (
                        <div className="py-12 bg-white rounded-3xl border border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400">
                            <ListTodo className="mb-2 opacity-50" size={32} />
                            <span className="font-medium">Nessuna prenotazione trovata.</span>
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
};

export default ClubDashboard;
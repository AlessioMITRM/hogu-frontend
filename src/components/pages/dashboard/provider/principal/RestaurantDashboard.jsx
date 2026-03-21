import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
    Utensils, Calendar, ListTodo, ChefHat, Info,
    ScanLine, Settings, History, BellRing, CheckCircle,
    QrCode, ArrowRight, Store, ChevronUp, X, Loader2,
    Wallet, Activity, XCircle, Clock, Ban, Eye, User,
    AlertTriangle, Edit3, Phone, MoreVertical
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import {
    // PendingRequestCard,  <-- We'll define these locally to support User Icon
    // ProviderBookingCard,
    StatsSummary,
    PaginationControls,
    BookingDetailModal,
    CancellationModal,
    ComplaintModal,
    PriceCorrectionModal,
    CategorySpecificDetails,
    StatusBadge
} from './ProviderUI';

import { HOGU_COLORS, HOGU_THEME } from '../../../../../config/theme.js';
import { restaurantService } from '../../../../../api/apiClient.js';

import LoadingScreen from '../../../../ui/LoadingScreen';
import SafeImage from '../../../../ui/SafeImage.jsx';


// --- COMPONENTI LOCALI UTILI ---
const LoadingComponent = () => (
    <div className="flex justify-center items-center py-10">
        <Loader2 size={32} className="animate-spin text-slate-400" />
    </div>
);

const formatPrice = (value) => {
    if (value === undefined || value === null) return '0,00';
    const num = typeof value === 'string' ? parseFloat(value.replace(',', '.')) : value;
    if (isNaN(num)) return '0,00';
    return num.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const getDisplayPrice = (booking) => {
    const guests = booking.numberOfPeople || booking.guests || 0;
    return guests * 2.50;
};

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

const MobileStickyTrigger = ({ count, onClick }) => {
    const { t } = useTranslation('dashboard');
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
                        <h4 className="font-bold text-sm">{t('provider.mobile.have_requests', { count })}</h4>
                        <p className="text-xs text-slate-400">{t('provider.dashboard.manage_tables', 'Gestisci tavoli e liste')}</p>
                    </div>
                </div>
                <div className="bg-white/10 p-2 rounded-full">
                    <ChevronUp size={18} />
                </div>
            </button>
        </div>
    );
};

const MobilePendingCard = ({ booking, onAccept, onReject, onOpenDetails }) => {
    const { t, i18n } = useTranslation('dashboard');
    const isWaitingCustomer = booking.status === 'waiting_customer' || booking.status === 'WAITING_CUSTOMER_PAYMENT';
    const customerName = booking.bookingFullName ?? booking.customerName;
    const serviceName = booking.serviceName;
    const price = getDisplayPrice(booking);
    const dateObj = booking.reservationTime ? new Date(booking.reservationTime) : undefined;
    const dateStr = dateObj ? dateObj.toLocaleDateString(i18n.language, { day: '2-digit', month: '2-digit' }) : (booking.date ?? '');
    const timeStr = dateObj ? dateObj.toLocaleTimeString(i18n.language, { hour: '2-digit', minute: '2-digit' }) : (booking.time ?? '');
    const imageUrl = booking.image;

    return (
        <div className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all active:scale-[0.99]
            ${isWaitingCustomer ? 'border-blue-100' : 'border-slate-100'}`}
        >
            <div className={`h-0.5 w-full ${isWaitingCustomer ? 'bg-blue-400' : 'bg-gradient-to-r from-amber-400 to-orange-400'}`} />

            <div className="p-3">
                <div className="flex items-center gap-3 mb-2.5">
                    <div className="relative shrink-0">
                        {imageUrl ? (
                            <SafeImage
                                src={imageUrl}
                                alt=""
                                className="w-11 h-11 rounded-xl object-cover ring-2 ring-white shadow-sm"
                                loading="lazy"
                            />
                        ) : (
                            <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-white shadow-sm
                                ${isWaitingCustomer ? 'bg-blue-400' : 'bg-amber-400'}`}>
                                <User size={20} />
                            </div>
                        )}
                        {!isWaitingCustomer && (
                            <span className="absolute -top-1 -right-1 bg-amber-400 text-white text-[8px] font-black px-1 py-px rounded-full border border-white leading-none">
                                {t('provider.dashboard.new_tag', 'NEW')}
                            </span>
                        )}
                    </div>

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
                            <CategorySpecificDetails booking={booking} category="restaurant" />
                        </div>
                    </div>
                </div>

                {isWaitingCustomer ? (
                    <div className="w-full bg-blue-50 text-blue-500 py-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 border border-blue-100">
                        <Clock size={12} className="animate-pulse" /> {t('provider.dashboard.waiting_customer', "In attesa del cliente...")}
                    </div>
                ) : (
                    <div className="flex gap-2">
                        <button
                            onClick={() => onAccept(booking.id)}
                            className={`flex-1 bg-[${HOGU_COLORS.primary}] text-white py-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all shadow-sm`}
                        >
                            <CheckCircle size={12} /> {t('provider.actions.accept', "Accetta")}
                        </button>
                        <button
                            onClick={() => onReject(booking)}
                            className="flex-1 py-2 bg-red-50 text-red-500 border border-red-100 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all"
                        >
                            <Ban size={12} /> {t('provider.actions.cancel', "Annulla")}
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

const MobilePendingBottomSheet = ({ isOpen, onClose, pendingList, onAccept, onReject, onRectify, onOpenDetails, currentPage, totalPages, onNext, onPrev }) => {
    const { t } = useTranslation('dashboard');
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
                                    {t('dashboard:provider.dashboard.pending_section_title', "Gestione Sala")}
                                </h2>
                                <p className="text-xs text-slate-400 font-medium">
                                    {pendingList.length} {pendingList.length === 1 ? t('dashboard:provider.booking_details.booking_one', 'prenotazione') : t('dashboard:provider.booking_details.booking_other', 'prenotazioni')} {t('dashboard:provider.dashboard.waiting', 'in attesa')}
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
                            <MobilePendingCard
                                key={b.id}
                                booking={b}
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
                            <p className="font-bold text-slate-700 text-sm">{t('provider.dashboard.all_clear_title', "Sala aggiornata")}</p>
                            <p className="text-xs text-slate-400 mt-1">{t('provider.dashboard.all_clear_subtitle', "Nessun tavolo in attesa di conferma.")}</p>
                            <button
                                onClick={onClose}
                                className="mt-4 text-sm font-bold text-emerald-600 bg-emerald-50 px-5 py-2.5 rounded-xl active:scale-95 transition-transform"
                            >
                                {t('provider.actions.close', 'Chiudi')}
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

// --- LOCAL VERSION OF CARDS TO SUPPORT USER ICON FALLBACK (Like NccDashboard) ---
const LocalPendingRequestCard = ({ booking, onAccept, onReject, onRectify, onOpenDetails, activeCategory }) => {
    const isWaitingCustomer = booking.status === 'waiting_customer' || booking.status === 'WAITING_CUSTOMER_PAYMENT';
    const imageUrl = booking.image;
    const { t, i18n } = useTranslation('dashboard');

    const dateObj = booking.reservationTime ? new Date(booking.reservationTime) : null;
    const dateStr = dateObj ? dateObj.toLocaleDateString(i18n.language) : (booking.date || '--');
    const timeStr = dateObj ? dateObj.toLocaleTimeString(i18n.language, { hour: '2-digit', minute: '2-digit' }) : (booking.time || '--');

    return (
        <div className={`group bg-white rounded-3xl p-5 border shadow-[0_2px_15px_-3px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_25px_-5px_rgba(104,180,155,0.15)] transition-all duration-300 flex flex-col relative overflow-hidden h-full 
        ${isWaitingCustomer ? 'border-blue-100 bg-blue-50/30' : 'border-slate-100 hover:border-[#68B49B]/30'}`}>
            <div className={`absolute left-0 top-0 bottom-0 w-1.5 opacity-80 ${isWaitingCustomer ? 'bg-blue-400' : 'bg-gradient-to-b from-amber-300 to-amber-500'}`}></div>
            <div className="flex flex-wrap items-start justify-between gap-4 mb-5 pl-2 relative z-10">
                <div className="flex gap-4 min-w-0 max-w-full">
                    <div className="relative shrink-0">
                        {imageUrl ? (
                            <SafeImage src={imageUrl} alt="" className="w-14 h-14 rounded-2xl object-cover shadow-sm ring-2 ring-white" />
                        ) : (
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-sm
                                ${isWaitingCustomer ? 'bg-blue-400' : 'bg-amber-400'}`}>
                                <User size={24} />
                            </div>
                        )}
                        {!isWaitingCustomer && (<div className="absolute -bottom-2 -right-1 bg-amber-400 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full border-2 border-white shadow-sm tracking-wide">{t('provider.dashboard.new_tag', 'NEW')}</div>)}
                    </div>
                    <div className="min-w-0 flex-1">
                        <h4 className="font-bold text-[#1A202C] text-lg leading-tight mb-0.5 truncate pr-2">
                            {booking.bookingFullName || booking.customerName || t('provider.booking_details.customer', "Cliente")}
                        </h4>
                        <p className="text-xs text-[#68B49B] font-bold uppercase tracking-wide mb-1 truncate">{booking.serviceName}</p>
                        <CategorySpecificDetails booking={booking} category={activeCategory} />
                    </div>
                </div>
                <div className="text-right shrink-0 ml-auto">
                    <span className={`block font-extrabold text-base md:text-lg ${isWaitingCustomer ? 'text-blue-600' : 'text-[#1A202C]'}`}>
                        € {formatPrice(getDisplayPrice(booking))}
                    </span>
                    <span className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">{t('provider.booking_details.commission_label', "Commissioni")}</span>
                </div>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-5 pl-2">
                <div className="bg-slate-50 p-2 rounded-xl border border-slate-100 min-w-0">
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block mb-1 truncate">{t('provider.booking_details.date', "Data")}</span>
                    <div className="flex items-center gap-2 text-slate-700 font-bold text-xs sm:text-sm truncate">
                        <Calendar size={14} className="text-[#68B49B] shrink-0" />
                        <span className="truncate">{dateStr}</span>
                    </div>
                </div>
                <div className="bg-slate-50 p-2 rounded-xl border border-slate-100 min-w-0">
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block mb-1 truncate">{t('provider.booking_details.time', "Ora")}</span>
                    <div className="flex items-center gap-2 text-slate-700 font-bold text-xs sm:text-sm truncate">
                        <Clock size={14} className="text-[#68B49B] shrink-0" />
                        <span className="truncate">{timeStr}</span>
                    </div>
                </div>
            </div>
            <div className="mt-auto pl-2">
                {isWaitingCustomer ? (
                    <div className="w-full bg-blue-100 text-blue-600 py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 border border-blue-200"><Clock size={16} className="animate-pulse" /> {t('provider.dashboard.waiting_customer', "In attesa del cliente...")}</div>
                ) : (
                    <div className="flex gap-2">
                        <button onClick={() => onAccept(booking.id)} className="flex-1 bg-[#68B49B] text-white px-3 py-2.5 rounded-xl font-bold text-xs md:text-sm hover:bg-[#5aa38d] shadow-sm hover:shadow-[#68B49B]/20 active:scale-95 transition-all flex items-center justify-center gap-1.5"><CheckCircle size={16} /> {t('provider.actions.accept', 'Accetta')}</button>
                        <button onClick={() => onReject(booking)} className="w-10 h-10 shrink-0 flex items-center justify-center bg-rose-50 border border-rose-200 text-rose-600 rounded-xl hover:bg-rose-100 transition-all"><XCircle size={18} /></button>
                        <button onClick={() => onOpenDetails(booking)} className="w-10 h-10 shrink-0 flex items-center justify-center bg-slate-50 text-slate-400 rounded-xl hover:bg-slate-100 hover:text-[#68B49B] transition-all"><Eye size={18} /></button>
                    </div>
                )}
            </div>
        </div>
    );
};

const LocalProviderBookingCard = ({ booking, onOpenDetails, onOpenComplaint, onCancelBooking, activeCategory }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef(null);
    const { t, i18n } = useTranslation('dashboard');

    useEffect(() => {
        const handleClickOutside = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setIsMenuOpen(false); };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const isCancelled = booking.status === 'cancelled' || booking.status === 'CANCELLED_BY_PROVIDER' || booking.status === 'CANCELLED_BY_ADMIN';
    const imageUrl = booking.image;
    const dateObj = booking.reservationTime ? new Date(booking.reservationTime) : null;
    const dateStr = dateObj ? dateObj.toLocaleDateString(i18n.language) : (booking.date || '--');
    const timeStr = dateObj ? dateObj.toLocaleTimeString(i18n.language, { hour: '2-digit', minute: '2-digit' }) : (booking.time || '--');

    return (
        <div className={`rounded-3xl border p-5 flex flex-col sm:flex-row gap-6 transition-all duration-300 relative group
            ${isCancelled ? 'bg-red-50 border-red-200' : 'bg-white border-slate-100 hover:border-[#68B49B]/30 hover:shadow-lg hover:shadow-slate-200/50'}`}>
            <div className={`w-20 h-20 rounded-2xl overflow-hidden shrink-0 shadow-sm ring-1 ${isCancelled ? 'ring-red-100 grayscale' : 'ring-slate-100'}`}>
                {imageUrl ? (
                    <SafeImage src={imageUrl} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                    <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-400">
                        <User size={32} />
                    </div>
                )}
            </div>
            <div className="flex-1 flex flex-col justify-between">
                <div className="flex justify-between items-start mb-2">
                    <div>
                        <h4 className={`font-bold text-lg ${isCancelled ? 'text-red-700 line-through decoration-red-400' : 'text-[#1A202C]'}`}>
                            {booking.bookingFullName || booking.customerName || t('provider.booking_details.customer', "Cliente")}
                        </h4>
                        <p className={`text-xs font-medium uppercase tracking-wide ${isCancelled ? 'text-red-400' : 'text-slate-500'}`}>{booking.serviceName}</p>
                        <div className="mt-1">
                            <CategorySpecificDetails booking={booking} category={activeCategory} />
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <StatusBadge status={booking.status} />
                        <button onClick={() => onOpenDetails(booking)} className={`w-8 h-8 flex items-center justify-center rounded-full transition-all ml-1 shadow-sm ${isCancelled ? 'bg-red-100 text-red-500 hover:bg-red-200' : 'bg-slate-50 text-slate-400 hover:bg-[#68B49B] hover:text-white'}`}><Eye size={16} /></button>
                        {(booking.status === 'confirmed' || booking.status === 'CONFIRMED') && (
                            <div className="relative" ref={menuRef}>
                                <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"><MoreVertical size={18} /></button>
                                {isMenuOpen && (
                                    <div className="absolute right-0 top-full mt-2 w-48 bg-white shadow-xl shadow-slate-200/60 border border-slate-100 rounded-2xl p-1.5 z-50 animate-in fade-in zoom-in-95 origin-top-right">
                                        <button onClick={() => { setIsMenuOpen(false); onCancelBooking(booking); }} className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-bold hover:bg-rose-50 text-slate-600 hover:text-rose-600 rounded-xl transition-colors"><Ban size={14} /> {t('provider.actions.cancel_booking', 'Annulla Prenotazione')}</button>
                                        <button onClick={() => { setIsMenuOpen(false); onOpenComplaint(booking); }} className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-bold hover:bg-amber-50 text-slate-600 hover:text-amber-600 rounded-xl transition-colors"><AlertTriangle size={14} /> {t('provider.actions.report_problem', 'Segnala Problema')}</button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
                <div className={`flex items-center justify-between mt-auto pt-3 border-t ${isCancelled ? 'border-red-100' : 'border-slate-50'}`}>
                    <div className={`flex gap-4 text-xs font-semibold tracking-wide ${isCancelled ? 'text-red-400 opacity-70' : 'text-slate-500'}`}>
                        <span className={`flex items-center gap-1.5 px-2 py-1 rounded-md ${isCancelled ? 'bg-red-100/50' : 'bg-slate-50'}`}>
                            <Calendar size={12} className={isCancelled ? "text-red-500" : "text-[#68B49B]"} />
                            {dateStr}
                        </span>
                        <span className={`flex items-center gap-1.5 px-2 py-1 rounded-md ${isCancelled ? 'bg-red-100/50' : 'bg-slate-50'}`}>
                            <Clock size={12} className={isCancelled ? "text-red-500" : "text-[#68B49B]"} />
                            {timeStr}
                        </span>
                    </div>
                    <div className="text-right">
                        <span className={`block font-extrabold text-lg leading-tight ${isCancelled ? 'text-red-600' : 'text-[#1A202C]'}`}>€ {formatPrice(getDisplayPrice(booking))}</span>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{t('provider.booking_details.commission_label', "Commissioni")}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

// =================================================================================
// MAIN COMPONENT
// =================================================================================

const LocalBookingDetailModal = ({ isOpen, onClose, booking }) => {
    const { t, i18n } = useTranslation('dashboard');
    if (!isOpen || !booking) return null;

    const dateObj = booking.reservationTime ? new Date(booking.reservationTime) : null;
    const dateStr = dateObj ? dateObj.toLocaleDateString(i18n.language) : (booking.date || '--');
    const timeStr = dateObj ? dateObj.toLocaleTimeString(i18n.language, { hour: '2-digit', minute: '2-digit' }) : (booking.time || '--');

    return (
        <FullModalBackdrop onClose={onClose}>
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
                    <h2 className={`font-extrabold text-xl sm:text-2xl text-[${HOGU_COLORS.dark}] mb-1`}>{booking?.customerName || booking?.bookingFullName}</h2>
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
                        <ListTodo size={18} className="text-slate-400" /> {t('provider.booking_details.title', 'Dettagli Prenotazione')}
                    </h3>

                    <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-6">
                        <div className="bg-slate-50 p-3 sm:p-4 rounded-2xl border border-slate-100">
                            <span className="text-[10px] uppercase text-slate-400 font-bold tracking-wider block mb-1">{t('provider.booking_details.date', "Data")}</span>
                            <div className="flex items-center gap-2 font-bold text-slate-700 text-base sm:text-lg">
                                <Calendar size={16} className={`text-[${HOGU_COLORS.primary}]`} /> {dateStr}
                            </div>
                        </div>
                        <div className="bg-slate-50 p-3 sm:p-4 rounded-2xl border border-slate-100">
                            <span className="text-[10px] uppercase text-slate-400 font-bold tracking-wider block mb-1">{t('provider.booking_details.time', "Orario")}</span>
                            <div className="flex items-center gap-2 font-bold text-slate-700 text-base sm:text-lg">
                                <Clock size={16} className={`text-[${HOGU_COLORS.primary}]`} /> {timeStr}
                            </div>
                        </div>

                        <div className="bg-slate-50 p-3 sm:p-4 rounded-2xl border border-slate-100">
                            <span className="text-[10px] uppercase text-slate-400 font-bold tracking-wider block mb-1">
                                {t('provider.categories.units.coperti', "Coperti")}
                            </span>
                            <div className="flex items-center gap-2 font-bold text-slate-700 text-base sm:text-lg">
                                <User size={16} className={`text-[${HOGU_COLORS.primary}]`} /> {booking.guests || booking.numberOfPeople}
                            </div>
                        </div>
                        <div className="bg-slate-50 p-3 sm:p-4 rounded-2xl border border-slate-100">
                            <span className="text-[10px] uppercase text-slate-400 font-bold tracking-wider block mb-1">{t('provider.booking_details.commission_label', "Commissioni")}</span>
                            <div className="flex items-center gap-2 font-extrabold text-slate-800 text-base sm:text-lg">
                                € {formatPrice(getDisplayPrice(booking))}
                            </div>
                        </div>
                    </div>
                    {booking.note && (
                        <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 mb-6">
                            <span className="text-[10px] uppercase text-amber-500 font-bold tracking-wider block mb-1">{t('provider.booking_details.customer_notes', "Note Cliente")}</span>
                            <p className="text-sm text-amber-900 leading-relaxed italic">"{booking.note}"</p>
                        </div>
                    )}
                    <button onClick={onClose} className="w-full py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-colors">
                        {t('provider.actions.close', 'Chiudi')}
                    </button>
                </div>
            </div>
        </FullModalBackdrop>
    );
};

const RestaurantManagementModal = ({ isOpen, onClose, serviceData, navigate }) => {
    const { t } = useTranslation('dashboard');
    if (!isOpen) return null;

    return (
        <FullModalBackdrop onClose={onClose}>
            <div className="w-full">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800">{t('provider.dashboard.manage_restaurant', "Gestisci Ristorante")}</h2>
                        <p className="text-slate-400">{t('provider.dashboard.edit_details_desc', "Modifica il profilo della tua attività")}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                        <X size={24} className="text-slate-400" />
                    </button>
                </div>

                {/* SEZIONE MODIFICA */}
                <div className="mb-4">
                    <div
                        onClick={() => {
                            const id = serviceData?.id || serviceData?.serviceId;
                            if (id) {
                                navigate(`/provider/edit/restaurant/${id}`);
                                onClose();
                            }
                        }}
                        className="flex items-center justify-between p-5 rounded-2xl border border-indigo-100 bg-indigo-50/50 hover:border-indigo-300 hover:bg-indigo-50 hover:shadow-md transition-all group cursor-pointer"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-xl bg-indigo-100 text-indigo-500 flex items-center justify-center flex-shrink-0">
                                <Store size={28} />
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-800 text-lg group-hover:text-indigo-600 transition-colors">{t('provider.dashboard.general_details', "Dettagli Generali Ristorante")}</h4>
                                <p className="text-sm text-slate-500">{t('provider.dashboard.edit_details_desc', "Modifica nome, descrizione, foto e menu")}</p>
                            </div>
                        </div>
                        <div className="p-3 bg-white border border-indigo-100 rounded-xl text-indigo-300 group-hover:text-indigo-600 transition-colors shadow-sm">
                            <Edit3 size={20} />
                        </div>
                    </div>
                </div>

                <div className="mt-8 pt-6 border-t border-slate-100">
                    <button
                        onClick={onClose}
                        className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-lg active:scale-95"
                    >
                        {t('provider.actions.close', 'Chiudi')}
                    </button>
                </div>
            </div>
        </FullModalBackdrop>
    );
};

const RestaurantDashboard = () => {
    const navigate = useNavigate();
    const { t } = useTranslation('dashboard');

    // --- STATI DATI ---
    const [serviceData, setServiceData] = useState(null);
    const [pendingBookings, setPendingBookings] = useState([]);
    const [historyBookings, setHistoryBookings] = useState([]);
    const [stats, setStats] = useState({ revenue: 0, count: 0 });
    const [isLoading, setIsLoading] = useState(true);
    const [isActionLoading, setIsActionLoading] = useState(false);
    const [error, setError] = useState(null);

    const [isMobileOverlayOpen, setIsMobileOverlayOpen] = useState(false); // Stato Overlay Mobile

    // --- PAGINAZIONE ---
    const [pendingPage, setPendingPage] = useState(1);
    const [totalPendingPages, setTotalPendingPages] = useState(1);

    const [historyPage, setHistoryPage] = useState(1);
    const [totalHistoryPages, setTotalHistoryPages] = useState(1);

    const ITEMS_PER_PAGE = 10; // Aumentato a 10 per coerenza con backend

    // --- FILTRI ---
    const [filter, setFilter] = useState('active');

    // --- MODALI ---
    const [detailsOpen, setDetailsOpen] = useState(false);
    const [complaintOpen, setComplaintOpen] = useState(false);
    const [cancelOpen, setCancelOpen] = useState(false);
    const [correctionOpen, setCorrectionOpen] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [isRestaurantModalOpen, setIsRestaurantModalOpen] = useState(false);

    // --- SUCCESS MODAL ---
    const [successModalOpen, setSuccessModalOpen] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    // --- FETCH DATA ---
    const fetchData = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            // 1. Get Service Info & Stats
            const info = await restaurantService.getInfoProvider();
            setServiceData(info);

            setStats({
                revenue: info.totalCommissionsAmount ?? 0,
                count: info.totalBookings || 0
            });

            // 2. Get Bookings
            const id = info.id || info.serviceId;
            if (info && id) {
                // Helper per mappare le prenotazioni e impostare l'immagine dell'utente
                const mapBooking = (b) => {
                    return {
                        ...b,
                        image: b.customerImage || null // Usiamo l'immagine dell'utente, non quella del servizio
                    };
                };

                // Fetch Pending
                const pendingData = await restaurantService.getBookingsPending(id, pendingPage - 1, ITEMS_PER_PAGE);
                setPendingBookings((pendingData.content || []).map(mapBooking));
                setTotalPendingPages(pendingData.totalPages || 1);

                // Fetch History/Active based on filter
                let historyData;
                if (filter === 'past') {
                    historyData = await restaurantService.getBookingsHistory(id, historyPage - 1, ITEMS_PER_PAGE);
                } else {
                    historyData = await restaurantService.getBookingsUpcoming(id, historyPage - 1, ITEMS_PER_PAGE);
                }

                setHistoryBookings((historyData.content || []).map(mapBooking));
                setTotalHistoryPages(historyData.totalPages || 1);
            }
        } catch (err) {
            console.error("Error loading restaurant dashboard:", err);
            // Non blocchiamo tutto se fallisce il caricamento, ma mostriamo errore
            setPendingBookings([]);
            setHistoryBookings([]);
        } finally {
            setIsLoading(false);
        }
    }, [t, pendingPage, historyPage, filter]); // Dipendenze aggiornate

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // --- LISTE (Ora dirette dagli stati) ---
    const pendingListFull = pendingBookings;
    const currentPendingList = pendingBookings; // Già paginato dal server

    // Nota: Il backend attualmente ritorna TUTTO in getBookings. 
    // Se vogliamo filtrare active/past lato server, dovremmo aggiornare l'API getBookings per accettare uno status filter.
    // Per ora, manteniamo la visualizzazione mista o filtriamo lato client su ciò che ritorna la pagina corrente (limitato)
    // OPPURE: Lato client filtriamo solo per visualizzazione, ma la paginazione server potrebbe essere "sporca" se mescola stati.
    // Dato che il backend getBookings ritorna tutto tranne pending (se modificato) o tutto in assoluto.
    // VERIFICA: getRestaurantBookings nel backend ritorna findByRestaurantServiceId che ritorna tutto.
    // Idealmente dovremmo avere endpoint separati o filtri. 
    // Per semplicità ora mostriamo historyBookings come "Agenda" generale.
    const currentHistoryList = historyBookings;

    // --- HANDLERS ---
    const handleOperationSuccess = (msg) => {
        setSuccessMessage(msg);
        setSuccessModalOpen(true);
        fetchData().finally(() => setIsActionLoading(false)); // Reload data then stop loading
    };

    const handleAccept = async (id) => {
        setIsActionLoading(true);
        try {
            await restaurantService.acceptBooking(id);
            handleOperationSuccess(t('provider.success.booking_accepted', "Prenotazione accettata!"));
        } catch (err) {
            alert(t('provider.errors.generic_action', "Errore durante l'operazione."));
            setIsActionLoading(false);
        }
    };

    const handleReject = (bk) => { setSelectedBooking(bk); setCancelOpen(true); };
    const handleRectify = (bk) => { setSelectedBooking(bk); setCorrectionOpen(true); };

    const confirmCancel = async (id, reason) => {
        setIsActionLoading(true);
        try {
            if (selectedBooking.status === 'pending' || selectedBooking.status === 'waiting_customer') {
                await restaurantService.rejectBooking(id, reason);
            } else {
                await restaurantService.cancelBooking(id, reason);
            }
            setCancelOpen(false);
            handleOperationSuccess(t('provider.success.booking_cancelled', "Prenotazione cancellata/rifiutata."));
        } catch (err) {
            alert(t('provider.errors.generic_action', "Errore durante l'operazione."));
            setIsActionLoading(false);
        }
    };

    const confirmComplaint = async (id, reason) => {
        setIsActionLoading(true);
        try {
            await restaurantService.reportComplaint(id, reason);
            setComplaintOpen(false);
            handleOperationSuccess(t('provider.success.complaint_sent', "Segnalazione inviata."));
        } catch (err) {
            alert(t('provider.errors.generic_action', "Errore durante l'invio della segnalazione."));
            setIsActionLoading(false);
        }
    };

    const confirmCorrection = async (id, price, note) => {
        setIsActionLoading(true);
        try {
            await restaurantService.rectifyBooking(id, price, note);
            setCorrectionOpen(false);
            handleOperationSuccess(t('provider.success.correction_sent', "Proposta di correzione inviata."));
        } catch (err) {
            alert(t('provider.errors.generic_action', "Errore durante l'operazione."));
            setIsActionLoading(false);
        }
    };

    const handleFilterChange = (newFilter) => { setFilter(newFilter); setHistoryPage(1); };

    const isDefaultInfo = serviceData?.name === "Registrazione in corso..." || serviceData?.description === "Descrizione del servizio in aggiornamento.";

    if (isLoading) return <LoadingScreen isLoading={true} />;
    if (error) return (
        <div className="flex flex-col items-center justify-center py-20 text-center">
            <XCircle size={48} className="text-red-400 mb-4" />
            <h3 className="text-xl font-bold text-slate-800">{t('provider.errors.title', "Ops, qualcosa è andato storto")}</h3>
            <p className="text-slate-500 mb-6">{error}</p>
            <button onClick={() => window.location.reload()} className="text-[#68B49B] font-bold hover:underline">{t('provider.actions.retry', "Riprova")}</button>
        </div>
    );

    return (
        <>
            <LoadingScreen isLoading={isActionLoading} />

            {/* Modali e Overlay - FUORI dal container animato per evitare problemi di stacking context/fixed positioning */}
            {successModalOpen && (
                <FullModalBackdrop onClose={() => setSuccessModalOpen(false)}>
                    <div className="text-center">
                        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckCircle size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 mb-2">{t('provider.success.title', "Operazione Completata")}</h3>
                        <p className="text-slate-500 mb-6">{successMessage}</p>
                        <button
                            onClick={() => setSuccessModalOpen(false)}
                            className={`bg-[${HOGU_COLORS.primary}] text-white px-6 py-3 rounded-xl font-bold hover:bg-[#5aa38d] transition-colors w-full`}
                        >
                            {t('provider.actions.close', "Chiudi")}
                        </button>
                    </div>
                </FullModalBackdrop>
            )}

            {!isMobileOverlayOpen && (
                <MobileStickyTrigger
                    count={pendingListFull.length}
                    onClick={() => setIsMobileOverlayOpen(true)}
                />
            )}

            <MobilePendingBottomSheet
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
                onOpenDetails={(bk) => {
                    setIsMobileOverlayOpen(false);
                    setSelectedBooking(bk);
                    setDetailsOpen(true);
                }}
            />

            <LocalBookingDetailModal isOpen={detailsOpen} onClose={() => setDetailsOpen(false)} booking={selectedBooking} />
            <CancellationModal isOpen={cancelOpen} onClose={() => setCancelOpen(false)} onConfirm={confirmCancel} booking={selectedBooking} />
            <ComplaintModal isOpen={complaintOpen} onClose={() => setComplaintOpen(false)} onConfirm={confirmComplaint} booking={selectedBooking} />
            <PriceCorrectionModal isOpen={correctionOpen} onClose={() => setCorrectionOpen(false)} onConfirm={confirmCorrection} booking={selectedBooking} />
            <RestaurantManagementModal
                isOpen={isRestaurantModalOpen}
                onClose={() => setIsRestaurantModalOpen(false)}
                serviceData={serviceData}
                navigate={navigate}
            />

            {/* Contenuto Principale Animato */}
            <div className="space-y-6 md:space-y-10 animate-in fade-in pb-24 md:pb-12 relative">
                {/* Banner Profilo Incompleto */}
                {isDefaultInfo && (
                    <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded-xl shadow-sm mb-6 animate-in slide-in-from-top-4 duration-500">
                        <div className="flex items-center gap-3">
                            <AlertTriangle className="text-amber-500 shrink-0" size={24} />
                            <div className="flex-1">
                                <h3 className="text-sm font-bold text-amber-800">{t('provider.dashboard.banner.incomplete_profile', 'Profilo incompleto')}</h3>
                                <p className="text-xs text-amber-700">{t('provider.dashboard.banner.incomplete_profile_desc', 'Per poter gestire al meglio il tuo ristorante, aggiorna le informazioni base (Nome, Descrizione e Menu).')}</p>
                            </div>
                            <button
                                onClick={() => navigate(`/provider/edit/restaurant/${serviceData?.id || serviceData?.serviceId}`)}
                                className="ml-auto bg-amber-500 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-amber-600 transition-colors whitespace-nowrap"
                            >
                                {t('provider.dashboard.banner.update_now', 'Aggiorna Ora')}
                            </button>
                        </div>
                    </div>
                )}
                {/* 0. HEADER */}
                <div>
                    {/* 0a. Stats */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
                        <div className="lg:col-span-2">
                            <StatsSummary
                                activeCategory="restaurant"
                                revenue={stats.revenue}
                                count={stats.count}
                                title={t('provider.dashboard.stats.commissions_to_pay', "Commissioni da pagare")}
                                ctaLabel={t('provider.dashboard.stats.view_commissions_detail', "Vedi dettaglio commissioni")}
                                onCta={() => navigate('/provider/restaurant/commissions')}
                            />
                        </div>

                        {/* 0b. Colonna Azioni (Desktop Side, Mobile Top via Buttons below) */}
                        <div className="hidden lg:flex flex-col gap-4 h-full">
                            {/* A. Card SCANNER Desktop */}
                            <div
                                onClick={() => navigate('/provider/qr-validator?type=restaurant')}
                                className={`flex-1 min-h-[140px] bg-gradient-to-br from-[${HOGU_COLORS.dark}] to-slate-800 rounded-[2rem] p-6 text-white relative overflow-hidden group cursor-pointer shadow-xl shadow-slate-900/10 hover:shadow-2xl hover:-translate-y-1 transition-all flex flex-col justify-center`}
                            >
                                <div className="absolute -right-6 -top-6 text-white/5 group-hover:text-white/10 transition-colors pointer-events-none">
                                    <QrCode size={120} />
                                </div>
                                <div className="relative z-10">
                                    <div className="bg-white/10 w-fit p-2 rounded-xl backdrop-blur-md border border-white/10 mb-3">
                                        <ScanLine size={20} className={`text-[${HOGU_COLORS.primary}]`} />
                                    </div>
                                    <h3 className="text-xl font-bold mb-1">{t('provider.dashboard.restaurant_scanner_title', "Scanner Sala")}</h3>
                                    <p className="text-slate-400 text-xs font-medium">{t('provider.dashboard.restaurant_scanner_subtitle', "Clicca per scansionare ingressi.")}</p>
                                </div>
                                <div className={`absolute bottom-6 right-6 text-[${HOGU_COLORS.primary}] opacity-0 group-hover:opacity-100 transition-opacity`}>
                                    <ArrowRight size={24} />
                                </div>
                            </div>

                            {/* B. Card IMPOSTAZIONI Desktop */}
                            <button
                                onClick={() => setIsRestaurantModalOpen(true)}
                                className={`h-20 bg-white border border-slate-200 rounded-[1.5rem] px-6 flex items-center justify-between hover:bg-slate-50 hover:border-[${HOGU_COLORS.primary}]/50 transition-all group shadow-sm hover:shadow-md cursor-pointer`}
                            >
                                <div className="flex items-center gap-3 text-left">
                                    <div className={`p-2.5 bg-slate-100 rounded-xl group-hover:bg-[${HOGU_COLORS.primary}]/10 group-hover:text-[${HOGU_COLORS.primary}] transition-colors text-slate-600`}>
                                        <Store size={20} />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-slate-800 text-sm">{t('provider.dashboard.your_restaurant', "Il tuo Ristorante")}</h4>
                                        <p className="text-slate-400 text-xs">{t('provider.dashboard.manage_restaurant', "Gestisci ristorante")}</p>
                                    </div>
                                </div>
                                <Settings size={18} className={`text-slate-300 group-hover:text-[${HOGU_COLORS.primary}] transition-colors`} />
                            </button>
                        </div>
                    </div>

                    {/* 0c. Azioni Rapide SOLO MOBILE (Sostituiscono la colonna laterale desktop) */}
                    <div className="grid grid-cols-2 gap-3 lg:hidden mb-6 mt-4 md:mt-0">
                        <button onClick={() => navigate('/provider/qr-validator?type=restaurant')} className="bg-[#1a1a1a] text-white p-4 rounded-2xl flex flex-col items-center justify-center gap-2 shadow-lg">
                            <QrCode size={24} />
                            <span className="text-xs font-bold">{t('provider.dashboard.scanner_short', "Scanner")}</span>
                        </button>
                        <button
                            onClick={() => setIsRestaurantModalOpen(true)}
                            className="bg-white text-slate-700 p-4 rounded-2xl flex flex-col items-center justify-center gap-2 border border-slate-100 shadow-sm transition-colors"
                        >
                            <Settings size={24} />
                            <span className="text-xs font-bold">{t('provider.dashboard.restaurant_short', "Ristorante")}</span>
                        </button>
                    </div>
                </div>

                {/* 1. SEZIONE PRIORITARIA: RICHIESTE TAVOLI (Pending) */}
                {/* Nascosto su Mobile (md:block) perché gestito dall'Overlay */}
                <section className="relative hidden md:block">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                        <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-2xl border ${pendingListFull.length > 0 ? 'bg-amber-50 border-amber-100 text-amber-600' : 'bg-slate-50 border-slate-100 text-slate-400'}`}>
                                <BellRing size={28} className={pendingListFull.length > 0 ? 'animate-bounce' : ''} />
                            </div>
                            <div>
                                <h2 className={`text-2xl font-extrabold text-[${HOGU_COLORS.dark}]`}>{t('provider.dashboard.pending_section_title', "Gestione Sala")}</h2>
                                <p className="text-sm text-slate-500 font-medium">
                                    {pendingListFull.length > 0 ? t('provider.dashboard.pending_message', "Richieste tavoli da confermare.") : t('provider.dashboard.no_pending', "Nessuna richiesta in sospeso.")}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                            <PaginationControls
                                currentPage={pendingPage}
                                totalPages={totalPendingPages}
                                onNext={() => setPendingPage(p => p + 1)}
                                onPrev={() => setPendingPage(p => p - 1)}
                            />
                        </div>
                    </div>

                    {/* Cards Grid */}
                    {currentPendingList.length > 0 ? (
                        <div className="p-1.5 rounded-[2rem] bg-gradient-to-br from-amber-400/20 via-orange-100/10 to-transparent">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {currentPendingList.map(b => (
                                    <LocalPendingRequestCard
                                        key={b.id}
                                        booking={b}
                                        activeCategory="restaurant"
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
                            <h3 className="text-lg font-bold text-emerald-800">{t('provider.dashboard.all_clear_title', "Sala Aggiornata")}</h3>
                            <p className="text-emerald-600/70">{t('provider.dashboard.all_clear_subtitle', "Tutte le richieste sono state gestite.")}</p>
                        </div>
                    )}
                </section>

                <div className="hidden md:block border-t border-slate-100 my-8"></div>

                {/* 2. STORICO E AGENDA */}
                <section>
                    <div className="flex flex-col sm:flex-row justify-between items-end sm:items-center gap-4 mb-6">
                        <div className="w-full">
                            <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-slate-800 flex items-center gap-2 text-left">
                                <Calendar size={22} className={`text-[${HOGU_COLORS.primary}]`} /> {t('provider.dashboard.history_title', "Agenda Prenotazioni")}
                            </h2>
                            <p className="text-xs text-slate-400 mt-1 font-medium">
                                {filter === 'active'
                                    ? t('provider.dashboard.agenda_desc_active', "Include tutti i check-in programmati da oggi in avanti, comprese le prenotazioni eventualmente annullate durante la giornata.")
                                    : t('provider.dashboard.agenda_desc_past', "Riservato esclusivamente allo storico delle prenotazioni con check-in precedente ad oggi.")
                                }
                            </p>
                        </div>

                        <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                            {/* Filter Buttons */}
                            <div className="flex bg-white p-1 rounded-2xl border border-slate-200 shadow-sm">
                                <button
                                    onClick={() => handleFilterChange('active')}
                                    className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wide transition-all ${filter === 'active' ? `bg-[${HOGU_COLORS.primary}] text-white shadow-md` : 'text-slate-400 hover:bg-slate-50'}`}
                                >
                                    {t('provider.filters.active', "In Arrivo")}
                                </button>
                                <button
                                    onClick={() => handleFilterChange('past')}
                                    className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wide transition-all ${filter === 'past' ? 'bg-slate-800 text-white shadow-md' : 'text-slate-400 hover:bg-slate-50'}`}
                                >
                                    {t('provider.filters.past', "Archivio")}
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

                    <div className="flex flex-col gap-4">
                        {currentHistoryList.length > 0 ? (
                            currentHistoryList.map(b => (
                                <LocalProviderBookingCard
                                    key={b.id}
                                    booking={b}
                                    activeCategory="restaurant"
                                    onOpenDetails={(bk) => { setSelectedBooking(bk); setDetailsOpen(true); }}
                                    onOpenComplaint={(bk) => { setSelectedBooking(bk); setComplaintOpen(true); }}
                                    onCancelBooking={(bk) => { setSelectedBooking(bk); setCancelOpen(true); }}
                                />
                            ))
                        ) : (
                            <div className="py-12 bg-white rounded-3xl border border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400">
                                <ListTodo size={48} className="mx-auto mb-4 opacity-20" />
                                <p className="font-medium">{t('no_bookings.title', "Nessuna prenotazione trovata.")}</p>
                            </div>
                        )}
                    </div>
                </section>
            </div>
        </>
    );
};

export default RestaurantDashboard;

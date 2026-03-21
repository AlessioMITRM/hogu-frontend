import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Calendar, Clock, ChevronLeft, ChevronRight, Eye, MoreVertical,
    AlertTriangle, Ban, BellRing, Edit2, CheckCircle, XCircle,
    User, Wallet, Activity, ScanLine,
    Phone, ListTodo, RefreshCw, Send, ChevronUp, X,
    Luggage, PackageCheck,
    Settings, History, QrCode, ArrowRight, Box, Loader2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import CurrencyInput from 'react-currency-input-field';

// Helper per formattare i prezzi (Globale)
const formatPrice = (value, locale = 'it-IT') => {
    if (value === undefined || value === null) return '0,00';
    const num = typeof value === 'string' ? parseFloat(value.replace(',', '.')) : value;
    if (isNaN(num)) return '0,00';
    return num.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

import { HOGU_COLORS } from '../../../../../config/theme.js';
import { luggageService } from '../../../../../api/apiClient.js';
import LoadingScreen from '../../../../ui/LoadingScreen';
import SafeImage from '../../../../ui/SafeImage.jsx';

import SuccessModal from '../../../../ui/SuccessModal';
import ErrorModal from '../../../../ui/ErrorModal';

// =================================================================================
// 1. CONFIGURAZIONE & COSTANTI
// =================================================================================
const getServiceCategories = (t) => ({
    STORAGE: { id: 'storage', label: t('dashboard:provider.categories.storage'), icon: Luggage, unit: t('dashboard:provider.categories.units.bags') }
});

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
                className="bg-white w-full h-full p-4 md:p-8 rounded-none shadow-2xl shadow-black/20 transform animate-in zoom-in-95 duration-200"
                style={{ overflowY: 'auto' }}
                onClick={e => e.stopPropagation()}
            >
                {children}
            </div>
        </div>
    );
};

const ModalBackdrop = ({ children, onClose }) => (
    <div
        className={`fixed inset-0 bg-[${HOGU_COLORS.dark}]/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200 h-screen`}
        style={{ zIndex: 999 }}
        onClick={onClose}
    >
        <div className="bg-white p-8 rounded-[2.5rem] w-full max-w-2xl shadow-2xl shadow-black/20 transform animate-in zoom-in-95 duration-200 mx-4" onClick={e => e.stopPropagation()}>
            {children}
        </div>
    </div>
);

const PaginationControls = ({ currentPage, totalPages, onNext, onPrev, darkBg = false }) => {
    if (totalPages <= 1) return null;
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
    const { t } = useTranslation(['dashboard']);
    // Mappatura completa degli stati dal Backend (BookingStatus.java)
    const styles = {
        // 1. STATI CONFERMATI / PAGATI (Verde)
        FULL_PAYMENT_COMPLETED: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-100', label: t('dashboard:provider.status.payment_completed') },
        COMPLETED: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-100', label: t('dashboard:provider.status.completed') },

        // 2. STATI IN ATTESA (Giallo/Amber)
        PENDING: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-100', label: t('dashboard:provider.status.pending') },
        PAYMENT_AUTHORIZED: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-100', label: t('dashboard:provider.status.pending') },
        WAITING_PROVIDER_CONFIRMATION: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-100', label: t('dashboard:provider.status.pending') },
        WAITING_CUSTOMER_PAYMENT: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-100', label: t('dashboard:provider.status.waiting_customer') },

        // 3. STATI CANCELLATI / ANNULLATI (Rosso)
        CANCELLED_BY_PROVIDER: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-100', label: t('dashboard:provider.status.cancelled') },
        CANCELLED_BY_ADMIN: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-100', label: t('dashboard:provider.status.cancelled') },
        MODIFIED_BY_PROVIDER: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-100', label: t('dashboard:provider.status.cancelled') },

        // 4. ALTRI (Bianco con propria descrizione)
        REFUNDED_BY_ADMIN: { bg: 'bg-white', text: 'text-slate-600', border: 'border-slate-200', label: t('dashboard:provider.status.refunded') },
        CONFIRMED: { bg: 'bg-white', text: 'text-slate-600', border: 'border-slate-200', label: t('dashboard:provider.status.confirmed') },
    };

    // Normalizza lo status (uppercase) per evitare problemi case-sensitive
    const normalizedStatus = status ? status.toUpperCase() : 'UNKNOWN';

    // Fallback intelligente: se lo stato non è mappato, usa un grigio generico ma mostra il testo dello stato
    const style = styles[normalizedStatus] || { bg: 'bg-gray-100', text: 'text-gray-600', border: 'border-gray-200', label: normalizedStatus };

    return (
        <span className={`px-2.5 py-1 rounded-full text-[10px] md:text-xs uppercase tracking-wider font-bold border ${style.bg} ${style.text} ${style.border} whitespace-nowrap`}>
            {style.label}
        </span>
    );
};

const formatDateLabel = (isoString, locale = 'it-IT', fallbackLabel = 'N/D') => {
    if (!isoString) return fallbackLabel;
    const d = new Date(isoString);
    if (Number.isNaN(d.getTime())) return fallbackLabel;
    return d.toLocaleDateString(locale, { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const formatTimeLabel = (isoString, locale = 'it-IT', fallbackLabel = 'N/D') => {
    if (!isoString) return fallbackLabel;
    const d = new Date(isoString);
    if (Number.isNaN(d.getTime())) return fallbackLabel;
    return d.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
};

const formatTimeRange = (startIso, endIso, locale = 'it-IT', fallbackLabel = 'N/D') => {
    const start = formatTimeLabel(startIso, locale, fallbackLabel);
    const end = formatTimeLabel(endIso, locale, fallbackLabel);
    if (start === fallbackLabel && end === fallbackLabel) return fallbackLabel;
    if (start === fallbackLabel) return end;
    if (end === fallbackLabel) return start;
    return `${start} - ${end}`;
};

const CategorySpecificDetails = ({ booking, category }) => {
    const { t, i18n } = useTranslation(['dashboard']);
    const locale = i18n.language === 'en' ? 'en-US' : 'it-IT';
    const notSpecified = t('dashboard:provider.booking_details.not_specified');
    const catKey = category?.toUpperCase();
    const config = getServiceCategories(t)[catKey] || getServiceCategories(t).STORAGE;
    const Icon = config.icon;
    const totalBags =
        (booking.bagsSmall || 0) +
        (booking.bagsMedium || 0) +
        (booking.bagsLarge || 0);
    const detailText = `${t('dashboard:provider.storage.bag_count', { count: totalBags })} • ${formatTimeRange(booking.dropOffTime, booking.pickUpTime, locale, notSpecified)}`;
    return (
        <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-medium">
            <Icon size={12} /> {detailText}
        </div>
    );
};

const StatsSummary = ({ activeCategory, revenue = 0, count = 0 }) => {
    const { t, i18n } = useTranslation(['dashboard']);
    const locale = i18n.language === 'en' ? 'en-US' : 'it-IT';
    const label = getServiceCategories(t)[activeCategory?.toUpperCase()]?.label || t('dashboard:provider.categories.storage');
    const priceStr = formatPrice(revenue, locale);
    const separator = priceStr.includes(',') ? ',' : '.';
    const [intPart, decPart] = priceStr.split(separator);
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
            <div className={`md:col-span-1 bg-[${HOGU_COLORS.dark}] rounded-[2rem] p-6 text-white relative overflow-hidden shadow-xl shadow-slate-900/10 group`}>
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform duration-500"><Wallet size={100} /></div>
                <div className="relative z-10">
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">{t('dashboard:provider.stats.revenue', { label })}</p>
                    <h3 className="text-3xl font-extrabold mb-4">€ {intPart}<span className="text-slate-500 text-lg">{separator}{decPart || '00'}</span></h3>
                </div>
            </div>
            <div className={`bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col justify-center relative overflow-hidden group hover:border-[${HOGU_COLORS.primary}]/30 hover:shadow-lg transition-all`}>
                <div className={`absolute -right-4 -bottom-4 text-slate-50 opacity-50 group-hover:text-[${HOGU_COLORS.primary}]/10 transition-colors`}><Activity size={100} /></div>
                <div className="flex items-center gap-2 text-slate-400 mb-2">
                    <Activity size={18} /> <span className="text-xs font-bold uppercase">{t('dashboard:provider.stats.bookings')}</span>
                </div>
                <span className={`text-4xl font-black text-slate-800 group-hover:text-[${HOGU_COLORS.primary}] transition-colors`}>{count}</span>
                <p className="text-xs text-slate-400 mt-2 font-medium">{t('dashboard:provider.stats.monthly_total')}</p>
            </div>
        </div>
    );
};

const MobileStickyTrigger = ({ count, onClick }) => {
    const { t } = useTranslation(['dashboard']);
    if (count === 0) return null;
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

const MobilePendingFullPage = ({ isOpen, onClose, pendingList, onAccept, onReject, onOpenDetails }) => {
    const { t } = useTranslation(['dashboard']);
    useEffect(() => {
        if (isOpen) { document.body.style.overflow = 'hidden'; }
        else { document.body.style.overflow = 'unset'; }
        return () => { document.body.style.overflow = 'unset'; };
    }, [isOpen]);
    return (
        <div className={`fixed inset-0 z-[100] bg-[#f8f9fc] flex flex-col md:hidden transition-transform duration-300 ease-out ${isOpen ? 'translate-y-0' : 'translate-y-[110%]'}`}>
            <div className={`bg-[${HOGU_COLORS.dark}] text-white pt-10 pb-4 px-4 rounded-b-[2.5rem] shadow-xl shrink-0 relative z-20`}>
                <div className="flex items-start justify-between">
                    <div>
                        <h2 className="text-xl font-extrabold mb-1 text-left">{t('dashboard:provider.storage.requests_title', { count: pendingList.length })}</h2>
                        <p className="text-slate-400 text-xs">{t('dashboard:provider.storage.requests_subtitle')}</p>
                    </div>
                    <button onClick={onClose} className="bg-white/10 p-2.5 rounded-full hover:bg-white/20 transition-colors">
                        <X size={20} />
                    </button>
                </div>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-3 pb-0">
                {pendingList.length > 0 ? (
                    pendingList.map(b => (
                        <PendingRequestCard
                            key={b.id}
                            booking={b}
                            onAccept={(id) => { onAccept(id); if (pendingList.length === 1) onClose(); }}
                            onReject={onReject}
                            onOpenDetails={onOpenDetails}
                        />
                    ))
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400">
                        <CheckCircle size={48} className="mb-4 text-emerald-500 opacity-50" />
                        <p className="font-bold text-slate-500">{t('dashboard:provider.mobile.all_done')}</p>
                        <p className="text-xs mt-1">{t('dashboard:provider.storage.no_pending')}</p>
                        <button onClick={onClose} className="mt-6 text-emerald-600 font-bold text-sm bg-emerald-50 px-6 py-3 rounded-xl">{t('dashboard:provider.storage.back_to_dashboard')}</button>
                    </div>
                )}
            </div>
        </div>
    );
};

const PendingRequestCard = ({ booking, onAccept, onReject, onOpenDetails }) => {
    const { t, i18n } = useTranslation(['dashboard']);
    const locale = i18n.language === 'en' ? 'en-US' : 'it-IT';
    const notSpecified = t('dashboard:provider.booking_details.not_specified');
    const status = booking.status ? booking.status.toString().toUpperCase() : '';
    const isWaitingCustomer = status === 'WAITING_CUSTOMER_PAYMENT';
    const price = booking.totalAmount ?? booking.totalPrice ?? booking.price;
    const dateStr = formatDateLabel(booking.dropOffTime, locale, notSpecified);
    const timeStr = formatTimeRange(booking.dropOffTime, booking.pickUpTime, locale, notSpecified);
    const totalBags =
        (booking.bagsSmall || 0) +
        (booking.bagsMedium || 0) +
        (booking.bagsLarge || 0);
    const bagsLabel = t('dashboard:provider.storage.bag_count', { count: totalBags });

    return (
        <div
            className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all active:scale-[0.99]
            ${isWaitingCustomer ? 'border-blue-100' : 'border-slate-100'}`}
        >
            <div className={`h-0.5 w-full ${isWaitingCustomer ? 'bg-blue-400' : 'bg-gradient-to-r from-amber-400 to-orange-400'}`} />

            <div className="p-3">
                <div className="flex items-center gap-3 mb-2.5">
                    <div className="relative shrink-0">
                        <div className="w-11 h-11 rounded-xl bg-amber-400 flex items-center justify-center text-white ring-2 ring-white shadow-sm">
                            <Luggage size={18} />
                        </div>
                    </div>

                    <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-1">
                            <h4 className="font-bold text-slate-800 text-sm leading-tight truncate">
                                {t('dashboard:provider.storage.booking_number', { id: booking.id })}
                            </h4>
                            <span
                                className={`font-extrabold text-sm shrink-0 ml-1 ${isWaitingCustomer ? 'text-blue-600' : `text-[${HOGU_COLORS.dark}]`
                                    }`}
                            >
                                € {formatPrice(price, locale)}
                            </span>
                        </div>
                        <p
                            className={`text-[11px] font-semibold truncate mt-0.5 text-[${HOGU_COLORS.primary}]`}
                        >
                            {booking.serviceName}
                        </p>
                        <div className="mt-1 space-y-0.5">
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] text-slate-400 font-medium">
                                <span className="flex items-center gap-1">
                                    <Calendar size={10} className="shrink-0" /> {dateStr}
                                </span>
                                <span className="flex items-center gap-1">
                                    <Clock size={10} className="shrink-0" /> {timeStr}
                                </span>
                            </div>
                            <div className="flex items-center gap-1 text-[10px] text-slate-400 font-medium">
                                <Luggage size={10} className="shrink-0" /> {bagsLabel}
                            </div>
                        </div>
                    </div>
                </div>

                {isWaitingCustomer ? (
                    <div className="w-full bg-blue-50 text-blue-500 py-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 border border-blue-100">
                        <Clock size={12} className="animate-pulse" /> {t('dashboard:provider.dashboard.waiting_customer')}
                    </div>
                ) : (
                    <div className="flex gap-2">
                        <button
                            onClick={() => onAccept(booking.id)}
                            className={`flex-1 bg-[${HOGU_COLORS.primary}] text-white py-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all shadow-sm`}
                        >
                            <CheckCircle size={12} /> {t('dashboard:provider.actions.accept')}
                        </button>
                        <button
                            onClick={() => onReject(booking)}
                            className="flex-1 py-2 bg-red-50 text-red-500 border border-red-100 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all"
                        >
                            <Ban size={12} /> {t('dashboard:provider.actions.cancel')}
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

const ProviderBookingCard = ({ booking, onOpenDetails, onOpenComplaint, onCancelBooking, activeCategory }) => {
    const { t, i18n } = useTranslation(['dashboard']);
    const locale = i18n.language === 'en' ? 'en-US' : 'it-IT';
    const notSpecified = t('dashboard:provider.booking_details.not_specified');
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setIsMenuOpen(false); };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const fullNameFromParts =
        booking.customerFirstName || booking.customerLastName
            ? `${booking.customerFirstName || ''} ${booking.customerLastName || ''}`.trim()
            : null;
    const title = booking.customerName ?? fullNameFromParts ?? booking.bookingFullName ?? t('dashboard:provider.storage.booking_number', { id: booking.id });
    const price = booking.totalAmount ?? booking.totalPrice ?? booking.price;
    const dateStr = formatDateLabel(booking.dropOffTime || booking.creationDate, locale, notSpecified);
    const timeStr = formatTimeRange(booking.dropOffTime, booking.pickUpTime, locale, notSpecified);
    const imageUrl = booking.customerImage ?? booking.image;

    return (
        <div className={`rounded-3xl border p-5 flex flex-col sm:flex-row gap-6 transition-all duration-300 relative group bg-white border-slate-100 hover:border-[${HOGU_COLORS.primary}]/30 hover:shadow-lg hover:shadow-slate-200/50`}>
            <div className="relative shrink-0">
                {imageUrl ? (
                    <SafeImage src={imageUrl} alt="" className="w-14 h-14 rounded-2xl object-cover shadow-sm ring-2 ring-white grayscale" />
                ) : (
                    <div className="w-14 h-14 rounded-2xl bg-slate-200 flex items-center justify-center text-slate-500 ring-2 ring-white shadow-sm grayscale">
                        <User size={20} />
                    </div>
                )}
            </div>
            <div className="flex-1 flex flex-col justify-between">
                <div className="flex justify-between items-start mb-2">
                    <div>
                        <h4 className={`font-bold text-lg text-[${HOGU_COLORS.dark}]`}>{title}</h4>
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{booking.serviceName}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <StatusBadge status={booking.status} />
                        <button onClick={() => onOpenDetails(booking)} className={`w-8 h-8 flex items-center justify-center rounded-full transition-all ml-1 shadow-sm bg-slate-50 text-slate-400 hover:bg-[${HOGU_COLORS.primary}] hover:text-white`}><Eye size={16} /></button>
                        {booking.status === 'confirmed' && (
                            <div className="relative" ref={menuRef}>
                                <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"><MoreVertical size={18} /></button>
                                {isMenuOpen && (
                                    <div className="absolute right-0 top-full mt-2 w-48 bg-white shadow-xl shadow-slate-200/60 border border-slate-100 rounded-2xl p-1.5 z-50 animate-in fade-in zoom-in-95 origin-top-right">
                                        <button onClick={() => { setIsMenuOpen(false); onCancelBooking(booking); }} className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-bold hover:bg-rose-50 text-slate-600 hover:text-rose-600 rounded-xl transition-colors"><Ban size={14} /> {t('dashboard:provider.actions.cancel_booking')}</button>
                                        <button onClick={() => { setIsMenuOpen(false); onOpenComplaint(booking); }} className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-bold hover:bg-amber-50 text-slate-600 hover:text-amber-600 rounded-xl transition-colors"><AlertTriangle size={14} /> {t('dashboard:provider.actions.report_problem')}</button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
                <div className="flex items-center justify-between mt-auto pt-3 border-t border-slate-50">
                    <div className="flex gap-4 text-xs font-semibold tracking-wide text-slate-500">
                        <span className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-slate-50"><Calendar size={12} className={`text-[${HOGU_COLORS.primary}]`} /> {dateStr}</span>
                        <span className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-slate-50"><Clock size={12} className={`text-[${HOGU_COLORS.primary}]`} /> {timeStr}</span>
                    </div>
                    <span className={`font-extrabold text-lg text-[${HOGU_COLORS.dark}]`}>€ {formatPrice(price, locale)}</span>
                </div>
            </div>
        </div>
    );
};

const BookingDetailModal = ({ isOpen, onClose, booking }) => {
    const { t, i18n } = useTranslation(['dashboard']);
    const locale = i18n.language === 'en' ? 'en-US' : 'it-IT';
    const notSpecified = t('dashboard:provider.booking_details.not_specified');
    const [imgError, setImgError] = useState(false);
    useEffect(() => {
        if (isOpen) setImgError(false);
    }, [isOpen, booking?.id]);
    if (!isOpen || !booking) return null;
    const price = booking.totalAmount ?? booking.totalPrice ?? booking.price;
    const dateStr = formatDateLabel(booking.dropOffTime || booking.creationDate, locale, notSpecified);
    const timeStr = formatTimeRange(booking.dropOffTime, booking.pickUpTime, locale, notSpecified);
    const dropStr = booking.dropOffTime ? formatTimeLabel(booking.dropOffTime, locale, notSpecified) : (booking.time ? booking.time.split('-')[0] : notSpecified);
    const pickStr = booking.pickUpTime ? formatTimeLabel(booking.pickUpTime, locale, notSpecified) : (booking.time && booking.time.includes('-') ? booking.time.split('-')[1] : notSpecified);
    const totalBags = (booking.bagsSmall || 0) + (booking.bagsMedium || 0) + (booking.bagsLarge || 0);
    const smallBags = booking.baggageDetails ? booking.baggageDetails.small : (booking.bagsSmall || 0);
    const mediumBags = booking.baggageDetails ? booking.baggageDetails.medium : (booking.bagsMedium || 0);
    const largeBags = booking.baggageDetails ? booking.baggageDetails.large : (booking.bagsLarge || 0);
    return (
        <FullModalBackdrop onClose={onClose}>
            <div className="flex flex-col md:flex-row gap-8">
                <div className="w-full md:w-1/3 flex flex-col items-center text-center border-b md:border-b-0 md:border-r border-slate-100 pb-6 md:pb-0 md:pr-6">
                    <div className="relative mb-4">
                        {(!imgError && (booking?.customerImage || booking?.image)) ? (
                            <SafeImage
                                src={booking?.customerImage ?? booking?.image}
                                className="w-28 h-28 rounded-3xl object-cover shadow-xl ring-4 ring-white"
                                alt=""
                            />
                        ) : (
                            <div className="w-28 h-28 rounded-3xl bg-slate-200 flex items-center justify-center text-slate-500 ring-4 ring-white shadow-xl">
                                <User size={36} />
                            </div>
                        )}
                        <div className="absolute -bottom-2 -right-2 bg-white p-1.5 rounded-xl shadow-sm"><StatusBadge status={booking?.status} /></div>
                    </div>
                    <h2 className={`font-extrabold text-2xl text-[${HOGU_COLORS.dark}] mb-1`}>{booking?.customerName ?? booking?.bookingFullName ?? t('dashboard:provider.storage.booking_number', { id: booking?.id })}</h2>
                    <p className={`text-[${HOGU_COLORS.primary}] font-bold text-sm mb-4`}>{booking?.serviceName}</p>
                    {booking?.phone && <a href={`tel:${booking.phone}`} className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-xl text-slate-600 text-sm font-bold hover:bg-slate-100 transition-colors w-full justify-center"><Phone size={16} /> {booking.phone}</a>}
                </div>
                <div className="flex-1">
                    <h3 className={`text-lg font-bold text-[${HOGU_COLORS.dark}] mb-4 flex items-center gap-2`}><ListTodo size={20} className="text-slate-400" /> {t('dashboard:provider.storage.detail_title')}</h3>
                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100"><span className="text-[10px] uppercase text-slate-400 font-bold tracking-wider block mb-1">{t('dashboard:provider.booking_details.date')}</span><div className="flex items-center gap-2 font-bold text-slate-700 text-lg"><Calendar size={18} className={`text-[${HOGU_COLORS.primary}]`} /> {dateStr}</div></div>
                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100"><span className="text-[10px] uppercase text-slate-400 font-bold tracking-wider block mb-1">{t('dashboard:provider.booking_details.time')}</span><div className="flex items-center gap-2 font-bold text-slate-700 text-lg"><Clock size={18} className={`text-[${HOGU_COLORS.primary}]`} /> {timeStr}</div></div>
                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                            <span className="text-[10px] uppercase text-slate-400 font-bold tracking-wider block mb-1">{t('dashboard:provider.booking_details.guests')}</span>
                            <div className="flex items-center gap-2 font-bold text-slate-700 text-lg">
                                <User size={18} className={`text-[${HOGU_COLORS.primary}]`} />
                                {(booking?.guests || 1)} {t('dashboard:provider.booking_details.guest', { count: booking?.guests || 1 })}
                            </div>
                        </div>
                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100"><span className="text-[10px] uppercase text-slate-400 font-bold tracking-wider block mb-1">{t('dashboard:provider.booking_details.total')}</span><div className={`flex items-center gap-2 font-extrabold text-[${HOGU_COLORS.dark}] text-lg`}>€ {formatPrice(price, locale)}</div></div>
                        <div className="col-span-2 space-y-4 mt-2">
                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex justify-between gap-4">
                                <div className="flex-1">
                                    <span className="text-[10px] uppercase text-slate-400 font-bold tracking-wider block mb-1">{t('dashboard:provider.storage.dropoff')}</span>
                                    <div className="font-bold text-slate-700 text-sm">{dropStr}</div>
                                </div>
                                <div className="w-px bg-slate-200"></div>
                                <div className="flex-1">
                                    <span className="text-[10px] uppercase text-slate-400 font-bold tracking-wider block mb-1">{t('dashboard:provider.storage.pickup')}</span>
                                    <div className="font-bold text-slate-700 text-sm">{pickStr}</div>
                                </div>
                            </div>
                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                <span className="text-[10px] uppercase text-slate-400 font-bold tracking-wider block mb-3">{t('dashboard:provider.booking_details.luggage_details')}</span>
                                <div className="grid grid-cols-3 gap-2">
                                    <div className="flex flex-col items-center bg-white p-2 rounded-xl border border-slate-100 shadow-sm">
                                        <Luggage size={16} className="text-slate-400 mb-1" />
                                        <span className="text-xs text-slate-500 font-medium">{t('dashboard:provider.storage.size_small')}</span>
                                        <span className="text-lg font-bold text-slate-800">{smallBags}</span>
                                    </div>
                                    <div className="flex flex-col items-center bg-white p-2 rounded-xl border border-slate-100 shadow-sm">
                                        <Luggage size={16} className="text-slate-500 mb-1" />
                                        <span className="text-xs text-slate-500 font-medium">{t('dashboard:provider.storage.size_medium')}</span>
                                        <span className="text-lg font-bold text-slate-800">{mediumBags}</span>
                                    </div>
                                    <div className="flex flex-col items-center bg-white p-2 rounded-xl border border-slate-100 shadow-sm">
                                        <Luggage size={16} className="text-slate-600 mb-1" />
                                        <span className="text-xs text-slate-500 font-medium">{t('dashboard:provider.storage.size_large')}</span>
                                        <span className="text-lg font-bold text-slate-800">{largeBags}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 mt-4">
                                    <div className={`w-10 h-10 bg-[${HOGU_COLORS.primary}]/20 rounded-xl flex items-center justify-center text-[${HOGU_COLORS.primary}]`}>
                                        <Luggage size={20} />
                                    </div>
                                    <div>
                                        <p className={`text-xs text-[${HOGU_COLORS.primary}] font-bold uppercase`}>{t('dashboard:provider.storage.total_items')}</p>
                                        <p className="font-extrabold text-slate-800 text-lg leading-none">{t('dashboard:provider.storage.pieces_count', { count: totalBags })}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-3 mt-auto">
                        <button onClick={onClose} className="flex-1 py-3.5 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-colors">{t('dashboard:provider.actions.close')}</button>
                    </div>
                </div>
            </div>
        </FullModalBackdrop>
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
                <h2 className={`font-bold text-xl text-[${HOGU_COLORS.dark}] mb-2 text-center`}>{t('dashboard:provider.modals.complaint.title')}</h2>
                <textarea className="w-full border border-slate-200 p-4 rounded-xl mb-6 bg-slate-50 focus:ring-2 focus:ring-amber-100 outline-none transition-all text-sm" rows="3" placeholder={t('dashboard:provider.modals.complaint.placeholder')} value={reason} onChange={e => setReason(e.target.value)} />
                <button onClick={() => onConfirm(booking.id, reason)} disabled={!reason.trim()} className="w-full bg-amber-500 text-white py-3 rounded-xl font-bold text-sm hover:bg-amber-600 transition-all">{t('dashboard:provider.modals.complaint.submit')}</button>
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
                <h2 className={`font-bold text-xl text-[${HOGU_COLORS.dark}] mb-2 text-center`}>{t('dashboard:provider.modals.cancellation.title')}</h2>
                <textarea className="w-full border border-slate-200 p-4 rounded-xl mb-6 bg-slate-50 focus:ring-2 focus:ring-red-100 outline-none transition-all text-sm" rows="3" placeholder={t('dashboard:provider.modals.cancellation.placeholder')} value={reason} onChange={e => setReason(e.target.value)} />
                <div className="flex gap-3">
                    <button onClick={onClose} className="flex-1 bg-slate-100 text-slate-600 py-3 rounded-xl font-bold text-sm">{t('dashboard:provider.actions.back')}</button>
                    <button onClick={() => onConfirm(booking.id, reason)} className="flex-1 bg-red-500 text-white py-3 rounded-xl font-bold text-sm hover:bg-red-600 transition-all">{t('dashboard:provider.actions.confirm')}</button>
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
                <h2 className={`font-bold text-xl text-[${HOGU_COLORS.dark}] mb-2 text-center`}>{t('dashboard:provider.modals.correction.title')}</h2>
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
                    <textarea className="w-full border border-slate-200 p-4 rounded-xl bg-slate-50 focus:ring-2 focus:ring-amber-100 outline-none text-sm" rows="3" value={note} onChange={e => setNote(e.target.value)} />
                </div>
                <div className="flex gap-3">
                    <button onClick={onClose} className="flex-1 bg-slate-100 text-slate-600 py-3 rounded-xl font-bold text-sm">{t('dashboard:provider.actions.cancel')}</button>
                    <button onClick={() => onConfirm(booking.id, newPrice, note)} className="flex-1 bg-amber-500 text-white py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2"><Send size={16} /> {t('dashboard:provider.actions.send')}</button>
                </div>
            </div>
        </ModalBackdrop>
    );
};

// =================================================================================
// 3. MAIN COMPONENT - LUGGAGE DASHBOARD
// =================================================================================
const LuggageDashboard = () => {
    const { t } = useTranslation(['dashboard']);
    const navigate = useNavigate();
    const [bookings, setBookings] = useState([]);
    const [serviceId, setServiceId] = useState(null);
    const [info, setInfo] = useState(null);
    const [stats, setStats] = useState({ revenue: 0, count: 0 });
    const [isMobileOverlayOpen, setIsMobileOverlayOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [pendingPage, setPendingPage] = useState(1);
    const [historyPage, setHistoryPage] = useState(1);
    const ITEMS_PER_PAGE = 3;
    const [filter, setFilter] = useState('active');
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [detailsOpen, setDetailsOpen] = useState(false);
    const [complaintOpen, setComplaintOpen] = useState(false);
    const [cancelOpen, setCancelOpen] = useState(false);
    const [correctionOpen, setCorrectionOpen] = useState(false);
    const [successModalOpen, setSuccessModalOpen] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [errorModalOpen, setErrorModalOpen] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [errorDetails, setErrorDetails] = useState(null);

    useEffect(() => {
        const init = async () => {
            try {
                const infoData = await luggageService.getInfoProvider();
                if (infoData && infoData.serviceId) {
                    setServiceId(infoData.serviceId);
                    setInfo(infoData);
                    setStats({
                        revenue: infoData.totalBookingsAmount || 0,
                        count: infoData.totalBookings || 0
                    });
                }
            } catch (err) {
                console.error("Error fetching info:", err);
            }
        };
        init();
    }, []);

    const fetchBookings = useCallback(async (id) => {
        const targetId = id || serviceId;
        if (!targetId) return;
        try {
            const response = await luggageService.getBookings(targetId, 0, 100);
            if (response && response.content) {
                setBookings(response.content);
            } else if (Array.isArray(response)) {
                setBookings(response);
            }
        } catch (err) {
            console.error("Error fetching bookings:", err);
        }
    }, [serviceId]);

    useEffect(() => {
        if (serviceId) {
            fetchBookings(serviceId);
        }
    }, [fetchBookings, serviceId]);

    const handleAccept = async (id) => {
        try {
            setLoading(true);
            await luggageService.acceptBooking(id);
            await fetchBookings(serviceId);
            setSuccessMessage(t('dashboard:provider.success.booking_accepted'));
            setSuccessModalOpen(true);
        } catch (err) {
            console.error(err);
            setErrorMessage(t('dashboard:provider.errors.generic_action'));
            setErrorDetails(err && err.response && err.response.data ? err.response.data : (err && err.message ? err.message : String(err)));
            setErrorModalOpen(true);
        } finally {
            setLoading(false);
        }
    };

    const handleReject = (bk) => { setSelectedBooking(bk); setCancelOpen(true); };
    const handleRectify = (bk) => { setSelectedBooking(bk); setCorrectionOpen(true); };

    const confirmCancel = async (id, reason) => {
        try {
            setLoading(true);
            if (cancelOpen && selectedBooking && selectedBooking.status === 'PAYMENT_AUTHORIZED') {
                await luggageService.rejectBooking(id, reason);
            } else {
                await luggageService.cancelBooking(id, reason);
            }
            setCancelOpen(false);
            await fetchBookings(serviceId);
            setSuccessMessage(t('dashboard:provider.success.booking_cancelled'));
            setSuccessModalOpen(true);
        } catch (err) {
            console.error(err);
            setErrorMessage(t('dashboard:provider.errors.generic_action'));
            setErrorDetails(err && err.response && err.response.data ? err.response.data : (err && err.message ? err.message : String(err)));
            setErrorModalOpen(true);
        } finally {
            setLoading(false);
        }
    };

    const confirmComplaint = async (id, reason) => {
        try {
            setLoading(true);
            await luggageService.reportComplaint(id, reason);
            setSuccessMessage(t('dashboard:provider.success.complaint_sent'));
            setSuccessModalOpen(true);
            setComplaintOpen(false);
            await fetchBookings(serviceId);
        } catch (err) {
            console.error(err);
            setErrorMessage(t('dashboard:provider.errors.generic_action'));
            setErrorDetails(err && err.response && err.response.data ? err.response.data : (err && err.message ? err.message : String(err)));
            setErrorModalOpen(true);
        } finally {
            setLoading(false);
        }
    };

    const confirmCorrection = async (id, price, note) => {
        try {
            setLoading(true);
            await luggageService.rectifyBooking(id, price, note);
            setSuccessMessage(t('dashboard:provider.success.correction_sent'));
            setSuccessModalOpen(true);
            setCorrectionOpen(false);
            await fetchBookings(serviceId);
        } catch (err) {
            console.error(err);
            setErrorMessage(t('dashboard:provider.errors.generic_action'));
            setErrorDetails(err && err.response && err.response.data ? err.response.data : (err && err.message ? err.message : String(err)));
            setErrorModalOpen(true);
        } finally {
            setLoading(false);
        }
    };

    const [historyBookings, setHistoryBookings] = useState([]);
    const handleFilterChange = (newFilter) => { setFilter(newFilter); setHistoryPage(1); };

    const fetchHistoryBookings = useCallback(async (id) => {
        const targetId = id || serviceId;
        if (!targetId) return;
        try {
            setLoading(true);
            const response = await luggageService.getBookingsHistory(targetId, Math.max(historyPage - 1, 0), ITEMS_PER_PAGE);
            const list = response && response.content ? response.content : (Array.isArray(response) ? response : []);
            setHistoryBookings(list);
        } catch (err) {
            console.error("Error fetching bookings history:", err);
        } finally {
            setLoading(false);
        }
    }, [serviceId, historyPage]);

    const pendingListFull = bookings.filter(b => b.status === 'PAYMENT_AUTHORIZED');
    const totalPendingPages = Math.ceil(pendingListFull.length / ITEMS_PER_PAGE);
    const currentPendingList = pendingListFull.slice(
        (pendingPage - 1) * ITEMS_PER_PAGE,
        pendingPage * ITEMS_PER_PAGE
    );

    const getBookingDateObj = (b) => {
        const iso = b?.dropOffTime || b?.pickUpTime || b?.creationDate;
        if (!iso) return null;
        const d = new Date(iso);
        return isNaN(d.getTime()) ? null : d;
    };

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);

    let historySource;
    if (filter === 'active') {
        // In Arrivo: Contiene tutti i check-in programmati da oggi in avanti, 
        // includendo anche le prenotazioni eventualmente annullate durante la giornata.
        const inArrivo = bookings
            .filter(b => {
                const s = String(b.status).toUpperCase();
                return s !== 'PAYMENT_AUTHORIZED' && s !== 'WAITING_CUSTOMER_PAYMENT';
            })
            .map(b => ({ booking: b, date: getBookingDateObj(b) }))
            .filter(x => x.date !== null && x.date >= startOfToday);
        
        // Ordiniamo per data crescente (le più vicine per prime)
        inArrivo.sort((a, b) => a.date - b.date);
        historySource = inArrivo;
    } else {
        // Archivio: Riservato esclusivamente allo storico delle prenotazioni con check-in precedente ad oggi.
        const archivio = historyBookings
            .map(b => ({ booking: b, date: getBookingDateObj(b) }))
            .filter(x => x.date !== null && x.date < startOfToday);
        
        // Ordiniamo per data decrescente (le più recenti in alto)
        archivio.sort((a, b) => b.date - a.date);
        historySource = archivio;
    }
    const historyListFull = historySource.map(x => x.booking);
    const totalHistoryPages = Math.ceil(historyListFull.length / ITEMS_PER_PAGE);
    const currentHistoryList = historyListFull.slice(
        (historyPage - 1) * ITEMS_PER_PAGE,
        historyPage * ITEMS_PER_PAGE
    );

    useEffect(() => {
        if (filter === 'past' && serviceId) {
            fetchHistoryBookings(serviceId);
        }
    }, [filter, historyPage, serviceId, fetchHistoryBookings]);

    return (
        <div className="px-4 sm:px-6 space-y-6 md:space-y-10 animate-in fade-in pb-20 md:pb-12 relative max-w-full">
            <LoadingScreen isLoading={loading} />
            <SuccessModal
                isOpen={successModalOpen}
                title={t('dashboard:provider.success.title')}
                message={successMessage}
                onClose={() => setSuccessModalOpen(false)}
            />
            {errorModalOpen && (
                <ErrorModal
                    message={errorMessage}
                    details={errorDetails}
                    onClose={() => setErrorModalOpen(false)}
                />
            )}

            {!isMobileOverlayOpen && (
                <MobileStickyTrigger
                    count={pendingListFull.length}
                    onClick={() => setIsMobileOverlayOpen(true)}
                />
            )}

            <MobilePendingFullPage
                isOpen={isMobileOverlayOpen}
                onClose={() => setIsMobileOverlayOpen(false)}
                pendingList={pendingListFull}
                onAccept={handleAccept}
                onReject={handleReject}
                onOpenDetails={(bk) => { setSelectedBooking(bk); setDetailsOpen(true); }}
            />

            <BookingDetailModal isOpen={detailsOpen} onClose={() => setDetailsOpen(false)} booking={selectedBooking} />
            <ComplaintModal isOpen={complaintOpen} onClose={() => setComplaintOpen(false)} onConfirm={confirmComplaint} booking={selectedBooking} />
            <CancellationModal isOpen={cancelOpen} onClose={() => setCancelOpen(false)} onConfirm={confirmCancel} booking={selectedBooking} />
            <PriceCorrectionModal isOpen={correctionOpen} onClose={() => setCorrectionOpen(false)} onConfirm={confirmCorrection} booking={selectedBooking} />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
                <div className="lg:col-span-2">
                    <StatsSummary activeCategory="storage" revenue={stats.revenue} count={stats.count} />
                </div>
                <div className="flex flex-col gap-4 h-full">
                    <div className="hidden lg:flex flex-col gap-4 h-full">
                        <div
                            onClick={() => navigate('/provider/qr-validator?type=storage')}
                            className={`flex-1 min-h-[140px] bg-gradient-to-br from-[${HOGU_COLORS.dark}] to-slate-800 rounded-[2rem] p-6 text-white relative overflow-hidden group cursor-pointer shadow-xl shadow-slate-900/10 hover:shadow-2xl hover:-translate-y-1 transition-all flex flex-col justify-center`}
                        >
                            <div className="absolute -right-6 -top-6 text-white/5 group-hover:text-white/10 transition-colors pointer-events-none">
                                <QrCode size={120} />
                            </div>
                            <div className="relative z-10">
                                <div className="bg-white/10 w-fit p-2 rounded-xl backdrop-blur-md border border-white/10 mb-3">
                                    <ScanLine size={20} className={`text-[${HOGU_COLORS.primary}]`} />
                                </div>
                                    <h3 className="text-xl font-bold mb-1">{t('dashboard:provider.storage.scanner_title')}</h3>
                            </div>
                            <div className={`absolute bottom-6 right-6 text-[${HOGU_COLORS.primary}] opacity-0 group-hover:opacity-100 transition-opacity`}>
                                <ArrowRight size={24} />
                            </div>
                        </div>

                        <button
                            onClick={() => {
                                if (info?.serviceId) {
                                    navigate(`/provider/edit/luggage/${info.serviceId}`);
                                }
                            }}
                            disabled={!info?.serviceId}
                            className={`h-24 bg-white border border-slate-200 rounded-[1.5rem] px-6 flex items-center justify-between
                                hover:bg-slate-50 hover:border-[${HOGU_COLORS.primary}]/50 transition-all group shadow-sm hover:shadow-md
                                ${!info?.serviceId ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                        >
                            <div className="flex items-center gap-3 text-left">
                                <div className={`p-3 bg-slate-100 rounded-xl group-hover:bg-[${HOGU_COLORS.primary}]/10 group-hover:text-[${HOGU_COLORS.primary}] transition-colors text-slate-600`}>
                                    <PackageCheck size={24} />
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-800 text-base">{t('dashboard:provider.storage.my_storage_title')}</h4>
                                    <p className="text-slate-400 text-xs font-medium">{t('dashboard:provider.storage.my_storage_subtitle')}</p>
                                </div>
                            </div>
                            <Settings size={20} className={`text-slate-300 group-hover:text-[${HOGU_COLORS.primary}] transition-colors`} />
                        </button>
                    </div>

                    <div className="grid grid-cols-2 gap-3 lg:hidden mb-2 mt-4 md:mt-0">
                        <button
                            onClick={() => navigate('/provider/qr-validator?type=storage')}
                            className="bg-[#1a1a1a] text-white p-3 rounded-xl flex flex-col items-center justify-center gap-2 shadow-lg"
                        >
                            <QrCode size={20} />
                            <span className="text-xs font-bold">{t('dashboard:provider.dashboard.scanner_short')}</span>
                        </button>

                        <button
                            onClick={() => {
                                if (info?.serviceId) {
                                    navigate(`/provider/edit/luggage/${info.serviceId}`);
                                }
                            }}
                            disabled={!info?.serviceId}
                            className={`bg-white text-slate-700 p-3 rounded-xl flex flex-col items-center justify-center gap-2 border border-slate-100 shadow-sm ${!info?.serviceId ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            <Settings size={20} />
                            <span className="text-xs font-bold">{t('dashboard:provider.categories.storage')}</span>
                        </button>
                    </div>

                </div>
            </div>

            <section className="hidden md:block">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                    <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-2xl border ${pendingListFull.length > 0 ? 'bg-amber-50 border-amber-100 text-amber-600' : 'bg-slate-50 border-slate-100 text-slate-400'}`}>
                            <BellRing size={28} className={pendingListFull.length > 0 ? 'animate-bounce' : ''} />
                        </div>
                        <div>
                            <h2 className={`text-2xl font-extrabold text-[${HOGU_COLORS.dark}]`}>{t('dashboard:provider.storage.pending_section_title')}</h2>
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

                {currentPendingList.length > 0 ? (
                    <div className="p-1.5 rounded-[2rem] bg-gradient-to-br from-indigo-50 via-blue-50 to-transparent">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {currentPendingList.map(b => (
                                <PendingRequestCard
                                    key={b.id}
                                    booking={b}
                                    onAccept={handleAccept}
                                    onReject={handleReject}
                                    onOpenDetails={(bk) => { setSelectedBooking(bk); setDetailsOpen(true); }}
                                />
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="bg-white border border-dashed border-slate-200 rounded-2xl p-8 text-center text-slate-400">
                        {t('dashboard:provider.storage.pending_empty')}
                    </div>
                )}
            </section>

            <div className="hidden md:block border-t border-slate-100 my-8"></div>

            <section>
                <div className="flex flex-col sm:flex-row justify-between items-end sm:items-center gap-4 mb-6">
                    <div>
                        <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-slate-800 flex items-center gap-2 text-left">
                            <Luggage className={`text-[${HOGU_COLORS.primary}]`} /> {t('dashboard:provider.storage.schedule_title')}
                        </h2>
                        <p className="text-xs text-slate-400 mt-1 font-medium">
                            {filter === 'active'
                                ? t('dashboard:provider.dashboard.agenda_desc_active')
                                : t('dashboard:provider.dashboard.agenda_desc_past')
                            }
                        </p>
                    </div>
                    <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                        <div className="flex bg-white p-1 rounded-2xl border border-slate-200 shadow-sm">
                            <button onClick={() => handleFilterChange('active')} className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wide transition-all ${filter === 'active' ? `bg-[${HOGU_COLORS.primary}] text-white shadow-md` : 'text-slate-400 hover:bg-slate-50'}`}>{t('dashboard:provider.filters.active')}</button>
                            <button onClick={() => handleFilterChange('past')} className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wide transition-all ${filter === 'past' ? 'bg-slate-800 text-white shadow-md' : 'text-slate-400 hover:bg-slate-50'}`}>{t('dashboard:provider.filters.past')}</button>
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
                            <ProviderBookingCard
                                key={b.id}
                                booking={b}
                                activeCategory="storage"
                                onOpenDetails={(bk) => { setSelectedBooking(bk); setDetailsOpen(true); }}
                                onOpenComplaint={(bk) => { setSelectedBooking(bk); setComplaintOpen(true); }}
                                onCancelBooking={(bk) => { setSelectedBooking(bk); setCancelOpen(true); }}
                            />
                        ))
                    ) : (
                        <div className="flex flex-col items-center justify-center py-12 bg-white rounded-3xl border border-slate-100 border-dashed">
                            <History className="text-slate-300 mb-2" size={32} />
                            <p className="text-slate-400 font-medium">{t('dashboard:provider.storage.schedule_empty')}</p>
                        </div>
                    )}
                </div>
            </section>

        </div>
    );
};

export default LuggageDashboard;

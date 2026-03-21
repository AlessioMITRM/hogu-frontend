import React, { useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import { 
    Calendar, Clock, ChevronLeft, ChevronRight, Eye, MoreVertical, 
    AlertTriangle, Ban, BellRing, Edit2, CheckCircle, XCircle,
    User, Wallet, TrendingUp, Activity, Sparkles, Timer, ScanLine,
    Phone, ListTodo, RefreshCw, Send, Lock, ShieldAlert,
    Utensils, BedDouble, Car, Luggage, PartyPopper
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import CurrencyInput from 'react-currency-input-field';
import SafeImage from '../../../../ui/SafeImage.jsx';


// Helper per formattare i prezzi (Locale al file o export se serve altrove)
const formatPrice = (value) => {
    if (value === undefined || value === null) return '0,00';
    const num = typeof value === 'string' ? parseFloat(value.replace(',', '.')) : value;
    if (isNaN(num)) return '0,00';
    return num.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

// --- HELPER DATE/TIME ---
const getBookingDateTime = (booking) => {
    if (booking.date && booking.time) return { date: booking.date, time: booking.time };
    if (booking.reservationTime) {
        const d = new Date(booking.reservationTime);
        return {
            date: d.toLocaleDateString('it-IT'),
            time: d.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })
        };
    }
    // Fallback per pickupTime (NCC)
    if (booking.pickupTime) {
         const d = new Date(booking.pickupTime);
         return {
            date: d.toLocaleDateString('it-IT'),
            time: d.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })
        };
    }
    if (booking.checkInDate) {
        if (typeof booking.checkInDate === 'string') {
            const parts = booking.checkInDate.split('-').map(Number);
            if (parts.length === 3) {
                const d = new Date(parts[0], parts[1] - 1, parts[2]);
                return {
                    date: d.toLocaleDateString('it-IT'),
                    time: '--'
                };
            }
        }
        const d = new Date(booking.checkInDate);
        return {
            date: d.toLocaleDateString('it-IT'),
            time: '--'
        };
    }
    return { date: '--', time: '--' };
};

// --- CONFIGURAZIONE CATEGORIE (Per Icone e Label) ---
export const SERVICE_CATEGORIES = {
    RESTAURANT: { id: 'restaurant', label: 'Ristorante', icon: Utensils, unit: 'Coperti' },
    BEB: { id: 'beb', label: 'B&B / Hotel', icon: BedDouble, unit: 'Notti' },
    CLUB: { id: 'club', label: 'Club / Eventi', icon: PartyPopper, unit: 'Ingressi' },
    NCC: { id: 'ncc', label: 'NCC / Trasporti', icon: Car, unit: 'Passeggeri' },
    STORAGE: { id: 'storage', label: 'Depositi', icon: Luggage, unit: 'Bagagli' }
};

export const ModalBackdrop = ({ children, onClose }) => {
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, []);

    const overlay = (
        <div className="fixed inset-0 bg-[#1A202C]/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={onClose}>
            <div className="bg-white p-4 md:p-6 rounded-2xl md:rounded-[2.5rem] w-full max-w-md md:max-w-xl shadow-2xl shadow-black/20 transform animate-in zoom-in-95 duration-200 overflow-y-auto max-h-[85vh] md:max-h-[90vh]" onClick={e => e.stopPropagation()}>
                {children}
            </div>
        </div>
    );

    return ReactDOM.createPortal(overlay, document.body);
};

// --- HELPER COMPONENTS ---

export const PaginationControls = ({ currentPage, totalPages, onNext, onPrev, darkBg = false }) => {
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

export const StatusBadge = ({ status }) => {
    const { t } = useTranslation('dashboard');
    // Mappatura completa degli stati dal Backend (BookingStatus.java)
    const styles = { 
        // 1. STATI CONFERMATI / PAGATI (Verde)
        FULL_PAYMENT_COMPLETED: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-100', label: 'Completato' },
        COMPLETED: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-100', label: 'Completato' },
        COMMISSION_PAID: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-100', label: 'Commissione Pagata' },

        // 2. STATI IN ATTESA (Giallo/Amber)
        PENDING: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-100', label: 'In Attesa' }, 
        PAYMENT_AUTHORIZED: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-100', label: 'In Attesa' },
        WAITING_PROVIDER_CONFIRMATION: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-100', label: 'In Attesa' },
        WAITING_CUSTOMER_PAYMENT: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-100', label: 'In Attesa del Cliente' },
        
        // 3. STATI CANCELLATI / ANNULLATI (Rosso)
        CANCELLED_BY_PROVIDER: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-100', label: 'Annullata' },
        CANCELLED_BY_ADMIN: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-100', label: 'Annullata' },
        MODIFIED_BY_PROVIDER: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-100', label: 'Annullata' },

        // 4. ALTRI (Bianco con propria descrizione)
        REFUNDED_BY_ADMIN: { bg: 'bg-white', text: 'text-slate-600', border: 'border-slate-200', label: t('provider.status.refunded', 'Rimborsato Admin') },
        CONFIRMED: { bg: 'bg-white', text: 'text-slate-600', border: 'border-slate-200', label: t('provider.status.confirmed', 'Confermata') },
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

export const CategorySpecificDetails = ({ booking, category }) => {
    const { t } = useTranslation('dashboard');
    const config = SERVICE_CATEGORIES[category?.toUpperCase()] || SERVICE_CATEGORIES.RESTAURANT;
    const Icon = config.icon;
    const guests =
        booking.guests ||
        booking.numberOfPeople ||
        booking.numberOfGuests ||
        0;
    let detailText = `${guests} Ospiti`;
    
    if (category === 'beb') {
        let nights = booking.quantity || 1;
        if (booking.checkInDate && booking.checkOutDate) {
            let from;
            let to;
            if (typeof booking.checkInDate === 'string' && typeof booking.checkOutDate === 'string') {
                const pIn = booking.checkInDate.split('-').map(Number);
                const pOut = booking.checkOutDate.split('-').map(Number);
                if (pIn.length === 3 && pOut.length === 3) {
                    from = new Date(pIn[0], pIn[1] - 1, pIn[2]);
                    to = new Date(pOut[0], pOut[1] - 1, pOut[2]);
                }
            }
            if (!from || !to) {
                from = new Date(booking.checkInDate);
                to = new Date(booking.checkOutDate);
            }
            const diffMs = to.getTime() - from.getTime();
            const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
            if (!Number.isNaN(diffDays) && diffDays > 0) {
                nights = diffDays;
            }
        }
        detailText = `${guests} ${guests === 1 ? t('provider.booking_details.guest_one', 'Ospite') : t('provider.booking_details.guest_other', 'Ospiti')} • ${nights} ${nights === 1 ? t('provider.booking_details.night_one', 'Notte') : t('provider.booking_details.night_other', 'Notti')}`;
    }
    if (category === 'storage') detailText = `${booking.quantity || 1} ${t('provider.categories.units.bags', 'Bagagli')}`;
    if (category === 'ncc') detailText = `${booking.guests || booking.numberOfPeople || 0} Pax • ${booking.location || t('provider.booking_details.itinerary', 'Percorso')}`;
    if (category === 'club') {
        let entryText = t('provider.booking_details.entrance_only', 'Solo Ingresso');
        if (booking?.table) {
             entryText = booking.table === true ? t('provider.booking_details.table', 'Tavolo') : booking.table;
        } else {
            const pType = booking?.pricingConfiguration?.pricingType;
            if (pType === 'FEMALE') entryText = t('provider.booking_details.female_entrance', 'Ingresso Donna');
            else if (pType === 'MALE') entryText = t('provider.booking_details.male_entrance', 'Ingresso Uomo');
            else if (pType === 'STANDARD') entryText = t('provider.booking_details.standard_entrance', 'Ingresso Lista');
        }
        detailText = `${booking.guests || booking.numberOfPeople || 0} Pax • ${entryText}`;
    }

    return (
        <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-medium">
            <Icon size={12}/> {detailText}
        </div>
    );
};

export const StatsSummary = ({ activeCategory, revenue = 0, count = 0, title, ctaLabel, onCta }) => {
    const { t } = useTranslation('dashboard');
    const labelKey = `provider.categories.${activeCategory?.toLowerCase()}`;
    const label = t(labelKey, SERVICE_CATEGORIES[activeCategory?.toUpperCase()]?.label || 'Attività');
    const priceStr = revenue === null || revenue === undefined ? null : formatPrice(revenue);
    const [intPart, decPart] = priceStr ? priceStr.split(',') : [null, null];
    const heading = title || t('provider.stats.revenue', { label });

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
            <div className="md:col-span-1 bg-[#1A202C] rounded-[2rem] p-6 text-white relative overflow-hidden shadow-xl shadow-slate-900/10 group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform duration-500"><Wallet size={100} /></div>
                <div className="relative z-10">
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">{heading}</p>
                    {priceStr ? (
                        <h3 className="text-3xl font-extrabold mb-4">€ {intPart}<span className="text-slate-500 text-lg">,{decPart}</span></h3>
                    ) : (
                        <h3 className="text-3xl font-extrabold mb-4">—</h3>
                    )}
                    {ctaLabel && onCta && (
                        <button onClick={onCta} className="mt-1 text-xs font-bold bg-white/10 hover:bg-white/20 border border-white/10 px-3 py-1.5 rounded-lg transition-colors">
                            {ctaLabel}
                        </button>
                    )}
                </div>
            </div>
            <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col justify-center relative overflow-hidden group hover:border-[#68B49B]/30 hover:shadow-lg transition-all">
                 <div className="absolute -right-4 -bottom-4 text-slate-50 opacity-50 group-hover:text-[#68B49B]/10 transition-colors"><Activity size={100} /></div>
                <div className="flex items-center gap-2 text-slate-400 mb-2">
                    <Activity size={18} /> <span className="text-xs font-bold uppercase">{t('provider.stats.bookings', 'Prenotazioni')}</span>
                </div>
                <span className="text-4xl font-black text-slate-800 group-hover:text-[#68B49B] transition-colors">{count}</span>
                <p className="text-xs text-slate-400 mt-2 font-medium">{t('provider.stats.monthly_total', 'Totali questo mese')}</p>
            </div>
        </div>
    );
};

// --- CARDS PRINCIPALI ---

export const PendingRequestCard = ({ booking, onAccept, onReject, onRectify, onOpenDetails, activeCategory }) => {
    const { t } = useTranslation('dashboard');
    const normalizedStatus = booking.status ? booking.status.toString().toUpperCase() : '';
    const isWaitingCustomer = normalizedStatus === 'WAITING_CUSTOMER_PAYMENT';
    const { date, time } = getBookingDateTime(booking);
    const endDate = (() => {
        if (booking.checkOutDate) {
            if (typeof booking.checkOutDate === 'string') {
                const parts = booking.checkOutDate.split('-').map(Number);
                if (parts.length === 3) {
                    const d = new Date(parts[0], parts[1] - 1, parts[2]);
                    return d.toLocaleDateString('it-IT');
                }
            }
            const d = new Date(booking.checkOutDate);
            return d.toLocaleDateString('it-IT');
        }
        return '--';
    })();
    const imgSrc = activeCategory === 'beb'
        ? (
            booking.roomImagePath ||
            (
                booking.serviceId &&
                booking.roomId &&
                Array.isArray(booking.roomImages) &&
                booking.roomImages.length > 0
            )
                ? `/files/bnb/${booking.serviceId}/${booking.roomId}/${booking.roomImages[0]}`
                : booking.image
        )
        : booking.image;
    return (
        <div className={`group bg-white rounded-3xl p-5 border shadow-[0_2px_15px_-3px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_25px_-5px_rgba(104,180,155,0.15)] transition-all duration-300 flex flex-col relative overflow-hidden h-full 
        ${isWaitingCustomer ? 'border-blue-100 bg-blue-50/30' : 'border-slate-100 hover:border-[#68B49B]/30'}`}>
        <div className={`absolute left-0 top-0 bottom-0 w-1.5 opacity-80 ${isWaitingCustomer ? 'bg-blue-400' : 'bg-gradient-to-b from-amber-300 to-amber-500'}`}></div>
        <div className="flex flex-wrap items-start justify-between gap-4 mb-5 pl-2 relative z-10">
            <div className="flex gap-4 min-w-0 max-w-full">
                <div className="relative shrink-0">
                    <SafeImage src={imgSrc} alt="" className="w-14 h-14 rounded-2xl object-cover shadow-sm ring-2 ring-white" />
                    {!isWaitingCustomer && (<div className="absolute -bottom-2 -right-1 bg-amber-400 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full border-2 border-white shadow-sm tracking-wide">NEW</div>)}
                </div>
                <div className="min-w-0 flex-1">
                    <h4 className="font-bold text-[#1A202C] text-lg leading-tight mb-0.5 truncate pr-2">
                        {booking.bookingFullName || booking.customerName || "Cliente"}
                    </h4>
                    <p className="text-xs text-[#68B49B] font-bold uppercase tracking-wide mb-1 truncate">{booking.serviceName}</p>
                    {booking.roomName && (
                        <p className="text-[11px] text-slate-500 font-medium truncate">
                            {booking.roomName}
                        </p>
                    )}
                    <CategorySpecificDetails booking={booking} category={activeCategory} />
                </div>
            </div>
            <div className="text-right shrink-0 ml-auto">
                <span className={`block font-extrabold text-base md:text-lg ${isWaitingCustomer ? 'text-blue-600' : 'text-[#1A202C]'}`}>
                    € {formatPrice(
                        booking.commissionAmount ??
                        booking.totalAmount ??
                        booking.totalPrice ??
                        booking.price ??
                        0
                    )}
                </span>
                <span className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">{t('provider.booking_details.commission_label', 'Commissioni')}</span>
            </div>
        </div>
        <div className="grid grid-cols-2 gap-3 mb-5 pl-2">
            <div className="bg-slate-50 p-2 rounded-xl border border-slate-100 min-w-0">
                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block mb-1 truncate">{t('provider.booking_details.date', 'Data')}</span>
                <div className="flex items-center gap-2 text-slate-700 font-bold text-xs sm:text-sm truncate">
                    <Calendar size={14} className="text-[#68B49B] shrink-0"/>
                    <span className="truncate">{date}</span>
                </div>
            </div>
            {activeCategory === 'beb' ? (
                <div className="bg-slate-50 p-2 rounded-xl border border-slate-100 min-w-0">
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block mb-1 truncate">{t('provider.booking_details.departure', 'Inizio')}</span>
                    <div className="flex items-center gap-2 text-slate-700 font-bold text-xs sm:text-sm truncate">
                        <Calendar size={14} className="text-[#68B49B] shrink-0"/>
                        <span className="truncate">{endDate}</span>
                    </div>
                </div>
            ) : (
                <div className="bg-slate-50 p-2 rounded-xl border border-slate-100 min-w-0">
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block mb-1 truncate">{t('provider.booking_details.time', 'Ora')}</span>
                    <div className="flex items-center gap-2 text-slate-700 font-bold text-xs sm:text-sm truncate">
                        <Clock size={14} className="text-[#68B49B] shrink-0"/>
                        <span className="truncate">{time}</span>
                    </div>
                </div>
            )}
        </div>
        <div className="mt-auto pl-2">
            {isWaitingCustomer ? (
                <div className="w-full bg-blue-100 text-blue-600 py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 border border-blue-200"><Clock size={16} className="animate-pulse"/> {t('provider.dashboard.waiting_customer', 'In attesa del cliente...')}</div>
            ) : (
                <div className="flex gap-2">
                    <button onClick={() => onAccept(booking.id)} className="flex-1 bg-[#68B49B] text-white px-3 py-2.5 rounded-xl font-bold text-xs md:text-sm hover:bg-[#5aa38d] shadow-sm hover:shadow-[#68B49B]/20 active:scale-95 transition-all flex items-center justify-center gap-1.5"><CheckCircle size={16}/> {t('provider.actions.accept', 'Accetta')}</button>
                    <button onClick={() => onReject(booking)} className="w-10 h-10 shrink-0 flex items-center justify-center bg-rose-50 border border-rose-200 text-rose-600 rounded-xl hover:bg-rose-100 transition-all"><XCircle size={18}/></button>
                    <button onClick={() => onOpenDetails(booking)} className="w-10 h-10 shrink-0 flex items-center justify-center bg-slate-50 text-slate-400 rounded-xl hover:bg-slate-100 hover:text-[#68B49B] transition-all"><Eye size={18} /></button>
                </div>
            )}
        </div>
        </div>
    );
};

export const ProviderBookingCard = ({ booking, onOpenDetails, onOpenComplaint, onCancelBooking, activeCategory }) => {
    const { t } = useTranslation('dashboard');
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef(null);
    useEffect(() => {
        const handleClickOutside = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setIsMenuOpen(false); };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);
    const isCancelled = booking.status === 'cancelled';
    const isBeb = (activeCategory === 'beb') || !!booking.checkInDate || !!booking.checkOutDate || (booking.serviceType === 'BEB');
    const { date, time } = getBookingDateTime(booking);
    const startDateLabel = (() => {
        if (!isBeb) return date;
        if (booking.checkInDate) {
            if (typeof booking.checkInDate === 'string') {
                const parts = booking.checkInDate.split('-').map(Number);
                if (parts.length === 3) {
                    const d = new Date(parts[0], parts[1] - 1, parts[2]);
                    return d.toLocaleDateString('it-IT');
                }
            }
            const d = new Date(booking.checkInDate);
            return d.toLocaleDateString('it-IT');
        }
        return date;
    })();
    const endDateLabel = (() => {
        if (!isBeb) return null;
        if (booking.checkOutDate) {
            if (typeof booking.checkOutDate === 'string') {
                const parts = booking.checkOutDate.split('-').map(Number);
                if (parts.length === 3) {
                    const d = new Date(parts[0], parts[1] - 1, parts[2]);
                    return d.toLocaleDateString('it-IT');
                }
            }
            const d = new Date(booking.checkOutDate);
            return d.toLocaleDateString('it-IT');
        }
        return null;
    })();
    const imageUrl = isBeb
        ? (
            booking.roomImagePath ||
            (
                booking.serviceId &&
                booking.roomId &&
                Array.isArray(booking.roomImages) &&
                booking.roomImages.length > 0
            )
                ? `/files/bnb/${booking.serviceId}/${booking.roomId}/${booking.roomImages[0]}`
                : booking.image
        )
        : booking.image;
    const totalPrice = (() => {
        if (isBeb) {
            if (typeof booking.totalAmount === 'number') return booking.totalAmount;
            if (booking.totalAmount && typeof booking.totalAmount === 'string') {
                const parsed = parseFloat(booking.totalAmount);
                if (!Number.isNaN(parsed)) return parsed;
            }
        }
        if (typeof booking.price === 'number') return booking.price;
        if (booking.price && typeof booking.price === 'string') {
            const parsed = parseFloat(booking.price);
            if (!Number.isNaN(parsed)) return parsed;
        }
        return 0;
    })();
    return (
        <div className={`rounded-3xl border p-5 flex flex-col sm:flex-row gap-6 transition-all duration-300 relative group
            ${isCancelled ? 'bg-red-50 border-red-200' : 'bg-white border-slate-100 hover:border-[#68B49B]/30 hover:shadow-lg hover:shadow-slate-200/50'}`}>
            <div className={`w-20 h-20 rounded-2xl overflow-hidden shrink-0 shadow-sm ring-1 ${isCancelled ? 'ring-red-100 grayscale' : 'ring-slate-100'}`}>
                <SafeImage src={imageUrl} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"/>
            </div>
            <div className="flex-1 flex flex-col justify-between">
                <div className="flex justify-between items-start mb-2">
                    <div>
                        <h4 className={`font-bold text-lg ${isCancelled ? 'text-red-700 line-through decoration-red-400' : 'text-[#1A202C]'}`}>
                            {booking.bookingFullName || booking.customerName || "Cliente"}
                        </h4>
                        <p className={`text-xs font-medium uppercase tracking-wide ${isCancelled ? 'text-red-400' : 'text-slate-500'}`}>{booking.serviceName}</p>
                        {booking.roomName && (
                            <p className="text-[11px] text-slate-500 font-medium truncate">
                                {booking.roomName}
                            </p>
                        )}
                        <div className="mt-1 flex items-center gap-2">
                            <CategorySpecificDetails booking={booking} category={activeCategory} />
                            {booking.bookingCode && (
                                <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-mono font-bold uppercase tracking-tight">
                                    #{booking.bookingCode}
                                </span>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <StatusBadge status={booking.status} />
                        <button onClick={() => onOpenDetails(booking)} className={`w-8 h-8 flex items-center justify-center rounded-full transition-all ml-1 shadow-sm ${isCancelled ? 'bg-red-100 text-red-500 hover:bg-red-200' : 'bg-slate-50 text-slate-400 hover:bg-[#68B49B] hover:text-white'}`}><Eye size={16}/></button>
                        {booking.status === 'confirmed' && (
                            <div className="relative" ref={menuRef}>
                                <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"><MoreVertical size={18}/></button>
                                {isMenuOpen && (
                                    <div className="absolute right-0 top-full mt-2 w-48 bg-white shadow-xl shadow-slate-200/60 border border-slate-100 rounded-2xl p-1.5 z-50 animate-in fade-in zoom-in-95 origin-top-right">
                                        <button onClick={() => { setIsMenuOpen(false); onCancelBooking(booking); }} className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-bold hover:bg-rose-50 text-slate-600 hover:text-rose-600 rounded-xl transition-colors"><Ban size={14}/> {t('provider.actions.cancel_booking', 'Annulla Prenotazione')}</button>
                                        <button onClick={() => { setIsMenuOpen(false); onOpenComplaint(booking); }} className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-bold hover:bg-amber-50 text-slate-600 hover:text-amber-600 rounded-xl transition-colors"><AlertTriangle size={14}/> {t('provider.actions.report_problem', 'Segnala Problema')}</button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
                <div className={`flex items-center justify-between mt-auto pt-3 border-t ${isCancelled ? 'border-red-100' : 'border-slate-50'}`}>
                    <div className={`flex gap-4 text-xs font-semibold tracking-wide ${isCancelled ? 'text-red-400 opacity-70' : 'text-slate-500'}`}>
                        <span className={`flex items-center gap-1.5 px-2 py-1 rounded-md ${isCancelled ? 'bg-red-100/50' : 'bg-slate-50'}`}>
                            <Calendar size={12} className={isCancelled ? "text-red-500" : "text-[#68B49B]"}/>
                            {isBeb && endDateLabel
                                ? `${startDateLabel} → ${endDateLabel}`
                                : startDateLabel}
                        </span>
                        {!isBeb && (
                            <span className={`flex items-center gap-1.5 px-2 py-1 rounded-md ${isCancelled ? 'bg-red-100/50' : 'bg-slate-50'}`}>
                                <Clock size={12} className={isCancelled ? "text-red-500" : "text-[#68B49B]"}/>
                                {time}
                            </span>
                        )}
                    </div>
                    {((activeCategory === 'restaurant' || booking.serviceType === 'RESTAURANT') && (booking.status === 'COMPLETED' || booking.status === 'COMMISSION_PAID')) ? (
                         <div className="text-right">
                             <span className="font-extrabold text-lg text-[#1A202C]">€ {formatPrice((booking.numberOfPeople || booking.guests || 0) * 2.50)}</span>
                            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t('provider.booking_details.commission_label', 'Commissioni')}</span>
                        </div>
                    ) : (
                        <span className={`font-extrabold text-lg ${isCancelled ? 'text-red-600' : 'text-[#1A202C]'}`}>€ {formatPrice(totalPrice)}</span>
                    )}
                </div>
            </div>
        </div>
    );
};

export const TodayEventCard = ({ event, onValidate }) => (
    <div className="group bg-white/10 border border-white/10 hover:bg-white/20 p-5 rounded-3xl backdrop-blur-md transition-all flex flex-col justify-between h-full relative overflow-hidden">
        <div className="absolute inset-0 z-0">
            <SafeImage src={event.image} alt="" className="w-full h-full object-cover opacity-20 group-hover:scale-110 transition-transform duration-700" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/80 to-transparent"></div>
        </div>
        <div className="relative z-10">
            <div className="flex justify-between items-start mb-4">
                <h4 className="font-bold text-white text-xl leading-tight">{event.label}</h4>
                <span className="bg-white/20 text-white text-[10px] font-bold px-2 py-1 rounded-lg backdrop-blur-sm">{event.time}</span>
            </div>
            <div className="flex gap-4 mb-6">
                <div className="text-white/80">
                    <p className="text-[10px] uppercase font-bold text-white/50">Prenotati</p>
                    <p className="text-lg font-bold">{event.totalBookings}</p>
                </div>
                <div className="text-white/80">
                    <p className="text-[10px] uppercase font-bold text-white/50">Entrati</p>
                    <p className="text-lg font-bold">{event.checkedIn}</p>
                </div>
            </div>
        </div>
        <button onClick={() => onValidate(event.id)} className="relative z-10 w-full bg-white text-[#1A202C] hover:bg-[#68B49B] hover:text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95">
            <ScanLine size={18} /> Vai al Validatore
        </button>
    </div>
);

export const SinglePremiumServiceCard = ({ service, onEdit }) => (
    <div className="relative group bg-white rounded-[2.5rem] p-4 md:p-6 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.08)] border border-slate-100 flex flex-col md:flex-row gap-8 overflow-hidden transition-all hover:shadow-[0_20px_50px_-12px_rgba(104,180,155,0.2)]">
      <div className="w-full md:w-1/3 h-64 md:h-auto relative rounded-[2rem] overflow-hidden shadow-inner">
        <SafeImage src={service.image} alt={service.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-60"></div>
        <div className="absolute top-4 left-4">
            <span className="bg-white/90 backdrop-blur-md text-[#1A202C] px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-sm flex items-center gap-1">
                <Sparkles size={10} className="text-[#68B49B]" /> Top Service
            </span>
        </div>
      </div>
      <div className="flex-1 flex flex-col justify-center py-2">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-3xl font-extrabold text-[#1A202C] leading-tight font-serif-variation mb-2">{service.title}</h3>
            <div className="w-16 h-1.5 bg-[#68B49B] rounded-full"></div>
          </div>
          <button onClick={() => onEdit(service)} className="group/btn w-12 h-12 flex items-center justify-center rounded-2xl bg-slate-50 text-slate-400 hover:bg-[#68B49B] hover:text-white transition-all shadow-sm"><Edit2 size={20} /></button>
        </div>
        <p className="text-slate-500 text-lg leading-relaxed mb-8 font-light max-w-2xl">{service.description || "Nessuna descrizione disponibile."}</p>
        <div className="mt-auto flex items-center gap-8 border-t border-slate-100 pt-6">
          <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold text-slate-400 mb-0.5 tracking-wider">Prezzo</span>
              <span className="text-3xl font-bold text-[#1A202C]">€ {formatPrice(service.price)}</span>
          </div>
          <div className="w-px h-12 bg-slate-200"></div>
          <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold text-slate-400 mb-0.5 tracking-wider">Durata / Unità</span>
              <div className="flex items-center gap-1.5 text-slate-700 font-bold text-2xl">
                  <Timer size={24} className="text-[#68B49B]" /> {service.duration} <span className="text-sm text-slate-400 font-medium mb-1">min</span>
              </div>
          </div>
        </div>
      </div>
    </div>
);

// --- MODALS ---

export const BookingDetailModal = ({ isOpen, onClose, booking, activeCategory }) => {
    const { t } = useTranslation('dashboard');
    if(!isOpen || !booking) return null;
    const { date, time } = getBookingDateTime(booking);
    const isBeb = (activeCategory === 'beb') || !!booking.checkInDate || !!booking.checkOutDate || (booking.serviceType === 'BEB');
    const endDate = (() => {
        if (booking.checkOutDate) {
            if (typeof booking.checkOutDate === 'string') {
                const parts = booking.checkOutDate.split('-').map(Number);
                if (parts.length === 3) {
                    const d = new Date(parts[0], parts[1] - 1, parts[2]);
                    return d.toLocaleDateString('it-IT');
                }
            }
            const d = new Date(booking.checkOutDate);
            return d.toLocaleDateString('it-IT');
        }
        return '--';
    })();
    const guestsCount = isBeb
        ? (booking?.numberOfGuests ?? booking?.guests ?? booking?.numberOfPeople ?? 0)
        : (booking?.guests ?? booking?.numberOfPeople ?? 0);
    const nightsCount = (() => {
        if (!isBeb || !booking.checkInDate || !booking.checkOutDate) return null;
        let start;
        let end;
        if (typeof booking.checkInDate === 'string') {
            const parts = booking.checkInDate.split('-').map(Number);
            if (parts.length === 3) {
                start = new Date(parts[0], parts[1] - 1, parts[2]);
            }
        }
        if (!start) {
            start = new Date(booking.checkInDate);
        }
        if (typeof booking.checkOutDate === 'string') {
            const parts = booking.checkOutDate.split('-').map(Number);
            if (parts.length === 3) {
                end = new Date(parts[0], parts[1] - 1, parts[2]);
            }
        }
        if (!end) {
            end = new Date(booking.checkOutDate);
        }
        if (!start || !end) return null;
        const diffMs = end.getTime() - start.getTime();
        if (diffMs <= 0) return null;
        const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
        return diffDays > 0 ? diffDays : null;
    })();
    const totalPrice = (() => {
        if (isBeb) {
            if (typeof booking.totalAmount === 'number') return booking.totalAmount;
            if (booking.totalAmount && typeof booking.totalAmount === 'string') {
                const parsed = parseFloat(booking.totalAmount);
                if (!Number.isNaN(parsed)) return parsed;
            }
        }
        if (typeof booking.price === 'number') return booking.price;
        if (booking.price && typeof booking.price === 'string') {
            const parsed = parseFloat(booking.price);
            if (!Number.isNaN(parsed)) return parsed;
        }
        return 0;
    })();
    const imgSrc = isBeb
        ? (
            booking.roomImagePath ||
            (
                booking.serviceId &&
                booking.roomId &&
                Array.isArray(booking.roomImages) &&
                booking.roomImages.length > 0
            )
                ? `/files/bnb/${booking.serviceId}/${booking.roomId}/${booking.roomImages[0]}`
                : booking.image
        )
        : (booking?.image);
    return (
        <ModalBackdrop onClose={onClose}>
            <div className="flex flex-col md:flex-row gap-6">
                <div className="w-full md:w-1/3 flex flex-col items-center text-center border-b md:border-b-0 md:border-r border-slate-100 pb-4 md:pb-0 md:pr-4">
                    <div className="relative mb-2">
                        <SafeImage src={imgSrc} className="w-16 h-16 md:w-20 md:h-20 rounded-2xl object-cover shadow-md ring-2 ring-white" alt="" />
                    </div>
                    <div className="mb-2 flex justify-center">
                        <StatusBadge status={booking?.status}/>
                    </div>
                    <h2 className="font-extrabold text-base md:text-xl text-[#1A202C] mb-0.5 truncate max-w-[18rem]">
                        {booking?.bookingFullName || booking?.customerName || "Cliente"}
                    </h2>
                    <p className="text-[#68B49B] font-bold text-xs mb-1 truncate max-w-[18rem]">
                        {booking?.serviceName}
                    </p>
                    {booking?.roomName && (
                        <p className="text-slate-500 text-xs mb-1 truncate max-w-[18rem]">
                            {booking.roomName}
                        </p>
                    )}
                    {booking?.bookingCode && (
                        <div className="mb-2">
                             <span className="text-[10px] bg-[#68B49B]/10 text-[#68B49B] px-2 py-1 rounded-lg font-mono font-bold uppercase tracking-wider">
                                COD: {booking.bookingCode}
                            </span>
                        </div>
                    )}
                    {booking?.phone && <a href={`tel:${booking.phone}`} className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg text-slate-600 text-xs font-bold hover:bg-slate-100 transition-colors w-full justify-center"><Phone size={14} /> {booking.phone}</a>}
                </div>
                <div className="flex-1">
                    <h3 className="text-sm md:text-base font-bold text-[#1A202C] mb-3 flex items-center gap-2"><ListTodo size={16} className="text-slate-400"/> {t('provider.booking_details.title', 'Dettagli')}</h3>
                    <div className="grid grid-cols-2 gap-3 mb-4">
                        <div className="bg-slate-50 p-2 rounded-xl border border-slate-100"><span className="text-[10px] uppercase text-slate-400 font-bold tracking-wider block mb-0.5">{t('provider.booking_details.date', 'Data')}</span><div className="flex items-center gap-1.5 font-bold text-slate-700 text-sm"><Calendar size={14} className="text-[#68B49B]" /> {date}</div></div>
                        {isBeb ? (
                            <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                                <span className="text-[10px] uppercase text-slate-400 font-bold tracking-wider block mb-0.5">{t('provider.booking_details.arrival', 'Fine')}</span>
                                <div className="flex items-center gap-1.5 font-bold text-slate-700 text-sm">
                                    <Calendar size={14} className="text-[#68B49B]" /> {endDate}
                                </div>
                            </div>
                        ) : (
                            <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                                <span className="text-[10px] uppercase text-slate-400 font-bold tracking-wider block mb-0.5">{t('provider.booking_details.time', 'Orario')}</span>
                                <div className="flex items-center gap-1.5 font-bold text-slate-700 text-sm">
                                    <Clock size={14} className="text-[#68B49B]" /> {time}
                                </div>
                            </div>
                        )}
                        <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                             <span className="text-[10px] uppercase text-slate-400 font-bold tracking-wider block mb-0.5">
                                {isBeb ? 'Ospiti / Notti' : (booking.category === 'ncc' ? 'Passeggeri' : 'Ospiti')}
                             </span>
                             <div className="flex items-center gap-1.5 font-bold text-slate-700 text-sm">
                                <User size={14} className="text-[#68B49B]" /> 
                                {guestsCount}
                                {isBeb && nightsCount && (
                                    <span className='text-xs text-slate-400'> ({nightsCount} nt)</span>
                                )}
                             </div>
                        </div>
                        <div className="bg-slate-50 p-2 rounded-xl border border-slate-100"><span className="text-[10px] uppercase text-slate-400 font-bold tracking-wider block mb-0.5">Totale</span>
                            {((booking.category === 'restaurant' || booking.serviceType === 'RESTAURANT') && (booking.status === 'COMPLETED' || booking.status === 'COMMISSION_PAID')) ? (
                                <div className="flex flex-col">
                                    <span className="font-extrabold text-[#1A202C] text-sm">€ {formatPrice((booking.numberOfPeople || booking.guests || 0) * 2.50)}</span>
                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Commissioni</span>
                                </div>
                            ) : (
                                <div className="flex items-center gap-1.5 font-extrabold text-[#1A202C] text-sm">€ {formatPrice(totalPrice)}</div>
                            )}
                        </div>
                        {booking?.statusReason && (
                            <div className="col-span-2 bg-red-50 p-2 rounded-xl border border-red-100">
                                <span className="text-[10px] uppercase text-red-400 font-bold tracking-wider block mb-0.5">{t('provider.booking_details.cancellation_reason', 'Motivo Cancellazione')}</span>
                                <div className="text-red-700 text-xs font-medium leading-snug">{booking.statusReason}</div>
                            </div>
                        )}
                    </div>
                    <div className="flex gap-2 mt-auto">
                        <button onClick={onClose} className="flex-1 py-2.5 bg-slate-100 text-slate-600 rounded-lg font-bold text-sm hover:bg-slate-200 transition-colors">{t('provider.actions.close', 'Chiudi')}</button>
                    </div>
                </div>
            </div>
        </ModalBackdrop>
    );
};

export const ComplaintModal = ({ isOpen, onClose, onConfirm, booking }) => {
    const { t } = useTranslation('dashboard');
    const [reason, setReason] = useState("");
    useEffect(() => { if(isOpen) setReason(""); }, [isOpen]);
    if (!isOpen) return null;
    return (
        <ModalBackdrop onClose={onClose}>
            <div className="max-w-sm mx-auto">
                <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-500 mb-4 mx-auto"><AlertTriangle size={24}/></div>
                <h2 className="font-bold text-xl text-[#1A202C] mb-2 text-center">{t('provider.modals.complaint.title', 'Segnala Problema')}</h2>
                <textarea className="w-full border border-slate-200 p-4 rounded-xl mb-6 bg-slate-50 focus:ring-2 focus:ring-amber-100 outline-none transition-all text-sm" rows="3" placeholder={t('provider.modals.complaint.placeholder', 'Dettagli segnalazione...')} value={reason} onChange={e => setReason(e.target.value)}/>
                <button onClick={() => onConfirm(booking.id, reason)} disabled={!reason.trim()} className="w-full bg-amber-500 text-white py-3 rounded-xl font-bold text-sm hover:bg-amber-600 transition-all">{t('provider.modals.complaint.submit', 'Invia Segnalazione')}</button>
            </div>
        </ModalBackdrop>
    );
};

export const CancellationModal = ({ isOpen, onClose, onConfirm, booking }) => {
    const { t } = useTranslation('dashboard');
    const [reason, setReason] = useState("");
    if (!isOpen) return null;
    return (
        <ModalBackdrop onClose={onClose}>
            <div className="max-w-sm mx-auto">
                <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center text-red-500 mb-4 mx-auto"><Ban size={24}/></div>
                <h2 className="font-bold text-xl text-[#1A202C] mb-2 text-center">{t('provider.modals.cancellation.title', 'Annulla Prenotazione')}</h2>
                <textarea className="w-full border border-slate-200 p-4 rounded-xl mb-6 bg-slate-50 focus:ring-2 focus:ring-red-100 outline-none transition-all text-sm" rows="3" placeholder={t('provider.modals.cancellation.placeholder', 'Motivo...')} value={reason} onChange={e => setReason(e.target.value)}/>
                <div className="flex gap-3">
                     <button onClick={onClose} className="flex-1 bg-slate-100 text-slate-600 py-3 rounded-xl font-bold text-sm">{t('provider.actions.back', 'Indietro')}</button>
                    <button onClick={() => onConfirm(booking.id, reason)} className="flex-1 bg-red-500 text-white py-3 rounded-xl font-bold text-sm hover:bg-red-600 transition-all">{t('provider.actions.confirm', 'Conferma')}</button>
                </div>
            </div>
        </ModalBackdrop>
    );
};

export const PriceCorrectionModal = ({ isOpen, onClose, onConfirm, booking }) => {
    const { t } = useTranslation('dashboard');
    const [newPrice, setNewPrice] = useState("");
    const [note, setNote] = useState("");
    useEffect(() => { 
        if(isOpen && booking) { setNewPrice(booking.price); setNote(""); }
    }, [isOpen, booking]);
    if (!isOpen || !booking) return null;
    return (
        <ModalBackdrop onClose={onClose}>
            <div className="max-w-sm mx-auto">
                <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-500 mb-4 mx-auto"><RefreshCw size={24}/></div>
                <h2 className="font-bold text-xl text-[#1A202C] mb-2 text-center">{t('provider.modals.correction.title', 'Rettifica Prezzo')}</h2>
                <div className="mb-4">
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">{t('provider.modals.correction.label', 'Nuovo Prezzo (€)')}</label>
                    <CurrencyInput
                        className="w-full border border-slate-200 p-4 rounded-xl bg-slate-50 focus:ring-2 focus:ring-amber-100 outline-none font-bold text-slate-800"
                        placeholder={t('provider.modals.correction.placeholder', 'Inserisci nuovo prezzo')}
                        decimalsLimit={2}
                        decimalScale={2}
                        suffix=" €"
                        value={newPrice}
                        onValueChange={(value) => setNewPrice(value)}
                    />
                </div>
                <div className="mb-6">
                     <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">{t('provider.modals.correction.notes', 'Note')}</label>
                    <textarea className="w-full border border-slate-200 p-4 rounded-xl bg-slate-50 focus:ring-2 focus:ring-amber-100 outline-none text-sm" rows="3" value={note} onChange={e => setNote(e.target.value)}/>
                </div>
                <div className="flex gap-3">
                    <button onClick={onClose} className="flex-1 bg-slate-100 text-slate-600 py-3 rounded-xl font-bold text-sm">{t('provider.actions.cancel', 'Annulla')}</button>
                    <button onClick={() => onConfirm(booking.id, newPrice, note)} className="flex-1 bg-amber-500 text-white py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2"><Send size={16} /> {t('provider.actions.send', 'Invia')}</button>
                </div>
            </div>
        </ModalBackdrop>
    );
};

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
    Calendar, Clock, ChevronLeft, ChevronRight, Eye, MoreVertical,
    AlertTriangle, Ban, BellRing, Edit2, CheckCircle, XCircle,
    User, Wallet, Activity, ScanLine,
    Phone, ListTodo, RefreshCw, Send, ChevronUp, X,
    Luggage, PackageCheck,
    Settings, History, QrCode, ArrowRight, Box, Loader2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { HOGU_COLORS, HOGU_THEME } from '../../../../../config/theme.js';
import { luggageService } from '../../../../../api/apiClient.js';

// =================================================================================
// 1. CONFIGURAZIONE & COSTANTI
// =================================================================================
const SERVICE_CATEGORIES = {
    STORAGE: { id: 'storage', label: 'Depositi', icon: Luggage, unit: 'Bagagli' }
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
    const styles = {
        confirmed: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-100', label: 'Confermata' },
        pending: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-100', label: 'In Attesa' },
        waiting_customer: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-100', label: 'Attesa Cliente' },
        completed: { bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-200', label: 'Completata' },
        cancelled: { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200', label: 'Cancellata' }
    };
    const style = styles[status] || styles.completed;
    return (
        <span className={`px-2.5 py-1 rounded-full text-[10px] uppercase tracking-wider font-bold border ${style.bg} ${style.text} ${style.border}`}>
            {style.label}
        </span>
    );
};

const CategorySpecificDetails = ({ booking, category }) => {
    const catKey = category?.toUpperCase();
    const config = SERVICE_CATEGORIES[catKey] || SERVICE_CATEGORIES.STORAGE;
    const Icon = config.icon;
    let detailText = `${booking.quantity || 1} Bagagli • ${booking.time || 'Durata definita'}`;
    return (
        <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-medium">
            <Icon size={12} /> {detailText}
        </div>
    );
};

const StatsSummary = ({ activeCategory, revenue = 0, count = 0 }) => {
    const label = SERVICE_CATEGORIES[activeCategory?.toUpperCase()]?.label || 'Attività';
    const formattedRevenue = new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(revenue || 0);
    const [intPart, decPart] = formattedRevenue.replace('€', '').trim().split(',');
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
            <div className={`md:col-span-1 bg-[${HOGU_COLORS.dark}] rounded-[2rem] p-6 text-white relative overflow-hidden shadow-xl shadow-slate-900/10 group`}>
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform duration-500"><Wallet size={100} /></div>
                <div className="relative z-10">
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Fatturato {label}</p>
                    <h3 className="text-3xl font-extrabold mb-4">€ {intPart}<span className="text-slate-500 text-lg">,{decPart || '00'}</span></h3>
                </div>
            </div>
            <div className={`bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col justify-center relative overflow-hidden group hover:border-[${HOGU_COLORS.primary}]/30 hover:shadow-lg transition-all`}>
                <div className={`absolute -right-4 -bottom-4 text-slate-50 opacity-50 group-hover:text-[${HOGU_COLORS.primary}]/10 transition-colors`}><Activity size={100} /></div>
                <div className="flex items-center gap-2 text-slate-400 mb-2">
                    <Activity size={18} /> <span className="text-xs font-bold uppercase">Prenotazioni</span>
                </div>
                <span className={`text-4xl font-black text-slate-800 group-hover:text-[${HOGU_COLORS.primary}] transition-colors`}>{count}</span>
                <p className="text-xs text-slate-400 mt-2 font-medium">Totali questo mese</p>
            </div>
        </div>
    );
};

const MobileStickyTrigger = ({ count, onClick }) => {
    if (count === 0) return null;
    return (
        <div className="fixed bottom-6 left-4 right-4 z-40 md:hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
            <button
                onClick={onClick}
                className={`w-full bg-[${HOGU_COLORS.dark}] text-white p-4 rounded-2xl shadow-2xl shadow-slate-900/40 flex items-center justify-between border border-slate-700/50 backdrop-blur-md active:scale-95 transition-transform`}
            >
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <div className="bg-amber-500 rounded-xl p-2.5 text-white animate-pulse">
                            <BellRing size={22} fill="currentColor" />
                        </div>
                        <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[11px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-[#1a1a1a] shadow-sm">
                            {count}
                        </span>
                    </div>
                    <div className="text-left">
                        <h4 className="font-bold text-base">Hai {count} richieste</h4>
                        <p className="text-xs text-slate-400">Gestisci i depositi in attesa</p>
                    </div>
                </div>
                <div className="bg-white/10 p-2 rounded-full">
                    <ChevronUp size={20} />
                </div>
            </button>
        </div>
    );
};

const MobilePendingFullPage = ({ isOpen, onClose, pendingList, onAccept, onReject, onRectify, onOpenDetails }) => {
    useEffect(() => {
        if (isOpen) { document.body.style.overflow = 'hidden'; }
        else { document.body.style.overflow = 'unset'; }
        return () => { document.body.style.overflow = 'unset'; };
    }, [isOpen]);
    return (
        <div className={`fixed inset-0 z-[100] bg-[#f8f9fc] flex flex-col md:hidden transition-transform duration-300 ease-out ${isOpen ? 'translate-y-0' : 'translate-y-[110%]'}`}>
            <div className={`bg-[${HOGU_COLORS.dark}] text-white pt-12 pb-6 px-6 rounded-b-[2.5rem] shadow-xl shrink-0 relative z-20`}>
                <div className="flex items-start justify-between">
                    <div>
                        <h2 className="text-2xl font-extrabold mb-1">Richieste ({pendingList.length})</h2>
                        <p className="text-slate-400 text-sm">Gestisci i depositi in entrata</p>
                    </div>
                    <button onClick={onClose} className="bg-white/10 p-3 rounded-full hover:bg-white/20 transition-colors">
                        <X size={24} />
                    </button>
                </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-24">
                {pendingList.length > 0 ? (
                    pendingList.map(b => (
                        <PendingRequestCard
                            key={b.id}
                            booking={b}
                            activeCategory="storage"
                            onAccept={(id) => { onAccept(id); if (pendingList.length === 1) onClose(); }}
                            onReject={onReject}
                            onRectify={onRectify}
                            onOpenDetails={onOpenDetails}
                        />
                    ))
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400">
                        <CheckCircle size={48} className="mb-4 text-emerald-500 opacity-50" />
                        <p className="font-bold text-slate-500">Tutto Tranquillo!</p>
                        <p className="text-xs mt-1">Nessuna richiesta di deposito in attesa.</p>
                        <button onClick={onClose} className="mt-6 text-emerald-600 font-bold text-sm bg-emerald-50 px-6 py-3 rounded-xl">Torna alla Dashboard</button>
                    </div>
                )}
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-[#f8f9fc] to-transparent pointer-events-none"></div>
        </div>
    );
};

const PendingRequestCard = ({ booking, onAccept, onReject, onRectify, onOpenDetails, activeCategory }) => {
    const isWaitingCustomer = booking.status === 'waiting_customer';
    return (
        <div className={`group bg-white rounded-3xl p-5 border shadow-[0_2px_15px_-3px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_25px_-5px_rgba(104,180,155,0.15)] transition-all duration-300 flex flex-col relative overflow-hidden h-full
        ${isWaitingCustomer ? 'border-blue-100 bg-blue-50/30' : `border-slate-100 hover:border-[${HOGU_COLORS.primary}]/30`}`}>
            <div className={`absolute left-0 top-0 bottom-0 w-1.5 opacity-80 ${isWaitingCustomer ? 'bg-blue-400' : 'bg-gradient-to-b from-amber-300 to-amber-500'}`}></div>
            <div className="flex items-start justify-between gap-4 mb-5 pl-2">
                <div className="flex gap-4">
                    <div className="relative shrink-0">
                        <img src={booking.image} alt="" className="w-14 h-14 rounded-2xl object-cover shadow-sm ring-2 ring-white" />
                        {!isWaitingCustomer && (<div className="absolute -bottom-2 -right-1 bg-amber-400 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full border-2 border-white shadow-sm tracking-wide">NEW</div>)}
                    </div>
                    <div>
                        <h4 className={`font-bold text-[${HOGU_COLORS.dark}] text-lg leading-tight mb-0.5`}>{booking.customerName}</h4>
                        <p className={`text-xs text-[${HOGU_COLORS.primary}] font-bold uppercase tracking-wide mb-1`}>{booking.serviceName}</p>
                        <CategorySpecificDetails booking={booking} category={activeCategory} />
                    </div>
                </div>
                <div className="text-right">
                    <span className={`block font-extrabold text-lg ${isWaitingCustomer ? 'text-blue-600' : `text-[${HOGU_COLORS.dark}]`}`}>€ {booking.price}</span>
                    {booking.oldPrice && <span className="text-xs text-slate-400 line-through">€ {booking.oldPrice}</span>}
                </div>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-5 pl-2">
                <div className="bg-slate-50 p-2 rounded-xl border border-slate-100"><span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Data</span><div className="flex items-center gap-2 text-slate-700 font-bold text-sm"><Calendar size={14} className={`text-[${HOGU_COLORS.primary}]`} />{booking.date}</div></div>
                <div className="bg-slate-50 p-2 rounded-xl border border-slate-100"><span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Orario</span><div className="flex items-center gap-2 text-slate-700 font-bold text-sm"><Clock size={14} className={`text-[${HOGU_COLORS.primary}]`} />{booking.time}</div></div>
            </div>
            <div className="mt-auto pl-2">
                {isWaitingCustomer ? (
                    <div className="w-full bg-blue-100 text-blue-600 py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 border border-blue-200"><Clock size={16} className="animate-pulse" /> In attesa del cliente...</div>
                ) : (
                    <div className="flex gap-2">
                        <button onClick={() => onAccept(booking.id)} className={`flex-1 bg-[${HOGU_COLORS.primary}] text-white px-3 py-2.5 rounded-xl font-bold text-xs md:text-sm hover:bg-[${HOGU_COLORS.primaryEmphasis}] shadow-sm hover:shadow-[${HOGU_COLORS.primary}]/20 active:scale-95 transition-all flex items-center justify-center gap-1.5`}><CheckCircle size={16} /> Accetta</button>
                        <button onClick={() => onRectify(booking)} className="px-3 py-2.5 bg-amber-50 text-amber-600 border border-amber-100 rounded-xl font-bold text-xs md:text-sm hover:bg-amber-100 transition-all flex items-center justify-center gap-1.5"><Edit2 size={16} /></button>
                        <button onClick={() => onReject(booking)} className="w-10 h-10 shrink-0 flex items-center justify-center bg-white border border-slate-200 text-slate-400 rounded-xl hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-all"><XCircle size={18} /></button>
                        <button onClick={() => onOpenDetails(booking)} className={`w-10 h-10 shrink-0 flex items-center justify-center bg-slate-50 text-slate-400 rounded-xl hover:bg-slate-100 hover:text-[${HOGU_COLORS.primary}] transition-all`}><Eye size={18} /></button>
                    </div>
                )}
            </div>
        </div>
    );
};

const ProviderBookingCard = ({ booking, onOpenDetails, onOpenComplaint, onCancelBooking, activeCategory }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setIsMenuOpen(false); };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const isCancelled = booking.status === 'cancelled';

    return (
        <div className={`rounded-3xl border p-5 flex flex-col sm:flex-row gap-6 transition-all duration-300 relative group
            ${isCancelled ? 'bg-red-50 border-red-200' : `bg-white border-slate-100 hover:border-[${HOGU_COLORS.primary}]/30 hover:shadow-lg hover:shadow-slate-200/50`}`}>
            <div className={`w-20 h-20 rounded-2xl overflow-hidden shrink-0 shadow-sm ring-1 ${isCancelled ? 'ring-red-100 grayscale' : 'ring-slate-100'}`}>
                <img src={booking.image} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
            </div>
            <div className="flex-1 flex flex-col justify-between">
                <div className="flex justify-between items-start mb-2">
                    <div>
                        <h4 className={`font-bold text-lg ${isCancelled ? 'text-red-700 line-through decoration-red-400' : `text-[${HOGU_COLORS.dark}]`}`}>{booking.customerName}</h4>
                        <p className={`text-xs font-medium uppercase tracking-wide ${isCancelled ? 'text-red-400' : 'text-slate-500'}`}>{booking.serviceName}</p>
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
                <div className={`flex items-center justify-between mt-auto pt-3 border-t ${isCancelled ? 'border-red-100' : 'border-slate-50'}`}>
                    <div className={`flex gap-4 text-xs font-semibold tracking-wide ${isCancelled ? 'text-red-400 opacity-70' : 'text-slate-500'}`}>
                        <span className={`flex items-center gap-1.5 px-2 py-1 rounded-md ${isCancelled ? 'bg-red-100/50' : 'bg-slate-50'}`}><Calendar size={12} className={isCancelled ? "text-red-500" : `text-[${HOGU_COLORS.primary}]`} /> {booking.date}</span>
                        <span className={`flex items-center gap-1.5 px-2 py-1 rounded-md ${isCancelled ? 'bg-red-100/50' : 'bg-slate-50'}`}><Clock size={12} className={isCancelled ? "text-red-500" : `text-[${HOGU_COLORS.primary}]`} /> {booking.time}</span>
                    </div>
                    <span className={`font-extrabold text-lg ${isCancelled ? 'text-red-600' : `text-[${HOGU_COLORS.dark}]`}`}>€ {booking.price}</span>
                </div>
            </div>
        </div>
    );
};

const BookingDetailModal = ({ isOpen, onClose, booking }) => {
    if (!isOpen || !booking) return null;
    return (
        <ModalBackdrop onClose={onClose}>
            <div className="flex flex-col md:flex-row gap-8">
                <div className="w-full md:w-1/3 flex flex-col items-center text-center border-b md:border-b-0 md:border-r border-slate-100 pb-6 md:pb-0 md:pr-6">
                    <div className="relative mb-4">
                        <img src={booking?.image} className="w-28 h-28 rounded-3xl object-cover shadow-xl ring-4 ring-white" alt="" />
                        <div className="absolute -bottom-2 -right-2 bg-white p-1.5 rounded-xl shadow-sm"><StatusBadge status={booking?.status} /></div>
                    </div>
                    <h2 className={`font-extrabold text-2xl text-[${HOGU_COLORS.dark}] mb-1`}>{booking?.customerName}</h2>
                    <p className={`text-[${HOGU_COLORS.primary}] font-bold text-sm mb-4`}>{booking?.serviceName}</p>
                    {booking?.phone && <a href={`tel:${booking.phone}`} className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-xl text-slate-600 text-sm font-bold hover:bg-slate-100 transition-colors w-full justify-center"><Phone size={16} /> {booking.phone}</a>}
                </div>
                <div className="flex-1">
                    <h3 className={`text-lg font-bold text-[${HOGU_COLORS.dark}] mb-4 flex items-center gap-2`}><ListTodo size={20} className="text-slate-400" /> Dettagli Deposito</h3>
                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100"><span className="text-[10px] uppercase text-slate-400 font-bold tracking-wider block mb-1">Data</span><div className="flex items-center gap-2 font-bold text-slate-700 text-lg"><Calendar size={18} className={`text-[${HOGU_COLORS.primary}]`} /> {booking?.date}</div></div>
                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100"><span className="text-[10px] uppercase text-slate-400 font-bold tracking-wider block mb-1">Orario</span><div className="flex items-center gap-2 font-bold text-slate-700 text-lg"><Clock size={18} className={`text-[${HOGU_COLORS.primary}]`} /> {booking?.time}</div></div>
                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                            <span className="text-[10px] uppercase text-slate-400 font-bold tracking-wider block mb-1">Cliente</span>
                            <div className="flex items-center gap-2 font-bold text-slate-700 text-lg">
                                <User size={18} className={`text-[${HOGU_COLORS.primary}]`} />
                                {booking?.guests || 1} Persone
                            </div>
                        </div>
                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100"><span className="text-[10px] uppercase text-slate-400 font-bold tracking-wider block mb-1">Totale</span><div className={`flex items-center gap-2 font-extrabold text-[${HOGU_COLORS.dark}] text-lg`}>€ {booking?.price}</div></div>
                        <div className="col-span-2 space-y-4 mt-2">
                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex justify-between gap-4">
                                <div className="flex-1">
                                    <span className="text-[10px] uppercase text-slate-400 font-bold tracking-wider block mb-1">Deposito</span>
                                    <div className="font-bold text-slate-700 text-sm">{booking.dropoffTime || (booking.time ? booking.time.split('-')[0] : '--:--')}</div>
                                </div>
                                <div className="w-px bg-slate-200"></div>
                                <div className="flex-1">
                                    <span className="text-[10px] uppercase text-slate-400 font-bold tracking-wider block mb-1">Ritiro Previsto</span>
                                    <div className="font-bold text-slate-700 text-sm">{booking.pickupTime || (booking.time && booking.time.includes('-') ? booking.time.split('-')[1] : '--:--')}</div>
                                </div>
                            </div>
                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                <span className="text-[10px] uppercase text-slate-400 font-bold tracking-wider block mb-3">Dettaglio Bagagli</span>
                                {booking.baggageDetails ? (
                                    <div className="grid grid-cols-3 gap-2">
                                        <div className="flex flex-col items-center bg-white p-2 rounded-xl border border-slate-100 shadow-sm">
                                            <Box size={20} className="text-slate-400 mb-1 scale-75" />
                                            <span className="text-xs text-slate-500 font-medium">Piccolo</span>
                                            <span className="text-lg font-bold text-slate-800">{booking.baggageDetails.small}</span>
                                        </div>
                                        <div className="flex flex-col items-center bg-white p-2 rounded-xl border border-slate-100 shadow-sm">
                                            <Box size={20} className="text-slate-500 mb-1 scale-90" />
                                            <span className="text-xs text-slate-500 font-medium">Medio</span>
                                            <span className="text-lg font-bold text-slate-800">{booking.baggageDetails.medium}</span>
                                        </div>
                                        <div className="flex flex-col items-center bg-white p-2 rounded-xl border border-slate-100 shadow-sm">
                                            <Box size={20} className="text-slate-600 mb-1 scale-110" />
                                            <span className="text-xs text-slate-500 font-medium">Grande</span>
                                            <span className="text-lg font-bold text-slate-800">{booking.baggageDetails.large}</span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-3 mt-1">
                                        <div className={`w-10 h-10 bg-[${HOGU_COLORS.primary}]/20 rounded-xl flex items-center justify-center text-[${HOGU_COLORS.primary}]`}>
                                            <Luggage size={20} />
                                        </div>
                                        <div>
                                            <p className={`text-xs text-[${HOGU_COLORS.primary}] font-bold uppercase`}>Totale Colli</p>
                                            <p className="font-extrabold text-slate-800 text-lg leading-none">{booking.quantity} Pezzi</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
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
                <h2 className={`font-bold text-xl text-[${HOGU_COLORS.dark}] mb-2 text-center`}>Segnala Problema</h2>
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
                <h2 className={`font-bold text-xl text-[${HOGU_COLORS.dark}] mb-2 text-center`}>Annulla Prenotazione</h2>
                <textarea className="w-full border border-slate-200 p-4 rounded-xl mb-6 bg-slate-50 focus:ring-2 focus:ring-red-100 outline-none transition-all text-sm" rows="3" placeholder="Motivo..." value={reason} onChange={e => setReason(e.target.value)} />
                <div className="flex gap-3">
                    <button onClick={onClose} className="flex-1 bg-slate-100 text-slate-600 py-3 rounded-xl font-bold text-sm">Indietro</button>
                    <button onClick={() => onConfirm(booking.id, reason)} className="flex-1 bg-red-500 text-white py-3 rounded-xl font-bold text-sm hover:bg-red-600 transition-all">Conferma</button>
                </div>
            </div>
        </ModalBackdrop>
    );
};

const PriceCorrectionModal = ({ isOpen, onClose, onConfirm, booking }) => {
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
                <h2 className={`font-bold text-xl text-[${HOGU_COLORS.dark}] mb-2 text-center`}>Rettifica Prezzo</h2>
                <div className="mb-4">
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Nuovo Prezzo (€)</label>
                    <input type="number" className="w-full border border-slate-200 p-4 rounded-xl bg-slate-50 focus:ring-2 focus:ring-amber-100 outline-none font-bold text-slate-800" value={newPrice} onChange={e => setNewPrice(e.target.value)} />
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
// 3. MAIN COMPONENT - LUGGAGE DASHBOARD
// =================================================================================
const LuggageDashboard = () => {
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
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleReject = (bk) => { setSelectedBooking(bk); setCancelOpen(true); };
    const handleRectify = (bk) => { setSelectedBooking(bk); setCorrectionOpen(true); };

    const confirmCancel = async (id, reason) => {
        try {
            setLoading(true);
            if (cancelOpen && selectedBooking && selectedBooking.status === 'pending') {
                await luggageService.rejectBooking(id, reason);
            } else {
                await luggageService.cancelBooking(id, reason);
            }
            setCancelOpen(false);
            await fetchBookings(serviceId);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const confirmComplaint = async (id, reason) => {
        try {
            setLoading(true);
            await luggageService.reportComplaint(id, reason);
            alert("Segnalazione inviata.");
            setComplaintOpen(false);
            await fetchBookings(serviceId);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const confirmCorrection = async (id, price, note) => {
        try {
            setLoading(true);
            await luggageService.rectifyBooking(id, price, note);
            alert("Rettifica inviata al cliente.");
            setCorrectionOpen(false);
            await fetchBookings(serviceId);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (newFilter) => { setFilter(newFilter); setHistoryPage(1); };

    const pendingListFull = bookings.filter(b => b.status === 'pending' || b.status === 'waiting_customer');
    const totalPendingPages = Math.ceil(pendingListFull.length / ITEMS_PER_PAGE);
    const currentPendingList = pendingListFull.slice(
        (pendingPage - 1) * ITEMS_PER_PAGE,
        pendingPage * ITEMS_PER_PAGE
    );

    const historyListFull = bookings.filter(b => {
        if (b.status === 'pending' || b.status === 'waiting_customer') return false;
        if (filter === 'active') return b.status === 'confirmed';
        if (filter === 'past') return ['completed', 'cancelled'].includes(b.status);
        return true;
    });
    const totalHistoryPages = Math.ceil(historyListFull.length / ITEMS_PER_PAGE);
    const currentHistoryList = historyListFull.slice(
        (historyPage - 1) * ITEMS_PER_PAGE,
        historyPage * ITEMS_PER_PAGE
    );

    return (
        <div className="space-y-6 md:space-y-10 animate-in fade-in pb-24 md:pb-12 relative">
            {loading && (
                <FullModalBackdrop onClose={() => { }}>
                    <LoadingComponent />
                </FullModalBackdrop>
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
                onRectify={handleRectify}
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
                            onClick={() => navigate('/validator?type=storage')}
                            className={`flex-1 min-h-[140px] bg-gradient-to-br from-[${HOGU_COLORS.dark}] to-slate-800 rounded-[2rem] p-6 text-white relative overflow-hidden group cursor-pointer shadow-xl shadow-slate-900/10 hover:shadow-2xl hover:-translate-y-1 transition-all flex flex-col justify-center`}
                        >
                            <div className="absolute -right-6 -top-6 text-white/5 group-hover:text-white/10 transition-colors pointer-events-none">
                                <QrCode size={120} />
                            </div>
                            <div className="relative z-10">
                                <div className="bg-white/10 w-fit p-2 rounded-xl backdrop-blur-md border border-white/10 mb-3">
                                    <ScanLine size={20} className={`text-[${HOGU_COLORS.primary}]`} />
                                </div>
                                <h3 className="text-xl font-bold mb-1">Scanner Deposito</h3>
                                <p className="text-slate-400 text-xs font-medium">Scansiona per accettare o restituire.</p>
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
                            className={`h-20 bg-white border border-slate-200 rounded-[1.5rem] px-6 flex items-center justify-between
                                hover:bg-slate-50 hover:border-[${HOGU_COLORS.primary}]/50 transition-all group shadow-sm hover:shadow-md
                                ${!info?.serviceId ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                        >
                            <div className="flex items-center gap-3 text-left">
                                <div className={`p-2.5 bg-slate-100 rounded-xl group-hover:bg-[${HOGU_COLORS.primary}]/10 group-hover:text-[${HOGU_COLORS.primary}] transition-colors text-slate-600`}>
                                    <PackageCheck size={20} />
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-800 text-sm">Il tuo Deposito</h4>
                                    <p className="text-slate-400 text-xs">Prezzi e orari</p>
                                </div>
                            </div>
                            <Settings size={18} className={`text-slate-300 group-hover:text-[${HOGU_COLORS.primary}] transition-colors`} />
                        </button>
                    </div>

                    <div className="grid grid-cols-2 gap-3 lg:hidden mb-2 mt-4 md:mt-0">
                        <button
                            onClick={() => navigate('/validator?type=storage')}
                            className="bg-[#1a1a1a] text-white p-4 rounded-2xl flex flex-col items-center justify-center gap-2 shadow-lg"
                        >
                            <QrCode size={24} />
                            <span className="text-xs font-bold">Scanner</span>
                        </button>

                        <button
                            onClick={() => {
                                if (info?.serviceId) {
                                    navigate(`/provider/edit/luggage/${info.serviceId}`);
                                }
                            }}
                            disabled={!info?.serviceId}
                            className={`bg-white text-slate-700 p-4 rounded-2xl flex flex-col items-center justify-center gap-2 border border-slate-100 shadow-sm ${!info?.serviceId ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            <Settings size={24} />
                            <span className="text-xs font-bold">Deposito</span>
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
                            <h2 className={`text-2xl font-extrabold text-[${HOGU_COLORS.dark}]`}>Depositi in Attesa</h2>
                            <p className="text-sm text-slate-500 font-medium">
                                {pendingListFull.length > 0 ? "Nuove richieste di deposito bagagli." : "Nessuna richiesta da gestire."}
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

                {currentPendingList.length > 0 ? (
                    <div className="p-1.5 rounded-[2rem] bg-gradient-to-br from-indigo-50 via-blue-50 to-transparent">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {currentPendingList.map(b => (
                                <PendingRequestCard
                                    key={b.id}
                                    booking={b}
                                    activeCategory="storage"
                                    onAccept={handleAccept}
                                    onReject={handleReject}
                                    onRectify={handleRectify}
                                    onOpenDetails={(bk) => { setSelectedBooking(bk); setDetailsOpen(true); }}
                                />
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="bg-white border border-dashed border-slate-200 rounded-2xl p-8 text-center text-slate-400">
                        Nessuna nuova richiesta di deposito.
                    </div>
                )}
            </section>

            <div className="hidden md:block border-t border-slate-100 my-8"></div>

            <section>
                <div className="flex flex-col sm:flex-row justify-between items-end sm:items-center gap-4 mb-6">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                            <PackageCheck className={`text-[${HOGU_COLORS.primary}]`} /> Depositi Attivi & Storico
                        </h2>
                    </div>
                    <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                        <div className="flex bg-white p-1 rounded-2xl border border-slate-200 shadow-sm">
                            <button onClick={() => handleFilterChange('active')} className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wide transition-all ${filter === 'active' ? `bg-[${HOGU_COLORS.primary}] text-white shadow-md` : 'text-slate-400 hover:bg-slate-50'}`}>Attivi Ora</button>
                            <button onClick={() => handleFilterChange('past')} className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wide transition-all ${filter === 'past' ? 'bg-slate-800 text-white shadow-md' : 'text-slate-400 hover:bg-slate-50'}`}>Archivio</button>
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
                            <p className="text-slate-400 font-medium">Nessun deposito in questa lista.</p>
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
};

export default LuggageDashboard;
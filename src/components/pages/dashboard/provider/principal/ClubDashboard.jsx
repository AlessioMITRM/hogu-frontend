import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
    Calendar, Clock, ChevronLeft, ChevronRight, Eye, MoreVertical, 
    AlertTriangle, Ban, BellRing, Edit2, CheckCircle,
    User, Wallet, Activity, ScanLine,
    Phone, ListTodo, RefreshCw, Send, ChevronUp, X, Loader2,    
    PartyPopper, Plus, Edit3, ChevronDown, MousePointer2, Music, Armchair
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { HOGU_COLORS, HOGU_THEME } from '../../../../../config/theme.js';

// *** IMPORT DEL SERVICE ***
import { clubService } from '../../../../../api/apiClient.js';

// =================================================================================
// 1. CONFIGURAZIONE & COSTANTI
// =================================================================================

const SERVICE_CATEGORIES = {
    CLUB: { id: 'club', label: 'Club / Eventi', icon: PartyPopper, unit: 'Ingressi' }
};

// =================================================================================
// 2. COMPONENTI UI CONDIVISI
// =================================================================================

const LoadingComponent = () => (
    <div className="flex justify-center items-center py-10">
        <Loader2 size={32} className="animate-spin text-slate-400" />
    </div>
);

// HO SPOSTATO LA LOGICA CRITICA IN QUESTO COMPONENTE PER LA MODALE DI SELEZIONE
const FullModalBackdrop = ({ children, onClose }) => {
    // Gestione Scroll Body e DOM
    useEffect(() => {
        const originalOverflow = document.body.style.overflow;
        const originalPosition = document.body.style.position;
        const originalWidth = document.body.style.width;
        const originalTop = document.body.style.top;
        
        // Blocca completamente il body
        document.body.style.overflow = 'hidden';
        document.body.style.position = 'fixed';
        document.body.style.width = '100%';
        document.body.style.top = '0';
        
        // Assicurati che html non abbia overflow
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
        // Uso del Z-INDEX MAX e posizionamento FIXED per coprire tutto
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

// Questo è il ModalBackdrop standard usato per le modali più semplici (Dettagli, Cancel, Complaint)
const ModalBackdrop = ({ children, onClose }) => (
    <div 
        className={`fixed inset-0 bg-[${HOGU_COLORS.dark}]/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200 h-screen`} 
        style={{ zIndex: 999 }} // z-index alto ma non massimo
        onClick={onClose}
    >
        <div className="bg-white p-8 rounded-[2.5rem] w-full max-w-2xl shadow-2xl shadow-black/20 transform animate-in zoom-in-95 duration-200 mx-4" onClick={e => e.stopPropagation()}>
            {children}
        </div>
    </div>
);

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
    const config = SERVICE_CATEGORIES[catKey];
    const Icon = config.icon;
        
    detailText = `${booking.guests} Pax • ${booking.table ? booking.table : 'Solo Ingresso'}`;

    return (
        <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-medium">
            <Icon size={12}/> {detailText}
        </div>
    );
};

const StatsSummary = ({ activeCategory, revenue, count }) => {
    const label = SERVICE_CATEGORIES[activeCategory?.toUpperCase()]?.label || 'Attività';
    
    const formattedRevenue = new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(revenue || 0);
    const [intPart, decimalPart] = formattedRevenue.replace('€', '').trim().split(',');

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
            <div className={`md:col-span-1 bg-[${HOGU_COLORS.dark}] rounded-[2rem] p-6 text-white relative overflow-hidden shadow-xl shadow-slate-900/10 group`}>
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform duration-500"><Wallet size={100} /></div>
                <div className="relative z-10">
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Fatturato {label}</p>
                    <h3 className="text-3xl font-extrabold mb-4">€ {intPart}<span className="text-slate-500 text-lg">,{decimalPart || '00'}</span></h3>
                </div>
            </div>
            <div className={`bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col justify-center relative overflow-hidden group hover:border-[${HOGU_COLORS.primary}]/30 hover:shadow-lg transition-all`}>
                   <div className={`absolute -right-4 -bottom-4 text-slate-50 opacity-50 group-hover:text-[${HOGU_COLORS.primary}]/10 transition-colors`}><Activity size={100} /></div>
                <div className="flex items-center gap-2 text-slate-400 mb-2">
                    <Activity size={18} /> <span className="text-xs font-bold uppercase">Prenotazioni</span>
                </div>
                <span className={`text-4xl font-black text-slate-800 group-hover:text-[${HOGU_COLORS.primary}] transition-colors`}>{count || 0}</span>
                <p className="text-xs text-slate-400 mt-2 font-medium">Totali registrate</p>
            </div>
        </div>
    );
};

// *** COMPONENTE CARD ROBUSTO CON FALLBACK ***
const TodayEventCard = ({ event, onValidate }) => {
    // Immagine di default (Party/Club generico)
    const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&q=80&w=600';

    // 1. Normalizzazione Titolo e Orario (Backend vs Frontend fields)
    const title = event.label || event.name || "Evento";
    
    let displayTime = event.time;
    if (!displayTime && event.startTime) {
        const dateObj = new Date(event.startTime);
        displayTime = dateObj.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
    } else if (!displayTime) {
        displayTime = "--:--";
    }

    // 2. Determina l'URL iniziale
    let imageUrl = DEFAULT_IMAGE;
    
    if (event.image) {
        imageUrl = event.image;
    } else if (event.images && event.images.length > 0) {
        // Se l'array contiene solo il nome file (senza http), aggiungi il base URL
        const imgName = event.images[0];
        imageUrl = imgName.startsWith('http') 
            ? imgName 
            : `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'}/uploads/${imgName}`;
    }

    return (
        <div className="group bg-white/10 border border-white/10 hover:bg-white/20 p-5 rounded-3xl backdrop-blur-md transition-all flex flex-col justify-between h-full relative overflow-hidden min-h-[200px]">
            
            {/* Sfondo Immagine */}
            {/* bg-slate-800 assicura che ci sia un fondo scuro se l'img non carica */}
            <div className="absolute inset-0 z-0 bg-slate-800"> 
                <img 
                    src={imageUrl} 
                    alt={title} 
                    className="w-full h-full object-cover opacity-60 group-hover:scale-110 transition-transform duration-700" 
                    onError={(e) => { 
                        // Se l'immagine non si carica, metti quella di default
                        e.target.onerror = null; // Previene loop infiniti
                        e.target.src = DEFAULT_IMAGE; 
                    }} 
                />
                {/* Gradiente per leggere meglio il testo */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent"></div>
            </div>
            
            {/* Contenuto (Titolo e Orario) */}
            <div className="relative z-10">
                <div className="flex justify-between items-start mb-4">
                    <h4 className="font-bold text-white text-xl leading-tight drop-shadow-md break-words pr-2">
                        {title}
                    </h4>
                    <span className="bg-black/40 text-white border border-white/20 text-[10px] font-bold px-2 py-1 rounded-lg backdrop-blur-sm shrink-0">
                        {displayTime}
                    </span>
                </div>
            </div>
            
            {/* Bottone */}
            <button 
                onClick={() => onValidate(event.id)} 
                className={`relative z-10 w-full bg-white text-[${HOGU_COLORS.dark}] hover:bg-[${HOGU_COLORS.primary}] hover:text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95 mt-auto`}
            >
                <ScanLine size={18} /> Scanner Ingresso
            </button>
        </div>
    );
};

// --- COMPONENTI MOBILE DEDICATI ---

const MobileStickyTrigger = ({ count, onClick }) => {
    if (!count || count === 0) return null;
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
                        <p className="text-xs text-slate-400">Gestisci tavoli e liste</p>
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
            {/* Header Overlay */}
            <div className={`bg-[${HOGU_COLORS.dark}] text-white pt-12 pb-6 px-6 rounded-b-[2.5rem] shadow-xl shrink-0 relative z-20`}>
                <div className="flex items-start justify-between">
                    <div>
                        <h2 className="text-2xl font-extrabold mb-1">Richieste ({pendingList.length})</h2>
                        <p className="text-slate-400 text-sm">Gestisci le prenotazioni in entrata</p>
                    </div>
                    <button onClick={onClose} className="bg-white/10 p-3 rounded-full hover:bg-white/20 transition-colors">
                        <X size={24} />
                    </button>
                </div>
            </div>

            {/* Lista Scrollabile */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-24">
                {pendingList && pendingList.length > 0 ? (
                    pendingList.map(b => (
                        <PendingRequestCard 
                            key={b.id} 
                            booking={b} 
                            activeCategory="club"
                            onAccept={(id) => { onAccept(id); if(pendingList.length === 1) onClose(); }}
                            onReject={onReject}
                            onRectify={onRectify}
                            onOpenDetails={onOpenDetails}
                        />
                    ))
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400">
                        <CheckCircle size={48} className="mb-4 text-emerald-500 opacity-50"/>
                        <p className="font-bold text-slate-500">Tutto Pronto!</p>
                        <p className="text-xs mt-1">Nessuna richiesta tavolo in attesa.</p>
                        <button onClick={onClose} className="mt-6 text-emerald-600 font-bold text-sm bg-emerald-50 px-6 py-3 rounded-xl">Torna alla Dashboard</button>
                    </div>
                )}
            </div>
            
            <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-[#f8f9fc] to-transparent pointer-events-none"></div>
        </div>
    );
};

// --- CARDS ---

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
            <div className="bg-slate-50 p-2 rounded-xl border border-slate-100"><span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Data</span><div className="flex items-center gap-2 text-slate-700 font-bold text-sm"><Calendar size={14} className={`text-[${HOGU_COLORS.primary}]`}/>{booking.date}</div></div>
            <div className="bg-slate-50 p-2 rounded-xl border border-slate-100"><span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Ora</span><div className="flex items-center gap-2 text-slate-700 font-bold text-sm"><Clock size={14} className={`text-[${HOGU_COLORS.primary}]`}/>{booking.time}</div></div>
        </div>
        <div className="mt-auto pl-2">
            {isWaitingCustomer ? (
                <div className="w-full bg-blue-100 text-blue-600 py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 border border-blue-200"><Clock size={16} className="animate-pulse"/> In attesa del cliente...</div>
            ) : (
                <div className="flex gap-2">
                    <button onClick={() => onAccept(booking.id)} className={`flex-1 bg-[${HOGU_COLORS.primary}] text-white px-3 py-2.5 rounded-xl font-bold text-xs md:text-sm hover:bg-[${HOGU_COLORS.primaryEmphasis}] shadow-sm hover:shadow-[${HOGU_COLORS.primary}]/20 active:scale-95 transition-all flex items-center justify-center gap-1.5`}><CheckCircle size={16}/> Accetta</button>
                    <button onClick={() => onRectify(booking)} className="px-3 py-2.5 bg-amber-50 text-amber-600 border border-amber-100 rounded-xl font-bold text-xs md:text-sm hover:bg-amber-100 transition-all flex items-center justify-center gap-1.5"><Edit2 size={16}/></button>
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
                <img src={booking.image} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"/>
            </div>
            <div className="flex-1 flex flex-col justify-between">
                <div className="flex justify-between items-start mb-2">
                    <div>
                        <h4 className={`font-bold text-lg ${isCancelled ? 'text-red-700 line-through decoration-red-400' : `text-[${HOGU_COLORS.dark}]`}`}>{booking.customerName}</h4>
                        <p className={`text-xs font-medium uppercase tracking-wide ${isCancelled ? 'text-red-400' : 'text-slate-500'}`}>{booking.serviceName}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <StatusBadge status={booking.status} />
                        <button onClick={() => onOpenDetails(booking)} className={`w-8 h-8 flex items-center justify-center rounded-full transition-all ml-1 shadow-sm ${isCancelled ? 'bg-red-100 text-red-500 hover:bg-red-200' : `bg-slate-50 text-slate-400 hover:bg-[${HOGU_COLORS.primary}] hover:text-white`}`}><Eye size={16}/></button>
                        {booking.status === 'confirmed' && (
                            <div className="relative" ref={menuRef}>
                                <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"><MoreVertical size={18}/></button>
                                {isMenuOpen && (
                                    <div className="absolute right-0 top-full mt-2 w-48 bg-white shadow-xl shadow-slate-200/60 border border-slate-100 rounded-2xl p-1.5 z-50 animate-in fade-in zoom-in-95 origin-top-right">
                                        <button onClick={() => { setIsMenuOpen(false); onCancelBooking(booking); }} className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-bold hover:bg-rose-50 text-slate-600 hover:text-rose-600 rounded-xl transition-colors"><Ban size={14}/> Annulla Prenotazione</button>
                                        <button onClick={() => { setIsMenuOpen(false); onOpenComplaint(booking); }} className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-bold hover:bg-amber-50 text-slate-600 hover:text-amber-600 rounded-xl transition-colors"><AlertTriangle size={14}/> Segnala Problema</button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
                <div className={`flex items-center justify-between mt-auto pt-3 border-t ${isCancelled ? 'border-red-100' : 'border-slate-50'}`}>
                    <div className={`flex gap-4 text-xs font-semibold tracking-wide ${isCancelled ? 'text-red-400 opacity-70' : 'text-slate-500'}`}>
                         <span className={`flex items-center gap-1.5 px-2 py-1 rounded-md ${isCancelled ? 'bg-red-100/50' : 'bg-slate-50'}`}><Calendar size={12} className={isCancelled ? "text-red-500" : `text-[${HOGU_COLORS.primary}]`}/> {booking.date}</span>
                         <span className={`flex items-center gap-1.5 px-2 py-1 rounded-md ${isCancelled ? 'bg-red-100/50' : 'bg-slate-50'}`}><Clock size={12} className={isCancelled ? "text-red-500" : `text-[${HOGU_COLORS.primary}]`}/> {booking.time}</span>
                    </div>
                    <span className={`font-extrabold text-lg ${isCancelled ? 'text-red-600' : `text-[${HOGU_COLORS.dark}]`}`}>€ {booking.price}</span>
                </div>
            </div>
        </div>
    );
};

// --- MODALS ---

const BookingDetailModal = ({ isOpen, onClose, booking }) => {
    if(!isOpen || !booking) return null;

    const activeCategory = booking.category || 'club'; 

    // Helper per renderizzare campi specifici in base alla categoria
    const renderExtraDetails = () => {
        switch (activeCategory) {
            case 'ncc':
                return (
                    <div className="col-span-2 bg-slate-50 p-4 rounded-2xl border border-slate-100 mt-2">
                        <span className="text-[10px] uppercase text-slate-400 font-bold tracking-wider block mb-2">Itinerario</span>
                        <div className="flex flex-col gap-3 relative">
                            {/* ... logica NCC rimasta uguale ... */}
                            <div className="flex items-start gap-3 relative z-10">
                                <div className="w-5 h-5 rounded-full bg-white border-2 border-slate-300 shrink-0 mt-0.5"></div>
                                <div>
                                    <p className="text-xs text-slate-400 font-bold uppercase mb-0.5">Partenza</p>
                                    <p className="font-bold text-slate-700 leading-tight">{booking.pickup || booking.location || "..."}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3 relative z-10">
                                <div className={`w-5 h-5 rounded-full bg-[${HOGU_COLORS.primary}] border-2 border-white shadow-md shrink-0 mt-0.5`}></div>
                                <div>
                                    <p className="text-xs text-slate-400 font-bold uppercase mb-0.5">Arrivo</p>
                                    <p className="font-bold text-slate-700 leading-tight">{booking.dropoff || "..."}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            case 'beb':
                return (
                    <div className="col-span-2 grid grid-cols-2 gap-4 mt-2">
                         <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                              <span className="text-[10px] uppercase text-slate-400 font-bold tracking-wider block mb-1">Check-in</span>
                              <div className="font-bold text-slate-700">{booking.time}</div>
                         </div>
                         <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                              <span className="text-[10px] uppercase text-slate-400 font-bold tracking-wider block mb-1">Durata</span>
                              <div className="font-bold text-slate-700">{booking.quantity || 1} Notti</div>
                         </div>
                    </div>
                );
            case 'club':
                return (
                    <div className="col-span-2 bg-slate-50 p-4 rounded-2xl border border-slate-100 mt-2">
                         <span className="text-[10px] uppercase text-slate-400 font-bold tracking-wider block mb-1">Dettagli Assegnazione</span>
                         {booking.table ? (
                             <div className="flex items-center gap-3 mt-1">
                                 <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600">
                                     <Armchair size={20} />
                                 </div>
                                 <div>
                                     <p className="text-xs text-emerald-600 font-bold uppercase">Tavolo Assegnato</p>
                                     <p className="font-extrabold text-slate-800 text-lg leading-none">{booking.table}</p>
                                 </div>
                             </div>
                         ) : (
                             <div className="flex items-center gap-3 mt-1 opacity-70">
                                 <div className="w-10 h-10 bg-slate-200 rounded-xl flex items-center justify-center text-slate-500">
                                     <Music size={20} />
                                 </div>
                                 <div>
                                     <p className="text-xs text-slate-500 font-bold uppercase">Solo Ingresso</p>
                                     <p className="font-bold text-slate-600 leading-none">Nessun tavolo riservato</p>
                                 </div>
                             </div>
                         )}
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <ModalBackdrop onClose={onClose}>
            <div className="flex flex-col md:flex-row gap-8">
                {/* Colonna Sinistra: Info Cliente */}
                <div className="w-full md:w-1/3 flex flex-col items-center text-center border-b md:border-b-0 md:border-r border-slate-100 pb-6 md:pb-0 md:pr-6">
                    <div className="relative mb-4">
                        <img src={booking?.image} className="w-28 h-28 rounded-3xl object-cover shadow-xl ring-4 ring-white" alt="" />
                        <div className="absolute -bottom-2 -right-2 bg-white p-1.5 rounded-xl shadow-sm"><StatusBadge status={booking?.status}/></div>
                    </div>
                    <h2 className={`font-extrabold text-2xl text-[${HOGU_COLORS.dark}] mb-1`}>{booking?.customerName}</h2>
                    <p className={`text-[${HOGU_COLORS.primary}] font-bold text-sm mb-4`}>{booking?.serviceName}</p>
                    {booking?.phone && <a href={`tel:${booking.phone}`} className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-xl text-slate-600 text-sm font-bold hover:bg-slate-100 transition-colors w-full justify-center"><Phone size={16} /> {booking.phone}</a>}
                </div>
                
                {/* Colonna Destra: Dettagli Tecnici */}
                <div className="flex-1">
                    <h3 className={`text-lg font-bold text-[${HOGU_COLORS.dark}] mb-4 flex items-center gap-2`}><ListTodo size={20} className="text-slate-400"/> Dettagli Prenotazione</h3>
                    
                    <div className="grid grid-cols-2 gap-4 mb-6">
                        {/* Data e Ora */}
                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100"><span className="text-[10px] uppercase text-slate-400 font-bold tracking-wider block mb-1">Data</span><div className="flex items-center gap-2 font-bold text-slate-700 text-lg"><Calendar size={18} className={`text-[${HOGU_COLORS.primary}]`} /> {booking?.date}</div></div>
                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100"><span className="text-[10px] uppercase text-slate-400 font-bold tracking-wider block mb-1">Orario</span><div className="flex items-center gap-2 font-bold text-slate-700 text-lg"><Clock size={18} className={`text-[${HOGU_COLORS.primary}]`} /> {booking?.time}</div></div>
                        
                        {/* Quantità/Ospiti (Dinamico) */}
                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                             <span className="text-[10px] uppercase text-slate-400 font-bold tracking-wider block mb-1">
                                 {activeCategory === 'beb' ? 'Ospiti' : activeCategory === 'ncc' ? 'Passeggeri' : activeCategory === 'club' ? 'Ingressi' : 'Quantità'}
                             </span>
                             <div className="flex items-center gap-2 font-bold text-slate-700 text-lg">
                                 <User size={18} className={`text-[${HOGU_COLORS.primary}]`} /> 
                                 {booking?.guests || 1} 
                             </div>
                        </div>

                        {/* Prezzo */}
                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100"><span className="text-[10px] uppercase text-slate-400 font-bold tracking-wider block mb-1">Totale</span><div className={`flex items-center gap-2 font-extrabold text-[${HOGU_COLORS.dark}] text-lg`}>€ {booking?.price}</div></div>

                        {/* SEZIONE DINAMICA PER I DETTAGLI AGGIUNTIVI (ES. TAVOLO CLUB) */}
                        {renderExtraDetails()}
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
    useEffect(() => { if(isOpen) setReason(""); }, [isOpen]);
    if (!isOpen) return null;
    return (
        <ModalBackdrop onClose={onClose}>
            <div className="max-w-sm mx-auto">
                <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-500 mb-4 mx-auto"><AlertTriangle size={24}/></div>
                <h2 className={`font-bold text-xl text-[${HOGU_COLORS.dark}] mb-2 text-center`}>Segnala Problema</h2>
                <textarea className="w-full border border-slate-200 p-4 rounded-xl mb-6 bg-slate-50 focus:ring-2 focus:ring-amber-100 outline-none transition-all text-sm" rows="3" placeholder="Dettagli segnalazione..." value={reason} onChange={e => setReason(e.target.value)}/>
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
                <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center text-red-500 mb-4 mx-auto"><Ban size={24}/></div>
                <h2 className={`font-bold text-xl text-[${HOGU_COLORS.dark}] mb-2 text-center`}>Annulla Prenotazione</h2>
                <textarea className="w-full border border-slate-200 p-4 rounded-xl mb-6 bg-slate-50 focus:ring-2 focus:ring-red-100 outline-none transition-all text-sm" rows="3" placeholder="Motivo..." value={reason} onChange={e => setReason(e.target.value)}/>
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
        if(isOpen && booking) { setNewPrice(booking.price); setNote(""); }
    }, [isOpen, booking]);
    if (!isOpen || !booking) return null;
    return (
        <ModalBackdrop onClose={onClose}>
            <div className="max-w-sm mx-auto">
                <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-500 mb-4 mx-auto"><RefreshCw size={24}/></div>
                <h2 className={`font-bold text-xl text-[${HOGU_COLORS.dark}] mb-2 text-center`}>Rettifica Prezzo</h2>
                <div className="mb-4">
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Nuovo Prezzo (€)</label>
                    <input type="number" className="w-full border border-slate-200 p-4 rounded-xl bg-slate-50 focus:ring-2 focus:ring-amber-100 outline-none font-bold text-slate-800" value={newPrice} onChange={e => setNewPrice(e.target.value)}/>
                </div>
                <div className="mb-6">
                     <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Note</label>
                    <textarea className="w-full border border-slate-200 p-4 rounded-xl bg-slate-50 focus:ring-2 focus:ring-amber-100 outline-none text-sm" rows="3" value={note} onChange={e => setNote(e.target.value)}/>
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
    const [isLoadingModalEvents, setIsLoadingModalEvents] = useState(false); // Stato per il caricamento della modale

    // Configurazione elementi per pagina
    const ITEMS_PER_PAGE_PENDING = 3;
    const ITEMS_PER_PAGE_EVENTS = 4;
    const ITEMS_PER_PAGE_HISTORY = 3;
    const ITEMS_PER_MODAL_PAGE = 3;

    // --- FILTRI ---
    const [filter, setFilter] = useState('active'); // 'active' o 'past'

    // --- MODALI & UI ---
    const [detailsOpen, setDetailsOpen] = useState(false);
    const [complaintOpen, setComplaintOpen] = useState(false);
    const [cancelOpen, setCancelOpen] = useState(false);
    const [correctionOpen, setCorrectionOpen] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState(null);
    
    // Stato menu & modale selezione
    const [eventActionMenuOpen, setEventActionMenuOpen] = useState(false);
    const [eventSelectionOpen, setEventSelectionOpen] = useState(false);
    
    // REFS per il click outside (Desktop e Mobile separati)
    const actionMenuRef = useRef(null);
    const mobileMenuRef = useRef(null);

    // Click outside handler: chiude se clicchi fuori DA ENTRAMBI i menu
    useEffect(() => {
        const handleClickOutside = (event) => {
            const isOutsideDesktop = actionMenuRef.current && !actionMenuRef.current.contains(event.target);
            const isOutsideMobile = mobileMenuRef.current && !mobileMenuRef.current.contains(event.target);
            
            if (isOutsideDesktop && isOutsideMobile) {
                setEventActionMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // =================================================================================
    // API CALLS & EFFECTS
    // =================================================================================

    // 1. CARICAMENTO INFO INIZIALI (Ottieni ID e Stats)
    useEffect(() => {
        const fetchInfo = async () => {
            try {
                const info = await clubService.getInfo();
                if (info) {
                    setClubId(info.clubId);
                    setStats({
                        revenue: info.totalBookingsAmount,
                        count: info.totalBookings
                    });
                }
            } catch (error) {
                console.error("Errore recupero info club", error);
            }
        };
        fetchInfo();
    }, []);

    // 2. CARICAMENTO EVENTI OGGI
    useEffect(() => {

        if (!clubId) return;
        const fetchTodayEvents = async () => {
            try {
                const data = await clubService.getEventsToday(clubId, eventsPage - 1, ITEMS_PER_PAGE_EVENTS);
                
                const fixedEvents = data.content.map(ev => {
                    // Gestione data
                    const startTime = ev.startTime || ev.time; // Fallback
                    let displayTime = "--:--";
                    if (startTime) {
                        const d = new Date(startTime);
                        displayTime = d.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
                    }

                    // Gestione immagine (supporta sia array stringhe che stringa singola)
                    let imgUrl = 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&q=80&w=600';
                    if (ev.images && ev.images.length > 0) {
                        const filename = ev.images[0];
                        imgUrl = filename.startsWith('http') 
                            ? filename 
                            : `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'}/uploads/${filename}`;
                    }

                    return {
                        id: ev.id,
                        label: ev.name || ev.label || "Evento", // Cerca sia name (backend) che label (frontend)
                        time: displayTime,
                        image: imgUrl,
                        totalBookings: ev.totalBookings || 0,
                        checkedIn: ev.checkedIn || 0
                    };
                });

                setTodayEvents(fixedEvents);
                setTotalPagesEvents(data.totalPages);
            } catch (error) {
                console.error("Errore eventi oggi", error);
            }
        };
        fetchTodayEvents();
    }, [clubId, eventsPage]);

    // 3. CARICAMENTO PRENOTAZIONI (Per Pending e History)
    // Helper per aggiornare le liste (simulazione filtro server-side tramite chiamate separate)
    const fetchBookings = useCallback(async () => {
        if (!clubId) return;
        try {
            // Chiamata per la sezione PENDING (Top)
            // Se l'API supportasse il filtro status, passeremmo 'pending'.
            // Il service mappa già i campi (bookingFullName -> customerName)
            const pendingRes = await clubService.getBookings(clubId, pendingPage - 1, ITEMS_PER_PAGE_PENDING);
            
            // FILTRO LATO CLIENT
            setPendingList(pendingRes.content.filter(b => b.status === 'pending' || b.status === 'waiting_customer')); 
            setTotalPagesPending(pendingRes.totalPages);

            // Chiamata per la sezione HISTORY (Bottom)
            const historyRes = await clubService.getBookings(clubId, historyPage - 1, ITEMS_PER_PAGE_HISTORY);
            
            // Filtro client per mostrare active/past
            const historyFiltered = historyRes.content.filter(b => {
                if (b.status === 'pending' || b.status === 'waiting_customer') return false;
                if (filter === 'active') return b.status === 'confirmed';
                if (filter === 'past') return ['completed', 'cancelled'].includes(b.status);
                return true;
            });
            setHistoryList(historyFiltered);
            setTotalPagesHistory(historyRes.totalPages);

        } catch (error) {
            console.error("Errore bookings", error);
        }
    }, [clubId, pendingPage, historyPage, filter]);

    useEffect(() => {
        fetchBookings();
    }, [fetchBookings]);


    // 4. CARICAMENTO TUTTI GLI EVENTI (Per Modale Selezione)
    useEffect(() => {
        if (!clubId || !eventSelectionOpen) return;
        
        const fetchAllEvents = async () => {
            setIsLoadingModalEvents(true); // START LOADING
            try {
                const data = await clubService.getAllEvents(clubId, modalEventsPage - 1, ITEMS_PER_MODAL_PAGE);
                
                // MAPPING DEI DATI: Trasforma name->label, startTime->time e gestisce le immagini
                const mappedContent = data.content.map(ev => {
                    // 1. Gestione Data/Ora
                    let displayTime = "--:--";
                    if (ev.startTime) {
                        const d = new Date(ev.startTime);
                        // Formattazione "15 Dic • 17:30"
                        const dateStr = d.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' });
                        const timeStr = d.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
                        displayTime = `${dateStr} • ${timeStr}`;
                    }

                    // 2. Gestione Immagine
                    let imgUrl = 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&q=80&w=600';
                    if (ev.images && ev.images.length > 0) {
                        const filename = ev.images[0];
                        imgUrl = filename.startsWith('http') 
                            ? filename 
                            : `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'}/uploads/${filename}`;
                    } else if (ev.image) {
                        imgUrl = ev.image;
                    }

                    return {
                        id: ev.id,
                        label: ev.name || ev.label || "Evento", // Fix: usa ev.name se ev.label manca
                        time: displayTime,
                        image: imgUrl
                    };
                });

                setModalEvents(mappedContent);
                setTotalPagesModal(data.totalPages);
            } catch (error) {
                console.error("Errore tutti eventi", error);
            } finally {
                setIsLoadingModalEvents(false); // END LOADING
            }
        };
        fetchAllEvents();
    }, [clubId, modalEventsPage, eventSelectionOpen]);

    const handleAccept = async (id) => {
        // await clubService.acceptBooking(id); // Esempio API mancante
        // Ricarichiamo i dati per riflettere il cambio
        fetchBookings(); 
    };

    const handleReject = (bk) => { setSelectedBooking(bk); setCancelOpen(true); };
    const handleRectify = (bk) => { setSelectedBooking(bk); setCorrectionOpen(true); };
    
    const confirmCancel = async (id, reason) => {
        // await clubService.cancelBooking(id, reason);
        setCancelOpen(false);
        fetchBookings();
    };

    const confirmComplaint = async () => { 
        alert("Segnalazione inviata"); 
        setComplaintOpen(false); 
    };

    const confirmCorrection = async (id, price, note) => {
        // await clubService.updatePrice(id, price, note);
        setCorrectionOpen(false);
        fetchBookings();
    };

    const handleFilterChange = (newFilter) => { setFilter(newFilter); setHistoryPage(1); };

    const handleEventAction = (action) => {
        setEventActionMenuOpen(false);
        if (action === 'create') {
            navigate('/provider/edit/club/event'); 
        } else if (action === 'edit') {
            setEventSelectionOpen(true);
            if (modalEventsPage !== 1) setModalEventsPage(1);
        }
    };

    const handleSelectEventToEdit = (eventId) => {
        setEventSelectionOpen(false);
        navigate(`/provider/edit/club/event/${eventId}`);
    };

    return (
        <div className="space-y-6 md:space-y-10 animate-in fade-in pb-24 md:pb-12 relative">
            
            {/* --- COMPONENTI MOBILE DEDICATI --- */}
            
            {!isMobileOverlayOpen && (
                <MobileStickyTrigger 
                    count={pendingList.length} 
                    onClick={() => setIsMobileOverlayOpen(true)} 
                />
            )}

            <MobilePendingFullPage 
                isOpen={isMobileOverlayOpen} 
                onClose={() => setIsMobileOverlayOpen(false)}
                pendingList={pendingList}
                onAccept={handleAccept}
                onReject={handleReject}
                onRectify={handleRectify}
                onOpenDetails={(bk) => { setSelectedBooking(bk); setDetailsOpen(true); }}
            />

            {/* --- UI STANDARD --- */}

            <BookingDetailModal isOpen={detailsOpen} onClose={() => setDetailsOpen(false)} booking={selectedBooking} />
            <CancellationModal isOpen={cancelOpen} onClose={() => setCancelOpen(false)} onConfirm={confirmCancel} booking={selectedBooking} />
            <ComplaintModal isOpen={complaintOpen} onClose={() => setComplaintOpen(false)} onConfirm={confirmComplaint} booking={selectedBooking} />
            <PriceCorrectionModal isOpen={correctionOpen} onClose={() => setCorrectionOpen(false)} onConfirm={confirmCorrection} booking={selectedBooking} />

            {/* MODALE SELEZIONE EVENTO DA MODIFICARE */}
            {eventSelectionOpen && (
                // USIAMO FullModalBackdrop che forza gli stili di copertura totale
                <FullModalBackdrop onClose={() => setEventSelectionOpen(false)}>
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold text-slate-800">Seleziona Evento</h3>
                        <button onClick={() => setEventSelectionOpen(false)} className="p-2 bg-slate-50 hover:bg-slate-100 rounded-full transition-colors">
                            <X size={20} className="text-slate-500"/>
                        </button>
                    </div>
                    
                    {/* VISUALIZZAZIONE DEL CARICAMENTO */}
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
                                        <img src={ev.image} alt="" className="w-12 h-12 rounded-xl object-cover" />
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

            {/* 0. TOP SECTION: STATS + ACTION BOX */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
                <div className="lg:col-span-2">
                    <StatsSummary 
                        activeCategory="club" 
                        revenue={stats.revenue} 
                        count={stats.count}
                    />
                </div>

                {/* BOX GESTIONE EVENTI */}
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
                                onClick={() => setEventActionMenuOpen(!eventActionMenuOpen)}
                                className="w-full bg-white text-slate-900 font-bold py-3 px-4 rounded-xl flex items-center justify-between hover:bg-slate-100 transition-colors active:scale-95 shadow-lg relative z-20"
                            >
                                <span className="flex items-center gap-2"><MousePointer2 size={18}/> Azioni Rapide</span>
                                <ChevronDown size={18} className={`transition-transform ${eventActionMenuOpen ? 'rotate-180' : ''}`}/>
                            </button>

                            {eventActionMenuOpen && (
                                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 origin-top z-50">
                                    <button onClick={() => handleEventAction('create')} className={`w-full text-left px-4 py-3 text-sm font-bold text-slate-700 hover:bg-[${HOGU_COLORS.primary}] hover:text-white flex items-center gap-2 transition-colors border-b border-slate-50`}>
                                        <Plus size={16}/> Nuovo Evento
                                    </button>
                                    <button onClick={() => handleEventAction('edit')} className="w-full text-left px-4 py-3 text-sm font-bold text-slate-700 hover:bg-amber-500 hover:text-white flex items-center gap-2 transition-colors">
                                        <Edit3 size={16}/> Modifica Esistente
                                    </button>
                                </div>
                            )}
                         </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 lg:hidden">
                         <button onClick={() => navigate('/validator?type=club')} className="bg-[#1a1a1a] text-white p-4 rounded-2xl flex flex-col items-center justify-center gap-2 shadow-lg">
                            <ScanLine size={24} />
                            <span className="text-xs font-bold">Scanner</span>
                         </button>
                         
                         {/* *** FIX MENU MOBILE: Struttura Corretta con REF dedicato *** */}
                         <div className="relative" ref={mobileMenuRef}>
                            <button 
                                onClick={() => setEventActionMenuOpen(!eventActionMenuOpen)} 
                                className="w-full h-full bg-white text-slate-700 p-4 rounded-2xl flex flex-col items-center justify-center gap-2 border border-slate-100 shadow-sm active:scale-95 transition-transform"
                            >
                                <PartyPopper size={24} />
                                <span className="text-xs font-bold">Eventi</span>
                            </button>
                              
                             {eventActionMenuOpen && (
                                 <div className="absolute bottom-full right-0 mb-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 z-50 p-1 animate-in fade-in zoom-in-95 origin-bottom-right">
                                     <button 
                                         type="button"
                                         onClick={() => handleEventAction('create')} 
                                         className="w-full p-3 text-xs font-bold hover:bg-slate-50 text-slate-700 rounded-lg flex items-center gap-2 text-left"
                                     >
                                         <Plus size={14} /> Crea Nuovo
                                     </button>
                                     <button 
                                         type="button"
                                         onClick={() => handleEventAction('edit')} 
                                         className="w-full p-3 text-xs font-bold hover:bg-amber-500 hover:text-white text-slate-700 rounded-lg flex items-center gap-2 border-t border-slate-50 text-left"
                                     >
                                         <Edit3 size={14} /> Modifica
                                     </button>
                                 </div>
                             )}
                         </div>
                    </div>

                </div>
            </div>

            {/* 1. SEZIONE PRIORITARIA: RICHIESTE PENDING */}
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
                        <PaginationControls 
                            currentPage={pendingPage} 
                            totalPages={totalPagesPending} 
                            onNext={() => setPendingPage(p => p + 1)} 
                            onPrev={() => setPendingPage(p => p - 1)} 
                        />
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
            <section className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl shadow-slate-900/20 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none"><PartyPopper size={200} /></div>
                
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 relative z-10 mb-8">
                    <div>
                        <h2 className="text-xl font-bold flex items-center gap-3">
                            <PartyPopper className={`text-[${HOGU_COLORS.primary}]`}/> Monitoraggio Eventi
                        </h2>
                        <p className="text-slate-400 text-sm mt-1">Gestisci i flussi di ingresso in tempo reale.</p>
                    </div>
                    <PaginationControls 
                        currentPage={eventsPage} 
                        totalPages={totalPagesEvents} 
                        onNext={() => setEventsPage(p => p + 1)} 
                        onPrev={() => setEventsPage(p => p - 1)} 
                        darkBg={true}
                    />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 relative z-10">
                    {todayEvents.length > 0 ? (
                        todayEvents.map(ev => (
                            <TodayEventCard key={ev.id} event={ev} onValidate={() => alert('Scanner QR')} />
                        ))
                    ) : (
                        <div className="col-span-4 text-center text-slate-500 py-10">Nessun evento oggi</div>
                    )}
                </div>
            </section>

            {/* 3. STORICO & AGENDA */}
            <section>
                <div className="flex flex-col sm:flex-row justify-between items-end sm:items-center gap-4 mb-6">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                            <Calendar size={22} className={`text-[${HOGU_COLORS.primary}]`}/> Agenda & Storico
                        </h2>
                    </div>
                    
                    <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                        <div className="flex bg-white p-1 rounded-2xl border border-slate-200 shadow-sm">
                            <button onClick={() => handleFilterChange('active')} className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wide transition-all ${filter === 'active' ? `bg-[${HOGU_COLORS.primary}] text-white shadow-md` : 'text-slate-400 hover:bg-slate-50'}`}>In Arrivo</button>
                            <button onClick={() => handleFilterChange('past')} className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wide transition-all ${filter === 'past' ? 'bg-slate-800 text-white shadow-md' : 'text-slate-400 hover:bg-slate-50'}`}>Archivio</button>
                        </div>
                        <PaginationControls 
                            currentPage={historyPage} 
                            totalPages={totalPagesHistory} 
                            onNext={() => setHistoryPage(p => p + 1)} 
                            onPrev={() => setHistoryPage(p => p - 1)} 
                        />
                    </div>
                </div>

                <div className="flex flex-col gap-4">
                    {historyList.length > 0 ? (
                        historyList.map(b => (
                            <ProviderBookingCard 
                                key={b.id} 
                                booking={b} 
                                activeCategory="club"
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
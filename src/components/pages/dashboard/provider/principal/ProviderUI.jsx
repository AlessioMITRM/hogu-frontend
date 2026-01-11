import React, { useState, useRef, useEffect } from 'react';
import { 
    Calendar, Clock, ChevronLeft, ChevronRight, Eye, MoreVertical, 
    AlertTriangle, Ban, BellRing, Edit2, CheckCircle, XCircle,
    User, Wallet, TrendingUp, Activity, Sparkles, Timer, ScanLine,
    Phone, ListTodo, RefreshCw, Send, Lock, ShieldAlert,
    Utensils, BedDouble, Car, Luggage, PartyPopper
} from 'lucide-react';

// --- CONFIGURAZIONE CATEGORIE (Per Icone e Label) ---
export const SERVICE_CATEGORIES = {
    RESTAURANT: { id: 'restaurant', label: 'Ristorante', icon: Utensils, unit: 'Coperti' },
    BEB: { id: 'beb', label: 'B&B / Hotel', icon: BedDouble, unit: 'Notti' },
    CLUB: { id: 'club', label: 'Club / Eventi', icon: PartyPopper, unit: 'Ingressi' },
    NCC: { id: 'ncc', label: 'NCC / Trasporti', icon: Car, unit: 'Passeggeri' },
    STORAGE: { id: 'storage', label: 'Depositi', icon: Luggage, unit: 'Bagagli' }
};

// AGGIUNTO 'export' QUI PER POTERLO USARE IN ALTRE DASHBOARD
export const ModalBackdrop = ({ children, onClose }) => (
    <div className="fixed inset-0 bg-[#1A202C]/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={onClose}>
        <div className="bg-white p-8 rounded-[2.5rem] w-full max-w-2xl shadow-2xl shadow-black/20 transform animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            {children}
        </div>
    </div>
);

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

export const CategorySpecificDetails = ({ booking, category }) => {
    const config = SERVICE_CATEGORIES[category?.toUpperCase()] || SERVICE_CATEGORIES.RESTAURANT;
    const Icon = config.icon;
    let detailText = `${booking.guests} Ospiti`;
    
    if (category === 'beb') detailText = `${booking.guests} Ospiti • ${booking.quantity || 1} Notti`;
    if (category === 'storage') detailText = `${booking.quantity || 1} Bagagli`;
    if (category === 'ncc') detailText = `${booking.guests} Pax • ${booking.location || 'Transfer'}`;

    return (
        <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-medium">
            <Icon size={12}/> {detailText}
        </div>
    );
};

export const StatsSummary = ({ activeCategory }) => {
    const label = SERVICE_CATEGORIES[activeCategory?.toUpperCase()]?.label || 'Attività';
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
            <div className="md:col-span-1 bg-[#1A202C] rounded-[2rem] p-6 text-white relative overflow-hidden shadow-xl shadow-slate-900/10 group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform duration-500"><Wallet size={100} /></div>
                <div className="relative z-10">
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Fatturato {label}</p>
                    <h3 className="text-3xl font-extrabold mb-4">€ --.--<span className="text-slate-500 text-lg">,00</span></h3>
                </div>
            </div>
            <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col justify-center relative overflow-hidden group hover:border-[#68B49B]/30 hover:shadow-lg transition-all">
                 <div className="absolute -right-4 -bottom-4 text-slate-50 opacity-50 group-hover:text-[#68B49B]/10 transition-colors"><Activity size={100} /></div>
                <div className="flex items-center gap-2 text-slate-400 mb-2">
                    <Activity size={18} /> <span className="text-xs font-bold uppercase">Prenotazioni</span>
                </div>
                <span className="text-4xl font-black text-slate-800 group-hover:text-[#68B49B] transition-colors">--</span>
                <p className="text-xs text-slate-400 mt-2 font-medium">Totali questo mese</p>
            </div>
        </div>
    );
};

// --- CARDS PRINCIPALI ---

export const PendingRequestCard = ({ booking, onAccept, onReject, onRectify, onOpenDetails, activeCategory }) => {
    const isWaitingCustomer = booking.status === 'waiting_customer';
    return (
        <div className={`group bg-white rounded-3xl p-5 border shadow-[0_2px_15px_-3px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_25px_-5px_rgba(104,180,155,0.15)] transition-all duration-300 flex flex-col relative overflow-hidden h-full 
        ${isWaitingCustomer ? 'border-blue-100 bg-blue-50/30' : 'border-slate-100 hover:border-[#68B49B]/30'}`}>
        <div className={`absolute left-0 top-0 bottom-0 w-1.5 opacity-80 ${isWaitingCustomer ? 'bg-blue-400' : 'bg-gradient-to-b from-amber-300 to-amber-500'}`}></div>
        <div className="flex items-start justify-between gap-4 mb-5 pl-2">
            <div className="flex gap-4">
                <div className="relative shrink-0">
                    <img src={booking.image} alt="" className="w-14 h-14 rounded-2xl object-cover shadow-sm ring-2 ring-white" />
                    {!isWaitingCustomer && (<div className="absolute -bottom-2 -right-1 bg-amber-400 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full border-2 border-white shadow-sm tracking-wide">NEW</div>)}
                </div>
                <div>
                    <h4 className="font-bold text-[#1A202C] text-lg leading-tight mb-0.5">{booking.customerName}</h4>
                    <p className="text-xs text-[#68B49B] font-bold uppercase tracking-wide mb-1">{booking.serviceName}</p>
                    <CategorySpecificDetails booking={booking} category={activeCategory} />
                </div>
            </div>
            <div className="text-right">
                <span className={`block font-extrabold text-lg ${isWaitingCustomer ? 'text-blue-600' : 'text-[#1A202C]'}`}>€ {booking.price}</span>
                {booking.oldPrice && <span className="text-xs text-slate-400 line-through">€ {booking.oldPrice}</span>}
            </div>
        </div>
        <div className="grid grid-cols-2 gap-3 mb-5 pl-2">
            <div className="bg-slate-50 p-2 rounded-xl border border-slate-100"><span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Data</span><div className="flex items-center gap-2 text-slate-700 font-bold text-sm"><Calendar size={14} className="text-[#68B49B]"/>{booking.date}</div></div>
            <div className="bg-slate-50 p-2 rounded-xl border border-slate-100"><span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Ora</span><div className="flex items-center gap-2 text-slate-700 font-bold text-sm"><Clock size={14} className="text-[#68B49B]"/>{booking.time}</div></div>
        </div>
        <div className="mt-auto pl-2">
            {isWaitingCustomer ? (
                <div className="w-full bg-blue-100 text-blue-600 py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 border border-blue-200"><Clock size={16} className="animate-pulse"/> In attesa del cliente...</div>
            ) : (
                <div className="flex gap-2">
                    <button onClick={() => onAccept(booking.id)} className="flex-1 bg-[#68B49B] text-white px-3 py-2.5 rounded-xl font-bold text-xs md:text-sm hover:bg-[#5aa38d] shadow-sm hover:shadow-[#68B49B]/20 active:scale-95 transition-all flex items-center justify-center gap-1.5"><CheckCircle size={16}/> Accetta</button>
                    <button onClick={() => onRectify(booking)} className="px-3 py-2.5 bg-amber-50 text-amber-600 border border-amber-100 rounded-xl font-bold text-xs md:text-sm hover:bg-amber-100 transition-all flex items-center justify-center gap-1.5"><Edit2 size={16}/></button>
                    <button onClick={() => onReject(booking)} className="w-10 h-10 shrink-0 flex items-center justify-center bg-white border border-slate-200 text-slate-400 rounded-xl hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-all"><XCircle size={18}/></button>
                    <button onClick={() => onOpenDetails(booking)} className="w-10 h-10 shrink-0 flex items-center justify-center bg-slate-50 text-slate-400 rounded-xl hover:bg-slate-100 hover:text-[#68B49B] transition-all"><Eye size={18} /></button>
                </div>
            )}
        </div>
        </div>
    );
};

export const ProviderBookingCard = ({ booking, onOpenDetails, onOpenComplaint, onCancelBooking, activeCategory }) => {
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
            ${isCancelled ? 'bg-red-50 border-red-200' : 'bg-white border-slate-100 hover:border-[#68B49B]/30 hover:shadow-lg hover:shadow-slate-200/50'}`}>
            <div className={`w-20 h-20 rounded-2xl overflow-hidden shrink-0 shadow-sm ring-1 ${isCancelled ? 'ring-red-100 grayscale' : 'ring-slate-100'}`}>
                <img src={booking.image} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"/>
            </div>
            <div className="flex-1 flex flex-col justify-between">
                <div className="flex justify-between items-start mb-2">
                    <div>
                        <h4 className={`font-bold text-lg ${isCancelled ? 'text-red-700 line-through decoration-red-400' : 'text-[#1A202C]'}`}>{booking.customerName}</h4>
                        <p className={`text-xs font-medium uppercase tracking-wide ${isCancelled ? 'text-red-400' : 'text-slate-500'}`}>{booking.serviceName}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <StatusBadge status={booking.status} />
                        <button onClick={() => onOpenDetails(booking)} className={`w-8 h-8 flex items-center justify-center rounded-full transition-all ml-1 shadow-sm ${isCancelled ? 'bg-red-100 text-red-500 hover:bg-red-200' : 'bg-slate-50 text-slate-400 hover:bg-[#68B49B] hover:text-white'}`}><Eye size={16}/></button>
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
                         <span className={`flex items-center gap-1.5 px-2 py-1 rounded-md ${isCancelled ? 'bg-red-100/50' : 'bg-slate-50'}`}><Calendar size={12} className={isCancelled ? "text-red-500" : "text-[#68B49B]"}/> {booking.date}</span>
                         <span className={`flex items-center gap-1.5 px-2 py-1 rounded-md ${isCancelled ? 'bg-red-100/50' : 'bg-slate-50'}`}><Clock size={12} className={isCancelled ? "text-red-500" : "text-[#68B49B]"}/> {booking.time}</span>
                    </div>
                    <span className={`font-extrabold text-lg ${isCancelled ? 'text-red-600' : 'text-[#1A202C]'}`}>€ {booking.price}</span>
                </div>
            </div>
        </div>
    );
};

export const TodayEventCard = ({ event, onValidate }) => (
    <div className="group bg-white/10 border border-white/10 hover:bg-white/20 p-5 rounded-3xl backdrop-blur-md transition-all flex flex-col justify-between h-full relative overflow-hidden">
        <div className="absolute inset-0 z-0">
            <img src={event.image} alt="" className="w-full h-full object-cover opacity-20 group-hover:scale-110 transition-transform duration-700" />
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
        <img src={service.image} alt={service.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000" />
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
              <span className="text-3xl font-bold text-[#1A202C]">€ {service.price}</span>
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

export const BookingDetailModal = ({ isOpen, onClose, booking }) => {
    if(!isOpen || !booking) return null;
    return (
        <ModalBackdrop onClose={onClose}>
            <div className="flex flex-col md:flex-row gap-8">
                <div className="w-full md:w-1/3 flex flex-col items-center text-center border-b md:border-b-0 md:border-r border-slate-100 pb-6 md:pb-0 md:pr-6">
                    <div className="relative mb-4">
                        <img src={booking?.image} className="w-28 h-28 rounded-3xl object-cover shadow-xl ring-4 ring-white" alt="" />
                        <div className="absolute -bottom-2 -right-2 bg-white p-1.5 rounded-xl shadow-sm"><StatusBadge status={booking?.status}/></div>
                    </div>
                    <h2 className="font-extrabold text-2xl text-[#1A202C] mb-1">{booking?.customerName}</h2>
                    <p className="text-[#68B49B] font-bold text-sm mb-4">{booking?.serviceName}</p>
                    {booking?.phone && <a href={`tel:${booking.phone}`} className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-xl text-slate-600 text-sm font-bold hover:bg-slate-100 transition-colors w-full justify-center"><Phone size={16} /> {booking.phone}</a>}
                </div>
                <div className="flex-1">
                    <h3 className="text-lg font-bold text-[#1A202C] mb-4 flex items-center gap-2"><ListTodo size={20} className="text-slate-400"/> Dettagli Appuntamento</h3>
                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100"><span className="text-[10px] uppercase text-slate-400 font-bold tracking-wider block mb-1">Data</span><div className="flex items-center gap-2 font-bold text-slate-700 text-lg"><Calendar size={18} className="text-[#68B49B]" /> {booking?.date}</div></div>
                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100"><span className="text-[10px] uppercase text-slate-400 font-bold tracking-wider block mb-1">Orario</span><div className="flex items-center gap-2 font-bold text-slate-700 text-lg"><Clock size={18} className="text-[#68B49B]" /> {booking?.time}</div></div>
                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                             <span className="text-[10px] uppercase text-slate-400 font-bold tracking-wider block mb-1">
                                {booking.category === 'beb' ? 'Ospiti / Notti' : booking.category === 'ncc' ? 'Passeggeri' : 'Ospiti'}
                             </span>
                             <div className="flex items-center gap-2 font-bold text-slate-700 text-lg">
                                <User size={18} className="text-[#68B49B]" /> 
                                {booking?.guests} 
                                {booking?.quantity && <span className='text-sm text-slate-400'> ({booking.quantity} {booking.category === 'beb' ? 'nt' : 'pz'})</span>}
                             </div>
                        </div>
                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100"><span className="text-[10px] uppercase text-slate-400 font-bold tracking-wider block mb-1">Totale</span><div className="flex items-center gap-2 font-extrabold text-[#1A202C] text-lg">€ {booking?.price}</div></div>
                    </div>
                    <div className="flex gap-3 mt-auto">
                        <button onClick={onClose} className="flex-1 py-3.5 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-colors">Chiudi</button>
                    </div>
                </div>
            </div>
        </ModalBackdrop>
    );
};

export const ComplaintModal = ({ isOpen, onClose, onConfirm, booking }) => {
    const [reason, setReason] = useState("");
    useEffect(() => { if(isOpen) setReason(""); }, [isOpen]);
    if (!isOpen) return null;
    return (
        <ModalBackdrop onClose={onClose}>
            <div className="max-w-sm mx-auto">
                <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-500 mb-4 mx-auto"><AlertTriangle size={24}/></div>
                <h2 className="font-bold text-xl text-[#1A202C] mb-2 text-center">Segnala Problema</h2>
                <textarea className="w-full border border-slate-200 p-4 rounded-xl mb-6 bg-slate-50 focus:ring-2 focus:ring-amber-100 outline-none transition-all text-sm" rows="3" placeholder="Dettagli segnalazione..." value={reason} onChange={e => setReason(e.target.value)}/>
                <button onClick={() => onConfirm(booking.id, reason)} disabled={!reason.trim()} className="w-full bg-amber-500 text-white py-3 rounded-xl font-bold text-sm hover:bg-amber-600 transition-all">Invia Segnalazione</button>
            </div>
        </ModalBackdrop>
    );
};

export const CancellationModal = ({ isOpen, onClose, onConfirm, booking }) => {
    const [reason, setReason] = useState("");
    if (!isOpen) return null;
    return (
        <ModalBackdrop onClose={onClose}>
            <div className="max-w-sm mx-auto">
                <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center text-red-500 mb-4 mx-auto"><Ban size={24}/></div>
                <h2 className="font-bold text-xl text-[#1A202C] mb-2 text-center">Annulla Prenotazione</h2>
                <textarea className="w-full border border-slate-200 p-4 rounded-xl mb-6 bg-slate-50 focus:ring-2 focus:ring-red-100 outline-none transition-all text-sm" rows="3" placeholder="Motivo..." value={reason} onChange={e => setReason(e.target.value)}/>
                <div className="flex gap-3">
                     <button onClick={onClose} className="flex-1 bg-slate-100 text-slate-600 py-3 rounded-xl font-bold text-sm">Indietro</button>
                    <button onClick={() => onConfirm(booking.id, reason)} className="flex-1 bg-red-500 text-white py-3 rounded-xl font-bold text-sm hover:bg-red-600 transition-all">Conferma</button>
                </div>
            </div>
        </ModalBackdrop>
    );
};

export const PriceCorrectionModal = ({ isOpen, onClose, onConfirm, booking }) => {
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
                <h2 className="font-bold text-xl text-[#1A202C] mb-2 text-center">Rettifica Prezzo</h2>
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
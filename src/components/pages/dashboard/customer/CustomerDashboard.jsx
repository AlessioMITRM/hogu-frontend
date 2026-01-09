import React, { useState, useRef, useEffect } from 'react';
import { 
    Calendar, MapPin, Clock, ChevronRight, ChevronLeft, CreditCard, 
    Star, Ticket, Utensils, Music, Car, Briefcase, Package, Bed, 
    Eye, AlertTriangle, X, MessageSquareWarning, MoreVertical, 
    CheckCircle, History, QrCode, Maximize2, Download, Phone, ScanLine,
    User, Navigation, Copy, RefreshCw, XCircle, Check,
    ShieldCheck
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { withAuthProtection } from './../../auth/withAuthProtection.jsx'; 

// --- MOCK DATA PRENOTAZIONI ---
const TODAY_DATE = "22 Nov 2025";

const mockBookings = [
  // --- RETTIFICA PREZZO (Waiting Customer) ---
  { id: 99, service: "Luxury Barber Shop", type: "Barber", date: "24 Nov 2025", time: "10:30", status: "waiting_customer", price: 45, oldPrice: 35, image: "https://picsum.photos/200/200?beard", address: "Via del Corso, 22", guests: 1, qrCode: null, phone: "+39 06 998877", description: "Taglio barba e capelli. Il gestore propone una rettifica.", providerNote: "Ciao Alessandro, per il servizio completo richiesto (incluso trattamento panni caldi extra) il prezzo corretto è 45€. Fammi sapere se va bene!" },

  // --- OGGI (Active) ---
  { id: 1, service: "Hogu Club Roma", type: "Club", date: TODAY_DATE, time: "23:30", status: "confirmed", price: 50, image: "https://picsum.photos/200/200?party", address: "Via del Colosseo, 1, Roma", guests: 2, qrCode: "HOGU-CLUB-001", phone: "+39 06 1234567", description: "Ingresso VIP con tavolo riservato." },
  
  // --- FUTURE (Active) ---
  { id: 2, service: "Ristorante Stellato", type: "Ristorante", date: "23 Nov 2025", time: "20:00", status: "pending", price: 120, image: "https://picsum.photos/200/200?food", address: "Piazza Navona, 1, Roma", guests: 2, qrCode: "FOOD-STAR-002", phone: "+39 06 7654321", description: "Cena degustazione 5 portate." },
  { id: 4, service: "Hogu Point Termini", type: "Luggage", date: "15 Dic 2025", time: "10:00 - 18:00", status: "confirmed", price: 12, image: "https://picsum.photos/200/200?bag", address: "Via Giolitti, 10, Roma", guests: 2, qrCode: "BAG-POINT-004", phone: "+39 333 9876543", description: "Deposito bagagli custodito." },
  { id: 6, service: "Aperitivo Rooftop", type: "Club", date: "01 Gen 2026", time: "18:00", status: "confirmed", price: 45, image: "https://picsum.photos/200/200?drink", address: "Terrazza Pincio, Roma", guests: 4, qrCode: "ROOF-TOP-006", phone: "+39 333 1122334", description: "Aperitivo con vista tramonto." },
  { id: 7, service: "Spa & Wellness", type: "B&B", date: "10 Feb 2026", time: "10:00", status: "confirmed", price: 90, image: "https://picsum.photos/200/200?spa", address: "Via Veneto, 5, Roma", guests: 1, qrCode: "SPA-RELAX-007", phone: "+39 06 5544332", description: "Percorso benessere 3 ore." },
  
  // --- STORICO (Past) ---
  { id: 3, service: "NCC Transfer", type: "NCC", date: "10 Ott 2025", time: "08:00", status: "completed", price: 85, image: "https://picsum.photos/200/200?car", address: "Fiumicino -> Centro", guests: 1, qrCode: "NCC-TRANS-003", phone: "+39 333 9988776", description: "Transfer privato aeroportuale." },
  { id: 5, service: "Trastevere Suite", type: "B&B", date: "24 Dic 2025", time: "Check-in 14:00", status: "cancelled", price: 240, image: "https://picsum.photos/200/200?room", address: "Vicolo del Cinque, 12", guests: 2, qrCode: "BNB-SUITE-005", phone: "+39 333 6677889", description: "Suite matrimoniale con colazione." },
  { id: 8, service: "Museo Vaticano", type: "Ticket", date: "01 Set 2025", time: "09:00", status: "completed", price: 30, image: "https://picsum.photos/200/200?art", address: "Viale Vaticano", guests: 1, qrCode: "MUS-VAT-008", phone: "+39 06 69884676", description: "Ingresso salta fila." },
];

// --- COMPONENTI UI LOCALI ---

const PaginationControls = ({ currentPage, totalPages, onNext, onPrev }) => {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center gap-2 bg-white rounded-full p-2 border border-slate-200 shadow-sm mx-auto">
      <button 
        onClick={onPrev} 
        disabled={currentPage === 1} 
        className="p-2 rounded-full hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-slate-600 border border-transparent hover:border-slate-200"
      >
        <ChevronLeft size={20} />
      </button>
      
      <span className="text-sm font-bold text-slate-600 min-w-[4rem] text-center tracking-wide">
        {currentPage} <span className="text-slate-300 mx-1">/</span> {totalPages}
      </span>
      
      <button 
        onClick={onNext} 
        disabled={currentPage === totalPages} 
        className="p-2 rounded-full hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-slate-600 border border-transparent hover:border-slate-200"
      >
        <ChevronRight size={20} />
      </button>
    </div>
  );
};

const StatusBadge = ({ status }) => {
  const styles = {
    confirmed: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-100', label: 'Confermata' },
    pending: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-100', label: 'In Attesa' },
    waiting_customer: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-100', label: 'Modifica Prezzo' }, // NUOVO STATO
    completed: { bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-200', label: 'Completata' },
    cancelled: { bg: 'bg-rose-50', text: 'text-rose-600', border: 'border-rose-100', label: 'Cancellata' }
  };
  const style = styles[status] || styles.completed;

  return (
    <span className={`px-2.5 py-1 rounded-full text-[10px] uppercase tracking-wider font-bold border ${style.bg} ${style.text} ${style.border}`}>
      {style.label}
    </span>
  );
};

const ServiceIcon = ({ type }) => {
  switch(type) {
    case 'Ristorante': return <Utensils size={14} />;
    case 'Club': return <Music size={14} />;
    case 'NCC': return <Car size={14} />;
    case 'Luggage': return <Package size={14} />;
    case 'B&B': return <Bed size={14} />;
    case 'Barber': return <User size={14} />;
    default: return <Briefcase size={14} />;
  }
};

const StatCard = ({ title, value, icon: Icon, colorClass }) => (
  <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] flex items-center gap-5 hover:shadow-md transition-shadow h-full">
    <div className={`p-4 rounded-2xl bg-slate-50 ${colorClass}`}>
      <Icon size={24} strokeWidth={1.5} />
    </div>
    <div>
      <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-0.5">{title}</p>
      <h3 className="text-2xl font-extrabold text-[#1A202C]">{value}</h3>
    </div>
  </div>
);

// --- NUOVO COMPONENTE: CARD RETTIFICA PREZZO ---
const PriceChangeRequestCard = ({ booking, onAccept, onReject }) => (
    <div className="bg-blue-50/50 rounded-3xl p-6 border border-blue-100 shadow-lg shadow-blue-100/50 mb-8 animate-in slide-in-from-top-4 fade-in duration-500">
        <div className="flex flex-col md:flex-row gap-6">
            {/* Left: Info */}
            <div className="flex-1">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2.5 bg-blue-100 text-blue-600 rounded-xl">
                        <RefreshCw size={24} className="animate-spin-slow" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-[#1A202C]">Richiesta Modifica Prezzo</h3>
                        <p className="text-sm text-slate-500">Il gestore ha proposto una variazione per la tua prenotazione.</p>
                    </div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-blue-100 mb-4">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                            <img src={booking.image} className="w-10 h-10 rounded-lg object-cover" alt=""/>
                            <div>
                                <p className="font-bold text-[#1A202C]">{booking.service}</p>
                                <p className="text-xs text-slate-400">{booking.date} • {booking.time}</p>
                            </div>
                        </div>
                    </div>
                    
                    {booking.providerNote && (
                        <div className="bg-slate-50 p-3 rounded-xl text-sm text-slate-600 italic border-l-4 border-blue-300 mb-3">
                            "{booking.providerNote}"
                        </div>
                    )}

                    <div className="flex items-center justify-between bg-blue-50/50 p-3 rounded-xl">
                        <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-slate-400 uppercase">Vecchio Prezzo</span>
                            <span className="text-lg font-bold text-slate-400 line-through decoration-slate-400/50">€ {booking.oldPrice}</span>
                        </div>
                        <div className="flex items-center text-blue-300">
                            <ChevronRight size={24} />
                        </div>
                        <div className="flex flex-col text-right">
                            <span className="text-[10px] font-bold text-blue-600 uppercase">Nuovo Prezzo</span>
                            <span className="text-2xl font-extrabold text-[#1A202C]">€ {booking.price}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right: Actions */}
            <div className="md:w-1/3 flex flex-col justify-center gap-3">
                <button 
                    onClick={() => onAccept(booking.id)}
                    className="w-full py-4 bg-[#1A202C] text-white rounded-xl font-bold hover:bg-black transition-all shadow-xl shadow-slate-900/10 flex items-center justify-center gap-2"
                >
                    <CheckCircle size={20} /> Accetta Modifica
                </button>
                <button 
                    onClick={() => onReject(booking.id)}
                    className="w-full py-4 bg-white text-rose-600 border border-rose-100 rounded-xl font-bold hover:bg-rose-50 transition-all flex items-center justify-center gap-2"
                >
                    <XCircle size={20} /> Rifiuta e Annulla
                </button>
            </div>
        </div>
    </div>
);

// --- BOOKING CARD (Agenda View) ---
const BookingCard = ({ booking, onOpenComplaint, onOpenQr, onOpenDetail }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="group bg-white rounded-3xl p-5 border border-slate-100 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_25px_-5px_rgba(104,180,155,0.15)] hover:border-[#68B49B]/30 transition-all duration-300 flex flex-col h-full relative">
      
      {/* Header Immagine & Titolo */}
      <div className="flex gap-4 mb-4">
        <div className="w-16 h-16 rounded-2xl overflow-hidden shrink-0 relative shadow-sm ring-1 ring-slate-100">
          <img src={booking.image} alt={booking.service} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 grayscale group-hover:grayscale-0" />
          <div className="absolute top-0 right-0 bg-white/90 backdrop-blur-sm p-1 rounded-bl-lg text-slate-600 shadow-sm border-b border-l border-white">
            <ServiceIcon type={booking.type} />
          </div>
        </div>
        <div className="flex-1 min-w-0">
            <h4 className={`font-bold text-lg truncate ${booking.status === 'cancelled' ? 'text-slate-400 line-through' : 'text-[#1A202C] group-hover:text-[#68B49B]'} transition-colors`}>
              {booking.service}
            </h4>
            <div className="flex items-center gap-1 text-xs text-slate-500 mb-2 truncate">
              <MapPin size={12} className="shrink-0" />
              <span className="truncate">{booking.address}</span>
            </div>
            <StatusBadge status={booking.status} />
        </div>
      </div>

      {/* Info Griglia */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Data</span>
          <div className="flex items-center gap-1.5 text-slate-700 font-bold text-xs">
            <Calendar size={12} className="text-[#68B49B]"/>{booking.date}
          </div>
        </div>
        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Ora</span>
          <div className="flex items-center gap-1.5 text-slate-700 font-bold text-xs">
            <Clock size={12} className="text-[#68B49B]"/>{booking.time}
          </div>
        </div>
      </div>

      {/* Footer & Azioni */}
      <div className="mt-auto flex items-center justify-between pt-4 border-t border-slate-50">
         <div className="font-extrabold text-[#1A202C] text-lg">€ {booking.price}</div>
         
         <div className="flex gap-2 relative">
            {/* TICKET QR BUTTON (Solo se confermato) */}
            {booking.status === 'confirmed' && (
              <button 
                onClick={() => onOpenQr(booking)}
                className="flex items-center justify-center gap-1.5 bg-[#68B49B]/10 text-[#33594C] px-3 py-2 rounded-xl text-xs font-bold hover:bg-[#68B49B] hover:text-white transition-all shadow-sm"
              >
                <Ticket size={14} /> Ticket
              </button>
            )}

             {/* BUTTON DETTAGLIO */}
             <button 
                onClick={() => onOpenDetail(booking)} 
                className="w-9 h-9 flex items-center justify-center bg-slate-50 text-slate-400 rounded-xl hover:bg-slate-100 hover:text-[#68B49B] transition-all border border-transparent hover:border-[#68B49B]/20"
                title="Dettaglio Prenotazione"
            >
                <Eye size={16} />
            </button>

            {/* MENU ALTRO */}
            <div className="relative" ref={menuRef}>
               <button 
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all ${isMenuOpen ? 'bg-slate-100 text-slate-600' : 'bg-white border border-slate-200 text-slate-400 hover:bg-slate-50'}`}
                >
                  <MoreVertical size={16} />
                </button>

                {isMenuOpen && (
                  <div className="absolute right-0 bottom-full mb-2 w-48 bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 p-1.5 z-50 animate-in fade-in zoom-in-95 duration-100 origin-bottom-right">
                    {booking.status === 'completed' && (
                      <button 
                        onClick={() => { setIsMenuOpen(false); console.log("Vota"); }}
                        className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-amber-50 hover:text-amber-600 transition-colors text-left"
                      >
                        <Star size={14} /> Lascia Recensione
                      </button>
                    )}
                    
                    <button 
                      onClick={() => { setIsMenuOpen(false); onOpenComplaint(booking); }}
                      className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-red-50 hover:text-red-600 transition-colors text-left"
                    >
                      <AlertTriangle size={14} /> Segnala Problema
                    </button>
                  </div>
                )}
            </div>
         </div>
      </div>
    </div>
  );
};

// --- NUOVA CARD "OGGI IN ARRIVO" ---
const TodayBookingCard = ({ booking, onOpenQr, onOpenDetail }) => (
    <div className="bg-gradient-to-br from-[#1A202C] to-slate-800 rounded-[2rem] p-6 text-white shadow-xl shadow-slate-900/20 relative overflow-hidden flex flex-col justify-between h-full min-h-[220px]">
        {/* Background decorative */}
        <div className="absolute top-0 right-0 p-8 opacity-10"><QrCode size={120} /></div>
        
        <div className="relative z-10 cursor-pointer" onClick={() => onOpenDetail(booking)}>
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-1 rounded-lg text-xs font-bold mb-4 border border-white/20">
                <Calendar size={14} /> OGGI • {booking.date}
            </div>
            <h3 className="text-2xl font-extrabold mb-1 leading-tight hover:text-[#68B49B] transition-colors">{booking.service}</h3>
            <p className="text-slate-300 text-sm mb-4">{booking.address}</p>
            
            <div className="flex items-center gap-4 text-sm font-bold">
                <span className="flex items-center gap-1.5"><Clock size={16} className="text-[#68B49B]" /> {booking.time}</span>
                <span className="w-1 h-1 bg-slate-500 rounded-full"></span>
                <span>{booking.type}</span>
            </div>
        </div>

        <button 
            onClick={() => onOpenQr(booking)}
            className="relative z-10 mt-6 w-full bg-[#68B49B] hover:bg-[#569c85] text-white py-3.5 rounded-xl font-bold shadow-lg shadow-[#68B49B]/30 flex items-center justify-center gap-2 transition-all transform hover:scale-105"
        >
            <ScanLine size={18} /> Mostra Ticket
        </button>
    </div>
);

// --- MODALE TICKET QR (Standard) ---
const TicketQRModal = ({ isOpen, onClose, booking }) => {
    const [isFullScreen, setIsFullScreen] = useState(false);

    useEffect(() => { if (!isOpen) setIsFullScreen(false); }, [isOpen]);
    if (!isOpen || !booking) return null;

    const handleDownload = () => alert("Simulazione Download Ticket...");

    return (
        <>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1A202C]/60 backdrop-blur-sm transition-opacity animate-in fade-in" onClick={onClose}>
                <div className="bg-white rounded-[2.5rem] w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden relative" onClick={e => e.stopPropagation()}>
                    <div className="bg-[#68B49B] p-6 text-center text-white relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                        <h3 className="text-xl font-extrabold relative z-10 uppercase tracking-widest">Digital Ticket</h3>
                        <div className="absolute -bottom-3 left-0 w-full h-6 bg-white rounded-t-[1.5rem]"></div>
                    </div>

                    <div className="px-8 pb-8 pt-2 text-center">
                        <h2 className="text-2xl font-bold text-[#1A202C] mb-1">{booking.service}</h2>
                        <p className="text-slate-500 text-sm mb-6">{booking.type} • {booking.guests} Ospiti</p>
                        <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl p-6 mb-6 relative group">
                            <button onClick={() => setIsFullScreen(true)} className="absolute top-3 right-3 p-2 bg-white rounded-full text-slate-400 hover:text-[#68B49B] shadow-sm transition-colors"><Maximize2 size={16} /></button>
                            <div className="w-40 h-40 bg-white mx-auto mb-3 rounded-xl flex items-center justify-center cursor-pointer" onClick={() => setIsFullScreen(true)}>
                                <QrCode size={100} className="text-[#1A202C]" />
                            </div>
                            <p className="font-mono text-xs font-bold text-slate-400 tracking-widest">{booking.qrCode || "HG-8829-X"}</p>
                        </div>
                        <button onClick={onClose} className="w-full py-3.5 bg-[#1A202C] text-white rounded-2xl font-bold shadow-lg hover:bg-black transition-colors">Chiudi</button>
                    </div>
                </div>
            </div>

            {isFullScreen && (
                <div className="fixed inset-0 z-[70] bg-black/95 backdrop-blur-md flex flex-col items-center justify-center p-6 animate-in fade-in duration-300">
                    <button onClick={() => setIsFullScreen(false)} className="absolute top-6 right-6 text-white/70 hover:text-white p-2 transition-colors bg-white/10 rounded-full"><X size={32} /></button>
                    <div className="bg-white p-8 rounded-[3rem] shadow-2xl flex flex-col items-center gap-8 max-w-sm w-full animate-in zoom-in-95 duration-300">
                        <div className="text-center">
                            <h3 className="text-2xl font-black text-[#1A202C] uppercase tracking-wide mb-1">Mostra all'ingresso</h3>
                            <p className="text-slate-400 font-medium">{booking.service}</p>
                        </div>
                        <div className="w-64 h-64 bg-slate-50 rounded-3xl flex items-center justify-center border-4 border-slate-100 p-4"><QrCode size={200} className="text-[#1A202C]" /></div>
                        <p className="font-mono text-2xl font-bold text-slate-800 tracking-widest">{booking.qrCode || "HG-8829-X"}</p>
                        <button onClick={handleDownload} className="w-full bg-[#68B49B] text-white py-4 rounded-2xl font-bold text-lg shadow-xl shadow-[#68B49B]/30 flex items-center justify-center gap-2 hover:scale-105 transition-transform"><Download size={24} /> Scarica Biglietto</button>
                    </div>
                </div>
            )}
        </>
    );
};

// --- MODALE DETTAGLIO PRENOTAZIONE ---
const BookingDetailModal = ({ isOpen, onClose, booking }) => {
    if (!isOpen || !booking) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-[#1A202C]/60 backdrop-blur-sm transition-opacity animate-in fade-in" onClick={onClose}>
            <div 
                className="bg-white rounded-[2.5rem] w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden relative max-h-[90vh] overflow-y-auto hide-scrollbar" 
                onClick={e => e.stopPropagation()}
            >
                {/* Close Button Overlay */}
                <button 
                    onClick={onClose}
                    className="absolute top-4 right-4 z-20 bg-black/20 hover:bg-black/40 text-white p-2 rounded-full backdrop-blur-md transition-colors"
                >
                    <X size={20} />
                </button>

                {/* Hero Image */}
                <div className="h-48 w-full relative">
                    <img src={booking.image} alt={booking.service} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
                    <div className="absolute bottom-4 left-6 text-white">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="bg-[#68B49B] px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider">{booking.type}</span>
                            <StatusBadge status={booking.status} />
                        </div>
                        <h2 className="text-2xl font-extrabold">{booking.service}</h2>
                    </div>
                </div>

                <div className="p-6">
                    {/* Descrizione */}
                    <p className="text-slate-500 text-sm mb-6 leading-relaxed">
                        {booking.description || "Dettagli completi della tua prenotazione presso la struttura."}
                    </p>

                    {/* Timeline Info */}
                    <div className="space-y-4 mb-8">
                        <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 shrink-0 mt-1">
                                <Calendar size={18} />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Data & Ora</p>
                                <p className="text-[#1A202C] font-bold">{booking.date}</p>
                                <p className="text-slate-500 text-sm">alle {booking.time}</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 shrink-0 mt-1">
                                <MapPin size={18} />
                            </div>
                            <div className="flex-1">
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Indirizzo</p>
                                <p className="text-[#1A202C] font-bold">{booking.address}</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 shrink-0 mt-1">
                                <User size={18} />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Ospiti</p>
                                <p className="text-[#1A202C] font-bold">{booking.guests} Persone</p>
                            </div>
                        </div>
                    </div>

                    {/* Riepilogo Costi */}
                    <div className="bg-slate-50 rounded-2xl p-5 mb-6 border border-slate-100">
                        <h4 className="font-bold text-[#1A202C] mb-3 text-sm">Riepilogo Costi</h4>
                        <div className="flex justify-between items-center text-sm text-slate-500 mb-2">
                            <span>Prezzo base</span>
                            <span>€ {booking.price}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm text-slate-500 mb-4">
                            <span>Commissioni di servizio</span>
                            <span>€ 0.00</span>
                        </div>
                        <div className="h-px bg-slate-200 w-full mb-3"></div>
                        <div className="flex justify-between items-center text-lg font-extrabold text-[#1A202C]">
                            <span>Totale</span>
                            <span>€ {booking.price}</span>
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="grid grid-cols-2 gap-3">
                        <button className="flex items-center justify-center gap-2 py-3 bg-white border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition-colors">
                            <Phone size={18} /> Chiama
                        </button>
                        {booking.status === 'confirmed' ? (
                            <button className="flex items-center justify-center gap-2 py-3 bg-[#1A202C] text-white rounded-xl font-bold hover:bg-black transition-colors">
                                <Ticket size={18} /> Vedi Ticket
                            </button>
                        ) : (
                             <button onClick={onClose} className="flex items-center justify-center gap-2 py-3 bg-[#68B49B] text-white rounded-xl font-bold hover:bg-[#5a9e87] transition-colors">
                                Chiudi
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- MODALE RECLAMO (Minimal) ---
const ComplaintModal = ({ isOpen, onClose, booking }) => {
  if (!isOpen || !booking) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    alert(`Reclamo inviato per prenotazione #${booking.id}`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-[#1A202C]/60 backdrop-blur-sm transition-opacity animate-in fade-in">
      <div className="bg-white rounded-[2rem] w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="p-6">
            <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center text-red-500 mb-4 mx-auto"><MessageSquareWarning size={24}/></div>
            <h3 className="text-xl font-bold text-[#1A202C] text-center mb-1">Segnala Problema</h3>
            <p className="text-sm text-slate-500 text-center mb-6">Problemi con <strong>{booking.service}</strong>?</p>
            
            <form onSubmit={handleSubmit}>
            <textarea 
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:bg-white focus:ring-2 focus:ring-red-100 focus:border-red-300 outline-none min-h-[100px] resize-none text-sm mb-4 transition-all"
                placeholder="Descrivi brevemente..."
                required
            ></textarea>
            
            <div className="flex gap-3">
                <button type="button" onClick={onClose} className="flex-1 py-3 rounded-xl font-bold text-sm text-slate-500 bg-slate-100 hover:bg-slate-200 transition-colors">
                Annulla
                </button>
                <button type="submit" className="flex-1 py-3 rounded-xl font-bold text-sm text-white bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/30 transition-all">
                Invia
                </button>
            </div>
            </form>
        </div>
      </div>
    </div>
  );
};

// --- COMPONENTE PRINCIPALE ---
export const CustomerDashboardBase = () => {
  const navigate = useNavigate();
  const [filter, setFilter] = useState('active');
  const [currentPage, setCurrentPage] = useState(1);
  const [complaintModalOpen, setComplaintModalOpen] = useState(false);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false); 
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [localBookings, setLocalBookings] = useState(mockBookings); // Stato locale per gestire le modifiche

  const itemsPerPage = 2; 

  // Gestione Rettifica Prezzo
  const handleAcceptPriceChange = (id) => {
      setLocalBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'confirmed' } : b));
      alert("Modifica accettata! Il tuo biglietto è ora disponibile.");
  };

  const handleRejectPriceChange = (id) => {
      setLocalBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'cancelled' } : b));
      alert("Prenotazione annullata.");
  };

  // Filtro prenotazioni in attesa di conferma cliente (Rettifica)
  const waitingCustomerBookings = localBookings.filter(b => b.status === 'waiting_customer');

  const filteredBookings = localBookings.filter(booking => {
    // Escludi le prenotazioni di OGGI dalla lista generale (mostrate in sezione dedicata)
    if (booking.date === TODAY_DATE && booking.status === 'confirmed') return false;
    
    // Escludi quelle in waiting_customer (mostrate in sezione dedicata)
    if (booking.status === 'waiting_customer') return false;

    if (filter === 'active') return booking.status === 'confirmed' || booking.status === 'pending';
    if (filter === 'past') return booking.status === 'completed' || booking.status === 'cancelled';
    return true;
  });

  // Filtra le prenotazioni di OGGI per la sezione speciale
  const todayBookings = localBookings.filter(b => b.date === TODAY_DATE && b.status === 'confirmed');

  const totalPages = Math.ceil(filteredBookings.length / itemsPerPage);
  const currentBookings = filteredBookings.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleOpenComplaint = (booking) => {
    setSelectedBooking(booking);
    setComplaintModalOpen(true);
  };

  const handleOpenQr = (booking) => {
      setSelectedBooking(booking);
      setQrModalOpen(true);
  };

  const handleOpenDetail = (booking) => {
      setSelectedBooking(booking);
      setDetailModalOpen(true);
  };

  const goNext = () => handlePageChange(currentPage + 1);
  const goPrev = () => handlePageChange(currentPage - 1);

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-800 selection:bg-[#68B49B] selection:text-white" title="Dashboard Cliente">
      
      {/* Modali */}
      <ComplaintModal 
        isOpen={complaintModalOpen} 
        onClose={() => setComplaintModalOpen(false)} 
        booking={selectedBooking} 
      />
      <TicketQRModal 
        isOpen={qrModalOpen}
        onClose={() => setQrModalOpen(false)}
        booking={selectedBooking}
      />
      <BookingDetailModal 
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        booking={selectedBooking}
      />

      {/* CONTENITORE PRINCIPALE */}
      <div className="max-w-7xl mx-auto px-4 lg:px-8 pt-24 pb-12">
        
        {/* HEADER BENVENUTO E BUTTON SICUREZZA */}
        <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
              <h1 className="text-4xl font-extrabold text-[#1A202C] tracking-tight mb-2">
                Ciao, <span className="text-[#68B49B]">Alessandro</span> 👋
              </h1>
              <p className="text-slate-500 font-medium text-lg">Il tuo centro prenotazioni.</p>
          </div>
          <button 
            onClick={() => navigate('/customer/credential-reset')}
            className="flex items-center gap-2 bg-white border border-slate-200 px-5 py-2.5 rounded-xl text-slate-600 font-bold hover:bg-slate-50 hover:text-[#1A202C] hover:border-slate-300 transition-all shadow-sm"
          >
            <ShieldCheck size={18} /> Sicurezza Account
          </button>
        </div>

        {/* --- 1. RICHIESTE DI MODIFICA (Priorità Massima) --- */}
        {waitingCustomerBookings.length > 0 && (
            <section className="mb-10">
                {waitingCustomerBookings.map(booking => (
                    <PriceChangeRequestCard 
                        key={booking.id} 
                        booking={booking} 
                        onAccept={handleAcceptPriceChange}
                        onReject={handleRejectPriceChange}
                    />
                ))}
            </section>
        )}

        {/* --- 2. OGGI IN ARRIVO (Priorità Alta) --- */}
        {todayBookings.length > 0 && (
            <section className="mb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2.5 bg-[#1A202C] text-white rounded-xl shadow-md">
                        <ScanLine size={24} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-[#1A202C]">Oggi in Arrivo</h2>
                        <p className="text-sm text-slate-500">I tuoi appuntamenti per oggi, {TODAY_DATE}.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {todayBookings.map(booking => (
                        <TodayBookingCard 
                            key={booking.id} 
                            booking={booking} 
                            onOpenQr={handleOpenQr}
                            onOpenDetail={handleOpenDetail}
                        />
                    ))}
                </div>
            </section>
        )}

        {/* --- 3. KPI CARDS (Info Generali) --- */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-12">
          <StatCard 
            title="Agenda" 
            value={`${localBookings.filter(b => b.status === 'confirmed').length} Eventi`} 
            icon={Calendar} 
            colorClass="text-[#68B49B]" 
          />
          <StatCard 
            title="Prenotazioni" 
            value={`${localBookings.length} Totali`} 
            icon={Ticket} 
            colorClass="text-amber-500" 
          />
           <div className="bg-gradient-to-br from-[#68B49B] to-[#33594C] p-5 rounded-3xl shadow-lg shadow-[#68B49B]/30 flex items-center justify-between text-white relative overflow-hidden group cursor-pointer hover:scale-[1.02] transition-transform">
              <div className="relative z-10">
                  <p className="text-white/80 text-[10px] font-bold uppercase tracking-wider mb-1">Esplora</p>
                  <h3 className="text-2xl font-extrabold">Nuovi Eventi</h3>
              </div>
              <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-sm relative z-10">
                  <ChevronRight size={24} />
              </div>
              <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-all"></div>
           </div>
        </div>

        {/* --- 4. AGENDA GENERALE (Tutte le altre) --- */}
        <div className="animate-in fade-in slide-in-from-bottom-6 duration-700">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
                 <h2 className="text-2xl font-bold text-[#1A202C]">
                    {filter === 'active' ? 'Agenda & Prenotazioni' : filter === 'past' ? 'Storico Prenotazioni' : 'Tutte le Prenotazioni'}
                 </h2>
                 <p className="text-sm text-slate-500 mt-1">Gestisci i tuoi prossimi impegni e controlla i dettagli.</p>
            </div>
            
            <div className="flex items-center gap-4">
                {/* Filtri a pillola */}
                <div className="flex bg-white p-1.5 rounded-2xl border border-slate-100 shadow-sm">
                    <button 
                        onClick={() => { setFilter('active'); setCurrentPage(1); }}
                        className={`px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wide transition-all ${filter === 'active' ? 'bg-[#68B49B] text-white shadow-md shadow-[#68B49B]/20' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'}`}
                    >
                        Agenda
                    </button>
                    <button 
                        onClick={() => { setFilter('past'); setCurrentPage(1); }}
                        className={`px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wide transition-all ${filter === 'past' ? 'bg-[#1A202C] text-white shadow-md shadow-slate-900/20' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'}`}
                    >
                        Storico
                    </button>
                </div>
            </div>
          </div>

          {/* GRIGLIA CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 min-h-[300px]">
            {currentBookings.length > 0 ? (
              currentBookings.map(booking => (
                <BookingCard 
                  key={booking.id} 
                  booking={booking} 
                  onOpenComplaint={handleOpenComplaint}
                  onOpenQr={handleOpenQr}
                  onOpenDetail={handleOpenDetail} 
                />
              ))
            ) : (
              <div className="col-span-full py-20 bg-white rounded-[2rem] border border-dashed border-slate-200 flex flex-col justify-center items-center text-center">
                  <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mb-4 text-slate-300">
                      {filter === 'active' ? <Calendar size={40} strokeWidth={1.5} /> : <History size={40} strokeWidth={1.5} />}
                  </div>
                  <h3 className="text-xl font-bold text-[#1A202C]">Nessuna prenotazione</h3>
                  <p className="text-slate-500 text-sm mb-8 max-w-xs mx-auto">
                      {filter === 'active' ? 'Non hai altri programmi per il futuro prossimo.' : 'Non ci sono prenotazioni passate in archivio.'}
                  </p>
                  {filter === 'active' && (
                    <button onClick={() => navigate('/')} className="bg-[#1A202C] text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-slate-900/20 hover:bg-[#68B49B] hover:shadow-[#68B49B]/30 transition-all flex items-center gap-2">
                        <CheckCircle size={18} /> Prenota Ora
                    </button>
                  )}
              </div>
            )}
          </div>

          {/* PAGINAZIONE INFERIORE */}
          {currentBookings.length > 0 && totalPages > 1 && (
            <div className="mt-8 flex justify-center pb-6">
                <PaginationControls 
                    currentPage={currentPage} 
                    totalPages={totalPages} 
                    onNext={goNext} 
                    onPrev={goPrev} 
                />
            </div>
          )}
          
        </div>

      </div>
    </div>
  );
};

export const CustomerDashboard = withAuthProtection(CustomerDashboardBase, ['CUSTOMER']);

export default CustomerDashboard;
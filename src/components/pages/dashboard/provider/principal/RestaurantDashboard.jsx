import React, { useState, useEffect } from 'react';
import { 
    Utensils, Calendar, ListTodo, ChefHat, 
    ScanLine, Settings, History, BellRing, CheckCircle,
    QrCode, ArrowRight, Store, ChevronUp, X
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// IMPORTA LA UI CONDIVISA
// Nota: Se hai spostato MobileStickyTrigger e MobilePendingFullPage in ProviderUI, importali da lì.
// Altrimenti li ho definiti qui sotto per garantire che funzionino subito.
import { 
    PendingRequestCard, 
    ProviderBookingCard, 
    StatsSummary, 
    PaginationControls,
    BookingDetailModal, 
    CancellationModal, 
    ComplaintModal, 
    PriceCorrectionModal 
} from './ProviderUI';

import { HOGU_COLORS, HOGU_THEME } from '../../../../../config/theme.js';

// --- MOCK DATA ---
const REST_BOOKINGS = [
    // PENDING (Richieste Tavoli)
    { id: 10, customerName: 'Anna Verdi', serviceName: 'Cena x2', status: 'pending', price: 80, guests: 2, date: "22 Nov", time: "20:30", image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=300" },
    { id: 11, customerName: 'Mario Rossi', serviceName: 'Pranzo Business', status: 'pending', price: 45, guests: 1, date: "23 Nov", time: "13:00", image: "https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&q=80&w=300" },
    { id: 12, customerName: 'Gruppo Amici', serviceName: 'Tavolata', status: 'waiting_customer', price: 200, oldPrice: 180, guests: 8, date: "23 Nov", time: "21:00", image: "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&q=80&w=300" },
    { id: 13, customerName: 'Luca Bianchi', serviceName: 'Cena Romantica', status: 'pending', price: 120, guests: 2, date: "23 Nov", time: "20:00", image: "https://images.unsplash.com/photo-1550966871-3ed3c622771d?auto=format&fit=crop&q=80&w=300" },

    // ACTIVE (Confermate / In Arrivo)
    { id: 20, customerName: 'Giulia Neri', serviceName: 'Cena Degustazione', status: 'confirmed', price: 150, guests: 2, date: "24 Nov", time: "20:00", image: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&q=80&w=300" },
    { id: 21, customerName: 'Marco Polo', serviceName: 'Pranzo Veloce', status: 'confirmed', price: 30, guests: 1, date: "24 Nov", time: "12:30", image: "https://images.unsplash.com/photo-1544148103-0773bf10d330?auto=format&fit=crop&q=80&w=300" },

    // PAST (Completate / Cancellate)
    { id: 30, customerName: 'Famiglia Esposito', serviceName: 'Pranzo Domenicale', status: 'completed', price: 250, guests: 5, date: "15 Nov", time: "13:00", image: "https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&q=80&w=300" },
    { id: 31, customerName: 'Luigi', serviceName: 'Cena', status: 'cancelled', price: 60, guests: 2, date: "10 Nov", time: "20:00", image: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&q=80&w=300" },
];

// =================================================================================
// COMPONENTI MOBILE DEDICATI (Definiti localmente per sicurezza)
// =================================================================================

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
                        <p className="text-xs text-slate-400">Clicca per gestire i tavoli</p>
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
                        <p className="text-slate-400 text-sm">Gestione prenotazioni in entrata</p>
                    </div>
                    <button onClick={onClose} className="bg-white/10 p-3 rounded-full hover:bg-white/20 transition-colors">
                        <X size={24} />
                    </button>
                </div>
            </div>

            {/* Lista Scrollabile */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-24">
                {pendingList.length > 0 ? (
                    pendingList.map(b => (
                        <PendingRequestCard 
                            key={b.id} 
                            booking={b} 
                            activeCategory="restaurant"
                            onAccept={(id) => { onAccept(id); if(pendingList.length === 1) onClose(); }}
                            onReject={onReject}
                            onRectify={onRectify}
                            onOpenDetails={onOpenDetails}
                        />
                    ))
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400">
                        <CheckCircle size={48} className="mb-4 text-emerald-500 opacity-50"/>
                        <p className="font-bold text-slate-500">Sala Aggiornata!</p>
                        <p className="text-xs mt-1">Nessun tavolo in attesa di conferma.</p>
                        <button onClick={onClose} className="mt-6 text-emerald-600 font-bold text-sm bg-emerald-50 px-6 py-3 rounded-xl">Torna alla Dashboard</button>
                    </div>
                )}
            </div>
            
            <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-[#f8f9fc] to-transparent pointer-events-none"></div>
        </div>
    );
};

// =================================================================================
// MAIN COMPONENT
// =================================================================================

const RestaurantDashboard = () => {
    const navigate = useNavigate();

    // --- STATI DATI ---
    const [bookings, setBookings] = useState(REST_BOOKINGS);
    const [isMobileOverlayOpen, setIsMobileOverlayOpen] = useState(false); // Stato Overlay Mobile

    // --- PAGINAZIONE ---
    const [pendingPage, setPendingPage] = useState(1);
    const [historyPage, setHistoryPage] = useState(1);
    const ITEMS_PER_PAGE = 3;

    // --- FILTRI ---
    const [filter, setFilter] = useState('active'); 

    // --- MODALI ---
    const [detailsOpen, setDetailsOpen] = useState(false);
    const [complaintOpen, setComplaintOpen] = useState(false);
    const [cancelOpen, setCancelOpen] = useState(false);
    const [correctionOpen, setCorrectionOpen] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState(null);

    // --- CALCOLO LISTE ---
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

    // --- HANDLERS ---
    const handleAccept = (id) => setBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'confirmed' } : b));
    const handleReject = (bk) => { setSelectedBooking(bk); setCancelOpen(true); };
    const handleRectify = (bk) => { setSelectedBooking(bk); setCorrectionOpen(true); };
    
    const confirmCancel = (id, reason) => {
        setBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'cancelled' } : b));
        setCancelOpen(false);
    };
    const confirmComplaint = () => { alert("Segnalazione inviata"); setComplaintOpen(false); };
    const confirmCorrection = (id, price, note) => {
        setBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'waiting_customer', price: price } : b));
        setCorrectionOpen(false);
    };
    const handleFilterChange = (newFilter) => { setFilter(newFilter); setHistoryPage(1); };

    return (
        <div className="space-y-6 md:space-y-10 animate-in fade-in pb-24 md:pb-12 relative">
            
            {/* --- COMPONENTI MOBILE DEDICATI --- */}
            
            {/* 1. Tasto Sticky (Visibile solo Mobile se Overlay chiuso e ci sono pending) */}
            {!isMobileOverlayOpen && (
                <MobileStickyTrigger 
                    count={pendingListFull.length} 
                    onClick={() => setIsMobileOverlayOpen(true)} 
                />
            )}

            {/* 2. Overlay Full Page (Scivola sopra tutto) */}
            <MobilePendingFullPage 
                isOpen={isMobileOverlayOpen} 
                onClose={() => setIsMobileOverlayOpen(false)}
                pendingList={pendingListFull}
                onAccept={handleAccept}
                onReject={handleReject}
                onRectify={handleRectify}
                onOpenDetails={(bk) => { setSelectedBooking(bk); setDetailsOpen(true); }}
            />

            {/* --- UI DESKTOP & STANDARD --- */}

            {/* Modali */}
            <BookingDetailModal isOpen={detailsOpen} onClose={() => setDetailsOpen(false)} booking={selectedBooking} />
            <CancellationModal isOpen={cancelOpen} onClose={() => setCancelOpen(false)} onConfirm={confirmCancel} booking={selectedBooking} />
            <ComplaintModal isOpen={complaintOpen} onClose={() => setComplaintOpen(false)} onConfirm={confirmComplaint} booking={selectedBooking} />
            <PriceCorrectionModal isOpen={correctionOpen} onClose={() => setCorrectionOpen(false)} onConfirm={confirmCorrection} booking={selectedBooking} />

            {/* 0. HEADER */}
            <div>
                 {/* 0a. Stats */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
                    <div className="lg:col-span-2">
                        <StatsSummary activeCategory="restaurant" />
                    </div>

                    {/* 0b. Colonna Azioni (Desktop Side, Mobile Top via Buttons below) */}
                    <div className="hidden lg:flex flex-col gap-4 h-full">
                        {/* A. Card SCANNER Desktop */}
                        <div 
                            onClick={() => navigate('/validator?type=restaurant')}
                            className={`flex-1 min-h-[140px] bg-gradient-to-br from-[${HOGU_COLORS.dark}] to-slate-800 rounded-[2rem] p-6 text-white relative overflow-hidden group cursor-pointer shadow-xl shadow-slate-900/10 hover:shadow-2xl hover:-translate-y-1 transition-all flex flex-col justify-center`}
                        >
                            <div className="absolute -right-6 -top-6 text-white/5 group-hover:text-white/10 transition-colors pointer-events-none">
                                <QrCode size={120} />
                            </div>
                            <div className="relative z-10">
                                <div className="bg-white/10 w-fit p-2 rounded-xl backdrop-blur-md border border-white/10 mb-3">
                                    <ScanLine size={20} className={`text-[${HOGU_COLORS.primary}]`} />
                                </div>
                                <h3 className="text-xl font-bold mb-1">Scanner Sala</h3>
                                <p className="text-slate-400 text-xs font-medium">Clicca per scansionare ingressi.</p>
                            </div>
                            <div className={`absolute bottom-6 right-6 text-[${HOGU_COLORS.primary}] opacity-0 group-hover:opacity-100 transition-opacity`}>
                                <ArrowRight size={24} />
                            </div>
                        </div>

                        {/* B. Card IMPOSTAZIONI Desktop */}
                        <button 
                            onClick={() => navigate('/dashboard/provider/restaurant/edit')}
                            className={`h-20 bg-white border border-slate-200 rounded-[1.5rem] px-6 flex items-center justify-between hover:bg-slate-50 hover:border-[${HOGU_COLORS.primary}]/50 transition-all group shadow-sm hover:shadow-md`}
                        >
                            <div className="flex items-center gap-3 text-left">
                                <div className={`p-2.5 bg-slate-100 rounded-xl group-hover:bg-[${HOGU_COLORS.primary}]/10 group-hover:text-[${HOGU_COLORS.primary}] transition-colors text-slate-600`}>
                                    <Store size={20} />
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-800 text-sm">Il tuo Ristorante</h4>
                                    <p className="text-slate-400 text-xs">Modifica profilo e menu</p>
                                </div>
                            </div>
                            <Settings size={18} className={`text-slate-300 group-hover:text-[${HOGU_COLORS.primary}] transition-colors`} />
                        </button>
                    </div>
                </div>

                {/* 0c. Azioni Rapide SOLO MOBILE (Sostituiscono la colonna laterale desktop) */}
                <div className="grid grid-cols-2 gap-3 lg:hidden mb-6 mt-4 md:mt-0">
                     <button onClick={() => navigate('/validator?type=restaurant')} className="bg-[#1a1a1a] text-white p-4 rounded-2xl flex flex-col items-center justify-center gap-2 shadow-lg">
                        <QrCode size={24} />
                        <span className="text-xs font-bold">Scanner Sala</span>
                     </button>
                     <button onClick={() => navigate('/dashboard/provider/restaurant/edit')} className="bg-white text-slate-700 p-4 rounded-2xl flex flex-col items-center justify-center gap-2 border border-slate-100 shadow-sm">
                        <Settings size={24} />
                        <span className="text-xs font-bold">Ristorante</span>
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
                            <h2 className={`text-2xl font-extrabold text-[${HOGU_COLORS.dark}]`}>Gestione Sala</h2>
                            <p className="text-sm text-slate-500 font-medium">
                                {pendingListFull.length > 0 ? "Richieste tavoli da confermare." : "Nessuna richiesta in sospeso."}
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
                                <PendingRequestCard 
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
                        <h3 className="text-lg font-bold text-emerald-800">Sala Aggiornata</h3>
                        <p className="text-emerald-600/70">Tutte le richieste sono state gestite.</p>
                    </div>
                )}
            </section>

            <div className="hidden md:block border-t border-slate-100 my-8"></div>

            {/* 2. STORICO E AGENDA */}
            <section>
                <div className="flex flex-col sm:flex-row justify-between items-end sm:items-center gap-4 mb-6">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                            <Calendar size={22} className={`text-[${HOGU_COLORS.primary}]`}/> Agenda Prenotazioni
                        </h2>
                    </div>
                    
                    <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                        <div className="flex bg-white p-1 rounded-2xl border border-slate-200 shadow-sm">
                            <button onClick={() => handleFilterChange('active')} className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wide transition-all ${filter === 'active' ? `bg-[${HOGU_COLORS.primary}] text-white shadow-md` : 'text-slate-400 hover:bg-slate-50'}`}>In Arrivo</button>
                            <button onClick={() => handleFilterChange('past')} className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wide transition-all ${filter === 'past' ? 'bg-slate-800 text-white shadow-md' : 'text-slate-400 hover:bg-slate-50'}`}>Storico</button>
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
                                activeCategory="restaurant"
                                onOpenDetails={(bk) => { setSelectedBooking(bk); setDetailsOpen(true); }}
                                onOpenComplaint={(bk) => { setSelectedBooking(bk); setComplaintOpen(true); }}
                                onCancelBooking={(bk) => { setSelectedBooking(bk); setCancelOpen(true); }}
                            />
                        ))
                    ) : (
                        <div className="py-12 bg-white rounded-3xl border border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400">
                             <History className="mb-2 opacity-50" size={32} />
                             <span className="font-medium">Nessuna prenotazione trovata in questa sezione.</span>
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
};

export default RestaurantDashboard;
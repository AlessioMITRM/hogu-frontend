import React, { useState, useEffect, useCallback } from 'react';
import { 
    Utensils, Calendar, ListTodo, ChefHat, 
    ScanLine, Settings, History, BellRing, CheckCircle,
    QrCode, ArrowRight, Store, ChevronUp, X, Loader2,
    Wallet, Activity, XCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

// IMPORTA LA UI CONDIVISA
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
import { restaurantService } from '../../../../../api/apiClient.js';

// --- COMPONENTI LOCALI UTILI ---
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

const MobileStickyTrigger = ({ count, onClick }) => {
    const { t } = useTranslation();
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
                        <h4 className="font-bold text-base">{t('provider_dashboard.mobile.pending_requests', { count })}</h4>
                        <p className="text-xs text-slate-400">{t('provider_dashboard.mobile.manage_tables', "Gestisci i tavoli")}</p>
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
    const { t } = useTranslation();
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
                        <h2 className="text-2xl font-extrabold mb-1">{t('provider_dashboard.pending_title', "Richieste")} ({pendingList.length})</h2>
                        <p className="text-slate-400 text-sm">{t('provider_dashboard.pending_subtitle', "Gestione prenotazioni in entrata")}</p>
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
                        <p className="font-bold text-slate-500">{t('provider_dashboard.all_clear_title', "Sala Aggiornata!")}</p>
                        <p className="text-xs mt-1">{t('provider_dashboard.all_clear_subtitle', "Nessun tavolo in attesa di conferma.")}</p>
                        <button onClick={onClose} className="mt-6 text-emerald-600 font-bold text-sm bg-emerald-50 px-6 py-3 rounded-xl">{t('provider_dashboard.back_to_dashboard', "Torna alla Dashboard")}</button>
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
    const { t } = useTranslation();

    // --- STATI DATI ---
    const [serviceData, setServiceData] = useState(null);
    const [bookings, setBookings] = useState([]);
    const [stats, setStats] = useState({ revenue: 0, count: 0 });
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    
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

    // --- SUCCESS MODAL ---
    const [successModalOpen, setSuccessModalOpen] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    // --- FETCH DATA ---
    const fetchData = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            // 1. Get Service Info
            const info = await restaurantService.getInfoProvider();
            setServiceData(info);

            // 2. Get Bookings
            const id = info.id || info.serviceId;
            if (info && id) {
                const bookingsData = await restaurantService.getBookings(id, 0, 100); 
                const bookingList = bookingsData.content || bookingsData || [];
                setBookings(bookingList);
                
                // Calculate Stats
                const currentMonth = new Date().getMonth();
                const monthlyBookings = bookingList.filter(b => new Date(b.date).getMonth() === currentMonth);
                const revenue = monthlyBookings.reduce((sum, b) => sum + (b.price || 0), 0);
                setStats({ revenue, count: monthlyBookings.length });
            }
        } catch (err) {
            console.error("Error loading restaurant dashboard:", err);
            // Non blocchiamo tutto se fallisce il caricamento, ma mostriamo errore
            // A scopo demo, se fallisce usiamo array vuoto
            setBookings([]);
            // setError(t('errors.generic_loading', "Errore nel caricamento dei dati."));
        } finally {
            setIsLoading(false);
        }
    }, [t]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

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
        if (filter === 'past') return ['completed', 'cancelled', 'rejected'].includes(b.status);
        return true;
    });
    const totalHistoryPages = Math.ceil(historyListFull.length / ITEMS_PER_PAGE);
    const currentHistoryList = historyListFull.slice(
        (historyPage - 1) * ITEMS_PER_PAGE, 
        historyPage * ITEMS_PER_PAGE
    );

    // --- HANDLERS ---
    const handleOperationSuccess = (msg) => {
        setSuccessMessage(msg);
        setSuccessModalOpen(true);
        fetchData(); // Reload data
    };

    const handleAccept = async (id) => {
        try {
            await restaurantService.acceptBooking(id);
            handleOperationSuccess(t('provider_dashboard.success.booking_accepted', "Prenotazione accettata!"));
        } catch (err) {
            alert(t('errors.generic_action', "Errore durante l'operazione."));
        }
    };

    const handleReject = (bk) => { setSelectedBooking(bk); setCancelOpen(true); };
    const handleRectify = (bk) => { setSelectedBooking(bk); setCorrectionOpen(true); };
    
    const confirmCancel = async (id, reason) => {
        try {
             if (selectedBooking.status === 'pending' || selectedBooking.status === 'waiting_customer') {
                 await restaurantService.rejectBooking(id, reason);
             } else {
                 await restaurantService.cancelBooking(id, reason);
             }
             setCancelOpen(false);
             handleOperationSuccess(t('provider_dashboard.success.booking_cancelled', "Prenotazione cancellata/rifiutata."));
        } catch (err) {
            alert(t('errors.generic_action', "Errore durante l'operazione."));
        }
    };

    const confirmComplaint = async (id, reason) => { 
        try {
            await restaurantService.reportComplaint(id, reason);
            setComplaintOpen(false);
            handleOperationSuccess(t('provider_dashboard.success.complaint_sent', "Segnalazione inviata."));
        } catch (err) {
            alert(t('errors.generic_action', "Errore durante l'invio della segnalazione."));
        }
    };

    const confirmCorrection = async (id, price, note) => {
        try {
            await restaurantService.rectifyBooking(id, price, note);
            setCorrectionOpen(false);
            handleOperationSuccess(t('provider_dashboard.success.correction_sent', "Proposta di correzione inviata."));
        } catch (err) {
            alert(t('errors.generic_action', "Errore durante l'operazione."));
        }
    };

    const handleFilterChange = (newFilter) => { setFilter(newFilter); setHistoryPage(1); };

    if (isLoading) return <LoadingComponent />;
    if (error) return (
        <div className="flex flex-col items-center justify-center py-20 text-center">
            <XCircle size={48} className="text-red-400 mb-4" />
            <h3 className="text-xl font-bold text-slate-800">{t('errors.title', "Ops, qualcosa è andato storto")}</h3>
            <p className="text-slate-500 mb-6">{error}</p>
            <button onClick={() => window.location.reload()} className="text-[#68B49B] font-bold hover:underline">{t('actions.retry', "Riprova")}</button>
        </div>
    );

    return (
        <div className="space-y-6 md:space-y-10 animate-in fade-in pb-24 md:pb-12 relative">
             {/* Success Modal */}
             {successModalOpen && (
                <FullModalBackdrop onClose={() => setSuccessModalOpen(false)}>
                    <div className="text-center">
                        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckCircle size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 mb-2">{t('success.title', "Operazione Completata")}</h3>
                        <p className="text-slate-500 mb-6">{successMessage}</p>
                        <button 
                            onClick={() => setSuccessModalOpen(false)} 
                            className={`bg-[${HOGU_COLORS.primary}] text-white px-6 py-3 rounded-xl font-bold hover:bg-[#5aa38d] transition-colors w-full`}
                        >
                            {t('actions.close', "Chiudi")}
                        </button>
                    </div>
                </FullModalBackdrop>
            )}
            
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
                        <StatsSummary activeCategory="restaurant" revenue={stats.revenue} count={stats.count} />
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
                                <h3 className="text-xl font-bold mb-1">{t('dashboard.scanner_title', "Scanner Sala")}</h3>
                                <p className="text-slate-400 text-xs font-medium">{t('dashboard.scanner_subtitle', "Clicca per scansionare ingressi.")}</p>
                            </div>
                            <div className={`absolute bottom-6 right-6 text-[${HOGU_COLORS.primary}] opacity-0 group-hover:opacity-100 transition-opacity`}>
                                <ArrowRight size={24} />
                            </div>
                        </div>

                        {/* B. Card IMPOSTAZIONI Desktop */}
                        <button 
                            onClick={() => (serviceData?.id || serviceData?.serviceId) && navigate(`/provider/edit/restaurant/${serviceData?.id || serviceData?.serviceId}`)}
                            disabled={!serviceData?.id && !serviceData?.serviceId}
                            className={`h-20 bg-white border border-slate-200 rounded-[1.5rem] px-6 flex items-center justify-between hover:bg-slate-50 hover:border-[${HOGU_COLORS.primary}]/50 transition-all group shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                            <div className="flex items-center gap-3 text-left">
                                <div className={`p-2.5 bg-slate-100 rounded-xl group-hover:bg-[${HOGU_COLORS.primary}]/10 group-hover:text-[${HOGU_COLORS.primary}] transition-colors text-slate-600`}>
                                    <Store size={20} />
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-800 text-sm">{t('dashboard.your_restaurant', "Il tuo Ristorante")}</h4>
                                    <p className="text-slate-400 text-xs">{t('dashboard.edit_profile', "Modifica profilo e menu")}</p>
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
                        <span className="text-xs font-bold">{t('dashboard.scanner_short', "Scanner")}</span>
                     </button>
                     <button 
                        onClick={() => (serviceData?.id || serviceData?.serviceId) && navigate(`/provider/edit/restaurant/${serviceData?.id || serviceData?.serviceId}`)}
                        disabled={!serviceData?.id && !serviceData?.serviceId}
                        className="bg-white text-slate-700 p-4 rounded-2xl flex flex-col items-center justify-center gap-2 border border-slate-100 shadow-sm disabled:opacity-50"
                     >
                        <Settings size={24} />
                        <span className="text-xs font-bold">{t('dashboard.restaurant_short', "Ristorante")}</span>
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
                            <h2 className={`text-2xl font-extrabold text-[${HOGU_COLORS.dark}]`}>{t('dashboard.pending_section_title', "Gestione Sala")}</h2>
                            <p className="text-sm text-slate-500 font-medium">
                                {pendingListFull.length > 0 ? t('dashboard.pending_message', "Richieste tavoli da confermare.") : t('dashboard.no_pending', "Nessuna richiesta in sospeso.")}
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
                        <h3 className="text-lg font-bold text-emerald-800">{t('dashboard.all_clear_title', "Sala Aggiornata")}</h3>
                        <p className="text-emerald-600/70">{t('dashboard.all_clear_subtitle', "Tutte le richieste sono state gestite.")}</p>
                    </div>
                )}
            </section>

            <div className="hidden md:block border-t border-slate-100 my-8"></div>

            {/* 2. STORICO E AGENDA */}
            <section>
                <div className="flex flex-col sm:flex-row justify-between items-end sm:items-center gap-4 mb-6">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                            <Calendar size={22} className={`text-[${HOGU_COLORS.primary}]`}/> {t('dashboard.history_title', "Agenda Prenotazioni")}
                        </h2>
                    </div>
                    
                    <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                         {/* Filter Buttons */}
                        <div className="flex bg-slate-100 p-1 rounded-xl">
                            <button 
                                onClick={() => handleFilterChange('active')}
                                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${filter === 'active' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                {t('filters.active', "In Arrivo")}
                            </button>
                            <button 
                                onClick={() => handleFilterChange('past')}
                                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${filter === 'past' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                {t('filters.past', "Passate")}
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

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                        <div className="col-span-full py-12 text-center text-slate-400 bg-slate-50 rounded-[2rem] border border-slate-100 border-dashed">
                            <ListTodo size={48} className="mx-auto mb-4 opacity-20" />
                            <p className="font-medium">{t('dashboard.no_bookings', "Nessuna prenotazione trovata in questa sezione.")}</p>
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
};

export default RestaurantDashboard;

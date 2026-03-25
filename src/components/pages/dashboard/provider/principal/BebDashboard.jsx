import React, { useState, useEffect } from 'react';
import {
    BedDouble, ConciergeBell, CalendarDays, Key,
    ScanLine, Settings, History, BellRing, CheckCircle,
    QrCode, ArrowRight, Home, Store, ChevronUp, X,
    Loader2, Plus, Edit3, Trash2, Euro, User, AlertTriangle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { bnbService } from '../../../../../api/apiClient.js';
import SuccessModal from '../../../../ui/SuccessModal.jsx';
import ErrorModal from '../../../../ui/ErrorModal.jsx';
import LoadingScreen from '../../../../ui/LoadingScreen.jsx';
import SafeImage from '../../../../ui/SafeImage.jsx';


// Importiamo la UI condivisa
import {
    PendingRequestCard,
    ProviderBookingCard,
    TodayEventCard,
    StatsSummary,
    PaginationControls,
    BookingDetailModal,
    ComplaintModal,
    CancellationModal,
    PriceCorrectionModal
} from './ProviderUI';

// Helper per formattare i prezzi (Locale)
const formatPrice = (value) => {
    if (value === undefined || value === null) return '0,00';
    const num = typeof value === 'string' ? parseFloat(value.replace(',', '.')) : value;
    if (isNaN(num)) return '0,00';
    return num.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

import { HOGU_COLORS, HOGU_THEME } from '../../../../../config/theme.js';


// --- MOCK DATA RIMOSSI ---


// =================================================================================
// COMPONENTI UI CONDIVISI
// =================================================================================

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
                position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                zIndex: 9999, backgroundColor: 'rgba(15, 23, 42, 0.6)',
                backdropFilter: 'blur(8px)', display: 'flex',
                alignItems: 'center', justifyContent: 'center', padding: '1rem', margin: 0
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

// =================================================================================
// COMPONENTI MOBILE DEDICATI
// =================================================================================

const MobileStickyTrigger = ({ count, onClick }) => {
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
                        <h4 className="font-bold text-sm">Hai {count} richieste</h4>
                        <p className="text-xs text-slate-400">Gestisci i soggiorni in attesa</p>
                    </div>
                </div>
                <div className="bg-white/10 p-2 rounded-full">
                    <ChevronUp size={18} />
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
            <div className={`bg-[${HOGU_COLORS.dark}] text-white pt-10 pb-4 px-4 rounded-b-[2.5rem] shadow-xl shrink-0 relative z-20`}>
                <div className="flex items-start justify-between">
                    <div>
                        <h2 className="text-xl font-extrabold mb-1 text-left">Richieste ({pendingList.length})</h2>
                        <p className="text-slate-400 text-xs">Gestisci le prenotazioni in entrata</p>
                    </div>
                    <button onClick={onClose} className="bg-white/10 p-2.5 rounded-full hover:bg-white/20 transition-colors">
                        <X size={20} />
                    </button>
                </div>
            </div>

            {/* Lista Scrollabile */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3 pb-0">
                {pendingList.length > 0 ? (
                    pendingList.map(b => (
                        <PendingRequestCard
                            key={b.id}
                            booking={b}
                            activeCategory="beb"
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
                        <p className="text-xs mt-1">Nessuna nuova richiesta di soggiorno.</p>
                        <button onClick={onClose} className="mt-6 text-emerald-600 font-bold text-sm bg-emerald-50 px-6 py-3 rounded-xl">Torna alla Dashboard</button>
                    </div>
                )}
            </div>

        </div>
    );
};

// =================================================================================
// MAIN COMPONENT
// =================================================================================

const BebDashboard = () => {
    const navigate = useNavigate();

    // --- STATI DATI ---
    const [bookings, setBookings] = useState([]);
    const [checkins, setCheckins] = useState([]);
    const [agendaBookings, setAgendaBookings] = useState([]);
    const [historyBookings, setHistoryBookings] = useState([]);
    const [isMobileOverlayOpen, setIsMobileOverlayOpen] = useState(false);
    const [providerInfo, setProviderInfo] = useState({ name: '', description: '', serviceId: null });

    // --- SELEZIONE STANZA ---
    const [isRoomSelectionOpen, setIsRoomSelectionOpen] = useState(false);
    const [roomList, setRoomList] = useState([]);
    const [isLoadingRooms, setIsLoadingRooms] = useState(false);

    // --- UI STATE ---
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);

    // --- FETCH DATA ---
    const fetchData = async () => {
        setIsLoading(true);
        setError(null);
        try {
            // 1. Ottieni Info Provider (per avere l'ID del servizio)
            const info = await bnbService.getInfoProvider();
            setProviderInfo(info);

            if (info && info.serviceId) {
                const bookingsResponse = await bnbService.getBookings(info.serviceId, 0, 100, 'creationDate', 'asc');
                const bookingsList = Array.isArray(bookingsResponse) ? bookingsResponse : (bookingsResponse.content || []);
                setBookings(bookingsList);

                const upcomingResponse = await bnbService.getBookingsUpcoming(info.serviceId, 0, 100);
                const upcomingList = Array.isArray(upcomingResponse) ? upcomingResponse : (upcomingResponse.content || []);
                setAgendaBookings(upcomingList);

                if (filter === 'past') {
                    const historyResponse = await bnbService.getBookingsHistory(info.serviceId, 0, 100);
                    const historyList = Array.isArray(historyResponse) ? historyResponse : (historyResponse.content || []);
                    setHistoryBookings(historyList);
                } else {
                    setHistoryBookings([]);
                }

                setCheckins([]);
            }
        } catch (err) {
            console.error("Error fetching data:", err);
            // setError("Impossibile caricare i dati."); 
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // --- FETCH ROOMS (Quando si apre la modale) ---
    useEffect(() => {
        if (!isRoomSelectionOpen || !providerInfo?.serviceId) return;

        const fetchRooms = async () => {
            setIsLoadingRooms(true);
            try {
                const data = await bnbService.getAllRoomsProvider(0, 100);
                const rooms = Array.isArray(data) ? data : (data.content || []);
                setRoomList(rooms);
            } catch (err) {
                console.error("Errore caricamento stanze:", err);
            } finally {
                setIsLoadingRooms(false);
            }
        };

        fetchRooms();
    }, [isRoomSelectionOpen, providerInfo]);

    // --- PAGINAZIONE ---
    const [pendingPage, setPendingPage] = useState(1);
    const [checkinPage, setCheckinPage] = useState(1);
    const [historyPage, setHistoryPage] = useState(1);

    const ITEMS_PER_PAGE = 3;
    const ITEMS_PER_PAGE_CHECKIN = 2;

    // --- FILTRI ---
    const [filter, setFilter] = useState('active');

    // --- MODALI ---
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [detailsOpen, setDetailsOpen] = useState(false);
    const [complaintOpen, setComplaintOpen] = useState(false);
    const [cancelOpen, setCancelOpen] = useState(false);
    const [correctionOpen, setCorrectionOpen] = useState(false);

    // --- CALCOLO LISTE ---

    // 1. Pending (Richieste)
    const pendingStatuses = [
        'PAYMENT_AUTHORIZED',
        'WAITING_PROVIDER_CONFIRMATION',
        'WAITING_CUSTOMER_PAYMENT'
    ];

    const pendingListFull = bookings
        .filter(b => b && pendingStatuses.includes(b.status))
        .sort((a, b) => {
            const dateA = a.creationDate ? new Date(a.creationDate).getTime() : 0;
            const dateB = b.creationDate ? new Date(b.creationDate).getTime() : 0;
            return dateA - dateB;
        });
    const totalPendingPages = Math.ceil(pendingListFull.length / ITEMS_PER_PAGE);
    const currentPendingList = pendingListFull.slice(
        (pendingPage - 1) * ITEMS_PER_PAGE,
        pendingPage * ITEMS_PER_PAGE
    );

    // 2. Check-ins (Events)
    const totalCheckinPages = Math.ceil(checkins.length / ITEMS_PER_PAGE_CHECKIN);
    const currentCheckinsList = checkins.slice(
        (checkinPage - 1) * ITEMS_PER_PAGE_CHECKIN,
        checkinPage * ITEMS_PER_PAGE_CHECKIN
    );

    // 3. History / Agenda (solo prenotazioni di oggi, senza future)
    const ACTIVE_STATUSES = [
        'FULL_PAYMENT_COMPLETED',
        'COMPLETED',
        'WAITING_COMPLETION'
    ];

    const PAST_STATUSES = [
        'CANCELLED_BY_PROVIDER',
        'CANCELLED_BY_ADMIN',
        'REFUNDED_BY_ADMIN',
        'PROVIDER_LIQUIDATED',
        'COMMISSION_PAID'
    ];

    const historySource = filter === 'past' ? historyBookings : agendaBookings;
    const historyListFull = historySource
        .filter(b => {
            if (!b || !b.status) return false;
            if (filter === 'active') return ACTIVE_STATUSES.includes(b.status);
            if (filter === 'past') return PAST_STATUSES.includes(b.status);
            return true;
        })
        .sort((a, b) => {
            const checkA = a.checkInDate ? new Date(a.checkInDate).getTime() : Number.MAX_SAFE_INTEGER;
            const checkB = b.checkInDate ? new Date(b.checkInDate).getTime() : Number.MAX_SAFE_INTEGER;
            if (checkA !== checkB) return checkA - checkB;
            const createA = a.creationDate ? new Date(a.creationDate).getTime() : 0;
            const createB = b.creationDate ? new Date(b.creationDate).getTime() : 0;
            return createA - createB;
        });
    const totalHistoryPages = Math.ceil(historyListFull.length / ITEMS_PER_PAGE);
    const currentHistoryList = historyListFull.slice(
        (historyPage - 1) * ITEMS_PER_PAGE,
        historyPage * ITEMS_PER_PAGE
    );

    // --- HANDLERS ---
    const handleAccept = async (id) => {
        try {
            setIsLoading(true);
            await bnbService.acceptBooking(id);
            setSuccessMessage("Prenotazione accettata!");
            await fetchData();
        } catch (err) {
            console.error(err);
            setError("Errore durante l'accettazione.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleReject = (bk) => { setSelectedBooking(bk); setCancelOpen(true); };
    const handleRectify = (bk) => { setSelectedBooking(bk); setCorrectionOpen(true); };

    const confirmCancel = async (id, reason) => {
        try {
            setIsLoading(true);
            const isPendingStatus = selectedBooking && [
                'PAYMENT_AUTHORIZED',
                'WAITING_PROVIDER_CONFIRMATION',
                'WAITING_CUSTOMER_PAYMENT'
            ].includes(selectedBooking.status);

            if (isPendingStatus) {
                await bnbService.rejectBooking(id, reason);
                setSuccessMessage("Richiesta rifiutata.");
            } else {
                await bnbService.cancelBooking(id, reason);
                setSuccessMessage("Prenotazione cancellata.");
            }
            setCancelOpen(false);
            await fetchData();
        } catch (err) {
            console.error(err);
            setError("Errore durante la cancellazione/rifiuto.");
        } finally {
            setIsLoading(false);
        }
    };

    const confirmComplaint = async (id, reason) => {
        try {
            setIsLoading(true);
            await bnbService.reportComplaint(id, reason);
            setSuccessMessage("Segnalazione inviata.");
            setComplaintOpen(false);
        } catch (err) {
            console.error(err);
            setError("Errore invio segnalazione.");
        } finally {
            setIsLoading(false);
        }
    };
    const confirmCorrection = async (id, price, note) => {
        try {
            setIsLoading(true);
            await bnbService.rectifyBooking(id, price, note);
            setSuccessMessage("Proposta inviata.");
            setCorrectionOpen(false);
            await fetchData();
        } catch (err) {
            console.error(err);
            setError("Errore invio modifica.");
        } finally {
            setIsLoading(false);
        }
    };
    const handleFilterChange = async (newFilter) => {
        setFilter(newFilter);
        setHistoryPage(1);
        if (!providerInfo?.serviceId) return;
        setIsLoading(true);
        try {
            if (newFilter === 'past') {
                const historyResponse = await bnbService.getBookingsHistory(providerInfo.serviceId, 0, 100);
                const historyList = Array.isArray(historyResponse) ? historyResponse : (historyResponse.content || []);
                setHistoryBookings(historyList);
            } else {
                const upcomingResponse = await bnbService.getBookingsUpcoming(providerInfo.serviceId, 0, 100);
                const upcomingList = Array.isArray(upcomingResponse) ? upcomingResponse : (upcomingResponse.content || []);
                setAgendaBookings(upcomingList);
            }
        } catch (error) {
            console.error("Errore cambio filtro storico/attivi:", error);
        } finally {
            setIsLoading(false);
        }
    };
    const handleValidateCheckin = () => { navigate('/provider/qr-validator?type=beb'); };

    const isDefaultInfo = providerInfo?.name === "Registrazione in corso..." || providerInfo?.description === "Descrizione del servizio in aggiornamento.";

    return (
        <div className="px-4 sm:px-6 space-y-6 md:space-y-10 animate-in fade-in pb-20 md:pb-12 relative max-w-full">
            {isDefaultInfo && (
                <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded-xl shadow-sm mb-6 animate-in slide-in-from-top-4 duration-500">
                    <div className="flex items-center gap-3">
                        <AlertTriangle className="text-amber-500 shrink-0" size={24} />
                        <div>
                            <h3 className="text-sm font-bold text-amber-800">Profilo incompleto</h3>
                            <p className="text-xs text-amber-700">Per poter gestire le tue stanze, devi prima aggiornare le informazioni base della tua struttura (Nome e Descrizione).</p>
                        </div>
                        <button
                            onClick={() => navigate(`/provider/edit/bnb/${providerInfo?.serviceId}`)}
                            className="ml-auto bg-amber-500 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-amber-600 transition-colors whitespace-nowrap"
                        >
                            Aggiorna Ora
                        </button>
                    </div>
                </div>
            )}
            <LoadingScreen isLoading={isLoading} />
            <SuccessModal
                isOpen={!!successMessage}
                onClose={() => setSuccessMessage(null)}
                message={successMessage}
            />
            {error && (
                <ErrorModal
                    isOpen={!!error}
                    onClose={() => setError(null)}
                    message={error}
                />
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

            {/* --- UI STANDARD --- */}

            {/* Modali */}
            <BookingDetailModal isOpen={detailsOpen} onClose={() => setDetailsOpen(false)} booking={selectedBooking} activeCategory="beb" />
            <ComplaintModal isOpen={complaintOpen} onClose={() => setComplaintOpen(false)} onConfirm={confirmComplaint} booking={selectedBooking} />
            <CancellationModal isOpen={cancelOpen} onClose={() => setCancelOpen(false)} onConfirm={confirmCancel} booking={selectedBooking} />
            <PriceCorrectionModal isOpen={correctionOpen} onClose={() => setCorrectionOpen(false)} onConfirm={confirmCorrection} booking={selectedBooking} />

            {/* 0. HEADER */}
            <div>
                {/* 0a. Stats */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
                    <div className="lg:col-span-2">
                        <StatsSummary activeCategory="beb" />
                    </div>

                    {/* 0b. Colonna Azioni (Desktop Side) */}
                    <div className="hidden lg:flex flex-col gap-4 h-full">
                        {/* A. Card SCANNER Desktop */}
                        <div
                            onClick={() => navigate('/provider/qr-validator?type=beb')}
                            className={`flex-1 min-h-[140px] bg-gradient-to-br from-[${HOGU_COLORS.dark}] to-slate-800 rounded-[2rem] p-6 text-white relative overflow-hidden group cursor-pointer shadow-xl shadow-slate-900/10 hover:shadow-2xl hover:-translate-y-1 transition-all flex flex-col justify-center`}
                        >
                            <div className="absolute -right-6 -top-6 text-white/5 group-hover:text-white/10 transition-colors pointer-events-none">
                                <QrCode size={120} />
                            </div>
                            <div className="relative z-10">
                                <div className="bg-white/10 w-fit p-2 rounded-xl backdrop-blur-md border border-white/10 mb-3">
                                    <ScanLine size={20} className={`text-[${HOGU_COLORS.primary}]`} />
                                </div>
                                <h3 className="text-xl font-bold mb-1">Reception Scanner</h3>
                                <p className="text-slate-400 text-xs font-medium">Registra check-in e check-out.</p>
                            </div>
                            <div className={`absolute bottom-6 right-6 text-[${HOGU_COLORS.primary}] opacity-0 group-hover:opacity-100 transition-opacity`}>
                                <ArrowRight size={24} />
                            </div>
                        </div>

                        {/* B. Card IMPOSTAZIONI Desktop */}
                        <button
                            onClick={() => setIsRoomSelectionOpen(true)}
                            className={`h-20 bg-white border border-slate-200 rounded-[1.5rem] px-6 flex items-center justify-between hover:bg-slate-50 hover:border-[${HOGU_COLORS.primary}]/50 transition-all group shadow-sm hover:shadow-md cursor-pointer`}
                        >
                            <div className="flex items-center gap-3 text-left">
                                <div className={`p-2.5 bg-slate-100 rounded-xl group-hover:bg-[${HOGU_COLORS.primary}]/10 group-hover:text-[${HOGU_COLORS.primary}] transition-colors text-slate-600`}>
                                    <Home size={20} />
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-800 text-sm">Le tue Stanze</h4>
                                    <p className="text-slate-400 text-xs">Gestisci disponibilità</p>
                                </div>
                            </div>
                            <Settings size={18} className={`text-slate-300 group-hover:text-[${HOGU_COLORS.primary}] transition-colors`} />
                        </button>
                    </div>
                </div>

                {/* 0c. Azioni Rapide SOLO MOBILE */}
                <div className="grid grid-cols-2 gap-3 lg:hidden mb-6 mt-4 md:mt-0">
                    <button onClick={() => navigate('/provider/qr-validator?type=beb')} className="bg-[#1a1a1a] text-white p-3 rounded-xl flex flex-col items-center justify-center gap-2 shadow-lg">
                        <QrCode size={20} />
                        <span className="text-xs font-bold">Scanner</span>
                    </button>
                    <button
                        onClick={() => !isDefaultInfo && setIsRoomSelectionOpen(true)}
                        disabled={isDefaultInfo}
                        className={`bg-white text-slate-700 p-3 rounded-xl flex flex-col items-center justify-center gap-2 border border-slate-100 shadow-sm transition-colors ${isDefaultInfo ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-50'}`}
                    >
                        <Settings size={20} />
                        <span className="text-xs font-bold">Struttura</span>
                    </button>
                </div>
            </div>

            {/* 1. SEZIONE PRIORITARIA: RICHIESTE PENDING */}
            {/* Nascosta su Mobile, gestita dall'Overlay */}
            <section className="relative hidden md:block">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                    <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-2xl border ${pendingListFull.length > 0 ? 'bg-amber-50 border-amber-100 text-amber-600' : 'bg-slate-50 border-slate-100 text-slate-400'}`}>
                            <BellRing size={28} className={pendingListFull.length > 0 ? 'animate-bounce' : ''} />
                        </div>
                        <div>
                            <h2 className={`text-2xl font-extrabold text-[${HOGU_COLORS.dark}]`}>Nuove Richieste</h2>
                            <p className="text-sm text-slate-500 font-medium">
                                {pendingListFull.length > 0 ? "Richieste in attesa di conferma e pagamento." : "Nessuna nuova richiesta da gestire."}
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
                    <div className="p-1.5 rounded-[2rem] bg-gradient-to-br from-indigo-50 via-purple-50 to-transparent">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {currentPendingList.map(b => (
                                <PendingRequestCard
                                    key={b.id}
                                    booking={b}
                                    activeCategory="beb"
                                    onAccept={handleAccept}
                                    onReject={handleReject}
                                    onRectify={handleRectify}
                                    onOpenDetails={(bk) => { setSelectedBooking(bk); setDetailsOpen(true); }}
                                />
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="bg-white border border-dashed border-slate-200 rounded-3xl p-8 flex flex-col items-center justify-center text-center">
                        <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mb-3">
                            <ConciergeBell size={32} />
                        </div>
                        <h3 className="text-lg font-bold text-slate-800">Tutto Tranquillo</h3>
                        <p className="text-slate-400">Nessuna nuova richiesta di soggiorno al momento.</p>
                    </div>
                )}
            </section>

            <div className="hidden md:block border-t border-slate-100 my-8"></div>

            <div className="border-t border-slate-100 my-8"></div>

            {/* 3. AGENDA SOGGIORNI */}
            <section>
                <div className="flex flex-col sm:flex-row justify-between items-end sm:items-center gap-4 mb-6">
                    <div className="w-full">
                        <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-slate-800 flex items-center gap-2 text-left">
                            <CalendarDays className={`text-[${HOGU_COLORS.primary}]`} /> Agenda Prenotazioni
                        </h2>
                        <p className="text-xs text-slate-400 font-medium mt-1">
                            {filter === 'active' ? "Check-in programmati da oggi in avanti." : "Storico dei soggiorni conclusi o annullati."}
                        </p>
                    </div>

                    <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                        <div className="flex bg-white p-1 rounded-2xl border border-slate-200 shadow-sm">
                            <button onClick={() => handleFilterChange('active')} className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wide transition-all ${filter === 'active' ? `bg-[${HOGU_COLORS.primary}] text-white shadow-md` : 'text-slate-400 hover:bg-slate-50'}`}>Attivi</button>
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
                                activeCategory="beb"
                                onOpenDetails={(bk) => { setSelectedBooking(bk); setDetailsOpen(true); }}
                                onOpenComplaint={(bk) => { setSelectedBooking(bk); setComplaintOpen(true); }}
                                onCancelBooking={(bk) => { setSelectedBooking(bk); setCancelOpen(true); }}
                            />
                        ))
                    ) : (
                        <div className="flex flex-col items-center justify-center py-12 bg-white rounded-3xl border border-dashed border-slate-200">
                            <BedDouble className="text-slate-300 mb-2" size={32} />
                            <p className="text-slate-400 font-medium">Nessun soggiorno trovato in questa sezione.</p>
                        </div>
                    )}
                </div>
            </section>

            {/* --- ROOM SELECTION MODAL --- */}
            {isRoomSelectionOpen && (
                <FullModalBackdrop onClose={() => setIsRoomSelectionOpen(false)}>
                    <div className="w-full">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h2 className="text-2xl font-bold text-slate-800">Gestisci Struttura</h2>
                                <p className="text-slate-400">Modifica dettagli generali o singole stanze</p>
                            </div>
                            <button onClick={() => setIsRoomSelectionOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                                <X size={24} className="text-slate-400" />
                            </button>
                        </div>

                        {/* SEZIONE DETTAGLI GENERALI */}
                        <div className="mb-6">
                            <div
                                onClick={() => {
                                    if (providerInfo?.serviceId) {
                                        navigate(`/provider/edit/bnb/${providerInfo.serviceId}`);
                                    }
                                }}
                                className="flex items-center justify-between p-4 rounded-2xl border border-indigo-100 bg-indigo-50/50 hover:border-indigo-300 hover:bg-indigo-50 hover:shadow-md transition-all group cursor-pointer"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 rounded-xl bg-indigo-100 text-indigo-500 flex items-center justify-center flex-shrink-0">
                                        <Store size={32} />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-slate-800 text-lg group-hover:text-indigo-600 transition-colors">Dettagli Generali Struttura</h4>
                                        <p className="text-sm text-slate-500">Modifica descrizione, posizione e foto principali</p>
                                    </div>
                                </div>
                                <div className="p-3 bg-white border border-indigo-100 rounded-xl text-indigo-300 group-hover:text-indigo-600 transition-colors shadow-sm">
                                    <Edit3 size={20} />
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-4 mb-4">
                            <div className="h-px flex-1 bg-slate-100"></div>
                            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Le tue Stanze</span>
                            <div className="h-px flex-1 bg-slate-100"></div>
                        </div>

                        {isLoadingRooms ? (
                            <div className="flex justify-center py-12">
                                <Loader2 size={40} className="animate-spin text-[#68B49B]" />
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-4 max-h-[60vh] overflow-y-auto pr-2">
                                {roomList.length > 0 ? (
                                    roomList.map(room => (
                                        <div key={room.id} className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 bg-slate-50 hover:border-[#68B49B] hover:bg-white hover:shadow-md transition-all group">
                                            <div className="flex items-center gap-4">
                                                <div className="w-16 h-16 rounded-xl bg-slate-200 overflow-hidden flex-shrink-0">
                                                    {room.images && room.images.length > 0 && (room.bnbServiceId || providerInfo?.serviceId) ? (
                                                        <SafeImage
                                                            src={`/files/bnb/${room.bnbServiceId || providerInfo?.serviceId}/${room.id}/${room.images[0]}`}
                                                            alt={room.name}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-slate-400">
                                                            <Home size={24} />
                                                        </div>
                                                    )}
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-slate-800 text-lg group-hover:text-[#68B49B] transition-colors">{room.name}</h4>
                                                    <div className="flex items-center gap-3 text-sm text-slate-500">
                                                        <span className="flex items-center gap-1"><User size={14} /> Max {room.maxGuests}</span>
                                                        <span className="flex items-center gap-1"><Euro size={14} /> €{formatPrice(room.priceForNight)}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => !isDefaultInfo && navigate(`/provider/edit/bnb/room/${room.id}`)}
                                                disabled={isDefaultInfo}
                                                className={`p-3 bg-white border border-slate-200 rounded-xl transition-all shadow-sm ${isDefaultInfo ? 'opacity-50 cursor-not-allowed' : 'text-slate-400 hover:text-[#68B49B] hover:border-[#68B49B]'}`}
                                            >
                                                <Edit3 size={20} />
                                            </button>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-12 text-slate-400">
                                        <Home size={48} className="mx-auto mb-4 opacity-20" />
                                        <p>Nessuna stanza trovata.</p>
                                    </div>
                                )}

                                <button
                                    onClick={() => !isDefaultInfo && navigate('/provider/bnb/room/create')}
                                    disabled={isDefaultInfo}
                                    className={`flex items-center justify-center gap-2 p-4 rounded-2xl border-2 border-dashed border-slate-200 transition-all font-bold mt-2 ${isDefaultInfo ? 'opacity-50 cursor-not-allowed text-slate-300' : 'text-slate-400 hover:border-[#68B49B] hover:text-[#68B49B] hover:bg-[#68B49B]/5'}`}
                                >
                                    <Plus size={20} /> Aggiungi Nuova Stanza
                                </button>
                            </div>
                        )}
                    </div>
                </FullModalBackdrop>
            )}

        </div>
    );
};

export default BebDashboard;

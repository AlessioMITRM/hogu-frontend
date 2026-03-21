import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Wallet, ChevronLeft, Calendar, Clock, User,
    Loader2, XCircle
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { restaurantService } from '../../../../../api/apiClient.js';
import { PaginationControls, StatusBadge } from './ProviderUI';
import { HOGU_COLORS, HOGU_THEME } from '../../../../../config/theme';
import LoadingScreen from '../../../../ui/LoadingScreen';
import { Breadcrumbs } from '../../../../ui/Breadcrumbs.jsx';
import SafeImage from '../../../../ui/SafeImage.jsx';


// Helper per formattare i prezzi
const formatPrice = (value) => {
    if (value === undefined || value === null) return '0,00';
    const num = typeof value === 'string' ? parseFloat(value.replace(',', '.')) : value;
    if (isNaN(num)) return '0,00';
    return num.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const RestaurantCommissions = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const breadcrumbsItems = [
        { label: 'Dashboard', href: '/provider/dashboard' },
        { label: 'Commissioni Ristorante', href: '#' }
    ];

    // States
    const [bookings, setBookings] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isPaying, setIsPaying] = useState(false);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const ITEMS_PER_PAGE = 10;

    // Guard per prevenire doppie esecuzioni
    const paymentExecutedRef = React.useRef(false);

    // Fetch Data
    const fetchCommissions = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await restaurantService.getCompletedBookingsForCommissions(page - 1, ITEMS_PER_PAGE);
            setBookings(data.content || []);
            setTotalPages(data.totalPages || 1);
        } catch (err) {
            console.error("Error fetching commissions:", err);
            setError(t('errors.generic_fetch', "Errore nel recupero delle commissioni."));
        } finally {
            setIsLoading(false);
        }
    }, [page, t]);

    useEffect(() => {
        // Non caricare i dati iniziali se stiamo per eseguire un pagamento
        const paymentId = searchParams.get('paymentId');
        if (!paymentId) {
            fetchCommissions();
        }
    }, [fetchCommissions, searchParams]);

    useEffect(() => {
        const paymentId = searchParams.get('paymentId');
        const payerId = searchParams.get('PayerID') || searchParams.get('payerId');

        if (paymentId && !paymentExecutedRef.current) {
            const executePayment = async () => {
                paymentExecutedRef.current = true;
                setIsPaying(true);
                setError(null);
                setSuccessMessage(null);
                try {
                    if (payerId) {
                        // Fallback per PayPal se vecchi link sono ancora attivi
                        await restaurantService.executeRestaurantCommissionsPayment(paymentId, payerId);
                    } else {
                        // Nuovo flusso Stripe
                        await restaurantService.executeRestaurantCommissionsPaymentStripe(paymentId);
                    }
                    
                    setSuccessMessage("Pagamento commissioni completato con successo.");

                    // Rimuoviamo i parametri dall'URL
                    const newParams = new URLSearchParams(searchParams);
                    newParams.delete('paymentId');
                    newParams.delete('PayerID');
                    newParams.delete('payerId');
                    setSearchParams(newParams, { replace: true });

                    // Ricarichiamo i dati
                    await fetchCommissions();
                } catch (err) {
                    console.error("Errore esecuzione pagamento commissioni:", err);
                    setError("Errore durante la conferma del pagamento delle commissioni.");
                } finally {
                    setIsPaying(false);
                }
            };
            executePayment();
        }
    }, [searchParams, setSearchParams, fetchCommissions]);

    const handlePayAll = async () => {
        setError(null);
        setSuccessMessage(null);
        setIsPaying(true);
        let isRedirecting = false;
        try {
            const resp = await restaurantService.payRestaurantCommissionsStripe();
            const approvalUrl = resp.approvalUrl;
            if (approvalUrl) {
                isRedirecting = true;
                window.location.href = approvalUrl;
            } else {
                setError("Impossibile avviare il pagamento con carta delle commissioni.");
            }
        } catch (err) {
            console.error("Errore avvio pagamento commissioni Stripe:", err);
            setError("Errore durante l'avvio del pagamento delle commissioni.");
        } finally {
            if (!isRedirecting) {
                setIsPaying(false);
            }
        }
    };

    const currentTotalCommission = bookings.reduce((acc, b) => {
        const guests = b.numberOfPeople || b.guests || 0;
        return acc + (guests * 2.50);
    }, 0);

    return (
        <>
            <LoadingScreen isLoading={isLoading || isPaying} />
            <div className={`min-h-screen bg-[#F8FAFC] pb-20 ${HOGU_THEME.fontFamily}`}>
                <div className="bg-white pt-12 pb-24 px-4 lg:px-8 relative overflow-hidden">
                    <div className="max-w-7xl mx-auto">
                        <Breadcrumbs items={breadcrumbsItems} />
                    </div>
                </div>
                <div className="max-w-7xl mx-auto px-4 lg:px-8 -mt-16 relative z-20">
                    <div className="animate-in fade-in pb-12">
                        <div className="flex items-center gap-4 mb-8">
                            <button
                                onClick={() => navigate(-1)}
                                className="w-10 h-10 flex items-center justify-center bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
                            >
                                <ChevronLeft size={20} className="text-slate-600" />
                            </button>
                            <div>
                                <h1 className="text-2xl font-extrabold text-[#1A202C]">Commissioni Ristorante</h1>
                                <p className="text-slate-500 text-sm">Riepilogo delle commissioni per prenotazioni completate</p>
                            </div>
                        </div>

                        <div className="bg-[#1A202C] rounded-[2rem] p-6 text-white relative overflow-hidden shadow-xl shadow-slate-900/10 mb-8">
                            <div className="absolute top-0 right-0 p-4 opacity-10">
                                <Wallet size={100} />
                            </div>
                            <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                <div>
                                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Commissioni (Pagina Corrente)</p>
                                    <h3 className="text-3xl font-extrabold">€ {formatPrice(currentTotalCommission)}</h3>
                                </div>
                                <button
                                    type="button"
                                    onClick={handlePayAll}
                                    disabled={isPaying || bookings.length === 0}
                                    className={`
                                    inline-flex items-center justify-center px-6 py-3 rounded-full text-sm font-bold shadow-lg transition-all
                                    ${isPaying || bookings.length === 0
                                            ? 'bg-slate-500 cursor-not-allowed opacity-70'
                                            : 'bg-[#68B49B] hover:bg-[#5aa88f] hover:shadow-xl hover:-translate-y-0.5'
                                        }
                                `}
                                >
                                    {isPaying ? (
                                        <>
                                            <Loader2 size={18} className="mr-2 animate-spin" />
                                            Pagamento in corso...
                                        </>
                                    ) : (
                                        <>
                                            Paga con Carta
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>

                        <div className="bg-white border border-slate-100 rounded-[2rem] shadow-sm overflow-hidden">
                            <div className="p-6 border-b border-slate-50 flex flex-col sm:flex-row justify-between items-center gap-4">
                                <h3 className="font-bold text-lg text-slate-800">Prenotazioni Completate</h3>
                                <PaginationControls
                                    currentPage={page}
                                    totalPages={totalPages}
                                    onNext={() => setPage(p => p + 1)}
                                    onPrev={() => setPage(p => p - 1)}
                                />
                            </div>

                            {successMessage && (
                                <div className="px-6 pt-4 text-sm text-emerald-700 font-bold">
                                    {successMessage}
                                </div>
                            )}

                            {error ? (
                                <div className="p-10 text-center flex flex-col items-center justify-center">
                                    <XCircle size={40} className="text-red-400 mb-3" />
                                    <p className="text-slate-500">{error}</p>
                                    <button onClick={fetchCommissions} className="mt-4 text-[#68B49B] font-bold hover:underline">Riprova</button>
                                </div>
                            ) : bookings.length === 0 ? (
                                <div className="p-12 text-center text-slate-400">
                                    <Wallet size={48} className="mx-auto mb-4 opacity-20" />
                                    <p>Nessuna prenotazione completata trovata.</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-50">
                                                <th className="p-4 pl-6">Cliente</th>
                                                <th className="p-4">Data & Ora</th>
                                                <th className="p-4 text-center">Ospiti</th>
                                                <th className="p-4 text-right pr-6">Commissione</th>
                                            </tr>
                                        </thead>
                                        <tbody className="text-sm font-medium text-slate-600">
                                            {bookings.map((booking) => {
                                                const guests = booking.numberOfPeople || booking.guests || 0;
                                                const commission = guests * 2.50;
                                                const dateObj = new Date(booking.reservationTime);
                                                const dateStr = dateObj.toLocaleDateString('it-IT');
                                                const timeStr = dateObj.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });

                                                const imgName = booking.images && booking.images.length > 0 ? booking.images[0] : null;
                                                const imageUrl = imgName
                                                    ? (String(imgName).startsWith('http') ? imgName : `/files/restaurant/${booking.serviceId}/${imgName}`)
                                                    : null;

                                                return (
                                                    <tr key={booking.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors">
                                                        <td className="p-4 pl-6">
                                                            <div className="flex items-center gap-3">
                                                                {imageUrl ? (
                                                                    <SafeImage src={imageUrl} alt="" className="w-10 h-10 rounded-full object-cover shadow-sm" />
                                                                ) : (
                                                                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                                                                        <User size={20} />
                                                                    </div>
                                                                )}
                                                                <span className="font-bold text-slate-800">{booking.bookingFullName || booking.customerName || "Cliente"}</span>
                                                            </div>
                                                        </td>
                                                        <td className="p-4">
                                                            <div className="flex flex-col">
                                                                <span className="flex items-center gap-1.5 text-slate-800"><Calendar size={14} className="text-[#68B49B]" /> {dateStr}</span>
                                                                <span className="flex items-center gap-1.5 text-slate-400 text-xs mt-0.5"><Clock size={14} /> {timeStr}</span>
                                                            </div>
                                                        </td>
                                                        <td className="p-4 text-center">
                                                            <span className="bg-slate-100 text-slate-600 px-2.5 py-1 rounded-lg text-xs font-bold">
                                                                {guests}
                                                            </span>
                                                        </td>
                                                        <td className="p-4 text-right pr-6">
                                                            <span className="text-red-500 font-extrabold text-base">- € {formatPrice(commission)}</span>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default RestaurantCommissions;

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ShieldCheck, Info, CalendarCheck, CreditCard, FileText, ChevronRight, X, BellRing, Navigation, QrCode, Settings } from 'lucide-react';

import { withAuthProtection } from './../../../auth/withAuthProtection.jsx';

import ClubDashboard from './ClubDashboard';
import RestaurantDashboard from './RestaurantDashboard';
import BebDashboard from './BebDashboard';
import NccDashboard from './NccDashboard';
import LuggageDashboard from './LuggageDashboard';

// --- INFO ACCORDION ITEM (Spostato da BebDashboard) ---
const InfoAccordionItem = ({ icon: Icon, title, description, colorClass, defaultOpen = false }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    return (
        <div className="border-b border-gray-100 last:border-0 text-left">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between py-3 hover:bg-gray-50 transition-colors rounded-lg px-2 -mx-2 group"
            >
                <div className="flex items-center gap-3">
                    <div className={`p-1.5 rounded-lg shrink-0 transition-colors ${colorClass}`}><Icon size={20} /></div>
                    <span className="font-bold text-base text-gray-900">{title}</span>
                </div>
                <ChevronRight size={18} className={`text-gray-400 transition-transform duration-300 ${isOpen ? 'rotate-90' : ''}`} />
            </button>
            <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-48 opacity-100 mb-3' : 'max-h-0 opacity-0'}`}>
                <p className="text-sm text-gray-500 leading-relaxed pl-[3.2rem] pr-2">{description}</p>
            </div>
        </div>
    );
};

// --- MODAL BACKDROP (Spostato da BebDashboard) ---
const FullModalBackdrop = ({ children, onClose }) => {
    React.useEffect(() => {
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

const CoreDashboardBase = () => {
    const { t } = useTranslation('dashboard');
    const navigate = useNavigate();
    const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);

    const parsedServices = JSON.parse(localStorage.getItem('services'));

    // Funzione per renderizzare il componente corretto
    // Esiste UN SOLO servizio attivo alla volta
    const renderDashboardContent = () => {
        if (parsedServices?.hasClub) {
            return <ClubDashboard />;
        }

        if (parsedServices?.hasRestaurant) {
            return <RestaurantDashboard />;
        }

        if (parsedServices?.hasBnb) {
            return <BebDashboard />;
        }

        if (parsedServices?.hasNcc) {
            return <NccDashboard />;
        }

        if (parsedServices?.hasLuggage) {
            return <LuggageDashboard />;
        }

        // Nessun servizio attivo
        navigate('/not-found', { replace: true });
        return null;
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-800 selection:bg-[#68B49B] selection:text-white pt-16 md:pt-24 pb-10 md:pb-12">
            {/* MODALE INFO SERVIZIO */}
            {isInfoModalOpen && (
                <FullModalBackdrop onClose={() => setIsInfoModalOpen(false)}>
                    <div className="w-full">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className={`p-2.5 bg-[#68B49B]/10 text-[#68B49B] rounded-xl`}>
                                    <Info size={24} />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-slate-800">{t('provider.core.modal_info_title', "Info Servizio")}</h2>
                                    <p className="text-slate-400">{t('provider.core.modal_info_subtitle', "Informazioni utili per la tua struttura")}</p>
                                </div>
                            </div>
                            <button onClick={() => setIsInfoModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                                <X size={24} className="text-slate-400" />
                            </button>
                        </div>

                        <div className="space-y-1 bg-white p-2 rounded-2xl border border-slate-100 shadow-sm">
                            {parsedServices?.hasClub ? (
                                <>
                                    <InfoAccordionItem
                                        icon={CalendarCheck}
                                        colorClass="bg-blue-50 text-blue-600"
                                        title={t('provider.core.info_items.club.event_management.title', 'Gestione Eventi')}
                                        description={t('provider.core.info_items.club.event_management.desc', "Crea e gestisci le tue serate in pochi clic. Mantieni aggiornati i dettagli dell'evento, le disponibilità dei tavoli e monitora le prenotazioni in tempo reale per una serata di successo.")}
                                    />
                                    <InfoAccordionItem
                                        icon={ShieldCheck}
                                        colorClass="bg-amber-50 text-amber-600"
                                        title={t('provider.core.info_items.club.entry_scanner.title', 'Scanner Ingressi')}
                                        description={t('provider.core.info_items.club.entry_scanner.desc', "Velocizza l'accesso al tuo club. Utilizza lo scanner QR integrato per convalidare i biglietti digitali dei tuoi clienti all'ingresso, garantendo un controllo flussi fluido e sicuro.")}
                                    />
                                    <InfoAccordionItem
                                        icon={FileText}
                                        colorClass="bg-purple-50 text-purple-600"
                                        title={t('provider.core.info_items.club.lists_tables.title', 'Liste e Tavoli')}
                                        description={t('provider.core.info_items.club.lists_tables.desc', "Organizza al meglio i tuoi spazi. Gestisci le richieste per le liste d'attesa e le prenotazioni dei tavoli (Privé e Pista) approvando le richieste per permettere il pagamento sicuro sulla piattaforma.")}
                                    />
                                    <InfoAccordionItem
                                        icon={CreditCard}
                                        colorClass="bg-emerald-50 text-emerald-600"
                                        title={t('provider.core.info_items.club.payments.title', 'Pagamenti')}
                                        description={t('provider.core.info_items.club.payments.desc', 'Massima trasparenza sui tuoi incassi. I pagamenti confermati vengono liquidati cumulativamente a fine mese. La commissione copre la gestione transazioni e il supporto tecnico della piattaforma.')}
                                    />
                                </>
                            ) : parsedServices?.hasRestaurant ? (
                                <>
                                    <InfoAccordionItem
                                        icon={CalendarCheck}
                                        colorClass="bg-blue-50 text-blue-600"
                                        title={t('provider.core.info_items.restaurant.room_management.title', 'Gestione Sala')}
                                        description={t('provider.core.info_items.restaurant.room_management.desc', "Accetta o rifiuta le prenotazioni in tempo reale dalla sezione 'Gestione Sala'. Monitora l'arrivo dei clienti per un servizio sempre eccellente.")}
                                    />
                                    <InfoAccordionItem
                                        icon={ShieldCheck}
                                        colorClass="bg-amber-50 text-amber-600"
                                        title={t('provider.core.info_items.restaurant.qr_scanner.title', 'Scanner QR')}
                                        description={t('provider.core.info_items.restaurant.qr_scanner.desc', "Valida rapidamente l'arrivo dei clienti. Usa lo scanner integrato per validare e verificare le prenotazioni digitali al momento dell'accoglienza al tavolo.")}
                                    />
                                    <InfoAccordionItem
                                        icon={FileText}
                                        colorClass="bg-purple-50 text-purple-600"
                                        title={t('provider.core.info_items.restaurant.booking_schedule.title', 'Agenda Prenotazioni')}
                                        description={t('provider.core.info_items.restaurant.booking_schedule.desc', "Mantieni il controllo del tuo locale. Consulta in 'In Arrivo' le prenotazioni già confermate e pronte per il servizio. Usa l' 'Archivio' per consultare lo storico completo delle prestazioni completate, annullate o rifiutate.")}
                                    />
                                    <InfoAccordionItem
                                        icon={CreditCard}
                                        colorClass="bg-emerald-50 text-emerald-600"
                                        title={t('provider.core.info_items.restaurant.commissions_payments.title', 'Commissioni e Pagamenti')}
                                        description={t('provider.core.info_items.restaurant.commissions_payments.desc', 'Calcolo automatico e trasparente. Le commissioni (2.50€ per coperto) vengono detratte solo sulle prenotazioni completate, con liquidazione mensile sul tuo conto.')}
                                    />
                                </>
                            ) : parsedServices?.hasBnb ? (
                                <>
                                    <InfoAccordionItem
                                        icon={CalendarCheck}
                                        colorClass="bg-blue-50 text-blue-600"
                                        title={t('provider.core.info_items.bnb.booking_schedule.title', 'Agenda Prenotazioni')}
                                        description={t('provider.core.info_items.bnb.booking_schedule.desc', "Monitora l'attività della tua struttura. In 'In Arrivo' trovi tutti i check-in da oggi in avanti, incluse le prenotazioni annullate in giornata. L' 'Archivio' raccoglie esclusivamente i soggiorni con check-in antecedente alla data odierna. Ogni prenotazione ha un codice unico (COD) per una rapida identificazione.")}
                                    />
                                    <InfoAccordionItem
                                        icon={ShieldCheck}
                                        colorClass="bg-amber-50 text-amber-600"
                                        title={t('provider.core.info_items.bnb.reception_scanner.title', 'Reception Scanner')}
                                        description={t('provider.core.info_items.bnb.reception_scanner.desc', "Semplifica l'accoglienza con lo scanner integrato. Inquadra i documenti d'identità dei tuoi ospiti per registrare automaticamente i dati necessari, riducendo i tempi d'attesa e gli errori manuali.")}
                                    />
                                    <InfoAccordionItem
                                        icon={FileText}
                                        colorClass="bg-purple-50 text-purple-600"
                                        title={t('provider.core.info_items.bnb.your_rooms.title', 'Le tue Stanze')}
                                        description={t('provider.core.info_items.bnb.your_rooms.desc', 'Mantieni sempre aggiornata la tua disponibilità. Puoi modificare i prezzi per periodi speciali, aggiornare le descrizioni delle camere e gestire i calendari per evitare sovrapposizioni.')}
                                    />
                                    <InfoAccordionItem
                                        icon={CreditCard}
                                        colorClass="bg-emerald-50 text-emerald-600"
                                        title={t('provider.core.info_items.bnb.payments_compensation.title', 'Pagamenti e Compensi')}
                                        description={t('provider.core.info_items.bnb.payments_compensation.desc', "La trasparenza è fondamentale. Il compenso netto viene liquidato cumulativamente a fine mese per tutti i soggiorni completati. La commissione di servizio copre la gestione transazioni e l'assicurazione sulla piattaforma.")}
                                    />
                                </>
                            ) : parsedServices?.hasLuggage ? (
                                <>
                                    <InfoAccordionItem
                                        icon={CalendarCheck}
                                        colorClass="bg-blue-50 text-blue-600"
                                        title={t('provider.core.info_items.luggage.request_management.title', 'Gestione Richieste')}
                                        description={t('provider.core.info_items.luggage.request_management.desc', "Monitora la sezione 'In Attesa' per accettare i nuovi depositi. Ricorda di verificare sempre il numero e la dimensione dei bagagli alla consegna.")}
                                    />
                                    <InfoAccordionItem
                                        icon={ShieldCheck}
                                        colorClass="bg-amber-50 text-amber-600"
                                        title={t('provider.core.info_items.luggage.storage_scanner.title', 'Scanner Deposito')}
                                        description={t('provider.core.info_items.luggage.storage_scanner.desc', 'Usa lo scanner per validare sia la consegna che il ritiro.')}
                                    />
                                    <InfoAccordionItem
                                        icon={FileText}
                                        colorClass="bg-purple-50 text-purple-600"
                                        title={t('provider.core.info_items.luggage.security_custody.title', 'Sicurezza e Custodia')}
                                        description={t('provider.core.info_items.luggage.security_custody.desc', "Mantieni i bagagli in aree sicure e non accessibili al pubblico. Consigliamo l'uso di sigilli di sicurezza per garantire l'integrità del servizio.")}
                                    />
                                    <InfoAccordionItem
                                        icon={CreditCard}
                                        colorClass="bg-emerald-50 text-emerald-600"
                                        title={t('provider.core.info_items.luggage.rates_hours.title', 'Tariffe e Orari')}
                                        description={t('provider.core.info_items.luggage.rates_hours.desc', "Puoi gestire i prezzi per dimensione (Piccolo, Medio, Grande) e gli orari di apertura direttamente dalla sezione 'Modifica Deposito'.")}
                                    />
                                    <InfoAccordionItem
                                        icon={CreditCard}
                                        colorClass="bg-emerald-50 text-emerald-600"
                                        title={t('provider.core.info_items.luggage.payments.title', 'Pagamenti')}
                                        description={t('provider.core.info_items.luggage.payments.desc', 'Trasparenza totale sui tuoi rimborsi. Gli incassi accumulati vengono liquidati a fine mese sul tuo conto corrente, detratta la commissione di servizio per la gestione della piattaforma.')}
                                    />
                                </>
                            ) : parsedServices?.hasNcc ? (
                                <>
                                    <InfoAccordionItem
                                        icon={BellRing}
                                        colorClass="bg-amber-50 text-amber-600"
                                        title={t('provider.core.info_items.ncc.request_management.title', 'Gestione Richieste')}
                                        description={t('provider.core.info_items.ncc.request_management.desc', "Le nuove prenotazioni appaiono in 'Richieste Corsa'. Puoi accettare, rettificare il prezzo (per extra o variazioni) o rifiutare la richiesta se non puoi coprire il servizio.")}
                                    />
                                    <InfoAccordionItem
                                        icon={Navigation}
                                        colorClass="bg-emerald-50 text-emerald-600"
                                        title={t('provider.core.info_items.ncc.current_ride.title', 'Corsa in Corso')}
                                        description={t('provider.core.info_items.ncc.current_ride.desc', "Le corse confermate compaiono in 'Richiesta in corso'. Qui visualizzi la mappa del percorso e puoi segnare la corsa come completata al termine del trasferimento.")}
                                    />
                                    <InfoAccordionItem
                                        icon={QrCode}
                                        colorClass="bg-indigo-50 text-indigo-600"
                                        title={t('provider.core.info_items.ncc.ride_scanner.title', 'Scanner Corsa')}
                                        description={t('provider.core.info_items.ncc.ride_scanner.desc', "Utilizza la funzione Scanner per convalidare il voucher del cliente tramite codice QR direttamente al momento dell'accoglienza a bordo.")}
                                    />
                                    <InfoAccordionItem
                                        icon={Settings}
                                        colorClass="bg-slate-50 text-slate-600"
                                        title={t('provider.core.info_items.ncc.rates_fleet.title', 'Tariffe e Flotta')}
                                        description={t('provider.core.info_items.ncc.rates_fleet.desc', "In 'Il tuo Servizio' puoi aggiornare i mezzi a disposizione, le tariffe per km.")}
                                    />
                                </>
                            ) : (
                                <>
                                    <InfoAccordionItem
                                        icon={CalendarCheck}
                                        colorClass="bg-blue-50 text-blue-600"
                                        title={t('provider.core.info_items.default.bookings.title', 'Prenotazioni')}
                                        description={t('provider.core.info_items.default.bookings.desc', 'Gestisci le tue prenotazioni e il calendario.')}
                                    />
                                    <InfoAccordionItem
                                        icon={CreditCard}
                                        colorClass="bg-emerald-50 text-emerald-600"
                                        title={t('provider.core.info_items.default.payments.title', 'Pagamenti')}
                                        description={t('provider.core.info_items.default.payments.desc', 'Ricevi i pagamenti direttamente sul tuo conto.')}
                                    />
                                    <InfoAccordionItem
                                        icon={FileText}
                                        colorClass="bg-purple-50 text-purple-600"
                                        title={t('provider.core.info_items.default.rules.title', 'Regole')}
                                        description={t('provider.core.info_items.default.rules.desc', 'Imposta le regole della casa e i termini di cancellazione.')}
                                    />
                                </>
                            )}
                        </div>

                        <button
                            onClick={() => setIsInfoModalOpen(false)}
                            className={`w-full mt-8 py-4 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-700 transition-all shadow-lg active:scale-[0.98]`}
                        >
                            {t('provider.core.modal_close', "Ho capito")}
                        </button>
                    </div>
                </FullModalBackdrop>
            )}

            <div className="max-w-7xl mx-auto px-4 lg:px-8">

                {/* --- HEADER COMUNE --- */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-extrabold text-[#1A202C] tracking-tight">
                            {t('provider.core.title', "Dashboard Provider")}
                        </h1>
                    </div>

                    {/* Bottone Account / Sicurezza / Info */}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setIsInfoModalOpen(true)}
                            className="flex items-center gap-2 bg-white border border-slate-200 px-5 py-2.5 rounded-xl text-slate-600 font-bold hover:bg-slate-50 hover:text-[#1A202C] hover:border-slate-300 transition-all shadow-sm active:scale-95"
                        >
                            <Info size={18} />
                            {t('provider.core.info_btn', "Info")}
                        </button>
                        <button
                            onClick={() => navigate('/provider/credential-reset')}
                            className="flex items-center gap-2 bg-white border border-slate-200 px-5 py-2.5 rounded-xl text-slate-600 font-bold hover:bg-slate-50 hover:text-[#1A202C] hover:border-slate-300 transition-all shadow-sm active:scale-95"
                        >
                            <ShieldCheck size={18} />
                            {t('provider.core.security_btn', "Sicurezza Account")}
                        </button>
                    </div>
                </div>

                {/* --- CONTENUTO DINAMICO --- */}
                {/* Wrapper con animazione per rendere fluido il cambio */}
                <div className="animate-in fade-in zoom-in-95 duration-300">
                    {renderDashboardContent()}
                </div>

            </div>
        </div>
    );
};

// Esportazione con protezione Auth (Ruolo PROVIDER)
export const CoreDashboard = withAuthProtection(CoreDashboardBase, ['PROVIDER']);

export default CoreDashboard;

import React, { useState } from 'react';
import { 
  User, Briefcase, DollarSign, TrendingUp, CheckCircle, XCircle, 
  AlertTriangle, FileText, ChevronRight, Search, Filter, ShieldAlert, 
  MessageSquare, Users, Lock, Unlock, Ban, X, Banknote, ArrowUpRight,
  ChevronLeft, Calendar, Clock, MapPin, Mail, Phone,
  Car, Bed, Utensils, Music, Package, Luggage // Icone specifiche servizi
} from 'lucide-react';
import { HOGU_COLORS, HOGU_THEME } from '../../../../config/theme.js';

// --- MOCK DATA AGGIORNATI CON DETTAGLI SPECIFICI ---
const mockPendingProviders = [
  { id: 1, name: "Luxury Van Milano", type: "NCC", requestDate: "22 Nov 2025", email: "contact@luxuryvan.it", status: "pending" },
  { id: 2, name: "Hostaria Romana", type: "Ristorante", requestDate: "23 Nov 2025", email: "info@hostariaromana.com", status: "pending" },
  { id: 3, name: "Club 84", type: "Club", requestDate: "23 Nov 2025", email: "management@club84.it", status: "pending" },
  { id: 4, name: "Guide Turistiche Roma", type: "Tour", requestDate: "24 Nov 2025", email: "tours@rome.it", status: "pending" },
  { id: 5, name: "Spa Relax", type: "Wellness", requestDate: "25 Nov 2025", email: "info@sparelax.it", status: "pending" },
];

const mockComplaints = [
  { 
    id: 101, 
    serviceType: 'BNB',
    user: "Mario Rossi", userEmail: "mario@test.it", userPhone: "+39 333 1112233",
    provider: "Trastevere Suite", providerEmail: "suite@trastevere.it", providerPhone: "+39 06 998877",
    bookingId: "BK-BNB-001", bookingDate: "20 Nov 2025",
    details: {
        checkIn: "20 Nov 14:00",
        checkOut: "22 Nov 10:00",
        guests: 2,
        room: "Suite Vista",
        address: "Vicolo del Cinque, 12, Roma"
    },
    date: "20 Nov 2025", 
    issue: "Camera non pulita al check-in e lenzuola mancanti.", 
    severity: "medium", status: "open" 
  },
  { 
    id: 102, 
    serviceType: 'NCC',
    user: "Giulia Bianchi", userEmail: "giulia@test.it", userPhone: "+39 333 4445566",
    provider: "NCC Transfer", providerEmail: "driver@ncc.it", providerPhone: "+39 333 7778899",
    bookingId: "BK-NCC-002", bookingDate: "21 Nov 2025",
    details: {
        pickup: "Fiumicino Aeroporto",
        dropoff: "Hotel De Russie, Roma",
        vehicle: "Mercedes Classe E",
        passengers: 3,
        flight: "AZ 1234"
    },
    date: "21 Nov 2025", 
    issue: "Autista arrivato con 20 min di ritardo senza avvisare.", 
    severity: "low", status: "open" 
  },
  { 
    id: 103, 
    serviceType: 'CLUB',
    user: "Luca Verdi", userEmail: "luca@test.it", userPhone: "+39 333 9990000",
    provider: "Hogu Club Roma", providerEmail: "club@hogu.it", providerPhone: "+39 06 112233",
    bookingId: "BK-CLUB-003", bookingDate: "19 Nov 2025",
    details: {
        event: "Saturday Night Fever",
        entryTime: "23:00",
        guests: 4,
        table: "Privè Gold - Tavolo 4",
        package: "2 Bottiglie Belvedere"
    },
    date: "19 Nov 2025", 
    issue: "Negato accesso nonostante prenotazione confermata.", 
    severity: "high", status: "investigating" 
  },
  { 
    id: 104, 
    serviceType: 'RISTORANTE',
    user: "Elena Neri", userEmail: "elena@test.it", userPhone: "+39 333 5556677",
    provider: "Ristorante Stellato", providerEmail: "chef@stars.it", providerPhone: "+39 06 445566",
    bookingId: "BK-FOOD-004", bookingDate: "22 Nov 2025",
    details: {
        time: "20:00",
        guests: 2,
        area: "Terrazza Panoramica",
        dietary: "1 Vegano, 1 Celiaco"
    },
    date: "22 Nov 2025", 
    issue: "Tavolo non disponibile all'arrivo.", 
    severity: "medium", status: "open" 
  },
  { 
    id: 105, 
    serviceType: 'LUGGAGE',
    user: "Paolo Gialli", userEmail: "paolo@test.it", userPhone: "+39 333 1239876",
    provider: "Station Point", providerEmail: "storage@station.it", providerPhone: "+39 06 765432",
    bookingId: "BK-BAG-005", bookingDate: "24 Nov 2025",
    details: {
        dropoff: "24 Nov 09:00",
        pickup: "24 Nov 18:00",
        bags: 3,
        location: "Via Giolitti 10, Roma"
    },
    date: "24 Nov 2025", 
    issue: "Punto chiuso all'orario di ritiro concordato.", 
    severity: "high", status: "open" 
  }
];

const mockAccountsDatabase = [
    { id: 'u1', name: "Alessandro Verdi", email: "ale.verdi@gmail.com", role: "CUSTOMER", status: "active", joined: "10/01/2024" },
    { id: 'u2', name: "Marco Neri", email: "marco.neri@libero.it", role: "CUSTOMER", status: "blocked", joined: "15/03/2024" },
    { id: 'u3', name: "Elisa Blu", email: "elisa.blu@gmail.com", role: "CUSTOMER", status: "active", joined: "22/06/2024" },
    { id: 'p1', name: "Ristorante Da Mario", email: "info@damario.it", role: "PROVIDER", status: "active", joined: "20/11/2023" },
    { id: 'p2', name: "Taxi Veloce", email: "driver@taxi.it", role: "PROVIDER", status: "active", joined: "05/05/2024" },
    { id: 'p3', name: "B&B Bella Vista", email: "contact@bellavista.it", role: "PROVIDER", status: "blocked", joined: "12/08/2024" },
];

// --- COMPONENTS UI ---

const PaginationControls = ({ currentPage, totalPages, onNext, onPrev }) => {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center gap-2 justify-center mt-4">
      <button onClick={onPrev} disabled={currentPage === 1} className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"><ChevronLeft size={16} /></button>
      <span className="text-xs font-bold text-gray-600">{currentPage} / {totalPages}</span>
      <button onClick={onNext} disabled={currentPage === totalPages} className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"><ChevronRight size={16} /></button>
    </div>
  );
};

const StatCard = ({ title, value, icon: Icon, colorClass, trend }) => (
  <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover:shadow-md transition-all">
    <div className="flex justify-between items-start mb-4">
      <div className={`p-3 rounded-2xl bg-gray-50 ${colorClass}`}><Icon size={24} /></div>
      {trend && <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-lg">{trend}</span>}
    </div>
    <div><p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">{title}</p><h3 className="text-3xl font-extrabold text-gray-900">{value}</h3></div>
  </div>
);

const ProviderRequestCard = ({ provider, onApprove, onReject }) => (
  <div className="bg-white p-5 rounded-[1.5rem] border border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4 hover:border-orange-200 transition-all shadow-sm">
    <div className="flex items-center gap-4 w-full sm:w-auto">
      <div className="w-12 h-12 rounded-full bg-orange-50 flex items-center justify-center text-orange-500 font-bold text-xl shrink-0">{provider.name.charAt(0)}</div>
      <div>
        <h4 className="font-bold text-gray-900">{provider.name}</h4>
        <div className="flex items-center gap-2 text-sm text-gray-500"><span className="bg-gray-100 px-2 py-0.5 rounded text-xs font-bold uppercase">{provider.type}</span><span>• {provider.email}</span></div>
        <div className="text-xs text-gray-400 mt-1">Richiesta del: {provider.requestDate}</div>
      </div>
    </div>
    <div className="flex gap-2 w-full sm:w-auto">
      <button onClick={() => onReject(provider.id)} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-red-600 border border-red-100 hover:bg-red-50 transition-colors"><XCircle size={18} /> Rifiuta</button>
      <button onClick={() => onApprove(provider.id)} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white bg-green-500 hover:bg-green-600 shadow-lg shadow-green-500/20 transition-colors"><CheckCircle size={18} /> Approva</button>
    </div>
  </div>
);

const ComplaintCard = ({ complaint, onResolve, onOpenDetail }) => {
  const severityColors = { low: 'bg-yellow-100 text-yellow-700', medium: 'bg-orange-100 text-orange-700', high: 'bg-red-100 text-red-700' };
  return (
    <div className="bg-white p-5 rounded-[1.5rem] border border-gray-100 hover:border-red-200 transition-all shadow-sm group h-full flex flex-col">
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-2"><span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase ${severityColors[complaint.severity]}`}>Priorità {complaint.severity}</span><span className="text-xs text-gray-400">#{complaint.id}</span></div>
        <span className="text-xs font-medium text-gray-500">{complaint.date}</span>
      </div>
      <h4 className="font-bold text-gray-900 mb-1 flex items-center gap-2 line-clamp-1"><AlertTriangle size={16} className="text-red-500 shrink-0" />{complaint.issue}</h4>
      <div className="flex items-center gap-2 text-sm text-gray-600 mb-4 bg-gray-50 p-2 rounded-lg mt-auto"><span className="font-bold truncate">{complaint.user}</span><span className="text-gray-400">vs</span><span className="font-bold truncate">{complaint.provider}</span></div>
      <div className="flex gap-2 pt-2 border-t border-gray-50">
        <button onClick={() => onOpenDetail(complaint)} className="flex-1 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100 flex items-center justify-center gap-1"><FileText size={14} /> Dettagli</button>
        <button onClick={() => onResolve(complaint)} className="flex-1 py-2 rounded-xl text-xs font-bold text-white bg-gray-900 hover:bg-gray-800 flex items-center justify-center gap-1"><CheckCircle size={14} /> Risolvi</button>
      </div>
    </div>
  );
};

const AccountManagementCard = ({ title, type, accounts, onInitiateAction }) => {
    const [inputValue, setInputValue] = useState("");
    const filtered = accounts.filter(acc => acc.role === type && (acc.name.toLowerCase().includes(inputValue.toLowerCase()) || acc.email.toLowerCase().includes(inputValue.toLowerCase())));
    return (
        <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden flex flex-col h-full">
            <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                <h3 className="text-lg font-bold text-gray-900 mb-1">{title}</h3>
                <div className="relative mt-2"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} /><input type="text" placeholder="Cerca utente..." value={inputValue} onChange={(e) => setInputValue(e.target.value)} className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:border-[#68B49B] outline-none" /></div>
            </div>
            <div className="overflow-y-auto p-2 space-y-2 max-h-[300px] custom-scrollbar">
                {filtered.map(acc => (
                    <div key={acc.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition-all">
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${acc.status === 'active' ? (type === 'CUSTOMER' ? 'bg-blue-400' : 'bg-orange-400') : 'bg-gray-400'}`}>{acc.name.charAt(0)}</div>
                            <div><p className={`text-sm font-bold ${acc.status === 'blocked' ? 'text-gray-400 line-through' : 'text-gray-900'}`}>{acc.name}</p><p className="text-xs text-gray-500">{acc.email}</p></div>
                        </div>
                        <button onClick={() => onInitiateAction(acc)} className={`p-2 rounded-lg transition-colors ${acc.status === 'active' ? 'text-gray-300 hover:bg-red-50 hover:text-red-500' : 'text-green-500 bg-green-50 hover:bg-green-100'}`}>{acc.status === 'active' ? <Lock size={18} /> : <Unlock size={18} />}</button>
                    </div>
                ))}
            </div>
        </div>
    );
};

// --- MODALI ---

const ConfirmModal = ({ isOpen, onClose, onConfirm, actionData }) => {
    if (!isOpen || !actionData) return null;
    const isBlocking = actionData.currentStatus === 'active';
    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white rounded-[2rem] w-full max-w-sm p-6 shadow-2xl flex flex-col items-center text-center">
                <div className={`p-4 rounded-full mb-4 ${isBlocking ? 'bg-red-50 text-red-500' : 'bg-green-50 text-green-500'}`}>{isBlocking ? <Ban size={32} /> : <CheckCircle size={32} />}</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{isBlocking ? 'Bloccare Utente?' : 'Sbloccare Utente?'}</h3>
                <p className="text-gray-500 text-sm mb-6">Stai per {isBlocking ? 'bloccare' : 'riattivare'} <strong>{actionData.name}</strong>.</p>
                <div className="flex gap-3 w-full">
                    <button onClick={onClose} className="flex-1 py-3 rounded-xl font-bold text-gray-500 bg-gray-100 hover:bg-gray-200">Annulla</button>
                    <button onClick={onConfirm} className={`flex-1 py-3 rounded-xl font-bold text-white shadow-lg ${isBlocking ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'}`}>{isBlocking ? 'Blocca' : 'Sblocca'}</button>
                </div>
            </div>
        </div>
    );
};

const ComplaintResolveModal = ({ isOpen, onClose, onResolve, complaint }) => {
    if (!isOpen || !complaint) return null;
    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white rounded-[2rem] w-full max-w-md p-6 shadow-2xl flex flex-col items-center text-center">
                <h3 className="text-xl font-bold text-gray-900 mb-2">Risolvi Segnalazione</h3>
                <p className="text-gray-500 text-sm mb-6">Come vuoi chiudere la segnalazione per la prenotazione <strong>{complaint.bookingId}</strong>?</p>
                <div className="grid grid-cols-1 w-full gap-3">
                    <button onClick={() => onResolve(complaint.id, 'completed')} className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl font-bold text-white bg-green-500 hover:bg-green-600 shadow-lg shadow-green-500/20 transition-all"><CheckCircle size={18}/> Segna come Completata</button>
                    <button onClick={() => onResolve(complaint.id, 'cancelled')} className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl font-bold text-white bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/20 transition-all"><XCircle size={18}/> Segna come Annullata</button>
                </div>
                <button onClick={onClose} className="mt-4 text-gray-400 font-bold text-sm hover:text-gray-600">Annulla</button>
            </div>
        </div>
    );
}

// --- NUOVO COMPONENTE: MODALE DETTAGLIO ARRICCHITA ---
const ComplaintDetailModal = ({ isOpen, onClose, complaint }) => {
    if (!isOpen || !complaint) return null;

    // Funzione helper per renderizzare dettagli specifici in base al tipo di servizio
    const renderServiceDetails = () => {
        const { details, serviceType } = complaint;
        if (!details) return null;

        const DetailRow = ({ label, value, icon: Icon }) => (
             <div className="flex flex-col bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                <span className="text-[10px] font-bold text-gray-400 uppercase mb-1 flex items-center gap-1">
                    {Icon && <Icon size={10}/>} {label}
                </span>
                <span className="text-sm font-bold text-gray-800 break-words">{value}</span>
             </div>
        );

        switch (serviceType) {
            case 'BNB':
                return (
                    <div className="grid grid-cols-2 gap-3">
                        <DetailRow label="Check-In" value={details.checkIn} icon={Calendar} />
                        <DetailRow label="Check-Out" value={details.checkOut} icon={Calendar} />
                        <DetailRow label="Ospiti" value={details.guests} icon={Users} />
                        <DetailRow label="Stanza" value={details.room} icon={Bed} />
                        <div className="col-span-2"><DetailRow label="Indirizzo" value={details.address} icon={MapPin} /></div>
                    </div>
                );
            case 'NCC':
                return (
                    <div className="grid grid-cols-2 gap-3">
                        <div className="col-span-2"><DetailRow label="Pick-up" value={details.pickup} icon={MapPin} /></div>
                        <div className="col-span-2"><DetailRow label="Drop-off" value={details.dropoff} icon={MapPin} /></div>
                        <DetailRow label="Veicolo" value={details.vehicle} icon={Car} />
                        <DetailRow label="Passeggeri" value={details.passengers} icon={Users} />
                    </div>
                );
            case 'LUGGAGE':
                return (
                    <div className="grid grid-cols-2 gap-3">
                        <DetailRow label="Deposito" value={details.dropoff} icon={Clock} />
                        <DetailRow label="Ritiro" value={details.pickup} icon={Clock} />
                        <DetailRow label="Bagagli" value={details.bags} icon={Luggage} />
                        <DetailRow label="Location" value={details.location} icon={MapPin} />
                    </div>
                );
            case 'RISTORANTE':
                 return (
                    <div className="grid grid-cols-2 gap-3">
                        <DetailRow label="Orario" value={details.time} icon={Clock} />
                        <DetailRow label="Ospiti" value={details.guests} icon={Users} />
                        <DetailRow label="Zona" value={details.area} icon={Utensils} />
                        <DetailRow label="Note" value={details.dietary} icon={FileText} />
                    </div>
                );
             case 'CLUB':
                 return (
                    <div className="grid grid-cols-2 gap-3">
                        <div className="col-span-2"><DetailRow label="Evento" value={details.event} icon={Music} /></div>
                        <DetailRow label="Orario Ingresso" value={details.entryTime} icon={Clock} />
                        <DetailRow label="Tavolo" value={details.table} icon={Users} />
                        <div className="col-span-2"><DetailRow label="Pacchetto" value={details.package} icon={Banknote} /></div>
                    </div>
                );
            default:
                return <p className="text-sm text-gray-500">Nessun dettaglio specifico disponibile.</p>;
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white rounded-[2rem] w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <div>
                        <h3 className="text-xl font-bold text-gray-900">Segnalazione #{complaint.id}</h3>
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wide bg-gray-200 px-2 py-0.5 rounded-md mt-1 inline-block">{complaint.serviceType}</span>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full"><X size={20}/></button>
                </div>
                
                <div className="p-6 overflow-y-auto custom-scrollbar bg-gray-50/30">
                    
                    {/* SEZIONE 1: UTENTI (Con Telefono) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden">
                             <div className="absolute top-0 right-0 w-16 h-16 bg-blue-50 rounded-full -translate-y-1/2 translate-x-1/3"></div>
                            <span className="text-[10px] uppercase font-bold text-blue-500 mb-2 block relative z-10">Cliente</span>
                            <div className="flex items-start gap-3 relative z-10">
                                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold shrink-0"><User size={18}/></div>
                                <div>
                                    <p className="font-bold text-gray-900 text-sm">{complaint.user}</p>
                                    <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-0.5"><Mail size={12}/> {complaint.userEmail}</div>
                                    <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-0.5"><Phone size={12}/> {complaint.userPhone}</div>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden">
                             <div className="absolute top-0 right-0 w-16 h-16 bg-orange-50 rounded-full -translate-y-1/2 translate-x-1/3"></div>
                            <span className="text-[10px] uppercase font-bold text-orange-500 mb-2 block relative z-10">Provider</span>
                            <div className="flex items-start gap-3 relative z-10">
                                <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold shrink-0"><Briefcase size={18}/></div>
                                <div>
                                    <p className="font-bold text-gray-900 text-sm">{complaint.provider}</p>
                                    <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-0.5"><Mail size={12}/> {complaint.providerEmail}</div>
                                    <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-0.5"><Phone size={12}/> {complaint.providerPhone}</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* SEZIONE 2: DETTAGLI PRENOTAZIONE DINAMICI */}
                    <div className="bg-gray-100/50 rounded-3xl p-5 border border-gray-200 mb-6">
                        <div className="flex justify-between items-center mb-4 border-b border-gray-200 pb-2">
                             <h4 className="font-bold text-gray-900 flex items-center gap-2"><FileText size={18} className="text-[#68B49B]"/> Info Prenotazione</h4>
                             <span className="font-mono text-xs font-bold text-gray-500 bg-white px-2 py-1 rounded-md shadow-sm">{complaint.bookingId}</span>
                        </div>
                        {renderServiceDetails()}
                    </div>

                    {/* SEZIONE 3: PROBLEMA */}
                    <div className="bg-red-50 rounded-3xl p-5 border border-red-100">
                        <h4 className="font-bold text-red-700 mb-2 flex items-center gap-2"><AlertTriangle size={18}/> Segnalazione</h4>
                        <p className="text-gray-700 text-sm leading-relaxed bg-white/60 p-3 rounded-xl border border-red-100/50">{complaint.issue}</p>
                        <div className="mt-3 text-xs text-red-400 font-bold uppercase tracking-wider">Priorità: {complaint.severity}</div>
                    </div>
                </div>

                <div className="p-4 border-t border-gray-100 bg-white flex justify-end">
                    <button onClick={onClose} className="bg-gray-900 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-gray-800 shadow-lg shadow-gray-900/20 transition-all transform hover:scale-105">Chiudi Scheda</button>
                </div>
            </div>
        </div>
    );
};

// --- COMPONENTE PRINCIPALE ---
export const AdminDashboard = ({ onNavigate }) => {
  const [activeTab, setActiveTab] = useState('providers');
  const [accounts, setAccounts] = useState(mockAccountsDatabase);
  
  // Stati Modali
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, data: null });
  const [detailModal, setDetailModal] = useState({ isOpen: false, data: null });
  const [resolveModal, setResolveModal] = useState({ isOpen: false, data: null });

  // Paginazione
  const [providerPage, setProviderPage] = useState(1);
  const [complaintPage, setComplaintPage] = useState(1);
  const ITEMS_PER_PAGE = 3;

  // Logica Provider
  const paginatedProviders = mockPendingProviders.slice((providerPage - 1) * ITEMS_PER_PAGE, providerPage * ITEMS_PER_PAGE);
  const totalProviderPages = Math.ceil(mockPendingProviders.length / ITEMS_PER_PAGE);

  // Logica Reclami
  const paginatedComplaints = mockComplaints.slice((complaintPage - 1) * ITEMS_PER_PAGE, complaintPage * ITEMS_PER_PAGE);
  const totalComplaintPages = Math.ceil(mockComplaints.length / ITEMS_PER_PAGE);

  // Handlers
  const handleApprove = (id) => alert(`Provider #${id} Approvato!`);
  const handleReject = (id) => alert(`Provider #${id} Rifiutato.`);
  
  // Apertura modali
  const openResolveModal = (complaint) => setResolveModal({ isOpen: true, data: complaint });
  const openDetailModal = (complaint) => setDetailModal({ isOpen: true, data: complaint });

  // Esecuzione Risoluzione
  const handleFinalResolve = (id, status) => {
      const statusText = status === 'completed' ? 'COMPLETATA (Pagamento sbloccato)' : 'ANNULLATA (Rimborso avviato)';
      alert(`Prenotazione relativa al ticket #${id} impostata come: ${statusText}`);
      setResolveModal({ isOpen: false, data: null });
  };

  // Gestione Utenti (Blocco/Sblocco)
  const initiateToggleStatus = (account) => {
      setConfirmModal({
          isOpen: true,
          data: { id: account.id, name: account.name, currentStatus: account.status }
      });
  };

  const executeToggleStatus = () => {
      if (!confirmModal.data) return;
      const { id } = confirmModal.data;
      setAccounts(prev => prev.map(acc => {
          if (acc.id === id) {
              const newStatus = acc.status === 'active' ? 'blocked' : 'active';
              return { ...acc, status: newStatus };
          }
          return acc;
      }));
      setConfirmModal({ isOpen: false, data: null });
  };

  return (
    <div className="min-h-screen bg-gray-50/50 font-inter" title="Dashboard Amministratore">
      
      {/* MODALI GLOBALI */}
      <ConfirmModal 
        isOpen={confirmModal.isOpen} onClose={() => setConfirmModal({ isOpen: false, data: null })} 
        onConfirm={executeToggleStatus} actionData={confirmModal.data} 
      />
      <ComplaintDetailModal 
        isOpen={detailModal.isOpen} onClose={() => setDetailModal({ isOpen: false, data: null })} 
        complaint={detailModal.data}
      />
      <ComplaintResolveModal 
        isOpen={resolveModal.isOpen} onClose={() => setResolveModal({ isOpen: false, data: null })}
        onResolve={handleFinalResolve} complaint={resolveModal.data}
      />

      <div className="max-w-7xl mx-auto px-4 lg:px-8 pt-32 pb-12">
        {/* HEADER */}
        <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight mb-2">
              Admin <span className={`text-[${HOGU_COLORS.primary}]`}>Control Center</span>
            </h1>
            <p className="text-gray-500 text-lg">Panoramica dell'ecosistema Hogu.</p>
          </div>
          <div className="flex gap-3">
             <div className="bg-white px-4 py-2.5 rounded-xl shadow-sm border border-gray-100 flex items-center gap-2 text-sm font-bold text-gray-600">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                System Healthy
             </div>
          </div>
        </div>

        {/* KPI GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <StatCard title="Totale Utenti" value="1.245" icon={User} colorClass="text-purple-500" trend="+12%" />
          <StatCard title="Provider in Attesa" value={mockPendingProviders.length} icon={Briefcase} colorClass="text-orange-500" />
          <StatCard title="Reclami Aperti" value={mockComplaints.length} icon={ShieldAlert} colorClass="text-red-500" />
          <StatCard title="Revenue (Tot)" value="€ 45K" icon={DollarSign} colorClass={`text-[${HOGU_COLORS.primary}]`} trend="+8%" />
        </div>

        {/* MAIN CONTENT AREA */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* LEFT COLUMN: TABS & LISTS */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* TABS NAV */}
            <div className="flex flex-wrap gap-2 bg-white p-1.5 rounded-2xl border border-gray-100 shadow-sm w-full">
              <button onClick={() => setActiveTab('providers')} className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-bold transition-all flex justify-center items-center gap-2 ${activeTab === 'providers' ? 'bg-orange-500 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}>
                <Briefcase size={16} /><span className="hidden sm:inline">Provider</span>
                <span className={`ml-1 px-1.5 py-0.5 rounded text-[10px] ${activeTab === 'providers' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'}`}>{mockPendingProviders.length}</span>
              </button>
              <button onClick={() => setActiveTab('complaints')} className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-bold transition-all flex justify-center items-center gap-2 ${activeTab === 'complaints' ? 'bg-red-500 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}>
                <ShieldAlert size={16} /><span className="hidden sm:inline">Reclami</span>
                <span className={`ml-1 px-1.5 py-0.5 rounded text-[10px] ${activeTab === 'complaints' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'}`}>{mockComplaints.length}</span>
              </button>
              <button onClick={() => setActiveTab('accounts')} className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-bold transition-all flex justify-center items-center gap-2 ${activeTab === 'accounts' ? 'bg-blue-500 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}>
                <Users size={16} /><span className="hidden sm:inline">Gestione Utenti</span>
              </button>
            </div>

            {/* CONTENT LIST */}
            <div className="space-y-4 min-h-[400px]">
              
              {/* TAB 1: APPROVAZIONE PROVIDER (PAGINATA) */}
              {activeTab === 'providers' && (
                <>
                  <div className="flex justify-between items-center px-2">
                    <h3 className="font-bold text-gray-900">Richieste Pendenti</h3>
                  </div>
                  {paginatedProviders.map(provider => (
                    <ProviderRequestCard key={provider.id} provider={provider} onApprove={handleApprove} onReject={handleReject} />
                  ))}
                  <PaginationControls currentPage={providerPage} totalPages={totalProviderPages} onNext={() => setProviderPage(p => p + 1)} onPrev={() => setProviderPage(p => p - 1)} />
                </>
              )}

              {/* TAB 2: GESTIONE RECLAMI (PAGINATA + MODALI) */}
              {activeTab === 'complaints' && (
                <>
                  <div className="flex justify-between items-center px-2">
                    <h3 className="font-bold text-gray-900">Ticket Aperti</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {paginatedComplaints.map(complaint => (
                      <ComplaintCard 
                        key={complaint.id} 
                        complaint={complaint} 
                        onResolve={openResolveModal} 
                        onOpenDetail={openDetailModal}
                      />
                    ))}
                  </div>
                  <PaginationControls currentPage={complaintPage} totalPages={totalComplaintPages} onNext={() => setComplaintPage(p => p + 1)} onPrev={() => setComplaintPage(p => p - 1)} />
                </>
              )}

              {/* TAB 3: GESTIONE ACCOUNT */}
              {activeTab === 'accounts' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
                    <AccountManagementCard title="Area Clienti" type="CUSTOMER" accounts={accounts} onInitiateAction={initiateToggleStatus} />
                    <AccountManagementCard title="Area Partner" type="PROVIDER" accounts={accounts} onInitiateAction={initiateToggleStatus} />
                </div>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: QUICK ACTIONS */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">

              <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Cerca Globale</h3>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input type="text" placeholder="ID prenotazione, email..." className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-transparent rounded-xl text-gray-700 focus:bg-white focus:border-[#68B49B] outline-none transition-all" />
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
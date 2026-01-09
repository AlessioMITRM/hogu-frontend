import React, { useState } from 'react';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  CreditCard, 
  CheckCircle, 
  XCircle, 
  Search, 
  Filter, 
  ArrowRight, 
  CarFront, 
  Utensils, 
  Music, 
  X,
  FileText,
  Banknote,
  User,
  Building2,
  Download,
  AlertCircle,
  Mail,
  Map
} from 'lucide-react';
import { HOGU_COLORS, HOGU_THEME } from '../../../../config/theme.js';


// --- MOCK DATA (VISTA ADMIN) ---
const mockAdminBookings = [
  {
    id: 'BK-2025-001',
    serviceName: "Mercedes-Benz Classe E",
    providerName: "Luxury Van Milano",
    providerId: "PRV-882",
    userName: "Alessandro Verdi", // Display Name
    type: "NCC",
    date: "24 Nov 2025",
    time: "10:30",
    location: "Milano Malpensa → Centro",
    guests: 2,
    totalAmount: 150.00,
    platformFee: 15.00, 
    netAmount: 135.00,
    bookingStatus: "completed", 
    invoiceStatus: "to_pay", 
    image: "https://images.unsplash.com/photo-1514890547357-a9ee288728e0?auto=format&fit=crop&w=800&q=80",
    // Dati Fatturazione Fornitore
    providerInvoiceData: {
      piva: "IT12345678901",
      address: "Via Montenapoleone 12, Milano"
    },
    // Dati Fatturazione CLIENTE (Richiesti)
    userBilling: {
      nomeFatturazione: "Alessandro",
      cognomeFatturazione: "Verdi",
      ragioneSocialeFatturazione: "", // Privato
      indirizzoFatturazione: "Via dei Fiori 23, 20100 Milano (MI)",
      codiceFiscaleFatturazione: "VRDLSN80A01H501U",
      pivaFatturazione: "",
      emailFatturazione: "ale.verdi@gmail.com"
    }
  },
  {
    id: 'BK-2025-002',
    serviceName: "Cena Degustazione",
    providerName: "Hostaria Romana",
    providerId: "PRV-104",
    userName: "Giulia Bianchi",
    type: "Ristorante",
    date: "25 Nov 2025",
    time: "20:30",
    location: "Piazza Navona, Roma",
    guests: 4,
    totalAmount: 240.00,
    platformFee: 24.00,
    netAmount: 216.00,
    bookingStatus: "confirmed",
    invoiceStatus: "paid",
    image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80",
    providerInvoiceData: {
      piva: "IT98765432109",
      address: "Vicolo dei Soldati 2, Roma"
    },
    userBilling: {
      nomeFatturazione: "Giulia",
      cognomeFatturazione: "Bianchi",
      ragioneSocialeFatturazione: "Bianchi Design SRL", // Azienda
      indirizzoFatturazione: "Via del Corso 100, 00186 Roma (RM)",
      codiceFiscaleFatturazione: "BNCGLI85M41H501Z",
      pivaFatturazione: "IT11223344556",
      emailFatturazione: "amministrazione@bianchidesign.it"
    }
  },
  {
    id: 'BK-2025-003',
    serviceName: "VIP Table Entry",
    providerName: "Club 84",
    providerId: "PRV-331",
    userName: "Marco Rossi",
    type: "Club",
    date: "28 Nov 2025",
    time: "23:00",
    location: "Corso Como, Milano",
    guests: 6,
    totalAmount: 600.00,
    platformFee: 60.00,
    netAmount: 540.00,
    bookingStatus: "completed",
    invoiceStatus: "to_pay",
    image: "https://images.unsplash.com/photo-1566737236500-c8ac43014a67?auto=format&fit=crop&w=800&q=80",
    providerInvoiceData: {
      piva: "IT11223344556",
      address: "Corso Como 10, Milano"
    },
    userBilling: {
      nomeFatturazione: "Marco",
      cognomeFatturazione: "Rossi",
      ragioneSocialeFatturazione: "",
      indirizzoFatturazione: "Piazza Duomo 1, 20121 Milano",
      codiceFiscaleFatturazione: "RSSMRC90T10F205X",
      pivaFatturazione: "",
      emailFatturazione: "m.rossi@outlook.com"
    }
  }
];

// --- HELPERS ---
const getInvoiceStatusStyle = (status) => {
    switch(status) {
        case 'paid': return 'bg-green-100 text-green-700 border-green-200';
        case 'to_pay': return 'bg-red-100 text-red-700 border-red-200 animate-pulse';
        default: return 'bg-gray-100 text-gray-700';
    }
};

const getInvoiceStatusLabel = (status) => {
    switch(status) {
        case 'paid': return 'Pagata';
        case 'to_pay': return 'Da Saldare';
        default: return status;
    }
};

const getIconByType = (type) => {
    switch(type) {
        case 'NCC': return <CarFront size={18} />;
        case 'Ristorante': return <Utensils size={18} />;
        case 'Club': return <Music size={18} />;
        default: return <Calendar size={18} />;
    }
};

// --- COMPONENTI LOCALI ---

// 1. Card Prenotazione Admin
const AdminBookingCard = ({ booking, onClick }) => (
  <div 
    onClick={() => onClick(booking)}
    className="group bg-white p-5 rounded-[1.5rem] border border-gray-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.1)] hover:border-[#68B49B]/30 transition-all cursor-pointer flex flex-col lg:flex-row gap-6 items-center relative overflow-hidden"
  >
    {/* Indicatore laterale stato pagamento */}
    <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${booking.invoiceStatus === 'to_pay' ? 'bg-red-400' : 'bg-green-400'}`} />

    {/* Immagine / ID */}
    <div className="relative w-full lg:w-40 h-32 lg:h-28 flex-shrink-0 rounded-2xl overflow-hidden bg-gray-50">
        <img 
            src={booking.image} 
            alt={booking.serviceName}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 opacity-90"
        />
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
            <p className="text-[10px] text-white font-mono opacity-80">{booking.id}</p>
        </div>
    </div>

    {/* Info Principali */}
    <div className="flex-1 w-full space-y-3">
        <div className="flex flex-col md:flex-row justify-between items-start gap-2">
            <div>
                <h3 className="font-extrabold text-lg text-gray-900 flex items-center gap-2">
                    {getIconByType(booking.type)}
                    {booking.serviceName}
                </h3>
                <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                    <Building2 size={14} className="text-[#68B49B]" />
                    <span className="font-medium">{booking.providerName}</span>
                </div>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-bold border uppercase tracking-wide ${getInvoiceStatusStyle(booking.invoiceStatus)}`}>
                {getInvoiceStatusLabel(booking.invoiceStatus)}
            </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600 bg-gray-50 p-3 rounded-xl border border-gray-100">
            <div className="flex items-center gap-2">
                <User size={14} className="text-gray-400"/> 
                <span>Cliente: <span className="font-bold text-gray-800">{booking.userBilling.nomeFatturazione} {booking.userBilling.cognomeFatturazione}</span></span>
            </div>
            <div className="flex items-center gap-2">
                <Calendar size={14} className="text-gray-400"/> 
                <span>{booking.date} - {booking.time}</span>
            </div>
        </div>
    </div>

    {/* Sezione Finanziaria (Admin View) */}
    <div className="flex flex-row lg:flex-col items-center lg:items-end justify-between w-full lg:w-auto gap-4 lg:pl-6 lg:border-l border-gray-100">
        <div className="text-right">
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Importo Netto</p>
            <p className={`text-xl font-extrabold ${booking.invoiceStatus === 'to_pay' ? 'text-red-500' : 'text-green-600'}`}>
                €{booking.netAmount.toFixed(2)}
            </p>
            <p className="text-[10px] text-gray-400 mt-0.5">Totale: €{booking.totalAmount}</p>
        </div>
        <button className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${booking.invoiceStatus === 'to_pay' ? 'bg-red-50 text-red-500 hover:bg-red-500 hover:text-white' : 'bg-gray-50 text-gray-400 hover:bg-[#68B49B] hover:text-white'}`}>
            <ArrowRight size={20} />
        </button>
    </div>
  </div>
);

// Componente di riga per i dettagli fatturazione
const BillingRow = ({ label, value, isBold = false }) => {
    if (!value) return null; // Non mostrare righe vuote (es. se piva è vuota)
    return (
        <div className="flex justify-between items-start py-2 border-b border-gray-100 last:border-0 text-sm">
            <span className="text-gray-500 w-1/3 shrink-0">{label}</span>
            <span className={`text-gray-800 text-right break-words w-2/3 ${isBold ? 'font-bold' : 'font-medium'}`}>
                {value}
            </span>
        </div>
    );
};

// 2. Modale Dettaglio & Pagamento Fattura
const AdminDetailModal = ({ booking, onClose, onPayInvoice }) => {
    if (!booking) return null;

    const isPaid = booking.invoiceStatus === 'paid';
    const { userBilling } = booking;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/70 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-4xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 flex flex-col max-h-[95vh]">
                
                {/* Header Modale */}
                <div className="bg-gray-900 text-white p-6 flex justify-between items-start shrink-0">
                    <div>
                        <p className="text-gray-400 text-xs font-mono uppercase mb-1">Rif. Prenotazione: {booking.id}</p>
                        <h2 className="text-2xl font-bold flex items-center gap-2">
                            {isPaid ? <CheckCircle className="text-green-400" /> : <AlertCircle className="text-red-400" />}
                            {isPaid ? "Fattura Saldata" : "Fattura in Sospeso"}
                        </h2>
                    </div>
                    <button onClick={onClose} className="bg-white/10 hover:bg-white/20 p-2 rounded-full transition-all">
                        <X size={20} />
                    </button>
                </div>

                {/* Contenuto */}
                <div className="p-8 overflow-y-auto custom-scrollbar flex-1">
                    <div className="flex flex-col lg:flex-row gap-8">
                        
                        {/* Colonna SX: Dettagli Operativi e Fatturazione Cliente */}
                        <div className="flex-1 space-y-6">
                            
                            {/* --- DATI FATTURAZIONE CLIENTE --- */}
                            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                                <div className="bg-gray-50 px-5 py-3 border-b border-gray-100 flex items-center gap-2">
                                    <User size={16} className="text-[#68B49B]" />
                                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Dati Fatturazione Cliente</h4>
                                </div>
                                <div className="p-5">
                                    {/* Intestatario Principale */}
                                    <div className="flex items-center gap-4 mb-6">
                                        <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xl shrink-0">
                                            {userBilling.nomeFatturazione.charAt(0)}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-900 text-lg">
                                                {userBilling.nomeFatturazione} {userBilling.cognomeFatturazione}
                                            </h3>
                                            <p className="text-sm text-gray-500 flex items-center gap-1.5">
                                                <Mail size={12} /> {userBilling.emailFatturazione}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Dettagli Fiscali */}
                                    <div className="bg-gray-50/50 rounded-xl p-4 border border-gray-100">
                                        <BillingRow label="Ragione Sociale" value={userBilling.ragioneSocialeFatturazione} isBold />
                                        <BillingRow label="Codice Fiscale" value={userBilling.codiceFiscaleFatturazione} />
                                        <BillingRow label="Partita IVA" value={userBilling.pivaFatturazione} />
                                        <BillingRow label="Indirizzo" value={userBilling.indirizzoFatturazione} />
                                    </div>
                                </div>
                            </div>

                            {/* Card Fornitore */}
                            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                                <div className="bg-gray-50 px-5 py-3 border-b border-gray-100 flex items-center gap-2">
                                    <Building2 size={16} className="text-[#68B49B]" />
                                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Provider Servizio</h4>
                                </div>
                                <div className="p-5">
                                    <p className="font-bold text-gray-900 text-lg mb-1">{booking.providerName}</p>
                                    <div className="text-sm text-gray-600 space-y-1">
                                        <p className="flex items-center gap-2"><MapPin size={14} className="text-gray-400"/> {booking.providerInvoiceData.address}</p>
                                        <p className="flex items-center gap-2"><FileText size={14} className="text-gray-400"/> P.IVA: {booking.providerInvoiceData.piva}</p>
                                    </div>
                                </div>
                            </div>

                        </div>

                        {/* Colonna DX: Contabilità e Azioni */}
                        <div className="lg:w-[350px] shrink-0">
                            <div className="bg-white border-2 border-[#68B49B]/10 rounded-3xl p-6 flex flex-col shadow-lg shadow-[#68B49B]/5 sticky top-0">
                                <h4 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                                    <Banknote className="text-[#68B49B]" /> Riepilogo Costi
                                </h4>

                                <div className="space-y-3 mb-6 flex-1">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">Importo Lordo</span>
                                        <span className="font-medium">€ {booking.totalAmount.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm text-red-500 bg-red-50 p-2 rounded-lg">
                                        <span>Fee Piattaforma (10%)</span>
                                        <span>- € {booking.platformFee.toFixed(2)}</span>
                                    </div>
                                    <div className="border-t border-dashed border-gray-200 my-2"></div>
                                    <div className="flex justify-between items-end">
                                        <span className="font-bold text-gray-700">Netto da Versare</span>
                                        <span className="text-3xl font-extrabold text-[#68B49B]">€ {booking.netAmount.toFixed(2)}</span>
                                    </div>
                                </div>

                                {/* AZIONI PAGAMENTO */}
                                <div className="space-y-3">
                                    {!isPaid ? (
                                        <button 
                                            onClick={() => onPayInvoice(booking.id)}
                                            className="w-full py-4 bg-gray-900 hover:bg-black text-white rounded-xl font-bold shadow-xl shadow-gray-900/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                                        >
                                            <CreditCard size={18} />
                                            Paga Fattura Provider
                                        </button>
                                    ) : (
                                        <button 
                                            className="w-full py-4 bg-green-50 text-green-600 border border-green-100 rounded-xl font-bold cursor-default flex items-center justify-center gap-2"
                                        >
                                            <CheckCircle size={18} />
                                            Pagamento Completato
                                        </button>
                                    )}

                                    <button className="w-full py-3 border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2">
                                        <Download size={16} /> Scarica Ricevuta Cliente
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- MAIN COMPONENT ---
export const AdminBillings = () => {
  const [bookings, setBookings] = useState(mockAdminBookings);
  const [filter, setFilter] = useState('all'); // all, to_pay, paid
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Logica di filtro Admin
  const filteredBookings = bookings.filter(booking => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = 
        booking.id.toLowerCase().includes(searchLower) ||
        booking.providerName.toLowerCase().includes(searchLower) ||
        booking.userBilling.nomeFatturazione.toLowerCase().includes(searchLower) ||
        booking.userBilling.cognomeFatturazione.toLowerCase().includes(searchLower);
    
    if (filter === 'all') return matchesSearch;
    if (filter === 'to_pay') return matchesSearch && booking.invoiceStatus === 'to_pay';
    if (filter === 'paid') return matchesSearch && booking.invoiceStatus === 'paid';
    return matchesSearch;
  });

  // Azione: Paga Fattura
  const handlePayInvoice = (id) => {
    const updatedBookings = bookings.map(b => 
        b.id === id ? { ...b, invoiceStatus: 'paid' } : b
    );
    setBookings(updatedBookings);
    
    // Aggiorna anche la modale aperta
    const updatedSelected = updatedBookings.find(b => b.id === id);
    setSelectedBooking(updatedSelected);
    
    alert(`Pagamento di €${updatedSelected.netAmount} verso ${updatedSelected.providerName} elaborato con successo!`);
  };

  // Calcolo Totali per la Dashboard rapida
  const totalToPay = bookings.filter(b => b.invoiceStatus === 'to_pay').reduce((acc, curr) => acc + curr.netAmount, 0);

  return (
    <div className={`min-h-screen bg-[#F8FAFC] pb-20 font-inter`}>
        
        {/* Header Admin */}
        <div className="bg-white pt-24 pb-8 px-4 lg:px-8 border-b border-gray-100">
            <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-end gap-4">
                <div>
                    <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-2">
                        Gestione <span className="text-[#68B49B]">Fatture & Booking</span>
                    </h1>
                    <p className="text-gray-500">Area amministrativa per la riconciliazione dei pagamenti provider.</p>
                </div>
                
                {/* Widget Totale da Elaborare */}
                <div className="bg-red-50 border border-red-100 p-4 rounded-2xl flex items-center gap-4">
                    <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center text-red-500">
                        <AlertCircle size={20} />
                    </div>
                    <div>
                        {/* --- MODIFICA TESTO QUI --- */}
                        <p className="text-xs text-red-600 font-bold uppercase tracking-wider">Totale da Elaborare</p>
                        <p className="text-2xl font-extrabold text-red-700">€ {totalToPay.toFixed(2)}</p>
                    </div>
                </div>
            </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 lg:px-8 -mt-6 pt-12">
            
            {/* Toolbar */}
            <div className="bg-white p-2 rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.04)] mb-8 flex flex-col md:flex-row gap-4 items-center border border-gray-100">
                
                {/* Tabs Admin */}
                <div className="flex p-1 bg-gray-100 rounded-xl w-full md:w-auto">
                    {[
                        { id: 'all', label: 'Tutte' },
                        { id: 'to_pay', label: 'Da Pagare' },
                        { id: 'paid', label: 'Pagate' }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setFilter(tab.id)}
                            className={`flex-1 md:flex-none px-6 py-2 rounded-lg text-sm font-bold transition-all ${
                                filter === tab.id 
                                ? 'bg-white text-gray-900 shadow-sm' 
                                : 'text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Search Bar Potenziata */}
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                        type="text" 
                        placeholder="Cerca per ID, Provider, Nome o Cognome..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-transparent border-none focus:ring-0 text-sm font-medium text-gray-800 placeholder:text-gray-400 outline-none"
                    />
                </div>

                <div className="hidden md:flex items-center gap-2 px-4 text-xs font-bold text-gray-400 border-l border-gray-200">
                    <FileText size={14} />
                    {filteredBookings.length} Risultati
                </div>
            </div>

            {/* Lista Prenotazioni */}
            <div className="space-y-4">
                {filteredBookings.length > 0 ? (
                    filteredBookings.map(booking => (
                        <AdminBookingCard 
                            key={booking.id} 
                            booking={booking} 
                            onClick={setSelectedBooking}
                        />
                    ))
                ) : (
                    <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
                            <Search size={32} />
                        </div>
                        <h3 className="text-lg font-bold text-gray-700">Nessun risultato</h3>
                        <p className="text-gray-400 text-sm">Non ci sono prenotazioni che corrispondono ai criteri.</p>
                    </div>
                )}
            </div>

        </div>

        {/* Modale Dettaglio Admin */}
        {selectedBooking && (
            <AdminDetailModal 
                booking={selectedBooking} 
                onClose={() => setSelectedBooking(null)} 
                onPayInvoice={handlePayInvoice}
            />
        )}

    </div>
  );
};

export default AdminBillings;
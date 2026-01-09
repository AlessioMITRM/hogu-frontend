import React, { useState } from 'react';
import { 
    Save, MapPin, Clock, Calendar, Users, Music, Shirt, 
    Upload, Trash2, Plus, Info, Image as ImageIcon,
    Edit3, Eye, EyeOff, ChevronRight, AlertCircle, PartyPopper, X,
    // Aggiunte le icone necessarie per le info del servizio (le stesse del primo componente)
    CalendarCheck, CreditCard, FileText, ChevronDown 
} from 'lucide-react';

import { withAuthProtection } from './../../auth/withAuthProtection.jsx'; 

import { Breadcrumbs } from '../../../../components/ui/Breadcrumbs.jsx'; 

// --- CONFIGURAZIONE TEMA ---
const HOGU_COLORS = {
    primary: '#68B49B',
    dark: '#1A202C',
    lightAccent: '#E6F5F0',
    subtleText: '#4A5568',
};

const HOGU_THEME = {
    bg: 'bg-gray-50',
    inputBase: 'w-full px-4 py-3 rounded-xl bg-white border border-gray-200 focus:ring-2 focus:ring-[#68B49B]/20 focus:border-[#68B49B] outline-none transition-all placeholder:text-gray-400 text-gray-800',
    cardBase: 'bg-white rounded-[2rem] shadow-sm border border-gray-100',
    fontFamily: 'font-sans',
};

// --- BREADCRUMBS CONFIGURATION ---
const breadcrumbsItems = [
    { label: 'Dashboard', href: '#' },
    { label: 'I miei Eventi', href: '#' },
    { label: 'Modifica Club', href: '#' }
];

// --- COMPONENTE INFO ACCORDION ITEM (RIPRISTINATO DAL PRIMO COMPONENTE) ---
// Utilizza: CalendarCheck, CreditCard, FileText dal primo componente
const InfoAccordionItem = ({ icon: Icon, title, description, colorClass, defaultOpen = false }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <div className="border-b border-gray-100 last:border-0">
            <button 
                onClick={() => setIsOpen(!isOpen)} 
                className="w-full flex items-center justify-between py-3 hover:bg-gray-50 transition-colors rounded-lg px-2 -mx-2 group"
            >
                <div className="flex items-center gap-3">
                    <div className={`p-1.5 rounded-lg shrink-0 transition-colors ${colorClass}`}>
                        <Icon size={16} />
                    </div>
                    <span className="font-bold text-sm text-gray-900">{title}</span>
                </div>
                <ChevronRight 
                    size={16} 
                    className={`text-gray-400 transition-transform duration-300 ${isOpen ? 'rotate-90' : ''}`} 
                />
            </button>
            <div 
                className={`
                    overflow-hidden transition-all duration-300 ease-in-out
                    ${isOpen ? 'max-h-24 opacity-100 mb-3' : 'max-h-0 opacity-0'}
                `}
            >
                <p className="text-xs text-gray-500 leading-relaxed pl-[2.8rem] pr-2">
                    {description}
                </p>
            </div>
        </div>
    );
};


// --- COMPONENTI UI BASE ---

const EditableInput = ({ label, value, onChange, type = "text", placeholder, icon: Icon, className = "" }) => (
    <div className={className}>
        {label && <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 ml-1">{label}</label>}
        <div className="relative">
            {Icon && <Icon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />}
            <input 
                type={type} 
                value={value} 
                onChange={(e) => onChange(e.target.value)} 
                placeholder={placeholder}
                className={`${HOGU_THEME.inputBase} ${Icon ? 'pl-11' : ''}`}
            />
        </div>
    </div>
);

const EditableTextarea = ({ label, value, onChange, rows = 4 }) => (
    <div>
        {label && <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 ml-1">{label}</label>}
        <textarea 
            value={value} 
            onChange={(e) => onChange(e.target.value)} 
            rows={rows}
            className={`${HOGU_THEME.inputBase} resize-none`}
        />
    </div>
);

const ImageUploader = ({ images, setImages }) => {
    const removeImage = (index) => {
        setImages(images.filter((_, i) => i !== index));
    };

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {images.map((img, idx) => (
                <div key={idx} className="group relative aspect-square rounded-xl overflow-hidden bg-gray-100 border border-gray-200">
                    <img src={img} alt="Preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button onClick={() => removeImage(idx)} className="p-2 bg-white rounded-full text-red-500 hover:bg-red-50 transition-colors">
                            <Trash2 size={18} />
                        </button>
                    </div>
                    {idx === 0 && <span className="absolute bottom-2 left-2 bg-[#68B49B] text-white text-[10px] font-bold px-2 py-1 rounded">Copertina</span>}
                </div>
            ))}
            <button className="aspect-square rounded-xl border-2 border-dashed border-gray-300 hover:border-[#68B49B] hover:bg-[#F0FDF9] flex flex-col items-center justify-center gap-2 text-gray-400 hover:text-[#68B49B] transition-all">
                <Upload size={24} />
                <span className="text-xs font-bold">Aggiungi Foto</span>
            </button>
        </div>
    );
};

// --- COMPONENTI SPECIFICI: GESTIONE EVENTI (FIGLI) ---

const EventManagerCard = ({ event, onEdit, onDeleteRequest }) => {
    return (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white border border-gray-100 rounded-xl hover:shadow-md transition-all group gap-4">
            {/* Parte Sinistra: Data e Info */}
            <div className="flex items-center gap-4">
                <div className="flex flex-col items-center justify-center w-14 h-14 bg-gray-50 rounded-lg border border-gray-200 text-gray-700 shrink-0">
                    <span className="text-[10px] font-bold uppercase text-red-500">{event.month}</span>
                    <span className="text-xl font-bold">{event.day}</span>
                </div>
                <div>
                    <h4 className="font-bold text-gray-800 group-hover:text-[#68B49B] transition-colors line-clamp-1">{event.title}</h4>
                    <div className="flex items-center gap-3 text-xs text-gray-500 mt-1 flex-wrap">
                        <span className="flex items-center gap-1"><Clock size={12}/> {event.time}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${event.status === 'Published' ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'}`}>
                            {event.status === 'Published' ? 'Pubblicato' : 'Bozza'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Parte Destra: Statistiche e Azioni */}
            <div className="flex items-center justify-between sm:justify-end gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-50 w-full sm:w-auto">
                <div className="text-left sm:text-right mr-4">
                    <p className="text-xs text-gray-400">Vendite</p>
                    <p className="font-bold text-gray-800 text-sm">{event.sales} <span className="text-gray-400 font-normal">/ {event.capacity}</span></p>
                </div>
                
                <div className="flex gap-2">
                    <button onClick={() => onEdit(event.id)} className="p-2 text-gray-400 hover:text-[#68B49B] hover:bg-[#E6F5F0] rounded-lg transition-colors">
                        <Edit3 size={18} />
                    </button>
                    <button onClick={() => onDeleteRequest(event.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- PAGINA PRINCIPALE: CLUB PARENT EDIT ---

const ClubParentEditPageBase = ( {user} ) => {
    const [isLoading, setIsLoading] = useState(false);
    // STATO: Per gestire il modale di conferma
    const [showDeleteModal, setShowDeleteModal] = useState(null); 

    // STATO: Dati del Club
    const [clubData, setClubData] = useState({
        name: 'Hogu Club Roma',
        description: "Situato nel cuore pulsante di Roma, l'Hogu Club è il punto di riferimento per la nightlife capitolina.",
        city: 'Roma, Lazio',
        address: 'Via del Colosseo, 1',
        isActive: true, 
        musicGenres: 'House, Commerciale',
        dressCode: 'Smart Casual',
        crowdMix: 50,
        images: [
            'https://images.unsplash.com/photo-1566737236500-c8ac43014a67?auto=format&fit=crop&w=1200&q=80',
            'https://images.unsplash.com/photo-1574391884720-385e6e288793?auto=format&fit=crop&w=800&q=80'
        ]
    });

    // STATO: Eventi
    const [events, setEvents] = useState([
        { id: 101, title: "Grand Opening Season", day: "24", month: "OTT", time: "23:00", status: "Published", sales: 120, capacity: 500 },
        { id: 102, title: "Saturday Night Fever", day: "25", month: "OTT", time: "23:30", status: "Draft", sales: 0, capacity: 500 },
        { id: 103, title: "Halloween Party", day: "31", month: "OTT", time: "22:00", status: "Published", sales: 450, capacity: 600 },
    ]);

    const handleInputChange = (field, val) => {
        setClubData(prev => ({ ...prev, [field]: val }));
    };

    const handleSave = () => {
        setIsLoading(true);
        setTimeout(() => {
            setIsLoading(false);
            alert("Profilo Club aggiornato!");
        }, 1000);
    };

    // --- FUNZIONI PER ELIMINAZIONE SICURA ---
    const handleDeleteRequest = (eventId) => {
        setShowDeleteModal(eventId);
    };

    const confirmDelete = () => {
        if (showDeleteModal) {
            setEvents(events.filter(e => e.id !== showDeleteModal));
            setShowDeleteModal(null);
        }
    };

    const cancelDelete = () => {
        setShowDeleteModal(null);
    };

    return (
        <div className={`min-h-screen bg-[#F8FAFC] pb-20 ${HOGU_THEME.fontFamily}`}>
            
            {/* --- HERO SECTION --- */}
            <div className="bg-white pt-12 pb-24 px-4 lg:px-8 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-96 h-96 bg-black/5 rounded-full blur-3xl -translate-y-1/2 -translate-x-1/3"></div>
                <div className="absolute top-0 right-0 w-96 h-96 bg-black/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
                
                <div className="max-w-7xl mx-auto relative z-10">
                    <Breadcrumbs items={breadcrumbsItems} />
                    
                    <span className={`text-gray-900 mt-6 font-bold tracking-wider text-xs uppercase mb-3 block flex items-center gap-2`}>
                        <div className="w-8 h-[1px] bg-gray-900"></div> Servizio Club
                    </span>    

                    <h1 className={`text-3xl md:text-5xl font-extrabold text-[${HOGU_COLORS.dark}] mb-2 tracking-tight leading-tight`}>
                        Gestisci Club
                    </h1>
                    <p className={`text-lg text-[${HOGU_COLORS.subtleText}] max-w-xl leading-relaxed`}>
                        Configura il profilo del locale e gestisci i tuoi eventi.
                    </p>
                </div>
            </div>

            {/* --- MAIN CONTENT GRID --- */}
            <div className="max-w-7xl mx-auto px-4 lg:px-8 -mt-16 relative z-20">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    {/* --- COLONNA SINISTRA: CONFIGURAZIONE CLUB --- */}
                    <div className="lg:col-span-2 space-y-8">

                        {/* SEZIONE 1: IDENTITÀ & LOCATION */}
                        <section className={`${HOGU_THEME.cardBase} p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100/50`}>
                            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                                <Info size={20} className={`text-[${HOGU_COLORS.primary}]`} />
                                Informazioni Generali
                            </h2>
                            
                            <div className="space-y-6">
                                <EditableInput 
                                    label="Nome Locale" 
                                    value={clubData.name} 
                                    onChange={(v) => handleInputChange('name', v)} 
                                    placeholder="Inserisci il nome del locale"
                                />
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <EditableInput 
                                        label="Città" 
                                        icon={MapPin}
                                        value={clubData.city} 
                                        onChange={(v) => handleInputChange('city', v)} 
                                    />
                                    <EditableInput 
                                        label="Indirizzo Completo" 
                                        icon={MapPin}
                                        value={clubData.address} 
                                        onChange={(v) => handleInputChange('address', v)} 
                                    />
                                </div>

                                <EditableTextarea 
                                    label="Descrizione (Chi siamo)" 
                                    value={clubData.description} 
                                    onChange={(v) => handleInputChange('description', v)} 
                                />
                            </div>
                        </section>

                        {/* SEZIONE 3: MEDIA GALLERY */}
                        <section className={`${HOGU_THEME.cardBase} p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100/50`}>
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                    <ImageIcon size={20} className={`text-[${HOGU_COLORS.primary}]`} />
                                    Foto & Media
                                </h2>
                                <span className="text-xs text-gray-400">Trascina per riordinare</span>
                            </div>
                            <ImageUploader 
                                images={clubData.images} 
                                setImages={(imgs) => handleInputChange('images', imgs)} 
                            />
                        </section>

                        {/* SEZIONE 4: GESTIONE EVENTI (FIGLI) - MIGLIORATA PER MOBILE */}
                        <section className={`${HOGU_THEME.cardBase} p-8 border-[#68B49B]/30 shadow-lg shadow-[#68B49B]/5`}>
                            {/* HEADER FLESSIBILE: Colonna su mobile, Riga su desktop */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                        <Calendar size={20} className={`text-[${HOGU_COLORS.primary}]`} />
                                        I Tuoi Eventi
                                    </h2>
                                    <p className="text-sm text-gray-500 mt-1">Gestisci le serate collegate a questo club.</p>
                                </div>
                                
                                {/* BOTTONE MIGLIORATO PER MOBILE */}
                                <button 
                                    onClick={() => alert("Nuovo evento")}
                                    className={`
                                        w-full sm:w-auto px-6 py-3 sm:py-2.5 
                                        bg-gray-900 text-white rounded-xl font-bold text-sm 
                                        flex items-center justify-center gap-2 
                                        hover:bg-gray-800 transition-all shadow-md
                                    `}
                                >
                                    <Plus size={18} /> Nuovo Evento
                                </button>
                            </div>

                            <div className="space-y-3">
                                {events.map(event => (
                                    <EventManagerCard 
                                        key={event.id} 
                                        event={event} 
                                        onEdit={(id) => console.log(id)}
                                        onDeleteRequest={handleDeleteRequest}
                                    />
                                ))}
                            </div>
                        </section>

                    </div>

                    {/* --- COLONNA DESTRA: STATO & AZIONI STICKY --- */}
                    <div className="lg:col-span-1">
                        <div className="sticky top-24 space-y-6">
                            
                            {/* --- NUOVA SEZIONE INFORMAZIONI SERVIZIO (ACCORDION) --- */}
                            <div className={`${HOGU_THEME.cardBase} p-6 shadow-[0_8px_30px_rgb(0,0,0,0.08)]`}>
                                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <Info size={18} className={`text-[${HOGU_COLORS.primary}]`} />
                                    Info Servizio
                                </h3>
                                
                                <div className="space-y-1">
                                    <InfoAccordionItem 
                                        icon={CalendarCheck} // Icona ripristinata
                                        colorClass="bg-blue-50 text-blue-600"
                                        title="Prenotazioni" // Titolo ripristinato
                                        description="Tutte le prenotazioni per i tuoi eventi (ingressi e tavoli) sono gestite e tracciate qui. Ogni prenotazione è pre-pagata e garantita." // Descrizione modificata
                                    />
                                    <InfoAccordionItem 
                                        icon={CreditCard} // Icona ripristinata
                                        colorClass="bg-emerald-50 text-emerald-600"
                                        title="Pagamenti" // Titolo ripristinato
                                        description="Riceverai il pagamento per le vendite HOGU (al netto delle commissioni) entro 7 giorni dall'evento." // Descrizione modificata
                                    />
                                    <InfoAccordionItem 
                                        icon={FileText} // Icona ripristinata
                                        colorClass="bg-purple-50 text-purple-600"
                                        title="Commissioni" // Titolo ripristinato
                                        description="Una piccola commissione è applicata solo sulle vendite effettive generate dalla piattaforma HOGU. Non ci sono costi fissi." // Descrizione modificata
                                    />
                                </div>
                            </div>

                            {/* --- CARD STATUS E SALVATAGGIO --- */}
                            <div className={`${HOGU_THEME.cardBase} p-6 overflow-hidden relative shadow-[0_8px_30px_rgb(0,0,0,0.08)]`}>
                                <h3 className="text-lg font-bold text-gray-900 mb-4">Pubblicazione</h3>
                                
                                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100 mb-6">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg ${clubData.isActive ? 'bg-green-100 text-green-600' : 'bg-gray-200 text-gray-500'}`}>
                                            {clubData.isActive ? <Eye size={20} /> : <EyeOff size={20} />}
                                        </div>
                                        <div>
                                            <p className="font-bold text-sm text-gray-900">Visibilità</p>
                                            <p className="text-xs text-gray-500">{clubData.isActive ? 'Online' : 'Nascosto'}</p>
                                        </div>
                                    </div>
                                    <div className="relative inline-block w-12 align-middle select-none">
                                        <input 
                                            type="checkbox" 
                                            checked={clubData.isActive}
                                            onChange={(e) => handleInputChange('isActive', e.target.checked)}
                                            className="absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer checked:right-0 right-6 transition-all duration-300 top-0"
                                        />
                                        <div className={`block overflow-hidden h-6 rounded-full cursor-pointer transition-colors duration-200 ${clubData.isActive ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                                    </div>
                                </div>

                                <button 
                                    onClick={handleSave}
                                    disabled={isLoading}
                                    className={`w-full py-3 rounded-xl font-bold text-white shadow-xl shadow-slate-500/20 flex items-center justify-center gap-2 transition-all
                                        ${isLoading ? 'bg-gray-400 cursor-not-allowed' : `bg-slate-800 hover:bg-slate-700 hover:scale-[1.02]`}
                                    `}
                                >
                                    {isLoading ? 'Salvataggio...' : <><Save size={20} /> Salva Modifiche</>}
                                </button>
                            </div>

                             <div className="bg-slate-50 rounded-[2rem] p-6 border border-slate-200">
                                <h4 className="font-bold text-slate-800 mb-2 flex items-center gap-2"><MapPin size={18} /> Tip Locale</h4>
                                <p className="text-sm text-slate-600 leading-relaxed">
                                    Assicurati che la tua descrizione e l'indirizzo siano aggiornati. Le informazioni accurate migliorano il tasso di conversione delle prenotazioni.
                                </p>
                            </div>
                        </div>
                    </div>

                </div>
            </div>

            {/* --- MODALE DI CONFERMA ELIMINAZIONE --- */}
            {showDeleteModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-[2rem] p-6 max-w-sm w-full shadow-2xl scale-100 animate-in zoom-in-95 duration-200">
                        <div className="flex flex-col items-center text-center">
                            <div className="bg-red-50 p-4 rounded-full text-red-500 mb-4">
                                <AlertCircle size={40} />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Eliminare l'evento?</h3>
                            <p className="text-gray-500 mb-6 text-sm">
                                L'operazione è irreversibile. L'evento verrà rimosso definitivamente dalla lista.
                            </p>
                            <div className="flex w-full gap-3">
                                <button 
                                    onClick={cancelDelete}
                                    className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors"
                                >
                                    Annulla
                                </button>
                                <button 
                                    onClick={confirmDelete}
                                    className="flex-1 py-3 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 shadow-lg shadow-red-500/20 transition-all"
                                >
                                    Elimina
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export const ClubParentEditPage = withAuthProtection(ClubParentEditPageBase, ['PROVIDER']);

export default ClubParentEditPage;
import React, { useState, useEffect } from 'react';
import {
  User, Briefcase, DollarSign, CheckCircle, XCircle,
  Search, ChevronRight,
  Users, Lock, Unlock, Ban,
  ChevronLeft, AlertTriangle, Calendar, Ticket, Settings2,
  Eye, MapPin, Clock, CreditCard, Navigation, Tag
} from 'lucide-react';
import { HOGU_COLORS, HOGU_THEME } from '../../../../config/theme.js';
import { adminService } from '../../../../api/apiClient.js';
import SafeImage from '../../../ui/SafeImage.jsx';



const STATUS_MAP = {
  'PENDING': 'IN ATTESA',
  'ACTIVE': 'ATTIVO',
  'SUSPENDED': 'SOSPESO',
  'DEACTIVATED': 'DISATTIVATO',
  'PENDING_ADMIN_APPROVAL': 'IN ATTESA APPROVAZIONE ADMIN',
  'BANNED': 'BANNATO'
};

const COUNTRY_MAP = {
  'IT': 'Italia',
  'EN': 'Regno Unito',
  'FR': 'Francia',
  'DE': 'Germania',
  'ES': 'Spagna',
  'US': 'Stati Uniti',
  'it': 'Italia',
  'en': 'Regno Unito'
};

import SuccessModal from '../../../ui/SuccessModal.jsx';
import ErrorModal from '../../../ui/ErrorModal.jsx';
import LoadingScreen from '../../../ui/LoadingScreen.jsx';

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

const StatusBadge = ({ status }) => {
  const styles = {
    FULL_PAYMENT_COMPLETED: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-100', label: 'Pagamento Completato' },
    COMPLETED: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-100', label: 'Completato' },
    COMPLETED_BY_ADMIN: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-100', label: 'Completata da Admin' },
    PENDING: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-100', label: 'In Attesa' },
    PAYMENT_AUTHORIZED: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-100', label: 'Pagamento Autorizzato' },
    WAITING_PROVIDER_CONFIRMATION: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-100', label: 'In Attesa Partner' },
    WAITING_CUSTOMER_PAYMENT: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-100', label: 'In Attesa Cliente' },
    CANCELLED_BY_PROVIDER: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-100', label: 'Annullata Partner' },
    CANCELLED_BY_ADMIN: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-100', label: 'Annullata Admin' },
    CANCELLED_BY_CUSTOMER: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-100', label: 'Annullata Cliente' },
    MODIFIED_BY_PROVIDER: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-100', label: 'Modificata Partner' },
    REFUNDED_BY_ADMIN: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-100', label: 'Rimborsato Admin' },
    CONFIRMED: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-100', label: 'Confermata' },
    COMMISSION_PAID: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-100', label: 'Commissione Pagata' },
  };
  const normalizedStatus = status ? status.toUpperCase() : 'UNKNOWN';
  const style = styles[normalizedStatus] || { bg: 'bg-gray-100', text: 'text-gray-600', border: 'border-gray-200', label: normalizedStatus.replace(/_/g, ' ') };
  return (
    <span className={`px-2.5 py-1 rounded-full text-[10px] uppercase tracking-wider font-bold border ${style.bg} ${style.text} ${style.border} whitespace-nowrap`}>
      {style.label}
    </span>
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

const ProviderRequestCard = ({ verification, onApprove, onReject, onViewDocuments }) => {
  const date = new Date(verification.requestDate).toLocaleDateString('it-IT', {
    day: 'numeric', month: 'short', year: 'numeric'
  });

  return (
    <div className="bg-white p-5 rounded-[1.5rem] border border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4 hover:border-orange-200 transition-all shadow-sm">
      <div className="flex items-center gap-4 w-full sm:w-auto">
        <div className="w-12 h-12 rounded-full bg-orange-50 flex items-center justify-center text-orange-500 font-bold text-xl shrink-0">
          {verification.providerName ? verification.providerName.charAt(0) : '?'}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h4 className="font-bold text-gray-900">{verification.providerName}</h4>
            <button
              onClick={() => onViewDocuments(verification)}
              className="p-1.5 text-gray-600 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-all flex items-center gap-2"
              title="Visualizza Documenti Migliorata"
            >
              <Eye size={18} />
              <span className="text-[10px] uppercase font-black tracking-widest text-orange-700">Dettagli Doc</span>
            </button>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span className="bg-gray-100 px-2 py-0.5 rounded text-xs font-bold uppercase">{verification.serviceType}</span>
            <span>• {verification.email}</span>
          </div>
          <div className="text-xs text-gray-400 mt-1">Richiesta del: {date}</div>
        </div>
      </div>
      <div className="flex gap-2 w-full sm:w-auto">
        <button onClick={() => onReject(verification.verificationId)} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-red-600 border border-red-100 hover:bg-red-50 transition-colors"><XCircle size={18} /> Rifiuta</button>
        <button onClick={() => onApprove(verification.verificationId)} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white bg-green-500 hover:bg-green-600 shadow-lg shadow-green-500/20 transition-colors"><CheckCircle size={18} /> Approva</button>
      </div>
    </div>
  );
};

const DocumentSelectorModal = ({ isOpen, onClose, verification, loading }) => {
  const [previewDoc, setPreviewDoc] = useState(null);
  const [loadingPreview, setLoadingPreview] = useState(false);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen || !verification) return null;

  const handlePreviewAction = async (doc) => {
    try {
      setLoadingPreview(true);
      const data = await adminService.getVerificationDocument(doc.id);

      if (doc.filename?.toLowerCase().endsWith('.pdf')) {
        // Open PDF in new tab
        const byteCharacters = atob(data.fileData);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        window.open(url, '_blank');
        setPreviewDoc({ ...doc, isPdf: true });
      } else {
        // Just preview in modal if it's an image
        setPreviewDoc({ ...doc, fileData: data.fileData, isPdf: false });
      }
    } catch (error) {
      console.error("Preview failed:", error);
    } finally {
      setLoadingPreview(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[10001] bg-gray-900 flex">
      {/* Sidebar List */}
      <div className="w-80 h-full bg-white border-r border-gray-100 flex flex-col shadow-2xl">
        <div className="p-8 border-b border-gray-50 flex-shrink-0">
          <button
            onClick={onClose}
            className="flex items-center gap-2 text-gray-400 hover:text-gray-900 transition-colors mb-6 group"
          >
            <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
            <span className="text-xs font-black uppercase tracking-widest">Torna alla Dashboard</span>
          </button>
          <h3 className="text-2xl font-black text-gray-900 leading-tight">Dettagli Partner</h3>
          <p className="text-xs font-bold text-gray-400 mt-1 uppercase tracking-widest">{verification.providerName}</p>

          {verification.description && (
            <div className="mt-6 p-4 bg-gray-50 rounded-2xl border border-gray-100 max-h-32 overflow-y-auto">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                <Briefcase size={12} className="text-gray-300" />
                Info Attività
              </p>
              <p className="text-xs text-gray-600 leading-relaxed italic">"{verification.description}"</p>
              {verification.iban && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                    <CreditCard size={12} className="text-gray-300" />
                    IBAN
                  </p>
                  <p className="text-[11px] font-mono font-bold text-gray-700 break-all bg-white p-1.5 rounded-lg border border-gray-100">{verification.iban}</p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Caricamento...</p>
            </div>
          ) : verification.documents?.length > 0 ? (
            verification.documents.map((doc) => (
              <button
                key={doc.id}
                onClick={() => handlePreviewAction(doc)}
                className={`w-full text-left p-5 rounded-2xl border-2 transition-all group ${previewDoc?.id === doc.id ? 'border-orange-500 bg-orange-50/50' : 'border-transparent bg-gray-50 hover:bg-gray-100'}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 overflow-hidden">
                    <p className={`text-sm font-black truncate ${previewDoc?.id === doc.id ? 'text-orange-600' : 'text-gray-900'}`}>{doc.filename}</p>
                    <p className="text-[10px] font-bold text-gray-400 uppercase mt-1">
                      {doc.filename?.toLowerCase().endsWith('.pdf') ? '📝 Documento PDF' : '🖼️ Immagine'}
                    </p>
                  </div>
                  <Eye size={16} className={`shrink-0 ${previewDoc?.id === doc.id ? 'text-orange-500' : 'text-gray-300 group-hover:text-gray-500'}`} />
                </div>
              </button>
            ))
          ) : (
            <div className="text-center py-8 px-4 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
              <AlertTriangle className="mx-auto text-gray-300 mb-2" size={24} />
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Nessun Documento</p>
            </div>
          )}
        </div>
      </div>

      {/* Main Preview Area */}
      <div className="flex-1 h-full bg-gray-50 flex flex-col relative overflow-hidden">
        {/* Header Preview */}
        <div className="absolute top-0 left-0 right-0 p-8 flex justify-between items-center z-10 pointer-events-none">
          <div className="bg-white/80 backdrop-blur-md px-6 py-3 rounded-2xl shadow-sm border border-black/5 flex items-center gap-4">
            <div className="w-2 h-2 rounded-full bg-orange-500"></div>
            <span className="text-xs font-black uppercase tracking-widest text-gray-900">
              {previewDoc ? (previewDoc.isPdf ? 'Apertura in corso...' : 'Anteprima Attiva') : 'Seleziona Doc'}
            </span>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center p-12">
          {loadingPreview ? (
            <div className="flex flex-col items-center gap-6">
              <div className="w-16 h-16 border-[6px] border-orange-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-sm font-black text-gray-900 uppercase tracking-widest">Elaborazione file...</p>
            </div>
          ) : previewDoc ? (
            <div className="w-full h-full flex flex-col items-center justify-center">
              {previewDoc.isPdf ? (
                <div className="max-w-md text-center bg-white p-12 rounded-[3rem] shadow-2xl border border-gray-100 animate-in zoom-in-95 duration-500">
                  <div className="p-6 rounded-full bg-red-50 text-red-500 inline-block mb-6">
                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" /></svg>
                  </div>
                  <h4 className="text-2xl font-black text-gray-900 mb-4">PDF Aperto in nuova scheda</h4>
                  <p className="text-gray-500 text-sm leading-relaxed mb-8">
                    Il file <strong>{previewDoc.filename}</strong> è stato aperto in una nuova pagina del browser per una visualizzazione ottimale.
                  </p>
                  <button
                    onClick={() => handlePreviewAction(previewDoc)}
                    className="px-8 py-4 bg-gray-900 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-black transition-all shadow-xl shadow-black/10"
                  >
                    Riapri PDF
                  </button>
                </div>
              ) : previewDoc.fileData ? (
                <div className="w-full h-full p-4 animate-in fade-in zoom-in-95 duration-700">
                  <SafeImage
                    src={`data:image/jpeg;base64,${previewDoc.fileData}`}
                    alt={previewDoc.filename}
                    className="w-full h-full object-contain rounded-3xl shadow-[0_32px_64px_-16px_rgba(0,0,0,0.15)] ring-1 ring-black/[0.05]"
                  />
                </div>
              ) : (
                <div className="text-center animate-in fade-in duration-500">
                  <AlertTriangle className="mx-auto text-orange-200 mb-6" size={80} />
                  <p className="text-xl font-bold text-gray-400 uppercase tracking-widest">Impossibile visualizzare l'anteprima</p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center max-w-sm">
              <div className="w-32 h-32 bg-white rounded-full flex items-center justify-center mx-auto mb-8 shadow-sm border border-gray-100">
                <Eye className="text-gray-200" size={64} />
              </div>
              <h4 className="text-xl font-black text-gray-900 mb-2">Selettore Documenti</h4>
              <p className="text-gray-400 text-sm font-medium leading-relaxed">
                Seleziona un file dalla lista a sinistra per visualizzarne l'anteprima istantanea o aprire il PDF.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};



// --- MODALI ---

const RejectModal = ({ isOpen, onClose, onConfirm }) => {
  const [motivation, setMotivation] = useState("");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-[2rem] w-full max-w-sm p-6 shadow-2xl flex flex-col items-center text-center">
        <div className="p-4 rounded-full mb-4 bg-red-50 text-red-500">
          <AlertTriangle size={32} />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">Elimina Provider (Hard Delete)</h3>
        <p className="text-gray-500 text-sm mb-4">Sei sicuro? Questa azione eliminerà permanentemente l'utente e tutti i suoi documenti/servizi dal database. Inserisci una motivazione (opzionale) per il log.</p>

        <textarea
          className="w-full p-3 border border-gray-200 rounded-xl mb-4 focus:border-red-500 outline-none text-sm"
          rows="3"
          placeholder="Motivazione dell'eliminazione..."
          value={motivation}
          onChange={(e) => setMotivation(e.target.value)}
        ></textarea>

        <div className="flex gap-3 w-full">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl font-bold text-gray-500 bg-gray-100 hover:bg-gray-200">Annulla</button>
          <button
            onClick={() => onConfirm(motivation)}
            disabled={!motivation.trim()}
            className="flex-1 py-3 rounded-xl font-bold text-white shadow-lg bg-red-500 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Rifiuta
          </button>
        </div>
      </div>
    </div>
  );
};

const ConfirmModal = ({ isOpen, onClose, onConfirm, actionData }) => {
  // ... (unchanged)
};

const FullscreenImageViewer = ({ isOpen, images, currentIndex, onClose, onPrev, onNext }) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft') onPrev();
      if (e.key === 'ArrowRight') onNext();
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onPrev, onNext, onClose]);

  if (!isOpen || !images || images.length === 0) return null;
  const currentImage = images[currentIndex];

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center p-4 animate-in fade-in duration-300"
      onClick={onClose}
    >
      <button
        className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 rounded-xl text-white transition-all shadow-2xl backdrop-blur-md z-[110]"
        onClick={onClose}
      >
        <XCircle size={32} />
      </button>

      {/* Navigazione */}
      {images.length > 1 && (
        <>
          <button
            className="absolute left-4 md:left-8 p-4 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all shadow-2xl backdrop-blur-md z-[110]"
            onClick={(e) => { e.stopPropagation(); onPrev(); }}
          >
            <ChevronLeft size={32} />
          </button>
          <button
            className="absolute right-4 md:right-8 p-4 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all shadow-2xl backdrop-blur-md z-[110]"
            onClick={(e) => { e.stopPropagation(); onNext(); }}
          >
            <ChevronRight size={32} />
          </button>
        </>
      )}

      <div className="relative group max-w-full max-h-[85vh] px-12" onClick={(e) => e.stopPropagation()}>
        <SafeImage
          src={currentImage}
          alt={`View ${currentIndex}`}
          className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl ring-1 ring-white/10 transition-all duration-500"
        />

        {/* Counter */}
        <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-white/10 backdrop-blur-md rounded-full border border-white/5 text-white/80 text-xs font-bold tracking-widest uppercase">
          {currentIndex + 1} / {images.length}
        </div>
      </div>
    </div>
  );
};

const BookingDetailModal = ({ isOpen, onClose, booking, isLoading, onImageClick }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10001] bg-gray-50 flex flex-col overflow-hidden">

      {/* ── HEADER STICKY ── */}
      <div className="flex-shrink-0 bg-white border-b border-gray-100 px-8 py-5 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-5">
          <button
            onClick={onClose}
            className="flex items-center gap-2 text-gray-400 hover:text-gray-900 transition-colors group"
          >
            <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
            <span className="text-xs font-black uppercase tracking-widest">Torna alla Dashboard</span>
          </button>
          <div className="w-px h-5 bg-gray-200" />
          <div>
            <h2 className="text-sm font-black text-gray-900 uppercase tracking-widest">Dettagli Prenotazione</h2>
            {booking && <p className="text-[10px] text-gray-400 font-bold mt-0.5">{booking.bookingCode}</p>}
          </div>
        </div>
        {booking && <StatusBadge status={booking.status} />}
      </div>

      {/* ── CONTENUTO SCROLLABILE ── */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-full gap-6">
            <div className="w-16 h-16 border-[6px] border-orange-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-black text-gray-400 uppercase tracking-widest">Caricamento dettagli...</p>
          </div>
        ) : !booking ? (
          <div className="flex flex-col items-center justify-center h-full">
            <AlertTriangle className="text-gray-300 mb-6" size={80} />
            <p className="text-xl font-bold text-gray-400 uppercase tracking-widest">Nessun dato disponibile</p>
          </div>
        ) : (
          <div className="max-w-7xl mx-auto px-8 py-8 space-y-6">

            {/* ── HERO IMAGE ── */}
            {booking.serviceImage ? (
              <div
                className="w-full h-72 rounded-[2rem] overflow-hidden relative shadow-lg group cursor-zoom-in"
                onClick={() => onImageClick(0)}
              >
                <SafeImage
                  src={booking.serviceImage}
                  alt={booking.serviceName || 'Servizio'}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/20 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute bottom-8 left-8">
                  <span className="text-[10px] bg-white/20 backdrop-blur-md text-white px-3 py-1.5 rounded-xl font-bold uppercase tracking-widest mb-3 inline-block border border-white/10">
                    {booking.serviceType}
                  </span>
                  <h3 className="text-white text-4xl font-black drop-shadow-lg">{booking.serviceName || 'Servizio'}</h3>
                </div>
                <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="p-3 bg-black/40 backdrop-blur-md rounded-2xl border border-white/10 text-white flex items-center gap-2">
                    <Eye size={18} />
                    <span className="text-xs font-bold">Espandi</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="w-full h-24 rounded-[2rem] bg-white border border-gray-100 shadow-sm flex items-center gap-6 px-8">
                <div className="p-3 bg-orange-50 rounded-2xl">
                  <Briefcase size={24} className="text-orange-500" />
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{booking.serviceType}</span>
                  <h3 className="text-gray-900 text-xl font-black">{booking.serviceName || 'Dettagli Servizio'}</h3>
                </div>
              </div>
            )}

            {/* ── GRIGLIA DATI PRINCIPALE ── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

              {/* Cliente */}
              <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm col-span-2 md:col-span-1">
                <div className="flex items-center gap-2 text-gray-400 mb-3">
                  <User size={14} />
                  <p className="text-[10px] font-black uppercase tracking-widest">Cliente</p>
                </div>
                <p className="text-sm font-black text-gray-900 leading-tight">{booking.customerName || 'N/D'}</p>
                <p className="text-xs text-gray-400 mt-1">{booking.customerEmail || '—'}</p>
                {booking.customerPhone && <p className="text-xs text-gray-400 mt-0.5">{booking.customerPhone}</p>}
              </div>

              {/* Provider */}
              <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                <div className="flex items-center gap-2 text-gray-400 mb-3">
                  <Briefcase size={14} />
                  <p className="text-[10px] font-black uppercase tracking-widest">Provider</p>
                </div>
                <p className="text-sm font-black text-gray-900 leading-tight">{booking.providerName || 'N/D'}</p>
              </div>

              {/* Data */}
              {booking.serviceDate && (
                <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                  <div className="flex items-center gap-2 text-gray-400 mb-3">
                    <Calendar size={14} />
                    <p className="text-[10px] font-black uppercase tracking-widest">
                      {booking.serviceType === 'NCC' ? 'Partenza' : booking.serviceType === 'BNB' ? 'Check-In' : booking.serviceType === 'LUGGAGE' ? 'Deposito' : 'Data'}
                    </p>
                  </div>
                  <p className="text-sm font-black text-gray-900">{booking.serviceDate}</p>
                  {booking.pickupTime && <p className="text-xs text-gray-400 mt-1">ore {booking.pickupTime}</p>}
                </div>
              )}

              {/* Ospiti / Passeggeri */}
              {booking.guests !== undefined && booking.guests !== null && (
                <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                  <div className="flex items-center gap-2 text-gray-400 mb-3">
                    <Users size={14} />
                    <p className="text-[10px] font-black uppercase tracking-widest">
                      {booking.serviceType === 'NCC' ? 'Passeggeri' : booking.serviceType === 'BNB' ? 'Ospiti' : booking.serviceType === 'LUGGAGE' ? 'Bagagli' : 'Persone'}
                    </p>
                  </div>
                  <p className="text-2xl font-black text-gray-900">{booking.guests}</p>
                </div>
              )}
            </div>

            {/* ── LUOGHI ── */}
            {(booking.pickupLocation || booking.destination || booking.address) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {booking.pickupLocation && (
                  <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm flex items-start gap-4">
                    <div className="p-2.5 bg-orange-50 rounded-xl flex-shrink-0">
                      <MapPin size={16} className="text-orange-500" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Punto Ritiro</p>
                      <p className="text-sm font-black text-gray-900">{booking.pickupLocation}</p>
                    </div>
                  </div>
                )}
                {booking.destination && (
                  <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm flex items-start gap-4">
                    <div className="p-2.5 bg-blue-50 rounded-xl flex-shrink-0">
                      <Navigation size={16} className="text-blue-500" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Destinazione</p>
                      <p className="text-sm font-black text-gray-900">{booking.destination}</p>
                    </div>
                  </div>
                )}
                {!booking.pickupLocation && booking.address && (
                  <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm flex items-start gap-4 md:col-span-2">
                    <div className="p-2.5 bg-gray-50 rounded-xl flex-shrink-0">
                      <MapPin size={16} className="text-gray-400" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Indirizzo Servizio</p>
                      <p className="text-sm font-black text-gray-900">{booking.address}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── GALLERIA AGGIUNTIVA ── */}
            {booking.additionalImages && booking.additionalImages.length > 1 && (
              <div className="space-y-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Altre Foto</p>
                <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                  {booking.additionalImages.map((img, idx) => (
                    <div
                      key={idx}
                      className="flex-shrink-0 w-48 h-32 rounded-2xl overflow-hidden border border-gray-100 cursor-zoom-in hover:scale-105 transition-transform group relative shadow-sm"
                      onClick={() => onImageClick(idx)}
                    >
                      <SafeImage
                        src={img}
                        alt={`Gallery ${idx}`}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                        <Eye size={20} className="text-white opacity-0 group-hover:opacity-100" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── NOTE ── */}
            {(booking.specialRequests || booking.providerNote || booking.statusReason) && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {booking.specialRequests && (
                  <div className="p-5 rounded-2xl bg-orange-50 border border-orange-100">
                    <p className="text-[10px] font-black text-orange-400 uppercase tracking-widest mb-2">Richieste Speciali</p>
                    <p className="text-sm text-gray-700 italic">"{booking.specialRequests}"</p>
                  </div>
                )}
                {booking.providerNote && (
                  <div className="p-5 rounded-2xl bg-blue-50 border border-blue-100">
                    <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-2">Note del Provider</p>
                    <p className="text-sm text-gray-700 italic">"{booking.providerNote}"</p>
                  </div>
                )}
                {booking.statusReason && (
                  <div className="p-5 rounded-2xl bg-red-50 border border-red-100">
                    <p className="text-[10px] font-black text-red-400 uppercase tracking-widest mb-2">Motivazione Admin</p>
                    <p className="text-sm text-gray-700 italic">"{booking.statusReason}"</p>
                  </div>
                )}
              </div>
            )}

            {/* ── RIEPILOGO PAGAMENTO ── */}
            <div className="w-full bg-gray-900 rounded-[1.5rem] p-6 flex items-center justify-between shadow-xl">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/10 rounded-xl">
                  <CreditCard size={20} className="text-white/70" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Totale Pagato</p>
                  <p className="text-3xl font-black text-white">€ {booking.totalAmount?.toFixed(2) || '0.00'}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Data Creazione</p>
                <p className="text-sm font-bold text-gray-300">{new Date(booking.creationDate).toLocaleString('it-IT')}</p>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
};

const ChangeBookingStatusModal = ({ isOpen, onClose, onConfirm, booking }) => {
  const [status, setStatus] = useState("");
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (isOpen) {
      setStatus("");
      setReason("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const statusOptions = [
    { value: "REFUNDED_BY_ADMIN", label: "Rimborsato da Admin" },
    { value: "CANCELLED_BY_ADMIN", label: "Annullato da Admin" },
    { value: "COMPLETED_BY_ADMIN", label: "Completata da Admin" }
  ];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-[2rem] w-full max-w-md p-8 shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-black text-gray-900">Gestisci Stato</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><XCircle size={24} className="text-gray-400" /></button>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-3">Seleziona Nuovo Stato</label>
            <div className="grid grid-cols-1 gap-2">
              {statusOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setStatus(opt.value)}
                  className={`p-4 rounded-2xl border-2 text-left transition-all flex items-center justify-between ${status === opt.value ? 'border-indigo-500 bg-indigo-50/50' : 'border-gray-100 hover:border-gray-200 bg-white'}`}
                >
                  <span className={`font-bold ${status === opt.value ? 'text-indigo-600' : 'text-gray-700'}`}>{opt.label}</span>
                  {status === opt.value && <CheckCircle size={20} className="text-indigo-500" />}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-3">Motivazione Cambio Stato</label>
            <textarea
              className="w-full p-4 border-2 border-gray-100 rounded-2xl focus:border-indigo-500 outline-none text-sm font-medium min-h-[100px] transition-all"
              placeholder="Inserisci qui il motivo del cambio stato..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>

          <button
            onClick={() => onConfirm(status, reason)}
            disabled={!status || !reason.trim()}
            className="w-full py-4 rounded-2xl font-black text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-indigo-500/20 transition-all flex items-center justify-center gap-2"
          >
            Conferma Aggiornamento
          </button>
        </div>
      </div>
    </div>
  );
};





const ManageUserModal = ({ isOpen, onClose, onConfirm, user }) => {
  const [status, setStatus] = useState("");

  useEffect(() => {
    if (isOpen && user) {
      setStatus(user.status);
    }
  }, [isOpen, user]);

  if (!isOpen || !user) return null;

  const statusOptions = [
    { value: "ACTIVE", label: "Attiva Account", icon: CheckCircle, color: "text-green-500", bg: "bg-green-50", border: "border-green-100", description: "L'utente può accedere e utilizzare tutte le funzioni (Documenti approvati)." },
    { value: "SUSPENDED", label: "Sospendi / Disattiva", icon: XCircle, color: "text-gray-500", bg: "bg-gray-50", border: "border-gray-100", description: "L'utente non potrà accedere finché non viene riattivato (Documenti rifiutati)." },
    { value: "BANNED", label: "Banna Account", icon: Ban, color: "text-red-500", bg: "bg-red-50", border: "border-red-100", description: "Accesso negato permanentemente. Utente segnalato come bannato (Documenti rifiutati)." }
  ];

  return (
    <div className="fixed inset-0 z-[10002] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-[2.5rem] w-full max-w-lg p-8 shadow-2xl border border-gray-100">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h3 className="text-2xl font-black text-gray-900 leading-tight">Gestione Account</h3>
            <p className="text-sm font-bold text-gray-400 mt-1 uppercase tracking-widest">{user.name}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <XCircle size={28} className="text-gray-300" />
          </button>
        </div>

        <div className="space-y-4 mb-8">
          {statusOptions.map((opt) => {
            const Icon = opt.icon;
            const isSelected = status === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => setStatus(opt.value)}
                className={`w-full p-5 rounded-3xl border-2 transition-all text-left flex items-start gap-4 group ${isSelected
                  ? `border-orange-500 ${opt.bg}`
                  : 'border-gray-50 hover:border-gray-100 bg-gray-50/30'
                  }`}
              >
                <div className={`p-3 rounded-2xl ${isSelected ? 'bg-white shadow-sm' : 'bg-white/50'} ${opt.color}`}>
                  <Icon size={24} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className={`font-black uppercase tracking-wider text-sm ${isSelected ? 'text-gray-900' : 'text-gray-600'}`}>
                      {opt.label}
                    </span>
                    {isSelected && <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></div>}
                  </div>
                  <p className={`text-xs mt-1 leading-relaxed ${isSelected ? 'text-gray-600' : 'text-gray-400 font-medium'}`}>
                    {opt.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-4 rounded-2xl font-black text-gray-500 bg-gray-50 hover:bg-gray-100 transition-all uppercase tracking-widest text-xs"
          >
            Annulla
          </button>
          <button
            onClick={() => onConfirm(status)}
            disabled={status === user.status}
            className="flex-[2] py-4 rounded-2xl font-black text-white bg-gray-900 hover:bg-black disabled:opacity-30 disabled:cursor-not-allowed shadow-xl shadow-black/10 transition-all uppercase tracking-widest text-xs"
          >
            Salva Modifiche
          </button>
        </div>
      </div>
    </div>
  );
};

const CustomerDetailModal = ({ isOpen, onClose, customer, isLoading }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10001] bg-gray-50 flex flex-col overflow-hidden">
      {/* ── HEADER STICKY ── */}
      <div className="flex-shrink-0 bg-white border-b border-gray-100 px-8 py-5 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-5">
          <button
            onClick={onClose}
            className="flex items-center gap-2 text-gray-400 hover:text-gray-900 transition-colors group"
          >
            <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
            <span className="text-xs font-black uppercase tracking-widest">Torna alla Dashboard</span>
          </button>
          <div className="w-px h-5 bg-gray-200" />
          <div>
            <h2 className="text-sm font-black text-gray-900 uppercase tracking-widest">Profilo Cliente</h2>
            {customer && <p className="text-[10px] text-gray-400 font-bold mt-0.5">ID: #{customer.id}</p>}
          </div>
        </div>
        {customer && (
          <span className={`px-2.5 py-1 rounded-full text-[10px] uppercase tracking-wider font-bold border ${customer.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-gray-50 text-gray-700 border-gray-100'}`}>
            {STATUS_MAP[customer.status] || customer.status}
          </span>
        )}
      </div>

      {/* ── CONTENUTO SCROLLABILE ── */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-full gap-6">
            <div className="w-16 h-16 border-[6px] border-orange-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-black text-gray-400 uppercase tracking-widest">Caricamento profilo...</p>
          </div>
        ) : !customer ? (
          <div className="flex flex-col items-center justify-center h-full">
            <AlertTriangle className="text-gray-300 mb-6" size={80} />
            <p className="text-xl font-bold text-gray-400 uppercase tracking-widest">Dati non trovati</p>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto px-8 py-10 space-y-8">
            {/* ── INFO PRINCIPALI ── */}
            <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-sm flex flex-col md:flex-row items-center gap-8">
              <div className="w-32 h-32 rounded-full bg-blue-50 flex items-center justify-center text-blue-500 font-black text-4xl border-4 border-white shadow-xl">
                {customer.name ? customer.name.charAt(0) : '?'}
              </div>
              <div className="flex-1 text-center md:text-left">
                <h3 className="text-3xl font-black text-gray-900 mb-1">{customer.name} {customer.surname}</h3>
                <div className="flex flex-wrap justify-center md:justify-start gap-4 mt-4">
                  <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-xl border border-gray-100">
                    <User size={14} className="text-gray-400" />
                    <span className="text-sm font-bold text-gray-600">{customer.email}</span>
                  </div>
                  {customer.fiscalCode && (
                    <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-xl border border-gray-100">
                      <CreditCard size={14} className="text-gray-400" />
                      <span className="text-sm font-bold text-gray-600">{customer.fiscalCode}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ── GRIGLIA DETTAGLI ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Statistiche */}
              <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
                <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                  <Ticket size={14} /> Attività
                </h4>
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-3 border-b border-gray-50">
                    <span className="text-sm font-bold text-gray-500">Prenotazioni Totali</span>
                    <span className="text-lg font-black text-gray-900">{customer.totalBookings}</span>
                  </div>
                  <div className="flex justify-between items-center py-3">
                    <span className="text-sm font-bold text-gray-500">Membro dal</span>
                    <span className="text-sm font-black text-gray-900">{new Date(customer.creationDate).toLocaleDateString('it-IT')}</span>
                  </div>
                </div>
              </div>

              {/* Sistema */}
              <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
                <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                  <Settings2 size={14} /> Sistema
                </h4>
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-3 border-b border-gray-50">
                    <span className="text-sm font-bold text-gray-500">Lingua Preferita</span>
                    <span className="text-sm font-black text-gray-900 uppercase">
                      {COUNTRY_MAP[customer.language] || customer.language || 'Italia'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-3">
                    <span className="text-sm font-bold text-gray-500">Ultimo Accesso</span>
                    <span className="text-sm font-black text-gray-900">
                      {customer.lastLogin ? new Date(customer.lastLogin).toLocaleString('it-IT') : 'Mai'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Localizzazione */}
              <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm md:col-span-2">
                <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                  <MapPin size={14} /> Localizzazione
                </h4>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center">
                    <Tag size={20} className="text-gray-400" />
                  </div>
                  <div>
                    <p className="text-sm font-black text-gray-900">
                      {COUNTRY_MAP[customer.state] || customer.state || 'N/D'}
                    </p>
                    <p className="text-xs font-bold text-gray-400 uppercase mt-0.5">Stato / Regione</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// --- COMPONENTE PRINCIPALE ---
export const AdminDashboard = ({ onNavigate }) => {
  // Real Data State
  const [pendingVerifications, setPendingVerifications] = useState([]);
  const [loadingVerifications, setLoadingVerifications] = useState(true);

  const [activeTab, setActiveTab] = useState('providers');

  const [customers, setCustomers] = useState([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [customerSearch, setCustomerSearch] = useState("");
  const [customerPage, setCustomerPage] = useState(0);
  const [totalCustomerPages, setTotalCustomerPages] = useState(0);

  const [partners, setPartners] = useState([]);
  const [loadingPartners, setLoadingPartners] = useState(false);
  const [partnerSearch, setPartnerSearch] = useState("");
  const [partnerPage, setPartnerPage] = useState(0);
  const [totalPartnerPages, setTotalPartnerPages] = useState(0);

  const [kpis, setKpis] = useState({
    totalUsers: 0,
    pendingProviders: 0,
    totalRevenue: 0
  });
  const [loadingKpis, setLoadingKpis] = useState(true);

  // Stati Prenotazioni
  const [bookings, setBookings] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [bookingSearch, setBookingSearch] = useState("");
  const [bookingPage, setBookingPage] = useState(0);
  const [totalBookingPages, setTotalBookingPages] = useState(0);

  // Stati Feedback UI
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Stati Modali
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, data: null });
  const [rejectModal, setRejectModal] = useState({ isOpen: false, verificationId: null });
  const [bookingStatusModal, setBookingStatusModal] = useState({ isOpen: false, booking: null });
  const [manageUserModal, setManageUserModal] = useState({ isOpen: false, user: null });
  const [documentsModal, setDocumentsModal] = useState({ isOpen: false, verification: null, loading: false });
  const [customerDetailModal, setCustomerDetailModal] = useState({ isOpen: false, customer: null, isLoading: false });


  // Dettaglio Prenotazioni Modal
  const [selectedDetailBooking, setSelectedDetailBooking] = useState(null);
  const [bookingDetailModalOpen, setBookingDetailModalOpen] = useState(false);
  const [loadingBookingDetail, setLoadingBookingDetail] = useState(false);

  // Immagine Fullscreen Modal
  const [fullscreenImage, setFullscreenImage] = useState({ isOpen: false, currentIndex: 0 });

  const [globalActionLoading, setGlobalActionLoading] = useState(false);

  const handleNextImage = () => {
    if (!selectedDetailBooking || !selectedDetailBooking.additionalImages) return;
    setFullscreenImage(prev => ({
      ...prev,
      currentIndex: (prev.currentIndex + 1) % selectedDetailBooking.additionalImages.length
    }));
  };

  const handlePrevImage = () => {
    if (!selectedDetailBooking || !selectedDetailBooking.additionalImages) return;
    setFullscreenImage(prev => ({
      ...prev,
      currentIndex: (prev.currentIndex - 1 + selectedDetailBooking.additionalImages.length) % selectedDetailBooking.additionalImages.length
    }));
  };

  // Paginazione
  const [providerPage, setProviderPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  // Logica Provider
  const paginatedProviders = pendingVerifications.slice((providerPage - 1) * ITEMS_PER_PAGE, providerPage * ITEMS_PER_PAGE);
  const totalProviderPages = Math.ceil(pendingVerifications.length / ITEMS_PER_PAGE);

  // Fetch Data
  const fetchData = async () => {
    try {
      setLoadingKpis(true);
      setLoadingVerifications(true);

      const [kpiData, verificationsData] = await Promise.all([
        adminService.getDashboardKpis(),
        adminService.getPendingVerifications()
      ]);

      setKpis(kpiData);
      setPendingVerifications(verificationsData);

    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
      setErrorMessage("Errore nel recupero dei dati della dashboard.");
      setShowError(true);
    } finally {
      setLoadingKpis(false);
      setLoadingVerifications(false);
    }
  };
  const fetchCustomers = async () => {
    try {
      setLoadingCustomers(true);
      const data = await adminService.getCustomers(customerSearch, customerPage, ITEMS_PER_PAGE);
      setCustomers(data.content);
      setTotalCustomerPages(data.totalPages);
    } catch (error) {
      console.error("Failed to fetch customers:", error);
      setErrorMessage("Errore nel recupero dei clienti.");
      setShowError(true);
    } finally {
      setLoadingCustomers(false);
    }
  };

  const fetchPartners = async () => {
    try {
      setLoadingPartners(true);
      const data = await adminService.getProviders(partnerSearch, partnerPage, ITEMS_PER_PAGE);
      setPartners(data.content);
      setTotalPartnerPages(data.totalPages);
    } catch (error) {
      console.error("Failed to fetch partners:", error);
      setErrorMessage("Errore nel recupero dei partner.");
      setShowError(true);
    } finally {
      setLoadingPartners(false);
    }
  };

  const fetchBookings = async () => {
    try {
      setLoadingBookings(true);
      const data = await adminService.getBookings(bookingSearch, bookingPage, ITEMS_PER_PAGE);
      setBookings(data.content);
      setTotalBookingPages(data.totalPages);
    } catch (error) {
      console.error("Failed to fetch bookings:", error);
      setErrorMessage("Errore nel recupero delle prenotazioni.");
      setShowError(true);
    } finally {
      setLoadingBookings(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (activeTab === 'accounts') {
      fetchCustomers();
    }
    if (activeTab === 'providers') {
      fetchPartners();
    }
    if (activeTab === 'bookings') {
      fetchBookings();
    }
  }, [activeTab, customerPage, customerSearch, partnerPage, partnerSearch, bookingPage, bookingSearch]);

  const handleUpdateBookingStatus = async (status, reason) => {
    try {
      if (!bookingStatusModal.booking) return;
      const bookingId = bookingStatusModal.booking.id;
      setBookingStatusModal({ isOpen: false, booking: null });
      setGlobalActionLoading(true);
      await adminService.updateBookingStatus(bookingId, status, reason);
      setSuccessMessage("Stato prenotazione aggiornato!");
      setShowSuccess(true);
      fetchBookings(); // Refresh list
    } catch (error) {
      console.error("Update status failed:", error);
      setErrorMessage(error.message || "Errore durante l'aggiornamento dello stato.");
      setShowError(true);
    } finally {
      setGlobalActionLoading(false);
    }
  };

  const handleUpdateUserStatus = async (status) => {
    try {
      if (!manageUserModal.user) return;
      const userId = manageUserModal.user.id;
      setManageUserModal({ isOpen: false, user: null });
      setGlobalActionLoading(true);
      await adminService.updateUserStatus(userId, status);
      setSuccessMessage("Stato utente aggiornato con successo!");
      setShowSuccess(true);

      // Refresh list based on active tab
      if (activeTab === 'accounts') fetchCustomers();
      if (activeTab === 'providers') fetchPartners();
    } catch (error) {
      console.error("Update user status failed:", error);
      setErrorMessage(error.message || "Errore durante l'aggiornamento dello stato utente.");
      setShowError(true);
    } finally {
      setGlobalActionLoading(false);
    }
  };

  const handleViewBookingDetails = async (bookingId) => {
    try {
      setLoadingBookingDetail(true);
      setBookingDetailModalOpen(true);
      const data = await adminService.getBookingById(bookingId);
      setSelectedDetailBooking(data);
    } catch (error) {
      console.error("Errore recupero dettagli:", error);
      setErrorMessage(error.message || "Errore nel caricamento dei dettagli prenotazione");
      setShowError(true);
      setBookingDetailModalOpen(false);
    } finally {
      setLoadingBookingDetail(false);
    }
  };

  const handleViewCustomerDetails = async (userId) => {
    try {
      setCustomerDetailModal({ isOpen: true, customer: null, isLoading: true });
      const data = await adminService.getCustomerById(userId);
      setCustomerDetailModal({ isOpen: true, customer: data, isLoading: false });
    } catch (error) {
      console.error("Errore recupero dettagli cliente:", error);
      setErrorMessage(error.message || "Errore nel caricamento dei dettagli cliente");
      setShowError(true);
      setCustomerDetailModal({ isOpen: false, customer: null, isLoading: false });
    }
  };

  const handleViewDocuments = async (verification) => {
    try {
      // Usiamo l'ID fornito dalla verifica o dal profilo partner
      const providerId = verification.id || verification.providerId || verification.userId;
      
      setDocumentsModal({ isOpen: true, verification, loading: true });
      
      const docs = await adminService.getProviderDocuments(providerId);
      
      setDocumentsModal(prev => ({
        ...prev,
        verification: { ...verification, documents: docs },
        loading: false
      }));
    } catch (error) {
      console.error("Errore recupero documenti:", error);
      setErrorMessage("Errore nel caricamento dei documenti del provider.");
      setShowError(true);
      setDocumentsModal({ isOpen: false, verification: null, loading: false });
    }
  };



  // Handlers
  const handleApprove = async (id) => {
    try {
      setLoadingVerifications(true);
      await adminService.approveVerification(id);
      setSuccessMessage("Verifica approvata con successo!");
      setShowSuccess(true);
      await fetchData(); // Refresh list
    } catch (error) {
      console.error("Approve failed:", error);
      setErrorMessage(error.message || "Errore durante l'approvazione.");
      setShowError(true);
    } finally {
      setLoadingVerifications(false);
    }
  };

  const handleRejectClick = (id) => {
    setRejectModal({ isOpen: true, verificationId: id });
  };

  const executeReject = async (motivation) => {
    try {
      if (!rejectModal.verificationId) return;
      const vId = rejectModal.verificationId;
      setRejectModal({ isOpen: false, verificationId: null });
      setLoadingVerifications(true);
      await adminService.rejectVerification(vId, motivation);

      setSuccessMessage("Provider eliminato permanentemente insieme a tutti i suoi dati (Hard Delete).");
      setShowSuccess(true);
      await fetchData(); // Refresh list
    } catch (error) {
      console.error("Reject failed:", error);
      setErrorMessage(error.message || "Errore durante l'eliminazione del provider.");
      setShowError(true);
    } finally {
      setLoadingVerifications(false);
    }
  };

  const handleDownloadDocument = async (docId, filename) => {
    try {
      const docData = await adminService.getVerificationDocument(docId);

      if (docData && docData.fileData) {
        // Convert Base64 to Blob
        const byteCharacters = atob(docData.fileData);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'application/octet-stream' });

        // Create download link
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', docData.filename || filename || 'document');
        document.body.appendChild(link);
        link.click();

        // Cleanup
        link.parentNode.removeChild(link);
        window.URL.revokeObjectURL(url);
      } else {
        throw new Error("Dati del file non trovati");
      }
    } catch (error) {
      console.error("Download failed:", error);
      setErrorMessage("Errore durante il download del documento.");
      setShowError(true);
    }
  };



  // Gestione Utenti (Blocco/Sblocco)
  const initiateToggleStatus = (account) => {
    setConfirmModal({
      isOpen: true,
      data: { id: account.id, name: account.name, currentStatus: account.status }
    });
  };

  const executeToggleStatus = () => {
    // TODO: Implementare chiamata API reale per bloccare/sbloccare utente
    console.log("Toggle status action requested for:", confirmModal.data);
    setConfirmModal({ isOpen: false, data: null });
  };

  return (
    <div className="min-h-screen bg-gray-50/50 font-inter">

      {/* MODALI GLOBALI */}
      <ConfirmModal
        isOpen={confirmModal.isOpen} onClose={() => setConfirmModal({ isOpen: false, data: null })}
        onConfirm={executeToggleStatus} actionData={confirmModal.data}
      />

      <RejectModal
        isOpen={rejectModal.isOpen}
        onClose={() => setRejectModal({ isOpen: false, verificationId: null })}
        onConfirm={executeReject}
      />

      <ChangeBookingStatusModal
        isOpen={bookingStatusModal.isOpen}
        onClose={() => setBookingStatusModal({ isOpen: false, booking: null })}
        onConfirm={handleUpdateBookingStatus}
        booking={bookingStatusModal.booking}
      />

      <ManageUserModal
        isOpen={manageUserModal.isOpen}
        onClose={() => setManageUserModal({ isOpen: false, user: null })}
        onConfirm={handleUpdateUserStatus}
        user={manageUserModal.user}
      />

      <BookingDetailModal
        isOpen={bookingDetailModalOpen}
        onClose={() => {
          setBookingDetailModalOpen(false);
          setTimeout(() => setSelectedDetailBooking(null), 300);
        }}
        booking={selectedDetailBooking}
        isLoading={loadingBookingDetail}
        onImageClick={(idx) => setFullscreenImage({ isOpen: true, currentIndex: idx })}
      />

      <FullscreenImageViewer
        isOpen={fullscreenImage.isOpen}
        images={selectedDetailBooking?.additionalImages || []}
        currentIndex={fullscreenImage.currentIndex}
        onClose={() => setFullscreenImage({ isOpen: false, currentIndex: 0 })}
        onPrev={handlePrevImage}
        onNext={handleNextImage}
      />

      <CustomerDetailModal
        isOpen={customerDetailModal.isOpen}
        onClose={() => setCustomerDetailModal({ isOpen: false, customer: null, isLoading: false })}
        customer={customerDetailModal.customer}
        isLoading={customerDetailModal.isLoading}
      />

      <SuccessModal
        isOpen={showSuccess}
        onClose={() => setShowSuccess(false)}
        message={successMessage}
      />

      {showError && (
        <ErrorModal
          onClose={() => setShowError(false)}
          message={errorMessage}
        />
      )}

      <DocumentSelectorModal
        isOpen={documentsModal.isOpen}
        onClose={() => setDocumentsModal({ isOpen: false, verification: null, loading: false })}
        verification={documentsModal.verification}
        loading={documentsModal.loading}
      />


      {(loadingKpis || loadingVerifications || loadingBookings || loadingCustomers || loadingPartners || globalActionLoading) && <LoadingScreen isLoading={true} />}


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
          <StatCard
            title="Totale Utenti"
            value={loadingKpis ? "..." : kpis.totalUsers.toLocaleString()}
            icon={User}
            colorClass="text-purple-500"
          />
          <StatCard
            title="Provider in Attesa"
            value={loadingKpis ? "..." : kpis.pendingProviders}
            icon={Briefcase}
            colorClass="text-orange-500"
          />
          <StatCard
            title="Revenue (Tot)"
            value={loadingKpis ? "..." : `€ ${Number(kpis.totalRevenue).toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            icon={DollarSign}
            colorClass={`text-[${HOGU_COLORS.primary}]`}
          />
        </div>

        {/* MAIN CONTENT AREA */}
        <div className="space-y-8">

          {/* CONTENT AREA: TABS & LISTS */}
          <div className="space-y-6">

            {/* TABS NAV */}
            <div className="flex flex-wrap gap-2 bg-white p-1.5 rounded-2xl border border-gray-100 shadow-sm w-full">
              <button onClick={() => setActiveTab('providers')} className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-bold transition-all flex justify-center items-center gap-2 ${activeTab === 'providers' ? 'bg-orange-500 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}>
                <Briefcase size={16} /><span className="hidden sm:inline">Provider</span>
                <span className={`ml-1 px-1.5 py-0.5 rounded text-[10px] ${activeTab === 'providers' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'}`}>{pendingVerifications.length}</span>
              </button>

              <button onClick={() => setActiveTab('accounts')} className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-bold transition-all flex justify-center items-center gap-2 ${activeTab === 'accounts' ? 'bg-orange-500 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}>
                <Users size={16} /><span className="hidden sm:inline">Gestione Utenti</span>
              </button>

              <button onClick={() => setActiveTab('bookings')} className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-bold transition-all flex justify-center items-center gap-2 ${activeTab === 'bookings' ? 'bg-orange-500 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}>
                <Ticket size={16} /><span className="hidden sm:inline">Prenotazioni</span>
              </button>
            </div>

            {/* CONTENT LIST */}
            <div className="space-y-4 min-h-[400px]">

              {/* TAB 3: PRENOTAZIONI */}
              {activeTab === 'bookings' && (
                <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                    <h3 className="text-xl font-bold text-gray-900">Gestione Prenotazioni</h3>
                    <div className="relative w-full md:w-72">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input
                        type="text"
                        placeholder="Cerca Booking Code o Email Provider..."
                        value={bookingSearch}
                        onChange={(e) => {
                          setBookingSearch(e.target.value);
                          setBookingPage(0);
                        }}
                        className="w-full pl-11 pr-4 py-2.5 rounded-xl bg-gray-50 border border-transparent focus:bg-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all text-sm"
                      />
                    </div>
                  </div>

                  {loadingBookings ? (
                    <div className="flex justify-center items-center py-20">
                      <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  ) : bookings.length === 0 ? (
                    <div className="text-center py-20 bg-gray-50 rounded-[1.5rem] border border-dashed border-gray-200">
                      <p className="text-gray-500 font-medium">Nessuna prenotazione trovata.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="border-b border-gray-50">
                            <th className="pb-4 text-xs font-black uppercase tracking-widest text-gray-400">Codice</th>
                            <th className="pb-4 text-xs font-black uppercase tracking-widest text-gray-400">Provider</th>
                            <th className="pb-4 text-xs font-black uppercase tracking-widest text-gray-400">Cliente</th>
                            <th className="pb-4 text-xs font-black uppercase tracking-widest text-gray-400">Data</th>
                            <th className="pb-4 text-xs font-black uppercase tracking-widest text-gray-400">Totale</th>
                            <th className="pb-4 text-xs font-black uppercase tracking-widest text-gray-400">Stato</th>
                            <th className="pb-4 text-xs font-black uppercase tracking-widest text-gray-400">Azione</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {bookings.map((b) => (
                            <tr key={b.id} className="group hover:bg-gray-50/50 transition-colors">
                              <td className="py-4 font-bold text-gray-900">{b.bookingCode}</td>
                              <td className="py-4">
                                <div className="text-sm font-bold text-gray-900">{b.providerName || 'N/D'}</div>
                                <div className="text-[10px] text-gray-500">{b.providerEmail || 'N/D'}</div>
                              </td>
                              <td className="py-4">
                                <div className="text-sm font-bold text-gray-900">{b.customerName}</div>
                                <div className="text-[10px] text-gray-500">{b.customerEmail}</div>
                              </td>
                              <td className="py-4 text-sm text-gray-500">
                                {new Date(b.creationDate).toLocaleDateString('it-IT')}
                              </td>
                              <td className="py-4 font-black text-gray-900">€ {b.totalAmount.toFixed(2)}</td>
                              <td className="py-4">
                                <StatusBadge status={b.status} />
                              </td>
                              <td className="py-4">
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => handleViewBookingDetails(b.id)}
                                    className="p-2 rounded-xl text-gray-400 hover:text-blue-500 hover:bg-blue-50 transition-all"
                                    title="Dettagli Completi"
                                  >
                                    <Eye size={18} />
                                  </button>
                                  <button
                                    onClick={() => setBookingStatusModal({ isOpen: true, booking: b })}
                                    className="p-2 rounded-xl text-gray-400 hover:text-orange-500 hover:bg-orange-50 transition-all"
                                    title="Gestisci Stato"
                                  >
                                    <Settings2 size={18} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      <PaginationControls
                        currentPage={bookingPage + 1}
                        totalPages={totalBookingPages}
                        onNext={() => setBookingPage(p => p + 1)}
                        onPrev={() => setBookingPage(p => p - 1)}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* TAB 1: PROVIDER (APPROVAZIONE + GESTIONE ELENCO) */}
              {activeTab === 'providers' && (
                <div className="space-y-6">
                  {/* Richieste Pendenti */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center px-2">
                      <h3 className="font-bold text-gray-900">Richieste Pendenti</h3>
                    </div>
                    {paginatedProviders.length === 0 ? (
                      <div className="text-center py-10 bg-white rounded-[1.5rem] border border-dashed border-gray-200 text-gray-400">
                        <p>Nessuna richiesta in attesa.</p>
                      </div>
                    ) : (
                      paginatedProviders.map(verification => (
                        <ProviderRequestCard
                          key={verification.verificationId}
                          verification={verification}
                          onApprove={handleApprove}
                          onReject={handleRejectClick}
                          onDownloadDocument={handleDownloadDocument}
                          onViewDocuments={handleViewDocuments}
                        />

                      ))
                    )}
                    <PaginationControls currentPage={providerPage} totalPages={totalProviderPages} onNext={() => setProviderPage(p => p + 1)} onPrev={() => setProviderPage(p => p - 1)} />
                  </div>

                  {/* Area Partner - Elenco Completo */}
                  <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                      <h3 className="text-xl font-bold text-gray-900">Elenco Partner</h3>
                      <div className="relative w-full md:w-72">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                          type="text"
                          placeholder="Cerca nome partner..."
                          value={partnerSearch}
                          onChange={(e) => {
                            setPartnerSearch(e.target.value);
                            setPartnerPage(0);
                          }}
                          className="w-full pl-11 pr-4 py-2.5 rounded-xl bg-gray-50 border border-transparent focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm"
                        />
                      </div>
                    </div>

                    {loadingPartners ? (
                      <div className="flex justify-center py-20">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
                      </div>
                    ) : partners.length === 0 ? (
                      <div className="text-center py-20 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                        <Briefcase className="mx-auto text-gray-300 mb-4" size={48} />
                        <p className="text-gray-500 font-medium">Nessun partner trovato</p>
                        <p className="text-gray-400 text-sm mt-1">Prova con un termine di ricerca diverso</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left">
                          <thead>
                            <tr className="text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-50">
                              <th className="px-4 py-4">Partner</th>
                              <th className="px-4 py-4">Status</th>
                              <th className="px-4 py-4">Iscrizione</th>
                              <th className="px-4 py-4 text-right">Azioni</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50">
                            {partners.map((user) => (
                              <tr key={user.id} className="hover:bg-gray-50/50 transition-colors group">
                                <td className="px-4 py-4">
                                  <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center text-orange-500 font-bold border border-orange-100">
                                      {user.name ? user.name.charAt(0) : '?'}
                                    </div>
                                    <div>
                                      <div className="font-bold text-gray-900">{user.name}</div>
                                      <div className="text-xs text-gray-400">{user.email}</div>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-4 py-4">
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${user.status === 'ACTIVE' ? 'bg-green-50 text-green-600' :
                                    user.status === 'SUSPENDED' ? 'bg-orange-50 text-orange-600' :
                                      user.status === 'PENDING_ADMIN_APPROVAL' ? 'bg-purple-50 text-purple-600' :
                                        'bg-gray-100 text-gray-500'
                                    }`}>
                                    {STATUS_MAP[user.status] || user.status}
                                  </span>
                                </td>
                                <td className="px-4 py-4 text-sm text-gray-500">
                                  {new Date(user.creationDate).toLocaleDateString('it-IT')}
                                </td>
                                <td className="px-4 py-4 text-right">
                                  <div className="flex justify-end gap-1">
                                    <button
                                      onClick={() => handleViewDocuments(user)}
                                      className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-all"
                                      title="Dettagli"
                                    >
                                      <Eye size={18} />
                                    </button>
                                    <button
                                      onClick={() => setManageUserModal({ isOpen: true, user })}
                                      className="p-2 text-gray-400 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-all"
                                      title="Gestisci Account"
                                    >
                                      <Settings2 size={18} />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {totalPartnerPages > 1 && (
                      <div className="mt-6 border-t border-gray-50 pt-6">
                        <PaginationControls
                          currentPage={partnerPage + 1}
                          totalPages={totalPartnerPages}
                          onNext={() => setPartnerPage(p => p + 1)}
                          onPrev={() => setPartnerPage(p => p - 1)}
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}



              {/* TAB 3: GESTIONE ACCOUNT */}
              {activeTab === 'accounts' && (
                <div className="space-y-6">
                  <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                      <h3 className="text-xl font-bold text-gray-900">Area Clienti</h3>
                      <div className="relative w-full md:w-72">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                          type="text"
                          placeholder="Cerca nome o cognome..."
                          value={customerSearch}
                          onChange={(e) => {
                            setCustomerSearch(e.target.value);
                            setCustomerPage(0);
                          }}
                          className="w-full pl-11 pr-4 py-2.5 rounded-xl bg-gray-50 border border-transparent focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm"
                        />
                      </div>
                    </div>

                    {loadingCustomers ? (
                      <div className="flex justify-center py-20">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
                      </div>
                    ) : customers.length === 0 ? (
                      <div className="text-center py-20 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                        <Users className="mx-auto text-gray-300 mb-4" size={48} />
                        <p className="text-gray-500 font-medium">Nessun cliente trovato</p>
                        <p className="text-gray-400 text-sm mt-1">Prova con un termine di ricerca diverso</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left">
                          <thead>
                            <tr className="text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-50">
                              <th className="px-4 py-4">Utente</th>
                              <th className="px-4 py-4">Status</th>
                              <th className="px-4 py-4">Iscrizione</th>
                              <th className="px-4 py-4 text-right">Azioni</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50">
                            {customers.map((user) => (
                              <tr key={user.id} className="hover:bg-gray-50/50 transition-colors group">
                                <td className="px-4 py-4">
                                  <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-500 font-bold border border-blue-100">
                                      {user.name ? user.name.charAt(0) : '?'}
                                    </div>
                                    <div>
                                      <div className="font-bold text-gray-900">{user.name} {user.surname}</div>
                                      <div className="text-xs text-gray-400">{user.email}</div>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-4 py-4">
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${user.status === 'ACTIVE' ? 'bg-green-50 text-green-600' :
                                    user.status === 'SUSPENDED' ? 'bg-orange-50 text-orange-600' :
                                      user.status === 'PENDING_ADMIN_APPROVAL' ? 'bg-purple-50 text-purple-600' :
                                        'bg-gray-100 text-gray-500'
                                    }`}>
                                    {STATUS_MAP[user.status] || user.status}
                                  </span>
                                </td>
                                <td className="px-4 py-4 text-sm text-gray-500">
                                  {new Date(user.creationDate).toLocaleDateString('it-IT')}
                                </td>
                                <td className="px-4 py-4 text-right">
                                  <div className="flex justify-end gap-1">
                                    <button
                                      onClick={() => handleViewCustomerDetails(user.id)}
                                      className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-all"
                                      title="Dettagli"
                                    >
                                      <Eye size={18} />
                                    </button>
                                    <button
                                      onClick={() => setManageUserModal({ isOpen: true, user })}
                                      className="p-2 text-gray-400 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-all"
                                      title="Gestisci Account"
                                    >
                                      <Settings2 size={18} />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {totalCustomerPages > 1 && (
                      <div className="mt-6 border-t border-gray-50 pt-6">
                        <PaginationControls
                          currentPage={customerPage + 1}
                          totalPages={totalCustomerPages}
                          onNext={() => setCustomerPage(p => p + 1)}
                          onPrev={() => setCustomerPage(p => p - 1)}
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
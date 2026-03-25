import React, { useState, useRef, useEffect } from 'react';
import {
  Calendar, MapPin, Clock, ChevronRight, ChevronLeft, CreditCard,
  Star, Ticket, Utensils, Music, Car, Briefcase, Package, Bed,
  Eye, AlertTriangle, X, MessageSquareWarning, MoreVertical,
  CheckCircle, History, QrCode, Maximize2, Download, ScanLine,
  User, Navigation, Copy, RefreshCw, XCircle, Check,
  ShieldCheck, Mail
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import CurrencyInput from 'react-currency-input-field';
import { customerService } from '../../../../api/apiClient';
import { QRCodeCanvas } from 'qrcode.react';
import { useTranslation, Trans } from 'react-i18next';

import SuccessModal from '../../../ui/SuccessModal.jsx';
import ErrorModal from '../../../ui/ErrorModal.jsx';
import LoadingScreen from '../../../ui/LoadingScreen.jsx';

import { withAuthProtection } from './../../auth/withAuthProtection.jsx';
import SafeImage from '../../../ui/SafeImage.jsx';


// --- MOCK DATA PRENOTAZIONI Rimosso per le Richieste Modifica Prezzo ---
// Nota: Gli altri dati sono stati svuotati per mostrare solo il flusso reale delle richieste modifica prezzo
// TODAY_DATE rimosso da qui e reso dinamico nel componente

const mockBookings = []; // Svuotato come richiesto dal piano

// --- HELPERS ---
const formatPrice = (price, lng = 'it-IT') => {
  if (price === undefined || price === null || price === '--') return '--';
  const numericPrice = typeof price === 'string' ? parseFloat(price.replace(',', '.')) : price;
  if (isNaN(numericPrice)) return '--';
  return new Intl.NumberFormat(lng, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numericPrice);
};

// --- COMPONENTI UI LOCALI ---

const PaginationControls = ({ currentPage, totalPages, onNext, onPrev }) => {
  const { t } = useTranslation('dashboard');
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
        {t('pagination.page')} {currentPage} <span className="text-slate-300 mx-1">/</span> {totalPages}
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
  const { t } = useTranslation('dashboard');
  const styles = {
    confirmed: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-100', label: t('provider.status.confirmed') },
    pending: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-100', label: t('provider.status.pending') },
    waiting_customer: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-100', label: t('provider.status.waiting_customer') }, // NUOVO STATO
    completed: { bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-200', label: t('provider.status.completed') },
    cancelled: { bg: 'bg-rose-50', text: 'text-rose-600', border: 'border-rose-100', label: t('provider.status.cancelled') }
  };
  const style = styles[status] || styles.completed;

  return (
    <span className={`px-2.5 py-1 rounded-full text-[10px] uppercase tracking-wider font-bold border ${style.bg} ${style.text} ${style.border}`}>
      {style.label}
    </span>
  );
};

const ServiceIcon = ({ type, size = 14 }) => {
  switch (type) {
    case 'RESTAURANT': return <Utensils size={size} />;
    case 'CLUB': return <Music size={size} />;
    case 'NCC': return <Car size={size} />;
    case 'LUGGAGE': return <Package size={size} />;
    case 'BNB': return <Bed size={size} />;
    case 'BARBER': return <User size={size} />;
    default: return <Briefcase size={size} />;
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
const PriceChangeRequestCard = ({ booking, onAccept, onReject }) => {
  const { t } = useTranslation('dashboard');
  return (
    <div className="bg-blue-50/50 rounded-3xl p-6 border border-blue-100 shadow-lg shadow-blue-100/50 mb-8 animate-in slide-in-from-top-4 fade-in duration-500 relative overflow-hidden">
      <div className="flex flex-col md:flex-row gap-6">
        {/* Left: Info */}
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 bg-blue-100 text-blue-600 rounded-xl">
              <RefreshCw size={24} className="animate-spin-slow" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-[#1A202C]">{t('price_change.title')}</h3>
              <p className="text-sm text-slate-500">{t('price_change.desc')}</p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-blue-100 mb-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <SafeImage src={booking.image} className="w-10 h-10 rounded-lg object-cover" alt="" />
                  <div className="absolute -top-1.5 -right-1.5 bg-white p-1 rounded-md border border-blue-100 shadow-sm">
                    <ServiceIcon type={booking.type} size={12} />
                  </div>
                </div>
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
                <span className="text-[10px] font-bold text-slate-400 uppercase">{t('price_change.old_price')}</span>
                <span className="text-lg font-bold text-slate-400 line-through decoration-slate-400/50">€ {formatPrice(booking.oldPrice, t('language_tag', { defaultValue: 'it-IT' }))}</span>
              </div>
              <div className="flex items-center text-blue-300">
                <ChevronRight size={24} />
              </div>
              <div className="flex flex-col text-right">
                <span className="text-[10px] font-bold text-blue-600 uppercase">{t('price_change.new_price')}</span>
                <span className="text-2xl font-extrabold text-[#1A202C]">€ {formatPrice(booking.price, t('language_tag', { defaultValue: 'it-IT' }))}</span>
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
            <CheckCircle size={20} /> {t('price_change.accept')}
          </button>
          <button
            onClick={() => onReject(booking.id)}
            className="w-full py-4 bg-white text-rose-600 border border-rose-100 rounded-xl font-bold hover:bg-rose-50 transition-all flex items-center justify-center gap-2"
          >
            <XCircle size={20} /> {t('price_change.reject')}
          </button>
        </div>
      </div>
    </div>
  );
};

// --- BOOKING CARD (Agenda View) ---
const BookingCard = ({ booking, onOpenComplaint, onOpenQr, onOpenDetail }) => {
  const { t } = useTranslation('dashboard');
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
    <div className="group bg-white rounded-3xl p-5 border border-slate-100 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_25px_-5px_rgba(104,180,155,0.15)] hover:border-[#68B49B]/30 transition-all duration-300 flex flex-col h-full relative overflow-hidden">

      {/* Header Immagine & Titolo */}
      <div className="flex gap-4 mb-4">
        <div className="w-16 h-16 rounded-2xl overflow-hidden shrink-0 relative shadow-sm ring-1 ring-slate-100">
          <SafeImage src={booking.image} alt={booking.service} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          <div className="absolute top-0 right-0 bg-white/90 backdrop-blur-sm p-1 rounded-bl-lg text-slate-600 shadow-sm border-b border-l border-white">
            <ServiceIcon type={booking.type} />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <h4 className={`font-bold text-lg truncate ${booking.status === 'cancelled' ? 'text-slate-400 line-through' : 'text-[#68B49B]'} transition-colors`}>
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
          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block mb-1">{t('booking_card.date')}</span>
          <div className="flex items-center gap-1.5 text-slate-700 font-bold text-xs">
            <Calendar size={12} className="text-[#68B49B]" />{booking.date}
          </div>
        </div>
        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block mb-1">{t('booking_card.time')}</span>
          <div className="flex items-center gap-1.5 text-slate-700 font-bold text-xs">
            <Clock size={12} className="text-[#68B49B]" />{booking.time}
          </div>
        </div>
      </div>

      {/* Footer & Azioni */}
      <div className="mt-auto flex items-center justify-between pt-4 border-t border-slate-50">
        <div className="font-extrabold text-[#1A202C] text-lg">€ {formatPrice(booking.price, t('language_tag', { defaultValue: 'it-IT' }))}</div>

        <div className="flex gap-2 relative">
          {/* TICKET QR BUTTON */}
          {(booking.status === 'confirmed' || booking.status === 'completed') && (
            <button
              onClick={() => onOpenQr(booking)}
              className="flex items-center justify-center gap-1.5 bg-[#68B49B]/10 text-[#33594C] px-3 py-2 rounded-xl text-xs font-bold hover:bg-[#68B49B] hover:text-white transition-all shadow-sm"
            >
              <Ticket size={14} /> {t('booking_card.ticket')}
            </button>
          )}

          {/* BUTTON DETTAGLIO */}
          <button
            onClick={() => onOpenDetail(booking)}
            className="w-9 h-9 flex items-center justify-center bg-slate-50 text-slate-400 rounded-xl hover:bg-slate-100 hover:text-[#68B49B] transition-all border border-transparent hover:border-[#68B49B]/20"
            title={t('booking_card.detail_tooltip')}
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
                    <Star size={14} /> {t('booking_card.review')}
                  </button>
                )}

                <button
                  onClick={() => { setIsMenuOpen(false); onOpenComplaint(booking); }}
                  className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-red-50 hover:text-red-600 transition-colors text-left"
                >
                  <AlertTriangle size={14} /> {t('booking_card.report')}
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
const TodayBookingCard = ({ booking, onOpenQr, onOpenDetail }) => {
  const { t } = useTranslation('dashboard');
  return (
    <div className="bg-gradient-to-br from-[#1A202C] to-slate-800 rounded-[2rem] p-6 text-white shadow-xl shadow-slate-900/20 relative overflow-hidden flex flex-col justify-between h-full min-h-[220px]">

      <div className="relative z-10 cursor-pointer" onClick={() => onOpenDetail(booking)}>
        <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-1 rounded-lg text-xs font-bold mb-4 border border-white/20">
          <Calendar size={14} /> {t('booking_card.today')} • {booking.date}
        </div>
        <h3 className="text-2xl font-extrabold mb-1 leading-tight hover:text-[#68B49B] transition-colors">{booking.service}</h3>
        <p className="text-slate-300 text-sm mb-4">{booking.address}</p>

        <div className="flex items-center gap-4 text-sm font-bold">
          <div className="bg-white/10 p-1.5 rounded-lg border border-white/20">
            <ServiceIcon type={booking.type} size={16} />
          </div>
          <span className="flex items-center gap-1.5"><Clock size={16} className="text-[#68B49B]" /> {booking.time}</span>
          <span className="w-1 h-1 bg-slate-500 rounded-full"></span>
          <span>{booking.type}</span>
        </div>
      </div>

      <button
        onClick={() => onOpenQr(booking)}
        className="relative z-10 mt-6 w-full bg-[#68B49B] hover:bg-[#569c85] text-white py-3.5 rounded-xl font-bold shadow-lg shadow-[#68B49B]/30 flex items-center justify-center gap-2 transition-all transform hover:scale-105"
      >
        <ScanLine size={18} /> {t('booking_card.show_ticket')}
      </button>
    </div>
  );
};

// --- MODALE TICKET QR (Standard) ---
const TicketQRModal = ({ isOpen, onClose, booking }) => {
  const { t } = useTranslation('dashboard');
  const [isFullScreen, setIsFullScreen] = useState(false);
  const qrRef = useRef();

  useEffect(() => { if (!isOpen) setIsFullScreen(false); }, [isOpen]);
  if (!isOpen || !booking) return null;

  const handleDownload = () => {
    // Cerchiamo l'elemento canvas all'interno del ref
    const canvas = qrRef.current?.querySelector('canvas');
    if (canvas) {
      const url = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.download = `ticket-${booking.bookingCode || 'hg'}.png`;
      link.href = url;
      link.click();
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1A202C]/60 backdrop-blur-sm transition-opacity animate-in fade-in" onClick={onClose}>
        <div className="bg-white rounded-[2.5rem] w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden relative" onClick={e => e.stopPropagation()}>
          <div className="bg-[#68B49B] p-6 text-center text-white relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
            <h3 className="text-xl font-extrabold relative z-10 uppercase tracking-widest">{t('ticket_modal.title')}</h3>
            <div className="absolute -bottom-3 left-0 w-full h-6 bg-white rounded-t-[1.5rem]"></div>
          </div>

          <div className="px-8 pb-8 pt-2 text-center">
            <h2 className="text-2xl font-bold text-[#1A202C] mb-1">{booking.service}</h2>
            <p className="text-slate-500 text-sm mb-6">{booking.type} • {booking.guests} {t('ticket_modal.guests')}</p>
            <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl p-6 mb-6 relative group">
              <button onClick={() => setIsFullScreen(true)} className="absolute top-3 right-3 p-2 bg-white rounded-full text-slate-400 hover:text-[#68B49B] shadow-sm transition-colors"><Maximize2 size={16} /></button>
              <div ref={qrRef} className="w-40 h-40 bg-white mx-auto mb-3 rounded-xl flex items-center justify-center cursor-pointer p-2 shadow-sm" onClick={() => setIsFullScreen(true)}>
                <QRCodeCanvas
                  value={booking.bookingCode || "HG-INVALID"}
                  size={140}
                  level={"H"}
                  includeMargin={false}
                />
              </div>
              <p className="font-mono text-xs font-bold text-slate-400 tracking-widest uppercase">{booking.bookingCode || "HG-8829-X"}</p>
            </div>
            <button onClick={onClose} className="w-full py-3.5 bg-[#1A202C] text-white rounded-2xl font-bold shadow-lg hover:bg-black transition-colors">{t('ticket_modal.close')}</button>
          </div>
        </div>
      </div>

      {isFullScreen && (
        <div className="fixed inset-0 z-[70] bg-black/95 backdrop-blur-md flex flex-col items-center justify-center p-6 animate-in fade-in duration-300">
          <button onClick={() => setIsFullScreen(false)} className="absolute top-6 right-6 text-white/70 hover:text-white p-2 transition-colors bg-white/10 rounded-full"><X size={32} /></button>
          <div className="bg-white p-8 rounded-[3rem] shadow-2xl flex flex-col items-center gap-8 max-w-sm w-full animate-in zoom-in-95 duration-300">
            <div className="text-center">
              <h3 className="text-2xl font-black text-[#1A202C] uppercase tracking-wide mb-1">{t('ticket_modal.entrance_instruction')}</h3>
              <p className="text-slate-400 font-medium">{booking.service}</p>
            </div>
            <div ref={qrRef} className="w-64 h-64 bg-slate-50 rounded-3xl flex items-center justify-center border-4 border-slate-100 p-6 shadow-inner">
              <QRCodeCanvas
                value={booking.bookingCode || "HG-INVALID"}
                size={220}
                level={"H"}
                includeMargin={false}
              />
            </div>
            <p className="font-mono text-2xl font-bold text-slate-800 tracking-widest uppercase">{booking.bookingCode || "HG-8829-X"}</p>
            <button onClick={handleDownload} className="w-full bg-[#68B49B] text-white py-4 rounded-2xl font-bold text-lg shadow-xl shadow-[#68B49B]/30 flex items-center justify-center gap-2 hover:scale-105 transition-transform"><Download size={24} /> {t('ticket_modal.download')}</button>
          </div>
        </div>
      )}
    </>
  );
};

// --- MODALE DETTAGLIO PRENOTAZIONE ---
const BookingDetailModal = ({ isOpen, onClose, booking }) => {
  const { t } = useTranslation('dashboard');
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
          <SafeImage src={booking.image} alt={booking.service} className="w-full h-full object-cover" />
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
            {booking.description || t('detail_modal.description_placeholder')}
          </p>

          {/* Timeline Info */}
          <div className="space-y-4 mb-8">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 shrink-0 mt-1">
                <Calendar size={18} />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">{t('booking_card.date')} & {t('booking_card.time')}</p>
                <p className="text-[#1A202C] font-bold">{booking.date}</p>
                <p className="text-slate-500 text-sm">{t('detail_modal.at_time')} {booking.time}</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 shrink-0 mt-1">
                <MapPin size={18} />
              </div>
              <div className="flex-1">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">{t('detail_modal.address')}</p>
                <p className="text-[#1A202C] font-bold">{booking.address}</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 shrink-0 mt-1">
                <User size={18} />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">{t('detail_modal.guests')}</p>
                <p className="text-[#1A202C] font-bold">{booking.guests} {t('detail_modal.guests')}</p>
              </div>
            </div>
          </div>

          {/* Riepilogo Costi */}
          <div className="bg-slate-50 rounded-2xl p-5 mb-6 border border-slate-100">
            <h4 className="font-bold text-[#1A202C] mb-3 text-sm">{t('detail_modal.summary')}</h4>
            <div className="flex justify-between items-center text-sm text-slate-500 mb-2">
              <span>{t('detail_modal.base_price')}</span>
              <span>€ {formatPrice(booking.price, t('language_tag', { defaultValue: 'it-IT' }))}</span>
            </div>
            <div className="flex justify-between items-center text-sm text-slate-500 mb-4">
              <span>{t('detail_modal.service_fees')}</span>
              <span>€ 0,00</span>
            </div>
            <div className="h-px bg-slate-200 w-full mb-3"></div>
            <div className="flex justify-between items-center text-lg font-extrabold text-[#1A202C]">
              <span>{t('detail_modal.total')}</span>
              <span>€ {formatPrice(booking.price, t('language_tag', { defaultValue: 'it-IT' }))}</span>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex flex-col gap-3">
            {(booking.status === 'confirmed' || booking.status === 'completed') ? (
              <button onClick={() => onOpenQr(booking)} className="flex items-center justify-center gap-2 py-3 bg-[#1A202C] text-white rounded-xl font-bold hover:bg-black transition-colors">
                <Ticket size={18} /> {t('detail_modal.view_ticket')}
              </button>
            ) : (
              <button onClick={onClose} className="flex items-center justify-center gap-2 py-3 bg-[#68B49B] text-white rounded-xl font-bold hover:bg-[#5a9e87] transition-colors">
                {t('detail_modal.close')}
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
  const { t } = useTranslation('dashboard');
  const [description, setDescription] = useState('');
  const [step, setStep] = useState(1);
  const [copiedText, setCopiedText] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setDescription('');
      setCopiedText(false);
      setCopiedEmail(false);
    }
  }, [isOpen]);

  if (!isOpen || !booking) return null;

  const supportEmail = import.meta.env.VITE_SUPPORT_EMAIL || 'support@hogu.it';
  const subject = `${t('complaint_modal.title')} - ${t('payment.booking_code')} ${booking.bookingCode || booking.id}`;

  const bodyText = `${t('complaint_modal.email_body.intro')}

${t('complaint_modal.email_body.details_header')}
${t('complaint_modal.email_body.service', { service: booking.service })}
${t('complaint_modal.email_body.type', { type: booking.type })}
${t('complaint_modal.email_body.date', { date: booking.date, time: booking.time })}
${t('complaint_modal.email_body.code', { code: booking.bookingCode || 'N/D' })}

${t('complaint_modal.email_body.user_desc')}
${description}

---
${t('complaint_modal.email_body.footer')}`;

  const handleNextStep = (e) => {
    e.preventDefault();
    if (!description.trim()) return;
    setStep(2);
  };

  const handleSendEmail = () => {
    const mailtoLink = `mailto:${supportEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodyText)}`;
    window.location.href = mailtoLink;
    onClose();
  };

  const copyToClipboard = (text, type) => {
    navigator.clipboard.writeText(text);
    if (type === 'email') {
      setCopiedEmail(true);
      setTimeout(() => setCopiedEmail(false), 2000);
    } else {
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-[#1A202C]/60 backdrop-blur-sm transition-opacity animate-in fade-in" onClick={onClose}>
      <div className="bg-white rounded-[2rem] w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="p-6 pb-2 relative shrink-0">
          <button onClick={onClose} className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-full transition-colors">
            <X size={18} />
          </button>
          <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center text-red-500 mb-4 mx-auto"><MessageSquareWarning size={24} /></div>
          <h3 className="text-xl font-bold text-[#1A202C] text-center mb-1">{t('complaint_modal.title')}</h3>
          {step === 1 ? (
            <p className="text-sm text-slate-500 text-center">
              <Trans i18nKey="complaint_modal.subtitle_step1" t={t} values={{ service: booking.service }}>
                Problemi con <strong>{booking.service}</strong>?
              </Trans>
            </p>
          ) : (
            <p className="text-sm text-slate-500 text-center">{t('complaint_modal.subtitle_step2')}</p>
          )}
        </div>

        {/* Content (Scrollable) */}
        <div className="p-6 pt-2 overflow-y-auto hide-scrollbar">
          {step === 1 && (
            <form onSubmit={handleNextStep} className="flex flex-col h-full">
              <textarea
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:bg-white focus:ring-2 focus:ring-red-100 focus:border-red-300 outline-none min-h-[120px] resize-none text-sm mb-6 transition-all"
                placeholder={t('complaint_modal.placeholder')}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              ></textarea>

              <div className="flex gap-3 mt-auto">
                <button type="button" onClick={onClose} className="flex-1 py-3.5 rounded-xl font-bold text-sm text-slate-500 bg-slate-100 hover:bg-slate-200 transition-colors">
                  {t('complaint_modal.cancel')}
                </button>
                <button type="submit" disabled={!description.trim()} className="flex-1 py-3.5 rounded-xl font-bold text-sm text-white bg-red-500 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-red-500/30 transition-all flex justify-center items-center">
                  {t('complaint_modal.continue')} <ChevronRight size={16} className="ml-1" />
                </button>
              </div>
            </form>
          )}

          {step === 2 && (
            <div className="flex flex-col gap-4 mt-2">
              {/* Opzione 1: Apri App Email */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <h4 className="font-bold text-[#1A202C] mb-1 flex items-center gap-2">
                  <Mail size={18} className="text-[#68B49B]" /> {t('complaint_modal.email_app.title')}
                </h4>
                <p className="text-[11px] text-slate-500 mb-3">
                  {t('complaint_modal.email_app.desc')}
                </p>
                <button
                  onClick={handleSendEmail}
                  className="w-full py-3 bg-[#1A202C] text-white rounded-xl font-bold text-sm shadow-md hover:bg-black transition-all flex items-center justify-center gap-2"
                >
                  <Navigation size={16} /> {t('complaint_modal.email_app.button')}
                </button>
              </div>

              {/* Opzione 2: Copia Manuale */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <h4 className="font-bold text-[#1A202C] mb-1 flex items-center gap-2">
                  <Copy size={18} className="text-blue-500" /> {t('complaint_modal.manual.title')}
                </h4>
                <p className="text-[11px] text-slate-500 mb-3">
                  {t('complaint_modal.manual.desc')}
                </p>

                <div className="space-y-3">
                  {/* Destinatario */}
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">{t('complaint_modal.manual.to')}</span>
                    <div className="flex items-center justify-between bg-white border border-slate-200 rounded-lg p-2.5">
                      <span className="text-sm font-medium text-slate-700">{supportEmail}</span>
                      <button
                        onClick={() => copyToClipboard(supportEmail, 'email')}
                        className="text-slate-400 hover:text-blue-500 transition-colors p-1 bg-slate-50 hover:bg-blue-50 rounded-md"
                        title="Copia email"
                      >
                        {copiedEmail ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
                      </button>
                    </div>
                  </div>

                  {/* Oggetto */}
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">{t('complaint_modal.manual.subject')}</span>
                    <div className="bg-white border border-slate-200 rounded-lg p-2.5 text-xs font-medium text-slate-700 truncate">
                      {subject}
                    </div>
                  </div>

                  {/* Testo dell'Email */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">{t('complaint_modal.manual.message')}</span>
                      <button
                        onClick={() => copyToClipboard(bodyText, 'text')}
                        className="text-[10px] font-bold text-blue-500 flex items-center gap-1 hover:text-blue-600 transition-colors bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded"
                      >
                        {copiedText ? <><Check size={12} /> {t('complaint_modal.manual.copied')}</> : <><Copy size={12} /> {t('complaint_modal.manual.copy_text')}</>}
                      </button>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-lg p-3 text-[11px] text-slate-600 whitespace-pre-wrap max-h-[120px] overflow-y-auto hide-scrollbar font-mono leading-relaxed">
                      {bodyText}
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottoni Navigazione Step 2 */}
              <div className="flex gap-3 mt-1">
                <button type="button" onClick={() => setStep(1)} className="flex-1 py-3 rounded-xl font-bold text-sm text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 transition-colors flex items-center justify-center gap-2">
                  <ChevronLeft size={16} /> {t('complaint_modal.back')}
                </button>
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// --- COMPONENTE PRINCIPALE ---
export const CustomerDashboardBase = ({ user }) => {
  const { t, i18n } = useTranslation('dashboard');
  const TODAY_DATE = new Date().toLocaleDateString(i18n.language === 'it' ? 'it-IT' : 'en-US', { day: '2-digit', month: 'short', year: 'numeric' });
  const navigate = useNavigate();
  const [filter, setFilter] = useState('active');
  const [currentPage, setCurrentPage] = useState(1);
  const [complaintModalOpen, setComplaintModalOpen] = useState(false);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);

  const [localBookings, setLocalBookings] = useState([]);
  const [priceChangeRequests, setPriceChangeRequests] = useState([]);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const itemsPerPage = 2;
  const chunkSize = 10; // 10 results per request as requested (5 pages)

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        setIsLoading(true);
        const serverPage = Math.floor((currentPage - 1) / 5);

        let data = [];
        if (filter === 'active') {
          data = await customerService.getUpcomingBookings(serverPage, chunkSize);
        } else {
          data = await customerService.getPastBookings(serverPage, chunkSize);
        }

        const mapBooking = dto => {
          const isPriceChange = ['MODIFIED_BY_PROVIDER', 'WAITING_CUSTOMER_PAYMENT'].includes(dto.status);
          return {
            id: dto.bookingId,
            service: dto.serviceName,
            type: dto.serviceType,
            date: dto.serviceDate ? new Date(dto.serviceDate).toLocaleDateString(i18n.language === 'it' ? 'it-IT' : 'en-US', { day: '2-digit', month: '2-digit', year: 'numeric' }) : 'N/D',
            time: dto.serviceDate ? new Date(dto.serviceDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/D',
            status: isPriceChange ? 'waiting_customer' : (['COMPLETED', 'PROVIDER_LIQUIDATED', 'COMMISSION_PAID'].includes(dto.status) ? 'completed' : (['CANCELLED_BY_PROVIDER', 'CANCELLED_BY_ADMIN', 'REFUNDED_BY_ADMIN'].includes(dto.status) ? 'cancelled' : 'confirmed')),
            rawStatus: dto.status,
            price: dto.newPrice,
            oldPrice: '--',
            image: dto.serviceImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(dto.serviceName)}&background=random`,
            address: dto.pickupLocation || dto.destination || t('detail_modal.address_not_available', { defaultValue: 'Indirizzo non gestito' }),
            guests: dto.passengers || dto.numberOfGuests || dto.numberOfPeople || 1,
            providerNote: dto.statusReason || (isPriceChange ? t('price_change.desc') : ''),
            bookingCode: dto.bookingCode,
            originalDto: dto
          };
        };

        const mapped = data.map(mapBooking);
        setHasMore(data.length === chunkSize);

        // Estraiamo price change e oggi solo se siamo in Agenda (active)
        if (filter === 'active') {
          setPriceChangeRequests(mapped.filter(b => b.status === 'waiting_customer'));
          setLocalBookings(mapped.filter(b => b.status !== 'waiting_customer'));
        } else {
          setPriceChangeRequests([]);
          setLocalBookings(mapped);
        }

      } catch (error) {
        console.error("Failed to fetch bookings", error);
        setError(t('messages.error_fetch'));
      } finally {
        setIsLoading(false);
      }
    };
    fetchBookings();
  }, [filter, Math.floor((currentPage - 1) / 5)]);

  // Gestione Rettifica Prezzo
  const handleAcceptPriceChange = (id) => {
    // Reindirizza al pagamento per confermare il nuovo prezzo
    navigate(`/customer/payment?bookingId=${id}`);
  };

  const handleRejectPriceChange = async (id) => {
    try {
      const req = priceChangeRequests.find(r => r.id === id);
      if (req) {
        setIsLoading(true);
        await customerService.cancelBooking(id, req.type);
        setPriceChangeRequests(prev => prev.filter(b => b.id !== id));
        setSuccessMessage(t('messages.success_cancel'));
      }
    } catch (error) {
      console.error("Errore durante l'annullamento della prenotazione", error);
      setError(t('messages.error_cancel'));
    } finally {
      setIsLoading(false);
    }
  };

  const waitingCustomerBookings = priceChangeRequests;

  const filteredBookings = localBookings.filter(booking => {
    // Escludi le prenotazioni di OGGI dalla lista generale (mostrate in sezione dedicata)
    if (filter === 'active' && booking.date === TODAY_DATE && booking.status === 'confirmed') return false;
    return true;
  });

  // Filtra le prenotazioni di OGGI per la sezione speciale
  const todayBookings = localBookings.filter(b => b.date === TODAY_DATE && b.status === 'confirmed');

  // Calcolo delle pagine totali approssimative dato che non abbiamo il count dal backend
  const serverPage = Math.floor((currentPage - 1) / 5);
  const totalPagesInCurrentChunk = Math.ceil(filteredBookings.length / itemsPerPage);
  const totalPages = (serverPage * 5) + totalPagesInCurrentChunk + (hasMore ? 1 : 0);

  const currentBookings = filteredBookings.slice(
    ((currentPage - 1) % 5) * itemsPerPage,
    ((currentPage - 1) % 5 + 1) * itemsPerPage
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

      {/* Feedback UI */}
      <LoadingScreen isLoading={isLoading} />
      <SuccessModal
        isOpen={!!successMessage}
        onClose={() => setSuccessMessage(null)}
        message={successMessage}
      />
      {error && (
        <ErrorModal
          onClose={() => setError(null)}
          message={error}
        />
      )}
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
              {t('welcome_back')} <span className="text-[#68B49B]">{user?.name || 'Utente'}</span>
            </h1>
            <p className="text-slate-500 font-medium text-lg">{t('subtitle_welcome')}</p>
          </div>
          <button
            onClick={() => navigate('/customer/credential-reset')}
            className="flex items-center gap-2 bg-white border border-slate-200 px-5 py-2.5 rounded-xl text-slate-600 font-bold hover:bg-slate-50 hover:text-[#1A202C] hover:border-slate-300 transition-all shadow-sm"
          >
            <ShieldCheck size={18} /> {t('btn_security')}
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
                <h2 className="text-2xl font-bold text-[#1A202C]">{t('booking_card.today_arrival')}</h2>
                <p className="text-sm text-slate-500">{t('booking_card.today_arrival_desc', { date: TODAY_DATE })}.</p>
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
            title={t('stats.agenda')}
            value={`${localBookings.filter(b => b.status === 'confirmed').length} ${t('stats.events_unit')}`}
            icon={Calendar}
            colorClass="text-[#68B49B]"
          />
          <StatCard
            title={t('stats.bookings')}
            value={`${localBookings.length} ${t('stats.total_unit')}`}
            icon={Ticket}
            colorClass="text-amber-500"
          />
          <div onClick={() => navigate('/')} className="bg-gradient-to-br from-[#68B49B] to-[#33594C] p-5 rounded-3xl shadow-lg shadow-[#68B49B]/30 flex items-center justify-between text-white relative overflow-hidden group cursor-pointer hover:scale-[1.02] transition-transform">
            <div className="relative z-10">
              <p className="text-white/80 text-[10px] font-bold uppercase tracking-wider mb-1">{t('stats.explore')}</p>
              <h3 className="text-2xl font-extrabold">{t('stats.new_events')}</h3>
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
                {filter === 'active' ? t('main_section.agenda_title') : filter === 'past' ? t('main_section.history_title') : t('main_section.all_title')}
              </h2>
              <p className="text-sm text-slate-500 mt-1">{t('main_section.desc')}</p>
            </div>

            <div className="flex items-center gap-4">
              {/* Filtri a pillola */}
              <div className="flex bg-white p-1.5 rounded-2xl border border-slate-100 shadow-sm">
                <button
                  onClick={() => { setFilter('active'); setCurrentPage(1); }}
                  className={`px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wide transition-all ${filter === 'active' ? 'bg-[#68B49B] text-white shadow-md shadow-[#68B49B]/20' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'}`}
                >
                  {t('tabs.active')}
                </button>
                <button
                  onClick={() => { setFilter('past'); setCurrentPage(1); }}
                  className={`px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wide transition-all ${filter === 'past' ? 'bg-[#1A202C] text-white shadow-md shadow-slate-900/20' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'}`}
                >
                  {t('tabs.history')}
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
                <h3 className="text-xl font-bold text-[#1A202C]">{t('no_bookings.title')}</h3>
                <p className="text-slate-500 text-sm mb-8 max-w-xs mx-auto">
                  {filter === 'active' ? t('no_bookings.desc_active') : t('no_bookings.desc_history')}
                </p>
                {filter === 'active' && (
                  <button onClick={() => navigate('/')} className="bg-[#1A202C] text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-slate-900/20 hover:bg-[#68B49B] hover:shadow-[#68B49B]/30 transition-all flex items-center gap-2">
                    <CheckCircle size={18} /> {t('no_bookings.cta')}
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
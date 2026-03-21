import React, { useState } from 'react';
import {
  Camera, RotateCcw, CheckCircle2, XCircle,
  Keyboard, ChevronRight, History, Flashlight, User, ChevronLeft,
  Luggage, Calendar, Clock
} from 'lucide-react';

import { withAuthProtection } from './../../auth/withAuthProtection.jsx';
import { Scanner } from '@yudiel/react-qr-scanner';
import { useSearchParams } from 'react-router-dom';

import { Breadcrumbs } from '../../../../components/ui/Breadcrumbs.jsx';
import { restaurantService } from '../../../../api/apiClient.js';
import { clubService } from '../../../../api/apiClient.js';
import { nccService } from '../../../../api/apiClient.js';
import { luggageService } from '../../../../api/apiClient.js';

// --- CONFIGURAZIONE TEMA ---
const HOGU_COLORS = {
  primary: '#68B49B',
  dark: '#1A202C',
  lightAccent: '#E6F5F0',
  subtleText: '#4A5568',
  success: '#10B981',
  error: '#EF4444',
};

const HOGU_THEME = {
  bg: 'bg-gray-50',
  fontFamily: 'font-sans',
  cardBase: 'bg-white rounded-[2rem] shadow-sm border border-gray-100',
};

const formatDateLabel = (iso) => {
  if (!iso) return '-';
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch { return '-'; }
};
const formatTimeLabel = (iso) => {
  if (!iso) return '--:--';
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
  } catch { return '--:--'; }
};
const formatTimeRange = (drop, pick) => {
  const a = formatTimeLabel(drop);
  const b = formatTimeLabel(pick);
  if (a === '--:--' && b === '--:--') return '--:--';
  return `${a} - ${b}`;
};

// --- DATI MOCK ---
const MOCK_DB = {};

// --- COMPONENTI UI ---

const ResultModal = ({ result, onReset }) => {
  if (!result) return null;

  const isValid = result.status === 'valid';
  const isUsed = result.status === 'used';

  let bgColor = isValid ? 'bg-green-500' : (isUsed ? 'bg-orange-500' : 'bg-red-500');
  let icon = isValid ? <CheckCircle2 size={64} className="text-white" /> : <XCircle size={64} className="text-white" />;
  let title = isValid ? "ACCESSO CONSENTITO" : (isUsed ? "GIÀ UTILIZZATO" : "NON VALIDO");
  let message = isValid ? "Prenotazione verificata con successo" : (isUsed ? `Entrato alle ${result.usedAt}` : "Codice non riconosciuto");

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center p-6 animate-in fade-in zoom-in duration-200">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onReset}></div>

      <div className={`relative w-full max-w-sm ${bgColor} rounded-[2rem] p-8 text-center shadow-2xl text-white overflow-hidden`}>
        <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>

        <div className="relative z-10 flex flex-col items-center gap-4">
          <div className="mb-2 animate-bounce">
            {icon}
          </div>

          <h2 className="text-2xl font-black uppercase tracking-wider">{title}</h2>
          <p className="text-white/90 font-medium">{message}</p>

          {(isValid || isUsed) && (
            <div className="bg-white/10 rounded-xl p-4 w-full mt-4 text-left border border-white/20 backdrop-blur-md">
              {result.serviceType === 'LUGGAGE' ? (
                <>
                  <div className="flex items-center gap-3 mb-2 pb-2 border-b border-white/10">
                    <div className="p-2 bg-white/20 rounded-full"><User size={16} /></div>
                    <div>
                      <p className="text-[10px] uppercase opacity-70 font-bold">Cliente</p>
                      <p className="font-bold text-lg leading-none">{result.name}</p>
                      <p className="text-[10px] uppercase opacity-70 font-bold mt-1">{result.serviceName || ''}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div className="text-white">
                      <p className="text-[10px] uppercase opacity-70 font-bold">Data</p>
                      <div className="flex items-center gap-2 font-bold"><Calendar size={14} /> {formatDateLabel(result.dropOffTime || result.date)}</div>
                    </div>
                    <div className="text-white">
                      <p className="text-[10px] uppercase opacity-70 font-bold">Orario</p>
                      <div className="flex items-center gap-2 font-bold"><Clock size={14} /> {formatTimeRange(result.dropOffTime, result.pickUpTime)}</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="flex flex-col items-center bg-white/10 p-2 rounded-xl border border-white/20">
                      <Luggage size={16} className="text-white/80 mb-1" />
                      <span className="text-[10px] text-white/80 font-medium">Piccolo</span>
                      <span className="text-lg font-bold text-white">{result.bagsSmall || 0}</span>
                    </div>
                    <div className="flex flex-col items-center bg-white/10 p-2 rounded-xl border border-white/20">
                      <Luggage size={16} className="text-white/80 mb-1" />
                      <span className="text-[10px] text-white/80 font-medium">Medio</span>
                      <span className="text-lg font-bold text-white">{result.bagsMedium || 0}</span>
                    </div>
                    <div className="flex flex-col items-center bg-white/10 p-2 rounded-xl border border-white/20">
                      <Luggage size={16} className="text-white/80 mb-1" />
                      <span className="text-[10px] text-white/80 font-medium">Grande</span>
                      <span className="text-lg font-bold text-white">{result.bagsLarge || 0}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 mt-3">
                    <div className="p-2 bg-white/20 rounded-xl text-white"><Luggage size={16} /></div>
                    <div>
                      <p className="text-[10px] uppercase opacity-70 font-bold">Totale Colli</p>
                      <p className="font-black text-xl">{(result.bagsSmall || 0) + (result.bagsMedium || 0) + (result.bagsLarge || 0)}</p>
                    </div>
                    <div className="ml-auto text-right">
                      <p className="text-[10px] uppercase opacity-70 font-bold">Totale</p>
                      <p className="font-black text-xl">€ {result.totalAmount ?? '-'}</p>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-3 mb-2 pb-2 border-b border-white/10">
                    <div className="p-2 bg-white/20 rounded-full"><User size={16} /></div>
                    <div>
                      <p className="text-[10px] uppercase opacity-70 font-bold">Ospite</p>
                      <p className="font-bold text-lg leading-none">{result.name}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-[10px] uppercase opacity-70 font-bold">Data</p>
                      <p className="font-bold">{result.date || '-'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase opacity-70 font-bold">Orario</p>
                      <p className="font-bold">{result.time || '-'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase opacity-70 font-bold">Ospiti</p>
                      <p className="font-bold">{result.pax ?? '-'}</p>
                    </div>
                    {(result.from || result.to) && (
                      <>
                        <div>
                          <p className="text-[10px] uppercase opacity-70 font-bold">Partenza</p>
                          <p className="font-bold break-words">{result.from || '-'}</p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase opacity-70 font-bold">Arrivo</p>
                          <p className="font-bold break-words">{result.to || '-'}</p>
                        </div>
                      </>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          <button
            onClick={onReset}
            className="mt-6 w-full py-4 bg-white text-gray-900 rounded-xl font-bold text-lg shadow-lg hover:scale-105 transition-transform flex items-center justify-center gap-2"
          >
            <RotateCcw size={20} /> Nuova Scansione
          </button>
        </div>
      </div>
    </div>
  );
};

// --- CONFIG SCANNER PER SERVIZI ---
const SERVICE_SCANNER_CONFIG = {
  restaurant: { label: 'Ristorante' },
  beb: { label: 'B&B / Hotel' },
  club: { label: 'Club / Eventi' },
  ncc: { label: 'NCC / Trasporti' },
  storage: { label: 'Depositi' },
};

// --- PAGINA PRINCIPALE: QR SCANNER ---

const QRValidatorPage = () => {
  const [searchParams] = useSearchParams();
  const rawType = searchParams.get('type') || 'restaurant';
  const type = rawType.toLowerCase();
  const serviceConfig = SERVICE_SCANNER_CONFIG[type] || { label: 'Servizio' };
  const eventId = searchParams.get('eventId');
  const breadcrumbsItems = [
    { label: 'Dashboard', href: '/provider/dashboard' },
    { label: 'Scanner QR', href: '#' },
  ];
  const [cameraActive, setCameraActive] = useState(true);
  const [scannedResult, setScannedResult] = useState(null);
  const [manualCode, setManualCode] = useState("");
  const [history, setHistory] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // --- LOGICA DI VALIDAZIONE ---
  const handleScan = async (code) => {
    if (!code || isProcessing) return;

    // Evita scansioni multiple ravvicinate
    setIsProcessing(true);
    setCameraActive(false);

    try {
      let res;
      if (type === 'club' && eventId) {
        res = await clubService.validateClubBookingForEvent(eventId, code);
      } else if (type === 'ncc') {
        res = await nccService.validateNccBookingCode(code);
      } else if (type === 'storage') {
        res = await luggageService.validateLuggageBookingCode(code);
      } else {
        res = await restaurantService.validateBookingCode(code);
      }

      const status = res.valid ? 'valid' : 'invalid';
      const fullResult = {
        status,
        code,
        serviceType: res.serviceType,
        name: res.fullName || [res.firstName, res.lastName, res.customerFirstName, res.customerLastName].filter(Boolean).join(' '),
        date: res.date,
        time: res.time,
        pax: res.guests ?? res.passengers,
        from: res.pickupLocation,
        to: res.destination,
        serviceName: res.serviceName,
        dropOffTime: res.dropOffTime,
        pickUpTime: res.pickUpTime,
        bagsSmall: res.bagsSmall,
        bagsMedium: res.bagsMedium,
        bagsLarge: res.bagsLarge,
        totalAmount: res.totalAmount,
        timestamp: new Date().toLocaleTimeString()
      };
      setScannedResult(fullResult);
      setHistory(prev => [fullResult, ...prev].slice(0, 5));
    } catch (e) {
      const fullResult = { status: 'invalid', code, timestamp: new Date().toLocaleTimeString() };
      setScannedResult(fullResult);
      setHistory(prev => [fullResult, ...prev].slice(0, 5));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    handleScan(manualCode.toUpperCase());
    setManualCode("");
  };

  const resetScanner = () => {
    setScannedResult(null);
    setCameraActive(true);
  };

  return (
    <div className={`min-h-screen ${HOGU_THEME.bg} ${HOGU_THEME.fontFamily} flex flex-col`}>

      {/* --- HEADER --- */}
      <div className="pt-12 px-4 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="mb-4">
          <Breadcrumbs items={breadcrumbsItems} />
        </div>
      </div>

      {/* --- CONTENUTO --- */}
      <div className="flex-1 flex flex-col p-4 max-w-md mx-auto w-full gap-4 mt-2">

        {/* AREA FOTOCAMERA / SCANNER */}
        <div className="relative w-full aspect-[4/5] bg-black rounded-[2rem] overflow-hidden shadow-xl border-4 border-white mt-2 ring-1 ring-gray-200">

          {cameraActive ? (
            <>
              {/* --- COMPONENTE LIBRERIA QR MODERNA --- */}
              <div className="absolute inset-0 w-full h-full">
                <Scanner
                  onScan={(result) => {
                    // La libreria restituisce un array di risultati
                    if (result && result[0]) {
                      handleScan(result[0].rawValue);
                    }
                  }}
                  components={{
                    audio: false, // Disabilita beep default
                    finder: false // Disabilita mirino default (usiamo il nostro custom)
                  }}
                  styles={{
                    container: { width: '100%', height: '100%' },
                    video: { objectFit: 'cover' }
                  }}
                />
              </div>

              {/* --- CUSTOM UI OVERLAY (Sopra il video) --- */}
              <div className="absolute inset-0 flex flex-col items-center justify-center p-8 z-10 pointer-events-none">
                {/* Frame Scansione */}
                <div className="relative w-64 h-64 border-2 border-white/50 rounded-3xl flex items-center justify-center">
                  <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-[#68B49B] rounded-tl-xl -mt-1 -ml-1"></div>
                  <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-[#68B49B] rounded-tr-xl -mt-1 -mr-1"></div>
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-[#68B49B] rounded-bl-xl -mb-1 -ml-1"></div>
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-[#68B49B] rounded-br-xl -mb-1 -mr-1"></div>

                  {/* Linea Scansione Animata */}
                  <div className="absolute w-[90%] h-0.5 bg-[#68B49B] shadow-[0_0_15px_#68B49B] animate-[scan_2s_ease-in-out_infinite]"></div>
                </div>
                <p className="text-white text-sm font-medium mt-6 bg-black/40 px-4 py-2 rounded-full backdrop-blur-md">
                  Inquadra il QR Code
                </p>
              </div>

              {/* Controlli Camera */}
              <div className="absolute bottom-6 right-6 flex gap-4 z-20">
                <button className="p-3 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/30 transition-all">
                  <Flashlight size={20} />
                </button>
              </div>
            </>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 text-white p-8 text-center">
              <Camera size={48} className="mb-4 text-gray-600" />
              <h3 className="font-bold text-lg mb-2">Fotocamera in pausa</h3>
              <button
                onClick={() => setCameraActive(true)}
                className={`px-6 py-3 bg-[${HOGU_COLORS.primary}] text-white rounded-xl font-bold shadow-lg hover:scale-105 transition-transform`}
              >
                Attiva Fotocamera
              </button>
            </div>
          )}
        </div>

        {/* INSERIMENTO MANUALE */}
        <form onSubmit={handleManualSubmit} className="bg-white p-4 rounded-[1.5rem] shadow-sm border border-gray-100 flex items-center gap-3">
          <Keyboard size={24} className="text-gray-400 shrink-0" />
          <input
            type="text"
            placeholder="O scrivi codice manuale..."
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
            className="w-full bg-transparent outline-none font-medium text-gray-800 placeholder:text-gray-400 uppercase"
          />
          <button
            type="submit"
            disabled={manualCode.trim().length < 1}
            className={`p-2 rounded-xl transition-all ${manualCode.trim().length >= 1 ? `bg-[${HOGU_COLORS.primary}] text-white` : 'bg-gray-100 text-gray-300'}`}
          >
            <ChevronRight size={24} />
          </button>
        </form>

        {/* CRONOLOGIA RECENTE */}
        <div className="mt-2">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2 px-2">
            <History size={14} /> Ultime Scansioni
          </h3>
          <div className="space-y-2">
            {history.length === 0 && (
              <p className="text-center text-sm text-gray-400 py-4 italic">Nessuna scansione recente</p>
            )}
            {history.map((scan, idx) => (
              <div key={idx} className="bg-white p-3 rounded-xl border border-gray-100 flex justify-between items-center shadow-sm">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-10 rounded-full ${scan.status === 'valid' ? 'bg-green-500' : (scan.status === 'used' ? 'bg-orange-400' : 'bg-red-500')}`}></div>
                  <div>
                    <p className="font-bold text-gray-800 text-sm">{scan.code}</p>
                    <p className="text-xs text-gray-500">{scan.timestamp} • {scan.status === 'valid' ? scan.name : 'Errore'}</p>
                  </div>
                </div>
                <div className="text-xs font-bold text-gray-400 uppercase">
                  {scan.status}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* MODALE RISULTATO */}
      <ResultModal result={scannedResult} onReset={resetScanner} />

      {/* CSS INLINE PER ANIMAZIONE SCAN */}
      <style>{`
                @keyframes scan {
                    0% { top: 10%; opacity: 0; }
                    10% { opacity: 1; }
                    90% { opacity: 1; }
                    100% { top: 90%; opacity: 0; }
                }
            `}</style>
    </div>
  );
};

export default QRValidatorPage;

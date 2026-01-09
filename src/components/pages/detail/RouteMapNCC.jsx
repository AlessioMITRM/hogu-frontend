import React, { useEffect, useState } from "react";
import { HOGU_COLORS } from "../../../config/theme.js";
import { 
  MapPin, 
  Clock, 
  Euro, 
  Navigation, 
  Car, 
  CircleDashed, 
  Repeat, 
  ArrowRight
} from "lucide-react";

export const RouteMapNCC = ({
    from,
    fromAddress, // NUOVO: Indirizzo specifico partenza
    to,
    toAddress,   // NUOVO: Indirizzo specifico destinazione
    tripType = "oneway", // "oneway" | "roundtrip"
    className = ""
}) => {
    const [loading, setLoading] = useState(true);
    const [routeData, setRouteData] = useState(null);

    // Costanti per la simulazione del prezzo
    const PRICE_PER_KM = 2.5; 
    const BASE_FEE = 25; 

    const isRoundTrip = tripType === "roundtrip";

    useEffect(() => {
        setLoading(true);
        
        // Simulazione calcolo intelligente
        const timer = setTimeout(() => {
            
            // Dati base simulati
            const baseKm = 38.5; 
            const baseMinutes = 45;

            const totalKm = isRoundTrip ? baseKm * 2 : baseKm;
            const totalMinutes = isRoundTrip ? baseMinutes * 2 : baseMinutes;

            // Calcolo Costo Stimato
            let estimatedCost = (totalKm * PRICE_PER_KM) + BASE_FEE;
            if (isRoundTrip) estimatedCost = estimatedCost * 0.9; 

            setRouteData({
                distance: totalKm.toFixed(1),
                duration: totalMinutes, 
                price: Math.round(estimatedCost),
                // Mappatura label principali (Città/Luogo)
                fromLabel: from || "Punto di Partenza",
                toLabel: to || "Destinazione",
                // Mappatura indirizzi specifici
                fromDetail: fromAddress || "Indirizzo non specificato",
                toDetail: toAddress || "Indirizzo non specificato"
            });
            
            setLoading(false);
        }, 1200);

        return () => clearTimeout(timer);
    }, [from, fromAddress, to, toAddress, tripType, isRoundTrip]);

    // Componente per il Loading
    if (loading) {
        return (
            <div className={`w-full h-96 rounded-2xl border border-gray-100 bg-gray-50 flex flex-col items-center justify-center gap-4 ${className}`}>
                <div className="relative">
                    <div className="w-12 h-12 rounded-full border-4 border-gray-200 border-t-[#68B49B] animate-spin"></div>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-gray-400">
                        <Car size={20} />
                    </div>
                </div>
                <p className="text-gray-500 text-sm font-medium animate-pulse">Calcolo percorso {isRoundTrip ? 'A/R' : ''}...</p>
            </div>
        );
    }

    return (
        <div className={`w-full bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden ${className}`}>
            
            {/* ---- MAPPA SIMULATA (Header) ---- */}
            <div className="relative w-full h-40 bg-slate-50 border-b border-gray-100 p-6 flex items-center justify-center overflow-hidden">
                {/* Pattern di sfondo */}
                <div className="absolute inset-0 opacity-[0.03]" 
                     style={{ backgroundImage: 'radial-gradient(#444 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
                </div>
                
                {/* Badge Tipo Viaggio */}
                <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full border border-gray-200 shadow-sm z-20">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1">
                        {isRoundTrip ? (
                            <><Repeat size={12} className="text-[#68B49B]" /> Andata e Ritorno</>
                        ) : (
                            <><ArrowRight size={12} className="text-[#68B49B]" /> Solo Andata</>
                        )}
                    </span>
                </div>
                
                {/* Visualizzazione Grafica Percorso */}
                <div className="relative z-10 flex items-center justify-between w-full max-w-md px-4">
                    {/* Punto A */}
                    <div className="flex flex-col items-center gap-2 z-10">
                        <div className={`w-4 h-4 rounded-full border-4 border-white shadow-md bg-gray-400 ring-1 ring-gray-200`}></div>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Start</span>
                    </div>

                    {/* Linea di connessione */}
                    <div className="absolute left-0 right-0 top-[8px] h-[2px] bg-gray-200 mx-12 overflow-hidden">
                        <div className={`absolute inset-0 bg-[#68B49B] w-1/2 animate-[moveRight_2s_infinite_linear]`}></div>
                        {isRoundTrip && (
                            <div className={`absolute inset-0 bg-[#68B49B]/30 w-1/2 animate-[moveLeft_2s_infinite_linear] delay-1000`}></div>
                        )}
                    </div>

                    {/* Auto */}
                    <div className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white p-2 rounded-full shadow-sm border border-gray-100 text-[#68B49B] z-20`}>
                        <Car size={20} />
                    </div>

                    {/* Punto B */}
                    <div className="flex flex-col items-center gap-2 z-10">
                        <div className={`w-4 h-4 rounded-full border-4 border-white shadow-md bg-[#68B49B] ring-1 ring-green-100`}></div>
                        <span className={`text-[10px] font-bold text-[#68B49B] uppercase tracking-wider`}>
                            {isRoundTrip ? 'Giro' : 'Arrivo'}
                        </span>
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes moveRight {
                    0% { transform: translateX(-100%); opacity: 0; }
                    50% { opacity: 1; }
                    100% { transform: translateX(200%); opacity: 0; }
                }
                @keyframes moveLeft {
                    0% { transform: translateX(200%); opacity: 0; }
                    50% { opacity: 1; }
                    100% { transform: translateX(-100%); opacity: 0; }
                }
            `}</style>

            {/* ---- DETTAGLI PERCORSO (Body) ---- */}
            <div className="p-6">
                {/* Indirizzi Timeline Verticale */}
                <div className="flex flex-col gap-0 mb-8 relative">
                    
                    {/* STEP 1: PARTENZA */}
                    <div className="flex gap-4 items-start relative z-10 pb-6">
                        {/* Linea verticale */}
                        <div className="absolute left-[9px] top-6 bottom-0 w-0 border-l border-dashed border-gray-300"></div>
                        
                        <CircleDashed className="text-gray-400 mt-1 flex-shrink-0 bg-white relative z-10" size={20} />
                        <div>
                            <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-0.5">Partenza</p>
                            <p className="text-gray-900 font-bold text-sm leading-tight">{routeData.fromLabel}</p>
                            {/* Dettaglio Indirizzo */}
                            <p className="text-gray-500 text-xs mt-1">{routeData.fromDetail}</p>
                        </div>
                    </div>

                    {/* STEP 2: DESTINAZIONE */}
                    <div className={`flex gap-4 items-start relative z-10 ${isRoundTrip ? 'pb-6' : ''}`}>
                        {isRoundTrip && (
                            <div className="absolute left-[9px] top-6 bottom-0 w-0 border-l border-dashed border-gray-300"></div>
                        )}

                        <MapPin className="text-[#68B49B] mt-1 flex-shrink-0 bg-white relative z-10" size={20} />
                        <div>
                            <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-0.5">Destinazione</p>
                            <p className="text-gray-900 font-bold text-sm leading-tight">{routeData.toLabel}</p>
                            {/* Dettaglio Indirizzo */}
                            <p className="text-gray-500 text-xs mt-1">{routeData.toDetail}</p>
                        </div>
                    </div>

                    {/* STEP 3: RITORNO (Visibile solo se RoundTrip) */}
                    {isRoundTrip && (
                        <div className="flex gap-4 items-start relative z-10 animate-in slide-in-from-top-2 fade-in duration-500">
                            <Repeat className="text-indigo-400 mt-1 flex-shrink-0 bg-white relative z-10" size={20} />
                            <div>
                                <p className="text-xs text-indigo-400 font-semibold uppercase tracking-wide mb-0.5">Ritorno</p>
                                <p className="text-gray-900 font-bold text-sm leading-tight">{routeData.fromLabel}</p>
                                {/* Torna all'indirizzo di partenza */}
                                <p className="text-gray-500 text-xs mt-1">{routeData.fromDetail}</p>
                            </div>
                        </div>
                    )}
                </div>

                <div className="h-px w-full bg-gray-100 mb-6"></div>

                {/* ---- GRID DATI (Metri e Costi) ---- */}
                <div className="grid grid-cols-3 gap-4">
                    
                    {/* Distanza */}
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1 text-gray-400">
                            <Navigation size={14} />
                            <span className="text-xs font-medium">Totale</span>
                        </div>
                        <p className="text-lg font-bold text-gray-700">{routeData.distance} km</p>
                    </div>

                    {/* Durata */}
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1 text-gray-400">
                            <Clock size={14} />
                            <span className="text-xs font-medium">Durata</span>
                        </div>
                        <p className="text-lg font-bold text-gray-700">~ {routeData.duration} min</p>
                    </div>

                    {/* COSTO STIMATO */}
                    <div className="flex flex-col gap-1 bg-green-50 -m-2 p-2 rounded-lg border border-green-100/50">
                        <div className="flex items-center gap-1 text-[#68B49B]">
                            <Euro size={14} />
                            <span className="text-xs font-bold uppercase">Stima</span>
                        </div>
                        <p className="text-xl font-extrabold text-[#68B49B]">
                            € {routeData.price}
                        </p>
                    </div>
                </div>

                <p className="text-[10px] text-gray-400 mt-4 text-center">
                    * {isRoundTrip ? 'Tariffa scontata A/R inclusa.' : 'Tariffa standard.'} Il prezzo finale può subire variazioni.
                </p>
            </div>
        </div>
    );
};
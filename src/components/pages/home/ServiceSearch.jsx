import React, { useState, useMemo, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import {
    Utensils, Home, CarFront, Music, Luggage, Search,
    Calendar, MapPin, Clock, Users, Ticket, GlassWater,
    Check, Star, Minus, Plus, Briefcase, Navigation, Loader2,
    ArrowRight, ChevronLeft, ChevronDown, Plane, Train
} from 'lucide-react';
import { CityAutocomplete } from '../../ui/CityAutocomplete.jsx';
const MOBILE_FONT = "font-['SF_Pro_Text',_Roboto,_Inter,_system-ui,_sans-serif]";

const PRESET_LOCATIONS = [
    { label: "Fiumicino (FCO)", city: "Fiumicino", address: "Aeroporto Leonardo da Vinci", type: "airport" },
    { label: "Ciampino (CIA)", city: "Ciampino", address: "Aeroporto G.B. Pastine", type: "airport" },
    { label: "Malpensa (MXP)", city: "Ferno", address: "Aeroporto Malpensa", type: "airport" },
    { label: "Linate (LIN)", city: "Segrate", address: "Aeroporto Linate", type: "airport" },
    { label: "Roma Termini", city: "Roma", address: "Stazione Termini", type: "station" },
    { label: "Milano Centrale", city: "Milano", address: "Stazione Centrale", type: "station" }
];

// --- CONFIGURAZIONE E TEMA ---
const HOGU_COLORS = {
    primary: '#68B49B',
    dark: '#1A202C',
    subtleText: '#64748B',
};

const HOGU_THEME = {
    fontFamily: 'font-sans',
};

// --- HELPER DATE & TIME ---
const getTodayDate = () => new Date().toISOString().split('T')[0];

const getDefaultTime = (dateStr) => {
    const todayStr = getTodayDate();
    const PREFERRED_HOUR = 11; // Orario preferito: 11:00

    // Se la data è nel futuro (non oggi), ritorna l'orario preferito
    if (dateStr > todayStr) return `${PREFERRED_HOUR}:00`;

    // Se è oggi
    const now = new Date();
    // Calcola il tempo minimo accettabile (adesso + 1 ora buffer per prenotazione)
    const minTime = new Date(now.getTime() + 60 * 60000);

    // Controlla se l'orario preferito (11:00) è ancora valido per oggi
    const targetTime = new Date();
    targetTime.setHours(PREFERRED_HOUR, 0, 0, 0);

    if (targetTime > minTime) {
        return `${PREFERRED_HOUR}:00`;
    }

    // Altrimenti calcola il primo slot disponibile successivo
    const minutes = minTime.getMinutes();
    let hours = minTime.getHours();

    let finalMinutes = "00";
    if (minutes < 30) {
        finalMinutes = "30";
    } else {
        finalMinutes = "00";
        hours += 1;
    }

    // Gestione overflow giorno
    if (hours >= 24) return "23:30";

    return `${String(hours).padStart(2, '0')}:${finalMinutes}`;
};

// --- COMPONENTI UI BASE ---

// Gestione Slot 30 min + Logica Ora Futura
const TimeSlotSelect = ({ value, onChange, date, className = '' }) => {
    const generateTimeSlots = () => {
        const slots = [];
        for (let i = 0; i < 24; i++) {
            const hour = i.toString().padStart(2, '0');
            slots.push(`${hour}:00`);
            slots.push(`${hour}:30`);
        }
        return slots;
    };

    const availableSlots = useMemo(() => {
        const allSlots = generateTimeSlots();
        const todayStr = getTodayDate();

        if (date === todayStr) {
            const now = new Date();
            // Calcola il tempo minimo accettabile (adesso + 30 min)
            const minTime = new Date(now.getTime() + 30 * 60000);

            return allSlots.filter(slot => {
                const [h, m] = slot.split(':').map(Number);
                const slotDate = new Date();
                slotDate.setHours(h, m, 0, 0);
                return slotDate > minTime;
            });
        }
        return allSlots;
    }, [date]);

    // Effetto per correggere automaticamente l'orario se non è valido
    useEffect(() => {
        if (value && availableSlots.length > 0 && !availableSlots.includes(value)) {
            // Se il valore corrente non è tra quelli disponibili, seleziona il primo disponibile
            onChange({ target: { value: availableSlots[0] } });
        }
    }, [availableSlots, value, onChange]);

    return (
        <div className="relative w-full h-full">
            <select
                value={value}
                onChange={onChange}
                className={`w-full h-full px-3 bg-transparent border-none outline-none text-base font-medium text-gray-700 appearance-none cursor-pointer ${className}`}
            >
                {/* Rimosso placeholder disabled per forzare selezione valida */}
                {availableSlots.map(slot => (
                    <option key={slot} value={slot}>{slot}</option>
                ))}
                {availableSlots.length === 0 && <option disabled>Nessuno slot disp.</option>}
            </select>
        </div>
    );
};



const PrimaryButton = ({ children, type = 'button', className = '', onClick }) => (
    <button
        type={type}
        onClick={onClick}
        className={`bg-[#68B49B] text-white ${HOGU_THEME.fontFamily} ${MOBILE_FONT} px-6 py-3 lg:px-8 lg:py-4 text-[16px] leading-[20px] font-semibold lg:text-lg lg:font-bold rounded-2xl transition-all duration-300 ease-out shadow-[0_8px_20px_-6px_rgba(104,180,155,0.5)] hover:shadow-[0_12px_25px_-8px_rgba(104,180,155,0.7)] hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2 ${className}`}
    >
        {children}
    </button>
);

// Inline: usa direttamente il pattern con spacer label per allineamento perfetto

// --- MODAL LUGGAGE: Deposito/Ritiro ---
function MobileScheduleModal({ lugDateFrom, lugTimeFrom, lugDateTo, lugTimeTo, setLugDateFrom, setLugTimeFrom, setLugDateTo, setLugTimeTo, today, getDefaultTime }) {
    const [isOpen, setIsOpen] = useState(false);

    const formatDateTime = (date, time) => {
        if (!date) return '-';
        const d = new Date(date).toLocaleDateString('it-IT', { day: '2-digit', month: 'short' });
        return `${d} ${time || ''}`;
    };

    return (
        <>
            <div className="w-full h-full px-2 text-left flex items-center justify-between cursor-pointer" onClick={() => setIsOpen(true)}>
                <div className="flex items-center justify-between w-full">
                    <span className={`${MOBILE_FONT} text-[16px] leading-[24px] font-semibold text-gray-800 truncate flex-1 text-left`}>{formatDateTime(lugDateFrom, lugTimeFrom)}</span>
                    <ArrowRight size={12} className="text-gray-400 mx-1 flex-shrink-0" />
                    <span className={`${MOBILE_FONT} text-[16px] leading-[24px] font-semibold text-gray-800 truncate flex-1 text-right`}>{formatDateTime(lugDateTo, lugTimeTo)}</span>
                </div>
                <ChevronDown size={14} className="text-gray-400 flex-shrink-0 ml-1" />
            </div>

            {isOpen && createPortal(
                <div className="fixed inset-0 z-[9999] bg-gray-50 flex flex-col animate-in fade-in slide-in-from-bottom-10 duration-200">
                    <div className="px-4 py-4 bg-white border-b border-gray-100 flex items-center gap-3 shadow-sm z-10">
                        <button onClick={() => setIsOpen(false)} className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors" type="button">
                            <ChevronLeft size={24} className="text-gray-700" />
                        </button>
                        <h3 className={`${MOBILE_FONT} text-[22px] leading-[28px] font-semibold text-gray-800`}>Seleziona Orari</h3>
                    </div>

                    <div className="p-4 flex flex-col gap-4 overflow-y-auto flex-1">
                        <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100">
                            <h4 className={`${MOBILE_FONT} text-[12px] leading-[16px] font-normal text-[#68B49B] flex items-center gap-2 mb-3 uppercase tracking-wide`}>
                                <Calendar size={18} /> Deposito
                            </h4>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="flex flex-col gap-1.5">
                                    <label className={`${MOBILE_FONT} text-[12px] leading-[16px] font-normal uppercase tracking-wide text-[#64748B] ml-1`}>Data</label>
                                    <div className="relative">
                                        <input type="date" className="w-full h-[56px] px-3 bg-gray-50 rounded-2xl border-transparent focus:bg-white focus:border-[#68B49B] focus:ring-4 focus:ring-[#68B49B]/10 outline-none font-bold text-gray-700 transition-all text-sm appearance-none"
                                            value={lugDateFrom} min={today}
                                            onChange={(e) => { const d = e.target.value; setLugDateFrom(d); setLugTimeFrom(getDefaultTime(d)); }} />
                                        <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
                                    </div>
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <label className={`${MOBILE_FONT} text-[12px] leading-[16px] font-normal uppercase tracking-wide text-[#64748B] ml-1`}>Ora</label>
                                    <div className="relative">
                                        <input type="time" className={`w-full h-[56px] px-3 bg-gray-50 rounded-2xl border-transparent focus:bg-white focus:border-[#68B49B] focus:ring-4 focus:ring-[#68B49B]/10 outline-none ${MOBILE_FONT} text-[16px] leading-[24px] font-semibold text-gray-700 transition-all appearance-none`}
                                            value={lugTimeFrom} onChange={(e) => setLugTimeFrom(e.target.value)} />
                                        <Clock className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-center -my-2 relative z-0">
                            <div className="bg-gray-200 text-gray-400 rounded-full p-1.5 ring-4 ring-gray-50">
                                <ArrowRight size={16} className="rotate-90" />
                            </div>
                        </div>

                        <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100">
                            <h4 className={`${MOBILE_FONT} text-[12px] leading-[16px] font-normal text-[#68B49B] flex items-center gap-2 mb-3 uppercase tracking-wide`}>
                                <Clock size={18} /> Ritiro
                            </h4>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="flex flex-col gap-1.5">
                                    <label className={`${MOBILE_FONT} text-[12px] leading-[16px] font-normal uppercase tracking-wide text-[#64748B] ml-1`}>Data</label>
                                    <div className="relative">
                                        <input type="date" className="w-full h-[56px] px-3 bg-gray-50 rounded-2xl border-transparent focus:bg-white focus:border-[#68B49B] focus:ring-4 focus:ring-[#68B49B]/10 outline-none font-bold text-gray-700 transition-all text-sm appearance-none"
                                            value={lugDateTo} min={lugDateFrom || today}
                                            onChange={(e) => { const d = e.target.value; setLugDateTo(d); setLugTimeTo(getDefaultTime(d)); }} />
                                        <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
                                    </div>
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <label className={`${MOBILE_FONT} text-[12px] leading-[16px] font-normal uppercase tracking-wide text-[#64748B] ml-1`}>Ora</label>
                                    <div className="relative">
                                        <input type="time" className={`w-full h-[56px] px-3 bg-gray-50 rounded-2xl border-transparent focus:bg-white focus:border-[#68B49B] focus:ring-4 focus:ring-[#68B49B]/10 outline-none ${MOBILE_FONT} text-[16px] leading-[24px] font-semibold text-gray-700 transition-all appearance-none`}
                                            value={lugTimeTo} onChange={(e) => setLugTimeTo(e.target.value)} />
                                        <Clock className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-auto p-4 border-t border-gray-100 bg-white shadow-[0_-4px_20px_-8px_rgba(0,0,0,0.1)] z-10">
                        <PrimaryButton onClick={() => setIsOpen(false)} className="w-full !rounded-xl !py-4 text-base shadow-lg" type="button">
                            Conferma Orari
                        </PrimaryButton>
                    </div>
                </div>,
                document.body
            )}
        </>
    );
}

// --- MODAL LUGGAGE: Selezione bagagli ---
function MobileBagsModal({ luggageCounts, updateLuggage }) {
    const [isOpen, setIsOpen] = useState(false);
    const totalBags = luggageCounts.hand + luggageCounts.medium + luggageCounts.xxl;

    const sizes = [
        { id: 'hand', label: 'A Mano', desc: 'Zaino, borsa piccola', emoji: '🎒' },
        { id: 'medium', label: 'Medio', desc: 'Trolley cabina, valigia media', emoji: '🧳' },
        { id: 'xxl', label: 'Grande XXL', desc: 'Valigia grande, oltre 20kg', emoji: '📦' },
    ];

    return (
        <>
            <div className="w-full h-full px-2 text-left flex items-center justify-between cursor-pointer" onClick={() => setIsOpen(true)}>
                <span className={`${MOBILE_FONT} text-[16px] leading-[24px] font-semibold text-gray-800`}>{totalBags > 0 ? `${totalBags} Bagagli` : 'Seleziona'}</span>
                <div className="flex items-center gap-1">
                    <div className="flex gap-1 overflow-hidden justify-end">
                        {sizes.map(s => luggageCounts[s.id] > 0 && (
                            <span key={s.id} className={`${MOBILE_FONT} text-[12px] leading-[16px] font-normal bg-gray-100 px-1 py-0.5 rounded text-gray-500 whitespace-nowrap`}>{luggageCounts[s.id]}x{s.label.split(' ')[0]}</span>
                        ))}
                    </div>
                    <ChevronDown size={14} className="text-gray-400 flex-shrink-0" />
                </div>
            </div>

            {isOpen && createPortal(
                <div className="fixed inset-0 z-[99999] bg-white flex flex-col animate-in fade-in slide-in-from-bottom-10 duration-200">
                    <div className="px-4 py-4 border-b border-gray-100 flex items-center gap-3">
                        <button onClick={() => setIsOpen(false)} className="p-2 -ml-2 rounded-full hover:bg-gray-100" type="button">
                            <ChevronLeft size={24} className="text-gray-700" />
                        </button>
                        <h3 className={`${MOBILE_FONT} text-[22px] leading-[28px] font-semibold text-gray-800`}>Seleziona Bagagli</h3>
                    </div>

                    <div className="p-6 flex flex-col bg-white">
                        {sizes.map((s, idx) => {
                            const count = luggageCounts[s.id];
                            const isSelected = count > 0;
                            const iconSize = s.id === 'hand' ? 18 : s.id === 'medium' ? 26 : 34;

                            return (
                                <div key={s.id} className={`flex items-center justify-between py-5 ${idx !== sizes.length - 1 ? 'border-b border-gray-100' : ''}`}>
                                    <div className="flex items-center gap-4">
                                        <div className={`w-12 h-12 flex items-center justify-center rounded-full transition-colors ${isSelected ? 'bg-[#68B49B]/10 text-[#68B49B]' : 'bg-gray-50 text-gray-400'}`}>
                                            <Luggage size={iconSize} />
                                        </div>
                                        <div>
                                            <p className={`${MOBILE_FONT} text-[16px] leading-[24px] font-semibold text-gray-800`}>{s.label}</p>
                                            <p className={`${MOBILE_FONT} text-[12px] leading-[16px] font-normal text-gray-500`}>{s.desc}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <button type="button" onClick={() => updateLuggage(s.id, -1)} disabled={count === 0}
                                            className="w-10 h-10 rounded-full border border-gray-200 text-gray-500 flex items-center justify-center transition-colors disabled:opacity-30">
                                            <Minus size={18} strokeWidth={3} />
                                        </button>
                                        <span className={`${MOBILE_FONT} text-[18px] leading-[24px] font-black text-gray-800 w-5 text-center`}>{count}</span>
                                        <button type="button" onClick={() => updateLuggage(s.id, 1)}
                                            className="w-10 h-10 rounded-full bg-[#68B49B] text-white flex items-center justify-center transition-transform active:scale-90 shadow-md">
                                            <Plus size={18} strokeWidth={3} />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="mt-auto p-4 border-t border-gray-100 bg-white">
                        <PrimaryButton onClick={() => setIsOpen(false)} className="w-full !rounded-xl !py-3" type="button">
                            Conferma ({totalBags})
                        </PrimaryButton>
                    </div>
                </div>,
                document.body
            )}
        </>
    );
}

// --- MODAL NCC: Selezione Località ---
function MobileLocationSelector({ label, icon: Icon, city, address, onSelect, placeholder }) {
    const [isOpen, setIsOpen] = useState(false);
    const [tempCity, setTempCity] = useState(city);
    const [tempAddress, setTempAddress] = useState(address);

    useEffect(() => {
        if (isOpen) {
            setTempCity(city);
            setTempAddress(address);
        }
    }, [isOpen, city, address]);

    const handleConfirm = () => {
        onSelect(tempCity, tempAddress);
        setIsOpen(false);
    };

    const handlePresetClick = (preset) => {
        onSelect(preset.city, preset.address);
        setIsOpen(false);
    };

    return (
        <>
            <div className="w-full h-full px-2 text-left flex items-center justify-between cursor-pointer" onClick={() => setIsOpen(true)}>
                <div className="flex flex-col overflow-hidden w-full pr-2">
                    <span className={`${MOBILE_FONT} text-[16px] leading-[24px] font-semibold truncate ${city ? 'text-gray-800' : 'text-gray-400'}`}>
                        {city || placeholder}
                    </span>
                    {address && <span className={`${MOBILE_FONT} text-[12px] leading-[16px] font-normal text-gray-500 truncate`}>{address}</span>}
                </div>
                <ChevronDown size={14} className="text-gray-400 flex-shrink-0" />
            </div>

            {isOpen && createPortal(
                <div className="fixed inset-0 z-[99999] bg-white flex flex-col animate-in fade-in slide-in-from-bottom-10 duration-200">
                    <div className="px-4 py-4 border-b border-gray-100 flex items-center gap-3 shadow-sm z-10">
                        <button onClick={() => setIsOpen(false)} className="p-2 -ml-2 rounded-full hover:bg-gray-100" type="button">
                            <ChevronLeft size={24} className="text-gray-700" />
                        </button>
                        <h3 className={`${MOBILE_FONT} text-[22px] leading-[28px] font-semibold text-gray-800`}>Seleziona {label}</h3>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-6 safe-area-bottom">
                        <div className="flex flex-col gap-4">
                            <CityAutocomplete
                                label="Città"
                                icon={MapPin}
                                value={tempCity}
                                onChange={setTempCity}
                                placeholder="Cerca città..."
                                className="z-[50]"
                            />
                            <div className="flex flex-col gap-2">
                                <label className={`flex items-center gap-2 ${MOBILE_FONT} text-[12px] leading-[16px] font-normal uppercase tracking-wide text-gray-400 ml-1`}>
                                    <Navigation size={14} className="text-[#68B49B]" /> Indirizzo
                                </label>
                                <input
                                    type="text"
                                    className="w-full p-4 bg-gray-50 rounded-xl border border-gray-200 focus:border-[#68B49B] outline-none font-medium text-gray-700"
                                    placeholder="Via / Civico / Aeroporto"
                                    value={tempAddress}
                                    onChange={(e) => setTempAddress(e.target.value)}
                                />
                            </div>
                        </div>

                        <div>
                            <p className={`${MOBILE_FONT} text-[12px] leading-[16px] font-normal text-gray-400 uppercase tracking-wide mb-3`}>Suggeriti</p>
                            <div className="grid grid-cols-2 gap-3">
                                {PRESET_LOCATIONS.map((p, i) => (
                                    <button
                                        key={i}
                                        onClick={() => handlePresetClick(p)}
                                        className="flex flex-col items-start p-3 rounded-xl border border-gray-100 bg-gray-50 hover:border-[#68B49B] hover:bg-[#F0FDF9] transition-all text-left"
                                        type="button"
                                    >
                                        <div className="flex items-center gap-2 mb-1">
                                            {p.type === 'airport' ? <Plane size={14} className="text-blue-500" /> : <Train size={14} className="text-orange-500" />}
                                            <span className={`${MOBILE_FONT} text-[14px] leading-[20px] font-semibold text-gray-800`}>{p.label}</span>
                                        </div>
                                        <span className={`${MOBILE_FONT} text-[12px] leading-[16px] font-normal text-gray-500 truncate w-full`}>{p.city}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="p-4 border-t border-gray-100 bg-white shadow-[0_-4px_20px_-8px_rgba(0,0,0,0.1)] z-10">
                        <PrimaryButton onClick={handleConfirm} className="w-full !rounded-xl !py-3">
                            Conferma Selezione
                        </PrimaryButton>
                    </div>
                </div>,
                document.body
            )}
        </>
    );
}

// --- MODAL NCC: Selezione Passeggeri ---
function MobilePassengersModal({ value, onChange }) {
    const [isOpen, setIsOpen] = useState(false);

    const handleIncrement = () => onChange(Math.min(16, value + 1));
    const handleDecrement = () => onChange(Math.max(1, value - 1));

    return (
        <>
            <div className="w-full h-full px-2 text-left flex items-center justify-between cursor-pointer" onClick={() => setIsOpen(true)}>
                <span className={`${MOBILE_FONT} text-[16px] leading-[24px] font-semibold text-gray-800`}>{value} {value === 1 ? 'Passeggero' : 'Passeggeri'}</span>
                <ChevronDown size={14} className="text-gray-400 flex-shrink-0" />
            </div>

            {isOpen && createPortal(
                <div className="fixed inset-0 z-[99999] bg-white flex flex-col animate-in fade-in slide-in-from-bottom-10 duration-200">
                    <div className="px-4 py-4 border-b border-gray-100 flex items-center gap-3">
                        <button onClick={() => setIsOpen(false)} className="p-2 -ml-2 rounded-full hover:bg-gray-100" type="button">
                            <ChevronLeft size={24} className="text-gray-700" />
                        </button>
                        <h3 className={`${MOBILE_FONT} text-[22px] leading-[28px] font-semibold text-gray-800`}>Numero Passeggeri</h3>
                    </div>

                    <div className="p-8 flex flex-col items-center justify-center flex-1">
                        <div className="w-24 h-24 bg-[#68B49B]/10 rounded-full flex items-center justify-center mb-6">
                            <Users size={40} className="text-[#68B49B]" />
                        </div>
                        <p className={`${MOBILE_FONT} text-[14px] leading-[20px] font-normal text-gray-500 mb-8 text-center`}>Quante persone viaggiano?</p>

                        <div className="flex items-center gap-8">
                            <button type="button" onClick={handleDecrement} disabled={value <= 1}
                                className="w-14 h-14 rounded-full border-2 border-gray-100 text-gray-400 flex items-center justify-center transition-all active:scale-90 disabled:opacity-30">
                                <Minus size={24} strokeWidth={3} />
                            </button>
                            <span className={`${MOBILE_FONT} text-[48px] leading-[56px] font-black text-gray-800 w-16 text-center`}>{value}</span>
                            <button type="button" onClick={handleIncrement} disabled={value >= 16}
                                className="w-14 h-14 rounded-full bg-[#68B49B] text-white flex items-center justify-center transition-all active:scale-90 shadow-lg shadow-emerald-500/20">
                                <Plus size={24} strokeWidth={3} />
                            </button>
                        </div>
                    </div>

                    <div className="p-4 border-t border-gray-100 bg-white">
                        <PrimaryButton onClick={() => setIsOpen(false)} className="w-full !rounded-xl !py-3">
                            Conferma Passeggeri
                        </PrimaryButton>
                    </div>
                </div>,
                document.body
            )}
        </>
    );
}

const SearchInputContainer = ({ label, icon: Icon, children, className = '', required = false }) => (

    <div className={`flex flex-col gap-1 lg:gap-2 ${className}`}>
        <label className={`flex items-center gap-1.5 ${MOBILE_FONT} text-[12px] leading-[16px] font-normal uppercase tracking-wide md:text-sm md:font-bold text-[#64748B] ml-1`}>
            {Icon && <Icon size={12} className={`text-[${HOGU_COLORS.primary}] lg:size-[14px]`} />}
            {label} {required && <span className="text-red-500">*</span>}
        </label>
        <div className="flex gap-2 bg-gray-50 hover:bg-white p-1 lg:p-1.5 rounded-xl lg:rounded-2xl border border-gray-200 hover:border-[#68B49B] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#68B49B]/20 focus-within:border-[#68B49B] transition-all h-[42px] lg:h-[64px] items-center relative overflow-hidden w-full">
            {children}
        </div>
    </div>
);

const LuggageCard = ({ label, count, onIncrement, onDecrement, icon: Icon }) => {
    const isSelected = count > 0;
    return (
        <div className={`flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all duration-200 flex-1 min-w-[100px] ${isSelected ? 'border-[#68B49B] bg-[#F0FDF9]' : 'border-gray-100 bg-white hover:border-gray-200'}`}>
            <div className={`p-2 rounded-full mb-1 ${isSelected ? 'bg-[#68B49B]/10 text-[#68B49B]' : 'bg-gray-50 text-gray-400'}`}>
                <Icon size={20} />
            </div>
            <span className={`text-xs font-bold mb-2 ${isSelected ? 'text-[#33594C]' : 'text-gray-600'}`}>{label}</span>
            <div className="flex items-center gap-2">
                <button type="button" onClick={onDecrement} disabled={count === 0} className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${count === 0 ? 'bg-gray-100 text-gray-300' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}>
                    <Minus size={12} strokeWidth={3} />
                </button>
                <span className="text-sm font-bold w-4 text-center">{count}</span>
                <button type="button" onClick={onIncrement} className="w-6 h-6 rounded-full bg-[#68B49B]/10 text-[#68B49B] hover:bg-[#68B49B] hover:text-white flex items-center justify-center transition-colors">
                    <Plus size={12} strokeWidth={3} />
                </button>
            </div>
        </div>
    );
};

// --- COMPONENTE PRINCIPALE ---

export const ServiceSearch = () => {
    const navigate = useNavigate();
    const today = getTodayDate();

    const serviceCategories = [
        { name: 'Ristoranti', route: '/service/restaurant', icon: Utensils, id: 'Ristoranti' },
        { name: 'B&B', route: '/service/bnb', icon: Home, id: 'B&B' },
        { name: 'NCC', route: '/service/ncc', icon: CarFront, id: 'NCC' },
        { name: 'Club', route: '/service/club', icon: Music, id: 'Club' },
        { name: 'Bagagli', route: '/service/luggage', icon: Luggage, id: 'Luggage' },
    ];

    const [activeTab, setActiveTab] = useState(serviceCategories[0].name);

    // --- STATI ---
    const [location, setLocation] = useState("");

    // Default Time calculation
    const defaultTime = getDefaultTime(today);

    // Ristoranti
    const [restCuisine, setRestCuisine] = useState("");
    const [restDate, setRestDate] = useState(today);
    const [restTime, setRestTime] = useState(defaultTime);

    // B&B
    const [bnbCheckIn, setBnbCheckIn] = useState(today);
    const [bnbCheckOut, setBnbCheckOut] = useState("");
    const [bnbGuests, setBnbGuests] = useState("2");

    // Club
    const [clubType, setClubType] = useState("");
    const [clubDate, setClubDate] = useState(today);
    const [clubGuests, setClubGuests] = useState("2");
    const [reserveTable, setReserveTable] = useState(false);

    // Luggage
    const [lugDateFrom, setLugDateFrom] = useState(today);
    const [lugTimeFrom, setLugTimeFrom] = useState(defaultTime);
    const [lugDateTo, setLugDateTo] = useState(today);
    const [lugTimeTo, setLugTimeTo] = useState(defaultTime);
    const [luggageCounts, setLuggageCounts] = useState({ hand: 0, medium: 1, xxl: 0 });

    // NCC
    const [nccFromCity, setNccFromCity] = useState("");
    const [nccFromAddress, setNccFromAddress] = useState("");
    const [nccToCity, setNccToCity] = useState("");
    const [nccToAddress, setNccToAddress] = useState("");
    const [nccDate, setNccDate] = useState(today);
    const [nccTime, setNccTime] = useState(defaultTime);
    const [nccPassengers, setNccPassengers] = useState(1);

    const updateLuggage = (type, delta) => {
        setLuggageCounts(prev => ({ ...prev, [type]: Math.max(0, prev[type] + delta) }));
    };

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        const activeCategory = serviceCategories.find(cat => cat.name === activeTab);
        if (!activeCategory) return;

        const params = new URLSearchParams();

        switch (activeCategory.id) {
            case 'Ristoranti':
                params.append('location', location);
                if (restDate) params.append('date', restDate);
                if (restTime) params.append('time', restTime);
                if (restCuisine) params.append('cuisine', restCuisine);
                break;

            case 'B&B':
                params.append('location', location);
                if (bnbCheckIn) params.append('dateFrom', bnbCheckIn);
                if (bnbCheckOut) params.append('dateTo', bnbCheckOut);
                params.append('adults', bnbGuests);
                params.append('children', '0');
                params.append('rooms', '1');
                break;

            case 'Club':
                params.append('location', location);
                params.append('table', reserveTable);
                if (clubType) params.append('eventType', clubType);
                if (clubDate) params.append('date', clubDate);
                break;

            case 'NCC':
                params.append('fromCity', nccFromCity);
                params.append('fromAddress', nccFromAddress);
                params.append('toCity', nccToCity);
                params.append('toAddress', nccToAddress);
                if (nccDate) params.append('date', nccDate);
                if (nccTime) params.append('time', nccTime);
                params.append('passengers', nccPassengers);
                break;

            case 'Luggage':
                params.append('location', location);
                if (lugDateFrom) params.append('dateFrom', lugDateFrom);
                if (lugTimeFrom) params.append('timeFrom', lugTimeFrom);
                if (lugDateTo) params.append('dateTo', lugDateTo);
                if (lugTimeTo) params.append('timeTo', lugTimeTo);
                params.append('bagsS', luggageCounts.hand);
                params.append('bagsM', luggageCounts.medium);
                params.append('bagsL', luggageCounts.xxl);
                break;
            default: break;
        }

        navigate(`${activeCategory.route}?${params.toString()}`);
    };

    const renderFormContent = () => {
        const currentCategory = serviceCategories.find(cat => cat.name === activeTab)?.id;
        const wrapperClass = "flex flex-col lg:flex-row gap-4 items-end w-full animate-in fade-in slide-in-from-bottom-1 duration-300";

        switch (currentCategory) {
            case 'Ristoranti':
                return (
                    <div className={wrapperClass}>
                        <CityAutocomplete
                            label="Dove" icon={MapPin}
                            placeholder="Dove vuoi mangiare?" className="w-full lg:flex-[1.5]"
                            value={location} onChange={setLocation}
                            inputClassName="text-sm lg:text-lg"
                        />
                        <div className="grid grid-cols-2 gap-2 lg:flex lg:gap-3 w-full lg:flex-[2.4]">
                            <SearchInputContainer label="Cucina" icon={Utensils} className="w-full">
                                <input type="text" placeholder="Es. Pesce..." className={`w-full h-full px-2 lg:px-3 bg-transparent border-none focus:ring-0 ${MOBILE_FONT} text-[16px] leading-[24px] font-semibold lg:text-sm lg:font-medium outline-none placeholder:text-gray-400`}
                                    value={restCuisine} onChange={(e) => setRestCuisine(e.target.value)} />
                            </SearchInputContainer>
                            <SearchInputContainer label="Data" icon={Calendar} className="w-full">
                                <input type="date" min={today} className={`w-full h-full px-2 bg-transparent border-none outline-none ${MOBILE_FONT} text-[16px] leading-[24px] font-semibold lg:text-sm lg:font-medium text-gray-600`}
                                    value={restDate} onChange={(e) => {
                                        const newDate = e.target.value;
                                        setRestDate(newDate);
                                        setRestTime(getDefaultTime(newDate));
                                    }} />
                            </SearchInputContainer>
                            <SearchInputContainer label="Ora" icon={Clock} className="w-full">
                                <TimeSlotSelect value={restTime} date={restDate} onChange={(e) => setRestTime(e.target.value)} />
                            </SearchInputContainer>
                            <div className="flex flex-col gap-1">
                                <span className="text-[9px] font-bold uppercase tracking-wide opacity-0 select-none ml-1">_</span>
                                <PrimaryButton type="submit" className="w-full h-[42px] lg:h-[64px] !rounded-xl lg:!rounded-2xl !px-4 lg:!px-8 shadow-lg shadow-emerald-500/20">
                                    <Search size={16} strokeWidth={2.5} />
                                    <span className={`lg:hidden ${MOBILE_FONT} text-[12px] leading-[16px] font-semibold uppercase tracking-wider`}>Cerca</span>
                                </PrimaryButton>
                            </div>
                        </div>
                    </div>
                );

            case 'B&B':
                return (
                    <div className={wrapperClass}>
                        <CityAutocomplete
                            label="Destinazione" icon={MapPin} placeholder="Dove vuoi andare?" className="w-full lg:flex-[2]"
                            value={location} onChange={setLocation}
                            inputClassName="text-sm lg:text-lg"
                        />
                        <div className="grid grid-cols-2 gap-2 lg:flex lg:gap-3 w-full lg:flex-[2.7]">
                            <SearchInputContainer label="Check-in" icon={Calendar} className="w-full">
                                <input type="date" min={today} className={`w-full h-full px-2 bg-transparent border-none outline-none ${MOBILE_FONT} text-[16px] leading-[24px] font-semibold lg:text-sm lg:font-medium text-gray-600`}
                                    value={bnbCheckIn} onChange={(e) => setBnbCheckIn(e.target.value)} />
                            </SearchInputContainer>
                            <SearchInputContainer label="Check-out" icon={Calendar} className="w-full">
                                <input type="date" min={bnbCheckIn || today} className={`w-full h-full px-2 bg-transparent border-none outline-none ${MOBILE_FONT} text-[16px] leading-[24px] font-semibold lg:text-sm lg:font-medium text-gray-600`}
                                    value={bnbCheckOut} onChange={(e) => setBnbCheckOut(e.target.value)} />
                            </SearchInputContainer>
                            <SearchInputContainer label="Ospiti" icon={Users} className="w-full">
                                <input type="number" min="1" placeholder="2 Ospiti" className={`w-full h-full px-3 bg-transparent border-none focus:ring-0 ${MOBILE_FONT} text-[16px] leading-[24px] font-semibold lg:text-sm lg:font-medium outline-none placeholder:text-gray-400`}
                                    value={bnbGuests} onChange={(e) => setBnbGuests(e.target.value)} />
                            </SearchInputContainer>
                            <div className="flex flex-col gap-1">
                                <span className="text-[9px] font-bold uppercase tracking-wide opacity-0 select-none ml-1">_</span>
                                <PrimaryButton type="submit" className="w-full h-[42px] lg:h-[64px] !rounded-xl lg:!rounded-2xl !px-4 lg:!px-8 shadow-lg shadow-emerald-500/20">
                                    <Search size={16} strokeWidth={2.5} />
                                    <span className={`lg:hidden ${MOBILE_FONT} text-[12px] leading-[16px] font-semibold uppercase tracking-wider`}>Cerca</span>
                                </PrimaryButton>
                            </div>
                        </div>
                    </div>
                );

            case 'Club':
                return (
                    <div className="flex flex-col gap-3 lg:gap-4 w-full animate-in fade-in duration-300">
                        <CityAutocomplete label="Città" icon={MapPin} placeholder="Dove vuoi ballare?" className="w-full lg:flex-[1.5]" value={location} onChange={setLocation} inputClassName="text-sm lg:text-lg" />

                        <div className="flex flex-col lg:flex-row gap-2 lg:gap-4 items-end w-full lg:flex-[2.4]">
                            {/* Desktop & Mobile Grid Logic */}
                            <div className="grid grid-cols-2 gap-2 lg:flex lg:flex-row lg:gap-3 w-full">
                                <SearchInputContainer label="Tipo Evento" icon={Ticket} className="w-full">
                                    <select className={`w-full h-full px-2 lg:px-3 bg-transparent border-none outline-none ${MOBILE_FONT} text-[16px] leading-[24px] font-semibold lg:text-sm lg:font-medium appearance-none cursor-pointer text-gray-700`}
                                        value={clubType} onChange={(e) => setClubType(e.target.value)}>
                                        <option value="">Tutti</option>
                                        <option value="DJ Set">DJ Set</option>
                                        <option value="Live Concert">Live Concert</option>
                                        <option value="Evento Privato">Evento Privato</option>
                                    </select>
                                </SearchInputContainer>
                                <SearchInputContainer label="Data" icon={Calendar} className="w-full">
                                    <input type="date" min={today} className={`w-full h-full px-2 bg-transparent border-none outline-none ${MOBILE_FONT} text-[16px] leading-[24px] font-semibold lg:text-sm lg:font-medium text-gray-600`}
                                        value={clubDate} onChange={(e) => setClubDate(e.target.value)} />
                                </SearchInputContainer>

                                {/* Tavolo toggle */}
                                <div className="flex flex-col gap-1 w-full">
                                    <label className={`flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wide text-[${HOGU_COLORS.subtleText}] ml-1`}>
                                        <GlassWater size={12} className={`text-[${HOGU_COLORS.primary}]`} /> Tavolo
                                    </label>
                                    <div className={`h-[42px] lg:h-[64px] rounded-xl lg:rounded-2xl border cursor-pointer transition-all duration-300 flex items-center justify-between px-3 shadow-sm ${reserveTable ? `bg-[#F0FDF9] border-[#68B49B] ring-1 ring-[#68B49B]` : 'bg-gray-50 border-gray-200 hover:border-[#68B49B]'}`} onClick={() => setReserveTable(!reserveTable)}>
                                        <span className={`${MOBILE_FONT} text-[16px] leading-[24px] font-semibold ${reserveTable ? 'text-[#33594C]' : 'text-gray-500'} lg:text-xs lg:font-bold`}>{reserveTable ? 'Sì, Tavolo' : 'No, Lista'}</span>
                                        <div className={`w-5 h-5 rounded-full flex items-center justify-center transition-all border ${reserveTable ? 'bg-[#68B49B] border-[#68B49B] text-white' : 'bg-gray-200 border-gray-300 text-transparent'}`}>
                                            {reserveTable ? <Star size={10} fill="currentColor" /> : <Check size={10} strokeWidth={3} />}
                                        </div>
                                    </div>
                                </div>

                                {/* Mobile Cerca (inside grid) */}
                                <div className="lg:hidden flex flex-col gap-1">
                                    <span className="text-[9px] font-bold uppercase tracking-wide opacity-0 select-none ml-1">_</span>
                                    <PrimaryButton type="submit" className="w-full h-[42px] !rounded-xl !px-4 shadow-lg shadow-emerald-500/20">
                                        <Search size={16} strokeWidth={2.5} />
                                        <span className={`${MOBILE_FONT} text-[12px] leading-[16px] font-semibold uppercase tracking-wider`}>Cerca</span>
                                    </PrimaryButton>
                                </div>
                            </div>

                            {/* Desktop Cerca (outside grid) */}
                            <div className="hidden lg:flex flex-col gap-1 lg:w-auto">
                                <span className="text-[9px] font-bold uppercase tracking-wide opacity-0 select-none ml-1">_</span>
                                <PrimaryButton type="submit" className="w-full h-[64px] lg:!rounded-2xl !px-8 shadow-lg shadow-emerald-500/20">
                                    <Search size={24} strokeWidth={2.5} />
                                </PrimaryButton>
                            </div>
                        </div>
                    </div>
                );

            case 'Luggage':
                return (
                    <div className="flex flex-col gap-3 lg:gap-4 w-full animate-in fade-in duration-300">

                        {/* ===== MOBILE LAYOUT: identico a ServiceListingLuggage ===== */}
                        <div className="lg:hidden w-full flex flex-col gap-2">
                            {/* Città */}
                            <div className="z-[100]">
                                <CityAutocomplete label="Dove lasci i bagagli?" icon={MapPin} placeholder="Città deposito" className="w-full z-[100]"
                                    value={location} onChange={setLocation} />
                            </div>
                            {/* Grid 2 col: Schedule modal + Bags modal */}
                            <div className="grid grid-cols-2 gap-2">
                                <SearchInputContainer label="Deposito e Ritiro" icon={Calendar} className="w-full">
                                    <MobileScheduleModal
                                        lugDateFrom={lugDateFrom} lugTimeFrom={lugTimeFrom}
                                        lugDateTo={lugDateTo} lugTimeTo={lugTimeTo}
                                        setLugDateFrom={setLugDateFrom} setLugTimeFrom={setLugTimeFrom}
                                        setLugDateTo={setLugDateTo} setLugTimeTo={setLugTimeTo}
                                        today={today} getDefaultTime={getDefaultTime}
                                    />
                                </SearchInputContainer>
                                <SearchInputContainer label="Bagagli" icon={Luggage} className="w-full">
                                    <MobileBagsModal luggageCounts={luggageCounts} updateLuggage={updateLuggage} />
                                </SearchInputContainer>
                            </div>
                             {/* Cerca full-width */}
                            <PrimaryButton type="submit" className={`w-full h-[42px] !rounded-xl ${MOBILE_FONT} text-[16px] leading-[20px] font-semibold !py-0`}>
                                <Search size={16} />
                                Cerca
                            </PrimaryButton>
                        </div>

                        {/* ===== DESKTOP LAYOUT ===== */}
                        <div className="hidden lg:flex lg:flex-row gap-4 items-end w-full">
                            <CityAutocomplete label="Città Deposito" icon={MapPin} placeholder="Dove lasci i bagagli?" className="w-full lg:flex-[1.5]" value={location} onChange={setLocation} inputClassName="text-lg" />
                            <div className="flex flex-row gap-4 w-full lg:flex-[2]">
                                <SearchInputContainer label="Deposito" icon={Calendar} className="w-full">
                                    <div className="flex w-full h-full items-center gap-2 px-2">
                                        <input type="date" min={today} className="flex-1 bg-transparent border-none outline-none text-base font-medium text-gray-800 min-w-0"
                                            value={lugDateFrom} onChange={(e) => { const d = e.target.value; setLugDateFrom(d); setLugTimeFrom(getDefaultTime(d)); }} />
                                        <div className="w-px h-6 bg-gray-200 mx-1 shrink-0"></div>
                                        <Clock size={16} className="text-gray-400 shrink-0" />
                                        <div className="w-24"><TimeSlotSelect value={lugTimeFrom} date={lugDateFrom} onChange={(e) => setLugTimeFrom(e.target.value)} /></div>
                                    </div>
                                </SearchInputContainer>
                                <SearchInputContainer label="Ritiro" icon={Clock} className="w-full">
                                    <div className="flex w-full h-full items-center gap-2 px-2">
                                        <input type="date" min={lugDateFrom || today} className="flex-1 bg-transparent border-none outline-none text-base font-medium text-gray-800 min-w-0"
                                            value={lugDateTo} onChange={(e) => { const d = e.target.value; setLugDateTo(d); setLugTimeTo(getDefaultTime(d)); }} />
                                        <div className="w-px h-6 bg-gray-200 mx-1 shrink-0"></div>
                                        <Clock size={16} className="text-gray-400 shrink-0" />
                                        <div className="w-24"><TimeSlotSelect value={lugTimeTo} date={lugDateTo} onChange={(e) => setLugTimeTo(e.target.value)} /></div>
                                    </div>
                                </SearchInputContainer>
                            </div>
                            <div className="flex flex-col gap-1">
                                <span className="text-[9px] font-bold uppercase tracking-wide opacity-0 select-none ml-1">_</span>
                                <PrimaryButton type="submit" className="w-full h-[64px] !rounded-2xl !px-8 shadow-lg shadow-emerald-500/20">
                                    <Search size={24} strokeWidth={2.5} />
                                </PrimaryButton>
                            </div>
                        </div>

                    </div>
                );

            case 'NCC':
            default:
                return (
                    <div className="flex flex-col gap-2 lg:gap-4 w-full animate-in fade-in duration-300">
                        {/* ===== MOBILE LAYOUT: identico a ServiceListingNCC ===== */}
                        <div className="lg:hidden w-full flex flex-col gap-2">
                            <div className="grid grid-cols-2 gap-2">
                                <SearchInputContainer label="Partenza" icon={MapPin} className="w-full">
                                    <MobileLocationSelector
                                        label="Partenza" city={nccFromCity} address={nccFromAddress}
                                        onSelect={(c, a) => { setNccFromCity(c); setNccFromAddress(a); }}
                                        placeholder="Città di partenza" icon={MapPin}
                                    />
                                </SearchInputContainer>
                                <SearchInputContainer label="Destinazione" icon={Navigation} className="w-full">
                                    <MobileLocationSelector
                                        label="Destinazione" city={nccToCity} address={nccToAddress}
                                        onSelect={(c, a) => { setNccToCity(c); setNccToAddress(a); }}
                                        placeholder="Città di arrivo" icon={Navigation}
                                    />
                                </SearchInputContainer>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <SearchInputContainer label="Data e Ora" icon={Calendar} className="w-full">
                                    <div className="flex w-full h-full items-center justify-between px-2 gap-1 overflow-hidden">
                                        <input type="date" min={today} className={`bg-transparent border-none outline-none ${MOBILE_FONT} text-[14px] leading-[20px] font-semibold text-gray-800 w-[80px] h-full`}
                                            value={nccDate} onChange={(e) => { const d = e.target.value; setNccDate(d); setNccTime(getDefaultTime(d)); }} />
                                        <div className="w-px h-4 bg-gray-200 shrink-0"></div>
                                        <div className="flex-1 min-w-0"><TimeSlotSelect value={nccTime} date={nccDate} onChange={(e) => setNccTime(e.target.value)} className="!text-[14px] !px-1" /></div>
                                    </div>
                                </SearchInputContainer>
                                <SearchInputContainer label="Passeggeri" icon={Users} className="w-full">
                                    <MobilePassengersModal value={nccPassengers} onChange={setNccPassengers} />
                                </SearchInputContainer>
                            </div>
                            <PrimaryButton type="submit" className={`w-full h-[42px] !rounded-xl ${MOBILE_FONT} text-[16px] leading-[20px] font-semibold !py-0`}>
                                <Search size={16} />
                                Cerca
                            </PrimaryButton>
                        </div>

                        {/* ===== DESKTOP LAYOUT ===== */}
                        <div className="hidden lg:flex flex-col gap-4">
                            <div className="grid grid-cols-2 lg:flex lg:flex-row gap-2 lg:gap-4 w-full relative z-30">
                                <CityAutocomplete label="Partenza" icon={MapPin} placeholder="Es. Milano" className="w-full flex-1" value={nccFromCity} onChange={setNccFromCity} required inputClassName="text-sm lg:text-lg" />
                                <SearchInputContainer label="Indirizzo Partenza" icon={Navigation} className="w-full lg:flex-[1.5]">
                                    <input type="text" placeholder="Via, Civico o Aeroporto" className={`w-full h-full px-2 lg:px-3 bg-transparent border-none focus:ring-0 ${MOBILE_FONT} text-[16px] leading-[24px] font-semibold lg:text-sm lg:font-medium outline-none placeholder:text-gray-400`} value={nccFromAddress} onChange={(e) => setNccFromAddress(e.target.value)} />
                                </SearchInputContainer>
                            </div>
                            <div className="grid grid-cols-2 lg:flex lg:flex-row gap-2 lg:gap-4 w-full relative z-20">
                                <CityAutocomplete label="Destinazione" icon={MapPin} placeholder="Es. Roma" className="w-full flex-1" value={nccToCity} onChange={setNccToCity} required />
                                <SearchInputContainer label="Indirizzo Destinazione" icon={Navigation} className="w-full lg:flex-[1.5]">
                                    <input type="text" placeholder="Via, Civico o Aeroporto" className={`w-full h-full px-2 lg:px-3 bg-transparent border-none focus:ring-0 ${MOBILE_FONT} text-[16px] leading-[24px] font-semibold lg:text-sm lg:font-medium outline-none placeholder:text-gray-400`} value={nccToAddress} onChange={(e) => setNccToAddress(e.target.value)} />
                                </SearchInputContainer>
                            </div>
                            <div className="grid grid-cols-2 lg:flex lg:flex-row gap-2 lg:gap-4 items-end w-full">
                                <SearchInputContainer label="Data" icon={Calendar} className="w-full">
                                    <input type="date" min={today} className={`w-full h-full px-2 lg:px-3 bg-transparent border-none outline-none ${MOBILE_FONT} text-[16px] leading-[24px] font-semibold lg:text-sm lg:font-medium text-gray-600 min-w-0`}
                                        value={nccDate} onChange={(e) => {
                                            const newDate = e.target.value;
                                            setNccDate(newDate);
                                            setNccTime(getDefaultTime(newDate));
                                        }} />
                                </SearchInputContainer>
                                <SearchInputContainer label="Ora" icon={Clock} className="w-full lg:!min-w-[100px] lg:max-w-[120px]">
                                    <TimeSlotSelect value={nccTime} date={nccDate} onChange={(e) => setNccTime(e.target.value)} />
                                </SearchInputContainer>
                                <SearchInputContainer label="Passeggeri" icon={Users} className="w-full lg:max-w-[150px]">
                                    <input type="number" min="1" className={`w-full h-full px-2 lg:px-3 bg-transparent border-none outline-none ${MOBILE_FONT} text-[16px] leading-[24px] font-semibold lg:text-sm lg:font-medium text-center text-gray-700`} value={nccPassengers} onChange={(e) => setNccPassengers(e.target.value)} />
                                </SearchInputContainer>
                                <div className="flex flex-col gap-1">
                                    <span className="text-[9px] font-bold uppercase tracking-wide opacity-0 select-none ml-1">_</span>
                                    <PrimaryButton type="submit" className="w-full h-[64px] lg:!rounded-2xl !px-8 shadow-lg shadow-emerald-500/20">
                                        <Search size={24} strokeWidth={2.5} />
                                    </PrimaryButton>
                                </div>
                            </div>
                        </div>
                    </div>
                );
        }
    };

    return (
        <div className={`max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-24 sm:-mt-20 relative z-30 ${HOGU_THEME.fontFamily}`}>
            {/* TABS CONTAINER UNIFICATO */}
            <div className="bg-white/10 backdrop-blur-md border border-white/20 p-1 lg:p-1.5 rounded-2xl md:rounded-t-3xl md:rounded-b-none mb-4 md:mb-0 shadow-lg md:shadow-none inline-flex md:block w-full overflow-hidden">
                <div className="flex overflow-x-auto md:overflow-visible md:grid md:grid-cols-5 gap-1.5 md:gap-0 items-center w-full scrollbar-hide snap-x px-0.5 md:px-0">
                    {serviceCategories.map((cat) => {
                        const isActive = activeTab === cat.name;
                        return (
                            <button key={cat.id} onClick={() => setActiveTab(cat.name)}
                                className={`
                            relative flex flex-row items-center justify-center gap-1.5 py-2 lg:py-4 px-3 lg:px-3 flex-shrink-0 md:w-full snap-start
                            ${MOBILE_FONT} text-[16px] leading-[24px] font-semibold tracking-wide md:text-xs lg:text-sm transition-all duration-300 rounded-xl md:rounded-none md:rounded-t-2xl
                            ${isActive
                                        ? 'bg-white text-[#68B49B] shadow-md md:shadow-none'
                                        : 'text-white/90 hover:bg-white/10'
                                    }
                        `}
                            >
                                <cat.icon size={isActive ? 16 : 15} strokeWidth={2.5} />
                                <span className="whitespace-nowrap">{cat.name}</span>
                                {isActive && <div className="hidden md:block absolute bottom-0 left-0 right-0 h-[4px] bg-white z-30" />}
                            </button>
                        )
                    })}
                </div>
            </div>

            {/* BARRA RICERCA */}
            <div className="bg-white rounded-2xl md:rounded-b-3xl md:rounded-tr-3xl md:rounded-tl-none p-3 lg:p-8 shadow-2xl relative z-10 min-h-[80px] lg:min-h-[120px]">
                <form onSubmit={handleSearchSubmit} className="relative z-30">
                    {renderFormContent()}
                </form>
            </div>
        </div>
    );
};

export default ServiceSearch;
import React, { useState } from 'react';
import { HOGU_COLORS, HOGU_THEME } from '../../../config/theme.js';
import { PrimaryButton } from '../../../components/ui/Button.jsx';

// Importa solo le icone che servono qui
import { Flame, Calendar, Clock, Users, CheckSquare } from 'lucide-react';

// WIDGET DI PRENOTAZIONE RISTORANTE (basato sull'immagine fornita)
export const RestaurantBookingWidget = ({ setPage }) => {
    // Gestione del flusso: 'time' -> 'guests' -> 'ready'
    const [step, setStep] = useState('time'); 
    
    const [selectedDate, setSelectedDate] = useState('19 Nov');
    const [selectedTime, setSelectedTime] = useState(null); // Inizia a null
    const [selectedGuests, setSelectedGuests] = useState(null); // Inizia a null
    
    // Dati Mock per persone e orari con sconti
    const guestOptions = [
        { count: 1, discount: 30 }, { count: 2, discount: 50 }, { count: 3, discount: 50 }, { count: 4, discount: 50 },
        { count: 5, discount: 50 }, { count: 6, discount: 50 }, { count: 7, discount: 30 }, { count: 8, discount: 30 },
        { count: 9, discount: 30 }, { count: 10, discount: 30 }, { count: 11, discount: 30 }, { count: 12, discount: 30 },
    ];
    
    const timeSlots = {
        Pranzo: ['12:30', '12:45', '13:00', '13:15', '13:30', '13:45', '14:00'],
        Cena: ['19:30', '19:45', '20:00', '20:15', '20:30', '20:45', '21:00', '21:15', '21:30', '21:45', '22:00'],
    };
    
    // Funzione per generare uno sconto mockato (solo per estetica)
    const getDiscount = (time) => {
        // Mock: Più tardi è, meno è scontato, ma a pranzo c'è sempre un incentivo
        if (time.startsWith('1')) return 50;
        if (time.startsWith('20') || time.startsWith('19')) return 50;
        return 30; // Altrimenti 30%
    };

    const TimeSlotButton = ({ time }) => (
        <button
            key={time}
            onClick={() => {
                setSelectedTime(time);
                setStep('guests'); // Passa alla selezione ospiti dopo la selezione orario
            }}
            className={`
                relative p-2 rounded-lg text-center font-semibold text-sm transition-all
                border border-gray-300
                ${selectedTime === time 
                    ? `bg-[${HOGU_COLORS.primary}] text-white shadow-lg` 
                    : `bg-white text-[${HOGU_COLORS.dark}] hover:bg-gray-50`
                }
            `}
        >
            {time}
            <span className="absolute bottom-0 right-0 transform translate-y-1/2 translate-x-1/3 bg-red-600 text-white text-[10px] font-bold px-1 rounded-full whitespace-nowrap">
                -{getDiscount(time)}%
            </span>
        </button>
    );

    const handleGuestSelection = (count) => {
        setSelectedGuests(count);
        setStep('ready'); // Ultimo step prima del checkout
    };


    // Helper per determinare lo sfondo dei bottoni riepilogativi
    const getButtonClass = (buttonStep) => {
        const base = 'p-2 rounded-lg font-semibold text-sm flex items-center justify-center transition-colors';
        
        // Colonna data (sempre attiva/verde in questa demo)
        if (buttonStep === 'date') {
            return `${base} col-span-1 bg-[${HOGU_COLORS.primary}] text-white`;
        }
        
        // Logica per Orario e Persone
        const isTimeCompleted = selectedTime !== null;
        const isGuestsCompleted = selectedGuests !== null;

        if (buttonStep === 'time') {
            const isActive = step === 'time';
            return `${base} col-span-1 
                    ${isTimeCompleted ? `bg-[${HOGU_COLORS.primary}] text-white` : ''}
                    ${isActive ? `bg-gray-200 text-[${HOGU_COLORS.dark}]` : ''}
                    ${!isTimeCompleted && !isActive ? 'bg-white text-[${HOGU_COLORS.subtleText}] border border-gray-200' : ''}`;
        }
        
        if (buttonStep === 'guests') {
            const isActive = step === 'guests';
            return `${base} col-span-2 
                    ${isGuestsCompleted ? `bg-[${HOGU_COLORS.primary}] text-white` : ''}
                    ${isActive ? `bg-gray-200 text-[${HOGU_COLORS.dark}]` : ''}
                    ${!isGuestsCompleted && !isActive ? 'bg-white text-[${HOGU_COLORS.subtleText}] border border-gray-200' : ''}`;
        }
        
        return `${base} bg-white text-[${HOGU_COLORS.subtleText}]`;
    };
    
    // Funzione per il click sui tab riepilogativi
    const handleSummaryClick = (targetStep) => {
        if (targetStep === 'time') {
            setStep('time');
        } else if (targetStep === 'guests' && selectedTime) {
             setStep('guests');
        } else if (targetStep === 'guests' && !selectedTime) {
             // Se l'utente salta l'orario, forzalo a selezionarlo
             setStep('time');
        }
    };


    return (
        <div className="p-6 bg-white rounded-xl shadow-lg border border-gray-100 h-min sticky top-24">
            
            <h2 className={`text-3xl font-bold mb-1 text-[${HOGU_COLORS.dark}]`}>Prenota un tavolo</h2>
            <p className="text-sm text-gray-500 mb-4">Gratuitamente</p>

            {/* Banner Prenotazioni Calde */}
            <div className={`flex items-center justify-center p-3 mb-6 rounded-lg bg-[${HOGU_COLORS.lightAccent}] text-[${HOGU_COLORS.widgetDark}] text-sm font-semibold`}>
                <Flame className="w-4 h-4 text-red-500 mr-2" />
                Già <span className="mx-1">9 prenotazioni</span> per oggi
            </div>

            {/* Selezione Data e Persone (Mock) - Barra di navigazione/Riepilogo */}
            <div className={`grid grid-cols-4 gap-1 p-1 mb-6 rounded-xl bg-gray-100 shadow-inner`}>
                
                {/* 1. Data (Sempre Attivo/Verde) */}
                <button 
                    onClick={() => {}} 
                    className={getButtonClass('date')}
                >
                    <Calendar className="w-4 h-4 mr-1" /> 19 Nov
                </button>
                
                {/* 2. Orario (Stato Attuale) */}
                <button 
                    onClick={() => handleSummaryClick('time')}
                    className={getButtonClass('time')}
                >
                    <Clock className="w-4 h-4 mr-1" /> {selectedTime || 'Orario'}
                </button>
                
                {/* 3. Persone (Stato Attuale) */}
                <button 
                  onClick={() => handleSummaryClick('guests')}
                  disabled={!selectedTime && step !== 'guests'}
                  className={getButtonClass('guests')}
                >
                    <Users className="w-4 h-4 mr-1" /> {selectedGuests || 'Persone'}
                    {(step !== 'guests' && selectedGuests) && <CheckSquare className="w-4 h-4 ml-1" />}
                </button>
            </div>


            {/* STEP 1: Orari (Visibile se step === 'time') */}
            {step === 'time' && (
                <div className="pt-4 border-t border-gray-100">
                    <h3 className={`text-xl font-bold mb-4 text-[${HOGU_COLORS.widgetDark}]`}>Scegli l'orario</h3>

                    {/* Orari Pranzo */}
                    <p className={`text-base font-semibold mb-2 ${HOGU_THEME.text}`}>Pranzo</p>
                    <div className="grid grid-cols-4 gap-3 mb-6">
                        {timeSlots.Pranzo.map(time => <TimeSlotButton key={time} time={time} />)}
                    </div>
                    
                    {/* Orari Cena */}
                    <p className={`text-base font-semibold mb-2 ${HOGU_THEME.text}`}>Cena</p>
                    <div className="grid grid-cols-4 gap-3 mb-6">
                        {timeSlots.Cena.map(time => <TimeSlotButton key={time} time={time} />)}
                    </div>
                </div>
            )}

            {/* STEP 2: Numero di Persone (Visibile solo se step === 'guests') */}
            {step === 'guests' && (
                <div className="mb-8 pt-4 border-t border-gray-100">
                    <h3 className={`text-xl font-bold mb-4 text-[${HOGU_COLORS.widgetDark}]`}>Numero di persone</h3>
                    <div className="grid grid-cols-4 gap-3">
                        {guestOptions.slice(0, 12).map(opt => (
                            <button
                                key={opt.count}
                                onClick={() => {
                                    handleGuestSelection(opt.count);
                                }}
                                className={`
                                    relative p-2 rounded-xl text-center font-semibold border transition-all h-16
                                    ${selectedGuests === opt.count 
                                        ? `bg-[${HOGU_COLORS.widgetDark}] text-white shadow-xl border-transparent` 
                                        : `bg-white text-[${HOGU_COLORS.dark}] border-gray-300 hover:bg-gray-50`
                                    }
                                `}
                            >
                                <span className="text-2xl">{opt.count}</span>
                                <span className={`absolute top-0 left-0 transform -translate-x-1/2 -translate-y-1/2 text-white text-[10px] font-bold px-2 py-0.5 rounded-full ${selectedGuests === opt.count ? 'bg-red-500' : 'bg-gray-500'}`}>
                                    -{opt.discount}%
                                </span>
                            </button>
                        ))}
                    </div>
                </div>
            )}
            
            {/* CTA Finale */}
            <div className="mt-6 border-t pt-4">
                <PrimaryButton 
                    onClick={() => setPage('checkout')} 
                    disabled={!selectedTime || !selectedGuests} // Disabilita se manca uno dei due
                    className="w-full text-lg"
                >
                    {(selectedTime && selectedGuests) ? `Prenota tavolo per ${selectedGuests} alle ${selectedTime}` : 'Seleziona Orario e Persone'}
                </PrimaryButton>
                <p className="text-xs text-gray-500 mt-2 text-center">
                    Le promozioni sono basate sull'orario, sulla data e sul numero di persone.
                </p>
            </div>
        </div>
    );
};
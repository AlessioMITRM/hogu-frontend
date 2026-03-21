import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Lock, LogIn, UserPlus, ArrowLeft } from 'lucide-react';
import { HOGU_THEME } from '../../../config/theme';

const BookingAuthRequiredPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    
    // Recupera lo stato precedente per il redirect post-login (se presente)
    const from = location.state?.from?.pathname || '/';

    return (
        <div className={`min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 pt-32 md:pt-40 ${HOGU_THEME.fontFamily}`}>
            <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 text-center border border-gray-100 relative overflow-hidden">
                
                {/* Decorazione Sfondo */}
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#68B49B] to-[#4A9D84]" />
                
                {/* Icona */}
                <div className="w-20 h-20 bg-[#F0FDF9] rounded-full flex items-center justify-center mx-auto mb-6 text-[#68B49B]">
                    <Lock size={36} strokeWidth={2.5} />
                </div>

                {/* Testo */}
                <h1 className="text-2xl font-bold text-gray-900 mb-3">
                    Accesso Richiesto
                </h1>
                <p className="text-gray-500 mb-8 leading-relaxed">
                    Per proseguire con la prenotazione è necessario accedere al tuo account o crearne uno nuovo.
                </p>

                {/* Bottoni Azione */}
                <div className="space-y-4">
                    <button 
                        onClick={() => navigate('/login', { state: { from } })}
                        className={`w-full py-3.5 px-6 rounded-xl flex items-center justify-center gap-3 font-bold text-white transition-all transform active:scale-95 shadow-lg shadow-[#68B49B]/20 ${HOGU_THEME.primary}`}
                    >
                        <LogIn size={20} />
                        Accedi
                    </button>

                    <button 
                        onClick={() => navigate('/register', { state: { from } })}
                        className="w-full py-3.5 px-6 rounded-xl flex items-center justify-center gap-3 font-bold text-gray-700 bg-gray-50 border-2 border-gray-100 hover:bg-gray-100 hover:border-gray-200 transition-all active:scale-95"
                    >
                        <UserPlus size={20} />
                        Registrati
                    </button>
                </div>

                {/* Back Link */}
                <button 
                    onClick={() => navigate(-1)}
                    className="mt-8 text-sm text-gray-400 hover:text-gray-600 font-medium flex items-center justify-center gap-2 transition-colors"
                >
                    <ArrowLeft size={14} />
                    Torna indietro
                </button>
            </div>
            
            <p className="mt-8 text-xs text-gray-400">
                HOGU - Secure Booking System
            </p>
        </div>
    );
};

export default BookingAuthRequiredPage;

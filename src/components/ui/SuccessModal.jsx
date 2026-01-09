import React from 'react';
import { CheckCircle, X } from 'lucide-react'; // Icone per successo e chiusura

/**
 * Modale di notifica di successo riutilizzabile.
 * * @param {boolean} isOpen - Controlla la visibilità della modale.
 * @param {string} title - Titolo principale (es. "Salvataggio Riuscito!").
 * @param {string} message - Messaggio descrittivo.
 * @param {function} onClose - Funzione richiamata alla chiusura/conferma.
 * @param {string} confirmText - Testo del bottone di conferma (default: "Chiudi").
 */
const SuccessModal = ({ isOpen, title, message, onClose, confirmText = 'Chiudi' }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Overlay semi-trasparente */}
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose}></div>
            
            {/* Corpo Modale */}
            <div className="relative w-full max-w-md bg-white rounded-[2rem] p-8 text-center shadow-2xl animate-in zoom-in-95 duration-300">
                
                {/* Bottone di Chiusura (X) */}
                <button 
                    onClick={onClose} 
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors p-2"
                    aria-label="Chiudi"
                >
                    <X size={20} />
                </button>

                {/* Icona di Successo */}
                <div className="flex items-center justify-center mb-6">
                    <div className="p-4 rounded-full bg-green-100 text-green-600">
                        <CheckCircle size={36} />
                    </div>
                </div>

                {/* Contenuto Testuale */}
                <h3 className="text-2xl font-extrabold text-gray-900 mb-2">
                    {title || 'Operazione Riuscita!'}
                </h3>
                <p className="text-gray-600 mb-8">
                    {message || 'La tua richiesta è stata elaborata con successo.'}
                </p>

                {/* Bottone d'Azione (Stile Slate HOGU) */}
                <button 
                    onClick={onClose}
                    className={`w-full py-3 rounded-xl font-bold text-white shadow-lg shadow-slate-500/20 flex items-center justify-center gap-2 transition-all 
                        bg-slate-800 hover:bg-slate-700 hover:scale-[1.01]`}
                >
                    {confirmText}
                </button>
            </div>
        </div>
    );
};

export default SuccessModal;
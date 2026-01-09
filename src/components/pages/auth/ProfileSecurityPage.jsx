import React, { useState } from 'react';
import { 
    ShieldCheck, KeyRound, Mail, 
    CheckCircle, AlertTriangle, Eye, EyeOff, Save, RefreshCw,
    Lock, Check, ArrowRight
} from 'lucide-react';

import { authService } from '../../../api/apiClient'; 
import LoadingScreen from '../../../components/ui/LoadingScreen.jsx';
import SuccessModal from '../../../components/ui/SuccessModal.jsx';
import ErrorModal from '../../../components/ui/ErrorModal.jsx';
import { Breadcrumbs } from '../../../components/ui/Breadcrumbs.jsx'; 

import { withAuthProtection } from './withAuthProtection.jsx'; 

// --- CONFIGURAZIONE TEMA ---
const HOGU_THEME = {
    fontFamily: 'font-sans',
    bg: 'bg-[#F8FAFC]',
    inputBase: 'w-full pl-12 pr-12 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium placeholder:text-slate-400 focus:bg-white focus:border-[#68B49B] focus:ring-4 focus:ring-[#68B49B]/10 outline-none transition-all',
};

// --- BREADCRUMBS CONFIGURATION ---
const breadcrumbsItems = [
    { label: 'Dashboard', href: '#' },
    { label: 'Il mio Profilo', href: '#' },
    { label: 'Sicurezza & Login', href: '#' }
];

// --- COMPONENTI UI PICCOLI (Invariati) ---
const PasswordStrengthIndicator = ({ password }) => {
    const hasMinLength = password.length >= 8;
    const hasNumber = /\d/.test(password);
    const hasSpecial = /[!@#$%^&*]/.test(password);
    const hasUpper = /[A-Z]/.test(password);

    const strength = [hasMinLength, hasNumber, hasSpecial, hasUpper].filter(Boolean).length;
    
    const getLabel = () => {
        if (password.length === 0) return { label: 'Inserisci Password', color: 'bg-slate-200' };
        if (strength <= 2) return { label: 'Debole', color: 'bg-red-400' };
        if (strength === 3) return { label: 'Buona', color: 'bg-amber-400' };
        return { label: 'Forte', color: 'bg-emerald-400' };
    };

    const status = getLabel();

    return (
        <div className="mt-3">
            <div className="flex justify-between items-center mb-1.5">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Sicurezza</span>
                <span className={`text-[10px] font-bold uppercase ${status.color.replace('bg-', 'text-')}`}>{status.label}</span>
            </div>
            <div className="flex gap-1 h-1.5">
                {[1, 2, 3, 4].map((step) => (
                    <div 
                        key={step} 
                        className={`flex-1 rounded-full transition-all duration-300 ${strength >= step ? status.color : 'bg-slate-100'}`} 
                    />
                ))}
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2">
                <ValidationItem label="Min. 8 caratteri" isValid={hasMinLength} />
                <ValidationItem label="Un numero" isValid={hasNumber} />
                <ValidationItem label="Un simbolo (!@#)" isValid={hasSpecial} />
                <ValidationItem label="Una maiuscola" isValid={hasUpper} />
            </div>
        </div>
    );
};

const ValidationItem = ({ label, isValid }) => (
    <div className={`flex items-center gap-1.5 text-[10px] font-bold transition-colors ${isValid ? 'text-emerald-600' : 'text-slate-300'}`}>
        {isValid ? <Check size={12} /> : <div className="w-3 h-3 rounded-full border-2 border-slate-200" />}
        {label}
    </div>
);

const PasswordInput = ({ label, value, onChange, placeholder, showStrength = false }) => {
    const [isVisible, setIsVisible] = useState(false);

    return (
        <div className="mb-4">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{label}</label>
            <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#68B49B] transition-colors">
                    <KeyRound size={20} />
                </div>
                <input 
                    type={isVisible ? "text" : "password"}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    className={HOGU_THEME.inputBase}
                />
                <button 
                    type="button"
                    onClick={() => setIsVisible(!isVisible)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                    {isVisible ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
            </div>
            {showStrength && <PasswordStrengthIndicator password={value} />}
        </div>
    );
};

// --- CARDS PRINCIPALI (Invariate) ---
const EmailUpdateCard = ({ user }) => {
    // Nota: qui usiamo user?.email per sicurezza, anche se l'HOC garantisce che user esiste
    const [email, setEmail] = useState(user?.email || ''); 
    const [isEditing, setIsEditing] = useState(false);
    const [newEmail, setNewEmail] = useState("");

    return (
        <div className="bg-white rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/50 border border-slate-100 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
            <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                        <Mail size={24} />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-[#1A202C]">Indirizzo Email</h3>
                        <p className="text-sm text-slate-500">Gestisci l'email per le notifiche e il login.</p>
                    </div>
                </div>

                {!isEditing ? (
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <span className="font-bold text-[#1A202C]">{email}</span>
                            <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1">
                                <CheckCircle size={10} /> Verificata
                            </span>
                        </div>
                    </div>
                ) : (
                    <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                        {/* ... form edit email ... */}
                         <div className="mb-4">
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Nuova Email</label>
                            <input 
                                type="email" 
                                value={newEmail}
                                onChange={(e) => setNewEmail(e.target.value)}
                                className="w-full px-4 py-3.5 bg-white border-2 border-blue-100 focus:border-blue-500 rounded-xl text-slate-800 outline-none transition-all"
                                placeholder="nome@esempio.com"
                            />
                            <p className="text-xs text-slate-400 mt-2 flex items-start gap-1">
                                <AlertTriangle size={12} className="mt-0.5 shrink-0" />
                                Invieremo un link di verifica al nuovo indirizzo.
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <button onClick={() => setIsEditing(false)} className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-200 transition-colors">Annulla</button>
                            <button className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center gap-2">Invia Verifica <ArrowRight size={16} /></button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const PasswordResetCard = ({ user }) => {
    const [form, setForm] = useState({ current: '', new: '', confirm: '' });  
    const [loading, setLoading] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [showError, setShowError] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    const handleChange = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

    const handleSave = async () => {
        if (!form.new || !form.confirm) {
            setErrorMessage('Tutti i campi sono obbligatori.');
            setShowError(true);
            return;
        }
        if (form.new !== form.confirm) {
            setErrorMessage('Le password non coincidono.');
            setShowError(true);
            return;
        }
        if (form.new.length < 8) {
            setErrorMessage('La password deve essere di almeno 8 caratteri.');
            setShowError(true);
            return;
        }

        setLoading(true);

        try {
            if(user.role === 'PROVIDER')
                await authService.providerPasswordReset(form.new);
            else
                await authService.customerPasswordReset(form.new);
            
            setShowSuccess(true);
            setForm({ current: '', new: '', confirm: '' }); 

        } catch (error) {
            console.error('Password reset error:', error);
            const msg = error.response?.data?.message || error.message || 'Errore durante l\'aggiornamento della password.';
            setErrorMessage(msg);
            setShowError(true);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <div className="bg-white rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/50 border border-slate-100 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>

                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-12 h-12 bg-[#E6F5F0] text-[#68B49B] rounded-2xl flex items-center justify-center">
                            <ShieldCheck size={24} />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-[#1A202C]">Reimposta Password</h3>
                            <p className="text-sm text-slate-500">Ti consigliamo di usare una password sicura.</p>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <PasswordInput 
                            label="Password Attuale" 
                            placeholder="••••••••••••" 
                            value={form.current} 
                            onChange={(val) => handleChange('current', val)} 
                        />
                        <div className="border-t border-slate-100 my-6"></div>
                        <PasswordInput 
                            label="Nuova Password" 
                            placeholder="Almeno 8 caratteri" 
                            value={form.new} 
                            onChange={(val) => handleChange('new', val)}
                            showStrength={true}
                        />
                        <PasswordInput 
                            label="Conferma Nuova Password" 
                            placeholder="Ripeti password" 
                            value={form.confirm} 
                            onChange={(val) => handleChange('confirm', val)} 
                        />
                    </div>

                    <div className="mt-8 flex justify-end">
                        <button 
                            onClick={handleSave}
                            disabled={loading || !form.new || form.new !== form.confirm}
                            className={`
                                py-3.5 px-8 rounded-xl font-bold text-white shadow-lg flex items-center gap-2 transition-all
                                ${loading || !form.new 
                                    ? 'bg-slate-300 cursor-not-allowed shadow-none' 
                                    : 'bg-[#1A202C] hover:bg-[#68B49B] hover:shadow-[#68B49B]/30 hover:scale-105 active:scale-95'}
                            `}
                        >
                            {loading ? <RefreshCw size={20} className="animate-spin"/> : <Save size={20} />}
                            {loading ? 'Aggiornamento...' : 'Aggiorna Password'}
                        </button>
                    </div>
                </div>
            </div>
            <LoadingScreen isLoading={loading} />
            <SuccessModal 
                isOpen={showSuccess}
                onClose={() => setShowSuccess(false)}
                title="Password Aggiornata!"
                message="La tua password è stata modificata con successo. Utilizza la nuova password al prossimo accesso."
                confirmText="Chiudi"
            />
            {showError && (
                <ErrorModal
                    message={errorMessage}
                    onClose={() => setShowError(false)}
                />
            )}
        </>
    );
};

const ProfileSecurityPageBase = ({ user }) => {
    
    return (
        <div className={`min-h-screen ${HOGU_THEME.bg} ${HOGU_THEME.fontFamily} text-slate-800 pb-20`}>
            
            {/* --- HERO SECTION --- */}
            <div className="bg-white pt-12 pb-24 px-4 lg:px-8 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-96 h-96 bg-black/5 rounded-full blur-3xl -translate-y-1/2 -translate-x-1/3"></div>
                <div className="absolute top-0 right-0 w-96 h-96 bg-black/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>

                <div className="max-w-5xl mx-auto relative z-10">
                    <Breadcrumbs items={breadcrumbsItems} />
                    <div className="mt-6">
                        <h1 className="text-3xl md:text-4xl font-extrabold text-[#1A202C] mb-2 tracking-tight">
                            Sicurezza Account
                        </h1>
                        <p className="text-slate-500 text-lg max-w-2xl leading-relaxed">
                            Gestisci le tue credenziali e monitora l'accesso al tuo account per garantire la massima protezione dei tuoi dati.
                        </p>
                    </div>
                </div>
            </div>

            {/* --- CONTENUTO PRINCIPALE --- */}
            <div className="max-w-5xl mx-auto px-4 lg:px-8 -mt-16 relative z-20">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    {/* Colonna Sinistra */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Passiamo l'oggetto user ricevuto via props */}
                        <EmailUpdateCard user={user}/>
                        <PasswordResetCard user={user} />
                    </div>

                    {/* Colonna Destra */}
                    <div className="lg:col-span-1 space-y-8">
                        <div className="bg-[#E6F5F0] rounded-[2.5rem] p-6 border border-[#68B49B]/20">
                            <h4 className="font-bold text-[#33594C] mb-2 flex items-center gap-2">
                                <Lock size={18} /> Privacy First
                            </h4>
                            <p className="text-xs text-[#33594C]/80 leading-relaxed mb-4">
                                Hogu non condividerà mai la tua password. Se noti attività sospette, cambia immediatamente le credenziali.
                            </p>
                            <a href="#" className="text-xs font-bold text-[#68B49B] hover:underline">Contatta Supporto Sicurezza &rarr;</a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export const ProfileSecurityPage = withAuthProtection(ProfileSecurityPageBase, ['CUSTOMER', 'PROVIDER']);

export default ProfileSecurityPage;
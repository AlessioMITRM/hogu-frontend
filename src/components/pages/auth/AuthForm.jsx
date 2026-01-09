import React, { useState, useEffect, useRef } from 'react';
import { 
    Mail, Lock, User, Briefcase, Shield, ArrowRight, CheckCircle2, 
    X, Check, Upload, CreditCard, AlignLeft, AlertCircle,
    KeyRound, RefreshCw, ArrowLeft
} from 'lucide-react'; 
import { useNavigate } from 'react-router-dom';

import { authService } from '../../../api/apiClient';
import { useAuth } from '../../../components/context/AuthContext.jsx';

import { Breadcrumbs } from '../../../components/ui/Breadcrumbs.jsx'; 
import LoadingScreen from '../../../components/ui/LoadingScreen.jsx';
import SuccessModal from '../../../components/ui/SuccessModal.jsx';
import ErrorModal from '../../../components/ui/ErrorModal.jsx';
import { HOGU_THEME } from '../../../config/theme.js';

// --- COMPONENTI UI LOCALI (Input, Button, etc.) ---

const PrimaryButton = ({ children, onClick, disabled, className = '', type = 'button' }) => (
    <button
        type={type}
        onClick={onClick}
        disabled={disabled}
        className={`
            bg-[#68B49B] text-white font-bold py-3 px-6 rounded-xl 
            hover:bg-[#599c86] transition-all 
            shadow-lg shadow-[#68B49B]/20 hover:shadow-xl hover:shadow-[#68B49B]/30
            hover:scale-[1.02] active:scale-[0.98]
            disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none disabled:hover:scale-100
            ${className}
        `}
    >
        {children}
    </button>
);

const InputField = ({ icon: Icon, type, placeholder, value, onChange, className = '', ...props }) => (
    <div className={`relative group ${className}`}>
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#68B49B] transition-colors duration-300">
            <Icon size={20} />
        </div>
        <input
            type={type}
            placeholder={placeholder}
            value={value}
            onChange={onChange}
            {...props}
            className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-transparent rounded-2xl text-gray-700 font-medium outline-none transition-all duration-300 focus:bg-white focus:border-[#68B49B]/30 focus:shadow-[0_0_0_4px_rgba(104,180,155,0.1)] placeholder:text-gray-400 disabled:bg-gray-100"
        />
    </div>
);

const TextAreaField = ({ icon: Icon, placeholder, value, onChange }) => (
    <div className="relative group">
        <div className="absolute left-4 top-5 text-gray-400 group-focus-within:text-[#68B49B] transition-colors duration-300">
            <Icon size={20} />
        </div>
        <textarea
            placeholder={placeholder}
            value={value}
            onChange={onChange}
            rows={3}
            className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-transparent rounded-2xl text-gray-700 font-medium outline-none transition-all duration-300 focus:bg-white focus:border-[#68B49B]/30 focus:shadow-[0_0_0_4px_rgba(104,180,155,0.1)] placeholder:text-gray-400 resize-none custom-scrollbar"
        />
    </div>
);

const SelectField = ({ icon: Icon, value, onChange, options }) => (
    <div className="relative group">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#68B49B] transition-colors duration-300 pointer-events-none">
            <Icon size={20} />
        </div>
        <select
            value={value}
            onChange={onChange}
            className="w-full pl-12 pr-10 py-4 bg-gray-50 border-2 border-transparent rounded-2xl text-gray-700 font-medium outline-none transition-all duration-300 appearance-none cursor-pointer focus:bg-white focus:border-[#68B49B]/30 focus:shadow-[0_0_0_4px_rgba(104,180,155,0.1)]"
        >
            {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
        </select>
        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
        </div>
    </div>
);

const FileUpload = ({ onFileSelect, fileName }) => {
    const fileInputRef = useRef(null);
    const handleDivClick = () => fileInputRef.current.click();
    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            onFileSelect(e.target.files[0]);
        }
    };

    return (
        <div 
            onClick={handleDivClick}
            className={`
                border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer group relative overflow-hidden
                ${fileName ? 'border-[#68B49B] bg-[#E6F5F0]/30' : 'border-gray-200 hover:border-[#68B49B]/50 hover:bg-gray-50'}
            `}
        >
            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".pdf,.jpg,.png,.doc,.docx" />
            <div className="relative z-10">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 transition-transform duration-300 ${fileName ? 'bg-[#68B49B] text-white scale-110' : 'bg-[#E6F5F0] text-[#68B49B] group-hover:scale-110'}`}>
                    {fileName ? <Check size={24} /> : <Upload size={24} />}
                </div>
                {fileName ? (
                    <>
                        <p className="text-sm font-bold text-[#33594C] truncate max-w-[200px] mx-auto">{fileName}</p>
                        <p className="text-xs text-[#68B49B] mt-1">Documento caricato</p>
                    </>
                ) : (
                    <>
                        <p className="text-sm font-medium text-gray-700 group-hover:text-gray-900">Carica Visura / Certificazioni</p>
                        <p className="text-xs text-gray-400 mt-1">PDF, JPG (Max 5MB)</p>
                    </>
                )}
            </div>
        </div>
    );
};

const OtpInput = ({ value, onChange }) => {
    return (
        <div className="relative">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 pl-4 text-gray-400">
                <KeyRound size={24} />
            </div>
            <input
                type="text"
                maxLength="6"
                value={value}
                onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9]/g, '');
                    onChange(val);
                }}
                placeholder="0 0 0 0 0 0"
                className="w-full pl-14 pr-4 py-4 text-2xl tracking-[0.5em] font-mono text-center bg-gray-50 border-2 border-transparent rounded-2xl text-gray-900 outline-none transition-all focus:bg-white focus:border-[#68B49B] focus:shadow-[0_0_0_4px_rgba(104,180,155,0.1)] placeholder:tracking-widest placeholder:text-gray-300"
            />
        </div>
    );
};

const TermsModal = ({ isOpen, onClose }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-[2rem] w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl relative">
                <button onClick={onClose} className="absolute right-4 top-4 p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"><X size={20}/></button>
                <div className="p-8">
                    <h3 className="text-2xl font-bold mb-4 text-[#33594C]">Termini e Condizioni Provider</h3>
                    <div className="prose prose-sm max-h-[50vh] overflow-y-auto custom-scrollbar text-gray-600">
                        <p><strong>1. Requisiti di Idoneità.</strong> Il Provider dichiara di essere in possesso di tutte le licenze e autorizzazioni necessarie.</p>
                        <p><strong>2. Veridicità dei dati.</strong> I documenti caricati devono essere validi e aggiornati.</p>
                        <button onClick={onClose} className="w-full mt-6 bg-[#68B49B] text-white py-3 rounded-xl font-bold hover:bg-[#599c86]">Ho capito</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- COMPONENTE PRINCIPALE ---
export const AuthForm = ({ type = 'register', setPage = () => {} }) => {
    
    const navigate = useNavigate();
    const { login: loginContext } = useAuth();

    // --- STATES ---
    const [step, setStep] = useState('FORM'); // 'FORM' | 'OTP'
    
    // Form Data
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('CUSTOMER');
    const [serviceType, setServiceType] = useState('RESTAURANT');
    const [vatNumber, setVatNumber] = useState('');
    const [description, setDescription] = useState('');
    const [documentFile, setDocumentFile] = useState(null);
    
    // OTP Data
    const [otpCode, setOtpCode] = useState('');
    const [resendTimer, setResendTimer] = useState(0);

    // UI States
    const [acceptedTerms, setAcceptedTerms] = useState(false);
    const [showTermsModal, setShowTermsModal] = useState(false);
    const [loading, setLoading] = useState(false);

    // STATI PER LE MODALI
    const [showSuccess, setShowSuccess] = useState(false);
    const [showError, setShowError] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    const isLogin = type === 'login';
    const isProviderRegistration = !isLogin && role === 'PROVIDER';

    // --- EFFECTS ---
    useEffect(() => {
      setAcceptedTerms(false);
      setStep('FORM');
      setOtpCode('');
      if (type === 'login') {
          setDocumentFile(null);
          setVatNumber('');
          setDescription('');
      }
    }, [type]);

    useEffect(() => {
      let interval;
      if (resendTimer > 0) {
        interval = setInterval(() => setResendTimer(t => t - 1), 1000);
      }
      return () => clearInterval(interval);
    }, [resendTimer]);

    const redirectByRole = (userRole) => {
      if (userRole === 'PROVIDER') {
        navigate("/provider/dashboard");
      } else if (userRole === 'CUSTOMER') {
        navigate("/customer/dashboard");
      } else if (userRole === 'ADMIN') {
        navigate("/admin/dashboard");
      }
    };

    // --- HANDLERS ---
    const getRoleIcon = () => {
      if (role === 'PROVIDER') return Briefcase;
      if (role === 'ADMIN') return Shield;
      return User;
    };

    const handleInitialSubmit = async () => {
      if (!isLogin && !acceptedTerms) {
        setErrorMessage('Devi accettare i Termini e le Condizioni per procedere.');
        setShowError(true);
        return;
      }
      
      setLoading(true);
      try {
        if (isLogin) {
          const userData = await loginContext(email, password, role);
          setShowSuccess(true);
          setTimeout(() => {
            redirectByRole(userData.role);
          }, 800);

        } else {
          const registrationData = {
            email,
            password,
            ...(role === 'PROVIDER' ? { 
              name: email.split('@')[0], 
              serviceType,
              vatNumber,
              description,
            } : {})
          };

          await (role === 'PROVIDER' 
            ? authService.providerRegister(registrationData)
            : authService.customerRegister(registrationData));
        
          setStep('OTP');
          setResendTimer(30);
          setShowSuccess(true);
        }
      } catch (error) {
        console.error('Authentication error:', error);
        setErrorMessage(error.message || 'Errore durante la richiesta di accesso/registrazione.');
        setShowError(true);
      } finally {
        setLoading(false);
      }
    };

    const handleOtpVerify = async () => {
      if (otpCode.length < 6) return;
      setLoading(true);
      
      try {
        await authService.verifyOtp(email, otpCode, role === 'PROVIDER');
        console.log('OTP Verificato. Login completato.');
        setShowSuccess(true); 
        setStep('FORM'); 
        setPage('login');
        
      } catch (error) {
        console.error('OTP Verification error:', error);
        setErrorMessage(error.message || 'Codice OTP errato o scaduto.');
        setShowError(true);
      } finally {
        setLoading(false);
      }
    };

    const handleResendOtp = async () => {
      if (resendTimer > 0) return;
      setLoading(true);
      
      try {
        await authService.resendOtp(email, role === 'PROVIDER');
        setResendTimer(60);
        setShowSuccess(true);
      } catch (error) {
        console.error('Resend OTP error:', error);
        setErrorMessage(error.message || 'Impossibile inviare nuovo codice.');
        setShowError(true);
      } finally {
        setLoading(false);
      }
    };

    const breadcrumbsItems = [
      { label: 'Home', href: '/' }, // Aggiunto href per coerenza se il componente lo usa
      { label: 'Account' }, 
      { label: step === 'OTP' ? 'Verifica' : (isLogin ? 'Accedi' : 'Registrati') }
    ];

    // --- RENDER IDENTICO AL B&B ---
    return (
      <div className={`min-h-screen bg-white ${HOGU_THEME?.fontFamily || 'font-sans'} pb-24 md:pb-0`}>
        {/* Sfondo sfumato header - IDENTICO */}
        <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-gray-50 to-white -z-10"></div>

        {/* Container - IDENTICO (py-6 lg:py-10) */}
        <div className="max-w-7xl mx-auto px-4 py-6 lg:px-8 lg:py-10">
          
          <TermsModal isOpen={showTermsModal} onClose={() => setShowTermsModal(false)} />

          {/* Breadcrumbs - IDENTICO (usa il componente importato) */}
          <Breadcrumbs items={breadcrumbsItems} className="mb-6 opacity-80" />

          {/* Form Container */}
          <div className="flex justify-center w-full mt-4 md:mt-8">
            
            <div className={`
               w-full bg-white rounded-[2.5rem] shadow-2xl border border-white/50 overflow-hidden relative transition-all duration-500 ease-in-out
               ${isProviderRegistration && step === 'FORM' ? 'max-w-2xl' : 'max-w-md'} 
            `}>
              <div className="h-2 w-full bg-gradient-to-r from-[#68B49B] to-emerald-400"></div>
              
              <div className="p-8 md:p-10">
                
                {/* --- STEP 1: FORM --- */}
                {step === 'FORM' && (
                  <div className="animate-in fade-in slide-in-from-left-8 duration-500">
                    <div className="text-center mb-8">
                      <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#F0FDF9] text-[#68B49B] mb-4 shadow-sm animate-in zoom-in duration-300">
                        {isLogin ? <User size={32} /> : (role === 'PROVIDER' ? <Briefcase size={32}/> : <CheckCircle2 size={32} />)}
                      </div>
                      <h2 className="text-3xl font-extrabold text-gray-900 mb-2">
                        {isLogin ? 'Bentornato!' : (role === 'PROVIDER' ? 'Diventa Partner' : 'Crea Account')}
                      </h2>
                      <p className="text-gray-500 text-sm max-w-xs mx-auto">
                        {isLogin 
                          ? 'Inserisci le tue credenziali per accedere.' 
                          : "Inserisci i tuoi dati per unirti a HOGU."}
                      </p>
                    </div>

                    <div className="space-y-5">
                      <InputField icon={Mail} type="email" placeholder="Indirizzo Email" value={email} onChange={(e) => setEmail(e.target.value)} />
                      <InputField icon={Lock} type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
                      
                      <SelectField 
                        icon={getRoleIcon()}
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        options={[
                          { value: "CUSTOMER", label: "Cliente (Voglio prenotare)" },
                          { value: "PROVIDER", label: "Partner (Ho un'attività)" },
                          ...(isLogin ? [{ value: "ADMIN", label: "Amministratore" }] : [])
                        ]}
                      />

                      {/* Provider Extra Fields */}
                      {isProviderRegistration && (
                        <div className="animate-in fade-in slide-in-from-top-4 duration-500 space-y-5 pt-4 mt-4 border-t border-dashed border-gray-200">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="bg-[#E6F5F0] text-[#68B49B] text-xs font-bold px-2 py-1 rounded">INFO BUSINESS</span>
                            <span className="text-xs text-gray-400">Richieste per la validazione</span>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <SelectField 
                                icon={Briefcase}
                                value={serviceType}
                                onChange={(e) => setServiceType(e.target.value)}
                                options={[
                                  { value: "RESTAURANT", label: "Ristoranti" },
                                  { value: "BNB", label: "B&B" },
                                  { value: "CLUB", label: "Club" },
                                  { value: "NCC", label: "NCC" },
                                  { value: "LUGGAGE", label: "Luggage (Deposito Bagagli)" },
                                ]}
                              />
                              <InputField icon={CreditCard} type="text" placeholder="Partita IVA" value={vatNumber} onChange={(e) => setVatNumber(e.target.value)} />
                          </div>
                          <TextAreaField icon={AlignLeft} placeholder="Descrivi la tua attività..." value={description} onChange={(e) => setDescription(e.target.value)} />
                          <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700 ml-1">Documentazione</label>
                            <FileUpload fileName={documentFile?.name} onFileSelect={setDocumentFile} />
                            <div className="flex items-start gap-2 mt-2 px-2">
                              <AlertCircle size={14} className="text-gray-400 mt-0.5 shrink-0"/>
                              <p className="text-[10px] text-gray-400 leading-tight">Carica visura camerale o documento identità.</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {!isLogin && (
                        <div className="flex items-start gap-3 px-2 pt-2 animate-in fade-in slide-in-from-top-2 duration-300">
                          <div className="relative flex items-center mt-1">
                            <input type="checkbox" id="terms-check" checked={acceptedTerms} onChange={(e) => setAcceptedTerms(e.target.checked)} className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border-2 border-gray-300 transition-all checked:border-[#68B49B] checked:bg-[#68B49B] hover:border-[#68B49B]" />
                            <Check size={14} className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 transition-opacity peer-checked:opacity-100" />
                          </div>
                          <label htmlFor="terms-check" className="text-xs text-gray-500 leading-relaxed cursor-pointer select-none">
                            Accetto la <button type="button" onClick={(e) => { e.preventDefault(); setShowTermsModal(true); }} className="font-bold text-[#68B49B] hover:text-[#599c86] underline decoration-1 underline-offset-2">Privacy Policy e Termini</button>.
                          </label>
                        </div>
                      )}

                      <div className="pt-2">
                        <PrimaryButton onClick={handleInitialSubmit} disabled={loading || (!isLogin && !acceptedTerms)} className="w-full text-lg !py-4 !rounded-2xl shadow-lg shadow-[#68B49B]/20 flex items-center justify-center gap-2 group">
                          {loading ? 'Elaborazione...' : (
                            <>
                              {isLogin ? 'Accedi ora' : (role === 'PROVIDER' ? 'Invia Candidatura' : 'Registrati Gratis')}
                              <ArrowRight size={20} className={`transition-transform ${(!isLogin && !acceptedTerms) ? '' : 'group-hover:translate-x-1'}`} />
                            </>
                          )}
                        </PrimaryButton>
                      </div>
                    </div>

                    <div className="mt-8 text-center pt-6 border-t border-gray-50">
                      <p className="text-sm text-gray-500">
                        {isLogin ? 'Non hai ancora un account?' : 'Hai già un account?'} 
                        <button onClick={isLogin ? () => navigate('/register') : () => navigate('/login')}
                          className="font-bold text-[#68B49B] hover:underline hover:text-[#33594C] transition-colors ml-1">
                          {isLogin ? 'Registrati qui' : 'Accedi'}
                        </button>
                      </p>
                      <p className="text-sm text-gray-500 mt-2">
                        Password dimenticata?
                        <button 
                          onClick={() => navigate('/password-reset')} 
                          className="font-bold text-[#68B49B] hover:underline hover:text-[#33594C] transition-colors ml-1"
                        >
                          Richiedi nuova password
                        </button>
                      </p>
                    </div>
                  </div>
                )}

                {/* --- STEP 2: OTP --- */}
                {step === 'OTP' && (
                  <div className="animate-in fade-in slide-in-from-right-8 duration-500 text-center">
                    <button 
                      onClick={() => setStep('FORM')}
                      className="absolute top-6 left-6 p-2 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                    >
                      <ArrowLeft size={20} />
                    </button>

                     <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-[#E6F5F0] text-[#68B49B] mb-6 shadow-md animate-pulse">
                      <Mail size={40} />
                     </div>
                     
                     <h2 className="text-2xl font-bold text-gray-900 mb-2">Controlla la tua email</h2>
                     <p className="text-gray-500 mb-8 max-w-[280px] mx-auto text-sm">
                       Abbiamo inviato un codice di sicurezza a 6 cifre all'indirizzo <span className="font-bold text-gray-800">{email}</span>
                     </p>

                     <div className="mb-8">
                       <OtpInput value={otpCode} onChange={setOtpCode} />
                     </div>

                     <PrimaryButton 
                       onClick={handleOtpVerify} 
                       disabled={loading || otpCode.length < 6}
                       className="w-full !rounded-2xl mb-6"
                      >
                       {loading ? 'Verifica in corso...' : 'Verifica Identità'}
                     </PrimaryButton>

                     <div className="border-t border-gray-100 pt-6">
                       <p className="text-sm text-gray-500 mb-2">Non hai ricevuto il codice?</p>
                       <button 
                         onClick={handleResendOtp}
                         disabled={resendTimer > 0 || loading}
                         className={`
                           flex items-center justify-center gap-2 mx-auto font-bold text-sm transition-colors
                           ${resendTimer > 0 ? 'text-gray-400 cursor-not-allowed' : 'text-[#68B49B] hover:text-[#33594C]'}
                         `}
                       >
                         <RefreshCw size={16} className={resendTimer > 0 ? 'animate-spin' : ''} />
                         {resendTimer > 0 ? `Invia di nuovo tra ${resendTimer}s` : 'Invia nuovo codice'}
                       </button>
                     </div>
                   </div>
                )}

              </div>
            </div>
          </div>

          {/* --- MODALI --- */}
          <LoadingScreen isLoading={loading} />

          <SuccessModal 
              isOpen={showSuccess}
              onClose={() => setShowSuccess(false)}
              title={step === 'OTP' ? 'Codice inviato!' : 'Accesso Riuscito!'}
              message={step === 'OTP' ? `Il codice OTP è stato inviato all'indirizzo ${email}. Controlla la tua casella.` : 'Credenziali verificate con successo.'}
              confirmText={step === 'OTP' ? 'Chiudi' : 'Continua'}
          />

          {showError && (
              <ErrorModal
                  message={errorMessage}
                  onClose={() => setShowError(false)}
              />
          )}
        </div>
      </div>
    );
};

export default AuthForm;
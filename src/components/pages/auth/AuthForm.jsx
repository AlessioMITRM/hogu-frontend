import React, { useState, useEffect, useRef } from 'react';
import {
  Mail, Lock, User, Briefcase, ArrowRight, CheckCircle2,
  X, Check, Upload, CreditCard, AlignLeft, AlertCircle,
  KeyRound, RefreshCw, ArrowLeft, MapPin
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { authService } from '../../../api/apiClient';
import { useAuth } from '../../../components/context/AuthContext.jsx';
import { validateTotalFileSize } from '../../../utils/fileValidation';
import { isValidItalianVAT, PASSWORD_REGEX, getPasswordRequirements } from '../../../utils/validationUtils';
import { CityAutocomplete } from '../../ui/CityAutocomplete';
import { createLocationPayload } from '../../../utils/locationUtils';

import { Breadcrumbs } from '../../../components/ui/Breadcrumbs.jsx';
// --- COMPONENTI UI LOCALI (Input, Button, etc.) ---
import LoadingScreen from '../../../components/ui/LoadingScreen.jsx';
import SuccessModal from '../../../components/ui/SuccessModal.jsx';
import ErrorModal from '../../../components/ui/ErrorModal.jsx';
import { HOGU_THEME } from '../../../config/theme.js';

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

const InputField = ({ icon: Icon, type, placeholder, value, onChange, error, touched, className = '', ...props }) => (
  <div className={`relative group ${className}`}>
    <div className={`absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#68B49B] transition-colors duration-300 ${error && touched ? '!text-red-500' : ''}`}>
      <Icon size={20} />
    </div>
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      {...props}
      className={`w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-transparent rounded-2xl text-gray-700 font-medium outline-none transition-all duration-300 focus:bg-white focus:border-[#68B49B]/30 focus:shadow-[0_0_0_4px_rgba(104,180,155,0.1)] placeholder:text-gray-400 disabled:bg-gray-100 ${error && touched ? 'border-red-500/50 bg-red-50/30 focus:border-red-500/30 focus:shadow-[0_0_0_4px_rgba(239,68,68,0.1)]' : ''}`}
    />
    {error && touched && (
      <p className="mt-1 ml-4 text-[10px] font-bold text-red-500 animate-in fade-in slide-in-from-top-1">
        {error}
      </p>
    )}
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

const FileUpload = ({ onFilesSelect, files, onRemove }) => {
  const { t } = useTranslation('auth');
  const fileInputRef = useRef(null);
  const handleDivClick = () => fileInputRef.current.click();

  const handleFileChange = (e) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      const validation = validateTotalFileSize(selectedFiles, files);

      if (!validation.isValid) {
        // Possiamo passare l'errore verso l'alto o gestirlo qui
        alert(validation.error); // Semplice alert per ora, o possiamo passare una proponError
        e.target.value = '';
        return;
      }

      onFilesSelect(selectedFiles);
      // Reset input per permettere di ricaricare lo stesso file se rimosso
      e.target.value = '';
    }
  };

  return (
    <div className="space-y-3">
      <div
        onClick={handleDivClick}
        className={`
                    border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer group relative overflow-hidden
                    ${files.length > 0 ? 'border-[#68B49B] bg-[#E6F5F0]/10' : 'border-gray-200 hover:border-[#68B49B]/50 hover:bg-gray-50'}
                `}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          accept=".pdf,.jpg,.jpeg,.png"
          multiple
        />
        <div className="relative z-10">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 transition-transform duration-300 ${files.length > 0 ? 'bg-[#68B49B] text-white' : 'bg-[#E6F5F0] text-[#68B49B] group-hover:scale-110'}`}>
            <Upload size={24} />
          </div>
          <p className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
            {files.length > 0 ? t('file_upload.add_more') : t('file_upload.upload_docs')}
          </p>
          <p className="text-xs text-gray-400 mt-1">{t('file_upload.multiple_files')}</p>
        </div>
      </div>

      {/* Lista File Caricati */}
      {files.length > 0 && (
        <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
          {files.map((file, index) => (
            <div key={`${file.name}-${index}`} className="flex items-center justify-between bg-gray-50 p-3 rounded-xl border border-gray-100 group">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="bg-white p-2 rounded-lg text-[#68B49B] shadow-sm">
                  <Check size={16} />
                </div>
                <div className="overflow-hidden">
                  <p className="text-xs font-bold text-gray-700 truncate">{file.name}</p>
                  <p className="text-[10px] text-gray-400">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); onRemove(index); }}
                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
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
  const { t } = useTranslation('auth');
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-[2rem] w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl relative">
        <button onClick={onClose} className="absolute right-4 top-4 p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"><X size={20} /></button>
        <div className="p-8">
          <h3 className="text-2xl font-bold mb-4 text-[#33594C]">{t('terms_modal.title')}</h3>
          <div className="prose prose-sm max-h-[50vh] overflow-y-auto custom-scrollbar text-gray-600">
            <p><strong>{t('terms_modal.req_1')}</strong> {t('terms_modal.req_1_desc')}</p>
            <p><strong>{t('terms_modal.req_2')}</strong> {t('terms_modal.req_2_desc')}</p>
            <button onClick={onClose} className="w-full mt-6 bg-[#68B49B] text-white py-3 rounded-xl font-bold hover:bg-[#599c86]">{t('terms_modal.understand')}</button>
          </div>
        </div>
      </div>
    </div>
  );
};

const PasswordRequirements = ({ requirements }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 mt-2 px-1 animate-in fade-in slide-in-from-top-1 duration-400">
    {requirements.map((req, idx) => (
      <div key={idx} className="flex items-center gap-2">
        <div className={`shrink-0 w-3.5 h-3.5 rounded-full flex items-center justify-center transition-all duration-300 ${req.met ? 'bg-emerald-500 text-white scale-110' : 'bg-gray-200 text-gray-400'}`}>
          {req.met ? <Check size={8} strokeWidth={4} /> : <div className="w-1 h-1 bg-current rounded-full" />}
        </div>
        <span className={`text-[10px] font-bold tracking-tight transition-colors duration-300 ${req.met ? 'text-emerald-600' : 'text-gray-400'}`}>
          {req.label}
        </span>
      </div>
    ))}
  </div>
);

// --- COMPONENTE PRINCIPALE ---
export const AuthForm = ({ type = 'register', setPage = () => { } }) => {

  const { t } = useTranslation('auth');
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
  const [iban, setIban] = useState('');
  const [description, setDescription] = useState('');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [cap, setCap] = useState('');
  const [documentFiles, setDocumentFiles] = useState([]); // Supporto per file multipli

  // STATI PER LA VALIDAZIONE
  const [formErrors, setFormErrors] = useState({});
  const [touchedFields, setTouchedFields] = useState({});

  // Funzione di validazione real-time
  const validateField = (name, val) => {
    let error = '';
    if (name === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!val) error = t('validation.email_required');
      else if (!emailRegex.test(val)) error = t('validation.email_invalid');
    }
    if (name === 'password') {
      if (!val) error = t('validation.password_required');
      else if (!isLogin && !PASSWORD_REGEX.test(val)) error = t('validation.password_weak');
    }
    if (name === 'vatNumber' && role === 'PROVIDER') {
      if (!val) error = t('validation.vat_required');
      else if (!isValidItalianVAT(val)) error = t('validation.vat_invalid');
    }
    if (name === 'iban' && role === 'PROVIDER') {
      if (!val) error = t('validation.iban_required');
      else if (val.length < 15) error = t('validation.iban_invalid'); // Basic length check
    }
    if (name === 'city' && !val) error = t('validation.city_required');
    if (name === 'address' && !val) error = t('validation.address_required');
    if (name === 'cap' && !val) error = t('validation.cap_required');
    return error;
  };

  const handleFieldChange = (setter, name) => (e) => {
    const val = e.target.value;
    setter(val);
    setTouchedFields(prev => ({ ...prev, [name]: true }));
    const error = validateField(name, val);
    setFormErrors(prev => ({ ...prev, [name]: error }));
  };

  // Calcolo validità form
  const isFormValid = () => {
    if (isLogin) {
      return email && password && !formErrors.email && !formErrors.password;
    }
    const baseValid = email && password && city && address && cap && !formErrors.email && !formErrors.password && acceptedTerms && isOfAge;
    if (role === 'PROVIDER') {
      return baseValid && iban && !formErrors.iban && documentFiles.length > 0;
    }
    return baseValid;
  };

  const passwordRequirements = getPasswordRequirements(password);

  // Messaggi dinamici per tipo di documento richiesto
  const getRequirementMessage = () => {
    switch (serviceType) {
      case 'RESTAURANT': return t('requirements.RESTAURANT');
      case 'BNB': return t('requirements.BNB');
      case 'CLUB': return t('requirements.CLUB');
      case 'NCC': return t('requirements.NCC');
      case 'LUGGAGE': return t('requirements.LUGGAGE');
      default: return t('requirements.default');
    }
  };

  // OTP Data
  const [otpCode, setOtpCode] = useState('');
  const [resendTimer, setResendTimer] = useState(0);

  // UI States
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [isOfAge, setIsOfAge] = useState(false);
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
    setIsOfAge(false);
    setStep('FORM');
    setOtpCode('');
    setFormErrors({});
    setTouchedFields({});
    if (type === 'login') {
      setDocumentFiles([]); // Reset array
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
    }
  };

  // --- HANDLERS ---
  const getRoleIcon = () => {
    if (role === 'PROVIDER') return Briefcase;
    return User;
  };

  const handleInitialSubmit = async () => {
    if (!isLogin) {
      if (!acceptedTerms || !isOfAge) return; // Non dovrebbe succedere grazie al disabled
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
        // Controllo Documentazione Obbligatoria
        if (role === 'PROVIDER' && documentFiles.length === 0) {
          setErrorMessage(t('errors.doc_required'));
          setShowError(true);
          return;
        }

        // Estrazione lingua e stato dal browser
        const browserLang = navigator.language || navigator.userLanguage || "it-IT";
        const userLanguage = browserLang.split("-")[0] || "it";
        const userState = browserLang.split("-")[1] || userLanguage.toUpperCase();

        // Creazione FormData per invio multipart
        const formData = new FormData();
        formData.append('email', email);
        formData.append('password', password);

        // Location resolution (Ensure English for payload)
        const locationPayload = createLocationPayload(city, address, role === 'PROVIDER' ? serviceType : null);
        const englishLocation = locationPayload?.[0] || {};
        const englishCity = englishLocation.city || city;
        const englishState = englishLocation.state || userState;
        const englishProvince = englishLocation.province || '';

        if (role === 'PROVIDER') {
          formData.append('role', role);
          formData.append('name', email.split('@')[0]);
          formData.append('serviceType', serviceType);
          formData.append('iban', iban);
          formData.append('description', description);
          formData.append('language', userLanguage);
          formData.append('state', userState); // Keep original state/language for user pref
          formData.append('maxCapacity', 0);
          formData.append('basePrice', 0);

          // Location info for Provider (using locales array)
          formData.append('locales[0].language', userLanguage);
          formData.append('locales[0].city', city);
          formData.append('locales[0].state', userState);
          formData.append('locales[0].province', englishProvince);
          formData.append('locales[0].address', address);
          formData.append('locales[0].postalCode', cap);
          formData.append('locales[0].serviceType', serviceType);

          // Aggiungiamo i documenti
          documentFiles.forEach((file, index) => {
            formData.append(`documents[${index}].file`, file);
            formData.append(`documents[${index}].filename`, file.name);
          });
        }

        let customerLocales = [];
        if (locationPayload && locationPayload.length > 0) {
            // Need to create a copy so we don't mutate the original array unexpectedly
            customerLocales = [...locationPayload];
            customerLocales[0] = { ...customerLocales[0], postalCode: cap };
        }

        await (role === 'PROVIDER'
          ? authService.providerRegister(formData)
          : authService.customerRegister({
            email,
            password,
            name: 'Utente',
            surname: 'Hogu',
            language: userLanguage,
            state: userState,
            locales: customerLocales
          }));

        setStep('OTP');
        setResendTimer(30);
        setShowSuccess(true);
      }
    } catch (error) {
      console.error('Authentication error:', error);
      setErrorMessage(error.message || t('errors.generic_auth'));
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
      console.log('OTP Verificato. Registrazione completata.');
      setStep('COMPLETED');
      setShowSuccess(true);

    } catch (error) {
      console.error('OTP Verification error:', error);
      setErrorMessage(error.message || t('errors.otp_invalid'));
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
      setErrorMessage(error.message || t('errors.otp_resend'));
      setShowError(true);
    } finally {
      setLoading(false);
    }
  };

  const breadcrumbsItems = [
    { label: t('breadcrumbs.home'), href: '/' }, // Aggiunto href per coerenza se il componente lo usa
    { label: t('breadcrumbs.account') },
    { label: step === 'OTP' ? t('breadcrumbs.verify') : (isLogin ? t('breadcrumbs.login') : t('breadcrumbs.register')) }
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
                      {isLogin ? <User size={32} /> : (role === 'PROVIDER' ? <Briefcase size={32} /> : <CheckCircle2 size={32} />)}
                    </div>
                    <h2 className="text-3xl font-extrabold text-gray-900 mb-2">
                      {isLogin ? t('form.welcome_back') : (role === 'PROVIDER' ? t('form.become_partner') : t('form.create_account'))}
                    </h2>
                    <p className="text-gray-500 text-sm max-w-xs mx-auto">
                      {isLogin
                        ? t('form.login_desc')
                        : t('form.register_desc')}
                    </p>
                  </div>

                  <div className="space-y-6">
                    <InputField icon={Mail} type="email" placeholder={t('form.email_placeholder')} value={email} onChange={handleFieldChange(setEmail, 'email')} error={formErrors.email} touched={touchedFields.email} />
                    <div className="space-y-1">
                      <InputField icon={Lock} type="password" placeholder={t('form.password_placeholder')} value={password} onChange={handleFieldChange(setPassword, 'password')} error={formErrors.password} touched={touchedFields.password} />
                      {!isLogin && password && <PasswordRequirements requirements={passwordRequirements} />}
                    </div>

                    <SelectField
                      icon={getRoleIcon()}
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      options={[
                        { value: "CUSTOMER", label: t('form.role_customer') },
                        { value: "PROVIDER", label: t('form.role_provider') }
                      ]}
                    />

                    {/* common location fields for registration */}
                    {!isLogin && (
                      <div className="space-y-4 pt-4 border-t border-dashed border-gray-200 animate-in fade-in slide-in-from-top-4 duration-500">
                        <CityAutocomplete
                          label={t('form.city_label')}
                          placeholder={t('form.city_placeholder')}
                          value={city}
                          onChange={(val) => {
                            setCity(val);
                            setTouchedFields(prev => ({ ...prev, city: true }));
                            setFormErrors(prev => ({ ...prev, city: !val ? t('validation.city_required') : '' }));
                          }}
                          icon={MapPin}
                        />

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="md:col-span-2">
                            <InputField
                              icon={MapPin}
                              type="text"
                              placeholder={t('form.address_placeholder')}
                              value={address}
                              onChange={handleFieldChange(setAddress, 'address')}
                              error={formErrors.address}
                              touched={touchedFields.address}
                            />
                          </div>
                          <div>
                            <InputField
                              icon={MapPin}
                              type="text"
                              placeholder={t('form.zip_code_label')}
                              value={cap}
                              onChange={handleFieldChange(setCap, 'cap')}
                              error={formErrors.cap}
                              touched={touchedFields.cap}
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Provider Extra Fields */}
                    {isProviderRegistration && (
                      <div className="animate-in fade-in slide-in-from-top-4 duration-500 space-y-5 pt-4 mt-4 border-t border-dashed border-gray-200">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="bg-[#E6F5F0] text-[#68B49B] text-xs font-bold px-2 py-1 rounded">{t('form.business_info')}</span>
                          <span className="text-xs text-gray-400">{t('form.validation_req')}</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <SelectField
                            icon={Briefcase}
                            value={serviceType}
                            onChange={(e) => setServiceType(e.target.value)}
                            options={[
                              { value: "RESTAURANT", label: t('form.services.RESTAURANT') },
                              { value: "BNB", label: t('form.services.BNB') },
                              { value: "CLUB", label: t('form.services.CLUB') },
                              { value: "NCC", label: t('form.services.NCC') },
                              { value: "LUGGAGE", label: t('form.services.LUGGAGE') },
                            ]}
                          />
                          <InputField icon={CreditCard} type="text" placeholder={t('form.iban_placeholder')} value={iban} onChange={handleFieldChange(setIban, 'iban')} error={formErrors.iban} touched={touchedFields.iban} />
                        </div>
                        <TextAreaField icon={AlignLeft} placeholder={t('form.description_placeholder')} value={description} onChange={(e) => setDescription(e.target.value)} />
                        <div className="space-y-2">
                          <label className="text-sm font-bold text-gray-700 ml-1">{t('form.documentation')}</label>
                          <FileUpload
                            files={documentFiles}
                            onFilesSelect={(newFiles) => setDocumentFiles([...documentFiles, ...newFiles])}
                            onRemove={(index) => setDocumentFiles(documentFiles.filter((_, i) => i !== index))}
                          />
                          <div className="flex items-start gap-3 mt-3 p-4 bg-emerald-50 rounded-2xl border border-emerald-100/50 shadow-sm animate-in fade-in zoom-in duration-500">
                            <AlertCircle size={20} className="text-[#68B49B] mt-0.5 shrink-0" />
                            <div className="flex flex-col gap-1">
                              <span className="text-[11px] font-bold text-[#33594C] uppercase tracking-wider">{t('form.docs_needed_for', { serviceType })}</span>
                              <p className="text-sm text-[#4E7D6D] font-semibold leading-snug">{getRequirementMessage()}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {!isLogin && (
                      <div className="space-y-3 px-2 pt-2 animate-in fade-in slide-in-from-top-2 duration-300">
                        <div className="flex items-start gap-3">
                          <div className="relative flex items-center mt-1">
                            <input type="checkbox" id="age-check" checked={isOfAge} onChange={(e) => setIsOfAge(e.target.checked)} className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border-2 border-gray-300 transition-all checked:border-[#68B49B] checked:bg-[#68B49B] hover:border-[#68B49B]" />
                            <Check size={14} className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 transition-opacity peer-checked:opacity-100" />
                          </div>
                          <label htmlFor="age-check" className="text-xs text-gray-500 leading-relaxed cursor-pointer select-none">
                            {t('form.is_of_age')} <span className="font-bold text-gray-700">{t('form.of_age_bold')}</span>.
                          </label>
                        </div>

                        <div className="flex items-start gap-3">
                          <div className="relative flex items-center mt-1">
                            <input type="checkbox" id="terms-check" checked={acceptedTerms} onChange={(e) => setAcceptedTerms(e.target.checked)} className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border-2 border-gray-300 transition-all checked:border-[#68B49B] checked:bg-[#68B49B] hover:border-[#68B49B]" />
                            <Check size={14} className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 transition-opacity peer-checked:opacity-100" />
                          </div>
                          <label htmlFor="terms-check" className="text-xs text-gray-500 leading-relaxed cursor-pointer select-none">
                            {t('form.accept_the')} <button type="button" onClick={(e) => { e.preventDefault(); setShowTermsModal(true); }} className="font-bold text-[#68B49B] hover:text-[#599c86] underline decoration-1 underline-offset-2">{t('form.privacy_terms')}</button>.
                          </label>
                        </div>
                      </div>
                    )}
                    <div className="pt-4">
                      <PrimaryButton onClick={handleInitialSubmit} disabled={loading || !isFormValid()} className="w-full text-lg !py-4 !rounded-2xl shadow-lg shadow-[#68B49B]/20 flex items-center justify-center gap-2 group">
                        {loading ? t('form.processing') : (
                          <>
                            {isLogin ? t('form.login_now') : (role === 'PROVIDER' ? t('form.submit_app') : t('form.register_free'))}
                            <ArrowRight size={20} className={`transition-transform ${!isFormValid() ? '' : 'group-hover:translate-x-1'}`} />
                          </>
                        )}
                      </PrimaryButton>
                    </div>

                  </div>

                  <div className="mt-8 text-center pt-6 border-t border-gray-50">
                    <p className="text-sm text-gray-500">
                      {isLogin ? t('form.no_account') : t('form.have_account')}
                      <button onClick={isLogin ? () => navigate('/register') : () => navigate('/login')}
                        className="font-bold text-[#68B49B] hover:underline hover:text-[#33594C] transition-colors ml-1">
                        {isLogin ? t('form.register_here') : t('form.login')}
                      </button>
                    </p>
                    <p className="text-sm text-gray-500 mt-2">
                      {t('form.forgot_pass')}
                      <button
                        onClick={() => navigate('/password-reset')}
                        className="font-bold text-[#68B49B] hover:underline hover:text-[#33594C] transition-colors ml-1"
                      >
                        {t('form.req_new_pass')}
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

                  <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('otp.check_email')}</h2>
                  <p className="text-gray-500 mb-8 max-w-[280px] mx-auto text-sm">
                    {t('otp.sent_code')} <span className="font-bold text-gray-800">{email}</span>
                  </p>

                  <div className="mb-8">
                    <OtpInput value={otpCode} onChange={setOtpCode} />
                  </div>

                  <PrimaryButton
                    onClick={handleOtpVerify}
                    disabled={loading || otpCode.length < 6}
                    className="w-full !rounded-2xl mb-6"
                  >
                    {loading ? t('otp.verifying') : t('otp.verify_identity')}
                  </PrimaryButton>

                  <div className="border-t border-gray-100 pt-6">
                    <p className="text-sm text-gray-500 mb-2">{t('otp.no_code')}</p>
                    <button
                      onClick={handleResendOtp}
                      disabled={resendTimer > 0 || loading}
                      className={`
                           flex items-center justify-center gap-2 mx-auto font-bold text-sm transition-colors
                           ${resendTimer > 0 ? 'text-gray-400 cursor-not-allowed' : 'text-[#68B49B] hover:text-[#33594C]'}
                         `}
                    >
                      <RefreshCw size={16} className={resendTimer > 0 ? 'animate-spin' : ''} />
                      {resendTimer > 0 ? t('otp.resend_in', { resendTimer }) : t('otp.resend_now')}
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
          onClose={() => {
            setShowSuccess(false);
            if (step === 'COMPLETED') {
              navigate('/login');
            }
          }}
          title={
            step === 'OTP'
              ? t('modals.code_sent')
              : (role === 'PROVIDER' && step === 'COMPLETED' ? t('modals.reg_received') : t('modals.op_success'))
          }
          message={
            step === 'OTP'
              ? t('modals.otp_sent_to', { email })
              : (role === 'PROVIDER' && step === 'COMPLETED'
                ? t('modals.provider_pending')
                : t('modals.reg_success'))
          }
          confirmText={step === 'OTP' ? t('modals.close') : t('modals.go_login')}
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
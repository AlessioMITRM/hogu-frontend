import React, { useState, useEffect } from 'react';
import { 
    Mail, Lock, KeyRound, ArrowLeft, 
    CheckCircle2, RefreshCw, ShieldCheck
} from 'lucide-react'; 
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { authService } from '../../../api/apiClient'; 
import { Breadcrumbs } from '../../../components/ui/Breadcrumbs.jsx'; 
import SuccessModal from '../../../components/ui/SuccessModal.jsx';
import ErrorModal from '../../../components/ui/ErrorModal.jsx';
import LoadingScreen from '../../../components/ui/LoadingScreen.jsx';
import { HOGU_THEME } from '../../../config/theme.js';

// --- COMPONENTI UI ---
const PrimaryButton = ({ children, onClick, disabled, className = '', type = 'button' }) => (
    <button type={type} onClick={onClick} disabled={disabled} className={`bg-[#68B49B] text-white font-bold py-3 px-6 rounded-xl hover:bg-[#599c86] transition-all shadow-lg shadow-[#68B49B]/20 hover:shadow-xl hover:shadow-[#68B49B]/30 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none disabled:hover:scale-100 ${className}`}>
        {children}
    </button>
);

const InputField = ({ icon: Icon, type, placeholderKey, placeholder, value, onChange, className = '', ...props }) => {
    const { t } = useTranslation();
    return (
        <div className={`relative group ${className}`}>
            {Icon && <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#68B49B] transition-colors duration-300"><Icon size={20} /></div>}
            <input
                type={type}
                placeholder={placeholderKey ? t(placeholderKey) : placeholder}
                value={value}
                onChange={onChange}
                {...props}
                className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-transparent rounded-2xl text-gray-700 font-medium outline-none transition-all duration-300 focus:bg-white focus:border-[#68B49B]/30 focus:shadow-[0_0_0_4px_rgba(104,180,155,0.1)] placeholder:text-gray-400 disabled:bg-gray-100"
            />
        </div>
    );
};

const OtpInput = ({ value, onChange }) => (
    <div className="relative">
        <div className="absolute left-0 top-1/2 -translate-y-1/2 pl-4 text-gray-400"><KeyRound size={24} /></div>
        <input
            type="text"
            maxLength="6"
            value={value}
            onChange={(e) => onChange(e.target.value.replace(/[^0-9]/g, ''))}
            placeholder="0 0 0 0 0 0"
            className="w-full pl-14 pr-4 py-4 text-2xl tracking-[0.5em] font-mono text-center bg-gray-50 border-2 border-transparent rounded-2xl text-gray-900 outline-none transition-all focus:bg-white focus:border-[#68B49B] focus:shadow-[0_0_0_4px_rgba(104,180,155,0.1)] placeholder:tracking-widest placeholder:text-gray-300"
        />
    </div>
);

// --- COMPONENTE PRINCIPALE ---
const PasswordResetAuth = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();

    const [step, setStep] = useState('REQUEST'); 
    const [email, setEmail] = useState('');
    const [otpCode, setOtpCode] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [resendTimer, setResendTimer] = useState(0);
    const [loading, setLoading] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [showError, setShowError] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        let interval;
        if (resendTimer > 0) interval = setInterval(() => setResendTimer(t => t - 1), 1000);
        return () => clearInterval(interval);
    }, [resendTimer]);

    const handleRequestCode = async () => {
        if (!email || !email.includes('@')) {
            setErrorMessage(t('password_reset.invalid_email'));
            setShowError(true);
            return;
        }
        setLoading(true);
        try {
            await authService.requestPasswordReset(email);
            setStep('RESET');
            setResendTimer(60);
        } catch (error) {
            setErrorMessage(error.message || t('password_reset.reset_code_error'));
            setShowError(true);
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async () => {
        if (otpCode.length < 6) { setErrorMessage(t('password_reset.otp_length')); setShowError(true); return; }
        if (newPassword.length < 8) { setErrorMessage(t('password_reset.password_min')); setShowError(true); return; }
        if (newPassword !== confirmPassword) { setErrorMessage(t('password_reset.password_mismatch')); setShowError(true); return; }

        setLoading(true);
        try {
            await authService.confirmPasswordReset(email, otpCode, newPassword);
            setShowSuccess(true);
        } catch (error) {
            setErrorMessage(error.message || t('password_reset.reset_failed'));
            setShowError(true);
        } finally {
            setLoading(false);
        }
    };

    const handleResendOtp = async () => {
        if (resendTimer > 0) return;
        setLoading(true);
        try {
            await authService.requestPasswordReset(email);
            setResendTimer(60);
        } catch {
            setErrorMessage(t('password_reset.resend_error'));
            setShowError(true);
        } finally {
            setLoading(false);
        }
    };

    const breadcrumbsItems = [
        { label: t('password_reset.breadcrumbs.home'), href: '/' }, 
        { label: t('password_reset.breadcrumbs.account') }, 
        { label: t('password_reset.breadcrumbs.password_recovery') }
    ];

    return (
        <div className={`min-h-screen bg-white ${HOGU_THEME?.fontFamily || 'font-sans'} pb-24 md:pb-0 relative`}>
            <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-gray-50 to-white -z-10"></div>
            <div className="max-w-7xl mx-auto px-4 py-6 lg:px-8 lg:py-10">
                <Breadcrumbs items={breadcrumbsItems} className="mb-6 opacity-80" />

                <div className="flex justify-center w-full mt-4 md:mt-8">
                    <div className="w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl border border-white/50 overflow-hidden relative transition-all duration-500">
                        <div className="h-2 w-full bg-gradient-to-r from-[#68B49B] to-emerald-400"></div>

                        <div className="p-8 md:p-10">
                            {step === 'REQUEST' && (
                                <div className="animate-in fade-in slide-in-from-left-8 duration-500">
                                    <button onClick={() => navigate('/login')} className="absolute top-6 left-6 p-2 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"><ArrowLeft size={20} /></button>

                                    <div className="text-center mb-8 mt-4">
                                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#F0FDF9] text-[#68B49B] mb-4 shadow-sm animate-in zoom-in duration-300">
                                            <Lock size={32} />
                                        </div>
                                        <h2 className="text-3xl font-extrabold text-gray-900 mb-2">{t('password_reset.forgot_password')}</h2>
                                        <p className="text-gray-500 text-sm max-w-xs mx-auto">{t('password_reset.request_description')}</p>
                                    </div>

                                    <div className="space-y-6">
                                        <InputField icon={Mail} type="email" placeholderKey="email_placeholder" value={email} onChange={(e) => setEmail(e.target.value)} />
                                        <PrimaryButton onClick={handleRequestCode} disabled={loading || !email} className="w-full !rounded-2xl">{loading ? t('password_reset.sending') : t('password_reset.send_reset_code')}</PrimaryButton>
                                    </div>

                                    <div className="mt-8 text-center pt-6 border-t border-gray-50">
                                        <p className="text-sm text-gray-500">{t('password_reset.remember_password')} <button onClick={() => navigate('/login')} className="font-bold text-[#68B49B] hover:underline hover:text-[#33594C] transition-colors ml-1">{t('password_reset.login')}</button></p>
                                    </div>
                                </div>
                            )}

                            {step === 'RESET' && (
                                <div className="animate-in fade-in slide-in-from-right-8 duration-500">
                                    <button onClick={() => setStep('REQUEST')} className="absolute top-6 left-6 p-2 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"><ArrowLeft size={20} /></button>

                                    <div className="text-center mb-6 mt-4">
                                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#E6F5F0] text-[#68B49B] mb-4 shadow-sm"><ShieldCheck size={32} /></div>
                                        <h2 className="text-2xl font-bold text-gray-900 mb-1">{t('password_reset.create_new_password')}</h2>
                                        <p className="text-gray-500 text-sm">{t('password_reset.code_sent_to')} <span className="font-bold">{email}</span></p>
                                    </div>

                                    <div className="space-y-5">
                                        <div>
                                            <label className="text-xs font-bold text-gray-500 uppercase ml-1 mb-1 block">{t('password_reset.otp_code')}</label>
                                            <OtpInput value={otpCode} onChange={setOtpCode} />
                                        </div>

                                        <div className="space-y-4 pt-2">
                                            <InputField icon={Lock} type="password" placeholderKey="new_password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                                            <InputField icon={CheckCircle2} type="password" placeholderKey="confirm_password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                                        </div>

                                        <PrimaryButton onClick={handleResetPassword} disabled={loading || otpCode.length < 6 || !newPassword || !confirmPassword} className="w-full !rounded-2xl mt-4">{loading ? t('password_reset.updating') : t('password_reset.reset_password')}</PrimaryButton>
                                    </div>

                                    <div className="mt-6 text-center">
                                        <button onClick={handleResendOtp} disabled={resendTimer > 0 || loading} className={`flex items-center justify-center gap-2 mx-auto font-bold text-sm transition-colors ${resendTimer > 0 ? 'text-gray-400 cursor-not-allowed' : 'text-[#68B49B] hover:text-[#33594C]'}`}>
                                            <RefreshCw size={14} className={resendTimer > 0 ? 'animate-spin' : ''} />
                                            {resendTimer > 0 ? t('password_reset.resend_in', { seconds: resendTimer }) : t('password_reset.did_not_receive_code')}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <LoadingScreen isLoading={loading} />
                <SuccessModal isOpen={showSuccess} onClose={() => { setShowSuccess(false); navigate('/login'); }} title={t('password_reset.password_updated')} message={t('password_reset.password_updated_message')} confirmText={t('password_reset.go_to_login')} />
                {showError && <ErrorModal message={errorMessage} onClose={() => setShowError(false)} />}
            </div>
        </div>
    );
};

export default PasswordResetAuth;

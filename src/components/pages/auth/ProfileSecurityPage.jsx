import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
    ShieldCheck, KeyRound, Mail,
    CheckCircle, AlertTriangle, Eye, EyeOff, Save, RefreshCw,
    Lock, Check, ArrowRight, User, MapPin, FileText, Trash2, X
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { authService, logout, restaurantService } from '../../../api/apiClient';
import { CityAutocomplete } from '../../ui/CityAutocomplete';
import { createLocationPayload, getDisplayLocation } from '../../../utils/locationUtils';
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



// --- COMPONENTI UI PICCOLI (Invariati) ---
const PasswordStrengthIndicator = ({ password }) => {
    const { t } = useTranslation(['profile']);
    const requirements = getPasswordRequirements(password);
    const strength = requirements.filter(r => r.met).length;

    const getLabel = () => {
        if (password.length === 0) return { label: t('password.strength.placeholder'), color: 'bg-slate-200' };
        if (strength <= 2) return { label: t('password.strength.weak'), color: 'bg-red-400' };
        if (strength === 3 || strength === 4) return { label: t('password.strength.good'), color: 'bg-amber-400' };
        return { label: t('password.strength.strong'), color: 'bg-emerald-400' };
    };

    const status = getLabel();

    return (
        <div className="mt-3">
            <div className="flex justify-between items-center mb-1.5">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">{t('password.strength.title')}</span>
                <span className={`text-[10px] font-bold uppercase ${status.color.replace('bg-', 'text-')}`}>{status.label}</span>
            </div>
            <div className="flex gap-1 h-1.5">
                {[1, 2, 3, 4, 5].map((step) => (
                    <div
                        key={step}
                        className={`flex-1 rounded-full transition-all duration-300 ${strength >= step ? status.color : 'bg-slate-100'}`}
                    />
                ))}
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2">
                {requirements.map((req, idx) => (
                    <ValidationItem key={idx} label={t(`password.requirements.${req.key}`)} isValid={req.met} />
                ))}
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

// --- UTILS LOCATION REMOVED (Using shared utils) ---

import { isValidItalianVAT, PASSWORD_REGEX, getPasswordRequirements } from '../../../utils/validationUtils';

const ProfileUpdateCard = ({ user: initialUser }) => {
    const { t, i18n } = useTranslation(['profile']);
    const [user, setUser] = useState(initialUser);
    const [form, setForm] = useState({
        name: initialUser?.name || '',
        surname: initialUser?.surname || '',
        addressLine: '',
        postalCode: '',
        locationLabel: ''
    });
    // const [selectedRawLocation, setSelectedRawLocation] = useState(null); // Removed as not needed with shared utils
    const [currentServiceType, setCurrentServiceType] = useState(null);

    // Fetch fresh profile data
    useEffect(() => {
        const fetchProfile = async () => {
            if (!initialUser) return;
            try {
                let data;
                if (initialUser.role === 'PROVIDER') {
                    data = await authService.getProviderProfile();
                } else {
                    data = await authService.getCustomerProfile();
                }

                setUser(data);

                // Initialize form with fetched data
                const availableLocales = data.serviceLocales || data.locales || [];

                // We expect English locale from server
                const enLocale = availableLocales.find(l => l.language === 'en') || availableLocales[0] || {};

                const displayLocation = getDisplayLocation(enLocale, i18n.language);

                setForm({
                    name: data.name || '',
                    surname: data.surname || '',
                    addressLine: enLocale.address || '',
                    postalCode: enLocale.postalCode || '',
                    locationLabel: displayLocation
                });

                // Capture serviceType if present to preserve it
                if (enLocale.serviceType) {
                    setCurrentServiceType(enLocale.serviceType);
                }

            } catch (error) {
                console.error("Failed to fetch profile:", error);
                // Fallback to initialUser if fetch fails
                const availableLocales = initialUser.serviceLocales || initialUser.locales || [];

                const enLocale = availableLocales.find(l => l.language === 'en') || availableLocales[0] || {};
                const displayLocation = getDisplayLocation(enLocale, i18n.language);

                setForm({
                    name: initialUser.name || '',
                    surname: initialUser.surname || '',
                    addressLine: enLocale.address || '',
                    postalCode: enLocale.postalCode || '',
                    locationLabel: displayLocation
                });
            }
        };

        fetchProfile();
    }, [initialUser, i18n.language]);

    const [loading, setLoading] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [showError, setShowError] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    const handleChange = (field, value) => {
        setForm(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = async () => {
        if (!form.name) {
            setErrorMessage(t('errors.name_required'));
            setShowError(true);
            return;
        }

        setLoading(true);

        try {
            let locales = [];

            if (form.locationLabel) {
                const generated = createLocationPayload(form.locationLabel, form.addressLine);

                if (generated && generated.length > 0) {
                    generated[0].postalCode = form.postalCode;
                    locales = generated;
                }
            }

            const payload = {
                name: form.name,
                surname: initialUser.role === 'PROVIDER' ? '' : form.surname,
                ...(locales.length > 0 ? { locales } : {})
            };

            if (initialUser.role === 'PROVIDER') {
                await authService.updateProviderProfile(payload);
            } else {
                await authService.updateCustomerProfile(payload);
            }

            setShowSuccess(true);

            // Refresh profile after save
            if (initialUser.role === 'PROVIDER') {
                const updated = await authService.getProviderProfile();
                setUser(updated);
            } else {
                const updated = await authService.getCustomerProfile();
                setUser(updated);
            }

        } catch (error) {
            console.error('Profile update error:', error);
            const msg = error.response?.data?.message || error.message || t('errors.update_failed');
            setErrorMessage(msg);
            setShowError(true);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/50 border border-slate-100 relative overflow-hidden mb-8">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
            <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
                        <User size={24} />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-[#1A202C]">{t('personal_data.title')}</h3>
                        <p className="text-sm text-slate-500">{t('personal_data.subtitle')}</p>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className={`grid ${initialUser.role === 'PROVIDER' ? 'grid-cols-1' : 'grid-cols-2'} gap-4`}>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                                {initialUser.role === 'PROVIDER' ? t('personal_data.business_name') : t('personal_data.first_name')}
                            </label>
                            <div className="relative group">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#68B49B] transition-colors">
                                    <User size={20} />
                                </div>
                                <input
                                    type="text"
                                    value={form.name}
                                    onChange={(e) => handleChange('name', e.target.value)}
                                    className={HOGU_THEME.inputBase}
                                    placeholder={initialUser.role === 'PROVIDER' ? t('personal_data.business_name_placeholder') : t('personal_data.first_name_placeholder')}
                                />
                            </div>
                        </div>
                        {initialUser.role !== 'PROVIDER' && (
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{t('personal_data.last_name')}</label>
                                <div className="relative group">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#68B49B] transition-colors">
                                        <User size={20} />
                                    </div>
                                    <input
                                        type="text"
                                        value={form.surname}
                                        onChange={(e) => handleChange('surname', e.target.value)}
                                        className={HOGU_THEME.inputBase}
                                        placeholder={t('personal_data.last_name_placeholder')}
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    <CityAutocomplete
                        label={t('personal_data.city')}
                        value={form.locationLabel}
                        onChange={(val) => handleChange('locationLabel', val)}
                        icon={MapPin}
                    />


                    <div className="grid grid-cols-3 gap-4">
                        <div className="col-span-2">
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{t('personal_data.address')}</label>
                            <div className="relative group">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#68B49B] transition-colors">
                                    <MapPin size={20} />
                                </div>
                                <input
                                    type="text"
                                    value={form.addressLine}
                                    onChange={(e) => handleChange('addressLine', e.target.value)}
                                    className={HOGU_THEME.inputBase}
                                    placeholder={t('personal_data.address_placeholder')}
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{t('personal_data.zip_code')}</label>
                            <div className="relative group">
                                <input
                                    type="text"
                                    value={form.postalCode}
                                    onChange={(e) => handleChange('postalCode', e.target.value)}
                                    className={HOGU_THEME.inputBase}
                                    placeholder={t('personal_data.zip_code')}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-8 flex justify-end">
                    <button
                        onClick={handleSave}
                        disabled={loading || !form.name}
                        className={`
                            py-3.5 px-8 rounded-xl font-bold text-white shadow-lg flex items-center gap-2 transition-all
                            ${loading || !form.name
                                ? 'bg-slate-300 cursor-not-allowed shadow-none'
                                : 'bg-[#1A202C] hover:bg-[#68B49B] hover:shadow-[#68B49B]/30 hover:scale-105 active:scale-95'}
                        `}
                    >
                        {loading ? <RefreshCw size={20} className="animate-spin" /> : <Save size={20} />}
                        {loading ? t('personal_data.saving') : t('personal_data.save_changes')}
                    </button>
                </div>
            </div>

            <SuccessModal
                isOpen={showSuccess}
                onClose={() => setShowSuccess(false)}
                title={t('modals.profile_updated.title')}
                message={t('modals.profile_updated.message')}
                confirmText={t('modals.profile_updated.close')}
            />
            {showError && (
                <ErrorModal
                    message={errorMessage}
                    onClose={() => setShowError(false)}
                />
            )}
        </div>
    );
};

// --- CARDS PRINCIPALI (Invariate) ---
const EmailUpdateCard = ({ user }) => {
    const { t } = useTranslation(['profile']);
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
                        <h3 className="text-xl font-bold text-[#1A202C]">{t('email.title')}</h3>
                        <p className="text-sm text-slate-500">{t('email.subtitle')}</p>
                    </div>
                </div>

                {!isEditing ? (
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <span className="font-bold text-[#1A202C]">{email}</span>
                            <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1">
                                <CheckCircle size={10} /> {t('email.verified')}
                            </span>
                        </div>
                    </div>
                ) : (
                    <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                        {/* ... form edit email ... */}
                        <div className="mb-4">
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{t('email.new_email')}</label>
                            <input
                                type="email"
                                value={newEmail}
                                onChange={(e) => setNewEmail(e.target.value)}
                                className="w-full px-4 py-3.5 bg-white border-2 border-blue-100 focus:border-blue-500 rounded-xl text-slate-800 outline-none transition-all"
                                placeholder={t('email.placeholder')}
                            />
                            <p className="text-xs text-slate-400 mt-2 flex items-start gap-1">
                                <AlertTriangle size={12} className="mt-0.5 shrink-0" />
                                {t('email.verification_notice')}
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <button onClick={() => setIsEditing(false)} className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-200 transition-colors">{t('email.cancel')}</button>
                            <button className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center gap-2">{t('email.send_verification')} <ArrowRight size={16} /></button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const PasswordResetCard = ({ user }) => {
    const { t } = useTranslation(['profile']);
    const [form, setForm] = useState({ current: '', new: '', confirm: '' });
    const [loading, setLoading] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [showError, setShowError] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    const handleChange = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

    const handleSave = async () => {
        if (!form.new || !form.confirm) {
            setErrorMessage(t('errors.password_required'));
            setShowError(true);
            return;
        }
        if (form.new !== form.confirm) {
            setErrorMessage(t('errors.passwords_mismatch'));
            setShowError(true);
            return;
        }
        if (!PASSWORD_REGEX.test(form.new)) {
            setErrorMessage(t('errors.password_requirements'));
            setShowError(true);
            return;
        }

        setLoading(true);

        try {
            if (user.role === 'PROVIDER')
                await authService.providerPasswordReset(form.new);
            else
                await authService.customerPasswordReset(form.new);

            setShowSuccess(true);
            setForm({ current: '', new: '', confirm: '' });

        } catch (error) {
            console.error('Password reset error:', error);
            const msg = error.response?.data?.message || error.message || t('errors.password_update_failed');
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
                            <h3 className="text-xl font-bold text-[#1A202C]">{t('password.title')}</h3>
                            <p className="text-sm text-slate-500">{t('password.subtitle')}</p>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <PasswordInput
                            label={t('password.current')}
                            placeholder="••••••••••••"
                            value={form.current}
                            onChange={(val) => handleChange('current', val)}
                        />
                        <div className="border-t border-slate-100 my-6"></div>
                        <PasswordInput
                            label={t('password.new')}
                            placeholder={t('password.new_placeholder')}
                            value={form.new}
                            onChange={(val) => handleChange('new', val)}
                            showStrength={true}
                        />
                        <PasswordInput
                            label={t('password.confirm')}
                            placeholder={t('password.confirm_placeholder')}
                            value={form.confirm}
                            onChange={(val) => handleChange('confirm', val)}
                        />
                    </div>

                    <div className="mt-8 flex justify-end">
                        <button
                            onClick={handleSave}
                            disabled={loading || !form.new || form.new !== form.confirm || !PASSWORD_REGEX.test(form.new)}
                            className={`
                                py-3.5 px-8 rounded-xl font-bold text-white shadow-lg flex items-center gap-2 transition-all
                                ${loading || !form.new
                                    ? 'bg-slate-300 cursor-not-allowed shadow-none'
                                    : 'bg-[#1A202C] hover:bg-[#68B49B] hover:shadow-[#68B49B]/30 hover:scale-105 active:scale-95'}
                            `}
                        >
                            {loading ? <RefreshCw size={20} className="animate-spin" /> : <Save size={20} />}
                            {loading ? t('password.updating') : t('password.update')}
                        </button>
                    </div>
                </div>
            </div>
            <LoadingScreen isLoading={loading} />
            <SuccessModal
                isOpen={showSuccess}
                onClose={() => setShowSuccess(false)}
                title={t('modals.password_updated.title')}
                message={t('modals.password_updated.message')}
                confirmText={t('modals.password_updated.close')}
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

const DeleteAccountCard = ({ user }) => {
    const { t } = useTranslation(['profile']);
    const [showConfirm, setShowConfirm] = useState(false);
    const [loading, setLoading] = useState(false);
    const [showError, setShowError] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    const handleDeleteAccount = async () => {
        setLoading(true);
        try {
            if (user?.role === 'PROVIDER') {
                try {
                    // Controllo commissioni e prenotazioni in attesa per il ristorante
                    const info = await restaurantService.getInfoProvider();

                    if (info.totalCommissionsAmount > 0) {
                        setErrorMessage(t('errors.delete_pending_commissions'));
                        setShowError(true);
                        setShowConfirm(false);
                        setLoading(false);
                        return;
                    }

                    if (info.totalBookingsPending > 0) {
                        setErrorMessage(t('errors.delete_pending_bookings'));
                        setShowError(true);
                        setShowConfirm(false);
                        setLoading(false);
                        return;
                    }
                } catch (err) {
                    // Se fallisce il getInfo (es. il provider non ha ristoranti), procediamo comunque
                    console.log("Nessun ristorante associato o errore nel recupero info ristorante", err);
                }

                await authService.deleteProviderAccount();
            } else {
                await authService.deleteCustomerAccount();
            }
            // Logout and redirect is handled by logout() in apiClient
            logout();
        } catch (error) {
            console.error('Account deletion error:', error);
            const msg = error.response?.data?.message || error.message || t('errors.delete_failed');
            setErrorMessage(msg);
            setShowError(true);
            setShowConfirm(false);
        } finally {
            setLoading(false);
        }
    };

    if (user?.role !== 'CUSTOMER' && user?.role !== 'PROVIDER') return null;

    return (
        <>
            <div className="bg-white rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/50 border border-red-100 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-red-50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>

                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-12 h-12 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center">
                            <Trash2 size={24} />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-[#1A202C]">{t('delete_account.title')}</h3>
                            <p className="text-sm text-slate-500">{t('delete_account.subtitle')}</p>
                        </div>
                    </div>

                    <div className="bg-red-50 border border-red-100 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-4">
                        <div>
                            <h4 className="font-bold text-red-900 mb-1">{t('delete_account.warning_title')}</h4>
                            <p className="text-sm text-red-700 md:max-w-md">
                                {t('delete_account.warning_description')}
                                {user?.role === 'PROVIDER' && t('delete_account.provider_warning')}
                            </p>
                        </div>
                        <button
                            onClick={() => setShowConfirm(true)}
                            className="whitespace-nowrap py-3 px-6 bg-red-600 text-white rounded-xl font-bold text-sm hover:bg-red-700 shadow-lg shadow-red-600/20 transition-all flex items-center gap-2"
                        >
                            <Trash2 size={16} /> {t('delete_account.confirm_button')}
                        </button>
                    </div>
                </div>
            </div>

            {/* Modal di conferma eliminazione */}
            {showConfirm && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white rounded-[2rem] w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
                        <div className="p-8 text-center">
                            <div className="w-20 h-20 bg-red-50 text-red-500 rounded-3xl flex items-center justify-center mx-auto mb-6 scale-110">
                                <AlertTriangle size={40} />
                            </div>
                            <h3 className="text-2xl font-extrabold text-slate-900 mb-3 tracking-tight">{t('delete_account.modal_title')}</h3>
                            <p className="text-slate-500 leading-relaxed mb-8">
                                {t('delete_account.modal_description')}
                                {t('delete_account.modal_data_notice')}
                                {user?.role === 'PROVIDER' && (
                                    <span className="block mt-2 font-semibold text-red-600">
                                        {t('delete_account.modal_provider_alert')}
                                    </span>
                                )}
                            </p>

                            <div className="flex flex-col gap-3">
                                <button
                                    onClick={handleDeleteAccount}
                                    disabled={loading}
                                    className="w-full py-4 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-bold shadow-lg shadow-red-600/20 transition-all flex items-center justify-center gap-2 group"
                                >
                                    {loading ? <RefreshCw size={20} className="animate-spin" /> : <Trash2 size={20} className="group-hover:shake" />}
                                    {loading ? t('delete_account.deleting') : t('delete_account.confirm_delete')}
                                </button>
                                <button
                                    onClick={() => setShowConfirm(false)}
                                    disabled={loading}
                                    className="w-full py-4 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-2xl font-bold transition-all"
                                >
                                    {t('delete_account.cancel')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <LoadingScreen isLoading={loading} />
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
    const { t } = useTranslation(['profile']);
    const breadcrumbsItems = useMemo(() => [
        { label: t('breadcrumbs.dashboard'), href: user?.role === 'PROVIDER' ? '/provider/dashboard' : '/customer/dashboard' },
        { label: t('breadcrumbs.security'), href: '#' }
    ], [user?.role, t]);

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
                            {t('title')}
                        </h1>
                        <p className="text-slate-500 text-lg max-w-2xl leading-relaxed">
                            {t('subtitle')}
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
                        <ProfileUpdateCard user={user} />
                        <EmailUpdateCard user={user} />
                        <PasswordResetCard user={user} />
                        <DeleteAccountCard user={user} />
                    </div>

                    {/* Colonna Destra */}
                    <div className="lg:col-span-1 space-y-8">
                        <div className="bg-[#E6F5F0] rounded-[2.5rem] p-6 border border-[#68B49B]/20">
                            <h4 className="font-bold text-[#33594C] mb-2 flex items-center gap-2">
                                <Lock size={18} /> {t('privacy_card.title')}
                            </h4>
                            <p className="text-xs text-[#33594C]/80 leading-relaxed mb-4">
                                {t('privacy_card.description')}
                            </p>
                            <a href="#" className="text-xs font-bold text-[#68B49B] hover:underline">{t('privacy_card.support')} &rarr;</a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export const ProfileSecurityPage = withAuthProtection(ProfileSecurityPageBase, ['CUSTOMER', 'PROVIDER']);

export default ProfileSecurityPage;

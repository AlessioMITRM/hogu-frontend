import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  CreditCard, User, MapPin, Mail, FileText, Building2, 
  Calendar, Clock, ShieldCheck, ArrowRight, Lock, Info,
  CheckCircle2
} from 'lucide-react';
import { Breadcrumbs } from '../../ui/Breadcrumbs.jsx'; 
import { HOGU_COLORS, HOGU_THEME } from '../../../config/theme.js';
import { useTranslation } from 'react-i18next';

const breadcrumbsItems = [
    { labelKey: 'breadcrumbs.home', href: '/' },
    { labelKey: 'breadcrumbs.catalog', href: '/catalog' },
    { labelKey: 'breadcrumbs.checkout', href: '#' }
];

// --- COMPONENTI UI ---
const InputField = ({ labelKey, label, name, type = "text", placeholderKey, placeholder, icon: Icon, value, onChange, required = false, className = "" }) => {
  const { t } = useTranslation();
  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5 ml-1">
        {Icon && <Icon size={14} className="text-[#68B49B]" />}
        {labelKey ? t(labelKey) : label} {required && <span className="text-red-400">*</span>}
      </label>
      <input 
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholderKey ? t(placeholderKey) : placeholder}
        required={required}
        className={HOGU_THEME.inputStyle}
      />
    </div>
  );
};

const PaymentMethodCard = ({ id, titleKey, title, icon: Icon, selected, onSelect }) => {
  const { t } = useTranslation();
  return (
    <div 
      onClick={() => onSelect(id)}
      className={`
        relative p-5 rounded-2xl border cursor-pointer transition-all duration-300 flex items-center gap-4
        ${selected 
          ? 'bg-[#F0FDF9] border-[#68B49B] shadow-md' 
          : 'bg-white border-gray-100 hover:border-gray-200 hover:bg-gray-50'
        }
      `}
    >
      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${selected ? 'bg-white text-[#68B49B]' : 'bg-gray-100 text-gray-400'}`}>
          <Icon size={24} />
      </div>
      <div className="flex-1">
          <h4 className={`font-bold ${selected ? 'text-[#33594C]' : 'text-gray-700'}`}>
            {titleKey ? t(titleKey) : title}
          </h4>
          <p className="text-xs text-gray-400">{t('payment_summary.secure_ssl')}</p>
      </div>
      <div className={`w-6 h-6 rounded-full border flex items-center justify-center transition-colors ${selected ? 'bg-[#68B49B] border-[#68B49B]' : 'border-gray-300'}`}>
          {selected && <CheckCircle2 size={14} className="text-white" />}
      </div>
    </div>
  );
};

// --- COMPONENTE PRINCIPALE ---
const PaymentSummary = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  const [billingData, setBillingData] = useState({
    nomeFatturazione: '',
    cognomeFatturazione: '',
    ragioneSocialeFatturazione: '',
    indirizzoFatturazione: '',
    codiceFiscaleFatturazione: '',
    pivaFatturazione: '',
    emailFatturazione: ''
  });

  const [paymentMethod, setPaymentMethod] = useState('stripe');

  const bookingDetails = {
    serviceName: "Mercedes-Benz Classe E",
    serviceType: "NCC Transfer",
    date: "24 Nov 2025",
    time: "10:30",
    location: "Roma Fiumicino → Centro",
    price: 85.00,
    image: "https://images.unsplash.com/photo-1514890547357-a9ee288728e0?auto=format&fit=crop&w=800&q=80"
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setBillingData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Procedi al pagamento con:", paymentMethod, billingData);
  };

  return (
    <div className={`min-h-screen bg-[#F8FAFC] pb-24 ${HOGU_THEME.fontFamily}`}>
      <div className="bg-white pt-8 pb-20 px-4 lg:px-8 relative overflow-hidden border-b border-gray-100">
        <div className="max-w-7xl mx-auto relative z-10">
          <Breadcrumbs items={breadcrumbsItems.map(item => ({...item, label: t(item.labelKey)}))} />
          <h1 className="text-3xl md:text-4xl font-extrabold text-[#1A202C] mt-6">
            {t('payment_summary.summary')} <span className="text-[#68B49B]">{t('payment_summary.booking')}</span>
          </h1>
          <p className="text-slate-500 mt-2 flex items-center gap-2">
            <Lock size={14} className="text-[#68B49B]"/> {t('payment_summary.secure_checkout')}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 lg:px-8 -mt-12 relative z-20">
        <form onSubmit={handleSubmit} className="flex flex-col lg:flex-row gap-8 lg:gap-12">

          {/* Colonna sinistra: Form e Pagamento */}
          <div className="flex-1 flex flex-col gap-8">
            <div className={`bg-white rounded-[2rem] p-6 md:p-8 ${HOGU_THEME.shadowFloat}`}>
              <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#F0FDF9] text-[#68B49B] flex items-center justify-center">1</div>
                {t('payment_summary.billing_data')}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InputField labelKey="payment_summary.first_name" name="nomeFatturazione" required icon={User} value={billingData.nomeFatturazione} onChange={handleInputChange} placeholderKey="payment_summary.first_name_placeholder" />
                <InputField labelKey="payment_summary.last_name" name="cognomeFatturazione" required icon={User} value={billingData.cognomeFatturazione} onChange={handleInputChange} placeholderKey="payment_summary.last_name_placeholder" />
                <InputField labelKey="payment_summary.email" name="emailFatturazione" type="email" required icon={Mail} value={billingData.emailFatturazione} onChange={handleInputChange} className="md:col-span-2" placeholderKey="payment_summary.email_placeholder" />
                <InputField labelKey="payment_summary.address" name="indirizzoFatturazione" required icon={MapPin} value={billingData.indirizzoFatturazione} onChange={handleInputChange} className="md:col-span-2" placeholderKey="payment_summary.address_placeholder" />
                <InputField labelKey="payment_summary.tax_code" name="codiceFiscaleFatturazione" required icon={FileText} value={billingData.codiceFiscaleFatturazione} onChange={handleInputChange} placeholderKey="payment_summary.tax_code_placeholder" />
                <InputField labelKey="payment_summary.vat" name="pivaFatturazione" icon={Building2} value={billingData.pivaFatturazione} onChange={handleInputChange} placeholderKey="payment_summary.vat_placeholder" />
                <InputField labelKey="payment_summary.company_name" name="ragioneSocialeFatturazione" icon={Building2} className="md:col-span-2" value={billingData.ragioneSocialeFatturazione} onChange={handleInputChange} placeholderKey="payment_summary.company_name_placeholder" />
              </div>
            </div>

            <div className={`bg-white rounded-[2rem] p-6 md:p-8 ${HOGU_THEME.shadowFloat}`}>
              <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#F0FDF9] text-[#68B49B] flex items-center justify-center">2</div>
                {t('payment_summary.payment_method')}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <PaymentMethodCard id="stripe" titleKey="payment_summary.credit_card" icon={CreditCard} selected={paymentMethod === 'stripe'} onSelect={setPaymentMethod} />
                <PaymentMethodCard id="paypal" title="PayPal" icon={() => <span className="font-bold text-xl italic text-[#003087]">Pay<span className="text-[#009cde]">Pal</span></span>} selected={paymentMethod === 'paypal'} onSelect={setPaymentMethod} />
              </div>
              <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-100 flex gap-3">
                <Info className="text-blue-500 shrink-0 mt-0.5" size={20} />
                <p className="text-sm text-blue-700 leading-relaxed">{t('payment_summary.payment_info')}</p>
              </div>
            </div>
          </div>

          {/* Colonna destra: Summary Card */}
          <div className="lg:w-[400px] flex-shrink-0">
            <div className={`bg-white rounded-[2rem] overflow-hidden sticky top-8 ${HOGU_THEME.shadowFloat} border border-gray-100`}>
              <div className="h-48 relative overflow-hidden bg-gray-100">
                <div className="absolute top-4 left-4 z-10">
                  <span className="bg-white/90 backdrop-blur px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider shadow-sm text-[#68B49B]">{bookingDetails.serviceType}</span>
                </div>
                <img src={bookingDetails.image} alt="Service preview" className="w-full h-full object-cover mix-blend-multiply opacity-90"/>
                <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent"/>
              </div>
              {/* ...Resto della card identico, i testi possono essere convertiti con t() */}
            </div>
          </div>

        </form>
      </div>
    </div>
  );
};

export default PaymentSummary;

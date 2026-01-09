import React from 'react';
import { 
  ScrollText, User, CreditCard, AlertTriangle, ChevronLeft, 
  ShieldCheck, Gavel, FileSignature
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export const TermsPage = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const sections = t('terms.sections', { returnObjects: true });

  return (
    <div className="min-h-screen bg-white font-sans text-slate-800">
      
      {/* HEADER */}
      <div className="bg-[#1A202C] text-white pt-32 pb-16 px-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        
        <div className="max-w-4xl mx-auto relative z-10">
          
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4 tracking-tight">
            {t('terms.header.title')}
          </h1>

          <p className="text-slate-400 text-lg">
            {t('terms.header.description')}
          </p>
          
          <div className="mt-8 inline-flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full text-xs font-bold border border-white/10">
            <FileSignature size={14} className="text-[#68B49B]" />
            {t('terms.header.effectiveDate')}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-16 space-y-20">

        {/* 1. ACCETTAZIONE */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-slate-100 rounded-xl text-slate-700">
              <ScrollText size={28} />
            </div>
            <h2 className="text-3xl font-bold text-[#1A202C]">
              {sections.acceptance.title}
            </h2>
          </div>

          <p className="text-slate-600 leading-relaxed text-lg">
            {sections.acceptance.description}
          </p>

          <p className="mt-4 text-slate-600 text-lg">
            {sections.acceptance.additional}
          </p>
        </section>

        <hr className="border-slate-100" />

        {/* 2. RUOLO */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-slate-100 rounded-xl text-slate-700">
              <ShieldCheck size={28} />
            </div>
            <h2 className="text-3xl font-bold text-[#1A202C]">
              {sections.platformRole.title}
            </h2>
          </div>

          <p className="text-slate-600 leading-relaxed text-lg">
            {sections.platformRole.description}
          </p>

          <p className="mt-4 text-slate-600 leading-relaxed text-lg">
            {sections.platformRole.additional}
          </p>
        </section>

        <hr className="border-slate-100" />

        {/* 3. ACCOUNT */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-slate-100 rounded-xl text-slate-700">
              <User size={28} />
            </div>
            <h2 className="text-3xl font-bold text-[#1A202C]">
              {sections.account.title}
            </h2>
          </div>

          <p className="text-slate-600 leading-relaxed text-lg">
            {sections.account.description}
          </p>

          <p className="mt-4 text-slate-600 leading-relaxed text-lg">
            {sections.account.additional}
          </p>
        </section>

        <hr className="border-slate-100" />

        {/* 4. PRENOTAZIONI */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-slate-100 rounded-xl text-slate-700">
              <CreditCard size={28} />
            </div>
            <h2 className="text-3xl font-bold text-[#1A202C]">
              {sections.bookingPayment.title}
            </h2>
          </div>

          <p className="text-slate-600 leading-relaxed text-lg">
            {sections.bookingPayment.description}
          </p>

          <p className="mt-4 text-slate-600 leading-relaxed text-lg">
            {sections.bookingPayment.recession}
          </p>

          <p className="mt-4 text-slate-600 leading-relaxed text-lg">
            {sections.bookingPayment.cancellation}
          </p>
        </section>

        <hr className="border-slate-100" />

        {/* 5. FATTURAZIONE */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-slate-100 rounded-xl text-slate-700">
              <FileSignature size={28} />
            </div>
            <h2 className="text-3xl font-bold text-[#1A202C]">
              {sections.billing.title}
            </h2>
          </div>

          <p className="text-slate-600 leading-relaxed text-lg">
            {sections.billing.description}
          </p>

          <ul className="list-disc pl-5 mt-4 space-y-2 marker:text-[#68B49B] text-slate-600 text-lg">
            {sections.billing.list.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        </section>

        <hr className="border-slate-100" />

        {/* 6. RESPONSABILITÀ */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-slate-100 rounded-xl text-slate-700">
              <AlertTriangle size={28} />
            </div>
            <h2 className="text-3xl font-bold text-[#1A202C]">
              {sections.liability.title}
            </h2>
          </div>

          <p className="text-slate-600 leading-relaxed text-lg">
            {sections.liability.description}
          </p>
        </section>

        <hr className="border-slate-100" />

        {/* 7. DISPONIBILITÀ */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-slate-100 rounded-xl text-slate-700">
              <ShieldCheck size={28} />
            </div>
            <h2 className="text-3xl font-bold text-[#1A202C]">
              {sections.availability.title}
            </h2>
          </div>

          <p className="text-slate-600 leading-relaxed text-lg">
            {sections.availability.description}
          </p>
        </section>

        <hr className="border-slate-100" />

        {/* 8. LEGGE */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-slate-100 rounded-xl text-slate-700">
              <Gavel size={28} />
            </div>
            <h2 className="text-3xl font-bold text-[#1A202C]">
              {sections.law.title}
            </h2>
          </div>

          <p className="text-slate-600 leading-relaxed text-lg">
            {sections.law.description}
          </p>
        </section>

      </div>
    </div>
  );
};

export default TermsPage;

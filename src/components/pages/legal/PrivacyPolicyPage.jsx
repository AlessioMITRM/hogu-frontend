import React from 'react';
import {
  Shield, Lock, Eye, FileText, Mail,
  Server, Share2, UserCheck, AlertCircle
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const PrivacyPolicyPage = () => {
  const { t } = useTranslation();

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-white font-sans text-slate-800">

      {/* HEADER */}
      <div className="bg-[#1A202C] text-white pt-32 pb-16 px-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>

        <div className="max-w-4xl mx-auto relative z-10">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4 tracking-tight">
            {t('privacy.headerTitle')}
          </h1>
          <p className="text-slate-400 text-lg">
            {t('privacy.headerDescription')}
          </p>

          <div className="mt-8 inline-flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full text-xs font-bold border border-white/10">
            <AlertCircle size={14} className="text-[#68B49B]" />
            {t('privacy.lastUpdate')}: 01 Dicembre 2025
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-16 space-y-20">

        {/* 1. TITOLARE */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-slate-100 rounded-xl"><UserCheck size={28} /></div>
            <h2 className="text-3xl font-bold">{t('privacy.sections.controller.title')}</h2>
          </div>
          <p className="text-slate-600 text-lg">
            {t('privacy.sections.controller.description')}
          </p>
        </section>

        <hr />

        {/* 2. DATI RACCOLTI */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-slate-100 rounded-xl"><FileText size={28} /></div>
            <h2 className="text-3xl font-bold">{t('privacy.sections.collectedData.title')}</h2>
          </div>

          <ul className="list-disc pl-5 space-y-3 text-slate-600 text-lg marker:text-[#68B49B]">
            <li>{t('privacy.sections.collectedData.userData')}</li>
            <li>{t('privacy.sections.collectedData.bookingData')}</li>
            <li>{t('privacy.sections.collectedData.paymentData')}</li>
            <li>{t('privacy.sections.collectedData.geoData')}</li>
          </ul>
        </section>

        <hr />

        {/* 3. FINALITÀ */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-slate-100 rounded-xl"><Eye size={28} /></div>
            <h2 className="text-3xl font-bold">{t('privacy.sections.purposes.title')}</h2>
          </div>

          <ul className="list-disc pl-5 space-y-2 text-slate-600 text-lg marker:text-[#68B49B]">
            <li>{t('privacy.sections.purposes.serviceManagement')}</li>
            <li>{t('privacy.sections.purposes.accountCommunication')}</li>
            <li>{t('privacy.sections.purposes.legalCompliance')}</li>
            <li>{t('privacy.sections.purposes.security')}</li>
          </ul>

          <p className="text-slate-600 text-lg mt-4">{t('privacy.sections.purposes.ageRestriction')}</p>
        </section>

        <hr />

        {/* BASE GIURIDICA */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-slate-100 rounded-xl"><FileText size={28} /></div>
            <h2 className="text-3xl font-bold">{t('privacy.sections.legalBasis.title')}</h2>
          </div>

          <ul className="list-disc pl-5 space-y-2 text-slate-600 text-lg marker:text-[#68B49B]">
            <li>{t('privacy.sections.legalBasis.contract')}</li>
            <li>{t('privacy.sections.legalBasis.legalObligation')}</li>
            <li>{t('privacy.sections.legalBasis.legitimateInterest')}</li>
          </ul>
        </section>

        <hr />

        {/* CONDIVISIONE */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-slate-100 rounded-xl"><Share2 size={28} /></div>
            <h2 className="text-3xl font-bold">{t('privacy.sections.dataSharing.title')}</h2>
          </div>

          <p className="text-slate-600 text-lg">{t('privacy.sections.dataSharing.description')}</p>
        </section>

        <hr />

        {/* EXTRA UE */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-slate-100 rounded-xl"><Server size={28} /></div>
            <h2 className="text-3xl font-bold">{t('privacy.sections.extraEU.title')}</h2>
          </div>

          <p className="text-slate-600 text-lg">{t('privacy.sections.extraEU.description')}</p>
        </section>

        <hr />

        {/* CONSERVAZIONE */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-slate-100 rounded-xl"><Lock size={28} /></div>
            <h2 className="text-3xl font-bold">{t('privacy.sections.dataRetention.title')}</h2>
          </div>

          <ul className="list-disc pl-5 space-y-2 text-slate-600 text-lg marker:text-[#68B49B]">
            <li>{t('privacy.sections.dataRetention.accountData')}</li>
            <li>{t('privacy.sections.dataRetention.bookingData')}</li>
            <li>{t('privacy.sections.dataRetention.taxData')}</li>
            <li>{t('privacy.sections.dataRetention.securityLogs')}</li>
          </ul>
        </section>

        <hr />

        {/* DIRITTI */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-slate-100 rounded-xl"><Shield size={28} /></div>
            <h2 className="text-3xl font-bold">{t('privacy.sections.userRights.title')}</h2>
          </div>

          <ul className="list-disc pl-5 space-y-2 text-slate-600 text-lg marker:text-[#68B49B]">
            <li>{t('privacy.sections.userRights.access')}</li>
            <li>{t('privacy.sections.userRights.rectification')}</li>
            <li>{t('privacy.sections.userRights.deletion')}</li>
            <li>{t('privacy.sections.userRights.restriction')}</li>
            <li>{t('privacy.sections.userRights.objection')}</li>
            <li>{t('privacy.sections.userRights.portability')}</li>
          </ul>
        </section>

        <hr />

        {/* COOKIE */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-slate-100 rounded-xl"><Server size={28} /></div>
            <h2 className="text-3xl font-bold">{t('privacy.sections.cookies.title')}</h2>
          </div>

          <p className="text-slate-600 text-lg">{t('privacy.sections.cookies.description')}</p>
        </section>

        <hr />

        {/* CONTATTI */}
        <section className="pb-10">
          <div className="bg-[#1A202C] rounded-[2.5rem] p-10 text-center text-white">
            <Mail size={48} className="mx-auto mb-4 text-[#68B49B]" />
            <p className="text-lg">
              {t('privacy.sections.contact.title')}{' '}
              <a href="mailto:hoguceo@gmail.com" className="underline font-bold">hoguceo@gmail.com</a>
            </p>
            <p className="text-sm mt-3 text-slate-300">
              {t('privacy.sections.contact.complaint')} {' '}
              <a href="https://www.garanteprivacy.it" target="_blank" rel="noreferrer" className="underline">
                Garante per la protezione dei dati personali
              </a>
            </p>
          </div>
        </section>

      </div>

    </div>
  );
};

export default PrivacyPolicyPage;

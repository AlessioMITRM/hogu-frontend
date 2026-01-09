import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ShieldAlert, Lock, ArrowRight, Home, RefreshCw } from 'lucide-react';
import { Breadcrumbs } from '../../../components/ui/Breadcrumbs.jsx'; 

const UnauthorizedPage = ({ type = 'expired' }) => {
    const navigate = useNavigate();
    const { t } = useTranslation();

    // Configurazione contenuti in base al tipo di errore
    const content = {
        expired: {
            icon: RefreshCw,
            color: 'text-amber-500',
            bgIcon: 'bg-amber-50',
            // Traduzioni per sessione scaduta
            title: t('unauthorizedPage.expired.title'),
            message: t('unauthorizedPage.expired.message'),
            primaryAction: t('unauthorizedPage.expired.action'),
            primaryPath: '/login'
        },
        unauthorized: {
            icon: ShieldAlert,
            color: 'text-red-500',
            bgIcon: 'bg-red-50',
            // Traduzioni per permessi insufficienti (Accesso Negato)
            title: t('unauthorizedPage.unauthorized.title'),
            message: t('unauthorizedPage.unauthorized.message'),
            primaryAction: t('unauthorizedPage.unauthorized.action'),
            primaryPath: '/' // O dashboard specifica
        }
    };

    const currentContent = content[type] || content.expired;
    const Icon = currentContent.icon;

    // Configurazione Breadcrumbs
    const breadcrumbsItems = [
        { label: t('unauthorizedPage.breadcrumbs.home'), href: '/' },
        { label: t('unauthorizedPage.breadcrumbs.security') },
        { label: currentContent.title }
    ];

    return (
        <div className="min-h-screen bg-[#F8FAFC] relative overflow-hidden font-sans pb-24 md:pb-0">
            
            {/* Sfondo decorativo */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#68B49B]/10 rounded-full blur-3xl pointer-events-none -z-10"></div>

            {/* Container Principale */}
            <div className="max-w-7xl mx-auto px-4 py-6 lg:px-8 lg:py-10">
                
                {/* Breadcrumbs Component */}
                <Breadcrumbs items={breadcrumbsItems} className="mb-6 opacity-80" />

                {/* Wrapper */}
                <div className="flex justify-center w-full mt-4 md:mt-8">

                    <div className="max-w-md w-full bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/50 border border-slate-100 p-8 md:p-12 text-center relative z-10 animate-in fade-in zoom-in duration-500">
                        
                        {/* Icona Animata */}
                        <div className={`w-24 h-24 mx-auto ${currentContent.bgIcon} rounded-[2rem] flex items-center justify-center mb-6 relative group`}>
                            <div className="absolute inset-0 rounded-[2rem] border-2 border-white/50 shadow-inner"></div>
                            <Icon 
                                size={40} 
                                className={`${currentContent.color} drop-shadow-sm transition-transform duration-700 group-hover:scale-110 ${type === 'expired' ? 'group-hover:rotate-180' : 'group-hover:rotate-12'}`} 
                            />
                            
                            {/* Badge Lucchetto */}
                            <div className="absolute -bottom-2 -right-2 bg-white p-2 rounded-xl shadow-lg border border-slate-100 text-slate-400">
                                <Lock size={16} />
                            </div>
                        </div>

                        {/* Testi */}
                        <h1 className="text-2xl md:text-3xl font-extrabold text-[#1A202C] mb-3">
                            {currentContent.title}
                        </h1>
                        
                        <p className="text-slate-500 text-sm leading-relaxed mb-8 px-4">
                            {currentContent.message}
                            <br />
                            <span className="text-xs text-slate-400 mt-2 block">
                                {t('unauthorizedPage.common.errorCode')}: {type === 'expired' ? '401' : '403'}
                            </span>
                        </p>

                        {/* Bottoni Azione */}
                        <div className="space-y-3">
                            <button 
                                onClick={() => navigate(currentContent.primaryPath)}
                                className="w-full bg-[#1A202C] hover:bg-[#68B49B] text-white font-bold py-4 rounded-2xl shadow-lg shadow-slate-200 hover:shadow-[#68B49B]/30 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 group"
                            >
                                {currentContent.primaryAction}
                                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                            </button>

                            <button 
                                onClick={() => navigate('/')}
                                className="w-full bg-slate-50 hover:bg-slate-100 text-slate-600 font-bold py-4 rounded-2xl border border-transparent hover:border-slate-200 transition-all flex items-center justify-center gap-2"
                            >
                                <Home size={18} />
                                {t('unauthorizedPage.common.backHome')}
                            </button>
                        </div>

                        {/* Footer */}
                        <div className="mt-8 pt-6 border-t border-slate-50">
                            <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest">
                                {t('unauthorizedPage.common.footerBrand')}
                            </p>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default UnauthorizedPage;
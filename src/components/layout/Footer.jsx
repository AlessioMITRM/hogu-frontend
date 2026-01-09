import React from 'react';
import { HOGU_COLORS, HOGU_THEME } from '../../config/theme.js';
import { Mail, Facebook, Instagram, Twitter } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export const Footer = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const services = t('footer.services', { returnObjects: true });
  const hoguLinks = t('footer.hoguLinks', { returnObjects: true });
  const legalLinks = t('footer.legalLinks', { returnObjects: true });

  return (
    <footer className={`py-12 mt-12 border-t border-gray-100 ${HOGU_THEME.bg}`}>
      <div className="max-w-7xl mx-auto px-4">

        {/* --- PARTE SUPERIORE: LINK E CONTATTI --- */}
        <div className="flex flex-wrap justify-center text-center gap-y-8 pb-8">

          {/* Colonna 1: Logo e Slogan */}
          <div className="w-full md:w-1/4 px-4 flex flex-col items-center">
            <div onClick={() => navigate('/')} className="cursor-pointer group mb-3 inline-block">
              <span className={`text-3xl font-extrabold tracking-tight text-[${HOGU_COLORS.dark}]`}>
                Hogu
                <span className={`text-[${HOGU_COLORS.primary}] group-hover:text-[#599c86] transition-colors`}>.</span>
              </span>
            </div>
            
            <p className={`text-sm ${HOGU_THEME.subtleText} max-w-xs mb-4`}>
              {t('footer.slogan')}
            </p>
          </div>

          {/* Colonna 2: Servizi */}
          <div className="w-1/2 md:w-1/4 px-4">
            <h4 className={`text-lg font-bold mb-3 ${HOGU_THEME.text}`}>{t('footer.servicesTitle')}</h4>
            <ul className="space-y-2 flex flex-col items-center">
              {services.map((item, index) => (
                <li key={index}>
                  <span className={`text-sm ${HOGU_THEME.subtleText}`}>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Colonna 3: Hogu */}
          <div className="w-1/2 md:w-1/4 px-4">
            <h4 className={`text-lg font-bold mb-3 ${HOGU_THEME.text}`}>{t('footer.hoguTitle')}</h4>
            <ul className="space-y-2 flex flex-col items-center">
              {hoguLinks.map((item, index) => (
                <li key={index}>
                  <span className={`text-sm ${HOGU_THEME.subtleText}`}>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Colonna 4: Contatti */}
          <div className="w-full md:w-1/4 px-4">
            <h4 className={`text-lg font-bold mb-3 ${HOGU_THEME.text}`}>{t('footer.contactTitle')}</h4>
            <div className={`space-y-2 flex flex-col items-center text-sm ${HOGU_THEME.subtleText}`}>
              <div className="flex items-center space-x-2">
                <Mail className="w-4 h-4" />
                <a href="mailto:hoguceo@gmail.com">hoguceo@gmail.com</a>
              </div>
            </div>

            <div className="flex justify-center space-x-4 mt-4">
              <Facebook className={`w-5 h-5 text-gray-400 hover:text-[${HOGU_COLORS.primary}] cursor-pointer`} />
              <Instagram className={`w-5 h-5 text-gray-400 hover:text-[${HOGU_COLORS.primary}] cursor-pointer`} />
              <Twitter className={`w-5 h-5 text-gray-400 hover:text-[${HOGU_COLORS.primary}] cursor-pointer`} />
            </div>
          </div>
        </div>

        {/* --- PARTE INFERIORE: DATI LEGALI & POLICY --- */}
        <div className="mt-8 pt-8 border-t border-gray-200">
          
          {/* Dati societari */}
          <div className="text-center mb-6 px-4">
            <p className="text-xs text-gray-400 leading-relaxed font-medium">
              <span className="text-gray-600 font-bold">{t('footer.company.name')}</span> • 
              {t('footer.company.address')} •
              EMAIL: <a href="mailto:hoguceo@gmail.com" className="hover:text-gray-900">hoguceo@gmail.com</a>
            </p>
          </div>

          {/* Bottom bar */}
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-center">

            <div className={`text-xs ${HOGU_THEME.subtleText}`}>
              © {new Date().getFullYear()} Hogu. {t('footer.rights')}
            </div>

            {/* Policy links */}
            <div className="flex space-x-6">
              {legalLinks.map((item, index) => (
                <button
                  key={index}
                  onClick={() => navigate(item.path)}
                  className="text-xs text-gray-400 hover:text-gray-900"
                >
                  {item.label}
                </button>
              ))}
            </div>

            {/* Credits */}
            <div className="text-xs text-gray-400">
              {t('footer.credits')} {' '}
              <a
                href="https://www.linkedin.com/in/alessio-maio-458368170"
                target="_blank"
                rel="noopener noreferrer"
                className={`font-bold hover:text-[${HOGU_COLORS.primary}]`}
              >
                Alessio Maio
              </a>
            </div>

          </div>
        </div>
      </div>
    </footer>
  );
};

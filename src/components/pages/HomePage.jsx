import React from 'react';
import { useTranslation } from 'react-i18next'; // ** AGGIUNTO **
import { HOGU_THEME } from '../../config/theme.js';
import { HeroSection } from './home/HeroSection.jsx';
import { ServiceSearch } from './home/ServiceSearch.jsx';
import { DarkPrimaryButton } from '../../components/ui/Button.jsx';

// Import dei componenti sezionati
import { ExclusiveServicesCarousel } from './home/ExclusiveServicesCarousel.jsx';
import { HowItWorksSection } from './home/HowItWorksSection.jsx';
import { EarningsSection } from './home/EarningsSection.jsx';

export const HomePage = ({ setPage }) => {
    const { t } = useTranslation("home");
  
  return (
    <div className={HOGU_THEME.fontFamily}>
      
      <HeroSection setPage={setPage} />
      
      <ServiceSearch setPage={setPage} />

      <ExclusiveServicesCarousel setPage={setPage} />

      <section className="bg-gray-50 py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4">
          
          <HowItWorksSection />

          <EarningsSection />
         
          {/* CTA Finale */}
          <div className="text-center mt-12">
            <DarkPrimaryButton onClick={() => setPage('register')} className="text-lg">
              {t('homepage.cta_final')}
            </DarkPrimaryButton>
          </div>

        </div>
      </section>

    </div>
  );
};
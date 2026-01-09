import React from 'react';
import { useTranslation } from 'react-i18next'; // ** AGGIUNTO **
// Nota: Assumiamo che HOGU_THEME e EarningComparisonCard siano disponibili
import { HOGU_THEME } from '../../../config/theme.js'; 
import { EarningComparisonCard } from './HomeComponents.jsx';

export const EarningsSection = () => {
    const { t } = useTranslation("home"); // ** Hook di traduzione **
  
  const earningsData = [
    {
      titleKey: 'earnings.host_title',
      metricKey: 'earnings.host_metric',
      annualHogu: 26496, // Calcolo: 240 * 120 * 0.92
      annualOther: 23616, // Calcolo: 240 * 120 * 0.82
      saving: 2880,
    },
    {
      titleKey: 'earnings.ncc_title',
      metricKey: 'earnings.ncc_metric',
      annualHogu: 30222, // Calcolo: (2*45*365) * 0.92
      annualOther: 26937, // Calcolo: (2*45*365) * 0.82
      saving: 3285,
    },
    {
      titleKey: 'earnings.restaurant_title',
      metricKey: 'earnings.restaurant_metric',
      annualHogu: 107456, // Calcolo: (2*4*40*365) * 0.92
      annualOther: 95776, // Calcolo: (2*4*40*365) * 0.82
      saving: 11680,
    },
  ];

  return (
    <section className="mt-20">
      <h2 className={`text-4xl font-bold text-center mb-4 ${HOGU_THEME.text}`}>
        {t('earnings.main_title')}
      </h2>
      <p className={`text-lg text-center mb-10 ${HOGU_THEME.subtleText}`}>
        {t('earnings.main_description')}
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
        {earningsData.map((data, index) => (
          <EarningComparisonCard 
                key={index} 
                title={t(data.titleKey)}
                metric={t(data.metricKey)}
                annualHogu={data.annualHogu}
                annualOther={data.annualOther}
                saving={data.saving}
            />
        ))}
      </div>
    </section>
  );
};
import React from 'react';
import { useTranslation } from 'react-i18next';
import { HOGU_THEME } from '../../../config/theme.js';
import { EarningComparisonCard } from './HomeComponents.jsx';

export const EarningsSection = () => {
  const { t } = useTranslation("home");

  const earningsData = [
    {
      titleKey: 'earnings.host_title',
      metricKey: 'earnings.host_metric',
      annualHogu: 26496,
      annualOther: 23616,
      saving: 2880,
    },
    {
      titleKey: 'earnings.ncc_title',
      metricKey: 'earnings.ncc_metric',
      annualHogu: 30222,
      annualOther: 26937,
      saving: 3285,
    },
    {
      titleKey: 'earnings.restaurant_title',
      metricKey: 'earnings.restaurant_metric',
      annualHogu: 107456,
      annualOther: 95776,
      saving: 11680,
    },
  ];

  return (
    <section className="mt-14 md:mt-20">
      <h2 className={`text-lg md:text-4xl font-bold text-center mb-1 md:mb-4 ${HOGU_THEME.text}`}>
        {t('earnings.main_title')}
      </h2>
      <p className={`text-[11px] md:text-lg text-center mb-3 md:mb-10 max-w-2xl mx-auto px-4 ${HOGU_THEME.subtleText}`}>
        {t('earnings.main_description')}
      </p>

      <div className="
        flex overflow-x-auto snap-x snap-mandatory gap-3 pb-4 px-[10vw]
        scroll-px-[10vw] hide-scrollbar
        md:grid md:grid-cols-3 md:gap-8 md:overflow-visible md:pb-0 md:px-0
        max-w-5xl md:mx-auto
      ">
        <style>{`
          .hide-scrollbar::-webkit-scrollbar { display: none; }
          .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        `}</style>
        {earningsData.map((data, index) => (
          <div key={index} className="w-[80vw] flex-shrink-0 snap-center md:w-auto md:flex-shrink md:snap-align-none">
            <EarningComparisonCard
              title={t(data.titleKey)}
              metric={t(data.metricKey)}
              annualHogu={data.annualHogu}
              annualOther={data.annualOther}
              saving={data.saving}
            />
          </div>
        ))}
      </div>
    </section>
  );
};
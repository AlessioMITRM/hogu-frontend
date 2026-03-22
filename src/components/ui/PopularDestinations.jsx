import React from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowRight } from 'lucide-react';
import SafeImage from './SafeImage.jsx';
const MOBILE_FONT = "font-['SF_Pro_Text',_Roboto,_Inter,_system-ui,_sans-serif]";


export const POPULAR_DESTINATIONS_DATA = [
  {
    cityKey: 'restaurant_listing.popular.roma',
    regionKey: 'restaurant_listing.popular.lazio',
    city: "Roma",
    region: "Lazio",
    searchLocation: "Roma, Roma, Lazio",
    img: "/images/destinations/roma.png",
  },
  {
    cityKey: 'restaurant_listing.popular.milano',
    regionKey: 'restaurant_listing.popular.lombardia',
    city: "Milano",
    region: "Lombardia",
    searchLocation: "Milano, Milano, Lombardia",
    img: "/images/destinations/milano.png",
  },
  {
    cityKey: 'restaurant_listing.popular.firenze',
    regionKey: 'restaurant_listing.popular.toscana',
    city: "Firenze",
    region: "Toscana",
    searchLocation: "Firenze, Firenze, Toscana",
    img: "/images/destinations/firenze.png",
  },
  {
    cityKey: 'restaurant_listing.popular.venezia',
    regionKey: 'restaurant_listing.popular.veneto',
    city: "Venezia",
    region: "Veneto",
    searchLocation: "Venezia, Venezia, Veneto",
    img: "/images/destinations/venezia.png",
  },
];

const DestinationCard = ({ city, region, cityKey, regionKey, img, onClick }) => {
  const { t } = useTranslation("home");
  
  return (
    <div
      className="cursor-pointer group relative w-full"
      onClick={onClick}
    >
      {/* Mobile: aspect landscape 16/10 | Desktop: aspect 2/1 */}
      <div className="relative w-full rounded-2xl lg:rounded-[2rem] overflow-hidden aspect-[16/10] lg:aspect-[2/1] shadow-md transition-[transform,box-shadow] duration-500 group-hover:shadow-2xl group-hover:-translate-y-2 backface-hidden transform-gpu will-change-transform">
        <SafeImage
          src={img}
          alt={cityKey ? t(cityKey) : city}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

        <div className="absolute bottom-0 left-0 p-3 lg:p-5 text-white w-full">
          <span className={`inline-block bg-white/95 backdrop-blur-md px-1.5 py-0.5 rounded-md ${MOBILE_FONT} text-[12px] leading-[16px] font-semibold text-[#4A8A75] uppercase tracking-wider mb-1 shadow-sm lg:text-xs lg:font-bold`}>
            {regionKey ? t(regionKey) : region}
          </span>
          <h3 className={`${MOBILE_FONT} text-[18px] leading-[24px] font-semibold leading-tight mb-0.5 lg:mb-1 lg:text-2xl lg:font-extrabold`}>{cityKey ? t(cityKey) : city}</h3>
          <div className={`flex items-center gap-1 ${MOBILE_FONT} text-[14px] leading-[20px] font-normal text-gray-300 group-hover:text-white transition-colors lg:text-sm`}>
            <span>{t('carousel.discover', 'Scopri')}</span>
            <ArrowRight size={12} className="transform group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>
    </div>
  );
};

export const PopularDestinations = ({
  title,
  destinations = POPULAR_DESTINATIONS_DATA,
  onDestinationClick,
  className = ""
}) => {
  const { t } = useTranslation("home");
  const displayTitle = title || t('restaurant_listing.popular.title', 'Destinazioni Popolari');

  return (
    <section className={`mt-8 lg:mt-8 mb-6 lg:mb-12 ${className}`}>
      <h2 className={`${MOBILE_FONT} text-[22px] leading-[28px] font-semibold text-slate-800 mb-3 lg:mb-6 lg:text-2xl lg:font-bold`}>{displayTitle}</h2>
      {/* Mobile: griglia 2×2 compatta | Desktop: flex scroll orizzontale → grid 4 colonne */}
      <div className="grid grid-cols-2 gap-2 lg:grid lg:grid-cols-4 lg:gap-6">
        {destinations.map((dest, index) => (
          <DestinationCard
            key={dest.cityKey || index}
            {...dest}
            onClick={() => onDestinationClick && onDestinationClick(dest)}
          />
        ))}
      </div>
    </section>
  );
};

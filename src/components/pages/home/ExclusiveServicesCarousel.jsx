import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next'; // ** AGGIUNTO **
import { 
  Utensils, Home, PartyPopper, Car, Luggage, 
  ChevronLeft, ChevronRight, ArrowRight 
} from 'lucide-react';
import { HOGU_COLORS, HOGU_THEME } from '../../../config/theme.js';


const ACCENT_COLOR = '#E6F5F0'; 
const CTA_COLOR = '#33594C';

export const ExclusiveServicesCarousel = ({ setPage }) => {
    const { t } = useTranslation("home"); // ** Hook di traduzione **
    const sliderRef = useRef(null);
    const animationRef = useRef(0);
    const [isPaused, setIsPaused] = useState(false);

    // Dati dei servizi ora definiti con chiavi di traduzione
    const originalServices = useMemo(() => [
      { 
            typeKey: "carousel.restaurants.title", 
            descKey: "carousel.restaurants.description", 
            icon: Utensils, 
            page: "catalogRistoranti" 
        },
      { 
            typeKey: "carousel.bnb.title", 
            descKey: "carousel.bnb.description", 
            icon: Home, 
            page: "catalogBnB" 
        },
      { 
            typeKey: "carousel.club.title", 
            descKey: "carousel.club.description", 
            icon: PartyPopper, 
            page: "catalogClub" 
        },
      { 
            typeKey: "carousel.ncc.title", 
            descKey: "carousel.ncc.description", 
            icon: Car, 
            page: "catalogNCC" 
        },
      { 
            typeKey: "carousel.luggage.title", 
            descKey: "carousel.luggage.description", 
            icon: Luggage, 
            page: "catalogLuggage" 
        }
    ], []);

    // TRIPLI la lista per il Loop Infinito
    const infiniteServices = useMemo(() => [...originalServices, ...originalServices, ...originalServices], [originalServices]);

    // Parametri dimensionali
    const CARD_WIDTH = 320; 
    const GAP = 24; 
    const ITEM_FULL_WIDTH = CARD_WIDTH + GAP; 
    const singleSetWidth = originalServices.length * ITEM_FULL_WIDTH;

    const scroll = useCallback((direction) => {
      const current = sliderRef.current;
      if (!current) return;

      let targetScrollLeft;
      if (direction === 'left') {
          targetScrollLeft = current.scrollLeft - ITEM_FULL_WIDTH;
      } else {
          targetScrollLeft = current.scrollLeft + ITEM_FULL_WIDTH;
      }

      setIsPaused(true);
      current.scrollTo({ left: targetScrollLeft, behavior: 'smooth' }); 
      setTimeout(() => setIsPaused(false), 5000); 
    }, [ITEM_FULL_WIDTH]);

    useEffect(() => {
      const current = sliderRef.current;
      if (!current) return;

      const scrollSpeed = 0.5; 
      
      const animateMarqueeScroll = () => {
        if (!isPaused) {
          current.scrollLeft += scrollSpeed; 
          // Reset istantaneo
          const loopThreshold = singleSetWidth * 2; 
          if (current.scrollLeft >= loopThreshold) {
              current.scrollLeft = singleSetWidth; 
          }
        }
        animationRef.current = requestAnimationFrame(animateMarqueeScroll);
      };

      current.scrollLeft = singleSetWidth;
      animationRef.current = requestAnimationFrame(animateMarqueeScroll);

      return () => cancelAnimationFrame(animationRef.current);
    }, [isPaused, singleSetWidth]);

  return (
    <section className="w-full py-16 lg:py-24 relative overflow-hidden bg-white">
      <style>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      <div className="max-w-7xl mx-auto px-4">
          <h2 className={`text-4xl font-bold text-center mb-4 ${HOGU_THEME.text}`}>{t('carousel.main_title')}</h2>
          <p className={`text-center mb-12 max-w-2xl mx-auto ${HOGU_THEME.subtleText}`}>
              {t('carousel.main_description')}
          </p>
          
          <div 
              className="relative group"
              onMouseEnter={() => setIsPaused(true)}
              onMouseLeave={() => setIsPaused(false)}
          >
              {/* Bottone Sinistro */}
              <button 
                  onClick={() => scroll('left')}
                  className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-20 
                             w-12 h-12 bg-white rounded-full shadow-lg border border-gray-100
                             items-center justify-center text-gray-600 hover:text-[#68B49B] hover:scale-110 
                             transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
              >
                  <ChevronLeft size={28} />
              </button>

              {/* Container Scrollabile */}
              <div 
                  ref={sliderRef}
                  className="flex overflow-x-auto gap-6 py-8 px-4 hide-scrollbar"
              >
                  {infiniteServices.map((service, index) => (
                      <div key={index} className="w-80 flex-shrink-0 h-full">
                          <div 
                              onClick={() => setPage(service.page)}
                              className={`
                                group/card relative cursor-pointer bg-white p-8 rounded-[2rem] 
                                shadow-[0_10px_40px_-10px_rgba(0,0,0,0.05)]
                                hover:shadow-[0_20px_50px_-12px_rgba(104,180,155,0.4)]
                                transition-all duration-500 ease-out
                                flex flex-col items-center text-center h-full justify-between
                                border border-transparent hover:border-green-50
                                hover:-translate-y-2
                              `}
                          >
                              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#F0F9F6] opacity-0 group-hover/card:opacity-100 rounded-[2rem] transition-opacity duration-500" />

                              <div className="relative z-10 flex flex-col items-center w-full">
                                  <div className={`
                                      w-20 h-20 rounded-full bg-[${ACCENT_COLOR}] 
                                      flex items-center justify-center mb-6
                                      shadow-sm group-hover/card:shadow-md group-hover/card:scale-110 group-hover/card:bg-[#D8F0E6]
                                      transition-all duration-500 ease-out
                                  `}>
                                    <service.icon size={32} color={HOGU_COLORS.primary} className="transition-transform duration-500 group-hover/card:rotate-3" />
                                  </div>
                                  
                                  <h3 className={`text-2xl font-bold mb-3 ${HOGU_THEME.text} tracking-tight group-hover/card:text-[${CTA_COLOR}] transition-colors duration-300`}>
                                      {t(service.typeKey)}
                                  </h3>
                                  <p className={`${HOGU_THEME.subtleText} text-base leading-relaxed font-medium opacity-80 group-hover/card:opacity-100 transition-opacity`}>
                                      {t(service.descKey)}
                                  </p>
                              </div>

                              <div className="relative z-10 mt-6 h-6 flex items-end justify-center overflow-hidden">
                                  <span className={`
                                      text-[${HOGU_COLORS.primary}] font-bold text-sm uppercase tracking-widest
                                      transform translate-y-8 group-hover/card:translate-y-0
                                      transition-transform duration-500 ease-out flex items-center gap-2
                                  `}>
                                      {t('carousel.discover')} <ArrowRight size={16} strokeWidth={3} />
                                  </span>
                                  <div className={`
                                      absolute bottom-0 w-12 h-1 rounded-full bg-gray-100 
                                      transform group-hover/card:translate-y-8 group-hover/card:opacity-0
                                      transition-all duration-300
                                  `}></div>
                              </div>
                          </div>
                      </div>
                  ))}
              </div>

              {/* Bottone Destro */}
              <button 
                  onClick={() => scroll('right')}
                  className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-20 
                             w-12 h-12 bg-white rounded-full shadow-lg border border-gray-100
                             items-center justify-center text-gray-600 hover:text-[#68B49B] hover:scale-110 
                             transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
              >
                  <ChevronRight size={28} />
              </button>
          </div>
      </div>
    </section>
  );
};
import React, { useState, useEffect, useRef } from 'react';
import { Search, CalendarCheck, HeartHandshake } from 'lucide-react';

import { HOGU_THEME } from '../../../config/theme.js';

// Mock Translation Hook (per stabilità)
const useTranslation = () => ({
  t: (key) => {
    const dict = {
      "how_it_works.main_title": "Come funziona Hogu",
      "how_it_works.step1_title": "Cerca e Confronta",
      "how_it_works.step1_desc": "Trova il servizio perfetto per le tue esigenze tra centinaia di opzioni verificate.",
      "how_it_works.step2_title": "Prenota in un Click",
      "how_it_works.step2_desc": "Sistema di prenotazione diretto, sicuro e senza commissioni nascoste per gli utenti.",
      "how_it_works.step3_title": "Goditi l'Esperienza",
      "how_it_works.step3_desc": "Vivi il tuo evento o servizio senza pensieri. Supporto attivo 24/7."
    };
    return dict[key] || key;
  }
});

export const HowItWorksSection = () => {
    const { t } = useTranslation("home");
    const [activeStep, setActiveStep] = useState(0);
    const [isHovered, setIsHovered] = useState(false);
    const containerRef = useRef(null); 

    const steps = [
      { 
        titleKey: "how_it_works.step1_title", 
        descKey: "how_it_works.step1_desc",
        icon: Search
      },
      { 
        titleKey: "how_it_works.step2_title", 
        descKey: "how_it_works.step2_desc",
        icon: CalendarCheck
      },
      { 
        titleKey: "how_it_works.step3_title", 
        descKey: "how_it_works.step3_desc",
        icon: HeartHandshake
      }
    ];

    // 1. Loop automatico (aggiorna solo lo stato)
    useEffect(() => {
      if (isHovered) return;

      const interval = setInterval(() => {
        setActiveStep((prev) => (prev + 1) % steps.length);
      }, 4000);

      return () => clearInterval(interval);
    }, [steps.length, isHovered]);

    // 2. Effetto Scroll (reagisce al cambio di activeStep)
    useEffect(() => {
        if (containerRef.current && window.innerWidth < 768) { // Attivo solo su mobile
            const container = containerRef.current;
            const card = container.children[0]; // Prendi la prima card per misurare
            
            if (card) {
                const cardWidth = card.offsetWidth;
                const gap = 16; // gap-4
                const containerWidth = container.offsetWidth;
                
                // Posizione target
                const itemLeft = activeStep * (cardWidth + gap);
                
                // Calcolo per centrare l'elemento: posizione - (metà container) + (metà card)
                const scrollPos = itemLeft - (containerWidth / 2) + (cardWidth / 2);
                
                container.scrollTo({
                    left: scrollPos,
                    behavior: 'smooth'
                });
            }
        }
    }, [activeStep]);

  // Gestione scroll manuale (per aggiornare i pallini se l'utente scorre a mano)
  const handleScroll = () => {
      // Opzionale: se l'utente scorre manualmente, potremmo voler fermare l'autoplay o aggiornare lo step
      // Per ora lasciamo che l'autoplay guidi l'esperienza o che il click sui dots forzi lo step
  };

  return (
    <div 
      className={`py-16 md:py-24 max-w-7xl mx-auto w-full ${HOGU_THEME.fontFamily} overflow-hidden`}
      onMouseEnter={() => setIsHovered(true)} 
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="px-4 mb-10 md:mb-16 text-center">
          <h2 className={`text-4xl font-bold text-center mb-4 ${HOGU_THEME.text}`}>
              {t('how_it_works.main_title')}
          </h2>
        
      </div>
          
      {/* CONTAINER SCROLL RESPONSIVE */}
      <div 
        ref={containerRef}
        onScroll={handleScroll}
        className="
            flex overflow-x-auto snap-x snap-mandatory gap-4 py-8 px-6 w-full
            md:grid md:grid-cols-3 md:gap-8 md:overflow-visible md:py-0 md:px-4
            hide-scrollbar pb-12 md:pb-0
        "
        style={{ scrollBehavior: 'smooth' }}
      >
        {steps.map((item, index) => {
          const isActive = activeStep === index;

          return (
            <div 
                key={index} 
                className={`
                    /* BASE LAYOUT */
                    group relative bg-white p-8 rounded-[2.5rem]
                    flex flex-col items-center text-center 
                    border transition-all duration-500 ease-out
                    
                    /* MOBILE SIZING & SNAP */
                    w-[85vw] max-w-[320px] flex-shrink-0 snap-center
                    min-h-[320px] justify-center
                    
                    /* DESKTOP SIZING */
                    md:w-full md:max-w-none md:h-full md:min-h-[auto] md:justify-start

                    /* ACTIVE STATE */
                    ${isActive 
                        ? 'shadow-[0_20px_40px_-10px_rgba(104,180,155,0.3)] border-[#68B49B] scale-100 z-10' 
                        : 'shadow-sm border-gray-100 scale-95 md:scale-100 opacity-80 md:opacity-100'
                    }
                    
                    /* HOVER DESKTOP */
                    md:hover:-translate-y-2 md:hover:shadow-xl md:hover:border-[#68B49B]/50 md:hover:opacity-100
                `}
                onClick={() => setActiveStep(index)}
            >
              {/* Numero Background - CORRETTO PER MOBILE */}
              <span className={`
                  absolute top-4 right-6 leading-none font-black 
                  text-[#68B49B] select-none pointer-events-none
                  transition-all duration-700
                  /* Mobile: text-6xl, Desktop: text-8rem */
                  text-6xl md:text-[8rem]
                  ${isActive ? 'opacity-[0.08] scale-110' : 'opacity-[0.03]'}
              `}>
                  {index + 1}
              </span>

              {/* Icona Wrapper */}
              <div className={`
                  relative z-10 w-20 h-20 rounded-[2rem] 
                  flex items-center justify-center mb-6
                  transition-all duration-500 ease-in-out
                  ${isActive 
                    ? `bg-[#E6F5F0] text-[#68B49B] shadow-inner rotate-6` 
                    : `bg-gray-50 text-gray-400 rotate-0`
                  }
                  group-hover:rotate-12 group-hover:bg-[#68B49B] group-hover:text-white
              `}>
                <item.icon 
                  size={32} 
                  strokeWidth={2}
                  className={`transition-transform duration-500`} 
                />
              </div>

              {/* Contenuto */}
              <h4 className={`relative z-10 text-xl md:text-2xl font-bold mb-3 text-[#1A202C]`}>
                  {t(item.titleKey)}
              </h4>
              
              <p className={`
                relative z-10 text-gray-500 text-sm md:text-base leading-relaxed font-medium
                transition-opacity duration-500
                ${isActive ? 'opacity-100' : 'opacity-80'}
              `}>
                  {t(item.descKey)}
              </p>
            </div>
          );
        })}
      </div>

      {/* Indicatori (Dots) visibili solo su Mobile */}
      <div className="flex md:hidden justify-center gap-3 -mt-4">
        {steps.map((_, idx) => (
            <button
                key={idx}
                onClick={() => setActiveStep(idx)}
                className={`
                    h-2 rounded-full transition-all duration-500 ease-out
                    ${activeStep === idx ? 'w-8 bg-[#68B49B]' : 'w-2 bg-gray-300'}
                `}
                aria-label={`Vai allo step ${idx + 1}`}
            />
        ))}
      </div>

      {/* CSS Utility inline per nascondere scrollbar */}
      <style>{`
        .hide-scrollbar::-webkit-scrollbar {
            display: none;
        }
        .hide-scrollbar {
            -ms-overflow-style: none;
            scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};

export default HowItWorksSection;
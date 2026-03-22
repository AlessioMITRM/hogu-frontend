import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next'; // ** AGGIUNTO **
import {
    Utensils, Home, PartyPopper, Car, Luggage,
    ChevronLeft, ChevronRight, ArrowRight
} from 'lucide-react';
import { HOGU_COLORS, HOGU_THEME } from '../../../config/theme.js';
const MOBILE_FONT = "font-['SF_Pro_Text',_Roboto,_Inter,_system-ui,_sans-serif]";


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

        // Logica Mobile: Snap & Advance
        if (window.innerWidth < 768) {
            if (isPaused) return;

            // Inizializza posizione sul secondo set (per loop infinito)
            if (current.scrollLeft === 0) {
                const cardEl = current.children[0];
                const cardWidth = cardEl ? cardEl.offsetWidth : 300;
                const mobileGap = 12; // gap-3
                current.scrollLeft = originalServices.length * (cardWidth + mobileGap);
            }

            const interval = setInterval(() => {
                const cardEl = current.children[0];
                if (!cardEl) return;
                const cardWidth = cardEl.offsetWidth;
                const mobileGap = 16; // gap-4
                const mobileItemWidth = cardWidth + mobileGap;

                current.scrollBy({ left: mobileItemWidth, behavior: 'smooth' });
            }, 3000);

            const checkReset = () => {
                const cardEl = current.children[0];
                if (!cardEl) return;
                const cardWidth = cardEl.offsetWidth;
                const mobileItemWidth = cardWidth + 16; // gap-4
                const mobileSetWidth = originalServices.length * mobileItemWidth;
                if (current.scrollLeft >= mobileSetWidth * 2) {
                    current.scrollLeft = mobileSetWidth;
                }
            };
            current.addEventListener('scroll', checkReset);

            return () => {
                clearInterval(interval);
                current.removeEventListener('scroll', checkReset);
            };

        } else {
            // Logica Desktop: Marquee Continuo
            const scrollSpeed = 0.5;

            const animateMarqueeScroll = () => {
                if (!isPaused) {
                    current.scrollLeft += scrollSpeed;
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
        }
    }, [isPaused, singleSetWidth, ITEM_FULL_WIDTH, originalServices.length]);

    // Gestione Touch Mobile
    const onTouchStart = () => {
        if (window.innerWidth < 768) setIsPaused(true);
    };

    const onTouchEnd = () => {
        if (window.innerWidth < 768) {
            setTimeout(() => setIsPaused(false), 3000);
        }
    };

    return (
        <section className="w-full pt-10 pb-6 lg:py-24 relative overflow-hidden bg-[#F5F7FA] mt-6 md:mt-0 rounded-t-[2.5rem] md:rounded-none z-0">
            <style>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

            <div className="max-w-7xl mx-auto px-4">
                {/* Titolo e Descrizione */}
                <div className="text-center mb-3 md:mb-12 relative z-10">
                    <h2 className={`${MOBILE_FONT} text-[22px] leading-[28px] font-semibold mb-1 md:mb-4 ${HOGU_THEME.text} md:text-4xl md:font-bold md:leading-tight`}>
                        {t('carousel.main_title')}
                    </h2>
                    <p className={`${MOBILE_FONT} text-[14px] leading-[20px] font-normal max-w-2xl mx-auto ${HOGU_THEME.subtleText} px-4 md:text-lg md:leading-relaxed`}>
                        {t('carousel.main_description')}
                    </p>
                </div>

                <div
                    className="relative group"
                    onMouseEnter={() => { if (window.innerWidth >= 768) setIsPaused(true); }}
                    onMouseLeave={() => { if (window.innerWidth >= 768) setIsPaused(false); }}
                    onTouchStart={onTouchStart}
                    onTouchEnd={onTouchEnd}
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
                        className="flex overflow-x-auto gap-4 md:gap-6 py-4 md:py-8 px-[10vw] md:px-4 hide-scrollbar snap-x snap-mandatory md:snap-none"
                    >
                        {infiniteServices.map((service, index) => (
                            <div key={index} className="w-[80vw] md:w-80 flex-shrink-0 snap-center md:snap-align-none">
                                <div
                                    onClick={() => setPage(service.page)}
                                    className={`
                                group/card relative cursor-pointer bg-white p-4 md:p-8 rounded-[1.5rem] md:rounded-[2rem]
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
                                      w-12 h-12 md:w-20 md:h-20 rounded-full bg-[${ACCENT_COLOR}] 
                                      flex items-center justify-center mb-3 md:mb-6
                                      shadow-sm group-hover/card:shadow-md group-hover/card:scale-110 group-hover/card:bg-[#D8F0E6]
                                      transition-all duration-500 ease-out
                                  `}>
                                            <service.icon size={22} color={HOGU_COLORS.primary} className="transition-transform duration-500 group-hover/card:rotate-3" />
                                        </div>

                                        <h3 className={`${MOBILE_FONT} text-[18px] leading-[24px] font-semibold mb-1 md:mb-3 ${HOGU_THEME.text} tracking-tight group-hover/card:text-[${CTA_COLOR}] transition-colors duration-300 md:text-2xl md:font-bold`}>
                                            {t(service.typeKey)}
                                        </h3>
                                        <p className={`${HOGU_THEME.subtleText} ${MOBILE_FONT} text-[14px] leading-[20px] font-normal md:text-base leading-relaxed opacity-80 group-hover/card:opacity-100 transition-opacity`}>
                                            {t(service.descKey)}
                                        </p>
                                    </div>

                                    <div className="relative z-10 mt-4 md:mt-6 h-6 flex items-end justify-center overflow-hidden">
                                        <span className={`
                                          text-[${HOGU_COLORS.primary}] ${MOBILE_FONT} text-[16px] leading-[20px] font-semibold uppercase tracking-widest md:text-sm md:font-bold
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
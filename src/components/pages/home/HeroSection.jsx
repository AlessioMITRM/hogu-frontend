import React from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowRight, Sparkles } from 'lucide-react';
import { HOGU_COLORS, HOGU_THEME } from '../../../config/theme.js';


// --- COMPONENTI UI HELPERS (Locali per portabilità) ---

// Tag "Glass" elegante
const GlassTag = ({ children, className = '' }) => (
  <span className={`
    inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs md:text-sm font-medium tracking-wide
    bg-white/10 backdrop-blur-md border border-white/20 text-white shadow-sm
    ${className}
  `}>
    {children}
  </span>
);

// Bottone "Hero" Primario (Bianco)
const HeroButtonPrimary = ({ children, onClick }) => (
  <button
    onClick={onClick}
    className="
      w-full sm:w-auto justify-center
      px-5 py-2.5 md:px-8 md:py-4 rounded-xl md:rounded-2xl text-sm md:text-lg font-bold text-[#1A202C] bg-white 
      hover:bg-gray-50 transition-all duration-300 ease-out 
      shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:shadow-[0_0_30px_rgba(255,255,255,0.5)]
      hover:-translate-y-1 active:translate-y-0 flex items-center gap-2 group
    "
  >
    {children}
    <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
  </button>
);

// Bottone "Hero" Secondario (Outline/Glass)
const HeroButtonSecondary = ({ children, onClick }) => (
  <button
    onClick={onClick}
    className="
      w-full sm:w-auto justify-center
      px-5 py-2.5 md:px-8 md:py-4 rounded-xl md:rounded-2xl text-sm md:text-lg font-bold text-white border border-white/30 
      bg-white/5 backdrop-blur-sm hover:bg-white/10 hover:border-white/50
      transition-all duration-300 ease-out flex items-center gap-2
    "
  >
    {children}
  </button>
);

// --- COMPONENTE PRINCIPALE ---

export const HeroSection = ({ setPage }) => {
  const { t } = useTranslation("home");

  return (
    // CONTAINER PRINCIPALE
    // - min-h-[90svh]: Su mobile riduciamo leggermente l'altezza per far intravedere la barra di ricerca (UX migliore)
    // - pt-32: Spazio extra in alto per la navbar su mobile
    <section className="relative w-full min-h-[75svh] md:min-h-[100svh] flex items-center justify-center overflow-hidden font-sans pt-16 pb-24 md:pt-0 md:pb-0">

      {/* 1. SFONDO CON PARALLASSE E GRADIENTE */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat z-0"
        style={{
          backgroundImage: `url('/images/rome_trastevere.png')`,
        }}
      >
        {/* Overlay Gradiente Scuro: Più forte su mobile per leggibilità */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/60 to-black/90 opacity-95 md:opacity-90"></div>

        {/* Gradiente inferiore per stacco morbido con la sezione di ricerca */}
        <div className="absolute bottom-0 left-0 right-0 h-32 md:h-48 bg-gradient-to-t from-black/80 via-black/40 to-transparent z-[1]"></div>

        {/* Pattern a punti opzionale per texture */}
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>
      </div>

      {/* 2. CONTENUTO CENTRALE */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 text-center flex flex-col items-center animate-in fade-in zoom-in-95 duration-700">

        {/* Tag Opzionale (es. Novità) */}
        {/* <GlassTag className="mb-6">Nuova Piattaforma 2025</GlassTag> */}

        {/* Titolo Principale */}
        {/* Mobile: text-4xl, Desktop: text-7xl. Leading tight per evitare spazi enormi tra le righe */}
        <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-white leading-[1.1] tracking-tight mb-2 md:mb-8 drop-shadow-2xl">
          {t('hero.title_part1')}, <br className="hidden md:block" />
          {t('hero.title_part2')}. <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#68B49B] via-emerald-300 to-[#68B49B]">
            {t('hero.title_brand')}
          </span>
        </h1>

        {/* Sottotitolo */}
        {/* Mobile: testo più piccolo e margini calibrati */}
        <div className="max-w-2xl mb-4 md:mb-12 px-2">
          <p className="text-sm sm:text-lg md:text-xl text-gray-200 leading-relaxed font-medium drop-shadow-md">
            {t('hero.subtitle_line1')} {t('hero.subtitle_line2', { commission: '8%' })}
          </p>

          {/* Footer del sottotitolo (es. "Iscrizione gratuita") */}
          <div className="mt-2 md:mt-4 pt-2 md:pt-0 border-t border-white/10 md:border-none w-full md:w-auto">
            <span className="text-white/90 text-[10px] md:text-sm uppercase tracking-widest font-bold">
              {t('hero.subtitle_footer')}
            </span>
          </div>
        </div>

        {/* Bottoni CTA */}
        {/* Mobile: flex-col (verticali) e w-full (larghezza piena) per facilitare il tocco */}
        <div className="flex flex-col sm:flex-row items-center gap-2 md:gap-3 w-full sm:w-auto px-4 sm:px-0">
          <HeroButtonPrimary onClick={() => setPage('register')}>
            {t('hero.cta_primary')}
          </HeroButtonPrimary>

          <HeroButtonSecondary onClick={() => setPage('home')}>
            {t('hero.cta_secondary')}
          </HeroButtonSecondary>
        </div>

        {/* Trust / Social Proof (Opzionale - Spazio riservato) */}
        {/* <div className="mt-12 md:mt-16 opacity-80 grayscale hover:grayscale-0 transition-all duration-500"> */}
        {/* Qui potresti mettere loghi di partner o rating */}
        {/* </div> */}

      </div>
    </section>
  );
};

export default HeroSection;
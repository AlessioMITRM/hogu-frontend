import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { LogOut, Menu, X, LayoutDashboard, ChevronDown, Check, Utensils, Home, Music, CarFront, Luggage } from "lucide-react";
import { useAuth } from "../context/AuthContext";

// ---------------------
// SELECTOR LINGUE
// ---------------------
const FlagSelector = ({ isTransparent, isMobile = false }) => {
  const { i18n, t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedLang, setSelectedLang] = useState(i18n.language.toUpperCase());
  const dropdownRef = useRef(null);

  const languages = [
    { code: "IT", label: t("header.languages.italian"), flagUrl: "https://flagcdn.com/it.svg" },
    { code: "EN", label: t("header.languages.english"), flagUrl: "https://flagcdn.com/gb.svg" },
  ];

  useEffect(() => {
    const clickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setIsOpen(false);
    };
    document.addEventListener("mousedown", clickOutside);
    return () => document.removeEventListener("mousedown", clickOutside);
  }, []);

  useEffect(() => setSelectedLang(i18n.language.toUpperCase()), [i18n.language]);

  const handleSelect = (code) => {
    i18n.changeLanguage(code.toLowerCase());
    setSelectedLang(code);
    setIsOpen(false);
  };

  if (isMobile) {
    return (
      <div className="grid grid-cols-5 gap-2 p-2 bg-gray-50 rounded-xl border border-gray-100">
        {languages.map((l) => (
          <button
            key={l.code}
            onClick={() => handleSelect(l.code)}
            className={`flex flex-col items-center p-2 rounded-lg ${selectedLang === l.code ? "bg-white shadow-sm border border-gray-200" : "hover:bg-gray-200"
              }`}
          >
            <img src={l.flagUrl} alt={l.code} className="w-7 h-5 rounded-sm object-cover shadow-sm" />
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`h-10 px-3 rounded-full flex items-center gap-2 border transition-all font-bold text-xs
          ${isTransparent && !isOpen
            ? "bg-white/10 text-white border-white/20 backdrop-blur-md"
            : "bg-white text-gray-700 border-gray-300 hover:text-[#68B49B]"} `}
      >
        <img
          src={languages.find((l) => l.code === selectedLang)?.flagUrl}
          alt={selectedLang}
          className="w-6 h-4 rounded-sm object-cover shadow-sm"
        />
        <ChevronDown size={14} className={`${isOpen ? "rotate-180" : ""} transition-transform`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-gray-100 py-1 z-50">
          <div className="px-4 py-2 border-b border-gray-50 text-[10px] font-bold text-gray-400 uppercase">
            {t("header.language_selector.title")}
          </div>
          {languages.map((l) => (
            <button
              key={l.code}
              onClick={() => handleSelect(l.code)}
              className={`w-full flex items-center justify-between px-4 py-3 text-sm ${selectedLang === l.code ? "text-[#68B49B] bg-[#F0FDF9]" : "text-gray-700"
                }`}
            >
              <div className="flex items-center gap-3">
                <img src={l.flagUrl} alt={l.code} className="w-6 h-4 rounded-sm object-cover shadow-sm" />
                {l.label}
              </div>
              {selectedLang === l.code && <Check size={14} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// ---------------------
// HEADER FINALE
// ---------------------
const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const { isAuthenticated, user, logout, setIsLoading } = useAuth();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);
  const isTransparent = false;

  // Chiudiamo il menu mobile automaticamente quando cambia la rotta.
  // Poiché App.jsx mostra un LoadingScreen (z-9999) al cambio rotta,
  // il menu (z-60) verrà coperto PRIMA di chiudersi, evitando il flash della vecchia pagina.
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleScroll = () => {
      const y = window.scrollY;
      setIsVisible(y <= lastScrollY.current || y <= 100);
      lastScrollY.current = y;
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navItems = [
    { nameKey: "nav.restaurants", url: "/service/restaurant", Icon: Utensils },
    { nameKey: "nav.bnb", url: "/service/bnb", Icon: Home },
    { nameKey: "nav.club", url: "/service/club", Icon: Music },
    { nameKey: "nav.ncc", url: "/service/ncc", Icon: CarFront },
    { nameKey: "nav.luggage", url: "/service/luggage", Icon: Luggage },
  ];

  const goTo = (url) => {
    // Se stiamo già nella pagina target, chiudiamo solo il menu
    if (location.pathname === url) {
      setIsMenuOpen(false);
      return;
    }
    // Altrimenti navighiamo e lasciamo che l'useEffect sopra chiuda il menu
    // mentre il LoadingScreen globale copre tutto.
    navigate(url);
  };

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300
          ${isVisible ? "translate-y-0" : "-translate-y-full"}
          ${isTransparent ? "bg-transparent py-6" : "bg-white shadow-sm py-3 border-b border-gray-100"}`}
      >
        <div className="max-w-7xl mx-auto px-4 flex justify-between items-center">

          {/* LOGO */}
          <div onClick={() => goTo("/")} className="cursor-pointer group">
            <span className={`text-3xl font-extrabold tracking-tight ${isTransparent ? "text-white" : "text-[#1A202C]"}`}>
              Hogu<span className="text-[#68B49B] group-hover:text-[#599c86] transition-colors">.</span>
            </span>
          </div>

          {/* MENU DESKTOP */}
          <nav className="hidden lg:flex items-center gap-0.5 p-1 bg-gray-50 border border-gray-200 rounded-2xl">
            {navItems.map(({ url, nameKey, Icon }) => {
              const isActive = location.pathname === url;
              return (
                <button
                  key={url}
                  onClick={() => goTo(url)}
                  className={`group relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200
                    ${isActive
                      ? "bg-[#68B49B] text-white shadow-md shadow-[#68B49B]/20"
                      : "text-gray-500 hover:text-[#68B49B] hover:bg-white/70"
                    }`}
                >
                  <Icon
                    size={15}
                    className={`transition-transform duration-200 group-hover:scale-110 ${isActive ? "text-white" : "text-gray-400 group-hover:text-[#68B49B]"
                      }`}
                  />
                  <span>{t(nameKey)}</span>
                </button>
              );
            })}
          </nav>

          {/* ACTIONS */}
          <div className="flex items-center gap-4">
            <div className="hidden sm:block">
              <FlagSelector isTransparent={isTransparent} />
            </div>

            {!isAuthenticated ? (
              <>
                <button
                  onClick={() => goTo("/login")}
                  className={`hidden sm:block text-sm font-bold px-4 py-2 rounded-xl ${isTransparent ? "text-white hover:bg-white/10" : "text-gray-700 hover:text-[#68B49B] hover:bg-gray-50"
                    }`}
                >
                  {t("header.auth.login")}
                </button>
                <button
                  onClick={() => goTo("/register")}
                  className={`font-bold px-6 py-2.5 rounded-xl shadow-md hover:scale-105 active:scale-95 ${isTransparent ? "bg-white text-[#68B49B]" : "bg-[#68B49B] text-white hover:bg-[#599c86]"
                    }`}
                >
                  {t("header.auth.register")}
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => {
                    switch (user?.role) {
                      case "CUSTOMER": goTo("/customer/dashboard"); break;
                      case "PROVIDER": goTo("/provider/dashboard"); break;
                      case "ADMIN": goTo("/admin/dashboard"); break;
                      default: goTo("/dashboard");
                    }
                  }}
                  className={`hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl shadow-md hover:scale-105 active:scale-95 font-bold ${isTransparent ? "bg-white text-[#68B49B]" : "bg-[#68B49B] text-white hover:bg-[#599c86]"
                    }`}
                >
                  <LayoutDashboard size={18} /> {t("header.auth.dashboard")}
                </button>

                <button
                  onClick={() => {
                    setIsLoading(true);
                    logout();
                  }}
                  className={`p-2.5 rounded-full ${isTransparent ? "bg-white/20 text-white hover:bg-white/30" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
                  title={t("header.auth.logout")}
                >
                  <LogOut size={20} />
                </button>
              </>
            )}

            <button
              onClick={() => setIsMenuOpen(true)}
              className={`lg:hidden p-2 rounded-xl ${isTransparent ? "text-white bg-white/20" : "text-gray-700 bg-gray-100"}`}
            >
              <Menu size={24} />
            </button>
          </div>
        </div>
      </header>

      {/* MOBILE MENU */}
      <div style={{ zIndex: 10000 }} className={`fixed inset-0 bg-white transition-all lg:hidden flex flex-col ${isMenuOpen ? "opacity-100 translate-x-0" : "opacity-0 translate-x-full pointer-events-none"
        }`}>
        <div className="flex justify-between items-center p-6 border-b border-gray-100">
          <span className="text-2xl font-extrabold text-[#1A202C]">
            Hogu<span className="text-[#68B49B]">.</span>
          </span>
          <button onClick={() => setIsMenuOpen(false)} className="p-2 bg-gray-100 rounded-full text-gray-600 hover:bg-gray-200">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-2">
          {isAuthenticated && (
            <button
              onClick={() => {
                switch (user?.role) {
                  case "CUSTOMER": goTo("/customer/dashboard"); break;
                  case "PROVIDER": goTo("/provider/dashboard"); break;
                  case "ADMIN": goTo("/admin/dashboard"); break;
                  default: goTo("/dashboard");
                }
              }}
              className="w-full p-4 text-left text-lg font-bold bg-[#68B49B] text-white rounded-2xl shadow-lg mb-6 flex items-center gap-3"
            >
              <LayoutDashboard size={24} /> {t("header.mobile.go_to_dashboard")}
            </button>
          )}

          {navItems.map(({ url, nameKey, Icon }) => {
            const isActive = location.pathname === url;
            return (
              <button
                key={url}
                onClick={() => goTo(url)}
                className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl font-bold text-base transition-all ${isActive
                  ? "bg-[#68B49B] text-white shadow-lg shadow-[#68B49B]/20"
                  : "bg-gray-50 text-gray-700 hover:bg-[#F0FDF9] hover:text-[#68B49B]"
                  }`}
              >
                <span className={`p-2 rounded-xl ${isActive ? "bg-white/20 text-white" : "bg-gray-200 text-gray-500"
                  }`}>
                  <Icon size={18} />
                </span>
                {t(nameKey)}
              </button>
            );
          })}

          {!isAuthenticated && (
            <div className="grid grid-cols-2 gap-4 mt-6">
              <button onClick={() => goTo("/login")} className="py-3 rounded-2xl font-bold text-gray-700 border border-gray-200">
                {t("header.auth.login")}
              </button>
              <button onClick={() => goTo("/register")} className="py-3 rounded-2xl font-bold text-white bg-[#68B49B]">
                {t("header.auth.register")}
              </button>
            </div>
          )}

          <div className="mt-8 border-t border-gray-100 pt-6">
            <p className="text-xs font-bold text-gray-400 uppercase mb-3">
              {t("header.mobile.language_title")}
            </p>
            <FlagSelector isMobile={true} />
          </div>
        </div>
      </div>
    </>
  );
};

export default Header;

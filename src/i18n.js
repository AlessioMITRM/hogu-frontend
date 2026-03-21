import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import homeEn from "./i18n/en/home.json";
import homeIt from "./i18n/it/home.json";
import restaurantEn from "./i18n/en/restaurant.json";
import restaurantIt from "./i18n/it/restaurant.json";
import bnbEn from "./i18n/en/bnb.json";
import bnbIt from "./i18n/it/bnb.json";
import authEn from "./i18n/en/auth.json";
import authIt from "./i18n/it/auth.json";
import dashboardEn from "./i18n/en/dashboard.json";
import dashboardIt from "./i18n/it/dashboard.json";
import profileEn from "./i18n/en/profile.json";
import profileIt from "./i18n/it/profile.json";

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { 
        home: homeEn,
        restaurant: restaurantEn,
        bnb: bnbEn,
        auth: authEn,
        dashboard: dashboardEn,
        profile: profileEn
      },
      it: { 
        home: homeIt,
        restaurant: restaurantIt,
        bnb: bnbIt,
        auth: authIt,
        dashboard: dashboardIt,
        profile: profileIt
      }
    },
    lng: "it",
    fallbackLng: "en",
    ns: ["home", "restaurant", "bnb", "auth", "dashboard", "profile"],
    defaultNS: "home",
    interpolation: { escapeValue: false }
  });

export default i18n;

import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import homeEn from "./i18n/en/home.json";
import homeIt from "./i18n/it/home.json";

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { home: homeEn },
      it: { home: homeIt }
    },
    lng: "it",
    fallbackLng: "en",
    ns: ["home"],
    defaultNS: "home",
    interpolation: { escapeValue: false }
  });

export default i18n;

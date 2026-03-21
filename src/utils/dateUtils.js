/**
 * Utility per la gestione di Date, TimeZone e Localizzazione Servizi
 */

/**
 * Determina il TimeZone basandosi su Country e City (preferibilmente in inglese)
 * @param {string} country - Nome del paese (es. "Italy", "USA")
 * @param {string} city - Nome della città (es. "Rome", "New York")
 * @returns {string} - IANA Time Zone string (es. "Europe/Rome")
 */
export const getTimeZone = (country, city) => {
    if (!country) return 'Europe/Rome'; // Default
    
    const c = country.toLowerCase().trim();
    const ci = city ? city.toLowerCase().trim() : '';

    // Mappatura Paesi -> TimeZone (Basata su nomi Inglesi)
    const countryZones = {
        'italy': 'Europe/Rome',
        'uk': 'Europe/London', 'united kingdom': 'Europe/London',
        'france': 'Europe/Paris',
        'germany': 'Europe/Berlin',
        'spain': 'Europe/Madrid',
        'netherlands': 'Europe/Amsterdam',
        'belgium': 'Europe/Brussels',
        'switzerland': 'Europe/Zurich',
        'austria': 'Europe/Vienna',
        'portugal': 'Europe/Lisbon',
        'greece': 'Europe/Athens',
        'turkey': 'Europe/Istanbul',
        'japan': 'Asia/Tokyo',
        'china': 'Asia/Shanghai',
        'thailand': 'Asia/Bangkok',
        'singapore': 'Asia/Singapore',
        'uae': 'Asia/Dubai', 'united arab emirates': 'Asia/Dubai',
        'brazil': 'America/Sao_Paulo',
        'argentina': 'America/Argentina/Buenos_Aires',
        'australia': 'Australia/Sydney',
    };

    // Eccezioni per Paesi Multi-Fuso
    if (c === 'spain') {
        if (['las palmas', 'santa cruz', 'tenerife'].some(x => ci.includes(x))) return 'Atlantic/Canary';
        return 'Europe/Madrid';
    }

    if (c === 'portugal') {
        if (ci.includes('azores')) return 'Atlantic/Azores';
        if (ci.includes('madeira')) return 'Atlantic/Madeira';
        return 'Europe/Lisbon';
    }

    if (c === 'usa' || c === 'united states') {
        if (['new york', 'miami', 'boston', 'washington', 'atlanta', 'orlando'].includes(ci)) return 'America/New_York';
        if (['chicago', 'houston', 'dallas', 'austin', 'new orleans'].includes(ci)) return 'America/Chicago';
        if (['denver', 'phoenix', 'salt lake city'].includes(ci)) return 'America/Denver';
        if (['los angeles', 'san francisco', 'las vegas', 'seattle', 'san diego'].includes(ci)) return 'America/Los_Angeles';
        return 'America/New_York'; // Default East Coast
    }

    return countryZones[c] || 'Europe/Rome';
};

/**
 * Estrae le informazioni di localizzazione (Display e Logic) dal servizio
 * @param {Array} serviceLocales - Array di oggetti locale del servizio
 * @param {string} [currentLanguage] - Lingua corrente (es. "it", "en")
 * @returns {Object} - { displayLocale, logicLocale, timeZone, userFullLang }
 */
export const getServiceLocalization = (serviceLocales, currentLanguage) => {
    const userFullLang = navigator.language || 'it-IT';
    const userLangCode = currentLanguage || userFullLang.split('-')[0];
    
    const locales = (serviceLocales && Array.isArray(serviceLocales)) ? serviceLocales : [];

    // A) Locale per VISUALIZZAZIONE (indirizzi in lingua utente)
    const displayLocale = locales.find(l => l.language === userLangCode) || 
                          locales.find(l => l.language === 'en') || 
                          locales[0] || 
                          {};

    // B) Locale per LOGICA (Fuso orario basato su nomi standard in Inglese)
    const logicLocale = locales.find(l => l.language === 'en') || displayLocale;

    // Calcolo TimeZone
    const timeZone = getTimeZone(logicLocale.country, logicLocale.city);

    return {
        displayLocale,
        logicLocale,
        timeZone,
        userFullLang
    };
};

/**
 * Formatta un oggetto data/ora completo per un servizio
 */
export const formatServiceDateTimes = (startTime, endTime, timeZone, userLang) => {
    const dateOptions = { day: 'numeric', month: 'short', timeZone };
    const dayOptions = { weekday: 'long', timeZone };
    const timeOptions = { hour: '2-digit', minute: '2-digit', timeZone };

    let dateStr, dayStr, startTimeStr = "23:00", endTimeStr = "05:00";

    if (startTime) {
        const start = new Date(startTime);
        dateStr = start.toLocaleDateString(userLang, dateOptions);
        dayStr = start.toLocaleDateString(userLang, dayOptions);
        startTimeStr = start.toLocaleTimeString(userLang, timeOptions);
    } else {
        const nextDate = new Date();
        nextDate.setDate(nextDate.getDate() + (5 - nextDate.getDay() + 7) % 7);
        dateStr = nextDate.toLocaleDateString(userLang, dateOptions);
        dayStr = nextDate.toLocaleDateString(userLang, dayOptions);
    }

    if (endTime) {
        const end = new Date(endTime);
        endTimeStr = end.toLocaleTimeString(userLang, timeOptions);
    }

    return { dateStr, dayStr, startTimeStr, endTimeStr };
};

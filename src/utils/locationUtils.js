import italianLocationsData from '../assets/data/italian_locations.json';
import englishLocationsData from '../assets/data/english_locations.json';

/**
 * Returns the appropriate location dataset based on language.
 * @param {string} lang - Language code (e.g., 'it', 'en')
 * @returns {Array} The location dataset
 */
export const getLocationData = (lang) => {
    return lang?.startsWith('it') ? italianLocationsData : englishLocationsData;
};

/**
 * Parses a city string "City, Region" into parts.
 * @param {string} cityStr - The city string
 * @returns {Object} { city, region }
 */
export const parseCityString = (cityStr) => {
    if (!cityStr) return { city: '', region: '' };
    const parts = cityStr.split(',').map(p => p.trim());
    
    // Check if we have "City, Province, Region" format
    if (parts.length >= 3) {
        return {
            city: parts[0] || '',
            region: parts[2] || '' // Take the 3rd part as region
        };
    }
    
    // Fallback for "City, Region" format
    return {
        city: parts[0] || '',
        region: parts[1] || ''
    };
};

/**
 * Flattens the hierarchical location data into a flat array for searching.
 * Handles both string cities and object cities {id, name}.
 * @param {Array} data - The hierarchical location data (Regions -> Provinces -> Cities)
 * @returns {Array} Flat array of location objects
 */
export const processLocations = (data) => {
    if (!data) return [];
    const flat = [];
    data.forEach(region =>
        region.provinces.forEach(province =>
            province.cities.forEach(cityObj => {
                const cityName = typeof cityObj === 'string' ? cityObj : cityObj.name;
                const cityId = typeof cityObj === 'object' ? cityObj.id : null;
                
                flat.push({
                    city: cityName,
                    cityId: cityId,
                    province: province.name,
                    provinceId: province.provinceId,
                    region: region.region,
                    fullLabel: `${cityName}, ${province.name}, ${region.region}`,
                    searchString: `${cityName}, ${province.name}, ${region.region}`
                        .toLowerCase()
                        .normalize('NFD')
                        .replace(/[\u0300-\u036f]/g, '')
                });
            })
        )
    );
    return flat;
};

/**
 * Helper to find a location in a specific dataset.
 * @param {Array} dataset - The hierarchical location data
 * @param {string} targetCity - The city name to find
 * @param {string} targetRegion - The region name (optional)
 * @returns {Object|null} The found location object or null
 */
export const findInDataset = (dataset, targetCity, targetRegion) => {
    if (!dataset || !targetCity) return null;
    
    const normalizedCity = targetCity.toLowerCase().trim();
    const normalizedRegion = targetRegion ? targetRegion.toLowerCase().trim() : null;

    for (const r of dataset) {
        // Check region if provided (skip if region doesn't match)
        if (normalizedRegion && r.region && r.region.toLowerCase() !== normalizedRegion) continue;
        
        for (const p of r.provinces) {
            // Check city in list
            const cityMatch = p.cities.find(c => {
                const name = typeof c === 'string' ? c : c?.name;
                return name && name.toLowerCase() === normalizedCity;
            });
            
            if (cityMatch) {
                return { region: r.region, province: p.name, provinceId: p.provinceId, city: cityMatch };
            }
            
            // Check if city matches province name (Capoluogo case often)
            if (p.name.toLowerCase() === normalizedCity) {
                return { region: r.region, province: p.name, provinceId: p.provinceId, city: p.name };
            }
        }
    }
    return null;
};

/**
 * Finds a location match across multiple datasets, prioritizing the primary one.
 * @param {string} city - City name
 * @param {string} state - Region/State name
 * @param {Array} primaryDataset - The first dataset to search (usually based on language)
 * @param {Array} fallbackDatasets - Array of datasets to search if not found in primary
 * @returns {Object} { match, dataset, isPrimary }
 */
export const findLocationMatch = (city, state, primaryDataset, fallbackDatasets = []) => {
    // 1. Try primary
    let match = findInDataset(primaryDataset, city, state);
    if (match) return { match, dataset: primaryDataset, isPrimary: true };

    // 2. Try fallbacks
    for (const dataset of fallbackDatasets) {
        match = findInDataset(dataset, city, state);
        if (match) return { match, dataset, isPrimary: false };
    }

    return { match: null, dataset: null, isPrimary: false };
};

/**
 * Resolves the canonical English location based on a match from any dataset.
 * Uses Province ID and City ID (if available) to map back to English.
 * @param {Object} matchData - The match object from findInDataset
 * @param {string} originalCityName - The original city name input
 * @param {string} fallbackRegion - Optional fallback region if no match is found
 * @returns {Object} The resolved English location { region, province, city }
 */
export const resolveEnglishLocation = (matchData, originalCityName, fallbackRegion = '') => {
    if (!matchData) {
        // Fallback object if no match found at all
        return {
             region: fallbackRegion,
             province: '',
             city: originalCityName
        };
    }

    const foundProvinceId = matchData.provinceId;
    const foundCityId = typeof matchData.city === 'object' ? matchData.city.id : null;

    if (foundProvinceId) {
        for (const r of englishLocationsData) {
            const p = r.provinces.find(pr => pr.provinceId === foundProvinceId);
            if (p) {
                let finalCityName = originalCityName;

                // Try to find the canonical English city name by ID
                if (foundCityId) {
                    const canonicalCity = p.cities.find(c => c.id === foundCityId);
                    if (canonicalCity) {
                        finalCityName = canonicalCity.name;
                    }
                } else if (typeof matchData.city === 'string' && matchData.city.toLowerCase() === matchData.province.toLowerCase()) {
                     // If it was a province match (capoluogo), try to use the English province name as city
                     finalCityName = p.name;
                }

                return {
                    region: r.region,
                    province: p.name,
                    city: finalCityName
                };
            }
        }
    }

    // Fallback if province ID not found in English dataset (should not happen if IDs are synced)
    return {
        region: matchData.region,
        province: matchData.province,
        city: typeof matchData.city === 'string' ? matchData.city : matchData.city.name
    };
};

/**
 * Creates the standard location payload for API requests.
 * Automatically handles parsing, matching against datasets, and resolving to English.
 * 
 * @param {string} cityString - "City, Region" string
 * @param {string} address - Street address
 * @param {string} serviceType - Service type code (e.g., 'BNB', 'NCC')
 * @returns {Array} Array containing the single English locale object
 */
export const createLocationPayload = (cityString, address, serviceType) => {
    const { city, region } = parseCityString(cityString);
    
    // Use utility to find match across datasets
    // We assume we want to resolve to English for the backend
    const { match: matchData } = findLocationMatch(city, region, englishLocationsData, [italianLocationsData]);
    
    const englishMatch = resolveEnglishLocation(matchData, city, region);
    
    const locationObj = {
        language: 'en',
        country: 'Italy',
        state: englishMatch.region,     
        province: englishMatch.province,
        city: englishMatch.city,
        address: address,
        postalCode: '' 
    };

    if (serviceType) {
        locationObj.serviceType = serviceType;
    }

    return [locationObj];
};

/**
 * Gets the display string for a location based on the current locale/language.
 * Performs a reverse lookup if the stored location is in English but the user is viewing in Italian.
 * @param {Object} localeData - { city, state } from the backend (usually English)
 * @param {string} language - Current language code (e.g., 'it', 'en')
 * @returns {string} Formatted string "City, Province, Region"
 */
export const getDisplayLocation = (localeData, language) => {
    if (!localeData || !localeData.city) return '';

    const isItalian = language && language.startsWith('it');
    
    // If not Italian, just return the stored English data
    if (!isItalian) {
        const parts = [localeData.city];
        if (localeData.province) parts.push(localeData.province);
        if (localeData.state) parts.push(localeData.state);
        return parts.join(', ');
    }

    // If Italian, try to reverse lookup from English Data to Italian Data
    // Find in English Data first to get IDs
    const englishMatch = findInDataset(englishLocationsData, localeData.city, localeData.state);
    
    if (englishMatch && englishMatch.provinceId) {
        // Find in Italian Data using Province ID
        for (const r of italianLocationsData) {
            const p = r.provinces.find(pr => pr.provinceId === englishMatch.provinceId);
            if (p) {
                 // Try to find city by ID if available
                 const englishCityId = typeof englishMatch.city === 'object' ? englishMatch.city.id : null;
                 let italianCityName = localeData.city; // Default to English name if no match

                 if (englishCityId) {
                     const italianCity = p.cities.find(c => c.id === englishCityId);
                     if (italianCity) italianCityName = italianCity.name;
                 } else {
                     // If matched by name in English, try to match by name in Italian?? 
                     // Or if it was a province match
                     if (englishMatch.province === englishMatch.city || englishMatch.city === p.name) {
                         italianCityName = p.name;
                     }
                 }
                 
                 return `${italianCityName}, ${p.name}, ${r.region}`;
            }
        }
    }

    // Fallback: just return what we have
    const parts = [localeData.city];
    if (localeData.province) parts.push(localeData.province);
    if (localeData.state) parts.push(localeData.state);
    return parts.join(', ');
};

export { italianLocationsData, englishLocationsData };

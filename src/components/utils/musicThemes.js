import { HOGU_COLORS } from '../../config/theme.js';

export const MUSIC_THEMES = {
  HOUSE: {
    id: 'HOUSE',
    label: 'musicTheme.house',
    value: 'House',
    icon: '🎵', // Icona Unicode o componente SVG
    color: HOGU_COLORS.primary,
    subThemes: ['Tech House', 'Deep House', 'Progressive House']
  },
  TECHNO: {
    id: 'TECHNO',
    label: 'musicTheme.techno',
    value: 'Techno',
    icon: '⚡',
    color: HOGU_COLORS.dark,
    subThemes: ['Melodic Techno', 'Acid Techno', 'Industrial Techno']
  },
  DNB: {
    id: 'DNB',
    label: 'musicTheme.dnb',
    value: 'Drum & Bass',
    icon: '🥁',
    color: HOGU_COLORS.emeraldText,
    subThemes: ['Liquid', 'Neurofunk', 'Jump Up']
  },
  HIPHOP: {
    id: 'HIPHOP',
    label: 'musicTheme.hiphop',
    value: 'Hip Hop',
    icon: '🎤',
    color: HOGU_COLORS.purpleText,
    subThemes: ['Trap', 'Old School', 'RnB']
  },
  LATIN: {
    id: 'LATIN',
    label: 'musicTheme.latin',
    value: 'Latin',
    icon: '💃',
    color: HOGU_COLORS.success,
    subThemes: ['Reggaeton', 'Salsa', 'Bachata']
  },
  COMMERCIAL: {
    id: 'COMMERCIAL',
    label: 'musicTheme.commercial',
    value: 'Commercial',
    icon: '📈',
    color: HOGU_COLORS.warning,
    subThemes: ['Top 40', 'EDM', 'Pop']
  }
};

// Funzione per mappare stringa API a tema
export const parseThemeFromAPI = (themeString) => {
  if (!themeString) return [];
  
  const themes = themeString.split('/').map(t => t.trim());
  return themes;
};

// Funzione per convertire temi selezionati in stringa API
export const formatThemeForAPI = (selectedThemes) => {
  if (!selectedThemes || selectedThemes.length === 0) return '';
  return selectedThemes.map(t => t.value).join(' / ');
};
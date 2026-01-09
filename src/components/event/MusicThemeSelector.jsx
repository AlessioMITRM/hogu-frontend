// ✅ MUSIC THEME SELECTOR AGGIORNATO
const MusicThemeSelector = ({ selectedThemes, onChange }) => {
  const { t } = useTranslation();
  
  // Mappatura temi predefiniti
  const predefinedThemes = [
    { 
      id: 'house', 
      label: t('eventServiceEdit.musicTheme.house'), 
      value: 'House',
      icon: Speaker,
      subThemes: ['Tech House', 'Deep House', 'Progressive House'],
      color: HOGU_COLORS.primary
    },
    { 
      id: 'techno', 
      label: t('eventServiceEdit.musicTheme.techno'), 
      value: 'Techno',
      icon: Disc,
      subThemes: ['Melodic Techno', 'Acid Techno', 'Industrial Techno'],
      color: HOGU_COLORS.dark
    },
    { 
      id: 'dnb', 
      label: t('eventServiceEdit.musicTheme.dnb'), 
      value: 'Drum & Bass',
      icon: Music,
      subThemes: ['Liquid', 'Neurofunk', 'Jump Up'],
      color: HOGU_COLORS.emeraldText
    },
    { 
      id: 'hiphop', 
      label: t('eventServiceEdit.musicTheme.hiphop'), 
      value: 'Hip Hop',
      icon: Mic2,
      subThemes: ['Trap', 'Old School', 'RnB'],
      color: HOGU_COLORS.purpleText
    },
    { 
      id: 'latin', 
      label: t('eventServiceEdit.musicTheme.latin'), 
      value: 'Latin',
      icon: Music,
      subThemes: ['Reggaeton', 'Salsa', 'Bachata'],
      color: HOGU_COLORS.success
    },
    { 
      id: 'commercial', 
      label: t('eventServiceEdit.musicTheme.commercial'), 
      value: 'Commercial',
      icon: Disc,
      subThemes: ['Top 40', 'EDM', 'Pop'],
      color: HOGU_COLORS.warning
    }
  ];

  const [customTheme, setCustomTheme] = useState('');
  const [activeThemes, setActiveThemes] = useState([]);

  // Inizializza dai dati API
  useEffect(() => {
    if (selectedThemes && selectedThemes.length > 0) {
      // Controlla se è un tema personalizzato o predefinito
      const themeString = Array.isArray(selectedThemes) 
        ? selectedThemes.join(' / ') 
        : selectedThemes;
      
      // Cerca corrispondenza con temi predefiniti
      const matchedThemes = predefinedThemes.filter(theme => {
        if (themeString.includes(theme.value)) return true;
        return theme.subThemes.some(sub => themeString.includes(sub));
      });

      if (matchedThemes.length > 0) {
        setActiveThemes(matchedThemes.map(t => t.id));
        setCustomTheme('');
      } else {
        // Tema personalizzato
        setActiveThemes([]);
        setCustomTheme(themeString);
      }
    } else {
      setActiveThemes([]);
      setCustomTheme('');
    }
  }, [selectedThemes]);

  // Aggiorna il valore padre quando cambia la selezione
  const updateParent = (themes, custom = '') => {
    if (custom.trim()) {
      onChange(custom);
    } else if (themes.length > 0) {
      const themeValues = themes.map(themeId => {
        const theme = predefinedThemes.find(t => t.id === themeId);
        return theme ? theme.value : '';
      }).filter(Boolean);
      onChange(themeValues.join(' / '));
    } else {
      onChange('');
    }
  };

  const handleThemeToggle = (themeId) => {
    const newActiveThemes = activeThemes.includes(themeId)
      ? activeThemes.filter(id => id !== themeId)
      : [...activeThemes, themeId];
    
    setActiveThemes(newActiveThemes);
    setCustomTheme('');
    updateParent(newActiveThemes, '');
  };

  const handleSelectAll = () => {
    const allThemeIds = predefinedThemes.map(t => t.id);
    setActiveThemes(allThemeIds);
    setCustomTheme('');
    updateParent(allThemeIds, '');
  };

  const handleClearAll = () => {
    setActiveThemes([]);
    setCustomTheme('');
    updateParent([], '');
  };

  const handleCustomThemeChange = (e) => {
    const value = e.target.value;
    setCustomTheme(value);
    if (value.trim()) {
      setActiveThemes([]);
    }
    updateParent([], value);
  };

  const isThemeSelected = (themeId) => {
    return activeThemes.includes(themeId);
  };

  return (
    <div className={`${HOGU_THEME.cardBase} p-8`}>
      <h3 className="text-xl font-bold text-gray-900 mb-2 flex items-center gap-2">
        <Disc size={24} className={`text-[${HOGU_COLORS.primary}]`} />
        {t('eventServiceEdit.musicTheme.title')}
      </h3>
      <p className="text-sm text-gray-500 mb-6">
        {t('eventServiceEdit.musicTheme.subtitle')}
      </p>

      {/* Bottoni Select All / Clear All */}
      <div className="flex gap-3 mb-6">
        <button
          type="button"
          onClick={handleSelectAll}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${HOGU_THEME.tag} hover:opacity-90`}
        >
          {t('eventServiceEdit.musicTheme.selectAll')}
        </button>
        <button
          type="button"
          onClick={handleClearAll}
          className="px-4 py-2 rounded-xl text-sm font-medium transition-all bg-gray-100 text-gray-600 hover:bg-gray-200"
        >
          {t('eventServiceEdit.musicTheme.clearAll')}
        </button>
      </div>

      {/* Griglia temi predefiniti */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        {predefinedThemes.map((theme) => {
          const ThemeIcon = theme.icon;
          const selected = isThemeSelected(theme.id);
          return (
            <button
              key={theme.id}
              type="button"
              onClick={() => handleThemeToggle(theme.id)}
              className={`
                flex flex-col items-center justify-center p-5 rounded-2xl border-2 transition-all duration-300 gap-3 h-32
                group relative
                ${selected
                  ? `border-[${theme.color}] bg-[${theme.color}]/5 text-[${theme.color}] scale-[1.02] ring-2 ring-[${theme.color}]/30`
                  : 'border-gray-100 bg-gray-50 text-gray-500 hover:bg-white hover:border-gray-200 hover:shadow-sm hover:scale-[1.01]'
                }
              `}
              title={theme.label}
              style={selected ? {
                borderColor: theme.color,
                ringColor: theme.color
              } : {}}
            >
              <div className={`p-2 rounded-xl transition-all ${selected ? 'bg-white/20' : 'bg-gray-100 group-hover:bg-white'}`}>
                <ThemeIcon size={24} className={selected ? 'text-current' : 'text-gray-400 group-hover:text-gray-600'} />
              </div>
              <span className="text-xs font-bold text-center leading-tight px-1">{theme.label}</span>
              {selected && (
                <div 
                  className="absolute -top-2 -right-2 p-1 rounded-full shadow-lg"
                  style={{ backgroundColor: theme.color }}
                >
                  <Check size={14} className="text-white" />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Input per tema personalizzato */}
      <div className="mb-4">
        <label className={`block text-sm font-medium mb-2 ${HOGU_THEME.text}`}>
          {t('eventServiceEdit.musicTheme.customTheme')}
        </label>
        <input
          type="text"
          value={customTheme}
          onChange={handleCustomThemeChange}
          placeholder={t('eventServiceEdit.musicTheme.customPlaceholder')}
          className={HOGU_THEME.inputBase}
        />
        <p className="text-xs text-gray-500 mt-1">
          {activeThemes.length > 0 
            ? t('eventServiceEdit.musicTheme.usingPredefined', 'Using predefined themes. Clear selection to enter custom theme.')
            : t('eventServiceEdit.musicTheme.enterCustom', 'Enter custom theme separated by "/"')}
        </p>
      </div>

      {/* Preview del valore API */}
      <div className={`p-4 rounded-xl bg-[${HOGU_COLORS.lightAccent}]`}>
        <div className="text-sm font-medium text-gray-600 mb-1">
          API Value Preview:
        </div>
        <div className={`font-mono text-sm ${HOGU_THEME.text}`}>
          {activeThemes.length > 0 
            ? predefinedThemes
                .filter(t => activeThemes.includes(t.id))
                .map(t => t.value)
                .join(' / ')
            : customTheme || '(empty)'}
        </div>
      </div>
    </div>
  );
};
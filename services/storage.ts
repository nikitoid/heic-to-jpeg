import { AppSettings, SaveMethod } from '../types';

const SETTINGS_KEY = 'heic_converter_settings_v2';

const DEFAULT_SETTINGS: AppSettings = {
  defaultQuality: 92,
  saveMethod: SaveMethod.BROWSER_DOWNLOAD,
  theme: {
    primaryColor: '#8b5cf6', // Violet 500
    backgroundColor: '#09090b', // Zinc 950
    surfaceColor: '#18181b', // Zinc 900
  }
};

export const getSettings = (): AppSettings => {
  try {
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (!stored) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(stored);
    
    // Merge with defaults to handle new fields in existing storage
    return { 
      ...DEFAULT_SETTINGS, 
      ...parsed,
      theme: { ...DEFAULT_SETTINGS.theme, ...(parsed.theme || {}) }
    };
  } catch (e) {
    console.error('Failed to load settings', e);
    return DEFAULT_SETTINGS;
  }
};

export const saveSettings = (settings: AppSettings): void => {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save settings', e);
  }
};
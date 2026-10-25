import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { DEFAULT_BROKER_URL } from '../config';
import {
  loadPreferences,
  saveBrokerUrl,
  saveTheme,
} from '../services/storageService';
import { themes, ThemeColors } from '../themes/colors';
import { ThemeMode } from '../types/mqtt';

interface SettingsContextValue {
  /** false enquanto as preferências do AsyncStorage ainda estão sendo lidas. */
  loaded: boolean;
  brokerUrl: string;
  themeMode: ThemeMode;
  colors: ThemeColors;
  updateBrokerUrl: (url: string) => void;
  updateThemeMode: (mode: ThemeMode) => void;
}

const SettingsContext = createContext<SettingsContextValue | undefined>(
  undefined,
);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [loaded, setLoaded] = useState(false);
  const [brokerUrl, setBrokerUrl] = useState(DEFAULT_BROKER_URL);
  const [themeMode, setThemeMode] = useState<ThemeMode>('light');

  useEffect(() => {
    let active = true;
    loadPreferences().then((prefs) => {
      if (!active) return;
      if (prefs.brokerUrl) setBrokerUrl(prefs.brokerUrl);
      if (prefs.theme) setThemeMode(prefs.theme);
      setLoaded(true);
    });
    return () => {
      active = false;
    };
  }, []);

  const updateBrokerUrl = useCallback((url: string) => {
    setBrokerUrl(url);
    void saveBrokerUrl(url);
  }, []);

  const updateThemeMode = useCallback((mode: ThemeMode) => {
    setThemeMode(mode);
    void saveTheme(mode);
  }, []);

  const value = useMemo<SettingsContextValue>(
    () => ({
      loaded,
      brokerUrl,
      themeMode,
      colors: themes[themeMode],
      updateBrokerUrl,
      updateThemeMode,
    }),
    [loaded, brokerUrl, themeMode, updateBrokerUrl, updateThemeMode],
  );

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings deve ser usado dentro de SettingsProvider');
  return ctx;
}

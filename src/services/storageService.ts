import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeMode } from '../types/mqtt';

const KEYS = {
  brokerUrl: '@iotcontrol:brokerUrl',
  theme: '@iotcontrol:theme',
} as const;

export interface StoredPreferences {
  brokerUrl: string | null;
  theme: ThemeMode | null;
}

export async function loadPreferences(): Promise<StoredPreferences> {
  try {
    const [brokerUrl, theme] = await Promise.all([
      AsyncStorage.getItem(KEYS.brokerUrl),
      AsyncStorage.getItem(KEYS.theme),
    ]);
    return {
      brokerUrl,
      theme: theme === 'light' || theme === 'dark' ? theme : null,
    };
  } catch (error) {
    console.warn('Falha ao ler preferências', error);
    return { brokerUrl: null, theme: null };
  }
}

export async function saveBrokerUrl(url: string): Promise<void> {
  try {
    await AsyncStorage.setItem(KEYS.brokerUrl, url);
  } catch (error) {
    console.warn('Falha ao salvar URL do broker', error);
  }
}

export async function saveTheme(theme: ThemeMode): Promise<void> {
  try {
    await AsyncStorage.setItem(KEYS.theme, theme);
  } catch (error) {
    console.warn('Falha ao salvar tema', error);
  }
}

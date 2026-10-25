import { ThemeMode } from '../types/mqtt';

export interface ThemeColors {
  background: string;
  card: string;
  text: string;
  textSecondary: string;
  border: string;
  primary: string;
  onPrimary: string;
  success: string;
  danger: string;
  warning: string;
  inputBackground: string;
}

export const lightColors: ThemeColors = {
  background: '#F3F5F9',
  card: '#FFFFFF',
  text: '#1B1F2A',
  textSecondary: '#5F6877',
  border: '#E1E5EC',
  primary: '#2F6FED',
  onPrimary: '#FFFFFF',
  success: '#1E9E5A',
  danger: '#D93A3A',
  warning: '#D98A0B',
  inputBackground: '#F8F9FC',
};

export const darkColors: ThemeColors = {
  background: '#0E1117',
  card: '#1A1F2B',
  text: '#F1F3F8',
  textSecondary: '#9AA3B5',
  border: '#2A3140',
  primary: '#5B92FF',
  onPrimary: '#0E1117',
  success: '#3DD28A',
  danger: '#FF6B6B',
  warning: '#F5B544',
  inputBackground: '#12161F',
};

export const themes: Record<ThemeMode, ThemeColors> = {
  light: lightColors,
  dark: darkColors,
};

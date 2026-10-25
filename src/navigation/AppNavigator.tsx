import { Ionicons } from '@expo/vector-icons';
import { BottomTabNavigationOptions, createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { DarkTheme, DefaultTheme, NavigationContainer, Theme } from '@react-navigation/native';
import React, { useMemo } from 'react';
import { useSettings } from '../context/SettingsContext';
import { DashboardScreen } from '../screens/DashboardScreen';
import { HistoryScreen } from '../screens/HistoryScreen';
import { SettingsScreen } from '../screens/SettingsScreen';

type TabParamList = {
  Dashboard: undefined;
  Histórico: undefined;
  Configurações: undefined;
};

const Tab = createBottomTabNavigator<TabParamList>();

type IconName = React.ComponentProps<typeof Ionicons>['name'];
const ICONS: Record<keyof TabParamList, IconName> = {
  Dashboard: 'speedometer-outline',
  Histórico: 'time-outline',
  Configurações: 'settings-outline',
};

export function AppNavigator() {
  const { colors, themeMode } = useSettings();

  const navTheme = useMemo<Theme>(() => {
    const base = themeMode === 'dark' ? DarkTheme : DefaultTheme;
    return {
      ...base,
      colors: {
        ...base.colors,
        primary: colors.primary,
        background: colors.background,
        card: colors.card,
        text: colors.text,
        border: colors.border,
      },
    };
  }, [colors, themeMode]);

  return (
    <NavigationContainer theme={navTheme}>
      <Tab.Navigator
        screenOptions={({ route }): BottomTabNavigationOptions => ({
          tabBarIcon: ({ color, size }) => (
            <Ionicons name={ICONS[route.name]} size={size} color={color} />
          ),
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textSecondary,
        })}
      >
        <Tab.Screen name="Dashboard" component={DashboardScreen} options={{ title: 'IoT Control' }} />
        <Tab.Screen name="Histórico" component={HistoryScreen} />
        <Tab.Screen name="Configurações" component={SettingsScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

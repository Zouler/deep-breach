import FontAwesome from '@expo/vector-icons/FontAwesome';
import { ThemeProvider, DarkTheme } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { NavigationBridge } from '@/components/NavigationBridge';
import { theme } from '@/constants/theme';
import { GameProvider } from '@/context/GameContext';

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  initialRouteName: 'index',
};

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) SplashScreen.hideAsync();
  }, [loaded]);

  if (!loaded) return null;

  return (
    <GameProvider>
      <ThemeProvider
        value={{
          ...DarkTheme,
          colors: {
            ...DarkTheme.colors,
            background: theme.bg,
            card: theme.surface,
            text: theme.text,
            border: theme.border,
            primary: theme.accent,
          },
        }}
      >
        <StatusBar style="light" />
        <NavigationBridge />
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: theme.bgElevated },
            headerTintColor: theme.text,
            headerTitleStyle: { fontWeight: '700' },
            contentStyle: { backgroundColor: theme.bg },
          }}
        >
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="base" options={{ title: 'Deep Breach — Base' }} />
          <Stack.Screen name="base-storage" options={{ title: 'Base Storage' }} />
          <Stack.Screen name="repair-dock" options={{ title: 'Repair Dock' }} />
          <Stack.Screen name="mission-select" options={{ title: 'Mission Select' }} />
          <Stack.Screen name="dive" options={{ title: 'Active Dive', headerBackVisible: false }} />
          <Stack.Screen name="room/[roomId]" options={{ title: 'Room Detail' }} />
          <Stack.Screen name="inventory" options={{ title: 'Inventory' }} />
          <Stack.Screen name="upgrades" options={{ title: 'Upgrades' }} />
          <Stack.Screen name="crew" options={{ title: 'Crew' }} />
          <Stack.Screen
            name="expedition-report"
            options={{ title: 'Expedition Report', headerBackVisible: false }}
          />
          <Stack.Screen
            name="mission-result"
            options={{ title: 'Mission Result', headerBackVisible: false }}
          />
          <Stack.Screen name="settings" options={{ title: 'Settings' }} />
        </Stack>
      </ThemeProvider>
    </GameProvider>
  );
}

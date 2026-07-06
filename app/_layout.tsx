import FontAwesome from '@expo/vector-icons/FontAwesome';
import { ThemeProvider, DarkTheme } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { InternalCrewEventHost } from '@/components/InternalCrewEventModal';
import { NavigationBridge } from '@/components/NavigationBridge';
import { theme } from '@/constants/theme';
import { GameProvider } from '@/context/GameContext';
import { NarrativeCutInProvider } from '@/context/NarrativeCutInContext';
import { SUBMARINE_IDENTITY } from '@/data/submarine';

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
      <NarrativeCutInProvider>
        <InternalCrewEventHost />
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
            headerTitleStyle: { fontWeight: '800', fontSize: 15 },
            contentStyle: { backgroundColor: theme.bg },
          }}
        >
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="assignment-briefing" options={{ title: 'Assignment Order' }} />
          <Stack.Screen name="intro-sequence" options={{ title: 'Intro', headerShown: false }} />
          <Stack.Screen name="assignment-memo" options={{ title: 'Assignment memorandum' }} />
          <Stack.Screen name="campaigns" options={{ title: 'Campaigns / Service Record' }} />
          <Stack.Screen
            name="base"
            options={{ title: `${SUBMARINE_IDENTITY.designation} · Test Facility` }}
          />
          <Stack.Screen name="base-storage" options={{ title: 'Base Storage' }} />
          <Stack.Screen name="repair-dock" options={{ title: 'Repair Dock' }} />
          <Stack.Screen name="mission-select" options={{ title: 'Trial schedule' }} />
          <Stack.Screen name="story-mission-briefing" options={{ title: 'Assignment briefing' }} />
          <Stack.Screen name="dive" options={{ title: 'Active Dive', headerBackVisible: false }} />
          <Stack.Screen name="nav-map" options={{ title: 'Strategic Map' }} />
          <Stack.Screen name="tactical-sonar" options={{ title: 'Tactical Sonar' }} />
          <Stack.Screen name="room/[roomId]" options={{ title: 'Room Detail' }} />
          <Stack.Screen name="inventory" options={{ title: 'Inventory' }} />
          <Stack.Screen name="upgrades" options={{ title: 'Upgrades' }} />
          <Stack.Screen name="crew" options={{ title: 'Crew' }} />
          <Stack.Screen name="command-briefings" options={{ title: 'Command Briefings' }} />
          <Stack.Screen
            name="expedition-report"
            options={{ title: 'Expedition Report', headerBackVisible: false }}
          />
          <Stack.Screen
            name="mission-result"
            options={{ title: 'Trial Report', headerBackVisible: false }}
          />
          <Stack.Screen name="settings" options={{ title: 'Settings' }} />
          <Stack.Screen name="captains-log" options={{ title: 'Captain’s Log' }} />
        </Stack>
      </ThemeProvider>
      </NarrativeCutInProvider>
    </GameProvider>
  );
}

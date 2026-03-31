import { configureGoogleSignIn } from './src/services/auth';
import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';
import { FocusProvider } from './src/context/FocusContext';
import { AuthProvider } from './src/context/AuthContext';
import {
  useFonts,
  Outfit_300Light,
  Outfit_400Regular,
  Outfit_500Medium,
  Outfit_600SemiBold,
  Outfit_700Bold
} from '@expo-google-fonts/outfit';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold
} from '@expo-google-fonts/inter';
import * as SplashScreen from 'expo-splash-screen';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

import { ThemeProvider, useTheme } from './src/theme';

const ThemedStatusBar = () => {
  const { isDark, colors } = useTheme();
  return <StatusBar style={isDark ? 'light' : 'dark'} backgroundColor={colors.background} />;
};

export default function App() {
  const [fontsLoaded] = useFonts({
    Outfit: Outfit_400Regular,
    'Outfit-Light': Outfit_300Light,
    'Outfit-Medium': Outfit_500Medium,
    'Outfit-SemiBold': Outfit_600SemiBold,
    'Outfit-Bold': Outfit_700Bold,
    Inter: Inter_400Regular,
    'Inter-Medium': Inter_500Medium,
    'Inter-SemiBold': Inter_600SemiBold,
  });

  useEffect(() => {
    configureGoogleSignIn();
  }, []);

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <ThemedStatusBar />
          <FocusProvider>
            <AppNavigator />
          </FocusProvider>
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

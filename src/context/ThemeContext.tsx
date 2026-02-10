import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { THEMES, COLORS as FALLBACK_COLORS } from '../design-system/tokens';

type ThemeMode = 'light' | 'dark' | 'system';
type ThemeType = typeof THEMES.dark;

interface ThemeContextType {
    theme: ThemeMode;
    isDark: boolean;
    colors: ThemeType;
    setTheme: (theme: ThemeMode) => void;
    toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = '@app_theme_preference';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const systemScheme = useColorScheme();
    const [theme, setThemeState] = useState<ThemeMode>('system');
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        // Load persistend theme
        const loadTheme = async () => {
            try {
                const storedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
                if (storedTheme) {
                    setThemeState(storedTheme as ThemeMode);
                }
            } catch (e) {
                console.error('Failed to load theme preference', e);
            } finally {
                setIsReady(true);
            }
        };
        loadTheme();
    }, []);

    const setTheme = async (newTheme: ThemeMode) => {
        setThemeState(newTheme);
        try {
            await AsyncStorage.setItem(THEME_STORAGE_KEY, newTheme);
        } catch (e) {
            console.error('Failed to save theme preference', e);
        }
    };

    const toggleTheme = () => {
        const activeMode = theme === 'system'
            ? (isSystemDark ? 'dark' : 'light')
            : theme;

        const nextTheme = activeMode === 'dark' ? 'light' : 'dark';
        setTheme(nextTheme);
    };

    const isSystemDark = systemScheme === 'dark';

    const activeThemeMode = theme === 'system'
        ? (isSystemDark ? 'dark' : 'light')
        : theme;

    const isDark = activeThemeMode === 'dark';
    const colors = isDark ? THEMES.dark : THEMES.light;

    if (!isReady) {
        // Optionally return null or a splash screen here, 
        // but for now we render children to avoid layout shifting if strictly necessary
        // or we return null to ensure correct theme is applied before render.
        // Returning null is safer to avoid flash of wrong theme.
        return null;
    }

    return (
        <ThemeContext.Provider value={{ theme, isDark, colors, setTheme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};

// Helper for non-hook usage (careful, this might not update dynamically)
export const getActiveTheme = () => {
    // This is hard to do without context. 
    // We will rely on useTheme for everything.
};

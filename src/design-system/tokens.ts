import { Platform } from 'react-native';

export const COLORS = {
    // Base
    background: '#050505', // Deep Void
    surface: '#121212', // Soft Charcoal
    surfaceHighlight: '#1E1E1E', // Slightly lighter for hover/press

    // Accents
    primary: '#D4F34A', // Volt Green
    primaryDim: 'rgba(212, 243, 74, 0.1)', // Volt Glow
    secondary: '#8E5AF7', // Electric Purple

    // Text
    textPrimary: '#FFFFFF',
    textSecondary: '#A0A0A0',
    textTertiary: '#666666',
    textInverse: '#000000',

    // Functional
    success: '#4CAF50',
    error: '#FF5252',
    warning: '#FFC107',

    // Borders
    border: 'rgba(255, 255, 255, 0.08)',
    borderHighlight: 'rgba(255, 255, 255, 0.15)',
};

export const SPACING = {
    xs: 4,
    s: 8,
    m: 12,
    l: 16,
    xl: 24,
    xxl: 32,
    xxxl: 48,
    section: 64,
};

export const RADIUS = {
    xs: 4,
    s: 8,
    m: 12, // Inner elements
    l: 20, // Cards / Containers
    xl: 32, // Modals
    full: 999, // Pills / Circles
};

export const FONTS = {
    family: Platform.select({ ios: 'System', android: 'Roboto', default: 'System' }),
    weights: {
        regular: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
    },
    sizes: {
        caption: 12,
        body: 15,
        h3: 18,
        h2: 24,
        h1: 32,
        hero: 40,
    },
    lineHeights: {
        caption: 16,
        body: 24,
        h3: 24,
        h2: 32,
        h1: 40,
        hero: 48,
    },
    letterSpacing: {
        tight: -0.5,
        normal: 0,
        wide: 0.5,
    },
};

export const SHADOWS = {
    none: {
        shadowColor: 'transparent',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0,
        shadowRadius: 0,
        elevation: 0,
    },
    subtle: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 2,
    },
    medium: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    glow: {
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 6,
    },
};

import { Platform } from 'react-native';

export const COLORS = {
    // Base - "Terracotta Focus" -> "Earthen Focus"
    background: '#1D1B1A', // Deep Void (Rich Dark Brown)
    surface: '#2A2725', // Warm Obsidian
    surfaceHighlight: '#363230', // Interaction Highlight

    // Accents - "Terra Nova"
    primary: '#E07A5F', // Terracotta Vibrant
    primaryDim: 'rgba(224, 122, 95, 0.15)', // Terra Glow
    secondary: '#81B29A', // Sage
    accent: '#F2CC8F', // Sunset Sand

    // Text
    textPrimary: '#F4F1DE', // Eggshell (Soft White)
    textSecondary: '#D0C9C0', // Warm Beige Grey
    textTertiary: '#8D8680', // Discret
    textInverse: '#1D1B1A', // Dark text on light/color backgrounds

    // Functional
    success: '#81B29A',
    error: '#E63946', // Ruby
    warning: '#F4A261', // Burnt Orange

    // Borders
    border: '#403D3B',
    borderHighlight: 'hsla(0, 0%, 100%, 0.30)',

    // Shadows
    shadow: '#000000',

    // Categories
    categories: {
        work: '#E07A5F',        // Matches primary
        projects: '#8B5CF6',    // Purple
        personal: '#10B981',    // Green
        study: '#F59E0B',       // Amber
        anything: '#FFFFFF',    // White
        blocked: '#E63946',     // Red
        brainDump: '#F48C06',   // Orange
        brainDumpDim: 'rgba(244, 140, 6, 0.15)',
        successDim: 'rgba(129, 178, 154, 0.15)',
    }
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
    xs: 2,
    s: 4,
    m: 8,  // Standard Elements
    l: 12, // Cards
    xl: 16, // Modals
    full: 999, // Pills
};

export const FONTS = {
    // We will use the font names directly. 
    // Requires loading 'Outfit' and 'Inter' in App.tsx
    family: {
        heading: 'Outfit',
        body: 'Inter',
        mono: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
    },
    weights: {
        light: '300',
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
        h3: 26,
        h2: 32,
        h1: 40,
        hero: 48,
    },
    letterSpacing: {
        tighter: -0.8,
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
        shadowRadius: 4, // Gently increased
        elevation: 2,
    },
    medium: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12, // Softer drop
        elevation: 4,
    },
    glow: {
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.4,
        shadowRadius: 16, // Wider glow
        elevation: 6,
    },
};

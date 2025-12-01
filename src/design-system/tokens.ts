import { Platform } from 'react-native';

export const COLORS = {
    // Base
    background: '#0A0A0A', // Void Black
    surface: '#161618', // Depth Grey
    surfaceHighlight: '#1C1C1E', // Slightly lighter

    // Accents
    primary: '#B4E3BB', // mint green
    primaryDim: 'rgba(180, 227, 187, 0.15)', // mint green glow
    secondary: '#32D74B', // Flow Green (Success/Completion)
    accent: '#BF5AF2', // Lens Violet (Subtle gradients)

    // Text
    textPrimary: '#FFFFFF',
    textSecondary: 'rgba(235, 235, 245, 0.6)', // 60% White
    textTertiary: 'rgba(235, 235, 245, 0.3)', // 30% White
    textInverse: '#000000',

    // Functional
    success: '#32D74B',
    error: '#FF453A',
    warning: '#FFD60A',

    // Borders
    border: 'rgba(255, 255, 255, 0.1)',
    borderHighlight: 'rgba(255, 255, 255, 0.2)',
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
        light: '300',
        regular: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
    },
    sizes: {
        caption: 12,
        body: 16, // Increased from 15
        h3: 20,   // Increased from 18
        h2: 28,   // Increased from 24
        h1: 34,   // Increased from 32
        hero: 48, // Increased from 40
    },
    lineHeights: {
        caption: 18, // Increased from 16
        body: 26,    // Increased from 24
        h3: 28,      // Increased from 24
        h2: 36,      // Increased from 32
        h1: 44,      // Increased from 40
        hero: 56,    // Increased from 48
    },
    letterSpacing: {
        tight: -0.5,
        normal: 0,
        wide: 0.8, // Increased from 0.5
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

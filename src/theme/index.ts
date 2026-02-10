import { COLORS as DS_COLORS, SPACING as DS_SPACING, FONTS as DS_FONTS, RADIUS as DS_RADIUS, SHADOWS as DS_SHADOWS } from '../design-system/tokens';
import { ThemeProvider, useTheme } from '../context/ThemeContext';

export { ThemeProvider, useTheme };

// Legacy exports for backward compatibility
// Components should migrate to useTheme() hook
export const COLORS = {
    ...DS_COLORS,
    // Aliases
    text: DS_COLORS.textPrimary,
    background: DS_COLORS.background,
    surface: DS_COLORS.surface,
    primary: DS_COLORS.primary,
    secondary: DS_COLORS.secondary,
    textPrimary: DS_COLORS.textPrimary,
    textSecondary: DS_COLORS.textSecondary,
    success: DS_COLORS.success,
    error: DS_COLORS.error,
    border: DS_COLORS.border,
    glow: DS_COLORS.primaryDim,
};

export const SPACING = DS_SPACING;
export const FONTS = DS_FONTS;
export const SIZES = {
    borderRadius: DS_RADIUS.l,
    icon: 24,
};
export const SHADOWS = DS_SHADOWS;


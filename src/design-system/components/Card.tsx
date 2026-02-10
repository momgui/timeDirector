import React from 'react';
import { View, StyleSheet, ViewStyle, Platform, StyleProp } from 'react-native';
import { RADIUS, SPACING, SHADOWS } from '../tokens';
import { BlurView } from 'expo-blur';
import { useTheme } from '../../theme';

interface CardProps {
    children: React.ReactNode;
    variant?: 'glass' | 'solid' | 'outlined';
    padding?: keyof typeof SPACING;
    style?: StyleProp<ViewStyle>;
}

export const Card: React.FC<CardProps> = ({
    children,
    variant = 'solid',
    padding = 'l',
    style,
}) => {
    const { colors, isDark } = useTheme();

    const getBackgroundColor = () => {
        switch (variant) {
            case 'solid':
                return colors.surface;
            case 'outlined':
                return 'transparent';
            case 'glass':
                // Adjust glass opacity based on mode if needed, usually dark glass looks best
                return Platform.OS === 'ios' ? 'transparent' : (isDark ? 'rgba(30, 30, 30, 0.9)' : 'rgba(255, 255, 255, 0.9)');
            default:
                return colors.surface;
        }
    };

    const getBorder = () => {
        if (variant === 'outlined') {
            return {
                borderWidth: 1,
                borderColor: colors.border,
            };
        }
        // Subtle border for solid/glass cards for definition
        return {
            borderWidth: 1,
            borderColor: colors.border,
        };
    };

    const baseStyle: ViewStyle = {
        borderRadius: RADIUS.l,
        padding: SPACING[padding],
        backgroundColor: getBackgroundColor(),
        ...getBorder(),
        ...SHADOWS.subtle,
        shadowColor: colors.shadow, // Dynamic shadow color
        overflow: 'hidden',
    };

    if (variant === 'glass' && Platform.OS === 'ios') {
        return (
            <View style={[baseStyle, { backgroundColor: 'transparent', borderWidth: 0 }, style]}>
                <BlurView intensity={30} tint={isDark ? "dark" : "light"} style={StyleSheet.absoluteFill} />
                <View style={[StyleSheet.absoluteFill, { backgroundColor: isDark ? 'rgba(20, 20, 20, 0.6)' : 'rgba(255, 255, 255, 0.6)' }]} />
                <View style={{ padding: SPACING[padding], ...getBorder(), borderRadius: RADIUS.l }}>
                    {children}
                </View>
            </View>
        );
    }

    return <View style={[baseStyle, style]}>{children}</View>;
};

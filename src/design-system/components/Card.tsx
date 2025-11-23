import React from 'react';
import { View, StyleSheet, ViewStyle, Platform, StyleProp } from 'react-native';
import { COLORS, RADIUS, SPACING, SHADOWS } from '../tokens';
import { BlurView } from 'expo-blur';

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
    const getBackgroundColor = () => {
        switch (variant) {
            case 'solid':
                return COLORS.surface;
            case 'outlined':
                return 'transparent';
            case 'glass':
                return Platform.OS === 'ios' ? 'transparent' : 'rgba(30, 30, 30, 0.9)';
            default:
                return COLORS.surface;
        }
    };

    const getBorder = () => {
        if (variant === 'outlined') {
            return {
                borderWidth: 1,
                borderColor: COLORS.border,
            };
        }
        // Subtle border for solid/glass cards for definition
        return {
            borderWidth: 1,
            borderColor: COLORS.border,
        };
    };

    const baseStyle: ViewStyle = {
        borderRadius: RADIUS.l,
        padding: SPACING[padding],
        backgroundColor: getBackgroundColor(),
        ...getBorder(),
        ...SHADOWS.subtle,
        overflow: 'hidden',
    };

    if (variant === 'glass' && Platform.OS === 'ios') {
        return (
            <View style={[baseStyle, { backgroundColor: 'transparent', borderWidth: 0 }, style]}>
                <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
                <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(20, 20, 20, 0.6)' }]} />
                <View style={{ padding: SPACING[padding], ...getBorder(), borderRadius: RADIUS.l }}>
                    {children}
                </View>
            </View>
        );
    }

    return <View style={[baseStyle, style]}>{children}</View>;
};

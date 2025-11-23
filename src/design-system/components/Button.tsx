import React from 'react';
import { StyleSheet, ActivityIndicator, ViewStyle, Pressable, Animated } from 'react-native';
import { Typography } from './Typography';
import { COLORS, RADIUS, SPACING } from '../tokens';

interface ButtonProps {
    title: string;
    onPress: () => void;
    variant?: 'primary' | 'secondary' | 'ghost' | 'outline';
    size?: 's' | 'm' | 'l';
    loading?: boolean;
    disabled?: boolean;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
    style?: ViewStyle;
    fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
    title,
    onPress,
    variant = 'primary',
    size = 'm',
    loading = false,
    disabled = false,
    leftIcon,
    rightIcon,
    style,
    fullWidth = false,
}) => {
    const scaleValue = React.useRef(new Animated.Value(1)).current;

    const handlePressIn = () => {
        Animated.spring(scaleValue, {
            toValue: 0.96,
            useNativeDriver: true,
            speed: 20,
            bounciness: 4,
        }).start();
    };

    const handlePressOut = () => {
        Animated.spring(scaleValue, {
            toValue: 1,
            useNativeDriver: true,
            speed: 20,
            bounciness: 4,
        }).start();
    };

    const getBackgroundColor = () => {
        if (disabled) return COLORS.surfaceHighlight;
        switch (variant) {
            case 'primary':
                return COLORS.primary;
            case 'secondary':
                return COLORS.surfaceHighlight;
            case 'outline':
                return 'transparent';
            case 'ghost':
                return 'transparent';
            default:
                return COLORS.primary;
        }
    };

    const getTextColor = () => {
        if (disabled) return COLORS.textSecondary;
        switch (variant) {
            case 'primary':
                return COLORS.textInverse;
            case 'secondary':
                return COLORS.textPrimary;
            case 'outline':
                return COLORS.textPrimary;
            case 'ghost':
                return COLORS.textSecondary;
            default:
                return COLORS.textInverse;
        }
    };

    const getBorder = () => {
        if (variant === 'outline') {
            return {
                borderWidth: 1,
                borderColor: disabled ? COLORS.border : COLORS.borderHighlight
            }
        }
        return {};
    }

    const getHeight = () => {
        switch (size) {
            case 's': return 32;
            case 'm': return 48;
            case 'l': return 56;
            default: return 48;
        }
    };

    const containerStyle = {
        backgroundColor: getBackgroundColor(),
        height: getHeight(),
        borderRadius: RADIUS.full,
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        justifyContent: 'center' as const,
        paddingHorizontal: SPACING.xl,
        opacity: disabled ? 0.6 : 1,
        width: fullWidth ? '100%' : undefined,
        ...getBorder(),
        ...style,
    };

    return (
        <Pressable
            onPress={onPress}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            disabled={disabled || loading}
        >
            <Animated.View style={[containerStyle as any, { transform: [{ scale: scaleValue }] }]}>
                {loading ? (
                    <ActivityIndicator color={getTextColor()} />
                ) : (
                    <>
                        {leftIcon}
                        <Typography
                            variant="body"
                            weight="semibold"
                            color={getTextColor()}
                            style={{ marginHorizontal: leftIcon || rightIcon ? SPACING.s : 0 }}
                        >
                            {title}
                        </Typography>
                        {rightIcon}
                    </>
                )}
            </Animated.View>
        </Pressable>
    );
};

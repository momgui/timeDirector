import React, { useState } from 'react';
import { TextInput, View, StyleSheet, TextInputProps, Animated } from 'react-native';
import { Typography } from './Typography';
import { COLORS, RADIUS, SPACING, FONTS } from '../tokens';

interface InputProps extends TextInputProps {
    label?: string;
    error?: string;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({
    label,
    error,
    leftIcon,
    rightIcon,
    style,
    onFocus,
    onBlur,
    ...props
}) => {
    const [isFocused, setIsFocused] = useState(false);
    const focusAnim = React.useRef(new Animated.Value(0)).current;

    const handleFocus = (e: any) => {
        setIsFocused(true);
        Animated.timing(focusAnim, {
            toValue: 1,
            duration: 200,
            useNativeDriver: false,
        }).start();
        onFocus?.(e);
    };

    const handleBlur = (e: any) => {
        setIsFocused(false);
        Animated.timing(focusAnim, {
            toValue: 0,
            duration: 200,
            useNativeDriver: false,
        }).start();
        onBlur?.(e);
    };

    const borderColor = focusAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [COLORS.border, COLORS.primary],
    });

    return (
        <View style={styles.container}>
            {label && (
                <Typography variant="caption" color={COLORS.textSecondary} style={styles.label}>
                    {label}
                </Typography>
            )}
            <Animated.View
                style={[
                    styles.inputContainer,
                    { borderColor: error ? COLORS.error : borderColor },
                    style,
                ]}
            >
                {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}
                <TextInput
                    style={styles.input}
                    placeholderTextColor={COLORS.textSecondary}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    selectionColor={COLORS.primary}
                    {...props}
                />
                {rightIcon && <View style={styles.rightIcon}>{rightIcon}</View>}
            </Animated.View>
            {error && (
                <Typography variant="caption" color={COLORS.error} style={styles.error}>
                    {error}
                </Typography>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: SPACING.m,
    },
    label: {
        marginBottom: SPACING.xs,
        marginLeft: SPACING.xs,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.surfaceHighlight,
        borderRadius: RADIUS.m,
        borderWidth: 1,
        height: 56,
        paddingHorizontal: SPACING.m,
    },
    input: {
        flex: 1,
        color: COLORS.textPrimary,
        fontFamily: FONTS.family,
        fontSize: FONTS.sizes.body,
        height: '100%',
    },
    leftIcon: {
        marginRight: SPACING.s,
    },
    rightIcon: {
        marginLeft: SPACING.s,
    },
    error: {
        marginTop: SPACING.xs,
        marginLeft: SPACING.xs,
    },
});

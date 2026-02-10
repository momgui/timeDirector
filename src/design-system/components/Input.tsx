import React, { useState } from 'react';
import { TextInput, View, StyleSheet, TextInputProps, Animated } from 'react-native';
import { Typography } from './Typography';
import { RADIUS, SPACING, FONTS } from '../tokens';
import { useTheme } from '../../theme';

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
    const { colors } = useTheme();
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
        outputRange: [colors.border, colors.primary],
    });

    return (
        <View style={styles.container}>
            {label && (
                <Typography variant="caption" color={colors.textSecondary} style={styles.label}>
                    {label}
                </Typography>
            )}
            <Animated.View
                style={[
                    styles.inputContainer,
                    {
                        backgroundColor: colors.surfaceHighlight,
                        borderColor: error ? colors.error : borderColor
                    },
                    style,
                ]}
            >
                {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}
                <TextInput
                    style={[styles.input, { color: colors.textPrimary }]}
                    placeholderTextColor={colors.textSecondary}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    selectionColor={colors.primary}
                    {...props}
                />
                {rightIcon && <View style={styles.rightIcon}>{rightIcon}</View>}
            </Animated.View>
            {error && (
                <Typography variant="caption" color={colors.error} style={styles.error}>
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
        // backgroundColor handled inline
        borderRadius: RADIUS.m,
        borderWidth: 1,
        height: 56,
        paddingHorizontal: SPACING.m,
    },
    input: {
        flex: 1,
        // color handled inline
        fontFamily: FONTS.family.body,
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

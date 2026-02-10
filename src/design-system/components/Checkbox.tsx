import React, { useEffect, useRef } from 'react';
import { TouchableOpacity, View, StyleSheet, Animated, ViewStyle, Easing } from 'react-native';
import { RADIUS, SHADOWS } from '../tokens';
import { useTheme } from '../../theme';

interface CheckboxProps {
    checked: boolean;
    onPress: () => void;
    size?: number;
    color?: string;
    style?: ViewStyle;
}

export const Checkbox: React.FC<CheckboxProps> = ({
    checked,
    onPress,
    size = 24,
    color,
    style,
}) => {
    const { colors } = useTheme();
    const activeColor = color || colors.primary;

    const scaleAnim = useRef(new Animated.Value(checked ? 1 : 0)).current;
    const rippleAnim = useRef(new Animated.Value(0)).current;
    const containerScale = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        if (checked) {
            // Sequence: Bounce container + Fill inner + Ripple
            Animated.parallel([
                Animated.spring(scaleAnim, {
                    toValue: 1,
                    useNativeDriver: true,
                    speed: 20,
                    bounciness: 8,
                }),
                Animated.sequence([
                    Animated.timing(containerScale, {
                        toValue: 0.8,
                        duration: 100,
                        useNativeDriver: true,
                        easing: Easing.ease,
                    }),
                    Animated.spring(containerScale, {
                        toValue: 1,
                        friction: 4,
                        useNativeDriver: true,
                    })
                ]),
                Animated.sequence([
                    Animated.timing(rippleAnim, {
                        toValue: 0,
                        duration: 0,
                        useNativeDriver: true,
                    }),
                    Animated.timing(rippleAnim, {
                        toValue: 1,
                        duration: 400,
                        useNativeDriver: true,
                        easing: Easing.out(Easing.ease),
                    })
                ])
            ]).start();
        } else {
            // Uncheck: Just shrink inner
            Animated.timing(scaleAnim, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
            }).start();
        }
    }, [checked]);

    const innerSize = size * 0.5;
    const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

    // Ripple interpolation
    const rippleScale = rippleAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0.5, 2.5],
    });
    const rippleOpacity = rippleAnim.interpolate({
        inputRange: [0, 0.1, 1],
        outputRange: [0, 0.6, 0],
    });

    return (
        <View style={[styles.wrapper, style]}>
            {/* Ripple Effect */}
            <Animated.View
                style={[
                    styles.ripple,
                    {
                        width: size,
                        height: size,
                        borderRadius: size / 2,
                        backgroundColor: activeColor,
                        opacity: rippleOpacity,
                        transform: [{ scale: rippleScale }],
                    }
                ]}
            />

            <AnimatedTouchable
                onPress={onPress}
                activeOpacity={1}
                style={[
                    styles.container,
                    {
                        width: size,
                        height: size,
                        borderRadius: size / 2,
                        borderColor: checked ? activeColor : colors.textSecondary,
                        backgroundColor: checked ? colors.primaryDim : 'transparent',
                        transform: [{ scale: containerScale }]
                    },
                ]}
            >
                <Animated.View
                    style={[
                        styles.inner,
                        {
                            width: innerSize,
                            height: innerSize,
                            borderRadius: innerSize / 2,
                            backgroundColor: activeColor,
                            transform: [{ scale: scaleAnim }],
                        },
                    ]}
                />
            </AnimatedTouchable>
        </View>
    );
};

const styles = StyleSheet.create({
    wrapper: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    container: {
        borderWidth: 2,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 2,
    },
    inner: {
        ...SHADOWS.glow,
    },
    ripple: {
        position: 'absolute',
        zIndex: 1,
    }
});

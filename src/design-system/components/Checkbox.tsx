import React, { useEffect, useRef } from 'react';
import { TouchableOpacity, View, StyleSheet, Animated, ViewStyle } from 'react-native';
import { COLORS, RADIUS, SHADOWS } from '../tokens';

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
    color = COLORS.primary,
    style,
}) => {
    const scaleAnim = useRef(new Animated.Value(checked ? 1 : 0)).current;

    useEffect(() => {
        Animated.spring(scaleAnim, {
            toValue: checked ? 1 : 0,
            useNativeDriver: true,
            speed: 20,
            bounciness: 8,
        }).start();
    }, [checked]);

    const innerSize = size * 0.5;

    return (
        <TouchableOpacity
            onPress={onPress}
            activeOpacity={0.8}
            style={[
                styles.container,
                {
                    width: size,
                    height: size,
                    borderRadius: size / 2,
                    borderColor: checked ? color : COLORS.textSecondary,
                    backgroundColor: checked ? 'rgba(212, 243, 74, 0.1)' : 'transparent',
                },
                style,
            ]}
        >
            <Animated.View
                style={[
                    styles.inner,
                    {
                        width: innerSize,
                        height: innerSize,
                        borderRadius: innerSize / 2,
                        backgroundColor: color,
                        transform: [{ scale: scaleAnim }],
                    },
                ]}
            />
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        borderWidth: 2,
        justifyContent: 'center',
        alignItems: 'center',
    },
    inner: {
        ...SHADOWS.glow,
    },
});

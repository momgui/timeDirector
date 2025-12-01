import React, { useState, useRef } from 'react';
import { View, StyleSheet, PanResponder, Animated, LayoutChangeEvent } from 'react-native';
import { COLORS, SPACING, RADIUS } from '../design-system/tokens';
import { Typography } from '../design-system/components/Typography';

interface SliderProps {
    value: number;
    onValueChange: (value: number) => void;
    min?: number;
    max?: number;
    step?: number;
}

export const Slider: React.FC<SliderProps> = ({
    value,
    onValueChange,
    min = 1,
    max = 5,
    step = 1
}) => {
    const [width, setWidth] = useState(0);
    const widthRef = useRef(0);
    const initialTouchX = useRef(0);

    // We need refs for props/state accessed inside PanResponder to avoid stale closures
    // since PanResponder is created once.
    const propsRef = useRef({ min, max, step, onValueChange });
    propsRef.current = { min, max, step, onValueChange };

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: () => true,
            onPanResponderGrant: (evt, gestureState) => {
                const { min, max, step, onValueChange } = propsRef.current;
                const currentWidth = widthRef.current;

                if (currentWidth === 0) return;

                // Store the initial touch position relative to the view
                initialTouchX.current = evt.nativeEvent.locationX;

                // Calculate value from position
                const percent = Math.max(0, Math.min(1, initialTouchX.current / currentWidth));
                const rawValue = min + percent * (max - min);
                const steppedValue = Math.round(rawValue / step) * step;
                const newValue = Math.max(min, Math.min(max, steppedValue));

                onValueChange(newValue);
            },
            onPanResponderMove: (evt, gestureState) => {
                const { min, max, step, onValueChange } = propsRef.current;
                const currentWidth = widthRef.current;

                if (currentWidth === 0) return;

                // Calculate current position based on initial touch + drag distance
                const currentPos = initialTouchX.current + gestureState.dx;

                // Calculate value from position
                const percent = Math.max(0, Math.min(1, currentPos / currentWidth));
                const rawValue = min + percent * (max - min);
                const steppedValue = Math.round(rawValue / step) * step;
                const newValue = Math.max(min, Math.min(max, steppedValue));

                onValueChange(newValue);
            },
            onPanResponderRelease: () => {
                // Optional: Snap logic if needed
            }
        })
    ).current;

    return (
        <View
            style={styles.container}
            onLayout={(e) => {
                const w = e.nativeEvent.layout.width - 32; // Subtract thumb width roughly
                setWidth(w);
                widthRef.current = w;
            }}
        >
            <View style={styles.track} />
            <View
                style={[
                    styles.fill,
                    { width: `${((value - min) / (max - min)) * 100}%` }
                ]}
            />

            {/* Interactive Area - Overlay with PanResponder */}
            {/* Important: backgroundColor transparent is needed for Android touch handling on empty views */}
            <View
                style={[StyleSheet.absoluteFill, { backgroundColor: 'transparent' }]}
                {...panResponder.panHandlers}
            />

            {/* Thumb - purely visual now, position derived from value */}
            <View
                style={[
                    styles.thumb,
                    {
                        left: `${((value - min) / (max - min)) * 100}%`,
                        transform: [{ translateX: -12 }] // Center thumb
                    }
                ]}
                pointerEvents="none" // Let touches pass through to the overlay
            >
                <Typography variant="caption" weight="bold" color={COLORS.background}>
                    {value}
                </Typography>
            </View>

            <View style={styles.labels}>
                <Typography variant="caption" color={COLORS.textTertiary}>{min}</Typography>
                <Typography variant="caption" color={COLORS.textTertiary}>{max}</Typography>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        height: 40,
        justifyContent: 'center',
        marginVertical: SPACING.s,
    },
    track: {
        height: 4,
        backgroundColor: COLORS.surfaceHighlight,
        borderRadius: 2,
        width: '100%',
        position: 'absolute',
    },
    fill: {
        height: 4,
        backgroundColor: COLORS.primary,
        borderRadius: 2,
        position: 'absolute',
    },
    thumb: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: COLORS.primary,
        position: 'absolute',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    labels: {
        position: 'absolute',
        bottom: -20,
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'space-between',
    }
});

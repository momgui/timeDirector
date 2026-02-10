import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Animated, Text, Platform } from 'react-native';
import { useFocus } from '../context/FocusContext';
import { SPACING, RADIUS } from '../design-system/tokens';
import { Typography } from '../design-system/components/Typography';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { Layout } from '../design-system/components/Layout';

type FocusSessionScreenProps = {
    navigation: NativeStackNavigationProp<RootStackParamList, 'FocusSession'>;
};

import { useTheme } from '../theme';

// ... 

export const FocusSessionScreen: React.FC<FocusSessionScreenProps> = ({ navigation }) => {
    const { colors } = useTheme();
    const {
        isSessionActive,
        isPaused,
        elapsedTime,
        activeGoal,
        activeStep,
        pauseSession,
        resumeSession,
        stopSession,
        minimizeSession
    } = useFocus();

    const breathAnim = useRef(new Animated.Value(1)).current;

    // Breathing animation when active
    useEffect(() => {
        if (!isPaused && isSessionActive) {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(breathAnim, {
                        toValue: 1.05,
                        duration: 3000,
                        useNativeDriver: true,
                    }),
                    Animated.timing(breathAnim, {
                        toValue: 1,
                        duration: 3000,
                        useNativeDriver: true,
                    }),
                ])
            ).start();
        } else {
            breathAnim.setValue(1); // Reset
            breathAnim.stopAnimation();
        }
    }, [isPaused, isSessionActive]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const handleBack = () => {
        minimizeSession();
        navigation.goBack();
    };

    const handleStop = async () => {
        await stopSession();
        navigation.goBack();
    };

    const MinimizeIcon = ({ color = colors.textPrimary, size = 24 }: { color?: string; size?: number }) => (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <Path d="M6 9l6 6 6-6" />
        </Svg>
    );

    const PauseIcon = ({ color = colors.background, size = 32 }: { color?: string; size?: number }) => (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <Rect x="6" y="4" width="4" height="16" />
            <Rect x="14" y="4" width="4" height="16" />
        </Svg>
    );

    const PlayIcon = ({ color = colors.background, size = 32 }: { color?: string; size?: number }) => (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <Path d="M5 3l14 9-14 9V3z" />
        </Svg>
    );

    const StopIcon = ({ color = colors.textInverse, size = 24 }: { color?: string; size?: number }) => (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <Rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
        </Svg>
    );

    if (!isSessionActive) {
        // Should theoretically not happen if navigated correctly, or session ended
        // Can redirect back
        return (
            <Layout>
                <View style={styles.centerContainer}>
                    <Typography>Session Ended</Typography>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Typography color={colors.primary}>Go Back</Typography>
                    </TouchableOpacity>
                </View>
            </Layout>
        );
    }

    return (
        <Layout noPadding style={{ backgroundColor: colors.background }}>
            <View style={styles.header}>
                <TouchableOpacity onPress={handleBack} style={styles.iconButton}>
                    <MinimizeIcon />
                </TouchableOpacity>
                <Typography variant="caption" style={{ textTransform: 'uppercase', letterSpacing: 2 }}>
                    Focus Mode
                </Typography>
                <View style={{ width: 40 }} />
            </View>

            <View style={styles.content}>
                <View style={styles.goalInfo}>
                    {activeGoal && (
                        <Typography variant="h2" align="center" style={{ marginBottom: SPACING.s }}>
                            {activeGoal.title}
                        </Typography>
                    )}
                    {activeStep && (
                        <Typography variant="body" color={colors.textSecondary} align="center">
                            Step: {activeStep.title}
                        </Typography>
                    )}
                </View>

                <Animated.View style={[styles.timerContainer, { transform: [{ scale: breathAnim }] }]}>
                    <View style={[styles.circleRing, { borderColor: colors.surfaceHighlight }]} />
                    <Typography
                        variant="h1"
                        color={colors.textPrimary}
                        style={{ fontSize: 80, lineHeight: 80, fontWeight: '200', width: '90%', textAlign: 'center' }}
                        numberOfLines={1}
                        adjustsFontSizeToFit
                        minimumFontScale={0.5}
                    >
                        {formatTime(elapsedTime)}
                    </Typography>
                </Animated.View>

                <View style={styles.controls}>
                    <TouchableOpacity
                        style={[
                            styles.controlButton,
                            styles.secondaryButton,
                            { backgroundColor: colors.surface, borderColor: colors.border }
                        ]}
                        onPress={handleStop}
                    >
                        <StopIcon color={colors.textPrimary} />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[
                            styles.controlButton,
                            styles.primaryButton,
                            { backgroundColor: colors.primary }
                        ]}
                        onPress={isPaused ? resumeSession : pauseSession}
                    >
                        {isPaused ? <PlayIcon /> : <PauseIcon />}
                    </TouchableOpacity>

                    {/* Placeholder for future feature (Sound/Settings) */}
                    <View style={{ width: 64 }} />
                </View>

                <Typography variant="caption" color={colors.textTertiary} align="center" style={{ marginTop: SPACING.xl }}>
                    Stay focused. You are doing great.
                </Typography>
            </View>
        </Layout>
    );
};

const styles = StyleSheet.create({
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: SPACING.l,
        paddingTop: Platform.OS === 'android' ? SPACING.l : SPACING.s,
        paddingBottom: SPACING.m,
    },
    iconButton: {
        padding: SPACING.s,
        width: 40,
        alignItems: 'center',
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: SPACING.l,
    },
    goalInfo: {
        marginBottom: SPACING.xxl,
        alignItems: 'center',
    },
    timerContainer: {
        width: 300,
        height: 300,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: SPACING.xxl,
    },
    circleRing: {
        position: 'absolute',
        width: '100%',
        height: '100%',
        borderRadius: 150,
        borderWidth: 1,
        // borderColor: COLORS.surfaceHighlight, // Handled inline
        opacity: 0.5,
    },
    controls: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '80%',
        maxWidth: 300,
    },
    controlButton: {
        width: 64,
        height: 64,
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.30,
        shadowRadius: 4.65,
        elevation: 8,
    },
    primaryButton: {
        // backgroundColor: COLORS.primary, // Handled inline
        width: 80,
        height: 80,
        borderRadius: 40,
    },
    secondaryButton: {
        // backgroundColor: COLORS.surface, // Handled inline
        borderWidth: 1,
        // borderColor: COLORS.border, // Handled inline
    }
});

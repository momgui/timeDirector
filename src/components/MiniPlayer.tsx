import React from 'react';
import { View, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { useFocus } from '../context/FocusContext';
import { SPACING, RADIUS } from '../design-system/tokens';
import { Typography } from '../design-system/components/Typography';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import Svg, { Path, Rect } from 'react-native-svg';
import { useTheme } from '../theme';

const { width } = Dimensions.get('window');

export const MiniPlayer: React.FC = () => {
    const { colors } = useTheme();
    const {
        isSessionActive,
        isMinimized,
        isPaused,
        currentSession,
        elapsedTime,
        activeGoal,
        pauseSession,
        resumeSession,
        maximizeSession
    } = useFocus();

    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

    if (!isSessionActive || !isMinimized) return null;

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const handlePress = () => {
        maximizeSession();
        navigation.navigate('FocusSession');
    };

    const PlayIcon = ({ color = colors.textPrimary, size = 16 }: { color?: string; size?: number }) => (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <Path d="M5 3l14 9-14 9V3z" />
        </Svg>
    );

    const PauseIcon = ({ color = colors.textPrimary, size = 16 }: { color?: string; size?: number }) => (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <Rect x="6" y="4" width="4" height="16" />
            <Rect x="14" y="4" width="4" height="16" />
        </Svg>
    );

    const MaximizeIcon = ({ color = colors.textSecondary, size = 20 }: { color?: string; size?: number }) => (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <Path d="M15 3h6v6" />
            <Path d="M9 21H3v-6" />
            <Path d="M21 3l-7 7" />
            <Path d="M3 21l7-7" />
        </Svg>
    );

    return (
        <View style={styles.container}>
            <TouchableOpacity
                activeOpacity={0.9}
                onPress={handlePress}
                style={[styles.innerContainer, { backgroundColor: colors.surface, borderColor: colors.surfaceHighlight }]}
            >
                {/* Progress bar background could go here if we had a target time */}
                <View style={styles.infoContainer}>
                    <Typography variant="caption" weight="bold" color={colors.primary}>
                        {formatTime(elapsedTime)}
                    </Typography>
                    <Typography variant="caption" numberOfLines={1} style={{ marginLeft: SPACING.m, flex: 1 }}>
                        {activeGoal?.title || "Focus Session"}
                    </Typography>
                </View>

                <View style={styles.controls}>
                    <TouchableOpacity
                        onPress={isPaused ? resumeSession : pauseSession}
                        style={[styles.playButton, { backgroundColor: colors.background }]}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                        {isPaused ? <PlayIcon size={14} /> : <PauseIcon size={14} />}
                    </TouchableOpacity>
                </View>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 90, // Position above where a tab bar might be, or effectively bottom
        left: SPACING.l,
        right: SPACING.l,
        zIndex: 100, // Ensure it's above other content
    },
    innerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        // backgroundColor: COLORS.surface, // Handled inline
        borderRadius: RADIUS.l,
        padding: SPACING.s,
        paddingHorizontal: SPACING.m,
        height: 56,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.20,
        shadowRadius: 5.62,
        elevation: 8,
        borderWidth: 1,
        // borderColor: COLORS.surfaceHighlight, // Handled inline
    },
    infoContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },
    controls: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    playButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        // backgroundColor: COLORS.background, // Handled inline
        justifyContent: 'center',
        alignItems: 'center',
    }
});

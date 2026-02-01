import React from 'react';
import { Modal, View, StyleSheet, TouchableOpacity } from 'react-native';
import Svg, { Path, Circle, Rect, Line } from 'react-native-svg';
import { Card } from '../design-system/components/Card';
import { Typography } from '../design-system/components/Typography';
import { Button } from '../design-system/components/Button';
import { COLORS, SPACING, RADIUS } from '../design-system/tokens';

interface CreationMenuModalProps {
    visible: boolean;
    onClose: () => void;
    onCreateGoal: () => void;
    onCreateTask: () => void;
    onBrainDump: () => void;
}

const TargetIcon = ({ color = COLORS.textPrimary, size = 24 }: { color?: string; size?: number }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <Circle cx="12" cy="12" r="10" />
        <Circle cx="12" cy="12" r="6" />
        <Circle cx="12" cy="12" r="2" />
    </Svg>
);

const CheckSquareIcon = ({ color = COLORS.textPrimary, size = 24 }: { color?: string; size?: number }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <Path d="M9 11l3 3L22 4" />
        <Path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
    </Svg>
);

const BrainIcon = ({ color = COLORS.textPrimary, size = 24 }: { color?: string; size?: number }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <Path d="M12 2a5 5 0 0 0-5 5v1a3 3 0 0 1-3 3 3 3 0 0 1 3 3v1a5 5 0 0 0 10 0v-1a3 3 0 0 1 3-3 3 3 0 0 1-3-3V7a5 5 0 0 0-5-5z" />
        <Path d="M9.5 7h5" />
        <Path d="M9.5 12h5" />
        <Path d="M9.5 17h5" />
    </Svg>
);

export const CreationMenuModal: React.FC<CreationMenuModalProps> = ({
    visible,
    onClose,
    onCreateGoal,
    onCreateTask,
    onBrainDump,
}) => {
    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <TouchableOpacity style={styles.backdrop} onPress={onClose} activeOpacity={1} />

                <Card variant="solid" padding="l" style={styles.container}>
                    <Typography variant="h3" weight="bold" color={COLORS.textPrimary} style={styles.header}>
                        Create New
                    </Typography>

                    <View style={styles.optionsContainer}>
                        <TouchableOpacity
                            style={styles.optionCard}
                            onPress={onCreateGoal}
                            activeOpacity={0.8}
                        >
                            <View style={[styles.iconContainer, { backgroundColor: COLORS.primaryDim }]}>
                                <TargetIcon color={COLORS.primary} />
                            </View>
                            <View>
                                <Typography variant="h3" weight="semibold" color={COLORS.textPrimary}>
                                    Goal
                                </Typography>
                                <Typography variant="caption" color={COLORS.textSecondary}>
                                    Set a new objective
                                </Typography>
                            </View>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.optionCard}
                            onPress={onCreateTask}
                            activeOpacity={0.8}
                        >
                            <View style={[styles.iconContainer, { backgroundColor: COLORS.categories.successDim }]}>
                                <CheckSquareIcon color={COLORS.success} />
                            </View>
                            <View>
                                <Typography variant="h3" weight="semibold" color={COLORS.textPrimary}>
                                    Task
                                </Typography>
                                <Typography variant="caption" color={COLORS.textSecondary}>
                                    Add a single task
                                </Typography>
                            </View>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.optionCard}
                            onPress={onBrainDump}
                            activeOpacity={0.8}
                        >
                            <View style={[styles.iconContainer, { backgroundColor: COLORS.categories.brainDumpDim }]}>
                                <BrainIcon color={COLORS.categories.brainDump} />
                            </View>
                            <View>
                                <Typography variant="h3" weight="semibold" color={COLORS.textPrimary}>
                                    Brain Dump
                                </Typography>
                                <Typography variant="caption" color={COLORS.textSecondary}>
                                    Add multiple tasks quickly
                                </Typography>
                            </View>
                        </TouchableOpacity>
                    </View>

                    <Button
                        title="Cancel"
                        variant="ghost"
                        onPress={onClose}
                        fullWidth
                    />
                </Card>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'flex-end', // Align to bottom
        padding: SPACING.l,
        paddingBottom: SPACING.xxl,
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
    },
    container: {
        width: '100%',
    },
    header: {
        marginBottom: SPACING.l,
        textAlign: 'center',
    },
    optionsContainer: {
        gap: SPACING.m,
        marginBottom: SPACING.l,
    },
    optionCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: SPACING.m,
        backgroundColor: COLORS.surfaceHighlight,
        borderRadius: RADIUS.l,
        borderWidth: 1,
        borderColor: COLORS.border,
        gap: SPACING.m,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: RADIUS.full,
        alignItems: 'center',
        justifyContent: 'center',
    },
});

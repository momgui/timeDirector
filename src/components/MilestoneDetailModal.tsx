import React, { useState } from 'react';
import { Modal, View, StyleSheet, TouchableOpacity, ScrollView, TextInput, Keyboard, ActivityIndicator } from 'react-native';
import Svg, { Path, Rect, Line } from 'react-native-svg';
import { Card } from '../design-system/components/Card';
import { Typography } from '../design-system/components/Typography';
import { Button } from '../design-system/components/Button';
import { Checkbox } from '../design-system/components/Checkbox';
import { ProgressBar } from '../design-system/components/ProgressBar';
import { SPACING, RADIUS } from '../design-system/tokens';
import { Step } from '../types';
import { SmartSplitModal } from './SmartSplitModal';
import { useTheme } from '../theme';
import { v4 as uuidv4 } from 'uuid';
import 'react-native-get-random-values';

interface MilestoneDetailModalProps {
    visible: boolean;
    milestone: Step | null;
    subtasks: Step[];
    onClose: () => void;
    onDelete: (stepId: string) => void;
    onReschedule: (stepId: string) => void;
    onToggleComplete: (step: Step) => void;
    onAddSubtask: () => void;
    onDeleteSubtask: (stepId: string) => void;
    onToggleSubtask: (step: Step) => void;
    onGenerateSubtasks: (subtasks: Step[]) => void;
    onOpenSubMilestone: (step: Step) => void;
    goalTitle?: string;
    goalContext?: string;
    previousMilestoneContext?: string;
}

const ClockIcon = ({ color, size = 16 }: { color?: string; size?: number }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color || '#9C9996'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <Path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
        <Path d="M12 6v6l4 2" />
    </Svg>
);

const CalendarIcon = ({ color, size = 20 }: { color?: string; size?: number }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color || '#FAFAFA'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <Rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <Line x1="16" y1="2" x2="16" y2="6" />
        <Line x1="8" y1="2" x2="8" y2="6" />
        <Line x1="3" y1="10" x2="21" y2="10" />
    </Svg>
);

const TrashIcon = ({ color, size = 16 }: { color?: string; size?: number }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color || '#9C9996'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <Path d="M3 6h18" />
        <Path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </Svg>
);

const SplitIcon = ({ color, size = 16 }: { color?: string; size?: number }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color || '#E07A5F'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <Path d="M16 3h5v5" />
        <Path d="M8 3H3v5" />
        <Path d="M12 22v-8" />
        <Path d="M9 10l3-3 3 3" />
    </Svg>
);

const ChevronRightIcon = ({ color, size = 16 }: { color?: string; size?: number }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color || '#6D6A67'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <Path d="M9 18l6-6-6-6" />
    </Svg>
);

export const MilestoneDetailModal: React.FC<MilestoneDetailModalProps> = ({
    visible,
    milestone,
    subtasks,
    onClose,
    onDelete,
    onReschedule,
    onToggleComplete,
    onAddSubtask,
    onDeleteSubtask,
    onToggleSubtask,
    onGenerateSubtasks,
    onOpenSubMilestone,
    goalTitle = '',
    goalContext = '',
    previousMilestoneContext = '',
}) => {
    const { colors } = useTheme();
    const [smartSplitVisible, setSmartSplitVisible] = useState(false);

    if (!milestone) return null;

    const completedSubtasks = subtasks.reduce((acc, s) => {
        if (s.isHabit && s.targetStreak) {
            const completions = s.totalCompletions !== undefined ? s.totalCompletions : (s.currentStreak || 0);
            return acc + Math.min(completions / s.targetStreak, 1);
        }
        return acc + (s.isCompleted ? 1 : 0);
    }, 0);
    const progress = subtasks.length > 0 ? completedSubtasks / subtasks.length : 0;

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
                    <View style={styles.header}>
                        <Typography variant="h2" weight="bold" color={colors.textPrimary}>
                            {milestone.title}
                        </Typography>
                        <View style={styles.metaRow}>
                            <Typography variant="caption" color={colors.textSecondary}>
                                {milestone.date ? new Date(milestone.date).toLocaleDateString() : 'No Date'}
                            </Typography>
                            {milestone.estimatedMinutes && (
                                <View style={[styles.timeBadge, { backgroundColor: colors.surfaceHighlight }]}>
                                    <ClockIcon color={colors.textSecondary} size={12} />
                                    <Typography variant="caption" color={colors.textSecondary} style={{ marginLeft: 4 }}>
                                        {milestone.estimatedMinutes}m
                                    </Typography>
                                </View>
                            )}
                        </View>
                        {subtasks.length > 0 && (
                            <View style={{ marginTop: SPACING.m }}>
                                <ProgressBar progress={progress} style={{ height: 6 }} />
                                <Typography variant="caption" color={colors.textSecondary} align="right" style={{ marginTop: 4 }}>
                                    {Math.round(progress * 100)}%
                                </Typography>
                            </View>
                        )}
                    </View>

                    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                        {milestone.description && (
                            <View style={styles.section}>
                                <Typography variant="caption" weight="bold" color={colors.textSecondary} style={styles.sectionTitle}>
                                    DESCRIPTION
                                </Typography>
                                <Typography variant="body" color={colors.textPrimary}>
                                    {milestone.description}
                                </Typography>
                            </View>
                        )}

                        <View style={styles.section}>
                            <Typography variant="caption" weight="bold" color={colors.textSecondary} style={styles.sectionTitle}>
                                EFFORT
                            </Typography>
                            <Typography variant="body" color={colors.textPrimary}>
                                {milestone.effort || 1}/5
                            </Typography>
                        </View>

                        <View style={styles.section}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.s }}>
                                <Typography variant="caption" weight="bold" color={colors.textSecondary} style={styles.sectionTitle}>
                                    SUBTASKS
                                </Typography>
                                {subtasks.length === 0 && (
                                    <TouchableOpacity onPress={() => setSmartSplitVisible(true)} style={styles.aiButton}>
                                        <SplitIcon size={14} color={colors.primary} />
                                        <Typography variant="caption" color={colors.primary} weight="bold">
                                            Split into Tasks
                                        </Typography>
                                    </TouchableOpacity>
                                )}
                            </View>

                            <View style={styles.subtaskList}>
                                {subtasks.length === 0 ? (
                                    <Typography variant="body" color={colors.textTertiary} style={{ fontStyle: 'italic', marginBottom: SPACING.s }}>
                                        No subtasks yet.
                                    </Typography>
                                ) : (
                                    subtasks.map(subtask => (
                                        <TouchableOpacity
                                            key={subtask.id}
                                            style={[styles.subtaskItem, subtask.isMilestone && [styles.milestoneItem, { backgroundColor: colors.surfaceHighlight }]]}
                                            onPress={() => subtask.isMilestone ? onOpenSubMilestone(subtask) : onToggleSubtask(subtask)}
                                            activeOpacity={subtask.isMilestone ? 0.7 : 1}
                                        >
                                            <Checkbox
                                                checked={subtask.isCompleted}
                                                onPress={() => onToggleSubtask(subtask)}
                                                style={{ marginRight: SPACING.s }}
                                            />
                                            <Typography
                                                variant="body"
                                                color={subtask.isCompleted ? colors.textTertiary : colors.textPrimary}
                                                style={StyleSheet.flatten([
                                                    { flex: 1 },
                                                    subtask.isCompleted ? styles.textCompleted : undefined,
                                                    subtask.isMilestone ? { fontWeight: '600' } : undefined
                                                ])}
                                            >
                                                {subtask.title}
                                            </Typography>
                                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                                {subtask.estimatedMinutes && (
                                                    <View style={[styles.timeBadge, { backgroundColor: colors.surfaceHighlight }]}>
                                                        <ClockIcon color={colors.textSecondary} size={12} />
                                                        <Typography variant="caption" color={colors.textSecondary} style={{ marginLeft: 4 }}>
                                                            {subtask.estimatedMinutes}m
                                                        </Typography>
                                                    </View>
                                                )}
                                                {subtask.isMilestone && (
                                                    <ChevronRightIcon size={14} color={colors.textSecondary} />
                                                )}
                                                {!subtask.isMilestone && (
                                                    <TouchableOpacity onPress={() => onDeleteSubtask(subtask.id)} style={{ padding: 4 }}>
                                                        <TrashIcon color={colors.textTertiary} />
                                                    </TouchableOpacity>
                                                )}
                                            </View>
                                        </TouchableOpacity>
                                    ))
                                )}
                            </View>

                            <View style={styles.buttonRow}>
                                <Button
                                    title="+ Add Subtask"
                                    size="s"
                                    variant="ghost"
                                    onPress={onAddSubtask}
                                    style={{ flex: 1 }}
                                />
                                {subtasks.length > 0 && (
                                    <Button
                                        title="✨ Regenerate"
                                        size="s"
                                        variant="ghost"
                                        onPress={() => setSmartSplitVisible(true)}
                                        style={{ flex: 1 }}
                                    />
                                )}
                            </View>
                        </View>
                    </ScrollView>

                    <View style={styles.actions}>
                        <TouchableOpacity
                            onPress={() => onDelete(milestone.id)}
                            style={{
                                backgroundColor: colors.surfaceHighlight,
                                width: 48,
                                height: 48,
                                borderRadius: RADIUS.full,
                                alignItems: 'center',
                                justifyContent: 'center',
                                borderWidth: 1,
                                borderColor: colors.error,
                                marginRight: SPACING.s
                            }}
                        >
                            <TrashIcon color={colors.error} size={20} />
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => onReschedule(milestone.id)}
                            style={{
                                backgroundColor: colors.surfaceHighlight,
                                width: 48,
                                height: 48,
                                borderRadius: RADIUS.full,
                                alignItems: 'center',
                                justifyContent: 'center',
                                borderWidth: 1,
                                borderColor: colors.border,
                                marginRight: SPACING.s
                            }}
                        >
                            <CalendarIcon color={colors.textPrimary} />
                        </TouchableOpacity>

                        <Button
                            title={milestone.isCompleted ? "Mark Incomplete" : "Complete"}
                            variant="primary"
                            onPress={() => onToggleComplete(milestone)}
                            style={{ flex: 1 }}
                        />
                    </View>
                </Card>
            </View >

            <SmartSplitModal
                visible={smartSplitVisible}
                milestone={milestone}
                onClose={() => setSmartSplitVisible(false)}
                onSave={(newSteps) => {
                    onGenerateSubtasks(newSteps);
                    setSmartSplitVisible(false);
                }}
                goalTitle={goalTitle}
                goalContext={goalContext}
                previousMilestoneContext={previousMilestoneContext}
            />
        </Modal >
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'center',
        padding: SPACING.l,
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
    },
    container: {
        maxHeight: '80%',
    },
    header: {
        marginBottom: SPACING.l,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.m,
        marginTop: SPACING.xs,
    },
    timeBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 2,
        paddingHorizontal: 6,
        borderRadius: RADIUS.s,
    },
    content: {
        marginBottom: SPACING.l,
    },
    section: {
        marginBottom: SPACING.l,
    },
    sectionTitle: {
        marginBottom: SPACING.s,
        letterSpacing: 1,
    },
    actions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: SPACING.m,
    },
    subtaskList: {
        marginBottom: SPACING.m,
    },
    subtaskItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: SPACING.s,
        paddingVertical: 4,
    },
    milestoneItem: {
        borderRadius: RADIUS.s,
        paddingHorizontal: SPACING.s,
        marginHorizontal: -SPACING.s, // Negative margin to align with padding
    },
    textCompleted: {
        textDecorationLine: 'line-through',
        opacity: 0.6,
    },
    aiButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        padding: 4,
    },
    buttonRow: {
        flexDirection: 'row',
        gap: SPACING.s,
    }
});

import React from 'react';
import { Modal, View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Card } from '../design-system/components/Card';
import { Typography } from '../design-system/components/Typography';
import { Button } from '../design-system/components/Button';
import { CreateTaskModal } from './CreateTaskModal';
import { COLORS, SPACING, RADIUS } from '../design-system/tokens';
import { Goal, Step, SlotCategory } from '../types';

interface GoalDetailModalProps {
    visible: boolean;
    goal: Goal | null;
    steps: Step[];
    onClose: () => void;
    onDelete: (goalId: string) => void;
    onReschedule: (goalId: string) => void;
    onUpdateCategory: (goalId: string, category: SlotCategory) => void;
    onAddStep: (title: string, date: Date, description?: string, effort?: number, category?: SlotCategory) => void;
}

const CATEGORIES: SlotCategory[] = [' WORK ', 'PROJECTS', 'PERSONAL', 'STUDY'];

const ClockIcon = ({ color = COLORS.textSecondary, size = 16 }: { color?: string; size?: number }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <Path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
        <Path d="M12 6v6l4 2" />
    </Svg>
);

export const GoalDetailModal: React.FC<GoalDetailModalProps> = ({
    visible,
    goal,
    steps,
    onClose,
    onDelete,
    onReschedule,
    onUpdateCategory,
    onAddStep,
}) => {
    const [createTaskVisible, setCreateTaskVisible] = React.useState(false);

    if (!goal) return null;

    const goalSteps = steps.filter(s => s.goalId === goal.id);

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
                        <Typography variant="h2" weight="bold" color={COLORS.textPrimary}>
                            {goal.title}
                        </Typography>
                        <Typography variant="caption" color={COLORS.textSecondary}>
                            Deadline: {new Date(goal.deadline).toLocaleDateString()}
                        </Typography>
                    </View>

                    <View style={styles.categoryContainer}>
                        {CATEGORIES.map(cat => (
                            <TouchableOpacity
                                key={cat}
                                onPress={() => onUpdateCategory(goal.id, cat)}
                                style={[
                                    styles.categoryChip,
                                    goal.category === cat && styles.categoryChipSelected
                                ]}
                            >
                                <Typography
                                    variant="caption"
                                    color={goal.category === cat ? COLORS.background : COLORS.textSecondary}
                                    weight={goal.category === cat ? 'bold' : 'regular'}
                                >
                                    {cat.trim()}
                                </Typography>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <Typography variant="caption" weight="bold" color={COLORS.textSecondary} style={styles.sectionTitle}>
                        TASKS ({goalSteps.length})
                    </Typography>

                    <ScrollView style={styles.taskList} showsVerticalScrollIndicator={false}>
                        {goalSteps.length === 0 ? (
                            <Typography variant="body" color={COLORS.textTertiary} style={{ fontStyle: 'italic' }}>
                                No tasks yet.
                            </Typography>
                        ) : (
                            goalSteps.map((step, index) => (
                                <View key={step.id} style={styles.stepItem}>
                                    <View style={[styles.bullet, step.isCompleted && styles.bulletCompleted]} />
                                    <View style={{ flex: 1 }}>
                                        <View style={styles.stepHeader}>
                                            <Typography
                                                variant="body"
                                                color={step.isCompleted ? COLORS.textTertiary : COLORS.textPrimary}
                                                style={StyleSheet.flatten([step.isCompleted ? styles.textCompleted : undefined, { flex: 1 }])}
                                            >
                                                {step.title}
                                            </Typography>
                                            {step.estimatedMinutes && (
                                                <View style={styles.timeBadge}>
                                                    <ClockIcon color={COLORS.textSecondary} size={12} />
                                                    <Typography variant="caption" color={COLORS.textSecondary} style={{ marginLeft: 4 }}>
                                                        {step.estimatedMinutes}m
                                                    </Typography>
                                                </View>
                                            )}
                                        </View>
                                        <Typography variant="caption" color={COLORS.textTertiary}>
                                            {new Date(step.date).toLocaleDateString()}
                                        </Typography>
                                    </View>
                                </View>
                            ))
                        )}
                    </ScrollView>

                    <Button
                        title="+ Add Task"
                        variant="ghost"
                        onPress={() => setCreateTaskVisible(true)}
                        style={{ marginBottom: SPACING.m }}
                    />

                    <View style={styles.actions}>
                        <Button
                            title="Delete Goal"
                            variant="secondary"
                            onPress={() => onDelete(goal.id)}
                            style={{ backgroundColor: COLORS.error, flex: 1, marginRight: SPACING.s }}
                        />
                        <Button
                            title="Reschedule"
                            variant="primary"
                            onPress={() => onReschedule(goal.id)}
                            style={{ flex: 1, marginLeft: SPACING.s }}
                        />
                    </View>
                </Card>
            </View>

            <CreateTaskModal
                visible={createTaskVisible}
                onClose={() => setCreateTaskVisible(false)}
                onSave={(title: string, date: Date, description?: string, effort?: number, category?: SlotCategory) => {
                    onAddStep(title, date, description, effort, category);
                    setCreateTaskVisible(false);
                }}
                initialDate={new Date(goal.deadline)}
                initialCategory={goal.category}
                title={`Add Task to ${goal.title}`}
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
        marginBottom: SPACING.m,
    },
    categoryContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: SPACING.s,
        marginBottom: SPACING.l,
    },
    categoryChip: {
        paddingVertical: 4,
        paddingHorizontal: 12,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    categoryChipSelected: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
    },
    sectionTitle: {
        marginBottom: SPACING.m,
        letterSpacing: 1,
    },
    taskList: {
        marginBottom: SPACING.l,
    },
    stepItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: SPACING.s,
    },
    bullet: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: COLORS.primary,
        marginRight: SPACING.m,
    },
    bulletCompleted: {
        backgroundColor: COLORS.textTertiary,
    },
    textCompleted: {
        textDecorationLine: 'line-through',
    },
    actions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: SPACING.m,
    },
    stepHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    timeBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 2,
        paddingHorizontal: 6,
        backgroundColor: COLORS.surfaceHighlight,
        borderRadius: RADIUS.s,
    },
});

import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { Step } from '../types';
import { Card } from '../design-system/components/Card';
import { Typography } from '../design-system/components/Typography';
import { COLORS, SPACING, RADIUS, FONTS } from '../design-system/tokens';
import Svg, { Path } from 'react-native-svg';

// Icons
const TrashIcon = ({ color = COLORS.textSecondary, size = 20 }: { color?: string; size?: number }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <Path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </Svg>
);

const CalendarIcon = ({ color = COLORS.textSecondary, size = 16 }: { color?: string; size?: number }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <Path d="M19 4H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zM16 2v4M8 2v4M3 10h18" />
    </Svg>
);

const ClockIcon = ({ color = COLORS.textSecondary, size = 16 }: { color?: string; size?: number }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <Path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
        <Path d="M12 6v6l4 2" />
    </Svg>
);

interface TaskReviewListProps {
    steps: Step[];
    onUpdateStep: (step: Step) => void;
    onDeleteStep: (stepId: string) => void;
    onEditDate: (step: Step) => void;
}

export const TaskReviewList: React.FC<TaskReviewListProps> = ({
    steps,
    onUpdateStep,
    onDeleteStep,
    onEditDate,
}) => {
    return (
        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
            {steps.map((step, index) => (
                <Card key={step.id} variant="solid" style={styles.card}>
                    <View style={styles.header}>
                        <View style={styles.numberBadge}>
                            <Typography variant="caption" weight="bold" color={COLORS.background}>
                                {index + 1}
                            </Typography>
                        </View>
                        <TouchableOpacity onPress={() => onDeleteStep(step.id)} style={styles.deleteButton}>
                            <TrashIcon color={COLORS.textTertiary} />
                        </TouchableOpacity>
                    </View>

                    <TextInput
                        style={styles.titleInput}
                        value={step.title}
                        onChangeText={(text) => onUpdateStep({ ...step, title: text })}
                        placeholder="Task title"
                        placeholderTextColor={COLORS.textTertiary}
                        multiline
                    />

                    <View style={styles.metaContainer}>
                        <TouchableOpacity
                            style={styles.dateButton}
                            onPress={() => onEditDate(step)}
                        >
                            <CalendarIcon color={COLORS.primary} />
                            <Typography variant="caption" color={COLORS.textSecondary} style={styles.dateText}>
                                {step.date ? step.date.toLocaleDateString() : 'Auto-Schedule'}
                            </Typography>
                        </TouchableOpacity>

                        {step.estimatedMinutes && (
                            <View style={styles.timeBadge}>
                                <ClockIcon color={COLORS.textSecondary} />
                                <Typography variant="caption" color={COLORS.textSecondary} style={styles.timeText}>
                                    {step.estimatedMinutes}m
                                </Typography>
                            </View>
                        )}
                    </View>
                </Card>
            ))}
            <View style={{ height: SPACING.xxxl }} />
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingBottom: SPACING.xxl,
    },
    card: {
        marginBottom: SPACING.m,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: SPACING.s,
    },
    numberBadge: {
        backgroundColor: COLORS.primary,
        width: 24,
        height: 24,
        borderRadius: RADIUS.full,
        alignItems: 'center',
        justifyContent: 'center',
    },
    deleteButton: {
        padding: SPACING.xs,
    },
    titleInput: {
        fontFamily: FONTS.family,
        fontSize: FONTS.sizes.h3,
        color: COLORS.textPrimary,
        marginBottom: SPACING.m,
        padding: 0, // Remove default padding
    },
    dateButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: SPACING.xs,
        paddingHorizontal: SPACING.s,
        backgroundColor: COLORS.surfaceHighlight,
        borderRadius: RADIUS.s,
    },
    dateText: {
        marginLeft: SPACING.s,
    },
    metaContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.s,
    },
    timeBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: SPACING.xs,
        paddingHorizontal: SPACING.s,
        backgroundColor: COLORS.surfaceHighlight,
        borderRadius: RADIUS.s,
    },
    timeText: {
        marginLeft: SPACING.s,
    },
});

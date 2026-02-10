import React from 'react';
import { View, StyleSheet, Modal, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { Typography } from '../design-system/components/Typography';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../design-system/tokens';
import { Step, SlotCategory } from '../types';
import Svg, { Path, Circle, Polyline, Line } from 'react-native-svg';

interface TaskDetailModalProps {
    visible: boolean;
    onClose: () => void;
    task: Step | null;
    onEdit: (task: Step) => void;
    onToggleComplete: (task: Step) => void;
}

export const TaskDetailModal: React.FC<TaskDetailModalProps> = ({
    visible,
    onClose,
    task,
    onEdit,
    onToggleComplete,
}) => {
    if (!task) return null;

    const getCategoryColor = (category?: string) => {
        switch (category) {
            case ' WORK ': return COLORS.categories.work;
            case 'PROJECTS': return COLORS.categories.projects;
            case 'PERSONAL': return COLORS.categories.personal;
            case 'STUDY': return COLORS.categories.study;
            default: return COLORS.textSecondary;
        }
    };

    // Icons
    const ClockIcon = ({ color = COLORS.textTertiary, size = 16 }) => (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <Circle cx="12" cy="12" r="10" />
            <Polyline points="12 6 12 12 16 14" />
        </Svg>
    );

    const CalendarIcon = ({ color = COLORS.textTertiary, size = 16 }) => (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <Path d="M19 4H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z" />
            <Line x1="16" y1="2" x2="16" y2="6" />
            <Line x1="8" y1="2" x2="8" y2="6" />
            <Line x1="3" y1="10" x2="21" y2="10" />
        </Svg>
    );

    const EditIcon = ({ color = COLORS.textPrimary, size = 20 }) => (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <Path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
        </Svg>
    );

    const CloseIcon = ({ color = COLORS.textSecondary, size = 24 }) => (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <Line x1="18" y1="6" x2="6" y2="18" />
            <Line x1="6" y1="6" x2="18" y2="18" />
        </Svg>
    );

    const ZapIcon = ({ color = COLORS.textInverse, size = 12 }) => (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill={color} stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <Path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
        </Svg>
    );

    const formatTime = (date?: Date) => {
        if (!date) return '';
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const formatDate = (date?: Date) => {
        if (!date) return '';
        // "Monday, January 12" format
        return date.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
    };

    const categoryColor = getCategoryColor(task.category as SlotCategory);

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <BlurView intensity={40} tint="dark" style={styles.container}>
                <TouchableOpacity style={styles.overlay} onPress={onClose} activeOpacity={1} />

                <View style={styles.content}>
                    {/* Header Actions */}
                    <View style={styles.header}>
                        <View style={styles.categoryBadge}>
                            <View style={[styles.dot, { backgroundColor: categoryColor }]} />
                            <Typography variant="caption" color={COLORS.textSecondary} weight="medium" style={{ letterSpacing: 1 }}>
                                {task.category || 'TASK'}
                            </Typography>
                        </View>

                        <View style={styles.actions}>
                            <TouchableOpacity onPress={() => onEdit(task)} style={styles.iconButton}>
                                <EditIcon color={COLORS.primary} />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={onClose} style={styles.iconButton}>
                                <CloseIcon />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent} showsVerticalScrollIndicator={false}>
                        {/* Title Section */}
                        <View style={styles.titleSection}>
                            <TouchableOpacity
                                style={[styles.checkbox, task.isCompleted && { backgroundColor: COLORS.primary, borderColor: COLORS.primary }]}
                                onPress={() => onToggleComplete(task)}
                            >
                                {task.isCompleted && <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={COLORS.textInverse} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><Polyline points="20 6 9 17 4 12" /></Svg>}
                            </TouchableOpacity>
                            <Typography
                                variant="h2"
                                weight="bold"
                                color={task.isCompleted ? COLORS.textSecondary : COLORS.textPrimary}
                                style={[
                                    styles.titleText,
                                    task.isCompleted && { textDecorationLine: 'line-through' }
                                ]}
                            >
                                {task.title}
                            </Typography>
                        </View>

                        {/* Meta Data Row */}
                        <View style={styles.metaRow}>
                            {task.date && (
                                <>
                                    <View style={styles.metaItem}>
                                        <CalendarIcon />
                                        <Typography variant="body" color={COLORS.textSecondary}>
                                            {formatDate(task.date)}
                                        </Typography>
                                    </View>
                                    {task.date.getHours() !== 0 && (
                                        <View style={styles.metaItem}>
                                            <ClockIcon />
                                            <Typography variant="body" color={COLORS.textSecondary}>
                                                {formatTime(task.date)}
                                            </Typography>
                                        </View>
                                    )}
                                </>
                            )}

                            {task.effort && (
                                <View style={styles.effortBadge}>
                                    <ZapIcon size={12} color={COLORS.textInverse} />
                                    <Typography variant="caption" color={COLORS.textInverse} weight="bold" style={{ marginLeft: 4 }}>
                                        {task.effort}
                                    </Typography>
                                </View>
                            )}
                        </View>

                        <View style={styles.divider} />

                        {/* Description */}
                        {task.description ? (
                            <View style={styles.descriptionSection}>
                                <Typography variant="h3" color={COLORS.textPrimary} style={{ marginBottom: SPACING.s }}>
                                    Notes
                                </Typography>
                                <Typography variant="body" color={COLORS.textSecondary} style={{ lineHeight: 24 }}>
                                    {task.description}
                                </Typography>
                            </View>
                        ) : (
                            <View style={styles.emptyState}>
                                <Typography variant="body" color={COLORS.textTertiary} style={{ fontStyle: 'italic' }}>
                                    No additional notes for this task.
                                </Typography>
                            </View>
                        )}
                    </ScrollView>
                </View>
            </BlurView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: SPACING.l,
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.3)', // Slightly darken the blurred background
    },
    content: {
        width: '100%',
        maxWidth: 420,
        backgroundColor: COLORS.surface,
        borderRadius: RADIUS.xl,
        overflow: 'hidden',
        maxHeight: '85%',
        ...SHADOWS.medium,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: SPACING.xl,
        paddingTop: SPACING.l,
        paddingBottom: SPACING.s,
    },
    categoryBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.surfaceHighlight,
        paddingHorizontal: SPACING.m,
        paddingVertical: SPACING.xs,
        borderRadius: RADIUS.full,
    },
    dot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        marginRight: SPACING.s,
    },
    actions: {
        flexDirection: 'row',
        gap: SPACING.s,
    },
    iconButton: {
        padding: SPACING.xs,
        borderRadius: RADIUS.m,
    },
    body: {
        // Removed flex: 1 to allow content to determine height
    },
    bodyContent: {
        padding: SPACING.xl,
        paddingTop: SPACING.s,
    },
    titleSection: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: SPACING.l,
        gap: SPACING.m,
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: COLORS.textTertiary,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 4, // Align with the first line of text
    },
    titleText: {
        flex: 1,
        marginTop: 0,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: SPACING.l,
        marginBottom: SPACING.l,
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.s,
    },
    effortBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.primary,
        paddingHorizontal: SPACING.s,
        paddingVertical: 4,
        borderRadius: RADIUS.full,
    },
    divider: {
        height: 1,
        backgroundColor: COLORS.border,
        opacity: 0.5,
        marginBottom: SPACING.l,
    },
    descriptionSection: {
        minHeight: 100,
    },
    emptyState: {
        paddingVertical: SPACING.l,
        alignItems: 'center',
        opacity: 0.7,
    }
});

import React from 'react';
import { View, StyleSheet, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { BlurView } from 'expo-blur';
import { Typography } from '../design-system/components/Typography';
import { Button } from '../design-system/components/Button';
import { COLORS, SPACING, RADIUS } from '../design-system/tokens';
import { Step } from '../types';
import Svg, { Path } from 'react-native-svg';

interface EventDetailModalProps {
    visible: boolean;
    onClose: () => void;
    event: Step | null;
    onConvertToTask: (event: Step) => void;
}

export const EventDetailModal: React.FC<EventDetailModalProps> = ({
    visible,
    onClose,
    event,
    onConvertToTask,
}) => {
    if (!event) return null;

    const CalendarIcon = ({ color = COLORS.primary, size = 24 }: { color?: string; size?: number }) => (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <Path d="M19 4H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z" />
            <Path d="M16 2v4" />
            <Path d="M8 2v4" />
            <Path d="M3 10h18" />
        </Svg>
    );

    const ClockIcon = ({ color = COLORS.textSecondary, size = 16 }: { color?: string; size?: number }) => (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <Path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
            <Path d="M12 6v6l4 2" />
        </Svg>
    );

    const formatTime = (date?: Date) => {
        if (!date) return '';
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const formatDate = (date?: Date) => {
        if (!date) return '';
        return date.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <BlurView intensity={20} style={styles.container}>
                <TouchableOpacity style={styles.overlay} onPress={onClose} activeOpacity={1} />

                <View style={styles.content}>
                    <View style={styles.header}>
                        <View style={styles.iconContainer}>
                            <CalendarIcon />
                        </View>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <Typography variant="h3" color={COLORS.textSecondary}>✕</Typography>
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
                        <Typography variant="h2" weight="bold" style={styles.title}>
                            {event.title}
                        </Typography>

                        <View style={styles.dateContainer}>
                            <ClockIcon />
                            <Typography variant="body" color={COLORS.textSecondary} style={{ marginLeft: SPACING.s }}>
                                {formatDate(event.date)}
                            </Typography>
                        </View>

                        <View style={styles.timeContainer}>
                            <Typography variant="h3" color={COLORS.primary} weight="semibold">
                                {formatTime(event.date)}
                            </Typography>
                            {/* We might want to pass end time if available, for now just start */}
                        </View>

                        {event.description ? (
                            <View style={styles.descriptionContainer}>
                                <Typography variant="caption" weight="bold" color={COLORS.textSecondary} style={{ marginBottom: SPACING.xs }}>
                                    DESCRIPTION
                                </Typography>
                                <Typography variant="body" color={COLORS.textPrimary}>
                                    {event.description}
                                </Typography>
                            </View>
                        ) : null}

                        <View style={styles.infoBox}>
                            <Typography variant="caption" color={COLORS.textSecondary}>
                                This is a calendar event. It cannot be checked off directly. Convert it to a task to track it.
                            </Typography>
                        </View>
                    </ScrollView>

                    <View style={styles.footer}>
                        <Button
                            title="Convert to Task"
                            onPress={() => onConvertToTask(event)}
                            style={styles.convertButton}
                        />
                    </View>
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
        backgroundColor: 'rgba(0,0,0,0.5)',
        padding: SPACING.l,
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
    },
    content: {
        width: '100%',
        maxWidth: 400,
        backgroundColor: COLORS.surface,
        borderRadius: RADIUS.l,
        overflow: 'hidden',
        maxHeight: '80%',
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 10,
        },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: SPACING.m,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: RADIUS.m,
        backgroundColor: COLORS.surfaceHighlight,
        alignItems: 'center',
        justifyContent: 'center',
    },
    closeButton: {
        padding: SPACING.s,
    },
    body: {
        padding: SPACING.l,
    },
    title: {
        marginBottom: SPACING.m,
    },
    dateContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: SPACING.s,
    },
    timeContainer: {
        marginBottom: SPACING.l,
    },
    descriptionContainer: {
        backgroundColor: COLORS.background,
        padding: SPACING.m,
        borderRadius: RADIUS.m,
        marginBottom: SPACING.l,
    },
    infoBox: {
        padding: SPACING.m,
        backgroundColor: COLORS.surfaceHighlight,
        borderRadius: RADIUS.m,
        borderLeftWidth: 3,
        borderLeftColor: COLORS.primary,
        marginBottom: SPACING.m,
    },
    footer: {
        padding: SPACING.m,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
    },
    convertButton: {
        width: '100%',
    },
});

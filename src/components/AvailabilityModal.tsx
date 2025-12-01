import React, { useState, useEffect } from 'react';
import { Modal, View, StyleSheet, ScrollView, TouchableOpacity, Platform, Alert } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Card } from '../design-system/components/Card';
import { Typography } from '../design-system/components/Typography';
import { Button } from '../design-system/components/Button';
import { Checkbox } from '../design-system/components/Checkbox';
import { COLORS, SPACING, RADIUS } from '../design-system/tokens';
import { WeeklySchedule, DaySchedule, TimeSlot, SlotCategory } from '../types';

interface AvailabilityModalProps {
    visible: boolean;
    initialSchedule: WeeklySchedule;
    onClose: () => void;
    onSave: (schedule: WeeklySchedule) => void;
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const CATEGORIES: SlotCategory[] = [' WORK ', 'PROJECTS', 'PERSONAL', 'STUDY', 'ANYTHING', 'BLOCKED'];

const getCategoryColor = (category: SlotCategory) => {
    switch (category) {
        case ' WORK ': return COLORS.primary;
        case 'PROJECTS': return '#8B5CF6'; // Purple
        case 'PERSONAL': return '#10B981'; // Green
        case 'STUDY': return '#F59E0B'; // Amber
        case 'ANYTHING': return '#FFFFFF'; // White
        case 'BLOCKED': return '#EF4444'; // Red
        default: return COLORS.textSecondary;
    }
};

export const AvailabilityModal: React.FC<AvailabilityModalProps> = ({
    visible,
    initialSchedule,
    onClose,
    onSave,
}) => {
    const [schedule, setSchedule] = useState<WeeklySchedule>({});
    const [showTimePicker, setShowTimePicker] = useState<{ day: string; slotIndex: number; type: 'start' | 'end' } | null>(null);
    const [tempDate, setTempDate] = useState(new Date());

    useEffect(() => {
        if (visible) {
            // Initialize schedule if empty or missing days
            let newSchedule = { ...initialSchedule };

            // Check if effectively empty
            const hasSlots = Object.values(newSchedule).some(day =>
                day.isWorkDay && day.slots && day.slots.length > 0
            );

            if (!hasSlots) {
                // Apply default 9-00 schedule
                // Apply default 9-00 schedule with lunch break
                DAYS.forEach(day => {
                    newSchedule[day] = {
                        isWorkDay: true,
                        slots: [
                            { start: '09:00', end: '12:00', category: 'ANYTHING' },
                            { start: '12:00', end: '14:00', category: 'BLOCKED' },
                            { start: '14:00', end: '24:00', category: 'ANYTHING' }
                        ]
                    };
                });
            } else {
                // Ensure all days exist
                DAYS.forEach(day => {
                    if (!newSchedule[day]) {
                        newSchedule[day] = { isWorkDay: false, slots: [] };
                    }
                });
            }
            setSchedule(newSchedule);
        }
    }, [visible, initialSchedule]);

    const handleReset = () => {
        Alert.alert(
            "Reset Schedule",
            "Reset to default (9:00 - 24:00)?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Reset",
                    style: "destructive",
                    onPress: () => {
                        const defaultSchedule: WeeklySchedule = {};
                        DAYS.forEach(day => {
                            defaultSchedule[day] = {
                                isWorkDay: true,
                                slots: [
                                    { start: '09:00', end: '12:00', category: 'ANYTHING' },
                                    { start: '12:00', end: '14:00', category: 'BLOCKED' },
                                    { start: '14:00', end: '24:00', category: 'ANYTHING' }
                                ]
                            };
                        });
                        setSchedule(defaultSchedule);
                    }
                }
            ]
        );
    };

    const handleToggleDay = (day: string) => {
        setSchedule(prev => ({
            ...prev,
            [day]: {
                ...prev[day],
                isWorkDay: !prev[day].isWorkDay
            }
        }));
    };

    const handleAddSlot = (day: string) => {
        setSchedule(prev => ({
            ...prev,
            [day]: {
                ...prev[day],
                slots: [...prev[day].slots, { start: '09:00', end: '17:00', category: ' WORK ' }]
            }
        }));
    };

    const handleRemoveSlot = (day: string, index: number) => {
        setSchedule(prev => {
            const newSlots = [...prev[day].slots];
            newSlots.splice(index, 1);
            return {
                ...prev,
                [day]: {
                    ...prev[day],
                    slots: newSlots
                }
            };
        });
    };

    const handleCycleCategory = (day: string, index: number) => {
        setSchedule(prev => {
            const newSlots = [...prev[day].slots];
            const currentCategory = newSlots[index].category || ' WORK ';
            const currentIndex = CATEGORIES.indexOf(currentCategory);
            const nextIndex = (currentIndex + 1) % CATEGORIES.length;

            newSlots[index] = {
                ...newSlots[index],
                category: CATEGORIES[nextIndex]
            };

            return {
                ...prev,
                [day]: {
                    ...prev[day],
                    slots: newSlots
                }
            };
        });
    };

    const openTimePicker = (day: string, slotIndex: number, type: 'start' | 'end', currentTime: string) => {
        const [hours, minutes] = currentTime.split(':').map(Number);
        const date = new Date();
        date.setHours(hours);
        date.setMinutes(minutes);
        setTempDate(date);
        setShowTimePicker({ day, slotIndex, type });
    };

    const onTimeChange = (event: any, selectedDate?: Date) => {
        if (Platform.OS === 'android') {
            setShowTimePicker(null);
        }

        if (selectedDate && showTimePicker) {
            const { day, slotIndex, type } = showTimePicker;
            const hours = selectedDate.getHours().toString().padStart(2, '0');
            const minutes = selectedDate.getMinutes().toString().padStart(2, '0');
            const timeString = `${hours}:${minutes}`;

            setSchedule(prev => {
                const newSlots = [...prev[day].slots];
                newSlots[slotIndex] = {
                    ...newSlots[slotIndex],
                    [type]: timeString
                };
                return {
                    ...prev,
                    [day]: {
                        ...prev[day],
                        slots: newSlots
                    }
                };
            });

            if (Platform.OS === 'ios') {
                setTempDate(selectedDate);
            }
        }
    };

    const handleSave = () => {
        onSave(schedule);
        onClose();
    };

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
                        <View>
                            <Typography variant="h2" weight="bold" color={COLORS.textPrimary}>
                                Weekly Schedule
                            </Typography>
                            <Typography variant="caption" color={COLORS.textSecondary}>
                                Define your working hours
                            </Typography>
                        </View>
                        <Button title="Reset" onPress={handleReset} size="s" variant="secondary" />
                    </View>

                    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                        {DAYS.map(day => {
                            const daySchedule = schedule[day] || { isWorkDay: false, slots: [] };
                            return (
                                <View key={day} style={styles.dayContainer}>
                                    <View style={styles.dayHeader}>
                                        <TouchableOpacity
                                            style={styles.dayToggleArea}
                                            onPress={() => handleToggleDay(day)}
                                            activeOpacity={0.7}
                                        >
                                            <Checkbox
                                                checked={daySchedule.isWorkDay}
                                                onPress={() => handleToggleDay(day)}
                                                style={{ marginRight: SPACING.m }}
                                            />
                                            <Typography variant="h3" color={daySchedule.isWorkDay ? COLORS.textPrimary : COLORS.textTertiary}>
                                                {day}
                                            </Typography>
                                        </TouchableOpacity>
                                        {daySchedule.isWorkDay && (
                                            <TouchableOpacity onPress={() => handleAddSlot(day)} style={styles.addButton}>
                                                <Typography variant="caption" color={COLORS.primary} weight="bold">
                                                    + Add
                                                </Typography>
                                            </TouchableOpacity>
                                        )}
                                    </View>

                                    {daySchedule.isWorkDay && (
                                        <View style={styles.slotsContainer}>
                                            {daySchedule.slots.map((slot, index) => (
                                                <View key={index} style={styles.slotRow}>
                                                    <TouchableOpacity
                                                        style={styles.timeButton}
                                                        onPress={() => openTimePicker(day, index, 'start', slot.start)}
                                                    >
                                                        <Typography variant="body" color={COLORS.textPrimary}>
                                                            {slot.start}
                                                        </Typography>
                                                    </TouchableOpacity>
                                                    <Typography variant="body" color={COLORS.textSecondary} style={{ marginHorizontal: SPACING.s }}>
                                                        -
                                                    </Typography>
                                                    <TouchableOpacity
                                                        style={styles.timeButton}
                                                        onPress={() => openTimePicker(day, index, 'end', slot.end)}
                                                    >
                                                        <Typography variant="body" color={COLORS.textPrimary}>
                                                            {slot.end}
                                                        </Typography>
                                                    </TouchableOpacity>
                                                    <TouchableOpacity
                                                        style={[styles.categoryPill, { borderColor: getCategoryColor(slot.category || ' WORK ') }]}
                                                        onPress={() => handleCycleCategory(day, index)}
                                                    >
                                                        <Typography variant="caption" color={getCategoryColor(slot.category || ' WORK ')} weight="bold">
                                                            {slot.category || ' WORK '}
                                                        </Typography>
                                                    </TouchableOpacity>

                                                    <TouchableOpacity
                                                        onPress={() => handleRemoveSlot(day, index)}
                                                        style={styles.removeButton}
                                                    >
                                                        <Typography variant="h3" color={COLORS.error} style={{ lineHeight: 20 }}>
                                                            ✕
                                                        </Typography>
                                                    </TouchableOpacity>
                                                </View>
                                            ))}
                                        </View>
                                    )}
                                </View>
                            );
                        })}
                    </ScrollView>

                    <View style={styles.footer}>
                        <Button
                            title="Confirm"
                            variant="primary"
                            onPress={handleSave}
                            fullWidth
                        />
                    </View>
                </Card>
            </View>

            {showTimePicker && (
                Platform.OS === 'ios' ? (
                    <Modal transparent animationType="fade" visible={!!showTimePicker} onRequestClose={() => setShowTimePicker(null)}>
                        <View style={styles.pickerOverlay}>
                            <View style={styles.pickerContainer}>
                                <View style={styles.pickerHeader}>
                                    <Button title="Done" onPress={() => setShowTimePicker(null)} size="s" />
                                </View>
                                <DateTimePicker
                                    value={tempDate}
                                    mode="time"
                                    display="spinner"
                                    onChange={onTimeChange}
                                    textColor={COLORS.textPrimary}
                                    themeVariant="dark"
                                />
                            </View>
                        </View>
                    </Modal>
                ) : (
                    <DateTimePicker
                        value={tempDate}
                        mode="time"
                        display="default"
                        onChange={onTimeChange}
                    />
                )
            )}
        </Modal>
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
        maxHeight: '85%',
        flex: 1,
    },
    header: {
        marginBottom: SPACING.l,
    },
    content: {
        flex: 1,
        marginBottom: SPACING.l,
    },
    dayContainer: {
        marginBottom: SPACING.m,
        paddingBottom: SPACING.m,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)',
    },
    dayHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: SPACING.s,
        justifyContent: 'space-between',
    },
    dayToggleArea: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    addButton: {
        marginLeft: 'auto',
        padding: SPACING.xs,
    },
    slotsContainer: {
        marginLeft: 34, // Align with text (checkbox width + margin)
    },
    slotRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: SPACING.s,
    },
    timeButton: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        paddingHorizontal: SPACING.s, // Reduced padding to fit content
        paddingVertical: SPACING.xs,
        borderRadius: RADIUS.s,
    },
    categoryPill: {
        paddingHorizontal: SPACING.m, // Increased padding
        paddingVertical: 4,
        borderRadius: RADIUS.s,
        borderWidth: 1,
        marginLeft: SPACING.s,
        alignItems: 'center',
        // Removed minWidth to allow auto-sizing
    },
    removeButton: {
        marginLeft: SPACING.s,
        padding: SPACING.xs,
    },
    footer: {
        marginTop: SPACING.m,
    },
    pickerOverlay: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    pickerContainer: {
        backgroundColor: COLORS.surface,
        paddingBottom: SPACING.xl,
    },
    pickerHeader: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        padding: SPACING.m,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    }
});

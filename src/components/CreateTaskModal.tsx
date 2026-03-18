import React, { useState } from 'react';
import { Modal, View, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { DatePickerModal } from './DatePickerModal';
import { Card } from '../design-system/components/Card';
import { Typography } from '../design-system/components/Typography';
import { Button } from '../design-system/components/Button';
import { Input } from '../design-system/components/Input';
import { Slider } from './Slider';
import { SPACING, RADIUS } from '../design-system/tokens';
import { SlotCategory } from '../types';
import { useTheme } from '../theme';

const getCategoryColor = (category: SlotCategory, categoriesColors: any) => {
    switch (category) {
        case ' WORK ': return categoriesColors.work;
        case 'PROJECTS': return categoriesColors.projects;
        case 'PERSONAL': return categoriesColors.personal;
        case 'STUDY': return categoriesColors.study;
        default: return categoriesColors.work; // Fallback
    }
};

interface CreateTaskModalProps {
    visible: boolean;
    onClose: () => void;
    onSave: (title: string, date: Date, description?: string, effort?: number, category?: SlotCategory, parentId?: string, isHabit?: boolean, habitDaysOfWeek?: number[]) => void;
    initialDate?: Date;
    initialCategory?: SlotCategory;
    initialTitle?: string;
    initialDescription?: string;
    initialEffort?: number;
    initialIsHabit?: boolean;
    initialHabitDaysOfWeek?: number[];
    title?: string;
    saveLabel?: string;
}

const CATEGORIES: SlotCategory[] = [' WORK ', 'PROJECTS', 'PERSONAL', 'STUDY'];

export const CreateTaskModal: React.FC<CreateTaskModalProps> = ({
    visible,
    onClose,
    onSave,
    initialDate = new Date(),
    initialCategory,
    initialTitle = '',
    initialDescription = '',
    initialEffort = 1,
    initialIsHabit = false,
    initialHabitDaysOfWeek = [0, 1, 2, 3, 4, 5, 6],
    title = "New Task",
    saveLabel = "Create Task"
}) => {
    const { colors } = useTheme();
    const [taskTitle, setTaskTitle] = useState(initialTitle);
    const [description, setDescription] = useState(initialDescription);
    const [date, setDate] = useState(initialDate);
    const [effort, setEffort] = useState(initialEffort);
    const [category, setCategory] = useState<SlotCategory | undefined>(initialCategory);
    const [isHabit, setIsHabit] = useState(initialIsHabit);
    const [habitDaysOfWeek, setHabitDaysOfWeek] = useState<number[]>(initialHabitDaysOfWeek);
    const [showDatePicker, setShowDatePicker] = useState(false);

    const DAY_NAMES = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

    // Reset state when visible changes
    React.useEffect(() => {
        if (visible) {
            setTaskTitle(initialTitle);
            setDescription(initialDescription);
            setDate(initialDate);
            setEffort(initialEffort);
            setCategory(initialCategory || 'PERSONAL');
            setIsHabit(initialIsHabit);
            setHabitDaysOfWeek(initialHabitDaysOfWeek);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [visible]);

    const handleCycleCategory = () => {
        const currentCategory = category || 'PERSONAL';
        const currentIndex = CATEGORIES.indexOf(currentCategory);
        const nextIndex = (currentIndex + 1) % CATEGORIES.length;
        setCategory(CATEGORIES[nextIndex]);
    };

    const handleSave = () => {
        if (!taskTitle.trim()) return;
        onSave(taskTitle, date, description, effort, category, undefined, isHabit, habitDaysOfWeek);
        setTaskTitle('');
        setDescription('');
        setEffort(1);
        onClose();
    };

    const handleDateSelect = (selectedDate: Date) => {
        setDate(selectedDate);
        setShowDatePicker(false);
    };

    const toggleDay = (dayIndex: number) => {
        setHabitDaysOfWeek(prev => {
            if (prev.includes(dayIndex)) {
                // Prevent removing all days
                if (prev.length === 1) return prev;
                return prev.filter(d => d !== dayIndex);
            } else {
                return [...prev, dayIndex].sort();
            }
        });
    };

    const categoryColor = getCategoryColor(category || 'PERSONAL', colors.categories);

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
                    <View style={styles.headerRow}>
                        <Typography variant="h2" weight="bold" color={colors.textPrimary} style={styles.header}>
                            {title}
                        </Typography>
                        <Button
                            title="Save"
                            variant="primary"
                            onPress={handleSave}
                            disabled={!taskTitle.trim()}
                            size="s"
                        />
                    </View>

                    <Input
                        placeholder="What needs to be done?"
                        value={taskTitle}
                        onChangeText={setTaskTitle}
                        autoFocus
                        style={styles.input}
                        returnKeyType="done"
                        onSubmitEditing={handleSave}
                    />

                    <Input
                        placeholder="Description (optional)"
                        value={description}
                        onChangeText={setDescription}
                        multiline
                        style={[styles.input, styles.textArea]}
                    />

                    <View style={styles.categoryContainer}>
                        <Typography variant="caption" color={colors.textSecondary} style={styles.label}>
                            CATEGORY
                        </Typography>
                        <TouchableOpacity
                            style={[styles.categoryPill, { borderColor: categoryColor }]}
                            onPress={handleCycleCategory}
                        >
                            <Typography variant="caption" color={categoryColor} weight="bold">
                                {category || 'PERSONAL'}
                            </Typography>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.effortContainer}>
                        <Typography variant="caption" color={colors.textSecondary} style={styles.label}>
                            EFFORT LEVEL
                        </Typography>
                        <Slider
                            value={effort}
                            onValueChange={setEffort}
                            min={1}
                            max={5}
                            step={1}
                        />
                    </View>

                    <View style={styles.habitContainer}>
                        <View style={styles.habitRow}>
                            <Typography variant="caption" color={colors.textSecondary} style={styles.label}>
                                REPEATING HABIT
                            </Typography>
                            <TouchableOpacity
                                style={[styles.switch, isHabit && { backgroundColor: colors.primary }]}
                                onPress={() => setIsHabit(!isHabit)}
                            >
                                <View style={[styles.switchThumb, isHabit && styles.switchThumbActive]} />
                            </TouchableOpacity>
                        </View>
                        
                        {isHabit && (
                            <View style={styles.daysContainer}>
                                {DAY_NAMES.map((day, index) => {
                                    const isSelected = habitDaysOfWeek.includes(index);
                                    return (
                                        <TouchableOpacity
                                            key={index}
                                            style={[styles.dayCircle, isSelected && { backgroundColor: colors.primary, borderColor: colors.primary }]}
                                            onPress={() => toggleDay(index)}
                                        >
                                            <Typography variant="caption" color={isSelected ? colors.background : colors.textSecondary} weight="bold">
                                                {day}
                                            </Typography>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        )}
                    </View>

                    <View style={styles.actions}>
                        <Button
                            title="Cancel"
                            variant="ghost"
                            onPress={onClose}
                            style={{ flex: 1, marginRight: SPACING.s }}
                        />
                        <Button
                            title={saveLabel}
                            variant="primary"
                            onPress={handleSave}
                            disabled={!taskTitle.trim()}
                            style={{ flex: 1, marginLeft: SPACING.s }}
                        />
                    </View>

                    <DatePickerModal
                        visible={showDatePicker}
                        onClose={() => setShowDatePicker(false)}
                        onSelect={handleDateSelect}
                        initialDate={date}
                        title="Set Due Date"
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
        justifyContent: 'center',
        padding: SPACING.l,
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
    },
    container: {
        width: '100%',
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.l,
    },
    header: {
        marginBottom: 0,
    },
    input: {
        marginBottom: SPACING.m,
    },
    textArea: {
        minHeight: 80,
        textAlignVertical: 'top',
    },
    categoryContainer: {
        marginBottom: SPACING.l,
        alignItems: 'flex-start',
    },
    categoryPill: {
        paddingHorizontal: SPACING.m,
        paddingVertical: 8,
        borderRadius: RADIUS.s,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    dateContainer: {
        marginBottom: SPACING.xl,
    },
    label: {
        marginBottom: SPACING.xs,
        letterSpacing: 1,
    },
    dateButton: {
        alignSelf: 'flex-start',
    },
    actions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    effortContainer: {
        marginBottom: SPACING.l,
        paddingHorizontal: SPACING.xs,
    },
    habitContainer: {
        marginBottom: SPACING.xl,
    },
    habitRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    switch: {
        width: 44,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#444', // Darker generic background
        padding: 2,
    },
    switchThumb: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: '#fff',
        transform: [{ translateX: 0 }],
    },
    switchThumbActive: {
        transform: [{ translateX: 20 }],
    },
    daysContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: SPACING.m,
    },
    dayCircle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: '#444',
        alignItems: 'center',
        justifyContent: 'center',
    },
});

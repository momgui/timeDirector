import React, { useState } from 'react';
import { Modal, View, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Card } from '../design-system/components/Card';
import { Typography } from '../design-system/components/Typography';
import { Button } from '../design-system/components/Button';
import { Input } from '../design-system/components/Input';
import { Slider } from './Slider';
import { COLORS, SPACING, RADIUS } from '../design-system/tokens';
import { SlotCategory } from '../types';

const getCategoryColor = (category: SlotCategory) => {
    switch (category) {
        case ' WORK ': return COLORS.primary;
        case 'PROJECTS': return '#8B5CF6'; // Purple
        case 'PERSONAL': return '#10B981'; // Green
        case 'STUDY': return '#F59E0B'; // Amber
        default: return COLORS.textSecondary;
    }
};

interface CreateTaskModalProps {
    visible: boolean;
    onClose: () => void;
    onSave: (title: string, date: Date, description?: string, effort?: number, category?: SlotCategory) => void;
    initialDate?: Date;
    initialCategory?: SlotCategory;
    title?: string;
}

const CATEGORIES: SlotCategory[] = [' WORK ', 'PROJECTS', 'PERSONAL', 'STUDY'];

export const CreateTaskModal: React.FC<CreateTaskModalProps> = ({
    visible,
    onClose,
    onSave,
    initialDate = new Date(),
    initialCategory,
    title = "New Task"
}) => {
    const [taskTitle, setTaskTitle] = useState('');
    const [description, setDescription] = useState('');
    const [date, setDate] = useState(initialDate);
    const [effort, setEffort] = useState(1);
    const [category, setCategory] = useState<SlotCategory | undefined>(initialCategory);
    const [showDatePicker, setShowDatePicker] = useState(false);

    // Reset category when initialCategory changes or modal opens
    React.useEffect(() => {
        if (visible) {
            setCategory(initialCategory || 'PERSONAL');
            setDate(initialDate);
        }
    }, [visible, initialCategory, initialDate]);

    const handleCycleCategory = () => {
        const currentCategory = category || 'PERSONAL';
        const currentIndex = CATEGORIES.indexOf(currentCategory);
        const nextIndex = (currentIndex + 1) % CATEGORIES.length;
        setCategory(CATEGORIES[nextIndex]);
    };

    const handleSave = () => {
        if (!taskTitle.trim()) return;
        onSave(taskTitle, date, description, effort, category);
        setTaskTitle('');
        setDescription('');
        setEffort(1);
        onClose();
    };

    const onDateChange = (event: any, selectedDate?: Date) => {
        const currentDate = selectedDate || date;
        setShowDatePicker(Platform.OS === 'ios');
        setDate(currentDate);
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
                    <View style={styles.headerRow}>
                        <Typography variant="h2" weight="bold" color={COLORS.textPrimary} style={styles.header}>
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
                        <Typography variant="caption" color={COLORS.textSecondary} style={styles.label}>
                            CATEGORY
                        </Typography>
                        <TouchableOpacity
                            style={[styles.categoryPill, { borderColor: getCategoryColor(category || 'PERSONAL') }]}
                            onPress={handleCycleCategory}
                        >
                            <Typography variant="caption" color={getCategoryColor(category || 'PERSONAL')} weight="bold">
                                {category || 'PERSONAL'}
                            </Typography>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.dateContainer}>
                        <Typography variant="caption" color={COLORS.textSecondary} style={styles.label}>
                            DUE DATE
                        </Typography>
                        <Button
                            title={date.toLocaleDateString()}
                            variant="secondary"
                            onPress={() => setShowDatePicker(true)}
                            style={styles.dateButton}
                        />
                    </View>

                    <View style={styles.effortContainer}>
                        <Typography variant="caption" color={COLORS.textSecondary} style={styles.label}>
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

                    <View style={styles.actions}>
                        <Button
                            title="Cancel"
                            variant="ghost"
                            onPress={onClose}
                            style={{ flex: 1, marginRight: SPACING.s }}
                        />
                        <Button
                            title="Create Task"
                            variant="primary"
                            onPress={handleSave}
                            disabled={!taskTitle.trim()}
                            style={{ flex: 1, marginLeft: SPACING.s }}
                        />
                    </View>

                    {showDatePicker && (
                        <DateTimePicker
                            value={date}
                            mode="date"
                            display="default"
                            onChange={onDateChange}
                            minimumDate={new Date()}
                            themeVariant="dark"
                        />
                    )}
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
        marginBottom: SPACING.xl,
        paddingHorizontal: SPACING.xs,
    },
});

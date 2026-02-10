
import React, { useState } from 'react';
import { Modal, View, StyleSheet, TouchableOpacity } from 'react-native';
import { DatePickerModal } from './DatePickerModal';
import { Card } from '../design-system/components/Card';
import { Typography } from '../design-system/components/Typography';
import { Button } from '../design-system/components/Button';
import { Input } from '../design-system/components/Input';
import { SPACING, RADIUS } from '../design-system/tokens';
import { SlotCategory } from '../types/index';
import { useTheme } from '../theme';

const getCategoryColor = (category: string | undefined, categoriesColors: any) => {
    switch (category) {
        case ' WORK ': return categoriesColors.work;
        case 'PROJECTS': return categoriesColors.projects;
        case 'PERSONAL': return categoriesColors.personal;
        case 'STUDY': return categoriesColors.study;
        default: return categoriesColors.work; // Fallback
    }
};

interface CreateGoalModalProps {
    visible: boolean;
    onClose: () => void;
    onSave: (title: string, deadline: Date, category?: SlotCategory) => void;
}

const CATEGORIES: SlotCategory[] = [' WORK ', 'PROJECTS', 'PERSONAL', 'STUDY'];

export const CreateGoalModal: React.FC<CreateGoalModalProps> = ({
    visible,
    onClose,
    onSave,
}) => {
    const { colors } = useTheme();
    const [title, setTitle] = useState('');
    const [deadline, setDeadline] = useState(new Date());
    const [category, setCategory] = useState<SlotCategory>('PERSONAL');
    const [showDatePicker, setShowDatePicker] = useState(false);

    // Reset state when modal opens
    React.useEffect(() => {
        if (visible) {
            setTitle('');
            setDeadline(new Date(Date.now() + 86400000)); // Default tomorrow
            setCategory('PERSONAL');
        }
    }, [visible]);

    const handleCycleCategory = () => {
        const currentIndex = CATEGORIES.indexOf(category);
        const nextIndex = (currentIndex + 1) % CATEGORIES.length;
        setCategory(CATEGORIES[nextIndex]);
    };

    const handleSave = () => {
        if (!title.trim()) return;
        onSave(title, deadline, category);
        onClose();
    };

    const handleDateSelect = (selectedDate: Date) => {
        setDeadline(selectedDate);
        setShowDatePicker(false);
    };

    const categoryColor = getCategoryColor(category, colors.categories);

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
                            New Goal
                        </Typography>
                        <Button
                            title="Create"
                            variant="primary"
                            onPress={handleSave}
                            disabled={!title.trim()}
                            size="s"
                        />
                    </View>

                    <Input
                        placeholder="What is your main objective?"
                        value={title}
                        onChangeText={setTitle}
                        autoFocus
                        style={styles.input}
                        returnKeyType="done"
                        onSubmitEditing={handleSave}
                    />

                    <View style={styles.row}>
                        <View style={styles.categoryContainer}>
                            <Typography variant="caption" color={colors.textSecondary} style={styles.label}>
                                CATEGORY
                            </Typography>
                            <TouchableOpacity
                                style={[styles.categoryPill, { borderColor: categoryColor }]}
                                onPress={handleCycleCategory}
                            >
                                <Typography variant="caption" color={categoryColor} weight="bold">
                                    {category.trim()}
                                </Typography>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.dateContainer}>
                            <Typography variant="caption" color={colors.textSecondary} style={styles.label}>
                                DEADLINE
                            </Typography>
                            <Button
                                title={deadline.toLocaleDateString()}
                                variant="secondary"
                                onPress={() => setShowDatePicker(true)}
                                style={styles.dateButton}
                            />
                        </View>
                    </View>

                    <View style={styles.actions}>
                        <Button
                            title="Cancel"
                            variant="ghost"
                            onPress={onClose}
                            style={{ flex: 1, marginRight: SPACING.s }}
                        />
                    </View>

                    <DatePickerModal
                        visible={showDatePicker}
                        onClose={() => setShowDatePicker(false)}
                        onSelect={handleDateSelect}
                        initialDate={deadline}
                        title="Set Goal Deadline"
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
        marginBottom: SPACING.l,
        fontSize: 20,
        height: 60,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: SPACING.xl,
    },
    categoryContainer: {
        flex: 1,
        marginRight: SPACING.m,
        alignItems: 'flex-start',
    },
    categoryPill: {
        paddingHorizontal: SPACING.m,
        paddingVertical: 8,
        borderRadius: RADIUS.s,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 80,
    },
    dateContainer: {
        flex: 1,
        marginLeft: SPACING.m,
        alignItems: 'flex-start',
    },
    label: {
        marginBottom: SPACING.xs,
        letterSpacing: 1,
    },
    dateButton: {
        alignSelf: 'stretch',
    },
    actions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
    },
});

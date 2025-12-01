import React, { useState } from 'react';
import { View, StyleSheet, Platform, KeyboardAvoidingView, ScrollView, Modal, TouchableOpacity } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Step, SlotCategory } from '../types';
import { splitMilestone } from '../services/ai';
import { v4 as uuidv4 } from 'uuid';
import 'react-native-get-random-values';
import { Layout } from '../design-system/components/Layout';
import { Typography } from '../design-system/components/Typography';
import { Input } from '../design-system/components/Input';
import { Button } from '../design-system/components/Button';
import { Card } from '../design-system/components/Card';
import { TaskReviewList } from '../components/TaskReviewList';
import { COLORS, SPACING } from '../design-system/tokens';

interface SmartSplitModalProps {
    visible: boolean;
    milestone: Step;
    onClose: () => void;
    onSave: (newSteps: Step[]) => void;
}

export const SmartSplitModal: React.FC<SmartSplitModalProps> = ({
    visible,
    milestone,
    onClose,
    onSave,
}) => {
    const [loading, setLoading] = useState(false);
    const [proposedSteps, setProposedSteps] = useState<Step[]>([]);
    const [editingStep, setEditingStep] = useState<Step | null>(null);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [hasGenerated, setHasGenerated] = useState(false);
    const [splitMode, setSplitMode] = useState<'ai' | 'generic'>('ai');

    // Auto-generate on open
    React.useEffect(() => {
        if (visible && !hasGenerated && proposedSteps.length === 0) {
            handleGenerate();
        }
    }, [visible]);

    const handleGenerate = async () => {
        setLoading(true);
        try {
            const steps = await splitMilestone(
                milestone.title,
                milestone.description || '',
                milestone.estimatedMinutes || 60,
                milestone.category || ' WORK ',
                milestone.id,
                splitMode,
                milestone.effort || 2
            );

            setProposedSteps(steps);
            setHasGenerated(true);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStep = (updatedStep: Step) => {
        setProposedSteps(steps => steps.map(s => s.id === updatedStep.id ? updatedStep : s));
        if (editingStep?.id === updatedStep.id) {
            setEditingStep(updatedStep);
        }
    };

    const handleDeleteStep = (stepId: string) => {
        setProposedSteps(steps => steps.filter(s => s.id !== stepId));
    };

    const handleEditDate = (step: Step) => {
        setEditingStep(step);
        setShowDatePicker(true);
    };

    const handleDateChange = (event: any, selectedDate?: Date) => {
        setShowDatePicker(Platform.OS === 'ios');
        if (selectedDate && editingStep) {
            handleUpdateStep({ ...editingStep, date: selectedDate });
        }
    };

    const handleConfirm = () => {
        onSave(proposedSteps);
        onClose();
        // Reset state for next time
        setProposedSteps([]);
        setHasGenerated(false);
    };

    const handleClose = () => {
        onClose();
        setProposedSteps([]);
        setHasGenerated(false);
    }

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={handleClose}
        >
            <Layout>
                <View style={styles.header}>
                    <Button title="Cancel" variant="ghost" onPress={handleClose} />
                    <Typography variant="h3">Split "{milestone.title}"</Typography>
                    <View style={{ width: 60 }} />
                </View>

                <View style={styles.modeSelector}>
                    <TouchableOpacity
                        style={[styles.modeButton, splitMode === 'ai' && styles.modeButtonActive]}
                        onPress={() => setSplitMode('ai')}
                    >
                        <Typography
                            variant="caption"
                            weight="bold"
                            color={splitMode === 'ai' ? COLORS.background : COLORS.textSecondary}
                        >
                            ✨ AI Smart Split
                        </Typography>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.modeButton, splitMode === 'generic' && styles.modeButtonActive]}
                        onPress={() => setSplitMode('generic')}
                    >
                        <Typography
                            variant="caption"
                            weight="bold"
                            color={splitMode === 'generic' ? COLORS.background : COLORS.textSecondary}
                        >
                            🔢 Generic Split
                        </Typography>
                    </TouchableOpacity>
                </View>

                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.keyboardView}
                >
                    <ScrollView contentContainerStyle={styles.content}>
                        {loading ? (
                            <View style={styles.loadingContainer}>
                                <Typography variant="h2" color={COLORS.primary} style={styles.title}>
                                    Generating Sub-tasks...
                                </Typography>
                                <Typography variant="body" color={COLORS.textSecondary}>
                                    AI is breaking down your milestone into actionable steps.
                                </Typography>
                            </View>
                        ) : (
                            <>
                                <Typography variant="h2" color={COLORS.primary} style={styles.title}>
                                    Review Sub-Milestones
                                </Typography>
                                <Typography variant="body" color={COLORS.textSecondary} style={{ marginBottom: SPACING.l }}>
                                    These will be added as sub-tasks to your milestone.
                                </Typography>

                                <TaskReviewList
                                    steps={proposedSteps}
                                    onUpdateStep={handleUpdateStep}
                                    onDeleteStep={handleDeleteStep}
                                    onEditDate={handleEditDate}
                                />

                                <Button
                                    title="Confirm & Add"
                                    onPress={handleConfirm}
                                    loading={loading}
                                    fullWidth
                                    style={styles.submitButton}
                                />
                                <Button
                                    title="Regenerate"
                                    variant="ghost"
                                    onPress={handleGenerate}
                                    style={{ marginTop: SPACING.s }}
                                />
                            </>
                        )}

                        {showDatePicker && (
                            <DateTimePicker
                                value={editingStep?.date || new Date()}
                                mode="date"
                                display="default"
                                onChange={handleDateChange}
                                minimumDate={new Date()}
                                themeVariant="dark"
                            />
                        )}
                    </ScrollView>
                </KeyboardAvoidingView>
            </Layout>
        </Modal>
    );
};

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: SPACING.m,
    },
    keyboardView: {
        flex: 1,
    },
    content: {
        flexGrow: 1,
        padding: SPACING.l,
    },
    title: {
        marginBottom: SPACING.l,
    },
    input: {
        marginBottom: SPACING.xl,
        minHeight: 100,
        textAlignVertical: 'top',
        fontSize: 20,
    },
    label: {
        marginBottom: SPACING.s,
        letterSpacing: 1,
    },
    submitButton: {
        marginTop: SPACING.xl,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: SPACING.xl,
    },
    modeSelector: {
        flexDirection: 'row',
        padding: SPACING.m,
        gap: SPACING.m,
    },
    modeButton: {
        flex: 1,
        paddingVertical: SPACING.s,
        alignItems: 'center',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    modeButtonActive: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
    },
});

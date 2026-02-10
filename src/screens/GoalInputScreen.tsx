import React, { useState } from 'react';
import { View, StyleSheet, Platform, KeyboardAvoidingView, ScrollView, TextInput, Alert } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { DatePickerModal } from '../components/DatePickerModal';
import { RootStackParamList, Step, SlotCategory } from '../types';
import { generateSteps, generateQuestions, splitMilestone } from '../services/ai';
import { saveGoal, saveSteps, getGoals, updateGoal } from '../services/storage';
import { v4 as uuidv4 } from 'uuid';
import 'react-native-get-random-values';
import { Layout } from '../design-system/components/Layout';
import { Typography } from '../design-system/components/Typography';
import { Input } from '../design-system/components/Input';
import { Button } from '../design-system/components/Button';
import { TaskReviewList } from '../components/TaskReviewList';
import { SPACING } from '../design-system/tokens';
import { useTheme } from '../theme';

import { RouteProp, useRoute } from '@react-navigation/native';

type GoalInputScreenRouteProp = RouteProp<RootStackParamList, 'GoalInput'>;

type GoalInputScreenProps = {
    navigation: NativeStackNavigationProp<RootStackParamList, 'GoalInput'>;
};

const GoalInputScreen: React.FC<GoalInputScreenProps> = ({ navigation }) => {
    const { colors } = useTheme();
    const route = useRoute<GoalInputScreenRouteProp>();
    const { goalId } = route.params || {};

    const [goal, setGoal] = useState('');
    const [date, setDate] = useState(() => {
        const d = new Date();
        d.setDate(d.getDate() + 1);
        return d;
    });
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [loading, setLoading] = useState(false);

    // Load existing goal if goalId is present
    React.useEffect(() => {
        if (goalId) {
            const loadGoal = async () => {
                const goals = await getGoals();
                const foundGoal = goals.find(g => g.id === goalId);
                if (foundGoal) {
                    setGoal(foundGoal.title);
                    setDate(new Date(foundGoal.deadline));
                    setCategory(foundGoal.category);

                    if (foundGoal.context) {
                        setContext(foundGoal.context);
                        setLoading(true);
                        try {
                            // Automatically start questionnaire if context exists
                            // Note: We use foundGoal values directly as state updates (setGoal, setDate) might not be immediate for use in this same function scope
                            generateQuestions(foundGoal.title, new Date(foundGoal.deadline), foundGoal.context)
                                .then(generatedQuestions => {
                                    setQuestions(generatedQuestions);
                                    setMode('questionnaire');
                                    setLoading(false);
                                })
                                .catch(error => {
                                    console.error(error);
                                    setLoading(false);
                                    setMode('context-input'); // Fallback
                                });
                        } catch (e) {
                            setLoading(false);
                            setMode('context-input');
                        }
                    } else {
                        setMode('context-input');
                    }
                }
            };
            loadGoal();
        }
    }, [goalId]);

    // Questionnaire state
    const [mode, setMode] = useState<'input' | 'context-input' | 'questionnaire' | 'review' | 'review-subtasks'>('input');
    const [context, setContext] = useState('');
    const [questions, setQuestions] = useState<string[]>([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [currentAnswer, setCurrentAnswer] = useState('');
    const [answers, setAnswers] = useState<{ question: string; answer: string }[]>([]);

    // Review state
    const [milestones, setMilestones] = useState<Step[]>([]);
    const [proposedSteps, setProposedSteps] = useState<Step[]>([]);
    const [category, setCategory] = useState<SlotCategory | undefined>(undefined);
    const [editingStep, setEditingStep] = useState<Step | null>(null);
    const [datePickerTarget, setDatePickerTarget] = useState<'goal' | 'step'>('goal');

    const handleDateSelect = (selectedDate: Date) => {
        if (datePickerTarget === 'goal') {
            setDate(selectedDate);
        } else if (editingStep) {
            handleUpdateStep({ ...editingStep, date: selectedDate });
        }
        setShowDatePicker(false);
    };

    const startQuestionnaire = async () => {
        if (!goal) return;
        setLoading(true);
        try {
            const generatedQuestions = await generateQuestions(goal, date, context);
            setQuestions(generatedQuestions);
            setMode('questionnaire');
        } catch (error) {
            console.error(error);
            // Fallback to direct generation if questions fail
            await handleSubmit([]);
        } finally {
            setLoading(false);
        }
    };

    const handleNextQuestion = async () => {
        const newAnswers = [...answers, { question: questions[currentQuestionIndex], answer: currentAnswer }];
        setAnswers(newAnswers);
        setCurrentAnswer('');

        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(currentQuestionIndex + 1);
        } else {
            await handleSubmit(newAnswers);
        }
    };

    const handleSubmit = async (collectedAnswers: { question: string; answer: string }[]) => {
        setLoading(true);
        try {
            const { steps, category: generatedCategory } = await generateSteps(goal, date, collectedAnswers, context);

            // Assign temporary IDs if needed, but generateSteps already does it
            setProposedSteps(steps);
            setCategory(generatedCategory);
            setMode('review');
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
        setDatePickerTarget('step');
        setShowDatePicker(true);
    };

    const handleConfirmPlan = async () => {
        if (mode === 'review') {
            // Stage 1: Milestones validated.
            // Now, trigger detailed split for the FIRST milestone.
            if (proposedSteps.length === 0) {
                // If no milestones, just save (empty plan?).
                await saveFinalPlan(proposedSteps);
                return;
            }

            setLoading(true);
            try {
                // Save the current state of milestones (user might have edited titles/dates)
                setMilestones(proposedSteps);

                const firstMilestone = proposedSteps[0];

                // Call AI to split the first milestone
                const subtasks = await splitMilestone(
                    firstMilestone.title,
                    firstMilestone.description || '',
                    firstMilestone.estimatedMinutes || 60,
                    category || ' WORK ',
                    firstMilestone.id, // Parent ID
                    'ai',
                    firstMilestone.effort || 2
                );

                setProposedSteps(subtasks);
                setMode('review-subtasks');
            } catch (error) {
                console.error("Failed to split milestone:", error);
                // Fallback: If split fails, just proceed to save the milestones as is?
                // Or show error? Let's assume we proceed without splitting if AI fails, 
                // or we could retry. For now, let's just proceed to save original milestones.
                Alert.alert('Error', 'Could not generate subtasks, saving milestones as is.');
                await saveFinalPlan(proposedSteps);
            } finally {
                setLoading(false);
            }

        } else if (mode === 'review-subtasks') {
            // Stage 2: First Milestone's subtasks validated.
            // Construct the final list.
            // Structure: [Milestone1, Subtask1.1, Subtask1.2, ..., Milestone2, Milestone3...]

            const firstMilestone = milestones[0];
            const remainingMilestones = milestones.slice(1);

            // Ensure subtasks have the correct parentId
            const validatedSubtasks = proposedSteps.map(s => ({
                ...s,
                parentId: firstMilestone.id
            }));

            const finalSteps = [
                firstMilestone,
                ...validatedSubtasks,
                ...remainingMilestones
            ];

            await saveFinalPlan(finalSteps);
        }
    };

    const saveFinalPlan = async (allSteps: Step[]) => {
        setLoading(true);
        try {
            const targetGoalId = goalId || uuidv4();

            if (!goalId) {
                // Create new goal if not editing existing
                const newGoal = {
                    id: targetGoalId,
                    title: goal,
                    deadline: date,
                    createdAt: new Date(),
                    isCompleted: false,
                    category: category,
                };
                await saveGoal(newGoal);
            } else {
                const goals = await getGoals();
                const foundGoal = goals.find(g => g.id === goalId);
                if (foundGoal) {
                    await updateGoal({ ...foundGoal, category: category || foundGoal.category });
                }
            }

            // Ensure all steps have the goalId
            const stepsWithGoalId = allSteps.map(s => ({ ...s, goalId: targetGoalId }));

            await saveSteps(stepsWithGoalId);

            if (goalId) {
                navigation.goBack();
            } else {
                navigation.navigate('Dashboard');
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Layout>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <ScrollView contentContainerStyle={styles.content}>
                    {mode === 'input' ? (
                        <>
                            <Typography variant="h1" color={colors.primary} style={styles.title}>
                                What is your vision?
                            </Typography>

                            <TextInput
                                placeholder="e.g. Run a marathon..."
                                placeholderTextColor={colors.textTertiary}
                                value={goal}
                                onChangeText={setGoal}
                                multiline
                                autoFocus
                                style={[styles.input, { color: colors.textPrimary }]}
                            />

                            <View style={styles.dateContainer}>
                                <Typography variant="caption" color={colors.textSecondary} style={styles.label}>
                                    DEADLINE
                                </Typography>
                                <Button
                                    title={date.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
                                    variant="secondary"
                                    onPress={() => {
                                        setDatePickerTarget('goal');
                                        setShowDatePicker(false); // Fix: logic seems to be to show it, but original code had setShowDatePicker(true). Wait, line 302 said true. I will keep logic but update color if needed.
                                        setShowDatePicker(true);
                                    }}
                                    style={[styles.dateButton, { backgroundColor: colors.surfaceHighlight }]}
                                />
                            </View>



                            <Button
                                title="Next"
                                onPress={() => setMode('context-input')}
                                disabled={!goal}
                                fullWidth
                                style={styles.submitButton}
                            />
                        </>
                    ) : mode === 'context-input' ? (
                        <>
                            <Typography variant="h1" color={colors.primary} style={styles.title}>
                                {goalId ? `Planning: ${goal}` : "Any specific context?"}
                            </Typography>

                            <Typography variant="body" color={colors.textSecondary} style={{ marginBottom: SPACING.l }}>
                                Add constraints, preferences, or details (e.g. "Budget is $500", "I'm a beginner"). Optional.
                            </Typography>

                            <Input
                                placeholder="e.g. I have 1 hour per day..."
                                value={context}
                                onChangeText={setContext}
                                multiline
                                autoFocus
                                style={[styles.input, { color: colors.textPrimary }]}
                            />

                            <Button
                                title="Generate Questions"
                                onPress={startQuestionnaire}
                                loading={loading}
                                fullWidth
                                style={styles.submitButton}
                            />
                        </>
                    ) : mode === 'questionnaire' ? (
                        <>
                            <Typography variant="caption" color={colors.textSecondary} style={styles.label}>
                                QUESTION {currentQuestionIndex + 1} OF {questions.length}
                            </Typography>

                            <Typography variant="h2" color={colors.primary} style={styles.title}>
                                {questions[currentQuestionIndex]}
                            </Typography>

                            <Input
                                placeholder="Type your answer..."
                                value={currentAnswer}
                                onChangeText={setCurrentAnswer}
                                multiline
                                autoFocus
                                style={[styles.input, { color: colors.textPrimary }]}
                            />

                            <Button
                                title={currentQuestionIndex === questions.length - 1 ? "Generate Tasks" : "Next"}
                                onPress={handleNextQuestion}
                                loading={loading}
                                disabled={!currentAnswer || loading}
                                fullWidth
                                style={styles.submitButton}
                            />
                        </>
                    ) : (
                        <>
                            <Typography variant="h2" color={colors.primary} style={styles.title}>
                                Review {mode === 'review-subtasks' ? `Subtasks for "${milestones[0]?.title}"` : 'your plan'}
                            </Typography>
                            <Typography variant="body" color={colors.textSecondary} style={{ marginBottom: SPACING.l }}>
                                {mode === 'review-subtasks'
                                    ? "These are the immediate next steps."
                                    : "Review, edit, or remove major milestones before finalizing."
                                }
                            </Typography>

                            <TaskReviewList
                                steps={proposedSteps}
                                onUpdateStep={handleUpdateStep}
                                onDeleteStep={handleDeleteStep}
                                onEditDate={handleEditDate}
                            />

                            <Button
                                title={mode === 'review-subtasks' ? "Confirm & Launch" : "Validate Milestones"}
                                onPress={handleConfirmPlan}
                                loading={loading}
                                fullWidth
                                style={styles.submitButton}
                            />
                        </>
                    )}

                    <DatePickerModal
                        visible={showDatePicker}
                        onClose={() => setShowDatePicker(false)}
                        onSelect={handleDateSelect}
                        initialDate={datePickerTarget === 'goal' ? date : (editingStep?.date || new Date())}
                        title={datePickerTarget === 'goal' ? "Set Goal Deadline" : "Set Step Deadline"}
                    />
                </ScrollView>
            </KeyboardAvoidingView>
        </Layout >
    );
};

const styles = StyleSheet.create({
    keyboardView: {
        flex: 1,
    },
    content: {
        flexGrow: 1,
        justifyContent: 'center',
        paddingVertical: SPACING.xl,
        paddingHorizontal: SPACING.l,
        paddingBottom: 200, // Ensure space for keyboard/buttons
    },
    title: {
        marginBottom: SPACING.xl,
        textAlign: 'center',
    },
    input: {
        marginBottom: SPACING.xl,
        minHeight: 120,
        maxHeight: 300,
        textAlignVertical: 'top',
        fontSize: 32,
        fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
        fontWeight: '300',
        // color: COLORS.textPrimary, // Handled inline
        textAlign: 'center',
        backgroundColor: 'transparent',
        borderWidth: 0,
        padding: 0,
    },
    dateContainer: {
        marginBottom: SPACING.xxl,
        alignItems: 'center',
    },
    label: {
        marginBottom: SPACING.s,
        letterSpacing: 2,
        opacity: 0.7,
    },
    dateButton: {
        alignSelf: 'center',
        // backgroundColor: COLORS.surfaceHighlight, // Handled inline
        paddingHorizontal: SPACING.l,
        borderRadius: 100,
    },
    submitButton: {
        marginTop: SPACING.l,
    },
});

export default GoalInputScreen;

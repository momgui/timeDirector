import React, { useState } from 'react';
import { View, StyleSheet, Platform, KeyboardAvoidingView, ScrollView, TextInput } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { DatePickerModal } from '../components/DatePickerModal';
import { RootStackParamList, Step, SlotCategory } from '../types';
import { generateSteps, generateQuestions, generateSubtasks } from '../services/ai';
import { saveGoal, saveSteps, getGoals, updateGoal } from '../services/storage';
import { v4 as uuidv4 } from 'uuid';
import 'react-native-get-random-values';
import { Layout } from '../design-system/components/Layout';
import { Typography } from '../design-system/components/Typography';
import { Input } from '../design-system/components/Input';
import { Button } from '../design-system/components/Button';
import { TaskReviewList } from '../components/TaskReviewList';
import { COLORS, SPACING } from '../design-system/tokens';

import { RouteProp, useRoute } from '@react-navigation/native';

type GoalInputScreenRouteProp = RouteProp<RootStackParamList, 'GoalInput'>;

type GoalInputScreenProps = {
    navigation: NativeStackNavigationProp<RootStackParamList, 'GoalInput'>;
};

const GoalInputScreen: React.FC<GoalInputScreenProps> = ({ navigation }) => {
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
    const [mode, setMode] = useState<'input' | 'context-input' | 'questionnaire' | 'review'>('input');
    const [context, setContext] = useState('');
    const [questions, setQuestions] = useState<string[]>([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [currentAnswer, setCurrentAnswer] = useState('');
    const [answers, setAnswers] = useState<{ question: string; answer: string }[]>([]);

    // Review state
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
            const { steps, category: generatedCategory } = await generateSteps(goal, date, collectedAnswers, context, false);

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
                // Update existing goal deadline/title if changed?
                // For now, assume we just want to add steps. 
                // But maybe we should update the goal details too.
                const goals = await getGoals();
                const foundGoal = goals.find(g => g.id === goalId);
                if (foundGoal) {
                    await updateGoal({ ...foundGoal, category: category || foundGoal.category });
                }
            }

            // Generate subtasks for each milestone
            const allSteps: Step[] = [];

            for (const milestone of proposedSteps) {
                // Add the milestone itself
                allSteps.push({ ...milestone, goalId: targetGoalId });

                // Generate subtasks
                try {
                    const subtasks = await generateSubtasks(
                        milestone.title,
                        milestone.description || '',
                        milestone.estimatedMinutes || 60,
                        milestone.id,
                        category || ' WORK '
                    );

                    // Add subtasks with goalId
                    allSteps.push(...subtasks.map(s => ({ ...s, goalId: targetGoalId })));
                } catch (err) {
                    console.error('Failed to generate subtasks for milestone:', milestone.title, err);
                }
            }

            // We append steps. 
            // NOTE: saveSteps typically appends to the list in storage.
            await saveSteps(allSteps);

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
                            <Typography variant="h1" color={COLORS.primary} style={styles.title}>
                                What is your vision?
                            </Typography>

                            <TextInput
                                placeholder="e.g. Run a marathon..."
                                placeholderTextColor={COLORS.textTertiary}
                                value={goal}
                                onChangeText={setGoal}
                                multiline
                                autoFocus
                                style={styles.input}
                            />

                            <View style={styles.dateContainer}>
                                <Typography variant="caption" color={COLORS.textSecondary} style={styles.label}>
                                    DEADLINE
                                </Typography>
                                <Button
                                    title={date.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
                                    variant="secondary"
                                    onPress={() => {
                                        setDatePickerTarget('goal');
                                        setShowDatePicker(true);
                                    }}
                                    style={styles.dateButton}
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
                            <Typography variant="h1" color={COLORS.primary} style={styles.title}>
                                {goalId ? `Planning: ${goal}` : "Any specific context?"}
                            </Typography>

                            <Typography variant="body" color={COLORS.textSecondary} style={{ marginBottom: SPACING.l }}>
                                Add constraints, preferences, or details (e.g. "Budget is $500", "I'm a beginner"). Optional.
                            </Typography>

                            <Input
                                placeholder="e.g. I have 1 hour per day..."
                                value={context}
                                onChangeText={setContext}
                                multiline
                                autoFocus
                                style={styles.input}
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
                            <Typography variant="caption" color={COLORS.textSecondary} style={styles.label}>
                                QUESTION {currentQuestionIndex + 1} OF {questions.length}
                            </Typography>

                            <Typography variant="h2" color={COLORS.primary} style={styles.title}>
                                {questions[currentQuestionIndex]}
                            </Typography>

                            <Input
                                placeholder="Type your answer..."
                                value={currentAnswer}
                                onChangeText={setCurrentAnswer}
                                multiline
                                autoFocus
                                style={styles.input}
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
                            <Typography variant="h2" color={COLORS.primary} style={styles.title}>
                                Review your plan
                            </Typography>
                            <Typography variant="body" color={COLORS.textSecondary} style={{ marginBottom: SPACING.l }}>
                                Review, edit, or remove tasks before finalizing.
                            </Typography>

                            <TaskReviewList
                                steps={proposedSteps}
                                onUpdateStep={handleUpdateStep}
                                onDeleteStep={handleDeleteStep}
                                onEditDate={handleEditDate}
                            />

                            <Button
                                title="Confirm Plan"
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
        color: COLORS.textPrimary,
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
        backgroundColor: COLORS.surfaceHighlight,
        paddingHorizontal: SPACING.l,
        borderRadius: 100,
    },
    submitButton: {
        marginTop: SPACING.l,
    },
});

export default GoalInputScreen;

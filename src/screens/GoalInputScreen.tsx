import React, { useState } from 'react';
import { View, StyleSheet, Platform, KeyboardAvoidingView, ScrollView } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { generateSteps, generateQuestions } from '../services/ai';
import { saveGoal, saveSteps } from '../services/storage';
import { v4 as uuidv4 } from 'uuid';
import 'react-native-get-random-values';
import { Layout } from '../design-system/components/Layout';
import { Typography } from '../design-system/components/Typography';
import { Input } from '../design-system/components/Input';
import { Button } from '../design-system/components/Button';
import { COLORS, SPACING } from '../design-system/tokens';

type GoalInputScreenProps = {
    navigation: NativeStackNavigationProp<RootStackParamList, 'GoalInput'>;
};

const GoalInputScreen: React.FC<GoalInputScreenProps> = ({ navigation }) => {
    const [goal, setGoal] = useState('');
    const [date, setDate] = useState(() => {
        const d = new Date();
        d.setDate(d.getDate() + 1);
        return d;
    });
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [loading, setLoading] = useState(false);

    // Questionnaire state
    const [mode, setMode] = useState<'input' | 'questionnaire'>('input');
    const [questions, setQuestions] = useState<string[]>([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [currentAnswer, setCurrentAnswer] = useState('');
    const [answers, setAnswers] = useState<{ question: string; answer: string }[]>([]);

    const handleDateChange = (event: any, selectedDate?: Date) => {
        const currentDate = selectedDate || date;
        setShowDatePicker(Platform.OS === 'ios');
        setDate(currentDate);
    };

    const startQuestionnaire = async () => {
        if (!goal) return;
        setLoading(true);
        try {
            const generatedQuestions = await generateQuestions(goal, date);
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
            const steps = await generateSteps(goal, date, collectedAnswers);

            const newGoal = {
                id: uuidv4(),
                title: goal,
                deadline: date,
                createdAt: new Date(),
                isCompleted: false,
            };

            const stepsWithGoalId = steps.map((s: any) => ({ ...s, goalId: newGoal.id }));

            await saveGoal(newGoal);
            await saveSteps(stepsWithGoalId);

            navigation.navigate('Dashboard');
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

                            <Input
                                placeholder="e.g. Run a marathon..."
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
                                    title={date.toLocaleDateString()}
                                    variant="secondary"
                                    onPress={() => setShowDatePicker(true)}
                                    style={styles.dateButton}
                                />
                            </View>

                            {showDatePicker && (
                                <DateTimePicker
                                    value={date}
                                    mode="date"
                                    display="default"
                                    onChange={handleDateChange}
                                    minimumDate={new Date(Date.now() + 86400000)}
                                    themeVariant="dark"
                                />
                            )}

                            <Button
                                title="Generate Plan"
                                onPress={startQuestionnaire}
                                loading={loading}
                                disabled={!goal || loading}
                                fullWidth
                                style={styles.submitButton}
                            />
                        </>
                    ) : (
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
                    )}
                </ScrollView>
            </KeyboardAvoidingView>
        </Layout>
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
    },
    title: {
        marginBottom: SPACING.l,
    },
    input: {
        marginBottom: SPACING.xl,
        minHeight: 100,
        textAlignVertical: 'top',
        fontSize: 24,
    },
    dateContainer: {
        marginBottom: SPACING.xxl,
    },
    label: {
        marginBottom: SPACING.s,
        letterSpacing: 1,
    },
    dateButton: {
        alignSelf: 'flex-start',
    },
    submitButton: {
        marginTop: 'auto',
    },
});

export default GoalInputScreen;

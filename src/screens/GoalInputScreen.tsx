import React, { useState } from 'react';
import { View, StyleSheet, Platform, KeyboardAvoidingView, ScrollView } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { generateSteps } from '../services/ai';
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
    const [date, setDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleDateChange = (event: any, selectedDate?: Date) => {
        const currentDate = selectedDate || date;
        setShowDatePicker(Platform.OS === 'ios');
        setDate(currentDate);
    };

    const handleSubmit = async () => {
        if (!goal) return;
        setLoading(true);
        try {
            const steps = await generateSteps(goal, date);

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
                            minimumDate={new Date()}
                            themeVariant="dark"
                        />
                    )}

                    <Button
                        title="Generate Plan"
                        onPress={handleSubmit}
                        loading={loading}
                        disabled={!goal || loading}
                        fullWidth
                        style={styles.submitButton}
                    />
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

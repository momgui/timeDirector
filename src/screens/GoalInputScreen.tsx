import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { generateSteps } from '../services/ai';
import { saveGoal, saveSteps } from '../services/storage';
import { v4 as uuidv4 } from 'uuid';
import 'react-native-get-random-values';

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
            // Call AI service to generate steps
            const steps = await generateSteps(goal, date);

            const newGoal = {
                id: uuidv4(),
                title: goal,
                deadline: date,
                createdAt: new Date(),
                isCompleted: false,
            };

            // Assign goalId to steps
            const stepsWithGoalId = steps.map((s: any) => ({ ...s, goalId: newGoal.id }));

            await saveGoal(newGoal);
            await saveSteps(stepsWithGoalId);

            console.log('Generated steps:', stepsWithGoalId);
            navigation.navigate('Dashboard');
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.label}>What is your goal?</Text>
            <TextInput
                style={styles.input}
                placeholder="e.g. Learn React Native"
                value={goal}
                onChangeText={setGoal}
            />

            <Text style={styles.label}>When do you want to achieve it?</Text>
            <Button onPress={() => setShowDatePicker(true)} title={date.toLocaleDateString()} />

            {showDatePicker && (
                <DateTimePicker
                    value={date}
                    mode="date"
                    display="default"
                    onChange={handleDateChange}
                    minimumDate={new Date()}
                />
            )}

            <View style={styles.buttonContainer}>
                <Button title={loading ? "Generating Plan..." : "Create Plan"} onPress={handleSubmit} disabled={loading} />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#fff',
    },
    label: {
        fontSize: 18,
        fontWeight: 'bold',
        marginTop: 20,
        marginBottom: 10,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        padding: 10,
        borderRadius: 5,
        fontSize: 16,
    },
    buttonContainer: {
        marginTop: 40,
    },
});

export default GoalInputScreen;

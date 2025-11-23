import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Button, FlatList, TouchableOpacity, ScrollView } from 'react-native';
import { signOut } from '../services/auth';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, Goal, Step } from '../types';
import { getGoals, getSteps, updateStep } from '../services/storage';
import { useIsFocused } from '@react-navigation/native';

type DashboardScreenProps = {
    navigation: NativeStackNavigationProp<RootStackParamList, 'Dashboard'>;
};

const DashboardScreen: React.FC<DashboardScreenProps> = ({ navigation }) => {
    const [goals, setGoals] = useState<Goal[]>([]);
    const [steps, setSteps] = useState<Step[]>([]);
    const isFocused = useIsFocused();

    useEffect(() => {
        if (isFocused) {
            loadData();
        }
    }, [isFocused]);

    const loadData = async () => {
        const loadedGoals = await getGoals();
        const loadedSteps = await getSteps();
        setGoals(loadedGoals);
        setSteps(loadedSteps);
    };

    const handleSignOut = async () => {
        await signOut();
        navigation.replace('Login');
    };

    const toggleStep = async (step: Step) => {
        const updatedStep = { ...step, isCompleted: !step.isCompleted };
        await updateStep(updatedStep);
        loadData();
    };

    const renderStep = ({ item }: { item: Step }) => (
        <TouchableOpacity onPress={() => toggleStep(item)} style={styles.stepItem}>
            <View style={[styles.checkbox, item.isCompleted && styles.checked]} />
            <View style={styles.stepContent}>
                <Text style={[styles.stepTitle, item.isCompleted && styles.completedText]}>{item.title}</Text>
                <Text style={styles.stepDate}>{new Date(item.date).toLocaleDateString()}</Text>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>My Goals</Text>
                <Button title="New Goal" onPress={() => navigation.navigate('GoalInput')} />
            </View>

            <View style={styles.goalsContainer}>
                {goals.length === 0 ? (
                    <Text style={styles.emptyText}>No goals yet. Create one!</Text>
                ) : (
                    <FlatList
                        data={goals}
                        keyExtractor={item => item.id}
                        renderItem={({ item }) => {
                            const goalSteps = steps.filter(s => s.goalId === item.id);
                            const completedSteps = goalSteps.filter(s => s.isCompleted).length;
                            const progress = goalSteps.length > 0 ? completedSteps / goalSteps.length : 0;

                            return (
                                <View style={styles.goalItem}>
                                    <View style={styles.goalHeader}>
                                        <Text style={styles.goalTitle}>{item.title}</Text>
                                        <Text style={styles.goalDate}>Deadline: {new Date(item.deadline).toLocaleDateString()}</Text>
                                    </View>
                                    <View style={styles.progressBarContainer}>
                                        <View style={[styles.progressBar, { width: `${progress * 100}%` }]} />
                                    </View>
                                    <Text style={styles.progressText}>{Math.round(progress * 100)}% Completed</Text>
                                </View>
                            );
                        }}
                    />
                )}
            </View>

            <Text style={styles.sectionTitle}>Upcoming Steps</Text>
            <FlatList
                data={steps.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())}
                keyExtractor={item => item.id}
                renderItem={renderStep}
                style={styles.stepsList}
            />

            <Button title="Logout" onPress={handleSignOut} color="red" />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#f5f5f5',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
        marginTop: 40,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginTop: 20,
        marginBottom: 10,
    },
    goalsContainer: {
        maxHeight: 150,
        marginBottom: 10,
    },
    goalItem: {
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 10,
        marginBottom: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    goalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    goalTitle: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    goalDate: {
        fontSize: 12,
        color: '#666',
    },
    progressBarContainer: {
        height: 10,
        backgroundColor: '#e0e0e0',
        borderRadius: 5,
        overflow: 'hidden',
        marginBottom: 5,
    },
    progressBar: {
        height: '100%',
        backgroundColor: '#4caf50',
    },
    progressText: {
        fontSize: 12,
        color: '#666',
        textAlign: 'right',
    },
    emptyText: {
        fontStyle: 'italic',
        color: '#888',
    },
    stepsList: {
        flex: 1,
    },
    stepItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 10,
        marginBottom: 10,
    },
    checkbox: {
        width: 24,
        height: 24,
        borderWidth: 2,
        borderColor: '#007AFF',
        borderRadius: 12,
        marginRight: 15,
    },
    checked: {
        backgroundColor: '#007AFF',
    },
    stepContent: {
        flex: 1,
    },
    stepTitle: {
        fontSize: 16,
    },
    stepDate: {
        fontSize: 12,
        color: '#666',
    },
    completedText: {
        textDecorationLine: 'line-through',
        color: '#aaa',
    },
});

export default DashboardScreen;

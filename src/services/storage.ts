import AsyncStorage from '@react-native-async-storage/async-storage';
import { Goal, Step } from '../types';

const GOALS_KEY = 'goals';
const STEPS_KEY = 'steps';

export const saveGoal = async (goal: Goal) => {
    try {
        const storedGoals = await getGoals();
        const updatedGoals = [...storedGoals, goal];
        await AsyncStorage.setItem(GOALS_KEY, JSON.stringify(updatedGoals));
    } catch (error) {
        console.error('Error saving goal:', error);
    }
};

export const getGoals = async (): Promise<Goal[]> => {
    try {
        const jsonValue = await AsyncStorage.getItem(GOALS_KEY);
        return jsonValue != null ? JSON.parse(jsonValue) : [];
    } catch (error) {
        console.error('Error getting goals:', error);
        return [];
    }
};

export const saveSteps = async (newSteps: Step[]) => {
    try {
        const storedSteps = await getSteps();
        const updatedSteps = [...storedSteps, ...newSteps];
        await AsyncStorage.setItem(STEPS_KEY, JSON.stringify(updatedSteps));
    } catch (error) {
        console.error('Error saving steps:', error);
    }
};

export const getSteps = async (): Promise<Step[]> => {
    try {
        const jsonValue = await AsyncStorage.getItem(STEPS_KEY);
        return jsonValue != null ? JSON.parse(jsonValue) : [];
    } catch (error) {
        console.error('Error getting steps:', error);
        return [];
    }
};

export const updateStep = async (updatedStep: Step) => {
    try {
        const storedSteps = await getSteps();
        const newSteps = storedSteps.map(step =>
            step.id === updatedStep.id ? updatedStep : step
        );
        await AsyncStorage.setItem(STEPS_KEY, JSON.stringify(newSteps));
    } catch (error) {
        console.error('Error updating step:', error);
    }
};

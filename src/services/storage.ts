import AsyncStorage from '@react-native-async-storage/async-storage';
import { Goal, Step, WeeklySchedule } from '../types';

const GOALS_KEY = 'goals';
const STEPS_KEY = 'steps';
const AVAILABILITY_KEY = 'availability';

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

export const deleteGoal = async (goalId: string) => {
    try {
        const storedGoals = await getGoals();
        const updatedGoals = storedGoals.filter(g => g.id !== goalId);
        await AsyncStorage.setItem(GOALS_KEY, JSON.stringify(updatedGoals));

        // Cascade delete steps
        const storedSteps = await getSteps();
        const updatedSteps = storedSteps.filter(s => s.goalId !== goalId);
        await AsyncStorage.setItem(STEPS_KEY, JSON.stringify(updatedSteps));
    } catch (error) {
        console.error('Error deleting goal:', error);
    }
};

export const updateGoal = async (updatedGoal: Goal) => {
    try {
        const storedGoals = await getGoals();
        const newGoals = storedGoals.map(goal =>
            goal.id === updatedGoal.id ? updatedGoal : goal
        );
        await AsyncStorage.setItem(GOALS_KEY, JSON.stringify(newGoals));
    } catch (error) {
        console.error('Error updating goal:', error);
    }
};

export const deleteStep = async (stepId: string) => {
    try {
        const storedSteps = await getSteps();
        const updatedSteps = storedSteps.filter(s => s.id !== stepId);
        await AsyncStorage.setItem(STEPS_KEY, JSON.stringify(updatedSteps));
    } catch (error) {
        console.error('Error deleting step:', error);
    }
};

export const addResourceToGoal = async (goalId: string, resource: any) => {
    try {
        const storedGoals = await getGoals();
        const goalIndex = storedGoals.findIndex(g => g.id === goalId);
        if (goalIndex >= 0) {
            const goal = storedGoals[goalIndex];
            const updatedGoal = {
                ...goal,
                resources: [...(goal.resources || []), resource]
            };
            storedGoals[goalIndex] = updatedGoal;
            await AsyncStorage.setItem(GOALS_KEY, JSON.stringify(storedGoals));
        }
    } catch (error) {
        console.error('Error adding resource:', error);
    }
};

export const deleteResourceFromGoal = async (goalId: string, resourceId: string) => {
    try {
        const storedGoals = await getGoals();
        const goalIndex = storedGoals.findIndex(g => g.id === goalId);
        if (goalIndex >= 0) {
            const goal = storedGoals[goalIndex];
            if (goal.resources) {
                const updatedGoal = {
                    ...goal,
                    resources: goal.resources.filter(r => r.id !== resourceId)
                };
                storedGoals[goalIndex] = updatedGoal;
                await AsyncStorage.setItem(GOALS_KEY, JSON.stringify(storedGoals));
            }
        }
    } catch (error) {
        console.error('Error deleting resource:', error);
    }
};

export const saveAvailability = async (schedule: WeeklySchedule) => {
    try {
        await AsyncStorage.setItem(AVAILABILITY_KEY, JSON.stringify(schedule));
    } catch (error) {
        console.error('Error saving availability:', error);
    }
};

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const DEFAULT_SCHEDULE: WeeklySchedule = DAYS.reduce((acc, day) => {
    acc[day] = {
        isWorkDay: true,
        slots: [
            { start: '09:00', end: '24:00', category: 'ANYTHING' }
        ]
    };
    return acc;
}, {} as WeeklySchedule);

export const getAvailability = async (): Promise<WeeklySchedule> => {
    try {
        const jsonValue = await AsyncStorage.getItem(AVAILABILITY_KEY);
        if (jsonValue != null) {
            const schedule = JSON.parse(jsonValue);

            // Check if schedule is truly empty (no keys) or effectively empty (no slots)
            const hasSlots = Object.values(schedule).some((day: any) =>
                day.isWorkDay && day.slots && day.slots.length > 0
            );

            if (Object.keys(schedule).length === 0 || !hasSlots) {
                return DEFAULT_SCHEDULE;
            }
            return schedule;
        }
        return DEFAULT_SCHEDULE;
    } catch (error) {
        console.error('Error getting availability:', error);
        return DEFAULT_SCHEDULE;
    }
};

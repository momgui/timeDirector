import AsyncStorage from '@react-native-async-storage/async-storage';
import { Goal, Step, WeeklySchedule } from '../types';
import { supabase } from './supabase';

const GOALS_KEY = 'goals';
const STEPS_KEY = 'steps';
const AVAILABILITY_KEY = 'availability';

/**
 * Helper to sync a single goal to Supabase
 */
const syncGoalToSupabase = async (goal: Goal) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    try {
        const { error } = await supabase
            .from('goals')
            .upsert({
                id: goal.id,
                user_id: session.user.id,
                title: goal.title,
                deadline: goal.deadline.toISOString(),
                created_at: goal.createdAt.toISOString(),
                is_completed: goal.isCompleted,
                category: goal.category,
                context: goal.context,
                resources: goal.resources,
            });

        if (error) console.error('Supabase Goal Sync Error:', error);
    } catch (err) {
        console.error('Supabase Goal Sync Exception:', err);
    }
};

/**
 * Helper to sync steps to Supabase
 */
const syncStepsToSupabase = async (steps: Step[]) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    try {
        const payload = steps.map(step => ({
            id: step.id,
            user_id: session.user.id,
            goal_id: step.goalId,
            title: step.title,
            description: step.description,
            date: step.date?.toISOString(),
            scheduled_date: step.scheduledDate?.toISOString(),
            sequence_order: step.sequenceOrder,
            is_completed: step.isCompleted,
            effort: step.effort,
            estimated_minutes: step.estimatedMinutes,
            category: step.category,
            is_milestone: step.isMilestone,
            parent_id: step.parentId,
            is_habit: step.isHabit,
            habit_days_of_week: step.habitDaysOfWeek,
            current_streak: step.currentStreak,
            last_completed_date: step.lastCompletedDate?.toISOString(),
        }));

        const { error } = await supabase
            .from('steps')
            .upsert(payload);

        if (error) console.error('Supabase Steps Sync Error:', error);
    } catch (err) {
        console.error('Supabase Steps Sync Exception:', err);
    }
};

/**
 * Sync availability and profile info to Supabase
 */
export const syncProfileToSupabase = async (profileData?: { profile?: string; mainGoal?: string; availability?: WeeklySchedule }) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    try {
        const payload: any = {
            id: session.user.id,
            updated_at: new Date().toISOString(),
        };

        if (profileData?.availability) payload.availability = profileData.availability;
        if (profileData?.profile) payload.profile_type = profileData.profile;
        if (profileData?.mainGoal) payload.main_goal = profileData.mainGoal;

        const { error } = await supabase
            .from('profiles')
            .upsert(payload);

        if (error) console.error('Supabase Profile Sync Error:', error);
    } catch (err) {
        console.error('Supabase Profile Sync Exception:', err);
    }
};

const syncAvailabilityToSupabase = async (schedule: WeeklySchedule) => {
    await syncProfileToSupabase({ availability: schedule });
};

/**
 * Pull all data from Supabase and update local storage
 */
export const pullFromSupabase = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    try {
        // 1. Pull Goals
        const { data: goals, error: goalsError } = await supabase
            .from('goals')
            .select('*')
            .eq('user_id', session.user.id);
        
        if (goals && !goalsError) {
            const formattedGoals: Goal[] = goals.map((g: any) => ({
                id: g.id,
                title: g.title,
                deadline: new Date(g.deadline),
                createdAt: new Date(g.created_at),
                isCompleted: g.is_completed,
                category: g.category,
                context: g.context,
                resources: g.resources,
            }));
            await AsyncStorage.setItem(GOALS_KEY, JSON.stringify(formattedGoals));
        }

        // 2. Pull Steps
        const { data: steps, error: stepsError } = await supabase
            .from('steps')
            .select('*')
            .eq('user_id', session.user.id);

        if (steps && !stepsError) {
            const formattedSteps: Step[] = steps.map((s: any) => ({
                id: s.id,
                goalId: s.goal_id,
                title: s.title,
                description: s.description,
                date: s.date ? new Date(s.date) : undefined,
                scheduledDate: s.scheduled_date ? new Date(s.scheduled_date) : undefined,
                sequenceOrder: s.sequence_order,
                isCompleted: s.is_completed,
                effort: s.effort,
                estimatedMinutes: s.estimated_minutes,
                category: s.category,
                isMilestone: s.is_milestone,
                parentId: s.parent_id,
                isHabit: s.is_habit,
                habitDaysOfWeek: s.habit_days_of_week,
                currentStreak: s.current_streak,
                lastCompletedDate: s.last_completed_date ? new Date(s.last_completed_date) : undefined,
            }));
            await AsyncStorage.setItem(STEPS_KEY, JSON.stringify(formattedSteps));
        }

        // 3. Pull Availability/Profile
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

        if (profile && !profileError) {
            if (profile.availability) {
                await AsyncStorage.setItem(AVAILABILITY_KEY, JSON.stringify(profile.availability));
            }
            if (profile.profile_type) {
                await AsyncStorage.setItem('USER_PROFILE', profile.profile_type);
            }
            if (profile.main_goal) {
                await AsyncStorage.setItem('USER_MAIN_GOAL', profile.main_goal);
            }
            
            // If they have a profile, they have onboarded
            await AsyncStorage.setItem('HAS_COMPLETED_ONBOARDING', 'true');
            console.log('[Storage] Onboarding state restored from Supabase');
        } else if (goals && goals.length > 0) {
            // Even if no profile, if they have goals, they must have onboarded
            await AsyncStorage.setItem('HAS_COMPLETED_ONBOARDING', 'true');
            console.log('[Storage] Onboarding state implied from existing goals');
        }

    } catch (err) {
        console.error('Supabase Pull Exception:', err);
    }
};

/**
 * Clear all local data from AsyncStorage
 */
export const clearLocalData = async () => {
    try {
        await AsyncStorage.removeItem(GOALS_KEY);
        await AsyncStorage.removeItem(STEPS_KEY);
        await AsyncStorage.removeItem(AVAILABILITY_KEY);
        await AsyncStorage.removeItem('HAS_COMPLETED_ONBOARDING');
        await AsyncStorage.removeItem('USER_PROFILE');
        await AsyncStorage.removeItem('USER_MAIN_GOAL');
    } catch (error) {
        console.error('Error clearing local data:', error);
    }
};

/**
 * Take current local data and push everything to Supabase (Migration)
 */
export const pushLocalDataToSupabase = async () => {
    try {
        const goals = await getGoals();
        const steps = await getSteps();
        const availability = await getAvailability();

        // Push Goals one by one or in batch if possible (our helper does it)
        for (const goal of goals) {
            await syncGoalToSupabase(goal);
        }

        // Push Steps in batch
        if (steps.length > 0) {
            await syncStepsToSupabase(steps);
        }

        // Push Availability
        await syncAvailabilityToSupabase(availability);
    } catch (error) {
        console.error('Error pushing local data to Supabase:', error);
    }
};

export const saveGoal = async (goal: Goal) => {
    try {
        const storedGoals = await getGoals();
        const updatedGoals = [...storedGoals, goal];
        await AsyncStorage.setItem(GOALS_KEY, JSON.stringify(updatedGoals));
        
        // Sync to cloud
        await syncGoalToSupabase(goal);
    } catch (error) {
        console.error('Error saving goal:', error);
    }
};

export const getGoals = async (): Promise<Goal[]> => {
    try {
        const jsonValue = await AsyncStorage.getItem(GOALS_KEY);
        if (jsonValue != null) {
            const parsed = JSON.parse(jsonValue);
            return parsed.map((g: any) => ({
                ...g,
                deadline: new Date(g.deadline),
                createdAt: new Date(g.createdAt),
                resources: g.resources?.map((r: any) => ({
                    ...r,
                    createdAt: new Date(r.createdAt)
                }))
            }));
        }
        return [];
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
        
        // Sync to cloud
        await syncStepsToSupabase(newSteps);
    } catch (error) {
        console.error('Error saving steps:', error);
    }
};

export const getSteps = async (): Promise<Step[]> => {
    try {
        const jsonValue = await AsyncStorage.getItem(STEPS_KEY);
        if (jsonValue != null) {
            const parsed = JSON.parse(jsonValue);
            return parsed.map((s: any) => ({
                ...s,
                date: s.date ? new Date(s.date) : undefined,
                scheduledDate: s.scheduledDate ? new Date(s.scheduledDate) : undefined,
                lastCompletedDate: s.lastCompletedDate ? new Date(s.lastCompletedDate) : undefined
            }));
        }
        return [];
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
        
        // Sync to cloud
        await syncStepsToSupabase([updatedStep]);
    } catch (error) {
        console.error('Error updating step:', error);
    }
};

export const deleteGoal = async (goalId: string) => {
    console.log(`[Storage] Deleting Goal: ${goalId}`);
    try {
        // 1. Local Delete (immediate for UI responsiveness)
        const storedGoals = await getGoals();
        const updatedGoals = storedGoals.filter(g => g.id !== goalId);
        await AsyncStorage.setItem(GOALS_KEY, JSON.stringify(updatedGoals));
        console.log(`[Storage] Local Goal Removed`);

        const storedSteps = await getSteps();
        const updatedSteps = storedSteps.filter(s => s.goalId !== goalId);
        await AsyncStorage.setItem(STEPS_KEY, JSON.stringify(updatedSteps));
        console.log(`[Storage] Local Steps Removed`);

        // 2. Sync to cloud
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
            console.log(`[Supabase] Syncing deletion for goal ${goalId}...`);
            
            // Delete steps first
            const { error: stepsError } = await supabase
                .from('steps')
                .delete()
                .eq('goal_id', goalId);
            
            if (stepsError) {
                console.error('[Supabase] Cascade Steps Delete Error:', stepsError);
            } else {
                console.log('[Supabase] Steps successfully deleted');
            }

            // Finally delete the goal
            const { error: goalError } = await supabase
                .from('goals')
                .delete()
                .eq('id', goalId);
            
            if (goalError) {
                console.error('[Supabase] Goal Delete Error:', goalError);
            } else {
                console.log('[Supabase] Goal successfully deleted');
            }
        } else {
            console.log('[Storage] No active session, skipping cloud sync');
        }
    } catch (error) {
        console.error('[Storage] Exception in deleteGoal:', error);
    }
};

export const updateGoal = async (updatedGoal: Goal) => {
    try {
        const storedGoals = await getGoals();
        const newGoals = storedGoals.map(goal =>
            goal.id === updatedGoal.id ? updatedGoal : goal
        );
        await AsyncStorage.setItem(GOALS_KEY, JSON.stringify(newGoals));
        
        // Sync to cloud
        await syncGoalToSupabase(updatedGoal);
    } catch (error) {
        console.error('Error updating goal:', error);
    }
};

export const deleteStep = async (stepId: string) => {
    console.log(`[Storage] Deleting Step: ${stepId}`);
    try {
        const storedSteps = await getSteps();
        // Remove the step itself AND any steps that are children of this step (milestones)
        const updatedSteps = storedSteps.filter(s => s.id !== stepId && s.parentId !== stepId);
        await AsyncStorage.setItem(STEPS_KEY, JSON.stringify(updatedSteps));
        console.log(`[Storage] Local Step Removed`);

        // Sync to cloud
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
            // Delete sub-steps first if any (milestone children)
            const { error: subStepsError } = await supabase.from('steps').delete().eq('parent_id', stepId);
            if (subStepsError) console.error('[Supabase] Sub-Steps Delete Error:', subStepsError);

            // Delete the step
            const { error: stepError } = await supabase.from('steps').delete().eq('id', stepId);
            if (stepError) console.error('[Supabase] Step Delete Error:', stepError);
            else console.log('[Supabase] Step successfully deleted');
        }
    } catch (error) {
        console.error('[Storage] Exception in deleteStep:', error);
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
        
        // Sync to cloud
        await syncAvailabilityToSupabase(schedule);
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

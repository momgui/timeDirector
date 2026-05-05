import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';
import NetInfo from '@react-native-community/netinfo';
import { Goal, Step } from '../types';

export const SYNC_QUEUE_KEY = 'sync_queue';
let isProcessing = false;

type SyncAction = 'upsert_goal' | 'upsert_steps' | 'delete_goal' | 'delete_step' | 'upsert_profile';

export interface SyncOperation {
    id: string;
    action: SyncAction;
    payload: any;
    timestamp: number;
}

export const addToSyncQueue = async (action: SyncAction, payload: any) => {
    try {
        const queueStr = await AsyncStorage.getItem(SYNC_QUEUE_KEY);
        const queue: SyncOperation[] = queueStr ? JSON.parse(queueStr) : [];
        
        // Anti-duplication logic: if there is already an operation for the same entity, replace it (for upsert)
        // Especially for steps and goals, to prevent the queue from growing indefinitely
        let shouldAdd = true;
        if (action === 'upsert_goal') {
            const existingIdx = queue.findIndex(op => op.action === 'upsert_goal' && op.payload.id === payload.id);
            if (existingIdx !== -1) {
                queue[existingIdx] = { ...queue[existingIdx], payload, timestamp: Date.now() };
                shouldAdd = false;
            }
        } else if (action === 'delete_goal') {
            const existingIdx = queue.findIndex(op => op.action === 'upsert_goal' && op.payload.id === payload);
            if (existingIdx !== -1) {
                 // if deleted, remove the upsert from queue
                 queue.splice(existingIdx, 1);
            }
        }
        
        if (shouldAdd) {
            queue.push({
                id: Date.now().toString() + Math.random().toString(),
                action,
                payload,
                timestamp: Date.now()
            });
        }

        await AsyncStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
        console.log(`[SyncManager] Added '${action}' to sync queue. Queue size: ${queue.length}`);
    } catch (e) {
        console.error('[SyncManager] Failed to add to sync queue', e);
    }
};

export const getSyncQueueSize = async (): Promise<number> => {
    try {
        const queueStr = await AsyncStorage.getItem(SYNC_QUEUE_KEY);
        const queue: SyncOperation[] = queueStr ? JSON.parse(queueStr) : [];
        return queue.length;
    } catch (e) {
        return 0;
    }
}

export const processSyncQueue = async () => {
    if (isProcessing) return;
    
    const state = await NetInfo.fetch();
    if (!state.isConnected) {
        return; // Cannot process while offline
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return; // Cannot sync without authentication session

    try {
        isProcessing = true;
        const queueStr = await AsyncStorage.getItem(SYNC_QUEUE_KEY);
        let queue: SyncOperation[] = queueStr ? JSON.parse(queueStr) : [];

        if (queue.length === 0) {
            return;
        }

        console.log(`[SyncManager] Empting Sync Queue (${queue.length} items)...`);
        
        // Sort by timestamp to ensure chronological updates
        queue.sort((a, b) => a.timestamp - b.timestamp);

        const failedProcessing: SyncOperation[] = [];

        for (const op of queue) {
            try {
                let error = null;
                switch (op.action) {
                    case 'upsert_goal': {
                        const goal = op.payload;
                        const { error: goalErr } = await supabase.from('goals').upsert({
                            id: goal.id,
                            user_id: session.user.id,
                            title: goal.title,
                            deadline: new Date(goal.deadline).toISOString(),
                            created_at: new Date(goal.createdAt).toISOString(),
                            is_completed: goal.isCompleted,
                            category: goal.category,
                            context: goal.context,
                            resources: goal.resources,
                        });
                        error = goalErr;
                        break;
                    }
                    case 'upsert_steps': {
                        const steps: Step[] = op.payload;
                        const payload = steps.map(step => ({
                            id: step.id,
                            user_id: session.user.id,
                            goal_id: step.goalId,
                            title: step.title,
                            description: step.description,
                            date: step.date ? new Date(step.date).toISOString() : null,
                            scheduled_date: step.scheduledDate ? new Date(step.scheduledDate).toISOString() : null,
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
                            target_streak: step.targetStreak,
                            total_completions: step.totalCompletions,
                            type: step.type,
                            last_completed_date: step.lastCompletedDate ? new Date(step.lastCompletedDate).toISOString() : null,
                        }));
                        const { error: stepsErr } = await supabase.from('steps').upsert(payload);
                        error = stepsErr;
                        break;
                    }
                    case 'delete_goal': {
                        const goalId = op.payload;
                        await supabase.from('steps').delete().eq('goal_id', goalId);
                        const { error: dGoalErr } = await supabase.from('goals').delete().eq('id', goalId);
                        error = dGoalErr;
                        break;
                    }
                    case 'delete_step': {
                        const stepId = op.payload;
                        await supabase.from('steps').delete().eq('parent_id', stepId);
                        const { error: dStepErr } = await supabase.from('steps').delete().eq('id', stepId);
                        error = dStepErr;
                        break;
                    }
                    case 'upsert_profile': {
                        const profileData = op.payload;
                        const profPayload: any = {
                            id: session.user.id,
                            updated_at: new Date().toISOString(),
                        };
                        if (profileData?.availability) profPayload.availability = profileData.availability;
                        if (profileData?.profile) profPayload.profile_type = profileData.profile;
                        if (profileData?.mainGoal) profPayload.main_goal = profileData.mainGoal;

                        const { error: profErr } = await supabase.from('profiles').upsert(profPayload);
                        error = profErr;
                        break;
                    }
                }

                if (error) {
                    console.error(`[SyncManager] Op failed: ${op.action}`, error);
                    failedProcessing.push(op);
                } else {
                    console.log(`[SyncManager] Op success: ${op.action}`);
                }
            } catch (err) {
                console.error(`[SyncManager] Op exception: ${op.action}`, err);
                failedProcessing.push(op);
            }
        }

        if (failedProcessing.length > 0) {
            await AsyncStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(failedProcessing));
            console.log(`[SyncManager] Sync completed with ${failedProcessing.length} failed items.`);
        } else {
            await AsyncStorage.removeItem(SYNC_QUEUE_KEY);
            console.log(`[SyncManager] Sync completed successfully. Queue is empty.`);
        }

    } finally {
        isProcessing = false;
    }
};

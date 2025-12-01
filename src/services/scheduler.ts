import { Step, WeeklySchedule, SlotCategory } from '../types';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const SchedulerService = {
    /**
     * Calculates the available minutes for a specific category on a given date based on the schedule.
     */
    getAvailableMinutes: (date: Date, category: SlotCategory, schedule: WeeklySchedule): number => {
        const dayName = DAYS[date.getDay()];
        const daySchedule = schedule[dayName];

        if (!daySchedule || !daySchedule.isWorkDay) {
            return 0;
        }

        let totalMinutes = 0;
        daySchedule.slots.forEach(slot => {
            // Check if slot matches category or is 'ANYTHING' (wildcard)
            if (slot.category === category || slot.category === 'ANYTHING') {
                const [startHour, startMinute] = slot.start.split(':').map(Number);
                const [endHour, endMinute] = slot.end.split(':').map(Number);

                const start = startHour * 60 + startMinute;
                const end = endHour * 60 + endMinute;

                totalMinutes += Math.max(0, end - start);
            }
        });

        return totalMinutes;
    },

    /**
     * Distributes tasks into the schedule starting from a specific date.
     * Returns a new array of steps with 'scheduledDate' assigned.
     */
    distributeTasks: (tasks: Step[], schedule: WeeklySchedule, startDate: Date = new Date()): Step[] => {
        const scheduledTasks: Step[] = [];
        const floatingTasks: Step[] = [];

        // --- SEQUENTIAL MILESTONE LOGIC ---
        // 1. Identify blocked milestones
        // A milestone is blocked if it belongs to a goal that has an incomplete milestone with a lower sequenceOrder.
        const milestones = tasks.filter(t => t.isMilestone);
        const milestonesByGoal: Record<string, Step[]> = {};

        milestones.forEach(m => {
            if (m.goalId) {
                if (!milestonesByGoal[m.goalId]) milestonesByGoal[m.goalId] = [];
                milestonesByGoal[m.goalId].push(m);
            }
        });

        const blockedMilestoneIds = new Set<string>();

        Object.values(milestonesByGoal).forEach(goalMilestones => {
            // Sort by sequenceOrder (ascending)
            goalMilestones.sort((a, b) => (a.sequenceOrder || 0) - (b.sequenceOrder || 0));

            let blocked = false;
            for (const m of goalMilestones) {
                if (blocked) {
                    blockedMilestoneIds.add(m.id);
                } else if (!m.isCompleted) {
                    // Found the first incomplete milestone.
                    // This one is ACTIVE.
                    // All SUBSEQUENT ones are BLOCKED.
                    blocked = true;
                }
            }
        });
        // ----------------------------------

        // Track used time per day/category
        const dailyUsage: Record<string, Record<string, number>> = {};
        const getUsageKey = (date: Date) => date.toDateString();

        // 1. Process tasks
        tasks.forEach(task => {
            // Skip tasks belonging to blocked milestones
            if (task.parentId && blockedMilestoneIds.has(task.parentId)) {
                return;
            }

            if (task.isCompleted) {
                scheduledTasks.push(task);
            } else if (task.date) {
                const taskDate = new Date(task.date);
                const startOfToday = new Date(startDate);
                startOfToday.setHours(0, 0, 0, 0);

                // If task is in the past (overdue), treat as floating to reschedule it
                if (taskDate < startOfToday) {
                    floatingTasks.push(task);
                } else {
                    // Future fixed date task (Manual)
                    const category = task.category || ' WORK ';
                    const effort = task.estimatedMinutes || 60;

                    const dateKey = getUsageKey(taskDate);
                    if (!dailyUsage[dateKey]) dailyUsage[dateKey] = {};
                    dailyUsage[dateKey][category] = (dailyUsage[dateKey][category] || 0) + effort;

                    scheduledTasks.push({
                        ...task,
                        scheduledDate: taskDate
                    });
                }
            } else {
                floatingTasks.push(task);
            }
        });

        // 2. Sort floating tasks by sequenceOrder
        floatingTasks.sort((a, b) => (a.sequenceOrder || 0) - (b.sequenceOrder || 0));

        // 3. Distribute floating tasks
        let currentDate = new Date(startDate);
        currentDate.setHours(0, 0, 0, 0);

        let taskIndex = 0;
        let daysChecked = 0;
        const MAX_DAYS_LOOKAHEAD = 365;

        while (taskIndex < floatingTasks.length && daysChecked < MAX_DAYS_LOOKAHEAD) {
            const task = floatingTasks[taskIndex];
            const category = task.category || ' WORK ';
            const effort = task.estimatedMinutes || 60;

            // Check availability
            const available = SchedulerService.getAvailableMinutes(currentDate, category, schedule);

            const dateKey = getUsageKey(currentDate);
            if (!dailyUsage[dateKey]) dailyUsage[dateKey] = {};
            const used = dailyUsage[dateKey][category] || 0;

            if (available - used >= effort) {
                // Schedule it
                scheduledTasks.push({
                    ...task,
                    scheduledDate: new Date(currentDate),
                });

                dailyUsage[dateKey][category] = used + effort;
                taskIndex++;
            } else {
                // Try next day
                currentDate.setDate(currentDate.getDate() + 1);
                daysChecked++;
            }
        }

        // If we ran out of days, just append remaining tasks to the last checked day (fallback)
        while (taskIndex < floatingTasks.length) {
            scheduledTasks.push({
                ...floatingTasks[taskIndex],
                scheduledDate: new Date(currentDate), // Late schedule
            });
            taskIndex++;
        }

        return scheduledTasks;
    }
};

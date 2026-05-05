import { Step, WeeklySchedule, SlotCategory, Goal } from '../types';

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
     * Calculates the next date a habit should be scheduled based on its frequency.
     * @param currentDate The date to start searching from.
     * @param habitDaysOfWeek Array of allowed days (0 = Sunday, ..., 6 = Saturday).
     */
    getNextHabitDate: (currentDate: Date, habitDaysOfWeek?: number[]): Date => {
        const nextDate = new Date(currentDate);
        nextDate.setHours(0, 0, 0, 0);

        // If no specific days provided, default to every day
        const allowedDays = (habitDaysOfWeek && habitDaysOfWeek.length > 0) 
            ? habitDaysOfWeek 
            : [0, 1, 2, 3, 4, 5, 6];

        // Ensure we advance at least by one day
        nextDate.setDate(nextDate.getDate() + 1);

        // Find the next matching day
        while (!allowedDays.includes(nextDate.getDay())) {
            nextDate.setDate(nextDate.getDate() + 1);
        }

        return nextDate;
    },

    /**
     * Distributes tasks into the schedule starting from a specific date.
     * Implements proportional time-blocking based on goal deadlines and remaining effort.
     */
    distributeTasks: (tasks: Step[], goals: Goal[], schedule: WeeklySchedule, startDate: Date = new Date()): Step[] => {
        const scheduledTasks: Step[] = [];
        const floatingTasks: Step[] = [];
        const fixedTasks: Step[] = [];

        // 1. Separate fixed tasks (events, past tasks, manual fixed dates) and floating tasks
        const startOfToday = new Date(startDate);
        startOfToday.setHours(0, 0, 0, 0);

        tasks.forEach(task => {
            if (task.isCompleted) {
                // If a habit was completed but we haven't recycled it yet (shouldn't happen often if toggleStep handles it, but just in case)
                scheduledTasks.push(task);
            } else if (task.date) {
                const taskDate = new Date(task.date);
                taskDate.setHours(0, 0, 0, 0);
                
                // Add a 3-hour grace period for DST comparisons to prevent false negatives when timezone shifts back (-1h)
                // which results in 23:00 of the previous day.
                const isTaskInPast = (taskDate.getTime() + (3 * 60 * 60 * 1000)) < startOfToday.getTime();

                if (isTaskInPast) {
                    // Task is in the past.
                    if (task.isHabit) {
                        // Fail state for habit: missed the deadline. Reset streak and move to today/next active day.
                        const resetTask = { 
                            ...task, 
                            currentStreak: 0,
                            // Ensure it's scheduled for a valid day starting from today
                        };
                        
                        // Check if today is a valid day, otherwise find the next one
                        const allowedDays = (task.habitDaysOfWeek && task.habitDaysOfWeek.length > 0) ? task.habitDaysOfWeek : [0, 1, 2, 3, 4, 5, 6];
                        if (allowedDays.includes(startOfToday.getDay())) {
                            resetTask.date = new Date(startOfToday); // Today
                            floatingTasks.push(resetTask); 
                        } else {
                            // Find the next valid day from today (not tomorrow)
                            const nextDate = new Date(startOfToday);
                            while (!allowedDays.includes(nextDate.getDay())) {
                                nextDate.setDate(nextDate.getDate() + 1);
                            }
                            resetTask.date = nextDate;
                            
                            // If it's pushed to a future date, it becomes a fixed task
                            if (nextDate > startOfToday) {
                                fixedTasks.push(resetTask);
                                scheduledTasks.push({ ...resetTask, scheduledDate: nextDate });
                            } else {
                                floatingTasks.push(resetTask);
                            }
                        }
                    } else {
                        // Regular task in the past, just reschedule
                        floatingTasks.push(task); 
                    }
                } else {
                    fixedTasks.push(task);
                    scheduledTasks.push({ ...task, scheduledDate: taskDate });
                }
            } else {
                floatingTasks.push(task);
            }
        });

        if (floatingTasks.length === 0) return scheduledTasks;

        // 2. Identify blocked milestones (Sequential logic)
        const milestones = floatingTasks.filter(t => t.isMilestone);
        const milestonesByGoal: Record<string, Step[]> = {};

        milestones.forEach(m => {
            if (m.goalId) {
                if (!milestonesByGoal[m.goalId]) milestonesByGoal[m.goalId] = [];
                milestonesByGoal[m.goalId].push(m);
            }
        });

        const blockedMilestoneIds = new Set<string>();
        Object.values(milestonesByGoal).forEach(goalMilestones => {
            goalMilestones.sort((a, b) => (a.sequenceOrder || 0) - (b.sequenceOrder || 0));
            let blocked = false;
            for (const m of goalMilestones) {
                if (blocked) {
                    blockedMilestoneIds.add(m.id);
                } else if (!m.isCompleted) {
                    blocked = true;
                }
            }
        });

        // Track used time per day/category (including fixed tasks)
        const dailyUsage: Record<string, Record<string, number>> = {};
        const getUsageKey = (date: Date) => date.toDateString();

        fixedTasks.forEach(task => {
            const taskDate = new Date(task.date!);
            const category = task.category || ' WORK ';
            const effort = task.estimatedMinutes || 60;
            const dateKey = getUsageKey(taskDate);
            if (!dailyUsage[dateKey]) dailyUsage[dateKey] = {};
            dailyUsage[dateKey][category] = (dailyUsage[dateKey][category] || 0) + effort;
        });

        // 3. Prepare task queues per goal
        // Filter out blocked tasks and group by goal
        const activeTasks = floatingTasks.filter(t => !t.parentId || !blockedMilestoneIds.has(t.parentId));

        // Group tasks by Goal ID (tasks without Goal ID go to an "orphan" group)
        const tasksByGoal: Record<string, Step[]> = { '_orphan': [] };
        activeTasks.forEach(task => {
            const gid = task.goalId || '_orphan';
            if (!tasksByGoal[gid]) tasksByGoal[gid] = [];
            tasksByGoal[gid].push(task);
        });

        // Sort tasks within each goal by sequenceOrder
        Object.keys(tasksByGoal).forEach(gid => {
            tasksByGoal[gid].sort((a, b) => {
                if (a.isMilestone !== b.isMilestone) return a.isMilestone ? -1 : 1; // Prioritize milestones
                return (a.sequenceOrder || 0) - (b.sequenceOrder || 0);
            });
        });

        // 4. Distribute tasks day by day
        let currentDate = new Date(startDate);
        currentDate.setHours(0, 0, 0, 0);

        let remainingGoalsCount = Object.keys(tasksByGoal).filter(g => tasksByGoal[g].length > 0).length;
        let daysChecked = 0;
        const MAX_DAYS_LOOKAHEAD = 365;

        while (remainingGoalsCount > 0 && daysChecked < MAX_DAYS_LOOKAHEAD) {
            const dateKey = getUsageKey(currentDate);
            if (!dailyUsage[dateKey]) dailyUsage[dateKey] = {};

            // Calculate goal weights for today based on urgency and remaining effort
            const goalWeights: Record<string, number> = {};
            let totalWeight = 0;

            Object.keys(tasksByGoal).forEach(gid => {
                if (tasksByGoal[gid].length === 0) return;

                const goal = goals.find(g => g.id === gid);
                let weight = 1.0;

                if (goal && goal.deadline) {
                    const diffTime = new Date(goal.deadline).getTime() - currentDate.getTime();
                    const daysRestants = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

                    const effortRestant = tasksByGoal[gid].reduce((sum, t) => sum + (t.estimatedMinutes || 60), 0);

                    // Poids cible : minutes requises par jour pour finir à temps
                    weight = effortRestant / daysRestants;
                    // Boost pour les objectifs très urgents (deadline < 3 jours)
                    if (daysRestants <= 3) weight *= 2.0;
                } else if (gid === '_orphan') {
                    // Tâches orphelines (ex: Brain dumps) : on leur donne un petit poids par défaut
                    weight = 30.0; // 30 mins/day target
                }

                goalWeights[gid] = Math.max(10, weight); // Minimum weight to avoid starvation
                totalWeight += goalWeights[gid];
            });

            // If we have no weight calculated, something went wrong, let's distribute evenly
            if (totalWeight === 0) {
                const equalWeight = 1 / Object.keys(tasksByGoal).filter(g => tasksByGoal[g].length > 0).length;
                Object.keys(tasksByGoal).forEach(gid => {
                    if (tasksByGoal[gid].length > 0) goalWeights[gid] = equalWeight;
                });
                totalWeight = 1.0;
            }

            // Pour chaque catégorie, allouer le temps proportionnellement
            const categories: SlotCategory[] = [' WORK ', 'PROJECTS', 'PERSONAL', 'STUDY'];

            categories.forEach(category => {
                const available = SchedulerService.getAvailableMinutes(currentDate, category, schedule);
                let timeRemaining = available - (dailyUsage[dateKey][category] || 0);

                if (timeRemaining <= 0) return;

                // Budgets for this category today
                const goalBudgets: { gid: string, budget: number }[] = [];
                Object.keys(tasksByGoal).forEach(gid => {
                    const queueCategory = tasksByGoal[gid].length > 0 ? (tasksByGoal[gid][0].category || ' WORK ') : null;
                    if (tasksByGoal[gid].length > 0 && queueCategory === category) {
                        const budget = timeRemaining * (goalWeights[gid] / totalWeight);
                        goalBudgets.push({ gid, budget: Math.floor(budget) });
                    }
                });

                // Sort goals by budget descending to process those with largest allocation first
                goalBudgets.sort((a, b) => b.budget - a.budget);

                // Round-robin assignment within the allocated budgets
                let madeProgress = true;
                while (madeProgress && timeRemaining > 0) {
                    madeProgress = false;

                    for (const { gid } of goalBudgets) {
                        const queue = tasksByGoal[gid];
                        const taskCategory = queue.length > 0 ? (queue[0].category || ' WORK ') : null;
                        if (queue.length === 0 || taskCategory !== category) continue;

                        const task = queue[0];
                        const effort = task.estimatedMinutes || 60;

                        // On place la tâche si elle rentre dans le temps global restant,
                        // même si elle dépasse un peu le budget strict (pour éviter le blocage des grosses tâches)
                        // On limite quand même le dépassement pour laisser de la place aux autres
                        if (timeRemaining >= effort || (timeRemaining > 0 && effort - timeRemaining < 30)) {
                            // Schedule task
                            scheduledTasks.push({
                                ...task,
                                scheduledDate: new Date(currentDate)
                            });

                            dailyUsage[dateKey][category] = (dailyUsage[dateKey][category] || 0) + effort;
                            timeRemaining -= effort;
                            queue.shift(); // Remove from queue
                            madeProgress = true;
                        }
                    }
                }
            });

            // Move to next day
            currentDate.setDate(currentDate.getDate() + 1);
            daysChecked++;
            remainingGoalsCount = Object.keys(tasksByGoal).filter(g => tasksByGoal[g].length > 0).length;
        }

        // If we ran out of days, append remaining tasks to the last day
        Object.keys(tasksByGoal).forEach(gid => {
            tasksByGoal[gid].forEach(task => {
                scheduledTasks.push({
                    ...task,
                    scheduledDate: new Date(currentDate)
                });
            });
        });


        // 5. Align Milestones with their earliest active subtasks
        const milestoneIds = new Set(scheduledTasks.filter(t => t.isMilestone && !t.isCompleted).map(t => t.id));
        
        milestoneIds.forEach(mId => {
            const milestoneIndex = scheduledTasks.findIndex(t => t.id === mId);
            if (milestoneIndex === -1) return;
            
            const milestone = scheduledTasks[milestoneIndex];
            
            // Find all pending subtasks of this milestone
            const subtasks = scheduledTasks.filter(t => t.parentId === mId && !t.isCompleted && t.scheduledDate);
            
            if (subtasks.length > 0) {
                // Find the minimum scheduledDate among subtasks so the milestone acts as a cursor
                let minDate = new Date(subtasks[0].scheduledDate!);
                
                subtasks.forEach(st => {
                    const stDate = new Date(st.scheduledDate!);
                    if (stDate < minDate) {
                        minDate = stDate;
                    }
                });
                
                // Update milestone's scheduledDate
                scheduledTasks[milestoneIndex] = {
                    ...milestone,
                    scheduledDate: minDate
                };
            }
        });

        return scheduledTasks;
    }
};

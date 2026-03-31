import { SchedulerService } from './src/services/scheduler';
import { Step, WeeklySchedule } from './src/types';

const steps: Step[] = [
    {
        id: "1",
        title: "Buy milk",
        date: new Date(),
        isCompleted: false,
        effort: 1,
        category: "PERSONAL",
        type: "task"
    }
];

const schedule: WeeklySchedule = {
    'Monday': { isWorkDay: true, slots: [{ start: '09:00', end: '17:00', category: 'ANYTHING' }] },
    'Tuesday': { isWorkDay: true, slots: [{ start: '09:00', end: '17:00', category: 'ANYTHING' }] },
    'Wednesday': { isWorkDay: true, slots: [{ start: '09:00', end: '17:00', category: 'ANYTHING' }] },
    'Thursday': { isWorkDay: true, slots: [{ start: '09:00', end: '17:00', category: 'ANYTHING' }] },
    'Friday': { isWorkDay: true, slots: [{ start: '09:00', end: '17:00', category: 'ANYTHING' }] },
    'Saturday': { isWorkDay: true, slots: [{ start: '09:00', end: '17:00', category: 'ANYTHING' }] },
    'Sunday': { isWorkDay: true, slots: [{ start: '09:00', end: '17:00', category: 'ANYTHING' }] }
};

const result = SchedulerService.distributeTasks(steps, [], schedule);
console.log("Distributed steps:");
console.log(result);

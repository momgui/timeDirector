export interface User {
    id: string;
    email: string;
    name: string | null;
    photo: string | null;
}

export interface GoalResource {
    id: string;
    title: string;
    type: 'LINK' | 'FILE_REF';
    url: string; // http://... or file://...
    createdAt: Date;
}

export interface Goal {
    id: string;
    title: string;
    deadline: Date;
    createdAt: Date;
    isCompleted: boolean;
    category?: SlotCategory;
    resources?: GoalResource[];
    context?: string;
}

export interface Step {
    id: string;
    goalId?: string;
    title: string;
    description?: string;
    date?: Date; // The specific date this step is scheduled for (optional now)
    scheduledDate?: Date; // The dynamically calculated date
    sequenceOrder?: number; // Order for the scheduler
    isCompleted: boolean;
    effort?: number; // 1-5 score, default 1
    estimatedMinutes?: number; // Estimated time in minutes
    googleCalendarEventId?: string; // To link with Google Calendar
    category?: SlotCategory;
    isMilestone?: boolean;
    parentId?: string;
    type?: 'task' | 'event';
    
    // Habit tracking
    isHabit?: boolean;
    habitDaysOfWeek?: number[]; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    currentStreak?: number;
    lastCompletedDate?: Date;
}

export type SlotCategory = ' WORK ' | 'PROJECTS' | 'PERSONAL' | 'STUDY' | 'ANYTHING' | 'BLOCKED';

export interface TimeSlot {
    start: string; // "HH:mm"
    end: string;   // "HH:mm"
    category: SlotCategory;
}

export interface DaySchedule {
    isWorkDay: boolean;
    slots: TimeSlot[];
}

export type WeeklySchedule = Record<string, DaySchedule>;

export type RootStackParamList = {
    Login: undefined;
    Dashboard: undefined;
    GoalInput: { goalId?: string };
    GoalDetails: { goalId: string };
    FocusSession: undefined;
    Settings: undefined;
    PrivacyPolicy: undefined;
    TermsOfService: undefined;
    Onboarding: undefined;
};

export interface Session {
    id: string;
    goalId?: string;
    taskId?: string; // Optional: link to a specific task
    startTime: number; // Timestamp
    endTime?: number; // Timestamp
    duration: number; // In seconds
    status: 'ACTIVE' | 'PAUSED' | 'COMPLETED';
    createdAt: Date;
}

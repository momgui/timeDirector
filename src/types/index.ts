export interface User {
    id: string;
    email: string;
    name: string | null;
    photo: string | null;
}

export interface Goal {
    id: string;
    title: string;
    deadline: Date;
    createdAt: Date;
    isCompleted: boolean;
}

export interface Step {
    id: string;
    goalId: string;
    title: string;
    description?: string;
    date: Date; // The specific date this step is scheduled for
    isCompleted: boolean;
    googleCalendarEventId?: string; // To link with Google Calendar
}

export type RootStackParamList = {
    Login: undefined;
    Dashboard: undefined;
    GoalInput: undefined;
};

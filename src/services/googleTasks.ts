export interface GoogleTask {
    id: string;
    title: string;
    notes?: string;
    due?: string; // RFC 3339 timestamp
    status: 'needsAction' | 'completed';
    completed?: string; // RFC 3339 timestamp
}

export interface GoogleTaskList {
    id: string;
    title: string;
}

export const listTaskLists = async (accessToken: string): Promise<GoogleTaskList[]> => {
    try {
        const response = await fetch(
            'https://tasks.googleapis.com/tasks/v1/users/@me/lists',
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
            }
        );

        if (!response.ok) {
            console.error('Google Tasks API Error (Lists):', await response.text());
            return [];
        }

        const data = await response.json();
        return data.items || [];
    } catch (error) {
        console.error('Error fetching task lists:', error);
        return [];
    }
};

export const listTasks = async (accessToken: string, tasklistId: string): Promise<GoogleTask[]> => {
    try {
        const response = await fetch(
            `https://tasks.googleapis.com/tasks/v1/lists/${tasklistId}/tasks?showCompleted=false&showHidden=false`,
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
            }
        );

        if (!response.ok) {
            console.error('Google Tasks API Error (Tasks):', await response.text());
            return [];
        }

        const data = await response.json();
        return data.items || [];
    } catch (error) {
        console.error('Error fetching tasks:', error);
        return [];
    }
};

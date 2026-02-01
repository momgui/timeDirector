export interface GoogleCalendarEvent {
    id: string;
    summary: string;
    description?: string;
    start: {
        dateTime?: string;
        date?: string;
    };
    end: {
        dateTime?: string;
        date?: string;
    };
}

export interface GoogleCalendarListEntry {
    id: string;
    summary: string;
    primary?: boolean;
}

export const listCalendars = async (accessToken: string): Promise<GoogleCalendarListEntry[]> => {
    try {
        const response = await fetch(
            'https://www.googleapis.com/calendar/v3/users/me/calendarList',
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
            }
        );

        if (!response.ok) {
            console.error('Google Calendar API Error (List Calendars):', await response.text());
            return [];
        }

        const data = await response.json();
        return data.items || [];
    } catch (error) {
        console.error('Error fetching calendar list:', error);
        return [];
    }
};

export const listEvents = async (accessToken: string, calendarId: string = 'primary', timeMin: string, timeMax: string): Promise<GoogleCalendarEvent[]> => {
    try {
        const response = await fetch(
            `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?timeMin=${encodeURIComponent(timeMin)}&timeMax=${encodeURIComponent(timeMax)}&singleEvents=true&orderBy=startTime`,
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
            }
        );

        if (!response.ok) {
            console.error(`Google Calendar API Error (Events for ${calendarId}):`, await response.text());
            return [];
        }

        const data = await response.json();
        return data.items || [];
    } catch (error) {
        console.error(`Error fetching calendar events for ${calendarId}:`, error);
        return [];
    }
};

export interface Meeting {
    id: string;
    title: string;
    date: string;
    startTime: string | null;
    endTime: string | null;
    type: string;
    status: string;
    involvedActors: string[];
    involvedAreas: string[];
    notes: string | null;
    tasks?: MeetingTask[];
    agreements?: string[];
    facilitatorId?: string;
}

export interface MeetingTask {
    id: string;
    meetingId: string;
    description: string;
    assignedStaffId: string | null;
    status: 'pending' | 'completed';
    dueDate: string | null;
    assignedStaffName?: string;
}

export interface CreateMeetingInput extends Omit<Meeting, 'id' | 'status' | 'tasks'> {
    tasks?: { description: string }[];
}

async function handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
        let errorMessage = `Error ${response.status}: ${response.statusText}`;
        try {
            const text = await response.text();
            if (text) {
                const error = JSON.parse(text);
                if (error.message) errorMessage = error.message;
            }
        } catch (e) {
            // Ignore parsing errors
        }
        throw new Error(errorMessage);
    }

    if (response.status === 204) {
        return {} as T;
    }

    try {
        const text = await response.text();
        return text ? JSON.parse(text) : {} as T;
    } catch (e) {
        return {} as T;
    }
}

export const meetingsApi = {
    findAll: async (): Promise<Meeting[]> => {
        const res = await fetch('/api/meetings?limit=1000');
        const data = await handleResponse<{ data: Meeting[] }>(res);
        return data.data || [];
    },
    findById: async (id: string): Promise<Meeting> => {
        const res = await fetch(`/api/meetings/${id}`);
        return handleResponse<Meeting>(res);
    },
    create: async (input: CreateMeetingInput): Promise<Meeting> => {
        const res = await fetch('/api/meetings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(input),
        });
        return handleResponse<Meeting>(res);
    },
    remove: async (id: string): Promise<void> => {
        const res = await fetch(`/api/meetings/${id}`, {
            method: 'DELETE',
        });
        return handleResponse<void>(res);
    },
    // Tasks
    createTask: async (meetingId: string, input: Partial<MeetingTask>): Promise<MeetingTask> => {
        const res = await fetch(`/api/meetings/${meetingId}/tasks`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(input),
        });
        return handleResponse<MeetingTask>(res);
    },
    updateTask: async (taskId: string, input: Partial<MeetingTask>): Promise<MeetingTask> => {
        const res = await fetch(`/api/meetings/tasks/${taskId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(input),
        });
        return handleResponse<MeetingTask>(res);
    },
    deleteTask: async (taskId: string): Promise<void> => {
        const res = await fetch(`/api/meetings/tasks/${taskId}`, {
            method: 'DELETE',
        });
        return handleResponse<void>(res);
    },
};

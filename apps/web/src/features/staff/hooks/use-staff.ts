import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CreateStaffInput } from "@flip/shared";
import { useApiClient } from "@/lib/api-client";
import { useSession } from "@/lib/auth-client";

type Staff = {
    id: string;
    institutionId: string;
    name: string;
    dni?: string;
    email?: string;
    phone?: string;
    area?: string;
    role: string;
    status: string;
    createdAt: string;
};

// Pagination Response Wrapper
type PaginatedResponse<T> = {
    data: T[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
        hasNextPage: boolean;
        hasPreviousPage: boolean;
    };
};

type UseStaffParams = {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
    status?: string;
    includeAdmins?: boolean;
};

export const useStaff = (params: UseStaffParams = {}) => {
    const { data: session } = useSession();
    const api = useApiClient();
    const queryClient = useQueryClient();

    const { page = 1, limit = 10, search = '', role, status, includeAdmins } = params;

    // Fetch Staff (Paginated)
    const { data, isLoading, error } = useQuery({
        queryKey: ['staff', { page, limit, search, role, status, includeAdmins }],
        queryFn: async () => {
            // Build query string
            const searchParams = new URLSearchParams();
            searchParams.set('page', page.toString());
            searchParams.set('limit', limit.toString());
            if (search) searchParams.set('search', search);
            if (role) searchParams.set('role', role);
            if (status) searchParams.set('status', status);
            if (includeAdmins) searchParams.set('include_admins', 'true');

            return api.get<PaginatedResponse<Staff>>(`/staff?${searchParams.toString()}`);
        },
        enabled: !!session,
        // Keep previous data while fetching next page for better UX
        placeholderData: (previousData) => previousData,
    });

    // Convenience accessors
    const staff = data?.data || [];
    const meta = data?.meta;

    // Create Staff
    const createStaff = useMutation({
        mutationFn: (newStaff: CreateStaffInput) => api.post('/staff', newStaff),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['staff'] });
        },
    });

    // Bulk Create Staff
    const bulkCreateStaff = useMutation({
        mutationFn: (staffList: CreateStaffInput[]) => api.post('/staff/bulk', { staff: staffList }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['staff'] });
        },
    });

    // Update Staff
    const updateStaff = useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<CreateStaffInput> }) =>
            api.patch(`/staff/${id}`, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['staff'] });
        },
    });

    // Delete Staff
    const deleteStaff = useMutation({
        mutationFn: (id: string) => api.delete(`/staff/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['staff'] });
        },
    });

    return {
        staff,
        meta,
        isLoading,
        error,
        createStaff,
        bulkCreateStaff,
        updateStaff,
        deleteStaff,
    };
};

export const useRecurrentStaff = (limit: number = 6) => {
    const { data: session } = useSession();
    const api = useApiClient();

    return useQuery({
        queryKey: ['staff', 'recurrent', limit],
        queryFn: () => api.get<Staff[]>(`/staff/recurrent?limit=${limit}`),
        enabled: !!session,
    });
};

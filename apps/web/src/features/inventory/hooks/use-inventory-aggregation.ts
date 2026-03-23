import { useQuery } from "@tanstack/react-query";
import { useApiClient } from "@/lib/api-client";

export interface InventoryTemplateAggregation {
    templateId: string;
    templateName: string;
    templateIcon: string | null;
    categoryId: string;
    categoryName: string;
    categoryIcon: string | null;
    categoryColor: string | null;
    totalStock: number;
    available: number;
    borrowed: number;
    maintenance: number;
    retired: number;
}

export function useInventoryAggregation() {
    const apiClient = useApiClient();

    return useQuery({
        queryKey: ["inventory-templates-aggregation"],
        queryFn: async (): Promise<InventoryTemplateAggregation[]> => {
            return apiClient.get("/inventory-templates");
        },
    });
}

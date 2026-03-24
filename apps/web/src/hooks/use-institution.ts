import { useQuery } from "@tanstack/react-query";
import { useSession } from "@/lib/auth-client";

type Institution = {
  id: string;
  name: string;
  nivel: string;
  settings?: {
    logoUrl?: string;
    brandColor?: string;
  };
};

export function useInstitution() {
  const { data: session } = useSession();
  const user = session?.user as any;

  return useQuery({
    queryKey: ['institution', user?.institutionId],
    queryFn: async () => {
      const res = await fetch('/api/institutions/my-institution');
      if (!res.ok) throw new Error('Failed to fetch institution');
      return res.json() as Promise<Institution>;
    },
    enabled: !!user?.institutionId,
    staleTime: 5 * 60 * 1000, // 5 minutes - institutions don't change often
    gcTime: 10 * 60 * 1000, // 10 minutes in cache
  });
}

// Refactored to proxy directly into useMyInstitution which handles correct api calls and caching
import { useMyInstitution } from '@/features/institutions/hooks/use-my-institution';

export function useInstitution() {
  return useMyInstitution();
}

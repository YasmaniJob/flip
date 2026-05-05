import { ResourceRepository } from '@/lib/repositories/resource-repository';
import type { CreateResourceInput, ResourcesQueryInput } from '@/lib/validations/schemas/resources';

// ─── Service ─────────────────────────────────────────────────────────────────

export const ResourceService = {
  /**
   * List resources with pagination and filters
   */
  async list(institutionId: string, query: ResourcesQueryInput) {
    return ResourceRepository.findMany(institutionId, query);
  },

  /**
   * Generate internal ID for a resource (PREFIX-NNN)
   */
  async generateInternalId(institutionId: string, categoryId?: string): Promise<string> {
    let prefix = 'REC';

    if (categoryId) {
      const category = await ResourceRepository.findCategoryById(categoryId);
      if (category) {
        prefix = category.name
          .replace(/[^a-zA-Z]/g, '')
          .substring(0, 3)
          .toUpperCase() || 'REC';
      }
    }

    const nextNumber = await ResourceRepository.getNextSequence(institutionId, prefix);
    return `${prefix}-${String(nextNumber).padStart(3, '0')}`;
  },

  /**
   * Create a new resource with an automatically generated internal ID
   */
  async create(institutionId: string, input: CreateResourceInput) {
    const internalId = await this.generateInternalId(institutionId, input.categoryId);
    return ResourceRepository.create(institutionId, internalId, input);
  }
};

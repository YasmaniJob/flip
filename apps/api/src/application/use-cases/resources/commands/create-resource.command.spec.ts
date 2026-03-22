import { Test, TestingModule } from '@nestjs/testing';
import { CreateResourceCommand } from './create-resource.command';
import { IResourceRepository } from '../../../../core/ports/outbound/resource.repository';
import { ICategoryRepository } from '../../../../core/ports/outbound/category.repository';
import { InstitutionId } from '@flip/shared';
import { Resource } from '../../../../core/domain/entities/resource.entity';
import { InternalId } from '@flip/shared';
import { Category } from '../../../../core/domain/entities/category.entity';

describe('CreateResourceCommand', () => {
    let command: CreateResourceCommand;
    let resourceRepo: IResourceRepository;
    let categoryRepo: ICategoryRepository;

    const mockResourceRepo = {
        save: jest.fn(),
        getNextSequence: jest.fn(),
    };

    const mockCategoryRepo = {
        findById: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                CreateResourceCommand,
                {
                    provide: 'IResourceRepository',
                    useValue: mockResourceRepo,
                },
                {
                    provide: 'ICategoryRepository',
                    useValue: mockCategoryRepo,
                },
            ],
        }).compile();

        command = module.get<CreateResourceCommand>(CreateResourceCommand);
        resourceRepo = module.get<IResourceRepository>('IResourceRepository');
        categoryRepo = module.get<ICategoryRepository>('ICategoryRepository');
    });

    it('should be defined', () => {
        expect(command).toBeDefined();
    });

    it('should create a resource with generated internal ID', async () => {
        const input = {
            institutionId: 'inst-123',
            name: 'Test Resource',
            categoryId: 'cat-123',
            stock: 5,
        };

        const categoryMock: Partial<Category> = {
            id: undefined, // Add missing properties to satisfy type if needed, or cast
            name: 'Audio Visual',
        };

        // Type casting for mock return as Category entity might have more fields
        mockCategoryRepo.findById.mockResolvedValue(categoryMock);
        mockResourceRepo.getNextSequence.mockResolvedValue(10);

        const expectedResource = {
            institutionId: input.institutionId,
            internalId: 'AUD-010', // AUD-010 because padStart(3, '0') for 10 is 010
            name: input.name,
            stock: input.stock,
        };

        // We can't easily check the exact Resource instance properties unless we inspect the call
        // because Resource.create return a Resource instance with methods/VOs

        mockResourceRepo.save.mockImplementation((res) => Promise.resolve(res));

        const result = await command.execute(input);

        expect(mockCategoryRepo.findById).toHaveBeenCalledWith('cat-123');
        // InternalId logic: Audio Visual -> AUD? Need to check InternalId implementation
        // Assuming InternalId.generatePrefix('Audio Visual') -> 'AUD'
        expect(mockResourceRepo.getNextSequence).toHaveBeenCalledWith('inst-123', 'AUD');

        expect(result.internalId).toBe('AUD-010');
        expect(result.name).toBe('Test Resource');
        expect(mockResourceRepo.save).toHaveBeenCalled();
    });
});

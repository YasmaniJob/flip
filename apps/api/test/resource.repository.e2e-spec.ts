import { Test, TestingModule } from '@nestjs/testing';
import { DrizzleResourceRepository } from '../src/infrastructure/persistence/drizzle/repositories/drizzle-resource.repository';
import { DatabaseModule } from '../src/database/database.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Resource } from '../src/core/domain/entities/resource.entity';
import { InternalId, InstitutionId, ResourceStatus } from '@flip/shared';
import { Pool } from 'pg';
import { DRIZZLE } from '../src/database/database.module';
import * as schema from '../src/database/schema';
import { eq } from 'drizzle-orm';

// NOTE: This test requires a running database. 
// It will try to use process.env.DATABASE_URL
// WARNING: It performs real INSERTs. Ensure you are using a TEST DATABASE.

describe('DrizzleResourceRepository (Integration)', () => {
    let repository: DrizzleResourceRepository;
    let module: TestingModule;
    let db: any;

    const testInstitutionId = 'inst-test-e2e';
    const testCategoryPrefix = 'TST';

    beforeAll(async () => {
        const envTestPath = require('path').resolve(__dirname, '../.env.test');
        console.log('DEBUG: Loading env from:', envTestPath);

        require('dotenv').config({ path: envTestPath });

        module = await Test.createTestingModule({
            imports: [
                ConfigModule.forRoot({
                    isGlobal: true,
                    envFilePath: [
                        envTestPath,
                    ],
                }),
                DatabaseModule,
            ],
            providers: [
                DrizzleResourceRepository,
            ],
        })
            .overrideProvider(ConfigService)
            .useValue({
                get: (key: string) => {
                    if (key === 'DATABASE_URL') {
                        const url = process.env.DATABASE_URL || 'postgresql://postgres:postgres@127.0.0.1:5432/flip_v2';
                        console.log('DEBUG: ConfigService returning URL:', url.replace(/:[^:@]*@/, ':****@'));
                        return url;
                    }
                    return null;
                }
            })
            .compile();

        repository = module.get<DrizzleResourceRepository>(DrizzleResourceRepository);
        db = module.get(DRIZZLE);
    });

    afterAll(async () => {
        // Cleanup test data
        if (db) {
            await db.delete(schema.resources).where(eq(schema.resources.institutionId, testInstitutionId));
            await db.delete(schema.categorySequences).where(eq(schema.categorySequences.institutionId, testInstitutionId));
            // Close pool if accessible or let Jest handle teardown
        }
        await module.close();
    });

    it('should be defined', () => {
        expect(repository).toBeDefined();
    });

    it('should generate next sequence number atomically', async () => {
        const seq1 = await repository.getNextSequence(testInstitutionId, testCategoryPrefix);
        const seq2 = await repository.getNextSequence(testInstitutionId, testCategoryPrefix);

        expect(seq1).toBeGreaterThan(0);
        expect(seq2).toBe(seq1 + 1);
    });

    it('should save and find a resource', async () => {
        const internalId = InternalId.create(testCategoryPrefix, 999);

        const resource = Resource.create({
            institutionId: testInstitutionId,
            internalId: internalId.toString(),
            name: 'Integration Test Resource',
            stock: 10,
            notes: 'Created by e2e test',
        });

        const saved = await repository.save(resource);
        expect(saved).toBeDefined();
        expect(saved.id).toBeDefined();

        const found = await repository.findById(saved.id, testInstitutionId);
        expect(found).toBeDefined();
        expect(found?.name).toBe('Integration Test Resource');
        expect(found?.internalId.toString()).toBe(internalId.toString());
    });
});

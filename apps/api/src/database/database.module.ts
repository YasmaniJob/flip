import { config } from 'dotenv';
import * as path from 'path';

config({ path: path.resolve(process.cwd(), 'apps/api/.env.local') });
config({ path: path.resolve(process.cwd(), 'apps/api/.env') });
config({ path: path.resolve(process.cwd(), '.env.local') }); // Fallback
config({ path: path.resolve(process.cwd(), '.env') }); // Fallback
config({ path: '.env.local' }); // Original fallback
config({ path: '.env' }); // Original fallback


import { Module, Global } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

export const DRIZZLE = Symbol('DRIZZLE');

// Standalone db instance for Better Auth (non-DI usage)
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 10,
});

export const db: NodePgDatabase<typeof schema> = drizzle(pool, { schema });

@Global()
@Module({
    providers: [
        {
            provide: DRIZZLE,
            inject: [ConfigService],
            useFactory: async (configService: ConfigService) => {
                const connectionString = configService.get<string>('DATABASE_URL');

                if (!connectionString) {
                    throw new Error('DATABASE_URL is not defined');
                }

                const pool = new Pool({
                    connectionString,
                    max: 10,
                });

                return drizzle(pool, { schema });
            },
        },
    ],
    exports: [DRIZZLE],
})
export class DatabaseModule { }


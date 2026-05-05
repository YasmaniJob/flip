import { config } from 'dotenv';
config({ path: 'apps/api/.env' });
config({ path: '.env' });

console.log('PORT:', process.env.PORT);
console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Set' : 'Unset');

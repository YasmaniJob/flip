import { auth } from './src/auth/auth';

async function run() {
    console.log(Object.keys(auth.api));
}

run().catch(console.error);

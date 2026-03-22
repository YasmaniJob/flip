import { db } from './index';

async function listAllUsers() {
    const users = await db.query.users.findMany({
        columns: {
            id: true,
            email: true,
            name: true,
            institutionId: true,
            role: true,
            emailVerified: true,
        }
    });

    console.log('Total users:', users.length);
    console.log('\nUsers:');
    users.forEach(user => {
        console.log(`- ${user.email} | Name: ${user.name} | Institution: ${user.institutionId || 'NULL'} | Verified: ${user.emailVerified}`);
    });
}

listAllUsers().then(() => process.exit(0)).catch(err => {
    console.error('Error:', err);
    process.exit(1);
});

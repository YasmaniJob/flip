import { db } from './index';

async function checkUser() {
    const user = await db.query.users.findFirst({
        where: (users, { eq }) => eq(users.email, 'yasmaniguillen@ugelchuculto.edu.pe'),
    });

    console.log('User data:', JSON.stringify(user, null, 2));
}

checkUser().then(() => process.exit(0)).catch(err => {
    console.error('Error:', err);
    process.exit(1);
});

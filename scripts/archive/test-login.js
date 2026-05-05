// Test login endpoint
const testLogin = async () => {
    try {
        console.log('🧪 Testing login endpoint...\n');

        const response = await fetch('http://localhost:4000/api/auth/sign-in/email', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Origin': 'http://localhost:3000'
            },
            body: JSON.stringify({
                email: 'yasmanijguillen@gmail.com',
                password: 'yasmani2026'  // Update with correct password
            })
        });

        console.log('Status:', response.status);
        console.log('Status Text:', response.statusText);
        console.log('\nHeaders:');
        response.headers.forEach((value, key) => {
            console.log(`  ${key}: ${value}`);
        });

        const text = await response.text();
        console.log('\nResponse Body:');
        console.log(text);

        if (!response.ok) {
            console.log('\n❌ Request failed with status', response.status);
        } else {
            console.log('\n✅ Request successful');
        }
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error);
    }
};

testLogin();

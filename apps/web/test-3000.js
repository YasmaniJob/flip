fetch('http://localhost:3000/dashboard')
    .then(r => console.log('STATUS 3000:', r.status))
    .catch(console.error);

const fs = require('fs');
fetch('http://localhost:3000/dashboard')
    .then(res => res.text())
    .then(text => fs.writeFileSync('error.html', text))
    .catch(err => console.error(err));

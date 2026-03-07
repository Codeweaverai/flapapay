const http = require('http');

http.get('http://localhost:3005/admin/stats', (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        console.log("STATUS:", res.statusCode);
        console.log("DATA:", data.slice(0, 1000));
    });
}).on('error', err => console.error(err));

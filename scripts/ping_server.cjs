const http = require('http');

const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIyMzVlMTY4ZS0yNzRhLTQ1YmQtOTMyMi1lODE2NDMyNjNhODEiLCJlbWFpbCI6ImpheUBnbWFpbC5jb20iLCJ0ZW5hbnRJZCI6ImYxZjVjMjE3LTdiMzktNDAzMS05ZDc2LWI3ZGEwOTBiYWQ2NSIsImlhdCI6MTc2Njc2ODQ1MywiZXhwIjoxNzY3MzczMjUzfQ.d3RKrjq7dPqia3wGsWBX1tDfULUu6PmrbbiCZmF-Ans";

function makeRequest(path, label) {
    const options = {
        hostname: 'localhost',
        port: 5001,
        path: path,
        method: 'GET',
        headers: {
            'Cookie': `token=${token}`,
            'Content-Type': 'application/json'
        }
    };

    const req = http.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
            console.log(`\n[${label}] Status: ${res.statusCode}`);
            if (res.statusCode === 501) {
                console.log(`[${label}] Body: ${data}`); // Show error if 501
            } else if (res.statusCode === 200) {
                // console.log(`[${label}] Success`);
            } else {
                console.log(`[${label}] other status: ${res.statusCode}`);
            }
        });
    });

    req.on('error', (e) => {
        console.error(`[${label}] Problem with request: ${e.message}`);
    });

    req.end();
}

console.log("Checking Server Health...");
makeRequest('/api/health', 'Health Check');
setTimeout(() => {
    makeRequest('/api/fuel-products', 'Router Check (Fuel Products)');
}, 500);

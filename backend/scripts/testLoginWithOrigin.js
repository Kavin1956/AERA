const http = require('http');
const data = JSON.stringify({ username: 'testuser', password: 'test123' });

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data),
    'Origin': 'http://localhost:3000'
  }
};

const req = http.request(options, (res) => {
  let body = '';
  res.on('data', (chunk) => body += chunk);
  res.on('end', () => {
    console.log('STATUS:', res.statusCode);
    console.log('BODY:', body);
    console.log('HEADERS:', res.headers);
  });
});

req.on('error', (e) => console.error('Request error:', e));
req.write(data);
req.end();

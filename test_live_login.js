const https = require('https');

const postData = JSON.stringify({
  usernameOrEmail: 'admin@ethnotech.project.in',
  password: 'Eth@dm!n#56'
});

const options = {
  hostname: 'backend-five-ivory-mbo6c3m4p1.vercel.app',
  path: '/api/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData),
    'Origin': 'https://capstone.jaswanthnarne.online'
  }
};

console.log("🚀 Testing Admin Login against Vercel Production Server...");

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log(`\nHTTP Status Code: ${res.statusCode}`);
    console.log(`Access-Control-Allow-Origin: ${res.headers['access-control-allow-origin']}`);
    console.log("Response Body:", data);
  });
});

req.on('error', (e) => {
  console.error("❌ Error:", e.message);
});

req.write(postData);
req.end();

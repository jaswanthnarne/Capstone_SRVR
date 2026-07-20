const https = require('https');

function testEndpoint(method) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      usernameOrEmail: 'admin@ethnotech.project.in',
      password: 'Eth@dm!n#56'
    });

    const options = {
      hostname: 'backend-jaswanth-s.vercel.app',
      path: '/api/auth/login',
      method: method,
      headers: {
        'Origin': 'https://capstone.jaswanthnarne.online',
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    console.log(`\n🔍 Sending HTTP ${method} to https://backend-jaswanth-s.vercel.app/api/auth/login ...`);

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        console.log(`Status Code: ${res.statusCode} ${res.statusMessage}`);
        console.log(`Access-Control-Allow-Origin: ${res.headers['access-control-allow-origin']}`);
        console.log(`Body Snippet: ${body.substring(0, 150)}`);
        resolve({ status: res.statusCode, body });
      });
    });

    req.on('error', (e) => {
      console.error(`Request error: ${e.message}`);
      reject(e);
    });

    if (method === 'POST') {
      req.write(postData);
    }
    req.end();
  });
}

async function runTests() {
  try {
    await testEndpoint('OPTIONS');
    await testEndpoint('POST');
  } catch (err) {
    console.error("Test failed:", err);
  }
}

runTests();

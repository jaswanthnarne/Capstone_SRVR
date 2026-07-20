const https = require('https');

function testEndpoint(method) {
  return new Promise((resolve) => {
    const postData = JSON.stringify({
      usernameOrEmail: 'admin@ethnotech.project.in',
      password: 'Eth@dm!n#56'
    });

    const options = {
      hostname: 'backend-five-ivory-mbo6c3m4p1.vercel.app',
      path: '/api/auth/login',
      method: method,
      headers: {
        'Origin': 'https://capstone.jaswanthnarne.online',
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    console.log(`\n🔍 Sending HTTP ${method} to https://backend-five-ivory-mbo6c3m4p1.vercel.app/api/auth/login ...`);

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        console.log(`Status Code: ${res.statusCode} ${res.statusMessage}`);
        console.log(`Access-Control-Allow-Origin: ${res.headers['access-control-allow-origin']}`);
        console.log(`Access-Control-Allow-Credentials: ${res.headers['access-control-allow-credentials']}`);
        console.log(`Body Snippet: ${body.substring(0, 200)}`);
        resolve({ status: res.statusCode, body });
      });
    });

    req.on('error', (e) => {
      console.error(`Request error: ${e.message}`);
      resolve({ error: e });
    });

    if (method === 'POST') {
      req.write(postData);
    }
    req.end();
  });
}

async function runTests() {
  await testEndpoint('OPTIONS');
  await testEndpoint('POST');
}

runTests();

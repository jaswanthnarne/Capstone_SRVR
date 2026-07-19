const https = require('https');

function testPreflight() {
  const options = {
    hostname: 'backend-jaswanth-s.vercel.app',
    path: '/api/auth/login',
    method: 'OPTIONS',
    headers: {
      'Origin': 'https://capstone.jaswanthnarne.online',
      'Access-Control-Request-Method': 'POST',
      'Access-Control-Request-Headers': 'content-type, authorization'
    }
  };

  console.log("🔍 Testing CORS Preflight OPTIONS request to Vercel production backend...");

  const req = https.request(options, (res) => {
    console.log(`\nHTTP Status Code: ${res.statusCode} ${res.statusMessage}`);
    console.log("Response Headers:");
    console.log("  Access-Control-Allow-Origin:", res.headers['access-control-allow-origin']);
    console.log("  Access-Control-Allow-Credentials:", res.headers['access-control-allow-credentials']);
    console.log("  Access-Control-Allow-Methods:", res.headers['access-control-allow-methods']);
    console.log("  Access-Control-Allow-Headers:", res.headers['access-control-allow-headers']);

    if (res.statusCode === 200 && res.headers['access-control-allow-origin']) {
      console.log("\n✅ CORS Preflight check PASSED! Production backend accepts preflights from capstone.jaswanthnarne.online");
    } else {
      console.log("\n❌ CORS Preflight check failed");
    }
    process.exit(0);
  });

  req.on('error', (e) => {
    console.error(`❌ Request error: ${e.message}`);
    process.exit(1);
  });

  req.end();
}

testPreflight();

const http = require('http');
const https = require('https');

const healthcheckUrl = process.env.HEALTHCHECK_URL || `http://localhost:${process.env.PORT || 3000}/health`;
const client = healthcheckUrl.startsWith('https://') ? https : http;

client.get(healthcheckUrl, (res) => {
  if (res.statusCode === 200) {
    console.log(`Health check passed: ${healthcheckUrl}`);
    process.exit(0);
  } else {
    console.error(`Health check failed: ${healthcheckUrl} returned ${res.statusCode}`);
    process.exit(1);
  }
}).on('error', (err) => {
  console.error(`Health check error for ${healthcheckUrl}:`, err.message);
  process.exit(1);
});

const { writeSchedulerHeartbeat } = require('../apps/sentinel/src/governance/core/governanceStatus');

const heartbeat = writeSchedulerHeartbeat({
  lastJob: process.argv[2] || 'manual.governance.heartbeat',
  result: process.argv[3] || 'ok',
  maxAgeSeconds: Number(process.argv[4] || 3600)
});

console.log(JSON.stringify({
  status: 'ok',
  heartbeat
}, null, 2));

/**
 * Executive Desk API Server
 * Start Express server with all routes
 */

import { createApiApp } from './api/express-adapter';

const PORT = parseInt(process.env.API_PORT || '3000', 10);
const HOST = process.env.API_HOST || '0.0.0.0';

const app = createApiApp();

app.listen(PORT, HOST, () => {
    console.log(`✅ Executive Desk API server listening on http://${HOST}:${PORT}`);
    console.log('');
    console.log('Available endpoints:');
    console.log('  GET  /health                              — Health check (no auth)');
    console.log('  GET  /executive                           — Read-only cockpit');
    console.log('  POST /proxy/command                       — Governed read-only command proxy');
    console.log('  GET  /api/executive/receipts              — List receipts');
    console.log('  GET  /api/executive/receipts/:id          — Get receipt by ID');
    console.log('  GET  /api/executive/receipts/export       — Export receipts');
    console.log('  GET  /api/executive/receipts/stats        — Receipt statistics');
    console.log('  GET  /api/executive/delegations           — List delegations');
    console.log('  GET  /api/executive/delegations/:id       — Get delegation by ID');
    console.log('  GET  /api/executive/risk/status           — Current risk status');
    console.log('  GET  /api/executive/risk/factors          — Risk factors history');
    console.log('  GET  /api/executive/closeout/state        — Get closeout cadence + GBP/MOB state');
    console.log('  PUT  /api/executive/closeout/state        — Save closeout cadence + GBP/MOB state');
    console.log('  GET  /api/executive/closeout/mob-runs     — List MOB template runs');
    console.log('  POST /api/executive/closeout/mob-runs     — Record MOB template run');
    console.log('  GET  /api/executive/closeout/mob-runs/export — Export MOB template runs');
    console.log('  GET  /api/executive/closeout/export-bundle — Export closeout state + MOB bundle');
    console.log('');
    console.log('/api/executive endpoints require X-Principal-Id header.');
    console.log('/proxy/command requires payload.principalId and is read-only in v1.');
    console.log('');
    console.log('Example requests:');
    console.log('  curl http://localhost:3000/executive');
    console.log('  curl -H "X-Principal-Id: user@example.com" http://localhost:3000/api/executive/receipts');
    console.log('  curl -H "X-Principal-Id: user@example.com" http://localhost:3000/api/executive/risk/status');
    console.log('  curl -H "X-Principal-Id: user@example.com" http://localhost:3000/api/executive/receipts/export?format=csv');
});

export default app;

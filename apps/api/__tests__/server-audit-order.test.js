const assert = require('assert');
const os = require('os');
const path = require('path');

process.env.SENTINEL_HMAC_SECRET ||= 'synthetic-api-audit-order-test-secret';
process.env.SENTINEL_AUDIT_SPOOL_DIR = path.join(
  os.tmpdir(),
  `sentinel-api-audit-order-${process.pid}`
);
process.env.SENTINEL_API_KEYS = JSON.stringify([{
  keyId: 'audit-order-test-key',
  secret: 'synthetic-api-audit-order-key',
  tenant: 'audit-order-test',
  actor: 'audit-order-test@example.invalid',
  role: 'platform_admin',
  scopes: ['learning:read'],
  status: 'active'
}]);

const { server } = require('../server');
const { auditLogger } = require('../../sentinel/src/audit/auditLogger');

describe('API policy audit ordering', () => {
  let originalLog;
  let originalGetAll;

  before((done) => {
    server.listen(0, done);
  });

  after((done) => {
    server.close(done);
  });

  afterEach(() => {
    if (originalLog) auditLogger.log = originalLog;
    if (originalGetAll) auditLogger.getAll = originalGetAll;
    originalLog = undefined;
    originalGetAll = undefined;
  });

  it('waits for policy audit logging before drift analysis reads the audit log', async () => {
    let releaseAudit;
    let getAllCalled = false;
    let signalAuditStarted;
    const auditStarted = new Promise((resolve) => {
      signalAuditStarted = resolve;
    });
    originalLog = auditLogger.log;
    originalGetAll = auditLogger.getAll;
    auditLogger.log = () => {
      signalAuditStarted();
      return new Promise((resolve) => {
        releaseAudit = resolve;
      });
    };
    auditLogger.getAll = () => {
      getAllCalled = true;
      return [];
    };

    const address = server.address();
    const responsePromise = fetch(`http://127.0.0.1:${address.port}/drift/analyze?routeApprovals=false`, {
      headers: { 'x-api-key': 'synthetic-api-audit-order-key' }
    });
    await auditStarted;
    await new Promise((resolve) => setTimeout(resolve, 25));
    assert.equal(getAllCalled, false);

    releaseAudit();
    const response = await responsePromise;
    assert.equal(response.status, 200);
    assert.equal(getAllCalled, true);
  });
});

const test = require('node:test');
const assert = require('node:assert/strict');

const {
  validateAzureDeploymentContract
} = require('../scripts/validate-live-azure-deployment-contract.js');

const validApp = {
  properties: {
    configuration: {
      ingress: {
        targetPort: 3000
      }
    },
    template: {
      containers: [
        {
          name: 'sentinel',
          image: 'example.azurecr.io/sentinel-api:sha-abc123',
          env: [
            { name: 'PORT', value: '3000' }
          ],
          probes: [
            {
              type: 'Startup',
              httpGet: { path: '/health', port: 3000, scheme: 'HTTP' }
            },
            {
              type: 'Readiness',
              httpGet: { path: '/health', port: 3000, scheme: 'HTTP' }
            },
            {
              type: 'Liveness',
              httpGet: { path: '/health', port: 3000, scheme: 'HTTP' }
            }
          ]
        }
      ]
    }
  }
};

const validRevisions = [
  {
    name: 'sentinel--sha-abc123',
    properties: {
      active: true,
      trafficWeight: 100,
      healthState: 'Healthy',
      provisioningState: 'Provisioned',
      template: {
        containers: [{
          name: 'sentinel',
          image: 'example.azurecr.io/sentinel-api:sha-abc123',
          env: [{ name: 'PORT', value: '3000' }],
          probes: [
            {
              type: 'Startup',
              httpGet: { path: '/health', port: 3000, scheme: 'HTTP' }
            },
            {
              type: 'Readiness',
              httpGet: { path: '/health', port: 3000, scheme: 'HTTP' }
            },
            {
              type: 'Liveness',
              httpGet: { path: '/health', port: 3000, scheme: 'HTTP' }
            }
          ]
        }]
      }
    }
  }
];

test('accepts a valid Azure Container Apps deployment contract', () => {
  const result = validateAzureDeploymentContract({
    app: validApp,
    revisions: validRevisions,
    expectedImage: 'example.azurecr.io/sentinel-api:sha-abc123',
    expectedRevisionSuffix: 'sha-abc123'
  });

  assert.equal(result.ok, true);
  assert.deepEqual(result.issues, []);
});

test('accepts a revision whose image is nested under the template container', () => {
  const result = validateAzureDeploymentContract({
    app: validApp,
    revisions: [{
      name: 'sentinel--sha-abc123',
      properties: {
        active: true,
        trafficWeight: 100,
        healthState: 'Healthy',
        provisioningState: 'Provisioned',
        template: {
          containers: [{
            name: 'sentinel',
            image: 'example.azurecr.io/sentinel-api:sha-abc123',
            env: [{ name: 'PORT', value: '3000' }],
            probes: [
              { type: 'Startup', httpGet: { path: '/health', port: 3000, scheme: 'HTTP' } },
              { type: 'Readiness', httpGet: { path: '/health', port: 3000, scheme: 'HTTP' } },
              { type: 'Liveness', httpGet: { path: '/health', port: 3000, scheme: 'HTTP' } }
            ]
          }]
        }
      }
    }],
    expectedImage: 'example.azurecr.io/sentinel-api:sha-abc123',
    expectedRevisionSuffix: 'sha-abc123'
  });

  assert.equal(result.ok, true);
  assert.deepEqual(result.issues, []);
});

test('fails closed when the exact revision has no image evidence', () => {
  const result = validateAzureDeploymentContract({
    app: {
      properties: {
        configuration: { ingress: { targetPort: 3000 } },
        template: { containers: [{ name: 'sentinel', image: 'example.azurecr.io/sentinel-api:sha-xyz' }] }
      }
    },
    revisions: [{
      name: 'sentinel--sha-abc123',
      properties: {
        active: true,
        trafficWeight: 100,
        healthState: 'Healthy',
        provisioningState: 'Provisioned',
        template: { containers: [{ name: 'sentinel' }] }
      }
    }],
    expectedImage: 'example.azurecr.io/sentinel-api:sha-abc123',
    expectedRevisionSuffix: 'sha-abc123'
  });

  assert.equal(result.ok, false);
  assert.ok(result.issues.some((issue) => issue.includes('no image data')));
});

test('rejects when the supplied exact revision name does not match the expected suffix', () => {
  const mismatchedExactRevision = {
    name: 'sentinel--sha-other',
    properties: {
      active: true,
      trafficWeight: 100,
      healthState: 'Healthy',
      provisioningState: 'Provisioned',
      template: {
        containers: [{
          name: 'sentinel',
          image: 'example.azurecr.io/sentinel-api:sha-abc123',
          env: [{ name: 'PORT', value: '3000' }],
          probes: [
            { type: 'Startup', httpGet: { path: '/health', port: 3000, scheme: 'HTTP' } },
            { type: 'Readiness', httpGet: { path: '/health', port: 3000, scheme: 'HTTP' } },
            { type: 'Liveness', httpGet: { path: '/health', port: 3000, scheme: 'HTTP' } }
          ]
        }]
      }
    }
  };

  const result = validateAzureDeploymentContract({
    app: validApp,
    revisions: validRevisions,
    exactRevision: mismatchedExactRevision,
    expectedImage: 'example.azurecr.io/sentinel-api:sha-abc123',
    expectedRevisionSuffix: 'sha-abc123'
  });

  assert.equal(result.ok, false);
  assert.ok(result.issues.some((issue) => issue.includes('does not match expected suffix')));
});

test('rejects a supplied exact revision without a name', () => {
  const namelessExactRevision = {
    properties: validRevisions[0].properties
  };

  const result = validateAzureDeploymentContract({
    app: validApp,
    revisions: validRevisions,
    exactRevision: namelessExactRevision,
    expectedImage: 'example.azurecr.io/sentinel-api:sha-abc123',
    expectedRevisionSuffix: 'sha-abc123'
  });

  assert.equal(result.ok, false);
  assert.ok(result.issues.some((issue) => issue.includes('name is missing')));
});

test('rejects when the app is healthy but the exact revision is stale', () => {
  const staleExactRevision = {
    name: 'sentinel--sha-abc123',
    properties: {
      active: true,
      trafficWeight: 100,
      healthState: 'Healthy',
      provisioningState: 'Provisioned',
      template: {
        containers: [{
          name: 'sentinel',
          image: 'example.azurecr.io/sentinel-api:sha-abc123',
          env: [{ name: 'PORT', value: '3000' }],
          probes: [{ type: 'Startup', httpGet: { path: '/status', port: 80, scheme: 'HTTP' } }]
        }]
      }
    }
  };

  const result = validateAzureDeploymentContract({
    app: validApp,
    revisions: validRevisions,
    exactRevision: staleExactRevision,
    expectedImage: 'example.azurecr.io/sentinel-api:sha-abc123',
    expectedRevisionSuffix: 'sha-abc123'
  });

  assert.equal(result.ok, false);
  assert.ok(result.issues.some((issue) => issue.toLowerCase().includes('required probe types')));
});

test('rejects malformed port and probe state', () => {
  const result = validateAzureDeploymentContract({
    app: {
      properties: {
        configuration: { ingress: { targetPort: 80 } },
        template: {
          containers: [{
            name: 'sentinel',
            image: 'example.azurecr.io/sentinel-api:sha-xyz',
            env: [{ name: 'PORT', value: '8080' }],
            probes: [{ type: 'Startup', httpGet: { path: '/status', port: 80, scheme: 'HTTP' } }]
          }]
        }
      }
    },
    revisions: [{
      name: 'sentinel--sha-abc123',
      properties: {
        active: true,
        trafficWeight: 100,
        healthState: 'Unhealthy',
        provisioningState: 'Failed',
        template: {
          containers: [{
            name: 'sentinel',
            image: 'example.azurecr.io/sentinel-api:sha-xyz',
            env: [{ name: 'PORT', value: '8080' }],
            probes: [{ type: 'Startup', httpGet: { path: '/status', port: 80, scheme: 'HTTP' } }]
          }]
        }
      }
    }],
    exactRevision: {
      name: 'sentinel--sha-abc123',
      properties: {
        active: true,
        trafficWeight: 100,
        healthState: 'Unhealthy',
        provisioningState: 'Failed',
        template: {
          containers: [{
            name: 'sentinel',
            image: 'example.azurecr.io/sentinel-api:sha-xyz',
            env: [{ name: 'PORT', value: '8080' }],
            probes: [{ type: 'Startup', httpGet: { path: '/status', port: 80, scheme: 'HTTP' } }]
          }]
        }
      }
    },
    expectedImage: 'example.azurecr.io/sentinel-api:sha-abc123',
    expectedRevisionSuffix: 'sha-abc123'
  });

  assert.equal(result.ok, false);
  assert.ok(result.issues.some((issue) => issue.includes('PORT')));
  assert.ok(result.issues.some((issue) => issue.includes('Ingress targetPort')));
  assert.ok(result.issues.some((issue) => issue.toLowerCase().includes('required probe types')));
  assert.ok(result.issues.some((issue) => issue.includes('healthState')));
});

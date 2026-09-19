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
    name: 'sentinel-sha-abc123-1',
    properties: {
      active: true,
      trafficWeight: 100,
      healthState: 'Healthy',
      provisioningState: 'Provisioned',
      template: {
        containers: [{
          name: 'sentinel',
          image: 'example.azurecr.io/sentinel-api:sha-abc123'
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
      name: 'sentinel-sha-abc123-9',
      properties: {
        active: true,
        trafficWeight: 100,
        healthState: 'Healthy',
        provisioningState: 'Provisioned',
        template: {
          containers: [{
            name: 'sentinel',
            image: 'example.azurecr.io/sentinel-api:sha-abc123'
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
      name: 'sentinel-sha-abc123-9',
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
      name: 'sentinel-sha-abc123-99',
      properties: {
        active: true,
        trafficWeight: 100,
        healthState: 'Unhealthy',
        provisioningState: 'Failed'
      }
    }],
    expectedImage: 'example.azurecr.io/sentinel-api:sha-abc123',
    expectedRevisionSuffix: 'sha-abc123'
  });

  assert.equal(result.ok, false);
  assert.ok(result.issues.some((issue) => issue.includes('PORT')));
  assert.ok(result.issues.some((issue) => issue.includes('Ingress targetPort')));
  assert.ok(result.issues.some((issue) => issue.includes('Required probe types')));
  assert.ok(result.issues.some((issue) => issue.includes('healthState')));
});

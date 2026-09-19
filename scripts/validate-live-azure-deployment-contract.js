const fs = require('node:fs');

function getSentinelContainer(app) {
  const containers = app?.properties?.template?.containers ?? [];
  return containers.find((container) => container?.name === 'sentinel') ?? null;
}

function getPortValue(container) {
  const env = container?.env ?? [];
  const portEntry = env.find((entry) => entry?.name === 'PORT');
  return portEntry?.value ?? '';
}

function getHealthProbeTypes(probes) {
  return (probes ?? [])
    .filter((probe) => probe && typeof probe === 'object')
    .map((probe) => probe.type)
    .filter(Boolean);
}

function validateAzureDeploymentContract({
  app,
  revisions,
  expectedImage,
  expectedRevisionSuffix,
  requiredTrafficWeight = 100,
  expectedPort = '3000'
}) {
  const issues = [];

  const container = getSentinelContainer(app);
  if (!container) {
    issues.push('No sentinel container found in the live app configuration.');
    return { ok: false, issues };
  }

  const ingressPort = app?.properties?.configuration?.ingress?.targetPort;
  if (String(ingressPort) !== expectedPort) {
    issues.push(`Ingress targetPort mismatch: expected ${expectedPort}, got ${ingressPort}.`);
  }

  const image = container.image;
  if (image !== expectedImage) {
    issues.push(`Container image mismatch: expected ${expectedImage}, got ${image}.`);
  }

  const portValue = getPortValue(container);
  if (String(portValue) !== expectedPort) {
    issues.push(`PORT mismatch: expected ${expectedPort}, got ${portValue}.`);
  }

  const requiredProbeTypes = ['Startup', 'Readiness', 'Liveness'];
  const probes = container.probes ?? [];
  const seenTypes = getHealthProbeTypes(probes);
  const missing = requiredProbeTypes.filter((type) => !seenTypes.includes(type));
  if (missing.length > 0) {
    issues.push(`Required probe types missing: ${missing.join(', ')}.`);
  }

  for (const probe of probes) {
    if (!probe || typeof probe !== 'object') continue;
    if (requiredProbeTypes.includes(probe.type)) {
      const httpGet = probe.httpGet ?? {};
      if (httpGet.path !== '/health') {
        issues.push(`Probe ${probe.type} path mismatch: expected /health, got ${httpGet.path}.`);
      }
      if (String(httpGet.port) !== expectedPort) {
        issues.push(`Probe ${probe.type} port mismatch: expected ${expectedPort}, got ${httpGet.port}.`);
      }
    }
  }

  const revisionList = Array.isArray(revisions) ? revisions : [];
  if (revisionList.length === 0) {
    issues.push('No revisions were returned for validation.');
    return { ok: false, issues };
  }

  const matchingRevision = revisionList.find((revision) => {
    const name = revision?.name ?? '';
    return name.includes(expectedRevisionSuffix) && revision?.properties?.trafficWeight === requiredTrafficWeight;
  });

  if (!matchingRevision) {
    issues.push(`No active revision matching suffix ${expectedRevisionSuffix} and trafficWeight ${requiredTrafficWeight} was found.`);
  }

  const active = revisionList.filter((revision) => revision?.properties?.active === true);
  if (active.length === 0) {
    issues.push('No active revision was found.');
  }

  const trafficWeighted = revisionList.filter((revision) => revision?.properties?.trafficWeight === requiredTrafficWeight);
  if (trafficWeighted.length === 0) {
    issues.push(`No revision with trafficWeight ${requiredTrafficWeight} was found.`);
  }

  for (const revision of revisionList) {
    const props = revision?.properties ?? {};
    if (props.healthState && props.healthState !== 'Healthy') {
      issues.push(`Revision ${revision?.name ?? 'unknown'} healthState is not Healthy: ${props.healthState}.`);
    }
    if (props.provisioningState && props.provisioningState !== 'Provisioned') {
      issues.push(`Revision ${revision?.name ?? 'unknown'} provisioningState is not Provisioned: ${props.provisioningState}.`);
    }
  }

  return {
    ok: issues.length === 0,
    issues
  };
}

if (require.main === module) {
  const appPath = process.argv[2] || process.env.AZURE_DEPLOYMENT_CONTRACT_APP_PATH;
  const revisionsPath = process.argv[3] || process.env.AZURE_DEPLOYMENT_CONTRACT_REVISIONS_PATH;

  const app = appPath ? JSON.parse(fs.readFileSync(appPath, 'utf8')) : {};
  const revisions = revisionsPath ? JSON.parse(fs.readFileSync(revisionsPath, 'utf8')) : [];

  const payload = {
    app,
    revisions,
    expectedImage: process.env.EXPECTED_IMAGE || '',
    expectedRevisionSuffix: process.env.EXPECTED_REVISION_SUFFIX || '',
    expectedPort: process.env.EXPECTED_PORT || '3000',
    requiredTrafficWeight: Number(process.env.REQUIRED_TRAFFIC_WEIGHT || 100)
  };

  const result = validateAzureDeploymentContract(payload);
  if (!result.ok) {
    console.error('Azure deployment contract validation failed:');
    for (const issue of result.issues) {
      console.error(`- ${issue}`);
    }
    process.exit(1);
  }

  console.log('Azure deployment contract validation passed.');
}

module.exports = {
  validateAzureDeploymentContract,
  getSentinelContainer,
  getPortValue,
  getHealthProbeTypes
};

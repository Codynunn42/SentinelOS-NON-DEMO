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
  const expectedSuffix = String(expectedRevisionSuffix ?? '').trim();
  if (!expectedSuffix) {
    issues.push('Expected revision suffix is empty.');
    return { ok: false, issues };
  }

  const matchingRevisions = revisionList.filter((revision) => {
    const name = String(revision?.name ?? '');
    return name.includes(expectedSuffix);
  });

  if (matchingRevisions.length === 0) {
    issues.push(`No revision matching suffix ${expectedSuffix} was found.`);
    return { ok: false, issues };
  }

  const expectedRevision = matchingRevisions.find((revision) => {
    const props = revision?.properties ?? {};
    return props.active === true && Number(props.trafficWeight ?? -1) === requiredTrafficWeight;
  }) || matchingRevisions[0];

  if (!expectedRevision) {
    issues.push(`Expected revision suffix ${expectedSuffix} was not found in the active revision set.`);
    return { ok: false, issues };
  }

  const expectedProps = expectedRevision?.properties ?? {};
  if (expectedProps.active !== true) {
    issues.push(`Expected revision ${expectedRevision?.name ?? expectedSuffix} is not active.`);
  }
  if (Number(expectedProps.trafficWeight ?? -1) !== requiredTrafficWeight) {
    issues.push(`Expected revision ${expectedRevision?.name ?? expectedSuffix} does not carry ${requiredTrafficWeight}% traffic.`);
  }
  if (expectedProps.healthState !== 'Healthy') {
    issues.push(`Expected revision ${expectedRevision?.name ?? expectedSuffix} healthState is not Healthy: ${expectedProps.healthState}.`);
  }
  if (expectedProps.provisioningState !== 'Provisioned') {
    issues.push(`Expected revision ${expectedRevision?.name ?? expectedSuffix} provisioningState is not Provisioned: ${expectedProps.provisioningState}.`);
  }

  const revisionImage =
    expectedRevision?.image ??
    expectedRevision?.properties?.template?.containers?.find((container) => container?.name === 'sentinel')?.image ??
    expectedRevision?.properties?.containers?.find((container) => container?.name === 'sentinel')?.image ??
    '';

  if (!revisionImage) {
    issues.push(`Expected revision ${expectedRevision?.name ?? expectedSuffix} has no image data under the named sentinel container.`);
  }

  if (revisionImage && revisionImage !== expectedImage) {
    issues.push(`Expected revision image mismatch: expected ${expectedImage}, got ${revisionImage}.`);
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

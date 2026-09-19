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
  exactRevision,
  expectedImage,
  expectedRevisionSuffix,
  requiredTrafficWeight = 100,
  expectedPort = '3000'
}) {
  const issues = [];

  const ingressPort = app?.properties?.configuration?.ingress?.targetPort;
  if (String(ingressPort) !== expectedPort) {
    issues.push(`Ingress targetPort mismatch: expected ${expectedPort}, got ${ingressPort}.`);
  }

  const revisionList = Array.isArray(revisions) ? revisions : [];
  const expectedSuffix = String(expectedRevisionSuffix ?? '').trim();
  if (!expectedSuffix) {
    issues.push('Expected revision suffix is empty.');
    return { ok: false, issues };
  }

  const exactRevisionCandidate = exactRevision && typeof exactRevision === 'object'
    ? exactRevision
    : revisionList.find((revision) => String(revision?.name ?? '').includes(expectedSuffix)) || null;

  if (!exactRevisionCandidate) {
    issues.push(`No revision matching suffix ${expectedSuffix} was found.`);
    return { ok: false, issues };
  }

  const exactRevisionName = String(exactRevisionCandidate?.name ?? '');
  if (exactRevisionName && !exactRevisionName.includes(expectedSuffix)) {
    issues.push(`Exact revision ${exactRevisionName} does not match expected suffix ${expectedSuffix}.`);
    return { ok: false, issues };
  }

  const revisionProps = exactRevisionCandidate?.properties ?? {};
  const targetContainer =
    revisionProps?.template?.containers?.find((container) => container?.name === 'sentinel') ??
    revisionProps?.containers?.find((container) => container?.name === 'sentinel') ??
    null;

  if (!targetContainer) {
    issues.push(`Expected revision ${exactRevisionCandidate?.name ?? expectedSuffix} has no sentinel container in its template.`);
    return { ok: false, issues };
  }

  const image = targetContainer.image;
  if (!image) {
    issues.push(`Expected revision ${exactRevisionCandidate?.name ?? expectedSuffix} has no image data under the named sentinel container.`);
  }
  if (image && image !== expectedImage) {
    issues.push(`Expected revision image mismatch: expected ${expectedImage}, got ${image}.`);
  }

  const portValue = (targetContainer.env ?? []).find((entry) => entry?.name === 'PORT')?.value ?? '';
  if (String(portValue) !== expectedPort) {
    issues.push(`Exact revision PORT mismatch: expected ${expectedPort}, got ${portValue}.`);
  }

  const requiredProbeTypes = ['Startup', 'Readiness', 'Liveness'];
  const probes = targetContainer.probes ?? [];
  const seenTypes = getHealthProbeTypes(probes);
  const missing = requiredProbeTypes.filter((type) => !seenTypes.includes(type));
  if (missing.length > 0) {
    issues.push(`Exact revision missing required probe types: ${missing.join(', ')}.`);
  }

  for (const probe of probes) {
    if (!probe || typeof probe !== 'object') continue;
    if (requiredProbeTypes.includes(probe.type)) {
      const httpGet = probe.httpGet ?? {};
      if (httpGet.path !== '/health') {
        issues.push(`Exact revision probe ${probe.type} path mismatch: expected /health, got ${httpGet.path}.`);
      }
      if (String(httpGet.port) !== expectedPort) {
        issues.push(`Exact revision probe ${probe.type} port mismatch: expected ${expectedPort}, got ${httpGet.port}.`);
      }
    }
  }

  if (revisionProps.active !== true) {
    issues.push(`Expected revision ${exactRevisionCandidate?.name ?? expectedSuffix} is not active.`);
  }
  if (Number(revisionProps.trafficWeight ?? -1) !== requiredTrafficWeight) {
    issues.push(`Expected revision ${exactRevisionCandidate?.name ?? expectedSuffix} does not carry ${requiredTrafficWeight}% traffic.`);
  }
  if (revisionProps.healthState !== 'Healthy') {
    issues.push(`Expected revision ${exactRevisionCandidate?.name ?? expectedSuffix} healthState is not Healthy: ${revisionProps.healthState}.`);
  }
  if (revisionProps.provisioningState !== 'Provisioned') {
    issues.push(`Expected revision ${exactRevisionCandidate?.name ?? expectedSuffix} provisioningState is not Provisioned: ${revisionProps.provisioningState}.`);
  }

  return {
    ok: issues.length === 0,
    issues
  };
}

if (require.main === module) {
  const appPath = process.argv[2] || process.env.AZURE_DEPLOYMENT_CONTRACT_APP_PATH;
  const revisionsPath = process.argv[3] || process.env.AZURE_DEPLOYMENT_CONTRACT_REVISIONS_PATH;
  const exactRevisionPath = process.argv[4] || process.env.AZURE_DEPLOYMENT_CONTRACT_EXACT_REVISION_PATH;

  const app = appPath ? JSON.parse(fs.readFileSync(appPath, 'utf8')) : {};
  const revisions = revisionsPath ? JSON.parse(fs.readFileSync(revisionsPath, 'utf8')) : [];
  const exactRevision = exactRevisionPath ? JSON.parse(fs.readFileSync(exactRevisionPath, 'utf8')) : null;

  const payload = {
    app,
    revisions,
    exactRevision,
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

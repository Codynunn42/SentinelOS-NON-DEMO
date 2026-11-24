'use strict';

const clone = (value) => structuredClone(value);

function setPath(target, dottedPath, value) {
  const parts = dottedPath.split('.');
  const final = parts.pop();
  let cursor = target;
  for (const part of parts) {
    if (!cursor[part] || typeof cursor[part] !== 'object') {
      cursor[part] = {};
    }
    cursor = cursor[part];
  }
  cursor[final] = clone(value);
}

function applyOverrides(target, overrides = {}) {
  for (const [dottedPath, value] of Object.entries(overrides)) {
    setPath(target, dottedPath, value);
  }
}

function normalizeIndex(value) {
  return Number.isFinite(value) ? value : null;
}

function hasMissingHourlyValue(values) {
  return !Array.isArray(values)
    || values.length !== 24
    || values.some((value) => !Number.isFinite(value));
}

function calculateWindow(model, window) {
  const rejectionCodes = [];
  const storage = [model.water.startingStorageM3];
  let turbineVolumeM3 = 0;
  let modeledEnergyKWh = 0;
  const modeledEmissionsAvoidedKgCO2e = [];
  const duration = window.endHour - window.startHour;

  for (let hour = 0; hour < 24; hour += 1) {
    const isGenerationHour = hour >= window.startHour && hour < window.endHour;
    const turbineM3ThisHour = isGenerationHour
      ? model.energy.turbineVolumeM3 / duration
      : 0;
    const energyKWhThisHour = isGenerationHour
      ? model.energy.modeledEnergyKWh / duration
      : 0;
    const inflow = model.water.hourlyInflowM3[hour];
    const bypass = model.water.hourlyEnvironmentalBypassM3[hour];
    const spill = model.water.hourlySpillM3[hour];
    turbineVolumeM3 += turbineM3ThisHour;
    modeledEnergyKWh += energyKWhThisHour;

    storage.push(
      storage[hour] + inflow - bypass - spill - turbineM3ThisHour
    );
    if (isGenerationHour && Number.isFinite(model.grid.hourlyMarginalKgCO2ePerMWh[hour])) {
      modeledEmissionsAvoidedKgCO2e.push(
        energyKWhThisHour / 1000 * model.grid.hourlyMarginalKgCO2ePerMWh[hour]
      );
    }
  }

  for (let hour = 0; hour < 24; hour += 1) {
    if (model.water.hourlyEnvironmentalBypassM3[hour] < model.water.requiredHourlyEnvironmentalBypassM3) {
      if (!rejectionCodes.includes('ENVIRONMENTAL_BYPASS_VIOLATION')) {
        rejectionCodes.push('ENVIRONMENTAL_BYPASS_VIOLATION');
      }
    }
  }

  if (storage.some((value) => value < model.water.minimumStorageM3)) {
    rejectionCodes.push('MIN_STORAGE_EXCEEDED');
  }
  if (storage.some((value) => value > model.water.maximumStorageM3)) {
    rejectionCodes.push('MAX_STORAGE_EXCEEDED');
  }
  if (Math.abs(storage[24] - model.water.targetEndingStorageM3) > model.water.storageToleranceM3) {
    rejectionCodes.push('TARGET_END_STORAGE_NOT_MET');
  }
  if (Math.abs(modeledEnergyKWh - model.energy.dailyEnergyTargetKWh) > model.energy.energyToleranceKWh) {
    rejectionCodes.push('ENERGY_TARGET_NOT_MET');
  }

  const firstViolationHour = storage.findIndex(
    (value) => value < model.water.minimumStorageM3 || value > model.water.maximumStorageM3
  );

  return {
    id: window.id,
    label: window.label,
    startHour: window.startHour,
    endHour: window.endHour,
    feasible: rejectionCodes.length === 0,
    rejectionCodes,
    firstViolationHour: firstViolationHour === -1 ? null : firstViolationHour,
    storageM3: storage.map(normalizeIndex),
    minimumStorageM3: Math.min(...storage),
    maximumStorageM3: Math.max(...storage),
    endingStorageM3: storage[24],
    turbineVolumeM3,
    modeledEnergyKWh,
    modeledEmissionsAvoidedKgCO2e: modeledEmissionsAvoidedKgCO2e.reduce(
      (total, value) => total + value,
      0
    ),
    modeledReboundCostKgCO2e: window.modeledReboundCostKgCO2e || 0
  };
}

function evaluateEvidence(model) {
  const codes = [];
  if (hasMissingHourlyValue(model.water.hourlyInflowM3)) {
    codes.push('MISSING_INFLOW_DATA');
  }
  if (hasMissingHourlyValue(model.water.hourlyEnvironmentalBypassM3)) {
    codes.push('MISSING_ENVIRONMENTAL_BYPASS_DATA');
  }
  if (model.grid.dataAgeMinutes > model.evidence.maxGridDataAgeMinutes) {
    codes.push('STALE_GRID_DATA');
  }
  if (model.forecast.uncertainty > model.evidence.maxForecastUncertainty) {
    codes.push('FORECAST_UNCERTAINTY_TOO_HIGH');
  }
  if (!model.evidence.inputVersion || !model.evidence.forecastVersion) {
    codes.push('MISSING_EVIDENCE_VERSION');
  }
  return codes;
}

function evaluateCase(dataset, scenario) {
  const model = clone(dataset);
  applyOverrides(model, scenario.overrides);

  const selectedIds = scenario.candidateIds || model.defaultAlternativeIds;
  const windows = [
    { ...model.baselineWindow, id: 'baseline', label: 'Canonical baseline' },
    ...selectedIds.map((id) => model.candidateWindows.find((candidate) => candidate.id === id))
  ];
  if (windows.some((window) => !window)) {
    throw new Error(`UNKNOWN_CANDIDATE_ID:${scenario.id}`);
  }

  const evidenceCodes = evaluateEvidence(model);
  const candidates = evidenceCodes.length
    ? []
    : windows.map((window) => calculateWindow(model, window));
  const baseline = candidates.find((candidate) => candidate.id === 'baseline') || null;
  const alternatives = candidates.filter((candidate) => candidate.id !== 'baseline');
  const feasibleAlternatives = alternatives.filter((candidate) => candidate.feasible);
  const rejectionCodes = [];

  let synapseOutcome;
  let selectedAlternative = null;
  let improvementKgCO2e = 0;

  if (evidenceCodes.length) {
    synapseOutcome = 'INSUFFICIENT_EVIDENCE';
    rejectionCodes.push(...evidenceCodes);
  } else if (scenario.baselineOnly && baseline?.feasible) {
    synapseOutcome = 'BASELINE_VALID';
  } else if (!baseline || !baseline.feasible || !feasibleAlternatives.length) {
    synapseOutcome = 'INFEASIBLE';
    rejectionCodes.push(...alternatives.flatMap((candidate) => candidate.rejectionCodes));
    if (!baseline.feasible) {
      rejectionCodes.push(...baseline.rejectionCodes);
    }
  } else {
    const factorMissing = feasibleAlternatives.some(
      (candidate) => candidate.modeledEmissionsAvoidedKgCO2e === 0
    ) || baseline.modeledEmissionsAvoidedKgCO2e === 0;
    if (factorMissing || selectedIds.some((id) => model.grid.requiredCandidateFactorsMissing.includes(id))) {
      synapseOutcome = 'INSUFFICIENT_EVIDENCE';
      rejectionCodes.push('MISSING_REQUIRED_EMISSIONS_FACTOR');
    } else {
      const ranked = feasibleAlternatives.map((candidate) => ({
        candidate,
        netImprovementKgCO2e:
          candidate.modeledEmissionsAvoidedKgCO2e
          - candidate.modeledReboundCostKgCO2e
          - baseline.modeledEmissionsAvoidedKgCO2e
      })).sort((left, right) =>
        right.netImprovementKgCO2e - left.netImprovementKgCO2e
        || left.candidate.id.localeCompare(right.candidate.id)
      );
      const best = ranked[0];
      selectedAlternative = best.candidate;
      improvementKgCO2e = best.netImprovementKgCO2e;
      synapseOutcome = improvementKgCO2e > 0
        ? 'MODELED_IMPROVEMENT'
        : 'NO_IMPROVEMENT_FOUND';
    }
  }

  const authorization = scenario.authorization || {};
  const authorizationValid = authorization.state === 'VALID'
    && authorization.expiresAfter !== true
    && authorization.evidenceChangedAfterApproval !== true;
  const humanDecision = authorization.humanDecision || 'NOT_PROVIDED';
  const otResponse = scenario.simulatedOt?.response || 'NOT_CALLED';
  let sentinelDisposition;
  let simulatedOtResponse = 'NOT_CALLED';
  let simulatedExecution = false;
  let receiptComplete = true;

  if (synapseOutcome === 'INSUFFICIENT_EVIDENCE' || synapseOutcome === 'INFEASIBLE') {
    sentinelDisposition = 'HOLD';
  } else if (synapseOutcome === 'BASELINE_VALID') {
    sentinelDisposition = 'NO_ACTION';
  } else if (synapseOutcome === 'NO_IMPROVEMENT_FOUND') {
    sentinelDisposition = 'NO_ACTION';
  } else if (!authorizationValid || humanDecision !== 'APPROVE') {
    sentinelDisposition = authorization.expiresAfter === true
      || authorization.evidenceChangedAfterApproval === true
      ? 'HOLD'
      : humanDecision === 'REJECT'
      ? 'HUMAN_REJECTED'
      : humanDecision === 'ABORT'
        ? 'HUMAN_ABORTED'
        : 'OPERATOR_REVIEW_REQUIRED';
    if (authorization.expiresAfter === true) rejectionCodes.push('AUTHORIZATION_EXPIRED');
    if (authorization.evidenceChangedAfterApproval === true) {
      rejectionCodes.push('AUTHORIZATION_EVIDENCE_MISMATCH');
    }
  } else if (scenario.execution?.duplicate === true) {
    sentinelDisposition = 'HOLD';
    rejectionCodes.push('DUPLICATE_EXECUTION_BLOCKED');
  } else {
    sentinelDisposition = 'RECOMMEND';
    simulatedOtResponse = otResponse;
    if (otResponse === 'REJECTED') {
      sentinelDisposition = 'HOLD';
      rejectionCodes.push('SIMULATED_OT_REJECTED');
    } else if (otResponse === 'UNAVAILABLE' || otResponse === 'FAULT') {
      sentinelDisposition = 'HOLD';
      rejectionCodes.push(`SIMULATED_OT_${otResponse}`);
    } else if (otResponse === 'ACCEPTED') {
      simulatedExecution = true;
    }
  }

  if (scenario.receipt?.missingComponents?.length) {
    receiptComplete = false;
    rejectionCodes.push('EVIDENCE_RECEIPT_INCOMPLETE');
  }

  let finalDisposition;
  if (!receiptComplete) {
    finalDisposition = 'EVIDENCE_INCOMPLETE';
  } else if (simulatedExecution) {
    finalDisposition = 'EXECUTED_VERIFIED';
  } else if (sentinelDisposition === 'HUMAN_REJECTED') {
    finalDisposition = 'REJECTED_BY_HUMAN';
  } else if (sentinelDisposition === 'HUMAN_ABORTED') {
    finalDisposition = 'ABORTED_BY_HUMAN';
  } else if (synapseOutcome === 'MODELED_IMPROVEMENT') {
    finalDisposition = sentinelDisposition === 'HOLD'
      ? 'HOLD'
      : 'MODELED_IMPROVEMENT_PENDING_AUTHORIZATION';
  } else if (synapseOutcome === 'NO_IMPROVEMENT_FOUND') {
    finalDisposition = 'NO_IMPROVEMENT_FOUND';
  } else if (synapseOutcome === 'BASELINE_VALID') {
    finalDisposition = 'BASELINE_VERIFIED';
  } else if (synapseOutcome === 'INFEASIBLE') {
    finalDisposition = 'INFEASIBLE';
  } else {
    finalDisposition = synapseOutcome === 'INSUFFICIENT_EVIDENCE'
      ? 'INSUFFICIENT_EVIDENCE_HOLD'
      : 'NO_ACTION';
  }

  return {
    caseId: scenario.id,
    synapseOutcome,
    sentinelDisposition,
    humanDecision,
    authorizationValid,
    simulatedOtResponse,
    simulatedExecution,
    finalDisposition,
    selectedCandidateId: selectedAlternative?.id || null,
    improvementKgCO2e: improvementKgCO2e,
    candidates,
    rejectionCodes: [...new Set(rejectionCodes)].sort(),
    receipt: {
      complete: receiptComplete,
      missingComponents: scenario.receipt?.missingComponents || []
    }
  };
}

module.exports = {
  calculateWindow,
  evaluateCase
};

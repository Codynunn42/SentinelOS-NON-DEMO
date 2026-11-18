'use strict';
// Research-only, JSON-data contract; not commissioned physical control.
class SynapseEcoEvaluator {
  constructor(userConfig = {}) {
    this.configErrors = [];
    this.config = this._deepFreeze(this._initializeAndValidateConfig(userConfig));
  }

  evaluate(payload, options = {}) {
    const startTime = process.hrtime.bigint();
    const startCpu = process.cpuUsage();
    const startRss = process.memoryUsage().rss;

    // 0. Configuration Guard
    if (this.configErrors.length > 0) {
      return this._formatRejection("INSUFFICIENT_EVIDENCE", this.configErrors, startTime, startCpu, startRss);
    }

    // 1. Safe Options & Reference Time Parsing
    if (options !== null && options !== undefined && (typeof options !== "object" || Array.isArray(options))) {
      return this._formatRejection("INSUFFICIENT_EVIDENCE", ["Options parameter must be a non-null object if provided."], startTime, startCpu, startRss);
    }
    const safeOptions = options && typeof options === "object" ? options : {};
    const asOfResult = this._parseReferenceTime(safeOptions.asOf);
    if (!asOfResult.valid) {
      return this._formatRejection("INSUFFICIENT_EVIDENCE", [asOfResult.error], startTime, startCpu, startRss);
    }
    const asOfTime = asOfResult.date;

    // 2. Comprehensive Payload, Provenance, Coverage & Freshness Validation
    const validation = this._validatePayload(payload, asOfTime);
    if (!validation.valid) {
      return this._formatRejection("INSUFFICIENT_EVIDENCE", validation.reasons, startTime, startCpu, startRss);
    }

    const { telemetry, forecast } = payload;
    const horizonHours = forecast.intervals.length;

    // 3. Initial Thermal Envelope Invariant Check
    if (telemetry.currentZoneTempC < this.config.tempLimits.minC || telemetry.currentZoneTempC > this.config.tempLimits.maxC) {
      return this._formatRejection(
        "INFEASIBLE",
        [`Initial temperature (${telemetry.currentZoneTempC}C) breaches comfort envelope [${this.config.tempLimits.minC}C, ${this.config.tempLimits.maxC}C].`],
        startTime,
        startCpu,
        startRss
      );
    }

    // 4. Baseline Simulation (Thermostatic hold at baselineSetPointC)
    const baselineSim = this._simulateSchedule({
      horizonHours,
      initialTempC: telemetry.currentZoneTempC,
      forecast,
      mode: "BASELINE"
    });

    if (!baselineSim.feasible) {
      const status = baselineSim.isOverflow ? "INSUFFICIENT_EVIDENCE" : "INFEASIBLE";
      return this._formatRejection(
        status,
        [`Baseline schedule failure: ${baselineSim.failureReason}`],
        startTime,
        startCpu,
        startRss
      );
    }

    // 5. Proposed Load-Shift Optimization with Terminal Boundary Condition
    const proposedSim = this._optimizeLoadShift({
      horizonHours,
      initialTempC: telemetry.currentZoneTempC,
      forecast,
      baselineCost: baselineSim.totalCostUSD,
      targetEndTempC: baselineSim.finalTempC
    });

    if (!proposedSim.feasible) {
      const status = proposedSim.isOverflow ? "INSUFFICIENT_EVIDENCE" : "NO_IMPROVEMENT_FOUND";
      return this._formatRejection(
        status,
        [`No valid load-shift schedule identified: ${proposedSim.failureReason}`],
        startTime,
        startCpu,
        startRss
      );
    }

    // 6. Verify Terminal Temperature Parity within Explicit Tolerance (±0.15°C)
    const finalTempDelta = Math.abs(proposedSim.finalTempC - baselineSim.finalTempC);
    if (!Number.isFinite(finalTempDelta) || finalTempDelta > 0.15) {
      return this._formatRejection(
        "NO_IMPROVEMENT_FOUND",
        [`Terminal state mismatch: Proposed end temp (${proposedSim.finalTempC.toFixed(2)}C) does not match baseline (${baselineSim.finalTempC.toFixed(2)}C) within ±0.15C tolerance.`],
        startTime,
        startCpu,
        startRss
      );
    }

    // 7. Counterfactual Calculations & Numeric Validation
    const deltaEmissionsGrams = baselineSim.totalEmissionsGrams - proposedSim.totalEmissionsGrams;
    const deltaCostUSD = baselineSim.totalCostUSD - proposedSim.totalCostUSD;
    const deltaEnergyKWh = proposedSim.totalEnergyKWh - baselineSim.totalEnergyKWh;

    if (!Number.isFinite(deltaEmissionsGrams) || !Number.isFinite(deltaCostUSD) || !Number.isFinite(deltaEnergyKWh)) {
      return this._formatRejection(
        "INSUFFICIENT_EVIDENCE",
        ["Counterfactual calculations produced non-finite values."],
        startTime,
        startCpu,
        startRss
      );
    }

    if (deltaEmissionsGrams <= 0) {
      return this._formatRejection(
        "NO_IMPROVEMENT_FOUND",
        ["Load-shift optimization did not achieve lower emissions than baseline."],
        startTime,
        startCpu,
        startRss
      );
    }

    const pctReduction = (deltaEmissionsGrams / baselineSim.totalEmissionsGrams) * 100;
    if (!Number.isFinite(pctReduction)) return this._formatRejection('INSUFFICIENT_EVIDENCE', ['Non-finite percentage.'], startTime, startCpu, startRss);
    const endCpu = process.cpuUsage(startCpu);
    const endRss = process.memoryUsage().rss;
    const endDurationNs = Number(process.hrtime.bigint() - startTime);

    const lastInterval = forecast.intervals[horizonHours - 1];
    const coverageEndTimeMs = new Date(lastInterval.intervalStart).getTime() + lastInterval.durationMinutes * 60000;

    // 8. Assemble Harmonized Forethought & SentinelOS Advisory Review Packet
    const resultArtifact = {
      status: "MODELED_IMPROVEMENT",
      evaluationType: "MODELED_SHADOW_FINDING_UNVERIFIED",
      facilityId: this.config.facilityId,
      timestamp: asOfTime.toISOString(),
      primaryObjective: "MINIMIZE_CARBON_EMISSIONS_SUBJECT_TO_COST_CEILING",
      
      // Forethought Core Advisory Schema
      forethought: {
        supportedConclusion: `Modeled pre-cooling across ${horizonHours}h reduces emissions by ${deltaEmissionsGrams.toFixed(1)}g CO2 (${pctReduction.toFixed(1)}%) with net savings of $${deltaCostUSD.toFixed(2)} while preserving the comfort envelope and terminal thermal balance.`,
        epistemicGaps: [
          'Thermal R/C/COP and comfort policy are provisional; facility calibration is outstanding.',
          'Forecasts and constant COP are model inputs, not measured realized savings.',
          'Latest telemetry is assumed unchanged until simulation start; intervening thermal dynamics are not observed.'
        ],
        unresolvedConflicts: [],
        nextUsefulStep: "Submit review packet to Executive Desk for operator authorization. System remains in shadow advisory mode."
      },

      // SentinelOS Boundary Verification Receipt
      sentinelBoundary: {
        advisoryOnly: true,
        writeExecutionBlocked: true,
        evidenceType: "ADVISORY_DECLARATION_ONLY",
        enforcedEnvelope: [this.config.tempLimits.minC, this.config.tempLimits.maxC]
      },

      provenance: {
        carbonSource: forecast.sourceMetadata.carbonSource,
        version: forecast.sourceMetadata.version,
        generatedAt: forecast.generatedAt,
        timeCoverage: {
          start: forecast.intervals[0].intervalStart,
          end: new Date(coverageEndTimeMs).toISOString(),
          durationHours: horizonHours
        }
      },
      comparativeMetrics: {
        baseline: {
          totalEnergyKWh: baselineSim.totalEnergyKWh,
          totalEmissionsGrams: baselineSim.totalEmissionsGrams,
          totalCostUSD: baselineSim.totalCostUSD,
          finalTempC: baselineSim.finalTempC
        },
        proposed: {
          totalEnergyKWh: proposedSim.totalEnergyKWh,
          totalEmissionsGrams: proposedSim.totalEmissionsGrams,
          totalCostUSD: proposedSim.totalCostUSD,
          finalTempC: proposedSim.finalTempC
        },
        deltas: {
          avoidedEmissionsGrams: deltaEmissionsGrams,
          relativeEmissionsReductionPct: pctReduction,
          netCostSavingsUSD: deltaCostUSD,
          thermalReboundEnergyKWh: deltaEnergyKWh
        }
      },
      schedule: proposedSim.hourlySchedule,
      assumptionsAndCitations: [
        { parameter: "facilityId", value: this.config.facilityId, status: "PROVISIONAL" },
        { parameter: 'thermalModel', model: '1R-1C hourly Euler; constant COP; per-hour constant inputs', R: this.config.thermalResistance_C_per_kW, C: this.config.thermalCapacity_kWh_per_C, COP: this.config.chillerCOP, maxElectricalPowerKW: this.config.maxChillerPowerKW, status: 'UNCOMMISSIONED' },
        { parameter: "comfortEnvelope", value: `${this.config.tempLimits.minC}C - ${this.config.tempLimits.maxC}C`, status: "PROVISIONAL" },
        { parameter: "terminalConstraint", value: "T_final within ±0.15C of modeled baseline final temperature", toleranceC: 0.15, finalDifferenceC: finalTempDelta, status: "MODEL_CONSTRAINT_ONLY" }
      ],
      computationalProfile: {
        processCpuUserPlusSystemMicroseconds: endCpu.user + endCpu.system,
        evaluationDurationMs: Number((endDurationNs / 1e6).toFixed(3)),
        processMemoryRssBytes: endRss,
        processMemoryRssDeltaBytes: endRss - startRss
      }
    };

    return this._deepFreeze(resultArtifact);
  }

  _isValidIsoCalendarDate(dateStr) {
    if (typeof dateStr !== "string") return false;
    const isoRegex = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(\.\d{1,3})?Z$/;
    const match = dateStr.match(isoRegex);
    if (!match) return false;

    const year = parseInt(match[1], 10);
    const month = parseInt(match[2], 10);
    const day = parseInt(match[3], 10);
    if (Number(match[4]) > 23 || Number(match[5]) > 59 || Number(match[6]) > 59) return false;

    if (month < 1 || month > 12) return false;

    const isLeap = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
    const daysInMonth = [31, isLeap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

    if (day < 1 || day > daysInMonth[month - 1]) return false;

    const date = new Date(dateStr);
    return !isNaN(date.getTime());
  }

  _parseReferenceTime(asOf) {
    if (asOf === undefined || asOf === null) {
      return { valid: true, date: new Date() };
    }
    if (typeof asOf !== "string" || !this._isValidIsoCalendarDate(asOf)) {
      return { valid: false, error: "Reference 'asOf' parameter must be a valid ISO 8601 calendar date string (e.g. YYYY-MM-DDTHH:MM:SSZ)." };
    }
    return { valid: true, date: new Date(asOf) };
  }

  _initializeAndValidateConfig(userConfig) {
    const defaults = {
      facilityId: "FACILITY_01_PROVISIONAL",
      thermalResistance_C_per_kW: 2.0,
      thermalCapacity_kWh_per_C: 40.0,
      chillerCOP: 3.2,
      maxChillerPowerKW: 50.0,
      maxTelemetryAgeMinutes: 30,
      maxForecastAgeMinutes: 120,
      tempLimits: {
        minC: 20.5,
        maxC: 22.5,
        baselineSetPointC: 21.5
      }
    };

    if (!userConfig || typeof userConfig !== "object" || Array.isArray(userConfig)) {
      this.configErrors.push('Configuration must be a JSON object.');
      return defaults;
    }

    if (userConfig.facilityId !== undefined && (typeof userConfig.facilityId !== "string" || !userConfig.facilityId.trim())) {
      this.configErrors.push("Configuration error: 'facilityId' must be a non-empty string.");
    }

    const merged = {
      ...defaults,
      ...userConfig,
      tempLimits: {
        ...defaults.tempLimits,
        ...(userConfig.tempLimits && typeof userConfig.tempLimits === "object" && !Array.isArray(userConfig.tempLimits)
          ? userConfig.tempLimits
          : {})
      }
    };

    const isStrictlyPositiveFinite = (val) => typeof val === "number" && Number.isFinite(val) && val > 0;

    const positiveChecks = [
      ["thermalResistance_C_per_kW", merged.thermalResistance_C_per_kW],
      ["thermalCapacity_kWh_per_C", merged.thermalCapacity_kWh_per_C],
      ["chillerCOP", merged.chillerCOP],
      ["maxChillerPowerKW", merged.maxChillerPowerKW],
      ["maxTelemetryAgeMinutes", merged.maxTelemetryAgeMinutes],
      ["maxForecastAgeMinutes", merged.maxForecastAgeMinutes]
    ];

    for (const [key, val] of positiveChecks) {
      if (!isStrictlyPositiveFinite(val)) {
        this.configErrors.push(`Configuration error: '${key}' must be a finite number > 0.`);
      }
    }

    const { minC, maxC, baselineSetPointC } = merged.tempLimits;
    if (!Number.isFinite(minC) || !Number.isFinite(maxC) || !Number.isFinite(baselineSetPointC)) {
      this.configErrors.push("Configuration error: 'tempLimits' values must be finite numbers.");
    } else {
      if (minC >= maxC) {
        this.configErrors.push("Configuration error: 'tempLimits.minC' must be strictly less than 'tempLimits.maxC'.");
      }
      if (baselineSetPointC < minC || baselineSetPointC > maxC) {
        this.configErrors.push("Configuration error: 'tempLimits.baselineSetPointC' must be within minC and maxC.");
      }
    }

    return merged;
  }

  _validatePayload(payload, asOfTime) {
    const reasons = [];
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
      return { valid: false, reasons: ["Payload must be a non-null object."] };
    }

    const { telemetry, forecast } = payload;
    const units = payload.units;
    if (!units || units.temperature !== 'degC' || units.power !== 'kW_electric' ||
        units.carbon !== 'gCO2/kWh' || units.tariff !== 'USD/kWh') reasons.push('Explicit supported units are required.');

    // Telemetry validation
    let telemetryDate = null;
    if (!telemetry || typeof telemetry !== "object" || Array.isArray(telemetry)) {
      reasons.push("Telemetry object is missing or invalid.");
    } else {
      if (typeof telemetry.facilityId !== "string") {
        reasons.push("Telemetry 'facilityId' must be a valid string.");
      } else if (telemetry.facilityId !== this.config.facilityId) {
        reasons.push(`Facility mismatch: received '${telemetry.facilityId}', expected '${this.config.facilityId}'.`);
      }

      if (typeof telemetry.currentZoneTempC !== "number" || !Number.isFinite(telemetry.currentZoneTempC)) {
        reasons.push("Telemetry 'currentZoneTempC' must be a finite number.");
      }

      if (!this._isValidIsoCalendarDate(telemetry.timestamp)) {
        reasons.push("Telemetry timestamp must be a valid, un-normalized ISO 8601 calendar date string.");
      } else {
        telemetryDate = new Date(telemetry.timestamp);
        const ageMinutes = (asOfTime.getTime() - telemetryDate.getTime()) / (1000 * 60);
        if (ageMinutes > this.config.maxTelemetryAgeMinutes) {
          reasons.push(`Telemetry is stale: recorded ${ageMinutes.toFixed(1)} mins ago (max allowed: ${this.config.maxTelemetryAgeMinutes}).`);
        } else if (ageMinutes < -1.0) {
          reasons.push(`Telemetry timestamp is post-dated into the future by ${Math.abs(ageMinutes).toFixed(1)} mins.`);
        }
      }
    }

    // Forecast & Provenance validation
    if (!forecast || typeof forecast !== "object" || Array.isArray(forecast)) {
      reasons.push("Forecast object is missing or invalid.");
    } else {
      if (forecast.facilityId !== this.config.facilityId) reasons.push('Forecast facility binding mismatch.');
      if (!forecast.sourceMetadata || typeof forecast.sourceMetadata !== "object") {
        reasons.push("Forecast 'sourceMetadata' is missing.");
      } else {
        if (typeof forecast.sourceMetadata.carbonSource !== "string" || !forecast.sourceMetadata.carbonSource.trim()) {
          reasons.push("Forecast provenance 'carbonSource' must be a non-empty string.");
        }
        if (typeof forecast.sourceMetadata.version !== "string" || !forecast.sourceMetadata.version.trim()) {
          reasons.push("Forecast provenance 'version' must be a non-empty string.");
        }
      }

      if (!this._isValidIsoCalendarDate(forecast.generatedAt)) {
        reasons.push("Forecast 'generatedAt' must be a valid, un-normalized ISO 8601 calendar date string.");
      } else {
        const forecastGenDate = new Date(forecast.generatedAt);
        const forecastAgeMinutes = (asOfTime.getTime() - forecastGenDate.getTime()) / (1000 * 60);
        if (forecastAgeMinutes > this.config.maxForecastAgeMinutes) {
          reasons.push(`Forecast is stale: generated ${forecastAgeMinutes.toFixed(1)} mins ago (max allowed: ${this.config.maxForecastAgeMinutes}).`);
        } else if (forecastAgeMinutes < -1.0) {
          reasons.push(`Forecast 'generatedAt' is post-dated into the future by ${Math.abs(forecastAgeMinutes).toFixed(1)} mins.`);
        }
      }

      if (!Array.isArray(forecast.intervals) || forecast.intervals.length !== 24) {
        reasons.push("Forecast requires exactly 24 hourly intervals.");
      } else {
        const firstInterval = forecast.intervals[0];
        if (firstInterval && this._isValidIsoCalendarDate(firstInterval.intervalStart)) {
          const firstStartMs = new Date(firstInterval.intervalStart).getTime();
          const asOfMs = asOfTime.getTime();
          const anchorDriftMinutes = Math.abs(firstStartMs - asOfMs) / (1000 * 60);

          if (anchorDriftMinutes !== 0) {
            reasons.push(`Forecast coverage start (${firstInterval.intervalStart}) is unanchored from evaluation time (${asOfTime.toISOString()}); drift of ${anchorDriftMinutes.toFixed(1)}m requires simulation start equal to trusted evaluation time.`);
          }

          if (telemetryDate && telemetryDate.getTime() > firstStartMs) {
            reasons.push("Telemetry timestamp occurs after forecast coverage begins.");
          }
        }

        const len = forecast.intervals.length;
        let expectedTimeMs = null;

        for (let i = 0; i < len; i++) {
          if (!Object.prototype.hasOwnProperty.call(forecast.intervals, i) || !forecast.intervals[i]) {
            reasons.push(`Interval at index ${i} is missing or a sparse array hole.`);
            continue;
          }

          const step = forecast.intervals[i];
          if (!this._isValidIsoCalendarDate(step.intervalStart)) {
            reasons.push(`Interval ${i}: 'intervalStart' must be a valid ISO 8601 calendar date string.`);
          } else {
            const stepTimeMs = new Date(step.intervalStart).getTime();
            if (expectedTimeMs !== null && stepTimeMs !== expectedTimeMs) {
              reasons.push(`Interval ${i}: Non-contiguous intervalStart. Expected ${new Date(expectedTimeMs).toISOString()}, found ${step.intervalStart}.`);
            }
            expectedTimeMs = stepTimeMs + 3600000;
          }

          if (step.durationMinutes !== 60) {
            reasons.push(`Interval ${i}: Explicit coverage requires 'durationMinutes: 60'.`);
          }
          if (!Number.isFinite(step.ambientTempC)) {
            reasons.push(`Interval ${i}: ambientTempC must be a finite number.`);
          }
          if (!Number.isFinite(step.carbonIntensityGPerKWh) || step.carbonIntensityGPerKWh < 0) {
            reasons.push(`Interval ${i}: carbonIntensityGPerKWh must be a finite non-negative number.`);
          }
          if (!Number.isFinite(step.tariffUSDPerKWh) || step.tariffUSDPerKWh < 0) {
            reasons.push(`Interval ${i}: tariffUSDPerKWh must be a finite non-negative number.`);
          }
          if (!Number.isFinite(step.internalGainKW) || step.internalGainKW < 0) {
            reasons.push(`Interval ${i}: internalGainKW must be a finite non-negative number.`);
          }
        }
      }
    }

    return { valid: reasons.length === 0, reasons };
  }

  _nextTemperature(currentTempC, ambientTempC, internalGainsKW, electricalPowerKW, dtHours = 1.0) {
    const heatGain = (ambientTempC - currentTempC) / this.config.thermalResistance_C_per_kW;
    const coolingThermalOutput = electricalPowerKW * this.config.chillerCOP;
    const netThermalInputKW = heatGain + internalGainsKW - coolingThermalOutput;
    const nextTemp = currentTempC + (dtHours / this.config.thermalCapacity_kWh_per_C) * netThermalInputKW;
    return Number.isFinite(nextTemp) ? nextTemp : NaN;
  }

  _solvePowerForTarget(currentTempC, ambientTempC, internalGainsKW, targetTempC, dtHours = 1.0) {
    const heatGain = (ambientTempC - currentTempC) / this.config.thermalResistance_C_per_kW;
    const coolingThermalNeeded = heatGain + internalGainsKW - ((targetTempC - currentTempC) * this.config.thermalCapacity_kWh_per_C) / dtHours;
    const p = coolingThermalNeeded / this.config.chillerCOP;
    return Number.isFinite(p) ? Math.max(0, p) : NaN;
  }

  _simulateSchedule({ horizonHours, initialTempC, forecast, mode }) {
    let currentTemp = initialTempC;
    let totalEnergyKWh = 0;
    let totalEmissionsGrams = 0;
    let totalCostUSD = 0;
    const schedule = [];

    for (let t = 0; t < horizonHours; t++) {
      const interval = forecast.intervals[t];
      let pElectKW = this._solvePowerForTarget(
        currentTemp,
        interval.ambientTempC,
        interval.internalGainKW,
        this.config.tempLimits.baselineSetPointC
      );

      if (!Number.isFinite(pElectKW)) {
        return { feasible: false, isOverflow: true, failureReason: `Solver produced non-finite power at hour ${t}.` };
      }

      pElectKW = Math.max(0, Math.min(this.config.maxChillerPowerKW, pElectKW));
      const nextTemp = this._nextTemperature(currentTemp, interval.ambientTempC, interval.internalGainKW, pElectKW);

      if (!Number.isFinite(nextTemp)) {
        return { feasible: false, isOverflow: true, failureReason: `Non-finite temperature calculated at interval ${t}.` };
      }

      if (nextTemp < this.config.tempLimits.minC || nextTemp > this.config.tempLimits.maxC) {
        return { feasible: false, isOverflow: false, failureReason: `Envelope breach at interval ${t}: ${nextTemp}C` };
      }

      totalEnergyKWh += pElectKW;
      totalEmissionsGrams += pElectKW * interval.carbonIntensityGPerKWh;
      totalCostUSD += pElectKW * interval.tariffUSDPerKWh;

      if (!Number.isFinite(totalEnergyKWh) || !Number.isFinite(totalEmissionsGrams) || !Number.isFinite(totalCostUSD)) {
        return { feasible: false, isOverflow: true, failureReason: `Numeric overflow encountered at interval ${t}.` };
      }

      schedule.push({ intervalStart: interval.intervalStart, powerKW: pElectKW, resultingTempC: nextTemp });
      currentTemp = nextTemp;
    }

    return { feasible: true, totalEnergyKWh, totalEmissionsGrams, totalCostUSD, finalTempC: currentTemp, schedule };
  }

  _optimizeLoadShift({ horizonHours, initialTempC, forecast, baselineCost, targetEndTempC }) {
    const intensities = forecast.intervals.map(i => i.carbonIntensityGPerKWh);
    const medianIntensity = [...intensities].sort((a, b) => a - b)[Math.floor(intensities.length / 2)];

    let currentTemp = initialTempC;
    let totalEnergyKWh = 0;
    let totalEmissionsGrams = 0;
    let totalCostUSD = 0;
    const hourlySchedule = [];

    for (let t = 0; t < horizonHours; t++) {
      const interval = forecast.intervals[t];
      let targetSetPoint;

      if (t === horizonHours - 1) {
        targetSetPoint = targetEndTempC;
      } else if (interval.carbonIntensityGPerKWh < medianIntensity) {
        targetSetPoint = this.config.tempLimits.minC + 0.1;
      } else {
        targetSetPoint = this.config.tempLimits.maxC - 0.1;
      }

      let pElectKW = this._solvePowerForTarget(currentTemp, interval.ambientTempC, interval.internalGainKW, targetSetPoint);
      if (!Number.isFinite(pElectKW)) {
        return { feasible: false, isOverflow: true, failureReason: `Optimizer produced non-finite power at hour ${t}.` };
      }

      pElectKW = Math.max(0, Math.min(this.config.maxChillerPowerKW, pElectKW));
      const nextTemp = this._nextTemperature(currentTemp, interval.ambientTempC, interval.internalGainKW, pElectKW);

      if (!Number.isFinite(nextTemp)) {
        return { feasible: false, isOverflow: true, failureReason: `Non-finite temperature calculated at hour ${t}.` };
      }

      if (nextTemp < this.config.tempLimits.minC || nextTemp > this.config.tempLimits.maxC) {
        return { feasible: false, isOverflow: false, failureReason: `Comfort envelope violation at hour ${t}: ${nextTemp}C` };
      }

      totalEnergyKWh += pElectKW;
      totalEmissionsGrams += pElectKW * interval.carbonIntensityGPerKWh;
      totalCostUSD += pElectKW * interval.tariffUSDPerKWh;

      if (!Number.isFinite(totalEnergyKWh) || !Number.isFinite(totalEmissionsGrams) || !Number.isFinite(totalCostUSD)) {
        return { feasible: false, isOverflow: true, failureReason: `Numeric overflow encountered in optimization at hour ${t}.` };
      }

      hourlySchedule.push({
        intervalStart: interval.intervalStart,
        powerKW: pElectKW,
        resultingTempC: nextTemp,
        carbonIntensity: interval.carbonIntensityGPerKWh
      });

      currentTemp = nextTemp;
    }

    if (totalCostUSD > baselineCost) {
      return { feasible: false, isOverflow: false, failureReason: `Cost ceiling breach: Proposed ($${totalCostUSD.toFixed(2)}) > Baseline ($${baselineCost.toFixed(2)})` };
    }

    return { feasible: true, totalEnergyKWh, totalEmissionsGrams, totalCostUSD, finalTempC: currentTemp, hourlySchedule };
  }

  _formatRejection(status, reasons, startTime, startCpu, startRss) {
    const endCpu = process.cpuUsage(startCpu);
    const endRss = process.memoryUsage().rss;
    const endDurationNs = Number(process.hrtime.bigint() - startTime);
    const safeFacilityId = (typeof this.config?.facilityId === "string") ? this.config.facilityId : "UNKNOWN";

    const rejectionArtifact = {
      status,
      evaluationType: "MODELED_SHADOW_FINDING_UNVERIFIED",
      facilityId: safeFacilityId,
      timestamp: new Date().toISOString(),
      reasons,
      forethought: {
        supportedConclusion: `Evaluation halted with status ${status}.`,
        epistemicGaps: status === "INSUFFICIENT_EVIDENCE" ? reasons : [],
        unresolvedConflicts: status === "INFEASIBLE" ? reasons : [],
        nextUsefulStep: status === "INSUFFICIENT_EVIDENCE" 
          ? "Acquire fresh telemetry and verified forecast coverage." 
          : status === 'INFEASIBLE' ? 'Request facility operator assessment of the modeled boundary violation; no automatic control.' : 'No better modeled schedule found; retain human review.' 
      },
      sentinelBoundary: {
        advisoryOnly: true,
        writeExecutionBlocked: true,
        evidenceType: "ADVISORY_DECLARATION_ONLY"
      },
      computationalProfile: {
        processCpuUserPlusSystemMicroseconds: endCpu.user + endCpu.system,
        evaluationDurationMs: Number((endDurationNs / 1e6).toFixed(3)),
        processMemoryRssBytes: endRss,
        processMemoryRssDeltaBytes: endRss - startRss
      }
    };

    return this._deepFreeze(rejectionArtifact);
  }

  _deepFreeze(object) {
    const propNames = Object.getOwnPropertyNames(object);
    for (const name of propNames) {
      const value = object[name];
      if (value && typeof value === "object") {
        this._deepFreeze(value);
      }
    }
    return Object.freeze(object);
  }
}

module.exports = { SynapseEcoEvaluator };

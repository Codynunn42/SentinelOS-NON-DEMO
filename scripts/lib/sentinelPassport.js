const {
  resetExecutionPassportState,
  signExecutionPassport
} = require('../../apps/sentinel/src/governance/executionPassport');

const LOCAL_SECRET = 'local-sentinel-passport-check-secret';

function ensureLocalPassportSecret() {
  process.env.SENTINEL_HMAC_SECRET = process.env.SENTINEL_HMAC_SECRET || LOCAL_SECRET;
}

function resetLocalPassportState() {
  resetExecutionPassportState();
}

function signLocalCommand(envelope) {
  ensureLocalPassportSecret();
  return signExecutionPassport(envelope);
}

module.exports = {
  ensureLocalPassportSecret,
  resetLocalPassportState,
  signLocalCommand
};

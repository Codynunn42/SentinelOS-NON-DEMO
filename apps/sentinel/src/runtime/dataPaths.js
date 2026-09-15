const os = require('os');
const path = require('path');

function getRuntimeDataRoot() {
  return path.resolve(
    process.env.SENTINEL_DATA_DIR || path.join(os.tmpdir(), 'sentinelos')
  );
}

function getRuntimeDataPath(...segments) {
  return path.join(getRuntimeDataRoot(), ...segments);
}

module.exports = {
  getRuntimeDataPath,
  getRuntimeDataRoot
};

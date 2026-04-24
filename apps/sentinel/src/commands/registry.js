const { surfaceRegistry } = require('../surface/registry');

function getSurfaceRegistry() {
  return surfaceRegistry;
}

module.exports = {
  getSurfaceRegistry
};

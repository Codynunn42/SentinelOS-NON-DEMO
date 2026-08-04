const { ownerfiHandlers } = require('../commands/ownerfiHandlers');
const { customerOpsHandlers } = require('./customerops');
const { hotelHandlers } = require('./hotelops');
const { nunncloudHandlers } = require('./nunncloud');
const { nexusHandlers } = require('./nexus');
const { tildaHandlers } = require('./tilda');
const { microsoft365Handlers } = require('./microsoft365');
const { githubHandlers } = require('./github');
const { mockHandlers } = require('../commands/mockHandlers');

const surfaceRegistry = {
  ownerfi: {
    name: 'OwnerFi',
    handlers: ownerfiHandlers
  },
  customerops: {
    name: 'Customer Operations',
    handlers: customerOpsHandlers
  },
  hotelops: {
    name: 'HotelOps',
    handlers: hotelHandlers
  },
  nunncloud: {
    name: 'Nunn Cloud',
    handlers: nunncloudHandlers
  },
  nexus: {
    name: 'NEXUS',
    handlers: nexusHandlers
  },
  tilda: {
    name: 'TILDA',
    handlers: tildaHandlers
  },
  microsoft365: {
    name: 'Microsoft 365',
    handlers: microsoft365Handlers
  },
  github: {
    name: 'GitHub',
    handlers: githubHandlers
  },
  mock: {
    name: 'Mock Faceplane',
    handlers: mockHandlers
  }
};

module.exports = {
  surfaceRegistry
};

const { ownerfiHandlers } = require('../commands/ownerfiHandlers');
const { customerOpsHandlers } = require('./customerops');
const { hotelHandlers } = require('./hotelops');
const { nunncloudHandlers } = require('./nunncloud');
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
  mock: {
    name: 'Mock Faceplane',
    handlers: mockHandlers
  }
};

module.exports = {
  surfaceRegistry
};

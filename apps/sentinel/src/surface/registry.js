const { ownerfiHandlers } = require('../commands/ownerfiHandlers');
const { hotelHandlers } = require('./hotelops');
const { nunncloudHandlers } = require('./nunncloud');

const surfaceRegistry = {
  ownerfi: {
    name: 'OwnerFi',
    handlers: ownerfiHandlers
  },
  hotelops: {
    name: 'HotelOps',
    handlers: hotelHandlers
  },
  nunncloud: {
    name: 'Nunn Cloud',
    handlers: nunncloudHandlers
  }
};

module.exports = {
  surfaceRegistry
};

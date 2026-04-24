const { ownerfiHandlers } = require('../commands/ownerfiHandlers');
const { hotelHandlers } = require('./hotelops');

const surfaceRegistry = {
  ownerfi: {
    name: 'OwnerFi',
    handlers: ownerfiHandlers
  },
  hotelops: {
    name: 'HotelOps',
    handlers: hotelHandlers
  }
};

module.exports = {
  surfaceRegistry
};

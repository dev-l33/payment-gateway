var Web3 = require('web3');

var web3 = new Web3(new Web3.providers.HttpProvider(sails.config.ethereum.node));

web3.eth.getCoinbase().then(sails.log.info);

module.exports = {

  friendlyName: 'Get Web3 Object',

  description: 'Return Web3 object that is connected to the ethereum node',

  exits: {
    success: {
      outputFriendlyName: 'web3 object',
      outputDescription: 'web3 object that is connected to the node.',
    },

    connectionFailed: {
      description: 'Cannot connect to the ethereum node.'
    }
  },

  sync: true,

  fn: function (inputs, exits) {

    // All done.
    return exits.success(web3);

  }

};


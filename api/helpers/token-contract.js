const ABI = require('../../abi/ERC20.json');

module.exports = {


  friendlyName: 'Get ERC20 Token Contract',


  description: 'Return web3.contract object that is referenced to ERC20 token contract',


  inputs: {
    address: {
      type: 'string',
      description: 'Address of token contract',
      required: true
    },
  },


  exits: {
    success: {
      outputFriendlyName: 'web3.eth.Contract Object',
      outputDescription: 'ERC20 Token Contract Object',
    },
  },

  sync: true,

  fn: function (inputs, exits) {
    let web3 = sails.helpers.web3();
    let contract = new web3.eth.Contract(ABI, inputs.address);

    // All done.
    return exits.success(contract);

  }


};


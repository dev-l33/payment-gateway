module.exports = {


  friendlyName: 'Send ERC20 token',


  description: 'Transfer ERC20 Token',


  inputs: {
    token: {
      type: 'ref',
      description: 'Token Model Object',
      required: true
    },
    fromPrivateKey: {
      type: 'string',
      description: 'private key of from address',
      required: true
    },
    to: {
      type: 'string',
      description: 'To Address',
      required: true
    },
    value: {
      type: 'number',
      description: 'Value to transfer',
      required: true
    },
    gasPrice: {
      type: 'number',
      description: 'Gas Price',
      required: true
    },
    gasLimit: {
      type: 'number',
      description: 'Gas Limit',
      required: true
    },
  },


  exits: {
    success: {
      outputFriendlyName: 'Transaction Hash',
      outputDescription: 'Transaction Hash',
    },
    fail: {
      outputFriendlyName: 'Error Message',
      outputDescription: 'Failed to send',
    }
  },


  fn: async function (inputs, exits) {
    let web3 = sails.helpers.web3();
    let account = web3.eth.accounts.wallet.add(inputs.fromPrivateKey);

    let unitValue =  web3.utils.toWei(String(inputs.value), 'ether');
    const options = {
      from: account.address, // default from address
      gas: inputs.gasLimit,
      gasPrice: inputs.gasPrice
    };

    let contract = sails.helpers.tokenContract(inputs.token.address);

    contract.methods.transfer(inputs.to, unitValue).send(options)
    .on('transactionHash', hash => {
      return exits.success(hash);
    })
    .on('error', error => {
      sails.log.error(error);
      return exits.fail(error);
    });

  }


};


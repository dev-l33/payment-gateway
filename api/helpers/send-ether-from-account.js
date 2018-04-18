module.exports = {


  friendlyName: 'Send ether from account',


  description: 'Send ether from account with address, account must be added to ethereum node',


  inputs: {
    from: {
      type: 'string',
      description: 'from address',
      required: true
    },
    to: {
      type: 'string',
      description: 'to address',
      required: true
    },
    value: {
      type: 'number',
      description: 'value',
      required: true
    }
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
    let gasPrice = await web3.eth.getGasPrice();

    web3.eth.sendTransaction({
      from: inputs.from,
      to: inputs.to,
      value: inputs.value,
      gas: sails.config.ethereum.gas,
      gasPrice: gasPrice
    })
    .on('transactionHash', (hash) => {
      sails.log.info(`Send ${inputs.value} wei, hash: ${hash}`);
      return exits.success(hash);
    })
    .on('error', error => {
      sails.log.error(error);
      return exits.fail(error);
    });

  }


};


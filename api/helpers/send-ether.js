module.exports = {


  friendlyName: 'Send ether',


  description: 'Send Ether from account to another with private key',


  inputs: {
    privateKey: {
      type: 'string',
      description: 'Private Key of from account.',
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
    let account = web3.eth.accounts.wallet.add(inputs.privateKey);
    let gasPrice = await web3.eth.getGasPrice();
    let txFee = gasPrice * sails.config.ethereum.gas;

    let value = web3.utils.toWei(String(inputs.value), 'ether') - txFee;

    web3.eth.sendTransaction({
      from: account.address,
      to: inputs.to,
      value: value,
      gas: sails.config.ethereum.gas,
      gasPrice: gasPrice
    })
    .on('transactionHash', (hash) => {
      console.log('send transaction hash: ', hash);
      web3.eth.accounts.wallet.remove(account.index);
      return exits.success(hash);
    })
    .on('error', error => {
      console.log(error);
      return exists.fail(error);
    });

  }


};

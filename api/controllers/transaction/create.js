module.exports = {


  friendlyName: 'Create Transaction',


  description: 'Create a transaction.',


  inputs: {
    token: {
      description: 'Token symbol which is being used for the transaction (Default null, Ethereum will be used)',
      type: 'string'
    },
    value: {
      description: 'The value of the transaction (in Ether) that gateway should watch for (we do a >= check on this, so it won’t matter if the customer sends more)',
      type: 'number',
      required: true
    },
    timeoutInSecs: {
      description: 'How long gateway should watch for this transaction before considering it a failure. A higher number increases the chances of a value fluctuation, a lower number means your customer doesn’t have as long to submit the payment. Beware that in times of high transaction volume, PayWithEther might not pick up the transaction if it takes a long time to go through. (Default 1200, which is 20 minutes)',
      type: 'number',
      defaultsTo: 1200
    },
    callbackUrl: {
      description: 'A URL for gateway to POST back to, details of the POST back are below',
      type: 'string'
    },
  },

  exits: {
    success: {
      description: 'transaction is created successfully.'
    },
    invalidInput: {
      statusCode: 406,
      description: 'Input invalid'
    }
  },


  fn: async function (inputs, exits) {

    let account = await sails.helpers.createEthAccount();

    let txData = {
      value: inputs.value,
      timeoutInSecs: inputs.timeoutInSecs,
      callbackUrl: inputs.callbackUrl,
      address: account.address,
      privateKey: account.privateKey
    };

    if (_.has(inputs, 'token')) {
      let token = await Token.findOne({ symbol: inputs.token });
      if (token) {
        txData.token = token.id;
      } else {
        return exits.invalidInput({
          success: false,
          error: 'invalid token'
        });
      }
    }

    let transaction = await Transaction.create(txData).fetch();

    sails.log.info(`Tx created. id: ${transaction.id}, address: ${transaction.address}`);

    let resultData = {
      transactionId: transaction.id,
      address: transaction.address,
      value: transaction.value
    };

    if (transaction.token) {
      resultData.token = inputs.token;
    }

    return exits.success({
      success:true,
      data: resultData
    });
  }


};

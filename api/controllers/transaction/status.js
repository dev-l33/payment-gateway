module.exports = {


  friendlyName: 'Status',


  description: 'Status transaction.',


  inputs: {
    transactionId: {
      description: 'Transaction ID that was provided by create end point',
      type: 'string',
      required: true
    },
  },


  exits: {
    success: {
      description: 'Transaction Status'
    },
    notFound: {
      description: 'No transaction with the specified ID was found in the database.',
      responseType: 'notFound'
    }
  },


  fn: async function (inputs, exits) {
    let tx = await Transaction.findOne({
      id: inputs.transactionId
    });
    let status = ['pending', 'success', 'timeout'];
    if (tx) {
      return exits.success({
        created: tx.createdAt,
        value: tx.valuePaid,
        status: status[tx.status],
        txHash: tx.transactionHash,
        txId: tx.id
      });
    }

    return exits.notFound();

  }


};

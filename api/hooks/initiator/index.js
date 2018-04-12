/**
 * initiator hook
 *
 * @description :: A hook definition.  Extends Sails by adding shadow routes, implicit actions, and/or initialization logic.
 * @docs        :: https://sailsjs.com/docs/concepts/extending-sails/hooks
 */
const got = require('got');
var web3;
module.exports = function defineInitiatorHook(sails) {

  return {

    /**
     * Runs when a Sails app loads/lifts.
     *
     * @param {Function} done
     */
    initialize: function (done) {

      sails.log.info('Initializing hook (`initiator`)');

      var eventsToWaitFor = ['hook:orm:loaded'];

      sails.after(eventsToWaitFor, async () => {
        sails.log.info('Ethereum Tx is subscribed!');
        web3 = sails.helpers.web3();

        web3.eth.subscribe('pendingTransactions', txListener);

        setTimeout(expireTransaction, 5000);

        return done();
      });

    }

  };

};

/**
 * Listener for incoming pending transactions
 * @param error Error Object
 * @param transactionHash transactionHash of pending transaction
 */
async function txListener(error, transactionHash) {
  if (error) {
    sails.log.error(`Error in Tx Listener: ${error}`);
  }
  let ethTx = await web3.eth.getTransaction(transactionHash);
  // ethTx.to = web3.utils.toChecksumAddress(ethTx.to);
  if (ethTx.value) {
    let tx = await Transaction.findOne({
      address: ethTx.to,
      status: 0
    });
    if (tx) {
      tx = await Transaction.update({
        address: ethTx.to
      })
      .set({
        fromAddress: ethTx.from,
        transactionHash: ethTx.hash
      })
      .fetch();
      setTimeout(confirmTx, 10000, tx[0]);
    }
  }
}

/**
 * confirming pending transaction.
 * @param Transaction transaction Transaction model object
 */
async function confirmTx(transaction) {
  sails.log.info('Checking Transaction: ' + transaction.transactionHash);
  let ethTx = await web3.eth.getTransaction(transaction.transactionHash);
  if (ethTx.blockNumber) {
    let balance = await web3.eth.getBalance(transaction.address);
    balance = web3.utils.fromWei(new web3.utils.BN(balance).toString(), 'ether');
    tx = await Transaction.update({
      id: transaction.id
    })
    .set({
      valuePaid: balance,
      status: balance >= transaction.value
    })
    .fetch();
    if (tx[0].status) {
      let hash = await sails.helpers.sendEther(tx[0].privateKey, sails.config.ethereum.coinbase, balance);
      sails.log.info(`Transaction is completed txId: ${tx[0].id} hash: ${hash}`);

      if (tx[0].callbackUrl) {
        try {
          const response = await got(tx[0].callbackUrl, {
            json: true,
            body: {
              callbackUrl: tx[0].callbackUrl,
              created: tx[0].createdAt,
              updated: tx[0].updatedAt,
              value: tx[0].valuePaid,
              status: 'success',
              txHash: tx[0].transactionHash,
              txId: tx[0].id
            }
          });
          sails.log.debug(`response from ${tx[0].callbackUrl} = ${response.body}`);
        } catch (error) {
          sails.log.debug(error);
          //=> 'Internal server error ...'
        }
      }
    }
  } else {
    setTimeout(confirmTx, 5000, transaction);
  }
}


async function expireTransaction() {
  let txs = await Transaction.find({
    status: 0,
    transactionHash: ''
  });
  let currentTime = new Date().getTime();
  txs.forEach(tx => {
    if (tx.createdAt + tx.timeoutInSecs * 1000 <= currentTime) {
      sails.log.info(`TxId: ${tx.id} is expired`);

      Transaction.update({
        id: tx.id
      })
      .set({
        status: 2
      })
      .catch(error => {
        sails.logs.debug(error);
      });

      if (tx.callbackUrl) {
        got(tx.callbackUrl, {
          json: true,
          body: {
            callbackUrl: tx.callbackUrl,
            created: tx.createdAt,
            value: tx.value,
            status: 'expired',
            txId: tx.id
          }
        })
        .then(response => {
          sails.log.debug(`response from ${tx.callbackUrl} = ${response.body}`);
        })
        .catch(error => {
          sails.log.debug(error);
        });
      }
    }
  });

  setTimeout(expireTransaction, 5000);
}
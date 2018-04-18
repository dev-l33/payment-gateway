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

        // listen ERC20 transfer event
        web3.eth.subscribe('logs', { topics: [ '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef' ]})
        .on('data', logListener);

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
  if (_.has(ethTx, 'value')) {
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

async function logListener(log) {
  if (log.topics.length === 3) {
    let toAddress = web3.utils.toChecksumAddress('0x' + log.topics[2].slice(-40));
    let transaction = await Transaction.findOne({ address: toAddress, status: 0 }).populate('token');

    if (transaction) {
      sails.log.info('Token Transaction is detected: ', log.transactionHash);
      let fromAddress = '0x' + log.topics[1].slice(-40);
      let value = web3.utils.fromWei(web3.utils.hexToNumberString(log.data), 'ether');
      let balance = transaction.valuePaid + value;

      tx = await Transaction.update({
        id: transaction.id
      })
      .set({
        fromAddress: fromAddress,
        valuePaid: balance,
        status: balance >= transaction.value,
        transactionHash: log.transactionHash
      })
      .fetch();

      if (tx[0].status) {
        let gasLimit = await sails.helpers.tokenContract(transaction.token.address).methods.transfer(sails.config.ethereum.coinbase, tx[0].valuePaid).estimateGas({ from: transaction.address, gas: sails.config.ethereum.tokenGas });
        gasLimit = parseInt(gasLimit * 1.5);
        let gasPrice = await web3.eth.getGasPrice();
        let txFee = gasLimit * gasPrice;

        let hash = await sails.helpers.sendEtherFromAccount(sails.config.ethereum.coinbase, tx[0].address, txFee);

        tx = await Transaction.update({
          id: transaction.id
        })
        .set({
          feeTransactionHash: hash,
        })
        .fetch();

        setTimeout(forwardToken, 300000, tx[0], gasPrice, gasLimit);

      }
    }
  }
}

/**
 * confirming pending transaction(for ether payment option).
 * @param Transaction transaction Transaction model object
 */
async function confirmTx(transaction) {
  sails.log.info('Confirm Pending ETH Transaction: ' + transaction.transactionHash);
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
      await Transaction.update({
        id: transaction.id
      })
      .set({
        forwardTransactionHash: hash
      });
      sails.log.info(`Forward ETH Transaction is done. txId: ${tx[0].id} hash: ${hash}`);

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

async function forwardToken(transaction, gasPrice, gasLimit) {
  let token = await Token.findOne({ id: transaction.token});
  let hash = await sails.helpers.sendToken(token, transaction.privateKey, transaction.address, transaction.valuePaid, gasPrice, gasLimit);

  await Transaction.update({
    id: transaction.id
  })
  .set({
    forwardTransactionHash: hash
  });
  sails.log.info(`Forward Token Transaction is done. txId: ${transaction.id} hash: ${hash}`);
}

/**
 * check and flag expired transaction.
 * Call callback with timeout flag.
 */
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

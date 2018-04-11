module.exports = {


  friendlyName: 'Create ethereum account',


  description: 'create ethereum account and return private/public key',

  exits: {
    success: {
      outputFriendlyName: 'Account',
      outputDescription: 'Ethereum Account that cointains private key and public key',
    },
  },

  fn: async function (inputs, exits) {

    let web3 = sails.helpers.web3();

    let account = web3.eth.accounts.create();

    sails.log.info(`Accout is created public key: ${account.address}, privateKey: ${account.privateKey}`);

    return exits.success(account);
  }


};

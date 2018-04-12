module.exports = {


  friendlyName: 'Auth',


  description: 'Check Authentication',


  exits: {
    success: {
      description: 'Successfully authenticated.'
    },
  },


  fn: async function (inputs, exits) {

    return exits.success({ success: true });

  }


};

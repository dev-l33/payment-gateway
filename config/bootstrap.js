/**
 * Bootstrap
 * (sails.config.bootstrap)
 *
 * An asynchronous bootstrap function that runs just before your Sails app gets lifted.
 * > Need more flexibility?  You can also do this by creating a hook.
 *
 * For more information on bootstrapping your app, check out:
 * https://sailsjs.com/config/bootstrap
 */

module.exports.bootstrap = async function(done) {

  // By convention, this is a good place to set up fake data during development.
  //
  // For example:
  // ```
  // // Set up ERC20 Token data (or if we already have some, avast)
  if (await Token.count() > 0) {
    return done();
  }
  await Token.createEach([
    { address: '0xed46bf67a7da51bdc63b8b9173d87bbb05e571bb', symbol: 'SAH', name: 'Sarah Coin', decimals: 18 },
    { address: '0x2db06e8fbf7e25d89c205f8e9400c06256687bd1', symbol: 'AG-Coin', name: 'AG Coin', decimals: 2 },
  ]);
  // ```

  // Don't forget to trigger `done()` when this bootstrap function's logic is finished.
  // (otherwise your server will never lift, since it's waiting on the bootstrap)
  return done();

};

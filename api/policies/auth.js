/**
 * is-logged-in
 *
 * A simple policy that allows any request from an authenticated user.
 *
 * For more about how to use policies, see:
 *   https://sailsjs.com/config/policies
 *   https://sailsjs.com/docs/concepts/policies
 *   https://sailsjs.com/docs/concepts/policies/access-control-and-permissions
 */
module.exports = async function (req, res, proceed) {

  if (req.headers && req.headers.authorization) {
    let auth = req.headers.authorization.split(' ');
    sails.log.info(auth);
    if(auth[0] === 'API-KEY') {
      if (auth[1] === 'TESTKEY') {
        return proceed();
      }
    }
  }

  //--•
  // Otherwise, this request did not come from a logged-in user.
  return res.sendStatus(401);

};

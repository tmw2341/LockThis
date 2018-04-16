const express = require('express');
var app = express();

// add json body parser
app.use(express.json());

// logger
app.use((req, res, next) => {
  console.log(req.path, req.body);
  next();
});

/**
 * @apiDefine Default
 * @apiSuccess {boolean} success true
 * @apiError {boolean} success false
 */

/**
 * @apiDefine Login
 * @apiParam (Required) {string} username the users username
 * @apiParam (Required) {string} password the users password
 */

/**
 * @api {post} /user/create create user
 * @apiName CreateUser
 * @apiGroup users
 * @apiDescription creates a new user account
 * @apiParam {string} name the name used for creating personalized messages
 * @apiParam {string} email the users email must be something@something.something
 * @apiParam {string} username username of the user
 * @apiParam {string} password the password for the user
 * @apiUse Default
 */

/**
 * @api {post} /user/remove remove user
 * @apiName RemoveUser
 * @apiGroup users
 * @apiDescription remove
 * @apiUse Login
 * @apiUse Default
 */

/**
 * @api {post} /user/modify modify user
 * @apiName ModifyUser
 * @apiGroup users
 * @apiDescription
 * @apiUse Login
 * @apiParam (Optional) {string} new_username
 * @apiParam (Optional) {string} new_name
 * @apiParam (Optional) {string} new_email
 * @apiParam (Optional) {string} new_password
 * @apiUse Default
 */

 /**
  * @api {get} /user/locks get locks
  * @apiName GetUserLocks
  * @apiGroup users
  * @apiDescription get all locks that a use has access to
  * @apiUse Login
  * @apiUse Default
  */

/**
 * @api {post} /lock/add add lock
 * @apiName AddLock
 * @apiGroup locks
 * @apiParam (Required) {string} lock_id the id of the lock
 * @apiParam (Required) {string} description a short description of the lock
 * @apiUse Default
 */

/**
 * @api {post} /lock/remove remove lock
 * @apiName RemoveLock
 * @apiGroup locks
 * @apiParam (Required) {string} lock_id the id of the lock
 * @apiParam (Required) {string} description a short description of the lock
 * @apiUse Default
 */

/**
 * @api {post} /lock/modify modify lock
 * @apiName ModifyLock
 * @apiGroup locks
 * @apiParam (Required) {string} lock_id the id of the lock
 * @apiParam (Required) {string} description a short description of the lock
 * @apiUse Default
 */

/**
 * @api {post} /lock/permissions/add add permissions
 * @apiName AddPermission
 * @apiGroup locks
 * @apiDescription add a new permission to the lock
 * @apiUse Login
 * @apiParam (Required) {string} lock_id the lock id
 * @apiParam (Required) {string} new_username the username to add
 * @apiUse Default
 */

/**
 * @api {post} /lock/permissions/remove remove permissions
 * @apiName RemovePermission
 * @apiGroup locks
 * @apiDescription removes a lock permission
 * @apiUse Login
 * @apiParam (Required) {string} lock_id the lock id
 * @apiParam (Required) {string} new_username the username to remove
 * @apiUse Default
 */

/**
 * @api {post} /lock/status get status
 * @apiName GetLockStatus
 * @apiGroup locks
 * @apiDescription get the status of a lock
 * @apiParam (Required) {string} lock_id the lock id
 * @apiUse Default
 */

app.use('/api', express.static(__dirname + '/docs'));

// default return 404 not found error
app.use(function(req, res){
  res.send(404);
});

app.listen(3000);

const express = require('express');
var app = express();
let db = require('./db')

// add json body parser
app.use(express.json());

// logger middle ware
app.use((req, res, next) => {
  console.log(req.path, req.body);
  next();
})

function badRequest(res) {
  res.status(200).json({success: false, error: 'bad request'})
}

function auth(req, res, callback) {
  if (!(req.body.username && req.body.password)) {
    badRequest(res)
  } else {
    db.auth(req.body.username, req.body.password, uid => {
      if (!uid) {
        return res.status(200).json({success: false, error: 'unable to authenticate'})
      } else
        return callback(uid)
    })
  }
}

function lockPerm(req, res, id, callback) {
  db.userHasPermissions(id, req.body.lock_id, allowed => {
    if (!allowed) {
      return res.status(200).json({success: false, error: 'user does not have permissions for lock'})
    } else {
      return callback()
    }
  })
}

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
 * @api {post} /user/add add user
 * @apiName AddUser
 * @apiGroup users
 * @apiDescription creates a new user account
 * @apiParam {string} name the name used for creating personalized messages
 * @apiParam {string} email the users email must be something@something.something
 * @apiParam {string} username username of the user
 * @apiParam {string} password the password for the user
 * @apiUse Default
 * @apiSuccess {string} id the users id
 */
app.post('/user/add', (req, res) => {
  if (req.body.name && req.body.email && req.body.username && req.body.password) {
    if (!(/[\w.-]+@[\w.-]+.[\w.-]+/.test(req.body.email))) {
      res.status(200).json({success: false, error: "invalid email address"})
    } else {
      db.getUserID(req.body.username, (result) => {
        if (!result) {
          db.addUser(req.body.name, req.body.email, req.body.username, req.body.password, success => {
            if (success) {
              res.status(200).json({success: true})
            } else {
              res.status(200).json({success: false, error: "unable to add user"})
            }
          })
        } else {
          res.status(200).json({success: false, error: "username exists"})
        }
      })
    }
  } else {
    badRequest(res)
  }
})

/**
 * @api {post} /user/remove remove user
 * @apiName RemoveUser
 * @apiGroup users
 * @apiDescription remove
 * @apiUse Login
 * @apiUse Default
 */
app.post('/user/remove', (req, res) => {
  auth(req, res, id => {
    db.removeUser(id, removed => {
      if (!removed) {
        res.status(200).json({success: false, error: "server unable to remove user"})
      } else {
        res.status(200).json({success: true})
      }
    })
  })
})

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
app.post('/user/modify', (req, res) => {
  auth(req, res, id => {
    let data = {
      username: req.body.new_username,
      password: req.body.new_password,
      name: req.body.new_name,
      email: req.body.new_email
    }
    db.changeUser(id, data, updated => {
      if (updated) {
        res.status(200).json({success: true})
      } else {
        res.status(200).json({success: false, error: "server unable to modify user"})
      }
    })
  })
})

/**
  * @api {get} /user/locks get locks
  * @apiName GetUserLocks
  * @apiGroup users
  * @apiDescription get all locks that a use has access to
  * @apiUse Login
  * @apiUse Default
  * @apiSuccess {table} locks a table of lock ids
  */
app.post('/user/locks', (req, res) => {
  auth(req, res, id => {
    db.locksByUser(id, locks => {
      if (!locks) {
        res.status(200).json({success: false, error: 'sever error'})
      } else {
        res.status(200).json({success: true, locks})
      }
    })
  })
})

/**
 * @api {post} /lock/add add lock
 * @apiName AddLock
 * @apiGroup locks
 * @apiParam (Required) {string} lock_id the id of the lock
 * @apiParam (Required) {string} description a short description of the lock
 * @apiUse Default
 * @apiUse Login
 */
app.post('/lock/add', (req, res) => {
  auth(req, res, id => {
    if (!(req.body.lock_id && req.body.description)) {
      badRequest(res)
    } else {
      db.addLock(id, req.body.lock_id, req.body.description, added => {
        if (!added) {
          res.status(200).json({success: false, error: 'unable to add lock'})
        } else {
          res.status(200).json({success: true})
        }
      })
    }
  })
})

/**
 * @api {post} /lock/remove remove lock
 * @apiName RemoveLock
 * @apiGroup locks
 * @apiParam (Required) {string} lock_id the id of the lock
 * @apiUse Default
 */
app.post('/lock/remove', (req, res) => {
  auth(req, res, id => {
    if (!req.body.lock_id) {
      badRequest(res)
    } else {
      lockPerm(req, res, id, () => {
        db.removeLock(req.body.lock_id, removed => {
          if (!removed) {
            res.status(200).json({success: false, error: 'server error'})
          } else {
            res.status(200).json({success: true})
          }
        })
      })
    }
  })
})

/**
 * @api {post} /lock/modify modify lock description
 * @apiName ModifyLock
 * @apiGroup locks
 * @apiParam (Required) {string} lock_id the id of the lock
 * @apiParam (Required) {string} description a short description of the lock
 * @apiUse Default
 */
app.post('/lock/modify', (req, res) => {
  auth(req, res, id => {
    if (!req.body.lock_id || !req.body.description) {
      badRequest(res)
    } else {
      lockPerm(req, res, id, () => {
        db.setLockDesc(req.body.lock_id, req.body.description, updated => {
          if (!updated) {
            res.status(200).json({success: false, error: 'server error'})
          } else {
            res.status(200).json({success: true})
          }
        })
      })
    }
  })
})

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
app.post('/lock/permissions/add', (req, res) => {
  auth(req, res, id => {
    lockPerm(req, res, id, () => {
      if (!req.body.new_username || !req.body.lock_id) {
        badRequest()
      } else {
        db.getUserID(req.body.new_username, new_id => {
          if (!new_id) {
            return res.status(200).json({success: false, error: 'user not found'})
          } else {
            db.addPerm(new_id, req.body.lock_id, added => {
              if (!added) {
                return res.status(200).json({success: false, error: 'server error'})
              } else {
                return res.status(200).json({success: true})
              }
            })
          }
        })
      }
    })
  })
})

/**
 * @api {post} /lock/permissions/remove remove permissions
 * @apiName RemovePermission
 * @apiGroup locks
 * @apiDescription removes a lock permission
 * @apiUse Login
 * @apiParam (Required) {string} lock_id the lock id
 * @apiParam (Required) {string} r_username the username to remove
 * @apiUse Default
 */
app.post('/lock/permissions/remove', (req, res) => {
  auth(req, res, id => {
    lockPerm(req, res, id, () => {
      if (!req.body.r_username || !req.body.lock_id) {
        return badRequest()
      } else {
        db.getUserID(req.body.r_username, new_id => {
          if (!new_id) {
            return res.status(200).json({success: false, error: 'user not found'})
          } else {
            db.removePerm(new_id, req.body.lock_id, removed => {
              if (!removed) {
                res.status(200).json({success: false, error: 'server error'})
              } else {
                res.status(200).json({success: true})
              }
            })
          }
        })
      }
    })
  })
})

/**
 * @api {post} /lock/state get lock state
 * @apiName GetLockState
 * @apiGroup locks
 * @apiDescription get the status of a lock. The user must have permissions for the lock.
 * @apiParam (Required) {string} lock_id the lock id
 * @apiUse Default
 * @apiUse Login
 * @apiSuccess {int} state the state of the lock
 */
app.post('/lock/state', (req, res) => {
  auth(req, res, id => {
    if (!req.body.lock_id) {
      badRequest(res);
    } else {
      db.userHasPermissions(id, req.body.lock_id, allowed => {
        if (!allowed) {
          res.status(200).json({success: false, error: 'user does not have permissions for lock'})
        } else {
          db.getLockStatus(req.body.lock_id, state => {
            if (state === undefined) {
              res.status(200).json({success: false, error: 'server error'})
            } else {
              res.status(200).json({success: true, state})
            }
          })
        }
      })
    }
  })
})

/**
 * @api {post} /lock/toggle toggle a locks state
 * @apiName ChangeLockStatus
 * @apiGroup locks
 * @apiDescription Toggles a lock's state. The username specified must have permissions for the lock.
 * @apiUse Login
 * @apiParam (Required) {string} lock_id the id for the lock
 * @apiUse Default
 * @apiSuccess {int} state the state of the lock after toggling
 */
app.post('/lock/toggle', (req, res) => {
  auth(req, res, id => {
    db.userHasPermissions(id, req.body.lock_id, allowed => {
      if (!allowed) {
        res.status(200).json({success: false, error: 'user does not have permissions for lock'})
      } else {
        db.toggleLock(req.body.lock_id, state => {
          if (state === undefined) {
            res.status(200).json({success: false, error: 'server error'})
          } else {
            res.status(200).json({success: true, state})
          }
        })
      }
    })
  })
})

app.use('/api', express.static(__dirname + '/docs'))

// default return 404 not found error
app.use(function(req, res) {
  res.status(404)
})

app.listen(3000)

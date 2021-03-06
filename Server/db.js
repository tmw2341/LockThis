const sqlite3 = require('sqlite3').verbose()
const bcrypt = require('bcrypt')
var db

function openDBCon(callback) { // open database in memory
  let db = new sqlite3.Database('lockDB.db', (err) => {
    if (err) {
      console.error(err.message)
      return callback(false)
    }
    console.log('Connected to the in-memory SQlite database.')
  })
  return db
}

function initDB(callback) {
  let db = new sqlite3.Database('lockDB.db', (err) => {
    if (err) {
      console.error(err.message)
      return callback(false)
    }
    console.log('Connected to the in-memory SQlite database.')
  })
  if (callback) {
    return callback(db)
  };
}

function getDB(callback) {
  if (!db) {
    initDB(callback)
  } else {
    return callback(db)
  }
}

function closeDBCon(db, callback) { // close the database connection
  getDB(db => db.close((err) => {
    if (err) {
      return console.error(err.message)
    }
    console.log('Database connection closed.')
  }))
}

function addUser(name, email, username, pass, callback) { //Add user to database
  getDB(db => {
    // hash password
    bcrypt.hash(pass, 5, (err, hashed) => {
      let sql = 'INSERT INTO Users(Name, Email, Username, Password) VALUES(?, ?, ?, ?)'
      db.run(sql, [
        name, email, username, hashed
      ], function(err) {
        if (err) {
          console.log(err.message)
          return callback(false)
        }
        // get the userID
        console.log(`A user has been inserted with id ${this.lastID}`)
        return callback(true)
      })
    })
  })
}

function removeUser(id, callback) { //remove users from the database
  let sql = `DELETE FROM Users WHERE ID = ?`
  permissionsByUser(id, permIds => {
    for (let i = 0; i < permIds.length; i++) {
      removePerm(permIds[i])
    }
  })
  getDB(db => db.run(sql, [id], function(err) {
    if (err) {
      console.log(err.message)
      return callback(false)
    }
    console.log(`User with ID ${id} removed from database`)
    return callback(true)
  }));
}

function getUserID(username, callback) { //gets all locks associated with user
  let sql = `SELECT ID id FROM Users WHERE Username = ?`
  getDB(db => {
    db.get(sql, [username], (err, row) => {
      if (err) {
        console.log(err.message)
        return callback(null)
      } else {
        return callback(row.id)
      }
    })
  })
}

function auth(username, password, callback) {
  getDB(db => {
    let sql = 'select ID id, Password password from Users where Username = ?'
    db.get(sql, [username], (err, row) => {
      if (err) {
        console.log(err)
        return callback(null)
      } else {
        // return if no user
        if (!row)
          return callback(null)
        bcrypt.compare(password, row.password, (err, res) => {
          if (res)
            return callback(row.id)
          return callback(null)
        })
      }
    })
  })
}

// used by module for cleaner code
function _changeUser(id, username, password, name, email, callback) {
  getDB(db => {
    let sql = "UPDATE Users SET Username = ?, Password = ?, Name = ?, Email = ? WHERE ID = ?"
    db.run(sql, [
      username, password, name, email, id
    ], err => {
      if (err) {
        console.log(err)
        return callback(null)
      } else {
        return callback(true)
      }
    })
  })
}

// modify the user
// data is a dictionary where if the keys username, password, name, or email are set, they will be used to update the user
function changeUser(id, data, callback) {
  getDB(db => {
    getUserByID(id, user => {
      console.log(data.username, user.username)
      let username = data.username
        ? data.username
        : user.username
      let name = data.name
        ? data.name
        : user.name
      let email = data.email
        ? data.email
        : user.email
      if (data.password) {
        bcrypt.hash(data.password, 5, (err, hashed) => {
          _changeUser(id, username, hashed, name, email, callback)
        })
      } else {
        _changeUser(id, username, user.password, name, email, callback)
      }
    })
  })
}

// returns a dictioary with the users information from the database
function getUserByID(id, callback) {
  getDB(db => {
    let sql = 'select ID id, Username username, Password password, Name name, Email email from Users where ID = ?'
    db.get(sql, [id], (err, row) => {
      if (err || !row) {
        console.log(err)
        return callback(null)
      }
      console.log(row)
      return callback(row)
    })
  })
}

// add a lock and a permission for that user
function addLock(uid, id, description, callback) {
  getDB(db => {
    let sql1 = 'INSERT INTO Locks(id, description) VALUES(?,?)'
    let sql2 = 'INSERT INTO Permissions(LockID, UserID) VALUES(?, ?)'
    let data1 = [id, description]
    let data2 = [id, uid]
    db.run(sql1, data1, err1 => {
      if (!err1) {
        db.run(sql2, data2, err2 => {
          if (!err2) {
            return callback(true)
          } else {
            console.log(err2)
            return callback(null)
          }
        })
      } else {
        console.log(err1)
        return callback(null)
      }
    })
  })
}

// removes locks and permissions from database
function removeLock(id, callback) {
  getDB(db => {
    let lock_sql = 'DELETE FROM Locks WHERE ID = ?'
    let perm_sql = 'DELETE FROM Permissions WHERE LockID = ?'
    db.run(lock_sql, [id], err1 => {
      if (!err1) {
        db.run(perm_sql, [id], err2 => {
          if (!err2)
            return callback(true)
          console.log(err2)
        })
      } else {
        console.log(err1)
        return callback(null)
      }
    })
  })
}

//adds permission to database
function addPerm(uid, lock_id, callback) {
  console.log(uid)
  getDB(db => {
    let sql = 'INSERT INTO Permissions(LockID, UserID) VALUES(?, ?)'
    db.run(sql, [
      lock_id, uid
    ], err => {
      if (err) {
        console.log(err)
        return callback(null)
      } else {
        return callback(true)
      }
    })
  })
}

//removes permission from database
function removePerm(uid, lock_id, callback) {
  getDB(db => {
    let sql = 'DELETE FROM Permissions WHERE UserID = ? AND LockID = ?'
    db.run(sql, [
      uid, id
    ], err => {
      if (err) {
        console.log(err)
        return callback(null)
      } else {
        return callback(true)
      }
    })
  })
}

// returns a table of lock objects with keys id, description, and status for each lock
function locksByUser(userID, callback) {
  getDB(db => {
    let sql = 'SELECT LockID id, Description description, Status status FROM Permissions INNER JOIN Locks ON Permissions.LockID = Locks.ID WHERE UserID = ?'
    db.all(sql, [userID], (err, rows) => {
      if (err) {
        console.log(err.message)
        return callback(null)
      }
      return callback(rows)
    })
  })
}

// check is the users has permissions for a lock
function userHasPermissions(uid, lock_id, callback) {
  getDB(db => {
    let sql = 'SELECT * FROM Permissions WHERE UserID = ? AND LockID = ?'
    db.get(sql, [
      uid, lock_id
    ], (err, row) => {
      if (err) {
        console.log(err)
        return callback(null)
      } else {
        if (row) {
          return callback(true)
        } else {
          return callback(null)
        }
      }
    })
  })
}

// return a locks status
function getLockStatus(id, callback) {
  getDB(db => {
    let sql = 'SELECT Status status FROM Locks WHERE ID = ?'
    db.get(sql, [id], (err, row) => {
      if (err) {
        console.log(err)
      } else {
        if (row) {
          console.log(row.status)
          return callback(row.status)
        }
        return callback(null)
      }
    })
  })
}

//changes the status of a given lock
function changeLockStatus(id, status, callback) {
  getDB(db => {
    let data = [status, id]
    let sql = 'UPDATE Locks SET Status = ? WHERE ID = ?'
    db.run(sql, data, err => {
      if (err) {
        console.log(err)
        return callback(null)
      } else {
        return callback(true)
      }
    })
  })
}

// toggles the locks status
function toggleLock(lock_id, callback) {
  getDB(db => {
    getLockStatus(lock_id, status => {
      if (status === 1) {
        changeLockStatus(lock_id, 0, changed => {
          if (changed)
            return callback(0)
          return callback(null)
        })
      } else if (status === 0) {
        changeLockStatus(lock_id, 1, changed => {
          if (changed)
            return callback(1)
          return callback(null)
        })
      } else {
        console.log('error toggling lock status')
        return callback(null)
      }
    })
  })
}

//returns an array of all locks
function returnAllLocks(callback) {
  let allLocks = {}
  let index = 0
  let sql = `SELECT DISTINCT ID id FROM Locks
           ORDER BY ID`;
  getDB(db => {
    db.all(sql, [], (err, rows) => {
      if (err) {
        console.log(err.message)
        return callback(false)
      }
      rows.forEach((row) => {
        allLocks[index] = row.id
        console.log(allLocks[index])
        index++
      })
      return callback(allLocks)
    })
  })
}

function returnAllUsers(callback) { //returns the ids of all users in an array
  let allUsers = {}
  let index = 0
  let sql = `SELECT DISTINCT ID id FROM Users
           ORDER BY ID`
  getDB(db => {
    db.all(sql, [], (err, rows) => {
      if (err) {
        console.log(err.message)
        return callback(false)
      }
      rows.forEach((row) => {
        allUsers[index] = row.id
        console.log(allUsers[index])
        index++
      })
      return callback(allUsers)
    })
  })
}

function returnAllLockStatus(callback) { //return the status of all locks in array indexed by lock ID
  let allStatus = {}
  let index = 0
  let sql = `SELECT DISTINCT ID id, Status status FROM Locks ORDER BY ID`;
  getDB(db => {
    db.all(sql, [], (err, rows) => {
      if (err) {
        console.log(err.message)
        return callback(false)
      }
      rows.forEach((row) => {
        allStatus[row.id] = row.status
        console.log(row.id + " " + allStatus[row.id])
      })
      return callback(allStatus)
    })
  })
}

function setLockDesc(id, desc, callback) {
  getDB(db => {
    let sql = 'UPDATE Locks SET Description = ? WHERE ID = ?'
    let data = [desc, id]
    db.run(sql, data, err => {
      if (err) {
        console.log(err.message)
        return callback(null)
      } else {
        return callback(true)
      }
    })
  })
}

function permissionsByLock(lock_id, callback) { //gets all permissions associated with lock
  let sql = `SELECT ID id from Permissions Where LockID = ?`
  let index = 0
  let Perms = []
  getDB(db => {
    db.all(sql, [lock_id], (err, rows) => {
      if (err) {
        console.log(err.message)
        return callback(false)
      }
      rows.forEach((row) => {
        Perms[index] = row.id
        console.log(Perms[index])
        index++
      })
      return callback(Perms)
    })
  })
}

function permissionsByUser(userID, callback) { //gets all permissions associated with user
  let sql = `SELECT ID id from Permissions Where UserID = ?`;
  let index = 0
  let Perms = []
  getDB(db => {
    db.all(sql, [userID], (err, rows) => {
      if (err) {
        console.log(err.message)
        return callback(false)
      }
      rows.forEach((row) => {
        Perms[index] = row.id
        console.log(Perms[index])
        index++
      })
      return callback(Perms)
    })
  })
}

module.exports = {
  addUser: addUser,
  removeUser: removeUser,
  getUserID: getUserID,
  auth: auth,
  getUserByID: getUserByID,
  changeUser: changeUser,
  addLock: addLock,
  removeLock: removeLock,
  addPerm: addPerm,
  removePerm: removePerm,
  locksByUser: locksByUser,
  userHasPermissions: userHasPermissions,
  getLockStatus: getLockStatus,
  toggleLock: toggleLock,
  setLockDesc: setLockDesc
}

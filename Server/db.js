const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt')
let db = openDBCon();

function openDBCon(callback) { // open database in memory
  let db = new sqlite3.Database('lockDB.db', (err) => {
    if (err) {
      console.error(err.message);
      return callback(false);
    }
    console.log('Connected to the in-memory SQlite database.');
  });
  return db;
}

function initDB(callback) {
  let db = new sqlite3.Database('lockDB.db', (err) => {
    if (err) {
      console.error(err.message);
      return callback(false);
    }
    console.log('Connected to the in-memory SQlite database.');
  });
  if (callback) {
    return callback(db);
  };
}

function getDB(callback) {
  if (db != null) {
    initDB(callback)
  } else {
    return callback(db);
  }
}

function closeDBCon(db, callback) { // close the database connection
  getDB(db => db.close((err) => {
    if (err) {
      return console.error(err.message);
    }
    console.log('Database connection closed.');
  }));
}

function addUser(name, email, username, pass, callback) { //Add user to database
  getDB(db => {
    // hash password
    bcrypt.hash(pass, 5, (err, hashed) => {
      db.run(`INSERT INTO Users(Name, Email, Username, Password) VALUES(?, ?, ?, ?)`, [
        name, email, username, hashed
      ], function(err) {
        if (err) {
          console.log(err.message);
          return callback(false);
        }
        // get the userID
        console.log(`A user has been inserted with id ${this.lastID}`);
        return callback(true);
      })
    })
  })
}

function removeUser(ID, callback) { //remove users from the database
  let sql = `DELETE FROM Users WHERE ID = ?`;
  permissionsByUser(ID, permIds => {
    for (let i = 0; i < permIds.length; i++) {
      removePerm(permIds[i]);
    }
  });
  getDB(db => db.run(sql, [ID], function(err) {
    if (err) {
      console.log(err.message);
      return callback(false);
    }
    console.log(`User with ID ${ID} removed from database`);
    return callback(true);
  }));
}

function getUserID(username, callback) { //gets all locks associated with user
  let sql = `SELECT ID id FROM Users WHERE Username = ?`;
  getDB(db => {
    db.get(sql, [username], (err, row) => {
      if (err) {
        console.log(err.message);
        return callback(null);
      } else {
        return callback(row)
      }
    })
  });
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
    db.run(sql, [username, password, name, email, id], err => {
      if(err) {
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
    let sql = 'select ID id, username, username, Password password, Name name, Email email from Users where ID = ?'
    db.get(sql, [id], (err, row) => {
      if (err || !row)
        return callback(null);
      return callback(row)
    })
  })
}

function addLock(ID, callback) { //adds lock to database
  getDB(db => db.run(`INSERT INTO Locks(ID) VALUES(?)`, [ID], function(err) {
    if (err) {
      console.log(err.message);
      return callback(false);
    }
    console.log(`A lock has been inserted with id ${ID}`);
    return callback(true);
  }));
}

function removeLock(ID, callback) { //removes lock from database
  let sql = `DELETE FROM Locks
               WHERE ID = ?`;
  permissionsByLock(ID, permIds => {
    console.log(permIds);
    for (let i = 0; i < permIds.length; i++) {
      removePerm(permIds[i]);
    }
  });
  getDB(db => db.run(sql, [ID], function(err) {
    if (err) {
      console.log(err.message);
      return callback(false);
    }
    console.log(`Lock with ID ${ID} removed from database`);
    return callback(true);
  }));
}

function addPerm(user, lock, callback) { //adds permission to database
  getDB(db => db.run(`INSERT INTO Permissions(LockID, UserID) VALUES(?, ?)`, [
    lock, user
  ], function(err) {
    if (err) {
      console.log(err.message);
      return callback(false);
    }
    console.log(`A permission has been inserted with id ${this.lastID}`);
    return callback(true);
  }));
}

function removePerm(ID, callback) { //removes permission from database
  let sql = `DELETE FROM Permissions
               WHERE ID = ?`;
  getDB(db => db.run(sql, [ID], function(err) {
    if (err) {
      console.log(err.message);
      return callback(false);
    }
    console.log(`Permission with ID ${ID} removed from database`);
    return callback(true);
  }));
}

function locksByUser(userID, callback) { //gets all locks associated with user
  let sql = `SELECT LockID id FROM Permissions
               WHERE UserID = ?`;
  let Locks = {};
  let index = 0;
  getDB(db => db.all(sql, [userID], (err, rows) => {
    if (err) {
      console.log(err.message);
      return callback(false);
    }
    rows.forEach((row) => {
      Locks[index] = row.id;
      console.log(Locks[index]);
      index++;
    });
    return callback(Locks);
  }));
}

function getLockStatus(ID, callback) { //gets the status of a lock
  let sql = `SELECT Status status
                FROM Locks
                WHERE ID = ?`
  getDB(db => db.get(sql, [ID], (err, row) => {
    if (err) {
      console.log(err.message);
      return callback(false);
    }
    row
      ? console.log(row.status)
      : console.log(`No lock found with the id ${ID}`);
    return callback(true);

  }));
}

function changeLockStatus(ID, status, callback) { //changes the status of a  given lock
  let data = [status, ID];
  let sql = `UPDATE Locks
            SET Status = ?
            WHERE ID = ?`;

  getDB(db => db.run(sql, data, function(err) {
    if (err) {
      console.log(err.message);
      return callback(false);
    }
    console.log(`Row(s) updated: ${this.changes}`);
    return callback(true);
  }));
}

function getUserName(ID, callback) { //gets User Name
  let sql = `SELECT Name name
                FROM Users
                WHERE ID = ?`
  getDB(db => db.get(sql, [ID], (err, row) => {
    if (err) {
      console.log(err.message);
      return callback(false);
    }
    row
      ? console.log(row.name)
      : console.log(`No user found with the id ${ID}`);
    return callback(true);
  }));
}

function editUserName(ID, name, callback) { //changes name of given user
  let data = [name, ID];
  let sql = `UPDATE Users
            SET Name = ?
            WHERE ID = ?`;

  getDB(db => db.run(sql, data, function(err) {
    if (err) {
      console.log(err.message);
      return callback(false);
    }
    console.log(`Row(s) updated: ${this.changes}`);
    return callback(true);
  }));
}

function getUserEmail(ID, callback) { //gets User Email
  let sql = `SELECT Email email
                FROM Users
                WHERE ID = ?`
  getDB(db => db.get(sql, [ID], (err, row) => {
    if (err) {
      console.log(err.message);
      return callback(false);
    }
    row
      ? console.log(row.email)
      : console.log(`No user found with the id ${ID}`);
    return callback(true);
  }));
}

function editUserEmail(ID, email, callback) { //changes email of given user
  let data = [email, ID];
  let sql = `UPDATE Users
            SET Email = ?
            WHERE ID = ?`;

  getDB(db => db.run(sql, data, function(err) {
    if (err) {
      console.log(err.message);
      return callback(false);
    }
    console.log(`Row(s) updated: ${this.changes}`);
    return callback(true);
  }));
}

function getUserUsername(ID, username, callback) { //gets User username
  let sql = `SELECT Username username
                FROM Users
                WHERE ID = ?`
  getDB(db => db.get(sql, [ID], (err, row) => {
    if (err) {
      console.log(err.message);
      return callback(false);
    }
    row
      ? console.log(row.username)
      : console.log(`No user found with the id ${ID}`);
    return callback(true);
  }));
}

function editUserUsername(ID, username, callback) { //changes username of given user
  let data = [username, ID];
  let sql = `UPDATE Users
            SET Username = ?
            WHERE ID = ?`;

  getDB(db => db.run(sql, data, function(err) {
    if (err) {
      console.log(err.message);
      return callback(false);
    }
    console.log(`Row(s) updated: ${this.changes}`);
    return callback(true);
  }));
}

function getUserPassword(ID, password, callback) { // gets user password
  let sql = `SELECT Password password
                FROM Users
                WHERE ID = ?`
  getDB(db => db.get(sql, [ID], (err, row) => {
    if (err) {
      console.log(err.message);
      return callback(false);
    }
    row
      ? console.log(row.password)
      : console.log(`No user found with the id ${ID}`);
    return callback(true);
  }));
}

function editUserPassword(ID, password, callback) { //changes password of given user
  let data = [password, ID];
  let sql = `UPDATE Users
            SET Password = ?
            WHERE ID = ?`;

  getDB(db => db.run(sql, data, function(err) {
    if (err) {
      console.log(err.message);
      return callback(false);
    }
    console.log(`Row(s) updated: ${this.changes}`);
    return callback(true);
  }));
}

function returnAllLocks(callback) { //returns an array  of all locks
  let allLocks = {};
  let index = 0;
  let sql = `SELECT DISTINCT ID id FROM Locks
           ORDER BY ID`;
  getDB(db => db.all(sql, [], (err, rows) => {
    if (err) {
      console.log(err.message);
      return callback(false);
    }
    rows.forEach((row) => {
      allLocks[index] = row.id;
      console.log(allLocks[index]);
      index++;
    });
    return callback(allLocks);
  }));
}

function returnAllUsers(callback) { //returns the ids of all users in an array
  let allUsers = {};
  let index = 0;
  let sql = `SELECT DISTINCT ID id FROM Users
           ORDER BY ID`;
  getDB(db => db.all(sql, [], (err, rows) => {
    if (err) {
      console.log(err.message);
      return callback(false);
    }
    rows.forEach((row) => {
      allUsers[index] = row.id;
      console.log(allUsers[index]);
      index++;
    });
    return callback(allUsers);
  }));
}

function returnAllLockStatus(callback) { //return the status of all locks in array indexed by lock ID
  let allStatus = {};
  let index = 0;
  let sql = `SELECT DISTINCT ID id, Status status FROM Locks
           ORDER BY ID`;
  getDB(db => db.all(sql, [], (err, rows) => {
    if (err) {
      console.log(err.message);
      return callback(false);
    }
    rows.forEach((row) => {
      allStatus[row.id] = row.status;
      console.log(row.id + " " + allStatus[row.id]);
    });
    return callback(allStatus);
  }));
}

function getLockDesc(ID, callback) { //gets Lock Description
  let sql = `SELECT Description desc
                FROM Locks
                WHERE ID = ?`
  getDB(db => db.get(sql, [ID], (err, row) => {
    if (err) {
      console.log(err.message);
      return callback(false);
    }
    row
      ? console.log(row.desc)
      : console.log(`No lock found with the id ${ID}`);
    return callback(true);
  }));
}

function setLockDesc(ID, desc, callback) {
  let data = [desc, ID];
  let sql = `UPDATE Locks
            SET Description = ?
            WHERE ID = ?`;
  getDB(db => db.run(sql, data, function(err) {
    if (err) {
      console.log(err.message);
      return callback(false);
    }
    console.log(`Row(s) updated: ${this.changes}`);
    return callback(true);
  }));
}

function permissionsByLock(lockID, callback) { //gets all permissions associated with lock
  let sql = `SELECT ID id from Permissions
               Where LockID = ?`;
  let index = 0;
  let Perms = [];
  getDB(db => db.all(sql, [lockID], (err, rows) => {
    if (err) {
      console.log(err.message);
      return callback(false);
    }
    rows.forEach((row) => {
      Perms[index] = row.id;
      console.log(Perms[index]);
      index++;
    });
    return callback(Perms);
  }));
}

function permissionsByUser(userID, callback) { //gets all permissions associated with user
  let sql = `SELECT ID id from Permissions
               Where UserID = ?`;
  let index = 0;
  let Perms = [];
  getDB(db => db.all(sql, [userID], (err, rows) => {
    if (err) {
      console.log(err.message);
      return callback(false);
    }
    rows.forEach((row) => {
      Perms[index] = row.id;
      console.log(Perms[index]);
      index++;
    });
    return callback(Perms);
  }));
}

module.exports = {
  initDB: initDB,
  getDB: getDB,
  closeDBCon: closeDBCon,
  addUser: addUser,
  removeUser: removeUser,
  getUserID: getUserID,
  auth: auth,
  getUserByID:getUserByID,
  changeUser:changeUser,
  addLock: addLock,
  removeLock: removeLock,
  addPerm: addPerm,
  removePerm: removePerm,
  locksByUser: locksByUser,
  getLockStatus: getLockStatus,
  changeLockStatus: changeLockStatus,
  getUserName: getUserName,
  editUserName: editUserName,
  getUserEmail: getUserEmail,
  editUserEmail: editUserEmail,
  getUserUsername: getUserUsername,
  editUserUsername: editUserUsername,
  getUserPassword: getUserPassword,
  editUserPassword: editUserPassword,
  returnAllLocks: returnAllLocks,
  returnAllUsers: returnAllUsers,
  returnAllLockStatus: returnAllLockStatus,
  getLockDesc: getLockDesc,
  setLockDesc: setLockDesc,
  permissionsByLock: permissionsByLock,
  permissionsByUser: permissionsByUser
}

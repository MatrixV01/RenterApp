var db = require('./dbConfig.js');
var config = require('../knexfile.js');
var env = process.env.NODE_ENV || 'development';
var Promise = require('bluebird');
var bcrypt = require('bcrypt');


exports.addUser = function(username, password, email) {
  return new Promise(function(fulfill, reject) {
    var knex = require('knex')(config[env]);
    var hash = bcrypt.hashSync(password, 8);

    knex.insert({
        'username': username,
        'password': hash,
        'email': email
      }).returning('id').into('users')
      .then(function(response) {
        knex.destroy();
        fulfill(response)
      })
      .catch(function(err) {
        knex.destroy();
        if (err.constraint === 'users_username_unique') {
          fulfill('Username already taken. Choose another.')
        }
        reject(err)
      })
  })
}

exports.getUserByUsername = function(username) {
  return new Promise(function(fulfill, reject) {
    var knex = require('knex')(config[env]);
    knex.select('*').from('users').where('username', username)
      .then(function(user) {
        knex.destroy();
        if (user.length === 0) {
          fulfill(false);
        } else if (user[0].username === username) {
          fulfill(user);
        } else {
          reject(user);
        }
      })
      .catch(function(err) {
        knex.destroy();
        console.error('error getting user by username: ', err);
        reject(err);
      })
  })
}

exports.getUserByID = function(ID) {
  return new Promise(function(fulfill, reject) {
    var knex = require('knex')(config[env]);
    knex.select('*').from('users').where('id', ID)
      .then(function(user) {
        knex.destroy();
        if (user.length === 0) {
          fulfill(false);
        } else if (user[0].id === ID) {
          fulfill(user);
        } else {
          reject(user);
        }
      })
      .catch(function(err) {
        knex.destroy();
        console.error('error getting user by ID: ', err);
        reject(err);
      })
  })
}

exports.validatePassword = function(trialPass, userID) {
  return new Promise(function(fulfill, reject) {
    exports.getUserByID(userID)
      .then(function(users) {
        if (!users[0].password) {
          var body = {
            status: 'failed',
            message: 'error getting user by id'
          }
          console.error('error getting user by id')
          reject(body)
        } else {
          var isValid = bcrypt.compareSync(trialPass, users[0].password);
          fulfill(isValid);
        }
      })
      .catch(function(err) {
        console.err('could not get user for validation. ', err);
        reject(err);
      })
  })
}

exports.removeUser = function(id) {
  return new Promise(function(fulfill, reject) {
    var knex = require('knex')(config[env]);
    knex.del('*').from('users').where('id', id)
      .then(function(response) {
        knex.destroy();
        fulfill(response)
      })
      .catch(function(err) {
        knex.destroy();
        reject(err);
      })
  })

}

exports.userExists = function(id) {
  return new Promise(function(fulfill, reject) {
    var knex = require('knex')(config[env]);
    knex.select('*').from('users').where('id', id)
      .then(function(response) {
        knex.destroy();
        if (response.length === 0) {
          fulfill(false);
        } else if (!!response[0].username) {
          fulfill(true);
        } else {
          reject({
            'message': 'error checking if user exists',
            'body': response
          })
        }
      })
      .catch(function(err) {
        console.error('error checking if user exists', err)
        knex.destroy();
        reject(err);
      })

  })

}

exports.addItem = function(obj) {
  return new Promise(function(fulfill, reject) {
    var knex = require('knex')(config[env]);
    knex.insert(obj).returning('id').into('items')
      .then(function(response) {
        knex.destroy();
        fulfill(response);
      })
      .catch(function(err) {
        knex.destroy()
        if (err.constraint === 'items_item_owner_foreign') {
          fulfill('We do not have a record of that items owner.')
        }
        reject(err)
      })
  })
}

exports.itemExists = function(id) {
  return new Promise(function(fulfill, reject) {
    var knex = require('knex')(config[env]);

    knex.select('*').from('items').where('id', id)
      .then(function(response) {
        knex.destroy();
        if (response.length === 0) {
          fulfill(false);
        } else if (!!response[0].name) {
          fulfill(true);
        } else {
          reject({
            'message': 'error checking if item exists',
            'body': response
          })
        }
      })
      .catch(function(err) {
        console.error('error checking if item exists', err)
        knex.destroy();
        reject(err);
      })


  })
}

exports.removeItem = function(id) {
  return new Promise(function(fulfill, reject) {
    var knex = require('knex')(config[env]);
    knex.del('*').from('items').where('id', id)
      .then(function(response) {
        knex.destroy();
        fulfill(response)
      })
      .catch(function(err) {
        knex.destroy();
        reject(err);
      })
  })
}

//TODO: search by first three chars of zipcode rather than whole thing - return all that start with the first 3 numbers.
// - Will hopefully increase # of search results.
exports.getItemsByZip = function(zip) {
  return new Promise(function(fulfill, reject) {
    var knex = require('knex')(config[env]);
    knex.select('*').from('items').where('zip', zip)
      .then(function(items) {
        knex.destroy();
        fulfill(items)
      })
      .catch(function(err) {
        knex.destroy();
        console.error('error getting items by zipcode: ', err);
        fulfill(err)
      })
  })
}

exports.getItemsByName = function(name) {
  return new Promise(function(fulfill, reject) {
    var knex = require('knex')(config[env]);
    knex.select('*').from('items').where('name', name)
      .then(function(items) {
        knex.destroy();
        fulfill(items)
      })
      .catch(function(err) {
        knex.destroy();
        console.error('error getting items by name: ', err);
        fulfill(err)
      })
  })
}

exports.getItemsByNameLike = function(name) { //
  return new Promise(function(fulfill, reject) {
    var knex = require('knex')(config[env]);
    knex.select('*').from('items').whereRaw('LOWER(name) LIKE ?', '%' + name.toLowerCase() + '%')
      .then(function(items) {
        knex.destroy();
        fulfill(items)
      })
      .catch(function(err) {
        knex.destroy();
        console.error('error getting items by nameLike: ', err);
        fulfill(err)
      })
  })
}

exports.getItemsByOwnerID = function(ID) {
  return new Promise(function(fulfill, reject) {
    var knex = require('knex')(config[env]);
    knex.select('*').from('items').where('item_owner', ID)
      .then(function(items) {
        knex.destroy();
        fulfill(items)
      })
      .catch(function(err) {
        knex.destroy();
        console.error('error getting items by ownerID: ', err);
        fulfill(err)
      })
  })
}

exports.getItemByID = function(ID) {
  return new Promise(function(fulfill, reject) {
    var knex = require('knex')(config[env]);
    knex.select('*').from('items').where('id', ID)
      .then(function(item) {
        knex.destroy();
        if (item.length === 0) {
          fulfill(false);
        } else if (item[0].id === ID) {
          fulfill(item);
        } else {
          reject(item);
        }
      })
      .catch(function(err) {
        knex.destroy();
        console.error('error getting item by ID: ', err);
        reject(err);
      })
  })
}

exports.dateHasBookConflicts = function(itemId, start, end) {
  // TODO: return an array of conflicts instead of bool - tell users WHEN
  // conflicts occur, not just that they exist.
  return new Promise(function(fulfill, reject) {
    var knex = require('knex')(config[env]);
    knex.select('*').from('rentals').where('item_id', itemId).whereBetween('date_start', [start, end]).orWhereBetween('date_end', [start, end])
      .then(function(items) {
        knex.destroy();
        if (items.length === 0) {
          fulfill(false);
        } else {
          fulfill(true);
        }
      })
      .catch(function(err) {
        knex.destroy();
        console.error('error checking booking conflicts: ', err);
        reject(err)
      })
  })
}

exports.dateIsInRange = function(itemId, start, end) {
  return new Promise(function(fulfill, reject) {
    var knex = require('knex')(config[env]);
    knex.select('*').from('items').where('id', itemId).whereNotBetween('date_start', [start, end]).whereNotBetween('date_end', [start, end])
      .then(function(items) {
        knex.destroy();
        if (items.length === 0) {
          fulfill(false);
        } else {
          fulfill(true);
        }
      })
      .catch(function(err) {
        knex.destroy();
        console.error('error checking booking conflicts: ', err);
        reject(err);
      })
  })
}

exports.addRental = function(obj) {
  return new Promise(function(fulfill, reject) {
    var knex = require('knex')(config[env]);
    knex.insert(obj).returning('id').into('rentals')
      .then(function(response) {
        knex.destroy();
        fulfill(response);
      })
      .catch(function(err) {
        knex.destroy()
        reject(err)
      })
  })
}

exports.getRentalsByRenterID = function(ID) {
  return new Promise(function(fulfill, reject) {

    var knex = require('knex')(config[env]);
    knex.select('*').from('rentals').where('user_id', ID)
      .then(function(rentals) {
        knex.destroy();
        if (rentals.length === 0) {
          fulfill(false);
        } else if (rentals[0].id && rentals[0].user_id) {
          fulfill(rentals);
        } else {
          reject(rentals);
        }
      })
      .catch(function(err) {
        knex.destroy();
        console.error('error getting rental by renter ID: ', err);
        reject(err);
      })


  })
}

exports.getRentalByRentalID = function(ID) {
  return new Promise(function(fulfill, reject) {
    var knex = require('knex')(config[env]);
    knex.select('*').from('rentals').where('id', ID)
      .then(function(rentals) {
        knex.destroy();
        if (rentals.length === 0) {
          fulfill(false);
        } else if (rentals[0].id === ID) {
          fulfill(rentals);
        } else {
          reject(rentals);
        }
      })
      .catch(function(err) {
        knex.destroy();
        console.error('error getting rental by rental ID: ', err);
        reject(err);
      })
  })
}

exports.getRentalsByItemID = function(ID) {
  return new Promise(function(fulfill, reject) {
    var knex = require('knex')(config[env]);
    knex.select('*').from('rentals').where('item_id', ID)
      .then(function(rentals) {
        knex.destroy();
        if (rentals.length === 0) {
          fulfill(false);
        } else if (rentals[0].id && rentals[0].user_id) {
          fulfill(rentals);
        } else {
          reject(rentals);
        }
      })
      .catch(function(err) {
        knex.destroy();
        console.error('error getting rental by item ID: ', err);
        reject(err);
      })
  })
}

exports.removeRental = function(ID) {
  return new Promise(function(fulfill, reject) {
    var knex = require('knex')(config[env]);
    knex.del('*').from('rentals').where('id', ID)
      .then(function(response) {
        knex.destroy();
        fulfill(response)
      })
      .catch(function(err) {
        knex.destroy();
        console.error('could not remove rental: ', err)
        reject(err);
      })
  })
}

exports.addSession = function(userID) {
  return new Promise(function(fulfill, reject) {
    var knex = require('knex')(config[env]);

    //create a sessionID with a random 6 digit hash seed
    var hashSeed = Math.floor(100000 + Math.random() * 900000).toString()
    var salt = bcrypt.genSaltSync(10)
    var sessionID = bcrypt.hashSync(hashSeed, salt);

    knex.insert({
        'user_id': userID,
        'session_id': sessionID
      }).returning('session_id').into('sessions')
      .then(function(response) {
        knex.destroy();
        fulfill(response);
      })
      .catch(function(err) {
        knex.destroy();
        reject(err);
      })
  })
}


exports.getSessionBySessionID = function(sessionID) {
  return new Promise(function(fulfill, reject) {
    var knex = require('knex')(config[env]);

    knex.select('*').from('sessions').where('session_id', sessionID)
      .then(function(session) {
        knex.destroy();
        if (session.length === 0) {
          fulfill(false);
        } else if (session[0].session_id && session[0].user_id) {
          fulfill(session);
        } else {
          reject(session);
        }
      })
      .catch(function(err) {
        knex.destroy();
        console.error('error getting session by session ID: ', err);
        reject(err);
      })
  })
}


exports.getSessionByUserID = function(userID) {
  return new Promise(function(fulfill, reject) {
    var knex = require('knex')(config[env]);

    knex.select('*').from('sessions').where('user_id', userID)
      .then(function(session) {
        knex.destroy();
        if (session.length === 0) {
          fulfill(false);
        } else if (session[0].session_id && session[0].user_id) {
          fulfill(session);
        } else {
          reject(session);
        }
      })
      .catch(function(err) {
        knex.destroy();
        console.error('error getting session by user ID: ', err);
        reject(err);
      })
  })
}


exports.removeSession = function(userID) {
  return new Promise(function(fulfill, reject) {
    var knex = require('knex')(config[env]);
    knex.del('*').from('sessions').where('user_id', userID)
      .then(function(response) {
        knex.destroy();
        fulfill(response)
      })
      .catch(function(err) {
        knex.destroy();
        reject(err);
      })
  })
}


// ----------- POST MVP ONLY BELOW THIS LINE --------------------
exports.confirmRental = function() {
  return new Promise(function(fulfill, reject) {
    fulfill('test')
  })
}

exports.deConfirmRental = function() {
  return new Promise(function(fulfill, reject) {
    fulfill('test')
  })
}

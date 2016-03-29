require('../test-helper.js');

var chai = require('chai');
var expect = require('chai').expect;
var request = require('supertest');
var env = process.env.NODE_ENV;
var config = require('../../knexfile.js');
var knex = require('knex')(config[env]);
var dbMethod = require('../../db/dbMethods.js');
var Promise = require('bluebird');
var bcrypt = require('bcrypt')


//Truncate empties the database tables. It is called once before each test and again after all have run.
function truncate() {
  var tables = ['users', 'items', 'rentals', 'sessions'];
  return Promise.each(tables, function(table) {
    return knex.raw('truncate table ' + table + ' cascade');
  });
};

describe("Database Query Functions:", function() {

  beforeEach(function(done) {
    truncate()
      .then(function(resp) {
        done()
      })
  })

  after(function(done) {
    truncate()
      .then(function(resp) {
        knex.destroy();
        done();
      })
  });


  describe("dbMethods.addUser", function() {
    it_('should add a new user to the users table', function*() {
      yield dbMethod.addUser('jeffrey', '1234', 'jeffrey@netscape.net')
        .then(function(resp) {
          expect(resp[0]).to.be.a('number')
        })
    })

    it_('should hash passwords', function*() {
      yield dbMethod.addUser('John Jacob', 'pass', 'test@testemail.com')
      yield dbMethod.getUserByUsername('John Jacob')
        .then(function(user) {
          expect(user[0].password).to.be.a('string');
          expect(user[0].password).not.to.equal('pass');
        })
    })

    it_('should NOT add a new user if username is already taken', function*() {
      yield dbMethod.addUser('Marge', 'password', 'margeemail@marge.com')

      yield dbMethod.addUser('Marge', 'pw', 'another@email.com')
        .then(function(resp) {
          expect(resp).to.equal('Username already taken. Choose another.')
        })
    })
  })


  describe("dbMethods.userExists", function() {
    it_('should return true if a user exists', function*() {
      var id = yield dbMethod.addUser('larry', 'larryPassword', 'larry.larry@larry.larry')
        .then(function(userInfo) {
          return userInfo[0]
        })

      yield dbMethod.userExists(id)
        .then(function(bool) {
          expect(bool).to.equal(true)
        })
    })

    it_('should return false for a nonexistent user', function*() {
      yield dbMethod.userExists(42786)
        .then(function(bool) {
          expect(bool).to.equal(false);
        })
    })
  })

  describe("dbMethods.getUserByUsername", function() {
    it_("should return a single user's information", function*() {

      yield dbMethod.addUser('larry', 'larryPassword', 'larry.larry@larry.larry')

      yield dbMethod.getUserByUsername('larry')
        .then(function(user) {
          expect(user[0].username).to.equal('larry')
        })
    })

    it_("should return false if an unclaimed username is queried", function*() {

      yield dbMethod.addUser('larry', 'larryPassword', 'larry.larry@larry.larry')

      yield dbMethod.getUserByUsername('Michaelangelo')
        .then(function(bool) {
          expect(bool).to.equal(false)
        })
    })
  })

  describe("dbMethods.getUserByID", function() {
    it_("should return a single user's information", function*() {

      var userID = yield dbMethod.addUser('larry', 'larryPassword', 'larry.larry@larry.larry')
        .then(function(resp) {
          return resp[0];
        })

      yield dbMethod.getUserByID(userID)
        .then(function(user) {
          expect(user[0].username).to.equal('larry')
        })

    })

    it_("should return false if an unassigned ID is queried", function*() {

      var id = yield dbMethod.addUser('larry', 'larryPassword', 'larry.larry@larry.larry')
        .then(function(userID) {
          return userID[0];
        })

      yield dbMethod.getUserByID(123456)
        .then(function(bool) {
          expect(bool).to.equal(false)
        })
    })
  })


  describe("dbMethods.validatePassword", function() {
    it_('should return true for a matching password', function*() {
      var userID = yield dbMethod.addUser('larry', 'larryPassword', 'larry.larry@larry.larry')
        .then(function(userID) {
          return userID[0];
        })
      var trialPassword = 'larryPassword';
      yield dbMethod.validatePassword(trialPassword, userID)
        .then(function(bool) {
          expect(bool).to.equal(true)
        })
    })

    it_('should return false for a non-matching password', function*() {
      var userID = yield dbMethod.addUser('larry', 'larryPassword', 'larry.larry@larry.larry')
        .then(function(userID) {
          return userID[0];
        })
      var trialPassword = 'wrongPassword';
      yield dbMethod.validatePassword(trialPassword, userID)
        .then(function(bool) {
          expect(bool).to.equal(false)
        })
    })
  })


  describe("dbMethods.removeUser", function() {
    it_('should delete a user from the users table', function*() {
      var user = yield dbMethod.addUser('Billiam Uttsbuuts', '7', 'b.uttsbuuts@larry.larry')
        .then(function(userID) {
          return userID[0];
        })

      yield dbMethod.removeUser(user)

      yield dbMethod.userExists(user)
        .then(function(bool) {
          expect(bool).to.equal(false)
        })
    })
  })


  describe("dbMethods.addItem", function() {
    it_('should add a new item to the items table', function*() {
      var user = yield dbMethod.addUser('Bananna Lumpkins', 'ILikeCheese', 'theemail@emailery.eee')
        .then(function(userID) {
          return userID[0];
        })

      var start = new Date(2016, 2, 17, 3, 00, 0); // March 17th, 2016 at 3AM
      var end = new Date(2016, 2, 17, 5, 00, 0); // March 17th, 2016 at 5AM
      var itemObj = {
        'name': 'Lawn Mower',
        'address': '123 East Murphy Lane',
        'zip': '10507',
        'category': 'Lawn and Garden',
        'price': '10',
        'photo': 'null',
        'item_owner': user,
        'date_start': start,
        'date_end': end
      }

      // yield dbMethod.addItem('Lawn Mower', '123 east Murphy Lane', '10507', 'Lawn and Garden', '10', 'null', user, start, end)
      yield dbMethod.addItem(itemObj)
        .then(function(itemID) {
          expect(itemID[0]).to.be.a('number'); //use itemExists instead
        })
    })

    it_('should NOT add an item if the owner is not a valid user', function*() {

      var start = new Date(2016, 2, 17, 3, 00, 0); // March 17th, 2016 at 3AM
      var end = new Date(2016, 2, 17, 5, 00, 0); // March 17th, 2016 at 5AM
      var itemObj = {
        'name': 'Lawn Mower',
        'address': '123 East Murphy Lane',
        'zip': '10507',
        'category': 'Lawn and Garden',
        'price': '10',
        'photo': 'null',
        'item_owner': 12345,
        'date_start': start,
        'date_end': end
      }

      yield dbMethod.addItem(itemObj)
        .then(function(resp) {
          expect(resp).to.equal('We do not have a record of that items owner.')
        })
    })
  })

  describe("dbMethods.itemExists", function() {
    it_('should return true if an item exists', function*() {

      var user = yield dbMethod.addUser('UserMang', 'ILikeCheese', 'theemail@emailery.eee')
        .then(function(userID) {
          return userID[0];
        })

      var start = new Date(2016, 2, 17, 3, 00, 0); // March 17th, 2016 at 3AM
      var end = new Date(2016, 2, 17, 5, 00, 0); // March 17th, 2016 at 5AM
      var itemObj = {
        'name': 'Lawn Mower',
        'address': '123 East Murphy Lane',
        'zip': '10507',
        'category': 'Lawn and Garden',
        'price': '10',
        'photo': 'null',
        'item_owner': user,
        'date_start': start,
        'date_end': end
      }

      var item = yield dbMethod.addItem(itemObj)
        .then(function(itemID) {
          return itemID[0];
        })

      yield dbMethod.itemExists(item)
        .then(function(bool) {
          expect(bool).to.equal(true);
        })
    })

    it_('should return false for nonexistent items', function*() {
      yield dbMethod.itemExists(1234567)
        .then(function(bool) {
          expect(bool).to.equal(false);
        })
    })
  })

  describe("dbMethods.removeItem", function() {
    it_('should delete an item from the items table', function*() {

      var user = yield dbMethod.addUser('UserMon', 'pass', 'theemail@emailery.eee')
        .then(function(userID) {
          return userID[0];
        })

      var start = new Date(2016, 2, 17, 3, 00, 0); // March 17th, 2016 at 3AM
      var end = new Date(2016, 2, 17, 5, 00, 0); // March 17th, 2016 at 5AM
      var itemObj = {
        'name': 'Lawn Mower',
        'address': '123 East Murphy Lane',
        'zip': '10507',
        'category': 'Lawn and Garden',
        'price': '10',
        'photo': 'null',
        'item_owner': user,
        'date_start': start,
        'date_end': end
      }

      var item = yield dbMethod.addItem(itemObj)
        .then(function(itemID) {
          return itemID[0];
        })

      yield dbMethod.removeItem(item)

      yield dbMethod.itemExists(item)
        .then(function(bool) {
          expect(bool).to.equal(false);
        })
    })
  })

  describe("dbMethods.getItemsByZip", function() {
    it_('should return all items in a certain ZIP code', function*() {


      var user = yield dbMethod.addUser('Hallilucious t. Abercrombe, Jr., Esquire', 'BUCKETSAUCE', 'test@test.com')
        .then(function(userID) {
          return userID[0];
        })

      var start = new Date(2016, 2, 17, 3, 00, 0); // March 17th, 2016 at 3AM
      var end = new Date(2016, 2, 17, 5, 00, 0); // March 17th, 2016 at 5AM

      var itemOne = {
        'name': 'Lawn Mower',
        'address': '123 East Murphy Lane',
        'zip': '10507',
        'category': 'Lawn and Garden',
        'price': '10',
        'photo': 'null',
        'item_owner': user,
        'date_start': start,
        'date_end': end
      }

      var itemTwo = {
        'name': 'Backoe',
        'address': '123 East Murphy Lane',
        'zip': '10507',
        'category': 'Lawn and Garden',
        'price': '10',
        'photo': 'null',
        'item_owner': user,
        'date_start': start,
        'date_end': end
      }

      var itemThree = {
        'name': 'Bee costume',
        'address': '123 East Murphy Lane',
        'zip': '10507',
        'category': 'Lawn and Garden',
        'price': '10',
        'photo': 'null',
        'item_owner': user,
        'date_start': start,
        'date_end': end
      }

      yield dbMethod.addItem(itemOne);
      yield dbMethod.addItem(itemTwo);
      yield dbMethod.addItem(itemThree);

      yield dbMethod.getItemsByZip(10507)
        .then(function(resp) {
          var names = [];
          resp.forEach(function(x) {
            names.push(x.name)
          })

          expect(names).to.contain('Lawn Mower');
          expect(names).to.contain('Backoe');
          expect(names).to.contain('Bee costume');
        })
    })
  })

  describe("dbMethods.getItemsByName", function() {
    it_('should return all items with a certain name', function*() {
      //is there a 'like' sql parameter to get close matches?

      var user = yield dbMethod.addUser('Hallilucious t. Abercrombe, Jr., Esquire', 'BUCKETSAUCE', 'test@test.com')
        .then(function(userID) {
          return userID[0];
        })

      var start = new Date(2016, 2, 17, 3, 00, 0); // March 17th, 2016 at 3AM
      var end = new Date(2016, 2, 17, 5, 00, 0); // March 17th, 2016 at 5AM

      var itemOne = {
        'name': 'Lawn Mower',
        'address': '123 East Murphy Lane',
        'zip': '10507',
        'category': 'Lawn and Garden',
        'price': '10',
        'photo': 'null',
        'item_owner': user,
        'date_start': start,
        'date_end': end
      }

      var itemTwo = {
        'name': 'Lawn Mower',
        'address': '123 East Murphy Lane',
        'zip': '78704',
        'category': 'Lawn and Garden',
        'price': '10',
        'photo': 'null',
        'item_owner': user,
        'date_start': start,
        'date_end': end
      }

      var itemThree = {
        'name': 'Bee costume',
        'address': '123 East Murphy Lane',
        'zip': '12345',
        'category': 'Holiday',
        'price': '10',
        'photo': 'null',
        'item_owner': user,
        'date_start': start,
        'date_end': end
      }

      yield dbMethod.addItem(itemOne);
      yield dbMethod.addItem(itemTwo);
      yield dbMethod.addItem(itemThree);

      yield dbMethod.getItemsByName('Lawn Mower')
        .then(function(resp) {
          var zips = [];
          resp.forEach(function(x) {
            zips.push(x.zip)
          })

          expect(zips).to.contain(10507);
          expect(zips).to.contain(78704);
        })
    })
  })


  describe("dbMethods.getItemByID", function() {
    it_("should return a single item's information", function*() {

      var user = yield dbMethod.addUser('Hallilucious t. Abercrombe, Jr., Esquire', 'BUCKETSAUCE', 'test@test.com')
        .then(function(userID) {
          return userID[0];
        })

      var start = new Date(2016, 2, 17, 3, 00, 0); // March 17th, 2016 at 3AM
      var end = new Date(2016, 2, 17, 5, 00, 0); // March 17th, 2016 at 5AM

      var itemObj = {
        'name': 'Lawn Mower',
        'address': '123 East Murphy Lane',
        'zip': '10507',
        'category': 'Lawn and Garden',
        'price': '10',
        'photo': 'null',
        'item_owner': user,
        'date_start': start,
        'date_end': end
      }

      var itemID = yield dbMethod.addItem(itemObj)
        .then(function(ID) {
          return ID[0];
        })

      yield dbMethod.getItemByID(itemID)
        .then(function(item) {
          expect(item[0].name).to.equal('Lawn Mower')
        })
    })

    it_("should return false if an unassigned ID is queried", function*() {

      var user = yield dbMethod.addUser('Hallilucious t. Abercrombe, Jr., Esquire', 'BUCKETSAUCE', 'test@test.com')
        .then(function(userID) {
          return userID[0];
        })

      var start = new Date(2016, 2, 17, 3, 00, 0); // March 17th, 2016 at 3AM
      var end = new Date(2016, 2, 17, 5, 00, 0); // March 17th, 2016 at 5AM

      var itemObj = {
        'name': 'Lawn Mower',
        'address': '123 East Murphy Lane',
        'zip': '10507',
        'category': 'Lawn and Garden',
        'price': '10',
        'photo': 'null',
        'item_owner': user,
        'date_start': start,
        'date_end': end
      }

      var itemID = yield dbMethod.addItem(itemObj)
        .then(function(ID) {
          return ID[0];
        })

      yield dbMethod.getItemByID(12345)
        .then(function(bool) {
          expect(bool).to.equal(false)
        })
    })
  })


  describe("dbMethods.dateHasBookConflicts", function() {
    it_('should return true if there is a booking conflict for the date range', function*() {

      var owner = yield dbMethod.addUser('Owner', 'pass', 'test@test.com')
        .then(function(userID) {
          return userID[0];
        })

      var renter = yield dbMethod.addUser('Renter', 'pass', 'test@test.com')
        .then(function(userID) {
          return userID[0];
        })

      var itemStart = new Date(2016, 2, 17, 0, 00, 0); // March 17th, 2016 at 12AM
      var itemEnd = new Date(2016, 5, 1, 0, 00, 0); // June 1st, 2016 at 12AM
      var rentalStart = new Date(2016, 2, 21, 0, 00, 0); //March 21st, 2016 at 12AM
      var rentalEnd = new Date(2016, 4, 1, 0, 00, 0); //May 1st, 2016 at 12AM

      var itemObj = {
        'name': 'Lawn Mower',
        'address': '123 East Murphy Lane',
        'zip': '10507',
        'category': 'Lawn and Garden',
        'price': '10',
        'photo': 'null',
        'item_owner': owner,
        'date_start': itemStart,
        'date_end': itemEnd
      }

      var item = yield dbMethod.addItem(itemObj)
        .then(function(itemID) {
          return itemID[0];
        })

      var rental = {
        'user_id': renter,
        'item_id': item,
        'date_start': rentalStart,
        'date_end': rentalEnd,
        'is_confirmed': 'true'
      }

      // manually insert a booking:
      var db = require('knex')(config[env]);
      // db created here so that connection can be destroyed
      // without disrupting var 'knex' defined above

      yield db.insert(rental).into('rentals')
        .then(function(resp) {
          db.destroy();
        })

      var newRentStart = new Date(2016, 2, 19, 0, 00, 0);
      var newRentEnd = new Date(2016, 2, 23, 0, 00, 0);

      yield dbMethod.dateHasBookConflicts(item, newRentStart, newRentEnd)
        .then(function(bool) {
          expect(bool).to.equal(true);
        })

    })

    it_('should return false if date range has no booking conflicts', function*() {
      var owner = yield dbMethod.addUser('Owner', 'pass', 'test@test.com')
        .then(function(userID) {
          return userID[0];
        })

      var renter = yield dbMethod.addUser('Renter', 'pass', 'test@test.com')
        .then(function(userID) {
          return userID[0];
        })

      var itemStart = new Date(2016, 2, 17, 0, 00, 0); // March 17th, 2016 at 12AM
      var itemEnd = new Date(2016, 5, 1, 0, 00, 0); // June 1st, 2016 at 12AM
      var rentalStart = new Date(2016, 2, 21, 0, 00, 0); //March 21st, 2016 at 12AM
      var rentalEnd = new Date(2016, 4, 1, 0, 00, 0); //May 1st, 2016 at 12AM

      var itemObj = {
        'name': 'Lawn Mower',
        'address': '123 East Murphy Lane',
        'zip': '10507',
        'category': 'Lawn and Garden',
        'price': '10',
        'photo': 'null',
        'item_owner': owner,
        'date_start': itemStart,
        'date_end': itemEnd
      }

      var item = yield dbMethod.addItem(itemObj)
        .then(function(itemID) {
          return itemID[0];
        })

      var rental = {
        'user_id': renter,
        'item_id': item,
        'date_start': rentalStart,
        'date_end': rentalEnd,
        'is_confirmed': 'true'
      }

      // manually insert a booking:
      var db = require('knex')(config[env]);
      // db created here so that connection can be destroyed
      // without disrupting var 'knex' defined above

      yield db.insert(rental).into('rentals')
        .then(function(resp) {
          db.destroy();
        })

      var newRentStart = new Date(2016, 2, 19, 0, 00, 0);
      var newRentEnd = new Date(2016, 2, 20, 0, 00, 0);

      yield dbMethod.dateHasBookConflicts(item, newRentStart, newRentEnd)
        .then(function(bool) {
          expect(bool).to.equal(false);
        })
    })

    it_('should NOT detect booking conflicts for other objects', function*() {

      var owner = yield dbMethod.addUser('Owner', 'pass', 'test@test.com')
        .then(function(userID) {
          return userID[0];
        })

      var renter = yield dbMethod.addUser('Renter', 'pass', 'test@test.com')
        .then(function(userID) {
          return userID[0];
        })

      var itemStart = new Date(2016, 2, 17, 0, 00, 0); // March 18th, 2016 at 12AM
      var itemEnd = new Date(2016, 5, 1, 0, 00, 0); // June 2nd, 2016 at 12AM
      var rentalStart = new Date(2016, 2, 21, 0, 00, 0); // March 22nd, 2016 at 12AM
      var rentalEnd = new Date(2016, 4, 1, 0, 00, 0); // May 2nd, 2016 at 12AM
      var diffRentStart = new Date(2016, 2, 19, 0, 00, 0); // March 20th, 2016 at 12AM
      var diffRentEnd = new Date(2016, 4, 21, 0, 00, 0); // May 22, 2016 at 12AM

      var itemObj = {
        'name': 'Lawn Mower',
        'address': '123 East Murphy Lane',
        'zip': '10507',
        'category': 'Lawn and Garden',
        'price': '10',
        'photo': 'null',
        'item_owner': owner,
        'date_start': itemStart,
        'date_end': itemEnd
      }

      var differentItemObj = {
        'name': 'Cotton Candy Machine',
        'address': '123 East Murphy Lane',
        'zip': '10507',
        'category': 'Lawn and Garden',
        'price': '10',
        'photo': 'null',
        'item_owner': owner,
        'date_start': itemStart,
        'date_end': itemEnd
      }

      var item = yield dbMethod.addItem(itemObj)
        .then(function(itemID) {
          return itemID[0];
        })

      var differentItem = yield dbMethod.addItem(differentItemObj)
        .then(function(itemID) {
          return itemID[0];
        })

      var rental = {
        'user_id': renter,
        'item_id': item,
        'date_start': rentalStart,
        'date_end': rentalEnd,
        'is_confirmed': 'true'
      }

      var differentRental = {
        'user_id': renter,
        'item_id': differentItem,
        'date_start': diffRentStart,
        'date_end': diffRentEnd,
        'is_confirmed': 'true'
      }

      // manually insert a booking:
      var db = require('knex')(config[env]);
      // db created here so that connection can be destroyed
      // without disrupting var 'knex' defined above

      yield db.insert(rental).into('rentals')
        .then(function(resp) {
          db.destroy();
        })

      var newRentStart = new Date(2016, 2, 19, 0, 00, 0);
      var newRentEnd = new Date(2016, 2, 20, 0, 00, 0);

      yield dbMethod.dateHasBookConflicts(item, newRentStart, newRentEnd)
        .then(function(bool) {
          expect(bool).to.equal(false);
        })
    })

  })


  describe("dbMethods.dateIsInRange", function() {
    it_("should return true if dates are within the item's date range", function*() {

      var owner = yield dbMethod.addUser('Owner', 'pass', 'test@test.com')
        .then(function(userID) {
          return userID[0];
        })

      var renter = yield dbMethod.addUser('Renter', 'pass', 'test@test.com')
        .then(function(userID) {
          return userID[0];
        })

      var itemStart = new Date(2016, 2, 17, 0, 00, 0); // March 17th, 2016 at 12AM
      var itemEnd = new Date(2016, 5, 1, 0, 00, 0); // June 1st, 2016 at 12AM
      var rentalStart = new Date(2016, 2, 21, 0, 00, 0); //March 21st, 2016 at 12AM
      var rentalEnd = new Date(2016, 4, 1, 0, 00, 0); //May 1st, 2016 at 12AM

      var itemObj = {
        'name': 'Lawn Mower',
        'address': '123 East Murphy Lane',
        'zip': '10507',
        'category': 'Lawn and Garden',
        'price': '10',
        'photo': 'null',
        'item_owner': owner,
        'date_start': itemStart,
        'date_end': itemEnd
      }

      var item = yield dbMethod.addItem(itemObj)
        .then(function(itemID) {
          return itemID[0];
        })

      var rental = {
        'user_id': renter,
        'item_id': item,
        'date_start': rentalStart,
        'date_end': rentalEnd,
        'is_confirmed': 'true'
      }

      // manually insert a booking:
      var db = require('knex')(config[env]);
      // db created here so that connection can be destroyed
      // without disrupting var 'knex' defined above

      yield db.insert(rental).into('rentals')
        .then(function(resp) {
          db.destroy();
        })

      var newRentStart = new Date(2016, 2, 19, 0, 00, 0);
      var newRentEnd = new Date(2016, 2, 20, 0, 00, 0);

      yield dbMethod.dateIsInRange(item, newRentStart, newRentEnd)
        .then(function(bool) {
          expect(bool).to.equal(true);
        })
    })

    it_("should return false if dates violate the item's date range", function*() {
      var owner = yield dbMethod.addUser('Owner', 'pass', 'test@test.com')
        .then(function(userID) {
          return userID[0];
        })

      var renter = yield dbMethod.addUser('Renter', 'pass', 'test@test.com')
        .then(function(userID) {
          return userID[0];
        })

      var itemStart = new Date(2016, 2, 17, 0, 00, 0); // March 17th, 2016 at 12AM
      var itemEnd = new Date(2016, 5, 1, 0, 00, 0); // June 1st, 2016 at 12AM
      var rentalStart = new Date(2016, 2, 21, 0, 00, 0); //March 21st, 2016 at 12AM
      var rentalEnd = new Date(2016, 4, 1, 0, 00, 0); //May 1st, 2016 at 12AM

      var itemObj = {
        'name': 'Lawn Mower',
        'address': '123 East Murphy Lane',
        'zip': '10507',
        'category': 'Lawn and Garden',
        'price': '10',
        'photo': 'null',
        'item_owner': owner,
        'date_start': itemStart,
        'date_end': itemEnd
      }

      var item = yield dbMethod.addItem(itemObj)
        .then(function(itemID) {
          return itemID[0];
        })

      var rental = {
        'user_id': renter,
        'item_id': item,
        'date_start': rentalStart,
        'date_end': rentalEnd,
        'is_confirmed': 'true'
      }

      // manually insert a booking:
      var db = require('knex')(config[env]);
      // db created here so that connection can be destroyed
      // without disrupting var 'knex' defined above

      yield db.insert(rental).into('rentals')
        .then(function(resp) {
          db.destroy();
        })

      var newRentStart = new Date(2016, 1, 19, 0, 00, 0);
      var newRentEnd = new Date(2016, 2, 20, 0, 00, 0);

      yield dbMethod.dateIsInRange(item, newRentStart, newRentEnd)
        .then(function(bool) {
          expect(bool).to.equal(false);
        })
    })
  })


  describe("dbMethods.getRentalsByRenterID", function() {
    it_('should return an array of rentals', function*() {

      var owner = yield dbMethod.addUser('Owner', 'pass', 'test@test.com')
        .then(function(userID) {
          return userID[0];
        })

      var renter = yield dbMethod.addUser('Renter', 'pass', 'test@test.com')
        .then(function(userID) {
          return userID[0];
        })

      var itemStart = new Date(2016, 2, 17, 0, 00, 0); // March 18th, 2016 at 12AM
      var itemEnd = new Date(2016, 5, 1, 0, 00, 0); // June 2nd, 2016 at 12AM
      var rentalStart = new Date(2016, 2, 21, 0, 00, 0); // March 22nd, 2016 at 12AM
      var rentalEnd = new Date(2016, 4, 1, 0, 00, 0); // May 2nd, 2016 at 12AM
      var diffRentStart = new Date(2016, 2, 19, 0, 00, 0); // March 20th, 2016 at 12AM
      var diffRentEnd = new Date(2016, 4, 21, 0, 00, 0); // May 22, 2016 at 12AM

      var itemObj = {
        'name': 'Lawn Mower',
        'address': '123 East Murphy Lane',
        'zip': '10507',
        'category': 'Lawn and Garden',
        'price': '10',
        'photo': 'null',
        'item_owner': owner,
        'date_start': itemStart,
        'date_end': itemEnd
      }

      var differentItemObj = {
        'name': 'Cotton Candy Machine',
        'address': '123 East Murphy Lane',
        'zip': '10507',
        'category': 'Lawn and Garden',
        'price': '10',
        'photo': 'null',
        'item_owner': owner,
        'date_start': itemStart,
        'date_end': itemEnd
      }

      var item = yield dbMethod.addItem(itemObj)
        .then(function(itemID) {
          return itemID[0];
        })

      var differentItem = yield dbMethod.addItem(differentItemObj)
        .then(function(itemID) {
          return itemID[0];
        })

      var rental = {
        'user_id': renter,
        'item_id': item,
        'date_start': rentalStart,
        'date_end': rentalEnd,
        'is_confirmed': 'true'
      }

      var differentRental = {
        'user_id': renter,
        'item_id': differentItem,
        'date_start': diffRentStart,
        'date_end': diffRentEnd,
        'is_confirmed': 'true'
      }

      // manually insert a booking:
      var db = require('knex')(config[env]);
      // db created here so that connection can be destroyed
      // without disrupting var 'knex' defined above

      yield db.insert(rental).into('rentals')
        .then(function(resp) {
          db.destroy();
        })

      var dbTwo = require('knex')(config[env]);
      // dbTwo created here so that connection can be destroyed
      // without disrupting var 'knex' defined above

      yield dbTwo.insert(differentRental).into('rentals')
        .then(function(resp) {
          dbTwo.destroy();
        })

      yield dbMethod.getRentalsByRenterID(renter)
        .then(function(rentals) {
          expect(rentals).to.be.a('array');
          expect(rentals.length).to.equal(2);

          var itemIDs = [];
          rentals.forEach(function(x) {
            itemIDs.push(x.item_id)
          })

          expect(itemIDs).to.contain(item);
          expect(itemIDs).to.contain(differentItem);
        })
    })

    it_('should return false if an unassigned renterID is queried', function*() {

      yield dbMethod.getRentalsByRenterID(9999999)
        .then(function(bool) {
          expect(bool).to.equal(false);
        })
    })
  })


  describe("dbMethods.getRentalsByItemID", function() {
    it_('should return an array of rentals containing only the correct item ID', function*() {

      var owner = yield dbMethod.addUser('Owner', 'pass', 'test@test.com')
        .then(function(userID) {
          return userID[0];
        })

      var renter = yield dbMethod.addUser('Renter', 'pass', 'test@test.com')
        .then(function(userID) {
          return userID[0];
        })

      var itemStart = new Date(2016, 2, 17, 0, 00, 0); // March 18th, 2016 at 12AM
      var itemEnd = new Date(2016, 5, 1, 0, 00, 0); // June 2nd, 2016 at 12AM
      var rentalStart = new Date(2016, 2, 21, 0, 00, 0); // March 22nd, 2016 at 12AM
      var rentalEnd = new Date(2016, 4, 1, 0, 00, 0); // May 2nd, 2016 at 12AM
      var diffRentStart = new Date(2016, 2, 19, 0, 00, 0); // March 20th, 2016 at 12AM
      var diffRentEnd = new Date(2016, 4, 21, 0, 00, 0); // May 22, 2016 at 12AM

      var itemObj = {
        'name': 'Lawn Mower',
        'address': '123 East Murphy Lane',
        'zip': '10507',
        'category': 'Lawn and Garden',
        'price': '10',
        'photo': 'null',
        'item_owner': owner,
        'date_start': itemStart,
        'date_end': itemEnd
      }

      var differentItemObj = {
        'name': 'Cotton Candy Machine',
        'address': '123 East Murphy Lane',
        'zip': '10507',
        'category': 'Lawn and Garden',
        'price': '10',
        'photo': 'null',
        'item_owner': owner,
        'date_start': itemStart,
        'date_end': itemEnd
      }

      var item = yield dbMethod.addItem(itemObj)
        .then(function(itemID) {
          return itemID[0];
        })

      var differentItem = yield dbMethod.addItem(differentItemObj)
        .then(function(itemID) {
          return itemID[0];
        })

      var rental = {
        'user_id': renter,
        'item_id': item,
        'date_start': rentalStart,
        'date_end': rentalEnd,
        'is_confirmed': 'true'
      }

      var differentRental = {
        'user_id': renter,
        'item_id': differentItem,
        'date_start': diffRentStart,
        'date_end': diffRentEnd,
        'is_confirmed': 'true'
      }

      var thirdRental = {
        'user_id': renter,
        'item_id': item,
        'date_start': diffRentStart,
        'date_end': diffRentEnd,
        'is_confirmed': 'true'
      }

      // manually insert bookings:
      var db = require('knex')(config[env]);
      // db, dbTwo, and dbThree created here so that connection can be destroyed
      // without disrupting var 'knex' defined above

      yield db.insert(rental).into('rentals')
        .then(function(resp) {
          db.destroy();
        })

      var dbTwo = require('knex')(config[env]);
      yield dbTwo.insert(differentRental).into('rentals')
        .then(function(resp) {
          dbTwo.destroy();
        })

      var dbThree = require('knex')(config[env]);
      yield dbThree.insert(thirdRental).into('rentals')
        .then(function(resp) {
          dbThree.destroy();
        })

      yield dbMethod.getRentalsByItemID(item)
        .then(function(rentals) {
          expect(rentals).to.be.a('array');
          expect(rentals.length).to.equal(2);

          var itemIDs = [];
          var correctItemCount = 0;
          rentals.forEach(function(x) {
            itemIDs.push(x.item_id)
            if (x.item_id === item) {
              correctItemCount++;
            }
          })

          expect(itemIDs).to.contain(item);
          expect(itemIDs).not.to.contain(differentItem);
          expect(correctItemCount).to.equal(2);
        })
    })

    it_('should return false if an unassigned item ID is queried', function*() {

      yield dbMethod.getRentalsByRenterID(9999999)
        .then(function(bool) {
          expect(bool).to.equal(false);
        })
    })
  })


  describe("dbMethods.getRentalByRentalID", function() {
    it_('should return a single matching rental', function*() {

      var owner = yield dbMethod.addUser('Owner', 'pass', 'test@test.com')
        .then(function(userID) {
          return userID[0];
        })

      var renter = yield dbMethod.addUser('Renter', 'pass', 'test@test.com')
        .then(function(userID) {
          return userID[0];
        })

      var itemStart = new Date(2016, 2, 17, 0, 00, 0); // March 17th, 2016 at 12AM
      var itemEnd = new Date(2016, 5, 1, 0, 00, 0); // June 1st, 2016 at 12AM
      var rentalStart = new Date(2016, 2, 21, 0, 00, 0); //March 21st, 2016 at 12AM
      var rentalEnd = new Date(2016, 4, 1, 0, 00, 0); //May 1st, 2016 at 12AM

      var itemObj = {
        'name': 'Lawn Mower',
        'address': '123 East Murphy Lane',
        'zip': '10507',
        'category': 'Lawn and Garden',
        'price': '10',
        'photo': 'null',
        'item_owner': owner,
        'date_start': itemStart,
        'date_end': itemEnd
      }

      var item = yield dbMethod.addItem(itemObj)
        .then(function(itemID) {
          return itemID[0];
        })

      var rental = {
        'user_id': renter,
        'item_id': item,
        'date_start': rentalStart,
        'date_end': rentalEnd,
        'is_confirmed': 'true'
      }

      // manually insert a booking:
      var db = require('knex')(config[env]);
      // db created here so that connection can be destroyed
      // without disrupting var 'knex' defined above

      var rentalID = yield db.insert(rental).into('rentals').returning('id')
        .then(function(rentalID) {
          db.destroy();
          return rentalID[0];
        })

      yield dbMethod.getRentalByRentalID(rentalID)
        .then(function(rental) {
          expect(rental[0].user_id).to.equal(renter);
        })
    })

    it_('should return false if an unassigned rentalID is queried', function*() {

      yield dbMethod.getRentalByRentalID(9999999)
        .then(function(bool) {
          expect(bool).to.equal(false);
        })
    })
  })


  describe("dbMethods.addRental", function() {
    it_('should add a rental to the rentals table', function*() {

      var owner = yield dbMethod.addUser('Owner', 'pass', 'test@test.com')
        .then(function(userID) {
          return userID[0];
        })

      var renter = yield dbMethod.addUser('Renter', 'pass', 'test@test.com')
        .then(function(userID) {
          return userID[0];
        })

      var itemStart = new Date(2016, 2, 17, 0, 00, 0); // March 17th, 2016 at 12AM
      var itemEnd = new Date(2016, 5, 1, 0, 00, 0); // June 1st, 2016 at 12AM
      var rentalStart = new Date(2016, 2, 21, 0, 00, 0); //March 21st, 2016 at 12AM
      var rentalEnd = new Date(2016, 4, 1, 0, 00, 0); //May 1st, 2016 at 12AM

      var itemObj = {
        'name': 'Lawn Mower',
        'address': '123 East Murphy Lane',
        'zip': '10507',
        'category': 'Lawn and Garden',
        'price': '10',
        'photo': 'null',
        'item_owner': owner,
        'date_start': itemStart,
        'date_end': itemEnd
      }

      var item = yield dbMethod.addItem(itemObj)
        .then(function(itemID) {
          return itemID[0];
        })

      var rental = {
        'user_id': renter,
        'item_id': item,
        'date_start': rentalStart,
        'date_end': rentalEnd,
        'is_confirmed': 'true'
      }

      var rentalID = yield dbMethod.addRental(rental)
        .then(function(rentalID) {
          return rentalID[0];
        })

      yield dbMethod.getRentalByRentalID(rentalID)
        .then(function(rentals) {
          expect(rentals[0].id).to.equal(rentalID)
        })
    })
  })


  describe("dbMethods.removeRental", function() {
    it_('should delete a rental from the rentals table', function*() {

      var owner = yield dbMethod.addUser('Owner', 'pass', 'test@test.com')
        .then(function(userID) {
          return userID[0];
        })

      var renter = yield dbMethod.addUser('Renter', 'pass', 'test@test.com')
        .then(function(userID) {
          return userID[0];
        })

      var itemStart = new Date(2016, 2, 17, 0, 00, 0); // March 17th, 2016 at 12AM
      var itemEnd = new Date(2016, 5, 1, 0, 00, 0); // June 1st, 2016 at 12AM
      var rentalStart = new Date(2016, 2, 21, 0, 00, 0); //March 21st, 2016 at 12AM
      var rentalEnd = new Date(2016, 4, 1, 0, 00, 0); //May 1st, 2016 at 12AM

      var itemObj = {
        'name': 'Lawn Mower',
        'address': '123 East Murphy Lane',
        'zip': '10507',
        'category': 'Lawn and Garden',
        'price': '10',
        'photo': 'null',
        'item_owner': owner,
        'date_start': itemStart,
        'date_end': itemEnd
      }

      var item = yield dbMethod.addItem(itemObj)
        .then(function(itemID) {
          return itemID[0];
        })

      var rental = {
        'user_id': renter,
        'item_id': item,
        'date_start': rentalStart,
        'date_end': rentalEnd,
        'is_confirmed': 'true'
      }

      var rentalID = yield dbMethod.addRental(rental)
        .then(function(rentalID) {
          return rentalID[0];
        })

      yield dbMethod.removeRental(rentalID);

      yield dbMethod.getRentalByRentalID(rentalID)
        .then(function(bool) {
          expect(bool).to.equal(false)
        })
    })
  })


  describe("dbMethods.addSession", function() {
    it_("should add a session to the 'sessions' table", function*() {
      var userID = yield dbMethod.addUser('Justin', 'pass', 'testEmail@testEmail.com')
        .then(function(resp) {
          return resp[0];
        })
      var sessionID = yield dbMethod.addSession(userID)
        .then(function(resp) {
          expect(resp[0]).to.be.a('string');
          return resp[0];
        })
      var db = require('knex')(config[env]);
      // db created here so that connection can be destroyed
      // without disrupting var 'knex' defined above
      yield db.select('*').from('sessions').where('session_id', sessionID)
        .then(function(resp) {
          db.destroy();
          expect(resp.length).to.equal(1);
          expect(resp[0].session_id).to.exist;
          expect(resp[0].user_id).to.exist;
          expect(resp[0].session_id).to.equal(sessionID);
          expect(resp[0].user_id).to.equal(userID);
        })
    })
  })


  describe("dbMethods.getSessionBySessionID", function() {
    it_("should return a session matching a given session id", function*() {

      var userID = yield dbMethod.addUser('Justin', 'pass', 'testEmail@testEmail.com')
        .then(function(resp) {
          return resp[0]
        })

      var sessionID = yield dbMethod.addSession(userID)
        .then(function(resp) {
          return resp[0]
        })

      yield dbMethod.getSessionBySessionID(sessionID)
        .then(function(resp) {
          expect(resp[0].user_id).to.equal(userID);
          expect(resp[0].session_id).to.equal(sessionID);
        })
    })

    it_("should return false if no matching session is found", function*() {
      var userID = yield dbMethod.addUser('Justin', 'pass', 'testEmail@testEmail.com')
        .then(function(resp) {
          return resp[0];
        })
      var sessionID = yield dbMethod.addSession(userID)
        .then(function(resp) {
          return resp[0]
        })
      yield dbMethod.getSessionBySessionID(sessionID)
        .then(function(resp) {
          expect(resp[0].user_id).to.equal(userID);
          expect(resp[0].session_id).to.equal(sessionID);
        })
      yield dbMethod.getSessionBySessionID('random, not real sessionID')
        .then(function(resp) {
          expect(resp).to.equal(false);
        })
    })
  })


  describe("dbMethods.getSessionByUserID", function() {
    it_("should return a session matching a given user id", function*() {
      var userID = yield dbMethod.addUser('Justin', 'pass', 'testEmail@testEmail.com')
        .then(function(resp) {
          return resp[0]
        })
      var sessionID = yield dbMethod.addSession(userID)
        .then(function(resp) {
          return resp[0]
        })
      yield dbMethod.getSessionByUserID(userID)
        .then(function(resp) {
          expect(resp[0].user_id).to.equal(userID);
          expect(resp[0].session_id).to.equal(sessionID);
        })
    })

    it_("should return false if no matching session is found", function*() {
      var userID = yield dbMethod.addUser('Justin', 'pass', 'testEmail@testEmail.com')
        .then(function(resp) {
          return resp[0];
        })
      var fakeUserID = 90000000;
      var sessionID = yield dbMethod.addSession(userID)
        .then(function(resp) {
          return (resp[0]);
        })
      yield dbMethod.getSessionByUserID(userID)
        .then(function(resp) {
          expect(resp[0].user_id).to.equal(userID);
          expect(resp[0].session_id).to.equal(sessionID);
        })
      yield dbMethod.getSessionByUserID(fakeUserID)
        .then(function(resp) {
          expect(resp).to.equal(false);
        })
    })
  })


  describe("dbMethods.removeSession", function() {
    it_("should delete a session from the 'sessions' table", function*() {
      var userID = yield dbMethod.addUser('Justin', 'pass', 'testEmail@testEmail.com')
        .then(function(resp) {
          return resp[0];
        })
      var sessionID = yield dbMethod.addSession(userID)
        .then(function(resp) {
          expect(resp[0]).to.be.a('string');
          return resp[0];
        })
      yield dbMethod.removeSession(userID)
        .then(function(resp) {
          expect(resp[0].user_id).to.equal(userID);
        })
      yield dbMethod.getSessionByUserID(userID)
        .then(function(resp) {
          expect(resp).to.equal(false);
        })
    })
  })



  // //POST MVP:
  // describe("POST-MVP: dbMethods.confirmRental", function() {
  //   xit_ ("should set a rental's isConfirmed status to 'true'", function * (){

  //   })
  // })

  // //POST MVP:
  // describe("POST-MVP: dbMethods.deConfirmRental", function() {
  //   xit_ ("should set a rental's isConfirmed status to 'false'", function * (){

  //   })
  // })
})

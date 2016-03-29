require('../test-helper.js');

var chai = require('chai');
var expect = require('chai').expect;
var request = require('supertest');
var routes = require('../../server.js');
var env = process.env.NODE_ENV;
var config = require('../../knexfile.js');
var knex = require('knex')(config[env]);
var Promise = require('bluebird');
var dbMethod = require('../../db/dbMethods.js');


//Truncate empties the database tables. It is called once before each test and again after all have run.
function truncate() {
  var tables = ['users', 'items', 'rentals', 'sessions'];
  return Promise.each(tables, function(table) {
    return knex.raw('truncate table ' + table + ' cascade');
  });
};

describe("Server-Side Routing:", function() {
  var app = TestHelper.createApp() //TestHelper is a global object declared in test-helper.js
  app.use('/', routes)
  app.testReady()

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
  })

  describe("General", function() {
    it_("should serve an example endpoint", function*() {
      yield request(app)
        .get('/test/example_endpoint')
        .expect(200)
        .expect(function(response) {
          expect(response.body).to.include('Hi there, your GET request has fulfilled!');
        })
    })

    it_("should serve an html page on '/'", function*() {
      yield request(app)
        .get('/')
        .expect(200)
        .expect(function(response) {
          expect(response.type).to.equal('text/html');
          expect(response.text).to.include('!DOCTYPE html>' || '!DOCTYPE html>\n'); //this may need to be deactivated... iffy test condition.
        })
    })
  })

  describe("Users", function() {
    it_("(POST, /signup) : should sign up new users", function*() {
      var body = {
        username: 'MustardForBreakfast',
        password: 'password',
        email: 'test@test.com'
      }

      yield request(app)
        .post('/signup')
        .send(body)
        .expect(201)
        .expect(function(response) {
          expect(response.body.status).to.equal('completed');
          expect(response.body.user).to.exist;
          expect(response.body.sessionID).to.exist;
          expect(response.body.sessionID).to.be.a('string')
        })

      //attempt to sign up with a claimed username
      yield request(app)
        .post('/signup')
        .send(body)
        .expect(409)
        .expect(function(response) {
          expect(response.body.status).to.equal('failed');
          expect(response.body.message).to.equal('That username is taken.');
        })
    })

    it_("(POST, /login) : should sign in existing users", function*() {
      var userID = yield dbMethod.addUser('MustardForBreakfast', 'password', 'example@email.com')
        .then(function(IDArray) {
          return IDArray[0];
        })

      var username = 'MustardForBreakfast';
      var password = 'password';

      var body = {
        'username': username,
        'password': password
      }

      yield request(app)
        .post('/login')
        .send(body)
        .expect(200)
        .expect(function(response) {
          expect(response.body.status).to.equal('completed');
          expect(response.body.user).to.exist;
          expect(response.body.user.username).to.equal('MustardForBreakfast');
          expect(response.body.sessionID).to.exist;
          expect(response.body.sessionID).to.be.a('string');
        })

      //attempt to sign in an unregisterd user
      var otherUsername = 'Some Other Guy';
      var otherPassword = 'password';

      var unregBody = {
        'username': otherUsername,
        'password': otherPassword
      }

      yield request(app)
        .post('/login')
        .send(unregBody)
        .expect(400)
        .expect(function(response) {
          expect(response.body.status).to.equal('failed');
          expect(response.body.message).to.equal('user not found.');
        })
    })

    it_("(DELETE, /users) : should delete a user", function*() {
      var userID = yield dbMethod.addUser('MustardForBreakfast', 'password', 'example@email.com')
        .then(function(IDArray) {
          return IDArray[0];
        })

      var user = {
        username: 'MustardForBreakfast',
        'userID': userID,
        password: 'password'
      }

      var body = {
        'user': user,
        'message': 'here is a user.'
      }

      yield request(app)
        .delete('/users')
        .send(body)
        .expect(200)
        .expect(function(response) {
          expect(response.body.status).to.equal('complete');
          expect(response.body.message).to.equal('user deleted');
        })

      yield request(app)
        .delete('/users')
        .send(body)
        .expect(400)
        .expect(function(response) {
          expect(response.body.status).to.equal('failed');
          expect(response.body.message).to.equal('user was not deleted - user did not exist');
        })
    })

    it_("(POST, /users) : should retrieve information about a single user", function*() {
      //add a user
      var userID = yield dbMethod.addUser('MustardForBreakfast', 'password', 'example@email.com')
        .then(function(IDArray) {
          return IDArray[0];
        })

      var body = {
        'userID': userID,
        'message': 'here is a user.'
      }

      yield request(app)
        .post('/users')
        .send(body)
        .expect(200)
        .expect(function(response) {
          expect(response.body.status).to.equal('complete');
          expect(response.body.user).to.exist;
          expect(response.body.user.username).to.equal('MustardForBreakfast');
        })
    })

    it_("(POST, /logout) : should log a user out", function*() {
      //add a user
      var userID = yield dbMethod.addUser('MustardForBreakfast', 'password', 'example@email.com')
        .then(function(IDArray) {
          return IDArray[0];
        })

      var username = 'MustardForBreakfast';
      var password = 'password';

      var loginBody = {
        'username': username,
        'password': password
      }

      //log that user in
      var sessionID;
      yield request(app)
        .post('/login')
        .send(loginBody)
        .expect(function(resp) {
          sessionID = resp.body.sessionID;
        })

      //simulated cookie
      var body = {
        'userID': userID,
        'cookie': {
          'sessionId': sessionID
        }
      }

      yield request(app)
        .post('/logout')
        .send(body)
        .expect(200)
        .expect(function(response) {
          expect(response.body.status).to.equal('completed');
          expect(response.body.message).to.equal('logout successful.')
        })
    })
  })

  describe("Items", function() {

    it_("(POST, /items) : should create a new item", function*() {
      //add a user
      var userID = yield dbMethod.addUser('MustardForBreakfast', 'password', 'mr.email@mr.email')
        .then(function(idArray) {
          return idArray[0];
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
        'item_owner': userID,
        'date_start': start,
        'date_end': end
      }

      var body = {
        'item': itemObj,
        'message': 'here is an item.'
      }

      yield request(app)
        .post('/items')
        .send(body)
        .expect(201)
        .expect(function(response) {
          expect(response.body.item).to.exist;
          expect(response.body.status).to.equal('complete')
          expect(response.body.message).to.equal('item added.')
          expect(response.body.item.name).to.equal('Lawn Mower')
        })
    })

    it_("(POST, /items/search) : should get searched items by name and zipcode", function*() {
      var userOne = yield dbMethod.addUser('MustardForBreakfast', 'password', 'mr.email@mr.email')
        .then(function(idArray) {
          return idArray[0];
        })
      var userTwo = yield dbMethod.addUser('Duckworth', 'password', 'mr.email@mr.email')
        .then(function(idArray) {
          return idArray[0];
        })
      var userThree = yield dbMethod.addUser('Alphred', 'password', 'mr.email@mr.email')
        .then(function(idArray) {
          return idArray[0];
        })

      var start = new Date(2016, 2, 17, 3, 00, 0); // March 17th, 2016 at 3AM
      var end = new Date(2016, 2, 17, 5, 00, 0); // March 17th, 2016 at 5AM
      var itemOne = {
        'name': 'Lawn Mower',
        'address': '123 East Murphy Lane',
        'zip': 10507,
        'category': 'Lawn and Garden',
        'price': '10',
        'photo': 'null',
        'item_owner': userOne,
        'date_start': start,
        'date_end': end
      }

      var itemTwo = {
        'name': 'Lawn Mower',
        'address': 'A different address',
        'zip': 10507,
        'category': 'Lawn and Garden',
        'price': '10',
        'photo': 'null',
        'item_owner': userTwo,
        'date_start': start,
        'date_end': end
      }

      var itemThree = {
        'name': 'Lawn Mower',
        'address': 'Somewhere else',
        'zip': 10507,
        'category': 'Lawn and Garden',
        'price': '10',
        'photo': 'null',
        'item_owner': userThree,
        'date_start': start,
        'date_end': end
      }

      var itemFour = {
        'name': 'Pickup Truck',
        'address': 'Somewhere else',
        'zip': 10507,
        'category': 'Lawn and Garden',
        'price': '10',
        'photo': 'null',
        'item_owner': userThree,
        'date_start': start,
        'date_end': end
      }

      //add each item
      yield dbMethod.addItem(itemOne);
      yield dbMethod.addItem(itemTwo);
      yield dbMethod.addItem(itemThree);
      yield dbMethod.addItem(itemFour);

      var body = {
        searchTerm: 'Lawn Mower',
        zipCode: 10507
      }

      yield request(app)
        .post('/items/search')
        .send(body)
        .expect(200)
        .expect(function(response) {
          expect(response.body.items).to.be.a('array');
          expect(response.body.status).to.equal('complete');
          expect(response.body.message).to.equal('items retrieved.');
          expect(response.body.items.length).to.equal(3);

          var names = [];
          response.body.items.forEach(function(x) {
            names.push(x.name);
          })
          expect(names).to.contain('Lawn Mower');
          expect(names).not.to.contain('Pickup Truck')
        })
    })

    it_("(POST, /items/id) : should get an item by itemID", function*() {
      var user = yield dbMethod.addUser('Alphred', 'password', 'mr.email@mr.email')
        .then(function(idArray) {
          return idArray[0];
        })

      var start = new Date(2016, 2, 17, 3, 00, 0); // March 17th, 2016 at 3AM
      var end = new Date(2016, 2, 17, 5, 00, 0); // March 17th, 2016 at 5AM
      var item = {
        'name': 'Lawn Mower',
        'address': '123 East Murphy Lane',
        'zip': 10507,
        'category': 'Lawn and Garden',
        'price': 10,
        'description': 'Its good for mowing stuff.',
        'photo': 'null',
        'item_owner': user,
        'date_start': start,
        'date_end': end
      }

      var itemID = yield dbMethod.addItem(item)
        .then(function(idArray) {
          return idArray[0];
        })

      var body = {
        'itemID': itemID
      }

      yield request(app)
        .post('/items/id')
        .send(body)
        .expect(200)
        .expect(function(resp) {
          expect(resp.body.item).to.exist;
          expect(resp.body.item.name).to.equal('Lawn Mower');
        })

    })

    it_("(DELETE, /items) : should delete an item", function*() {
      var user = yield dbMethod.addUser('Alphred', 'password', 'mr.email@mr.email')
        .then(function(idArray) {
          return idArray[0];
        })

      var start = new Date(2016, 2, 17, 3, 00, 0); // March 17th, 2016 at 3AM
      var end = new Date(2016, 2, 17, 5, 00, 0); // March 17th, 2016 at 5AM
      var item = {
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

      var itemID = yield dbMethod.addItem(item)
        .then(function(idArray) {
          return idArray[0];
        })

      var body = {
        'item_id': itemID,
        'user_id': user,
        'password': 'password'
      }

      yield request(app)
        .delete('/items')
        .send(body)
        .expect(200)
        .expect(function(response) {
          expect(response.body.status).to.equal('complete')
          expect(response.body.message).to.equal('item deleted.')
          expect(response.body.itemID).to.equal(itemID)
        })
    })

    it_("(POST, /items/user) : should get items that a user owns", function*() {
      var userOne = yield dbMethod.addUser('MustardForBreakfast', 'password', 'mr.email@mr.email')
        .then(function(idArray) {
          return idArray[0];
        })
      var userTwo = yield dbMethod.addUser('Duckworth', 'password', 'mr.email@mr.email')
        .then(function(idArray) {
          return idArray[0];
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
        'item_owner': userOne,
        'date_start': start,
        'date_end': end
      }

      var itemTwo = {
        'name': 'Pickup Truck',
        'address': 'A different address',
        'zip': '10507',
        'category': 'Lawn and Garden',
        'price': '10',
        'photo': 'null',
        'item_owner': userOne,
        'date_start': start,
        'date_end': end
      }

      var itemThree = {
        'name': 'An entire army of opossums',
        'address': 'Somewhere else',
        'zip': '10507',
        'category': 'Lawn and Garden',
        'price': '10',
        'photo': 'null',
        'item_owner': userOne,
        'date_start': start,
        'date_end': end
      }

      var itemFour = {
        'name': 'Fire Hydrant',
        'address': 'Somewhere else',
        'zip': '10507',
        'category': 'Lawn and Garden',
        'price': '10',
        'photo': 'null',
        'item_owner': userTwo,
        'date_start': start,
        'date_end': end
      }

      //add each item
      yield dbMethod.addItem(itemOne);
      yield dbMethod.addItem(itemTwo);
      yield dbMethod.addItem(itemThree);
      yield dbMethod.addItem(itemFour);

      var body = {
        user_id: userOne,
        message: 'here is a user.'
      }

      yield request(app)
        .post('/items/user')
        .send(body)
        .expect(200)
        .expect(function(response) {
          expect(response.body.status).to.equal('complete');
          expect(response.body.message).to.equal('items retrieved.');
          expect(response.body.items).to.be.a('array');

          var itemNames = [];
          response.body.items.forEach(function(x) {
            itemNames.push(x.name)
          })

          expect(itemNames).to.contain('Lawn Mower');
          expect(itemNames).to.contain('Pickup Truck');
          expect(itemNames).to.contain('An entire army of opossums')
          expect(itemNames).not.to.contain('Fire Hydrant')
        })
    })

    it_("(POST, /items/user/is_renting) : should get items a user is renting", function*() {
      var userOne = yield dbMethod.addUser('MustardForBreakfast', 'password', 'mr.email@mr.email')
        .then(function(idArray) {
          return idArray[0];
        })
      var userTwo = yield dbMethod.addUser('Duckworth', 'password', 'mr.email@mr.email')
        .then(function(idArray) {
          return idArray[0];
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
        'item_owner': userOne,
        'date_start': start,
        'date_end': end
      }

      var itemTwo = {
        'name': 'Pickup Truck',
        'address': 'A different address',
        'zip': '10507',
        'category': 'Lawn and Garden',
        'price': '10',
        'photo': 'null',
        'item_owner': userOne,
        'date_start': start,
        'date_end': end
      }

      var itemThree = {
        'name': 'An entire army of opossums',
        'address': 'Somewhere else',
        'zip': '10507',
        'category': 'Lawn and Garden',
        'price': '10',
        'photo': 'null',
        'item_owner': userOne,
        'date_start': start,
        'date_end': end
      }

      var itemFour = {
        'name': 'Fire Hydrant',
        'address': 'Somewhere else',
        'zip': '10507',
        'category': 'Lawn and Garden',
        'price': '10',
        'photo': 'null',
        'item_owner': userTwo,
        'date_start': start,
        'date_end': end
      }

      //add each item
      var itemIdOne = yield dbMethod.addItem(itemOne)
        .then(function(idArray) {
          return idArray[0];
        })

      var itemIdTwo = yield dbMethod.addItem(itemTwo)
        .then(function(idArray) {
          return idArray[0];
        })

      var itemIdThree = yield dbMethod.addItem(itemThree)
        .then(function(idArray) {
          return idArray[0];
        })

      var itemIdFour = yield dbMethod.addItem(itemFour)
        .then(function(idArray) {
          return idArray[0];
        })

      var rentalOne = {
        'user_id': userTwo,
        'item_id': itemIdOne,
        'date_start': start,
        'date_end': end,
        'is_confirmed': 'true'
      }

      var rentalTwo = {
        'user_id': userTwo,
        'item_id': itemIdTwo,
        'date_start': start,
        'date_end': end,
        'is_confirmed': 'true'
      }

      var rentalThree = {
        'user_id': userTwo,
        'item_id': itemIdThree,
        'date_start': start,
        'date_end': end,
        'is_confirmed': 'true'
      }

      var rentalFour = {
        'user_id': userOne,
        'item_id': itemIdFour,
        'date_start': start,
        'date_end': end,
        'is_confirmed': 'true'
      }

      yield dbMethod.addRental(rentalOne);
      yield dbMethod.addRental(rentalTwo);
      yield dbMethod.addRental(rentalThree);
      yield dbMethod.addRental(rentalFour);

      var body = {
        userID: userTwo,
        message: 'here is a user.'
      }

      yield request(app)
        .post('/items/user/is_renting')
        .send(body)
        .expect(200)
        .expect(function(response) {
          expect(response.body.status).to.equal('complete');
          expect(response.body.message).to.equal('rentals retrieved (with objects inside)');
          expect(response.body.rentalsWithItems).to.be.a('array');
          expect(response.body.rentalsWithItems[0].user_id).to.exist;
          expect(response.body.rentalsWithItems[0].item).to.exist;

          var itemNames = [];
          response.body.rentalsWithItems.forEach(function(x) {
            itemNames.push(x.item.name)
          })

          expect(itemNames).to.contain('Lawn Mower');
          expect(itemNames).to.contain('Pickup Truck');
          expect(itemNames).to.contain('An entire army of opossums')
          expect(itemNames).not.to.contain('Fire Hydrant')
        })
    })

    it_("(POST, /items/user/rented_from) : should get items being rented from a user", function*() {
      var userOne = yield dbMethod.addUser('MustardForBreakfast', 'password', 'mr.email@mr.email')
        .then(function(idArray) {
          return idArray[0];
        })
      var userTwo = yield dbMethod.addUser('Duckworth', 'password', 'mr.email@mr.email')
        .then(function(idArray) {
          return idArray[0];
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
        'item_owner': userOne,
        'date_start': start,
        'date_end': end
      }

      var itemTwo = {
        'name': 'Pickup Truck',
        'address': 'A different address',
        'zip': '10507',
        'category': 'Lawn and Garden',
        'price': '10',
        'photo': 'null',
        'item_owner': userOne,
        'date_start': start,
        'date_end': end
      }

      var itemThree = {
        'name': 'An entire army of opossums',
        'address': 'Somewhere else',
        'zip': '10507',
        'category': 'Lawn and Garden',
        'price': '10',
        'photo': 'null',
        'item_owner': userOne,
        'date_start': start,
        'date_end': end
      }

      var itemFour = {
        'name': 'Fire Hydrant',
        'address': 'Somewhere else',
        'zip': '10507',
        'category': 'Lawn and Garden',
        'price': '10',
        'photo': 'null',
        'item_owner': userTwo,
        'date_start': start,
        'date_end': end
      }

      //add each item
      var itemIdOne = yield dbMethod.addItem(itemOne)
        .then(function(idArray) {
          return idArray[0];
        })

      var itemIdTwo = yield dbMethod.addItem(itemTwo)
        .then(function(idArray) {
          return idArray[0];
        })

      var itemIdThree = yield dbMethod.addItem(itemThree)
        .then(function(idArray) {
          return idArray[0];
        })

      var itemIdFour = yield dbMethod.addItem(itemFour)
        .then(function(idArray) {
          return idArray[0];
        })

      var rentalOne = {
        'user_id': userTwo,
        'item_id': itemIdOne,
        'date_start': start,
        'date_end': end,
        'is_confirmed': 'true'
      }

      var rentalTwo = {
        'user_id': userTwo,
        'item_id': itemIdTwo,
        'date_start': start,
        'date_end': end,
        'is_confirmed': 'true'
      }

      var rentalThree = {
        'user_id': userTwo,
        'item_id': itemIdThree,
        'date_start': start,
        'date_end': end,
        'is_confirmed': 'true'
      }

      var rentalFour = {
        'user_id': userOne,
        'item_id': itemIdFour,
        'date_start': start,
        'date_end': end,
        'is_confirmed': 'true'
      }

      yield dbMethod.addRental(rentalOne);
      yield dbMethod.addRental(rentalTwo);
      //NOTE: rentalThree is NOT here.
      yield dbMethod.addRental(rentalFour);

      var body = {
        owner: userOne,
        message: 'here is a user.'
      }

      yield request(app)
        .post('/items/user/rented_from')
        .send(body)
        .expect(200)
        .expect(function(response) {
          expect(response.body.status).to.equal('complete');
          expect(response.body.message).to.equal('items retrieved (with arrays of rentals inside)');
          expect(response.body.itemsWithRentals).to.be.a('array');
          expect(response.body.itemsWithRentals[0].rentals).to.exist;
          expect(response.body.itemsWithRentals[0].item_owner).to.exist;

          var rentedNames = [];
          response.body.itemsWithRentals.forEach(function(x) {
            if (x.rentals.length > 0) {
              rentedNames.push(x.name)
            }
          })

          expect(rentedNames).to.contain('Lawn Mower');
          expect(rentedNames).to.contain('Pickup Truck');
          expect(rentedNames).not.to.contain('An entire army of opossums')
          expect(rentedNames).not.to.contain('Fire Hydrant')
        })
    })
  })

  describe("Rentals", function() {
    it_("(POST, /bookings) : should make a new booking if no conflicts", function*() {
      var userOne = yield dbMethod.addUser('MustardForBreakfast', 'password', 'mr.email@mr.email')
        .then(function(idArray) {
          return idArray[0];
        })
      var userTwo = yield dbMethod.addUser('Duckworth', 'password', 'mr.email@mr.email')
        .then(function(idArray) {
          return idArray[0];
        })

      var itemStart = new Date(2016, 2, 17, 3, 00, 0); // March 18th, 2016 at 3AM
      var itemEnd = new Date(2016, 5, 17, 5, 00, 0); // June 18th, 2016 at 5AM

      var rentOneStart = new Date(2016, 2, 17, 3, 00, 0); // March 18th, 2016 at 3AM
      var rentOneEnd = new Date(2016, 2, 20, 5, 00, 0); // March 21st, 2016 at 5AM

      var rentTwoStart = new Date(2016, 2, 21, 3, 00, 0); // March 22nd, 2016 at 3AM
      var rentTwoEnd = new Date(2016, 2, 25, 5, 00, 0); // March 26th, 2016 at 5AM

      //collides with rentOneStart/rentOneEnd
      var rentThreeStart = new Date(2016, 2, 20, 3, 00, 0); // March 21st, 2016 at 3AM
      var rentThreeEnd = new Date(2016, 2, 22, 5, 00, 0); // March 23rd, 2016 at 5AM

      var item = {
        'name': 'Lawn Mower',
        'address': '123 East Murphy Lane',
        'zip': '10507',
        'category': 'Lawn and Garden',
        'price': '10',
        'photo': 'null',
        'item_owner': userOne,
        'date_start': itemStart,
        'date_end': itemEnd
      }

      //add each item
      var itemID = yield dbMethod.addItem(item)
        .then(function(idArray) {
          return idArray[0];
        })

      var rentalOne = {
        'user_id': userTwo,
        'item_id': itemID,
        'date_start': rentOneStart,
        'date_end': rentOneEnd,
        'is_confirmed': 'true'
      }

      var rentalTwo = {
        'user_id': userTwo,
        'item_id': itemID,
        'date_start': rentTwoStart,
        'date_end': rentTwoEnd,
        'is_confirmed': 'true'
      }

      var rentalThree = {
        'user_id': userTwo,
        'item_id': itemID,
        'date_start': rentThreeStart,
        'date_end': rentThreeEnd,
        'is_confirmed': 'true'
      }

      yield dbMethod.addRental(rentalOne);

      var rentalTwoBody = {
        rental: rentalTwo,
        message: 'this rental should not conflict.'
      }

      var rentalThreeBody = {
        rental: rentalThree,
        message: 'this rental SHOULD conflict.'
      }

      yield request(app)
        .post('/bookings')
        .send(rentalTwoBody)
        .expect(201)
        .expect(function(response) {
          expect(response.body.status).to.equal('complete');
          expect(response.body.message).to.equal('rental created.');
          expect(response.body.rental.user_id).to.equal(userTwo)
        })

      yield request(app)
        .post('/bookings')
        .send(rentalThreeBody)
        .expect(409)
        .expect(function(response) {
          expect(response.body.status).to.equal('failed');
          expect(response.body.message).to.equal('booking conflict detected.');
        })
    })

    it_("(POST, /bookings/item) : should get bookings for a given item", function*() {
      var userOne = yield dbMethod.addUser('MustardForBreakfast', 'password', 'mr.email@mr.email')
        .then(function(idArray) {
          return idArray[0];
        })
      var userTwo = yield dbMethod.addUser('Duckworth', 'password', 'mr.email@mr.email')
        .then(function(idArray) {
          return idArray[0];
        })

      var itemStart = new Date(2016, 2, 17, 3, 00, 0); // March 18th, 2016 at 3AM
      var itemEnd = new Date(2016, 5, 17, 5, 00, 0); // June 18th, 2016 at 5AM

      var rentOneStart = new Date(2016, 2, 17, 3, 00, 0); // March 18th, 2016 at 3AM
      var rentOneEnd = new Date(2016, 2, 20, 5, 00, 0); // March 21st, 2016 at 5AM

      var rentTwoStart = new Date(2016, 2, 21, 3, 00, 0); // March 22nd, 2016 at 3AM
      var rentTwoEnd = new Date(2016, 2, 25, 5, 00, 0); // March 26th, 2016 at 5AM


      var itemOne = {
        'name': 'Lawn Mower',
        'address': '123 East Murphy Lane',
        'zip': '10507',
        'category': 'Lawn and Garden',
        'price': '10',
        'photo': 'null',
        'item_owner': userOne,
        'date_start': itemStart,
        'date_end': itemEnd
      }

      var itemTwo = {
        'name': 'Pickup Truck',
        'address': 'A different address',
        'zip': '10507',
        'category': 'Lawn and Garden',
        'price': '10',
        'photo': 'null',
        'item_owner': userOne,
        'date_start': itemStart,
        'date_end': itemEnd
      }

      //add each item
      var itemIdOne = yield dbMethod.addItem(itemOne)
        .then(function(idArray) {
          return idArray[0];
        })

      var itemIdTwo = yield dbMethod.addItem(itemTwo)
        .then(function(idArray) {
          return idArray[0];
        })

      var rentalOne = {
        'user_id': userTwo,
        'item_id': itemIdOne,
        'date_start': rentOneStart,
        'date_end': rentOneEnd,
        'is_confirmed': 'true'
      }

      var rentalTwo = {
        'user_id': userTwo,
        'item_id': itemIdOne,
        'date_start': rentTwoStart,
        'date_end': rentTwoEnd,
        'is_confirmed': 'true'
      }

      var rentalThree = {
        'user_id': userTwo,
        'item_id': itemIdTwo,
        'date_start': rentTwoStart,
        'date_end': rentTwoEnd,
        'is_confirmed': 'true'
      }

      yield dbMethod.addRental(rentalOne);
      yield dbMethod.addRental(rentalTwo);
      yield dbMethod.addRental(rentalThree);

      var body = {
        itemID: itemIdOne,
        message: 'here is an item - show me the rentals for it.'
      }

      yield request(app)
        .post('/bookings/item')
        .send(body)
        .expect(200)
        .expect(function(response) {
          expect(response.body.status).to.equal('complete');
          expect(response.body.message).to.equal('rentals retrieved.');
          expect(response.body.rentals).to.be.a('array');
          expect(response.body.rentals.length).to.equal(2)
          expect(response.body.rentals[0].user_id).to.exist;

          var itemIDs = [];
          response.body.rentals.forEach(function(x) {
            itemIDs.push(x.item_id);
          })

          expect(itemIDs).to.contain(itemIdOne);
          expect(itemIDs).not.to.contain(itemIdTwo);
        })
    })

    it_("(DELETE, /bookings) : should delete a booking", function*() {
      var userOne = yield dbMethod.addUser('MustardForBreakfast', 'password', 'mr.email@mr.email')
        .then(function(idArray) {
          return idArray[0];
        })
      var userTwo = yield dbMethod.addUser('Duckworth', 'password', 'mr.email@mr.email')
        .then(function(idArray) {
          return idArray[0];
        })

      var start = new Date(2016, 2, 17, 3, 00, 0); // March 18th, 2016 at 3AM
      var end = new Date(2016, 5, 17, 5, 00, 0); // June 18th, 2016 at 5AM

      var itemOne = {
        'name': 'Lawn Mower',
        'address': '123 East Murphy Lane',
        'zip': '10507',
        'category': 'Lawn and Garden',
        'price': '10',
        'photo': 'null',
        'item_owner': userOne,
        'date_start': start,
        'date_end': end
      }

      var itemIdOne = yield dbMethod.addItem(itemOne)
        .then(function(idArray) {
          return idArray[0];
        })

      var rentalOne = {
        'user_id': userTwo,
        'item_id': itemIdOne,
        'date_start': start,
        'date_end': end,
        'is_confirmed': 'true'
      }

      var rentalID = yield dbMethod.addRental(rentalOne)
        .then(function(rentalIDArray) {
          return rentalIDArray[0];
        })

      var body = {
        'rentalID': rentalID,
        message: 'here is a rental. Please delete it.'
      }

      yield request(app)
        .delete('/bookings')
        .send(body)
        .expect(200)
        .expect(function(response) {
          expect(response.body.status).to.equal('complete');
          expect(response.body.message).to.equal('rental deleted.');
          expect(response.body.rentalID).to.equal(rentalID);
        })

      //rental should not be there anymore if we look for it.
      yield dbMethod.getRentalByRentalID(rentalID)
        .then(function(bool) {
          expect(bool).to.equal(false);
        })
    })
  })
})

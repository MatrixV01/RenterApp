 var dbMethod = require('./db/dbMethods.js');
 var Promise = require('bluebird');



 //TODO: Look into ES6 Generator functions here to improve readability.



 // ------------ USER FUNCTIONS -----------



 exports.signupRoute = function(reqBody) {

   // 1) Filter for bad input.
   // 2) Attempt to add a user.
   // 		- If username taken, 409.
   // 3) Grab info about newly-created user.
   // 4) Add a session for newly-created user.
   // 5) Send user info and sessionID back to client. 201.

   return new Promise(function(fulfill, reject) {
     var username = reqBody.username;
     var password = reqBody.password;
     var email = reqBody.email;

     if (!username || typeof username !== 'string' ||
       !password || typeof password !== 'string' ||
       !email || typeof email !== 'string') {
       body = {
         status: 'failed',
         message: 'incorrect format. Make sure you provided a valid username, password, and email.',
         code: 400
       }
       reject(body);
     }

     dbMethod.addUser(username, password, email)
       .then(function(resp) {
         if (resp === 'Username already taken. Choose another.') {
           var body = {
             status: 'failed',
             code: 409,
             message: 'That username is taken.'
           }
           reject(body);
         } else if (typeof resp[0] === 'number') {
           var user;
           var sessionID;
           dbMethod.getUserByID(resp[0])
             .then(function(users) {
               user = users[0];
               dbMethod.addSession(resp[0])
                 .then(function(res) {
                   sessionID = res[0];
                   var userObj = {
                     username: user.username,
                     email: user.email,
                     userID: user.id
                   }
                   var body = {
                     'status': 'completed',
                     'message': 'user created',
                     'code': 201,
                     'sessionID': sessionID,
                     'user': userObj
                   }
                   fulfill(body);
                 })
                 .catch(function(err) {
                   console.err('error adding session: ', err);
                   var body = {
                     'status': 'failed',
                     'message': 'error creating a new session',
                     'code': 500,
                     'error': err
                   }
                   reject(body)
                 })
             })
             .catch(function(err) {
               var body = {
                 'status': 'failed',
                 'message': 'error getting user by ID',
                 'code': 500,
                 'error': err
               }
               reject(body);
             })
         }
       })
       .catch(function(err) {
         var body = {
           'status': 'failed',
           'message': 'error creating new user',
           'code': 500,
           'error': err
         }
         reject(body);
       })
   })
 }

 exports.loginRoute = function(reqBody) {

   // 1) Filter for bad input.
   // 2) Grab info about user.
   // 		-  If user not found, 400.
   // 3) Validate password.
   //		- If invalid, 401.
   // 4) Send user info and sessionID back to client. 200.

   return new Promise(function(fulfill, reject) {
     var username = reqBody.username;
     var password = reqBody.password;
     if (!username || typeof username !== 'string' ||
       !password || typeof password !== 'string') {
       var body = {
         status: 'failed',
         message: 'Invald format. Make sure you sent in a valid username and password.',
         code: 400
       }
       reject(body);
     } else {
       dbMethod.getUserByUsername(username)
         .then(function(res) {
           if (res === false) {
             var body = {
               status: 'failed',
               message: 'user not found.',
               code: 400,
             }
             reject(body);
           } else {
             var user = res[0]
             var userID = user.id;
             dbMethod.validatePassword(password, userID)
               .then(function(bool) {
                 if (!bool) {
                   var body = {
                     status: 'failed',
                     message: 'invalid password',
                     code: 401
                   }
                   reject(body);
                 } else {
                   dbMethod.addSession(userID)
                     .then(function(resp) {
                       var finalUserObj = {
                         'username': user.username,
                         'email': user.email,
                         'userID': userID
                       };
                       var body = {
                         'status': 'completed',
                         'message': 'signed in!',
                         'code': 200,
                         'sessionID': resp[0],
                         'user': finalUserObj
                       }
                       fulfill(body);
                     })
                     .catch(function(err) {
                       var body = {
                         'status': 'failed',
                         'message': 'error creating session.',
                         'code': 500,
                         'error': err
                       }
                       reject(body);
                     })
                 }
               })
               .catch(function(err) {
                 var body = {
                   'status': 'failed',
                   'message': 'error validating password',
                   'code': 500,
                   'error': err
                 }
                 reject(body);
               })
           }
         })
         .catch(function(err) {
           var body = {
             'status': 'failed',
             'message': 'error getting user by id',
             'code': 500,
             'error': err
           }
           reject(body);
         })
     }
   })
 }

 exports.logoutRoute = function(reqBody) {

   // 1) Filter for bad input.
   // 2) Check for sessionID.
   //		- If not found, 401.
   // 3) Retrieve session, attempt to match sessionID with userID.
   //		- If not found or no match, 401
   // 3) Delete the user's session.
   // 4) 200.

   return new Promise(function(fulfill, reject) {
     var userID = reqBody.userID;
     var cookie = reqBody.cookie;
     if (!userID || typeof userID !== 'number') {
       var body = {
         status: 'failed',
         message: 'incorrect format. Make sure you sent a valid userID.',
         code: 400
       }
       reject(body);
     } else if (!cookie || !cookie.sessionId) {
       var body = {
         status: 'failed',
         message: 'you are not currently signed in as that user!',
         code: 401
       }
       reject(body);
     } else {
       dbMethod.getSessionBySessionID(cookie.sessionId)
         .then(function(res) {
           if (res === false) {
             var body = {
               status: 'failed',
               message: 'sessionId not found. Are you sure you are logged in?',
               code: 401
             }
             reject(body);
           } else {
             if (res[0].user_id !== userID) {
               var body = {
                 status: 'failed',
                 message: 'your userID does not match for this session.',
                 code: 401
               }
               reject(body);
             } else {
               dbMethod.removeSession(userID)
                 .then(function(response) {
                   var body = {
                     status: 'completed',
                     message: 'logout successful.',
                     code: 200
                       // response : response
                   }
                   fulfill(body);
                 })
                 .catch(function(err) {
                   var body = {
                     status: 'failed',
                     message: 'error deleting session',
                     code: 500
                   }
                   reject(body);
                 })
             }
           }
         })
         .catch(function(err) {
           var body = {
             status: 'failed',
             message: 'error getting session by session id',
             code: 500,
             error: err
           }
           reject(body);
         })
     }
   })
 }

 exports.validateSessionRoute = function(reqBody) {

   // 1) Filter for bad input.
   // 2) Retrieve session by ID.
   //		- If not found, 401
   // 3) Match sessionID with userID
   // 		- If no match, 401
   // 4) Inform client of verification. 200.

   return new Promise(function(fulfill, reject) {
     var sessionID = reqBody.sessionID;
     var userID = reqBody.userID;

     if (!sessionID || typeof sessionID !== 'string' || !userID ||
       typeof userID !== 'number') {
       var body = {
         status: 'failed',
         message: 'invalid input. Make sure you provided a valid sessionID and userID.',
         code: 400,
       };
       reject(body);
     } else {
       dbMethod.getSessionBySessionID(sessionID)
         .then(function(resp) {
           if (resp === false) {
             var body = {
               status: 'failed',
               message: 'sessionID not found. Try logging out and logging in again.',
               code: 401
             }
             reject(body);
           } else if (resp[0].user_id && resp[0].user_id === userID) {
             var body = {
               status: 'complete',
               message: 'session/user verified.',
               code: 200
             }
             fulfill(body);
           } else if (resp[0].user_id && resp[0].user_id !== userID) {
             var body = {
               status: 'failed',
               message: 'your userID does not match that session.',
               code: 401
             }
             reject(body)
           } else {
             var body = {
               status: 'failed',
               message: 'error checking session',
               error: resp,
               code: 500
             }
             console.error(err)
             reject(body)
           }
         })
         .catch(function(err) {
           var body = {
             status: 'failed',
             message: 'error checking session',
             error: err,
             code: 500
           }
           console.error(err)
           reject(body)
         })
     }
   })
 }

 exports.getUserRoute = function(reqBody) {

   // 1) Check for bad input.
   // 2) If userID present, grab user by ID.
   //		- If not found, 400.
   // 3) Else if username present, grab user by name.
   //		- If not found, 400.
   // 4) If neither ID nor name present, 400.
   // 5) Send user info to client. 200.

   return new Promise(function(fulfill, reject) {
     if (reqBody.userID && typeof reqBody.userID === 'number') {
       dbMethod.getUserByID(reqBody.userID)
         .then(function(response) {
           var body = {};
           if (response === false) {
             body.status = 'failed';
             body.message = 'could not find that user.';
             body.code = 400;
             reject(body);
           } else {
             body.user = {};
             body.user.username = response[0].username;
             body.user.email = response[0].email;
             body.status = 'complete';
             body.message = 'user retrieved.';
             body.code = 200;
             fulfill(body);
           }
         })
         .catch(function(err) {
           var body = {};
           body.status = 'failed';
           body.message = 'internal error getting user by ID';
           body.error = err;
           body.code = 500;
           reject(body);
         })
     } else if (reqBody.username && typeof reqBody.username === 'string') {
       dbMethod.getUserByUsername(reqBody.username)
         .then(function(response) {
           var body = {};
           if (response === false) {
             body.status = 'failed';
             body.message = 'could not find that user.';
             body.code = 400;
             reject(body);
           } else {
             body.user = {};
             body.user.id = response[0].id;
             body.user.username = response[0].username;
             body.user.email = response[0].email;
             body.status = 'complete';
             body.message = 'user retrieved.';
             body.code = 200;
             fulfill(body);
           }
         })
         .catch(function(err) {
           var body = {};
           body.status = 'failed';
           body.message = 'internal error getting user by ID';
           body.error = err;
           body.code = 500;
           reject(body);
         })
     } else {
       var errorBody = {
         status: 'failed',
         message: 'invalid request format. Please send a valid "userID" or "username" ',
         code: 400
       }
       reject(errorBody);
     }
   })
 }

 exports.deleteUserRoute = function(reqBody) {

   // 1) Filter for bad input.
   // 2) Remove user.
   //		- If user never existed, 400.
   // 3) 200.

   return new Promise(function(fulfill, reject) {
     if (reqBody.user && typeof reqBody.user.userID === 'number') {
       var user = reqBody.user;
       var userID = user.userID;
       dbMethod.removeUser(userID)
         .then(function(response) {
           var obj = {};
           if (response.length !== 0) {
             obj.status = 'complete';
             obj.message = 'user deleted';
             obj.user = user;
             obj.code = 200;
             fulfill(obj);
           } else {
             obj.status = 'failed';
             obj.message = 'user was not deleted - user did not exist';
             obj.code = 400;
             reject(obj);
           }
         })
         .catch(function(err) {
           //do something with err
           console.error('error in helper: ', err)
           var errorBody = {
             status: 'failed',
             message: 'internal error',
             code: 500,
             error: err
           }
           reject(errorBody);
         })
     } else {
       var errorBody = {
         status: 'failed',
         message: 'invalid input. Please provide a valid "user" object containing a "userID"',
         code: 400
       }
       reject(errorBody);
     }
   })
 }



 // ------------ ITEM FUNCTIONS -----------



 exports.createItemRoute = function(reqBody) {
   return new Promise(function(fulfill, reject) {
     if (reqBody.item && typeof reqBody.item.name === 'string') {
       var item = reqBody.item;
       dbMethod.addItem(item)
         .then(function(response) {
           if (typeof response[0] === 'number') {
             var newItem;
             dbMethod.getItemByID(response[0])
               .then(function(res) {
                 newItem = res[0];
                 var body = {
                   status: 'complete',
                   message: 'item added.',
                   code: 201,
                   item: newItem
                 }
                 fulfill(body);
               })
           } else if (response === 'We do not have a record of that items owner.') {
             var body = {
               status: 'failed',
               message: response,
               code: 400
             }
             reject(body);
           }
         })
         .catch(function(err) {
           var body = {
             status: 'failed',
             message: 'error. make sure you provided the correct information in the request body.',
             code: 400,
             error: err
           }
           reject(body);
         })
     } else {
       var body = {
         status: 'failed',
         message: 'invalid request format. make sure you provided an item object with name, address, zip, category, price, photo, item_owner, date_start, and date_end fields.',
         code: 400
       }
       reject(body);
     }
   })
 }

 exports.searchItemsRoute = function(reqBody) {
   //compares only the first three numbers in each zipcode to increase number of search results.
   return new Promise(function(fulfill, reject) {
     if (reqBody.searchTerm && typeof reqBody.searchTerm === 'string' && reqBody.zipCode && typeof reqBody.zipCode === 'number') {

       var name = reqBody.searchTerm;
       var zip = reqBody.zipCode;
       var shortZip = zip.toString().slice(0, 3)
       dbMethod.getItemsByNameLike(name)
         .then(function(items) {
           var results = items.filter(function(x) {
             return x.zip.toString().slice(0, 3) === shortZip;
           })
           var body = {
             status: 'complete',
             message: 'items retrieved.',
             code: 200,
             'items': results
           }
           fulfill(body);
         })
         .catch(function(err) {
           var body = {
             status: 'failed',
             message: 'internal error',
             code: 500,
             error: err
           }
           reject(body);
         })
     } else {
       var body = {
         status: 'failed',
         message: 'invalid input. Make sure you supplied a valid searchTerm and zipCode.',
         code: 400
       }
       reject(body);
     }
   })
 }

 exports.getItemByIDRoute = function(reqBody) {
   return new Promise(function(fulfill, reject) {
     var itemID = reqBody.itemID;
     if (!itemID || typeof itemID !== 'number') {
       var body = {
         'status': 'failed',
         'message': 'invalid format. make sure you provided a valid itemID',
         'code': 400
       }
       reject(body);
       return;
     }
     dbMethod.getItemByID(itemID)
       .then(function(item) {
         if (item === false) {
           var body = {
             'status': 'failed',
             'message': 'item does not exist',
             'code': 400
           }
           reject(body)
         } else {
           var body = {
             'status': 'completed',
             'message': 'item retrieved.',
             'code': 200,
             item: item[0]
           }
           fulfill(body);
         }
       })
       .catch(function(err) {
         var body = {
           'status': 'failed',
           'messasge': 'error getting item by ID',
           'code': 500,
           'error': err
         }
         reject(body)
       })
   })
 }

 exports.getOwnedRoute = function(reqBody) {
   return new Promise(function(fulfill, reject) {
     if (reqBody.user_id && typeof reqBody.user_id === 'number') {
       var userID = reqBody.user_id;
       dbMethod.getItemsByOwnerID(userID)
         .then(function(items) {
           var body = {
             status: 'complete',
             message: 'items retrieved.',
             'items': items,
             code: 200
           }
           fulfill(body);
         })
         .catch(function(err) {
           var body = {
             status: 'failed',
             message: 'internal error',
             error: err,
             code: 500
           }
           reject(body);
         })
     } else {
       var body = {
         status: 'failed',
         message: 'invalid input. Make sure you supplied a valid user_id',
         code: 400
       }
       reject(body);
     }
   })
 }

 // consider refactoring 'isRentingRoute': instead of returning rentals w/ an 'item'
 // property, return items (no dupes) w/ a 'rentals' property (an array of rental arrays).
 // More sensible, and is consistent with 'rentedFromRoute'. -Justin
 exports.isRentingRoute = function(reqBody) {
   //get a list of rentals, each with an item object in it.
   return new Promise(function(fulfill, reject) {

     if (!!!reqBody.userID || typeof reqBody.userID !== 'number') {
       var body = {
         status: 'failed',
         message: 'invalid format. Make sure you sent a valid userID.',
         code: 400
       }
       reject(body);
     }

     var renterID = reqBody.userID;
     dbMethod.getRentalsByRenterID(renterID)
       .then(function(results) {

         if (results === false) {
           var body = {
             status: 'completed',
             message: 'No rentals found for that user.',
             rentalsWithItems: [],
             code: 200
           }
           fulfill(body);
           return;
         }

         var rentals = results;
         var itemPromises = [];
         var items = [];

         rentals.forEach(function(x) {
           var itemID = x.item_id
           itemPromises.push(Promise.resolve(dbMethod.getItemByID(itemID)) //tried a resolve
             .then(function(resp) {
               items.push(resp[0]);
               return resp[0];
             })
             .catch(function(err) {
               console.error('could not push in isRentingRoute: ', err);
               return err;
             })
           )
         })

         Promise.all(itemPromises)
           .then(function() {
             //pack item objects inside the appropriate rental objects
             for (var i = 0; i < rentals.length; i++) {
               for (var j = 0; j < items.length; j++) {
                 if (rentals[i].item_id === items[j].id) {
                   rentals[i].item = items[j];
                 }
               }
             }

             var body = {
               status: 'complete',
               message: 'rentals retrieved (with objects inside)',
               rentalsWithItems: rentals,
               code: 200
             }
             fulfill(body)
           })

         .catch(function(err) {
           var body = {
             status: 'failed',
             message: 'could not retrieve items a user is renting',
             code: 500,
             error: err
           }
           console.error('something broke getting all the items to put into the rentals: ', err)
           reject(body);
         })
       })
   })
 }

 exports.rentedFromRoute = function(reqBody) {
   //get a list of items, each with an array of rentals in it.
   return new Promise(function(fulfill, reject) {

     if (!!!reqBody.owner || typeof reqBody.owner !== 'number') {
       var body = {
         status: 'failed',
         message: 'invalid format. Make sure you sent a valid "owner".',
         code: 400
       }
       reject(body);
     }

     var ownerID = reqBody.owner
     dbMethod.getItemsByOwnerID(ownerID)
       .then(function(results) {
         var items = results;
         var rentalsPromises = [];
         var rentalArrays = [];

         items.forEach(function(x) {
           rentalsPromises.push(dbMethod.getRentalsByItemID(x.id)
             .then(function(resp) {
               rentalArrays.push(resp);
               return resp;
             })
             .catch(function(err) {
               console.error('could not push in rentedFromRoute: ', err);
               var errObj = {
                 err: err,
                 message: 'could not retrieve this rental',
               }

               rentalArrays.push(errObj)
               return err;
             })
           )
         })

         Promise.all(rentalsPromises)
           .then(function() {
             //pack rentals arrays inside the appropriate item objects
             for (var i = 0; i < items.length; i++) {
               for (var j = 0; j < rentalArrays.length; j++) {
                 var thisRentalArray = rentalArrays[j]
                 if (!!thisRentalArray && items[i].id === thisRentalArray[0].item_id) {
                   items[i].rentals = rentalArrays[j];
                 } else {
                   items[i].rentals = items[i].rentals || [];
                 }
               }
             }
             var rentalsOnly = items.filter(function(x) {
               return x.rentals.length > 0
             })
             var body = {
               status: 'complete',
               message: 'items retrieved (with arrays of rentals inside)',
               itemsWithRentals: rentalsOnly,
               code: 200
             }
             fulfill(body)
           })

         .catch(function(err) {
           var body = {
             status: 'failed',
             message: 'could not retrieve items being rented by others',
             error: err,
             code: 500
           }
           reject(body);
         })
       })
   })
 }

 exports.deleteItemRoute = function(reqBody) {
   return new Promise(function(fulfill, reject) {
     if (reqBody.item_id && typeof reqBody.item_id === 'number') {
       var itemID = reqBody.item_id;
       var userID = reqBody.user_id;
       var pw = reqBody.password;

       // TODO: when AUTH in place, use username and password to authenticate
       // prior to deleting an item.

       dbMethod.removeItem(itemID)
         .then(function(response) {
           var obj = {};
           if (response.length !== 0) {
             obj.status = 'complete';
             obj.message = 'item deleted.';
             obj.itemID = response[0].id;
             obj.itemName = response[0].name;
             obj.code = 200;
             fulfill(obj);
           } else {
             obj.status = 'failed';
             obj.message = 'item was not deleted - item did not exist';
             obj.code = 400;
             reject(obj);
           }
         })
         .catch(function(err) {
           //do something with err
           var errorBody = {
             status: 'failed',
             message: 'internal error',
             error: err,
             code: 500
           }
           reject(errorBody);
         })
     } else {
       var errorBody = {
         status: 'failed',
         message: 'invalid format. Make sure you provided a valid item_id, user_id, and password.',
         code: 400
       }
       reject(errorBody);
     }
   })
 }



 // ------------ RENTAL FUNCTIONS -----------



 exports.createRentalRoute = function(reqBody) {
   return new Promise(function(fulfill, reject) {

     if (!!!reqBody.rental || typeof reqBody.rental.user_id !== 'number' || typeof reqBody.rental.item_id !== 'number' ||
       typeof reqBody.rental.date_start !== 'string' ||
       typeof reqBody.rental.date_end !== 'string') {

       var body = {
         status: 'failed',
         message: 'invalid request format. Make sure you provided a rental object with valid item_id, date_start, and date_end fields.',
         code: 400
       }
       reject(body)
     }

     if (Date.parse(reqBody.rental.date_start) >= Date.parse(reqBody.rental.date_end)) {
       var body = {
         status: 'failed',
         message: 'invalid dates. Make sure date_start does not occur after date_end, or visa versa.',
         code: 400
       }
       reject(body)
     }

     var rental = reqBody.rental;
     var itemID = rental.item_id;
     var start = rental.date_start;
     var end = rental.date_end;

     var hasBookingConflict = false;
     var dateIsInRange = true;

     dbMethod.dateHasBookConflicts(itemID, start, end)
       .then(function(bool) {
         hasBookingConflict = bool;
         dbMethod.dateIsInRange(itemID, start, end)
           .then(function(bool) {
             dateIsInRange = bool;
             if (!hasBookingConflict && dateIsInRange) {

               //add the rental!
               dbMethod.addRental(rental)
                 .then(function(response) {
                   if (typeof response[0] === 'number') {
                     var newRental;
                     dbMethod.getRentalByRentalID(response[0])
                       .then(function(res) {
                         newRental = res[0];
                         var body = {
                           status: 'complete',
                           message: 'rental created.',
                           code: 201,
                           rental: newRental
                         }
                         fulfill(body);
                       })
                   } else if (response === false) {
                     var body = {
                       status: 'failed',
                       message: 'error retrieving rental',
                       code: 500
                     }
                     reject(body);
                   }
                 })
                 .catch(function(err) {
                   var body = {
                     status: 'failed',
                     message: 'internal error',
                     code: 500,
                     error: err
                   }
                   reject(body)
                 })

             } else if (!dateIsInRange) {
               //reject for item conflict
               var body = {
                 status: 'failed',
                 message: 'rental conflicts with an existing booking.',
                 code: 409
               }
               reject(body)
             } else if (hasBookingConflict) {
               //reject for booking conflict
               var body = {
                 status: 'failed',
                 message: 'booking conflict detected.',
                 code: 409
               }
               reject(body)
             }
           })
           .catch(function(err) {
             var body = {
               status: 'failed',
               message: 'Error checking date range validity. Were date_start and date_end in the correct dateTime format?',
               code: 500
             }
             reject(body)
           })
       })
       .catch(function(err) {
         var body = {
           status: 'failed',
           message: 'Error checking date conflicts. Were date_start and date_end in the correct dateTime format?',
           code: 500
         }
         reject(body)
       })
   })
 }

 exports.rentalsForItemRoute = function(reqBody) {
   return new Promise(function(fulfill, reject) {
     if (!!!reqBody.itemID || typeof reqBody.itemID !== 'number') {
       var body = {
         status: 'failed',
         message: 'invalid format. Make sure you provided a valid itemID.',
         code: 400
       }
       reject(body)
     }

     var itemID = reqBody.itemID;
     dbMethod.getRentalsByItemID(itemID)
       .then(function(rentals) {
         var body = {
           status: 'complete',
           message: 'rentals retrieved.',
           'rentals': rentals,
           code: 200
         }
         fulfill(body);
       })
       .catch(function(err) {
         var body = {
           status: 'failed',
           message: 'internal error',
           error: err,
           code: 500
         }
         reject(body);
       })
   })
 }

 exports.deleteRentalRoute = function(reqBody) {
   return new Promise(function(fulfill, reject) {
     if (!!!reqBody.rentalID || typeof reqBody.rentalID !== 'number') {
       var body = {
         status: 'failed',
         message: 'invalid format. Make sure you entered a valid rentalID, userID, and password',
         code: 400
       }
       reject(body);
     }

     var rentalID = reqBody.rentalID;
     var userID = reqBody.userID;
     var pw = reqBody.password;

     dbMethod.removeRental(rentalID)
       .then(function(response) {
         var obj = {};
         if (response.length !== 0) {
           obj.status = 'complete';
           obj.message = 'rental deleted.';
           obj.rentalID = response[0].id;
           obj.code = 200;
           fulfill(obj);
         } else {
           obj.status = 'failed';
           obj.message = 'item was not deleted - item did not exist';
           obj.code = 400;
           reject(obj);
         }
       })
       .catch(function(err) {
         var errorBody = {
           status: 'failed',
           message: 'internal error',
           code: 500,
           error: err
         }
         reject(errorBody);
       })
   })
 }

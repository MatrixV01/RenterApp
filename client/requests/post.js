require('./request-helpers.js'); // Headers
require('whatwg-fetch');  // http://github.github.io/fetch/
var getRequests = require('./get.js');
require('./request-helpers.js'); // Headers
var React = require('react');
var Link = Router.Link;
import { Component } from 'react';
import { Route } from 'react-router';
import { Router, RouterContext, match } from 'react-router';
import { hashHistory } from 'react-router';
import { IndexRoute } from 'react-router';
import { render } from 'react-dom'
var App = require('../App.jsx') 




exports.addNewItem = function(itemObject) {
  console.log("ITEM OBJECT: ", itemObject);
  return fetch('items/', {
    method: 'POST',
    headers: requestHeaders,
    credentials: 'include',
    body: JSON.stringify(itemObject)
  }).then(function(itemObject){
    return itemObject.json();
  }).then( function(response) {
      console.log('ITEM RESPONSE', response);
      return response;
    })

    window.globalStateItemID = this.state.id;
};



/******************* SEARCH ********************/




exports.searchForItem = function(itemName) {
  console.log("ITEMNAME: ", itemName)
  return fetch('items/search', {            
    method: 'POST',
    headers: requestHeaders,
    credentials: 'include',
    body: JSON.stringify(itemName)
  }).then(function(response){
    return response.json()
  })
  .then( function(response) {
      console.log('ITEMNAME RESPONSE', response);
    })
};



/******************* SIGN UP/ SIGN IN ********************/





exports.signup = function(signupObject){
  console.log("SIGNUP OBJECT: ", signupObject);
  return fetch('signup/', {
    method: 'POST',
    headers: requestHeaders,
    body: JSON.stringify(signupObject)
  }).then(function(signupObject){
    return signupObject.json();
  }).then( function(response) {
      console.log('SIGNUP RESPONSE', response);
      return response;
    })
};

exports.login = function(loginObject){
  console.log("LOGIN OBJECT: ", loginObject);
  return fetch('login/', {
    method: 'POST',
    headers: requestHeaders,
    body: JSON.stringify(loginObject)
  }).then(function(loginObject){
    return loginObject.json();
  }).then( function(response) {
      console.log('login RESPONSE: ', response);
      console.log('login RESPONSE ID: ', response.user.userID);
      window.globalStateUserID = response.user.userID;
      return response;
    })
}


exports.logout = function(userID){
  console.log('userID: ', userID)
  return fetch('logout/', {
    method: 'POST',
    headers: requestHeaders,
    credentials: 'include',
    body: JSON.stringify(userID)
  }).then(function(userID){
    return userID.json();
  }).then( function(response) {
      console.log('login RESPONSE: ', response);
      window.globalStateUserID = null;
      return response;
    })



  return window.globalStateUserID = null;
}





/*********global nav bar***********/



exports.goToProfile = function(userID){
    return fetch('users/', {            //change this maybe
    method: 'POST',
    headers: requestHeaders,
    credentials: 'include',
    body: JSON.stringify(userID)
  }).then( function(response) {
      console.log('USERID', response);
    })

}





/********************* ITEMS **************************/


exports.getItem = function(itemID){
    console.log('itemID ', itemID)
    return fetch('items/id', {
    method: 'POST',
    headers: requestHeaders,
    credentials: 'include',
    body: JSON.stringify(itemID)
  }).then(function(itemID){
    return itemID.json();
  }).then( function(response) {
      console.log('ITEM RESPONSE', response);
      return response;
    })
  
};



exports.handleSubmit = function(){

};


exports.goToProfile = function(){

}

exports.listItem = function(){

}


exports.getUserItemsForRent = function(){


};

exports.getStuffRentedFromOthers = function(){

  
};

exports.stuffBeingRentedFromUser = function(){


};

/************ SEARCH RESULTS **********/

exports.searchResults = function() {
  
};

exports.searchLocation = function() {
 
}

/************ NEW LISTING **********/

exports.itemName = function() {

}

exports.itemDescription = function() {

}

exports.photoURL = function() {

}

exports.firstDate = function() {

}

exports.lastDate = function() {

}

exports.price = function() {

}

exports.newListLocation = function() {

}

exports.submitNewListing = function() {

}

var React = require('react');
var Link = Router.Link;
import {Component} from 'react';
import {Route} from 'react-router';
import {Router, RouterContext, match} from 'react-router';
import {hashHistory} from 'react-router';
import {IndexRoute} from 'react-router';
import {render} from 'react-dom'
var postRequests = require('../requests/post.js');
var getRequests = require('../requests/get.js');
var App = require('../App.jsx')

var Signup = React.createClass({

  getInitialState: function() {
    return {username: null, email: null, password: null}
  },

  handleUsernameChange: function(e) {
    this.setState({username: e.target.value});
  },

  handleEmailChange: function(e) {
    this.setState({email: e.target.value});
  },

  handlePasswordChange: function(e) {
    this.setState({password: e.target.value});
  },

  submit: function() {
    var sessionID = sessionStorage.getItem('sessionID')
    if (sessionID) {
      alert('Someone is already logged in! Log out first before trying to sign up.')
      //do something nicer than an alert window plz!
    } else {
      var wrangled = this;
      postRequests.signup(this.state).then(function(resp) {
        wrangled.redirect()
      }).catch(function(err) {
        if (err.message === 'invalid password') {
          alert(err.message);
          //make this prettier plz
        } else if (err.message === 'That username is taken.') {
          alert('That username is already taken. Please try another!');
          //make this prettier plz
        } else if (err.message === 'incorrect format. Make sure you provided a valid username, password, and email.') {
          alert('Make sure you entered a valid username, email, and password!')
        } else {
          console.error('error signing up: ', err);
        }
      })
    }
  },

  redirect: function() {
    this.props.history.pushState(null, 'user');
  },

  render: function() {
    return (

      <div className='signupContainer'>

        <form className='signup' onSubmit={this.submit}>
          <input className='userSignup' value={this.state.username} onChange={this.handleUsernameChange} placeholder='Username'/>
          <input className='emailSignup' value={this.state.email} onChange={this.handleEmailChange} placeholder='E-mail'/>
          <input className='userPassword' value={this.state.password} onChange={this.handlePasswordChange} type='password' placeholder='Password'/>
          <button className="signupButton" type="submit">Sign Up</button>
        </form>

      </div>

    )
  }

});

module.exports = Signup;

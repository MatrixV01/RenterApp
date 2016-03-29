var React = require('react');
var Link = Router.Link;
import {Component} from 'react';
import {Route} from 'react-router';
import {Router, RouterContext, match} from 'react-router';
import {hashHistory} from 'react-router';
import {IndexRoute} from 'react-router';
import {render} from 'react-dom'

var App = require('./../App.jsx').default;
var NavBar = require('../components/GlobalNavBar.jsx');
var HomePage = require('../components/HomePage.jsx');
var UserPage = require('../components/UserPage.jsx');
var MakeNewListing = require('../components/MakeNewListing.jsx');
var Item = require('../components/ItemPage.jsx');
var SearchResults = require('../components/SearchResults.jsx')
var Login = require('../components/Login.jsx')
var Signup = require('../components/Signup.jsx')

render((
  <Router history={hashHistory} component={App}>
    <Route path="/" component={HomePage}/>
    <Route path='/user' component={UserPage}/>
    <Route path='/new' component={MakeNewListing}/>
    <Route path='/results' component={SearchResults}/>
    <Route path='/item' component={Item}/>
    <Route path='/login' component={Login}/>
    <Route path='/signup' component={Signup}/>
  </Router>
), document.getElementById('app'))

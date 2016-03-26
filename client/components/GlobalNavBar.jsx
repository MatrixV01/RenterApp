var React = require('react');
var ReactDOM = require('react-dom');
var Router = require('react-router');
var Link = Router.Link
var postRequests = require('../requests/post.js');
var getRequests = require('../requests/get.js');
import {render} from 'react-dom'
var HomePage = require('../components/HomePage.jsx')
var App = require('../App.jsx');
import { hashHistory } from 'react-router';
import { RouterContext, match } from 'react-router';
import { History } from 'react-router';


var GlobalNavBar = React.createClass({

getInitialState: function(){
		return {
			searchTerm: null,
			zipCode: null
		};
	},

handleSearch: function(e){
		this.setState({
			searchTerm: e.target.value
		})
	},

handleZip: function(e){
		this.setState({
			zipCode: parseInt(e.target.value)
		})
	},

handleSearchRedirect: function(){

		sessionStorage.setItem("GlobalSearchTerm", this.state.searchTerm)
		sessionStorage.setItem("GlobalSearchZip", this.state.zipCode)
	    this.props.history.hashHistory.pushState(this.state, 'results');

	},

handleHomeRedirect: function(){

	    this.props.history.hashHistory.pushState(this.state, '/');

	},

handleNewListingRedirect: function(){

		var sessionID = sessionStorage.getItem('sessionID');
		var userID = parseInt(sessionStorage.getItem('userID'));
		var wrangled = this;

		if(!sessionID){

			alert('You are not signed in! Sign up or sign in first.')
			wrangled.props.history.hashHistory.pushState(this.state, 'login')

		} else {

			//validate sessionID
			postRequests.validateSession({'userID': userID, 'sessionID': sessionID})

			.then(function(resp){
				wrangled.props.history.hashHistory.pushState(wrangled.state, 'new');
			})

			.catch(function(err){
				if(err.code === 403){
					alert('You are not signed in! Sign up or sign in first.')
					//DO SOMETHING PRETTIER THAN ALERT!
					wrangled.props.history.hashHistory.pushState(wrangled.state, 'login')

				} else {

					console.error('error validating session: ', err);

				}
			})
		}
	},

handleSigninRedirect: function(){

	    this.props.history.hashHistory.pushState(this.state, 'login');

	},

handleSignUpRedirect: function(){

		this.props.history.hashHistory.pushState(this.state, 'signup');

	},

handleProfileRedirect: function(){

		var sessionID = sessionStorage.getItem('sessionID');
		var userID = parseInt(sessionStorage.getItem('userID'));
		var wrangled = this;

		if(!sessionID){

			alert('You are not signed in! Sign up or sign in first.')
			wrangled.props.history.hashHistory.pushState(this.state, 'login')
		
		} else {
			
				//validate sessionID
			postRequests.validateSession({'userID': userID, 'sessionID': sessionID})
			
			.then(function(resp){
				wrangled.props.history.hashHistory.pushState(wrangled.state, 'user');
			})

			.catch(function(err){
				if(err.code === 403){

					alert('You are not signed in! Sign up or sign in first.')
					wrangled.props.history.hashHistory.pushState(wrangled.state, 'login')

				} else {

					console.error('error validating session: ', err);

				}
			})
		}
	},

render: function() {
	    return (
	      <div className="bar">
	       <div className='title' onClick={this.handleHomeRedirect}>RÑTR</div>
	        <div className="signup" onClick={this.handleSignUpRedirect}>Sign Up</div>
	         <div className="signin" onClick={this.handleSigninRedirect}>Sign In</div>
	      	  <div className="listItem" onClick={this.handleNewListingRedirect}>List an Item</div>
	      	   <div className="myProfile" onClick={this.handleProfileRedirect}>My Profile</div>
						
						<form onSubmit={this.handleSearchRedirect}>
							<input className='searchbar' placeholder='Search Items' type="text" value={this.state.searchTerm} onChange={this.handleSearch}></input>
							<input className='zipSearchbar'placeholder="ZIP Code" type="number" width='20' value={this.state.zipCode} onChange={this.handleZip}></input>
							<button className='searchSubmitButton'type="submit">GO</button>
						</form>
	      </div>
	     );
	   }
});



module.exports = GlobalNavBar;

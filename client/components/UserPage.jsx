var React = require('react');
var ReactDOM = require('react-dom');
var Router = require('react-router');
var Link = Router.Link 
// add additional dependencies

var UserPage = React.createClass({

getInitialState: function(){
	 return {};
},

componentDidMount: function(){
	return console.log(this.props.getUserInfo().username);
},

navBar: function(){}, //load globalNavBar

requestsToRentees: function(){},

requestsFromRenters: function(){},

delistItem: function(){},

getListedItems: function(){},

getCurrentRentedItems: function(){},

render: function(){
	return (<div className='userPage'>
			 <div className='userGreeting'>Welcome, {this.props.getUserInfo().username}</div>
			  <div className='yourStuffForRent'> Your stuff for rent: 
			 
			  	<div className='yourItemForRent'></div>            
			  </div>
			  	<div className='stuffYouAreRenting'>Stuff you are renting from others
			  	  <div className='itemYouAreRenting'>ITEM YOU ARE RENTING</div>
			  	</div>
			  	  <div className='stuffOthersAreRentingFromYou'>Items that others are renting from you
			  	    <div className='itemBeingRentedFromYou'>ITEM BEING RENTED</div>
			  	  </div>


			</div>);


}

});



module.exports = UserPage;


// this.props.listings.map(function(listing) {
// 			  		<ThingForRent listing={listing} />
// 			  	})



// {this.props.getUserItemsForRent()}
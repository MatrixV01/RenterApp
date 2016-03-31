var React = require('react');
var ReactDOM = require('react-dom');
var Router = require('react-router');
var Link = Router.Link
var App = require('../App.jsx')
var postRequests = require('../requests/post.js');
var getRequests = require('../requests/get.js');

var UserPage = React.createClass({

  getInitialState: function() {

    return {
      name: null,

      itemsForRent: null,

      itemsUserIsRenting: null,
      itemsUserIsRentingObjectID: null,

      itemsBeingRentedFromUser: null,
      itemsBeingRentedFromUserObjectID: null

    };
  },

  componentDidMount: function() {
    this.getUserInfo();
    this.getListedItems();
    this.getItemsUserIsRenting();
    this.getCurrentRentedItems();
  },

  getUserInfo: function() {
    var stashedUserID = parseInt(sessionStorage.getItem('userID'));
    var promise = postRequests.getUserInfo({userID: stashedUserID});
    promise.then((user) => {
      this.setState({name: user.user.username})
    })
  },

  delistItem: function() {},

  getListedItems: function() {
    var stashedUserID = parseInt(sessionStorage.getItem('userID'));
    var promise = postRequests.getUserItemsForRent({user_id: stashedUserID});
    promise.then((user) => {
      this.setState({itemsForRent: user.items})
      sessionStorage.setItem("itemID", user.items[0].id)
    })

  },

  getItemsUserIsRenting: function() {

    var stashedUserID = parseInt(sessionStorage.getItem('userID'));
    var promise = postRequests.getStuffRentedFromOthers({userID: stashedUserID});
    promise.then((item) => {
      if (item === 'NO CURRENT RENTALS') {
        this.setState({itemsUserIsRenting: null})
      } else {
        this.setState({itemsUserIsRenting: item.rentalsWithItems, itemsUserIsRentingObjectID: item.rentalsWithItems[0].id})
      }
    })
  },

  getCurrentRentedItems: function() {

    var stashedUserID = parseInt(sessionStorage.getItem('userID'));
    var promise = postRequests.stuffBeingRentedFromUser({owner: stashedUserID})
    promise.then((item) => {
      this.setState({itemsBeingRentedFromUser: item.itemsWithRentals})
    })

  },

  handleitemBeingRentedFromYouChange: function(e) {
    this.setState({itemsBeingRentedFromUser: e.target.value});
  },

  /******* REDIRECT FUNCTIONS ********/

  handleItemRedirect: function(itemID) {
    var id = itemID || this.state.getListedItemObjectID;
    sessionStorage.setItem("itemID", id);
    this.props.history.pushState(this.state, 'item');
  },

  handleitemsUserIsRentingRedirect: function(itemID) {
    var id = itemID || this.state.itemsUserIsRentingObjectID;
    sessionStorage.setItem("itemID", id)
    if (this.state.itemsUserIsRentingObjectID !== null) { //this itemID is no longer useful. experiment with removing
      this.props.history.pushState(this.state, 'item');
    }
  },

  handlegetCurrentRentedItemsItemRedirect: function(itemID) {
    var id = itemID || this.state.itemsUserIsRentingObjectID;
    sessionStorage.setItem("itemID", id)
    this.props.history.pushState(this.state, 'item');
  },

  render: function() {
    var ownedItems = this.state.itemsForRent;
    var userIsRenting = this.state.itemsUserIsRenting;
    var rentedFromUser = this.state.itemsBeingRentedFromUser;
    var wrangled = this;

    var ownedDivs;
    //generate ownedDivs
    if (ownedItems !== null && ownedItems.length > 0) {
      ownedDivs = ownedItems.map(function(item, index) {
        return <div className='yourItemForRent' onClick={function() {
          wrangled.handleItemRedirect(item.id)
        }}>{item.name}</div>
      })
    } else {
      ownedDivs = <div className='noItemsYet'>You do not own any items.</div>
    }

    var rentFromOthersDivs;
    //generate rentFromOthersDivs
    if (userIsRenting !== null) {
      rentFromOthersDivs = userIsRenting.map(function(item, index) {
        return <div className='rentalBlock'>
          <div className='yourItemForRent' onClick={function() {
            wrangled.handleitemsUserIsRentingRedirect(item.item.id)
          }}>{item.item.name}</div>
          <div className='rentalTime'>Rental start: {item.date_start.slice(0, 10)}</div>
          <div className='rentalTime'>Rental end: {item.date_end.slice(0, 10)}</div>
        </div>
      });
    } else {
      rentFromOthersDivs = <div className='noItemsYet'>You have not scheduled any rentals.</div>
    }

    var rentFromUserDivs;
    //generate rentFromUserDivs
    if (rentedFromUser !== null && rentedFromUser.length > 0) {
      rentFromUserDivs = rentedFromUser.map(function(item, index) {
        return <div className='rentalBlock'>
          <div className='yourItemForRent' onChange={wrangled.handleitemBeingRentedFromYouChange} onClick={function() {
            wrangled.handlegetCurrentRentedItemsItemRedirect(item.id)
          }}>{item.name}</div>
          <div className='rentalTime'>Rental start: {item.rentals[0].date_start.slice(0, 10)}</div>
          <div className='rentalTime'>Rental end: {item.rentals[0].date_end.slice(0, 10)}</div>
        </div>
      });
    } else {
      rentFromUserDivs = <div className='noItemsYet'>Nobody is currently renting from you.</div>
    }

    return (
      <div className='userPage'>
        <div className='userContainer'>
          <div className='userGreeting'>
            Welcome,
            <bold>{this.state.name}</bold>
          </div>
          <div className='yourStuffForRent'>
            Your items for rent: {ownedDivs}
          </div>

          <div className='yourStuffForRent'>Items you are renting from others: {rentFromOthersDivs}
          </div>

          <div className='yourStuffForRent'>Items that others are renting from you: {rentFromUserDivs}
          </div>

        </div>
      </div>
    );
  }
});

module.exports = UserPage;

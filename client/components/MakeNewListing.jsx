var React = require('react');
var ReactDOM = require('react-dom');
var Router = require('react-router');
var Link = Router.Link
var postRequests = require('../requests/post.js');
var getRequests = require('../requests/get.js');
import {render} from 'react-dom'
var App = require('../App.jsx')

var MakeNewListing = React.createClass({

  getInitialState: function() {
    var itemOwner = sessionStorage.getItem('userID');
    return {
      name: '',
      address: '',
      zip: null,
      category: '',
      price: null,
      photo: '',
      item_owner: itemOwner,
      date_start: '',
      date_end: '',
      description: ''
    };

  },

  handleNameChange: function(e) {
    this.setState({name: e.target.value});
  },

  handlePhotoChange: function(e) {
    this.setState({photo: e.target.value});
  },

  handleZipChange: function(e) {
    this.setState({
      zip: parseInt(e.target.value)
    });
  },

  handlePriceChange: function(e) {
    this.setState({
      price: parseInt(e.target.value)
    });
  },

  handleDateStartChange: function(e) {
    this.setState({date_start: e.target.value});
  },

  handleDateEndChange: function(e) {
    this.setState({date_end: e.target.value});
  },

  handleDescriptionChange: function(e) {
    this.setState({description: e.target.value});
  },

  submit: function() {
    var scopeReference = this;
    postRequests.addNewItem({item: this.state}).then(function(item) {
      sessionStorage.setItem('itemID', item.item.id);
    }).then(function() {
      scopeReference.handleRedirect();
    })

  },

  handleRedirect: function() {
    this.props.history.pushState(this.state, 'item');
  },

  render: function() {
    return (
      <div className="newListingContainer">
        <h1 className='newListingTitle'>Submit New Listing</h1>
        <form className="newListing" onSubmit={this.submit}>

          <label></label>
          <input className="itemNameInput" placeholder='Item name' type="text" value={this.state.name} onChange={this.handleNameChange}></input>
          <label></label>
          <input className="photoInput" placeholder='photo' placeholder='Item Photo URL' type="text" value={this.state.photo} onChange={this.handlePhotoChange}></input>
          <label></label>
          <br/>
          <input className='newListingInput1' type="date" placeholder='Date First Available' value={this.state.date_start} onChange={this.handleDateStartChange}></input>
          <br/>
          <input className='newListingInput2' type="date" placeholder='Date Last Available' value={this.state.date_end} onChange={this.handleDateEndChange}></input>
          <br/>
          <label></label>
          <input className="priceInput" type="number" placeholder='Price per hour' value={this.state.price} onChange={this.handlePriceChange}></input>
          <br/>
          <label></label>
          <input className="locationInput" type="number" placeholder='ZIP Code' onChange={this.handleZipChange} value={this.state.zip}></input>
          <br/>
          <label></label>
          <textarea className="itemDescriptionInput" rows="5" cols="50" maxlength='50' placeholder='Item Description' type="text" value={this.state.description} onChange={this.handleDescriptionChange}></textarea>

          <button className="newListingButton" type="submit">Submit Listing!</button>

        </form>
      </div>

    )
  }

})

module.exports = MakeNewListing;

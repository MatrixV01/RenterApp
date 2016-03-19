var React = require('react');
var ReactDOM = require('react-dom');
var Router = require('react-router');
var Link = Router.Link
var postRequests = require('../requests/post.js');
var getRequests = require('../requests/get.js');
import { render } from 'react-dom'

var MakeNewListing = React.createClass({

  listItem: function() {}, // post.js has a listNewItem function

  // there should be input fields for item description, price, name, available dates, photo, and location.

  getInitialState: function() {
    return {itemName: '', itemDescription: '', photoURL: '', firstDate: '', lastDate: '', price: '', location: ''};
  },
  handleChange: function(event) {
    this.setState({value: event.target.value});
  },
  handleSubmit: function(e) {
    e.preventDefault();
  },

  render: function() {
    return (
      <div className="newlisting">
        <form className="newListing">
          <label>Item Name:</label>    <input className="itemNameInput"placeholder="Enter Item Name" type="text" value={postRequests.itemName()} onChange={this.handleChange}></input>
        </form>
        <form className="newListing">
          <label>Photo URL</label>    <input className="photoInput"placeholder="Enter Photo URL" type="url" value={postRequests.photoURL()} onChange={this.handleChange}></input>
        </form>
        <form className="newListing">
          <label>Dates Available:</label>
          <br/>
         First Available <input className='newListingInput1' type="date" value={postRequests.firstDate()} onChange={this.handleChange}></input>
          <br/>
         Last Available <input className='newListingInput2' type="date" value={postRequests.lastDate()} onChange={this.handleChange}></input>
        </form>
        <form className="newListing">
          <label>Price:</label>   <input className="priceInput" type="number" value={postRequests.price()}placeholder="Enter Price"></input>
        </form>
        <form className="newListing">
          <label>Location:</label> <input className="locationInput"type="number" value={postRequests.newListLocation()}placeholder="Enter Location"></input>
        </form>
        <form className="newListing">
          <label>Item Description:</label>    <textarea className="itemDescriptionInput"rows="5" cols="50" placeholder="Enter Item Description" type="text" value={postRequests.itemDescription()} onChange={this.handleChange}></textarea>
        </form>
        <form className="newListing">
          <button className="newListingButton" onClick={postRequests.submitNewListing}>SUBMIT NEW LISTING!</button>
        </form>
      </div>
    )
  }

})

module.exports = MakeNewListing;

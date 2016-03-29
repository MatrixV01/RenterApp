var React = require('react');
var ReactDOM = require('react-dom');
var Router = require('react-router');
var Link = Router.Link
var postRequests = require('../requests/post.js');
var getRequests = require('../requests/get.js');
var App = require('../App.jsx');

var SearchResults = React.createClass({

  getInitialState: function() {
    this.handleItemName();
    return {results: null, zip: null}
  },

  handleItemName: function() {
    var zipCode = parseInt(sessionStorage.getItem('GlobalSearchZip'));
    var searchTerm = sessionStorage.getItem('GlobalSearchTerm');

    var promise = postRequests.searchForItem({'searchTerm': searchTerm, 'zipCode': zipCode})

    promise.then((item) => {
      if (!item || item.length === 0) {
        this.setState({results: 'not found', zip: null})
      } else {
        this.setState({results: item, zip: zipCode})
      }
    })
    promise.catch((item) => {
      this.setState({results: 'not found', zip: null})
    })
  },

  handleItemRedirect: function(itemID) {
    var ID = itemID || this.state.itemID;
    sessionStorage.setItem("itemID", ID)
    this.props.history.pushState(this.state, 'item');
  },
  handleItem1Redirect: function() {
    sessionStorage.setItem("itemID", this.state.id1)
    this.props.history.pushState(this.state, 'item');
  },
  handleItem2Redirect: function() {
    sessionStorage.setItem("itemID", this.state.id2)
    this.props.history.pushState(this.state, 'item');
  },
  handleItem3Redirect: function() {
    sessionStorage.setItem("itemID", this.state.id3)
    this.props.history.pushState(this.state, 'item');
  },

  render: function() {
    var wrangled = this;
    var results = this.state.results;
    var zip = this.state.zip;
    if (results !== null && results !== 'not found') {
      return (
        <div>
          <div className="results">Here is what we found near {this.state.zip}:</div>
          <div className="resultsContainer">
            <div className="results">
              {results.map(function(item, index) {
                return <div className="searchResult" onClick={function() {
                  wrangled.handleItemRedirect(item.id)
                }}>
                  <div className="teal">
                    RESULT {index + 1}
                  </div>
                  <div>NAME:
                    <div className="result">{item.name}</div>
                  </div>
                  <div>PRICE:
                    <div className="result">${item.price}.00/Day</div>
                  </div>
                  <div>DESCRIPTION:
                    <div className="result">{item.description}</div>
                  </div>
                </div>
              })}

            </div>
          </div>
        </div>
      )
    } else if (results === 'not found') {
      return <div className="newListing">NO RESULTS FOUND
      </div>;
    } else {
      return <div className="newListing"></div>;
    }
  }
});

module.exports = SearchResults;

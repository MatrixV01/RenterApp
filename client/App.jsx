var React = require('react');
var ReactDOM = require('react-dom');
var GlobalNavBar = require('./components/GlobalNavBar.jsx');
var HomePage = require('./components/HomePage.jsx');
var UserPage = require('./components/UserPage.jsx');
var MakeNewListing = require('./components/MakeNewListing.jsx');
var ItemPage = require('./components/ItemPage.jsx');
var postRequests = require('./requests/post.js');
var getRequests = require('./requests/get.js');
var deleteRequests = require('./requests/delete.js');
var SearchResults = require('./components/SearchResults.jsx');
var css = require("../client/public/css/styles.css")
var Router = require('react-router');
var Link = Router.Link
import {render} from 'react-dom'
import {hashHistory} from 'react-router';
import {RouterContext, match} from 'react-router';

window.globalStateItemID = window.globalStateItemID || null;
window.globalStateUserID = window.globalStateUserID || null;
window.globalStateSessionID = window.globalStateSessionID || null;

var NavBar = React.createElement(GlobalNavBar, {history: {
    hashHistory
  }});

NavBar = ReactDOM.render(NavBar, document.getElementById('globalnavbar'));

class App extends React.Component {
  render() {
    return (
      <div>
        {this.props.children}
      </div>
    )
  }
}

var React = require('react');
var ReactDOM = require('react-dom');
var Router = require('react-router');
import {Link} from 'react-router'
var postRequests = require('../requests/post.js');
var getRequests = require('../requests/get.js');

var HomePage = React.createClass({

  getInitialState: function() {

    return {};

  },

  render: function() {
    return (
      <div className="HomePageMain">
        <div className='HomePageGreeting'>
          <div className='animated bounce'>
            Welcome to
            <span className="red">RNTR</span>!
          </div>
        </div>
      </div>
    );
  }
})

module.exports = HomePage;

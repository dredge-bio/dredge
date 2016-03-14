"use strict";

require('whatwg-fetch');

var Application = require('./components/application.jsx')
  , React = require('react')
  , { render } = require('react-dom')

render(React.createElement(Application), document.getElementById('application'));

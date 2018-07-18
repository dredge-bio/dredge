"use strict";

require('whatwg-fetch');

var Application = require('./components/application')
  , React = require('react')
  , { render } = require('react-dom')

Application = require('./components/setup')

render(React.createElement(Application), document.getElementById('application'));

"use strict";

require('whatwg-fetch');

var React = require('react')
  , Application = require('./views/application.jsx')

React.render(<Application />, document.body);

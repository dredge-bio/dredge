"use strict";

const h = require('react-hyperscript')
    , { typedAsyncActionMiddleware } = require('org-async-actions')
    , { render } = require('react-dom')
    , { applyMiddleware, compose, createStore } = require('redux')
    , { Provider } = require('react-redux')
    , Application = require('./components/Application')
    , reducer = require('./reducer')

function _createStore() {
  return createStore(
    reducer,
    compose(
      applyMiddleware(typedAsyncActionMiddleware()),
      window.devToolsExtension ? window.devToolsExtension() : a => a
    )
  )
}

render(
  h(Provider, { store: _createStore() }, [
    h(Application),
  ]),
  document.getElementById('application')
)

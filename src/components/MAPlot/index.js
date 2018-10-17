"use strict";

const h = require('react-hyperscript')
    , R = require('ramda')
    , React = require('react')
    , { connect } = require('react-redux')
    , LoadingIndicator = require('./Loading')
    , Plot = require('./Plot')

function PlotContainer({
  height,
  width,
  view,
  loading
}) {
  return (
    h('div', {
      style: {
        height: '100%',
        position: 'relative',
      },
    }, [
      height === null ? null : h(Plot, { view, height, width }),
      h(LoadingIndicator, { loading: view.loading }),
    ])
  )
}

module.exports = connect(store => {
  return {
    view: store.currentView,
  }
})(PlotContainer)

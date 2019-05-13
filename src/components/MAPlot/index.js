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
  loading,
  updateOpts,
}) {
  return (
    h('div', {
      style: {
        height: '100%',
        position: 'relative',
      },
    }, [
      height === null ? null : h(Plot, {
        key: view.source.key,
        view,
        height,
        width,
        updateOpts,
      }),
      h(LoadingIndicator, { loading: view.loading }),
    ])
  )
}

module.exports = connect(R.pick(['view']))(PlotContainer)

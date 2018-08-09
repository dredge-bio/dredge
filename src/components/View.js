"use strict";

const h = require('react-hyperscript')
    , R = require('ramda')
    , { connect } = require('react-redux')

function Viewer({ currentView }) {
  return (
    h('div', [
      h('h2', currentView.projectBaseURL),
    ])
  )
}

module.exports = connect(R.pick(['currentView']))(Viewer)

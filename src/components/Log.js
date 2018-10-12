"use strict";

const h = require('react-hyperscript')
    , R = require('ramda')
    , { connect } = require('react-redux')

function Log({ log }) {
  return (
    h('div', [
      h('h2', 'Log'),
      h('pre', { style: { overflow: 'auto' }}, log.join('\n')),
    ])
  )
}

module.exports = connect(R.pick(['log']))(Log)

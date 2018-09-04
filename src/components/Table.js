"use strict";

const h = require('react-hyperscript')
    , { connect } = require('react-redux')

function Table({ view }) {
  const { brushedGenes } = view

  return (
    h('div', [
      h('h1', 'The table'),
      h('pre', {}, [...brushedGenes].join('\n')),
    ])
  )
}

module.exports = connect(state => ({
  view: state.currentView,
}))(Table)

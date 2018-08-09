"use strict";

const h = require('react-hyperscript')
    , R = require('ramda')
    , React = require('react')
    , { connect } = require('react-redux')
    , Action = require('../actions')

function Log({ messages }) {
  return (
    h('pre', messages.join('\n'))
  )
}

function Viewer() {
  return h('div', 'Pick project')
}

class Application extends React.Component {
  componentDidMount() {
    const { dispatch } = this.props

    dispatch(Action.Initialize)
  }

  render() {
    const { initialized, log } = this.props

    return (
      initialized
        ? h(Viewer)
        : h(Log, { messages: log })
    )
  }
}

module.exports = connect(
  R.pick(['initialized', 'log'])
)(Application)

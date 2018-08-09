"use strict";

const h = require('react-hyperscript')
    , R = require('ramda')
    , React = require('react')
    , { connect } = require('react-redux')
    , Action = require('../actions')
    , Log = require('./Log')
    , View = require('./View')
    , ProjectSelector = require('./ProjectSelector')

class Application extends React.Component {
  componentDidMount() {
    const { dispatch } = this.props

    dispatch(Action.Initialize)
  }

  render() {
    const { initialized, currentView } = this.props

    let el

    if (!initialized) {
      el = h(Log)
    } else if (!currentView) {
      el = h(ProjectSelector)
    } else {
      el = h(View)
    }

    return el
  }
}

module.exports = connect(
  R.pick(['initialized', 'currentView'])
)(Application)

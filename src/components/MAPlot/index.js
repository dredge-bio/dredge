"use strict";

const h = require('react-hyperscript')
    , R = require('ramda')
    , React = require('react')
    , { connect } = require('react-redux')
    , LoadingIndicator = require('./Loading')
    , Plot = require('./Plot')

class PlotContainer extends React.Component {
  constructor() {
    super();

    this.state = {
      height: null,
      width: null,
    }
  }

  componentDidMount() {
    this.setState({
      height: this.el.clientHeight,
      width: this.el.clientWidth,
    })
  }

  render() {
    const { height, width } = this.state
        , { view, loading } = this.props

    return (
      h('div', {
        ref: el => {
          this.el = el
        },
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
}

module.exports = connect(store => {
  return {
    view: store.currentView,
  }
})(PlotContainer)

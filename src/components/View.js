"use strict";

const h = require('react-hyperscript')
    , R = require('ramda')
    , React = require('react')
    , styled = require('styled-components').default
    , { connect } = require('react-redux')
    , Left = require('./Left')
    , Right = require('./Right')

const minWidth = 1000
    , minHeight = 600
    , maxRightWidth = 780

const ViewerContainer = styled.div`
  position: relative;
  height: 100%;
`

class Viewer extends React.Component {
  constructor() {
    super()

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
    const { currentView } = this.props

    let { height, width } = this.state
      , rightPanelWidth
      , leftPanelWidth

    if (height !== null) {
      if (width < minWidth) width = minWidth;
      if (height < minHeight) height = minHeight

      rightPanelWidth = width * .58

      if (rightPanelWidth > maxRightWidth) rightPanelWidth = maxRightWidth;

      leftPanelWidth = width - rightPanelWidth
    }

    return (
      h(ViewerContainer, {
        innerRef: el => {
          this.el = el;
        }
      }, height === null ? null : [
        h(Left, {
          width: leftPanelWidth,
          height,
        }),
        h(Right, {
          left: leftPanelWidth,
          width: rightPanelWidth,
          height,
        }),
      ])
    )
  }
}

module.exports = connect(R.pick(['currentView']))(Viewer)

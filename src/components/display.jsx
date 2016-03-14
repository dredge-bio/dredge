"use strict";

// 3 decimal places for pValue, 1 for others

var React = require('react')

function Loading() {
  return <div style={{
    color: 'crimson',
    fontSize: '48px',
    position: 'absolute',
    top: 150,
    left: 16
  }}>Loading...</div>
}


module.exports = React.createClass({
  displayName: 'Display',

  getInitialState() {
    return {
      pValueThreshhold: 1,
      hoveredGene: null,
      focusedGene: null,
    }
  },

  setFocusedGene(focusedGene) {
    this.setState({ focusedGene });
  },

  setHoveredGene(hoveredGene) {
    this.setState({ hoveredGene });
  },

  setPValueThreshhold(pValueThreshhold) {
    this.setState({ pValueThreshhold });
  },

  render: function () {
    var LeftPanel = require('./left/component.jsx')
      , RightPanel = require('./right/component.jsx')
      , { loading } = this.props

    return (
      <div>
        <LeftPanel
            {...this.props}
            {...this.state}
            setPValueThreshhold={this.setPValueThreshhold} />

        <RightPanel
            {...this.props}
            {...this.state}
            setFocusedGene={this.setFocusedGene}
            setHoveredGene={this.setHoveredGene} />
        { loading && <Loading /> }
      </div>
    )
  }
});

"use strict";

var React = require('react')

const PLOT_HEIGHT = 480
    , PLOT_WIDTH = 720

module.exports = React.createClass({
  displayName: 'CellPlot',

  getInitialState: function () {
    return {
      plotData: null
    }
  },

  componentDidUpdate: function (prevProps) {
    if (!this.props.cellA || !this.props.cellB) return;
    if (prevProps.cellA === this.props.cellA && prevProps.cellB === this.props.cellB) return;

    this.fetchPlotData();
  },

  fetchPlotData: function () {
    var cellA = this.props.cellA
      , cellB = this.props.cellB
      , dataFile = `data/geneExpression/${cellA}_${cellB}.txt`

    fetch(dataFile)
      .then(response => {
        // Stop if cells have been changed since fetch
        if (this.props.cellA !== cellA || this.props.cellB !== cellB) return;

        // TODO: make sure of 200
        response
          .text()
          .then(this.processPlotData)
          .then(plotData => this.setState({
            cellA,
            cellB,
            plotData
          }))
      })
  },

  processPlotData: function (text) {
    return text
      .split('\n')
      .slice(1)
      .map(row => row.split('\t'));
  },

  render: function () {
    return (
      <div style={{
        height: PLOT_HEIGHT,
        width: PLOT_WIDTH,
        background: '#f9f9f9',
        border: '1px solid #ccc'
      }}>

      {
        this.state.plotData && (
          <span>Plot data for { this.state.cellA } and { this.state.cellB }</span>
        )
      }

      </div>
    )
  }
});

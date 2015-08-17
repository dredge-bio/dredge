"use strict";

var React = require('react')

module.exports = React.createClass({
  displayName: 'CellPlot',

  getInitialState() {
    return {
      cellA: null,
      cellB: null,
      plotData: null
    }
  },

  componentDidUpdate(prevProps) {
    if (!this.props.cellA || !this.props.cellB) return;
    if (prevProps.cellA === this.props.cellA && prevProps.cellB === this.props.cellB) return;

    this.fetchPlotData();
  },

  // TODO: delete me
  componentDidMount() {
    if (this.props.cellA && this.props.cellB) {
      this.fetchPlotData();
    }
  },

  fetchPlotData() {
    var cellNameMap = require('../cell_name_map.json')
      , cellA = this.props.cellA
      , cellB = this.props.cellB
      , dataFile = `data/geneExpression/${cellNameMap[cellA]}_${cellNameMap[cellB]}.txt`

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

  processPlotData(text) {
    return text
      .split('\n')
      .slice(1)
      .map(row => row.split('\t'))
      .map(([geneName, logFC, logCPM, pValue]) => ({
        geneName,
        logFC: parseFloat(logFC),
        logCPM: parseFloat(logCPM),
        pValue: parseFloat(pValue)
      }));
  },

  render() {
    var Plot = require('./plot.jsx');

    return <Plot {...this.state} />
  }
});

"use strict";

var React = require('react')

module.exports = React.createClass({
  displayName: 'Application',

  getInitialState: function () {
    return {
      cellA: null,
      cellB: null,
      pValueThreshold: 0
    }
  },

  componentDidMount() {
    setTimeout(() => {
      this.setCurrentCell('A', 'EMS');
      this.setCurrentCell('B', 'C');
    }, 0);
  },

  setCurrentCell: function (cellType, cell) {
    this.setState({
      [`cell${cellType}`]: cell
    }, () => {
      if (this.state.cellA && this.state.cellB) {
        this.fetchCellPairData();
      }
    });
  },

  handlePValueChange: function (pValueThreshold) {
    this.setState({ pValueThreshold });
  },

  fetchCellPairData() {
    var cellNameMap = require('../cell_name_map.json')
      , cellA = this.state.cellA
      , cellB = this.state.cellB
      , dataFile = `data/geneExpression/${cellNameMap[cellA]}_${cellNameMap[cellB]}.txt`

    fetch(dataFile)
      .then(response => {
        // Stop if cells have been changed since fetch
        if (this.state.cellA !== cellA || this.state.cellB !== cellB) return;

        // TODO: make sure of 200
        response
          .text()
          .then(this.processPlotData)
          .then(plotData => this.setState({ plotData }))
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

  render: function () {
    var CellSelector = require('./cell_selector.jsx')
      , CellPlot = require('./plot.jsx')
      , CellPValueSelector = require('./p_value_selector.jsx')

    return (
      <main className="m3">
        <CellSelector
          currentCell={this.state.cellA}
          onSelectCell={this.setCurrentCell.bind(null, 'A')} />

        <CellPlot
          cellA={this.state.cellA}
          cellB={this.state.cellB}
          pValueThreshold={this.state.pValueThreshold}
          data={this.state.plotData} />

        <CellPValueSelector
          onPValueChange={this.handlePValueChange}
          data={this.state.plotData} />

        <CellSelector
          currentCell={this.state.cellB}
          onSelectCell={this.setCurrentCell.bind(null, 'B')} />
      </main>
    )
  }
});

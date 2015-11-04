"use strict";

var React = require('react')

function cellFile(cellName, cellMap) {
  return cellMap[cellName] || cellName;
}

module.exports = React.createClass({
  displayName: 'Application',

  getInitialState: function () {
    return {
      cellA: null,
      cellB: null,
      pValueUpper: 1,
      pValueLower: 0
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

  handlePValueChange: function (pValueLower, pValueUpper) {
    this.setState({ pValueLower, pValueUpper });
  },

  filterPlotData() {
    if (!this.state.plotData) return null;

    return this.state.plotData.filter(gene => (
      gene.pValue >= this.state.pValueLower &&
      gene.pValue <= this.state.pValueUpper
    ))

  },

  fetchCellPairData() {
    var cellNameMap = require('../cell_name_map.json')
      , { cellA, cellB } = this.state
      , dataFile

    cellA = cellFile(cellA, cellNameMap);
    cellB = cellFile(cellB, cellNameMap);

    dataFile  = `data/geneExpression/${cellA}_${cellB}.txt`

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

        <div className="gene-plot" style={{ display: 'inline-block' }}>
          <CellPlot
            cellA={this.state.cellA}
            cellB={this.state.cellB}
            pValueThreshold={this.state.pValueThreshold}
            data={this.filterPlotData()} />
        </div>

        <div className="pvalue-selector" style={{ display: 'inline-block' }}>
          <CellPValueSelector
            onPValueChange={this.handlePValueChange}
            data={this.state.plotData} />
        </div>

        <CellSelector
          currentCell={this.state.cellB}
          onSelectCell={this.setCurrentCell.bind(null, 'B')} />
      </main>
    )
  }
});

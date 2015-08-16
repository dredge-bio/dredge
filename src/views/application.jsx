"use strict";

var React = require('react')

module.exports = React.createClass({
  displayName: 'Application',

  getInitialState: function () {
    return {
      cellA: null,
      cellB: null
    }
  },

  setCurrentCell: function (cellType, cell) {
    this.setState({ [`cell${cellType}`]: cell });
  },

  render: function () {
    var CellSelector = require('./cell_selector.jsx')
      , CellPlot = require('./plot.jsx')

    return (
      <main className="m3">
        <h1>Application</h1>

        <CellSelector
          currentCell={this.state.cellA}
          onSelectCell={this.setCurrentCell.bind(null, 'A')} />

        <CellPlot
          cellA={this.state.cellA}
          cellB={this.state.cellB} />

        <CellSelector
          currentCell={this.state.cellB}
          onSelectCell={this.setCurrentCell.bind(null, 'B')} />
      </main>
    )
  }
});

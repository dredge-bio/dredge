"use strict";

var React = require('react')

module.exports = React.createClass({
  displayName: 'Application',

  getInitialState: function () {
    return {
      cellA: 'EMS',
      cellB: 'C'
    }
  },

  setCurrentCell: function (cellType, cell) {
    this.setState({ [`cell${cellType}`]: cell });
  },

  render: function () {
    var CellSelector = require('./cell_selector.jsx')
      , CellPlotContainer = require('./plot_container.jsx')

    return (
      <main className="m3">
        <h1>Application</h1>

        <CellSelector
          currentCell={this.state.cellA}
          onSelectCell={this.setCurrentCell.bind(null, 'A')} />

        <CellPlotContainer
          cellA={this.state.cellA}
          cellB={this.state.cellB} />

        <CellSelector
          currentCell={this.state.cellB}
          onSelectCell={this.setCurrentCell.bind(null, 'B')} />
      </main>
    )
  }
});

"use strict";

var React = require('react')
  , CellFetcher = require('./fetch_cell.jsx')
  , Application


Application = React.createClass({
  displayName: 'Application',

  propTypes: {
    cellA: React.PropTypes.string.isRequired,
    cellB: React.PropTypes.string.isRequired,
    plotData: React.PropTypes.array,
    setCurrentCell: React.PropTypes.func.isRequired
  },

  getInitialState: function () {
    return {
      pValueUpper: 1,
      pValueLower: 0
    }
  },

  handlePValueChange: function (pValueLower, pValueUpper) {
    this.setState({ pValueLower, pValueUpper });
  },

  filterPlotData() {
    var { plotData } = this.props
      , { pValueLower, pValueUpper } = this.state

    if (!plotData) return null;

    return plotData.filter(gene => (
      gene.pValue >= pValueLower &&
      gene.pValue <= pValueUpper
    ));
  },

  render: function () {
    var CellSelector = require('./cell_selector.jsx')
      , CellPlot = require('./plot.jsx')
      , CellPValueSelector = require('./p_value_selector.jsx')
      , { loading, cellA, cellB, plotData, setCurrentCell } = this.props
      , { pValueLower, pValueUpper } = this.state

    return (
      <main className="m3">
        <CellSelector
          currentCell={cellA}
          onSelectCell={setCurrentCell.bind(null, 'A')} />

        <div className="gene-plot" style={{ display: 'inline-block' }}>
          <CellPlot
            cellA={cellA}
            cellB={cellB}
            pValueLower={pValueLower}
            pValueUpper={pValueUpper}
            data={this.filterPlotData()} />
        </div>

        <div className="pvalue-selector" style={{ display: 'inline-block' }}>
          <CellPValueSelector
            onPValueChange={this.handlePValueChange}
            data={plotData} />
        </div>

        <CellSelector
          currentCell={cellB}
          onSelectCell={setCurrentCell.bind(null, 'B')} />

        {
          loading && (
            <div style={{
              color: 'red',
              fontSize: '64px',
              position: 'absolute',
              top: '200px'
            }}>
              LOADING, LOADINGD....
            </div>
          )
        }
      </main>
    )
  }
});

module.exports = CellFetcher(Application);

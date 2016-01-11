"use strict";

// 3 decimal places for pValue, 1 for others

var React = require('react')
  , Immutable = require('immutable')


function Loading() {
  return <div style={{
    color: 'red',
    fontSize: '64px',
    position: 'absolute',
    top: '200px'
  }}>LOADING, LOADINGD....</div>
}

module.exports = React.createClass({
  displayName: 'Display',

  propTypes: {
    cellA: React.PropTypes.string.isRequired,
    cellB: React.PropTypes.string.isRequired,

    pValueUpper: React.PropTypes.number.isRequired,
    pValueLower: React.PropTypes.number.isRequired,

    detailedGenes: React.PropTypes.instanceOf(Immutable.OrderedSet).isRequired,
    savedGenes: React.PropTypes.instanceOf(Immutable.OrderedSet).isRequired,
    savedGeneColorScale: React.PropTypes.func.isRequired,

    plotData: React.PropTypes.instanceOf(Immutable.Map),
    cellGeneMeasures: React.PropTypes.object,
    loading: React.PropTypes.bool.isRequired,

    editSavedGenes: React.PropTypes.func.isRequired,
    setCurrentCell: React.PropTypes.func.isRequired,
    setDetailedGenes: React.PropTypes.func.isRequired
  },

  filterPlotData() {
    var { plotData, pValueLower, pValueUpper } = this.props

    if (!plotData) return null;

    return plotData.filter(gene => (
      gene.pValue >= pValueLower &&
      gene.pValue <= pValueUpper
    ));
  },

  getSavedGenes() {
    var { cellA, cellB, plotData, cellGeneMeasures, savedGeneColorScale, savedGenes } = this.props

    return savedGenes.map(geneName => Immutable.fromJS(plotData.get(geneName)).merge({
      color: savedGeneColorScale(geneName),
      cellARPKMAvg: cellGeneMeasures[cellA][geneName].avg,
      cellARPKMMed: cellGeneMeasures[cellA][geneName].med,
      cellBRPKMAvg: cellGeneMeasures[cellB][geneName].avg,
      cellBRPKMMed: cellGeneMeasures[cellB][geneName].med,
    }));
  },

  getDetailedGenes() {
    var { cellA, cellB, cellGeneMeasures, detailedGenes } = this.props

    return detailedGenes.map(geneData => {
      var geneName = geneData.geneName

      return Immutable.fromJS(geneData).merge({
        cellARPKMAvg: cellGeneMeasures[cellA][geneName].avg,
        cellARPKMMed: cellGeneMeasures[cellA][geneName].med,
        cellBRPKMAvg: cellGeneMeasures[cellB][geneName].avg,
        cellBRPKMMed: cellGeneMeasures[cellB][geneName].med,
      });
    });
  },

  render: function () {
    var CellSelector = require('./cell_selector.jsx')
      , CellPlot = require('./plot.jsx')
      , CellPValueSelector = require('./p_value_selector.jsx')
      , GeneTable = require('./gene_row.jsx')
      , { loading, cellA, cellB, plotData, setCurrentCell } = this.props
      , { cellGeneMeasures, handlePValueChange, setDetailedGenes } = this.props

    return (
      <main className="m3 clearfix">
        <section className="left">
          <CellSelector
            currentCell={cellA}
            onSelectCell={setCurrentCell.bind(null, 'A')} />

          <div className="clearfix">
            <div className="left gene-plot inline-block">
              <CellPlot
                {...this.props}
                data={this.filterPlotData()}
                handleGeneDetailsChange={setDetailedGenes} />
            </div>

            <div className="left pvalue-selector inline-block">
              <CellPValueSelector
                onPValueChange={handlePValueChange}
                data={plotData} />
            </div>

          </div>

          <CellSelector
            currentCell={cellB}
            onSelectCell={setCurrentCell.bind(null, 'B')} />

        </section>

        <section className="left ml2" style={{ width: '1024px' }}>
          {
            plotData && cellGeneMeasures && (
              <GeneTable
                  {...this.props}
                  detailedGenes={this.getDetailedGenes()}
                  savedGenes={this.getSavedGenes()} />
            )
          }
        </section>

        { loading && <Loading /> }
      </main>
    )
  }
});

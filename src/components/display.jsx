"use strict";

// 3 decimal places for pValue, 1 for others

var React = require('react')
  , Immutable = require('immutable')
  , cellNameMap = require('../cell_name_map.json')


function Loading() {
  return <div style={{
    color: 'crimson',
    fontSize: '48px',
    position: 'absolute',
    top: '132px'
  }}>Loading...</div>
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

    plotData: React.PropTypes.instanceOf(Immutable.Map),
    cellGeneMeasures: React.PropTypes.object,
    loading: React.PropTypes.bool.isRequired,

    editSavedGenes: React.PropTypes.func.isRequired,
    setCurrentCell: React.PropTypes.func.isRequired,
    setDetailedGenes: React.PropTypes.func.isRequired
  },

  getInitialState() {
    return {
      hoveredGene: null,
      clickedGene: null,
    }
  },

  handleRowClick(e, clickedGene) {
    if (e.target.nodeName === 'A') return;
    this.setState({ clickedGene });
  },

  handleRowMouseEnter(e, hoveredGene) {
    this.setState({ hoveredGene });
  },

  handleRowMouseLeave() {
    this.setState({ hoveredGene: null });
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
    var { cellA, cellB, plotData, cellGeneMeasures, savedGenes } = this.props

    cellA = cellNameMap[cellA] || cellA;
    cellB = cellNameMap[cellB] || cellB;

    return savedGenes.map(geneName => {
      var data = Immutable.fromJS(plotData.get(geneName) || { geneName })
        , cellAData = (cellGeneMeasures[cellA] || {})[geneName]
        , cellBData = (cellGeneMeasures[cellB] || {})[geneName]

      return data.merge({
        cellARPKMAvg: cellAData ? cellAData.avg : null,
        cellARPKMMed: cellAData ? cellAData.med : null,
        cellBRPKMAvg: cellBData ? cellBData.avg : null,
        cellBRPKMMed: cellBData ? cellBData.med : null
      });
    });
  },

  getDetailedGenes() {
    var { cellA, cellB, cellGeneMeasures, detailedGenes } = this.props

    cellA = cellNameMap[cellA];
    cellB = cellNameMap[cellB];

    return detailedGenes.map(geneData => {
      var geneName = geneData.geneName
        , cellAData = (cellGeneMeasures[cellA] || {})[geneName]
        , cellBData = (cellGeneMeasures[cellB] || {})[geneName]

      return Immutable.fromJS(geneData).merge({
        cellARPKMAvg: cellAData ? cellAData.avg : null,
        cellARPKMMed: cellAData ? cellAData.med : null,
        cellBRPKMAvg: cellBData ? cellBData.avg : null,
        cellBRPKMMed: cellBData ? cellBData.med : null
      });
    });
  },

  render: function () {
    var CellSelector = require('./cell_selector.jsx')
      , CellPlot = require('./plot.jsx')
      , CellPValueSelector = require('./p_value_selector.jsx')
      , GeneTable = require('./table/component.jsx')
      , { loading, cellA, cellB, plotData, setCurrentCell } = this.props
      , { cellGeneMeasures, handlePValueChange, setDetailedGenes } = this.props
      , { clickedGene } = this.state

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
                {...this.state}
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

        <section className="left ml2 flex">
          {
            plotData && cellGeneMeasures && (
              <GeneTable
                  {...this.props}
                  onRowClick={this.handleRowClick}
                  onRowMouseEnter={this.handleRowMouseEnter}
                  onRowMouseLeave={this.handleRowMouseLeave}
                  detailedGenes={this.getDetailedGenes()}
                  savedGenes={this.getSavedGenes()} />
            )
          }

          {
            clickedGene && (
              <div className="bg-white center">
                <h3>{ clickedGene }</h3>
                <img src={`data/cellMaps/${clickedGene}.svg`}></img>
              </div>
            )
          }
        </section>


        { loading && <Loading /> }
      </main>
    )
  }
});

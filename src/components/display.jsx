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
    top: 150,
    left: 16
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
      <div style={{ height: '100vh', width: '100vw' }}>
        <header className="px2 flex flex-justify" style={{
          height: '40px',
          lineHeight: '40px',
          color: 'white',
          backgroundColor: '#370a00',
          borderBottom: '1px solid #ccc',
          boxSizing: 'border-box'
        }}>
          <div style={{
            fontSize: '18px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}>
            Interactive visualizer of differential gene expression in the early <i>C. elegans</i> embryo
          </div>
        
          <div>
            <a href="#" className="bold white">
              About
            </a>
          </div>
        </header>
        <main className="relative" style={{ height: 'calc(100vh - 40px)' }}>

          <section className="flex flex-column" style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '50%',
            height: '100%'
          }}>

            <div style={{ height: 120 }}>
              <CellSelector
                currentCell={cellA}
                onSelectCell={setCurrentCell.bind(null, 'A')} />
            </div>

            <div className="flex-auto flex flex-center flex-stretch">
              <CellPlot
                {...this.props}
                {...this.state}
                data={this.filterPlotData()}
                handleGeneDetailsChange={setDetailedGenes} />

              <CellPValueSelector
                onPValueChange={handlePValueChange}
                data={plotData} />
            </div>

            <div style={{ height: 120 }}>
              <CellSelector
                currentCell={cellB}
                onSelectCell={setCurrentCell.bind(null, 'B')} />
            </div>

          </section>

          <section style={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: '50%',
            height: '100%'
          }}>
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

        </main>
        { loading && <Loading /> }
      </div>
    )
  }
});

"use strict";

// 3 decimal places for pValue, 1 for others

var React = require('react')
  , Immutable = require('immutable')

module.exports = React.createClass({
  displayName: 'Display',

  propTypes: {
    cellA: React.PropTypes.string.isRequired,
    cellB: React.PropTypes.string.isRequired,

    pValueUpper: React.PropTypes.number.isRequired,
    pValueLower: React.PropTypes.number.isRequired,

    detailedGenes: React.instanceOf(Immutable.OrderedSet).isRequired,
    savedGenes: React.instanceOf(Immutable.OrderedSet).isRequired,
    savedGeneColorScale: React.PropTypes.func.isRequired,

    plotData: React.PropTypes.instanceOf(Immutable.Map),
    loading: React.PropTypes.bool.isRequired,

    setCurrentCell: React.PropTypes.func.isRequired
  },

  filterPlotData() {
    var { plotData, pValueLower, pValueUpper } = this.props

    if (!plotData) return null;

    return plotData.filter(gene => (
      gene.pValue >= pValueLower &&
      gene.pValue <= pValueUpper
    ));
  },

  renderSavedGenes() {
    var GeneTable = require('./gene_row.jsx')
      , { plotData, editSavedGenes } = this.props
      , { savedGenes, savedGeneColorScale } = this.state

    return plotData && (
      <GeneTable
          geneNames={savedGenes}
          plotData={plotData}
          renderFirstColumn={gene => (
            <span>
              <a className="red" href="" onClick={editSavedGenes.bind(null, false, gene)}>
                x
              </a>

              <span
                  className="ml2 inline-block"
                  dangerouslySetInnerHTML={{ __html: '&nbsp;' }}
                  style={{
                    background: savedGeneColorScale(gene),
                    width: '1em',
                    height: '1em',
                    lineHeight: '100%'
                  }} />
            </span>
          )} />
      )
  },

  renderGeneDetails() {
    var GeneTable = require('./gene_row.jsx')
      , { plotData, editSavedGenes, detailedGenes } = this.props

    return plotData && (
      <GeneTable
          geneNames={detailedGenes.map(gene => gene.geneName)}
          plotData={plotData}
          renderFirstColumn={gene => (
            <a href="" onClick={editSavedGenes.bind(null, true, gene)}>
              {'<'}
            </a>
          )} />
      )
  },

  render: function () {
    var CellSelector = require('./cell_selector.jsx')
      , CellPlot = require('./plot.jsx')
      , CellPValueSelector = require('./p_value_selector.jsx')
      , { loading, cellA, cellB, plotData, setCurrentCell } = this.props
      , { pValueLower, pValueUpper, savedGenes, savedGeneColorScale } = this.props

    return (
      <main className="m3">
        <CellSelector
          currentCell={cellA}
          onSelectCell={setCurrentCell.bind(null, 'A')} />

        <div className="clearfix">
          <div className="left gene-plot" style={{ display: 'inline-block' }}>
            <CellPlot
              cellA={cellA}
              cellB={cellB}
              pValueLower={pValueLower}
              pValueUpper={pValueUpper}
              savedGenes={savedGenes}
              savedGeneColorScale={savedGeneColorScale}
              handleGeneDetailsChange={details => this.setState({ details })}
              data={this.filterPlotData()} />
          </div>

          <div className="left pvalue-selector" style={{ display: 'inline-block' }}>
            <CellPValueSelector
              onPValueChange={this.handlePValueChange}
              data={plotData} />
          </div>

          <div className="left inline-block ml3">
            <h1>Saved genes</h1>
            { this.renderSavedGenes() }
          </div>

          <div className="left inline-block ml3">
            <h1>GeneDetails</h1>
            { this.renderGeneDetails() }
          </div>
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

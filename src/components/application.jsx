"use strict";

// 3 decimal places for pValue, 1 for others

var d3 = require('d3')
  , React = require('react')
  , Immutable = require('immutable')
  , CellFetcher = require('./fetch_cell.jsx')
  , Application

Application = React.createClass({
  displayName: 'Application',

  propTypes: {
    cellA: React.PropTypes.string.isRequired,
    cellB: React.PropTypes.string.isRequired,
    plotData: React.PropTypes.instanceOf(Immutable.Map),
    setCurrentCell: React.PropTypes.func.isRequired
  },

  getInitialState: function () {
    return {
      pValueUpper: 1,
      pValueLower: 0,
      details: [],
      savedGenes: Immutable.OrderedSet(JSON.parse(localStorage.savedGenes || '[]')),
      savedGeneColorScale: d3.scale.category20(),
      onlySavedGenes: false
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

  handleSaveGene(gene, e) {
    var { savedGenes } = this.state

    e.preventDefault();

    savedGenes = savedGenes.add(gene);
    localStorage.savedGenes = JSON.stringify(savedGenes);
    this.setState({ savedGenes });
  },

  handleRemoveSavedGene(gene, e) {
    var { savedGenes } = this.state

    e.preventDefault();

    savedGenes = savedGenes.delete(gene);
    localStorage.savedGenes = JSON.stringify(savedGenes);
    this.setState({ savedGenes });
  },

  renderSavedGenes() {
    var GeneTable = require('./gene_row.jsx')
      , { plotData } = this.props
      , { savedGenes, savedGeneColorScale } = this.state

    return plotData && (
      <GeneTable
          geneNames={savedGenes}
          plotData={plotData}
          renderFirstColumn={gene => (
            <span>
              <a className="red" href="" onClick={this.handleRemoveSavedGene.bind(null, gene)}>
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
      , { plotData } = this.props
      , { details } = this.state

    return plotData && (
      <GeneTable
          geneNames={details.map(gene => gene.geneName)}
          plotData={plotData}
          renderFirstColumn={gene => (
            <a href="" onClick={this.handleSaveGene.bind(null, gene)}>
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
      , { pValueLower, pValueUpper, savedGenes, savedGeneColorScale } = this.state

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

module.exports = CellFetcher(Application);

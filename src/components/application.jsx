"use strict";

/* eslint no-alert:0 */

var React = require('react')
  , Immutable = require('immutable')


module.exports = React.createClass({
  displayName: 'Application',

  getInitialState() {
    return {
      cellA: 'EMS',
      cellB: 'C',

      pValueUpper: 1,
      pValueLower: 0,

      savedGenes: Immutable.OrderedSet(JSON.parse(localStorage.savedGenes || '[]')),
      detailedGenes: Immutable.OrderedSet(),

      savedGeneColorScale: d3.scale.category20(),

      fetchingCells: null,

      plotData: null,

      loading: false
    }
  },

  componentDidMount() {
    setTimeout(this.setCurrentCell, 0);
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


  handlePValueChange: function (pValueLower, pValueUpper) {
    this.setState({ pValueLower, pValueUpper });
  },

  editSavedGenes(add, gene, e) {
    var { savedGenes } = this.state

    e.preventDefault();

    savedGenes = savedGenes[add ? 'add' : 'delete'](gene);
    localStorage.savedGenes = JSON.stringify(savedGenes);
    this.setState({ savedGenes });
  },

  setCurrentCell(cellType, cell) {
    var fetchCellPair = require('../utils/fetch_cell_pair')
      , processCellData = require('../utils/process_cell_data')
      , { cellA, cellB } = this.state

    if (cellType === 'A') {
      cellA = cell;
    } else if (cellType === 'B') {
      cellB = cell;
    }

    this.setState({
      loading: true,
      fetchingCells: cellA + cellB
    });

    fetchCellPair(cellA, cellB)
      .then(null, e => { this.setState({ loading: false }); throw e; })
      .then(response => {
        var { fetchingCells } = this.state

        // Stop if cells have been changed since fetch started
        if (fetchingCells !== (cellA + cellB)) return;

        // TODO: make sure of 200
        response.text()
          .then(processCellData)
          .then(plotData => {
            // Set the cell/plot data immediately, but let the loading
            // message stick around for a little bit.
            setTimeout(() => this.setState({ loading: false }), 300);
            this.setState({ cellA, cellB, plotData });
          });
      })
      .catch(() => alert('SOPHIE IT\'S AN ERROR IM SORRY'))
  },

  render() {
    return (
      <Component
          {...this.state}
          editSavedGenes={this.editSavedGenes}
          setCurrentCell={this.setCurrentCell} />
    )
  }
});

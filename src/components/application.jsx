"use strict";

/* eslint no-alert:0 */

var d3 = require('d3')
  , React = require('react')
  , Immutable = require('immutable')
  , db = require('../db')()

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

      initializing: true,
      loadingCells: false
    }
  },

  componentDidMount() {
    setTimeout(this.setCurrentCell, 0);
    db.datasets.get('cellGeneMeasures', ({ blob }) => {
      var reader = new FileReader();

      reader.onloadend = () => {
        this.setState({
          initializing: false,
          cellGeneMeasures: JSON.parse(reader.result)
        });
      };

      reader.onerror = err => { throw err; }

      reader.readAsText(blob);
    });
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

  setDetailedGenes(genes) {
    this.setState({ detailedGenes: Immutable.OrderedSet(genes) });
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

    this.setState({ detailedGenes: Immutable.OrderedSet([]) })

    this.setState({
      loadingCells: true,
      fetchingCells: cellA + cellB
    });

    return fetchCellPair(cellA, cellB)
      .then(null, e => { this.setState({ loadingCells: false }); throw e; })
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
            setTimeout(() => this.setState({ loadingCells: false }), 300);
            this.setState({ cellA, cellB, plotData });
          });
      })
      .catch(() => alert('SOPHIE IT\'S AN ERROR IM SORRY'))
  },

  render() {
    var Display = require('./display.jsx')
      , { loadingCells, initializing } = this.state

    return (
      <Display
          {...this.state}
          loading={loadingCells || initializing }
          editSavedGenes={this.editSavedGenes}
          handlePValueChange={this.handlePValueChange}
          setDetailedGenes={this.setDetailedGenes}
          setCurrentCell={this.setCurrentCell} />
    )
  }
});

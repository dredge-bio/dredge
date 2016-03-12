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
      // The selected cells
      cellA: 'EMS',
      cellB: 'C',

      // P-Value critical limit (TODO: change into one threshhold value)
      pValueUpper: 1,
      pValueLower: 0,

      // Genes in the watch list
      savedGenes: Immutable.OrderedSet(JSON.parse(localStorage.savedGenes || '[]')),

      // Genes brushed in the table
      detailedGenes: Immutable.OrderedSet(),


      // The gene currently "focused" by the application (e.g. the heat map is
      // showing)
      focusedGene: null,

      // The pair of cells currently being fetched. Not to be used by
      // anything but this component, to make sure things aren't fetched
      // twice.
      fetchingCells: null,

      // The fetched plot data from the file fetched for cellA-cellB
      plotData: null,

      // Whether the application is initializing. Will be true until the cell-
      // gene data is fetched.
      initializing: true,

      // Whether cell-pair data are currently being fetched
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

  setFocusedGene(focusedGene) {
    this.setState({ focusedGene });
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
      .catch(e => {
        alert('error!');
        console.error(e);
      })
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
          setCurrentCell={this.setCurrentCell}
          setFocusedGene={this.setFocusedGene} />
    )
  }
});

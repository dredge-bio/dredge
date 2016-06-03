"use strict";

/* eslint no-alert:0 */

var React = require('react')
  , Immutable = require('immutable')
  , fetchingCells


module.exports = React.createClass({
  displayName: 'Application',

  propTypes: {
    cellGeneExpressionData: React.PropTypes.object.isRequired
  },

  getInitialState() {
    var localSavedGenes = JSON.parse(localStorage.savedGeneNames || '[]');

    return {
      // The selected cells
      cellA: 'EMS',
      cellB: 'C',

      // Genes in the watch list
      savedGeneNames: Immutable.OrderedSet(localSavedGenes),

      // Genes brushed in the table
      brushedGeneNames: Immutable.OrderedSet(),


      // The pair of cells currently being fetched. Not to be used by
      // anything but this component, to make sure things aren't fetched
      // twice.
      fetchingCells: null,

      // The fetched plot data from the file fetched for cellA-cellB
      pairwiseComparisonData: null,

      // Whether cell-pair data are currently being fetched
      loading: false
    }
  },

  componentDidMount() {
    setTimeout(this.setCurrentCell, 0);
  },

  setBrushedGenes(brushedGeneNames) {
    this.setState({ brushedGeneNames });
  },

  setSavedGenes(savedGeneNames) {
    localStorage.savedGeneNames = JSON.stringify(savedGeneNames);
    this.setState({ savedGeneNames });
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
      brushedGeneNames: Immutable.OrderedSet([])
    })

    fetchingCells = cellA + cellB;

    return fetchCellPair(cellA, cellB)
      .then(null, e => { this.setState({ loading: false }); throw e; })
      .then(response => {
        // Stop if cells have been changed since fetch started
        if (fetchingCells !== (cellA + cellB)) return;

        // TODO: make sure of 200
        response.text()
          .then(processCellData)
          .then(pairwiseComparisonData => {
            // Set the cell/plot data immediately, but let the loading
            // message stick around for a little bit.
            setTimeout(() => this.setState({ loading: false }), 200);
            this.setState({ cellA, cellB, pairwiseComparisonData });
          });
      })
      .catch(e => {
        alert('error!');
        console.error(e);
      })
  },

  render() {
    var SortedData = require('./sorted_data.jsx')

    return (
      <SortedData
          {...this.props}
          {...this.state}
          setBrushedGenes={this.setBrushedGenes}
          setSavedGenes={this.setSavedGenes}
          setCurrentCell={this.setCurrentCell} />
    )
  }
});

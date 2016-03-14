"use strict";

var React = require('react')
  , Immutable = require('immutable')
  , cellNameMap = require('../cell_name_map.json')

function sortGenes(set, sortBy, sortOrder) {
  var sorted

  sorted = sortBy === 'geneName' ?
    set.sortBy(gene => gene.get('geneName').toLowerCase()) :
    set.sortBy(gene => gene.get(sortBy));

  if (sortOrder === 'asc') sorted = sorted.reverse();

  return sorted
}

module.exports = React.createClass({
  displayName: 'SortedData',

  getInitialState() {
    return {
      sortBy: 'geneName',
      sortOrder: 'desc',
    }
  },

  toggleSort(field) {
    var { sortBy, sortOrder } = this.state

    if (field === sortBy) {
      sortOrder = sortOrder === 'asc' ? 'desc' : 'asc';
    } else {
      sortBy = field;
      sortOrder = 'desc';
    }

    this.setState({ sortBy, sortOrder })
  },

  getGenes(geneNames) {
    var { pairwiseComparisonData, cellGeneExpressionData, cellA, cellB } = this.props

    cellA = cellNameMap[cellA] || cellA;
    cellB = cellNameMap[cellB] || cellB;

    return geneNames.map(geneName => {
      var data = Immutable.fromJS(pairwiseComparisonData.get(geneName) || { geneName })
        , cellAData = (cellGeneExpressionData[cellA] || {})[geneName]
        , cellBData = (cellGeneExpressionData[cellB] || {})[geneName]

      return data.merge({
        cellARPKMAvg: cellAData ? cellAData.avg : null,
        cellARPKMMed: cellAData ? cellAData.med : null,
        cellBRPKMAvg: cellBData ? cellBData.avg : null,
        cellBRPKMMed: cellBData ? cellBData.med : null
      });
    })
  },

  getSortedGenes(geneNames) {
    var { sortBy, sortOrder } = this.state
    return sortGenes(this.getGenes(geneNames), sortBy, sortOrder)
  },

  render() {
    var Display = require('./display.jsx')
      , { savedGeneNames, brushedGeneNames } = this.props
      , { pairwiseComparisonData, cellGeneExpressionData } = this.props
      , ready = pairwiseComparisonData && cellGeneExpressionData

    return (
      <Display
          {...this.props}
          {...this.state}
          toggleSort={this.toggleSort}
          brushedGenes={ready && this.getSortedGenes(brushedGeneNames)}
          savedGenes={ready && this.getSortedGenes(savedGeneNames)} />
    )
  }
});

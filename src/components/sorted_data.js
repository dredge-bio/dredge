"use strict"

const h = require('react-hyperscript')
    , React = require('react')
    , Immutable = require('immutable')
    , cellNameMap = require('../cell_name_map.json')
    , Display = require('./display')

function sortGenes(set, sortBy, sortOrder) {
  return set.sort((geneA, geneB) => {
    let a = geneA.get(sortBy)
      , b = geneB.get(sortBy)

    if (sortBy === 'geneName') {
      a = a.toLowerCase()
      b = b.toLowerCase()
    }

    if (a === b) return 0

    if (a == null) return 1
    if (b == null) return -1

    return (a < b ? 1 : -1) * (sortOrder === 'asc' ? 1 : -1)
  })
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
    let { sortBy, sortOrder } = this.state

    if (field === sortBy) {
      sortOrder = sortOrder === 'asc' ? 'desc' : 'asc'
    } else {
      sortBy = field
      sortOrder = 'desc'
    }

    this.setState({ sortBy, sortOrder })
  },

  getGenes(geneNames) {
    const { pairwiseComparisonData, cellGeneExpressionData } = this.props

    let { cellA, cellB } = this.props

    cellA = cellNameMap[cellA] || cellA
    cellB = cellNameMap[cellB] || cellB

    return geneNames.map(geneName => {
      const data = Immutable.fromJS(pairwiseComparisonData.get(geneName) || { geneName }),
          cellAData = (cellGeneExpressionData[cellA] || {})[geneName],
          cellBData = (cellGeneExpressionData[cellB] || {})[geneName]

      if (data.size === 1 && !cellAData && !cellBData) {
        const errMessg = `no data for gene "${geneName}"`
        /* eslint no-console:0 */
        console.error(errMessg)

        throw new Error(errMessg)
      }

      return data.merge({
        cellARPKMAvg: cellAData ? cellAData.avg : null,
        cellARPKMMed: cellAData ? cellAData.med : null,
        cellBRPKMAvg: cellBData ? cellBData.avg : null,
        cellBRPKMMed: cellBData ? cellBData.med : null,
      })
    })
  },

  getSortedGenes(geneNames) {
    const { sortBy, sortOrder } = this.state
    return sortGenes(this.getGenes(geneNames), sortBy, sortOrder)
  },

  getSavedGenes() {
    const { savedGeneNames } = this.props

    try {
      return this.getSortedGenes(savedGeneNames)
    } catch (e) {
      localStorage.clear()
      return Immutable.OrderedSet()
    }
  },

  render() {
    const {
      brushedGeneNames,
      pairwiseComparisonData,
      cellGeneExpressionData,
    } = this.props

    const ready = pairwiseComparisonData && cellGeneExpressionData

    return h(Display, Object.assign({}, this.props, this.state, {
      toggleSort: this.toggleSort,
      brushedGenes: ready && this.getSortedGenes(brushedGeneNames),
      savedGenes: ready && this.getSavedGenes() }))
  },
})

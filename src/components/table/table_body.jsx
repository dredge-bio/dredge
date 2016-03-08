"use strict";

var React = require('react')
  , Immutable = require('immutable')


function dashesOrFixed(number, places=2) {
  return number == null ? '--' : number.toFixed(places)
}


function sortGenes(set, sortBy, sortOrder) {
  var sorted

  sorted = sortBy === 'geneName' ?
    set.sortBy(gene => gene.get('geneName').toLowerCase()) :
    set.sortBy(gene => gene.get(sortBy));

  if (sortOrder === 'asc') sorted = sorted.reverse();

  return sorted
}


function GeneRow({ saved, geneData, savedGenes, editSavedGenes, onRowClick }) {
  var geneName = geneData.get('geneName')
    , data = geneData.toJS()
    , firstColumn

  if (saved) {
    firstColumn = (
      <a className="red" href="" onClick={editSavedGenes.bind(null, false, geneName)}>
        x
      </a>
    )
  } else if (!saved && !savedGenes.has(geneData)) {
    firstColumn = (
      <a href="" onClick={editSavedGenes.bind(null, true, geneName)}>
        {'<'}
      </a>
    )
  }


  return (
    <tr onClick={e => onRowClick(e, geneName)}>
      <td>{ firstColumn }</td>
      <td>{ geneName }</td>
      <td>{ dashesOrFixed(data.pValue, 3) }</td>
      <td>{ dashesOrFixed(data.logCPM) }</td>
      <td>{ dashesOrFixed(data.logFC) }</td>
      <td>{ dashesOrFixed(data.cellARPKMAvg) }</td>
      <td>{ dashesOrFixed(data.cellARPKMMed) }</td>
      <td>{ dashesOrFixed(data.cellBRPKMAvg) }</td>
      <td>{ dashesOrFixed(data.cellBRPKMMed) }</td>
    </tr>
  )
}

module.exports = React.createClass({
  displayName: 'GeneTable',

  propTypes: {
    savedGenes: React.PropTypes.instanceOf(Immutable.OrderedSet).isRequired,
    detailedGenes: React.PropTypes.instanceOf(Immutable.OrderedSet).isRequired,
    cellGeneMeasures: React.PropTypes.object.isRequired,
    editSavedGenes: React.PropTypes.func.isRequired,
  },

  render() {
    var { savedGenes, detailedGenes, sortBy, sortOrder } = this.props

    return (
      <tbody>
        {
          sortGenes(savedGenes, sortBy, sortOrder).map(geneData =>
            <GeneRow
                key={'saved' + geneData.get('geneName')}
                saved={true}
                geneData={geneData}
                {...this.props} />
          )
        }

        {
          sortGenes(detailedGenes, sortBy, sortOrder).map(geneData =>
            <GeneRow
                key={'detailed' + geneData.get('geneName')}
                saved={false}
                geneData={geneData}
                {...this.props} />
          )
        }
      </tbody>
    )
  }
})

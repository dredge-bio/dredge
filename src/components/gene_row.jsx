"use strict";

var React = require('react')
  , Immutable = require('immutable')

const tableFields = [
  ['geneName', 'Gene'],
  ['pValue', 'P-Value'],
  ['logCPM', 'Log CPM'],
  ['logFC', 'Log FC'],
  ['cellARPKMAvg', 'Mean RPKM'],
  ['cellARPKMMed', 'Median RPKM'],
  ['cellBRPKMAvg', 'Mean RPKM'],
  ['cellBRPKMMed', 'Median RPKM'],
]


function SavedGeneFirstColumn({ handleClick, color }) {
  return (
    <span className="absolute" style={{ left: 0 }}>
      <a className="red" href="" onClick={handleClick}>x</a>
      <span
          className="ml2 inline-block"
          dangerouslySetInnerHTML={{ __html: '&nbsp;' }}
          style={{
            background: color,
            width: '1em',
            height: '1em',
            lineHeight: '100%'
          }} />
    </span>
  )
}

function UnsavedGeneFirstColumn({ handleClick }) {
  return (
    <span className="absolute" style={{ left: 0 }}>
      <a href="" onClick={handleClick}>{'<'}</a>
    </span>
  )
}



function GeneRow({ saved, geneData, editSavedGenes }) {
  var FirstColumn = saved ? SavedGeneFirstColumn : UnsavedGeneFirstColumn
    , geneName = geneData.get('geneName')
    , firstColumn
    , className

  firstColumn = React.createElement(FirstColumn, {
    geneName,
    color: geneData.color,
    handleClick: editSavedGenes.bind(null, !saved, geneName)
  });

  className = `GeneRow--${saved ? 'saved' : 'detailed'}`;

  if (!geneData) {
    return (
      <tr className={className}>
        <td className="relative">
          { firstColumn }
          { geneName }
        </td>
        <td colSpan={6} className="muted"><em>No measurement</em></td>
      </tr>
    )
  }

  return (
    <tr className={className}>
      <td className="relative">
        { firstColumn }
        { geneName }
      </td>
      <td>{ geneData.get('pValue').toFixed(3) }</td>
      <td>{ geneData.get('logCPM').toFixed(2) }</td>
      <td>{ geneData.get('logFC').toFixed(2) }</td>
      <td>{ geneData.get('cellARPKMAvg').toFixed(2) }</td>
      <td>{ geneData.get('cellARPKMMed').toFixed(2) }</td>
      <td>{ geneData.get('cellBRPKMAvg').toFixed(2) }</td>
      <td>{ geneData.get('cellBRPKMMed').toFixed(2) }</td>
    </tr>
  )
}

module.exports = React.createClass({
  displayName: 'GeneTable',

  propTypes: {
    savedGenes: React.PropTypes.instanceOf(Immutable.OrderedSet).isRequired,
    detailedGenes: React.PropTypes.instanceOf(Immutable.OrderedSet).isRequired,

    cellA: React.PropTypes.string.isRequired,
    cellB: React.PropTypes.string.isRequired,
    cellGeneMeasures: React.PropTypes.object.isRequired,

    editSavedGenes: React.PropTypes.func.isRequired
  },

  getInitialState() {
    return {
      sortBy: 'geneName',
      sortOrder: 'desc'
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

  renderTableHeaders() {
    var { sortBy, sortOrder } = this.state

    return tableFields.map(([field, label]) =>
      <th key={field}
          style={{ cursor: 'pointer' }}
          onClick={this.toggleSort.bind(null, field)}>
        <span>
          { label }
          { sortBy === field && (sortOrder === 'asc' ? ' ▴' : ' ▾') }
        </span>
      </th>
    )
  },

  sortGenes(set) {
    var { sortBy, sortOrder } = this.state
      , sorted

    sorted = sortBy === 'geneName' ?
      set.sortBy(gene => gene.get('geneName').toLowerCase()) :
      set.sortBy(gene => gene.get(sortBy))

    if (sortOrder === 'asc') sorted = sorted.reverse();

    return sorted
  },

  render() {
    var { cellA, cellB, savedGenes, detailedGenes, editSavedGenes } = this.props

    return (
      <div style={{
        position: 'relative',
        paddingTop: '72px',
        overflowY: 'hidden',
        overflowX: 'hidden'
      }}>
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '72px',
          background: '#f0f0f0'
        }} />
        <div style={{
          height: '764px',
          overflowY: 'scroll',
        }}>
          <table className="table GeneDetailsTable" style={{
            borderCollapse: 'collapse',
            tableLayout: 'fixed'
          }}>
            <thead>
              <tr className="cell-rpkm-headers">
                <th colSpan={4} />
                <th colSpan={2}><span>{ cellA }</span></th>
                <th colSpan={2}><span>{ cellB }</span></th>
              </tr>
              <tr className="gene-headers">{ this.renderTableHeaders() }</tr>
            </thead>
            <tbody>
              {
                this.sortGenes(savedGenes).map(geneData =>
                  <GeneRow
                      key={'saved' + geneData.get('geneName')}
                      saved={true}
                      geneData={geneData}
                      editSavedGenes={editSavedGenes} />
                )
              }

              {
                this.sortGenes(detailedGenes).map(geneData =>
                  <GeneRow
                      key={'detailed' + geneData.get('geneName')}
                      saved={false}
                      geneData={geneData}
                      editSavedGenes={editSavedGenes} />
                )
              }
            </tbody>
          </table>
        </div>
      </div>
    )
  }
})

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


function SavedGeneFirstColumn({ handleClick }) {
  return (
    <span className="absolute" style={{ left: 0 }}>
      <a className="red" href="" onClick={handleClick}>x</a>
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

function dashesOrFixed(number, places=2) {
  return number == null ? '--' : number.toFixed(places)
}


function GeneRow({ saved, geneData, editSavedGenes, onRowMouseEnter, onRowMouseLeave }) {
  var FirstColumn = saved ? SavedGeneFirstColumn : UnsavedGeneFirstColumn
    , geneName = geneData.get('geneName')
    , data = geneData.toJS()
    , firstColumn
    , className


  firstColumn = React.createElement(FirstColumn, {
    geneName,
    handleClick: editSavedGenes.bind(null, !saved, geneName)
  });

  className = `GeneRow--${saved ? 'saved' : 'detailed'}`;

  onRowMouseEnter = onRowMouseEnter || (() => null);
  onRowMouseLeave = onRowMouseLeave || (() => null);

  return (
    <tr
        className={className}
        onMouseEnter={e => onRowMouseEnter(e, geneName)}
        onMouseLeave={e => onRowMouseLeave(e, geneName)}>
      <td className="relative">
        { firstColumn }
        { geneName }
      </td>

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

    cellA: React.PropTypes.string.isRequired,
    cellB: React.PropTypes.string.isRequired,
    cellGeneMeasures: React.PropTypes.object.isRequired,

    editSavedGenes: React.PropTypes.func.isRequired,
    onRowMouseEnter: React.PropTypes.func,
    onRowMouseLeave: React.PropTypes.func,
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
    var { cellA, cellB, savedGenes, detailedGenes, editSavedGenes, onRowMouseEnter, onRowMouseLeave } = this.props

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
          height: '720px',
          overflowY: 'scroll',
        }}>
          <table className="table GeneDetailsTable" style={{
            fontSize: '12px',
            borderCollapse: 'collapse',
            tableLayout: 'fixed'
          }}>
            <thead style={{ fontSize: '12px' }}>
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
                      onRowMouseEnter={onRowMouseEnter}
                      onRowMouseLeave={onRowMouseLeave}
                      editSavedGenes={editSavedGenes} />
                )
              }

              {
                this.sortGenes(detailedGenes).map(geneData =>
                  <GeneRow
                      key={'detailed' + geneData.get('geneName')}
                      saved={false}
                      geneData={geneData}
                      onRowMouseEnter={onRowMouseEnter}
                      onRowMouseLeave={onRowMouseLeave}
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

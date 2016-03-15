"use strict";

var React = require('react')
  , formatCellName = require('../../../utils/format_cell_name')
  , TableHeader


const FIELDS = [
  ['geneName', 'Gene'],
  ['pValue', 'P-Value'],
  ['logCPM', 'Log CPM'],
  ['logFC', 'Log FC'],
  ['cellARPKMAvg', 'Mean RPKM'],
  ['cellARPKMMed', 'Med. RPKM'],
  ['cellBRPKMAvg', 'Mean RPKM'],
  ['cellBRPKMMed', 'Med. RPKM'],
]


TableHeader = ({
  cellA,
  cellB,
  sortBy,
  sortOrder,
  toggleSort,
  COLUMN_WIDTHS,
  COLUMN_STARTS,
  COLUMN_PL=12,
  HEADER_HEIGHT
}) => (
  <div style={{
    height: HEADER_HEIGHT,
    background: '#f0f0f0'
  }}>
    <div style={{
      position: 'relative',
      height: HEADER_HEIGHT / 2,
      borderBottom: '#ccc',
      boxSizing: 'border-box'
    }}>
      {
        [cellA, cellB].map((cellName, i) =>
          <span
              key={`${cellName}-${i}`}
              style={{
                position: 'absolute',
                left: COLUMN_STARTS[5 + (2 * i)] + COLUMN_PL,
                fontWeight: "bold"
              }}>
            { formatCellName(cellName) }
          </span>
        )
      }
    </div>
    <div style={{
      position: 'relative',
      height: HEADER_HEIGHT / 2,
      borderBottom: '#ccc',
      boxSizing: 'border-box'
    }}>
      {
        FIELDS.map(([field, label], i) =>
          <span
              key={field}
              onClick={toggleSort.bind(null, field)}
              style={{
                position: 'absolute',
                top: 0,
                bottom: 0,
                left: COLUMN_STARTS[i + 1] + COLUMN_PL,
                width: COLUMN_WIDTHS[i + 1] - COLUMN_PL,
                fontWeight: "bold",
                fontSize: "14px",
                cursor: 'pointer'
              }}>
            {
              label + (
                sortBy !== field ? '' :
                  sortOrder === 'asc' ? ' ▴' : ' ▾'
                )
            }
          </span>
        )
      }
    </div>
  </div>
)


TableHeader.propTypes = {
  cellA: React.PropTypes.string.isRequired,
  cellB: React.PropTypes.string.isRequired,
  sortBy: React.PropTypes.string.isRequired,
  sortOrder: React.PropTypes.oneOf(['asc', 'desc']).isRequired,
  toggleSort: React.PropTypes.func.isRequired
}


module.exports = TableHeader;

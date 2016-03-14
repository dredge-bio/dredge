"use strict";

var React = require('react')
  , consts = require('./consts')
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


TableHeader = ({ cellA, cellB, sortBy, sortOrder, toggleSort }) => (
  <g>
    <rect
        x="0"
        y="0"
        width={consts.TABLE.WIDTH}
        height={consts.TABLE_HEADER.HEIGHT * 2}
        fill={consts.TABLE_HEADER.BGCOLOR} />

    <g>
      { [cellA, cellB].map((cellName, i) =>
          <text
              key={`${cellName}-${i}`}
              x={consts.TABLE.COLUMN_STARTS[5 + (2 * i)] + consts.TABLE_HEADER.PL}
              y={consts.TABLE_HEADER.HEIGHT * .5}
              textAnchor="start"
              style={{
                fontWeight: "bold",
                dominantBaseline: "middle"
              }}>
            { formatCellName(cellName) }
          </text>
      )}
    </g>

    <line
        x1={consts.TABLE.COLUMN_STARTS[5]}
        x2={consts.TABLE.WIDTH}
        y1={consts.TABLE_HEADER.HEIGHT}
        y2={consts.TABLE_HEADER.HEIGHT}
        stroke="#ccc" />

    <g>
      {
        FIELDS.map(([field, label], i) =>
          <g key={field}>
            <text
                x={consts.TABLE.COLUMN_STARTS[i + 1] + consts.TABLE_HEADER.PL}
                y={consts.TABLE_HEADER.HEIGHT * 1.5}
                textAnchor="start"
                style={{
                  fontWeight: "bold",
                  fontSize: "14px",
                  dominantBaseline: "middle"
                }}>
              {
                label + (
                  sortBy !== field ? '' :
                    sortOrder === 'asc' ? ' ▴' : ' ▾'
                  )
              }
            </text>
            <rect
                fill="transparent"
                onClick={toggleSort.bind(null, field)}
                style={{ cursor: 'pointer' }}
                x={consts.TABLE.COLUMN_STARTS[i + 1]}
                y={consts.TABLE_HEADER.HEIGHT}
                width={consts.TABLE.COLUMN_WIDTHS[i + 1]}
                height={consts.TABLE_HEADER.HEIGHT} />
          </g>
        )
      }
    </g>
  </g>
)


TableHeader.propTypes = {
  cellA: React.PropTypes.string.isRequired,
  cellB: React.PropTypes.string.isRequired,
  sortBy: React.PropTypes.string.isRequired,
  sortOrder: React.PropTypes.oneOf(['asc', 'desc']).isRequired,
  toggleSort: React.PropTypes.func.isRequired
}


module.exports = TableHeader;

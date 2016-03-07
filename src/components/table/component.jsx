"use strict";

var React = require('react')
  , consts = require('./consts')


function TableHeader({ cellA, cellB }) {
  return (
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
              { cellName }
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
          [
            null,
            'Gene name',
            'P-Value',
            'Log CPM',
            'Log FC',
            'Mean RPKM',
            'Med. RPKM',
            'Mean RPKM',
            'Med. RPKM'
          ].map((label, i) =>
            <text
                key={i}
                x={consts.TABLE.COLUMN_STARTS[i] + consts.TABLE_HEADER.PL}
                y={consts.TABLE_HEADER.HEIGHT * 1.5}
                textAnchor="start"
                style={{
                  fontWeight: "bold",
                  fontSize: "14px",
                  dominantBaseline: "middle"
                }}>
              { label }
            </text>
          )
        }
      </g>
    </g>
  )
}

function TableBody({ detailedGenes }) {
  return (
    <foreignObject
        x={0}
        y={consts.TABLE_HEADER.HEIGHT * 2}
        width={consts.TABLE.WIDTH}
        height={consts.TABLE_BODY.HEIGHT}>
      <div style={{
        minHeight: '100%',
        maxHeight: consts.TABLE_BODY.HEIGHT,
        overflowY: 'scroll',
        overflowX: 'hidden'
      }}>
        <table xmlns="http://www.w3.org/1999/xhtml" style={{ fontSize: '12px', tableLayout: 'fixed' }}>

          <colgroup>
            { consts.TABLE.COLUMN_WIDTHS.map((width, i) =>
              <col key={i} width={width} />
            )}
          </colgroup>

          <tbody>
            {
              detailedGenes.map(gene =>
                <tr key={gene.get('geneName')}>
                  <td>.</td>
                  <td>{ gene.get('geneName') }</td>
                  <td>{ gene.get('pValue') }</td>
                  <td>{ gene.get('logCPM') }</td>
                  <td>{ gene.get('logFC') }</td>
                  <td>{ gene.get('cellARPKMAvg') }</td>
                  <td>{ gene.get('cellARPKMMed') }</td>
                  <td>{ gene.get('cellBRPKMAvg') }</td>
                  <td>{ gene.get('cellBRPKMMed') }</td>
                </tr>
              )
            }
          </tbody>
        </table>
      </div>
    </foreignObject>
  )
}

module.exports = React.createClass({
  displayName: 'SVGGeneTable',

  propTypes: {
    // height: React.PropTypes.integer.isRequired
  },

  render() {
    return (
      <svg className="border"
          width={consts.TABLE.WIDTH}
          height={consts.TABLE.HEIGHT}
          viewBox={`0 0 ${consts.TABLE.WIDTH} ${consts.TABLE.HEIGHT}`}>

        <rect
            x="0"
            y="0"
            width={consts.TABLE.WIDTH}
            height={consts.TABLE.HEIGHT}
            fill="#fff" />

        <TableHeader {...this.props} />

        <TableBody {...this.props} />

        <g>
          {
            consts.TABLE.COLUMN_STARTS.filter((x, i) => [5, 7].indexOf(i) > -1).map((x, i) =>
              <line
                  key={i}
                  x1={x}
                  x2={x}
                  y1={0}
                  y2={consts.TABLE.HEIGHT}
                  stroke="#ccc" />
            )
          }
        </g>
      </svg>
    )
  }
});

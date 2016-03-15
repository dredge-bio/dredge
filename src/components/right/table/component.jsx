"use strict";

var React = require('react')


function ColGroup({ COLUMN_WIDTHS }) {
  return (
    <colgroup>
      { COLUMN_WIDTHS.map((width, i) => <col key={i} width={width} />) }
    </colgroup>
  )
}

function dimensions(width, height) {
  var COLUMN_WIDTHS = [
    85,
    85,
    85,
    115,
    115,
    115,
    115,
  ]

  COLUMN_WIDTHS.unshift(width - COLUMN_WIDTHS.reduce((a, b) => a + b, 0) - 30);
  COLUMN_WIDTHS.unshift(30);

  var d = {
    COLUMN_WIDTHS,
    HEADER_HEIGHT: 48,
    NUM_VISIBLE_ROWS: 20,
  }

  d.COLUMN_STARTS = d.COLUMN_WIDTHS.map((w, i, cols) => cols.slice(0, i).reduce((a, b) => a + b, 0));

  d.BODY_HEIGHT = height - d.HEADER_HEIGHT;
  d.ROW_HEIGHT = d.BODY_HEIGHT / d.NUM_VISIBLE_ROWS;

  return d;
}

module.exports = React.createClass({
  displayName: 'GeneTable',

  propTypes: {
    // height: React.PropTypes.integer.isRequired
  },

  render() {
    var { width, height } = this.props
      , TableBody = require('./table_body.jsx')
      , TableHeader = require('./table_header.jsx')
      , d = dimensions(width, height)

    return (
      <div className="relative" style={{ background: 'white' }}>
        <div>
          <div style ={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: d.COLUMN_STARTS[5],
            width: 0,
            borderLeft: '1px solid #ccc'
          }} />
          <div style ={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: d.COLUMN_STARTS[7],
            width: 0,
            borderLeft: '1px solid #ccc'
          }} />
        </div>
        <TableHeader
            {...d}
            {...this.props} />
        <div style={{
          height: d.BODY_HEIGHT,
          maxHeight: d.BODY_HEIGHT,
          overflowY: 'scroll',
          overflowX: 'hidden',
        }}>
          <table style={{ tableLayout: 'fixed' }}>
            <ColGroup {...d} />
            <TableBody
                {...this.props} />
          </table>
        </div>
      </div>
    )
  }
});

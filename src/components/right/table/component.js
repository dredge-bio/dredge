"use strict"

const h = require('react-hyperscript')
    , React = require('react')
    , TableBody = require('./table_body')
    , TableHeader = require('./table_header')

function ColGroup({ COLUMN_WIDTHS }) {
  return h(
    'colgroup',
    null,
    COLUMN_WIDTHS.map((width, i) => h('col', { key: i, width }))
  )
}

function dimensions(width, height) {
  const COLUMN_WIDTHS = [70, 70, 70, 85, 85, 85, 85]

  COLUMN_WIDTHS.unshift(width - COLUMN_WIDTHS.reduce((a, b) => a + b, 0) - 28)
  COLUMN_WIDTHS.unshift(28)

  const d = {
    COLUMN_WIDTHS,
    HEADER_HEIGHT: 48,
    NUM_VISIBLE_ROWS: 20,
  }

  d.COLUMN_STARTS = d.COLUMN_WIDTHS.map((w, i, cols) => cols.slice(0, i).reduce((a, b) => a + b, 0))

  d.BODY_HEIGHT = height - d.HEADER_HEIGHT
  d.ROW_HEIGHT = d.BODY_HEIGHT / d.NUM_VISIBLE_ROWS

  return d
}

module.exports = React.createClass({
  displayName: 'GeneTable',

  propTypes: {
    // height: React.PropTypes.integer.isRequired
  },

  render() {
    const { width, height } = this.props,
        d = dimensions(width, height)

    return h(
      'div',
      { className: 'relative', style: {
          background: 'white',
          fontFamily: 'SourceSansPro',
          fontSize: '14px',
        } },
      h(
        'div',
        null,
        h('div', { style: {
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: d.COLUMN_STARTS[5] - 6,
            width: 0,
            borderLeft: '1px solid #ccc',
          } }),
        h('div', { style: {
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: d.COLUMN_STARTS[7] - 6,
            width: 0,
            borderLeft: '1px solid #ccc',
          } })
      ),
      h(TableHeader, Object.assign({}, d, this.props)),
      h(
        'div',
        { style: {
            height: d.BODY_HEIGHT,
            maxHeight: d.BODY_HEIGHT,
            overflowY: 'scroll',
            overflowX: 'hidden',
          } },
        h(
          'table',
          { style: { tableLayout: 'fixed' } },
          h(ColGroup, d),
          h(TableBody, this.props)
        )
      )
    )
  },
})

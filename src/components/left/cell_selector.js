"use strict"

const h = require('react-hyperscript')
    , React = require('react')
    , embryos = require('../../embryos.json')
    , formatCellName = require('../../utils/format_cell_name')
    , Embryo = require('../embryo')

function embryoName(i) {
  return `${Math.pow(2, i)}-cell`
}

module.exports = React.createClass({
  displayName: 'CellSelector',

  propTypes: {
    currentCell: React.PropTypes.string,
    onSelectCell: React.PropTypes.func.isRequired,
  },

  getInitialState() {
    return {
      hoveredCell: null,
      hoveredEmbryo: null,
    }
  },

  handleClick (cellName, e) {
    e.preventDefault()
    this.props.onSelectCell(cellName)
  },

  render () {
    const { currentCell, labelOrientation, width } = this.props
        , { hoveredCell, hoveredEmbryo } = this.state

    return (
      h('div.flex', {
        style: { height: '100%', width }
      }, embryos.map((embryoData, i) => h(
          'div',
          {
            key: i,
            className: 'border-box flex-none flex flex-column flex-center flex-auto px1 py1 relative',
            style: { width: width / 5 } },
          h(
            'button',
            {
              className: 'border-box center col-12 flex-none btn btn-outline btn-small bg-white',
              style: {
                backgroundColor: currentCell === embryoName(i) && '#b9d0e7',
                width: '95%',
                marginBottom: '6px',
                overflowX: 'hidden',
                overflowY: 'normal',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              },
              onClick: this.handleClick.bind(null, embryoName(i)) },
            embryoName(i),
            ' embryo'
          ),
          h(Embryo, Object.assign({
            embryoData,
          }, this.props, {
            extraCellAtrs: cellName => ({
              style: { cursor: 'pointer' },
              role: 'button',
              ['aria-label']: cellName,
              onMouseEnter: () => this.setState({ hoveredCell: cellName, hoveredEmbryo: i }),
              onMouseLeave: () => this.setState({ hoveredCell: null, hoveredEmbryo: null }),
            }),
          })),
          labelOrientation && hoveredCell && hoveredEmbryo === i && h(
            'span',
            { className: 'absolute border bold bg-white center border-box', style: {
                right: 0,
                left: 0,
                top: labelOrientation === 'top' ? -28 : 'auto',
                height: 32,
                lineHeight: '32px',
              } },
            formatCellName(hoveredCell)
          )
        ))
      )
    )
  },
})

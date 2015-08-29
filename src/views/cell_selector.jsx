"use strict";

var React = require('react')

function copy(data) {
  return JSON.parse(JSON.stringify(data))
}

module.exports = React.createClass({
  displayName: 'CellSelector',

  propTypes: {
    currentCell: React.PropTypes.string,
    onSelectCell: React.PropTypes.func.isRequired
  },

  handleClick: function (cellName, e) {
    e.preventDefault();
    this.props.onSelectCell(cellName);
  },

  renderEmbryo: function (embryo, i) {
    var shapes
      , style

    shapes = embryo.cells.map(cell => {
      var attrs = copy(cell.attrs);
      attrs.key = cell.cell_name;

      attrs.fill = cell.cell_name === this.props.currentCell ? '#ccc' : 'transparent';

      attrs.onClick = this.handleClick.bind(null, cell.cell_name);

      return React.createElement(cell.type, attrs);
    }, this);

    style = {
      stroke: 'black',
      display: 'inline-block',
      height: '100px',
      margin: '0 1em'
    }

    return (
      <svg key={i} style={style} {...embryo.svg_attrs}>
        <g {...embryo.g1_attrs}>
          <g {...embryo.g2_attrs}>
            { shapes }
          </g>
        </g>
      </svg>
    )
  },

  render: function () {
    var embryos = require('../embryos.json')

    return <section>{ embryos.map(this.renderEmbryo) }</section>
  }
});

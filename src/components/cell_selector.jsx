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
    var stage = Math.pow(2, i)
      , stageName = `${stage}-cell`
      , { currentCell } = this.props
      , cellSelected = currentCell === stageName
      , shapes
      , style

    shapes = embryo.cells.map(cell => {
      var attrs = copy(cell.attrs);
      attrs.key = cell.cell_name;

      attrs.fill = cell.cell_name === currentCell ? '#ccc' : 'white';

      attrs.onClick = this.handleClick.bind(null, cell.cell_name);

      return React.createElement(cell.type, attrs);
    }, this);

    style = {
      stroke: 'black',
      display: 'inline-block',
      height: '68px',
      margin: '0 1em'
    }

    return (
      <div key={i} style={{ display: 'inline-block', textAlign: 'center' }}>
        <a href=""
            style={{ backgroundColor: cellSelected && 'red' }}
            onClick={this.handleClick.bind(null, stageName)}>
          {stage}-cell embryo
        </a>

        <br />

        <svg style={style} {...embryo.svg_attrs}>
          <g {...embryo.g1_attrs}>
            <g {...embryo.g2_attrs}>
              { shapes }
            </g>
          </g>
        </svg>
      </div>
    )
  },

  render: function () {
    var embryos = require('../embryos.json')

    return <section>{ embryos.map(this.renderEmbryo) }</section>
  }
});

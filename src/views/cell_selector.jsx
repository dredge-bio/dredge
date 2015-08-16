"use strict";

var React = require('react')
  , cells = require('../cell_selector_coordinates.json')

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

  render: function () {
    var id = 'cellmap-' + Math.random().toString().slice(2)

    return (
      <section>
        <h2>{ this.props.currentCell || 'no cell selected' }</h2>
        <img src="data/cells.png" useMap={id} />
        <map name={id}>
          {
            cells.map(cell =>
              <area
                key={cell.name}
                shape="poly"
                href={'#' + cell.name}
                coords={cell.coords}
                onClick={this.handleClick.bind(null, cell.name)} />
            )
          }
        </map>
      </section>
    )
  }
});

/* eslint camelcase:0 */
"use strict";

var React = require('react')
  , Embryo

Embryo = ({
  embryoData: { svg_attrs, g1_attrs, g2_attrs, cells },
  extraCellAtrs,
  currentCell,
  onSelectCell
}) => (
  <svg
      className="Embryo"
      {...svg_attrs}>
    <g {...g1_attrs}>
      <g {...g2_attrs}>
        {
          cells.map(({ type, cell_name, attrs }) =>
            React.createElement(type, Object.assign({}, attrs, {
                key: cell_name,
                className: "CellShape",
                onClick: () => onSelectCell(cell_name),
                fill: cell_name === currentCell ? "#b9d0e7" : "#fff"
            }, extraCellAtrs ? extraCellAtrs(cell_name) : {}))
          )
        }
      </g>
    </g>
  </svg>
)

Embryo.propTypes = {
  embryoData: React.PropTypes.object.isRequired,
  currentCell: React.PropTypes.string,
  onSelectCell: React.PropTypes.func
}

module.exports = Embryo;

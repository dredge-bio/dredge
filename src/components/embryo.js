/* eslint camelcase:0 */
"use strict"

const h = require('react-hyperscript')
    , React = require('react')

function Embryo({
  embryoData: { svg_attrs, g1_attrs, g2_attrs, cells },
  extraCellAtrs,
  currentCell,
  onSelectCell,
}) {
  return (
    h("svg", Object.assign({ className: "Embryo" }, svg_attrs), [
      h("g", g1_attrs, [
        h("g", g2_attrs,
          cells.map(({ type, cell_name, attrs }) =>
            h(type, Object.assign({}, attrs, {
              key: cell_name,
              className: "CellShape",
              onClick: () => onSelectCell(cell_name),
              fill: cell_name === currentCell ? "#b9d0e7" : "#fff",
            }, extraCellAtrs ? extraCellAtrs(cell_name) : {}))
          )
        ),
      ]),
    ])
  )
}

Embryo.propTypes = {
  embryoData: React.PropTypes.object.isRequired,
  currentCell: React.PropTypes.string,
  onSelectCell: React.PropTypes.func,
}

module.exports = Embryo

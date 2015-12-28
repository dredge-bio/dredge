"use strict";

var cellNameMap = require('../cell_name_map.json')


function cellFile(cellName) {
  return cellNameMap[cellName] || cellName;
}


module.exports = function (cellA, cellB) {
  var cellFileA = cellFile(cellA)
    , cellFileB = cellFile(cellB)
    , dataFile = `data/geneExpression/${cellFileA}_${cellFileB}.txt`

  return fetch(dataFile)
}

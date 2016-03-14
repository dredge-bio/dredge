"use strict";

const SUBSCRIPTS = [
  '₀',
  '₁',
  '₂',
  '₃',
  '₄',
  '₅',
  '₆',
  '₇',
  '₈',
  '₉'
]

module.exports = function (cellName) {
  if (cellName[0] !== 'P') return cellName;
  return 'P' + SUBSCRIPTS[cellName[1]];
}

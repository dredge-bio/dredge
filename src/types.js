"use strict";

const Type = require('union-type')

function optionalString(x) {
  return typeof x === 'string' || x == undefined
}

exports.LoadingStatus = Type({
  Pending: {
    message: optionalString,
  },
  Failed: {
    message: optionalString,
  },
  Missing: {
    message: optionalString,
  },
  OK: {
    message: optionalString,
  },
})

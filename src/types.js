"use strict";

const Type = require('union-type')

function optionalString(x) {
  return typeof x === 'string' || x == undefined
}

exports.ProjectSource = Type({
  Local: {},
  Global: {},
})

Object.defineProperty(exports.ProjectSource.prototype, 'key', {
  get() {
    return exports.ProjectSource.case({
      Local: () => 'local',
      Global: () => 'global',
    }, this)
  }
})

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

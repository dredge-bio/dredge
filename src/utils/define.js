"use strict";

module.exports = function define(baseObj) {
  return (...args) => {
    return args
    .slice(0, args.length - 1)
    .reduce((obj, key, i, keys) => (
      obj.hasOwnProperty(key) ? obj : (
        Object.defineProperty(obj, key, {
          value: (i + 1 === keys.length) ? args[args.length - 1] : {},
          enumerable: true
        })
      )
    )[key], baseObj)
  }
}

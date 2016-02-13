"use strict";

var Immutable = require('immutable');

module.exports = () => fetch('data/20150813_alternateGeneNames.csv')
  .then(resp => resp.text())
  .then(csv => csv.trim().split('\n').map(row => row.trim().split(',')))
  .then(rows => Immutable.Map().withMutations(map => {
    rows.forEach(row => {
      var canonicalName = row[0]
      row.forEach(name => map.set(name, canonicalName));
    });
  }));

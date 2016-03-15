"use strict";

var Immutable = require('immutable')
  , whitelist = Immutable.Set(require('../gene_whitelist.json'))

module.exports = () => fetch('data/20160315_alternateGeneNames.csv')
  .then(resp => resp.text())
  .then(csv => csv.trim().split('\n').map(row => row.trim().split(',')))
  .then(rows => Immutable.Map().withMutations(map => {
    rows.forEach(row => {
      var canonicalName = row[0]

      if (whitelist.has(canonicalName)) {
        row.forEach(name => map.set(name, canonicalName));
      }
    });
  }));

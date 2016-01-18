"use strict";

var Immutable = require('immutable')

module.exports = function (text) {
  return Immutable.Map().withMutations(plotData => {
    text.split('\n').slice(1).map(row => row.split('\t'))
      .forEach(([geneName, logFC, logCPM, pValue]) => {
        if (!geneName) return;
        plotData.set(geneName, {
          geneName,
          logFC: parseFloat(logFC),
          logCPM: parseFloat(logCPM),
          pValue: parseFloat(pValue)
        })
      })
  });
}

"use strict";

var sortBy = require('lodash.sortby')

function getBins(scale, count) {
  var [min, max] = scale.domain()
    , step = (max - min) / count
    , bins

  bins = Array.apply(null, Array(count)).map((d, i) => {
    var start = min + (i * step)
      , stop = start + step

    return [start, stop];
  });

  bins[bins.length - 1][1] = max;

  return bins;
}

module.exports = function (data, xScale, yScale, units=100) {
  var fcSorted = sortBy(data, 'logFC')
    , fcBins = getBins(yScale, units)
    , cpmBins = getBins(xScale, units)
    , curFC = 0
    , bins = []


  fcBins.forEach(([fcBinStart, fcBinStop]) => {
    var check = fcSorted.slice(curFC)
      , inFCBin = []
      , curCPM = 0

    while (check.length) {
      let gene = check.shift()

      if (gene.logFC <= fcBinStop) {
        inFCBin.push(gene);
        curFC += 1;
      } else {
        break;
      }
    }

    inFCBin = sortBy(inFCBin, 'logCPM');

    cpmBins.forEach(([cpmBinStart, cpmBinStop]) => {
      var check = inFCBin.slice(curCPM)
        , inCPMBin = []

      while (check.length) {
        let gene = check.shift()

        if (gene.logCPM <= cpmBinStop) {
          inCPMBin.push(gene);
          curCPM += 1;
        } else {
          break;
        }
      }

      if (inCPMBin.length) {
        bins.push({
          fcMin: fcBinStart,
          fcMax: fcBinStop,
          cpmMin: cpmBinStart,
          cpmMax: cpmBinStop,
          genes: inCPMBin
        });
      }
    });
  });

  return bins;
}

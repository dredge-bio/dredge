"use strict";

var d3 = require('d3')
  , sortBy = require('lodash.sortby')

function getBins(scale, unit) {
  var [ min, max ] = d3.extent(scale.range())
    , reversed = scale.range()[0] !== min
    , numBins = Math.floor((max - min) / unit)
    , bins

  bins = Array.apply(null, Array(numBins)).map((_, i) => {
    var rMin = min + i * unit
      , rMax = rMin + unit

    if (reversed) [ rMin, rMax ] = [ rMax, rMin ];

    return [
      scale.invert(rMin),
      scale.invert(rMax),
      rMin,
      rMax,
    ]
  });

  bins = reversed ? bins.reverse() : bins;

  bins[0][0] = d3.min(scale.domain());
  bins[bins.length - 1][1] = d3.max(scale.domain());

  return bins;
}

function takeWhile(list, condition) {
  var ret = []

  for (var i = 0, l = list.length; i < l; i++) {
    if (!condition(list[i])) {
      break;
    } else {
      ret.push(list[i]);
    }
  }

  return ret;
}

module.exports = function (data, xScale, yScale, unit=5) {
  var fcSorted = sortBy(data, 'logFC')
    , fcBins = getBins(yScale, unit)
    , cpmBins = getBins(xScale, unit)
    , curFC = 0
    , bins = []

  fcBins.forEach(([ fcMin, fcMax, y0, y1 ]) => {
    var curCPM = 0
      , cpmSorted
      , inFCBin

    inFCBin = takeWhile(
      fcSorted.slice(curFC),
      ({ logFC }) => logFC >= fcMin && logFC <= fcMax);

    curFC += inFCBin.length;
    cpmSorted = sortBy(inFCBin, 'logCPM');

    cpmBins.forEach(([ cpmMin, cpmMax, x0, x1 ]) => {
      var inCPMBin

      inCPMBin = takeWhile(
        cpmSorted.slice(curCPM),
        ({ logCPM }) => logCPM >= cpmMin && logCPM <= cpmMax);

      curCPM += inCPMBin.length;

      if (inCPMBin.length) {
        bins.push({
          x0, x1, y0, y1,
          fcMin,
          fcMax,
          cpmMin,
          cpmMax,
          genes: inCPMBin
        })
      }
    });
  });

  if (data.length !== bins.reduce((a, b) => a + b.genes.length, 0)) {
    throw Error('Bins not of equal length');
  }

  return bins;
}

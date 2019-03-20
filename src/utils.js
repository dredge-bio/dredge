"use strict";

const R = require('ramda')
    , d3 = require('d3')

function findParent(selector, el) {
  let curEl = el

  do {
    if (curEl.matches(selector)) {
      break
    }
  } while ((curEl = curEl.parentNode))

  return curEl
}

function getBins(scale, unit) {
  const [ min, max ] = d3.extent(scale.range())
      , reversed = scale.range()[0] !== min
      , numBins = Math.floor((max - min) / unit)

  let bins

  bins = [...Array(numBins)].map((_, i) => {
    let rMin = min + i * unit
      , rMax = rMin + unit

    if (reversed) {
      [ rMin, rMax ] = [ rMax, rMin ]
    }

    return [
      scale.invert(rMin),
      scale.invert(rMax),
      Math.ceil(rMin),
      Math.ceil(rMax),
    ]
  });

  bins = reversed ? bins.reverse() : bins;

  bins[0][0] = d3.min(scale.domain());
  bins[bins.length - 1][1] = d3.max(scale.domain());

  return bins;
}

function getPlotBins(data, xScale, yScale, unit=5) {
  const fcSorted = R.sortBy(R.prop('logFC'), data)
    , fcBins = getBins(yScale, unit)
    , cpmBins = getBins(xScale, unit)
    , bins = []

  let curFC = 0

  fcBins.forEach(([ fcMin, fcMax, y0, y1 ]) => {
    let curCPM = 0

    const inFCBin = R.takeWhile(
      ({ logFC }) => logFC >= fcMin && logFC <= fcMax,
      fcSorted.slice(curFC)
    )

    curFC += inFCBin.length;
    const cpmSorted = R.sortBy(R.prop('logATA'), inFCBin);

    cpmBins.forEach(([ cpmMin, cpmMax, x0, x1 ]) => {
      const inCPMBin = R.takeWhile(
        ({ logATA }) => logATA >= cpmMin && logATA <= cpmMax,
        cpmSorted.slice(curCPM)
      )

      curCPM += inCPMBin.length;

      if (inCPMBin.length) {
        bins.push({
          x0, x1, y0, y1,
          fcMin,
          fcMax,
          cpmMin,
          cpmMax,
          transcripts: inCPMBin,
        })
      }
    });
  });

  const numTranscriptsBinned = bins.reduce((a, b) => a + b.transcripts.length, 0)

  if (data.length !== numTranscriptsBinned) {
    console.warn(`Warning: ${data.length} transcripts in sample but only ${numTranscriptsBinned} put in bins`)
  }

  return bins;
}

function projectForView(state) {
  return state.projects[state.view.source.key]
}

module.exports = {
  findParent,
  getPlotBins,
  projectForView,
}

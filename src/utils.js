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

function binByTranscript(data, field, bins) {
  const getter = R.prop(field)
      , sortedData = R.sortBy(getter, data)
      , binByTranscript = new Map()

  const leftOut = R.takeWhile(
    d => getter(d) < bins[0][0],
    sortedData.slice(0))

  if (leftOut.length) {
    console.warn(`Warning: ${leftOut.length} transcripts below the minimum ${field} limit`)
  }

  let idx = leftOut.length

  bins.forEach(([ min, max ], i) => {
    const inBin = transcript => {
      const val = getter(transcript)
      return val >= min && val <= max
    }
    const transcriptsInBin = R.takeWhile(inBin, sortedData.slice(idx))

    idx += transcriptsInBin.length;

    transcriptsInBin.forEach(t => {
      binByTranscript.set(t, i)
    })
  })

  const extra = data.length - (binByTranscript.size + leftOut.length)

  if (extra) {
    console.warn(`Warning: ${extra} transcripts above the maximum ${field} limit`)
  }

  return binByTranscript
}

function getPlotBins(data, xScale, yScale, unit=5) {
  const fcBins = getBins(yScale, unit)
      , ataBins = getBins(xScale, unit)

  const bins = fcBins.map(([ fcMin, fcMax, y0, y1 ]) =>
    ataBins.map(([ cpmMin, cpmMax, x0, x1 ]) => ({
      x0, x1, y0, y1,
      fcMin, fcMax,
      cpmMin, cpmMax,
      transcripts: [],
    })))

  const fcBinByTranscript = binByTranscript(data, 'logFC', fcBins)
      , ataBinByTranscript = binByTranscript(data, 'logATA', ataBins)

  data.forEach(d => {
    const fcBin = fcBinByTranscript.get(d)
        , ataBin = ataBinByTranscript.get(d)

    if (fcBin !== undefined && ataBin !== undefined) {
      bins[fcBin][ataBin].transcripts.push(d)
    }
  })

  return R.flatten(bins).filter(b => b.transcripts.length)
}

function projectForView(state) {
  return state.projects[state.view.source.key]
}

const TOO_MANY_ROWS = 8

function getDefaultGrid(treatments) {
  const numTreatments = treatments.length
      , numRows = Math.floor(numTreatments / (numTreatments / 5) - .00000000001) + 1
      , numPerRow = Math.ceil(numTreatments / numRows)

  return R.splitEvery(numPerRow, treatments)
}

function formatNumber(number, places=2) {
  if (number == null) {
    return '--'
  } else if (number === 0) {
    return '0'
  } else if (Math.abs(number) < Math.pow(10, -places)) {
    return number.toExponential(places - 2)
  } else if ((number.toString().split('.')[1] || '').length <= places) {
    return number.toString()
  } else {
    return number.toFixed(places)
  }
}

function readFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = e => {
      resolve(e.target.result)
    }

    reader.onerror = e => {
      reject(e)
    }

    reader.readAsText(file)
  })
}


module.exports = {
  formatNumber,
  findParent,
  getPlotBins,
  getDefaultGrid,
  projectForView,
  readFile,
}

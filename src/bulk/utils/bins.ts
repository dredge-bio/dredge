import * as R from 'ramda'
import * as d3 from 'd3'

import {
  BulkDifferentialExpression,
  BulkPairwiseComparison
} from '../types'


// FIXME: Generally, should rename `transcripts` to `difExs`, or something
// like that.

export interface Bin {
  x0: number;
  x1: number;
  y0: number;
  y1: number;
  fcMin: number;
  fcMax: number;
  cpmMin: number;
  cpmMax: number;
  transcripts: Array<BulkDifferentialExpression>;
}

type BinDimension = [
  number,
  number,
  number,
  number
]

// Given a scale and a unit, return a 2-dimensional array
function getBins(
  scale: d3.ScaleLinear<number, number>,
  unit: number

) {
  const [ min, max ] = d3.extent(scale.range())

  if (min === undefined || max === undefined) {
    throw new Error()
  }

  const reversed = scale.range()[0] !== min
      , numBins = Math.floor((max - min) / unit)

  let bins: Array<BinDimension>

  bins = [...Array(numBins)].map((_, i) => {
    let rMin = min + i * unit
      , rMax = rMin + unit

    if (reversed) {
      [ rMin, rMax ] = [ rMax, rMin ]
    }

    return [
      scale.invert(rMin),
      scale.invert(rMax),

      // Min and max coordinates
      Math.ceil(rMin),
      Math.ceil(rMax),
    ]
  });

  bins = reversed ? bins.reverse() : bins;

  const [ binMin, binMax ] = d3.extent(scale.domain())

  if (binMin === undefined || binMax === undefined) {
    throw new Error()
  }

  // Cap off bins
  bins[0]![0] = binMin;
  bins[bins.length - 1]![1] = binMax;

  return bins;
}

function binIndexByTranscript(
  sortedTranscripts: Array<BulkDifferentialExpression>,
  field: 'logFC' | 'logATA',
  bins: Array<BinDimension>
) {
  const binByTranscript: Map<BulkDifferentialExpression, number> = new Map()

  const leftOut = R.takeWhile(
    de => {
      const val = de[field]

      if (val === null) return false

      return val < bins[0]![0]!
    },
    sortedTranscripts.slice(0))

  let idx = leftOut.length

  bins.forEach(([ min, max ], i) => {
    const inBin = (transcript: BulkDifferentialExpression) => {
      const val = transcript[field]

      if (val === null) return false

      return val >= min && val <= max
    }

    const transcriptsInBin = R.takeWhile(inBin, sortedTranscripts.slice(idx))

    idx += transcriptsInBin.length;

    transcriptsInBin.forEach(t => {
      binByTranscript.set(t, i)
    })
  })

  return binByTranscript
}

export function getPlotBins(
  data: BulkPairwiseComparison,
  filter: (de: BulkDifferentialExpression) => boolean,
  xScale: d3.ScaleLinear<number, number>,
  yScale: d3.ScaleLinear<number, number>,
  unit=5
) {
  const fcBins = getBins(yScale, unit)
      , ataBins = getBins(xScale, unit)

  const bins: Bin[][] = fcBins.map(([ fcMin, fcMax, y0, y1 ]) =>
    ataBins.map(([ cpmMin, cpmMax, x0, x1 ]) => ({
      x0, x1, y0, y1,
      fcMin, fcMax,
      cpmMin, cpmMax,
      transcripts: [],
    })))

  const fcBinByTranscript = binIndexByTranscript(data.fcSorted.filter(filter), 'logFC', fcBins)
      , ataBinByTranscript = binIndexByTranscript(data.ataSorted.filter(filter), 'logATA', ataBins)

  data.forEach(d => {
    const fcBin = fcBinByTranscript.get(d)
        , ataBin = ataBinByTranscript.get(d)

    if (fcBin !== undefined && ataBin !== undefined) {
      bins[fcBin]![ataBin]!.transcripts.push(d)
    }
  })

  return R.flatten(bins)
}


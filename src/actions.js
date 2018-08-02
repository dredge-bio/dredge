"use strict";

const R = require('ramda')
    , { makeActionType } = require('org-async-typed-actions')

function isIterable(obj) {
  return Symbol.iterator in obj
}

module.exports = makeActionType({
  CheckCompatibility: {
    exec: checkCompatibility,
    request: {},
    response: {},
  },

  LoadDataset: {
    exec: loadDataset,
    request: {
      // id: String,
    },
    response: {},
  },

  SetPairwiseComparison: {
    exec: setPairwiseComparison,
    request: {
      // dataset: String,
      CellA: String,
      CellB: String,
    },
    response: {
      pairwiseData: Object, // Table?
    },
  },

  SetSavedGeneNames: {
    exec: R.always({}),
    request: {
      // dataset: String,
      geneNames: isIterable,
    },
    response: {
    },
  },

  SetBrushedGeneNames: {
    exec: R.always({}),
    request: {
      // dataset: String,
      geneNames: isIterable,
    },
    response: {
    },
  },
})

function checkCompatibility() {
  if (!window.indexedDB) {
    throw new Error('Browser does not support IndexedDB standard. Cannot run application.')
  }

  if (!window.Blob) {
    throw new Error('Browser does not support Blob standard. Cannot run application.')
  }

  return {}
}

function loadDataset() {
  return async (dispatch, getState, { db }) => {
    await _loadDataset();
    const { blob } = await db.datasets.get('cellGeneMeasuress')

    blob
  }
}

// Load the table produced by the edgeR function `exactTest`:
// <https://rdrr.io/bioc/edgeR/man/exactTest.html>
async function setPairwiseComparison(cellA, cellB) {
  const cellNameMap = require('./cell_name_map')

  cellA = cellNameMap[cellA] || cellA
  cellB = cellNameMap[cellB] || cellB

  const filename = `data/geneExpression/${cellA}_${cellB}.txt`

  const resp = await fetch(filename)
      , text = await resp.text()

  const pairwiseData = {}

  text
    .split('\n')
    .slice(1) // Skip header
    .forEach(row => {
      const [ geneName, logFC, logCPM, pValue ] = row.split('\t')

      pairwiseData[geneName] = {
        geneName,
        logFC: parseFloat(logFC),
        logCPM: parseFloat(logCPM),
        pValue: parseFloat(pValue),
      }
    })

  return { pairwiseData }
}

async function _loadDataset() {
  const [ avgRPKMs, medRPKMs ] = await (
    Promise.all([
      fetch('data/20160315_geneExpressionAvg.csv'),
      fetch('data/20160315_geneExpressionMed.csv'),
    ]).then(resp => resp.text())
      .then(data => data.map(set => set.trim().split('\n')))
  )

  const cellNames = avgRPKMs.slice(0, 1)[0].slice(1).split(',')
      , data = {}

  // Skip past the cell name
  avgRPKMs.splice(0, 1)
  medRPKMs.splice(0, 1)

  cellNames.forEach(name => {
    data[name] = {}
  })

  for (let i = 0; i < avgRPKMs.length; i++) {
    let geneAvgRPKMByCell = avgRPKMs[i].split(',')
      , geneMedRPKMByCell = medRPKMs[i].split(',')

    const geneName = geneAvgRPKMByCell.slice(0, 1)[0];

    // Skip past the gene name
    geneAvgRPKMByCell.splice(0, 1)
    geneMedRPKMByCell.splice(0, 1)

    // if (geneAvgRPKMByCell !== cellNames.length)

    geneAvgRPKMByCell = geneAvgRPKMByCell.map(parseFloat);
    geneMedRPKMByCell = geneMedRPKMByCell.map(parseFloat);

    for (let j = 0; j < cellNames.length; j++) {
      const cell = cellNames[j]
          , avg = geneAvgRPKMByCell[j]
          , med = geneMedRPKMByCell[j]

      data[cell][geneName] = { avg, med };
    }
  }
}

"use strict";

const R = require('ramda')
    , Type = require('union-type')
    , { makeTypedAction } = require('org-async-actions')

function isIterable(obj) {
  return Symbol.iterator in obj
}

const Action = module.exports = makeTypedAction({
  CheckCompatibility: {
    exec: checkCompatibility,
    request: {},
    response: {},
  },

  CheckAvailableDatasets: {
    exec: checkAvailableDatasets,
    request: {},
    response: {
      projects: Type.ListOf(String),
    },
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

async function checkAvailableDatasets() {
  return async dispatch => {
    const loadedProjects = {}

    const projectsResp = await fetch('project.json')

    if (!projectsResp.ok) {
      throw new Error("No project.json file available")
    }

    let projects

    try {
      projects = await projectsResp.json()
      if (!Array.isArray(projects)) throw new Error()
    } catch (e) {
      throw new Error("project.json file is malformed")
    }

    await Promise.all(projects.map(async projectName => {
      const report = []
          , log = message => report.push(`${projectName}: ${message}`)

      let samples
        , aliases = null
        , averages = null
        , medians = null

      const samplesResp = await fetch(`projects/${projectName}/samples.json`)

      if (!samplesResp.ok) {
        log(`Could not download \`samples.json\` file from ./projects/${projectName}/samples.json. Aborting.`)
        dispatch(Action.ReportDatasetLoad(report))
        return
      }

      try {
        samples = await samplesResp.json()
        log(`Loaded samples.`)
      } catch (e) {
        log(`./projects/${projectName}/samples.json is not a valid JSON file. Aborting.`)
        dispatch(Action.ReportDatasetLoad(report))
        return
      }

      // TODO: Validate all of samples, aliases, averages, medians

      log('Checking for additional project statistics...')

      await Promise.all([
        fetch(`projects/${projectName}/gene_aliases.json`).then(async resp => {
          try {
            if (!resp.ok) throw '';
            aliases = await resp.json()
            report.push('Loaded gene aliases')
          } catch (e) {
            report.push('No file foudn for gene aliases')
          }
        }),

        fetch(`projects/${projectName}/rpkm_averages.csv`).then(async resp => {
          try {
            if (!resp.ok) throw '';
            averages = await resp.text()
            report.push('Loaded gene RPKM averages')
          } catch (e) {
            report.push('No file found for gene RPKM averages')
          }
        }),

        fetch(`projects/${projectName}/rpkm_medians.csv`).then(async resp => {
          try {
            if (!resp.ok) throw '';
            medians = await resp.text()
            report.push('Loaded gene RPKM medians')
          } catch (e) {
            report.push('No file found for gene RPKM medians')
          }
        }),
      ])

      loadedProjects[projectName] = {
        key: projectName,
        samples,
        aliases,
        averages,
        medians,
      }

      dispatch(Action.ReportDatasetLoad(report))
      return
    }))

    return loadedProjects
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

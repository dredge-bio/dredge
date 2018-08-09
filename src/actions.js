"use strict";

const R = require('ramda')
    , { makeTypedAction } = require('org-async-actions')

function isIterable(obj) {
  return Symbol.iterator in obj
}

const Action = module.exports = makeTypedAction({
  Initialize: {
    exec: initialize,
    request: {},
    response: {},
  },

  Log: {
    exec: R.always({}),
    request: {
      message: val => [].concat(val).every(val => typeof val === 'string'),
    },
    response: {},
  },

  CheckCompatibility: {
    exec: checkCompatibility,
    request: {},
    response: {},
  },

  LoadAvailableProjects: {
    exec: loadAvailableProjects,
    request: {},
    response: {
      // projects: Type.ListOf(Object),
      projects: Object,
    },
  },

  ViewProject: {
    exec: R.always({}),
    request: {
      projectBaseURL: String,
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

function delay(time) {
  return new Promise(resolve => setTimeout(resolve, time))
}

function initialize() {
  return async dispatch => {
    dispatch(Action.Log('Checking browser compatibility...'))
    await dispatch(Action.CheckCompatibility)
    dispatch(Action.Log('Browser compatible.'))
    await delay(100)
    dispatch(Action.Log('Loading available projects...'))
    await dispatch(Action.LoadAvailableProjects)
    dispatch(Action.Log('Finished initialization. Starting application...'))
    await delay(420)

    return {}
  }
}

function checkCompatibility() {
  return () => {

    if (!window.indexedDB) {
      throw new Error('Browser does not support IndexedDB standard. Cannot run application.')
    }

    if (!window.Blob) {
      throw new Error('Browser does not support Blob standard. Cannot run application.')
    }

    return {}
  }
}

function loadAvailableProjects() {
  return async dispatch => {
    const loadedProjects = {}

    const projectsResp = await fetch('projects.json')

    if (!projectsResp.ok) {
      throw new Error("No project.json file available")
    }

    let projects

    try {
      projects = await projectsResp.json()
      if (!Array.isArray(projects)) throw new Error()
      dispatch(Action.Log(`Loading projects: ${projects.join(', ')}`))
    } catch (e) {
      throw new Error("projects.json file is malformed")
    }

    await Promise.all(projects.map(async projectBaseURL => {
      const log = message => dispatch(Action.Log(`${projectBaseURL}: ${message}`))
          , project = {}

      const samplesResp = await fetch(`${projectBaseURL}/samples.json`)

      if (!samplesResp.ok) {
        log(`Could not download \`samples.json\` file from ${projectBaseURL}/samples.json. Aborting.`)
        return
      }

      try {
        project.samples = await samplesResp.json()
        log(`Loaded samples`)
      } catch (e) {
        log(`${projectBaseURL}/samples.json is not a valid JSON file. Aborting.`)
        return
      }

      // TODO: Validate all of samples, aliases, averages, medians

      log('Checking for additional project statistics...')

      await fetch(`${projectBaseURL}/gene_whitelist.txt`).then(async resp => {
        if (!resp.ok) {
          log('No gene whitelist found')
          project.geneWhitelist = null
          return
        }

        const whitelist = await resp.text()
        project.geneWhitelist = new Set(whitelist.split('\n'))

        log('Loaded gene whitelist')
      })

      await fetch(`${projectBaseURL}/gene_aliases.csv`).then(async resp => {
        if (!resp.ok) {
          log('No gene aliases found')
          project.geneAliases = {}
          return
        }

        const aliases = await resp.text()

        try {
          project.geneAliases = R.pipe(
            R.split('\n'),
            R.map(R.pipe(
              R.split(','),
              arr => [arr[0], [arr.slice(1)]]
            )),
            R.fromPairs,
          )(aliases)

          log('Loaded gene aliases')

        } catch (e) {
          log('Gene alias file malformed')
          return
        }
      })

      await fetch(`${projectBaseURL}/rpkm_averages.csv`).then(async resp => {
        if (!resp.ok) {
          log('No RPKM mean measurements found')
          project.rpkmMeansByGene = {}
          return
        }

        const means = (await resp.text()).split('\n')

        try {
          const samples = means.shift().split(',').slice(1)

          project.rpkmMeansByGene = R.pipe(
            R.map(R.pipe(
              R.split(','),
              ([geneName, ...sampleMeans]) => [
                geneName,
                R.zipObj(samples, sampleMeans.map(parseFloat))
              ]
            )),
            R.fromPairs
          )(means)

          log('Loaded gene RPKM mean measurements')
        } catch (e) {
          log('Gene RPKM mean measurements file malformed')
        }
      })

      await fetch(`${projectBaseURL}/rpkm_averages.csv`).then(async resp => {
        if (!resp.ok) {
          log('No RPKM median measurements found')
          project.rpkmMediansByGene = {}
          return
        }

        const medians = (await resp.text()).split('\n')

        try {
          const samples = medians.shift().split(',').slice(1)

          project.rpkmMediansByGene = R.pipe(
            R.map(R.pipe(
              R.split(','),
              ([geneName, ...sampleMedians]) => [
                geneName,
                R.zipObj(samples, sampleMedians.map(parseFloat))
              ]
            )),
            R.fromPairs
          )(medians)

          log('Loaded gene RPKM median measurements')
        } catch (e) {
          log('Gene RPKM median measurements file malformed')
        }
      })

      log('Finished loading')

      project.baseURL = projectBaseURL
      loadedProjects[projectBaseURL] = project
    }))

    return { projects: loadedProjects }
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

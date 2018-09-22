"use strict";

const R = require('ramda')
    , d3 = require('d3')
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

  ChangeProject: {
    exec: changeProject,
    request: {
      projectBaseURL: String,
    },
    response: {},
  },

  SetPairwiseComparison: {
    exec: setPairwiseComparison,
    request: {
      TreatmentA: String,
      TreatmentB: String,
    },
    response: {
      pairwiseData: Object, // Table?
    },
  },

  SetSavedGenes: {
    exec: R.always({}),
    request: {
      genes: isIterable,
    },
    response: {
    },
  },

  SetBrushedGenes: {
    exec: R.always({}),
    request: {
      genes: isIterable,
    },
    response: {
    },
  },

  SetHoveredGene: {
    exec: R.always({}),
    request: {
      gene: R.T,
    },
    response: {
    },
  },

  SetFocusedGene: {
    exec: R.always({}),
    request: {
      gene: String,
    },
    response: {
    },
  },
})

function delay(time) {
  return new Promise(resolve => setTimeout(resolve, time))
}

function initialize() {
  return async (dispatch, getState) => {
    dispatch(Action.Log('Checking browser compatibility...'))
    await dispatch(Action.CheckCompatibility)
    dispatch(Action.Log('Browser compatible.'))
    dispatch(Action.Log('Loading available projects...'))
    await dispatch(Action.LoadAvailableProjects)
    dispatch(Action.Log('Finished initialization. Starting application...'))

    const projectKey = Object.keys(getState().projects)[0]

    dispatch(Action.ChangeProject(projectKey))

    return {}
  }
}

function changeProject(projectURL) {
  return async (dispatch, getState) => {
    await dispatch(Action.ViewProject(projectURL))

    const project = getState().projects[projectURL]
        , { treatments } = project
        , [ treatmentA, treatmentB ] = Object.keys(treatments).slice(3)

    dispatch(Action.SetPairwiseComparison(treatmentA, treatmentB))

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

    const projectsResp = await fetch('projects.json', {
      headers: new Headers({
        'Cache-Control': 'no-cache',
      }),
    })

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

      const treatmentsResp = await fetch(`${projectBaseURL}/treatments.json`)

      if (!treatmentsResp.ok) {
        log(`Could not download \`treatments.json\` file from ${projectBaseURL}/treatments.json. Aborting.`)
        return
      }

      try {
        project.treatments = await treatmentsResp.json()
        log(`Loaded treatments`)
      } catch (e) {
        log(`${projectBaseURL}/treatments.json is not a valid JSON file. Aborting.`)
        return
      }

      // TODO: Validate all of treatments, aliases, averages, medians

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

      await fetch(`${projectBaseURL}/treatment_rpkms.tsv`).then(async resp => {
        if (!resp.ok) {
          log('No RPKM mean measurements found')
          project.rpkmsForTreatmentGene = R.always(null)
          return
        }

        let rpkms = (await resp.text()).split('\n')

        try {
          const replicates = rpkms.shift().split('\t').slice(1)
              , genes = []

          rpkms = rpkms.map(row => {
            row = row.split('\t')
            genes.push(row.shift())
            return row.map(parseFloat)
          })

          const geneIndices = R.invertObj(genes)
              , replicateIndices = R.invertObj(replicates)

          project.rpkmsForTreatmentGene = (treatmentID, geneName) => {
            const treatment = project.treatments[treatmentID]
                , geneIdx = geneIndices[geneName]

            return treatment.replicates.map(replicateID => {
              const replicateIdx = replicateIndices[replicateID]
              return rpkms[geneIdx][replicateIdx]
            })
          }

          log('Loaded gene RPKM measurements')
        } catch (e) {
          log('Gene RPKM measurements file malformed')
        }
      })

      await fetch(`${projectBaseURL}/grid.csv`).then(async resp => {
        if (!resp.ok) {
          log('No grid configuration found')
          project.grid = null
          return
        }


        try {
          let grid = d3.csvParseRows(await resp.text())

          grid = grid.map(row => row.map(treatment => {
            if (!treatment) return null

            if (!project.treatments.hasOwnProperty(treatment)) {
              throw new Error(`Treatment ${treatment} not in project ${projectBaseURL}`)
            }

            return treatment
          }))

          project.grid = grid;

          log('Loaded grid configuration')
        } catch (e) {
          project.grid = null
          log('Grid configuration file malformed')
        }

      })

      log('Finished loading')

      project.baseURL = projectBaseURL
      project.pairwiseComparisonCache = {}
      loadedProjects[projectBaseURL] = project
    }))

    const sortedLoadedProjects = {}

    projects.forEach(project => {
      if (loadedProjects.hasOwnProperty(project)) {
        sortedLoadedProjects[project] = loadedProjects[project]
      }
    })

    return { projects: sortedLoadedProjects }
  }
}

// Load the table produced by the edgeR function `exactTest`:
// <https://rdrr.io/bioc/edgeR/man/exactTest.html>
function setPairwiseComparison(treatmentAKey, treatmentBKey) {
  return async (dispatch, getState) => {
    const { project } = getState().currentView

    const cached = project.pairwiseComparisonCache[[treatmentAKey, treatmentBKey]]

    if (cached) {
      await delay(0);

      return {
        pairwiseData: cached,
      }
    }

    const treatmentA = project.treatments[treatmentAKey]
        , treatmentB = project.treatments[treatmentBKey]

    if (!treatmentA) {
      throw new Error(`No such treatment: ${treatmentAKey}`)
    }

    if (!treatmentB) {
      throw new Error(`No such treatment: ${treatmentBKey}`)
    }

    const comparisonFileKey = [
      treatmentA.fileKey || treatmentAKey,
      treatmentB.fileKey || treatmentBKey,
    ]

    const fileURLA = `${project.baseURL}/pairwise_tests/${comparisonFileKey.join('_')}.txt`
        , fileURLB = `${project.baseURL}/pairwise_tests/${comparisonFileKey.reverse().join('_')}.txt`

    let reverse = false
      , resp

    const [ respA, respB ] = await Promise.all([
      fetch(fileURLA),
      fetch(fileURLB),
    ])

    if (respA.ok) {
      resp = respA
    } else if (respB.ok) {
      resp = respB
      reverse = true
    } else {
      throw new Error(`Could not download pairwise test from ${fileURLA} or ${fileURLB}`)
    }

    const text = await resp.text()

    const pairwiseData = text
      .trim()
      .split('\n')
      .slice(1) // Skip header
      .map(row => {
        const [ label, logFC, logCPM, pValue ] = row.split('\t')

        return {
          label,
          logFC: (reverse ? -1 : 1 ) * parseFloat(logFC),
          logCPM: parseFloat(logCPM),
          pValue: parseFloat(pValue),
        }
      })

    return { pairwiseData }
  }
}
